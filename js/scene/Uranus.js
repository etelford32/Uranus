/**
 * Uranus - The tilted ice giant planet
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
    }
    
    /**
     * Create Uranus and add to scene
     */
    create() {
        // Create group to hold all Uranus components
        this.group = new THREE.Group();
        
        // Create the main planet
        this.createPlanet();
        
        // Create cloud layer
        this.createCloudLayer();
        
        // Create atmospheric glow
        this.createAtmosphere();
        
        // Apply the extreme axial tilt
        this.group.rotation.z = URANUS_TILT;
        
        // Add to scene
        this.scene.add(this.group);
    }
    
    /**
     * Create the main planet mesh
     */
    createPlanet() {
        const quality = QualityPresets[PerformanceSettings.currentQuality];
        const segments = quality.uranusSegments || 128;
        
        // Create sphere geometry
        const geometry = new THREE.SphereGeometry(URANUS_RADIUS, segments, segments);
        
        // Create material with realistic properties
        const material = new THREE.MeshPhongMaterial({
            color: COLORS.uranus.main,
            emissive: COLORS.uranus.emissive,
            emissiveIntensity: 0.1,
            specular: COLORS.uranus.specular,
            shininess: 40,
            reflectivity: 0.3
        });
        
        // Create mesh
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.name = 'Uranus';
        
        // Add subtle vertex displacement for realism (optional)
        this.addSurfaceDetail(geometry);
        
        this.group.add(this.mesh);
    }
    
    /**
     * Add subtle surface detail through vertex displacement
     */
    addSurfaceDetail(geometry) {
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
    }
    
    /**
     * Create cloud layer
     */
    createCloudLayer() {
        const quality = QualityPresets[PerformanceSettings.currentQuality];
        const segments = Math.floor(quality.uranusSegments * 0.5) || 64;
        
        const geometry = new THREE.SphereGeometry(
            URANUS_RADIUS * 1.01, 
            segments, 
            segments / 2
        );
        
        const material = new THREE.MeshPhongMaterial({
            color: COLORS.uranus.atmosphere,
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
    }
    
    /**
     * Create atmospheric glow
     */
    createAtmosphere() {
        const geometry = new THREE.SphereGeometry(
            URANUS_RADIUS * 1.2, 
            32, 
            32
        );
        
        // Custom shader material for atmospheric glow
        const material = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(COLORS.uranus.glow) },
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
    }
    
    /**
     * Update Uranus rotation and effects
     */
    update(deltaTime, timeSpeed) {
        if (!this.group) return;
        
        // Rotate Uranus (retrograde rotation)
        const rotationSpeed = (deltaTime * timeSpeed * 2 * Math.PI) / URANUS_ROTATION_PERIOD;
        this.rotation -= rotationSpeed;
        this.group.rotation.y = this.rotation;
        
        // Slightly different rotation for cloud layer for dynamic effect
        if (this.cloudLayer) {
            this.cloudLayer.rotation.y += rotationSpeed * 0.1;
        }
        
        // Update atmosphere shader
        if (this.atmosphere && this.atmosphere.material.uniforms) {
            const camera = this.scene.getObjectByProperty('isCamera', true);
            if (camera) {
                this.atmosphere.material.uniforms.viewVector.value = 
                    new THREE.Vector3().subVectors(camera.position, this.group.position);
            }
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
        const quality = QualityPresets[qualityLevel];
        if (!quality) return;
        
        // Recreate geometry with new segment count
        if (this.mesh) {
            const oldGeometry = this.mesh.geometry;
            const newGeometry = new THREE.SphereGeometry(
                URANUS_RADIUS, 
                quality.uranusSegments, 
                quality.uranusSegments
            );
            
            this.addSurfaceDetail(newGeometry);
            this.mesh.geometry = newGeometry;
            oldGeometry.dispose();
        }
        
        // Update cloud layer
        if (this.cloudLayer) {
            const oldGeometry = this.cloudLayer.geometry;
            const segments = Math.floor(quality.uranusSegments * 0.5);
            const newGeometry = new THREE.SphereGeometry(
                URANUS_RADIUS * 1.01,
                segments,
                segments / 2
            );
            
            this.cloudLayer.geometry = newGeometry;
            oldGeometry.dispose();
        }
    }
    
    /**
     * Set emissive intensity (for effects)
     */
    setEmissiveIntensity(intensity) {
        if (this.mesh && this.mesh.material) {
            this.mesh.material.emissiveIntensity = intensity;
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
     * Dispose of resources
     */
    dispose() {
        if (this.group) {
            // Dispose mesh
            if (this.mesh) {
                this.mesh.geometry.dispose();
                this.mesh.material.dispose();
            }
            
            // Dispose cloud layer
            if (this.cloudLayer) {
                this.cloudLayer.geometry.dispose();
                this.cloudLayer.material.dispose();
            }
            
            // Dispose atmosphere
            if (this.atmosphere) {
                this.atmosphere.geometry.dispose();
                this.atmosphere.material.dispose();
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
    }
}
