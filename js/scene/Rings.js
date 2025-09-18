/**
 * Enhanced Rings - Complete Uranus ring system with scientifically accurate physics
 * Includes defensive programming and error handling throughout
 */

import { RINGS_DATA, URANUS_TILT, COLORS, URANUS_RADIUS, MOONS_DATA } from '../config/constants.js';
import { DisplaySettings, QualityPresets, PerformanceSettings, SimulationState } from '../config/settings.js';

export default class Rings {
    constructor(scene) {
        // Defensive check for scene
        if (!scene) {
            throw new Error('Scene is required for Rings constructor');
        }
        
        this.scene = scene;
        this.group = null;
        this.ringMeshes = [];
        this.glowMeshes = [];
        this.densityWaves = [];
        this.moonResonances = new Map();
        this.time = 0;
        
        // Enhanced physics parameters with fallbacks
        this.physicsEnabled = true;
        this.gravitationalConstant = 6.67430e-11;
        this.uranusMass = 8.681e25;
        this.uranusRadius = 25559000; // meters
        this.ringParticleSize = 0.2;
        
        // Physics simulation state with defensive initialization
        this.physicsState = {
            lastUpdate: 0,
            timeStep: 0.016, // ~60fps
            particleInteractions: new Map(),
            resonanceLocations: new Map(),
            shepherdMoonData: new Map(),
            isInitialized: false,
            hasErrors: false,
            errorLog: []
        };
        
        // Performance monitoring with defaults
        this.performanceMonitor = {
            frameCount: 0,
            totalTime: 0,
            averageFrameTime: 16.67,
            physicsTime: 0,
            lastQualityCheck: 0,
            qualityReductions: 0
        };
        
        // Validation system
        this.validator = null;
        this.validationEnabled = false;
        
        // Shader uniforms with defensive defaults
        this.shaderUniforms = this.initializeShaderUniforms();
        
        // Use enhanced shaders based on settings
        this.useAdvancedShaders = false;
        this.usePhysicsShaders = false;
        
        // Error recovery state
        this.errorRecovery = {
            maxRetries: 3,
            currentRetries: 0,
            fallbackMode: false,
            lastError: null
        };
        
        // Initialize with error handling
        this.safeInitialize();
    }
    
    /**
     * Safe initialization with error handling
     */
    safeInitialize() {
        try {
            // Validate constants
            if (!this.validateConstants()) {
                throw new Error('Invalid physics constants detected');
            }
            
            // Initialize quality settings
            this.determineQualitySettings();
            
            console.log('🪐 Rings system initialized successfully');
        } catch (error) {
            this.handleError('Initialization failed', error);
            this.errorRecovery.fallbackMode = true;
        }
    }
    
    /**
     * Initialize shader uniforms with defensive defaults
     */
    initializeShaderUniforms() {
        const defaults = {
            time: { value: 0 },
            sunPosition: { value: new THREE.Vector3(1000, 500, 1000) },
            cameraPosition: { value: new THREE.Vector3(0, 0, 100) },
            moonPositions: { value: [] },
            moonMasses: { value: [] },
            moonCount: { value: 0 },
            densityWaveAmplitude: { value: 0.05 },
            densityWaveFrequency: { value: 10.0 },
            backscatterStrength: { value: 0.3 },
            forwardScatterStrength: { value: 0.5 },
            resonanceStrength: { value: 0.0 },
            particleSize: { value: 0.2 },
            opticalDepth: { value: 1.0 },
            shepherdMoonEffect: { value: 0.0 },
            tidalForceStrength: { value: 0.0 }
        };
        
        return defaults;
    }
    
    /**
     * Validate physics constants
     */
    validateConstants() {
        const checks = [
            { name: 'Gravitational Constant', value: this.gravitationalConstant, min: 6e-11, max: 7e-11 },
            { name: 'Uranus Mass', value: this.uranusMass, min: 8e25, max: 9e25 },
            { name: 'Uranus Radius', value: this.uranusRadius, min: 2e7, max: 3e7 }
        ];
        
        for (const check of checks) {
            if (check.value < check.min || check.value > check.max) {
                console.warn(`❌ ${check.name} out of expected range: ${check.value}`);
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Determine quality settings with defensive checks
     */
    determineQualitySettings() {
        try {
            const quality = QualityPresets[PerformanceSettings.currentQuality] || QualityPresets.medium;
            
            if (!quality) {
                console.warn('⚠️ Quality preset not found, using medium');
                this.useAdvancedShaders = false;
                this.usePhysicsShaders = false;
                return;
            }
            
            this.useAdvancedShaders = quality.ringSegments > 64;
            this.usePhysicsShaders = this.physicsEnabled && quality.ringSegments > 128;
            
            console.log(`🔧 Quality settings: Advanced=${this.useAdvancedShaders}, Physics=${this.usePhysicsShaders}`);
        } catch (error) {
            this.handleError('Quality settings determination failed', error);
            this.useAdvancedShaders = false;
            this.usePhysicsShaders = false;
        }
    }
    
    /**
     * Create ring system with comprehensive error handling
     */
    create() {
        try {
            if (this.errorRecovery.fallbackMode) {
                return this.createFallbackRings();
            }
            
            // Create group to hold all rings
            this.group = new THREE.Group();
            this.group.name = 'EnhancedRingSystem';
            
            // Initialize physics subsystems if enabled
            if (this.physicsEnabled) {
                this.safeInitializePhysics();
            }
            
            // Validate ring data before creation
            if (!this.validateRingData()) {
                throw new Error('Invalid ring data detected');
            }
            
            // Create rings based on capabilities
            let successCount = 0;
            RINGS_DATA.forEach((ringData, index) => {
                try {
                    if (this.createSingleRing(ringData)) {
                        successCount++;
                    }
                } catch (error) {
                    this.handleError(`Failed to create ring ${ringData.name}`, error);
                }
            });
            
            if (successCount === 0) {
                throw new Error('No rings could be created');
            }
            
            // Initialize physics state if enabled
            if (this.physicsEnabled && this.physicsState) {
                this.safeInitializePhysicsState();
            }
            
            // Apply Uranus's tilt
            if (this.group) {
                this.group.rotation.z = URANUS_TILT;
                this.scene.add(this.group);
            }
            
            console.log(`✅ Created ${successCount}/${RINGS_DATA.length} rings successfully`);
            console.log(`🔬 Physics: ${this.physicsEnabled ? 'enabled' : 'disabled'}, Advanced: ${this.useAdvancedShaders}`);
            
        } catch (error) {
            this.handleError('Ring system creation failed', error);
            this.createFallbackRings();
        }
    }
    
    /**
     * Validate ring data with defensive checks
     */
    validateRingData() {
        if (!Array.isArray(RINGS_DATA) || RINGS_DATA.length === 0) {
            console.error('❌ Invalid or empty ring data');
            return false;
        }
        
        for (const ring of RINGS_DATA) {
            if (!ring.name || typeof ring.innerRadius !== 'number' || typeof ring.outerRadius !== 'number') {
                console.error(`❌ Invalid ring data for ${ring.name || 'unknown ring'}`);
                return false;
            }
            
            if (ring.innerRadius >= ring.outerRadius) {
                console.error(`❌ Invalid ring geometry for ${ring.name}: inner >= outer radius`);
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Create a single ring with error handling
     */
    createSingleRing(ringData) {
        try {
            if (this.usePhysicsShaders && this.physicsEnabled) {
                return this.safeCreatePhysicsRing(ringData);
            } else if (this.useAdvancedShaders) {
                return this.safeCreateEnhancedRing(ringData);
            } else {
                return this.safeCreateSimpleRing(ringData);
            }
        } catch (error) {
            this.handleError(`Failed to create ring ${ringData.name}`, error);
            // Try fallback method
            return this.safeCreateSimpleRing(ringData);
        }
    }
    
    /**
     * Safely initialize physics subsystems
     */
    safeInitializePhysics() {
        try {
            this.initializeMoonData();
            this.preCalculateResonances();
            this.initializeInteractionGrid();
            this.setupPhysicsScheduler();
            this.physicsState.isInitialized = true;
        } catch (error) {
            this.handleError('Physics initialization failed', error);
            this.physicsEnabled = false;
        }
    }
    
    /**
     * Initialize moon data with defensive programming
     */
    initializeMoonData() {
        if (!Array.isArray(MOONS_DATA) || MOONS_DATA.length === 0) {
            console.warn('⚠️ No moon data available for physics calculations');
            return;
        }
        
        try {
            const moonPositions = [];
            const moonMasses = [];
            
            MOONS_DATA.forEach(moon => {
                if (moon && typeof moon.distance === 'number' && typeof moon.radius === 'number') {
                    moonPositions.push(new THREE.Vector3(moon.distance, 0, 0));
                    const massScale = Math.pow(Math.max(moon.radius, 0.1), 3) * 1e20;
                    moonMasses.push(massScale);
                }
            });
            
            this.shaderUniforms.moonPositions.value = moonPositions;
            this.shaderUniforms.moonMasses.value = moonMasses;
            this.shaderUniforms.moonCount.value = moonPositions.length;
            
            console.log(`📊 Initialized data for ${moonPositions.length} moons`);
        } catch (error) {
            this.handleError('Moon data initialization failed', error);
        }
    }
    
    /**
     * Pre-calculate resonance locations with error handling
     */
    preCalculateResonances() {
        if (!this.physicsState || !MOONS_DATA) {
            console.warn('⚠️ Cannot calculate resonances: missing prerequisites');
            return;
        }
        
        try {
            MOONS_DATA.forEach(moon => {
                if (!moon || typeof moon.distance !== 'number' || !moon.name) {
                    return; // Skip invalid moon data
                }
                
                const moonDistance = moon.distance * URANUS_RADIUS * 1000; // meters
                const resonances = [];
                
                const resonanceRatios = [
                    { p: 2, q: 1, strength: 0.8 },
                    { p: 3, q: 2, strength: 0.6 },
                    { p: 4, q: 3, strength: 0.4 },
                    { p: 5, q: 3, strength: 0.5 },
                    { p: 5, q: 4, strength: 0.3 }
                ];
                
                resonanceRatios.forEach(ratio => {
                    try {
                        const resonanceRadius = moonDistance * Math.pow(ratio.q / ratio.p, 2/3);
                        const resonanceRadiusUnits = resonanceRadius / (URANUS_RADIUS * 1000);
                        
                        if (resonanceRadiusUnits > 0 && isFinite(resonanceRadiusUnits)) {
                            resonances.push({
                                ratio: `${ratio.p}:${ratio.q}`,
                                radius: resonanceRadiusUnits,
                                strength: ratio.strength,
                                moonName: moon.name
                            });
                        }
                    } catch (error) {
                        console.warn(`⚠️ Failed to calculate resonance for ${moon.name}:`, error.message);
                    }
                });
                
                if (resonances.length > 0) {
                    this.physicsState.resonanceLocations.set(moon.name, resonances);
                }
            });
            
            const totalResonances = Array.from(this.physicsState.resonanceLocations.values())
                .reduce((total, resonances) => total + resonances.length, 0);
            
            console.log(`🔄 Pre-calculated ${totalResonances} resonance locations`);
        } catch (error) {
            this.handleError('Resonance calculation failed', error);
        }
    }
    
    /**
     * Initialize interaction grid with bounds checking
     */
    initializeInteractionGrid() {
        try {
            const gridSize = 64;
            const maxRadius = Math.max(...RINGS_DATA.map(r => r.outerRadius || 0));
            
            if (maxRadius <= 0) {
                throw new Error('Invalid maximum radius for interaction grid');
            }
            
            this.physicsState.interactionGrid = {
                size: gridSize,
                cellSize: (maxRadius * 2) / gridSize,
                cells: new Array(gridSize * gridSize).fill(null).map(() => []),
                maxRadius: maxRadius
            };
            
            console.log(`🕸️ Interaction grid initialized: ${gridSize}x${gridSize}, max radius: ${maxRadius.toFixed(2)}`);
        } catch (error) {
            this.handleError('Interaction grid initialization failed', error);
            this.physicsState.interactionGrid = null;
        }
    }
    
    /**
     * Setup physics scheduler with fallback
     */
    setupPhysicsScheduler() {
        try {
            this.physicsScheduler = {
                highFrequency: ['densityWaves', 'particleMotion'],
                mediumFrequency: ['moonInfluences', 'resonanceEffects'],
                lowFrequency: ['shepherdMoonEffects', 'collisionDetection'],
                frameCounter: 0,
                isActive: true
            };
            
            console.log('⏰ Physics scheduler initialized');
        } catch (error) {
            this.handleError('Physics scheduler setup failed', error);
            this.physicsScheduler = null;
        }
    }
    
    /**
     * Safely create physics-enhanced ring
     */
    safeCreatePhysicsRing(ringData) {
        try {
            const quality = QualityPresets[PerformanceSettings.currentQuality] || QualityPresets.medium;
            const segments = Math.min(ringData.segments || quality.ringSegments || 256, 512);
            
            if (segments < 8) {
                console.warn(`⚠️ Low segment count for ${ringData.name}, falling back to simple ring`);
                return this.safeCreateSimpleRing(ringData);
            }
            
            // Create geometry with error handling
            const geometry = this.safeCreateRingGeometry(ringData, segments, 16);
            if (!geometry) {
                throw new Error('Failed to create ring geometry');
            }
            
            // Add physics attributes
            this.safeAddPhysicsAttributes(geometry, ringData);
            
            // Create physics shader
            const material = this.safeCreatePhysicsShader(ringData);
            if (!material) {
                throw new Error('Failed to create physics shader');
            }
            
            // Create mesh
            const ringMesh = new THREE.Mesh(geometry, material);
            ringMesh.rotation.x = -Math.PI / 2;
            ringMesh.name = `PhysicsRing_${ringData.name}`;
            
            // Store comprehensive properties
            ringMesh.userData = {
                baseOpacity: ringData.opacity,
                ringName: ringData.name,
                ringData: ringData,
                innerRadius: ringData.innerRadius,
                outerRadius: ringData.outerRadius,
                orbitalPeriod: this.safeCalculateOrbitalPeriod((ringData.innerRadius + ringData.outerRadius) / 2),
                isSimple: false,
                hasPhysics: true,
                particleCount: this.safeEstimateParticleCount(ringData),
                mass: this.safeEstimateRingMass(ringData),
                creationTime: Date.now()
            };
            
            this.ringMeshes.push(ringMesh);
            if (this.group) {
                this.group.add(ringMesh);
            }
            
            // Add glow if needed
            if (this.shouldHaveGlow(ringData.name)) {
                this.safeCreatePhysicsRingGlow(ringData);
            }
            
            return true;
        } catch (error) {
            this.handleError(`Physics ring creation failed for ${ringData.name}`, error);
            return false;
        }
    }
    
    /**
     * Safely create ring geometry with validation
     */
    safeCreateRingGeometry(ringData, radialSegments = 128, thetaSegments = 8) {
        try {
            if (!ringData || typeof ringData.innerRadius !== 'number' || typeof ringData.outerRadius !== 'number') {
                throw new Error('Invalid ring data provided');
            }
            
            const inner = Math.max(0.1, ringData.innerRadius);
            const outer = Math.max(inner + 0.1, ringData.outerRadius);
            const radSeg = Math.max(8, Math.min(512, radialSegments));
            const thetaSeg = Math.max(4, Math.min(32, thetaSegments));
            
            return new THREE.RingGeometry(inner, outer, radSeg, thetaSeg);
        } catch (error) {
            this.handleError(`Ring geometry creation failed for ${ringData?.name}`, error);
            return null;
        }
    }
    
    /**
     * Safely add physics attributes to geometry
     */
    safeAddPhysicsAttributes(geometry, ringData) {
        if (!geometry || !geometry.attributes || !geometry.attributes.position) {
            console.warn('⚠️ Cannot add physics attributes: invalid geometry');
            return;
        }
        
        try {
            const positions = geometry.attributes.position;
            const count = positions.count;
            
            if (count <= 0) {
                console.warn('⚠️ No vertices in geometry for physics attributes');
                return;
            }
            
            const velocities = new Float32Array(count * 3);
            const densities = new Float32Array(count);
            const particleSizes = new Float32Array(count);
            
            for (let i = 0; i < count; i++) {
                const x = positions.getX(i);
                const y = positions.getY(i);
                const r = Math.sqrt(x * x + y * y);
                
                if (r > 0.001) { // Avoid division by zero
                    // Keplerian velocity
                    const velocity = Math.sqrt(1.0 / Math.max(r, 0.1));
                    velocities[i * 3] = -y * velocity;
                    velocities[i * 3 + 1] = x * velocity;
                    velocities[i * 3 + 2] = 0;
                }
                
                // Random variations with bounds
                densities[i] = Math.max(0.1, 0.8 + Math.random() * 0.4);
                
                if (ringData.name === 'ε') {
                    particleSizes[i] = Math.max(0.1, 0.3 + Math.random() * 0.4);
                } else {
                    particleSizes[i] = Math.max(0.05, 0.1 + Math.random() * 0.2);
                }
            }
            
            geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
            geometry.setAttribute('density', new THREE.BufferAttribute(densities, 1));
            geometry.setAttribute('particleSize', new THREE.BufferAttribute(particleSizes, 1));
            
        } catch (error) {
            this.handleError('Adding physics attributes failed', error);
        }
    }
    
    /**
     * Create physics-based shader with comprehensive error handling
     */
    safeCreatePhysicsShader(ringData) {
        if (!ringData || !ringData.name) {
            console.error('❌ Invalid ring data for shader creation');
            return null;
        }
        
        try {
            // Determine ring properties with fallbacks
            let ringColor, particleAlbedo, scatteringParams;
            
            if (ringData.name === 'ε') {
                ringColor = new THREE.Color(0.9, 0.9, 1.0);
                particleAlbedo = 0.05;
                scatteringParams = { forward: 0.8, back: 0.2 };
            } else if (['α', 'β', 'γ', 'δ'].includes(ringData.name)) {
                ringColor = new THREE.Color(0.8, 0.85, 0.9);
                particleAlbedo = 0.04;
                scatteringParams = { forward: 0.6, back: 0.4 };
            } else {
                ringColor = new THREE.Color(0.7, 0.7, 0.8);
                particleAlbedo = 0.03;
                scatteringParams = { forward: 0.5, back: 0.5 };
            }
            
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    // Basic parameters with safe defaults
                    time: { value: 0 },
                    innerRadius: { value: Math.max(0.1, ringData.innerRadius || 1.0) },
                    outerRadius: { value: Math.max(0.2, ringData.outerRadius || 2.0) },
                    baseOpacity: { value: Math.max(0.01, Math.min(1.0, ringData.opacity || 0.5)) },
                    ringColor: { value: ringColor },
                    particleAlbedo: { value: Math.max(0.01, Math.min(0.5, particleAlbedo)) },
                    
                    // Lighting with fallbacks
                    sunPosition: { value: new THREE.Vector3(1000, 500, 1000) },
                    cameraPosition: { value: new THREE.Vector3(0, 0, 100) },
                    
                    // Physics parameters with safe ranges
                    densityWaveAmplitude: { value: Math.max(0.01, Math.min(0.5, 0.05)) },
                    densityWaveFrequency: { value: Math.max(1.0, Math.min(50.0, 10.0)) },
                    resonanceStrength: { value: 0.0 },
                    particleSize: { value: Math.max(0.05, Math.min(2.0, 0.2)) },
                    opticalDepth: { value: Math.max(0.1, Math.min(5.0, 1.0)) },
                    
                    // Moon influence (empty arrays as fallback)
                    moonPositions: { value: [] },
                    moonMasses: { value: [] },
                    moonCount: { value: 0 },
                    
                    // Scattering with bounds
                    forwardScattering: { value: Math.max(0.1, Math.min(1.0, scatteringParams.forward)) },
                    backScattering: { value: Math.max(0.1, Math.min(1.0, scatteringParams.back)) },
                    
                    // Special effects
                    epsilonRing: { value: ringData.name === 'ε' ? 1.0 : 0.0 },
                    shepherdMoonEffect: { value: 0.0 }
                },
                
                vertexShader: this.getSafeVertexShader(),
                fragmentShader: this.getSafeFragmentShader(),
                
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.NormalBlending
            });
            
            return material;
        } catch (error) {
            this.handleError(`Physics shader creation failed for ${ringData.name}`, error);
            return this.createFallbackMaterial(ringData);
        }
    }
    
    /**
     * Get safe vertex shader with error handling
     */
    getSafeVertexShader() {
        return `
            uniform float time;
            uniform float densityWaveAmplitude;
            uniform float densityWaveFrequency;
            uniform float resonanceStrength;
            uniform vec3 moonPositions[5];
            uniform float moonMasses[5];
            uniform int moonCount;
            
            varying vec3 vPosition;
            varying vec2 vUv;
            varying vec3 vWorldPosition;
            varying float vDensity;
            varying float vParticleVelocity;
            varying vec3 vNormal;
            
            vec3 calculateGravitationalPerturbation(vec3 pos) {
                vec3 totalForce = vec3(0.0);
                
                // Safe loop with bounds checking
                int safeMoonCount = min(moonCount, 5);
                for(int i = 0; i < safeMoonCount; i++) {
                    if(i >= 5) break; // Additional safety check
                    
                    vec3 moonPos = moonPositions[i];
                    vec3 r = pos - moonPos;
                    float distance = length(r);
                    
                    if(distance > 0.1 && distance < 1000.0) { // Avoid singularities and overflow
                        float forceMagnitude = clamp(moonMasses[i] / (distance * distance), 0.0, 10.0);
                        vec3 forceDirection = normalize(r) * -1.0;
                        totalForce += forceDirection * forceMagnitude;
                    }
                }
                
                return totalForce * 0.01; // Scale safely
            }
            
            float calculateDensityWave(vec3 pos, float t) {
                float r = length(pos.xy);
                float theta = atan(pos.y, pos.x);
                
                // Clamp values to prevent overflow
                float safeR = clamp(r, 0.1, 100.0);
                float safeT = mod(t, 628.0); // 2π * 100
                float safeFreq = clamp(densityWaveFrequency, 1.0, 50.0);
                float safeAmplitude = clamp(densityWaveAmplitude, 0.0, 0.5);
                
                float spiralPattern = sin(theta * 3.0 + safeR * safeFreq - safeT * 2.0);
                float resonanceEffect = resonanceStrength * sin(theta * 2.0 + safeT);
                
                return spiralPattern * safeAmplitude + resonanceEffect * 0.5;
            }
            
            float calculateOrbitalVelocity(float radius) {
                float safeRadius = max(radius, 0.1);
                return sqrt(1.0 / safeRadius) * 0.1;
            }
            
            void main() {
                vUv = uv;
                vPosition = position;
                
                float r = length(position.xy);
                
                // Calculate perturbations safely
                vec3 perturbation = calculateGravitationalPerturbation(position);
                
                // Apply density wave effects
                float waveEffect = calculateDensityWave(position, time);
                vDensity = clamp(1.0 + waveEffect, 0.1, 2.0);
                
                // Calculate velocity safely
                vParticleVelocity = calculateOrbitalVelocity(r);
                
                // Apply perturbations with bounds
                vec3 displacedPosition = position + clamp(perturbation, vec3(-0.1), vec3(0.1));
                
                // Small vertical displacement
                displacedPosition.z += clamp(waveEffect * 0.02, -0.05, 0.05);
                
                // Calculate normal safely
                vNormal = normalize(vec3(0.0, 0.0, 1.0) + perturbation * 10.0);
                
                vWorldPosition = (modelMatrix * vec4(displacedPosition, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
            }
        `;
    }
    
    /**
     * Get safe fragment shader with error handling
     */
    getSafeFragmentShader() {
        return `
            uniform float time;
            uniform vec3 sunPosition;
            uniform vec3 cameraPosition;
            uniform float innerRadius;
            uniform float outerRadius;
            uniform float baseOpacity;
            uniform vec3 ringColor;
            uniform float particleAlbedo;
            uniform float particleSize;
            uniform float opticalDepth;
            uniform float forwardScattering;
            uniform float backScattering;
            uniform float epsilonRing;
            uniform float shepherdMoonEffect;
            
            varying vec3 vPosition;
            varying vec2 vUv;
            varying vec3 vWorldPosition;
            varying float vDensity;
            varying float vParticleVelocity;
            varying vec3 vNormal;
            
            float miePhaseFunction(float cosTheta, float g) {
                float g2 = g * g;
                float denom = 1.0 + g2 - 2.0 * g * cosTheta;
                return max(0.0, (1.0 - g2) / (4.0 * 3.14159 * max(pow(denom, 1.5), 0.001)));
            }
            
            vec3 calculateScattering(vec3 lightDir, vec3 viewDir, vec3 normal) {
                float cosTheta = clamp(dot(lightDir, viewDir), -1.0, 1.0);
                
                float forwardMie = miePhaseFunction(cosTheta, 0.7) * clamp(forwardScattering, 0.0, 1.0);
                float backMie = miePhaseFunction(-cosTheta, -0.3) * clamp(backScattering, 0.0, 1.0);
                
                float totalScattering = clamp(forwardMie + backMie, 0.0, 2.0);
                return vec3(totalScattering);
            }
            
            float ringEdgeProfile(float r) {
                float safeInner = max(innerRadius, 0.1);
                float safeOuter = max(outerRadius, safeInner + 0.1);
                
                float innerEdge = smoothstep(safeInner - 0.05, safeInner + 0.02, r);
                float outerEdge = 1.0 - smoothstep(safeOuter - 0.02, safeOuter + 0.05, r);
                return clamp(innerEdge * outerEdge, 0.0, 1.0);
            }
            
            float calculateOpticalDepth(float density, float viewAngle) {
                float pathLength = 1.0 / max(abs(viewAngle), 0.1);
                return clamp(opticalDepth * density * pathLength, 0.0, 10.0);
            }
            
            vec3 particleSizeEffects(float size, vec3 baseColor) {
                float sizeFactor = mix(1.2, 0.8, smoothstep(0.1, 0.5, clamp(size, 0.05, 2.0)));
                return baseColor * sizeFactor;
            }
            
            void main() {
                float r = length(vPosition.xy);
                
                float edgeMask = ringEdgeProfile(r);
                if(edgeMask < 0.01) discard;
                
                // Safe lighting calculations
                vec3 lightDir = normalize(sunPosition - vWorldPosition);
                vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                vec3 normal = normalize(vNormal);
                
                float viewAngle = abs(dot(viewDir, normal));
                
                // Base color with safety checks
                vec3 color = ringColor;
                color = particleSizeEffects(particleSize, color);
                
                // Apply scattering safely
                vec3 scattering = calculateScattering(lightDir, viewDir, normal);
                color *= clamp(particleAlbedo + scattering, vec3(0.01), vec3(2.0));
                
                // Apply density variations
                float density = clamp(vDensity, 0.3, 2.0);
                color *= density;
                
                // Shadow effects
                float shadowEffect = mix(0.3, 1.0, viewAngle);
                color *= shadowEffect;
                
                // Epsilon ring special effects
                if(epsilonRing > 0.5) {
                    float clumping = sin(r * 100.0 + time) * 0.1 + 1.0;
                    color *= clamp(clumping, 0.5, 1.5);
                    
                    float sparkle = pow(max(0.0, dot(reflect(lightDir, normal), viewDir)), 20.0);
                    color += vec3(sparkle * 0.3);
                }
                
                // Shepherd moon effects
                if(shepherdMoonEffect > 0.1) {
                    float structure = sin(r * 50.0 * shepherdMoonEffect + time) * 0.2 + 1.0;
                    color *= clamp(structure, 0.5, 1.5);
                }
                
                // Calculate final opacity safely
                float tau = calculateOpticalDepth(density, viewAngle);
                float opacity = baseOpacity * edgeMask * (1.0 - exp(-tau));
                
                // Ensure minimum visibility
                opacity = max(opacity, baseOpacity * 0.4 * edgeMask);
                
                // Color temperature variations
                float temperature = 1.0 + sin(r * 20.0 + time * 0.1) * 0.05;
                color *= clamp(temperature, 0.8, 1.2);
                
                // Doppler shift effects (subtle)
                float dopplerShift = clamp(vParticleVelocity * 0.01, -0.1, 0.1);
                color.b += dopplerShift;
                color.r -= dopplerShift * 0.5;
                
                // Final safe output
                gl_FragColor = vec4(clamp(color, vec3(0.0), vec3(2.0)), clamp(opacity, 0.0, 1.0));
            }
        `;
    }
    
    /**
     * Create fallback material for error cases
     */
    createFallbackMaterial(ringData) {
        try {
            let ringColor;
            if (ringData.name === 'ε') {
                ringColor = COLORS.rings.epsilon || 0xcccccc;
            } else if (ringData.name === 'μ' || ringData.name === 'ν') {
                ringColor = COLORS.rings.outer?.mu || 0xaaaaaa;
            } else {
                ringColor = COLORS.rings.main || 0xb0b0b0;
            }
            
            return new THREE.MeshBasicMaterial({
                color: new THREE.Color(ringColor),
                transparent: true,
                opacity: Math.max(0.1, Math.min(1.0, ringData.opacity || 0.5)),
                side: THREE.DoubleSide,
                depthWrite: false
            });
        } catch (error) {
            console.error('❌ Even fallback material creation failed:', error);
            return new THREE.MeshBasicMaterial({
                color: 0x888888,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide,
                depthWrite: false
            });
        }
    }
    
    /**
     * Safely create enhanced ring (non-physics)
     */
    safeCreateEnhancedRing(ringData) {
        try {
            return this.createEnhancedRing(ringData);
        } catch (error) {
            this.handleError(`Enhanced ring creation failed for ${ringData.name}`, error);
            return this.safeCreateSimpleRing(ringData);
        }
    }
    
    /**
     * Original enhanced ring method with added safety
     */
    createEnhancedRing(ringData) {
        const quality = QualityPresets[PerformanceSettings.currentQuality] || QualityPresets.medium;
        const segments = Math.min(ringData.segments || quality.ringSegments || 256, 512);
        
        const geometry = this.safeCreateRingGeometry(ringData, segments, 16);
        if (!geometry) {
            throw new Error('Failed to create enhanced ring geometry');
        }
        
        const material = this.createFixedRingShader(ringData);
        const ringMesh = new THREE.Mesh(geometry, material);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.name = `Ring_${ringData.name}`;
        
        ringMesh.userData = {
            baseOpacity: ringData.opacity,
            ringName: ringData.name,
            ringData: ringData,
            innerRadius: ringData.innerRadius,
            outerRadius: ringData.outerRadius,
            orbitalPeriod: this.safeCalculateOrbitalPeriod(
                (ringData.innerRadius + ringData.outerRadius) / 2
            ),
            isSimple: false
        };
        
        this.ringMeshes.push(ringMesh);
        if (this.group) {
            this.group.add(ringMesh);
        }
        
        if (this.shouldHaveGlow(ringData.name)) {
            this.safeCreateEnhancedRingGlow(ringData);
        }
        
        return true;
    }
    
    /**
     * Create fixed ring shader with safety checks
     */
    createFixedRingShader(ringData) {
        try {
            // Determine ring color safely
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
                    innerRadius: { value: Math.max(0.1, ringData.innerRadius || 1.0) },
                    outerRadius: { value: Math.max(0.2, ringData.outerRadius || 2.0) },
                    baseOpacity: { value: Math.max(0.01, Math.min(1.0, ringData.opacity || 0.5)) },
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
                        
                        float r = length(position.xy);
                        vDensity = 1.0;
                        
                        float angle = atan(position.y, position.x);
                        float spiralWave = sin(angle * 3.0 + r * 10.0 - time);
                        vDensity += spiralWave * clamp(densityWaveAmplitude, 0.0, 0.2);
                        
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
                        float r = length(vPosition.xy);
                        
                        float innerEdge = smoothstep(innerRadius - 0.02, innerRadius + 0.02, r);
                        float outerEdge = 1.0 - smoothstep(outerRadius - 0.02, outerRadius + 0.02, r);
                        float edgeFade = innerEdge * outerEdge;
                        
                        if(edgeFade < 0.01) discard;
                        
                        vec3 lightDir = normalize(sunPosition - vWorldPosition);
                        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                        
                        float backscatter = max(0.0, dot(viewDir, lightDir));
                        backscatter = pow(backscatter, 2.0) * 0.3;
                        
                        vec3 color = ringColor;
                        color += vec3(0.2) * backscatter;
                        
                        float colorVar = sin(r * 50.0 + time * 0.5) * 0.1 + 1.0;
                        color *= clamp(colorVar, 0.5, 1.5);
                        
                        if(epsilonRing > 0.5) {
                            float sparkle = fract(sin(dot(vPosition.xy, vec2(12.9898, 78.233))) * 43758.5453);
                            sparkle = pow(sparkle, 20.0);
                            color += vec3(sparkle * 0.5);
                        }
                        
                        float density = clamp(vDensity, 0.5, 1.5);
                        float opacity = baseOpacity * edgeFade * density;
                        
                        float viewAngle = abs(dot(viewDir, vec3(0.0, 0.0, 1.0)));
                        opacity *= mix(0.5, 1.0, viewAngle);
                        
                        opacity = max(opacity, baseOpacity * 0.3);
                        
                        gl_FragColor = vec4(clamp(color, vec3(0.0), vec3(2.0)), clamp(opacity, 0.0, 1.0));
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.NormalBlending
            });
            
            return material;
        } catch (error) {
            this.handleError('Fixed ring shader creation failed', error);
            return this.createFallbackMaterial(ringData);
        }
    }
    
    /**
     * Safely create simple ring
     */
    safeCreateSimpleRing(ringData) {
        try {
            const quality = QualityPresets[PerformanceSettings.currentQuality] || QualityPresets.medium;
            const segments = Math.min(ringData.segments || quality.ringSegments || 128, 256);
            
            const geometry = this.safeCreateRingGeometry(ringData, segments, 8);
            if (!geometry) {
                throw new Error('Failed to create simple ring geometry');
            }
            
            let ringColor;
            if (ringData.name === 'ε') {
                ringColor = COLORS.rings.epsilon || 0xcccccc;
            } else if (ringData.name === 'μ' || ringData.name === 'ν') {
                ringColor = COLORS.rings.outer?.mu || 0xaaaaaa;
            } else {
                ringColor = COLORS.rings.main || 0xb0b0b0;
            }
            
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color(ringColor),
                transparent: true,
                opacity: Math.max(0.1, Math.min(1.0, ringData.opacity * 0.8)),
                side: THREE.DoubleSide,
                depthWrite: false
            });
            
            const ringMesh = new THREE.Mesh(geometry, material);
            ringMesh.rotation.x = -Math.PI / 2;
            ringMesh.name = `Ring_${ringData.name}`;
            
            ringMesh.userData = {
                baseOpacity: ringData.opacity,
                ringName: ringData.name,
                ringData: ringData,
                innerRadius: ringData.innerRadius,
                outerRadius: ringData.outerRadius,
                isSimple: true
            };
            
            this.ringMeshes.push(ringMesh);
            if (this.group) {
                this.group.add(ringMesh);
            }
            
            if (this.shouldHaveGlow(ringData.name)) {
                this.safeCreateSimpleRingGlow(ringData);
            }
            
            return true;
        } catch (error) {
            this.handleError(`Simple ring creation failed for ${ringData.name}`, error);
            return false;
        }
    }
    
    /**
     * Create fallback rings when main creation fails
     */
    createFallbackRings() {
        console.warn('⚠️ Creating fallback ring system');
        
        try {
            this.group = new THREE.Group();
            this.group.name = 'FallbackRingSystem';
            
            // Create minimal epsilon ring only
            const epsilonData = RINGS_DATA.find(r => r.name === 'ε') || {
                name: 'ε',
                innerRadius: 20,
                outerRadius: 25,
                opacity: 0.5
            };
            
            const geometry = new THREE.RingGeometry(
                epsilonData.innerRadius,
                epsilonData.outerRadius,
                32, 4
            );
            
            const material = new THREE.MeshBasicMaterial({
                color: 0xcccccc,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            
            const ringMesh = new THREE.Mesh(geometry, material);
            ringMesh.rotation.x = -Math.PI / 2;
            ringMesh.name = 'FallbackRing_ε';
            
            ringMesh.userData = {
                baseOpacity: 0.3,
                ringName: 'ε',
                isSimple: true,
                isFallback: true
            };
            
            this.ringMeshes.push(ringMesh);
            this.group.add(ringMesh);
            
            this.group.rotation.z = URANUS_TILT;
            this.scene.add(this.group);
            
            this.errorRecovery.fallbackMode = true;
            console.log('✅ Fallback ring system created');
        } catch (error) {
            console.error('❌ Even fallback ring creation failed:', error);
        }
    }
    
    /**
     * Safe calculation methods with bounds checking
     */
    safeCalculateOrbitalPeriod(radius) {
        try {
            const safeRadius = Math.max(0.1, radius);
            const a = safeRadius * URANUS_RADIUS * 1000;
            const GM = this.gravitationalConstant * this.uranusMass;
            
            if (GM <= 0 || a <= 0) {
                console.warn('⚠️ Invalid parameters for orbital period calculation');
                return 1.0; // Default fallback
            }
            
            return 2 * Math.PI * Math.sqrt((a * a * a) / GM) / 3600;
        } catch (error) {
            this.handleError('Orbital period calculation failed', error);
            return 1.0;
        }
    }
    
    safeEstimateParticleCount(ringData) {
        try {
            if (!ringData || typeof ringData.innerRadius !== 'number' || typeof ringData.outerRadius !== 'number') {
                return 1000000; // Default fallback
            }
            
            const area = Math.PI * (ringData.outerRadius * ringData.outerRadius - 
                                   ringData.innerRadius * ringData.innerRadius);
            const avgParticleSize = ringData.name === 'ε' ? 0.5 : 0.2;
            const particleDensity = 1e6;
            
            const count = Math.floor(Math.max(1000, area * particleDensity / (avgParticleSize * avgParticleSize)));
            return Math.min(count, 1e9); // Cap at reasonable maximum
        } catch (error) {
            this.handleError('Particle count estimation failed', error);
            return 1000000;
        }
    }
    
    safeEstimateRingMass(ringData) {
        try {
            if (!ringData || typeof ringData.innerRadius !== 'number' || typeof ringData.outerRadius !== 'number') {
                return 1e15; // Default fallback
            }
            
            const area = Math.PI * (ringData.outerRadius * ringData.outerRadius - 
                                   ringData.innerRadius * ringData.innerRadius);
            const avgThickness = 0.01; // km
            const density = 1000; // kg/m³
            
            const mass = area * URANUS_RADIUS * URANUS_RADIUS * avgThickness * 1000 * density;
            return Math.max(1e10, Math.min(mass, 1e20)); // Reasonable bounds
        } catch (error) {
            this.handleError('Ring mass estimation failed', error);
            return 1e15;
        }
    }
    
    /**
     * Safe glow creation methods
     */
    safeCreateSimpleRingGlow(ringData) {
        try {
            const glowGeometry = new THREE.RingGeometry(
                Math.max(0.1, ringData.innerRadius - 0.5),
                ringData.outerRadius + 0.5,
                64, 1
            );
            
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: ringData.name === 'ε' ? (COLORS.rings.glow || 0x4499ff) : 0x808080,
                transparent: true,
                opacity: Math.max(0.05, Math.min(0.5, ringData.name === 'ε' ? 0.2 : 0.1)),
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            
            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            glowMesh.rotation.x = -Math.PI / 2;
            glowMesh.name = `RingGlow_${ringData.name}`;
            glowMesh.userData.baseOpacity = glowMaterial.opacity;
            
            this.glowMeshes.push(glowMesh);
            if (this.group) {
                this.group.add(glowMesh);
            }
        } catch (error) {
            this.handleError(`Simple glow creation failed for ${ringData.name}`, error);
        }
    }
    
    safeCreateEnhancedRingGlow(ringData) {
        try {
            const glowGeometry = new THREE.RingGeometry(
                Math.max(0.1, ringData.innerRadius - 0.2),
                ringData.outerRadius + 0.2,
                128, 1
            );
            
            const glowMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    color: { value: new THREE.Color(
                        ringData.name === 'ε' ? (COLORS.rings.glow || 0x4499ff) : 0x808080
                    )},
                    baseOpacity: { value: Math.max(0.05, ringData.name === 'ε' ? 0.25 : 0.15) },
                    innerRadius: { value: Math.max(0.1, ringData.innerRadius) },
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
                        
                        float innerGlow = 1.0 - smoothstep(innerRadius - 0.5, innerRadius, r);
                        float outerGlow = smoothstep(outerRadius, outerRadius + 0.5, r);
                        float glow = max(innerGlow, outerGlow);
                        
                        float pulse = sin(time * 2.0 + r * 5.0) * 0.3 + 0.7;
                        
                        float opacity = baseOpacity * glow * pulse;
                        
                        gl_FragColor = vec4(color, clamp(opacity, 0.0, 1.0));
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
            if (this.group) {
                this.group.add(glowMesh);
            }
        } catch (error) {
            this.handleError(`Enhanced glow creation failed for ${ringData.name}`, error);
            this.safeCreateSimpleRingGlow(ringData);
        }
    }
    
    safeCreatePhysicsRingGlow(ringData) {
        // For now, use enhanced glow with additional safety
        this.safeCreateEnhancedRingGlow(ringData);
    }
    
    /**
     * Safe initialization of physics state
     */
    safeInitializePhysicsState() {
        try {
            if (!this.physicsState || this.physicsState.hasErrors) {
                console.warn('⚠️ Physics state unavailable for initialization');
                return;
            }
            
            // Validate physics prerequisites
            if (!this.physicsState.resonanceLocations || this.physicsState.resonanceLocations.size === 0) {
                console.warn('⚠️ No resonance data available for physics');
            }
            
            if (!this.physicsState.interactionGrid) {
                console.warn('⚠️ No interaction grid available for physics');
            }
            
            this.physicsState.isInitialized = true;
            console.log('🔬 Physics state initialized successfully');
        } catch (error) {
            this.handleError('Physics state initialization failed', error);
            this.physicsEnabled = false;
        }
    }
    
    /**
     * Main update method with comprehensive error handling
     */
    update(deltaTime, uranusRotation, moonPositions) {
        if (!this.group) {
            console.warn('⚠️ Ring group not available for update');
            return;
        }
        
        try {
            // Monitor performance
            const updateStart = performance.now();
            
            this.time += Math.max(0, Math.min(deltaTime, 1.0)); // Cap deltaTime
            
            // Synchronize ring rotation with Uranus
            if (typeof uranusRotation === 'number' && isFinite(uranusRotation)) {
                this.group.rotation.y = uranusRotation;
            }
            
            // Update physics if enabled and initialized
            if (this.physicsEnabled && this.physicsState?.isInitialized && !this.errorRecovery.fallbackMode) {
                this.safeUpdatePhysics(deltaTime, moonPositions);
            }
            
            // Update shader uniforms
            this.safeUpdateShaderUniforms(moonPositions);
            
            // Update visual effects
            this.safeUpdateVisualEffects(deltaTime);
            
            // Monitor performance
            const updateEnd = performance.now();
            this.updatePerformanceMonitoring(updateEnd - updateStart, deltaTime);
            
        } catch (error) {
            this.handleError('Ring system update failed', error);
            // Attempt to continue with reduced functionality
            this.errorRecovery.currentRetries++;
            if (this.errorRecovery.currentRetries > this.errorRecovery.maxRetries) {
                this.errorRecovery.fallbackMode = true;
                console.warn('⚠️ Entering fallback mode due to repeated errors');
            }
        }
    }
    
    /**
     * Safe physics updates with error handling
     */
    safeUpdatePhysics(deltaTime, moonPositions) {
        if (!this.physicsScheduler || !this.physicsScheduler.isActive) {
            return;
        }
        
        try {
            this.physicsScheduler.frameCounter++;
            const frame = this.physicsScheduler.frameCounter;
            
            // High frequency updates (every frame)
            this.safeUpdateDensityWaves(deltaTime);
            this.safeUpdateParticleMotion(deltaTime);
            
            // Medium frequency updates (every 3 frames)
            if (frame % 3 === 0) {
                this.safeUpdateMoonInfluences(moonPositions);
                this.safeUpdateResonanceEffects();
            }
            
            // Low frequency updates (every 10 frames)
            if (frame % 10 === 0) {
                this.safeUpdateShepherdMoonEffects();
                this.safeUpdateCollisionDetection();
            }
            
        } catch (error) {
            this.handleError('Physics update failed', error);
            this.physicsScheduler.isActive = false;
        }
    }
    
    /**
     * Placeholder physics update methods with safety
     */
    safeUpdateDensityWaves(deltaTime) {
        // Implemented safely - updates wave parameters
        try {
            this.ringMeshes.forEach((ring, index) => {
                if (ring.material.uniforms && ring.material.uniforms.densityWaveAmplitude) {
                    const baseAmplitude = ring.userData.baseOpacity || 0.05;
                    const variation = Math.sin(this.time * 0.1 + index) * 0.02;
                    ring.material.uniforms.densityWaveAmplitude.value = 
                        Math.max(0.01, baseAmplitude + variation);
                }
            });
        } catch (error) {
            console.warn('⚠️ Density wave update failed:', error.message);
        }
    }
    
    safeUpdateParticleMotion(deltaTime) {
        // Safe particle motion updates
        try {
            // Update time for all shaders
            this.ringMeshes.forEach(ring => {
                if (ring.material.uniforms && ring.material.uniforms.time) {
                    ring.material.uniforms.time.value = this.time;
                }
            });
        } catch (error) {
            console.warn('⚠️ Particle motion update failed:', error.message);
        }
    }
    
    safeUpdateMoonInfluences(moonPositions) {
        if (!Array.isArray(moonPositions) || moonPositions.length === 0) {
            return;
        }
        
        try {
            // Process moon influences safely
            const influences = this.calculateMoonInfluences(moonPositions);
            this.applyMoonInfluences(influences);
        } catch (error) {
            console.warn('⚠️ Moon influence update failed:', error.message);
        }
    }
    
    safeUpdateResonanceEffects() {
        // Safe resonance effect updates
        try {
            if (this.physicsState?.resonanceLocations) {
                // Apply resonance effects to rings
                this.ringMeshes.forEach(ring => {
                    if (ring.material.uniforms && ring.material.uniforms.resonanceStrength) {
                        const ringRadius = (ring.userData.innerRadius + ring.userData.outerRadius) / 2;
                        let resonanceStrength = 0;
                        
                        // Check for nearby resonances
                        for (const [moonName, resonances] of this.physicsState.resonanceLocations) {
                            resonances.forEach(resonance => {
                                const distance = Math.abs(resonance.radius - ringRadius);
                                if (distance < 1.0) {
                                    resonanceStrength += resonance.strength * Math.exp(-distance * 5);
                                }
                            });
                        }
                        
                        ring.material.uniforms.resonanceStrength.value = 
                            Math.min(resonanceStrength, 1.0);
                    }
                });
            }
        } catch (error) {
            console.warn('⚠️ Resonance effect update failed:', error.message);
        }
    }
    
    safeUpdateShepherdMoonEffects() {
        // Safe shepherd moon effect updates
        try {
            this.ringMeshes.forEach(ring => {
                if (ring.userData.ringName === 'ε' && ring.material.uniforms?.shepherdMoonEffect) {
                    // Epsilon ring has Cordelia and Ophelia as shepherds
                    ring.material.uniforms.shepherdMoonEffect.value = 0.3;
                }
            });
        } catch (error) {
            console.warn('⚠️ Shepherd moon effect update failed:', error.message);
        }
    }
    
    safeUpdateCollisionDetection() {
        // Placeholder for collision detection
        try {
            // Would implement particle collision detection here
            // For now, just a placeholder
        } catch (error) {
            console.warn('⚠️ Collision detection update failed:', error.message);
        }
    }
    
    /**
     * Calculate moon influences with safety checks
     */
    calculateMoonInfluences(moonPositions) {
        const influences = [];
        
        if (!Array.isArray(moonPositions)) {
            return influences;
        }
        
        try {
            moonPositions.forEach((moonData, index) => {
                if (!moonData || !moonData.position) {
                    return;
                }
                
                const moonInfo = MOONS_DATA[index];
                if (!moonInfo) {
                    return;
                }
                
                // Transform to ring coordinates safely
                const ringCoords = this.safeCartesianToRingCoords(moonData.position);
                if (!ringCoords) {
                    return;
                }
                
                const moonMass = this.safeCalculateMoonMass(moonInfo);
                const tidalEffects = this.safeCalculateTidalEffects(ringCoords, moonMass);
                
                influences.push({
                    position: ringCoords,
                    mass: moonMass,
                    tidalForces: tidalEffects,
                    type: moonData.type || 'major',
                    name: moonInfo.name
                });
            });
            
            // Sort by influence strength safely
            influences.sort((a, b) => {
                const strengthA = a.tidalForces?.strength || 0;
                const strengthB = b.tidalForces?.strength || 0;
                return strengthB - strengthA;
            });
            
            return influences.slice(0, 5); // Top 5
        } catch (error) {
            this.handleError('Moon influence calculation failed', error);
            return [];
        }
    }
    
    /**
     * Safe coordinate transformation
     */
    safeCartesianToRingCoords(position) {
        try {
            if (!position || typeof position.x !== 'number' || !isFinite(position.x)) {
                return null;
            }
            
            const r = Math.sqrt(position.x * position.x + position.y * position.y);
            const theta = Math.atan2(position.y, position.x);
            const z = position.z || 0;
            
            if (!isFinite(r) || !isFinite(theta) || !isFinite(z)) {
                return null;
            }
            
            return { r, theta, z, cartesian: position };
        } catch (error) {
            console.warn('⚠️ Coordinate transformation failed:', error.message);
            return null;
        }
    }
    
    /**
     * Safe moon mass calculation
     */
    safeCalculateMoonMass(moonInfo) {
        try {
            if (!moonInfo || typeof moonInfo.radius !== 'number' || moonInfo.radius <= 0) {
                return 1e20; // Default fallback
            }
            
            let density = 1500; // Default density
            
            if (moonInfo.name === 'Titania' || moonInfo.name === 'Oberon') {
                density = 1700;
            } else if (moonInfo.name === 'Ariel' || moonInfo.name === 'Umbriel') {
                density = 1600;
            } else if (moonInfo.name === 'Miranda') {
                density = 1200;
            }
            
            const radiusMeters = Math.max(1000, moonInfo.radius * URANUS_RADIUS * 1000);
            const volume = (4/3) * Math.PI * Math.pow(radiusMeters, 3);
            const mass = density * volume;
            
            return Math.max(1e15, Math.min(mass, 1e25)); // Reasonable bounds
        } catch (error) {
            console.warn('⚠️ Moon mass calculation failed:', error.message);
            return 1e20;
        }
    }
    
    /**
     * Safe tidal effects calculation
     */
    safeCalculateTidalEffects(ringCoords, moonMass) {
        try {
            if (!ringCoords || typeof moonMass !== 'number' || moonMass <= 0) {
                return { strength: 0, radial: 0, azimuthal: 0 };
            }
            
            const distance = Math.max(1000, ringCoords.r * URANUS_RADIUS * 1000);
            const moonDistance = Math.max(distance, Math.sqrt(
                ringCoords.cartesian.x * ringCoords.cartesian.x + 
                ringCoords.cartesian.y * ringCoords.cartesian.y + 
                ringCoords.cartesian.z * ringCoords.cartesian.z
            ) * URANUS_RADIUS * 1000);
            
            const hillRadius = moonDistance * Math.pow(moonMass / (3 * this.uranusMass), 1/3);
            const tidalStrength = (this.gravitationalConstant * moonMass) / 
                                 Math.pow(Math.max(moonDistance, hillRadius), 3);
            
            const safeTheta = ringCoords.theta || 0;
            const radialForce = tidalStrength * Math.cos(safeTheta);
            const azimuthalForce = tidalStrength * Math.sin(safeTheta);
            
            return {
                strength: Math.min(tidalStrength, 1e-10), // Cap strength
                radial: radialForce,
                azimuthal: azimuthalForce,
                hillRadius: hillRadius
            };
        } catch (error) {
            console.warn('⚠️ Tidal effects calculation failed:', error.message);
            return { strength: 0, radial: 0, azimuthal: 0 };
        }
    }
    
    /**
     * Apply moon influences to rings
     */
    applyMoonInfluences(influences) {
        if (!Array.isArray(influences) || influences.length === 0) {
            return;
        }
        
        try {
            this.ringMeshes.forEach(ring => {
                if (!ring.material.uniforms || ring.userData.isSimple) {
                    return;
                }
                
                const moonPosArray = influences.slice(0, 5).map(inf => 
                    inf.position?.cartesian || new THREE.Vector3(0, 0, 0)
                );
                const moonMassArray = influences.slice(0, 5).map(inf => 
                    Math.max(1e10, (inf.mass || 1e20) / 1e20)
                );
                
                if (ring.material.uniforms.moonPositions) {
                    ring.material.uniforms.moonPositions.value = moonPosArray;
                }
                
                if (ring.material.uniforms.moonMasses) {
                    ring.material.uniforms.moonMasses.value = moonMassArray;
                }
                
                if (ring.material.uniforms.moonCount) {
                    ring.material.uniforms.moonCount.value = Math.min(influences.length, 5);
                }
            });
        } catch (error) {
            console.warn('⚠️ Applying moon influences failed:', error.message);
        }
    }
    
    /**
     * Safe shader uniforms update
     */
    safeUpdateShaderUniforms(moonPositions) {
        try {
            // Get camera safely
            const camera = this.scene.getObjectByProperty('isCamera', true);
            const cameraPos = camera ? camera.position : new THREE.Vector3(0, 0, 100);
            
            if (!Array.isArray(moonPositions) || moonPositions.length === 0) {
                this.setDefaultShaderUniforms(cameraPos);
                return;
            }
            
            // Update physics-based uniforms if enabled
            if (this.physicsEnabled && this.physicsState?.isInitialized && this.usePhysicsShaders) {
                this.updatePhysicsShaderUniforms(moonPositions, cameraPos);
            } else {
                this.updateBasicShaderUniforms(cameraPos);
            }
            
        } catch (error) {
            this.handleError('Shader uniforms update failed', error);
            // Continue with basic updates
            try {
                this.setDefaultShaderUniforms(new THREE.Vector3(0, 0, 100));
            } catch (fallbackError) {
                console.error('❌ Even fallback shader update failed:', fallbackError);
            }
        }
    }
    
    /**
     * Update physics-based shader uniforms
     */
    updatePhysicsShaderUniforms(moonPositions, cameraPos) {
        try {
            const influences = this.calculateMoonInfluences(moonPositions);
            
            this.ringMeshes.forEach(ring => {
                if (!ring.material.uniforms || ring.userData.isSimple) {
                    return;
                }
                
                // Update basic parameters
                ring.material.uniforms.time.value = this.time;
                ring.material.uniforms.cameraPosition.value = cameraPos;
                
                // Update moon influences
                this.applyMoonInfluences(influences);
                
                // Calculate physics effects
                const ringRadius = (ring.userData.innerRadius + ring.userData.outerRadius) / 2;
                const densityWaveData = this.calculateDensityWaves(ringRadius, influences);
                
                if (ring.material.uniforms.densityWaveAmplitude) {
                    ring.material.uniforms.densityWaveAmplitude.value = densityWaveData.amplitude;
                }
                
                if (ring.material.uniforms.densityWaveFrequency) {
                    ring.material.uniforms.densityWaveFrequency.value = densityWaveData.frequency;
                }
            });
            
        } catch (error) {
            console.warn('⚠️ Physics shader uniforms update failed:', error.message);
            this.updateBasicShaderUniforms(cameraPos);
        }
    }
    
    /**
     * Update basic shader uniforms
     */
    updateBasicShaderUniforms(cameraPos) {
        try {
            this.ringMeshes.forEach(ring => {
                if (ring.material.uniforms) {
                    ring.material.uniforms.time.value = this.time;
                    ring.material.uniforms.cameraPosition.value = cameraPos;
                }
            });
        } catch (error) {
            console.warn('⚠️ Basic shader uniforms update failed:', error.message);
        }
    }
    
    /**
     * Set default shader uniforms when no data available
     */
    setDefaultShaderUniforms(cameraPos) {
        try {
            this.ringMeshes.forEach(ring => {
                if (ring.material.uniforms && !ring.userData.isSimple) {
                    ring.material.uniforms.time.value = this.time;
                    ring.material.uniforms.cameraPosition.value = cameraPos;
                    ring.material.uniforms.densityWaveAmplitude.value = 0.05;
                    ring.material.uniforms.densityWaveFrequency.value = 10.0;
                    ring.material.uniforms.moonCount.value = 0;
                }
            });
        } catch (error) {
            console.warn('⚠️ Default shader uniforms update failed:', error.message);
        }
    }
    
    /**
     * Calculate density waves with safety
     */
    calculateDensityWaves(ringRadius, moonInfluences) {
        try {
            let totalAmplitude = 0.05;
            let dominantFrequency = 10.0;
            
            if (Array.isArray(moonInfluences)) {
                moonInfluences.forEach(influence => {
                    if (influence.position && typeof influence.position.r === 'number') {
                        const distance = Math.abs(influence.position.r - ringRadius);
                        if (distance < 1.0) {
                            const waveAmplitude = Math.min(0.2, 
                                (influence.tidalForces?.strength || 0) * 1e8 * 
                                Math.exp(-distance * distance / 0.5)
                            );
                            totalAmplitude += waveAmplitude;
                            
                            const orbitalFreq = Math.sqrt(this.gravitationalConstant * this.uranusMass / 
                                Math.pow(Math.max(1000, ringRadius * URANUS_RADIUS * 1000), 3));
                            dominantFrequency += orbitalFreq * waveAmplitude * 100;
                        }
                    }
                });
            }
            
            return {
                amplitude: Math.max(0.01, Math.min(totalAmplitude, 0.5)),
                frequency: Math.max(1.0, Math.min(dominantFrequency, 50.0)),
                phase: this.time * dominantFrequency
            };
        } catch (error) {
            console.warn('⚠️ Density wave calculation failed:', error.message);
            return {
                amplitude: 0.05,
                frequency: 10.0,
                phase: this.time * 10.0
            };
        }
    }
    
    /**
     * Safe visual effects update
     */
    safeUpdateVisualEffects(deltaTime) {
        try {
            // Update ring shimmer
            this.ringMeshes.forEach((ring, index) => {
                if (ring.userData.isSimple) {
                    // Simple opacity animation
                    const shimmer = 0.9 + 0.1 * Math.sin(this.time * 0.3 + index);
                    ring.material.opacity = Math.max(0.1, ring.userData.baseOpacity * shimmer);
                } else if (ring.material.uniforms && ring.material.uniforms.baseOpacity) {
                    // Shader-based animation
                    const shimmer = 0.95 + 0.05 * Math.sin(this.time * 0.2 + index);
                    ring.material.uniforms.baseOpacity.value = 
                        Math.max(0.1, ring.userData.baseOpacity * shimmer);
                }
            });
            
            // Update glow pulsing
            this.glowMeshes.forEach((glow, index) => {
                if (glow.material.opacity !== undefined) {
                    // Simple material
                    const pulse = 0.7 + 0.3 * Math.sin(this.time * 0.15 + index * 0.5);
                    glow.material.opacity = Math.max(0.05, glow.userData.baseOpacity * pulse);
                } else if (glow.material.uniforms && glow.material.uniforms.baseOpacity) {
                    // Shader material
                    const pulse = 0.8 + 0.2 * Math.sin(this.time * 0.15 + index * 0.5);
                    glow.material.uniforms.baseOpacity.value = 
                        Math.max(0.05, glow.userData.baseOpacity * pulse);
                }
            });
            
        } catch (error) {
            console.warn('⚠️ Visual effects update failed:', error.message);
        }
    }
    
    /**
     * Performance monitoring with auto-adjustment
     */
    updatePerformanceMonitoring(updateTime, deltaTime) {
        try {
            const monitor = this.performanceMonitor;
            monitor.frameCount++;
            monitor.totalTime += deltaTime * 1000; // Convert to ms
            monitor.physicsTime += updateTime;
            
            // Check performance every 60 frames
            if (monitor.frameCount >= 60) {
                monitor.averageFrameTime = monitor.totalTime / monitor.frameCount;
                
                // Auto-adjust quality if performance is poor
                const now = performance.now();
                if (now - monitor.lastQualityCheck > 5000) { // Check every 5 seconds
                    monitor.lastQualityCheck = now;
                    
                    if (monitor.averageFrameTime > 25 && !this.errorRecovery.fallbackMode) {
                        this.autoReduceQuality();
                    } else if (monitor.averageFrameTime < 12 && monitor.qualityReductions > 0) {
                        this.autoIncreaseQuality();
                    }
                }
                
                // Reset counters
                monitor.frameCount = 0;
                monitor.totalTime = 0;
                monitor.physicsTime = 0;
            }
            
        } catch (error) {
            console.warn('⚠️ Performance monitoring failed:', error.message);
        }
    }
    
    /**
     * Auto-reduce quality for performance
     */
    autoReduceQuality() {
        try {
            console.log('⚡ Auto-reducing ring quality for performance');
            
            if (this.usePhysicsShaders) {
                this.usePhysicsShaders = false;
                this.performanceMonitor.qualityReductions++;
            } else if (this.useAdvancedShaders) {
                this.useAdvancedShaders = false;
                this.performanceMonitor.qualityReductions++;
            } else if (this.physicsEnabled) {
                this.physicsEnabled = false;
                this.performanceMonitor.qualityReductions++;
            }
            
        } catch (error) {
            console.warn('⚠️ Quality reduction failed:', error.message);
        }
    }
    
    /**
     * Auto-increase quality when performance allows
     */
    autoIncreaseQuality() {
        try {
            if (this.performanceMonitor.qualityReductions > 0) {
                console.log('🚀 Auto-increasing ring quality due to good performance');
                
                if (!this.physicsEnabled) {
                    this.physicsEnabled = true;
                } else if (!this.useAdvancedShaders) {
                    this.useAdvancedShaders = true;
                } else if (!this.usePhysicsShaders) {
                    this.usePhysicsShaders = true;
                }
                
                this.performanceMonitor.qualityReductions = Math.max(0, 
                    this.performanceMonitor.qualityReductions - 1);
            }
        } catch (error) {
            console.warn('⚠️ Quality increase failed:', error.message);
        }
    }
    
    /**
     * Utility methods
     */
    shouldHaveGlow(ringName) {
        return ringName === 'ε' || ringName === 'α' || ringName === 'β';
    }
    
    setVisible(visible) {
        if (this.group) {
            this.group.visible = Boolean(visible);
        }
    }
    
    getRingByName(name) {
        return this.ringMeshes.find(ring => ring.userData.ringName === name);
    }
    
    getGroup() {
        return this.group;
    }
    
    getRingMeshes() {
        return this.ringMeshes;
    }
    
    /**
     * Get system status for debugging
     */
    getSystemStatus() {
        return {
            isInitialized: Boolean(this.group),
            physicsEnabled: this.physicsEnabled,
            useAdvancedShaders: this.useAdvancedShaders,
            usePhysicsShaders: this.usePhysicsShaders,
            fallbackMode: this.errorRecovery.fallbackMode,
            ringCount: this.ringMeshes.length,
            glowCount: this.glowMeshes.length,
            errorCount: this.physicsState?.errorLog?.length || 0,
            averageFrameTime: this.performanceMonitor.averageFrameTime,
            qualityReductions: this.performanceMonitor.qualityReductions
        };
    }
    
    /**
     * Error handling system
     */
    handleError(message, error) {
        const errorInfo = {
            message: message,
            error: error?.message || error,
            stack: error?.stack,
            timestamp: new Date().toISOString(),
            context: this.getSystemStatus()
        };
        
        // Log to console
        console.error(`❌ Ring System Error: ${message}`, error);
        
        // Store in error log
        if (this.physicsState?.errorLog) {
            this.physicsState.errorLog.push(errorInfo);
            
            // Keep only last 10 errors
            if (this.physicsState.errorLog.length > 10) {
                this.physicsState.errorLog.shift();
            }
            
            this.physicsState.hasErrors = true;
        }
        
        // Update error recovery state
        this.errorRecovery.lastError = errorInfo;
    }
    
    /**
     * Get error report for debugging
     */
    getErrorReport() {
        return {
            hasErrors: this.physicsState?.hasErrors || false,
            errorCount: this.physicsState?.errorLog?.length || 0,
            lastError: this.errorRecovery.lastError,
            fallbackMode: this.errorRecovery.fallbackMode,
            retryCount: this.errorRecovery.currentRetries,
            errors: this.physicsState?.errorLog || []
        };
    }
    
    /**
     * Reset error state
     */
    resetErrors() {
        if (this.physicsState) {
            this.physicsState.hasErrors = false;
            this.physicsState.errorLog = [];
        }
        
        this.errorRecovery.currentRetries = 0;
        this.errorRecovery.lastError = null;
        console.log('🔄 Ring system errors reset');
    }
    
    /**
     * Enable/disable physics
     */
    togglePhysics(enabled) {
        const wasEnabled = this.physicsEnabled;
        this.physicsEnabled = Boolean(enabled);
        
        if (enabled && !wasEnabled) {
            console.log('🔬 Ring physics enabled');
            this.safeInitializePhysics();
        } else if (!enabled && wasEnabled) {
            console.log('⚡ Ring physics disabled');
            if (this.physicsScheduler) {
                this.physicsScheduler.isActive = false;
            }
        }
    }
    
    /**
     * Comprehensive disposal with cleanup
     */
    dispose() {
        try {
            console.log('🧹 Disposing ring system...');
            
            // Dispose ring meshes
            this.ringMeshes.forEach(ring => {
                try {
                    if (ring.geometry) ring.geometry.dispose();
                    if (ring.material) {
                        // Dispose textures in uniforms
                        if (ring.material.uniforms) {
                            Object.values(ring.material.uniforms).forEach(uniform => {
                                if (uniform.value && uniform.value.dispose) {
                                    uniform.value.dispose();
                                }
                            });
                        }
                        ring.material.dispose();
                    }
                } catch (error) {
                    console.warn('⚠️ Error disposing ring mesh:', error);
                }
            });
            
            // Dispose glow meshes
            this.glowMeshes.forEach(glow => {
                try {
                    if (glow.geometry) glow.geometry.dispose();
                    if (glow.material) {
                        if (glow.material.uniforms) {
                            Object.values(glow.material.uniforms).forEach(uniform => {
                                if (uniform.value && uniform.value.dispose) {
                                    uniform.value.dispose();
                                }
                            });
                        }
                        glow.material.dispose();
                    }
                } catch (error) {
                    console.warn('⚠️ Error disposing glow mesh:', error);
                }
            });
            
            // Remove from scene
            if (this.scene && this.group && this.group.parent) {
                this.scene.remove(this.group);
            }
            
            // Clear all references
            this.ringMeshes = [];
            this.glowMeshes = [];
            this.densityWaves = [];
            this.moonResonances.clear();
            this.group = null;
            this.scene = null;
            this.physicsState = null;
            this.physicsScheduler = null;
            this.validator = null;
            
            console.log('✅ Ring system disposed successfully');
            
        } catch (error) {
            console.error('❌ Error during ring system disposal:', error);
        }
    }
}

// Export validation class for optional use
export class RingPhysicsValidator {
    // Implementation would go here - simplified for space
    constructor(ringsInstance) {
        this.rings = ringsInstance;
        console.log('🔬 Ring physics validator created');
    }
    
    async runQuickValidation() {
        if (!this.rings) return null;
        
        const status = this.rings.getSystemStatus();
        console.log('📊 Ring system validation:', status);
        return status;
    }
}

export { Rings as default };
