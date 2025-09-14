/**
 * Magnetosphere - Scientifically accurate Uranus magnetosphere
 * Based on Voyager 2 data and recent 2024 research
 */

import { MAGNETOSPHERE_CONFIG, URANUS_TILT, URANUS_RADIUS } from '../config/constants.js';

export default class Magnetosphere {
    constructor(scene) {
        this.scene = scene;
        this.group = null;
        
        // Core components
        this.fieldLines = [];
        this.radiationBelts = { inner: null, outer: null };
        this.plasmaSheet = null;
        this.magnetopause = null;
        this.bowShock = null;
        this.tail = null;
        this.aurorae = null;
        
        // Dynamic state
        this.animationTime = 0;
        this.rotationPhase = 0; // Track daily rotation for "switch-like" behavior
        this.solarWindPressure = 1.0; // Normalized solar wind pressure
        
        // TODO: Add configuration states
        // The magnetosphere has 4 main configurations during rotation:
        // 1. Pole-on to solar wind (2x per day)
        // 2. Equator-on to solar wind (2x per day)
        // Each creates dramatically different field configurations
        this.configurationState = 'equatorial'; // 'polar_north', 'polar_south', 'equatorial_dawn', 'equatorial_dusk'
    }
    
    create() {
        this.group = new THREE.Group();
        this.group.name = 'Magnetosphere';
        
        // TODO: Create magnetopause boundary (18-28 Uranian radii)
        // This is the outer boundary where solar wind meets magnetic field
        // Should be a deformable mesh that responds to solar wind pressure
        this.createMagnetopause();
        
        // TODO: Create bow shock (23 Uranian radii ahead)
        // Where supersonic solar wind becomes subsonic
        // Should be visible as a curved shock front
        this.createBowShock();
        
        // TODO: Create radiation belts - CRITICAL MISSING COMPONENT
        // Uranus has intense radiation belts, second only to Jupiter
        // Inner belt: ~1.5-3 Uranian radii (protons)
        // Outer belt: ~3-8 Uranian radii (electrons)
        // Particles up to 4 MeV (protons) and 1.2 MeV (electrons)
        this.createRadiationBelts();
        
        // Enhanced field lines with proper geometry
        this.createEnhancedFieldLines();
        
        // TODO: Create asymmetric plasma sheet in tail
        // The plasma sheet is highly curved and asymmetric
        // Changes position dramatically with rotation
        this.createPlasmaSheet();
        
        // Enhanced magnetotail (extends millions of km)
        this.createEnhancedMagnetotail();
        
        // Enhanced auroral zones (far from poles!)
        this.createEnhancedAurorae();
        
        // TODO: Add moon/ring interaction regions
        // Moons create gaps in radiation belts
        // Rings absorb particles creating "shadows"
        this.createMoonInteractionRegions();
        
        // Apply complex tilts
        // Note: The magnetic dipole is tilted 60° from rotation axis
        // AND offset 31% toward north rotational pole
        this.applyMagneticGeometry();
        
        this.group.visible = false;
        this.scene.add(this.group);
    }
    
    /**
     * TODO: Create magnetopause boundary
     * This should be a dynamic mesh that changes shape with:
     * - Solar wind pressure (compresses on day side)
     * - Rotation phase (changes dramatically every 17.24 hours)
     * - IMF orientation
     */
    createMagnetopause() {
        // Magnetopause should be at:
        // - Subsolar point: 18 RU (compressed) to 28 RU (relaxed)
        // - Flanks: ~25-35 RU
        // - Use parametric surface or marching cubes for dynamic shape
        
        /* Implementation notes:
        const geometry = new THREE.ParametricGeometry(
            (u, v, target) => {
                // Parametric equation for magnetopause
                // Should bulge on night side, compress on day side
                const theta = u * Math.PI * 2;
                const phi = v * Math.PI;
                
                // Base radius varies with angle to sun
                const sunAngle = Math.atan2(Math.sin(theta), Math.cos(theta));
                const compressionFactor = 0.7 + 0.3 * Math.cos(sunAngle);
                
                const r = 23 * URANUS_RADIUS * compressionFactor;
                
                // Add asymmetry based on magnetic configuration
                const asymmetry = this.calculateAsymmetry(theta, phi);
                
                target.setFromSpherical(r * asymmetry, theta, phi);
            },
            64, 32
        );
        */
    }
    
    /**
     * TODO: Create bow shock
     * Shock front where solar wind becomes subsonic
     * Should be ~5 RU ahead of magnetopause
     */
    createBowShock() {
        // Bow shock characteristics:
        // - Stand-off distance: ~23 RU at subsolar point
        // - Flares out to ~30-40 RU on flanks
        // - Use shader for shock visualization (density jump)
        
        /* Implementation:
        const shockGeometry = new THREE.ParametricGeometry(...);
        const shockMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                shockStrength: { value: 1.0 },
                solarWindAngle: { value: new THREE.Vector3(1, 0, 0) }
            },
            vertexShader: `
                // Shock wave visualization
                varying float vShockIntensity;
                uniform vec3 solarWindAngle;
                
                void main() {
                    // Calculate shock intensity based on angle to solar wind
                    vShockIntensity = max(0.0, dot(normal, solarWindAngle));
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying float vShockIntensity;
                uniform float time;
                
                void main() {
                    // Visualize shock compression
                    float shock = vShockIntensity * (0.5 + 0.5 * sin(time * 3.0));
                    vec3 color = mix(vec3(0.2, 0.5, 0.8), vec3(1.0, 0.8, 0.3), shock);
                    gl_FragColor = vec4(color, shock * 0.3);
                }
            `
        });
        */
    }
    
    /**
     * TODO: Create radiation belts - CRITICAL COMPONENT
     * Uranus has unexpectedly intense radiation belts
     */
    createRadiationBelts() {
        // Inner radiation belt (mainly protons)
        // - Location: 1.5-3 RU
        // - Energy: up to 4 MeV
        // - Should show as dense particle region
        
        /* Inner belt implementation:
        const innerBeltGeometry = new THREE.TorusGeometry(
            2.25 * URANUS_RADIUS,  // Major radius
            0.75 * URANUS_RADIUS,  // Minor radius
            32, 64
        );
        
        // Use particle system for belt visualization
        const particleCount = 10000;
        const innerBeltParticles = new THREE.BufferGeometry();
        const positions = [];
        const energies = [];
        
        for (let i = 0; i < particleCount; i++) {
            // Distribute particles in torus volume
            const u = Math.random() * Math.PI * 2;
            const v = Math.random() * Math.PI * 2;
            const r = 2.25 * URANUS_RADIUS + Math.cos(v) * 0.75 * URANUS_RADIUS;
            
            positions.push(
                Math.cos(u) * r,
                Math.sin(v) * 0.75 * URANUS_RADIUS,
                Math.sin(u) * r
            );
            
            // Energy distribution (Maxwell-Boltzmann-like)
            energies.push(Math.random() * 4.0); // Up to 4 MeV
        }
        
        innerBeltParticles.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        innerBeltParticles.setAttribute('energy', new THREE.Float32BufferAttribute(energies, 1));
        */
        
        // Outer radiation belt (mainly electrons)
        // - Location: 3-8 RU
        // - Energy: up to 1.2 MeV
        // - More diffuse than inner belt
        // - Shows gaps where moons sweep particles
        
        /* Outer belt with moon gaps:
        // Create gaps at major moon L-shells
        const moonLShells = [5.08, 7.47, 10.41]; // Miranda, Ariel, Umbriel
        
        const outerBeltMaterial = new THREE.ShaderMaterial({
            uniforms: {
                moonPositions: { value: moonLShells },
                time: { value: 0 },
                particleDensity: { value: 1.0 }
            },
            vertexShader: `
                attribute float energy;
                varying float vEnergy;
                varying vec3 vPosition;
                
                void main() {
                    vEnergy = energy;
                    vPosition = position;
                    
                    // Particle size based on energy
                    gl_PointSize = 2.0 + energy * 3.0;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float[3] moonPositions;
                varying float vEnergy;
                varying vec3 vPosition;
                
                void main() {
                    float r = length(vPosition.xz);
                    
                    // Check for moon sweeping gaps
                    float density = 1.0;
                    for (int i = 0; i < 3; i++) {
                        float gap = 1.0 - exp(-pow(r - moonPositions[i], 2.0) / 0.1);
                        density *= gap;
                    }
                    
                    // Color based on particle energy
                    vec3 color = mix(vec3(0.3, 0.5, 1.0), vec3(1.0, 0.3, 0.3), vEnergy / 1.2);
                    
                    gl_FragColor = vec4(color, density * 0.5);
                }
            `
        });
        */
    }
    
    /**
     * Enhanced field lines showing complex structure
     */
    createEnhancedFieldLines() {
        // Field lines should show:
        // 1. Dipole component (main field)
        // 2. Quadrupole component (20% strength)
        // 3. Octupole component (10% strength)
        // This creates the complex, asymmetric field observed
        
        /* Multi-pole field implementation:
        const calculateFieldLine = (startPoint, steps = 200) => {
            const points = [startPoint];
            let current = startPoint.clone();
            
            for (let i = 0; i < steps; i++) {
                // Calculate field at current point
                const B = this.calculateMagneticField(current);
                
                // Step along field line (Runge-Kutta integration)
                const step = B.normalize().multiplyScalar(0.1);
                current.add(step);
                points.push(current.clone());
                
                // Check if closed back to planet
                if (current.length() < URANUS_RADIUS) break;
            }
            
            return points;
        };
        
        calculateMagneticField(position) {
            const r = position.length();
            const theta = Math.acos(position.y / r);
            const phi = Math.atan2(position.z, position.x);
            
            // Dipole field (tilted and offset)
            const dipole = this.calculateDipoleField(r, theta, phi);
            
            // Quadrupole component (20% strength)
            const quadrupole = this.calculateQuadrupoleField(r, theta, phi).multiplyScalar(0.2);
            
            // Octupole component (10% strength)
            const octupole = this.calculateOctupoleField(r, theta, phi).multiplyScalar(0.1);
            
            return dipole.add(quadrupole).add(octupole);
        }
        */
    }
    
    /**
     * TODO: Create asymmetric plasma sheet
     * The plasma sheet in the tail is highly curved and dynamic
     */
    createPlasmaSheet() {
        // Plasma sheet characteristics:
        // - Extends from ~10 RU to >100 RU downtail
        // - Thickness: ~2-5 RU
        // - Highly curved due to rotation
        // - Asymmetric (thicker on one side)
        // - Flaps with 17.24 hour period
        
        /* Curved plasma sheet:
        const sheetGeometry = new THREE.ParametricGeometry(
            (u, v, target) => {
                const x = -10 - u * 100; // Extends downtail
                const width = 10 + u * 5; // Widens with distance
                
                // Curvature due to rotation
                const curvature = Math.sin(this.rotationPhase) * 5;
                const y = (v - 0.5) * width + curvature * u;
                
                // Asymmetric thickness
                const thickness = 2 + 3 * Math.abs(v - 0.5);
                const z = Math.sin(v * Math.PI) * thickness;
                
                target.set(x * URANUS_RADIUS, y * URANUS_RADIUS, z * URANUS_RADIUS);
            },
            100, 20
        );
        */
    }
    
    /**
     * Enhanced magnetotail with corkscrew structure
     */
    createEnhancedMagnetotail() {
        // The tail rotates with the planet creating a corkscrew
        // Should extend millions of km (>1000 RU)
        
        /* Corkscrew tail implementation:
        const tailCurve = new THREE.CatmullRomCurve3(
            Array.from({ length: 50 }, (_, i) => {
                const distance = (i + 1) * 20 * URANUS_RADIUS;
                const angle = this.rotationPhase + (i * Math.PI / 25); // Twist
                
                return new THREE.Vector3(
                    -distance,
                    Math.sin(angle) * distance * 0.1,
                    Math.cos(angle) * distance * 0.1
                );
            })
        );
        
        const tailGeometry = new THREE.TubeGeometry(
            tailCurve,
            100,
            (distance) => 15 * URANUS_RADIUS * Math.exp(-distance / 500), // Taper
            8,
            false
        );
        */
    }
    
    /**
 * Magnetosphere - Scientifically accurate Uranus magnetosphere
 * Based on Voyager 2 data and recent 2024 research
 */

import { MAGNETOSPHERE_CONFIG, URANUS_TILT, URANUS_RADIUS, MOONS_DATA } from '../config/constants.js';

export default class Magnetosphere {
    constructor(scene) {
        this.scene = scene;
        this.group = null;
        
        // Core components
        this.fieldLines = [];
        this.radiationBelts = { 
            inner: null, 
            outer: null,
            particles: { inner: null, outer: null }
        };
        this.plasmaSheet = null;
        this.magnetopause = null;
        this.bowShock = null;
        this.tail = null;
        this.aurorae = { north: null, south: null };
        this.moonGaps = [];
        
        // Dynamic state
        this.animationTime = 0;
        this.rotationPhase = 0;
        this.solarWindPressure = 1.0;
        this.configurationState = 'equatorial_dawn';
        
        // Particle systems for radiation belts
        this.innerBeltParticles = [];
        this.outerBeltParticles = [];
    }
    
    /**
     * Create magnetosphere and add to scene
     */
    create() {
        this.group = new THREE.Group();
        this.group.name = 'Magnetosphere';
        
        // Create all components
        this.createMagnetopause();
        this.createBowShock();
        this.createRadiationBelts();
        this.createEnhancedFieldLines();
        this.createPlasmaSheet();
        this.createEnhancedMagnetotail();
        this.createEnhancedAurorae();
        this.createMoonInteractionRegions();
        
        // Apply complex magnetic geometry
        this.applyMagneticGeometry();
        
        // Initially hidden
        this.group.visible = false;
        
        this.scene.add(this.group);
    }
    
    /**
     * Create magnetopause boundary - the outer edge of the magnetosphere
     */
    createMagnetopause() {
        // Create dynamic magnetopause shape
        const magnetopauseGeometry = new THREE.ParametricGeometry(
            (u, v, target) => {
                const theta = u * Math.PI * 2;
                const phi = v * Math.PI;
                
                // Calculate distance based on angle to sun
                // Compressed on day side, expanded on night side
                const sunAngle = Math.cos(theta);
                const compressionFactor = 0.7 + 0.3 * sunAngle;
                
                // Base radius: 18-28 Uranian radii
                let r = (18 + 10 * (1 - Math.abs(sunAngle))) * URANUS_RADIUS;
                r *= compressionFactor * this.solarWindPressure;
                
                // Add asymmetry based on magnetic configuration
                const configAsymmetry = this.calculateConfigurationAsymmetry(theta, phi);
                r *= configAsymmetry;
                
                // Convert to Cartesian
                const x = r * Math.sin(phi) * Math.cos(theta);
                const y = r * Math.cos(phi);
                const z = r * Math.sin(phi) * Math.sin(theta);
                
                target.set(x, y, z);
            },
            64, 32
        );
        
        const magnetopauseMaterial = new THREE.MeshPhongMaterial({
            color: 0x4080a0,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
            wireframe: true,
            emissive: 0x2050a0,
            emissiveIntensity: 0.1
        });
        
        this.magnetopause = new THREE.Mesh(magnetopauseGeometry, magnetopauseMaterial);
        this.magnetopause.name = 'Magnetopause';
        this.group.add(this.magnetopause);
    }
    
    /**
     * Create bow shock - where solar wind becomes subsonic
     */
    createBowShock() {
        // Bow shock ~5 RU ahead of magnetopause
        const shockGeometry = new THREE.ParametricGeometry(
            (u, v, target) => {
                const theta = u * Math.PI * 2;
                const phi = v * Math.PI;
                
                // Stand-off distance: ~23 RU at subsolar point
                const sunAngle = Math.cos(theta);
                let r = 23 * URANUS_RADIUS;
                
                // Flare out on flanks
                if (Math.abs(sunAngle) < 0.5) {
                    r = 23 * URANUS_RADIUS;
                } else {
                    r = (23 + 10 * (1 - Math.abs(sunAngle))) * URANUS_RADIUS;
                }
                
                // Only create front hemisphere
                if (theta > Math.PI / 2 && theta < 3 * Math.PI / 2) {
                    r *= 0.3; // Fade out on night side
                }
                
                const x = r * Math.sin(phi) * Math.cos(theta);
                const y = r * Math.cos(phi);
                const z = r * Math.sin(phi) * Math.sin(theta);
                
                target.set(x, y, z);
            },
            32, 16
        );
        
        // Shock visualization shader
        const shockMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                shockStrength: { value: 1.0 },
                solarWindAngle: { value: new THREE.Vector3(1, 0, 0) }
            },
            vertexShader: `
                varying float vShockIntensity;
                varying vec3 vNormal;
                uniform vec3 solarWindAngle;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vShockIntensity = max(0.0, dot(vNormal, solarWindAngle));
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float shockStrength;
                varying float vShockIntensity;
                varying vec3 vNormal;
                
                void main() {
                    // Shock compression visualization
                    float shock = vShockIntensity * (0.5 + 0.5 * sin(time * 3.0 + vShockIntensity * 10.0));
                    vec3 color = mix(vec3(0.2, 0.5, 0.8), vec3(1.0, 0.8, 0.3), shock);
                    
                    // Add shock wave pattern
                    float wave = sin(vShockIntensity * 20.0 - time * 5.0) * 0.5 + 0.5;
                    color += vec3(wave * 0.2);
                    
                    float opacity = shock * 0.2 * shockStrength;
                    gl_FragColor = vec4(color, opacity);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        this.bowShock = new THREE.Mesh(shockGeometry, shockMaterial);
        this.bowShock.name = 'BowShock';
        this.group.add(this.bowShock);
    }
    
    /**
     * Create radiation belts - Uranus has the 2nd strongest after Jupiter!
     */
    createRadiationBelts() {
        // Inner radiation belt (protons, 1.5-3 RU)
        const innerBeltGeometry = new THREE.TorusGeometry(
            2.25 * URANUS_RADIUS,  // Major radius
            0.75 * URANUS_RADIUS,  // Minor radius
            32, 64
        );
        
        // Outer radiation belt (electrons, 3-8 RU)
        const outerBeltGeometry = new THREE.TorusGeometry(
            5.5 * URANUS_RADIUS,   // Major radius
            2.5 * URANUS_RADIUS,   // Minor radius
            32, 64
        );
        
        // Create particle systems for visualization
        this.createBeltParticles();
        
        // Visual representation of belt regions
        const innerBeltMaterial = new THREE.MeshPhongMaterial({
            color: 0xff6030,
            transparent: true,
            opacity: 0.1,
            emissive: 0xff3010,
            emissiveIntensity: 0.2,
            side: THREE.DoubleSide
        });
        
        const outerBeltMaterial = new THREE.MeshPhongMaterial({
            color: 0x3080ff,
            transparent: true,
            opacity: 0.08,
            emissive: 0x1040ff,
            emissiveIntensity: 0.15,
            side: THREE.DoubleSide
        });
        
        this.radiationBelts.inner = new THREE.Mesh(innerBeltGeometry, innerBeltMaterial);
        this.radiationBelts.outer = new THREE.Mesh(outerBeltGeometry, outerBeltMaterial);
        
        this.radiationBelts.inner.rotation.x = Math.PI / 2;
        this.radiationBelts.outer.rotation.x = Math.PI / 2;
        
        this.group.add(this.radiationBelts.inner);
        this.group.add(this.radiationBelts.outer);
    }
    
    /**
     * Create particle systems for radiation belts
     */
    createBeltParticles() {
        // Inner belt particles (protons)
        const innerParticleCount = 5000;
        const innerPositions = new Float32Array(innerParticleCount * 3);
        const innerEnergies = new Float32Array(innerParticleCount);
        
        for (let i = 0; i < innerParticleCount; i++) {
            // Distribute in torus volume
            const u = Math.random() * Math.PI * 2;
            const v = Math.random() * Math.PI * 2;
            const r = 2.25 * URANUS_RADIUS + (Math.random() - 0.5) * 1.5 * URANUS_RADIUS;
            
            innerPositions[i * 3] = Math.cos(u) * r;
            innerPositions[i * 3 + 1] = Math.sin(v) * 0.75 * URANUS_RADIUS;
            innerPositions[i * 3 + 2] = Math.sin(u) * r;
            
            // Energy up to 4 MeV (Maxwell-Boltzmann distribution)
            innerEnergies[i] = Math.random() * Math.random() * 4.0;
        }
        
        const innerGeometry = new THREE.BufferGeometry();
        innerGeometry.setAttribute('position', new THREE.BufferAttribute(innerPositions, 3));
        innerGeometry.setAttribute('energy', new THREE.BufferAttribute(innerEnergies, 1));
        
        // Outer belt particles (electrons)
        const outerParticleCount = 8000;
        const outerPositions = new Float32Array(outerParticleCount * 3);
        const outerEnergies = new Float32Array(outerParticleCount);
        
        for (let i = 0; i < outerParticleCount; i++) {
            const u = Math.random() * Math.PI * 2;
            const v = Math.random() * Math.PI * 2;
            const r = 5.5 * URANUS_RADIUS + (Math.random() - 0.5) * 5 * URANUS_RADIUS;
            
            // Check for moon gaps
            let density = 1.0;
            const rNorm = r / URANUS_RADIUS;
            
            // Miranda gap at 5.08 RU
            if (Math.abs(rNorm - 5.08) < 0.3) density *= 0.1;
            // Ariel gap at 7.47 RU
            if (Math.abs(rNorm - 7.47) < 0.3) density *= 0.1;
            
            if (Math.random() > density) {
                i--; // Skip this particle
                continue;
            }
            
            outerPositions[i * 3] = Math.cos(u) * r;
            outerPositions[i * 3 + 1] = Math.sin(v) * 2.5 * URANUS_RADIUS;
            outerPositions[i * 3 + 2] = Math.sin(u) * r;
            
            // Energy up to 1.2 MeV
            outerEnergies[i] = Math.random() * Math.random() * 1.2;
        }
        
        const outerGeometry = new THREE.BufferGeometry();
        outerGeometry.setAttribute('position', new THREE.BufferAttribute(outerPositions, 3));
        outerGeometry.setAttribute('energy', new THREE.BufferAttribute(outerEnergies, 1));
        
        // Particle material with energy-based coloring
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                moonPositions: { value: [5.08, 7.47, 10.41] } // Major moon L-shells
            },
            vertexShader: `
                attribute float energy;
                varying float vEnergy;
                uniform float time;
                
                void main() {
                    vEnergy = energy;
                    vec3 pos = position;
                    
                    // Drift motion simulation
                    float driftAngle = time * energy * 0.1; // Faster drift for higher energy
                    float c = cos(driftAngle);
                    float s = sin(driftAngle);
                    pos.xz = mat2(c, -s, s, c) * pos.xz;
                    
                    gl_PointSize = 1.0 + energy * 2.0;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying float vEnergy;
                
                void main() {
                    // Color based on energy
                    vec3 lowEnergy = vec3(0.3, 0.5, 1.0);
                    vec3 highEnergy = vec3(1.0, 0.3, 0.3);
                    vec3 color = mix(lowEnergy, highEnergy, vEnergy / 4.0);
                    
                    // Circular particle shape
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    if (length(coord) > 0.5) discard;
                    
                    float alpha = 0.5 * (1.0 - length(coord) * 2.0);
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.radiationBelts.particles.inner = new THREE.Points(innerGeometry, particleMaterial.clone());
        this.radiationBelts.particles.outer = new THREE.Points(outerGeometry, particleMaterial);
        
        this.group.add(this.radiationBelts.particles.inner);
        this.group.add(this.radiationBelts.particles.outer);
    }
    
    /**
     * Create enhanced magnetic field lines showing multipole structure
     */
    createEnhancedFieldLines() {
        const fieldLineCount = 12;
        
        for (let i = 0; i < fieldLineCount; i++) {
            const startAngle = (i / fieldLineCount) * Math.PI * 2;
            const startRadius = (1.5 + Math.random() * 3) * URANUS_RADIUS;
            
            const startPoint = new THREE.Vector3(
                Math.cos(startAngle) * startRadius,
                0,
                Math.sin(startAngle) * startRadius
            );
            
            const points = this.traceFieldLine(startPoint);
            
            if (points.length > 2) {
                const curve = new THREE.CatmullRomCurve3(points);
                const geometry = new THREE.TubeGeometry(curve, 100, 0.15, 8, false);
                
                const material = new THREE.MeshBasicMaterial({
                    color: MAGNETOSPHERE_CONFIG.color,
                    transparent: true,
                    opacity: MAGNETOSPHERE_CONFIG.opacity * 0.8,
                    blending: THREE.AdditiveBlending
                });
                
                const fieldLine = new THREE.Mesh(geometry, material);
                this.fieldLines.push(fieldLine);
                this.group.add(fieldLine);
            }
        }
    }
    
    /**
     * Trace a magnetic field line using field equations
     */
    traceFieldLine(startPoint, maxSteps = 200) {
        const points = [startPoint.clone()];
        let current = startPoint.clone();
        const stepSize = 0.5 * URANUS_RADIUS;
        
        for (let i = 0; i < maxSteps; i++) {
            const field = this.calculateMagneticField(current);
            
            if (field.length() < 0.001) break;
            
            // Step along field direction
            const step = field.normalize().multiplyScalar(stepSize);
            current.add(step);
            
            // Check boundaries
            if (current.length() < URANUS_RADIUS * 1.1) break; // Hit planet
            if (current.length() > 30 * URANUS_RADIUS) break; // Too far
            
            points.push(current.clone());
        }
        
        return points;
    }
    
    /**
     * Calculate magnetic field at a point (dipole + quadrupole + octupole)
     */
    calculateMagneticField(position) {
        const r = position.length();
        if (r < 0.1) return new THREE.Vector3();
        
        // Simplified dipole field (main component)
        const dipole = position.clone().normalize().multiplyScalar(-1 / (r * r * r));
        
        // Add quadrupole component (20% strength)
        const quad = new THREE.Vector3(
            position.x * position.y / (r * r * r * r * r),
            (position.y * position.y - position.x * position.x) / (r * r * r * r * r),
            position.y * position.z / (r * r * r * r * r)
        ).multiplyScalar(0.2);
        
        // Add octupole component (10% strength)
        const oct = position.clone().multiplyScalar(1 / (r * r * r * r * r * r)).multiplyScalar(0.1);
        
        return dipole.add(quad).add(oct);
    }
    
    /**
     * Create asymmetric plasma sheet in magnetotail
     */
    createPlasmaSheet() {
        const sheetGeometry = new THREE.ParametricGeometry(
            (u, v, target) => {
                // Extends from 10 to 100+ RU downtail
                const x = -10 - u * 90;
                const width = 10 + u * 5; // Widens with distance
                
                // Curvature due to rotation
                const curvature = Math.sin(this.rotationPhase) * 5;
                const y = (v - 0.5) * width + curvature * u;
                
                // Asymmetric thickness
                const thickness = 2 + 3 * Math.abs(v - 0.5);
                const z = Math.sin(v * Math.PI) * thickness;
                
                target.set(
                    x * URANUS_RADIUS,
                    y * URANUS_RADIUS,
                    z * URANUS_RADIUS
                );
            },
            50, 10
        );
        
        const sheetMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                rotationPhase: { value: 0 }
            },
            vertexShader: `
                varying vec3 vPosition;
                uniform float time;
                uniform float rotationPhase;
                
                void main() {
                    vPosition = position;
                    vec3 pos = position;
                    
                    // Flapping motion
                    pos.y += sin(time * 0.5 + position.x * 0.01) * 2.0;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec3 vPosition;
                
                void main() {
                    // Plasma sheet coloring
                    vec3 color = vec3(0.8, 0.4, 0.6);
                    
                    // Add density variations
                    float density = 0.3 + 0.2 * sin(time + vPosition.x * 0.1);
                    
                    gl_FragColor = vec4(color, density);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        this.plasmaSheet = new THREE.Mesh(sheetGeometry, sheetMaterial);
        this.plasmaSheet.name = 'PlasmaSheet';
        this.group.add(this.plasmaSheet);
    }
    
    /**
     * Create enhanced magnetotail with corkscrew structure
     */
    createEnhancedMagnetotail() {
        // Create corkscrew tail path
        const tailPoints = [];
        for (let i = 0; i <= 100; i++) {
            const distance = i * 10 * URANUS_RADIUS;
            const angle = this.rotationPhase + (i * Math.PI / 50);
            
            tailPoints.push(new THREE.Vector3(
                -distance,
                Math.sin(angle) * distance * 0.05,
                Math.cos(angle) * distance * 0.05
            ));
        }
        
        const tailCurve = new THREE.CatmullRomCurve3(tailPoints);
        
        // Variable radius tube (tapers with distance)
        const radiusFunction = (t) => {
            return 15 * URANUS_RADIUS * Math.exp(-t * 2);
        };
        
        // Create tube geometry with custom radius
        const segments = 100;
        const tailGeometry = new THREE.BufferGeometry();
        const positions = [];
        const normals = [];
        const uvs = [];
        
        const radialSegments = 16;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const point = tailCurve.getPoint(t);
            const radius = radiusFunction(t);
            
            for (let j = 0; j <= radialSegments; j++) {
                const angle = (j / radialSegments) * Math.PI * 2;
                
                positions.push(
                    point.x + Math.cos(angle) * radius,
                    point.y + Math.sin(angle) * radius * 0.5, // Flatten vertically
                    point.z + Math.sin(angle) * radius
                );
                
                normals.push(Math.cos(angle), Math.sin(angle), 0);
                uvs.push(i / segments, j / radialSegments);
            }
        }
        
        // Create indices
        const indices = [];
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < radialSegments; j++) {
                const a = i * (radialSegments + 1) + j;
                const b = a + 1;
                const c = a + radialSegments + 1;
                const d = c + 1;
                
                indices.push(a, c, b);
                indices.push(b, c, d);
            }
        }
        
        tailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        tailGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        tailGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        tailGeometry.setIndex(indices);
        
        const tailMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                tailLength: { value: 1000 * URANUS_RADIUS }
            },
            vertexShader: `
                varying float vDistance;
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    vDistance = length(position);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying float vDistance;
                varying vec2 vUv;
                
                void main() {
                    // Tail coloring with distance fade
                    vec3 color = mix(
                        vec3(0.6, 0.3, 0.5),
                        vec3(0.2, 0.1, 0.3),
                        vUv.x
                    );
                    
                    // Add current sheet
                    float sheet = smoothstep(0.4, 0.5, vUv.y) * smoothstep(0.6, 0.5, vUv.y);
                    color += vec3(0.3, 0.1, 0.2) * sheet;
                    
                    // Fade with distance
                    float opacity = 0.3 * (1.0 - vUv.x) * (1.0 - vUv.x);
                    
                    gl_FragColor = vec4(color, opacity);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        this.tail = new THREE.Mesh(tailGeometry, tailMaterial);
        this.tail.name = 'Magnetotail';
        this.group.add(this.tail);
    }
    
    /**
     * Create enhanced auroral ovals at magnetic poles (not rotation poles!)
     */
    createEnhancedAurorae() {
        // Calculate magnetic pole positions
        // Magnetic axis is tilted 60° from rotation axis
        // and offset 31% toward north rotation pole
        
        const tiltRad = 60 * Math.PI / 180;
        const offset = 0.31 * URANUS_RADIUS;
        
        // North magnetic pole position
        const northMagneticPole = new THREE.Vector3(
            offset * Math.sin(tiltRad),
            offset + offset * Math.cos(tiltRad),
            0
        );
        
        // South magnetic pole position
        const southMagneticPole = new THREE.Vector3(
            -offset * Math.sin(tiltRad),
            offset - offset * Math.cos(tiltRad),
            0
        );
        
        // Create auroral ovals
        const createAuroralOval = (polePosition, isNorth) => {
            const ovalRadius = 0.25 * URANUS_RADIUS;
            
            const geometry = new THREE.RingGeometry(
                ovalRadius * 0.7,
                ovalRadius,
                64, 8
            );
            
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    intensity: { value: isNorth ? 1.0 : 0.8 },
                    color1: { value: new THREE.Color(0x00ff88) },
                    color2: { value: new THREE.Color(0xff00ff) }
                },
                vertexShader: `
                    varying vec2 vUv;
                    varying vec3 vPosition;
                    
                    void main() {
                        vUv = uv;
                        vPosition = position;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform float intensity;
                    uniform vec3 color1;
                    uniform vec3 color2;
                    varying vec2 vUv;
                    varying vec3 vPosition;
                    
                    void main() {
                        // Auroral curtains
                        float curtain = sin(vUv.x * 20.0 + time * 2.0) * 0.5 + 0.5;
                        float pulse = sin(time * 3.0 + vUv.y * 10.0) * 0.5 + 0.5;
                        
                        vec3 color = mix(color1, color2, curtain);
                        
                        // Ray structure
                        float rays = smoothstep(0.0, 0.1, sin(vUv.x * 100.0 + time));
                        color += vec3(rays * 0.3);
                        
                        float alpha = intensity * (0.3 + pulse * 0.4) * (0.5 + curtain * 0.5);
                        
                        gl_FragColor = vec4(color, alpha);
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            
            const oval = new THREE.Mesh(geometry, material);
            oval.position.copy(polePosition);
            
            // Align perpendicular to local magnetic field
            const fieldDirection = polePosition.clone().normalize();
            oval.lookAt(polePosition.clone().add(fieldDirection));
            
            return oval;
        };
        
        this.aurorae.north = createAuroralOval(northMagneticPole, true);
        this.aurorae.south = createAuroralOval(southMagneticPole, false);
        
        this.group.add(this.aurorae.north);
        this.group.add(this.aurorae.south);
    }
    
    /**
     * Create moon and ring interaction regions
     */
    createMoonInteractionRegions() {
        // Major moons that create gaps in radiation belts
        const majorMoons = [
            { name: 'Miranda', lShell: 5.08, radius: 0.5 },
            { name: 'Ariel', lShell: 7.47, radius: 0.8 },
            { name: 'Umbriel', lShell: 10.41, radius: 0.8 }
        ];
        
        majorMoons.forEach(moon => {
            // Create gap visualization
            const gapGeometry = new THREE.TorusGeometry(
                moon.lShell * URANUS_RADIUS,
                moon.radius * URANUS_RADIUS * 0.5,
                16, 32
            );
            
            const gapMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.5,
                blending: THREE.SubtractiveBlending
            });
            
            const gap = new THREE.Mesh(gapGeometry, gapMaterial);
            gap.rotation.x = Math.PI / 2;
            gap.name = `Gap_${moon.name}`;
            
            this.moonGaps.push(gap);
            this.group.add(gap);
            
            // Create wake region downstream
            const wakeGeometry = new THREE.ConeGeometry(
                moon.radius * URANUS_RADIUS,
                moon.lShell * URANUS_RADIUS * 0.3,
                8, 1
            );
            
            const wakeMaterial = new THREE.MeshBasicMaterial({
                color: 0x404040,
                transparent: true,
                opacity: 0.2,
                side: THREE.DoubleSide
            });
            
            const wake = new THREE.Mesh(wakeGeometry, wakeMaterial);
            wake.position.x = -moon.lShell * URANUS_RADIUS;
            wake.rotation.z = -Math.PI / 2;
            wake.name = `Wake_${moon.name}`;
            
            this.group.add(wake);
        });
        
        // Ring absorption boundary
        const ringBoundary = new THREE.RingGeometry(
            1.4 * URANUS_RADIUS,
            1.5 * URANUS_RADIUS,
            64, 1
        );
        
        const ringBoundaryMaterial = new THREE.MeshBasicMaterial({
            color: 0x808080,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const ringAbsorption = new THREE.Mesh(ringBoundary, ringBoundaryMaterial);
        ringAbsorption.rotation.x = Math.PI / 2;
        ringAbsorption.name = 'RingAbsorption';
        
        this.group.add(ringAbsorption);
    }
    
    /**
     * Apply complex magnetic geometry
     */
    applyMagneticGeometry() {
        // Tilt 60° from rotation axis
        this.group.rotation.x = MAGNETOSPHERE_CONFIG.tiltAngle;
        // Apply Uranus's extreme tilt
        this.group.rotation.z = URANUS_TILT;
        // Offset 31% toward north rotation pole
        this.group.position.set(
            0,
            URANUS_RADIUS * 0.31,
            0
        );
    }
    
    /**
     * Calculate configuration asymmetry based on rotation
     */
    calculateConfigurationAsymmetry(theta, phi) {
        // Different asymmetry patterns for different configurations
        switch (this.configurationState) {
            case 'polar_north':
                // Compressed at north pole
                return 1.0 - 0.3 * Math.cos(phi);
            case 'polar_south':
                // Compressed at south pole
                return 1.0 - 0.3 * Math.sin(phi);
            case 'equatorial_dawn':
            case 'equatorial_dusk':
                // More symmetric
                return 1.0 - 0.1 * Math.sin(2 * phi);
            default:
                return 1.0;
        }
    }
    
    /**
     * Update magnetosphere animation
     */
    update(deltaTime, uranusRotation) {
        if (!this.group || !this.group.visible) return;
        
        this.animationTime += deltaTime;
        this.rotationPhase = uranusRotation;
        
        // Update configuration based on rotation
        this.updateConfiguration();
        
        // Update radiation belt particles
        this.updateRadiationBelts(deltaTime);
        
        // Update plasma sheet dynamics
        this.updatePlasmaSheet();
        
        // Rotate entire magnetosphere with planet
        this.group.rotation.y = uranusRotation;
        
        // Update shader uniforms
        this.updateShaderUniforms();
        
        // Animate components
        this.animateFieldLines();
        this.animateAurorae();
        this.animateTail();
    }
    
    /**
     * Update magnetosphere configuration based on rotation
     */
    updateConfiguration() {
        const solarAngle = (this.rotationPhase % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        
        let newState;
        if (solarAngle < Math.PI / 2) {
            newState = 'polar_north';
        } else if (solarAngle < Math.PI) {
            newState = 'equatorial_dawn';
        } else if (solarAngle < 3 * Math.PI / 2) {
            newState = 'polar_south';
        } else {
            newState = 'equatorial_dusk';
        }
        
        // Update auroral intensity based on configuration
        if (this.aurorae.north && this.aurorae.north.material.uniforms) {
            this.aurorae.north.material.uniforms.intensity.value = 
                newState === 'polar_north' ? 1.5 : 0.8;
        }
        if (this.aurorae.south && this.aurorae.south.material.uniforms) {
            this.aurorae.south.material.uniforms.intensity.value = 
                newState === 'polar_south' ? 1.5 : 0.8;
        }
        
        this.configurationState = newState;
    }
    
    /**
     * Update radiation belt particle dynamics
     */
    updateRadiationBelts(deltaTime) {
        // Update particle drift
        if (this.radiationBelts.particles.inner && this.radiationBelts.particles.inner.material.uniforms) {
            this.radiationBelts.particles.inner.material.uniforms.time.value = this.animationTime;
        }
        if (this.radiationBelts.particles.outer && this.radiationBelts.particles.outer.material.uniforms) {
            this.radiationBelts.particles.outer.material.uniforms.time.value = this.animationTime;
        }
        
        // Particle drift rotation
        // Protons drift westward, electrons eastward
        if (this.radiationBelts.particles.inner) {
            this.radiationBelts.particles.inner.rotation.y -= deltaTime * 0.05; // Westward
        }
        if (this.radiationBelts.particles.outer) {
            this.radiationBelts.particles.outer.rotation.y += deltaTime * 0.1; // Eastward
        }
    }
    
    /**
     * Update plasma sheet dynamics
     */
    updatePlasmaSheet() {
        if (this.plasmaSheet && this.plasmaSheet.material.uniforms) {
            this.plasmaSheet.material.uniforms.time.value = this.animationTime;
            this.plasmaSheet.material.uniforms.rotationPhase.value = this.rotationPhase;
        }
    }
    
    /**
     * Update shader uniforms
     */
    updateShaderUniforms() {
        // Update bow shock
        if (this.bowShock && this.bowShock.material.uniforms) {
            this.bowShock.material.uniforms.time.value = this.animationTime;
        }
        
        // Update tail
        if (this.tail && this.tail.material.uniforms) {
            this.tail.material.uniforms.time.value = this.animationTime;
        }
        
        // Update aurorae
        if (this.aurorae.north && this.aurorae.north.material.uniforms) {
            this.aurorae.north.material.uniforms.time.value = this.animationTime;
        }
        if (this.aurorae.south && this.aurorae.south.material.uniforms) {
            this.aurorae.south.material.uniforms.time.value = this.animationTime;
        }
    }
    
    /**
     * Animate field lines
     */
    animateFieldLines() {
        this.fieldLines.forEach((line, index) => {
            // Subtle pulsing
            const scale = 1 + Math.sin(this.animationTime * 0.5 + index) * 0.05;
            line.scale.x = scale;
            line.scale.z = scale;
            
            // Slow rotation for some lines
            if (index % 2 === 0) {
                line.rotation.y += 0.001;
            }
        });
    }
    
    /**
     * Animate auroral ovals
     */
    animateAurorae() {
        if (this.aurorae.north) {
            this.aurorae.north.rotation.z += 0.0005;
        }
        if (this.aurorae.south) {
            this.aurorae.south.rotation.z -= 0.0005;
        }
    }
    
    /**
     * Animate magnetotail
     */
    animateTail() {
        if (this.tail) {
            // Subtle swaying
            this.tail.rotation.x = Math.sin(this.animationTime * 0.3) * 0.05;
            this.tail.rotation.y = Math.cos(this.animationTime * 0.2) * 0.03;
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
     * Set opacity for all components
     */
    setOpacity(opacity) {
        // Update field lines
        this.fieldLines.forEach(line => {
            if (line.material) {
                line.material.opacity = opacity * MAGNETOSPHERE_CONFIG.opacity;
            }
        });
        
        // Update other components
        if (this.magnetopause && this.magnetopause.material) {
            this.magnetopause.material.opacity = opacity * 0.15;
        }
        
        if (this.radiationBelts.inner && this.radiationBelts.inner.material) {
            this.radiationBelts.inner.material.opacity = opacity * 0.1;
        }
        
        if (this.radiationBelts.outer && this.radiationBelts.outer.material) {
            this.radiationBelts.outer.material.opacity = opacity * 0.08;
        }
    }
    
    /**
     * Get group reference
     */
    getGroup() {
        return this.group;
    }
    
    /**
     * Dispose of resources
     */
    dispose() {
        if (this.group) {
            // Dispose all geometries and materials
            this.group.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            
            // Remove from scene
            if (this.scene && this.group.parent) {
                this.scene.remove(this.group);
            }
            
            // Clear arrays
            this.fieldLines = [];
            this.moonGaps = [];
            
            // Clear references
            this.group = null;
            this.radiationBelts = { inner: null, outer: null, particles: { inner: null, outer: null } };
            this.plasmaSheet = null;
            this.magnetopause = null;
            this.bowShock = null;
            this.tail = null;
            this.aurorae = { north: null, south: null };
        }
    }
}
