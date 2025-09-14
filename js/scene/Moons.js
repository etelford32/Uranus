/**
 * Moons - Uranus moon system with orbital mechanics
 */

import { MOONS_DATA, URANUS_TILT, URANUS_RADIUS } from '../config/constants.js';
import { DisplaySettings, QualityPresets, PerformanceSettings } from '../config/settings.js';
import { calculateOrbitalPosition } from '../utils/OrbitalMechanics.js';

export default class Moons {
    constructor(scene) {
        this.scene = scene;
        this.moonsGroup = null;
        this.orbitsGroup = null;
        this.moonMeshes = {};
        this.orbitLines = {};
        this.labels = {};
        this.moonData = MOONS_DATA;
    }
    
    /**
     * Create moon system and add to scene
     */
    create() {
        // Create groups
        this.moonsGroup = new THREE.Group();
        this.moonsGroup.name = 'Moons';
        
        this.orbitsGroup = new THREE.Group();
        this.orbitsGroup.name = 'Orbits';
        
        // Create each moon
        this.moonData.forEach(moon => {
            this.createMoon(moon);
            this.createOrbit(moon);
            this.createLabel(moon);
        });
        
        // Apply Uranus's tilt to match equatorial plane
        this.moonsGroup.rotation.z = URANUS_TILT;
        this.orbitsGroup.rotation.z = URANUS_TILT;
        
        // Add to scene
        this.scene.add(this.moonsGroup);
        this.scene.add(this.orbitsGroup);
    }
    
    /**
     * Create individual moon
     */
    createMoon(moonData) {
        const quality = QualityPresets[PerformanceSettings.currentQuality];
        const segments = quality.moonSegments || 32;
        
        // Create moon geometry
        const geometry = new THREE.SphereGeometry(
            moonData.radius * DisplaySettings.moonScale,
            segments,
            segments
        );
        
        // Create material
        const material = new THREE.MeshPhongMaterial({
            color: moonData.color,
            emissive: moonData.color,
            emissiveIntensity: 0.05,
            shininess: 10,
            specular: 0x222222
        });
        
        // Create mesh
        const moon = new THREE.Mesh(geometry, material);
        moon.castShadow = true;
        moon.receiveShadow = true;
        moon.name = moonData.name;
        moon.userData = { ...moonData };
        
        // Set initial position
        const position = this.calculateInitialPosition(moonData);
        moon.position.copy(position);
        
        // Add to collection
        this.moonMeshes[moonData.name] = moon;
        this.moonsGroup.add(moon);
    }
    
    /**
     * Calculate initial position for moon
     */
    calculateInitialPosition(moonData) {
        const meanAnomaly = moonData.meanAnomaly || Math.random() * Math.PI * 2;
        const trueAnomaly = meanAnomaly + 2 * moonData.eccentricity * Math.sin(meanAnomaly);
        
        const radius = moonData.distance * (1 - moonData.eccentricity * moonData.eccentricity) / 
                      (1 + moonData.eccentricity * Math.cos(trueAnomaly));
        
        return new THREE.Vector3(
            radius * Math.cos(trueAnomaly) * DisplaySettings.distanceScale,
            radius * Math.sin(moonData.inclination) * Math.sin(trueAnomaly) * DisplaySettings.distanceScale,
            radius * Math.sin(trueAnomaly) * DisplaySettings.distanceScale
        );
    }
    // Add this method to get current moon positions
    getCurrentMoonPositions() {
        const positions = [];
        MOONS_DATA.forEach(moonData => {
            const moon = this.moonMeshes[moonData.name];
            if (moon) {
                positions.push(moon.position.clone());
            }
        });
        return positions;
    }
    /**
     * Create orbital path
     */
    createOrbit(moonData) {
        const orbitPoints = this.generateOrbitPoints(moonData);
        
        const geometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
        const material = new THREE.LineBasicMaterial({
            color: 0x2a6a8a,
            transparent: true,
            opacity: 0.4,
            linewidth: 1
        });
        
        const orbit = new THREE.Line(geometry, material);
        orbit.name = `Orbit_${moonData.name}`;
        
        this.orbitLines[moonData.name] = orbit;
        this.orbitsGroup.add(orbit);
    }
    
    /**
     * Generate orbit points
     */
    generateOrbitPoints(moonData, pointCount = 200) {
        const points = [];
        
        for (let i = 0; i <= pointCount; i++) {
            const angle = (i / pointCount) * Math.PI * 2;
            const r = moonData.distance * (1 - moonData.eccentricity * moonData.eccentricity) / 
                     (1 + moonData.eccentricity * Math.cos(angle));
            
            points.push(new THREE.Vector3(
                r * Math.cos(angle) * DisplaySettings.distanceScale,
                r * Math.sin(moonData.inclination) * Math.sin(angle) * DisplaySettings.distanceScale,
                r * Math.sin(angle) * DisplaySettings.distanceScale
            ));
        }
        
        return points;
    }
    
    /**
     * Create moon label
     */
    createLabel(moonData) {
        // Create canvas for text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        // Draw text
        context.font = 'Bold 28px Arial';
        context.fillStyle = 'rgba(111, 229, 245, 0.9)';
        context.fillText(moonData.name, 10, 40);
        
        // Create texture and sprite
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });
        
        const label = new THREE.Sprite(material);
        label.scale.set(8, 2, 1);
        label.name = `Label_${moonData.name}`;
        
        // Position above moon
        const moon = this.moonMeshes[moonData.name];
        if (moon) {
            label.position.copy(moon.position);
            label.position.y += moonData.radius * DisplaySettings.moonScale + 2;
        }
        
        this.labels[moonData.name] = label;
        this.moonsGroup.add(label);
    }
    
    /**
     * Update moon positions and rotations
     */
    update(deltaTime, timeSpeed, simulationTime) {
        if (!this.moonsGroup) return;
        
        this.moonData.forEach(moonData => {
            const moon = this.moonMeshes[moonData.name];
            if (!moon) return;
            
            // Calculate orbital position
            const position = calculateOrbitalPosition(
                moonData,
                simulationTime,
                DisplaySettings.distanceScale
            );
            
            moon.position.copy(position);
            
            // Tidal locking - moon always faces Uranus
            moon.lookAt(0, 0, 0);
            
            // Update label position
            const label = this.labels[moonData.name];
            if (label && label.visible) {
                label.position.copy(moon.position);
                label.position.y += moonData.radius * DisplaySettings.moonScale + 2;
            }
        });
    }
    
    /**
     * Update moon sizes based on scale setting
     */
    updateSizes() {
        this.moonData.forEach(moonData => {
            const moon = this.moonMeshes[moonData.name];
            if (moon) {
                moon.scale.setScalar(DisplaySettings.moonScale);
                
                // Update label position
                const label = this.labels[moonData.name];
                if (label) {
                    label.position.y = moon.position.y + 
                        moonData.radius * DisplaySettings.moonScale + 2;
                }
            }
        });
    }
    
    /**
     * Update orbital paths based on distance scale
     */
    updateOrbits() {
        // Clear old orbits
        this.orbitsGroup.clear();
        this.orbitLines = {};
        
        // Recreate orbits with new scale
        this.moonData.forEach(moonData => {
            this.createOrbit(moonData);
        });
        
        // Reapply tilt
        this.orbitsGroup.rotation.z = URANUS_TILT;
    }
    
    /**
     * Set moon visibility
     */
    setVisible(visible) {
        if (this.moonsGroup) {
            this.moonsGroup.visible = visible;
        }
    }
    
    /**
     * Set orbit visibility
     */
    setOrbitsVisible(visible) {
        if (this.orbitsGroup) {
            this.orbitsGroup.visible = visible;
        }
    }
    
    /**
     * Set label visibility
     */
    setLabelsVisible(visible) {
        Object.values(this.labels).forEach(label => {
            label.visible = visible;
        });
    }
    
    /**
     * Get moon by name
     */
    getMoonByName(name) {
        return this.moonMeshes[name];
    }
    
    /**
     * Get moon data by index
     */
    getMoonData(index) {
        return this.moonData[index] || null;
    }
    
    /**
     * Highlight moon
     */
    highlightMoon(moonName, highlight = true) {
        const moon = this.moonMeshes[moonName];
        if (moon && moon.material) {
            moon.material.emissiveIntensity = highlight ? 0.3 : 0.05;
            
            // Scale up slightly when highlighted
            const scale = highlight ? 1.2 : 1.0;
            moon.scale.setScalar(DisplaySettings.moonScale * scale);
        }
    }
    
    /**
     * Get moon info for display
     */
    getMoonInfo(moonName) {
        const moonData = this.moonData.find(m => m.name === moonName);
        if (!moonData) return null;
        
        const moon = this.moonMeshes[moonName];
        if (!moon) return null;
        
        return {
            name: moonData.name,
            info: moonData.info,
            distance: moonData.distance / URANUS_RADIUS,
            period: moonData.period / 24, // Convert to days
            position: moon.position.clone()
        };
    }
    
    /**
     * Update quality settings
     */
    updateQuality(qualityLevel) {
        const quality = QualityPresets[qualityLevel];
        if (!quality) return;
        
        // Update each moon's geometry
        this.moonData.forEach(moonData => {
            const moon = this.moonMeshes[moonData.name];
            if (moon) {
                const oldGeometry = moon.geometry;
                const newGeometry = new THREE.SphereGeometry(
                    moonData.radius * DisplaySettings.moonScale,
                    quality.moonSegments,
                    quality.moonSegments
                );
                
                moon.geometry = newGeometry;
                oldGeometry.dispose();
            }
        });
    }
    
    /**
     * Get all moon meshes
     */
    getMoonMeshes() {
        return Object.values(this.moonMeshes);
    }
    
    /**
     * Dispose of resources
     */
    dispose() {
        // Dispose moon meshes
        Object.values(this.moonMeshes).forEach(moon => {
            moon.geometry.dispose();
            moon.material.dispose();
        });
        
        // Dispose orbit lines
        Object.values(this.orbitLines).forEach(orbit => {
            orbit.geometry.dispose();
            orbit.material.dispose();
        });
        
        // Dispose labels
        Object.values(this.labels).forEach(label => {
            label.material.map.dispose();
            label.material.dispose();
        });
        
        // Remove from scene
        if (this.scene) {
            if (this.moonsGroup && this.moonsGroup.parent) {
                this.scene.remove(this.moonsGroup);
            }
            if (this.orbitsGroup && this.orbitsGroup.parent) {
                this.scene.remove(this.orbitsGroup);
            }
        }
        
        // Clear references
        this.moonMeshes = {};
        this.orbitLines = {};
        this.labels = {};
        this.moonsGroup = null;
        this.orbitsGroup = null;
    }
}
