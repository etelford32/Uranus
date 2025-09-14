/**
 * Rings - Fixed and optimized Uranus ring system with proper rendering
 */

import { RINGS_DATA, URANUS_TILT, COLORS, URANUS_RADIUS, MOONS_DATA } from '../config/constants.js';
import { DisplaySettings, QualityPresets, PerformanceSettings, SimulationState } from '../config/settings.js';

export default class Rings {
    constructor(scene) {
        this.scene = scene;
        this.group = null;
        this.ringMeshes = [];
        this.glowMeshes = [];
        this.densityWaves = [];
        this.moonResonances = new Map();
        this.time = 0;
        
        // Physical simulation parameters
        this.gravitationalConstant = 6.67430e-11;
        this.uranusMass = 8.681e25;
        this.ringParticleSize = 0.2;
        
        // Shader uniforms
        this.shaderUniforms = {
            time: { value: 0 },
            sunPosition: { value: new THREE.Vector3(1000, 500, 1000) },
            cameraPosition: { value: new THREE.Vector3(0, 0, 100) },
            moonPositions: { value: [] },
            moonMasses: { value: [] },
            moonCount: { value: 0 }, // Start with 0
            densityWaveAmplitude: { value: 0.05 },
            densityWaveFrequency: { value: 10.0 },
            backscatterStrength: { value: 0.3 },
            forwardScatterStrength: { value: 0.5 }
        };
        
        // Use simpler rendering initially
        this.useAdvancedShaders = false;
    }
    
    /**
     * Create ring system and add to scene
     */
    create() {
        // Create group to hold all rings
        this.group = new THREE.Group();
        this.group.name = 'RingSystem';
        
        // Initialize moon data for gravitational calculations
        this.initializeMoonData();
        
        // Determine shader complexity based on quality settings
        const quality = QualityPresets[PerformanceSettings.currentQuality] || QualityPresets.medium;
        this.useAdvancedShaders = quality.ringSegments > 128;
        
        // Create each ring
        RINGS_DATA.forEach(ringData => {
            if (this.useAdvancedShaders) {
                this.createEnhancedRing(ringData);
            } else {
                this.createSimpleRing(ringData);
            }
        });
        
        // Calculate resonance locations
        this.calculateResonances();
        
        // Apply Uranus's tilt to the ring system
        this.group.rotation.z = URANUS_TILT;
        
        // Add to scene
        this.scene.add(this.group);
        
        console.log(`Created ${this.ringMeshes.length} rings with ${this.useAdvancedShaders ? 'advanced' : 'simple'} shaders`);
    }
    
    /**
     * Initialize moon data for gravitational calculations
     */
    initializeMoonData() {
        const moonPositions = [];
        const moonMasses = [];
        
        MOONS_DATA.forEach(moon => {
            moonPositions.push(new THREE.Vector3(moon.distance, 0, 0));
            const massScale = Math.pow(moon.radius, 3) * 1e20;
            moonMasses.push(massScale);
        });
        
        this.shaderUniforms.moonPositions.value = moonPositions;
        this.shaderUniforms.moonMasses.value = moonMasses;
        this.shaderUniforms.moonCount.value = MOONS_DATA.length;
    }
    
    /**
     * Create simple ring (fallback for performance or debugging)
     */
    createSimpleRing(ringData) {
        const quality = QualityPresets[PerformanceSettings.currentQuality] || QualityPresets.medium;
        const segments = Math.min(ringData.segments || quality.ringSegments || 128, 256);
        
        // Create ring geometry
        const geometry = new THREE.RingGeometry(
            ringData.innerRadius,
            ringData.outerRadius,
            segments,
            8
        );
        
        // Determine ring color
        let ringColor;
        if (ringData.name === 'ε') {
            ringColor = COLORS.rings.epsilon || 0xcccccc;
        } else if (ringData.name === 'μ' || ringData.name === 'ν') {
            ringColor = COLORS.rings.outer?.mu || 0xaaaaaa;
        } else {
            ringColor = COLORS.rings.main || 0xb0b0b0;
        }
        
        // Create simple material with transparency
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(ringColor),
            transparent: true,
            opacity: ringData.opacity * 0.8, // Increase visibility
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        // Create mesh
        const ringMesh = new THREE.Mesh(geometry, material);
        ringMesh.rotation.x = -Math.PI / 2; // Align rings horizontally
        ringMesh.name = `Ring_${ringData.name}`;
        
        // Store properties
        ringMesh.userData = {
            baseOpacity: ringData.opacity,
            ringName: ringData.name,
            ringData: ringData,
            innerRadius: ringData.innerRadius,
            outerRadius: ringData.outerRadius,
            isSimple: true
        };
        
        this.ringMeshes.push(ringMesh);
        this.group.add(ringMesh);
        
        // Add simple glow for major rings
        if (this.shouldHaveGlow(ringData.name)) {
            this.createSimpleRingGlow(ringData);
        }
    }
    
    /**
     * Create enhanced ring with advanced shaders (fixed version)
     */
    createEnhancedRing(ringData) {
        const quality = QualityPresets[PerformanceSettings.currentQuality] || QualityPresets.medium;
        const segments = Math.min(ringData.segments || quality.ringSegments || 256, 512);
        
        // Create ring geometry
        const geometry = new THREE.RingGeometry(
            ringData.innerRadius,
            ringData.outerRadius,
            segments,
            16
        );
        
        // Create shader material with fixed shaders
        const material = this.createFixedRingShader(ringData);
        
        // Create mesh
        const ringMesh = new THREE.Mesh(geometry, material);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.name = `Ring_${ringData.name}`;
        
        // Store properties
        ringMesh.userData = {
            baseOpacity: ringData.opacity,
            ringName: ringData.name,
            ringData: ringData,
            innerRadius: ringData.innerRadius,
            outerRadius: ringData.outerRadius,
            orbitalPeriod: this.calculateOrbitalPeriod(
                (ringData.innerRadius + ringData.outerRadius) / 2
            ),
            isSimple: false
        };
        
        this.ringMeshes.push(ringMesh);
        this.group.add(ringMesh);
        
        // Add enhanced glow for major rings
        if (this.shouldHaveGlow(ringData.name)) {
            this.createEnhancedRingGlow(ringData);
        }
    }
    
    /**
     * Create fixed ring shader that actually renders
     */
    createFixedRingShader(ringData) {
        // Determine ring color
        let ringColor;
        if (ringData.name === 'ε') {
            ringColor = new THREE.Color(COLORS.rings.epsilon || 0xcccccc);
        } else if (ringData.name === 'μ' || ringData.name === 'ν') {
            ringColor = new THREE.Color(COLORS.rings.outer?.mu || 0xaaaaaa);
        } else {
            ringColor = new THREE.Color(COLORS.rings.main || 0xb0b0b0);
        }
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                innerRadius: { value: ringData.innerRadius },
                outerRadius: { value: ringData.outerRadius },
                baseOpacity: { value: ringData.opacity },
                ringColor: { value: ringColor },
                sunPosition: { value: new THREE.Vector3(1000, 500, 1000) },
                cameraPosition: { value: new THREE.Vector3(0, 0, 100) },
                moonCount: { value: 0 },
                densityWaveAmplitude: { value: 0.05 },
                epsilonRing: { value: ringData.name === 'ε' ? 1.0 : 0.0 }
            },
            vertexShader: `
                uniform float time;
                uniform float densityWaveAmplitude;
                
                varying vec3 vPosition;
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                varying float vDensity;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    
                    // Simple density calculation based on position
                    float r = length(position.xy);
                    vDensity = 1.0;
                    
                    // Add simple spiral density waves
                    float angle = atan(position.y, position.x);
                    float spiralWave = sin(angle * 3.0 + r * 10.0 - time);
                    vDensity += spiralWave * densityWaveAmplitude;
                    
                    // Small vertical displacement for visual interest
                    vec3 displaced = position;
                    displaced.z += sin(angle * 5.0 + time) * 0.01;
                    
                    vWorldPosition = (modelMatrix * vec4(displaced, 1.0)).xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 sunPosition;
                uniform vec3 cameraPosition;
                uniform float innerRadius;
                uniform float outerRadius;
                uniform float baseOpacity;
                uniform vec3 ringColor;
                uniform float epsilonRing;
                
                varying vec3 vPosition;
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                varying float vDensity;
                
                void main() {
                    // Calculate radial distance
                    float r = length(vPosition.xy);
                    
                    // Smooth ring edges
                    float innerEdge = smoothstep(innerRadius - 0.02, innerRadius + 0.02, r);
                    float outerEdge = 1.0 - smoothstep(outerRadius - 0.02, outerRadius + 0.02, r);
                    float edgeFade = innerEdge * outerEdge;
                    
                    // Early discard for performance
                    if(edgeFade < 0.01) discard;
                    
                    // Calculate simple lighting
                    vec3 lightDir = normalize(sunPosition - vWorldPosition);
                    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                    
                    // Simple backscattering effect
                    float backscatter = max(0.0, dot(viewDir, lightDir));
                    backscatter = pow(backscatter, 2.0) * 0.3;
                    
                    // Base ring color with simple lighting
                    vec3 color = ringColor;
                    color += vec3(0.2) * backscatter;
                    
                    // Add subtle color variation
                    float colorVar = sin(r * 50.0 + time * 0.5) * 0.1 + 1.0;
                    color *= colorVar;
                    
                    // Add sparkles for epsilon ring
                    if(epsilonRing > 0.5) {
                        float sparkle = fract(sin(dot(vPosition.xy, vec2(12.9898, 78.233))) * 43758.5453);
                        sparkle = pow(sparkle, 20.0);
                        color += vec3(sparkle * 0.5);
                    }
                    
                    // Apply density variations
                    float density = clamp(vDensity, 0.5, 1.5);
                    
                    // Calculate final opacity
                    float opacity = baseOpacity * edgeFade * density;
                    
                    // Viewing angle affects opacity
                    float viewAngle = abs(dot(viewDir, vec3(0.0, 0.0, 1.0)));
                    opacity *= mix(0.5, 1.0, viewAngle);
                    
                    // Make sure opacity is visible
                    opacity = max(opacity, baseOpacity * 0.3);
                    
                    gl_FragColor = vec4(color, opacity);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            // Use normal blending instead of additive for better visibility
            blending: THREE.NormalBlending
        });
        
        return material;
    }
    
    /**
     * Create simple ring glow (for performance)
     */
    createSimpleRingGlow(ringData) {
        const glowGeometry = new THREE.RingGeometry(
            ringData.innerRadius - 0.5,
            ringData.outerRadius + 0.5,
            64,
            1
        );
        
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: ringData.name === 'ε' ? (COLORS.rings.glow || 0x4499ff) : 0x808080,
            transparent: true,
            opacity: ringData.name === 'ε' ? 0.2 : 0.1,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.rotation.x = -Math.PI / 2;
        glowMesh.name = `RingGlow_${ringData.name}`;
        glowMesh.userData.baseOpacity = glowMaterial.opacity;
        
        this.glowMeshes.push(glowMesh);
        this.group.add(glowMesh);
    }
    
    /**
     * Create enhanced ring glow with shader
     */
    createEnhancedRingGlow(ringData) {
        const glowGeometry = new THREE.RingGeometry(
            ringData.innerRadius - 0.2,
            ringData.outerRadius + 0.2,
            128,
            1
        );
        
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(
                    ringData.name === 'ε' ? (COLORS.rings.glow || 0x4499ff) : 0x808080
                )},
                baseOpacity: { value: ringData.name === 'ε' ? 0.25 : 0.15 },
                innerRadius: { value: ringData.innerRadius },
                outerRadius: { value: ringData.outerRadius }
            },
            vertexShader: `
                varying vec3 vPosition;
                void main() {
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                uniform float baseOpacity;
                uniform float innerRadius;
                uniform float outerRadius;
                varying vec3 vPosition;
                
                void main() {
                    float r = length(vPosition.xy);
                    
                    // Glow falloff from edges
                    float innerGlow = 1.0 - smoothstep(innerRadius - 0.5, innerRadius, r);
                    float outerGlow = smoothstep(outerRadius, outerRadius + 0.5, r);
                    float glow = max(innerGlow, outerGlow);
                    
                    // Pulsing effect
                    float pulse = sin(time * 2.0 + r * 5.0) * 0.3 + 0.7;
                    
                    // Final opacity
                    float opacity = baseOpacity * glow * pulse;
                    
                    gl_FragColor = vec4(color, opacity);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.rotation.x = -Math.PI / 2;
        glowMesh.name = `RingGlow_${ringData.name}`;
        glowMesh.userData.baseOpacity = glowMaterial.uniforms.baseOpacity.value;
        
        this.glowMeshes.push(glowMesh);
        this.group.add(glowMesh);
    }
    
    /**
     * Calculate orbital period for ring particles
     */
    calculateOrbitalPeriod(radius) {
        const a = radius * URANUS_RADIUS * 1000;
        const GM = this.gravitationalConstant * this.uranusMass;
        return 2 * Math.PI * Math.sqrt((a * a * a) / GM) / 3600;
    }
    
    /**
     * Calculate resonance locations with moons
     */
    calculateResonances() {
        MOONS_DATA.forEach(moon => {
            const resonances = [
                { ratio: '2:1', location: moon.distance * Math.pow(0.5, 2/3) },
                { ratio: '3:2', location: moon.distance * Math.pow(2/3, 2/3) },
                { ratio: '4:3', location: moon.distance * Math.pow(3/4, 2/3) },
                { ratio: '5:4', location: moon.distance * Math.pow(4/5, 2/3) }
            ];
            
            this.moonResonances.set(moon.name, resonances);
            
            resonances.forEach(res => {
                if(res.ratio === '2:1' || res.ratio === '3:2') {
                    this.createResonanceGap(res.location, moon.name);
                }
            });
        });
    }
    
    /**
     * Create gap in rings at resonance location
     */
    createResonanceGap(location, moonName) {
        this.densityWaves.push({
            location: location,
            width: 0.1 * URANUS_RADIUS,
            moonName: moonName,
            strength: 0.8,
            phase: 0
        });
    }
    
    /**
     * Update ring system
     */
    update(deltaTime, uranusRotation, moonPositions) {
        if (!this.group) return;
        
        this.time += deltaTime;
        
        // Synchronize ring rotation with Uranus
        this.group.rotation.y = uranusRotation;
        
        // Update shader uniforms for advanced shaders
        if (this.useAdvancedShaders) {
            this.updateShaderUniforms(moonPositions);
        }
        
        // Update visual effects
        this.updateVisualEffects(deltaTime);
    }
    
/**
 * Update shader uniforms
 */
updateShaderUniforms(moonPositions) {
    // Get camera from scene
    const camera = this.scene.getObjectByProperty('isCamera', true);
    const cameraPos = camera ? camera.position : new THREE.Vector3(0, 0, 100);
    
    // Transform moon positions to ring's local coordinate system
    let transformedMoonPositions = [];
    let moonMasses = [];
    
    if (moonPositions && moonPositions.length > 0) {
        // Get the inverse of the ring group's world matrix to transform to local space
        const inverseMatrix = new THREE.Matrix4();
        inverseMatrix.copy(this.group.matrixWorld).invert();
        
        // Calculate gravitational influence for each moon and sort by influence
        const moonInfluences = moonPositions.map((moonData, index) => {
            // Transform position to ring's local space
            const localPos = moonData.position.clone();
            localPos.applyMatrix4(inverseMatrix);
            
            // Get moon mass (approximate based on radius if available)
            const moonInfo = MOONS_DATA[index] || MOONS_DATA[0];
            const mass = Math.pow(moonInfo.radius, 3); // Simple mass approximation
            
            // Calculate average distance to ring system (using middle radius)
            const avgRingRadius = (RINGS_DATA[0].innerRadius + RINGS_DATA[RINGS_DATA.length - 1].outerRadius) / 2;
            const distanceToRings = Math.max(0.1, Math.abs(localPos.length() - avgRingRadius));
            
            // Gravitational influence is proportional to mass/distance²
            const influence = mass / (distanceToRings * distanceToRings);
            
            return {
                position: localPos,
                mass: mass,
                influence: influence,
                type: moonData.type || 'major'
            };
        });
        
        // Sort by influence and prioritize major moons
        moonInfluences.sort((a, b) => {
            // Prioritize major moons
            if (a.type === 'major' && b.type !== 'major') return -1;
            if (b.type === 'major' && a.type !== 'major') return 1;
            // Then sort by influence
            return b.influence - a.influence;
        });
        
        // Take the 5 most influential moons
        const topMoons = moonInfluences.slice(0, 5);
        transformedMoonPositions = topMoons.map(m => m.position);
        moonMasses = topMoons.map(m => m.mass);
    }
    
    // Update each ring's material uniforms
    this.ringMeshes.forEach(ring => {
        if (ring.material.uniforms && !ring.userData.isSimple) {
            // Update time
            ring.material.uniforms.time.value = this.time;
            
            // Update camera position in world space
            ring.material.uniforms.cameraPosition.value = cameraPos;
            
            // Update moon data for gravitational effects
            if (transformedMoonPositions.length > 0) {
                // Update moon positions in ring's local space
                if (ring.material.uniforms.moonPositions) {
                    ring.material.uniforms.moonPositions.value = transformedMoonPositions;
                }
                
                // Update moon masses
                if (ring.material.uniforms.moonMasses) {
                    ring.material.uniforms.moonMasses.value = moonMasses;
                }
                
                // Update moon count
                if (ring.material.uniforms.moonCount) {
                    ring.material.uniforms.moonCount.value = transformedMoonPositions.length;
                }
                
                // Calculate density wave effects based on resonances
                const ringRadius = (ring.userData.innerRadius + ring.userData.outerRadius) / 2;
                let resonanceStrength = 0;
                
                // Check for resonances with nearby moons
                transformedMoonPositions.forEach((moonPos, idx) => {
                    const moonDist = moonPos.length();
                    const ratio = ringRadius / moonDist;
                    
                    // Check for common resonances (2:1, 3:2, 4:3)
                    if (Math.abs(ratio - 0.63) < 0.05) { // ~2:1 resonance
                        resonanceStrength += moonMasses[idx] * 0.5;
                    } else if (Math.abs(ratio - 0.76) < 0.05) { // ~3:2 resonance
                        resonanceStrength += moonMasses[idx] * 0.3;
                    } else if (Math.abs(ratio - 0.83) < 0.05) { // ~4:3 resonance
                        resonanceStrength += moonMasses[idx] * 0.2;
                    }
                });
                
                // Update density wave amplitude based on resonances
                if (ring.material.uniforms.densityWaveAmplitude) {
                    const baseAmplitude = 0.05;
                    ring.material.uniforms.densityWaveAmplitude.value = 
                        baseAmplitude + Math.min(resonanceStrength * 0.1, 0.2);
                }
                
                // Update density wave frequency based on orbital period
                if (ring.material.uniforms.densityWaveFrequency) {
                    const orbitalPeriod = ring.userData.orbitalPeriod || 1;
                    ring.material.uniforms.densityWaveFrequency.value = 
                        10.0 * (1.0 + resonanceStrength * 0.5);
                }
            }
        }
    });
    
    // Update glow uniforms
    this.glowMeshes.forEach(glow => {
        if (glow.material.uniforms && glow.material.uniforms.time) {
            glow.material.uniforms.time.value = this.time;
        }
    });
}
    
    /**
     * Update visual effects
     */
    updateVisualEffects(deltaTime) {
        // Update ring shimmer
        this.ringMeshes.forEach((ring, index) => {
            if (ring.userData.isSimple) {
                // Simple opacity animation
                const shimmer = 0.9 + 0.1 * Math.sin(this.time * 0.3 + index);
                ring.material.opacity = ring.userData.baseOpacity * shimmer;
            } else if (ring.material.uniforms && ring.material.uniforms.baseOpacity) {
                // Shader-based animation
                const shimmer = 0.95 + 0.05 * Math.sin(this.time * 0.2 + index);
                ring.material.uniforms.baseOpacity.value = ring.userData.baseOpacity * shimmer;
            }
        });
        
        // Update glow pulsing
        this.glowMeshes.forEach((glow, index) => {
            if (glow.material.opacity !== undefined) {
                // Simple material
                const pulse = 0.7 + 0.3 * Math.sin(this.time * 0.15 + index * 0.5);
                glow.material.opacity = glow.userData.baseOpacity * pulse;
            } else if (glow.material.uniforms && glow.material.uniforms.baseOpacity) {
                // Shader material
                const pulse = 0.8 + 0.2 * Math.sin(this.time * 0.15 + index * 0.5);
                glow.material.uniforms.baseOpacity.value = glow.userData.baseOpacity * pulse;
            }
        });
    }
    
    /**
     * Check if ring should have glow effect
     */
    shouldHaveGlow(ringName) {
        return ringName === 'ε' || ringName === 'α' || ringName === 'β';
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
     * Update quality settings
     */
    updateQuality(quality) {
        const shouldUseAdvanced = quality.ringSegments > 128;
        
        if (shouldUseAdvanced !== this.useAdvancedShaders) {
            // Recreate rings with new quality
            this.dispose();
            this.useAdvancedShaders = shouldUseAdvanced;
            this.create();
        }
    }
    
    /**
     * Get ring by name
     */
    getRingByName(name) {
        return this.ringMeshes.find(ring => ring.userData.ringName === name);
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
     * Debug method to check ring visibility
     */
    debugRings() {
        console.log('Ring System Debug:');
        console.log(`- Group visible: ${this.group?.visible}`);
        console.log(`- Group position:`, this.group?.position);
        console.log(`- Number of rings: ${this.ringMeshes.length}`);
        
        this.ringMeshes.forEach(ring => {
            console.log(`- Ring ${ring.userData.ringName}:`, {
                visible: ring.visible,
                opacity: ring.material.opacity || ring.material.uniforms?.baseOpacity?.value,
                position: ring.position,
                innerRadius: ring.userData.innerRadius,
                outerRadius: ring.userData.outerRadius
            });
        });
    }
    
    /**
     * Dispose of resources
     */
    dispose() {
        if (this.group) {
            // Dispose ring meshes
            this.ringMeshes.forEach(ring => {
                ring.geometry.dispose();
                
                // Dispose texture if it exists
                if (ring.material.map) {
                    ring.material.map.dispose();
                }
                
                // Dispose uniforms textures
                if (ring.material.uniforms) {
                    Object.values(ring.material.uniforms).forEach(uniform => {
                        if (uniform.value && uniform.value.dispose) {
                            uniform.value.dispose();
                        }
                    });
                }
                
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
            this.densityWaves = [];
            this.moonResonances.clear();
            this.group = null;
        }
    }
}
