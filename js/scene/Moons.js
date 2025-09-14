/**
 * Moons - Complete Uranus moon system with all 27 moons and orbital mechanics
 */

import { URANUS_TILT, URANUS_RADIUS } from '../config/constants.js';
import { DisplaySettings, QualityPresets, PerformanceSettings } from '../config/settings.js';
import { calculateOrbitalPosition } from '../utils/OrbitalMechanics.js';

// Complete data for all 27 Uranus moons
// Distances converted from km to Uranus radii (25,559 km = 1 Uranus radius)
const ALL_MOONS_DATA = [
    // Inner moons (inside Miranda's orbit)
    {
        name: 'Cordelia',
        radius: 0.020,
        distance: 1.95,  // 49,770 km / 25,559 km
        period: 0.335,   // hours
        eccentricity: 0.0003,
        inclination: 0.08479,
        color: 0x9a8a7a,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'inner',
        info: 'Innermost known moon, shepherd moon for Uranus\'s ε ring'
    },
    {
        name: 'Ophelia',
        radius: 0.021,
        distance: 2.10,  // 53,760 km / 25,559 km
        period: 0.376,
        eccentricity: 0.0099,
        inclination: 0.1036,
        color: 0x9a8a7a,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'inner',
        info: 'Outer shepherd moon for Uranus\'s ε ring'
    },
    {
        name: 'Bianca',
        radius: 0.026,
        distance: 2.31,  // 59,170 km / 25,559 km
        period: 0.435,
        eccentricity: 0.0009,
        inclination: 0.193,
        color: 0xa59585,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'inner',
        info: 'Small inner moon discovered by Voyager 2'
    },
    {
        name: 'Cressida',
        radius: 0.040,
        distance: 2.42,  // 61,780 km / 25,559 km
        period: 0.464,
        eccentricity: 0.0004,
        inclination: 0.006,
        color: 0xa59585,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'inner',
        info: 'Inner moon named after character from Troilus and Cressida'
    },
    {
        name: 'Desdemona',
        radius: 0.032,
        distance: 2.45,  // 62,680 km / 25,559 km
        period: 0.474,
        eccentricity: 0.0001,
        inclination: 0.11,
        color: 0xa59585,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'inner',
        info: 'Named after character from Othello'
    },
    {
        name: 'Juliet',
        radius: 0.047,
        distance: 2.52,  // 64,350 km / 25,559 km
        period: 0.493,
        eccentricity: 0.0007,
        inclination: 0.065,
        color: 0xa59585,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'inner',
        info: 'Named after character from Romeo and Juliet'
    },
    {
        name: 'Portia',
        radius: 0.068,
        distance: 2.59,  // 66,090 km / 25,559 km
        period: 0.513,
        eccentricity: 0.0001,
        inclination: 0.059,
        color: 0xa59585,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'inner',
        info: 'Largest of the inner moons, discovered by Voyager 2'
    },
    {
        name: 'Rosalind',
        radius: 0.036,
        distance: 2.74,  // 69,940 km / 25,559 km
        period: 0.558,
        eccentricity: 0.0001,
        inclination: 0.279,
        color: 0xa59585,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'inner',
        info: 'Named after character from As You Like It'
    },
    {
        name: 'Cupid',
        radius: 0.009,
        distance: 2.91,  // 74,390 km / 25,559 km
        period: 0.613,
        eccentricity: 0.0013,
        inclination: 0.099,
        color: 0x9a8a7a,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'inner',
        info: 'Small inner moon discovered in 2003'
    },
    {
        name: 'Belinda',
        radius: 0.040,
        distance: 2.94,  // 75,260 km / 25,559 km
        period: 0.624,
        eccentricity: 0.0001,
        inclination: 0.031,
        color: 0xa59585,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'inner',
        info: 'Named after character from The Rape of the Lock'
    },
    {
        name: 'Perdita',
        radius: 0.015,
        distance: 2.99,  // 76,420 km / 25,559 km
        period: 0.638,
        eccentricity: 0.0116,
        inclination: 0.47,
        color: 0x9a8a7a,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'inner',
        info: 'Originally discovered in 1986, confirmed in 1999'
    },
    {
        name: 'Puck',
        radius: 0.081,
        distance: 3.36,  // 86,010 km / 25,559 km
        period: 0.762,
        eccentricity: 0.0001,
        inclination: 0.319,
        color: 0xb0a090,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'inner',
        info: 'Largest inner moon, discovered by Voyager 2'
    },
    {
        name: 'Mab',
        radius: 0.012,
        distance: 3.82,  // 97,736 km / 25,559 km
        period: 0.923,
        eccentricity: 0.0025,
        inclination: 0.134,
        color: 0x9a8a7a,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'inner',
        info: 'Source of μ (mu) ring, discovered in 2003'
    },
    
    // Major moons (the big five)
    {
        name: 'Miranda',
        radius: 0.236,
        distance: 5.08,  // 129,900 km / 25,559 km
        period: 33.923,  // 1.413 days * 24 hours
        eccentricity: 0.0013,
        inclination: 4.232,
        color: 0xc8b8a8,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'major',
        info: 'Smallest and innermost major moon, extreme geological features'
    },
    {
        name: 'Ariel',
        radius: 0.579,
        distance: 7.47,  // 190,900 km / 25,559 km
        period: 60.489,  // 2.520 days * 24 hours
        eccentricity: 0.0012,
        inclination: 0.041,
        color: 0xd4c4b4,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'major',
        info: 'Brightest moon of Uranus, youngest surface'
    },
    {
        name: 'Umbriel',
        radius: 0.585,
        distance: 10.41,  // 266,000 km / 25,559 km
        period: 99.460,   // 4.144 days * 24 hours
        eccentricity: 0.0039,
        inclination: 0.128,
        color: 0x7a6a5a,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'major',
        info: 'Darkest of the major moons, ancient cratered surface'
    },
    {
        name: 'Titania',
        radius: 0.789,
        distance: 17.07,  // 436,300 km / 25,559 km
        period: 208.941,  // 8.706 days * 24 hours
        eccentricity: 0.0011,
        inclination: 0.079,
        color: 0xb8a898,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'major',
        info: 'Largest moon of Uranus, extensive canyon systems'
    },
    {
        name: 'Oberon',
        radius: 0.761,
        distance: 22.83,  // 583,500 km / 25,559 km
        period: 323.118,  // 13.463 days * 24 hours
        eccentricity: 0.0014,
        inclination: 0.068,
        color: 0xa89888,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'major',
        info: 'Outermost major moon, heavily cratered surface'
    },
    
    // Irregular moons (retrograde and distant) - scaled distances
    {
        name: 'Francisco',
        radius: 0.011,
        distance: 167.3,  // 4,276,000 km / 25,559 km
        period: -6397.44,  // -266.56 days * 24 hours (retrograde)
        eccentricity: 0.146,
        inclination: 145.2,
        color: 0x6a5a4a,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'irregular',
        info: 'Small retrograde irregular moon'
    },
    {
        name: 'Caliban',
        radius: 0.036,
        distance: 282.9,  // 7,231,000 km / 25,559 km
        period: -13913.52,  // -579.73 days * 24 hours
        eccentricity: 0.159,
        inclination: 141.9,
        color: 0x8a6050,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'irregular',
        info: 'Second largest irregular moon, reddish color'
    },
    {
        name: 'Stephano',
        radius: 0.016,
        distance: 313.2,  // 8,004,000 km / 25,559 km
        period: -16256.64,  // -677.36 days * 24 hours
        eccentricity: 0.229,
        inclination: 144.1,
        color: 0x6a5a4a,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'irregular',
        info: 'Retrograde irregular moon'
    },
    {
        name: 'Trinculo',
        radius: 0.009,
        distance: 332.8,  // 8,504,000 km / 25,559 km
        period: -17981.76,  // -749.24 days * 24 hours
        eccentricity: 0.220,
        inclination: 167.0,
        color: 0x6a5a4a,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'irregular',
        info: 'Small retrograde moon with high inclination'
    },
    {
        name: 'Sycorax',
        radius: 0.075,
        distance: 476.6,  // 12,179,000 km / 25,559 km
        period: -30919.2,  // -1288.3 days * 24 hours
        eccentricity: 0.522,
        inclination: 159.4,
        color: 0x9a6050,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'irregular',
        info: 'Largest irregular moon of Uranus'
    },
    {
        name: 'Margaret',
        radius: 0.010,
        distance: 561.4,  // 14,345,000 km / 25,559 km
        period: 40488.24,  // 1687.01 days * 24 hours (prograde)
        eccentricity: 0.661,
        inclination: 56.6,
        color: 0x6a5a4a,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'irregular',
        info: 'Only prograde irregular moon'
    },
    {
        name: 'Prospero',
        radius: 0.025,
        distance: 636.0,  // 16,256,000 km / 25,559 km
        period: -47479.2,  // -1978.3 days * 24 hours
        eccentricity: 0.445,
        inclination: 152.0,
        color: 0x7a5a4a,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'irregular',
        info: 'Distant retrograde moon'
    },
    {
        name: 'Setebos',
        radius: 0.024,
        distance: 681.5,  // 17,418,000 km / 25,559 km
        period: -53404.8,  // -2225.2 days * 24 hours
        eccentricity: 0.591,
        inclination: 158.2,
        color: 0x7a5a4a,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'irregular',
        info: 'Distant retrograde moon discovered in 1999'
    },
    {
        name: 'Ferdinand',
        radius: 0.010,
        distance: 817.8,  // 20,901,000 km / 25,559 km
        period: -69292.8,  // -2887.2 days * 24 hours
        eccentricity: 0.368,
        inclination: 169.8,
        color: 0x6a5a4a,
        meanAnomaly: Math.random() * Math.PI * 2,
        type: 'irregular',
        info: 'Most distant known moon of Uranus'
    }
];

export default class Moons {
    constructor(scene) {
        this.scene = scene;
        this.moonsGroup = null;
        this.orbitsGroup = null;
        this.moonMeshes = {};
        this.orbitLines = {};
        this.labels = {};
        this.moonData = ALL_MOONS_DATA;
        this.visibilitySettings = {
            inner: true,
            major: true,
            irregular: true
        };
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
        
        // Create sub-groups for different moon types
        this.innerMoonsGroup = new THREE.Group();
        this.innerMoonsGroup.name = 'InnerMoons';
        
        this.majorMoonsGroup = new THREE.Group();
        this.majorMoonsGroup.name = 'MajorMoons';
        
        this.irregularMoonsGroup = new THREE.Group();
        this.irregularMoonsGroup.name = 'IrregularMoons';
        
        // Create each moon
        this.moonData.forEach(moon => {
            this.createMoon(moon);
            this.createOrbit(moon);
            this.createLabel(moon);
        });
        
        // Add sub-groups to main group
        this.moonsGroup.add(this.innerMoonsGroup);
        this.moonsGroup.add(this.majorMoonsGroup);
        this.moonsGroup.add(this.irregularMoonsGroup);
        
        // Apply Uranus's tilt to match equatorial plane
        this.moonsGroup.rotation.z = URANUS_TILT;
        this.orbitsGroup.rotation.z = URANUS_TILT;
        
        // Add to scene
        this.scene.add(this.moonsGroup);
        this.scene.add(this.orbitsGroup);
        
        console.log(`Created ${Object.keys(this.moonMeshes).length} moons`);
    }
    
    /**
     * Create individual moon
     */
    createMoon(moonData) {
        const quality = QualityPresets[PerformanceSettings.currentQuality];
        const segments = moonData.type === 'major' ? 
            quality.moonSegments : 
            Math.max(16, quality.moonSegments / 2);
        
        // Adjust size for visibility (scale up small moons)
        let displayRadius = moonData.radius * DisplaySettings.moonScale;
        if (moonData.type === 'inner') {
            displayRadius = Math.max(displayRadius * 2, 0.3);
        } else if (moonData.type === 'irregular') {
            displayRadius = Math.max(displayRadius * 3, 0.4);
        }
        
        // Scale the radius for 3D display
        displayRadius *= URANUS_RADIUS * 0.1; // Scale factor for visibility
        
        // Create moon geometry
        const geometry = new THREE.SphereGeometry(
            displayRadius,
            segments,
            segments
        );
        
        // Create material with different properties for different moon types
        const materialProps = {
            color: moonData.color,
            emissive: moonData.color,
            emissiveIntensity: moonData.type === 'major' ? 0.05 : 0.1,
            shininess: moonData.type === 'major' ? 20 : 10,
            specular: moonData.type === 'major' ? 0x333333 : 0x222222
        };
        
        const material = new THREE.MeshPhongMaterial(materialProps);
        
        // Create mesh
        const moon = new THREE.Mesh(geometry, material);
        moon.castShadow = moonData.type === 'major';
        moon.receiveShadow = moonData.type === 'major';
        moon.name = moonData.name;
        moon.userData = { ...moonData };
        
        // Set initial position
        const position = this.calculateInitialPosition(moonData);
        moon.position.copy(position);
        
        // Add to appropriate group
        switch (moonData.type) {
            case 'inner':
                this.innerMoonsGroup.add(moon);
                break;
            case 'major':
                this.majorMoonsGroup.add(moon);
                break;
            case 'irregular':
                this.irregularMoonsGroup.add(moon);
                break;
        }
        
        // Add to collection
        this.moonMeshes[moonData.name] = moon;
    }
    
    /**
     * Calculate initial position for moon
     */
    calculateInitialPosition(moonData) {
        const meanAnomaly = moonData.meanAnomaly || Math.random() * Math.PI * 2;
        const trueAnomaly = meanAnomaly + 2 * moonData.eccentricity * Math.sin(meanAnomaly);
        
        // Use the corrected distance (already in Uranus radii)
        const radius = moonData.distance * URANUS_RADIUS * (1 - moonData.eccentricity * moonData.eccentricity) / 
                      (1 + moonData.eccentricity * Math.cos(trueAnomaly));
        
        // Convert inclination to radians
        const inclinationRad = (moonData.inclination * Math.PI) / 180;
        
        // Calculate 3D position
        const x = radius * Math.cos(trueAnomaly);
        const y = radius * Math.sin(trueAnomaly);
        
        // Apply inclination for 3D orbit
        const position = new THREE.Vector3(
            x * DisplaySettings.distanceScale,
            y * Math.sin(inclinationRad) * DisplaySettings.distanceScale,
            y * Math.cos(inclinationRad) * DisplaySettings.distanceScale
        );
        
        return position;
    }
    
    /**
     * Create orbital path with 3D visualization
     */
    createOrbit(moonData) {
        const orbitPoints = this.generateOrbitPoints(moonData);
        
        const geometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
        
        // Different colors for different moon types
        let orbitColor = 0x2a6a8a;
        let opacity = 0.4;
        
        switch (moonData.type) {
            case 'inner':
                orbitColor = 0x4080a0;
                opacity = 0.3;
                break;
            case 'major':
                orbitColor = 0x6fa5c5;
                opacity = 0.5;
                break;
            case 'irregular':
                orbitColor = 0x806050;
                opacity = 0.25;
                break;
        }
        
        const material = new THREE.LineBasicMaterial({
            color: orbitColor,
            transparent: true,
            opacity: opacity,
            linewidth: moonData.type === 'major' ? 2 : 1
        });
        
        const orbit = new THREE.Line(geometry, material);
        orbit.name = `Orbit_${moonData.name}`;
        orbit.userData = { type: moonData.type };
        
        this.orbitLines[moonData.name] = orbit;
        this.orbitsGroup.add(orbit);
    }
    
    /**
     * Generate 3D orbit points
     */
    generateOrbitPoints(moonData, pointCount = 200) {
        const points = [];
        
        // Convert inclination to radians
        const inclinationRad = (moonData.inclination * Math.PI) / 180;
        
        // For retrograde orbits (negative period)
        const isRetrograde = moonData.period < 0;
        
        for (let i = 0; i <= pointCount; i++) {
            const angle = (i / pointCount) * Math.PI * 2;
            const adjustedAngle = isRetrograde ? -angle : angle;
            
            // Use the corrected distance (already in Uranus radii)
            const r = moonData.distance * URANUS_RADIUS * (1 - moonData.eccentricity * moonData.eccentricity) / 
                     (1 + moonData.eccentricity * Math.cos(angle));
            
            const x = r * Math.cos(adjustedAngle);
            const y = r * Math.sin(adjustedAngle);
            
            // Apply inclination for 3D orbit
            points.push(new THREE.Vector3(
                x * DisplaySettings.distanceScale,
                y * Math.sin(inclinationRad) * DisplaySettings.distanceScale,
                y * Math.cos(inclinationRad) * DisplaySettings.distanceScale
            ));
        }
        
        return points;
    }
    
    /**
     * Create moon label
     */
    createLabel(moonData) {
        // Only create labels for major moons by default
        if (moonData.type !== 'major') return;
        
        // Create canvas for text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        // Draw text
        context.font = 'Bold 24px Arial';
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
        if (!this.moonsGroup) {
            console.warn('Moons group not initialized');
            return;
        }
        
        this.moonData.forEach(moonData => {
            const moon = this.moonMeshes[moonData.name];
            if (!moon) {
                console.warn(`Moon mesh not found: ${moonData.name}`);
                return;
            }
            
            try {
                // Calculate orbital position with corrected distance
                const orbitalData = {
                    ...moonData,
                    distance: moonData.distance * URANUS_RADIUS  // Convert to scene units
                };
                
                const position = calculateOrbitalPosition(
                    orbitalData,
                    simulationTime,
                    DisplaySettings.distanceScale
                );
                
                moon.position.copy(position);
                
                // Tidal locking - moon always faces Uranus
                moon.lookAt(0, 0, 0);
                
                // Update label position if it exists
                const label = this.labels[moonData.name];
                if (label && label.visible) {
                    label.position.copy(moon.position);
                    label.position.y += moonData.radius * DisplaySettings.moonScale * URANUS_RADIUS * 0.1 + 2;
                }
            } catch (error) {
                console.error(`Error updating moon ${moonData.name}:`, error);
            }
        });
    }
    
    // === Additional Helper Methods ===
    
    /**
     * Get moon by index
     */
    getMoonByIndex(index) {
        if (index < 0 || index >= this.moonData.length) return null;
        const moonData = this.moonData[index];
        return this.moonMeshes[moonData.name];
    }
    
    /**
     * Get moon data by index
     */
    getMoonDataByIndex(index) {
        if (index < 0 || index >= this.moonData.length) return null;
        return this.moonData[index];
    }
    
    /**
     * Debug method to check moon system
     */
    debugMoons() {
        console.log('Moon System Debug:');
        console.log(`- Moons group visible: ${this.moonsGroup?.visible}`);
        console.log(`- Orbits group visible: ${this.orbitsGroup?.visible}`);
        console.log(`- Number of moons: ${this.moonData.length}`);
        console.log(`- Created moon meshes: ${Object.keys(this.moonMeshes).length}`);
        
        // Check each moon
        this.moonData.forEach((moonData, index) => {
            const moon = this.moonMeshes[moonData.name];
            if (moon) {
                console.log(`- Moon ${index} (${moonData.name}):`, {
                    visible: moon.visible,
                    position: moon.position.clone(),
                    scale: moon.scale.x,
                    period: moonData.period,
                    distance: moonData.distance
                });
            } else {
                console.error(`- Moon ${index} (${moonData.name}): MISSING MESH`);
            }
        });
        
        // Check visibility settings
        console.log('Visibility settings:', this.visibilitySettings);
    }
    
    /**
     * Get orbital parameters for a specific moon
     */
    getOrbitalParameters(moonName) {
        const moonData = this.moonData.find(m => m.name === moonName);
        if (!moonData) return null;
        
        const moon = this.moonMeshes[moonName];
        if (!moon) return null;
        
        // Calculate current orbital phase
        const angle = Math.atan2(moon.position.z, moon.position.x);
        const radius = Math.sqrt(moon.position.x ** 2 + moon.position.z ** 2);
        
        return {
            name: moonData.name,
            semiMajorAxis: moonData.distance,
            period: Math.abs(moonData.period),
            eccentricity: moonData.eccentricity,
            inclination: moonData.inclination,
            currentRadius: radius,
            currentAngle: angle * 180 / Math.PI,
            isRetrograde: moonData.period < 0
        };
    }
    
    /**
     * Get all orbital parameters
     */
    getAllOrbitalParameters() {
        return this.moonData.map(moon => this.getOrbitalParameters(moon.name)).filter(p => p !== null);
    }
    
    // === Existing Methods Continue Below ===
    
    /**
     * Set visibility by moon type
     */
    setTypeVisibility(type, visible) {
        this.visibilitySettings[type] = visible;
        
        switch (type) {
            case 'inner':
                this.innerMoonsGroup.visible = visible;
                break;
            case 'major':
                this.majorMoonsGroup.visible = visible;
                break;
            case 'irregular':
                this.irregularMoonsGroup.visible = visible;
                break;
        }
        
        // Update orbit visibility
        Object.entries(this.orbitLines).forEach(([name, orbit]) => {
            if (orbit.userData.type === type) {
                orbit.visible = visible;
            }
        });
    }
    
    /**
     * Get current moon positions
     */
    getCurrentMoonPositions() {
        const positions = [];
        this.moonData.forEach(moonData => {
            const moon = this.moonMeshes[moonData.name];
            if (moon) {
                positions.push({
                    name: moonData.name,
                    position: moon.position.clone(),
                    type: moonData.type
                });
            }
        });
        return positions;
    }
    
    /**
     * Update moon sizes based on scale setting
     */
    updateSizes() {
        this.moonData.forEach(moonData => {
            const moon = this.moonMeshes[moonData.name];
            if (moon) {
                let scale = DisplaySettings.moonScale;
                // Ensure minimum visibility for small moons
                if (moonData.type === 'inner') {
                    scale = Math.max(scale * 2, 0.5);
                } else if (moonData.type === 'irregular') {
                    scale = Math.max(scale * 3, 0.5);
                }
                moon.scale.setScalar(scale);
                
                // Update label position if it exists
                const label = this.labels[moonData.name];
                if (label) {
                    label.position.y = moon.position.y + 
                        moonData.radius * scale * URANUS_RADIUS * 0.1 + 2;
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
        
        // Restore visibility settings
        Object.entries(this.visibilitySettings).forEach(([type, visible]) => {
            if (!visible) {
                this.setTypeVisibility(type, false);
            }
        });
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
     * Get moons by type
     */
    getMoonsByType(type) {
        return this.moonData
            .filter(moon => moon.type === type)
            .map(moon => this.moonMeshes[moon.name])
            .filter(mesh => mesh !== undefined);
    }
    
    /**
     * Highlight moon
     */
    highlightMoon(moonName, highlight = true) {
        const moon = this.moonMeshes[moonName];
        if (moon && moon.material) {
            const moonData = this.moonData.find(m => m.name === moonName);
            moon.material.emissiveIntensity = highlight ? 0.3 : 
                (moonData.type === 'major' ? 0.05 : 0.1);
            
            // Scale up slightly when highlighted
            let baseScale = DisplaySettings.moonScale;
            if (moonData.type === 'inner') {
                baseScale = Math.max(baseScale * 2, 0.5);
            } else if (moonData.type === 'irregular') {
                baseScale = Math.max(baseScale * 3, 0.5);
            }
            const scale = highlight ? baseScale * 1.5 : baseScale;
            moon.scale.setScalar(scale);
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
            type: moonData.type,
            info: moonData.info,
            radius: moonData.radius,
            distance: moonData.distance,  // Already in Uranus radii
            period: Math.abs(moonData.period) / 24, // Convert to days
            eccentricity: moonData.eccentricity,
            inclination: moonData.inclination,
            retrograde: moonData.period < 0,
            position: moon.position.clone()
        };
    }
    
    /**
     * Get statistics about moon system
     */
    getSystemStats() {
        return {
            totalMoons: this.moonData.length,
            innerMoons: this.moonData.filter(m => m.type === 'inner').length,
            majorMoons: this.moonData.filter(m => m.type === 'major').length,
            irregularMoons: this.moonData.filter(m => m.type === 'irregular').length,
            retrogradeMoons: this.moonData.filter(m => m.period < 0).length
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
                const segments = moonData.type === 'major' ? 
                    quality.moonSegments : 
                    Math.max(16, quality.moonSegments / 2);
                
                let displayRadius = moonData.radius * DisplaySettings.moonScale;
                if (moonData.type === 'inner') {
                    displayRadius = Math.max(displayRadius * 2, 0.3);
                } else if (moonData.type === 'irregular') {
                    displayRadius = Math.max(displayRadius * 3, 0.4);
                }
                displayRadius *= URANUS_RADIUS * 0.1;
                
                const newGeometry = new THREE.SphereGeometry(
                    displayRadius,
                    segments,
                    segments
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
        this.innerMoonsGroup = null;
        this.majorMoonsGroup = null;
        this.irregularMoonsGroup = null;
    }
}
