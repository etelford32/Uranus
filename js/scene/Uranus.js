/**
 * Uranus - The tilted ice giant planet (Improved with fallbacks)
 */

import { URANUS_RADIUS, URANUS_TILT, URANUS_ROTATION_PERIOD, COLORS } from '../config/constants.js';
import { QualityPresets, PerformanceSettings } from '../config/settings.js';

export default class Uranus {
    constructor(scene) {
        this.scene = scene;
        this.group = null;
        this.mesh = null;
        this.cloudLayer = null;
        this.atmosphere = null;
        this.rotation = 0;
        this.useShaders = true; // Flag to control shader usage
        this.debug = true; // Enable debug logging
    }
    
    /**
     * Create Uranus and add to scene
     */
    create() {
        try {
            this.log('Creating Uranus...');
            
            // Create group to hold all Uranus components
            this.group = new THREE.Group();
            this.group.name = 'UranusGroup';
            
            // Create the main planet with fallback
            this.createPlanet();
            
            // Create cloud layer with fallback
            this.createCloudLayer();
            
            // Create atmospheric glow with fallback
            this.createAtmosphere();
            
            // Apply the extreme axial tilt
            this.group.rotation.z = URANUS_TILT;
            
            // Add to scene
            this.scene.add(this.group);
            
            this.log('Uranus created successfully');
            return true;
        } catch (error) {
            console.error('Failed to create Uranus:', error);
            this.createFallbackPlanet();
            return false;
        }
    }
    
    /**
     * Create the main planet mesh with fallback to simple material
     */
    createPlanet() {
        try {
            const quality = this.getQualitySettings();
            const segments = quality.uranusSegments || 64;
            
            // Create sphere geometry
            const geometry = new THREE.SphereGeometry(URANUS_RADIUS, segments, segments);
            
            // Try to create material with full features
            let material;
            try {
                material = new THREE.MeshPhongMaterial({
                    color: COLORS.uranus.main || 0x4FD0E7,
                    emissive: COLORS.uranus.emissive || 0x0a2a3a,
                    emissiveIntensity: 0.1,
                    specular: COLORS.uranus.specular || 0x6FE5F5,
                    shininess: 40,
                    reflectivity: 0.3
                });
                this.log('Created Phong material for Uranus');
            } catch (error) {
                console.warn('Failed to create Phong material, using basic:', error);
                material = new THREE.MeshBasicMaterial({
                    color: COLORS.uranus.main || 0x4FD0E7
                });
            }
            
            // Create mesh
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.castShadow = true;
            this.mesh.receiveShadow = true;
            this.mesh.name = 'Uranus';
            
            // Add surface detail if possible
            try {
                this.addSurfaceDetail(geometry);
            } catch (error) {
                console.warn('Could not add surface detail:', error);
            }
            
            this.group.add(this.mesh);
            this.log('Main planet mesh created');
        } catch (error) {
            console.error('Failed to create planet:', error);
            this.createSimplePlanet();
        }
    }
    
    /**
     * Create a simple fallback planet
     */
    createSimplePlanet() {
        try {
            const geometry = new THREE.SphereGeometry(URANUS_RADIUS, 32, 32);
            const material = new THREE.MeshBasicMaterial({
                color: 0x4FD0E7,
                wireframe: false
            });
            
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.name = 'UranusFallback';
            this.group.add(this.mesh);
            
            console.warn('Using fallback simple planet');
        } catch (error) {
            console.error('Even simple planet failed:', error);
        }
    }
    
    /**
     * Add subtle surface detail through vertex displacement
     */
    addSurfaceDetail(geometry) {
        if (!geometry.attributes || !geometry.attributes.position) {
            console.warn('Geometry lacks position attribute');
            return;
        }
        
        try {
            const positions = geometry.attributes.position;
            const vertex = new THREE.Vector3();
            
            for (let i = 0; i < positions.count; i++) {
                vertex.fromBufferAttribute(positions, i);
                
                // Add very subtle noise to simulate atmospheric bands
                const noise = (Math.sin(vertex.y * 3) * 0.02 + 
                              Math.cos(vertex.x * 5) * 0.01) * URANUS_RADIUS * 0.001;
                
                vertex.normalize();
                vertex.multiplyScalar(URANUS_RADIUS + noise);
                
                positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
            }
            
            positions.needsUpdate = true;
            geometry.computeVertexNormals();
        } catch (error) {
            console.warn('Could not add surface detail:', error);
        }
    }
    
    /**
     * Create cloud layer with fallback
     */
    createCloudLayer() {
        try {
            const quality = this.getQualitySettings();
            const segments = Math.floor(quality.uranusSegments * 0.5) || 32;
            
            const geometry = new THREE.SphereGeometry(
                URANUS_RADIUS * 1.01, 
                segments, 
                segments / 2
            );
            
            const material = new THREE.MeshPhongMaterial({
                color: COLORS.uranus.atmosphere || 0x6FE5F5,
                transparent: true,
                opacity: 0.15,
                emissive: 0x3FA0B5,
                emissiveIntensity: 0.05,
                side: THREE.FrontSide,
                depthWrite: false
            });
            
            this.cloudLayer = new THREE.Mesh(geometry, material);
            this.cloudLayer.name = 'CloudLayer';
            
            this.group.add(this.cloudLayer);
            this.log('Cloud layer created');
        } catch (error) {
            console.warn('Could not create cloud layer:', error);
            // Cloud layer is optional, so we can continue without it
        }
    }
    
    /**
     * Create atmospheric glow with fallback
     */
    createAtmosphere() {
        // First try shader material, then fall back to basic
        if (this.useShaders) {
            try {
                this.createShaderAtmosphere();
                return;
            } catch (error) {
                console.warn('Shader atmosphere failed, using fallback:', error);
                this.useShaders = false;
            }
        }
        
        // Fallback to simple atmosphere
        this.createSimpleAtmosphere();
    }
    
    /**
     * Create shader-based atmosphere
     */
    createShaderAtmosphere() {
        const geometry = new THREE.SphereGeometry(
            URANUS_RADIUS * 1.2, 
            32, 
            32
        );
        
        // Custom shader material for atmospheric glow
        const material = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(COLORS.uranus.glow || 0x4FD0E7) },
                viewVector: { value: new THREE.Vector3() },
                c: { value: 0.6 },
                p: { value: 4.0 }
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying float intensity;
                
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    intensity = pow(0.8 - dot(vNormal, vNormel), 2.0);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                
                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4(glow, intensity * 0.15);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });
        
        this.atmosphere = new THREE.Mesh(geometry, material);
        this.atmosphere.name = 'Atmosphere';
        
        this.group.add(this.atmosphere);
        this.log('Shader atmosphere created');
    }
    
    /**
     * Create simple fallback atmosphere
     */
    createSimpleAtmosphere() {
        try {
            const geometry = new THREE.SphereGeometry(
                URANUS_RADIUS * 1.15, 
                16, 
                16
            );
            
            const material = new THREE.MeshBasicMaterial({
                color: COLORS.uranus.glow || 0x4FD0E7,
                transparent: true,
                opacity: 0.1,
                side: THREE.BackSide,
                depthWrite: false
            });
            
            this.atmosphere = new THREE.Mesh(geometry, material);
            this.atmosphere.name = 'AtmosphereFallback';
            
            this.group.add(this.atmosphere);
            this.log('Simple atmosphere created');
        } catch (error) {
            console.warn('Could not create atmosphere:', error);
            // Atmosphere is optional, continue without it
        }
    }
    
    /**
     * Create complete fallback planet
     */
    createFallbackPlanet() {
        try {
            console.warn('Creating minimal fallback Uranus');
            
            this.group = new THREE.Group();
            
            // Just create a simple colored sphere
            const geometry = new THREE.SphereGeometry(URANUS_RADIUS, 16, 16);
            const material = new THREE.MeshBasicMaterial({
                color: 0x4FD0E7
            });
            
            this.mesh = new THREE.Mesh(geometry, material);
            this.group.add(this.mesh);
            this.scene.add(this.group);
            
        } catch (error) {
            console.error('Complete failure creating Uranus:', error);
        }
    }
    
    /**
     * Update Uranus rotation and effects
     */
    update(deltaTime, timeSpeed) {
        if (!this.group) return;
        
        try {
            // Rotate Uranus (retrograde rotation)
            const rotationSpeed = (deltaTime * timeSpeed * 2 * Math.PI) / URANUS_ROTATION_PERIOD;
            this.rotation -= rotationSpeed;
            this.group.rotation.y = this.rotation;
            
            // Slightly different rotation for cloud layer for dynamic effect
            if (this.cloudLayer) {
                this.cloudLayer.rotation.y += rotationSpeed * 0.1;
            }
            
            // Update atmosphere shader if using shaders
            if (this.useShaders && this.atmosphere && this.atmosphere.material.uniforms) {
                const camera = this.scene.getObjectByProperty('isCamera', true);
                if (camera) {
                    this.atmosphere.material.uniforms.viewVector.value = 
                        new THREE.Vector3().subVectors(camera.position, this.group.position);
                }
            }
        } catch (error) {
            console.error('Error updating Uranus:', error);
        }
    }
    
    /**
     * Get quality settings with fallback
     */
    getQualitySettings() {
        try {
            const quality = QualityPresets[PerformanceSettings.currentQuality];
            if (quality) return quality;
        } catch (error) {
            console.warn('Could not get quality settings:', error);
        }
        
        // Return default fallback settings
        return {
            uranusSegments: 64,
            shadowsEnabled: false,
            antialias: false
        };
    }
    
    /**
     * Debug logging
     */
    log(message) {
        if (this.debug) {
            console.log(`[Uranus] ${message}`);
        }
    }
    
    /**
     * Set visibility
     */
    setVisible(visible) {
        if (this.group) {
            this.group.visible = visible;
        }
    }
    
    /**
     * Get the main group
     */
    getGroup() {
        return this.group;
    }
    
    /**
     * Get current rotation
     */
    getRotation() {
        return this.rotation;
    }
    
    /**
     * Set rotation (for synchronization)
     */
    setRotation(rotation) {
        this.rotation = rotation;
        if (this.group) {
            this.group.rotation.y = rotation;
        }
    }
    
    /**
     * Update quality settings
     */
    updateQuality(qualityLevel) {
        try {
            const quality = QualityPresets[qualityLevel];
            if (!quality) return;
            
            // Recreate geometry with new segment count
            if (this.mesh && this.mesh.geometry) {
                const oldGeometry = this.mesh.geometry;
                const newGeometry = new THREE.SphereGeometry(
                    URANUS_RADIUS, 
                    quality.uranusSegments || 64, 
                    quality.uranusSegments || 64
                );
                
                this.addSurfaceDetail(newGeometry);
                this.mesh.geometry = newGeometry;
                oldGeometry.dispose();
            }
            
            // Update cloud layer
            if (this.cloudLayer && this.cloudLayer.geometry) {
                const oldGeometry = this.cloudLayer.geometry;
                const segments = Math.floor((quality.uranusSegments || 64) * 0.5);
                const newGeometry = new THREE.SphereGeometry(
                    URANUS_RADIUS * 1.01,
                    segments,
                    segments / 2
                );
                
                this.cloudLayer.geometry = newGeometry;
                oldGeometry.dispose();
            }
        } catch (error) {
            console.error('Error updating quality:', error);
        }
    }
    
    /**
     * Set emissive intensity (for effects)
     */
    setEmissiveIntensity(intensity) {
        try {
            if (this.mesh && this.mesh.material && this.mesh.material.emissiveIntensity !== undefined) {
                this.mesh.material.emissiveIntensity = intensity;
            }
        } catch (error) {
            console.warn('Could not set emissive intensity:', error);
        }
    }
    
    /**
     * Get world position
     */
    getWorldPosition() {
        const position = new THREE.Vector3();
        if (this.group) {
            this.group.getWorldPosition(position);
        }
        return position;
    }
    
    /**
     * Test if Uranus is working
     */
    test() {
        const tests = {
            hasGroup: !!this.group,
            hasMesh: !!this.mesh,
            meshInGroup: this.mesh && this.mesh.parent === this.group,
            groupInScene: this.group && this.group.parent === this.scene,
            hasGeometry: this.mesh && !!this.mesh.geometry,
            hasMaterial: this.mesh && !!this.mesh.material
        };
        
        console.log('[Uranus Test Results]:', tests);
        return Object.values(tests).every(test => test === true);
    }
    
    /**
     * Dispose of resources
     */
    dispose() {
        try {
            if (this.group) {
                // Dispose mesh
                if (this.mesh) {
                    if (this.mesh.geometry) this.mesh.geometry.dispose();
                    if (this.mesh.material) this.mesh.material.dispose();
                }
                
                // Dispose cloud layer
                if (this.cloudLayer) {
                    if (this.cloudLayer.geometry) this.cloudLayer.geometry.dispose();
                    if (this.cloudLayer.material) this.cloudLayer.material.dispose();
                }
                
                // Dispose atmosphere
                if (this.atmosphere) {
                    if (this.atmosphere.geometry) this.atmosphere.geometry.dispose();
                    if (this.atmosphere.material) this.atmosphere.material.dispose();
                }
                
                // Remove from scene
                if (this.scene && this.group.parent) {
                    this.scene.remove(this.group);
                }
                
                // Clear references
                this.group = null;
                this.mesh = null;
                this.cloudLayer = null;
                this.atmosphere = null;
            }
        } catch (error) {
            console.error('Error disposing Uranus:', error);
        }
    }
}
