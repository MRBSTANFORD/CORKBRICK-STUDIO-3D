import { BrockType } from '../types';

// The source of truth for default values
export const GEO_DEFAULTS = {
  // --- COLLISION (INTERLOCKING LOGIC) ---
  col_tolerance: 0.01,
  col_h_shrink: 0.04,
  col_arm_thick: 0.28,
  
  // 1D SPECIFIC
  col_1d_thick: 0.30,
  col_1d_tip_center: 0.42, // New: Specific offset for 1D block tips (approx 5/12)

  // SHARED TIP
  col_tip_width: 0.12,
  col_tip_len: 0.8,
  col_tip_center: 0.85, // For 2D/3D/4D (Long arms)
  col_pillar_size: 0.25,

  // --- VISUAL: CONNECTORS ---
  vis_tip_width: 1.0 / 6.0,    // 0.166...
  vis_hub_thick: 1.0 / 3.0,    // 0.333...
  vis_arm_long: 0.85,
  vis_arm_short: 0.5,
  
  // --- VISUAL: STRUCTURAL (BASE/DOUBLE) ---
  vis_base_slab_height: 0.5,
  vis_pillar_size: 0.34,
  vis_pillar_offset: 0.33,

  // --- VISUAL: TERMINAL ---
  vis_terminal_plate_z: 0.4,
  vis_terminal_stem_z: 0.166,
  vis_terminal_plate_depth: 1.0,
};

export type GeoKey = keyof typeof GEO_DEFAULTS;

// Metadata for the Dashboard UI
export const GEO_META: Record<GeoKey, { label: string; desc: string; category: string; min: number; max: number; step: number }> = {
  // COLLISION
  col_tolerance: { 
    label: "Tolerance (Gap)", 
    desc: "The global safety gap between colliding blocks. Increase this if blocks feel too tight or 'glitchy'.", 
    category: "Collision: Global", min: 0, max: 0.05, step: 0.001 
  },
  col_h_shrink: { 
    label: "Height Shrink", 
    desc: "Reduces collision height to prevent top/bottom friction.", 
    category: "Collision: Global", min: 0, max: 0.1, step: 0.01 
  },
  col_arm_thick: { 
    label: "Arm Thickness", 
    desc: "Thickness of standard connector arms.", 
    category: "Collision: Global", min: 0.1, max: 0.33, step: 0.01 
  },
  
  // 1D Specific
  col_1d_thick: { 
    label: "1D Web Thickness", 
    desc: "Thickness of the central web of the 1D block.", 
    category: "Collision: 1D Special", min: 0.1, max: 0.5, step: 0.01 
  },
  col_1d_tip_center: { 
    label: "1D Tip Center", 
    desc: "Distance from center to the locking tip for 1D blocks. Crucial for 1D interlocking.", 
    category: "Collision: 1D Special", min: 0.3, max: 0.6, step: 0.001 
  },

  col_tip_width: { 
    label: "Tip Width", 
    desc: "Width of the interlocking tip (shared).", 
    category: "Collision: Global", min: 0.05, max: 0.2, step: 0.01 
  },
  col_tip_len: { 
    label: "Tip Length", 
    desc: "Length of the interlocking tip (shared).", 
    category: "Collision: Global", min: 0.5, max: 1.0, step: 0.05 
  },
  col_tip_center: { 
    label: "Tip Center (2D/3D)", 
    desc: "Distance to tip for long-arm blocks (2D, 3D, 4D).", 
    category: "Collision: Global", min: 0.6, max: 1.0, step: 0.01 
  },
  col_pillar_size: { 
    label: "Pillar Collision Size", 
    desc: "Size of pillars on Base/Double blocks.", 
    category: "Collision: Global", min: 0.1, max: 0.35, step: 0.01 
  },

  // VISUAL: CONNECTORS
  vis_tip_width: { 
    label: "Visual Tip Width", 
    desc: "Visible width of connector tips.", 
    category: "Visual: Connectors", min: 0.1, max: 0.25, step: 0.001 
  },
  vis_hub_thick: { 
    label: "Hub Thickness", 
    desc: "Thickness of the central hub.", 
    category: "Visual: Connectors", min: 0.2, max: 0.4, step: 0.001 
  },
  vis_arm_long: { 
    label: "Long Arm Reach", 
    desc: "Extension of long arms (2D/3D/4D).", 
    category: "Visual: Connectors", min: 0.6, max: 1.0, step: 0.01 
  },
  vis_arm_short: { 
    label: "Short Arm Reach", 
    desc: "Extension of short arms.", 
    category: "Visual: Connectors", min: 0.3, max: 0.7, step: 0.01 
  },

  // VISUAL: STRUCTURAL
  vis_base_slab_height: { 
    label: "Slab Height", 
    desc: "Height of the base slab.", 
    category: "Visual: Base/Double", min: 0.1, max: 0.9, step: 0.05 
  },
  vis_pillar_size: { 
    label: "Pillar Size", 
    desc: "Width of visual pillars.", 
    category: "Visual: Base/Double", min: 0.2, max: 0.4, step: 0.01 
  },
  vis_pillar_offset: { 
    label: "Pillar Offset", 
    desc: "Offset of pillars from center.", 
    category: "Visual: Base/Double", min: 0.2, max: 0.45, step: 0.01 
  },

  // VISUAL: TERMINAL
  vis_terminal_plate_z: { 
    label: "Plate Position Z", 
    desc: "Z pos of terminal plate.", 
    category: "Visual: Terminal", min: 0.3, max: 0.5, step: 0.001 
  },
  vis_terminal_stem_z: { 
    label: "Stem Position Z", 
    desc: "Z pos of terminal stem.", 
    category: "Visual: Terminal", min: 0.1, max: 0.3, step: 0.001 
  },
  vis_terminal_plate_depth: { 
    label: "Plate Depth/Size", 
    desc: "Size of terminal plate.", 
    category: "Visual: Terminal", min: 0.5, max: 1.2, step: 0.01 
  },
};

class GeometryConfigService {
  private config = { ...GEO_DEFAULTS };
  private listeners: (() => void)[] = [];

  get(key: GeoKey) {
    return this.config[key];
  }

  getAll() {
    return { ...this.config };
  }

  set(key: GeoKey, value: number) {
    this.config[key] = value;
    this.notify();
  }

  reset() {
    this.config = { ...GEO_DEFAULTS };
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }
}

export const GeoConfig = new GeometryConfigService();