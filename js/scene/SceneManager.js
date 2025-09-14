/**
 * SceneManager - Handles Three.js scene setup, lighting, and rendering
 */

import { SCENE_CONFIG, CAMERA_CONFIG, COLORS } from '../config/constants.js';
import { PerformanceSettings, QualityPresets } from '../config/settings.js';

export default class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.lights = {};
        this.currentQuality = PerformanceSettings.currentQuality;
    }
    
    /**
     * Initialize the Three.js scene
     */
    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.setupLighting();
        this.setupFog();
        
        // Apply initial quality settings
        this.applyQualitySettings(this.currentQuality);
    }
    
    /**
     * Create the scene
     */
    createScene() {
        this.scene = new THREE.Scene();
    }
    
    /**
     * Create the camera
     */
    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            CAMERA_CONFIG.fov,
            window.innerWidth / window.innerHeight,
            CAMERA_CONFIG.near,
            CAMERA_CONFIG.far
        );
        
        // Set initial position
        this.camera.position.set(
            CAMERA_CONFIG.initialRadius,
            CAMERA_CONFIG.initialRadius * 0.5,
            CAMERA_CONFIG.initialRadius
        );
        
        this.camera.lookAt(0, 0, 0);
    }
    
    /**
     * Create the renderer
     */
    createRenderer() {
        const quality = QualityPresets[this.currentQuality];
        
        this.renderer = new THREE.WebGLRenderer({
            antialias: quality.antialias,
            logarithmicDepthBuffer: true,
            powerPreference: "high-performance",
            alpha: false,
            stencil: false,
            depth: true
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Shadow settings
        this.renderer.shadowMap.enabled = quality.shadowsEnabled;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;
        
        // Tone mapping for better colors
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        // Output encoding
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
        // Sort objects for proper transparency
        this.renderer.sortObjects = true;
    }
    
    /**
     * Setup scene lighting
     */
    setupLighting() {
        // Ambient light for overall visibility
        this.lights.ambient = new THREE.AmbientLight(0x1a1a3a, 0.5);
        this.scene.add(this.lights.ambient);
        
        // Main sun light (directional)
        this.lights.sun = new THREE.DirectionalLight(0xffffff, 1.8);
        this.lights.sun.position.set(200, 100, 200);
        this.lights.sun.castShadow = true;
        
        // Configure shadow properties
        const quality = QualityPresets[this.currentQuality];
        this.lights.sun.shadow.mapSize.width = quality.shadowMapSize;
        this.lights.sun.shadow.mapSize.height = quality.shadowMapSize;
        this.lights.sun.shadow.camera.near = 10;
        this.lights.sun.shadow.camera.far = 500;
        this.lights.sun.shadow.camera.left = -100;
        this.lights.sun.shadow.camera.right = 100;
        this.lights.sun.shadow.camera.top = 100;
        this.lights.sun.shadow.camera.bottom = -100;
        this.lights.sun.shadow.bias = -0.001;
        this.lights.sun.shadow.normalBias = 0.01;
        
        this.scene.add(this.lights.sun);
        
        // Ring illumination lights
        this.lights.ringLight1 = new THREE.DirectionalLight(0xffffff, 0.6);
        this.lights.ringLight1.position.set(0, -100, 50);
        this.scene.add(this.lights.ringLight1);
        
        this.lights.ringLight2 = new THREE.DirectionalLight(0x8090ff, 0.4);
        this.lights.ringLight2.position.set(-100, 50, -50);
        this.scene.add(this.lights.ringLight2);
        
        // Rim light for atmospheric effect
        this.lights.rimLight = new THREE.PointLight(COLORS.uranus.main, 0.5, 300);
        this.lights.rimLight.position.set(-50, 0, -50);
        this.scene.add(this.lights.rimLight);
        
        // Hemisphere light for natural lighting
        this.lights.hemisphere = new THREE.HemisphereLight(0x4080ff, 0x002040, 0.4);
        this.scene.add(this.lights.hemisphere);
        
        // Optional: Add a subtle backlight for depth
        this.lights.backLight = new THREE.DirectionalLight(0x304060, 0.3);
        this.lights.backLight.position.set(-100, -50, -100);
        this.scene.add(this.lights.backLight);
    }
    
    /**
     * Setup fog for depth
     */
    setupFog() {
        this.scene.fog = new THREE.FogExp2(COLORS.space.fog, SCENE_CONFIG.fogDensity);
    }
    
    /**
     * Apply quality settings
     */
    applyQualitySettings(qualityLevel) {
        const quality = QualityPresets[qualityLevel];
        
        if (!quality) {
            console.warn(`Unknown quality level: ${qualityLevel}`);
            return;
        }
        
        this.currentQuality = qualityLevel;
        PerformanceSettings.currentQuality = qualityLevel;
        
        // Update renderer settings
        if (this.renderer) {
            this.renderer.shadowMap.enabled = quality.shadowsEnabled;
            
            // Update shadow map size
            if (this.lights.sun) {
                this.lights.sun.shadow.mapSize.width = quality.shadowMapSize;
                this.lights.sun.shadow.mapSize.height = quality.shadowMapSize;
                this.lights.sun.castShadow = quality.shadowsEnabled;
            }
            
            // Force shadow map update
            if (this.renderer.shadowMap) {
                this.renderer.shadowMap.needsUpdate = true;
            }
        }
        
        console.log(`Quality settings applied: ${qualityLevel}`);
    }
    
    /**
     * Update lighting based on camera position (optional dynamic lighting)
     */
    updateLighting(cameraPosition) {
        // Optionally adjust rim light position based on camera
        if (this.lights.rimLight) {
            const offset = new THREE.Vector3(-50, 0, -50);
            offset.applyQuaternion(this.camera.quaternion);
            this.lights.rimLight.position.copy(cameraPosition).add(offset);
        }
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Update camera
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Update renderer
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
    
    /**
     * Render the scene
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Get scene reference
     */
    getScene() {
        return this.scene;
    }
    
    /**
     * Get camera reference
     */
    getCamera() {
        return this.camera;
    }
    
    /**
     * Get renderer reference
     */
    getRenderer() {
        return this.renderer;
    }
    
    /**
     * Get lights object
     */
    getLights() {
        return this.lights;
    }
    
    /**
     * Set background color
     */
    setBackground(color) {
        this.scene.background = new THREE.Color(color);
    }
    
    /**
     * Set fog density
     */
    setFogDensity(density) {
        if (this.scene.fog) {
            this.scene.fog.density = density;
        }
    }
    
    /**
     * Enable/disable shadows
     */
    setShadows(enabled) {
        this.renderer.shadowMap.enabled = enabled;
        this.lights.sun.castShadow = enabled;
        
        if (this.renderer.shadowMap) {
            this.renderer.shadowMap.needsUpdate = true;
        }
    }
    
    /**
     * Add object to scene
     */
    add(object) {
        this.scene.add(object);
    }
    
    /**
     * Remove object from scene
     */
    remove(object) {
        this.scene.remove(object);
    }
    
    /**
     * Clear the scene
     */
    clear() {
        while (this.scene.children.length > 0) {
            const child = this.scene.children[0];
            this.scene.remove(child);
            
            // Dispose geometry and materials
            if (child.geometry) {
                child.geometry.dispose();
            }
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
    }
    
    /**
     * Dispose of resources
     */
    dispose() {
        // Clear the scene
        this.clear();
        
        // Dispose renderer
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.forceContextLoss();
            this.renderer.context = null;
            this.renderer.domElement = null;
            this.renderer = null;
        }
        
        // Clear references
        this.scene = null;
        this.camera = null;
        this.lights = {};
    }
    
    /**
     * Get renderer info for debugging
     */
    getInfo() {
        if (this.renderer) {
            return this.renderer.info;
        }
        return null;
    }
    
    /**
     * Take a screenshot
     */
    takeScreenshot() {
        if (this.renderer) {
            this.render();
            return this.renderer.domElement.toDataURL('image/png');
        }
        return null;
    }
}
