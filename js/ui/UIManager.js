/**
 * UIManager - Main UI controller
 */

import { UIState, DisplaySettings } from '../config/settings.js';
import { HELP_TEXT } from '../config/constants.js';

export default class UIManager {
    constructor() {
        this.panels = {};
        this.controls = {};
        this.state = UIState;
    }
    
    /**
     * Initialize UI manager
     */
    init() {
        this.cacheDOMElements();
        this.setupPanelToggles();
        this.setupQuickToggles();
        this.setupHelpButton();
        this.updateUIFromSettings();
    }
    
    /**
     * Cache DOM elements for performance
     */
    cacheDOMElements() {
        // Panels
        this.panels = {
            info: document.getElementById('info-panel'),
            controls: document.getElementById('controls-panel'),
            stats: document.getElementById('stats-panel'),
            coordinates: document.getElementById('coordinates-panel'),
            moonInfo: document.getElementById('moon-info')
        };
        
        // Controls
        this.controls = {
            // Sliders
            timeSpeed: document.getElementById('timeSpeed'),
            distanceScale: document.getElementById('distanceScale'),
            moonScale: document.getElementById('moonScale'),
            ringShine: document.getElementById('ringShine'),
            
            // Checkboxes
            showRings: document.getElementById('showRings'),
            showMoons: document.getElementById('showMoons'),
            showOrbits: document.getElementById('showOrbits'),
            showMagnetosphere: document.getElementById('showMagnetosphere'),
            showLabels: document.getElementById('showLabels'),
            showAxes: document.getElementById('showAxes'),
            
            // Buttons
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            helpBtn: document.getElementById('help-button'),
            
            // Quick toggles
            quickRings: document.getElementById('quickRings'),
            quickMoons: document.getElementById('quickMoons'),
            quickOrbits: document.getElementById('quickOrbits'),
            quickMag: document.getElementById('quickMag'),
            quickLabels: document.getElementById('quickLabels'),
            quickAxes: document.getElementById('quickAxes'),
            
            // Value displays
            timeSpeedValue: document.getElementById('timeSpeedValue'),
            distanceValue: document.getElementById('distanceValue'),
            moonSizeValue: document.getElementById('moonSizeValue'),
            ringShineValue: document.getElementById('ringShineValue'),
            
            // Stats displays
            fps: document.getElementById('fps'),
            simDay: document.getElementById('simDay'),
            rotation: document.getElementById('rotation'),
            yearProgress: document.getElementById('yearProgress'),
            
            // Camera info
            camX: document.getElementById('camX'),
            camY: document.getElementById('camY'),
            camZ: document.getElementById('camZ'),
            camDist: document.getElementById('camDist'),
            camAzimuth: document.getElementById('camAzimuth'),
            camElevation: document.getElementById('camElevation')
        };
        
        // Axis helper display
        this.axisHelper = document.querySelector('.axis-helper');
    }
    
    /**
     * Setup panel minimize/maximize toggles
     */
    setupPanelToggles() {
        document.querySelectorAll('.minimize-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const panel = btn.closest('.ui-panel');
                const isMinimized = panel.classList.toggle('minimized');
                btn.textContent = isMinimized ? '+' : '−';
                
                // Update state
                if (panel.id) {
                    this.state.panelsMinimized[panel.id] = isMinimized;
                }
            });
        });
    }
    
    /**
     * Setup quick toggle buttons
     */
    setupQuickToggles() {
        const toggleMap = {
            quickRings: 'showRings',
            quickMoons: 'showMoons',
            quickOrbits: 'showOrbits',
            quickMag: 'showMagnetosphere',
            quickLabels: 'showLabels',
            quickAxes: 'showAxes'
        };
        
        Object.entries(toggleMap).forEach(([buttonId, checkboxId]) => {
            const button = this.controls[buttonId];
            const checkbox = this.controls[checkboxId];
            
            if (button && checkbox) {
                button.addEventListener('click', () => {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                    button.classList.toggle('active', checkbox.checked);
                });
            }
        });
    }
    
    /**
     * Setup help button
     */
    setupHelpButton() {
        if (this.controls.helpBtn) {
            this.controls.helpBtn.addEventListener('click', () => {
                this.showHelp();
            });
        }
    }
    
    /**
     * Show help dialog
     */
    showHelp() {
        alert(HELP_TEXT);
    }
    
    /**
     * Update UI from current settings
     */
    updateUIFromSettings() {
        // Update checkboxes
        if (this.controls.showRings) {
            this.controls.showRings.checked = DisplaySettings.showRings;
            this.controls.quickRings?.classList.toggle('active', DisplaySettings.showRings);
        }
        
        if (this.controls.showMoons) {
            this.controls.showMoons.checked = DisplaySettings.showMoons;
            this.controls.quickMoons?.classList.toggle('active', DisplaySettings.showMoons);
        }
        
        if (this.controls.showOrbits) {
            this.controls.showOrbits.checked = DisplaySettings.showOrbits;
            this.controls.quickOrbits?.classList.toggle('active', DisplaySettings.showOrbits);
        }
        
        if (this.controls.showMagnetosphere) {
            this.controls.showMagnetosphere.checked = DisplaySettings.showMagnetosphere;
            this.controls.quickMag?.classList.toggle('active', DisplaySettings.showMagnetosphere);
        }
        
        if (this.controls.showLabels) {
            this.controls.showLabels.checked = DisplaySettings.showLabels;
            this.controls.quickLabels?.classList.toggle('active', DisplaySettings.showLabels);
        }
        
        if (this.controls.showAxes) {
            this.controls.showAxes.checked = DisplaySettings.showAxes;
            this.controls.quickAxes?.classList.toggle('active', DisplaySettings.showAxes);
            if (this.axisHelper) {
                this.axisHelper.style.display = DisplaySettings.showAxes ? 'block' : 'none';
            }
        }
        
        // Update sliders
        if (this.controls.distanceScale) {
            this.controls.distanceScale.value = DisplaySettings.distanceScale;
            this.updateSliderDisplay('distanceValue', DisplaySettings.distanceScale.toFixed(1) + 'x');
        }
        
        if (this.controls.moonScale) {
            this.controls.moonScale.value = DisplaySettings.moonScale;
            this.updateSliderDisplay('moonSizeValue', DisplaySettings.moonScale + 'x');
        }
        
        if (this.controls.ringShine) {
            this.controls.ringShine.value = DisplaySettings.ringShine;
            this.updateSliderDisplay('ringShineValue', Math.round(DisplaySettings.ringShine * 100) + '%');
        }
    }
    
    /**
     * Update slider display value
     */
    updateSliderDisplay(elementId, value) {
        if (this.controls[elementId]) {
            this.controls[elementId].textContent = value;
        }
    }
    
    /**
     * Update time speed display
     */
    updateTimeSpeedDisplay(value) {
        let displayText;
        
        if (value < 0) {
            const speed = Math.pow(10, value);
            displayText = `${(speed * 3600).toFixed(1)} sec/sec`;
        } else if (value === 0) {
            displayText = '1 hour/sec';
        } else {
            const speed = Math.pow(10, value);
            displayText = `${speed.toFixed(1)} hours/sec`;
        }
        
        this.updateSliderDisplay('timeSpeedValue', displayText);
    }
    
    /**
     * Update camera info display
     */
    updateCameraInfo(info) {
        if (this.controls.camX) this.controls.camX.textContent = info.position.x.toFixed(1);
        if (this.controls.camY) this.controls.camY.textContent = info.position.y.toFixed(1);
        if (this.controls.camZ) this.controls.camZ.textContent = info.position.z.toFixed(1);
        if (this.controls.camDist) this.controls.camDist.textContent = info.radius.toFixed(1);
        if (this.controls.camAzimuth) this.controls.camAzimuth.textContent = info.theta.toFixed(1);
        if (this.controls.camElevation) this.controls.camElevation.textContent = info.phi.toFixed(1);
    }
    
    /**
     * Update stats display
     */
    updateStats(stats) {
        if (this.controls.fps) this.controls.fps.textContent = stats.fps;
        if (this.controls.simDay) this.controls.simDay.textContent = stats.simDay;
        if (this.controls.rotation) this.controls.rotation.textContent = stats.rotation;
        if (this.controls.yearProgress) this.controls.yearProgress.textContent = stats.yearProgress;
    }
    
    /**
     * Show/hide moon info panel
     */
    showMoonInfo(moonData, visible = true) {
        const panel = this.panels.moonInfo;
        if (!panel) return;
        
        if (visible && moonData) {
            document.getElementById('moon-name').textContent = moonData.name;
            document.getElementById('moon-details').textContent = moonData.info;
            document.getElementById('moon-position').textContent = moonData.position;
            panel.classList.add('visible');
        } else {
            panel.classList.remove('visible');
        }
    }
    
    /**
     * Show loading screen
     */
    showLoading(message = 'Initializing Uranus System...') {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'block';
            loading.querySelector('div').textContent = message;
        }
    }
    
    /**
     * Hide loading screen
     */
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.innerHTML = `
                <div style="color: #ff6b6b;">
                    <div>⚠️ Error</div>
                    <div style="font-size: 16px; margin-top: 10px;">${message}</div>
                </div>
            `;
            loading.style.display = 'block';
        }
    }
    
    /**
     * Toggle panel visibility
     */
    togglePanel(panelId) {
        const panel = this.panels[panelId];
        if (panel) {
            const isMinimized = panel.classList.toggle('minimized');
            const btn = panel.querySelector('.minimize-btn');
            if (btn) {
                btn.textContent = isMinimized ? '+' : '−';
            }
            this.state.panelsMinimized[panelId] = isMinimized;
        }
    }
    
    /**
     * Get control value
     */
    getControlValue(controlId) {
        const control = this.controls[controlId];
        if (!control) return null;
        
        if (control.type === 'checkbox') {
            return control.checked;
        } else {
            return control.value;
        }
    }
    
    /**
     * Set control value
     */
    setControlValue(controlId, value) {
        const control = this.controls[controlId];
        if (!control) return;
        
        if (control.type === 'checkbox') {
            control.checked = value;
        } else {
            control.value = value;
        }
    }
    
    /**
     * Enable/disable controls
     */
    setControlsEnabled(enabled) {
        Object.values(this.controls).forEach(control => {
            if (control && control.disabled !== undefined) {
                control.disabled = !enabled;
            }
        });
    }
    
    /**
     * Dispose
     */
    dispose() {
        // Clear references
        this.panels = {};
        this.controls = {};
        this.state = null;
    }
}
