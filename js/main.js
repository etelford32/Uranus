/**
 * Main Entry Point - Uranus Simulation
 * Initializes and coordinates all modules
 */

import { CAMERA_CONFIG, SCENE_CONFIG } from './config/constants.js';
import Settings, { loadPreferences } from './config/settings.js';
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
        
        this.isInitialized = false;
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Initializing Uranus Simulation...');
            
            // Load user preferences
            loadPreferences();
            
            // Setup Three.js scene
            this.setupScene();
            
            // Create celestial objects
            this.createCelestialObjects();
            
            // Setup camera and controls
            this.setupControls();
            
            // Setup UI
            this.setupUI();
            
            // Setup animation loop
            this.setupAnimation();
            
            // Hide loading screen
            this.hideLoading();
            
            // Start animation
            this.start();
            
            this.isInitialized = true;
            console.log('✅ Uranus Simulation initialized successfully!');
            
        } catch (error) {
            console.error('❌ Failed to initialize simulation:', error);
            this.showError('Failed to initialize simulation. Please refresh the page.');
        }
    }
    
    /**
     * Setup Three.js scene
     */
    setupScene() {
        // Initialize scene manager
        this.sceneManager = new SceneManager();
        this.sceneManager.init();
        
        // Get references
        this.scene = this.sceneManager.getScene();
        this.renderer = this.sceneManager.getRenderer();
        this.camera = this.sceneManager.getCamera();
        
        // Add renderer to DOM
        const container = document.getElementById('canvas-container');
        container.appendChild(this.renderer.domElement);
    }
    
    /**
     * Create all celestial objects
     */
    createCelestialObjects() {
        // Create Uranus
        this.uranus = new Uranus(this.scene);
        this.uranus.create();
        
        // Create ring system
        this.rings = new Rings(this.scene);
        this.rings.create();
        
        // Create moons
        this.moons = new Moons(this.scene);
        this.moons.create();
        
        // Create magnetosphere
        this.magnetosphere = new Magnetosphere(this.scene);
        this.magnetosphere.create();
        
        // Create starfield
        this.starfield = new Starfield(this.scene);
        this.starfield.create();
        
        // Create axis helper
        this.createAxisHelper();
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
    }
    
    /**
     * Setup UI components
     */
    setupUI() {
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
                cameraController: this.cameraController,
                statsDisplay: this.statsDisplay
            }
        );
    }
    
    /**
     * Start the simulation
     */
    start() {
        if (this.animationLoop) {
            this.animationLoop.start();
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
    }
    
    /**
     * Reset camera view
     */
    resetView() {
        Settings.resetCamera();
        this.cameraController.updatePosition();
    }
    
    /**
     * Toggle visibility of components
     */
    toggleComponent(component) {
        switch (component) {
            case 'rings':
                Settings.DisplaySettings.showRings = !Settings.DisplaySettings.showRings;
                this.rings.setVisible(Settings.DisplaySettings.showRings);
                break;
            case 'moons':
                Settings.DisplaySettings.showMoons = !Settings.DisplaySettings.showMoons;
                this.moons.setVisible(Settings.DisplaySettings.showMoons);
                break;
            case 'orbits':
                Settings.DisplaySettings.showOrbits = !Settings.DisplaySettings.showOrbits;
                this.moons.setOrbitsVisible(Settings.DisplaySettings.showOrbits);
                break;
            case 'magnetosphere':
                Settings.DisplaySettings.showMagnetosphere = !Settings.DisplaySettings.showMagnetosphere;
                this.magnetosphere.setVisible(Settings.DisplaySettings.showMagnetosphere);
                break;
            case 'labels':
                Settings.DisplaySettings.showLabels = !Settings.DisplaySettings.showLabels;
                this.moons.setLabelsVisible(Settings.DisplaySettings.showLabels);
                break;
            case 'axes':
                Settings.DisplaySettings.showAxes = !Settings.DisplaySettings.showAxes;
                this.axisHelper.visible = Settings.DisplaySettings.showAxes;
                document.querySelector('.axis-helper').style.display = 
                    Settings.DisplaySettings.showAxes ? 'block' : 'none';
                break;
        }
    }
    
    /**
     * Focus camera on a specific moon
     */
    focusOnMoon(moonIndex) {
        const moonData = this.moons.getMoonData(moonIndex);
        if (moonData) {
            const targetRadius = moonData.distance * Settings.DisplaySettings.distanceScale + 30;
            this.cameraController.animateToRadius(targetRadius);
        }
    }
    
    /**
     * Update display scale settings
     */
    updateDistanceScale(scale) {
        Settings.DisplaySettings.distanceScale = scale;
        this.moons.updateOrbits();
    }
    
    updateMoonScale(scale) {
        Settings.DisplaySettings.moonScale = scale;
        this.moons.updateSizes();
    }
    
    updateRingShine(shine) {
        Settings.DisplaySettings.ringShine = shine;
        this.rings.updateMaterials();
    }
    
    /**
     * Hide loading screen
     */
    hideLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
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
                </div>
            `;
        }
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        this.sceneManager.handleResize();
        this.cameraController.handleResize();
    }
    
    /**
     * Cleanup and dispose
     */
    dispose() {
        if (this.animationLoop) {
            this.animationLoop.stop();
        }
        
        if (this.inputHandler) {
            this.inputHandler.dispose();
        }
        
        if (this.sceneManager) {
            this.sceneManager.dispose();
        }
        
        // Dispose all scene objects
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
    }
}

// Initialize simulation when DOM is ready
let simulation = null;

function initApp() {
    simulation = new UranusSimulation();
    simulation.init();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (simulation) {
            simulation.handleResize();
        }
    });
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
        if (simulation) {
            Settings.savePreferences();
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
