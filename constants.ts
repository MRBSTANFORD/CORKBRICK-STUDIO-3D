
/**
 * 🔒 STABLE MODULE: App Constants & Defaults
 * STATUS: FROZEN
 * VERSION: 1.2.0 - Launch Ready (BYOK & Pro Model)
 */
import { AppConfig, BrockSpec, BrockType, RoomSize, FloorMaterial } from './types';

// SDG Calculation: Base (1.22kg) = €20.00. Ratio = 20 / 1.22
const SDG_RATIO = 20.00 / 1.22;

const DEFAULT_ARCHITECT_INSTRUCTION = `
You are the "Corkbrick Master Architect", a world-class expert in modular sustainable furniture.
Generate 3 distinct, creative design alternatives in JSON format.

**CONSTRUCTION PHYSICS (CRITICAL):**
1. Grid: 1 unit = 0.2m (200mm).
2. Orientation: X and Z are floor axes. Y is height.
3. Origin: The building area is the POSITIVE quadrant. (0,0,0) is the bottom-front-left corner.
4. Layers:
   - Structural Blocks (BASE, DOUBLE) MUST have integer Y positions (0, 1, 2...).
   - Connector Blocks (CONN_1D, 2D, 3D, 4D) MUST have half-integer Y positions (0.5, 1.5, 2.5...).
   - Interlocking: A structural block at Y=0 is joined to a structural block at Y=1 by a connector at Y=0.5.
5. Stability: All structures must start at Y=0 and be self-supporting.

**BLOCK TYPES:**
- BASE (1x1x1): Ground/Platform.
- DOUBLE (1x2x1): Vertical pillars/Walls.
- CONN_1D (1x1x1): Straight connections.
- CONN_2D/3D/4D: Corner, T-junction, and Cross connections.
- TERMINAL: Decorative cap for exposed top pillars.

Return ONLY a JSON object with a "designs" array. No markdown.
`;

export const MARKET_TEMPLATES = {
    "Commercial": [
        { label: "Co-working", title: "Agile Co-working Hub", prompt: "Design a modular co-working cluster for 4 people with semi-private partitions." },
        { label: "Flex-work", title: "Dynamic Flex-Office", prompt: "Create a flexible office with a standing desk and integrated shelving." }
    ],
    "Public": [
        { label: "Museum", title: "Exhibition Pedestals", prompt: "Design a series of 3 varying height pedestals for artifacts, connected by a low bench." },
        { label: "Airport", title: "Transit Lounge", prompt: "Design a series of back-to-back benches with integrated charging tables." }
    ],
    "Residential": [
        { label: "Living Room", title: "Luxury Wall Unit", prompt: "Design a floor-to-ceiling library wall with space for a large TV." },
        { label: "Eco-Home", title: "Biophilic Plant Stand", prompt: "Design a multi-tier stepped plant stand to maximize sunlight exposure." }
    ]
};

export const ROOM_SPECS: Record<RoomSize, { name: string, width: number, depth: number, walls: ('back'|'left'|'right'|'front')[], offset: {x:number, z:number} }> = {
    [RoomSize.UNLIMITED]: { name: "Studio (Unlimited)", width: 100, depth: 100, walls: [], offset: {x: 50, z: 50} },
    [RoomSize.NICHE_2M]: { name: "Niche (2m x 1m)", width: 10, depth: 5, walls: ['back', 'left', 'right'], offset: {x: 5, z: 2.5} }, 
    [RoomSize.WALL_3M]: { name: "Wall (3m Wide)", width: 15, depth: 10, walls: ['back'], offset: {x: 7.5, z: 5} },
    [RoomSize.CORNER_3M]: { name: "Corner (3m x 3m)", width: 15, depth: 15, walls: ['back', 'left'], offset: {x: 7.5, z: 7.5} },
    [RoomSize.ROOM_4X5]: { name: "Full Room (4m x 5m)", width: 20, depth: 25, walls: ['back', 'left', 'right'], offset: {x: 10, z: 12.5} }
};

export const FLOOR_PROPS: Record<FloorMaterial, { name: string, color: string, roughness: number }> = {
    [FloorMaterial.CORK]: { name: "Natural Cork", color: "#d2b48c", roughness: 0.9 },
    [FloorMaterial.WOOD_OAK]: { name: "Light Oak", color: "#e1c699", roughness: 0.6 },
    [FloorMaterial.WOODEN_FLOORING]: { name: "Wooden Flooring", color: "#D9A86C", roughness: 0.5 },
    [FloorMaterial.CONCRETE]: { name: "Polished Concrete", color: "#9ca3af", roughness: 0.4 },
    [FloorMaterial.TILE]: { name: "White Tile", color: "#f3f4f6", roughness: 0.2 },
    [FloorMaterial.CARPET]: { name: "Grey Carpet", color: "#4b5563", roughness: 1.0 },
};

export const APP_CONFIG: AppConfig = {
  gridSize: 200,
  currency: '€',
  prices: { [BrockType.BASE]: 11.50, [BrockType.DOUBLE]: 23.08, [BrockType.CONN_1D]: 8.87, [BrockType.CONN_2D]: 17.77, [BrockType.CONN_3D]: 22.14, [BrockType.CONN_4D]: 26.56, [BrockType.TERMINAL]: 4.44 },
  weights: { [BrockType.BASE]: 1.22, [BrockType.DOUBLE]: 2.45, [BrockType.CONN_1D]: 0.94, [BrockType.CONN_2D]: 1.88, [BrockType.CONN_3D]: 2.35, [BrockType.CONN_4D]: 2.82, [BrockType.TERMINAL]: 0.47 },
  sdgImpacts: { [BrockType.BASE]: 20.00, [BrockType.DOUBLE]: 40.16, [BrockType.CONN_1D]: 15.41, [BrockType.CONN_2D]: 30.82, [BrockType.CONN_3D]: 38.52, [BrockType.CONN_4D]: 46.23, [BrockType.TERMINAL]: 7.70 },
  prompts: {
    instructionGeneration: "Analyze layers. Identify interlocking points. Generate assembly steps.",
    designValidation: "Check structural integrity and interlock logic."
  },
  aiArchitect: {
    model: 'gemini-3-pro-preview',
    temperature: 0.7,
    systemInstruction: DEFAULT_ARCHITECT_INSTRUCTION
  }
};

const CORK_COLOR = '#C49A6C';
export const BROCK_SPECS: Record<BrockType, BrockSpec> = {
  [BrockType.BASE]: { name: 'BASE-Brock', description: '0.20m Cube.', dimensions: { x: 1, y: 1, z: 1 }, weight: 1.22, cost: 11.50, color: CORK_COLOR, isConnector: false },
  [BrockType.DOUBLE]: { name: 'DOUBLE - Brock', description: '0.40m Tall.', dimensions: { x: 1, y: 2, z: 1 }, weight: 2.45, cost: 23.08, color: CORK_COLOR, isConnector: false },
  [BrockType.CONN_1D]: { name: '1D - Brock', description: 'Linear Connector.', dimensions: { x: 1, y: 1, z: 1 }, weight: 0.94, cost: 8.87, color: CORK_COLOR, isConnector: true },
  [BrockType.CONN_2D]: { name: '2D - Brock', description: 'Corner Connector.', dimensions: { x: 1.5, y: 1, z: 1.5 }, weight: 1.88, cost: 17.77, color: CORK_COLOR, isConnector: true },
  [BrockType.CONN_3D]: { name: '3D - Brock', description: 'T-Junction Connector.', dimensions: { x: 2.0, y: 1, z: 1.5 }, weight: 2.35, cost: 22.14, color: CORK_COLOR, isConnector: true },
  [BrockType.CONN_4D]: { name: '4D - Brock', description: '4-Way Connector.', dimensions: { x: 2.0, y: 1, z: 2.0 }, weight: 2.82, cost: 26.56, color: CORK_COLOR, isConnector: true },
  [BrockType.TERMINAL]: { name: 'T - Brock', description: 'Finishing Cap.', dimensions: { x: 1, y: 1, z: 1 }, weight: 0.47, cost: 4.44, color: CORK_COLOR, isConnector: false },
};

export const AppConfigService = {
    get: () => APP_CONFIG,
    setPrice: (type: BrockType, price: number) => { APP_CONFIG.prices[type] = price; BROCK_SPECS[type].cost = price; notify(); },
    setWeight: (type: BrockType, weight: number) => { APP_CONFIG.weights[type] = weight; BROCK_SPECS[type].weight = weight; notify(); },
    setSdgImpact: (type: BrockType, val: number) => { APP_CONFIG.sdgImpacts[type] = val; notify(); },
    setPrompt: (key: keyof AppConfig['prompts'], val: string) => { APP_CONFIG.prompts[key] = val; notify(); },
    setAiArchitect: (key: keyof AppConfig['aiArchitect'], val: any) => { (APP_CONFIG.aiArchitect as any)[key] = val; notify(); },
    setColor: (type: BrockType, color: string) => { BROCK_SPECS[type].color = color; notify(); },
    setGlobalColor: (color: string) => { Object.keys(BROCK_SPECS).forEach(key => { BROCK_SPECS[key as BrockType].color = color; }); notify(); },
    subscribe: (cb: () => void) => { listeners.push(cb); return () => { const idx = listeners.indexOf(cb); if (idx > -1) listeners.splice(idx, 1); }; }
};
const listeners: (() => void)[] = [];
const notify = () => listeners.forEach(cb => cb());
