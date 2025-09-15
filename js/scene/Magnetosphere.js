/**
 * Magnetosphere - Fixed and working Uranus magnetosphere visualization
 * Simplified for compatibility with Three.js r128
 */

import { MAGNETOSPHERE_CONFIG, URANUS_TILT, URANUS_RADIUS } from '../config/constants.js';

export default class Magnetosphere {
    constructor(scene) {
        this.scene = scene;
        this.group = null;
        this.fieldLines = [];
        this.radiationBelts = { inner: null, outer: null };
        this.tail = null;
        this.aurorae = { north: null, south: null };
        this.animationTime = 0;
        this.rotationPhase = 0;
        this.debug = true;
        this.useShaders = true;
    }
    
    /**
     * Create magnetosphere and add to scene
     */
    create() {
        try {
            this.log('Creating magnetosphere...');
            
            this.group = new THREE.Group();
            this.group.name = 'Magnetosphere';
            
            // Create components with error handling
            this.createFieldLines();
            this.createRadiationBelts();
            this.createMagnetotail();
            this.createAurorae();
            
            // Apply magnetic geometry
            this.applyMagneticGeometry();
            
            // Initially hidden
            this.group.visible = false;
            
            this.scene.add(this.group);
            this.log('Magnetosphere created successfully');
            
        } catch (error) {
            console.error('Failed to create magnetosphere:', error);
            this.createFallbackMagnetosphere();
        }
    }
    
    /**
     * Create magnetic field lines - simplified version
     */
    createFieldLines() {
        try {
            const fieldLineCount = 8; // Reduced for performance
            
            for (let i = 0; i < fieldLineCount; i++) {
                // Create torus for each field line
                const geometry = new THREE.TorusGeometry(
                    20 + i * 3, // Major radius
                    0.3, // Tube radius  
                    8,   // Radial segments
                    64   // Tubular segments
                );
                
                const material = new THREE.MeshBasicMaterial({
                    color: MAGNETOSPHERE_CONFIG.color || 0xff6b9d,
                    transparent: true,
                    opacity: (MAGNETOSPHERE_CONFIG.opacity || 0.2) * 0.8,
                    wireframe: true
                });
                
                const fieldLine = new THREE.Mesh(geometry, material);
                
                // Rotate for variety
                fieldLine.rotation.y = (i * Math.PI) / (fieldLineCount / 2);
                fieldLine.rotation.x = Math.PI / 2;
                fieldLine.scale.y = 1.5 + Math.sin(i) * 0.3;
                
                this.fieldLines.push(fieldLine);
                this.group.add(fieldLine);
            }
            
            this.log('Field lines created');
            
        } catch (error) {
            console.warn('Could not create field lines:', error);
        }
    }
    
    /**
     * Create simplified radiation belts
     */
    createRadiationBelts() {
        try {
            // Inner radiation belt (simplified torus)
            const innerGeometry = new THREE.TorusGeometry(
                2.25 * URANUS_RADIUS,
                0.75 * URANUS_RADIUS,
                16, 32
            );
            
            const innerMaterial = new THREE.MeshPhongMaterial({
                color: 0xff6030,
                transparent: true,
                opacity: 0.15,
                emissive: 0xff3010,
                emissiveIntensity: 0.2,
                side: THREE.DoubleSide
            });
            
            this.radiationBelts.inner = new THREE.Mesh(innerGeometry, innerMaterial);
            this.radiationBelts.inner.rotation.x = Math.PI / 2;
            this.radiationBelts.inner.name = 'InnerRadiationBelt';
            
            // Outer radiation belt
            const outerGeometry = new THREE.TorusGeometry(
                5.5 * URANUS_RADIUS,
                2.5 * URANUS_RADIUS,
                16, 32
            );
            
            const outerMaterial = new THREE.MeshPhongMaterial({
                color: 0x3080ff,
                transparent: true,
                opacity: 0.1,
                emissive: 0x1040ff,
                emissiveIntensity: 0.15,
                side: THREE.DoubleSide
            });
            
            this.radiationBelts.outer = new THREE.Mesh(outerGeometry, outerMaterial);
            this.radiationBelts.outer.rotation.x = Math.PI / 2;
            this.radiationBelts.outer.name = 'OuterRadiationBelt';
            
            this.group.add(this.radiationBelts.inner);
            this.group.add(this.radiationBelts.outer);
            
            this.log('Radiation belts created');
            
        } catch (error) {
            console.warn('Could not create radiation belts:', error);
        }
    }
    
    /**
     * Create simplified magnetotail
     */
    createMagnetotail() {
        try {
            // Use a simple cone for the tail
            const tailGeometry = new THREE.ConeGeometry(
                15, // Radius
                60, // Height (tail length)
                8,  // Radial segments
                1,  // Height segments
                true // Open ended
            );
            
            const tailMaterial = new THREE.MeshBasicMaterial({
                color: MAGNETOSPHERE_CONFIG.color || 0xff6b9d,
                transparent: true,
                opacity: (MAGNETOSPHERE_CONFIG.opacity || 0.2) * 0.5,
                wireframe: true,
                side: THREE.DoubleSide
            });
            
            this.tail = new THREE.Mesh(tailGeometry, tailMaterial);
            this.tail.position.x = -30;
            this.tail.rotation.z = Math.PI / 2;
            this.tail.name = 'Magnetotail';
            
            this.group.add(this.tail);
            
            // Add simple tail field lines
            this.createSimpleTailLines();
            
            this.log('Magnetotail created');
            
        } catch (error) {
            console.warn('Could not create magnetotail:', error);
        }
    }
    
    /**
     * Create simple tail field lines
     */
    createSimpleTailLines() {
        try {
            for (let i = 0; i < 4; i++) {
                // Create simple curve for tail lines
                const points = [];
                for (let j = 0; j <= 20; j++) {
                    const t = j / 20;
                    const x = -t * 60;
                    const y = Math.sin(i * Math.PI / 2) * (10 + t * 5);
                    const z = Math.cos(i * Math.PI / 2) * (10 + t * 5);
                    points.push(new THREE.Vector3(x, y, z));
                }
                
                const curve = new THREE.CatmullRomCurve3(points);
                const geometry = new THREE.TubeGeometry(curve, 20, 0.2, 4, false);
                
                const material = new THREE.MeshBasicMaterial({
                    color: MAGNETOSPHERE_CONFIG.color || 0xff6b9d,
                    transparent: true,
                    opacity: (MAGNETOSPHERE_CONFIG.opacity || 0.2) * 0.3
                });
                
                const tailLine = new THREE.Mesh(geometry, material);
                this.group.add(tailLine);
            }
        } catch (error) {
            console.warn('Could not create tail lines:', error);
        }
    }
    
    /**
     * Create auroral ovals with fallback
     */
    createAurorae() {
        try {
            // Try shader-based aurorae first
            if (this.useShaders) {
                this.createShaderAurorae();
            } else {
                this.createSimpleAurorae();
            }
        } catch (error) {
            console.warn('Shader aurorae failed, using simple:', error);
            this.useShaders = false;
            this.createSimpleAurorae();
        }
    }
    
    /**
     * Create shader-based aurorae
     */
    createShaderAurorae() {
        const createAuroralOval = (yPosition, isNorth) => {
            const geometry = new THREE.RingGeometry(
                URANUS_RADIUS * 0.7,
                URANUS_RADIUS * 1.0,
                32, 8
            );
            
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    color1: { value: new THREE.Color(0x00ff88) },
                    color2: { value: new THREE.Color(0xff00ff) },
                    opacity: { value: 0.3 }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 color1;
                    uniform vec3 color2;
                    uniform float opacity;
                    varying vec2 vUv;
                    
                    void main() {
                        float pulse = sin(time * 2.0 + vUv.x * 10.0) * 0.5 + 0.5;
                        vec3 color = mix(color1, color2, pulse);
                        float alpha = opacity * (0.5 + pulse * 0.5);
                        gl_FragColor = vec4(color, alpha);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            
            const aurora = new THREE.Mesh(geometry, material);
            aurora.position.y = yPosition;
            aurora.rotation.x = -Math.PI / 2;
            aurora.name = isNorth ? 'AuroraNorth' : 'AuroraSouth';
            
            return aurora;
        };
        
        this.aurorae.north = createAuroralOval(URANUS_RADIUS * 0.7, true);
        this.aurorae.south = createAuroralOval(-URANUS_RADIUS * 0.7, false);
        
        this.group.add(this.aurorae.north);
        this.group.add(this.aurorae.south);
        
        this.log('Shader aurorae created');
    }
    
    /**
     * Create simple fallback aurorae
     */
    createSimpleAurorae() {
        try {
            const createSimpleAurora = (yPosition, isNorth) => {
                const geometry = new THREE.RingGeometry(
                    URANUS_RADIUS * 0.7,
                    URANUS_RADIUS * 1.0,
                    16, 4
                );
                
                const material = new THREE.MeshBasicMaterial({
                    color: isNorth ? 0x00ff88 : 0xff00ff,
                    transparent: true,
                    opacity: 0.2,
                    side: THREE.DoubleSide
                });
                
                const aurora = new THREE.Mesh(geometry, material);
                aurora.position.y = yPosition;
                aurora.rotation.x = -Math.PI / 2;
                aurora.name = isNorth ? 'SimpleAuroraNorth' : 'SimpleAuroraSouth';
                
                return aurora;
            };
            
            this.aurorae.north = createSimpleAurora(URANUS_RADIUS * 0.7, true);
            this.aurorae.south = createSimpleAurora(-URANUS_RADIUS * 0.7, false);
            
            this.group.add(this.aurorae.north);
            this.group.add(this.aurorae.south);
            
            this.log('Simple aurorae created');
            
        } catch (error) {
            console.warn('Could not create aurorae:', error);
        }
    }
    
    /**
     * Apply magnetic geometry
     */
    applyMagneticGeometry() {
        try {
            // Apply magnetic field tilt (60° from rotation axis)
            this.group.rotation.x = MAGNETOSPHERE_CONFIG.tiltAngle || (58.6 * Math.PI / 180);
            
            // Apply Uranus's extreme axial tilt
            this.group.rotation.z = URANUS_TILT;
            
            // Offset from center (31% of radius)
            this.group.position.y = -URANUS_RADIUS * (MAGNETOSPHERE_CONFIG.offsetDistance || 0.31);
            
        } catch (error) {
            console.warn('Could not apply magnetic geometry:', error);
        }
    }
    
    /**
     * Create minimal fallback magnetosphere
     */
    createFallbackMagnetosphere() {
        try {
            console.warn('Creating fallback magnetosphere');
            
            this.group = new THREE.Group();
            
            // Just create a simple wireframe sphere
            const geometry = new THREE.SphereGeometry(30, 8, 8);
            const material = new THREE.MeshBasicMaterial({
                color: 0xff6b9d,
                transparent: true,
                opacity: 0.1,
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
     * Update magnetosphere animation
     */
    update(deltaTime, uranusRotation) {
        if (!this.group || !this.group.visible) return;
        
        try {
            this.animationTime += deltaTime;
            this.rotationPhase = uranusRotation;
            
            // Rotate magnetosphere with planet
            this.group.rotation.y = uranusRotation;
            
            // Animate field lines
            this.animateFieldLines(deltaTime);
            
            // Animate aurorae
            this.animateAurorae(deltaTime);
            
            // Animate tail
            this.animateTail(deltaTime);
            
            // Animate radiation belts
            this.animateRadiationBelts(deltaTime);
            
        } catch (error) {
            console.error('Error updating magnetosphere:', error);
        }
    }
    
    /**
     * Animate field lines
     */
    animateFieldLines(deltaTime) {
        try {
            this.fieldLines.forEach((line, index) => {
                // Subtle pulsing
                const scale = 1 + Math.sin(this.animationTime * 0.5 + index) * 0.05;
                line.scale.x = scale;
                line.scale.z = scale;
                
                // Slow rotation
                if (index % 2 === 0) {
                    line.rotation.y += deltaTime * 0.05;
                }
            });
        } catch (error) {
            // Silent fail for animation
        }
    }
    
    /**
     * Animate aurorae
     */
    animateAurorae(deltaTime) {
        try {
            // Update shader uniforms if using shaders
            if (this.useShaders) {
                if (this.aurorae.north && this.aurorae.north.material.uniforms) {
                    this.aurorae.north.material.uniforms.time.value = this.animationTime;
                }
                if (this.aurorae.south && this.aurorae.south.material.uniforms) {
                    this.aurorae.south.material.uniforms.time.value = this.animationTime;
                }
            }
            
            // Subtle rotation
            if (this.aurorae.north) {
                this.aurorae.north.rotation.z += deltaTime * 0.03;
            }
            if (this.aurorae.south) {
                this.aurorae.south.rotation.z -= deltaTime * 0.03;
            }
            
        } catch (error) {
            // Silent fail for animation
        }
    }
    
    /**
     * Animate magnetotail
     */
    animateTail(deltaTime) {
        try {
            if (this.tail) {
                // Subtle swaying motion
                this.tail.rotation.x = Math.sin(this.animationTime * 0.3) * 0.1;
                this.tail.rotation.y = Math.cos(this.animationTime * 0.2) * 0.05;
            }
        } catch (error) {
            // Silent fail for animation
        }
    }
    
    /**
     * Animate radiation belts
     */
    animateRadiationBelts(deltaTime) {
        try {
            // Rotate radiation belts at different speeds
            if (this.radiationBelts.inner) {
                this.radiationBelts.inner.rotation.z += deltaTime * 0.02;
                
                // Pulsing opacity
                const innerOpacity = 0.15 + Math.sin(this.animationTime) * 0.05;
                this.radiationBelts.inner.material.opacity = innerOpacity;
            }
            
            if (this.radiationBelts.outer) {
                this.radiationBelts.outer.rotation.z -= deltaTime * 0.01;
                
                // Pulsing opacity
                const outerOpacity = 0.1 + Math.sin(this.animationTime * 0.8) * 0.03;
                this.radiationBelts.outer.material.opacity = outerOpacity;
            }
        } catch (error) {
            // Silent fail for animation
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
     * Set opacity
     */
    setOpacity(opacity) {
        try {
            // Update field lines
            this.fieldLines.forEach(line => {
                if (line.material) {
                    line.material.opacity = opacity * (MAGNETOSPHERE_CONFIG.opacity || 0.2);
                }
            });
            
            // Update tail
            if (this.tail && this.tail.material) {
                this.tail.material.opacity = opacity * (MAGNETOSPHERE_CONFIG.opacity || 0.2) * 0.5;
            }
            
            // Update radiation belts
            if (this.radiationBelts.inner && this.radiationBelts.inner.material) {
                this.radiationBelts.inner.material.opacity = opacity * 0.15;
            }
            if (this.radiationBelts.outer && this.radiationBelts.outer.material) {
                this.radiationBelts.outer.material.opacity = opacity * 0.1;
            }
            
            // Update aurorae
            if (this.useShaders) {
                if (this.aurorae.north && this.aurorae.north.material.uniforms) {
                    this.aurorae.north.material.uniforms.opacity.value = opacity * 0.3;
                }
                if (this.aurorae.south && this.aurorae.south.material.uniforms) {
                    this.aurorae.south.material.uniforms.opacity.value = opacity * 0.3;
                }
            } else {
                if (this.aurorae.north && this.aurorae.north.material) {
                    this.aurorae.north.material.opacity = opacity * 0.2;
                }
                if (this.aurorae.south && this.aurorae.south.material) {
                    this.aurorae.south.material.opacity = opacity * 0.2;
                }
            }
        } catch (error) {
            console.warn('Could not set opacity:', error);
        }
    }
    
    /**
     * Debug logging
     */
    log(message) {
        if (this.debug) {
            console.log(`[Magnetosphere] ${message}`);
        }
    }
    
    /**
     * Test magnetosphere components
     */
    test() {
        const tests = {
            hasGroup: !!this.group,
            groupInScene: this.group && this.group.parent === this.scene,
            hasFieldLines: this.fieldLines.length > 0,
            hasRadiationBelts: !!this.radiationBelts.inner || !!this.radiationBelts.outer,
            hasTail: !!this.tail,
            hasAurorae: !!this.aurorae.north || !!this.aurorae.south
        };
        
        console.log('[Magnetosphere Test Results]:', tests);
        return Object.values(tests).filter(t => t).length >= 4; // At least 4 components working
    }
    
    /**
     * Get group
     */
    getGroup() {
        return this.group;
    }
    
    /**
     * Dispose of resources
     */
    dispose() {
        try {
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
                
                // Clear references
                this.group = null;
                this.radiationBelts = { inner: null, outer: null };
                this.tail = null;
                this.aurorae = { north: null, south: null };
            }
        } catch (error) {
            console.error('Error disposing magnetosphere:', error);
        }
    }
}
