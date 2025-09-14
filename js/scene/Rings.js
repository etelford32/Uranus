/**
 * Rings - Enhanced Uranus ring system with gravitational effects and advanced shaders
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
        this.gravitationalConstant = 6.67430e-11; // Real G scaled for simulation
        this.uranussMass = 8.681e25; // kg
        this.ringParticleSize = 0.2; // meters average
        
        // Shader uniforms that will be updated
        this.shaderUniforms = {
            time: { value: 0 },
            sunPosition: { value: new THREE.Vector3(1000, 500, 1000) },
            cameraPosition: { value: new THREE.Vector3() },
            moonPositions: { value: [] },
            moonMasses: { value: [] },
            moonCount: { value: MOONS_DATA.length },
            densityWaveAmplitude: { value: 0.1 },
            densityWaveFrequency: { value: 10.0 },
            backscatterStrength: { value: 0.3 },
            forwardScatterStrength: { value: 0.5 }
        };
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
        
        // Create each ring with enhanced shaders
        RINGS_DATA.forEach(ringData => {
            this.createEnhancedRing(ringData);
        });
        
        // Calculate resonance locations
        this.calculateResonances();
        
        // Apply Uranus's tilt to the ring system
        this.group.rotation.z = URANUS_TILT;
        
        // Add to scene
        this.scene.add(this.group);
    }
    
    /**
     * Initialize moon data for gravitational calculations
     */
    initializeMoonData() {
        // Convert moon data to shader-friendly format
        const moonPositions = [];
        const moonMasses = [];
        
        MOONS_DATA.forEach(moon => {
            moonPositions.push(new THREE.Vector3());
            // Approximate moon masses based on radius (simplified)
            const massScale = Math.pow(moon.radius, 3) * 1e20; // Simplified mass calculation
            moonMasses.push(massScale);
        });
        
        this.shaderUniforms.moonPositions.value = moonPositions;
        this.shaderUniforms.moonMasses.value = moonMasses;
    }
    
    /**
     * Create enhanced ring with gravitational shader
     */
    createEnhancedRing(ringData) {
        const quality = QualityPresets[PerformanceSettings.currentQuality];
        const segments = ringData.segments || quality.ringSegments || 256;
        
        // Create ring geometry with more detail
        const geometry = new THREE.RingGeometry(
            ringData.innerRadius,
            ringData.outerRadius,
            segments,
            32 // More radial segments for density variations
        );
        
        // Add UV coordinates for texture mapping
        this.addRingUVs(geometry);
        
        // Create advanced shader material
        const material = this.createAdvancedRingShader(ringData);
        
        // Create mesh
        const ringMesh = new THREE.Mesh(geometry, material);
        ringMesh.rotation.x = -Math.PI / 2; // Align rings horizontally
        ringMesh.name = `Ring_${ringData.name}`;
        
        // Store original properties for updates
        ringMesh.userData = {
            baseOpacity: ringData.opacity,
            ringName: ringData.name,
            ringData: ringData,
            innerRadius: ringData.innerRadius,
            outerRadius: ringData.outerRadius,
            orbitalPeriod: this.calculateOrbitalPeriod(
                (ringData.innerRadius + ringData.outerRadius) / 2
            )
        };
        
        this.ringMeshes.push(ringMesh);
        this.group.add(ringMesh);
        
        // Add enhanced glow for major rings
        if (this.shouldHaveGlow(ringData.name)) {
            this.createEnhancedRingGlow(ringData);
        }
    }
    
    /**
     * Create advanced ring shader with gravitational effects
     */
    createAdvancedRingShader(ringData) {
        // Create procedural texture for ring particles
        const particleTexture = this.createRingParticleTexture(ringData);
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                ...this.shaderUniforms,
                ringTexture: { value: particleTexture },
                innerRadius: { value: ringData.innerRadius },
                outerRadius: { value: ringData.outerRadius },
                baseOpacity: { value: ringData.opacity },
                ringColor: { value: new THREE.Color(
                    ringData.name === 'ε' ? COLORS.rings.epsilon :
                    ringData.name === 'μ' ? COLORS.rings.outer.mu :
                    ringData.name === 'ν' ? COLORS.rings.outer.nu :
                    COLORS.rings.main
                )},
                epsilonRing: { value: ringData.name === 'ε' ? 1.0 : 0.0 }
            },
            vertexShader: `
                uniform float time;
                uniform vec3 moonPositions[5];
                uniform float moonMasses[5];
                uniform int moonCount;
                uniform float densityWaveAmplitude;
                uniform float densityWaveFrequency;
                
                varying vec3 vPosition;
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                varying float vDensity;
                varying float vGravitationalPerturbation;
                
                // Calculate gravitational influence from moons
                float calculateGravitationalPerturbation(vec3 pos) {
                    float perturbation = 0.0;
                    
                    for(int i = 0; i < 5; i++) {
                        if(i >= moonCount) break;
                        
                        vec3 moonPos = moonPositions[i];
                        float moonMass = moonMasses[i];
                        
                        // Calculate distance to moon
                        float dist = distance(pos, moonPos);
                        
                        // Gravitational influence falls off with distance squared
                        // But we want visible effects, so we scale appropriately
                        float influence = moonMass / (dist * dist + 1.0);
                        
                        // Create density waves from moon perturbations
                        float wave = sin(dist * densityWaveFrequency - time * 2.0);
                        perturbation += influence * wave * densityWaveAmplitude;
                    }
                    
                    return perturbation;
                }
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    
                    // Calculate gravitational perturbation
                    vGravitationalPerturbation = calculateGravitationalPerturbation(position);
                    
                    // Apply vertical displacement based on gravitational effects
                    vec3 displaced = position;
                    displaced.y += vGravitationalPerturbation * 0.5;
                    
                    // Calculate density based on radial position and perturbations
                    float r = length(position.xz);
                    vDensity = 1.0 + vGravitationalPerturbation;
                    
                    // Add spiral density waves (like Saturn's rings)
                    float angle = atan(position.z, position.x);
                    float spiralWave = sin(angle * 3.0 + r * 10.0 - time);
                    vDensity += spiralWave * 0.1;
                    
                    vWorldPosition = (modelMatrix * vec4(displaced, 1.0)).xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 sunPosition;
                uniform vec3 cameraPosition;
                uniform sampler2D ringTexture;
                uniform float innerRadius;
                uniform float outerRadius;
                uniform float baseOpacity;
                uniform vec3 ringColor;
                uniform float backscatterStrength;
                uniform float forwardScatterStrength;
                uniform float epsilonRing;
                
                varying vec3 vPosition;
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                varying float vDensity;
                varying float vGravitationalPerturbation;
                
                // Mie scattering approximation for ring particles
                vec3 mieScattering(vec3 viewDir, vec3 lightDir, float g) {
                    float cosTheta = dot(viewDir, lightDir);
                    float g2 = g * g;
                    float phase = (1.0 - g2) / (4.0 * 3.14159 * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
                    return vec3(phase);
                }
                
                void main() {
                    // Calculate radial distance
                    float r = length(vPosition.xz);
                    
                    // Sharp ring edges
                    float edgeFade = smoothstep(innerRadius, innerRadius + 0.02, r) * 
                                    smoothstep(outerRadius, outerRadius - 0.02, r);
                    
                    if(edgeFade < 0.001) discard;
                    
                    // Sample particle texture
                    vec4 texColor = texture2D(ringTexture, vUv);
                    
                    // Calculate lighting
                    vec3 lightDir = normalize(sunPosition - vWorldPosition);
                    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                    vec3 normal = vec3(0.0, 1.0, 0.0); // Ring plane normal
                    
                    // Backscattering (rings appear brighter when sun is behind them)
                    float backscatter = pow(max(0.0, dot(viewDir, lightDir)), 2.0) * backscatterStrength;
                    
                    // Forward scattering (rings appear bright when backlit)
                    float forwardScatter = pow(max(0.0, -dot(viewDir, lightDir)), 3.0) * forwardScatterStrength;
                    
                    // Mie scattering for realistic particle light interaction
                    vec3 mie = mieScattering(viewDir, lightDir, 0.8);
                    
                    // Base ring color with scattering
                    vec3 color = ringColor;
                    color += vec3(0.9, 0.85, 0.7) * backscatter;
                    color += vec3(0.7, 0.8, 1.0) * forwardScatter;
                    color *= (1.0 + mie * 0.3);
                    
                    // Apply density variations
                    float density = vDensity;
                    
                    // Gravitational gaps (where moons have cleared paths)
                    float gapFactor = 1.0 - smoothstep(0.0, 0.2, abs(vGravitationalPerturbation));
                    density *= gapFactor;
                    
                    // Add subtle sparkles for ice particles
                    float sparkle = 0.0;
                    if(epsilonRing > 0.5) {
                        // Epsilon ring has more visible particles
                        float noise = fract(sin(dot(vPosition.xz, vec2(12.9898, 78.233))) * 43758.5453);
                        sparkle = pow(noise, 20.0) * 2.0;
                    }
                    
                    // Ring self-shadowing (simplified)
                    float shadow = 1.0;
                    float sunAngle = dot(normalize(sunPosition), normal);
                    if(sunAngle < 0.1) {
                        shadow = smoothstep(-0.1, 0.1, sunAngle);
                    }
                    
                    // Combine all effects
                    color = mix(color, vec3(1.0), sparkle * 0.5);
                    color *= shadow;
                    color *= texColor.rgb;
                    
                    // Calculate final opacity
                    float opacity = baseOpacity * edgeFade * density * texColor.a;
                    
                    // Gravitational lensing effect (subtle)
                    opacity *= (1.0 + abs(vGravitationalPerturbation) * 0.5);
                    
                    // Viewing angle affects opacity (rings are thinner when viewed edge-on)
                    float viewAngle = abs(dot(viewDir, normal));
                    opacity *= mix(0.3, 1.0, viewAngle);
                    
                    gl_FragColor = vec4(color, opacity);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        return material;
    }
    
    /**
     * Create procedural ring particle texture
     */
    createRingParticleTexture(ringData) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Create gradient for ring density
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        
        // Add noise and particle distribution
        for(let x = 0; x < canvas.width; x++) {
            for(let y = 0; y < canvas.height; y++) {
                // Base density
                let density = 1.0;
                
                // Add noise for particle distribution
                const noise1 = Math.sin(x * 0.1) * 0.5 + 0.5;
                const noise2 = Math.cos(x * 0.05 + y * 0.1) * 0.5 + 0.5;
                const noise3 = Math.sin(x * 0.02) * Math.cos(y * 0.3) * 0.5 + 0.5;
                
                density *= (noise1 * 0.4 + noise2 * 0.3 + noise3 * 0.3);
                
                // Random gaps (meteoroid impacts)
                if(Math.random() < 0.02) {
                    density *= 0.1;
                }
                
                // Clumping (self-gravity)
                if(Math.random() < 0.05) {
                    density = Math.min(1.0, density * 2.0);
                }
                
                // Color based on particle composition
                let r, g, b;
                if(ringData.name === 'ε') {
                    // Epsilon ring - more metallic/rocky
                    r = 180 + density * 50;
                    g = 180 + density * 50;
                    b = 190 + density * 50;
                } else {
                    // Other rings - more icy
                    r = 150 + density * 70;
                    g = 160 + density * 70;
                    b = 180 + density * 60;
                }
                
                const alpha = density * 255;
                
                ctx.fillStyle = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${alpha/255})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    /**
     * Calculate orbital period for ring particles (Kepler's 3rd law)
     */
    calculateOrbitalPeriod(radius) {
        // T = 2π√(a³/GM)
        const a = radius * URANUS_RADIUS * 1000; // Convert to meters
        const GM = this.gravitationalConstant * this.uranussMass;
        return 2 * Math.PI * Math.sqrt((a * a * a) / GM) / 3600; // Convert to hours
    }
    
    /**
     * Calculate resonance locations with moons
     */
    calculateResonances() {
        MOONS_DATA.forEach(moon => {
            // Calculate major resonances (2:1, 3:2, etc.)
            const resonances = [
                { ratio: '2:1', location: moon.distance * Math.pow(0.5, 2/3) },
                { ratio: '3:2', location: moon.distance * Math.pow(2/3, 2/3) },
                { ratio: '4:3', location: moon.distance * Math.pow(3/4, 2/3) },
                { ratio: '5:4', location: moon.distance * Math.pow(4/5, 2/3) }
            ];
            
            this.moonResonances.set(moon.name, resonances);
            
            // Create gaps at strong resonances
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
        // Store gap information for shader
        this.densityWaves.push({
            location: location,
            width: 0.1 * URANUS_RADIUS,
            moonName: moonName,
            strength: 0.8
        });
    }
    
    /**
     * Add UV coordinates to ring geometry
     */
    addRingUVs(geometry) {
        const pos = geometry.attributes.position;
        const uvs = [];
        
        for(let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const z = pos.getZ(i);
            
            // Calculate UV based on position
            const angle = Math.atan2(z, x);
            const radius = Math.sqrt(x * x + z * z);
            
            uvs.push(
                (angle + Math.PI) / (2 * Math.PI), // U: angle around ring
                radius / 100 // V: radial position (normalized)
            );
        }
        
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    }
    
    /**
     * Enhanced update with gravitational calculations
     */
    update(deltaTime, uranusRotation, moonPositions) {
        if (!this.group) return;
        
        this.time += deltaTime;
        
        // Synchronize ring rotation with Uranus
        this.group.rotation.y = uranusRotation;
        
        // Update shader uniforms
        this.updateShaderUniforms(moonPositions);
        
        // Update individual ring dynamics
        this.updateRingDynamics(deltaTime);
        
        // Update density waves from gravitational perturbations
        this.updateDensityWaves(deltaTime);
        
        // Update shimmer and glow effects
        this.updateVisualEffects(deltaTime);
    }
    
    /**
     * Update shader uniforms with current moon positions
     */
    updateShaderUniforms(moonPositions) {
        // Update time
        this.shaderUniforms.time.value = this.time;
        
        // Update camera position
        const camera = this.scene.getObjectByProperty('isCamera', true);
        if(camera) {
            this.shaderUniforms.cameraPosition.value.copy(camera.position);
        }
        
        // Update moon positions if provided
        if(moonPositions && moonPositions.length > 0) {
            moonPositions.forEach((pos, i) => {
                if(i < this.shaderUniforms.moonPositions.value.length) {
                    this.shaderUniforms.moonPositions.value[i].copy(pos);
                }
            });
        }
        
        // Update each ring's material uniforms
        this.ringMeshes.forEach(ring => {
            if(ring.material.uniforms) {
                ring.material.uniforms.time.value = this.time;
                ring.material.uniforms.cameraPosition.value = this.shaderUniforms.cameraPosition.value;
                ring.material.uniforms.moonPositions.value = this.shaderUniforms.moonPositions.value;
            }
        });
    }
    
    /**
     * Update ring particle dynamics
     */
    updateRingDynamics(deltaTime) {
        this.ringMeshes.forEach(ring => {
            const orbitalPeriod = ring.userData.orbitalPeriod;
            
            // Differential rotation (inner particles orbit faster)
            if(ring.material.uniforms && ring.material.uniforms.ringTexture) {
                const rotationRate = (2 * Math.PI) / orbitalPeriod;
                ring.material.uniforms.ringTexture.value.offset.x += rotationRate * deltaTime * 0.01;
                
                // Wrap texture
                if(ring.material.uniforms.ringTexture.value.offset.x > 1) {
                    ring.material.uniforms.ringTexture.value.offset.x -= 1;
                }
            }
        });
    }
    
    /**
     * Update density waves from gravitational effects
     */
    updateDensityWaves(deltaTime) {
        // Calculate wave propagation
        this.densityWaves.forEach(wave => {
            // Waves propagate outward from resonance points
            wave.phase = (wave.phase || 0) + deltaTime * 0.5;
            
            // Update wave amplitude based on moon distance
            // (This would be calculated based on actual moon positions)
            wave.currentStrength = wave.strength * (0.8 + 0.2 * Math.sin(wave.phase));
        });
        
        // Update shader uniform for density wave effects
        if(this.shaderUniforms.densityWaveAmplitude) {
            // Oscillate wave amplitude for dynamic effect
            this.shaderUniforms.densityWaveAmplitude.value = 
                0.1 + 0.05 * Math.sin(this.time * 0.2);
        }
    }
    
    /**
     * Update visual effects (shimmer, glow, etc.)
     */
    updateVisualEffects(deltaTime) {
        // Enhanced shimmer with gravitational influence
        this.ringMeshes.forEach((ring, index) => {
            if (ring.material && ring.material.uniforms) {
                // Base shimmer
                const shimmer = 0.95 + 0.05 * Math.sin(this.time * 0.2 + index);
                
                // Gravitational brightening (tidal heating effect)
                const gravitationalBrightening = 1.0 + 
                    0.1 * Math.sin(this.time * 0.5 + index * 0.5);
                
                if(ring.material.uniforms.baseOpacity) {
                    ring.material.uniforms.baseOpacity.value = 
                        ring.userData.baseOpacity * shimmer * gravitationalBrightening;
                }
            }
        });
        
        // Update glow effects with pulsing
        this.glowMeshes.forEach((glow, index) => {
            if (glow.material && glow.userData.baseOpacity) {
                const glowPulse = 0.8 + 0.2 * Math.sin(this.time * 0.15 + index * 0.5);
                glow.material.opacity = glow.userData.baseOpacity * glowPulse;
            }
        });
    }
    
    /**
     * Enhanced glow effect for major rings
     */
    createEnhancedRingGlow(ringData) {
        const glowGeometry = new THREE.RingGeometry(
            ringData.innerRadius - 0.1,
            ringData.outerRadius + 0.1,
            256,
            1
        );
        
        // Custom shader for glow
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(
                    ringData.name === 'ε' ? COLORS.rings.glow : 0x909090
                )},
                baseOpacity: { value: ringData.name === 'ε' ? 0.3 : 0.15 }
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
                varying vec3 vPosition;
                
                void main() {
                    float r = length(vPosition.xz);
                    float pulse = sin(time * 2.0 + r * 5.0) * 0.5 + 0.5;
                    float opacity = baseOpacity * (0.5 + pulse * 0.5);
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
    
    // ... Keep all other existing methods (shouldHaveGlow, updateMaterials, setVisible, etc.) ...
    
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
     * Dispose of resources
     */
    dispose() {
        if (this.group) {
            // Dispose ring meshes
            this.ringMeshes.forEach(ring => {
                ring.geometry.dispose();
                if(ring.material.uniforms && ring.material.uniforms.ringTexture) {
                    ring.material.uniforms.ringTexture.value.dispose();
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
