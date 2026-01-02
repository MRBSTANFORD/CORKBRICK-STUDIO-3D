
/**
 * 🔒 STABLE MODULE: Core Type Definitions
 * STATUS: FROZEN
 * VERSION: 1.0.0
 */
export enum BrockType {
  BASE = 'BASE',
  DOUBLE = 'DOUBLE',
  CONN_1D = 'CONN_1D',
  CONN_2D = 'CONN_2D',
  CONN_3D = 'CONN_3D',
  CONN_4D = 'CONN_4D',
  TERMINAL = 'TERMINAL'
}

export enum RoomSize {
  UNLIMITED = 'UNLIMITED',
  NICHE_2M = 'NICHE_2M',     // 2m Wide x 1m Deep
  WALL_3M = 'WALL_3M',       // 3m Wide (Wall context)
  CORNER_3M = 'CORNER_3M',   // 3m x 3m Corner
  ROOM_4X5 = 'ROOM_4X5'      // 4m x 5m Full Room
}

export enum FloorMaterial {
  CORK = 'CORK',
  WOOD_OAK = 'WOOD_OAK',
  WOODEN_FLOORING = 'WOODEN_FLOORING',
  CONCRETE = 'CONCRETE',
  TILE = 'TILE',
  CARPET = 'CARPET'
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Rotation3 {
  x: number;
  y: number;
  z: number;
}

export interface PlacedBrock {
  id: string;
  type: BrockType;
  position: Vector3;
  rotation: Rotation3; // Euler rotation steps (multiples of 90 deg)
  timestamp: number;
}

export interface BrockSpec {
  name: string;
  description: string;
  dimensions: Vector3; // In grid units
  weight: number; // kg
  cost: number; // EUR
  color: string;
  isConnector: boolean;
}

export interface AppConfig {
  gridSize: number; // mm
  currency: string;
  prices: Record<BrockType, number>;
  weights: Record<BrockType, number>;
  sdgImpacts: Record<BrockType, number>; // New SDG Impact
  prompts: {
    instructionGeneration: string;
    designValidation: string;
  };
  aiArchitect: {
    model: string;
    temperature: number;
    systemInstruction: string;
  };
}
