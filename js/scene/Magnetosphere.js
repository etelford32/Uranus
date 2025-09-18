/**
 * Magnetosphere - Scientifically accurate Uranus magnetosphere with real physics
 * Based on Voyager 2 data and magnetospheric physics principles
 */

import { MAGNETOSPHERE_CONFIG, URANUS_TILT, URANUS_RADIUS } from '../config/constants.js';

export default class Magnetosphere {
    constructor(scene) {
        this.scene = scene;
        this.group = null;
        this.fieldLines = [];
        this.radiationBelts = { inner: null, outer: null, intermediate: null };
        this.plasmaSheet = null;
        this.bow_shock = null;
        this.magnetopause = null;
        this.tail = null;
        this.aurorae = { north: null, south: null, mobile: [] };
        this.reconnectionSites = [];
        
        // Animation and physics state
        this.animationTime = 0;
        this.rotationPhase = 0;
        this.orbitalPhase = 0; // For seasonal effects
        this.solarWindPressure = 1.0;
        
        // Physics constants (scaled for visualization)
        this.physics = {
            dipoleStrength: 0.23, // Relative to Earth
            tiltAngle: 58.6 * Math.PI / 180, // Magnetic field tilt
            offsetDistance: 0.31, // Magnetic center offset (planetary radii)
            rotationPeriod: 17.24, // Hours
            magnetopauseDistance: 18.0, // Typical distance in planetary radii
            bowShockDistance: 25.0, // Bow shock standoff distance
            tailLength: 200.0, // Magnetotail length in planetary radii
            plasmaBeta: 2.0, // Plasma pressure ratio
            reconnectionRate: 0.1 // Magnetic reconnection efficiency
        };
        
        // Quality and debugging
        this.debug = false;
        this.useAdvancedPhysics = true;
        this.qualityLevel = 'high';
    }
    
    /**
     * Create scientifically accurate magnetosphere
     */
    create() {
        try {
            this.log('Creating scientifically accurate magnetosphere...');
            
            this.group = new THREE.Group();
            this.group.name = 'UranusModernMagnetosphere';
            
            // Create magnetospheric boundaries
            this.createBowShock();
            this.createMagnetopause();
            
            // Create magnetic field structure
            this.createDipoleFieldLines();
            this.createQuadrupoleComponents();
            
            // Create plasma populations
            this.createRadiationBelts();
            this.createPlasmaSheet();
            
            // Create dynamic features
            this.createMagnetotail();
            this.createReconnectionSites();
            
            // Create auroral phenomena
            this.createDynamicAurorae();
            
            // Apply correct magnetic geometry
            this.applyMagneticGeometry();
            
            // Initially hidden
            this.group.visible = false;
            
            this.scene.add(this.group);
            this.log('Enhanced magnetosphere created successfully');
            
        } catch (error) {
            console.error('Failed to create enhanced magnetosphere:', error);
            this.createFallbackMagnetosphere();
        }
    }
    
    /**
     * Create bow shock boundary
     */
    createBowShock() {
        try {
            // Bow shock is a paraboloid in the solar wind direction
            const bowShockGeometry = this.createBowShockGeometry();
            
            const bowShockMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    opacity: { value: 0.1 },
                    color: { value: new THREE.Color(0xff4444) },
                    thickness: { value: 2.0 }
                },
                vertexShader: `
                    varying vec3 vPosition;
                    varying vec3 vNormal;
                    void main() {
                        vPosition = position;
                        vNormal = normal;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform float opacity;
                    uniform vec3 color;
                    uniform float thickness;
                    varying vec3 vPosition;
                    varying vec3 vNormal;
                    
                    void main() {
                        // Shock wave pattern
                        float shock = sin(vPosition.x * 0.1 + time * 2.0) * 0.5 + 0.5;
                        
                        // Edge enhancement
                        vec3 viewDir = normalize(cameraPosition - vPosition);
                        float fresnel = 1.0 - abs(dot(vNormal, viewDir));
                        
                        float alpha = opacity * shock * fresnel * thickness;
                        gl_FragColor = vec4(color, alpha);
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            
            this.bow_shock = new THREE.Mesh(bowShockGeometry, bowShockMaterial);
            this.bow_shock.name = 'BowShock';
            this.group.add(this.bow_shock);
            
            this.log('Bow shock created');
            
        } catch (error) {
            console.warn('Could not create bow shock:', error);
        }
    }
    
    /**
     * Create bow shock geometry based on magnetohydrodynamic equations
     */
    createBowShockGeometry() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        
        // Create paraboloid surface
        const thetaSegments = 32;
        const phiSegments = 16;
        
        for (let i = 0; i <= phiSegments; i++) {
            const phi = (i / phiSegments) * Math.PI; // 0 to π
            
            for (let j = 0; j <= thetaSegments; j++) {
                const theta = (j / thetaSegments) * Math.PI * 2; // 0 to 2π
                
                // Bow shock equation: parabolic standoff distance
                const standoffDistance = this.physics.bowShockDistance;
                const r = Math.sin(phi) * (standoffDistance - Math.cos(phi) * standoffDistance * 0.3);
                
                const x = -Math.cos(phi) * standoffDistance;
                const y = r * Math.cos(theta);
                const z = r * Math.sin(theta);
                
                vertices.push(x, y, z);
            }
        }
        
        // Create faces
        for (let i = 0; i < phiSegments; i++) {
            for (let j = 0; j < thetaSegments; j++) {
                const a = i * (thetaSegments + 1) + j;
                const b = a + thetaSegments + 1;
                
                indices.push(a, b, a + 1);
                indices.push(b, b + 1, a + 1);
            }
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        
        return geometry;
    }
    
    /**
     * Create magnetopause boundary
     */
    createMagnetopause() {
        try {
            const magnetopauseGeometry = this.createMagnetopauseGeometry();
            
            const magnetopauseMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    opacity: { value: 0.15 },
                    color: { value: new THREE.Color(0x4488ff) },
                    turbulence: { value: 1.0 }
                },
                vertexShader: `
                    varying vec3 vPosition;
                    varying vec3 vNormal;
                    uniform float time;
                    uniform float turbulence;
                    
                    void main() {
                        vPosition = position;
                        vNormal = normal;
                        
                        // Add turbulence for Kelvin-Helmholtz instability
                        vec3 turbulentPosition = position;
                        turbulentPosition.y += sin(position.x * 0.5 + time) * turbulence * 0.3;
                        turbulentPosition.z += cos(position.x * 0.7 + time * 1.2) * turbulence * 0.2;
                        
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(turbulentPosition, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform float opacity;
                    uniform vec3 color;
                    varying vec3 vPosition;
                    varying vec3 vNormal;
                    
                    void main() {
                        // Magnetic pressure visualization
                        float pressure = sin(vPosition.x * 0.2 + time * 0.5) * 0.3 + 0.7;
                        
                        // Edge glow
                        vec3 viewDir = normalize(cameraPosition - vPosition);
                        float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);
                        
                        float alpha = opacity * pressure * fresnel;
                        gl_FragColor = vec4(color, alpha);
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            
            this.magnetopause = new THREE.Mesh(magnetopauseGeometry, magnetopauseMaterial);
            this.magnetopause.name = 'Magnetopause';
            this.group.add(this.magnetopause);
            
            this.log('Magnetopause created');
            
        } catch (error) {
            console.warn('Could not create magnetopause:', error);
        }
    }
    
    /**
     * Create magnetopause geometry based on pressure balance
     */
    createMagnetopauseGeometry() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        
        const segments = 32;
        const rings = 16;
        
        for (let i = 0; i <= rings; i++) {
            const phi = (i / rings) * Math.PI;
            
            for (let j = 0; j <= segments; j++) {
                const theta = (j / segments) * Math.PI * 2;
                
                // Chapman-Ferraro magnetopause with pressure balance
                const r0 = this.physics.magnetopauseDistance;
                const compression = 0.7; // Dayside compression
                
                const r = r0 * (1 - compression * Math.cos(phi) * 0.5);
                
                const x = -r * Math.cos(phi);
                const y = r * Math.sin(phi) * Math.cos(theta);
                const z = r * Math.sin(phi) * Math.sin(theta);
                
                vertices.push(x, y, z);
            }
        }
        
        // Create faces
        for (let i = 0; i < rings; i++) {
            for (let j = 0; j < segments; j++) {
                const a = i * (segments + 1) + j;
                const b = a + segments + 1;
                
                indices.push(a, b, a + 1);
                indices.push(b, b + 1, a + 1);
            }
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        
        return geometry;
    }
    
    /**
     * Create dipole magnetic field lines using actual field equations
     */
    createDipoleFieldLines() {
        try {
            const fieldLineCount = 12;
            
            for (let i = 0; i < fieldLineCount; i++) {
                const L = 2 + i * 1.5; // L-shell parameter
                const fieldLine = this.createDipoleFieldLine(L);
                if (fieldLine) {
                    this.fieldLines.push(fieldLine);
                    this.group.add(fieldLine);
                }
            }
            
            this.log('Dipole field lines created');
            
        } catch (error) {
            console.warn('Could not create dipole field lines:', error);
        }
    }
    
    /**
     * Create single dipole field line using McIlwain L-shell coordinates
     */
    createDipoleFieldLine(L) {
        try {
            const points = [];
            const lambdaMax = Math.acos(Math.sqrt(1.0 / L)); // Maximum latitude
            
            // Create field line from north to south
            for (let i = 0; i <= 100; i++) {
                const t = (i / 100) * 2 - 1; // -1 to 1
                const lambda = t * lambdaMax; // Magnetic latitude
                
                // Dipole field line equation in magnetic coordinates
                const r = L * Math.cos(lambda) * Math.cos(lambda);
                
                if (r > 1.0) { // Only outside planet surface
                    const x = r * Math.sin(lambda);
                    const y = r * Math.cos(lambda);
                    
                    // Convert to 3D (assuming axisymmetric for now)
                    points.push(new THREE.Vector3(x * URANUS_RADIUS, y * URANUS_RADIUS, 0));
                }
            }
            
            if (points.length < 3) return null;
            
            const curve = new THREE.CatmullRomCurve3(points);
            const geometry = new THREE.TubeGeometry(curve, points.length, 0.1, 4, false);
            
            // Field line material with current visualization
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    fieldStrength: { value: 1.0 / L }, // Field strength decreases with L
                    color: { value: new THREE.Color().setHSL(0.6 - L * 0.05, 0.8, 0.6) }
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
                    uniform float fieldStrength;
                    uniform vec3 color;
                    varying vec2 vUv;
                    varying vec3 vPosition;
                    
                    void main() {
                        // Current flow visualization
                        float current = sin(vUv.x * 20.0 - time * 5.0) * 0.5 + 0.5;
                        float intensity = fieldStrength * (0.7 + current * 0.3);
                        
                        gl_FragColor = vec4(color * intensity, 0.8);
                    }
                `,
                transparent: true
            });
            
            const fieldLineMesh = new THREE.Mesh(geometry, material);
            fieldLineMesh.name = `FieldLine_L${L.toFixed(1)}`;
            
            return fieldLineMesh;
            
        } catch (error) {
            console.warn(`Could not create field line L=${L}:`, error);
            return null;
        }
    }
    
    /**
     * Add quadrupole field components (Uranus has significant quadrupole)
     */
    createQuadrupoleComponents() {
        try {
            // Uranus has unusual quadrupole moments
            const quadrupoleLines = 6;
            
            for (let i = 0; i < quadrupoleLines; i++) {
                const angle = (i / quadrupoleLines) * Math.PI * 2;
                const quadrupoleLine = this.createQuadrupoleLine(angle);
                if (quadrupoleLine) {
                    this.group.add(quadrupoleLine);
                }
            }
            
            this.log('Quadrupole components added');
            
        } catch (error) {
            console.warn('Could not create quadrupole components:', error);
        }
    }
    
    /**
     * Create quadrupole field line
     */
    createQuadrupoleLine(azimuth) {
        try {
            const points = [];
            
            for (let i = 0; i <= 50; i++) {
                const t = i / 50;
                const r = 5 + t * 15;
                
                // Quadrupole field has sin(2θ) dependence
                const height = Math.sin(2 * azimuth) * r * 0.3;
                
                const x = r * Math.cos(azimuth) * URANUS_RADIUS;
                const y = height * URANUS_RADIUS;
                const z = r * Math.sin(azimuth) * URANUS_RADIUS;
                
                points.push(new THREE.Vector3(x, y, z));
            }
            
            const curve = new THREE.CatmullRomCurve3(points);
            const geometry = new THREE.TubeGeometry(curve, 25, 0.05, 3, false);
            
            const material = new THREE.MeshBasicMaterial({
                color: 0xff6600,
                transparent: true,
                opacity: 0.3
            });
            
            return new THREE.Mesh(geometry, material);
            
        } catch (error) {
            console.warn('Could not create quadrupole line:', error);
            return null;
        }
    }
    
    /**
     * Create radiation belts based on trapped particle physics
     */
    createRadiationBelts() {
        try {
            // Uranus radiation belts are less intense than Earth's
            this.createRadiationBelt('inner', 1.2, 2.5, 0xff3030, 0.15);
            this.createRadiationBelt('intermediate', 2.0, 4.0, 0xff6030, 0.12);
            this.createRadiationBelt('outer', 3.5, 8.0, 0x3060ff, 0.08);
            
            this.log('Radiation belts created');
            
        } catch (error) {
            console.warn('Could not create radiation belts:', error);
        }
    }
    
    /**
     * Create individual radiation belt with particle physics
     */
    createRadiationBelt(name, innerL, outerL, color, opacity) {
        try {
            // Use torus modified by magnetic field geometry
            const geometry = new THREE.TorusGeometry(
                (innerL + outerL) / 2 * URANUS_RADIUS,
                (outerL - innerL) / 2 * URANUS_RADIUS,
                16, 32
            );
            
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    particleDensity: { value: 1.0 / innerL }, // Higher density closer in
                    color: { value: new THREE.Color(color) },
                    baseOpacity: { value: opacity }
                },
                vertexShader: `
                    varying vec3 vPosition;
                    varying vec3 vNormal;
                    void main() {
                        vPosition = position;
                        vNormal = normal;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform float particleDensity;
                    uniform vec3 color;
                    uniform float baseOpacity;
                    varying vec3 vPosition;
                    varying vec3 vNormal;
                    
                    void main() {
                        // Particle precipitation effects
                        float precipitation = sin(time * 2.0 + vPosition.x * 0.1) * 0.2 + 0.8;
                        
                        // Viewing angle effect
                        vec3 viewDir = normalize(cameraPosition - vPosition);
                        float fresnel = 1.0 - abs(dot(vNormal, viewDir));
                        
                        float alpha = baseOpacity * particleDensity * precipitation * fresnel;
                        gl_FragColor = vec4(color, alpha);
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            
            const belt = new THREE.Mesh(geometry, material);
            belt.rotation.x = Math.PI / 2;
            belt.name = `RadiationBelt_${name}`;
            
            this.radiationBelts[name] = belt;
            this.group.add(belt);
            
        } catch (error) {
            console.warn(`Could not create ${name} radiation belt:`, error);
        }
    }
    
    /**
     * Create plasma sheet in magnetotail
     */
    createPlasmaSheet() {
        try {
            const sheetGeometry = new THREE.PlaneGeometry(
                this.physics.tailLength, 
                20, 
                32, 8
            );
            
            // Modify geometry for current sheet shape
            const positions = sheetGeometry.attributes.position;
            for (let i = 0; i < positions.count; i++) {
                const x = positions.getX(i);
                const y = positions.getY(i);
                
                // Harris current sheet profile
                const thickness = 2.0;
                const z = thickness * Math.tanh(y / thickness) * (1 - Math.abs(x) / this.physics.tailLength);
                
                positions.setZ(i, z);
            }
            positions.needsUpdate = true;
            sheetGeometry.computeVertexNormals();
            
            const sheetMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    currentDensity: { value: 1.0 },
                    color: { value: new THREE.Color(0x8844ff) }
                },
                vertexShader: `
                    varying vec3 vPosition;
                    varying vec2 vUv;
                    void main() {
                        vPosition = position;
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform float currentDensity;
                    uniform vec3 color;
                    varying vec3 vPosition;
                    varying vec2 vUv;
                    
                    void main() {
                        // Current sheet instabilities
                        float instability = sin(vUv.x * 10.0 + time) * sin(vUv.y * 15.0 + time * 0.7);
                        float intensity = 0.3 + instability * 0.2;
                        
                        // Fade with distance
                        float fade = 1.0 - abs(vPosition.x) / 100.0;
                        
                        float alpha = intensity * currentDensity * fade * 0.4;
                        gl_FragColor = vec4(color, alpha);
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            
            this.plasmaSheet = new THREE.Mesh(sheetGeometry, sheetMaterial);
            this.plasmaSheet.position.x = -this.physics.tailLength / 4;
            this.plasmaSheet.name = 'PlasmaSheet';
            
            this.group.add(this.plasmaSheet);
            
            this.log('Plasma sheet created');
            
        } catch (error) {
            console.warn('Could not create plasma sheet:', error);
        }
    }
    
    /**
     * Create enhanced magnetotail with plasma physics
     */
    createMagnetotail() {
        try {
            // Create tail field lines with reconnection
            const tailFieldLines = 8;
            
            for (let i = 0; i < tailFieldLines; i++) {
                const tailLine = this.createTailFieldLine(i);
                if (tailLine) {
                    this.group.add(tailLine);
                }
            }
            
            this.log('Enhanced magnetotail created');
            
        } catch (error) {
            console.warn('Could not create magnetotail:', error);
        }
    }
    
    /**
     * Create tail field line with reconnection physics
     */
    createTailFieldLine(index) {
        try {
            const points = [];
            const yOffset = (index - 3.5) * 3;
            const zOffset = Math.sin(index * Math.PI / 4) * 2;
            
            for (let i = 0; i <= 50; i++) {
                const t = i / 50;
                let x = -t * this.physics.tailLength * 0.8;
                let y = yOffset * (1 + t * 0.5);
                let z = zOffset * (1 + t * 0.3);
                
                // Add reconnection X-point distortion
                if (t > 0.3 && t < 0.7) {
                    const reconnectionT = (t - 0.3) / 0.4;
                    const distortion = Math.sin(reconnectionT * Math.PI) * 5;
                    y += distortion * (index % 2 === 0 ? 1 : -1);
                }
                
                points.push(new THREE.Vector3(x, y, z));
            }
            
            const curve = new THREE.CatmullRomCurve3(points);
            const geometry = new THREE.TubeGeometry(curve, 25, 0.1, 4, false);
            
            const material = new THREE.MeshBasicMaterial({
                color: 0x6666ff,
                transparent: true,
                opacity: 0.4
            });
            
            const tailLine = new THREE.Mesh(geometry, material);
            tailLine.name = `TailFieldLine_${index}`;
            
            return tailLine;
            
        } catch (error) {
            console.warn(`Could not create tail field line ${index}:`, error);
            return null;
        }
    }
    
    /**
     * Create magnetic reconnection sites
     */
    createReconnectionSites() {
        try {
            // Reconnection occurs at multiple sites due to Uranus's tilted field
            const sites = [
                { position: new THREE.Vector3(-50, 5, 0), strength: 1.0 },
                { position: new THREE.Vector3(-80, -8, 3), strength: 0.8 },
                { position: new THREE.Vector3(-120, 0, -5), strength: 0.6 }
            ];
            
            sites.forEach((site, index) => {
                const reconnectionSite = this.createReconnectionSite(site, index);
                if (reconnectionSite) {
                    this.reconnectionSites.push(reconnectionSite);
                    this.group.add(reconnectionSite);
                }
            });
            
            this.log('Reconnection sites created');
            
        } catch (error) {
            console.warn('Could not create reconnection sites:', error);
        }
    }
    
    /**
     * Create individual reconnection site
     */
    createReconnectionSite(site, index) {
        try {
            const geometry = new THREE.SphereGeometry(2, 8, 8);
            
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    strength: { value: site.strength },
                    color: { value: new THREE.Color(0xffff44) }
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
                    uniform float strength;
                    uniform vec3 color;
                    varying vec3 vPosition;
                    
                    void main() {
                        float pulse = sin(time * 3.0 + float(${index}) * 2.0) * 0.5 + 0.5;
                        float intensity = strength * (0.5 + pulse * 0.5);
                        
                        gl_FragColor = vec4(color, intensity * 0.8);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending
            });
            
            const reconnectionSite = new THREE.Mesh(geometry, material);
            reconnectionSite.position.copy(site.position);
            reconnectionSite.name = `ReconnectionSite_${index}`;
            
            return reconnectionSite;
            
        } catch (error) {
            console.warn(`Could not create reconnection site ${index}:`, error);
            return null;
        }
    }
    
    /**
     * Create dynamic aurora based on real magnetic field geometry
     */
    createDynamicAurorae() {
        try {
            // Due to tilted field, aurora moves dramatically with rotation
            this.createAuroralOval('north', URANUS_RADIUS * 0.8, 0x00ff88);
            this.createAuroralOval('south', -URANUS_RADIUS * 0.8, 0xff0088);
            
            // Mobile aurora spots due to field geometry
            this.createMobileAurorae();
            
            this.log('Dynamic aurora created');
            
        } catch (error) {
            console.warn('Could not create aurora:', error);
        }
    }
    
    /**
     * Create auroral oval with proper magnetic footprint
     */
    createAuroralOval(hemisphere, yPosition, color) {
        try {
            const geometry = new THREE.RingGeometry(
                URANUS_RADIUS * 0.6,
                URANUS_RADIUS * 1.1,
                32, 8
            );
            
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    rotationPhase: { value: 0 },
                    color: { value: new THREE.Color(color) },
                    intensity: { value: 0.5 }
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
                    uniform float rotationPhase;
                    uniform vec3 color;
                    uniform float intensity;
                    varying vec2 vUv;
                    varying vec3 vPosition;
                    
                    void main() {
                        // Aurora follows magnetic field footprint
                        float angle = atan(vPosition.z, vPosition.x);
                        float magneticLat = angle + rotationPhase;
                        
                        // Field line mapping creates complex aurora pattern
                        float auroralIntensity = sin(magneticLat * 3.0 + time) * 0.3 + 0.7;
                        auroralIntensity *= sin(magneticLat * 7.0 + time * 2.0) * 0.2 + 0.8;
                        
                        // Radial variation
                        float r = length(vPosition.xy);
                        float radialProfile = exp(-(r - 0.85) * (r - 0.85) * 20.0);
                        
                        float alpha = intensity * auroralIntensity * radialProfile * 0.6;
                        gl_FragColor = vec4(color, alpha);
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            
            const aurora = new THREE.Mesh(geometry, material);
            aurora.position.y = yPosition;
            aurora.rotation.x = -Math.PI / 2;
            aurora.name = `Aurora_${hemisphere}`;
            
            this.aurorae[hemisphere] = aurora;
            this.group.add(aurora);
            
        } catch (error) {
            console.warn(`Could not create ${hemisphere} aurora:`, error);
        }
    }
    
    /**
     * Create mobile aurora spots due to unusual magnetic geometry
     */
    createMobileAurorae() {
        try {
            const mobileSpots = 4;
            
            for (let i = 0; i < mobileSpots; i++) {
                const spot = this.createAuroralSpot(i);
                if (spot) {
                    this.aurorae.mobile.push(spot);
                    this.group.add(spot);
                }
            }
            
        } catch (error) {
            console.warn('Could not create mobile aurora:', error);
        }
    }
    
    /**
     * Create individual mobile auroral spot
     */
    createAuroralSpot(index) {
        try {
            const geometry = new THREE.SphereGeometry(3, 16, 16);
            
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    phase: { value: index * Math.PI / 2 },
                    color: { value: new THREE.Color().setHSL(index * 0.25, 0.8, 0.6) }
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
                    uniform float phase;
                    uniform vec3 color;
                    varying vec3 vPosition;
                    
                    void main() {
                        float pulse = sin(time * 2.0 + phase) * 0.5 + 0.5;
                        float distance = length(vPosition);
                        float falloff = exp(-distance * 0.5);
                        
                        float alpha = pulse * falloff * 0.4;
                        gl_FragColor = vec4(color, alpha);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending
            });
            
            const spot = new THREE.Mesh(geometry, material);
            spot.name = `MobileAurora_${index}`;
            
            return spot;
            
        } catch (error) {
            console.warn(`Could not create mobile aurora ${index}:`, error);
            return null;
        }
    }
    
    /**
     * Apply correct magnetic geometry with offset and tilt
     */
    applyMagneticGeometry() {
        try {
            // Apply magnetic field offset (31% of planetary radius)
            this.group.position.set(
                0,
                -URANUS_RADIUS * this.physics.offsetDistance * Math.cos(this.physics.tiltAngle),
                -URANUS_RADIUS * this.physics.offsetDistance * Math.sin(this.physics.tiltAngle)
            );
            
            // Apply magnetic field tilt (58.6° from rotation axis)
            this.group.rotation.x = this.physics.tiltAngle;
            
            // Apply Uranus's extreme planetary tilt
            this.group.rotation.z = URANUS_TILT;
            
            this.log('Magnetic geometry applied');
            
        } catch (error) {
            console.warn('Could not apply magnetic geometry:', error);
        }
    }
    
    /**
     * Update with scientific physics calculations
     */
    update(deltaTime, uranusRotation, orbitalPhase = 0) {
        if (!this.group || !this.group.visible) return;
        
        try {
            this.animationTime += deltaTime;
            this.rotationPhase = uranusRotation;
            this.orbitalPhase = orbitalPhase;
            
            // Calculate solar wind pressure (varies with orbital position)
            this.solarWindPressure = 0.8 + 0.4 * Math.sin(orbitalPhase);
            
            // Rotate magnetosphere with planet
            this.group.rotation.y = uranusRotation;
            
            // Update physics-based components
            this.updateMagnetosphericBoundaries(deltaTime);
            this.updateFieldLines(deltaTime);
            this.updateRadiationBelts(deltaTime);
            this.updatePlasmaSheet(deltaTime);
            this.updateReconnection(deltaTime);
            this.updateAurorae(deltaTime);
            
        } catch (error) {
            console.error('Error updating magnetosphere physics:', error);
        }
    }
    
    /**
     * Update magnetopause and bow shock based on solar wind pressure
     */
    updateMagnetosphericBoundaries(deltaTime) {
        try {
            // Dynamic pressure affects boundary positions
            const pressureScale = Math.pow(this.solarWindPressure, -1/6);
            
            if (this.magnetopause) {
                this.magnetopause.scale.setScalar(pressureScale);
                
                if (this.magnetopause.material.uniforms) {
                    this.magnetopause.material.uniforms.time.value = this.animationTime;
                    this.magnetopause.material.uniforms.turbulence.value = this.solarWindPressure;
                }
            }
            
            if (this.bow_shock) {
                this.bow_shock.scale.setScalar(pressureScale * 1.2);
                
                if (this.bow_shock.material.uniforms) {
                    this.bow_shock.material.uniforms.time.value = this.animationTime;
                }
            }
        } catch (error) {
            // Silent fail for boundaries
        }
    }
    
    /**
     * Update magnetic field lines with current flow
     */
    updateFieldLines(deltaTime) {
        try {
            this.fieldLines.forEach((line, index) => {
                if (line.material.uniforms) {
                    line.material.uniforms.time.value = this.animationTime;
                    
                    // Field strength varies with solar wind coupling
                    const coupling = 0.8 + 0.3 * Math.sin(this.animationTime * 0.5 + index);
                    line.material.uniforms.fieldStrength.value = coupling / (index + 2);
                }
            });
        } catch (error) {
            // Silent fail for field lines
        }
    }
    
    /**
     * Update radiation belt dynamics
     */
    updateRadiationBelts(deltaTime) {
        try {
            Object.values(this.radiationBelts).forEach((belt, index) => {
                if (!belt || !belt.material.uniforms) return;
                
                belt.material.uniforms.time.value = this.animationTime;
                
                // Particle precipitation varies with magnetic activity
                const precipitation = 0.7 + 0.3 * Math.sin(this.animationTime * 1.5 + index);
                belt.material.uniforms.particleDensity.value = precipitation;
                
                // Differential rotation of belts
                belt.rotation.z += deltaTime * (0.01 + index * 0.005);
            });
        } catch (error) {
            // Silent fail for radiation belts
        }
    }
    
    /**
     * Update plasma sheet dynamics
     */
    updatePlasmaSheet(deltaTime) {
        try {
            if (this.plasmaSheet && this.plasmaSheet.material.uniforms) {
                this.plasmaSheet.material.uniforms.time.value = this.animationTime;
                
                // Current density varies with reconnection
                const currentDensity = 0.8 + 0.4 * Math.sin(this.animationTime * 0.3);
                this.plasmaSheet.material.uniforms.currentDensity.value = currentDensity;
            }
        } catch (error) {
            // Silent fail for plasma sheet
        }
    }
    
    /**
     * Update magnetic reconnection sites
     */
    updateReconnection(deltaTime) {
        try {
            this.reconnectionSites.forEach((site, index) => {
                if (site.material.uniforms) {
                    site.material.uniforms.time.value = this.animationTime;
                    
                    // Reconnection rate varies with solar wind conditions
                    const rate = this.physics.reconnectionRate * this.solarWindPressure;
                    site.material.uniforms.strength.value = rate * (1 + index * 0.3);
                }
            });
        } catch (error) {
            // Silent fail for reconnection
        }
    }
    
    /**
     * Update aurora with realistic magnetic footprint mapping
     */
    updateAurorae(deltaTime) {
        try {
            // Update main auroral ovals
            ['north', 'south'].forEach(hemisphere => {
                const aurora = this.aurorae[hemisphere];
                if (aurora && aurora.material.uniforms) {
                    aurora.material.uniforms.time.value = this.animationTime;
                    aurora.material.uniforms.rotationPhase.value = this.rotationPhase;
                    
                    // Aurora intensity varies with magnetic activity
                    const activity = 0.3 + 0.7 * Math.sin(this.animationTime * 0.8);
                    aurora.material.uniforms.intensity.value = activity;
                }
            });
            
            // Update mobile aurora spots
            this.aurorae.mobile.forEach((spot, index) => {
                if (spot.material.uniforms) {
                    spot.material.uniforms.time.value = this.animationTime;
                }
                
                // Mobile aurora move with magnetic field rotation
                const angle = this.rotationPhase + index * Math.PI / 2;
                const radius = URANUS_RADIUS * (1.2 + 0.3 * Math.sin(this.animationTime + index));
                
                spot.position.set(
                    Math.cos(angle) * radius,
                    Math.sin(this.animationTime * 0.5 + index) * URANUS_RADIUS * 0.5,
                    Math.sin(angle) * radius
                );
            });
            
        } catch (error) {
            // Silent fail for aurora
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
        try {
            // Update all materials with opacity
            this.group.traverse(child => {
                if (child.material) {
                    if (child.material.uniforms && child.material.uniforms.opacity) {
                        child.material.uniforms.opacity.value = opacity;
                    } else if (child.material.uniforms && child.material.uniforms.baseOpacity) {
                        child.material.uniforms.baseOpacity.value = opacity;
                    } else if (child.material.opacity !== undefined) {
                        child.material.opacity = opacity;
                    }
                }
            });
        } catch (error) {
            console.warn('Could not set magnetosphere opacity:', error);
        }
    }
    
    /**
     * Get physics state for debugging
     */
    getPhysicsState() {
        return {
            solarWindPressure: this.solarWindPressure,
            rotationPhase: this.rotationPhase,
            orbitalPhase: this.orbitalPhase,
            reconnectionRate: this.physics.reconnectionRate,
            fieldStrength: this.physics.dipoleStrength
        };
    }
    
    /**
     * Create fallback magnetosphere
     */
    createFallbackMagnetosphere() {
        try {
            console.warn('Creating fallback magnetosphere');
            
            this.group = new THREE.Group();
            
            const geometry = new THREE.SphereGeometry(25, 12, 12);
            const material = new THREE.MeshBasicMaterial({
                color: 0xff6b9d,
                transparent: true,
                opacity: 0.15,
                wireframe: true
            });
            
            const fallback = new THREE.Mesh(geometry, material);
            this.group.add(fallback);
            
            this.group.visible = false;
            this.scene.add(this.group);
            
        } catch (error) {
            console.error('Complete magnetosphere failure:', error);
        }
    }
    
    /**
     * Debug logging
     */
    log(message) {
        if (this.debug) {
            console.log(`[Enhanced Magnetosphere] ${message}`);
        }
    }
    
    /**
     * Get group reference
     */
    getGroup() {
        return this.group;
    }
    
    /**
     * Dispose of all resources
     */
    dispose() {
        try {
            if (this.group) {
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
                
                if (this.scene && this.group.parent) {
                    this.scene.remove(this.group);
                }
                
                // Clear all references
                this.fieldLines = [];
                this.radiationBelts = { inner: null, outer: null, intermediate: null };
                this.reconnectionSites = [];
                this.plasmaSheet = null;
                this.bow_shock = null;
                this.magnetopause = null;
                this.tail = null;
                this.aurorae = { north: null, south: null, mobile: [] };
                this.group = null;
            }
        } catch (error) {
            console.error('Error disposing enhanced magnetosphere:', error);
        }
    }
}
