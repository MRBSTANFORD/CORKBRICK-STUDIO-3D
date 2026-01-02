
/**
 * 🔒 STABLE MODULE: Builder Physics Engine
 * STATUS: ACCEPTED / FROZEN
 * VERSION: 1.0.4 - Full collision audit and defensive guard implementation.
 */
import { PlacedBrock, BrockType, Rotation3, Vector3, RoomSize } from '../types';
import { BROCK_SPECS, APP_CONFIG, ROOM_SPECS } from '../constants';
import { getComponentBoxes, Box3 } from './geometry';
import * as THREE from 'three';

// Helper: Calculate dimensions in World Space based on rotation
export const getRotatedDimensions = (type: BrockType, rotation: Rotation3): Vector3 => {
  const spec = BROCK_SPECS[type];
  if (!spec) return { x: 1, y: 1, z: 1 };
  
  let { x, y, z } = spec.dimensions;
  
  const rotX = Math.abs(rotation?.x || 0);
  const rotY = Math.abs(rotation?.y || 0);
  const rotZ = Math.abs(rotation?.z || 0);

  if (rotX % 2 === 1) { const temp = y; y = z; z = temp; }
  if (rotY % 2 === 1) { const temp = x; x = z; z = temp; }
  if (rotZ % 2 === 1) { const temp = x; x = y; y = temp; }
  
  return { x, y, z };
};

// Transform a local box to world AABB for collision checking
const transformBoxToWorld = (box: Box3, blockPos: Vector3, blockRot: Rotation3): { min: Vector3, max: Vector3 } => {
    const rx = (blockRot?.x || 0) * Math.PI / 2;
    const ry = (blockRot?.y || 0) * Math.PI / 2;
    const rz = (blockRot?.z || 0) * Math.PI / 2;
    const euler = new THREE.Euler(rx, ry, rz, 'XYZ');
    const pos = new THREE.Vector3(blockPos.x, blockPos.y, blockPos.z);
    
    const center = new THREE.Vector3(box.pos.x, box.pos.y, box.pos.z);
    center.applyEuler(euler);
    center.add(pos);

    const size = new THREE.Vector3(box.size.x, box.size.y, box.size.z);
    const halfSize = size.clone().multiplyScalar(0.5);
    
    const corners = [
        new THREE.Vector3(halfSize.x, halfSize.y, halfSize.z),
        new THREE.Vector3(-halfSize.x, halfSize.y, halfSize.z),
        new THREE.Vector3(halfSize.x, -halfSize.y, halfSize.z),
        new THREE.Vector3(halfSize.x, halfSize.y, -halfSize.z),
        new THREE.Vector3(-halfSize.x, -halfSize.y, halfSize.z),
        new THREE.Vector3(halfSize.x, -halfSize.y, -halfSize.z),
        new THREE.Vector3(-halfSize.x, halfSize.y, -halfSize.z),
        new THREE.Vector3(-halfSize.x, -halfSize.y, -halfSize.z),
    ];

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    corners.forEach(c => {
        c.applyEuler(euler);
        c.add(center);
        minX = Math.min(minX, c.x); minY = Math.min(minY, c.y); minZ = Math.min(minZ, c.z);
        maxX = Math.max(maxX, c.x); maxY = Math.max(maxY, c.y); maxZ = Math.max(maxZ, c.z);
    });

    return { min: { x: minX, y: minY, z: minZ }, max: { x: maxX, y: maxY, z: maxZ } };
};

const checkBoxOverlap = (b1: { min: Vector3, max: Vector3 }, b2: { min: Vector3, max: Vector3 }): boolean => {
    const EPS = 0.001; 
    return (
        b1.min.x < b2.max.x - EPS && b1.max.x > b2.min.x + EPS &&
        b1.min.y < b2.max.y - EPS && b1.max.y > b2.min.y + EPS &&
        b1.min.z < b2.max.z - EPS && b1.max.z > b2.min.z + EPS
    );
}

export const checkRoomBounds = (position: Vector3, type: BrockType, rotation: Rotation3, roomSize: RoomSize): boolean => {
    if (roomSize === RoomSize.UNLIMITED) return true;
    const room = ROOM_SPECS[roomSize];
    if (!room) return true;
    
    const dims = getRotatedDimensions(type, rotation);
    const width = room.width;
    const depth = room.depth;
    
    // DECISION A: Bounds are strictly positive [0, width] and [0, depth]
    const bMinX = position.x - dims.x / 2;
    const bMaxX = position.x + dims.x / 2;
    const bMinZ = position.z - dims.z / 2;
    const bMaxZ = position.z + dims.z / 2;

    const EPS = 0.01;
    if (bMinX < 0 - EPS || bMaxX > width + EPS) return false;
    if (bMinZ < 0 - EPS || bMaxZ > depth + EPS) return false;
    return true;
};

export const checkCollision = (
    position: Vector3, 
    existingBlocks: PlacedBrock[], 
    currentType: BrockType = BrockType.BASE, 
    currentRotation: Rotation3 = {x:0,y:0,z:0},
    ignoreIds: Set<string> = new Set()
): boolean => {
  if (!position) return true;
  const dim1 = getRotatedDimensions(currentType, currentRotation);
  const EPS = 0.05;

  if (position.y - dim1.y / 2 < -EPS) return true; 

  const newBoxes = getComponentBoxes(currentType, true);

  return (existingBlocks || []).some(block => {
    if (!block || !block.position || ignoreIds.has(block.id)) return false; 

    const distSq = (block.position.x - position.x)**2 + (block.position.y - position.y)**2 + (block.position.z - position.z)**2;
    if (distSq > 9) return false;

    const existingBoxes = getComponentBoxes(block.type, true);

    for (const nb of newBoxes) {
        const worldNB = transformBoxToWorld(nb, position, currentRotation);
        for (const eb of existingBoxes) {
            const worldEB = transformBoxToWorld(eb, block.position, block.rotation);
            if (checkBoxOverlap(worldNB, worldEB)) return true;
        }
    }
    return false;
  });
};

export const calculateStats = (blocks: PlacedBrock[]) => {
  let totalCost = 0;
  let totalWeight = 0;
  let totalSDG = 0;
  const counts: Record<string, number> = {};
  
  if (!blocks || !Array.isArray(blocks)) {
      return { totalCost: 0, totalWeight: 0, totalSDG: 0, counts: {} };
  }

  blocks.forEach(block => {
    if (!block) return;
    const spec = BROCK_SPECS[block.type];
    if (!spec) return;
    
    totalCost += spec.cost || 0;
    totalWeight += spec.weight || 0;
    
    const sdgImpacts = APP_CONFIG.sdgImpacts || {};
    totalSDG += sdgImpacts[block.type] || 0;
    
    counts[spec.name] = (counts[spec.name] || 0) + 1;
  });
  
  return { totalCost, totalWeight, totalSDG, counts };
};

export const calculateSelectionBounds = (blocks: PlacedBrock[], selectedIds: Set<string>) => {
    if (!selectedIds || selectedIds.size === 0 || !blocks || !Array.isArray(blocks)) return null;
    
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    
    let hasBlocks = false;
    blocks.forEach(b => {
        if (!b || !b.position || !selectedIds.has(b.id)) return;
        hasBlocks = true;
        
        const dims = getRotatedDimensions(b.type, b.rotation);
        minX = Math.min(minX, b.position.x - dims.x/2);
        maxX = Math.max(maxX, b.position.x + dims.x/2);
        minY = Math.min(minY, b.position.y - dims.y/2);
        maxY = Math.max(maxY, b.position.y + dims.y/2);
        minZ = Math.min(minZ, b.position.z - dims.z/2);
        maxZ = Math.max(maxZ, b.position.z + dims.z/2);
    });
    
    if (!hasBlocks) return null;
    const UNIT_METERS = 0.2; 
    return {
        width: Math.max(0, (maxX - minX)) * UNIT_METERS,
        height: Math.max(0, (maxY - minY)) * UNIT_METERS,
        depth: Math.max(0, (maxZ - minZ)) * UNIT_METERS
    };
};

export const generateInstructionSteps = (blocks: PlacedBrock[]): PlacedBrock[][] => {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return [];
  const layers: Record<string, PlacedBrock[]> = {};
  blocks.forEach(block => {
    if (!block || !block.position) return;
    const yKey = (block.position.y || 0).toFixed(1);
    if (!layers[yKey]) layers[yKey] = [];
    layers[yKey].push(block);
  });
  const sortedKeys = Object.keys(layers).sort((a, b) => parseFloat(a) - parseFloat(b));
  return sortedKeys.map(key => layers[key]);
};
