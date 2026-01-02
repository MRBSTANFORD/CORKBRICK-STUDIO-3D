
/**
 * 🔒 STABLE MODULE: Scene & Measure Tool
 * STATUS: ACCEPTED / FROZEN
 * VERSION: 1.0.4 - Resolved Read-only property position errors.
 */
import React, { useState, useMemo, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';
import { BrockMesh } from './BrockMeshes';
import { BrockType, PlacedBrock, Vector3, Rotation3, RoomSize, FloorMaterial } from '../types';
import { checkCollision, checkRoomBounds, getRotatedDimensions } from '../services/builder';
import { BROCK_SPECS, ROOM_SPECS, FLOOR_PROPS } from '../constants';
import { WorldRuler } from './WorldRuler';

interface SceneProps {
  blocks: PlacedBrock[];
  selectedType: BrockType;
  roomSize: RoomSize;
  floorMaterial: FloorMaterial;
  onPlaceBlock: (position: Vector3, rotation: Rotation3) => void;
  onSelectBlock: (id: string, isMulti: boolean) => void;
  selectedBlockIds: Set<string>;
  rotation: Rotation3;
  instructionMode: boolean;
  visibleBlockIds: Set<string>;
  mode: 'BUILD' | 'EDIT' | 'MEASURE';
  isMoving?: boolean;
  onMoveBlock?: (leaderPos: Vector3, leaderRot: Rotation3) => void;
  controlsRef?: React.MutableRefObject<any>;
  isPrecisionMode: boolean;
  isBoxSelecting?: boolean;
  showRuler: boolean;
}

export interface SceneHandle {
    getBlocksInRect: (rect: { x: number, y: number, w: number, h: number }, clientSize: { w: number, h: number }) => string[];
}

// --- MEASURE TOOL ---
const MeasureTool: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    const [startPos, setStartPos] = useState<Vector3 | null>(null);
    const [endPos, setEndPos] = useState<Vector3 | null>(null);
    const [cursorPos, setCursorPos] = useState<Vector3 | null>(null);
    const { camera, raycaster, pointer, scene } = useThree();

    useEffect(() => {
        if (!isActive) {
            setStartPos(null); setEndPos(null); setCursorPos(null);
        }
    }, [isActive]);

    useEffect(() => {
        if (!isActive) return;

        const handlePointerMove = () => {
             raycaster.setFromCamera(pointer, camera);
             const targetObjects = scene.children.filter(obj => obj.name !== 'measure-marker');
             const intersects = raycaster.intersectObjects(targetObjects, true);
             
             if (intersects.length > 0) {
                 const pt = intersects[0].point;
                 setCursorPos({
                     x: Number((Math.round(pt.x * 10) / 10).toFixed(3)),
                     y: Number((Math.round(pt.y * 10) / 10).toFixed(3)),
                     z: Number((Math.round(pt.z * 10) / 10).toFixed(3))
                 });
             }
        };

        const handlePointerDown = (e: PointerEvent) => {
            if (e.button !== 0 || !cursorPos) return; 
            e.stopPropagation(); 
            const clickedPt = { x: cursorPos.x, y: cursorPos.y, z: cursorPos.z };
            if (!startPos) setStartPos(clickedPt);
            else if (!endPos) setEndPos(clickedPt); 
            else { setStartPos(clickedPt); setEndPos(null); }
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerdown', handlePointerDown);
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerdown', handlePointerDown);
        };
    }, [isActive, camera, pointer, raycaster, scene, startPos, endPos, cursorPos]);

    if (!isActive) return null;
    const UNIT = 0.2; 

    const renderLine = (start: Vector3, end: Vector3, isPreview: boolean) => {
        if (!start || !end) return null;
        const vStart = new THREE.Vector3(start.x, start.y, start.z);
        const vEnd = new THREE.Vector3(end.x, end.y, end.z);
        const distUnits = vStart.distanceTo(vEnd);
        const distMeters = distUnits * UNIT;
        const mid = vStart.clone().lerp(vEnd, 0.5);

        return (
            <group name="measure-marker">
                <line raycast={() => null}>
                    <bufferGeometry>
                         <bufferAttribute 
                            attach="attributes-position" 
                            count={2} 
                            array={new Float32Array([start.x, start.y, start.z, end.x, end.y, end.z])} 
                            itemSize={3} 
                        />
                    </bufferGeometry>
                    <lineBasicMaterial color={isPreview ? "#3b82f6" : "#ef4444"} />
                </line>
                <mesh position={[start.x, start.y, start.z]} raycast={() => null}><sphereGeometry args={[0.06]} /><meshBasicMaterial color="#10b981" /></mesh>
                <mesh position={[end.x, end.y, end.z]} raycast={() => null}><sphereGeometry args={[0.06]} /><meshBasicMaterial color={isPreview ? "#3b82f6" : "#ef4444"} /></mesh>
                <Html position={[mid.x, mid.y, mid.z]}>
                    <div className="bg-black/70 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm pointer-events-none transform -translate-x-1/2 -translate-y-full font-mono border border-white/20">
                        {distMeters.toFixed(3)}m
                    </div>
                </Html>
            </group>
        );
    };

    return (
        <group>
            {cursorPos && !endPos && (
                <mesh position={[cursorPos.x, cursorPos.y, cursorPos.z]} raycast={() => null}>
                    <sphereGeometry args={[0.04]} /><meshBasicMaterial color="rgba(255,255,255,0.5)" transparent />
                </mesh>
            )}
            {startPos && cursorPos && !endPos && renderLine(startPos, cursorPos, true)}
            {startPos && endPos && renderLine(startPos, endPos, false)}
        </group>
    )
}

const RoomContext: React.FC<{ roomSize: RoomSize, floorMaterial: FloorMaterial, showRuler: boolean }> = ({ roomSize, floorMaterial, showRuler }) => {
    const room = ROOM_SPECS[roomSize];
    const floor = FLOOR_PROPS[floorMaterial];
    if (!room || !floor) return null;
    const width = room.width || 10;
    const depth = room.depth || 10;
    const height = 15; 

    // DECISION A: Origin (0,0) is a corner. 
    // Mesh is created at width/2, depth/2 to span from 0 to width.
    const meshX = width / 2;
    const meshZ = depth / 2;

    return (
        <group>
            <WorldRuler roomSize={roomSize} visible={showRuler} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[meshX, -0.05, meshZ]} receiveShadow>
                <planeGeometry args={[width, depth]} /><meshStandardMaterial color={floor.color} roughness={floor.roughness} side={THREE.DoubleSide}/>
            </mesh>
            {(room.walls || []).includes('back') && (
                <mesh position={[meshX, height/2, 0]} receiveShadow>
                    <planeGeometry args={[width, height]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.15} side={THREE.DoubleSide} />
                </mesh>
            )}
             {(room.walls || []).includes('left') && (
                <mesh position={[0, height/2, meshZ]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                    <planeGeometry args={[depth, height]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.15} side={THREE.DoubleSide} />
                </mesh>
            )}
            <Grid 
                position={[meshX, -0.01, meshZ]} 
                args={[width, depth]} cellColor="#000000" sectionColor="#000000" cellThickness={0.5} sectionThickness={1} fadeDistance={30} infiniteGrid={roomSize === RoomSize.UNLIMITED} followCamera={roomSize === RoomSize.UNLIMITED}
            />
        </group>
    );
};

const calculateSnap = (rayPoint: THREE.Vector3, faceNormal: THREE.Vector3, targetBlock: PlacedBrock, activeType: BrockType, activeRotation: Rotation3, isPrecisionMode: boolean): Vector3 | null => {
    const targetSpec = BROCK_SPECS[targetBlock.type];
    const activeSpec = BROCK_SPECS[activeType];
    if (!targetSpec || !activeSpec) return null;
    const isTargetConnector = targetSpec.isConnector || targetBlock.type === BrockType.TERMINAL;
    const isPlacingConnector = activeSpec.isConnector || activeType === BrockType.TERMINAL;
    const isTopFace = faceNormal.y > 0.9;
    if (isPrecisionMode) {
        const snap = 10;
        const dims = getRotatedDimensions(activeType, activeRotation);
        const px = rayPoint.x + faceNormal.x * (dims.x / 2);
        const py = rayPoint.y + faceNormal.y * (dims.y / 2);
        const pz = rayPoint.z + faceNormal.z * (dims.z / 2);
        if (isTopFace) {
             const targetDims = getRotatedDimensions(targetBlock.type, targetBlock.rotation);
             return { x: Math.round(rayPoint.x * snap) / snap, y: targetBlock.position.y + targetDims.y/2 + dims.y/2, z: Math.round(rayPoint.z * snap) / snap };
        }
        return { x: Math.round(px * snap) / snap, y: Math.round(py * snap) / snap, z: Math.round(pz * snap) / snap };
    }
    if (isTopFace) {
        const isInterlock = (isTargetConnector !== isPlacingConnector);
        const targetDims = getRotatedDimensions(targetBlock.type, targetBlock.rotation);
        const activeDims = getRotatedDimensions(activeType, activeRotation);
        let newY = targetBlock.position.y + targetDims.y / 2 + activeDims.y / 2;
        if (isInterlock) newY -= 0.5;
        const localX = rayPoint.x - targetBlock.position.x;
        const localZ = rayPoint.z - targetBlock.position.z;
        const EDGE_THRESHOLD = 0.20;
        let offX = 0, offZ = 0;
        if (Math.abs(localX) > EDGE_THRESHOLD) offX = Math.sign(localX) * 0.5;
        if (Math.abs(localZ) > EDGE_THRESHOLD) offZ = Math.sign(localZ) * 0.5;
        return { x: targetBlock.position.x + offX, y: newY, z: targetBlock.position.z + offZ };
    }
    if (Math.abs(faceNormal.y) < 0.1) return { x: targetBlock.position.x + Math.round(faceNormal.x), y: targetBlock.position.y, z: targetBlock.position.z + Math.round(faceNormal.z) };
    return null;
};

const BlockCollider: React.FC<{ block: PlacedBrock; activeType: BrockType; rotation: Rotation3; onHover: (pos: Vector3 | null) => void; onPlace: () => void; onSelect: (multi: boolean) => void; isActive: boolean; mode: 'BUILD' | 'EDIT' | 'MEASURE'; isMoving: boolean; isSelected: boolean; isPrecisionMode: boolean; }> = ({ block, activeType, rotation, onHover, onPlace, onSelect, isActive, mode, isMoving, isSelected, isPrecisionMode }) => {
    const dims = getRotatedDimensions(block.type, block.rotation);
    return (
        <mesh
            position={[block.position.x, block.position.y, block.position.z]}
            onClick={(e) => { e.stopPropagation(); if (mode === 'EDIT' && !isMoving) onSelect(e.shiftKey || e.ctrlKey); else if (isActive) onPlace(); }}
            onPointerMove={(e) => { if (!isActive) return; e.stopPropagation(); if (isMoving && isSelected) return; const snapPos = calculateSnap(e.point, e.face?.normal || new THREE.Vector3(0,1,0), block, activeType, rotation, isPrecisionMode); onHover(snapPos); }}
        >
            <boxGeometry args={[dims.x, dims.y, dims.z]} /><meshBasicMaterial transparent opacity={0} />
        </mesh>
    )
}

const SceneContent = forwardRef<SceneHandle, SceneProps & { setGhostPos: (v: Vector3 | null) => void; setIsValidPlacement: (v: boolean) => void; ghostPos: Vector3 | null; isValidPlacement: boolean; movingGroup: any[]; activeType: BrockType; isActive: boolean; }>(({ blocks, selectedType, roomSize, floorMaterial, onPlaceBlock, onSelectBlock, selectedBlockIds, rotation, instructionMode, visibleBlockIds, mode, isMoving, onMoveBlock, controlsRef, isPrecisionMode, isBoxSelecting, setGhostPos, setIsValidPlacement, ghostPos, isValidPlacement, movingGroup, activeType, isActive, showRuler }, ref) => {
    const { camera } = useThree();
    useImperativeHandle(ref, () => ({
        getBlocksInRect: (rect, clientSize) => {
            const selected: string[] = [];
            if (!camera || !blocks) return selected;
            blocks.forEach(b => {
                if (instructionMode && visibleBlockIds && !visibleBlockIds.has(b.id)) return;
                const v = new THREE.Vector3(b.position.x, b.position.y, b.position.z).project(camera);
                const px = ((v.x + 1) / 2) * clientSize.w;
                const py = (1 - (v.y + 1) / 2) * clientSize.h;
                if (px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h) selected.push(b.id);
            });
            return selected;
        }
    }));

    const handleHover = (pos: Vector3 | null) => {
      if (!pos) { setGhostPos(null); return; }
      setGhostPos({ x: pos.x, y: pos.y, z: pos.z });
      const inBounds = checkRoomBounds(pos, activeType, rotation, roomSize);
      if (!inBounds) { setIsValidPlacement(false); return; }
      if (isMoving && movingGroup && movingGroup.length > 0) {
          let groupValid = true;
          for (const member of movingGroup) {
              const memberPos = { x: pos.x + member.offsetX, y: pos.y + member.offsetY, z: pos.z + member.offsetZ };
              if (!checkRoomBounds(memberPos, member.type, member.rotation, roomSize) || checkCollision(memberPos, (blocks || []), member.type, member.rotation, (selectedBlockIds || new Set()))) { groupValid = false; break; }
          }
          setIsValidPlacement(groupValid);
      } else setIsValidPlacement(!checkCollision(pos, (blocks || []), activeType, rotation));
  };

  const handlePlace = () => {
      if (ghostPos && isValidPlacement) {
          if (mode === 'BUILD') onPlaceBlock({ x: ghostPos.x, y: ghostPos.y, z: ghostPos.z }, { ...rotation });
          else if (mode === 'EDIT' && isMoving && onMoveBlock) onMoveBlock({ x: ghostPos.x, y: ghostPos.y, z: ghostPos.z }, { ...rotation });
      }
  };

  return (
    <>
      <color attach="background" args={['#f3f4f6']} /><Environment preset="city" blur={0.8} /><ambientLight intensity={0.6} /><directionalLight position={[10, 20, 10]} intensity={1.0} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0001} />
      <group>
        <RoomContext roomSize={roomSize} floorMaterial={floorMaterial} showRuler={showRuler} />
        {(blocks || []).map((block) => {
            const isVisible = !instructionMode || (visibleBlockIds && visibleBlockIds.has(block.id));
            const isSelected = selectedBlockIds && selectedBlockIds.has(block.id);
            if (isMoving && isSelected || !isVisible) return null;
            return (
                <React.Fragment key={block.id}>
                    <BrockMesh type={block.type} position={[block.position.x, block.position.y, block.position.z]} rotation={block.rotation} opacity={1} isSelected={isSelected} />
                    <BlockCollider block={block} activeType={activeType} rotation={rotation} onHover={handleHover} onPlace={handlePlace} onSelect={(multi) => onSelectBlock(block.id, multi)} isActive={isActive} mode={mode} isMoving={!!isMoving} isSelected={isSelected} isPrecisionMode={isPrecisionMode} />
                </React.Fragment>
            );
        })}
        {isActive && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROOM_SPECS[roomSize].width/2, -0.01, ROOM_SPECS[roomSize].depth/2]} onPointerMove={(e) => { e.stopPropagation(); const snap = isPrecisionMode ? 10 : 2; const dims = getRotatedDimensions(activeType, rotation); handleHover({ x: Math.round(e.point.x * snap) / snap, y: dims.y / 2, z: Math.round(e.point.z * snap) / snap }); }} onPointerOut={() => handleHover(null)} onClick={(e) => { e.stopPropagation(); handlePlace(); }}>
                <planeGeometry args={[200, 200]} /><meshBasicMaterial visible={false} />
            </mesh>
        )}
        {isActive && ghostPos && (
             isMoving && movingGroup && movingGroup.length > 0 ? movingGroup.map(member => (
                <BrockMesh key={`ghost-${member.id}`} type={member.type} position={[ghostPos.x + member.offsetX, ghostPos.y + member.offsetY, ghostPos.z + member.offsetZ]} rotation={member.rotation} isGhost opacity={isValidPlacement ? 0.8 : 0.2} isSelected={!isValidPlacement} />
             )) : <BrockMesh type={activeType} position={[ghostPos.x, ghostPos.y, ghostPos.z]} rotation={rotation} isGhost opacity={isValidPlacement ? 0.8 : 0.2} isSelected={!isValidPlacement} />
        )}
        <MeasureTool isActive={mode === 'MEASURE'} />
        <ContactShadows position={[ROOM_SPECS[roomSize].width/2, -0.02, ROOM_SPECS[roomSize].depth/2]} opacity={0.4} scale={50} blur={2} far={4} />
      </group>
      {/* 🔒 CAMERA TILT LOCK: maxPolarAngle set to PI/2 prevents seeing underneath floor */}
      <OrbitControls ref={controlsRef} makeDefault dampingFactor={0.1} enabled={!isBoxSelecting} maxPolarAngle={Math.PI / 2} />
    </>
  );
});

export const Scene = forwardRef<SceneHandle, SceneProps>((props, ref) => {
  const [ghostPos, setGhostPos] = useState<Vector3 | null>(null);
  const [isValidPlacement, setIsValidPlacement] = useState(true);
  const { movingGroup, leaderBlock } = useMemo(() => {
    if (!props.isMoving || !props.selectedBlockIds || props.selectedBlockIds.size === 0) return { movingGroup: [], leaderBlock: undefined };
    const leaderId = Array.from(props.selectedBlockIds)[0];
    const leader = (props.blocks || []).find(b => b.id === leaderId);
    if (!leader) return { movingGroup: [], leaderBlock: undefined };
    return { leaderBlock: leader, movingGroup: (props.blocks || []).filter(b => props.selectedBlockIds.has(b.id)).map(b => ({ id: b.id, type: b.type, rotation: { ...b.rotation }, offsetX: b.position.x - leader.position.x, offsetY: b.position.y - leader.position.y, offsetZ: b.position.z - leader.position.z })) };
  }, [props.isMoving, props.selectedBlockIds, props.blocks]);
  return (
    <Canvas shadows gl={{ preserveDrawingBuffer: true }} camera={{ position: [8, 8, 8], fov: 45 }} style={{ width: '100%', height: '100%' }} dpr={[1, 2]}>
      <SceneContent ref={ref} {...props} ghostPos={ghostPos} setGhostPos={setGhostPos} isValidPlacement={isValidPlacement} setIsValidPlacement={setIsValidPlacement} movingGroup={movingGroup} leaderBlock={leaderBlock} activeType={(props.isMoving && leaderBlock) ? leaderBlock.type : props.selectedType} isActive={!props.instructionMode && (props.mode === 'BUILD' || (props.mode === 'EDIT' && !!props.isMoving))} />
    </Canvas>
  );
});
