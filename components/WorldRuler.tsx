
import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { RoomSize } from '../types';
import { ROOM_SPECS } from '../constants';

interface WorldRulerProps {
  roomSize: RoomSize;
  visible: boolean;
}

export const WorldRuler: React.FC<WorldRulerProps> = ({ roomSize, visible }) => {
  if (!visible) return null;

  const config = useMemo(() => {
    let room = ROOM_SPECS[roomSize];
    
    let width = room.width;
    let depth = room.depth;

    if (roomSize === RoomSize.UNLIMITED) {
        width = 50; // 10 meters (50 units) for visibility
        depth = 50;
    }

    const widthMeters = (width * 0.2); 
    const depthMeters = (depth * 0.2);
    
    // DECISION A: Range starts at 0 and goes to max dimension
    const startX = 0;
    const endX = Math.ceil(widthMeters);
    const startZ = 0;
    const endZ = Math.ceil(depthMeters);

    return { 
        width, depth, 
        startX, endX, startZ, endZ 
    };
  }, [roomSize]);

  const { width, depth, startX, endX, startZ, endZ } = config;
  const OFFSET_DIST = 1.0; // Distance of ruler from grid edge

  // Helper to render a tick and label along X axis
  const renderTickX = (val: number, zPos: number, isBottom: boolean) => {
      const xPos = val * 5; // 1m = 5 units
      const labelOffset = isBottom ? 0.8 : -0.8;
      
      return (
        <group key={`x-${val}-${zPos}`}>
             <mesh position={[xPos, 0.02, zPos]} rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[0.08, 0.6]} />
                <meshBasicMaterial color="#000000" />
            </mesh>
            <Text 
                position={[xPos, 0.02, zPos + labelOffset]} 
                rotation={[-Math.PI/2, 0, 0]}
                fontSize={0.5}
                color="#000000"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
            >
                {val}m
            </Text>
        </group>
      );
  };

  // Helper to render a tick and label along Z axis
  const renderTickZ = (val: number, xPos: number, isRight: boolean) => {
      const zPos = val * 5;
      const labelOffset = isRight ? 0.8 : -0.8;

      return (
        <group key={`z-${val}-${xPos}`}>
             <mesh position={[xPos, 0.02, zPos]} rotation={[-Math.PI/2, 0, Math.PI/2]}>
                <planeGeometry args={[0.08, 0.6]} />
                <meshBasicMaterial color="#000000" />
            </mesh>
            <Text 
                position={[xPos + labelOffset, 0.02, zPos]} 
                rotation={[-Math.PI/2, 0, Math.PI/2]}
                fontSize={0.5}
                color="#000000"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
            >
                {val}m
            </Text>
        </group>
      );
  };

  const elements = [];

  // X Axis Ticks
  for (let i = startX; i <= endX; i++) {
      // Front
      elements.push(renderTickX(i, depth + OFFSET_DIST, true));
      // Back
      elements.push(renderTickX(i, -OFFSET_DIST, false));
  }

  // Z Axis Ticks
  for (let i = startZ; i <= endZ; i++) {
      // Left
      elements.push(renderTickZ(i, -OFFSET_DIST, false));
      // Right
      elements.push(renderTickZ(i, width + OFFSET_DIST, true));
  }
  
  // Boundary Lines (The framing box)
  // Front
  elements.push(<mesh key="line-front" position={[width/2, 0.01, depth + OFFSET_DIST]} rotation={[-Math.PI/2, 0, 0]}><planeGeometry args={[width + (OFFSET_DIST*2) + 2, 0.05]} /><meshBasicMaterial color="#000000" opacity={0.5} transparent /></mesh>);
  // Back
  elements.push(<mesh key="line-back" position={[width/2, 0.01, -OFFSET_DIST]} rotation={[-Math.PI/2, 0, 0]}><planeGeometry args={[width + (OFFSET_DIST*2) + 2, 0.05]} /><meshBasicMaterial color="#000000" opacity={0.5} transparent /></mesh>);
  // Left
  elements.push(<mesh key="line-left" position={[-OFFSET_DIST, 0.01, depth/2]} rotation={[-Math.PI/2, 0, 0]}><planeGeometry args={[0.05, depth + (OFFSET_DIST*2) + 2]} /><meshBasicMaterial color="#000000" opacity={0.5} transparent /></mesh>);
  // Right
  elements.push(<mesh key="line-right" position={[width + OFFSET_DIST, 0.01, depth/2]} rotation={[-Math.PI/2, 0, 0]}><planeGeometry args={[0.05, depth + (OFFSET_DIST*2) + 2]} /><meshBasicMaterial color="#000000" opacity={0.5} transparent /></mesh>);

  return <group>{elements}</group>;
};
