/**
 * SceneManager - Enhanced Three.js scene management with UI coordination
 */

import { SCENE_CONFIG, CAMERA_CONFIG, COLORS } from '../config/constants.js';
import { PerformanceSettings, QualityPresets, DisplaySettings } from '../config/settings.js';

export default class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.lights = {};
        this.currentQuality = PerformanceSettings.currentQuality;
        
        // Render layers for organization
        this.layers = {
            default: 0,
            celestialBodies: 1,
            rings: 2,
            moons: 3,
            orbits: 4,
            labels: 5,
            effects: 6,
            ui3D: 7
        };
        
        // Viewport management for UI panels
        this.viewports = {
            main: { x: 0, y: 0, width: 1, height: 1 },
            minimap: null // Could add minimap viewport
        };
        
        // UI overlay coordination
        this.uiOverlays = new Map();
        this.renderCallbacks = [];
        
        // Raycaster for UI-3D interaction
        this.raycaster = new THREE.Raycaster();
        this.raycaster.layers.enableAll();
        
        // Performance stats
        this.stats = {
            drawCalls: 0,
            triangles: 0,
            points: 0,
            lines: 0,
            frameTime: 0
        };
    }
    
    /**
     * Initialize the Three.js scene with UI support
     */
    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.setupLighting();
        this.setupFog();
        this.setupRenderLayers();
        this.setupPostProcessing();
        
        // Apply initial quality settings
        this.applyQualitySettings(this.currentQuality);
        
        // Setup UI coordination
        this.setupUICoordination();
    }
    
    /**
     * Create the scene
     */
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.name = 'MainScene';
        
        // Add scene helpers group for organization
        this.helpersGroup = new THREE.Group();
        this.helpersGroup.name = 'Helpers';
        this.scene.add(this.helpersGroup);
    }
    
    /**
     * Create the camera with layer support
     */
    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            CAMERA_CONFIG.fov,
            window.innerWidth / window.innerHeight,
            CAMERA_CONFIG.near,
            CAMERA_CONFIG.far
        );
        
        // Enable all layers by default
        this.camera.layers.enableAll();
        
        // Set initial position
        this.camera.position.set(
            CAMERA_CONFIG.initialRadius,
            CAMERA_CONFIG.initialRadius * 0.5,
            CAMERA_CONFIG.initialRadius
        );
        
        this.camera.lookAt(0, 0, 0);
    }
    
    /**
     * Create the renderer with enhanced capabilities
     */
    createRenderer() {
        const quality = QualityPresets[this.currentQuality];
        
        this.renderer = new THREE.WebGLRenderer({
            antialias: quality.antialias,
            logarithmicDepthBuffer: true,
            powerPreference: "high-performance",
            alpha: false,
            stencil: true, // Enable for UI effects
            depth: true,
            preserveDrawingBuffer: false // Set true for screenshots
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
        this.renderer.autoClear = false; // Manual clear for layered rendering
    }
    
    /**
     * Setup render layers for better organization
     */
    setupRenderLayers() {
        // Configure raycaster layers
        this.raycaster.layers.set(this.layers.default);
        this.raycaster.layers.enable(this.layers.celestialBodies);
        this.raycaster.layers.enable(this.layers.moons);
        
        // Disable UI layers for raycasting by default
        this.raycaster.layers.disable(this.layers.labels);
        this.raycaster.layers.disable(this.layers.ui3D);
    }
    
    /**
     * Setup post-processing effects (optional)
     */
    setupPostProcessing() {
        // Could add bloom, FXAA, etc. for better visuals
        // For now, keeping it simple for performance
    }
    
    /**
     * Setup UI coordination systems
     */
    setupUICoordination() {
        // Create UI camera for overlays (orthographic)
        this.uiCamera = new THREE.OrthographicCamera(
            -window.innerWidth / 2,
            window.innerWidth / 2,
            window.innerHeight / 2,
            -window.innerHeight / 2,
            1,
            1000
        );
        this.uiCamera.position.z = 100;
        
        // Create UI scene for 2D overlays
        this.uiScene = new THREE.Scene();
        this.uiScene.name = 'UIScene';
        
        // Setup CSS2D/CSS3D renderers for HTML labels if needed
        this.setupCSSRenderers();
    }
    
    /**
     * Setup CSS renderers for HTML labels
     */
    setupCSSRenderers() {
        // CSS2DRenderer for 2D labels that face camera
        if (typeof THREE.CSS2DRenderer !== 'undefined') {
            this.css2DRenderer = new THREE.CSS2DRenderer();
            this.css2DRenderer.setSize(window.innerWidth, window.innerHeight);
            this.css2DRenderer.domElement.style.position = 'absolute';
            this.css2DRenderer.domElement.style.top = '0';
            this.css2DRenderer.domElement.style.pointerEvents = 'none';
            document.getElementById('canvas-container')?.appendChild(this.css2DRenderer.domElement);
        }
    }
    
    /**
     * Setup scene lighting with UI consideration
     */
    setupLighting() {
        // Ambient light for overall visibility
        this.lights.ambient = new THREE.AmbientLight(0x1a1a3a, 0.5);
        this.lights.ambient.layers.enableAll();
        this.scene.add(this.lights.ambient);
        
        // Main sun light (directional)
        this.lights.sun = new THREE.DirectionalLight(0xffffff, 1.8);
        this.lights.sun.position.set(200, 100, 200);
        this.lights.sun.castShadow = true;
        this.lights.sun.layers.enable(this.layers.default);
        this.lights.sun.layers.enable(this.layers.celestialBodies);
        this.lights.sun.layers.enable(this.layers.moons);
        
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
        this.lights.ringLight1.layers.enable(this.layers.rings);
        this.scene.add(this.lights.ringLight1);
        
        this.lights.ringLight2 = new THREE.DirectionalLight(0x8090ff, 0.4);
        this.lights.ringLight2.position.set(-100, 50, -50);
        this.lights.ringLight2.layers.enable(this.layers.rings);
        this.scene.add(this.lights.ringLight2);
        
        // Rim light for atmospheric effect
        this.lights.rimLight = new THREE.PointLight(COLORS.uranus.main, 0.5, 300);
        this.lights.rimLight.position.set(-50, 0, -50);
        this.lights.rimLight.layers.enableAll();
        this.scene.add(this.lights.rimLight);
        
        // Hemisphere light for natural lighting
        this.lights.hemisphere = new THREE.HemisphereLight(0x4080ff, 0x002040, 0.4);
        this.lights.hemisphere.layers.enableAll();
        this.scene.add(this.lights.hemisphere);
        
        // UI light (no shadows, just visibility)
        this.lights.uiLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.lights.uiLight.layers.set(this.layers.ui3D);
        this.lights.uiLight.layers.enable(this.layers.labels);
        this.scene.add(this.lights.uiLight);
    }
    
    /**
     * Setup fog for depth
     */
    setupFog() {
        this.scene.fog = new THREE.FogExp2(COLORS.space.fog, SCENE_CONFIG.fogDensity);
    }
    
    /**
     * Register UI overlay
     */
    registerUIOverlay(name, overlay) {
        this.uiOverlays.set(name, overlay);
    }
    
    /**
     * Unregister UI overlay
     */
    unregisterUIOverlay(name) {
        this.uiOverlays.delete(name);
    }
    
    /**
     * Update UI overlays positions
     */
    updateUIOverlays() {
        this.uiOverlays.forEach((overlay, name) => {
            if (overlay.update) {
                overlay.update(this.camera, this.renderer);
            }
        });
    }
    
    /**
     * Set object to specific layer
     */
    setObjectLayer(object, layerName) {
        const layer = this.layers[layerName];
        if (layer !== undefined) {
            object.layers.set(layer);
            
            // Apply to children
            object.traverse(child => {
                child.layers.set(layer);
            });
        }
    }
    
    /**
     * Add object to multiple layers
     */
    addObjectToLayers(object, layerNames) {
        layerNames.forEach(layerName => {
            const layer = this.layers[layerName];
            if (layer !== undefined) {
                object.layers.enable(layer);
                
                // Apply to children
                object.traverse(child => {
                    child.layers.enable(layer);
                });
            }
        });
    }
    
    /**
     * Render with UI coordination
     */
    render() {
        // Update stats
        const startTime = performance.now();
        
        // Clear
        this.renderer.clear();
        
        // Render main scene
        this.renderMainScene();
        
        // Render UI overlays
        this.renderUIOverlays();
        
        // Render CSS labels if available
        if (this.css2DRenderer) {
            this.css2DRenderer.render(this.scene, this.camera);
        }
        
        // Update stats
        this.stats.frameTime = performance.now() - startTime;
        this.updateRenderStats();
        
        // Call render callbacks
        this.renderCallbacks.forEach(callback => callback());
    }
    
    /**
     * Render main 3D scene
     */
    renderMainScene() {
        // Could implement viewport rendering here
        const viewport = this.viewports.main;
        
        if (viewport) {
            const width = window.innerWidth * viewport.width;
            const height = window.innerHeight * viewport.height;
            const x = window.innerWidth * viewport.x;
            const y = window.innerHeight * viewport.y;
            
            this.renderer.setViewport(x, y, width, height);
            this.renderer.setScissor(x, y, width, height);
            this.renderer.setScissorTest(true);
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
        
        // Reset viewport
        if (viewport) {
            this.renderer.setScissorTest(false);
        }
    }
    
    /**
     * Render UI overlays
     */
    renderUIOverlays() {
        if (this.uiScene.children.length > 0) {
            // Disable depth test for UI
            this.renderer.clearDepth();
            
            // Render UI scene
            this.renderer.render(this.uiScene, this.uiCamera);
        }
    }
    
    /**
     * Update render statistics
     */
    updateRenderStats() {
        const info = this.renderer.info;
        this.stats.drawCalls = info.render.calls;
        this.stats.triangles = info.render.triangles;
        this.stats.points = info.render.points;
        this.stats.lines = info.render.lines;
        
        // Reset for next frame
        info.reset();
    }
    
    /**
     * Get render statistics
     */
    getRenderStats() {
        return { ...this.stats };
    }
    
    /**
     * Add render callback
     */
    addRenderCallback(callback) {
        this.renderCallbacks.push(callback);
    }
    
    /**
     * Remove render callback
     */
    removeRenderCallback(callback) {
        const index = this.renderCallbacks.indexOf(callback);
        if (index !== -1) {
            this.renderCallbacks.splice(index, 1);
        }
    }
    
    /**
     * Convert 3D position to screen coordinates
     */
    worldToScreen(position) {
        const vector = new THREE.Vector3().copy(position);
        vector.project(this.camera);
        
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (1 - (vector.y * 0.5 + 0.5)) * window.innerHeight;
        const z = vector.z;
        
        return { x, y, z, visible: z < 1 };
    }
    
    /**
     * Convert screen coordinates to 3D ray
     */
    screenToWorld(x, y) {
        const mouse = new THREE.Vector2();
        mouse.x = (x / window.innerWidth) * 2 - 1;
        mouse.y = -(y / window.innerHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(mouse, this.camera);
        return this.raycaster;
    }
    
    /**
     * Get objects at screen position
     */
    getObjectsAtPosition(x, y, objects) {
        const raycaster = this.screenToWorld(x, y);
        return raycaster.intersectObjects(objects, true);
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
            this.renderer.antialias = quality.antialias;
            
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
     * Handle window resize with UI consideration
     */
    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Update main camera
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Update UI camera
        if (this.uiCamera) {
            this.uiCamera.left = -width / 2;
            this.uiCamera.right = width / 2;
            this.uiCamera.top = height / 2;
            this.uiCamera.bottom = -height / 2;
            this.uiCamera.updateProjectionMatrix();
        }
        
        // Update renderer
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Update CSS renderer
        if (this.css2DRenderer) {
            this.css2DRenderer.setSize(width, height);
        }
        
        // Update UI overlays
        this.uiOverlays.forEach(overlay => {
            if (overlay.resize) {
                overlay.resize(width, height);
            }
        });
    }
    
    /**
     * Take a screenshot with UI option
     */
    takeScreenshot(includeUI = true) {
        // Temporarily enable preserve drawing buffer
        const oldPreserve = this.renderer.preserveDrawingBuffer;
        this.renderer.preserveDrawingBuffer = true;
        
        // Render
        if (includeUI) {
            this.render();
        } else {
            this.renderer.clear();
            this.renderer.render(this.scene, this.camera);
        }
        
        // Get data URL
        const dataURL = this.renderer.domElement.toDataURL('image/png');
        
        // Restore setting
        this.renderer.preserveDrawingBuffer = oldPreserve;
        
        return dataURL;
    }
    
    /**
     * Set viewport for split-screen or picture-in-picture
     */
    setViewport(name, x, y, width, height) {
        this.viewports[name] = { x, y, width, height };
    }
    
    /**
     * Clear viewport
     */
    clearViewport(name) {
        if (name === 'main') {
            this.viewports.main = { x: 0, y: 0, width: 1, height: 1 };
        } else {
            delete this.viewports[name];
        }
    }
    
    /**
     * Toggle layer visibility
     */
    toggleLayer(layerName, visible) {
        const layer = this.layers[layerName];
        if (layer !== undefined) {
            if (visible) {
                this.camera.layers.enable(layer);
            } else {
                this.camera.layers.disable(layer);
            }
        }
    }
    
    /**
     * Get scene hierarchy (for debugging)
     */
    getSceneHierarchy() {
        const hierarchy = [];
        
        const traverse = (object, level = 0) => {
            hierarchy.push({
                name: object.name || object.type,
                type: object.type,
                visible: object.visible,
                level: level,
                children: object.children.length,
                layers: object.layers.mask
            });
            
            object.children.forEach(child => {
                traverse(child, level + 1);
            });
        };
        
        traverse(this.scene);
        return hierarchy;
    }
    
    /**
     * Debug method to visualize layers
     */
    debugLayers() {
        console.log('Scene Layers:');
        Object.entries(this.layers).forEach(([name, layer]) => {
            const objects = [];
            this.scene.traverse(obj => {
                if (obj.layers.test({ mask: 1 << layer })) {
                    objects.push(obj.name || obj.type);
                }
            });
            console.log(`- ${name} (${layer}): ${objects.length} objects`);
        });
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
     * Get UI scene reference
     */
    getUIScene() {
        return this.uiScene;
    }
    
    /**
     * Get UI camera reference
     */
    getUICamera() {
        return this.uiCamera;
    }
    
    /**
     * Dispose of resources
     */
    dispose() {
        // Clear render callbacks
        this.renderCallbacks = [];
        
        // Clear UI overlays
        this.uiOverlays.clear();
        
        // Clear the scenes
        this.clearScene(this.scene);
        this.clearScene(this.uiScene);
        
        // Dispose CSS renderer
        if (this.css2DRenderer) {
            this.css2DRenderer.domElement.remove();
            this.css2DRenderer = null;
        }
        
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
        this.uiScene = null;
        this.camera = null;
        this.uiCamera = null;
        this.lights = {};
    }
    
    /**
     * Clear a scene
     */
    clearScene(scene) {
        if (!scene) return;
        
        while (scene.children.length > 0) {
            const child = scene.children[0];
            scene.remove(child);
            
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
}
