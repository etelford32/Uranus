/**
 * Default Settings and Runtime Configuration
 * These values can be modified during runtime via UI controls
 */

// Simulation State
export const SimulationState = {
    isPaused: false,
    simulationTime: 0, // in hours
    timeSpeed: 1, // hours per second
    lastFrameTime: Date.now(),
    frameCount: 0,
    fpsTime: 0,
    fps: 60
};

// Display Settings
export const DisplaySettings = {
    showRings: true,
    showMoons: true,
    showOrbits: true,
    showMagnetosphere: false,
    showLabels: true,
    showAxes: false,
    distanceScale: 1.0,
    moonScale: 2.0,
    ringShine: 0.7
};

// Camera State
export const CameraState = {
    radius: 100,
    theta: 0, // Horizontal angle
    phi: Math.PI / 3, // Vertical angle (60 degrees)
    target: { x: 0, y: 0, z: 0 },
    isMouseDown: false,
    mouseX: 0,
    mouseY: 0,
    autoRotate: false,
    autoRotateSpeed: 0.001
};

// UI State
export const UIState = {
    panelsMinimized: {
        'info-panel': true,
        'controls-panel': true,
        'stats-panel': false
    },
    activeDragPanel: null,
    moonInfoVisible: false,
    selectedMoon: null
};

// Touch Control State
export const TouchState = {
    startDistance: 0,
    startX: 0,
    startY: 0,
    isTouching: false,
    touchCount: 0
};

// Performance Settings
export const PerformanceSettings = {
    adaptiveQuality: true,
    targetFPS: 60,
    lowQualityThreshold: 30,
    highQualityThreshold: 55,
    currentQuality: 'high', // 'low', 'medium', 'high'
    shadowsEnabled: true,
    antialias: true,
    pixelRatio: window.devicePixelRatio || 1
};

// Quality Presets
export const QualityPresets = {
    low: {
        shadowMapSize: 1024,
        uranusSegments: 64,
        moonSegments: 16,
        ringSegments: 128,
        starCount: 5000,
        shadowsEnabled: false,
        antialias: false
    },
    medium: {
        shadowMapSize: 2048,
        uranusSegments: 96,
        moonSegments: 24,
        ringSegments: 192,
        starCount: 10000,
        shadowsEnabled: true,
        antialias: false
    },
    high: {
        shadowMapSize: 4096,
        uranusSegments: 128,
        moonSegments: 32,
        ringSegments: 256,
        starCount: 20000,
        shadowsEnabled: true,
        antialias: true
    }
};

// User Preferences (can be saved to localStorage)
export const UserPreferences = {
    theme: 'default', // Could support different color themes
    units: 'metric', // 'metric' or 'imperial'
    language: 'en',
    showTutorial: true,
    soundEnabled: false, // For potential future sound effects
    autoSave: true,
    saveInterval: 60000 // Auto-save every minute
};

// Control Mappings
export const Controls = {
    mouse: {
        rotate: 0, // Left button
        pan: 2, // Right button
        zoom: 'wheel'
    },
    keyboard: {
        pause: ' ',
        resetView: 'r',
        toggleAxes: 'a',
        toggleRings: 'i',
        toggleMoons: 'm',
        toggleOrbits: 'o',
        toggleMagnetosphere: 'g',
        toggleLabels: 'l',
        speedUp: '+',
        speedDown: '-',
        focusMoon1: '1',
        focusMoon2: '2',
        focusMoon3: '3',
        focusMoon4: '4',
        focusMoon5: '5'
    },
    touch: {
        rotateFingers: 1,
        zoomFingers: 2,
        panFingers: 3
    }
};

// Animation Timing
export const AnimationTiming = {
    panelTransition: 300, // milliseconds
    moonHoverDelay: 100,
    cameraTransition: 1000,
    uiUpdateInterval: 100, // Update UI stats every 100ms
    orbitUpdateInterval: 16 // ~60fps
};

// Default Values for Controls
export const ControlDefaults = {
    timeSpeed: {
        min: -2,
        max: 3,
        default: 0,
        step: 0.1
    },
    distanceScale: {
        min: 0.3,
        max: 2,
        default: 1,
        step: 0.1
    },
    moonScale: {
        min: 1,
        max: 5,
        default: 2,
        step: 0.5
    },
    ringShine: {
        min: 0,
        max: 1,
        default: 0.7,
        step: 0.1
    }
};

// Export functions to get/set settings
export function getSetting(category, key) {
    const settings = {
        simulation: SimulationState,
        display: DisplaySettings,
        camera: CameraState,
        ui: UIState,
        touch: TouchState,
        performance: PerformanceSettings,
        preferences: UserPreferences
    };
    
    return settings[category]?.[key];
}

export function setSetting(category, key, value) {
    const settings = {
        simulation: SimulationState,
        display: DisplaySettings,
        camera: CameraState,
        ui: UIState,
        touch: TouchState,
        performance: PerformanceSettings,
        preferences: UserPreferences
    };
    
    if (settings[category] && key in settings[category]) {
        settings[category][key] = value;
        
        // Save to localStorage if autosave is enabled
        if (UserPreferences.autoSave && category === 'preferences') {
            savePreferences();
        }
        
        return true;
    }
    
    return false;
}

// Save/Load user preferences
export function savePreferences() {
    try {
        const prefs = {
            display: DisplaySettings,
            camera: {
                radius: CameraState.radius,
                theta: CameraState.theta,
                phi: CameraState.phi
            },
            preferences: UserPreferences
        };
        localStorage.setItem('uranusSimulationPrefs', JSON.stringify(prefs));
        return true;
    } catch (e) {
        console.warn('Could not save preferences:', e);
        return false;
    }
}

export function loadPreferences() {
    try {
        const saved = localStorage.getItem('uranusSimulationPrefs');
        if (saved) {
            const prefs = JSON.parse(saved);
            
            // Apply saved display settings
            if (prefs.display) {
                Object.assign(DisplaySettings, prefs.display);
            }
            
            // Apply saved camera settings
            if (prefs.camera) {
                CameraState.radius = prefs.camera.radius || CameraState.radius;
                CameraState.theta = prefs.camera.theta || CameraState.theta;
                CameraState.phi = prefs.camera.phi || CameraState.phi;
            }
            
            // Apply saved preferences
            if (prefs.preferences) {
                Object.assign(UserPreferences, prefs.preferences);
            }
            
            return true;
        }
    } catch (e) {
        console.warn('Could not load preferences:', e);
    }
    return false;
}

// Reset functions
export function resetSimulation() {
    SimulationState.simulationTime = 0;
    SimulationState.timeSpeed = 1;
    SimulationState.isPaused = false;
}

export function resetCamera() {
    CameraState.radius = 100;
    CameraState.theta = 0;
    CameraState.phi = Math.PI / 3;
    CameraState.target = { x: 0, y: 0, z: 0 };
}

export function resetDisplay() {
    DisplaySettings.showRings = true;
    DisplaySettings.showMoons = true;
    DisplaySettings.showOrbits = true;
    DisplaySettings.showMagnetosphere = false;
    DisplaySettings.showLabels = true;
    DisplaySettings.showAxes = false;
    DisplaySettings.distanceScale = 1.0;
    DisplaySettings.moonScale = 2.0;
    DisplaySettings.ringShine = 0.7;
}

// Export all settings as a single object for convenience
export default {
    SimulationState,
    DisplaySettings,
    CameraState,
    UIState,
    TouchState,
    PerformanceSettings,
    QualityPresets,
    UserPreferences,
    Controls,
    AnimationTiming,
    ControlDefaults,
    getSetting,
    setSetting,
    savePreferences,
    loadPreferences,
    resetSimulation,
    resetCamera,
    resetDisplay
};
