import React, { useMemo } from 'react';
import { BrockType, Rotation3 } from '../types';
import { BROCK_SPECS } from '../constants';
import { getComponentBoxes } from '../services/geometry';

interface BrockMeshProps {
  type: BrockType;
  position: [number, number, number];
  rotation: Rotation3; 
  isGhost?: boolean;
  opacity?: number;
  isSelected?: boolean;
}

export const BrockMesh: React.FC<BrockMeshProps> = ({ type, position, rotation, isGhost = false, opacity = 1, isSelected = false }) => {
  const spec = BROCK_SPECS[type];
  
  const euler: [number, number, number] = [
    (rotation.x * Math.PI) / 2,
    (rotation.y * Math.PI) / 2,
    (rotation.z * Math.PI) / 2
  ];
  
  const materialProps = useMemo(() => ({
    color: isGhost ? '#fbbf24' : (isSelected ? '#ef4444' : spec.color), // Red highlight if selected
    transparent: isGhost || opacity < 1,
    opacity: isGhost ? 0.6 : opacity,
    emissive: isSelected ? '#7f1d1d' : '#000000',
    emissiveIntensity: isSelected ? 0.5 : 0,
  }), [isGhost, opacity, spec, isSelected]);

  const mat = <meshStandardMaterial {...materialProps} roughness={0.9} metalness={0.05} />;

  // Get Geometry Parts
  // We use `forCollision = false` to get the exact visual dimensions
  const boxes = useMemo(() => getComponentBoxes(type, false), [type]);

  return (
    <group position={position} rotation={euler}>
      {boxes.map((box, i) => (
         <mesh key={i} position={[box.pos.x, box.pos.y, box.pos.z]} castShadow receiveShadow>
            <boxGeometry args={[box.size.x, box.size.y, box.size.z]} />
            {mat}
         </mesh>
      ))}
    </group>
  );
};
