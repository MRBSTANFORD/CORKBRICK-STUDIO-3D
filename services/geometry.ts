import { BrockType, Rotation3, Vector3 } from '../types';
import { GeoConfig } from './geometryConfig';

/**
 * 🔒 GEOMETRY ENGINE
 * CONN_1D Visual is LOCKED. Collision is DYNAMIC.
 */

export interface Box3 {
  pos: Vector3; // Center position relative to block center
  size: Vector3; // Dimensions
}

export const getComponentBoxes = (type: BrockType, forCollision: boolean = false): Box3[] => {
  const cfg = GeoConfig.getAll();

  // --- 1. VISUAL GEOMETRY ---
  if (!forCollision) {
      const U = 1.0;
      const H = 1.0;
      
      const W = cfg.vis_tip_width;
      const C = cfg.vis_hub_thick;
      const ARM_LONG = cfg.vis_arm_long;
      const ARM_SHORT = cfg.vis_arm_short;
      
      const P_SIZE = cfg.vis_pillar_size;
      const P_OFF = cfg.vis_pillar_offset;
      const SLAB_H = cfg.vis_base_slab_height;

      const createTipX = (xDir: number): Box3 => ({ pos: { x: xDir * ARM_LONG, y: 0, z: 0 }, size: { x: W, y: H, z: 1.0 } });
      const createTipZ = (zDir: number): Box3 => ({ pos: { x: 0, y: 0, z: zDir * ARM_LONG }, size: { x: 1.0, y: H, z: W } });
      
      const createPillars = (yPos: number): Box3[] => [
        { pos: { x: P_OFF, y: yPos, z: P_OFF }, size: { x: P_SIZE, y: 0.5, z: P_SIZE } },
        { pos: { x: -P_OFF, y: yPos, z: P_OFF }, size: { x: P_SIZE, y: 0.5, z: P_SIZE } },
        { pos: { x: P_OFF, y: yPos, z: -P_OFF }, size: { x: P_SIZE, y: 0.5, z: P_SIZE } },
        { pos: { x: -P_OFF, y: yPos, z: -P_OFF }, size: { x: P_SIZE, y: 0.5, z: P_SIZE } },
      ];

      switch (type) {
        case BrockType.BASE: 
            return [{ pos: { x: 0, y: -0.5 + SLAB_H/2, z: 0 }, size: { x: U, y: SLAB_H, z: U } }, ...createPillars(0.25)];
        
        case BrockType.DOUBLE: 
            return [{ pos: { x: 0, y: 0, z: 0 }, size: { x: U, y: 1.0, z: U } }, ...createPillars(0.75), ...createPillars(-0.75)];
        
        case BrockType.CONN_1D: 
            // 🔒 REVERTED TO LOCKED SPEC
            return [
                { pos: { x: 0, y: 0, z: 0 }, size: { x: 0.68, y: H, z: 1.0/3.0 } }, 
                { pos: { x: -5/12, y: 0, z: 0 }, size: { x: 1.0/6.0, y: H, z: 1.0 } }, 
                { pos: { x: 5/12, y: 0, z: 0 }, size: { x: 1.0/6.0, y: H, z: 1.0 } }
            ];

        case BrockType.CONN_2D: return [{ pos: { x: (ARM_LONG-ARM_SHORT)/2, y: 0, z: 0 }, size: { x: ARM_SHORT+ARM_LONG, y: H, z: C } }, createTipX(1), { pos: { x: 0, y: 0, z: (ARM_LONG-ARM_SHORT)/2 }, size: { x: C, y: H, z: ARM_SHORT+ARM_LONG } }, createTipZ(1)];
        case BrockType.CONN_3D: return [{ pos: { x: 0, y: 0, z: 0 }, size: { x: ARM_LONG*2, y: H, z: C } }, createTipX(1), createTipX(-1), { pos: { x: 0, y: 0, z: (ARM_LONG-ARM_SHORT)/2 }, size: { x: C, y: H, z: ARM_SHORT+ARM_LONG } }, createTipZ(1)];
        case BrockType.CONN_4D: return [{ pos: { x: 0, y: 0, z: 0 }, size: { x: ARM_LONG*2, y: H, z: C } }, createTipX(1), createTipX(-1), { pos: { x: 0, y: 0, z: 0 }, size: { x: C, y: H, z: ARM_LONG*2 } }, createTipZ(1), createTipZ(-1)];
        
        case BrockType.TERMINAL: return [
            { pos: { x: 0, y: 0, z: cfg.vis_terminal_plate_z }, size: { x: cfg.vis_terminal_plate_depth, y: 1.0, z: W } }, 
            { pos: { x: 0, y: 0, z: cfg.vis_terminal_stem_z }, size: { x: C, y: 1.0, z: 0.333 } }
        ];

        default: return [{ pos: { x: 0, y: 0, z: 0 }, size: { x: 1, y: 1, z: 1 } }];
      }
  }

  // --- 2. COLLISION GEOMETRY (Dynamic) ---
  
  const H_COL = 1.0 - cfg.col_h_shrink;
  const SLAB_XZ = 1.0 - cfg.col_h_shrink; 
  const ARM_THICK = cfg.col_arm_thick;
  const TIP_W = cfg.col_tip_width;
  const TIP_L = cfg.col_tip_len;
  const TIP_CENTER = cfg.col_tip_center;
  const P_COL_SIZE = cfg.col_pillar_size;

  // Helper Generators
  const mkArmX = (dir: 1|-1): Box3 => ({ pos: {x: dir*0.45, y:0, z:0}, size: {x:0.7, y:H_COL, z:ARM_THICK} });
  const mkArmZ = (dir: 1|-1): Box3 => ({ pos: {x:0, y:0, z:dir*0.45}, size: {x:ARM_THICK, y:H_COL, z:0.7} });
  
  const mkBackX = (dir: 1|-1): Box3 => ({ pos: {x: dir*0.32, y:0, z:0}, size: {x:0.36, y:H_COL, z:ARM_THICK} });
  const mkBackZ = (dir: 1|-1): Box3 => ({ pos: {x:0, y:0, z:dir*0.32}, size: {x:ARM_THICK, y:H_COL, z:0.36} });

  // Generic Tip
  const mkTipX = (dir: 1|-1): Box3 => ({ pos: {x: dir*TIP_CENTER, y:0, z:0}, size: {x:TIP_W, y:H_COL, z:TIP_L} });
  const mkTipZ = (dir: 1|-1): Box3 => ({ pos: {x:0, y:0, z:dir*TIP_CENTER}, size: {x:TIP_L, y:H_COL, z:TIP_W} });
  
  // 1D Specific Tip: Uses specialized center offset and thickness logic
  const mkTip1D = (dir: 1|-1): Box3 => ({ 
      pos: { x: dir * cfg.col_1d_tip_center, y: 0, z: 0 }, 
      size: { x: TIP_W, y: H_COL, z: TIP_L } // Tips are perpendicular to the main bar usually? No, for 1D they are the "flanges".
      // Note: In CONN_1D visual, the "tips" (flanges) are at the ends. They are wide in Z (1.0).
      // Here we use generic TIP_L (0.8) for Z width and TIP_W (0.12) for X thickness.
  });

  const hub: Box3 = { pos:{x:0,y:0,z:0}, size:{x:ARM_THICK, y:H_COL, z:ARM_THICK} };

  const mkPillars = (yPos: number): Box3[] => [
       { pos: {x:0.35, y:yPos, z:0.35}, size: {x:P_COL_SIZE, y:0.45, z:P_COL_SIZE} },
       { pos: {x:-0.35, y:yPos, z:0.35}, size: {x:P_COL_SIZE, y:0.45, z:P_COL_SIZE} },
       { pos: {x:0.35, y:yPos, z:-0.35}, size: {x:P_COL_SIZE, y:0.45, z:P_COL_SIZE} },
       { pos: {x:-0.35, y:yPos, z:-0.35}, size: {x:P_COL_SIZE, y:0.45, z:P_COL_SIZE} },
  ];

  switch (type) {
    case BrockType.BASE:
      return [
        { pos: { x: 0, y: -0.25, z: 0 }, size: { x: SLAB_XZ, y: 0.5, z: SLAB_XZ } },
        ...mkPillars(0.25)
      ];

    case BrockType.DOUBLE:
      return [
        { pos: { x: 0, y: 0, z: 0 }, size: { x: SLAB_XZ, y: 1.0, z: SLAB_XZ } }, 
        ...mkPillars(0.75),
        ...mkPillars(-0.75)
      ];

    case BrockType.CONN_1D: 
      return [
          // Center Bar: Thick in Z (col_1d_thick), Long in X
          { pos: { x: 0, y: 0, z: 0 }, size: { x: 0.65, y: H_COL, z: cfg.col_1d_thick } },
          mkTip1D(1), mkTip1D(-1)
      ];

    case BrockType.CONN_2D:
      return [ hub, mkArmX(1), mkTipX(1), mkBackX(-1), mkArmZ(1), mkTipZ(1), mkBackZ(-1) ];

    case BrockType.CONN_3D:
       return [ hub, mkArmX(1), mkTipX(1), mkArmX(-1), mkTipX(-1), mkArmZ(1), mkTipZ(1), mkBackZ(-1) ];

    case BrockType.CONN_4D: 
      return [ hub, mkArmX(1), mkTipX(1), mkArmX(-1), mkTipX(-1), mkArmZ(1), mkTipZ(1), mkArmZ(-1), mkTipZ(-1) ];

    case BrockType.TERMINAL:
      return [
        { pos: { x: 0, y: 0, z: 0.4 }, size: { x: 0.95, y: H_COL, z: 0.1 } },
        { pos: { x: 0, y: 0, z: 0.2 }, size: { x: ARM_THICK, y: H_COL, z: 0.4 } }
      ];

    default:
      return [{ pos: { x: 0, y: 0, z: 0 }, size: { x: 0.5, y: 0.5, z: 0.5 } }];
  }
};