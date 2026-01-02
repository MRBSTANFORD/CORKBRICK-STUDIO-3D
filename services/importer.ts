
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PlacedBrock, BrockType } from '../types';
import { BROCK_SPECS } from '../constants';

/**
 * Intelligent Geometry Matcher
 * Analyzes dimensions of a 3D object and finds the closest matching Corkbrick type.
 */
const matchBlockType = (size: THREE.Vector3, name: string): BrockType | null => {
    // Sort dimensions to ignore rotation (e.g. 0.2x0.4x0.2 is same as 0.4x0.2x0.2)
    const dims = [size.x, size.y, size.z].sort((a, b) => a - b);
    
    // Tolerances (in meters)
    const TOLERANCE = 0.05; 
    const isApprox = (a: number, b: number) => Math.abs(a - b) < TOLERANCE;

    // 1. BASE / TERMINAL / CONN_1D (All roughly 0.2 x 0.2 x 0.2 bounding box)
    if (isApprox(dims[0], 0.2) && isApprox(dims[1], 0.2) && isApprox(dims[2], 0.2)) {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('conn') || lowerName.includes('1d')) return BrockType.CONN_1D;
        if (lowerName.includes('term') || lowerName.includes('cap')) return BrockType.TERMINAL;
        return BrockType.BASE; // Default
    }

    // 2. DOUBLE (0.2 x 0.2 x 0.4)
    if (isApprox(dims[0], 0.2) && isApprox(dims[1], 0.2) && isApprox(dims[2], 0.4)) {
        return BrockType.DOUBLE;
    }

    // 3. CONN_2D (0.2 x 0.3 x 0.3) -> 1.5 units is 0.3m
    if (isApprox(dims[0], 0.2) && isApprox(dims[1], 0.3) && isApprox(dims[2], 0.3)) {
        return BrockType.CONN_2D;
    }

    // 4. CONN_3D (0.2 x 0.3 x 0.4)
    if (isApprox(dims[0], 0.2) && isApprox(dims[1], 0.3) && isApprox(dims[2], 0.4)) {
        return BrockType.CONN_3D;
    }

    // 5. CONN_4D (0.2 x 0.4 x 0.4)
    if (isApprox(dims[0], 0.2) && isApprox(dims[1], 0.4) && isApprox(dims[2], 0.4)) {
        return BrockType.CONN_4D;
    }

    return null;
};

export const parseGltfToBlocks = async (arrayBuffer: ArrayBuffer): Promise<{ blocks: PlacedBrock[], stats: { found: number, ignored: number } }> => {
    const loader = new GLTFLoader();
    
    return new Promise((resolve, reject) => {
        loader.parse(arrayBuffer, '', (gltf) => {
            const blocks: PlacedBrock[] = [];
            let ignored = 0;
            const scene = gltf.scene;

            // 1. Normalize Scale
            // SketchUp exports can vary. We try to detect if it's in mm or meters.
            // Heuristic: Check the first object. If it's huge (> 100), assume mm.
            let scaleFactor = 1.0;
            const box = new THREE.Box3().setFromObject(scene);
            const size = new THREE.Vector3();
            box.getSize(size);
            
            // If the scene is massive (e.g. 200 units high), it's likely millimeters. 
            // Corkbrick Double is 0.4m. If it comes in as 400.0, we need to divide by 1000.
            if (size.y > 50 || size.x > 50) {
                scaleFactor = 0.001;
            } else if (size.y > 5 && size.y < 50) {
                // Centimeters? Unlikely default, but possible.
                scaleFactor = 0.01;
            }

            scene.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    
                    // Apply global scale normalization locally for measurement
                    const worldScale = new THREE.Vector3();
                    mesh.getWorldScale(worldScale);
                    worldScale.multiplyScalar(scaleFactor);

                    // Get Bounding Box in World Space (Scaled)
                    // We temporarily apply the scale factor to the geometry to measure it
                    mesh.geometry.computeBoundingBox();
                    const bbox = mesh.geometry.boundingBox!.clone();
                    
                    // Calculate Dimensions in Meters
                    const dims = new THREE.Vector3();
                    dims.subVectors(bbox.max, bbox.min);
                    dims.multiply(worldScale); // Apply the detected unit scale
                    
                    // Match Type
                    const type = matchBlockType(dims, mesh.name || '');
                    
                    if (type) {
                        // Calculate Position
                        const worldPos = new THREE.Vector3();
                        mesh.getWorldPosition(worldPos);
                        worldPos.multiplyScalar(scaleFactor); // Convert to meters
                        
                        // Convert Meters to Grid Units (1 Unit = 0.2m)
                        const gx = Math.round(worldPos.x / 0.2);
                        const gy = Math.round(worldPos.y / 0.2); // Y is up in SketchUp GLTF usually
                        const gz = Math.round(worldPos.z / 0.2);

                        // Fix Origin Offset: Bounding Box Center vs Mesh Pivot
                        // SketchUp pivots vary. We assume the mesh position is meaningful, 
                        // but usually we need to adjust based on the centroid.
                        
                        // For this V1, we trust the mesh pivot is roughly centered or cornered.
                        // A more robust way is snapping the centroid.
                        const center = new THREE.Vector3();
                        bbox.getCenter(center);
                        center.applyMatrix4(mesh.matrixWorld);
                        center.multiplyScalar(scaleFactor);
                        
                        const snappedPos = {
                            x: Math.round(center.x / 0.2) * 0.2, // Snap center to 0.2m grid
                            y: Math.round(center.y / 0.2) * 0.2, 
                            z: Math.round(center.z / 0.2) * 0.2
                        };

                        // Convert back to Grid Integers/Halves for our coordinate system
                        // Our system: Base is at Y=0 (meaning center is 0.1? No, logic says Y=0 is ground layer structural)
                        // Actually types.ts/constants.ts says: 
                        // "Layer 0 (Ground)... Position.y = 0"
                        // But Builder geometry says Base size y=0.5 (units) -> 0.1m.
                        // Let's just use the Grid Units directly.
                        
                        blocks.push({
                            id: Math.random().toString(36).substr(2, 9),
                            type: type,
                            position: { 
                                x: Math.round(center.x / 0.2 * 2) / 2, // Snap to 0.5 units 
                                y: Math.round(center.y / 0.2 * 2) / 2, 
                                z: Math.round(center.z / 0.2 * 2) / 2 
                            },
                            rotation: { x: 0, y: 0, z: 0 }, // TODO: Infer rotation from bbox alignment
                            timestamp: Date.now()
                        });
                    } else {
                        ignored++;
                    }
                }
            });

            resolve({ blocks, stats: { found: blocks.length, ignored } });
        }, undefined, (error) => {
            reject(error);
        });
    });
};
