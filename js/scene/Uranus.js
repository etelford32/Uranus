/**
 * Uranus - The tilted ice giant planet with atmosphere and ice simulation
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
        this.innerAtmosphere = null;
        this.iceLayer = null;
        this.frostParticles = null;
        this.rotation = 0;
        this.time = 0;
        
        // Atmosphere parameters
        this.atmosphereConfig = {
            innerRadius: URANUS_RADIUS * 1.01,
            outerRadius: URANUS_RADIUS * 1.25,
            density: 0.8,
            turbulence: 0.3,
            windSpeed: 500, // km/h
            methaneAbsorption: 0.7
        };
        
        // Ice parameters
        this.iceConfig = {
            coverage: 0.6,
            thickness: 0.02,
            crystallization: 0.8,
            sublimation: 0.1
        };
    }
    
    /**
     * Create Uranus and add to scene
     */
    create() {
        // Create group to hold all Uranus components
        this.group = new THREE.Group();
        
        // Create the main planet
        this.createPlanet();
        
        // Create ice layer
        this.createIceLayer();
        
        // Create cloud layer
        this.createCloudLayer();
        
        // Create inner atmosphere
        this.createInnerAtmosphere();
        
        // Create outer atmospheric glow
        this.createAtmosphere();
        
        // Create frost particle system
        this.createFrostParticles();
        
        // Apply the extreme axial tilt
        this.group.rotation.z = URANUS_TILT;
        
        // Add to scene
        this.scene.add(this.group);
    }
    
    /**
     * Create the main planet mesh with ice surface
     */
    createPlanet() {
        const quality = QualityPresets[PerformanceSettings.currentQuality];
        const segments = quality.uranusSegments || 128;
        
        // Create sphere geometry
        const geometry = new THREE.SphereGeometry(URANUS_RADIUS, segments, segments);
        
        // Enhanced material with ice properties
        const material = new THREE.MeshPhongMaterial({
            color: COLORS.uranus.main,
            emissive: COLORS.uranus.emissive,
            emissiveIntensity: 0.1,
            specular: new THREE.Color(0xaaccee), // Icy specular
            shininess: 80, // Higher for ice
            reflectivity: 0.5,
            envMapIntensity: 0.7
        });
        
        // Create mesh
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.name = 'Uranus';
        
        // Add surface detail
        this.addSurfaceDetail(geometry);
        
        this.group.add(this.mesh);
    }
    
    /**
     * Create ice layer with shader
     */
    createIceLayer() {
        const quality = QualityPresets[PerformanceSettings.currentQuality];
        const segments = quality.uranusSegments || 128;
        
        const geometry = new THREE.SphereGeometry(
            URANUS_RADIUS * 1.005, 
            segments, 
            segments
        );
        
        // Custom ice shader
        const iceMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                baseColor: { value: new THREE.Color(0x4FD0E7) },
                iceColor: { value: new THREE.Color(0xE0F4FF) },
                coverage: { value: this.iceConfig.coverage },
                thickness: { value: this.iceConfig.thickness },
                crystallization: { value: this.iceConfig.crystallization },
                cameraPosition: { value: new THREE.Vector3() }
            },
            vertexShader: `
                uniform float time;
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                
                // Noise function for ice patterns
                float noise(vec3 p) {
                    return sin(p.x * 10.0) * sin(p.y * 10.0) * sin(p.z * 10.0);
                }
                
                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    
                    // Add ice crystallization displacement
                    vec3 displaced = position;
                    float icePattern = noise(position * 5.0 + time * 0.1);
                    displaced += normal * icePattern * 0.01;
                    
                    vWorldPosition = (modelMatrix * vec4(displaced, 1.0)).xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 baseColor;
                uniform vec3 iceColor;
                uniform float coverage;
                uniform float thickness;
                uniform float crystallization;
                uniform vec3 cameraPosition;
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                
                // Fractal noise for ice patterns
                float fbm(vec3 p) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    for (int i = 0; i < 4; i++) {
                        value += amplitude * sin(p.x * 10.0) * sin(p.y * 10.0) * sin(p.z * 10.0);
                        p *= 2.0;
                        amplitude *= 0.5;
                    }
                    return value;
                }
                
                void main() {
                    // Ice coverage pattern
                    float icePattern = fbm(vPosition * 3.0 + time * 0.05);
                    icePattern = smoothstep(1.0 - coverage, 1.0, icePattern + 0.5);
                    
                    // Crystalline structure
                    float crystals = fbm(vPosition * 20.0);
                    crystals = pow(abs(crystals), crystallization);
                    
                    // View-dependent fresnel effect for ice
                    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                    float fresnel = pow(1.0 - dot(vNormal, viewDir), 2.0);
                    
                    // Mix base and ice colors
                    vec3 color = mix(baseColor, iceColor, icePattern);
                    color = mix(color, vec3(1.0), crystals * icePattern * 0.3);
                    
                    // Add ice shine
                    color += vec3(0.2, 0.3, 0.4) * fresnel * icePattern;
                    
                    // Ice transparency
                    float alpha = mix(0.3, 0.9, icePattern) * (1.0 - fresnel * 0.3);
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.FrontSide,
            depthWrite: false,
            blending: THREE.NormalBlending
        });
        
        this.iceLayer = new THREE.Mesh(geometry, iceMaterial);
        this.iceLayer.name = 'IceLayer';
        this.group.add(this.iceLayer);
    }
    
    /**
     * Create enhanced cloud layer with atmospheric dynamics
     */
    createCloudLayer() {
        const quality = QualityPresets[PerformanceSettings.currentQuality];
        const segments = Math.floor(quality.uranusSegments * 0.5) || 64;
        
        const geometry = new THREE.SphereGeometry(
            URANUS_RADIUS * 1.01, 
            segments, 
            segments / 2
        );
        
        // Dynamic cloud shader
        const cloudMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                cloudColor: { value: new THREE.Color(COLORS.uranus.atmosphere) },
                windSpeed: { value: this.atmosphereConfig.windSpeed },
                turbulence: { value: this.atmosphereConfig.turbulence }
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
                uniform vec3 cloudColor;
                uniform float windSpeed;
                uniform float turbulence;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                
                // Turbulence function
                float turbulence3D(vec3 p) {
                    float value = 0.0;
                    float scale = 1.0;
                    for(int i = 0; i < 4; i++) {
                        value += abs(sin(p.x * scale + time * windSpeed * 0.001) * 
                                    sin(p.y * scale) * 
                                    sin(p.z * scale)) / scale;
                        scale *= 2.0;
                    }
                    return value;
                }
                
                void main() {
                    // Atmospheric bands
                    float bands = sin(vUv.y * 20.0 + time * 0.1) * 0.5 + 0.5;
                    
                    // Turbulent motion
                    float turb = turbulence3D(vPosition * 2.0) * turbulence;
                    
                    // Combine effects
                    float cloudDensity = bands * (0.7 + turb * 0.3);
                    cloudDensity = smoothstep(0.3, 0.7, cloudDensity);
                    
                    vec3 color = cloudColor * (0.8 + turb * 0.2);
                    float alpha = cloudDensity * 0.3;
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.FrontSide,
            depthWrite: false
        });
        
        this.cloudLayer = new THREE.Mesh(geometry, cloudMaterial);
        this.cloudLayer.name = 'CloudLayer';
        this.group.add(this.cloudLayer);
    }
    
    /**
     * Create inner atmosphere layer
     */
    createInnerAtmosphere() {
        const geometry = new THREE.SphereGeometry(
            this.atmosphereConfig.innerRadius,
            64,
            64
        );
        
        // Methane-rich atmosphere shader
        const atmosphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                methaneColor: { value: new THREE.Color(0x3FA0B5) },
                hydrogenColor: { value: new THREE.Color(0x6FE5F5) },
                methaneAbsorption: { value: this.atmosphereConfig.methaneAbsorption },
                density: { value: this.atmosphereConfig.density },
                sunPosition: { value: new THREE.Vector3(1000, 500, 1000) }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec3 vWorldPosition;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 methaneColor;
                uniform vec3 hydrogenColor;
                uniform float methaneAbsorption;
                uniform float density;
                uniform vec3 sunPosition;
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec3 vWorldPosition;
                
                void main() {
                    // Atmospheric scattering
                    vec3 sunDir = normalize(sunPosition - vWorldPosition);
                    float sunAngle = dot(vNormal, sunDir);
                    
                    // Methane absorption bands
                    float absorption = sin(vPosition.y * 30.0 + time * 0.2) * methaneAbsorption;
                    
                    // Mix atmospheric gases
                    vec3 color = mix(hydrogenColor, methaneColor, absorption);
                    
                    // Rayleigh scattering
                    float scatter = pow(max(0.0, sunAngle), 2.0);
                    color += vec3(0.1, 0.2, 0.3) * scatter;
                    
                    // Atmospheric density gradient
                    float height = length(vPosition) - ${URANUS_RADIUS}.0;
                    float atmosphericDensity = exp(-height * 5.0) * density;
                    
                    float alpha = atmosphericDensity * 0.15;
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.BackSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        this.innerAtmosphere = new THREE.Mesh(geometry, atmosphereMaterial);
        this.innerAtmosphere.name = 'InnerAtmosphere';
        this.group.add(this.innerAtmosphere);
    }
    
    /**
     * Create atmospheric glow (outer atmosphere)
     */
    createAtmosphere() {
        const geometry = new THREE.SphereGeometry(
            this.atmosphereConfig.outerRadius,
            32,
            32
        );
        
        // Enhanced atmospheric glow shader
        const material = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(COLORS.uranus.glow) },
                viewVector: { value: new THREE.Vector3() },
                c: { value: 0.4 },
                p: { value: 5.0 },
                time: { value: 0 },
                auroras: { value: 1.0 }
            },
            vertexShader: `
                uniform vec3 viewVector;
                uniform float time;
                uniform float auroras;
                varying float intensity;
                varying float auroraIntensity;
                varying vec3 vNormal;
                
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    intensity = pow(0.7 - dot(vNormal, vNormel), 2.2);
                    
                    // Aurora calculation at poles
                    float polarAngle = abs(normal.y);
                    auroraIntensity = pow(polarAngle, 4.0) * auroras;
                    auroraIntensity *= sin(time * 2.0 + position.x * 10.0) * 0.5 + 0.5;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                uniform float time;
                varying float intensity;
                varying float auroraIntensity;
                
                void main() {
                    vec3 glow = glowColor * intensity;
                    
                    // Add aurora colors at poles
                    vec3 auroraColor = mix(
                        vec3(0.0, 1.0, 0.5),  // Green
                        vec3(1.0, 0.0, 1.0),  // Magenta
                        sin(time * 3.0) * 0.5 + 0.5
                    );
                    glow += auroraColor * auroraIntensity * 0.5;
                    
                    float alpha = (intensity + auroraIntensity) * 0.2;
                    gl_FragColor = vec4(glow, alpha);
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
     * Create frost particle system
     */
    createFrostParticles() {
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        const sizes = [];
        
        for (let i = 0; i < particleCount; i++) {
            // Random position around planet
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const radius = URANUS_RADIUS * (1.02 + Math.random() * 0.2);
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            
            positions.push(x, y, z);
            
            // Random velocities for drift
            velocities.push(
                (Math.random() - 0.5) * 0.01,
                (Math.random() - 0.5) * 0.01,
                (Math.random() - 0.5) * 0.01
            );
            
            // Random sizes
            sizes.push(Math.random() * 0.5 + 0.1);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        
        // Frost particle shader
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0xE0F4FF) }
            },
            vertexShader: `
                attribute vec3 velocity;
                attribute float size;
                uniform float time;
                varying float vOpacity;
                
                void main() {
                    vec3 pos = position;
                    
                    // Apply drift motion
                    pos += velocity * time * 10.0;
                    
                    // Wrap around planet
                    float r = length(pos);
                    if (r > ${URANUS_RADIUS * 1.3}.0) {
                        pos = normalize(pos) * ${URANUS_RADIUS * 1.02}.0;
                    }
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    // Fade based on distance from surface
                    vOpacity = 1.0 - smoothstep(${URANUS_RADIUS * 1.02}.0, ${URANUS_RADIUS * 1.22}.0, r);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                varying float vOpacity;
                
                void main() {
                    // Circular particle with soft edges
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    
                    float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * vOpacity * 0.6;
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.frostParticles = new THREE.Points(geometry, material);
        this.frostParticles.name = 'FrostParticles';
        this.group.add(this.frostParticles);
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
     * Update Uranus rotation and effects
     */
    update(deltaTime, timeSpeed) {
        if (!this.group) return;
        
        this.time += deltaTime * timeSpeed;
        
        // Rotate Uranus (retrograde rotation)
        const rotationSpeed = (deltaTime * timeSpeed * 2 * Math.PI) / URANUS_ROTATION_PERIOD;
        this.rotation -= rotationSpeed;
        this.group.rotation.y = this.rotation;
        
        // Update cloud layer with differential rotation
        if (this.cloudLayer) {
            this.cloudLayer.rotation.y += rotationSpeed * 0.15;
            if (this.cloudLayer.material.uniforms) {
                this.cloudLayer.material.uniforms.time.value = this.time;
            }
        }
        
        // Update ice layer
        if (this.iceLayer && this.iceLayer.material.uniforms) {
            this.iceLayer.material.uniforms.time.value = this.time;
            
            // Update camera position for fresnel effect
            const camera = this.scene.getObjectByProperty('isCamera', true);
            if (camera) {
                this.iceLayer.material.uniforms.cameraPosition.value = camera.position;
            }
            
            // Seasonal ice coverage changes (very slow)
            const seasonalVariation = Math.sin(this.time * 0.001) * 0.1;
            this.iceLayer.material.uniforms.coverage.value = 
                this.iceConfig.coverage + seasonalVariation;
        }
        
        // Update inner atmosphere
        if (this.innerAtmosphere && this.innerAtmosphere.material.uniforms) {
            this.innerAtmosphere.material.uniforms.time.value = this.time;
        }
        
        // Update outer atmosphere shader
        if (this.atmosphere && this.atmosphere.material.uniforms) {
            this.atmosphere.material.uniforms.time.value = this.time;
            
            const camera = this.scene.getObjectByProperty('isCamera', true);
            if (camera) {
                this.atmosphere.material.uniforms.viewVector.value = 
                    new THREE.Vector3().subVectors(camera.position, this.group.position);
            }
        }
        
        // Update frost particles
        if (this.frostParticles && this.frostParticles.material.uniforms) {
            this.frostParticles.material.uniforms.time.value = this.time;
            
            // Rotate particles slowly for drift effect
            this.frostParticles.rotation.y += deltaTime * 0.05;
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
        
        // Update other layers similarly
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
            // Dispose all meshes and materials
            const meshes = [this.mesh, this.cloudLayer, this.iceLayer, 
                           this.innerAtmosphere, this.atmosphere];
            
            meshes.forEach(mesh => {
                if (mesh) {
                    if (mesh.geometry) mesh.geometry.dispose();
                    if (mesh.material) {
                        if (mesh.material.uniforms) {
                            // Dispose any textures in uniforms
                            Object.values(mesh.material.uniforms).forEach(uniform => {
                                if (uniform.value && uniform.value.dispose) {
                                    uniform.value.dispose();
                                }
                            });
                        }
                        mesh.material.dispose();
                    }
                }
            });
            
            // Dispose frost particles
            if (this.frostParticles) {
                this.frostParticles.geometry.dispose();
                this.frostParticles.material.dispose();
            }
            
            // Remove from scene
            if (this.scene && this.group.parent) {
                this.scene.remove(this.group);
            }
            
            // Clear references
            this.group = null;
            this.mesh = null;
            this.cloudLayer = null;
            this.iceLayer = null;
            this.innerAtmosphere = null;
            this.atmosphere = null;
            this.frostParticles = null;
        }
    }
}
