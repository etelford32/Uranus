/**
 * Main Entry Point - Uranus Simulation
 * Initializes and coordinates all modules
 */

import { CAMERA_CONFIG, SCENE_CONFIG } from './config/constants.js';
import Settings, { loadPreferences, savePreferences } from './config/settings.js';
import SceneManager from './scene/SceneManager.js';
import Uranus from './scene/Uranus.js';
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
 * Main Application Class
 */
class UranusSimulation {
    constructor() {
        this.scene = null;
        this.sceneManager = null;
        this.cameraController = null;
        this.inputHandler = null;
        this.uiManager = null;
        this.animationLoop = null;
        
        // Scene objects
        this.uranus = null;
        this.rings = null;
        this.moons = null;
        this.magnetosphere = null;
        this.starfield = null;
        
        // UI components
        this.panelManager = null;
        this.statsDisplay = null;
        this.controlBindings = null;
        
        // State tracking
        this.isInitialized = false;
        this.currentFocus = null;
        this.selectedMoonIndex = -1;
        
        // Performance tracking
        this.initStartTime = null;
    }
    
    /**
     * Initialize the application
     */
    async init() {
        this.initStartTime = performance.now();
        
        try {
            console.log('🚀 Initializing Uranus Simulation...');
            
            // Show loading with specific message
            this.showLoading('Loading user preferences...');
            
            // Load user preferences
            const prefsLoaded = loadPreferences();
            console.log(`📁 Preferences ${prefsLoaded ? 'loaded' : 'using defaults'}`);
            
            // Setup Three.js scene
            this.showLoading('Setting up 3D scene...');
            this.setupScene();
            
            // Create celestial objects
            this.showLoading('Creating Uranus system...');
            await this.createCelestialObjects();
            
            // Setup camera and controls
            this.showLoading('Initializing controls...');
            this.setupControls();
            
            // Setup UI
            this.showLoading('Setting up interface...');
            this.setupUI();
            
            // Setup animation loop
            this.showLoading('Starting animation...');
            this.setupAnimation();
            
            // Final initialization
            this.finalizeInit();
            
            const loadTime = ((performance.now() - this.initStartTime) / 1000).toFixed(2);
            console.log(`✅ Uranus Simulation initialized successfully in ${loadTime}s!`);
            
        } catch (error) {
            console.error('❌ Failed to initialize simulation:', error);
            this.showError(`Failed to initialize simulation: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Setup Three.js scene
     */
    setupScene() {
        try {
            // Initialize scene manager
            this.sceneManager = new SceneManager();
            this.sceneManager.init();
            
            // Get references
            this.scene = this.sceneManager.getScene();
            this.renderer = this.sceneManager.getRenderer();
            this.camera = this.sceneManager.getCamera();
            
            // Add renderer to DOM
            const container = document.getElementById('canvas-container');
            if (!container) {
                throw new Error('Canvas container not found');
            }
            container.appendChild(this.renderer.domElement);
            
            console.log('📐 Scene setup complete');
        } catch (error) {
            console.error('Failed to setup scene:', error);
            throw error;
        }
    }
    
    /**
     * Create all celestial objects
     */
    async createCelestialObjects() {
        try {
            // Create Uranus
            console.log('🔵 Creating Uranus...');
            this.uranus = new Uranus(this.scene);
            this.uranus.create();
            
            // Create ring system
            console.log('⭕ Creating rings...');
            this.rings = new Rings(this.scene);
            this.rings.create();
            
            // Create moons
            console.log('🌙 Creating moons...');
            this.moons = new Moons(this.scene);
            this.moons.create();
            
            // Create magnetosphere
            console.log('🧲 Creating magnetosphere...');
            this.magnetosphere = new Magnetosphere(this.scene);
            this.magnetosphere.create();
            
            // Create starfield
            console.log('✨ Creating starfield...');
            this.starfield = new Starfield(this.scene);
            this.starfield.create();
            
            // Create axis helper
            this.createAxisHelper();
            
            // Apply initial visibility settings
            this.applyInitialSettings();
            
        } catch (error) {
            console.error('Failed to create celestial objects:', error);
            throw error;
        }
    }
    
    /**
     * Apply initial visibility settings
     */
    applyInitialSettings() {
        this.rings.setVisible(Settings.DisplaySettings.showRings);
        this.moons.setVisible(Settings.DisplaySettings.showMoons);
        this.moons.setOrbitsVisible(Settings.DisplaySettings.showOrbits);
        this.magnetosphere.setVisible(Settings.DisplaySettings.showMagnetosphere);
        this.moons.setLabelsVisible(Settings.DisplaySettings.showLabels);
        
        if (this.axisHelper) {
            this.axisHelper.visible = Settings.DisplaySettings.showAxes;
        }
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
     * Setup camera and input controls
     */
    setupControls() {
        try {
            // Initialize camera controller
            this.cameraController = new CameraController(this.camera);
            this.cameraController.init();
            
            // Initialize input handler
            this.inputHandler = new InputHandler(
                this.renderer.domElement,
                this.cameraController,
                this
            );
            this.inputHandler.init();
            
            console.log('🎮 Controls initialized');
        } catch (error) {
            console.error('Failed to setup controls:', error);
            throw error;
        }
    }
    
    /**
     * Setup UI components
     */
    setupUI() {
        try {
            // Initialize UI manager
            this.uiManager = new UIManager();
            this.uiManager.init();
            
            // Initialize panel manager for draggable panels
            this.panelManager = new PanelManager();
            this.panelManager.init();
            
            // Initialize stats display
            this.statsDisplay = new StatsDisplay();
            this.statsDisplay.init();
            
            // Initialize control bindings
            this.controlBindings = new ControlBindings(this);
            this.controlBindings.init();
            
            console.log('🎨 UI initialized');
        } catch (error) {
            console.error('Failed to setup UI:', error);
            throw error;
        }
    }
    
    /**
     * Setup animation loop
     */
    setupAnimation() {
        this.animationLoop = new AnimationLoop(
            this.renderer,
            this.scene,
            this.camera,
            {
                uranus: this.uranus,
                rings: this.rings,
                moons: this.moons,
                magnetosphere: this.magnetosphere,
                starfield: this.starfield,
                cameraController: this.cameraController,
                statsDisplay: this.statsDisplay,
                sceneManager: this.sceneManager
            }
        );
    }
    
    /**
     * Finalize initialization
     */
    finalizeInit() {
        // Hide loading screen
        this.hideLoading();
        
        // Start animation
        this.start();
        
        // Set initialized flag
        this.isInitialized = true;
        
        // Dispatch init complete event
        window.dispatchEvent(new CustomEvent('simulationInitialized', {
            detail: { 
                simulation: this,
                loadTime: performance.now() - this.initStartTime
            }
        }));
        
        // Auto-save preferences periodically
        this.startAutoSave();
    }
    
    /**
     * Start auto-save timer
     */
    startAutoSave() {
        if (Settings.UserPreferences.autoSave) {
            setInterval(() => {
                savePreferences();
            }, Settings.UserPreferences.saveInterval || 60000);
        }
    }
    
    /**
     * Start the simulation
     */
    start() {
        if (this.animationLoop) {
            this.animationLoop.start();
            console.log('▶️ Animation started');
        }
    }
    
    /**
     * Pause/Resume the simulation
     */
    togglePause() {
        Settings.SimulationState.isPaused = !Settings.SimulationState.isPaused;
        
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.textContent = Settings.SimulationState.isPaused ? '▶ Play' : '⏸ Pause';
        }
        
        // Dispatch pause event
        window.dispatchEvent(new CustomEvent('simulationPaused', {
            detail: { paused: Settings.SimulationState.isPaused }
        }));
    }
    
    /**
     * Reset camera view
     */
    resetView() {
        Settings.resetCamera();
        this.cameraController.reset();
        this.currentFocus = null;
        this.selectedMoonIndex = -1;
        
        // Clear any moon highlights
        if (this.moons) {
            const moonMeshes = this.moons.getMoonMeshes();
            moonMeshes.forEach(moon => {
                this.moons.highlightMoon(moon.name, false);
            });
        }
    }
    
    /**
     * Toggle visibility of components
     */
    toggleComponent(component) {
        const newState = !Settings.DisplaySettings[`show${component.charAt(0).toUpperCase() + component.slice(1)}`];
        
        switch (component) {
            case 'rings':
                Settings.DisplaySettings.showRings = newState;
                this.rings.setVisible(newState);
                break;
                
            case 'moons':
                Settings.DisplaySettings.showMoons = newState;
                this.moons.setVisible(newState);
                break;
                
            case 'orbits':
                Settings.DisplaySettings.showOrbits = newState;
                this.moons.setOrbitsVisible(newState);
                break;
                
            case 'magnetosphere':
                Settings.DisplaySettings.showMagnetosphere = newState;
                this.magnetosphere.setVisible(newState);
                break;
                
            case 'labels':
                Settings.DisplaySettings.showLabels = newState;
                this.moons.setLabelsVisible(newState);
                break;
                
            case 'axes':
                Settings.DisplaySettings.showAxes = newState;
                if (this.axisHelper) {
                    this.axisHelper.visible = newState;
                }
                const axisHelper = document.querySelector('.axis-helper');
                if (axisHelper) {
                    axisHelper.style.display = newState ? 'block' : 'none';
                }
                break;
        }
        
        // Save preferences after change
        savePreferences();
    }
    
    /**
     * Focus camera on a specific moon
     */
    focusOnMoon(moonIndex, options = {}) {
        const moonMeshes = this.moons?.getMoonMeshes();
        if (!moonMeshes || moonIndex < 0 || moonIndex >= moonMeshes.length) {
            console.warn(`Invalid moon index: ${moonIndex}`);
            return;
        }
        
        const moon = moonMeshes[moonIndex];
        const moonData = moon.userData;
        
        if (moonData) {
            // Calculate appropriate camera distance
            const moonRadius = moonData.radius || 1;
            const targetRadius = moonData.distance * Settings.DisplaySettings.distanceScale + (moonRadius * 20);
            
            // Animate camera to moon
            if (options.animate !== false) {
                this.cameraController.animateToRadius(
                    targetRadius,
                    options.duration || 1000
                );
                
                // Look at moon position
                this.cameraController.lookAt(moon.position);
            } else {
                this.cameraController.setZoom(targetRadius);
                this.cameraController.lookAt(moon.position);
            }
            
            // Highlight the moon
            if (this.selectedMoonIndex >= 0) {
                const prevMoon = moonMeshes[this.selectedMoonIndex];
                this.moons.highlightMoon(prevMoon.name, false);
            }
            
            this.moons.highlightMoon(moon.name, true);
            this.selectedMoonIndex = moonIndex;
            this.currentFocus = { type: 'moon', index: moonIndex, name: moon.name };
            
            // Update UI to show moon info
            const moonInfo = this.moons.getMoonInfo(moon.name);
            if (moonInfo) {
                this.uiManager.showMoonInfo(moonInfo, true);
            }
        }
    }
    
    /**
     * Get current focus target
     */
    getCurrentFocus() {
        return this.currentFocus;
    }
    
    /**
     * Cycle through moons
     */
    cycleMoons(direction = 1) {
        const moonCount = this.moons?.getMoonMeshes()?.length || 0;
        if (moonCount === 0) return;
        
        let nextIndex = this.selectedMoonIndex + direction;
        
        // Wrap around
        if (nextIndex >= moonCount) nextIndex = 0;
        if (nextIndex < 0) nextIndex = moonCount - 1;
        
        this.focusOnMoon(nextIndex);
    }
    
    /**
     * Update display scale settings
     */
    updateDistanceScale(scale) {
        Settings.DisplaySettings.distanceScale = scale;
        if (this.moons) {
            this.moons.updateOrbits();
        }
        savePreferences();
    }
    
    updateMoonScale(scale) {
        Settings.DisplaySettings.moonScale = scale;
        if (this.moons) {
            this.moons.updateSizes();
        }
        savePreferences();
    }
    
    updateRingShine(shine) {
        Settings.DisplaySettings.ringShine = shine;
        
        // Update ring material properties
        if (this.rings) {
            const ringMeshes = this.rings.getRingMeshes();
            ringMeshes.forEach(ring => {
                if (ring.material) {
                    if (ring.material.uniforms && ring.material.uniforms.baseOpacity) {
                        // Shader material
                        ring.material.uniforms.baseOpacity.value = ring.userData.baseOpacity * shine;
                    } else if (ring.material.opacity !== undefined) {
                        // Basic material
                        ring.material.opacity = ring.userData.baseOpacity * shine;
                    }
                }
            });
        }
        savePreferences();
    }
    
    /**
     * Show loading screen with message
     */
    showLoading(message = 'Initializing Uranus System...') {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'block';
            const messageDiv = loadingElement.querySelector('div');
            if (messageDiv) {
                messageDiv.textContent = message;
            }
        }
    }
    
    /**
     * Hide loading screen
     */
    hideLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            // Fade out animation
            loadingElement.style.opacity = '0';
            setTimeout(() => {
                loadingElement.style.display = 'none';
                loadingElement.style.opacity = '1';
            }, 300);
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div style="color: #ff6b6b;">
                    <div>⚠️ Error</div>
                    <div style="font-size: 16px; margin-top: 10px;">${message}</div>
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
            `;
            loadingElement.style.display = 'block';
        }
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        if (this.sceneManager) {
            this.sceneManager.handleResize();
        }
        if (this.cameraController) {
            this.cameraController.handleResize();
        }
        if (this.panelManager) {
            this.panelManager.handleResize();
        }
    }
    
    /**
     * Take screenshot
     */
    takeScreenshot() {
        if (this.sceneManager) {
            const dataURL = this.sceneManager.takeScreenshot();
            if (dataURL) {
                // Create download link
                const link = document.createElement('a');
                link.download = `uranus-simulation-${Date.now()}.png`;
                link.href = dataURL;
                link.click();
            }
        }
    }
    
    /**
     * Get simulation statistics
     */
    getStatistics() {
        return {
            initialized: this.isInitialized,
            simulationTime: Settings.SimulationState.simulationTime,
            fps: this.statsDisplay?.getFPS() || 0,
            performance: this.animationLoop?.getPerformanceReport() || {},
            moonSystem: this.moons?.getSystemStats() || {},
            renderInfo: this.sceneManager?.getInfo() || {}
        };
    }
    
    /**
     * Debug mode toggle
     */
    toggleDebugMode() {
        const debugMode = !Settings.UserPreferences.debugMode;
        Settings.UserPreferences.debugMode = debugMode;
        
        if (debugMode) {
            // Show debug info
            this.statsDisplay?.toggleDetailedStats();
            this.rings?.debugRings();
            console.log('Debug Mode Enabled');
            console.log('Statistics:', this.getStatistics());
        } else {
            // Hide debug info
            this.statsDisplay?.toggleDetailedStats();
            console.log('Debug Mode Disabled');
        }
    }
    
    /**
     * Cleanup and dispose
     */
    dispose() {
        console.log('🧹 Disposing simulation...');
        
        // Save preferences before cleanup
        savePreferences();
        
        // Stop animation
        if (this.animationLoop) {
            this.animationLoop.stop();
            this.animationLoop.dispose();
        }
        
        // Dispose input handler
        if (this.inputHandler) {
            this.inputHandler.dispose();
        }
        
        // Dispose scene objects
        [this.uranus, this.rings, this.moons, this.magnetosphere, this.starfield].forEach(obj => {
            if (obj && obj.dispose) {
                obj.dispose();
            }
        });
        
        // Dispose UI components
        [this.uiManager, this.panelManager, this.statsDisplay, this.controlBindings].forEach(component => {
            if (component && component.dispose) {
                component.dispose();
            }
        });
        
        // Dispose scene manager last
        if (this.sceneManager) {
            this.sceneManager.dispose();
        }
        
        // Clear references
        this.scene = null;
        this.renderer = null;
        this.camera = null;
        this.isInitialized = false;
        
        console.log('✅ Simulation disposed');
    }
}

// Initialize simulation when DOM is ready
let simulation = null;

function initApp() {
    // Check WebGL support
    if (!window.WebGLRenderingContext) {
        document.getElementById('loading').innerHTML = `
            <div style="color: #ff6b6b;">
                <div>⚠️ WebGL Not Supported</div>
                <div style="font-size: 16px; margin-top: 10px;">
                    Your browser doesn't support WebGL, which is required for this simulation.
                    Please use a modern browser like Chrome, Firefox, Safari, or Edge.
                </div>
            </div>
        `;
        return;
    }
    
    // Create and initialize simulation
    simulation = new UranusSimulation();
    simulation.init().catch(error => {
        console.error('Failed to start simulation:', error);
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (simulation && simulation.isInitialized) {
            simulation.handleResize();
        }
    });
    
    // Handle page visibility change
    document.addEventListener('visibilitychange', () => {
        if (simulation && simulation.isInitialized) {
            if (document.hidden) {
                // Pause when page is hidden to save resources
                if (!Settings.SimulationState.isPaused) {
                    simulation.togglePause();
                }
            }
        }
    });
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
        if (simulation && simulation.isInitialized) {
            savePreferences();
        }
    });
    
    // Error handling
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        if (simulation && !simulation.isInitialized) {
            simulation.showError('An unexpected error occurred. Please refresh the page.');
        }
    });
}

// Start when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export for debugging/console access
window.UranusSimulation = simulation;
window.debugUranus = () => {
    if (simulation) {
        simulation.toggleDebugMode();
        return simulation.getStatistics();
    }
    return null;
};

export default UranusSimulation;
