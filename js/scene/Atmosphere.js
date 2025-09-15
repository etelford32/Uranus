/**
 * Enhanced Atmosphere - Realistic Uranus atmospheric effects
 * Features atmospheric scattering, methane absorption, and dynamic weather
 */

import { URANUS_RADIUS, URANUS_TILT, COLORS } from '../config/constants.js';

export default class Atmosphere {
    constructor(scene, uranusGroup) {
        this.scene = scene;
        this.uranusGroup = uranusGroup; // Parent group from Uranus
        this.group = null;
        
        // Atmosphere components
        this.innerAtmosphere = null;
        this.outerAtmosphere = null;
        this.cloudLayers = [];
        this.methaneLayer = null;
        this.haze = null;
        this.storms = [];
        
        // Animation state
        this.time = 0;
        this.windSpeed = 0.001;
        this.turbulence = 0.5;
        
        // Configuration
        this.config = {
            innerRadius: URANUS_RADIUS * 1.0,
            outerRadius: URANUS_RADIUS * 1.25,
            cloudRadius: URANUS_RADIUS * 1.02,
            methaneRadius: URANUS_RADIUS * 1.15,
            hazeRadius: URANUS_RADIUS * 1.2,
            layers: 3,
            useShaders: true,
            debug: false
        };
        
        // Shader uniforms
        this.uniforms = {
            time: { value: 0 },
            sunDirection: { value: new THREE.Vector3(1, 0, 0) },
            cameraPosition: { value: new THREE.Vector3(0, 0, 100) },
            innerRadius: { value: this.config.innerRadius },
            outerRadius: { value: this.config.outerRadius },
            methaneAbsorption: { value: 2.3 }, // 2.3% methane content
            rayleighStrength: { value: 1.0 },
            mieStrength: { value: 0.005 },
            scatteringIntensity: { value: 1.0 },
            atmosphereDensity: { value: 1.0 },
            cloudCoverage: { value: 0.3 },
            windSpeed: { value: this.windSpeed }
        };
    }
    
    /**
     * Create the complete atmosphere system
     */
    create() {
        try {
            this.log('Creating enhanced atmosphere...');
            
            this.group = new THREE.Group();
            this.group.name = 'AtmosphereSystem';
            
            // Create layered atmosphere
            this.createInnerAtmosphere();
            this.createOuterAtmosphere();
            this.createCloudLayers();
            this.createMethaneLayer();
            this.createAtmosphericHaze();
            this.createDynamicStorms();
            
            // Add to Uranus group instead of scene
            if (this.uranusGroup) {
                this.uranusGroup.add(this.group);
            } else {
                this.scene.add(this.group);
            }
            
            this.log('Atmosphere system created successfully');
            
        } catch (error) {
            console.error('Failed to create atmosphere:', error);
            this.createFallbackAtmosphere();
        }
    }
    
    /**
     * Create inner atmosphere with scattering
     */
    createInnerAtmosphere() {
        try {
            const geometry = new THREE.SphereGeometry(
                this.config.innerRadius * 1.001,
                64, 64
            );
            
            if (this.config.useShaders) {
                const material = new THREE.ShaderMaterial({
                    uniforms: {
                        ...this.uniforms,
                        atmosphereColor: { value: new THREE.Color(COLORS.uranus.atmosphere || 0x6FE5F5) }
                    },
                    vertexShader: `
                        varying vec3 vNormal;
                        varying vec3 vPosition;
                        varying vec2 vUv;
                        varying float vDensity;
                        
                        void main() {
                            vUv = uv;
                            vNormal = normalize(normalMatrix * normal);
                            vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                            
                            // Atmospheric density based on altitude
                            float altitude = length(position) - ${this.config.innerRadius.toFixed(2)};
                            vDensity = exp(-altitude * 10.0);
                            
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `,
                    fragmentShader: `
                        uniform vec3 sunDirection;
                        uniform vec3 cameraPosition;
                        uniform vec3 atmosphereColor;
                        uniform float methaneAbsorption;
                        uniform float time;
                        uniform float cloudCoverage;
                        
                        varying vec3 vNormal;
                        varying vec3 vPosition;
                        varying vec2 vUv;
                        varying float vDensity;
                        
                        // Rayleigh scattering
                        vec3 rayleighScattering(vec3 viewDir, vec3 lightDir) {
                            float cosTheta = dot(viewDir, lightDir);
                            float phase = 0.75 * (1.0 + cosTheta * cosTheta);
                            
                            // Wavelength-dependent scattering (more blue)
                            vec3 scatterColor = vec3(0.3, 0.5, 1.0) * phase;
                            return scatterColor;
                        }
                        
                        // Methane absorption
                        vec3 methaneAbsorb(vec3 color) {
                            // Methane absorbs red light, making Uranus blue-green
                            float absorption = methaneAbsorption * 0.01;
                            color.r *= (1.0 - absorption * 1.5); // Strong red absorption
                            color.g *= (1.0 - absorption * 0.3); // Weak green absorption
                            // Blue is not absorbed
                            return color;
                        }
                        
                        void main() {
                            vec3 viewDir = normalize(cameraPosition - vPosition);
                            vec3 lightDir = normalize(sunDirection);
                            
                            // Base atmosphere color
                            vec3 color = atmosphereColor;
                            
                            // Apply Rayleigh scattering
                            vec3 scatter = rayleighScattering(viewDir, lightDir);
                            color = mix(color, scatter, 0.3);
                            
                            // Apply methane absorption
                            color = methaneAbsorb(color);
                            
                            // Add cloud variation
                            float clouds = sin(vUv.x * 20.0 + time * 0.1) * 
                                         cos(vUv.y * 10.0 - time * 0.05);
                            clouds = smoothstep(-0.5, 0.5, clouds);
                            color = mix(color, vec3(0.7, 0.8, 0.9), clouds * cloudCoverage);
                            
                            // Limb darkening
                            float limb = 1.0 - pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);
                            color *= limb;
                            
                            // Atmospheric density affects opacity
                            float opacity = vDensity * 0.8 * limb;
                            
                            gl_FragColor = vec4(color, opacity);
                        }
                    `,
                    transparent: true,
                    side: THREE.FrontSide,
                    depthWrite: false,
                    blending: THREE.NormalBlending
                });
                
                this.innerAtmosphere = new THREE.Mesh(geometry, material);
                
            } else {
                // Fallback to simple material
                const material = new THREE.MeshPhongMaterial({
                    color: COLORS.uranus.atmosphere || 0x6FE5F5,
                    transparent: true,
                    opacity: 0.4,
                    side: THREE.FrontSide,
                    depthWrite: false
                });
                
                this.innerAtmosphere = new THREE.Mesh(geometry, material);
            }
            
            this.innerAtmosphere.name = 'InnerAtmosphere';
            this.group.add(this.innerAtmosphere);
            
            this.log('Inner atmosphere created');
            
        } catch (error) {
            console.warn('Could not create inner atmosphere:', error);
        }
    }
    
    /**
     * Create outer atmosphere glow
     */
    createOuterAtmosphere() {
        try {
            const geometry = new THREE.SphereGeometry(
                this.config.outerRadius,
                32, 32
            );
            
            if (this.config.useShaders) {
                const material = new THREE.ShaderMaterial({
                    uniforms: {
                        ...this.uniforms,
                        glowColor: { value: new THREE.Color(COLORS.uranus.glow || 0x4FD0E7) }
                    },
                    vertexShader: `
                        uniform vec3 cameraPosition;
                        varying float vIntensity;
                        varying vec3 vNormal;
                        
                        void main() {
                            vNormal = normalize(normalMatrix * normal);
                            vec3 viewVector = normalize(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz);
                            
                            // Fresnel effect for edge glow
                            vIntensity = pow(1.0 - abs(dot(vNormal, viewVector)), 2.0);
                            
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `,
                    fragmentShader: `
                        uniform vec3 glowColor;
                        uniform float time;
                        uniform float atmosphereDensity;
                        varying float vIntensity;
                        varying vec3 vNormal;
                        
                        void main() {
                            // Dynamic glow with time variation
                            float pulse = 1.0 + sin(time * 0.5) * 0.1;
                            
                            vec3 color = glowColor * vIntensity * pulse;
                            
                            // Add atmospheric scintillation
                            float scintillation = sin(time * 3.0 + vNormal.x * 10.0) * 0.05 + 1.0;
                            color *= scintillation;
                            
                            float opacity = vIntensity * 0.15 * atmosphereDensity;
                            
                            gl_FragColor = vec4(color, opacity);
                        }
                    `,
                    transparent: true,
                    side: THREE.BackSide,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending
                });
                
                this.outerAtmosphere = new THREE.Mesh(geometry, material);
                
            } else {
                // Simple glow fallback
                const material = new THREE.MeshBasicMaterial({
                    color: COLORS.uranus.glow || 0x4FD0E7,
                    transparent: true,
                    opacity: 0.1,
                    side: THREE.BackSide,
                    depthWrite: false
                });
                
                this.outerAtmosphere = new THREE.Mesh(geometry, material);
            }
            
            this.outerAtmosphere.name = 'OuterAtmosphere';
            this.group.add(this.outerAtmosphere);
            
            this.log('Outer atmosphere created');
            
        } catch (error) {
            console.warn('Could not create outer atmosphere:', error);
        }
    }
    
    /**
     * Create multiple cloud layers
     */
    createCloudLayers() {
        try {
            for (let i = 0; i < this.config.layers; i++) {
                const radius = this.config.cloudRadius + i * 0.01 * URANUS_RADIUS;
                const opacity = 0.2 - i * 0.05;
                
                const geometry = new THREE.SphereGeometry(radius, 48, 24);
                
                const material = new THREE.MeshPhongMaterial({
                    color: 0xa0b0c0,
                    transparent: true,
                    opacity: opacity,
                    emissive: 0x3a4a5a,
                    emissiveIntensity: 0.1,
                    side: THREE.FrontSide,
                    depthWrite: false
                });
                
                const cloudLayer = new THREE.Mesh(geometry, material);
                cloudLayer.name = `CloudLayer${i}`;
                
                // Different rotation speeds for each layer
                cloudLayer.userData.rotationSpeed = 0.001 * (1 + i * 0.2);
                
                this.cloudLayers.push(cloudLayer);
                this.group.add(cloudLayer);
            }
            
            this.log(`Created ${this.config.layers} cloud layers`);
            
        } catch (error) {
            console.warn('Could not create cloud layers:', error);
        }
    }
    
    /**
     * Create methane absorption layer
     */
    createMethaneLayer() {
        try {
            const geometry = new THREE.SphereGeometry(
                this.config.methaneRadius,
                32, 32
            );
            
            // Methane gives Uranus its cyan color by absorbing red light
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ffcc,
                transparent: true,
                opacity: 0.05,
                side: THREE.FrontSide,
                depthWrite: false,
                blending: THREE.SubtractiveBlending
            });
            
            this.methaneLayer = new THREE.Mesh(geometry, material);
            this.methaneLayer.name = 'MethaneLayer';
            
            this.group.add(this.methaneLayer);
            
            this.log('Methane layer created');
            
        } catch (error) {
            console.warn('Could not create methane layer:', error);
        }
    }
    
    /**
     * Create atmospheric haze
     */
    createAtmosphericHaze() {
        try {
            const geometry = new THREE.SphereGeometry(
                this.config.hazeRadius,
                24, 24
            );
            
            const material = new THREE.MeshBasicMaterial({
                color: 0xc0d0e0,
                transparent: true,
                opacity: 0.03,
                side: THREE.BackSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
            
            this.haze = new THREE.Mesh(geometry, material);
            this.haze.name = 'AtmosphericHaze';
            
            this.group.add(this.haze);
            
            this.log('Atmospheric haze created');
            
        } catch (error) {
            console.warn('Could not create haze:', error);
        }
    }
    
    /**
     * Create dynamic storm systems
     */
    createDynamicStorms() {
        try {
            // Uranus occasionally has bright storm systems
            const stormCount = 2;
            
            for (let i = 0; i < stormCount; i++) {
                const stormGeometry = new THREE.SphereGeometry(
                    URANUS_RADIUS * 0.05,
                    16, 16
                );
                
                const stormMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.3,
                    blending: THREE.AdditiveBlending
                });
                
                const storm = new THREE.Mesh(stormGeometry, stormMaterial);
                
                // Random position on surface
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                const r = this.config.cloudRadius;
                
                storm.position.set(
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.cos(phi),
                    r * Math.sin(phi) * Math.sin(theta)
                );
                
                storm.userData = {
                    theta: theta,
                    phi: phi,
                    speed: 0.002 + Math.random() * 0.003,
                    intensity: 0.3 + Math.random() * 0.3
                };
                
                storm.name = `Storm${i}`;
                this.storms.push(storm);
                this.group.add(storm);
            }
            
            this.log(`Created ${stormCount} storm systems`);
            
        } catch (error) {
            console.warn('Could not create storms:', error);
        }
    }
    
    /**
     * Create simple fallback atmosphere
     */
    createFallbackAtmosphere() {
        console.warn('Creating fallback atmosphere');
        
        this.group = new THREE.Group();
        
        const geometry = new THREE.SphereGeometry(
            URANUS_RADIUS * 1.1,
            16, 16
        );
        
        const material = new THREE.MeshBasicMaterial({
            color: 0x4FD0E7,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        
        const fallback = new THREE.Mesh(geometry, material);
        this.group.add(fallback);
        
        if (this.uranusGroup) {
            this.uranusGroup.add(this.group);
        } else {
            this.scene.add(this.group);
        }
    }
    
    /**
     * Update atmosphere animation
     */
    update(deltaTime, uranusRotation) {
        if (!this.group) return;
        
        this.time += deltaTime;
        
        // Update shader uniforms
        this.updateShaderUniforms();
        
        // Animate cloud layers with differential rotation
        this.animateCloudLayers(deltaTime);
        
        // Animate storms
        this.animateStorms(deltaTime);
        
        // Rotate methane layer slightly
        if (this.methaneLayer) {
            this.methaneLayer.rotation.y += deltaTime * 0.0001;
        }
        
        // Subtle haze animation
        if (this.haze) {
            const hazeScale = 1 + Math.sin(this.time * 0.3) * 0.02;
            this.haze.scale.setScalar(hazeScale);
        }
        
        // Update atmospheric density based on solar angle
        this.updateAtmosphericDensity(uranusRotation);
    }
    
    /**
     * Update shader uniforms
     */
    updateShaderUniforms() {
        // Update time
        this.uniforms.time.value = this.time;
        
        // Update camera position
        const camera = this.scene.getObjectByProperty('isCamera', true);
        if (camera) {
            this.uniforms.cameraPosition.value.copy(camera.position);
        }
        
        // Update sun direction (simplified)
        const sunAngle = this.time * 0.01;
        this.uniforms.sunDirection.value.set(
            Math.cos(sunAngle),
            0,
            Math.sin(sunAngle)
        );
        
        // Apply to materials
        if (this.innerAtmosphere && this.innerAtmosphere.material.uniforms) {
            Object.assign(this.innerAtmosphere.material.uniforms, this.uniforms);
        }
        
        if (this.outerAtmosphere && this.outerAtmosphere.material.uniforms) {
            Object.assign(this.outerAtmosphere.material.uniforms, this.uniforms);
        }
    }
    
    /**
     * Animate cloud layers with differential rotation
     */
    animateCloudLayers(deltaTime) {
        this.cloudLayers.forEach((layer, index) => {
            // Different rotation speeds at different altitudes
            const speed = layer.userData.rotationSpeed || 0.001;
            layer.rotation.y += speed * deltaTime;
            
            // Slight vertical oscillation
            const oscillation = Math.sin(this.time * 0.2 + index) * 0.001;
            layer.scale.y = 1 + oscillation;
        });
    }
    
    /**
     * Animate storm systems
     */
    animateStorms(deltaTime) {
        this.storms.forEach(storm => {
            // Move storms along latitude
            storm.userData.theta += storm.userData.speed * deltaTime;
            
            const r = this.config.cloudRadius;
            storm.position.set(
                r * Math.sin(storm.userData.phi) * Math.cos(storm.userData.theta),
                r * Math.cos(storm.userData.phi),
                r * Math.sin(storm.userData.phi) * Math.sin(storm.userData.theta)
            );
            
            // Pulse intensity
            const intensity = storm.userData.intensity * 
                            (0.7 + 0.3 * Math.sin(this.time * 2 + storm.userData.theta));
            storm.material.opacity = intensity;
            
            // Scale variation
            const scale = 1 + Math.sin(this.time * 3 + storm.userData.phi) * 0.2;
            storm.scale.setScalar(scale);
        });
    }
    
    /**
     * Update atmospheric density based on solar angle
     */
    updateAtmosphericDensity(uranusRotation) {
        // Simulate day/night atmospheric changes
        const solarAngle = uranusRotation % (Math.PI * 2);
        const dayFactor = (Math.cos(solarAngle) + 1) * 0.5;
        
        // Update density uniform
        this.uniforms.atmosphereDensity.value = 0.7 + dayFactor * 0.3;
        
        // Adjust cloud coverage
        this.uniforms.cloudCoverage.value = 0.2 + dayFactor * 0.2;
    }
    
    /**
     * Set atmosphere visibility
     */
    setVisible(visible) {
        if (this.group) {
            this.group.visible = visible;
        }
    }
    
    /**
     * Set atmosphere opacity
     */
    setOpacity(opacity) {
        if (this.innerAtmosphere) {
            if (this.innerAtmosphere.material.uniforms) {
                this.innerAtmosphere.material.uniforms.atmosphereDensity.value = opacity;
            } else {
                this.innerAtmosphere.material.opacity = opacity * 0.4;
            }
        }
        
        if (this.outerAtmosphere) {
            if (this.outerAtmosphere.material.uniforms) {
                this.outerAtmosphere.material.uniforms.atmosphereDensity.value = opacity;
            } else {
                this.outerAtmosphere.material.opacity = opacity * 0.1;
            }
        }
        
        this.cloudLayers.forEach((layer, i) => {
            layer.material.opacity = opacity * (0.2 - i * 0.05);
        });
    }
    
    /**
     * Set wind speed for atmospheric dynamics
     */
    setWindSpeed(speed) {
        this.windSpeed = speed;
        this.uniforms.windSpeed.value = speed;
        
        // Update cloud rotation speeds
        this.cloudLayers.forEach((layer, i) => {
            layer.userData.rotationSpeed = speed * (1 + i * 0.2);
        });
    }
    
    /**
     * Add a new storm system
     */
    addStorm(latitude, longitude, intensity = 0.5) {
        const stormGeometry = new THREE.SphereGeometry(
            URANUS_RADIUS * 0.05,
            16, 16
        );
        
        const stormMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: intensity,
            blending: THREE.AdditiveBlending
        });
        
        const storm = new THREE.Mesh(stormGeometry, stormMaterial);
        
        const r = this.config.cloudRadius;
        storm.position.set(
            r * Math.sin(latitude) * Math.cos(longitude),
            r * Math.cos(latitude),
            r * Math.sin(latitude) * Math.sin(longitude)
        );
        
        storm.userData = {
            theta: longitude,
            phi: latitude,
            speed: 0.002 + Math.random() * 0.003,
            intensity: intensity
        };
        
        storm.name = `Storm${this.storms.length}`;
        this.storms.push(storm);
        this.group.add(storm);
        
        return storm;
    }
    
    /**
     * Remove a storm system
     */
    removeStorm(storm) {
        const index = this.storms.indexOf(storm);
        if (index > -1) {
            this.storms.splice(index, 1);
            this.group.remove(storm);
            storm.geometry.dispose();
            storm.material.dispose();
        }
    }
    
    /**
     * Debug logging
     */
    log(message) {
        if (this.config.debug) {
            console.log(`[Atmosphere] ${message}`);
        }
    }
    
    /**
     * Test atmosphere components
     */
    test() {
        const tests = {
            hasGroup: !!this.group,
            hasInnerAtmosphere: !!this.innerAtmosphere,
            hasOuterAtmosphere: !!this.outerAtmosphere,
            hasCloudLayers: this.cloudLayers.length > 0,
            hasMethaneLayer: !!this.methaneLayer,
            hasHaze: !!this.haze,
            hasStorms: this.storms.length > 0
        };
        
        console.log('[Atmosphere Test Results]:', tests);
        return Object.values(tests).filter(t => t).length >= 5;
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
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
            
            // Remove from parent
            if (this.group.parent) {
                this.group.parent.remove(this.group);
            }
            
            // Clear arrays
            this.cloudLayers = [];
            this.storms = [];
            
            // Clear references
            this.group = null;
            this.innerAtmosphere = null;
            this.outerAtmosphere = null;
            this.methaneLayer = null;
            this.haze = null;
        }
    }
}
