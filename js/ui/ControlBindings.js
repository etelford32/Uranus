/**
 * ControlBindings - Connects UI controls to simulation
 */

import { SimulationState, DisplaySettings } from '../config/settings.js';

export default class ControlBindings {
    constructor(simulation) {
        this.simulation = simulation;
        this.controls = {};
        this.listeners = [];
    }
    
    /**
     * Initialize control bindings
     */
    init() {
        this.cacheControls();
        this.bindTimeControls();
        this.bindDisplayControls();
        this.bindScaleControls();
        this.bindButtonControls();
    }
    
    /**
     * Cache control elements
     */
    cacheControls() {
        this.controls = {
            // Time controls
            timeSpeed: document.getElementById('timeSpeed'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            
            // Display toggles
            showRings: document.getElementById('showRings'),
            showMoons: document.getElementById('showMoons'),
            showOrbits: document.getElementById('showOrbits'),
            showMagnetosphere: document.getElementById('showMagnetosphere'),
            showLabels: document.getElementById('showLabels'),
            showAxes: document.getElementById('showAxes'),
            
            // Scale controls
            distanceScale: document.getElementById('distanceScale'),
            moonScale: document.getElementById('moonScale'),
            ringShine: document.getElementById('ringShine'),
            
            // Value displays
            timeSpeedValue: document.getElementById('timeSpeedValue'),
            distanceValue: document.getElementById('distanceValue'),
            moonSizeValue: document.getElementById('moonSizeValue'),
            ringShineValue: document.getElementById('ringShineValue')
        };
    }
    
    /**
     * Bind time-related controls
     */
    bindTimeControls() {
        // Time speed slider
        if (this.controls.timeSpeed) {
            const handler = (e) => {
                const value = parseFloat(e.target.value);
                this.updateTimeSpeed(value);
            };
            
            this.controls.timeSpeed.addEventListener('input', handler);
            this.listeners.push({ element: this.controls.timeSpeed, type: 'input', handler });
        }
        
        // Pause button
        if (this.controls.pauseBtn) {
            const handler = () => {
                this.simulation.togglePause();
                this.updatePauseButton();
            };
            
            this.controls.pauseBtn.addEventListener('click', handler);
            this.listeners.push({ element: this.controls.pauseBtn, type: 'click', handler });
        }
        
        // Reset button
        if (this.controls.resetBtn) {
            const handler = () => {
                this.simulation.resetView();
            };
            
            this.controls.resetBtn.addEventListener('click', handler);
            this.listeners.push({ element: this.controls.resetBtn, type: 'click', handler });
        }
    }
    
    /**
     * Bind display toggle controls
     */
    bindDisplayControls() {
        const toggles = [
            { control: 'showRings', component: 'rings' },
            { control: 'showMoons', component: 'moons' },
            { control: 'showOrbits', component: 'orbits' },
            { control: 'showMagnetosphere', component: 'magnetosphere' },
            { control: 'showLabels', component: 'labels' },
            { control: 'showAxes', component: 'axes' }
        ];
        
        toggles.forEach(({ control, component }) => {
            if (this.controls[control]) {
                const handler = (e) => {
                    DisplaySettings[control] = e.target.checked;
                    this.simulation.toggleComponent(component);
                    this.updateQuickToggle(control, e.target.checked);
                };
                
                this.controls[control].addEventListener('change', handler);
                this.listeners.push({ element: this.controls[control], type: 'change', handler });
            }
        });
    }
    
    /**
     * Bind scale controls
     */
    bindScaleControls() {
        // Distance scale
        if (this.controls.distanceScale) {
            const handler = (e) => {
                const value = parseFloat(e.target.value);
                DisplaySettings.distanceScale = value;
                this.simulation.updateDistanceScale(value);
                this.updateValueDisplay('distanceValue', `${value.toFixed(1)}x`);
            };
            
            this.controls.distanceScale.addEventListener('input', handler);
            this.listeners.push({ element: this.controls.distanceScale, type: 'input', handler });
        }
        
        // Moon scale
        if (this.controls.moonScale) {
            const handler = (e) => {
                const value = parseFloat(e.target.value);
                DisplaySettings.moonScale = value;
                this.simulation.updateMoonScale(value);
                this.updateValueDisplay('moonSizeValue', `${value}x`);
            };
            
            this.controls.moonScale.addEventListener('input', handler);
            this.listeners.push({ element: this.controls.moonScale, type: 'input', handler });
        }
        
        // Ring shine
        if (this.controls.ringShine) {
            const handler = (e) => {
                const value = parseFloat(e.target.value);
                DisplaySettings.ringShine = value;
                this.simulation.updateRingShine(value);
                this.updateValueDisplay('ringShineValue', `${Math.round(value * 100)}%`);
            };
            
            this.controls.ringShine.addEventListener('input', handler);
            this.listeners.push({ element: this.controls.ringShine, type: 'input', handler });
        }
    }
    
    /**
     * Bind button controls
     */
    bindButtonControls() {
        // Quick toggle buttons are handled separately
        this.bindQuickToggles();
        
        // Additional button controls can be added here
    }
    
    /**
     * Bind quick toggle buttons
     */
    bindQuickToggles() {
        const quickToggles = {
            quickRings: 'showRings',
            quickMoons: 'showMoons',
            quickOrbits: 'showOrbits',
            quickMag: 'showMagnetosphere',
            quickLabels: 'showLabels',
            quickAxes: 'showAxes'
        };
        
        Object.entries(quickToggles).forEach(([buttonId, checkboxId]) => {
            const button = document.getElementById(buttonId);
            const checkbox = this.controls[checkboxId];
            
            if (button && checkbox) {
                const handler = () => {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                };
                
                button.addEventListener('click', handler);
                this.listeners.push({ element: button, type: 'click', handler });
            }
        });
    }
    
    /**
     * Update time speed
     */
    updateTimeSpeed(value) {
        let speed;
        let displayText;
        
        if (value < 0) {
            speed = Math.pow(10, value);
            displayText = `${(speed * 3600).toFixed(1)} sec/sec`;
        } else if (value === 0) {
            speed = 1;
            displayText = '1 hour/sec';
        } else {
            speed = Math.pow(10, value);
            displayText = `${speed.toFixed(1)} hours/sec`;
        }
        
        SimulationState.timeSpeed = speed;
        this.updateValueDisplay('timeSpeedValue', displayText);
    }
    
    /**
     * Update pause button text
     */
    updatePauseButton() {
        if (this.controls.pauseBtn) {
            this.controls.pauseBtn.textContent = SimulationState.isPaused ? '▶ Play' : '⏸ Pause';
        }
    }
    
    /**
     * Update value display
     */
    updateValueDisplay(elementId, value) {
        if (this.controls[elementId]) {
            this.controls[elementId].textContent = value;
        }
    }
    
    /**
     * Update quick toggle button state
     */
    updateQuickToggle(controlName, isActive) {
        const mapping = {
            showRings: 'quickRings',
            showMoons: 'quickMoons',
            showOrbits: 'quickOrbits',
            showMagnetosphere: 'quickMag',
            showLabels: 'quickLabels',
            showAxes: 'quickAxes'
        };
        
        const buttonId = mapping[controlName];
        if (buttonId) {
            const button = document.getElementById(buttonId);
            if (button) {
                button.classList.toggle('active', isActive);
            }
        }
        
        // Special handling for axes
        if (controlName === 'showAxes') {
            const axisHelper = document.querySelector('.axis-helper');
            if (axisHelper) {
                axisHelper.style.display = isActive ? 'block' : 'none';
            }
        }
    }
    
    /**
     * Set control value programmatically
     */
    setControlValue(controlName, value) {
        const control = this.controls[controlName];
        if (!control) return;
        
        if (control.type === 'checkbox') {
            control.checked = value;
        } else {
            control.value = value;
        }
        
        // Trigger change/input event
        const eventType = control.type === 'checkbox' ? 'change' : 'input';
        control.dispatchEvent(new Event(eventType));
    }
    
    /**
     * Get control value
     */
    getControlValue(controlName) {
        const control = this.controls[controlName];
        if (!control) return null;
        
        if (control.type === 'checkbox') {
            return control.checked;
        } else {
            return parseFloat(control.value);
        }
    }
    
    /**
     * Enable/disable all controls
     */
    setEnabled(enabled) {
        Object.values(this.controls).forEach(control => {
            if (control && control.disabled !== undefined) {
                control.disabled = !enabled;
            }
        });
        
        // Also handle quick toggle buttons
        const quickButtons = ['quickRings', 'quickMoons', 'quickOrbits', 'quickMag', 'quickLabels', 'quickAxes'];
        quickButtons.forEach(id => {
            const button = document.getElementById(id);
            if (button) {
                button.disabled = !enabled;
            }
        });
    }
    
    /**
     * Sync controls with current settings
     */
    syncWithSettings() {
        // Sync display toggles
        if (this.controls.showRings) this.controls.showRings.checked = DisplaySettings.showRings;
        if (this.controls.showMoons) this.controls.showMoons.checked = DisplaySettings.showMoons;
        if (this.controls.showOrbits) this.controls.showOrbits.checked = DisplaySettings.showOrbits;
        if (this.controls.showMagnetosphere) this.controls.showMagnetosphere.checked = DisplaySettings.showMagnetosphere;
        if (this.controls.showLabels) this.controls.showLabels.checked = DisplaySettings.showLabels;
        if (this.controls.showAxes) this.controls.showAxes.checked = DisplaySettings.showAxes;
        
        // Sync scale controls
        if (this.controls.distanceScale) this.controls.distanceScale.value = DisplaySettings.distanceScale;
        if (this.controls.moonScale) this.controls.moonScale.value = DisplaySettings.moonScale;
        if (this.controls.ringShine) this.controls.ringShine.value = DisplaySettings.ringShine;
        
        // Update displays
        this.updateValueDisplay('distanceValue', `${DisplaySettings.distanceScale.toFixed(1)}x`);
        this.updateValueDisplay('moonSizeValue', `${DisplaySettings.moonScale}x`);
        this.updateValueDisplay('ringShineValue', `${Math.round(DisplaySettings.ringShine * 100)}%`);
        
        // Update pause button
        this.updatePauseButton();
        
        // Update quick toggles
        Object.keys(DisplaySettings).forEach(key => {
            if (key.startsWith('show')) {
                this.updateQuickToggle(key, DisplaySettings[key]);
            }
        });
    }
    
    /**
     * Reset controls to defaults
     */
    resetControls() {
        // Reset time speed
        if (this.controls.timeSpeed) {
            this.controls.timeSpeed.value = 0;
            this.updateTimeSpeed(0);
        }
        
        // Reset scales to defaults
        this.setControlValue('distanceScale', 1);
        this.setControlValue('moonScale', 2);
        this.setControlValue('ringShine', 0.7);
        
        // Reset display toggles
        this.setControlValue('showRings', true);
        this.setControlValue('showMoons', true);
        this.setControlValue('showOrbits', true);
        this.setControlValue('showMagnetosphere', false);
        this.setControlValue('showLabels', true);
        this.setControlValue('showAxes', false);
    }
    
    /**
     * Dispose
     */
    dispose() {
        // Remove all event listeners
        this.listeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
        
        // Clear arrays
        this.listeners = [];
        
        // Clear references
        this.controls = {};
        this.simulation = null;
    }
}
