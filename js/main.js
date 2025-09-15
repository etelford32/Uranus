/**
 * Main Entry Point - Enhanced Uranus Simulation
 * Improved initialization, error handling, and performance
 */

import { CAMERA_CONFIG, SCENE_CONFIG } from './config/constants.js';
import Settings, { loadPreferences, savePreferences } from './config/settings.js';
import SceneManager from './scene/SceneManager.js';
import Uranus from './scene/Uranus.js';
import Atmosphere from './scene/Atmosphere.js';
import Rings from './scene/Rings.js';
import Moons from './scene/Moons.js';
import Magnetosphere from './scene/Magnetosphere.js';
import Starfield from './scene/Starfield.js';
import CameraController from './controls/CameraController.js';
import InputHandler from './controls/InputHandler.js';
import UIManager from './ui/UIManager.js';
import PanelManager from './ui/PanelManager.js';
import StatsDisplay from './ui/StatsDisplay.js';
import ControlBindings from './ui/ControlBindings.js';
import AnimationLoop from './utils/AnimationLoop.js';

/**
 * Enhanced Main Application Class
 */
class UranusSimulation {
    constructor() {
        // Core components
        this.scene = null;
        this.sceneManager = null;
        this.cameraController = null;
        this.inputHandler = null;
        this.uiManager = null;
        this.animationLoop = null;
        
        // Scene objects
        this.uranus = null;
        this.atmosphere = null;
        this.rings = null;
        this.moons = null;
        this.magnetosphere = null;
        this.starfield = null;
        
        // UI components
        this.panelManager = null;
        this.statsDisplay = null;
        this.controlBindings = null;
        
        // State tracking
        this.state = {
            initialized: false,
            loading: true,
            error: null,
            currentFocus: null,
            selectedMoonIndex: -1,
            quality: 'auto',
            performanceMode: false
        };
        
        // Performance monitoring
        this.performance = {
            initStartTime: null,
            loadSteps: [],
            frameHistory: [],
            memoryUsage: null,
            lowFpsCount: 0
        };
        
        // Component status tracking
        this.componentStatus = new Map();
        
        // Event listeners
        this.eventListeners = [];
        
        // Auto-save timer
        this.autoSaveTimer = null;
    }
    
    /**
     * Enhanced initialization with better error handling
     */
    async init() {
        this.performance.initStartTime = performance.now();
        
        try {
            console.log('🚀 Initializing Enhanced Uranus Simulation...');
            
            // Check browser capabilities
            this.checkBrowserCapabilities();
            
            // Initialize in stages with error recovery
            const stages = [
                { name: 'preferences', fn: () => this.loadUserPreferences() },
                { name: 'scene', fn: () => this.setupScene() },
                { name: 'objects', fn: () => this.createCelestialObjects() },
                { name: 'controls', fn: () => this.setupControls() },
                { name: 'ui', fn: () => this.setupUI() },
                { name: 'animation', fn: () => this.setupAnimation() }
            ];
            
            for (const stage of stages) {
                const startTime = performance.now();
                
                try {
                    this.updateLoadingMessage(`Initializing ${stage.name}...`);
                    await stage.fn();
                    
                    const duration = performance.now() - startTime;
                    this.performance.loadSteps.push({ 
                        stage: stage.name, 
                        duration, 
                        success: true 
                    });
                    
                    console.log(`✓ ${stage.name} loaded (${duration.toFixed(0)}ms)`);
                    
                } catch (error) {
                    console.error(`✗ Failed to initialize ${stage.name}:`, error);
                    
                    this.performance.loadSteps.push({ 
                        stage: stage.name, 
                        error: error.message, 
                        success: false 
                    });
                    
                    // Try to recover or use fallback
                    if (!this.attemptRecovery(stage.name, error)) {
                        throw new Error(`Critical failure in ${stage.name}: ${error.message}`);
                    }
                }
            }
            
            // Final initialization
            this.finalizeInit();
            
        } catch (error) {
            console.error('❌ Critical initialization failure:', error);
            this.handleCriticalError(error);
        }
    }
    
    /**
     * Check browser capabilities
     */
    checkBrowserCapabilities() {
        const required = {
            webgl: !!window.WebGLRenderingContext,
            webgl2: !!window.WebGL2RenderingContext,
            requestAnimationFrame: !!window.requestAnimationFrame,
            localStorage: this.testLocalStorage()
        };
        
        const optional = {
            webWorker: !!window.Worker,
            serviceWorker: 'serviceWorker' in navigator,
            webAssembly: !!window.WebAssembly,
            pointerEvents: !!window.PointerEvent,
            resizeObserver: !!window.ResizeObserver,
            intersectionObserver: !!window.IntersectionObserver
        };
        
        // Check required features
        const missing = Object.entries(required)
            .filter(([_, supported]) => !supported)
            .map(([feature]) => feature);
        
        if (missing.length > 0) {
            throw new Error(`Missing required features: ${missing.join(', ')}`);
        }
        
        // Log optional features
        console.log('Browser capabilities:', { required, optional });
        
        // Adjust quality based on capabilities
        if (!optional.webWorker || !required.webgl2) {
            console.warn('Limited capabilities detected, reducing quality');
            Settings.PerformanceSettings.currentQuality = 'low';
        }
    }
    
    /**
     * Test localStorage availability
     */
    testLocalStorage() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Load user preferences with validation
     */
    loadUserPreferences() {
        try {
            const loaded = loadPreferences();
            
            // Validate loaded preferences
            if (loaded) {
                this.validatePreferences();
            }
            
            console.log(`📁 Preferences ${loaded ? 'loaded' : 'using defaults'}`);
            
        } catch (error) {
            console.warn('Could not load preferences:', error);
            Settings.resetDisplay();
        }
    }
    
    /**
     * Validate and fix preferences
     */
    validatePreferences() {
        // Ensure values are within valid ranges
        const { DisplaySettings, PerformanceSettings } = Settings;
        
        DisplaySettings.distanceScale = Math.max(0.3, Math.min(2, DisplaySettings.distanceScale));
        DisplaySettings.moonScale = Math.max(1, Math.min(5, DisplaySettings.moonScale));
        DisplaySettings.ringShine = Math.max(0, Math.min(1, DisplaySettings.ringShine));
        
        // Validate quality setting
        const validQualities = ['low', 'medium', 'high'];
        if (!validQualities.includes(PerformanceSettings.currentQuality)) {
            PerformanceSettings.currentQuality = 'medium';
        }
    }
    
    /**
     * Enhanced scene setup with error recovery
     */
    setupScene() {
        this.sceneManager = new SceneManager();
        this.sceneManager.init();
        
        this.scene = this.sceneManager.getScene();
        this.renderer = this.sceneManager.getRenderer();
        this.camera = this.sceneManager.getCamera();
        
        // Verify renderer creation
        if (!this.renderer || !this.renderer.domElement) {
            throw new Error('Failed to create WebGL renderer');
        }
        
        // Add to DOM
        const container = document.getElementById('canvas-container');
        if (!container) {
            throw new Error('Canvas container not found');
        }
        
        container.appendChild(this.renderer.domElement);
        
        // Add render error handler
        this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            this.handleContextLost();
        });
        
        this.renderer.domElement.addEventListener('webglcontextrestored', () => {
            this.handleContextRestored();
        });
        
        this.componentStatus.set('scene', true);
    }
    
    /**
     * Create celestial objects with fallbacks
     */
    async createCelestialObjects() {
        const objects = [
            { 
                name: 'uranus', 
                create: () => {
                    this.uranus = new Uranus(this.scene);
                    return this.uranus.create();
                },
                required: true
            },
            {
                name: 'atmosphere',
                create: () => {
                    this.atmosphere = new Atmosphere(this.scene, this.uranus?.getGroup());
                    return this.atmosphere.create();
                },
                required: false
            },
            { 
                name: 'rings', 
                create: () => {
                    this.rings = new Rings(this.scene);
                    return this.rings.create();
                },
                required: false
            },
            { 
                name: 'moons', 
                create: () => {
                    this.moons = new Moons(this.scene);
                    return this.moons.create();
                },
                required: false
            },
            { 
                name: 'magnetosphere', 
                create: () => {
                    this.magnetosphere = new Magnetosphere(this.scene);
                    return this.magnetosphere.create();
                },
                required: false
            },
            { 
                name: 'starfield', 
                create: () => {
                    this.starfield = new Starfield(this.scene);
                    return this.starfield.create();
                },
                required: false
            }
        ];
        
        for (const obj of objects) {
            try {
                this.updateLoadingMessage(`Creating ${obj.name}...`);
                const result = await obj.create();
                this.componentStatus.set(obj.name, true);
                console.log(`✓ ${obj.name} created`);
                
            } catch (error) {
                console.error(`✗ Failed to create ${obj.name}:`, error);
                this.componentStatus.set(obj.name, false);
                
                if (obj.required) {
                    throw error;
                }
            }
        }
        
        // Create axis helper
        this.createAxisHelper();
        
        // Apply initial settings
        this.applyInitialSettings();
        
        // Run component tests in debug mode
        if (Settings.UserPreferences.debugMode) {
            this.runComponentTests();
        }
    }
    
    /**
     * Run component tests
     */
    runComponentTests() {
        console.group('Component Tests');
        
        if (this.uranus?.test) {
            console.log('Uranus:', this.uranus.test() ? '✓' : '✗');
        }
        if (this.atmosphere?.test) {
            console.log('Atmosphere:', this.atmosphere.test() ? '✓' : '✗');
        }
        if (this.magnetosphere?.test) {
            console.log('Magnetosphere:', this.magnetosphere.test() ? '✓' : '✗');
        }
        
        console.groupEnd();
    }
    
    /**
     * Apply initial settings to all components
     */
    applyInitialSettings() {
        const { DisplaySettings } = Settings;
        
        if (this.rings) this.rings.setVisible(DisplaySettings.showRings);
        if (this.moons) {
            this.moons.setVisible(DisplaySettings.showMoons);
            this.moons.setOrbitsVisible(DisplaySettings.showOrbits);
            this.moons.setLabelsVisible(DisplaySettings.showLabels);
        }
        if (this.magnetosphere) {
            this.magnetosphere.setVisible(DisplaySettings.showMagnetosphere);
        }
        if (this.axisHelper) {
            this.axisHelper.visible = DisplaySettings.showAxes;
        }
    }
    
    /**
     * Setup controls with error handling
     */
    setupControls() {
        this.cameraController = new CameraController(this.camera);
        this.cameraController.init();
        
        this.inputHandler = new InputHandler(
            this.renderer.domElement,
            this.cameraController,
            this
        );
        this.inputHandler.init();
        
        this.componentStatus.set('controls', true);
    }
    
    /**
     * Setup UI with fallbacks
     */
    setupUI() {
        try {
            this.uiManager = new UIManager();
            this.uiManager.init();
        } catch (error) {
            console.warn('UIManager failed:', error);
        }
        
        try {
            this.panelManager = new PanelManager();
            this.panelManager.init();
        } catch (error) {
            console.warn('PanelManager failed:', error);
        }
        
        try {
            this.statsDisplay = new StatsDisplay();
            this.statsDisplay.init();
        } catch (error) {
            console.warn('StatsDisplay failed:', error);
        }
        
        try {
            this.controlBindings = new ControlBindings(this);
            this.controlBindings.init();
        } catch (error) {
            console.warn('ControlBindings failed:', error);
        }
        
        this.componentStatus.set('ui', true);
    }
    
    /**
     * Setup animation loop with performance monitoring
     */
    setupAnimation() {
        this.animationLoop = new AnimationLoop(
            this.renderer,
            this.scene,
            this.camera,
            {
                uranus: this.uranus,
                atmosphere: this.atmosphere,
                rings: this.rings,
                moons: this.moons,
                magnetosphere: this.magnetosphere,
                starfield: this.starfield,
                cameraController: this.cameraController,
                statsDisplay: this.statsDisplay,
                sceneManager: this.sceneManager
            }
        );
        
        // Monitor performance
        this.setupPerformanceMonitoring();
        
        this.componentStatus.set('animation', true);
    }
    
    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        let frameCount = 0;
        let lastCheck = performance.now();
        
        const checkPerformance = () => {
            frameCount++;
            const now = performance.now();
            
            if (now - lastCheck > 1000) {
                const fps = frameCount;
                this.performance.frameHistory.push(fps);
                
                // Keep only last 60 samples
                if (this.performance.frameHistory.length > 60) {
                    this.performance.frameHistory.shift();
                }
                
                // Check for consistent low FPS
                if (fps < 30) {
                    this.performance.lowFpsCount++;
                    
                    if (this.performance.lowFpsCount > 5 && !this.state.performanceMode) {
                        this.enablePerformanceMode();
                    }
                } else {
                    this.performance.lowFpsCount = Math.max(0, this.performance.lowFpsCount - 1);
                }
                
                // Check memory if available
                if (performance.memory) {
                    this.performance.memoryUsage = {
                        used: performance.memory.usedJSHeapSize,
                        limit: performance.memory.jsHeapSizeLimit,
                        percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
                    };
                    
                    // Warn if memory usage is high
                    if (this.performance.memoryUsage.percentage > 90) {
                        console.warn('High memory usage:', this.performance.memoryUsage);
                    }
                }
                
                frameCount = 0;
                lastCheck = now;
            }
            
            if (this.state.initialized) {
                requestAnimationFrame(checkPerformance);
            }
        };
        
        checkPerformance();
    }
    
    /**
     * Enable performance mode
     */
    enablePerformanceMode() {
        console.warn('Enabling performance mode due to low FPS');
        
        this.state.performanceMode = true;
        
        // Reduce quality settings
        Settings.PerformanceSettings.currentQuality = 'low';
        this.sceneManager?.applyQualitySettings('low');
        
        // Disable expensive features
        if (this.magnetosphere) this.magnetosphere.setVisible(false);
        if (this.atmosphere) this.atmosphere.setVisible(false);
        
        // Reduce moon visibility
        if (this.moons) {
            this.moons.setTypeVisibility('irregular', false);
            this.moons.setLabelsVisible(false);
        }
        
        // Show notification
        this.showNotification('Performance mode enabled', 'warning');
    }
    
    /**
     * Finalize initialization
     */
    finalizeInit() {
        const loadTime = ((performance.now() - this.performance.initStartTime) / 1000).toFixed(2);
        
        // Log performance report
        console.group('📊 Load Performance');
        console.table(this.performance.loadSteps);
        console.log(`Total load time: ${loadTime}s`);
        console.groupEnd();
        
        // Hide loading
        this.hideLoading();
        
        // Start simulation
        this.start();
        
        // Set state
        this.state.initialized = true;
        this.state.loading = false;
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('simulationReady', {
            detail: {
                simulation: this,
                loadTime: parseFloat(loadTime),
                components: Object.fromEntries(this.componentStatus)
            }
        }));
        
        // Setup auto-save
        this.setupAutoSave();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log(`✅ Simulation ready in ${loadTime}s`);
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Window resize
        const resizeHandler = () => this.handleResize();
        window.addEventListener('resize', resizeHandler);
        this.eventListeners.push({ target: window, type: 'resize', handler: resizeHandler });
        
        // Page visibility
        const visibilityHandler = () => this.handleVisibilityChange();
        document.addEventListener('visibilitychange', visibilityHandler);
        this.eventListeners.push({ target: document, type: 'visibilitychange', handler: visibilityHandler });
        
        // Before unload
        const unloadHandler = () => this.handleUnload();
        window.addEventListener('beforeunload', unloadHandler);
        this.eventListeners.push({ target: window, type: 'beforeunload', handler: unloadHandler });
        
        // Keyboard shortcuts
        const keyHandler = (e) => this.handleGlobalKeyboard(e);
        document.addEventListener('keydown', keyHandler);
        this.eventListeners.push({ target: document, type: 'keydown', handler: keyHandler });
    }
    
    /**
     * Handle global keyboard shortcuts
     */
    handleGlobalKeyboard(e) {
        // Ctrl/Cmd + S: Take screenshot
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.takeScreenshot();
        }
        
        // Ctrl/Cmd + D: Toggle debug
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            this.toggleDebugMode();
        }
        
        // Escape: Reset view
        if (e.key === 'Escape') {
            this.resetView();
        }
    }
    
    /**
     * Handle visibility change
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Pause if not already paused
            if (!Settings.SimulationState.isPaused) {
                this.wasAutopaused = true;
                this.togglePause();
            }
            
            // Save preferences
            savePreferences();
        } else {
            // Resume if auto-paused
            if (this.wasAutopaused && Settings.SimulationState.isPaused) {
                this.wasAutopaused = false;
                this.togglePause();
            }
        }
    }
    
    /**
     * Handle page unload
     */
    handleUnload() {
        savePreferences();
        this.dispose();
    }
    
    /**
     * Setup auto-save
     */
    setupAutoSave() {
        if (Settings.UserPreferences.autoSave) {
            this.autoSaveTimer = setInterval(() => {
                try {
                    savePreferences();
                } catch (error) {
                    console.error('Auto-save failed:', error);
                }
            }, Settings.UserPreferences.saveInterval || 60000);
        }
    }
    
    /**
     * Attempt recovery from initialization failure
     */
    attemptRecovery(stage, error) {
        console.warn(`Attempting recovery for ${stage}...`);
        
        switch (stage) {
            case 'objects':
                // Continue without failed objects
                return true;
                
            case 'ui':
                // Can run without UI
                console.warn('Running without UI');
                return true;
                
            case 'controls':
                // Try basic controls
                try {
                    this.setupBasicControls();
                    return true;
                } catch {
                    return false;
                }
                
            default:
                return false;
        }
    }
    
    /**
     * Setup basic controls as fallback
     */
    setupBasicControls() {
        // Simple mouse rotation
        let mouseDown = false;
        let mouseX = 0;
        let mouseY = 0;
        
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            mouseDown = true;
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (!mouseDown) return;
            
            const deltaX = e.clientX - mouseX;
            const deltaY = e.clientY - mouseY;
            
            if (this.camera) {
                this.camera.rotation.y += deltaX * 0.01;
                this.camera.rotation.x += deltaY * 0.01;
            }
            
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        this.renderer.domElement.addEventListener('mouseup', () => {
            mouseDown = false;
        });
    }
    
    /**
     * Handle WebGL context lost
     */
    handleContextLost() {
        console.error('WebGL context lost');
        this.state.error = 'WebGL context lost';
        
        if (this.animationLoop) {
            this.animationLoop.stop();
        }
        
        this.showError('Graphics context lost. The page will reload...');
        
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    }
    
    /**
     * Handle WebGL context restored
     */
    handleContextRestored() {
        console.log('WebGL context restored');
        
        // Recreate scene
        this.scene = null;
        this.init();
    }
    
    /**
     * Handle critical error
     */
    handleCriticalError(error) {
        this.state.error = error;
        this.state.loading = false;
        
        const errorReport = {
            message: error.message,
            stack: error.stack,
            components: Object.fromEntries(this.componentStatus),
            performance: this.performance,
            userAgent: navigator.userAgent
        };
        
        console.error('Critical error report:', errorReport);
        
        this.showError(`
            <div style="text-align: left; max-width: 600px; margin: 0 auto;">
                <h3>Initialization Failed</h3>
                <p>${error.message}</p>
                <details style="margin-top: 20px;">
                    <summary style="cursor: pointer;">Technical Details</summary>
                    <pre style="font-size: 12px; overflow: auto; max-height: 200px;">
${JSON.stringify(errorReport, null, 2)}
                    </pre>
                </details>
                <button onclick="location.reload()" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: #4FD0E7;
                    border: none;
                    border-radius: 5px;
                    color: white;
                    cursor: pointer;
                ">Reload Page</button>
            </div>
        `);
    }
    
    /**
     * Update loading message
     */
    updateLoadingMessage(message) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            const messageDiv = loadingElement.querySelector('div');
            if (messageDiv) {
                messageDiv.textContent = message;
            }
        }
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: ${type === 'warning' ? '#ff9800' : '#4FD0E7'};
            color: white;
            border-radius: 5px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    /**
     * Create axis helper
     */
    createAxisHelper() {
        this.axisHelper = new THREE.AxesHelper(50);
        this.axisHelper.visible = Settings.DisplaySettings.showAxes;
        this.scene.add(this.axisHelper);
    }
    
    /**
     * Start simulation
     */
    start() {
        if (this.animationLoop) {
            this.animationLoop.start();
        }
    }
    
    /**
     * Toggle pause
     */
    togglePause() {
        Settings.SimulationState.isPaused = !Settings.SimulationState.isPaused;
        
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.textContent = Settings.SimulationState.isPaused ? '▶ Play' : '⏸ Pause';
        }
        
        window.dispatchEvent(new CustomEvent('simulationPaused', {
            detail: { paused: Settings.SimulationState.isPaused }
        }));
    }
    
    /**
     * Reset view
     */
    resetView() {
        Settings.resetCamera();
        if (this.cameraController) {
            this.cameraController.reset();
        }
        this.state.currentFocus = null;
        this.state.selectedMoonIndex = -1;
        
        // Clear highlights
        if (this.moons) {
            this.moons.getMoonMeshes().forEach(moon => {
                this.moons.highlightMoon(moon.name, false);
            });
        }
    }
    
    /**
     * Toggle component visibility
     */
    toggleComponent(component) {
        const componentMap = {
            rings: this.rings,
            moons: this.moons,
            magnetosphere: this.magnetosphere,
            atmosphere: this.atmosphere
        };
        
        const obj = componentMap[component];
        if (!obj) return;
        
        const settingKey = `show${component.charAt(0).toUpperCase() + component.slice(1)}`;
        Settings.DisplaySettings[settingKey] = !Settings.DisplaySettings[settingKey];
        
        if (component === 'orbits') {
            this.moons?.setOrbitsVisible(Settings.DisplaySettings.showOrbits);
        } else if (component === 'labels') {
            this.moons?.setLabelsVisible(Settings.DisplaySettings.showLabels);
        } else if (component === 'axes') {
            Settings.DisplaySettings.showAxes = !Settings.DisplaySettings.showAxes;
            if (this.axisHelper) {
                this.axisHelper.visible = Settings.DisplaySettings.showAxes;
            }
        } else {
            obj.setVisible(Settings.DisplaySettings[settingKey]);
        }
        
        savePreferences();
    }
    
    /**
     * Focus on moon
     */
    focusOnMoon(moonIndex) {
        const moonMeshes = this.moons?.getMoonMeshes();
        if (!moonMeshes || moonIndex < 0 || moonIndex >= moonMeshes.length) return;
        
        const moon = moonMeshes[moonIndex];
        const moonData = moon.userData;
        
        if (moonData) {
            const targetRadius = moonData.distance * Settings.DisplaySettings.distanceScale + 30;
            
            this.cameraController?.animateToRadius(targetRadius, 1000);
            this.cameraController?.lookAt(moon.position);
            
            // Clear previous highlight
            if (this.state.selectedMoonIndex >= 0) {
                const prevMoon = moonMeshes[this.state.selectedMoonIndex];
                this.moons.highlightMoon(prevMoon.name, false);
            }
            
            this.moons.highlightMoon(moon.name, true);
            this.state.selectedMoonIndex = moonIndex;
            this.state.currentFocus = { type: 'moon', index: moonIndex };
        }
    }
    
    /**
     * Get current focus
     */
    getCurrentFocus() {
        return this.state.currentFocus;
    }
    
    /**
     * Update display scales
     */
    updateDistanceScale(scale) {
        Settings.DisplaySettings.distanceScale = scale;
        this.moons?.updateOrbits();
        savePreferences();
    }
    
    updateMoonScale(scale) {
        Settings.DisplaySettings.moonScale = scale;
        this.moons?.updateSizes();
        savePreferences();
    }
    
    updateRingShine(shine) {
        Settings.DisplaySettings.ringShine = shine;
        
        if (this.rings) {
            const ringMeshes = this.rings.getRingMeshes();
            ringMeshes.forEach(ring => {
                if (ring.material) {
                    if (ring.material.uniforms?.baseOpacity) {
                        ring.material.uniforms.baseOpacity.value = ring.userData.baseOpacity * shine;
                    } else if (ring.material.opacity !== undefined) {
                        ring.material.opacity = ring.userData.baseOpacity * shine;
                    }
                }
            });
        }
        savePreferences();
    }
    
    /**
     * Hide loading screen
     */
    hideLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.opacity = '0';
            setTimeout(() => {
                loadingElement.style.display = 'none';
                loadingElement.style.opacity = '1';
            }, 300);
        }
    }
    
    /**
     * Show error
     */
    showError(html) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.innerHTML = `<div style="color: #ff6b6b;">${html}</div>`;
            loadingElement.style.display = 'block';
        }
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        this.sceneManager?.handleResize();
        this.cameraController?.handleResize();
        this.panelManager?.handleResize();
    }
    
    /**
     * Take screenshot
     */
    takeScreenshot() {
        const dataURL = this.sceneManager?.takeScreenshot();
        if (dataURL) {
            const link = document.createElement('a');
            link.download = `uranus-${Date.now()}.png`;
            link.href = dataURL;
            link.click();
            
            this.showNotification('Screenshot saved!');
        }
    }
    
    /**
     * Toggle debug mode
     */
    toggleDebugMode() {
        Settings.UserPreferences.debugMode = !Settings.UserPreferences.debugMode;
        
        if (Settings.UserPreferences.debugMode) {
            this.statsDisplay?.toggleDetailedStats();
            this.runComponentTests();
            console.log('Debug enabled:', this.getStatistics());
        } else {
            this.statsDisplay?.toggleDetailedStats();
        }
    }
    
    /**
     * Get statistics
     */
    getStatistics() {
        return {
            state: this.state,
            components: Object.fromEntries(this.componentStatus),
            performance: this.performance,
            settings: {
                display: Settings.DisplaySettings,
                simulation: Settings.SimulationState,
                quality: Settings.PerformanceSettings.currentQuality
            }
        };
    }
    
    /**
     * Dispose
     */
    dispose() {
        // Save preferences
        savePreferences();
        
        // Clear timers
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        // Remove event listeners
        this.eventListeners.forEach(({ target, type, handler }) => {
            target.removeEventListener(type, handler);
        });
        
        // Dispose components
        this.animationLoop?.dispose();
        this.inputHandler?.dispose();
        
        [this.uranus, this.atmosphere, this.rings, this.moons, this.magnetosphere, this.starfield]
            .forEach(obj => obj?.dispose?.());
        
        [this.uiManager, this.panelManager, this.statsDisplay, this.controlBindings]
            .forEach(component => component?.dispose?.());
        
        this.sceneManager?.dispose();
        
        // Clear references
        this.state.initialized = false;
        
        console.log('✅ Simulation disposed');
    }
}

// Global initialization
let simulation = null;

function initApp() {
    simulation = new UranusSimulation();
    simulation.init().catch(console.error);
}

// Start when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export for debugging
window.UranusSimulation = simulation;
window.debugUranus = () => simulation?.toggleDebugMode();

export default UranusSimulation;
