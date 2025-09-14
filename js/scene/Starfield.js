/**
 * Starfield - Background stars and deep space objects
 */

import { SCENE_CONFIG, COLORS } from '../config/constants.js';
import { QualityPresets, PerformanceSettings } from '../config/settings.js';

export default class Starfield {
    constructor(scene) {
        this.scene = scene;
        this.stars = null;
        this.nebulae = null;
        this.galaxies = null;
    }
    
    /**
     * Create starfield and add to scene
     */
    create() {
        // Create main star field
        this.createStars();
        
        // Create distant nebulae
        this.createNebulae();
        
        // Create distant galaxies
        this.createGalaxies();
        
        // Create milky way band
        this.createMilkyWay();
    }
    
    /**
     * Create main star field
     */
    createStars() {
        const quality = QualityPresets[PerformanceSettings.currentQuality] || QualityPresets.high;
        const starCount = quality.starCount || SCENE_CONFIG.starCount;
        
        // Create multiple star layers for depth
        const starLayers = [
            { count: starCount * 0.6, size: 0.7, opacity: 0.9, distance: 1000 },
            { count: starCount * 0.3, size: 1.0, opacity: 1.0, distance: 2000 },
            { count: starCount * 0.1, size: 1.5, opacity: 0.8, distance: 3000 }
        ];
        
        this.stars = new THREE.Group();
        this.stars.name = 'Starfield';
        
        starLayers.forEach(layer => {
            const stars = this.createStarLayer(layer);
            this.stars.add(stars);
        });
        
        this.scene.add(this.stars);
    }
    
    /**
     * Create individual star layer
     */
    createStarLayer(config) {
        const { count, size, opacity, distance } = config;
        
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];
        
        for (let i = 0; i < count; i++) {
            // Random position on sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const r = distance + Math.random() * distance * 0.5;
            
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            
            positions.push(x, y, z);
            
            // Star color (white to slightly colored)
            const colorVariation = Math.random();
            let color;
            
            if (colorVariation < 0.6) {
                // White stars (most common)
                color = new THREE.Color(1, 1, 1);
            } else if (colorVariation < 0.75) {
                // Blue stars
                color = new THREE.Color(0.7, 0.8, 1);
            } else if (colorVariation < 0.85) {
                // Yellow stars
                color = new THREE.Color(1, 1, 0.8);
            } else if (colorVariation < 0.95) {
                // Orange stars
                color = new THREE.Color(1, 0.8, 0.6);
            } else {
                // Red stars
                color = new THREE.Color(1, 0.6, 0.6);
            }
            
            colors.push(color.r, color.g, color.b);
            
            // Varying star sizes
            sizes.push(size * (0.5 + Math.random()));
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        
        // Custom shader for better star rendering
        const material = new THREE.ShaderMaterial({
            uniforms: {
                opacity: { value: opacity }
            },
            vertexShader: `
                attribute float size;
                varying vec3 vColor;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float opacity;
                varying vec3 vColor;
                
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5, 0.5));
                    if (dist > 0.5) discard;
                    
                    float alpha = opacity * (1.0 - smoothstep(0.0, 0.5, dist));
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            vertexColors: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        return new THREE.Points(geometry, material);
    }
    
    /**
     * Create nebulae
     */
    createNebulae() {
        this.nebulae = new THREE.Group();
        this.nebulae.name = 'Nebulae';
        
        // Create 3-5 distant nebulae
        const nebulaCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < nebulaCount; i++) {
            const nebula = this.createNebula();
            
            // Random position in far distance
            const angle = (i / nebulaCount) * Math.PI * 2;
            const distance = 2000 + Math.random() * 1000;
            const height = (Math.random() - 0.5) * 1000;
            
            nebula.position.set(
                Math.cos(angle) * distance,
                height,
                Math.sin(angle) * distance
            );
            
            this.nebulae.add(nebula);
        }
        
        this.scene.add(this.nebulae);
    }
    
    /**
     * Create individual nebula
     */
    createNebula() {
        const geometry = new THREE.SphereGeometry(100 + Math.random() * 100, 8, 8);
        
        // Random nebula colors
        const colors = [
            new THREE.Color(0.5, 0.2, 0.8), // Purple
            new THREE.Color(0.2, 0.5, 0.8), // Blue
            new THREE.Color(0.8, 0.2, 0.5), // Pink
            new THREE.Color(0.2, 0.8, 0.5)  // Green
        ];
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.02,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            depthWrite: false
        });
        
        const nebula = new THREE.Mesh(geometry, material);
        nebula.scale.set(
            1 + Math.random() * 2,
            1 + Math.random() * 2,
            1 + Math.random() * 2
        );
        
        return nebula;
    }
    
    /**
     * Create distant galaxies
     */
    createGalaxies() {
        this.galaxies = new THREE.Group();
        this.galaxies.name = 'Galaxies';
        
        // Create a few distant galaxy sprites
        const galaxyCount = 5;
        
        for (let i = 0; i < galaxyCount; i++) {
            const galaxy = this.createGalaxy();
            
            // Very distant positioning
            const angle = Math.random() * Math.PI * 2;
            const elevation = (Math.random() - 0.5) * Math.PI;
            const distance = 3000 + Math.random() * 2000;
            
            galaxy.position.set(
                Math.cos(angle) * Math.cos(elevation) * distance,
                Math.sin(elevation) * distance,
                Math.sin(angle) * Math.cos(elevation) * distance
            );
            
            this.galaxies.add(galaxy);
        }
        
        this.scene.add(this.galaxies);
    }
    
    /**
     * Create individual galaxy
     */
    createGalaxy() {
        // Create simple galaxy sprite
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Draw galaxy shape
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.2, 'rgba(200, 200, 255, 0.5)');
        gradient.addColorStop(0.5, 'rgba(150, 150, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(100, 100, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        // Add some structure
        ctx.save();
        ctx.translate(32, 32);
        ctx.rotate(Math.random() * Math.PI);
        ctx.scale(3, 1);
        
        const gradient2 = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
        gradient2.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient2.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient2;
        ctx.fillRect(-32, -32, 64, 64);
        ctx.restore();
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 0.5 + Math.random() * 0.5
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(50 + Math.random() * 50, 50 + Math.random() * 50, 1);
        
        return sprite;
    }
    
    /**
     * Create Milky Way band
     */
    createMilkyWay() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];
        
        // Create band of stars
        const bandStars = 5000;
        
        for (let i = 0; i < bandStars; i++) {
            // Create band around a great circle
            const angle = Math.random() * Math.PI * 2;
            const spread = (Math.random() - 0.5) * 0.3; // Spread around band
            const distance = 2000 + Math.random() * 1000;
            
            const x = Math.cos(angle) * distance;
            const y = spread * distance;
            const z = Math.sin(angle) * distance;
            
            // Rotate band to make it diagonal
            const rotatedX = x * 0.7 - y * 0.7;
            const rotatedY = x * 0.7 + y * 0.7;
            
            positions.push(rotatedX, rotatedY, z);
            
            // Milky way colors (white to slightly yellow)
            const brightness = 0.5 + Math.random() * 0.5;
            colors.push(brightness, brightness, brightness * 0.9);
            
            // Smaller stars for milky way
            sizes.push(0.3 + Math.random() * 0.3);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                opacity: { value: 0.3 }
            },
            vertexShader: `
                attribute float size;
                varying vec3 vColor;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (200.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float opacity;
                varying vec3 vColor;
                
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5, 0.5));
                    if (dist > 0.5) discard;
                    
                    float alpha = opacity * (1.0 - dist * 2.0);
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            vertexColors: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const milkyWay = new THREE.Points(geometry, material);
        milkyWay.name = 'MilkyWay';
        
        if (this.stars) {
            this.stars.add(milkyWay);
        }
    }
    
    /**
     * Update starfield (optional slow rotation for effect)
     */
    update(deltaTime) {
        // Very slow rotation for subtle movement
        if (this.stars) {
            this.stars.rotation.y += deltaTime * 0.00001;
        }
        
        if (this.nebulae) {
            this.nebulae.rotation.y -= deltaTime * 0.00002;
        }
    }
    
    /**
     * Update quality
     */
    updateQuality(qualityLevel) {
        // Recreate starfield with new quality settings
        this.dispose();
        this.create();
    }
    
    /**
     * Set visibility
     */
    setVisible(visible) {
        if (this.stars) this.stars.visible = visible;
        if (this.nebulae) this.nebulae.visible = visible;
        if (this.galaxies) this.galaxies.visible = visible;
    }
    
    /**
     * Dispose of resources
     */
    dispose() {
        // Dispose stars
        if (this.stars) {
            this.stars.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
            
            if (this.scene && this.stars.parent) {
                this.scene.remove(this.stars);
            }
        }
        
        // Dispose nebulae
        if (this.nebulae) {
            this.nebulae.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            
            if (this.scene && this.nebulae.parent) {
                this.scene.remove(this.nebulae);
            }
        }
        
        // Dispose galaxies
        if (this.galaxies) {
            this.galaxies.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
            
            if (this.scene && this.galaxies.parent) {
                this.scene.remove(this.galaxies);
            }
        }
        
        // Clear references
        this.stars = null;
        this.nebulae = null;
        this.galaxies = null;
    }
}
