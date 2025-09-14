/**
 * Magnetosphere - Uranus's tilted and offset magnetic field visualization
 */

import { MAGNETOSPHERE_CONFIG, URANUS_TILT, URANUS_RADIUS } from '../config/constants.js';

export default class Magnetosphere {
    constructor(scene) {
        this.scene = scene;
        this.group = null;
        this.fieldLines = [];
        this.tail = null;
        this.aurorae = null;
        this.animationTime = 0;
    }
    
    /**
     * Create magnetosphere and add to scene
     */
    create() {
        this.group = new THREE.Group();
        this.group.name = 'Magnetosphere';
        
        // Create magnetic field lines
        this.createFieldLines();
        
        // Create magnetotail
        this.createMagnetotail();
        
        // Create auroral ovals
        this.createAurorae();
        
        // Apply Uranus's magnetic field tilt (offset from rotation axis)
        this.group.rotation.x = MAGNETOSPHERE_CONFIG.tiltAngle;
        this.group.rotation.z = URANUS_TILT;
        
        // Apply offset from planet center
        this.group.position.y = -URANUS_RADIUS * MAGNETOSPHERE_CONFIG.offsetDistance;
        
        // Initially hidden
        this.group.visible = false;
        
        this.scene.add(this.group);
    }
    
    /**
     * Create magnetic field lines
     */
    createFieldLines() {
        const fieldLineCount = MAGNETOSPHERE_CONFIG.fieldLineCount;
        
        for (let i = 0; i < fieldLineCount; i++) {
            // Create torus for each field line
            const geometry = new THREE.TorusGeometry(
                30, // Major radius
                0.2, // Tube radius
                8,   // Radial segments
                100  // Tubular segments
            );
            
            const material = new THREE.MeshBasicMaterial({
                color: MAGNETOSPHERE_CONFIG.color,
                transparent: true,
                opacity: MAGNETOSPHERE_CONFIG.opacity,
                wireframe: true,
                blending: THREE.AdditiveBlending
            });
            
            const fieldLine = new THREE.Mesh(geometry, material);
            
            // Rotate and scale for variety
            fieldLine.rotation.y = (i * Math.PI) / (fieldLineCount / 2);
            fieldLine.rotation.x = Math.PI / 2;
            fieldLine.scale.y = 1.5 + Math.sin(i) * 0.3;
            
            this.fieldLines.push(fieldLine);
            this.group.add(fieldLine);
        }
        
        // Add inner field lines
        this.createInnerField();
    }
    
    /**
     * Create inner magnetic field
     */
    createInnerField() {
        // Create smaller, denser field lines near the planet
        for (let i = 0; i < 3; i++) {
            const geometry = new THREE.TorusGeometry(
                15 + i * 3, // Varying radii
                0.15,
                6,
                60
            );
            
            const material = new THREE.MeshBasicMaterial({
                color: MAGNETOSPHERE_CONFIG.color,
                transparent: true,
                opacity: MAGNETOSPHERE_CONFIG.opacity * 0.7,
                wireframe: true,
                blending: THREE.AdditiveBlending
            });
            
            const innerField = new THREE.Mesh(geometry, material);
            innerField.rotation.x = Math.PI / 2;
            innerField.rotation.z = i * 0.2;
            
            this.fieldLines.push(innerField);
            this.group.add(innerField);
        }
    }
    
    /**
     * Create magnetotail
     */
    createMagnetotail() {
        const tailGeometry = new THREE.ConeGeometry(
            15, // Radius
            MAGNETOSPHERE_CONFIG.tailLength, // Height
            8,  // Radial segments
            1,  // Height segments
            true // Open ended
        );
        
        const tailMaterial = new THREE.MeshBasicMaterial({
            color: MAGNETOSPHERE_CONFIG.color,
            transparent: true,
            opacity: MAGNETOSPHERE_CONFIG.opacity * 0.5,
            wireframe: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        this.tail = new THREE.Mesh(tailGeometry, tailMaterial);
        this.tail.position.x = -30; // Position behind planet
        this.tail.rotation.z = Math.PI / 2; // Point away from sun
        
        this.group.add(this.tail);
        
        // Add tail field lines
        this.createTailFieldLines();
    }
    
    /**
     * Create field lines in the magnetotail
     */
    createTailFieldLines() {
        const lineCount = 4;
        
        for (let i = 0; i < lineCount; i++) {
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(-20, 5 * Math.sin(i), 5 * Math.cos(i)),
                new THREE.Vector3(-40, 10 * Math.sin(i), 10 * Math.cos(i)),
                new THREE.Vector3(-60, 8 * Math.sin(i), 8 * Math.cos(i))
            ]);
            
            const geometry = new THREE.TubeGeometry(curve, 20, 0.1, 8, false);
            
            const material = new THREE.MeshBasicMaterial({
                color: MAGNETOSPHERE_CONFIG.color,
                transparent: true,
                opacity: MAGNETOSPHERE_CONFIG.opacity * 0.3,
                blending: THREE.AdditiveBlending
            });
            
            const tailLine = new THREE.Mesh(geometry, material);
            this.group.add(tailLine);
        }
    }
    
    /**
     * Create auroral ovals
     */
    createAurorae() {
        // Northern aurora
        const northAurora = this.createAuroralOval(URANUS_RADIUS * 1.05, true);
        northAurora.position.y = URANUS_RADIUS * 0.7;
        this.group.add(northAurora);
        
        // Southern aurora
        const southAurora = this.createAuroralOval(URANUS_RADIUS * 1.05, false);
        southAurora.position.y = -URANUS_RADIUS * 0.7;
        this.group.add(southAurora);
        
        this.aurorae = { north: northAurora, south: southAurora };
    }
    
    /**
     * Create individual auroral oval
     */
    createAuroralOval(radius, isNorth) {
        const geometry = new THREE.RingGeometry(
            radius * 0.7,
            radius,
            32,
            1
        );
        
        // Custom shader for aurora effect
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
        aurora.rotation.x = -Math.PI / 2;
        
        return aurora;
    }
    
    /**
     * Update magnetosphere animation
     */
    update(deltaTime, uranusRotation) {
        if (!this.group || !this.group.visible) return;
        
        this.animationTime += deltaTime;
        
        // Rotate magnetosphere with planet (it's tied to the interior)
        this.group.rotation.y = uranusRotation;
        
        // Animate field lines
        this.animateFieldLines();
        
        // Animate aurorae
        this.animateAurorae();
        
        // Animate tail
        this.animateTail();
    }
    
    /**
     * Animate field lines
     */
    animateFieldLines() {
        this.fieldLines.forEach((line, index) => {
            // Subtle pulsing effect
            const scale = 1 + Math.sin(this.animationTime * 0.5 + index) * 0.05;
            line.scale.x = scale;
            line.scale.z = scale;
            
            // Rotate some field lines slowly
            if (index % 2 === 0) {
                line.rotation.y += 0.001;
            }
        });
    }
    
    /**
     * Animate auroral ovals
     */
    animateAurorae() {
        if (this.aurorae) {
            // Update shader time uniform
            if (this.aurorae.north && this.aurorae.north.material.uniforms) {
                this.aurorae.north.material.uniforms.time.value = this.animationTime;
            }
            if (this.aurorae.south && this.aurorae.south.material.uniforms) {
                this.aurorae.south.material.uniforms.time.value = this.animationTime;
            }
            
            // Subtle rotation
            this.aurorae.north.rotation.z += 0.0005;
            this.aurorae.south.rotation.z -= 0.0005;
        }
    }
    
    /**
     * Animate magnetotail
     */
    animateTail() {
        if (this.tail) {
            // Subtle swaying motion
            this.tail.rotation.x = Math.sin(this.animationTime * 0.3) * 0.1;
            this.tail.rotation.y = Math.cos(this.animationTime * 0.2) * 0.05;
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
        this.fieldLines.forEach(line => {
            if (line.material) {
                line.material.opacity = opacity * MAGNETOSPHERE_CONFIG.opacity;
            }
        });
        
        if (this.tail && this.tail.material) {
            this.tail.material.opacity = opacity * MAGNETOSPHERE_CONFIG.opacity * 0.5;
        }
        
        if (this.aurorae) {
            if (this.aurorae.north && this.aurorae.north.material.uniforms) {
                this.aurorae.north.material.uniforms.opacity.value = opacity * 0.3;
            }
            if (this.aurorae.south && this.aurorae.south.material.uniforms) {
                this.aurorae.south.material.uniforms.opacity.value = opacity * 0.3;
            }
        }
    }
    
    /**
     * Set color
     */
    setColor(color) {
        const threeColor = new THREE.Color(color);
        
        this.fieldLines.forEach(line => {
            if (line.material) {
                line.material.color = threeColor;
            }
        });
        
        if (this.tail && this.tail.material) {
            this.tail.material.color = threeColor;
        }
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
        if (this.group) {
            // Dispose field lines
            this.fieldLines.forEach(line => {
                line.geometry.dispose();
                line.material.dispose();
            });
            
            // Dispose tail
            if (this.tail) {
                this.tail.geometry.dispose();
                this.tail.material.dispose();
            }
            
            // Dispose aurorae
            if (this.aurorae) {
                if (this.aurorae.north) {
                    this.aurorae.north.geometry.dispose();
                    this.aurorae.north.material.dispose();
                }
                if (this.aurorae.south) {
                    this.aurorae.south.geometry.dispose();
                    this.aurorae.south.material.dispose();
                }
            }
            
            // Remove from scene
            if (this.scene && this.group.parent) {
                this.scene.remove(this.group);
            }
            
            // Clear references
            this.fieldLines = [];
            this.tail = null;
            this.aurorae = null;
            this.group = null;
        }
    }
}
