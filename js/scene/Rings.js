/**
 * Rings - Uranus ring system
 */

import { RINGS_DATA, URANUS_TILT, COLORS } from '../config/constants.js';
import { DisplaySettings, QualityPresets, PerformanceSettings } from '../config/settings.js';

export default class Rings {
    constructor(scene) {
        this.scene = scene;
        this.group = null;
        this.ringMeshes = [];
        this.glowMeshes = [];
    }
    
    /**
     * Create ring system and add to scene
     */
    create() {
        // Create group to hold all rings
        this.group = new THREE.Group();
        this.group.name = 'RingSystem';
        
        // Create each ring
        RINGS_DATA.forEach(ringData => {
            this.createRing(ringData);
        });
        
        // Apply Uranus's tilt to the ring system
        this.group.rotation.z = URANUS_TILT;
        
        // Add to scene
        this.scene.add(this.group);
    }
    
    /**
     * Create individual ring
     */
    createRing(ringData) {
        const quality = QualityPresets[PerformanceSettings.currentQuality];
        const segments = ringData.segments || quality.ringSegments || 256;
        
        // Create ring geometry
        const geometry = new THREE.RingGeometry(
            ringData.innerRadius,
            ringData.outerRadius,
            segments,
            1
        );
        
        // Create material based on ring type
        const material = this.createRingMaterial(ringData);
        
        // Create mesh
        const ringMesh = new THREE.Mesh(geometry, material);
        ringMesh.rotation.x = -Math.PI / 2; // Align rings horizontally
        ringMesh.name = `Ring_${ringData.name}`;
        
        // Store original properties for updates
        ringMesh.userData = {
            baseOpacity: material.opacity,
            baseMetalness: material.metalness || 0.7,
            ringName: ringData.name,
            ringData: ringData
        };
        
        this.ringMeshes.push(ringMesh);
        this.group.add(ringMesh);
        
        // Add glow for major rings
        if (this.shouldHaveGlow(ringData.name)) {
            this.createRingGlow(ringData);
        }
    }
    
    /**
     * Create material for ring based on its properties
     */
    createRingMaterial(ringData) {
        let material;
        
        if (ringData.name === 'ε') {
            // Epsilon ring - most prominent with metallic shine
            material = new THREE.MeshStandardMaterial({
                color: COLORS.rings.epsilon,
                metalness: 0.9 * DisplaySettings.ringShine,
                roughness: 0.3,
                transparent: true,
                opacity: ringData.opacity,
                side: THREE.DoubleSide,
                emissive: 0x203040,
                emissiveIntensity: 0.2,
                depthWrite: false
            });
        } else if (ringData.name === 'μ' || ringData.name === 'ν') {
            // Outer rings - slightly different appearance
            const color = ringData.name === 'μ' ? COLORS.rings.outer.mu : COLORS.rings.outer.nu;
            material = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.6 * DisplaySettings.ringShine,
                roughness: 0.5,
                transparent: true,
                opacity: ringData.opacity * 0.6,
                side: THREE.DoubleSide,
                depthWrite: false
            });
        } else {
            // Main rings - standard metallic appearance
            material = new THREE.MeshStandardMaterial({
                color: COLORS.rings.main,
                metalness: 0.7 * DisplaySettings.ringShine,
                roughness: 0.4,
                transparent: true,
                opacity: ringData.opacity * 0.8,
                side: THREE.DoubleSide,
                emissive: 0x101520,
                emissiveIntensity: 0.1,
                depthWrite: false
            });
        }
        
        return material;
    }
    
    /**
     * Check if ring should have glow effect
     */
    shouldHaveGlow(ringName) {
        return ringName === 'ε' || ringName === 'α' || ringName === 'β';
    }
    
    /**
     * Create glow effect for major rings
     */
    createRingGlow(ringData) {
        const glowGeometry = new THREE.RingGeometry(
            ringData.innerRadius - 0.05,
            ringData.outerRadius + 0.05,
            256,
            1
        );
        
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: ringData.name === 'ε' ? COLORS.rings.glow : 0x909090,
            transparent: true,
            opacity: ringData.name === 'ε' ? 0.3 : 0.15,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.rotation.x = -Math.PI / 2;
        glowMesh.name = `RingGlow_${ringData.name}`;
        glowMesh.userData.baseOpacity = glowMaterial.opacity;
        
        this.glowMeshes.push(glowMesh);
        this.group.add(glowMesh);
    }
    
    /**
     * Update rings animation
     */
    update(deltaTime, uranusRotation) {
        if (!this.group) return;
        
        // Synchronize ring rotation with Uranus
        this.group.rotation.y = uranusRotation;
        
        // Add subtle shimmer effect
        this.updateShimmer(deltaTime);
    }
    
    /**
     * Update shimmer effect on rings
     */
    updateShimmer(deltaTime) {
        const time = Date.now() * 0.001; // Convert to seconds
        
        this.ringMeshes.forEach((ring, index) => {
            if (ring.material && ring.userData.baseOpacity) {
                // Subtle opacity variation
                const shimmer = 0.95 + 0.05 * Math.sin(time * 0.2 + index);
                ring.material.opacity = ring.userData.baseOpacity * shimmer;
                
                // Subtle metalness variation for epsilon ring
                if (ring.userData.ringName === 'ε' && ring.material.metalness !== undefined) {
                    const metallicShimmer = 0.9 + 0.1 * Math.sin(time * 0.3);
                    ring.material.metalness = ring.userData.baseMetalness * 
                                              metallicShimmer * 
                                              DisplaySettings.ringShine;
                }
            }
        });
        
        // Update glow effects
        this.glowMeshes.forEach((glow, index) => {
            if (glow.material && glow.userData.baseOpacity) {
                const glowShimmer = 0.8 + 0.2 * Math.sin(time * 0.15 + index * 0.5);
                glow.material.opacity = glow.userData.baseOpacity * glowShimmer;
            }
        });
    }
    
    /**
     * Update ring materials based on shine setting
     */
    updateMaterials() {
        this.ringMeshes.forEach(ring => {
            if (ring.material && ring.material.metalness !== undefined) {
                ring.material.metalness = ring.userData.baseMetalness * DisplaySettings.ringShine;
                ring.material.roughness = 0.3 + (1 - DisplaySettings.ringShine) * 0.4;
                
                // Update emissive intensity based on shine
                if (ring.material.emissiveIntensity !== undefined) {
                    ring.material.emissiveIntensity = 0.1 + DisplaySettings.ringShine * 0.1;
                }
            }
        });
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
     * Get ring by name
     */
    getRingByName(name) {
        return this.ringMeshes.find(ring => ring.userData.ringName === name);
    }
    
    /**
     * Highlight specific ring
     */
    highlightRing(ringName, highlight = true) {
        const ring = this.getRingByName(ringName);
        if (ring && ring.material) {
            if (highlight) {
                ring.material.emissiveIntensity = 0.5;
                ring.material.opacity = Math.min(1.0, ring.userData.baseOpacity * 1.5);
            } else {
                ring.material.emissiveIntensity = 0.1;
                ring.material.opacity = ring.userData.baseOpacity;
            }
        }
    }
    
    /**
     * Update quality settings
     */
    updateQuality(qualityLevel) {
        const quality = QualityPresets[qualityLevel];
        if (!quality) return;
        
        // Update each ring's geometry with new segment count
        this.ringMeshes.forEach(ring => {
            const ringData = ring.userData.ringData;
            if (ringData) {
                const oldGeometry = ring.geometry;
                const segments = ringData.name === 'ε' ? 
                    Math.max(256, quality.ringSegments) : 
                    quality.ringSegments;
                
                const newGeometry = new THREE.RingGeometry(
                    ringData.innerRadius,
                    ringData.outerRadius,
                    segments,
                    1
                );
                
                ring.geometry = newGeometry;
                oldGeometry.dispose();
            }
        });
    }
    
    /**
     * Get group
     */
    getGroup() {
        return this.group;
    }
    
    /**
     * Get all ring meshes
     */
    getRingMeshes() {
        return this.ringMeshes;
    }
    
    /**
     * Dispose of resources
     */
    dispose() {
        if (this.group) {
            // Dispose ring meshes
            this.ringMeshes.forEach(ring => {
                ring.geometry.dispose();
                ring.material.dispose();
            });
            
            // Dispose glow meshes
            this.glowMeshes.forEach(glow => {
                glow.geometry.dispose();
                glow.material.dispose();
            });
            
            // Remove from scene
            if (this.scene && this.group.parent) {
                this.scene.remove(this.group);
            }
            
            // Clear arrays and references
            this.ringMeshes = [];
            this.glowMeshes = [];
            this.group = null;
        }
    }
}
