/**
 * UIManager - Enhanced UI controller
 * Improvements:
 * - Added event listener management with proper cleanup on dispose.
 * - Replaced alert with custom modal for help dialog (better UX).
 * - Added tooltips and ARIA labels for accessibility.
 * - Implemented localStorage persistence for settings.
 * - Debounced slider inputs for performance.
 * - Added keyboard shortcuts for common actions.
 * - Responsive design hooks (via CSS classes, assuming CSS updates).
 * - Visual feedback enhancements (e.g., active states, transitions).
 * - Batched UI updates using requestAnimationFrame.
 * - Error handling for DOM operations.
 * - Added fullscreen toggle and theme switcher.
 */

import { UIState, DisplaySettings } from '../config/settings.js';
import { HELP_TEXT } from '../config/constants.js';

export default class UIManager {
    constructor() {
        this.panels = {};
        this.controls = {};
        this.state = UIState;
        this.eventListeners = new Map(); // For cleanup
        this.debounceTimers = new Map(); // For debouncing
        this.updateQueue = []; // For batched updates
        this.isBatchedUpdate = false;
        this.modal = null; // Help modal
    }
    
    /**
     * Initialize UI manager
     */
    init() {
        try {
            this.cacheDOMElements();
            this.createHelpModal();
            this.setupPanelToggles();
            this.setupQuickToggles();
            this.setupSliders();
            this.setupButtons();
            this.setupKeyboardShortcuts();
            this.loadSettingsFromStorage();
            this.updateUIFromSettings();
            this.scheduleUpdate(); // Initial update
        } catch (error) {
            console.error('UIManager init error:', error);
            this.showError('Failed to initialize UI');
        }
    }
    
    /**
     * Cache DOM elements for performance with error checking
     */
    cacheDOMElements() {
        const elements = {
            // Panels
            info: 'info-panel',
            controls: 'controls-panel',
            stats: 'stats-panel',
            coordinates: 'coordinates-panel',
            moonInfo: 'moon-info'
        };
        
        this.panels = {};
        for (const [key, id] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) {
                this.panels[key] = el;
                // Add ARIA for accessibility
                el.setAttribute('role', 'region');
                el.setAttribute('aria-label', `${key} panel`);
            }
        }
        
        // Controls - expanded with tooltips
        const controlElements = {
            // Sliders
            timeSpeed: { id: 'timeSpeed', tooltip: 'Adjust simulation time speed' },
            distanceScale: { id: 'distanceScale', tooltip: 'Scale orbital distances' },
            moonScale: { id: 'moonScale', tooltip: 'Scale moon sizes' },
            ringShine: { id: 'ringShine', tooltip: 'Adjust ring brightness' },
            
            // Checkboxes
            showRings: { id: 'showRings', tooltip: 'Toggle ring visibility' },
            showMoons: { id: 'showMoons', tooltip: 'Toggle moon visibility' },
            showOrbits: { id: 'showOrbits', tooltip: 'Toggle orbit paths' },
            showMagnetosphere: { id: 'showMagnetosphere', tooltip: 'Toggle magnetosphere' },
            showLabels: { id: 'showLabels', tooltip: 'Toggle labels' },
            showAxes: { id: 'showAxes', tooltip: 'Toggle coordinate axes' },
            
            // Buttons
            pauseBtn: { id: 'pauseBtn', tooltip: 'Pause/resume simulation' },
            resetBtn: { id: 'resetBtn', tooltip: 'Reset simulation' },
            helpBtn: { id: 'help-button', tooltip: 'Show help' },
            fullscreenBtn: { id: 'fullscreenBtn', tooltip: 'Toggle fullscreen' }, // New
            themeBtn: { id: 'themeBtn', tooltip: 'Switch theme' }, // New
            
            // Quick toggles
            quickRings: { id: 'quickRings', tooltip: 'Quick toggle rings' },
            quickMoons: { id: 'quickMoons', tooltip: 'Quick toggle moons' },
            quickOrbits: { id: 'quickOrbits', tooltip: 'Quick toggle orbits' },
            quickMag: { id: 'quickMag', tooltip: 'Quick toggle magnetosphere' },
            quickLabels: { id: 'quickLabels', tooltip: 'Quick toggle labels' },
            quickAxes: { id: 'quickAxes', tooltip: 'Quick toggle axes' },
            
            // Value displays
            timeSpeedValue: 'timeSpeedValue',
            distanceValue: 'distanceValue',
            moonSizeValue: 'moonSizeValue',
            ringShineValue: 'ringShineValue',
            
            // Stats displays
            fps: 'fps',
            simDay: 'simDay',
            rotation: 'rotation',
            yearProgress: 'yearProgress',
            
            // Camera info
            camX: 'camX',
            camY: 'camY',
            camZ: 'camZ',
            camDist: 'camDist',
            camAzimuth: 'camAzimuth',
            camElevation: 'camElevation'
        };
        
        this.controls = {};
        for (const [key, data] of Object.entries(controlElements)) {
            const el = typeof data === 'string' ? document.getElementById(data) : document.getElementById(data.id);
            if (el) {
                this.controls[key] = el;
                // Add tooltip if provided
                if (data.tooltip) {
                    el.setAttribute('title', data.tooltip);
                    el.setAttribute('aria-label', data.tooltip);
                }
                // Responsive class
                el.classList.add('ui-responsive');
            }
        }
        
        // Axis helper
        this.axisHelper = document.querySelector('.axis-helper');
        if (this.axisHelper) {
            this.axisHelper.setAttribute('aria-hidden', 'true');
        }
    }
    
    /**
     * Create custom help modal
     */
    createHelpModal() {
        this.modal = document.createElement('div');
        this.modal.id = 'help-modal';
        this.modal.className = 'modal';
        this.modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <div id="help-text">${HELP_TEXT}</div>
            </div>
        `;
        document.body.appendChild(this.modal);
        
        // Setup close event
        const closeBtn = this.modal.querySelector('.close');
        const handleClose = () => {
            this.modal.style.display = 'none';
        };
        closeBtn.addEventListener('click', handleClose);
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) handleClose();
        });
        this.eventListeners.set('helpModalClose', { el: closeBtn, handler: handleClose });
        this.eventListeners.set('helpModalBg', { el: this.modal, handler: handleClose });
    }
    
    /**
     * Setup panel minimize/maximize toggles with transitions
     */
    setupPanelToggles() {
        document.querySelectorAll('.minimize-btn').forEach(btn => {
            const handleToggle = (e) => {
                e.stopPropagation();
                const panel = btn.closest('.ui-panel');
                if (!panel) return;
                
                const isMinimized = panel.classList.toggle('minimized');
                btn.textContent = isMinimized ? '+' : '−';
                panel.style.transition = 'all 0.2s ease'; // Smooth transition
                
                // Update state
                if (panel.id) {
                    this.state.panelsMinimized[panel.id] = isMinimized;
                    this.saveSettingsToStorage();
                }
            };
            
            btn.addEventListener('click', handleToggle);
            this.eventListeners.set(`panelToggle_${btn.id || btn.className}`, { el: btn, handler: handleToggle });
        });
    }
    
    /**
     * Setup quick toggle buttons with visual feedback
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
                const handleToggle = () => {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                    button.classList.toggle('active', checkbox.checked);
                    button.style.transition = 'background-color 0.2s ease';
                    this.saveSettingsToStorage();
                };
                
                button.addEventListener('click', handleToggle);
                this.eventListeners.set(`quickToggle_${buttonId}`, { el: button, handler: handleToggle });
            }
        });
    }
    
    /**
     * Setup sliders with debouncing
     */
    setupSliders() {
        ['timeSpeed', 'distanceScale', 'moonScale', 'ringShine'].forEach(sliderId => {
            const slider = this.controls[sliderId];
            if (!slider) return;
            
            const handleChange = (e) => {
                const value = parseFloat(e.target.value);
                // Dispatch custom event for simulation to handle
                document.dispatchEvent(new CustomEvent(`${sliderId}Change`, { detail: value }));
                
                // Debounce update and save
                clearTimeout(this.debounceTimers.get(sliderId));
                this.debounceTimers.set(sliderId, setTimeout(() => {
                    this.updateSliderDisplay(sliderId === 'timeSpeed' ? 'timeSpeedValue' : `${sliderId}Value`, value);
                    this.saveSettingsToStorage();
                }, 100));
            };
            
            slider.addEventListener('input', handleChange);
            this.eventListeners.set(`slider_${sliderId}`, { el: slider, handler: handleChange });
        });
    }
    
    /**
     * Setup buttons
     */
    setupButtons() {
        // Pause/Reset
        if (this.controls.pauseBtn) {
            const handlePause = () => {
                document.dispatchEvent(new CustomEvent('togglePause'));
                this.controls.pauseBtn.textContent = UIState.isPaused ? '▶️ Resume' : '⏸️ Pause';
            };
            this.controls.pauseBtn.addEventListener('click', handlePause);
            this.eventListeners.set('pauseBtn', { el: this.controls.pauseBtn, handler: handlePause });
        }
        
        if (this.controls.resetBtn) {
            const handleReset = () => document.dispatchEvent(new CustomEvent('reset'));
            this.controls.resetBtn.addEventListener('click', handleReset);
            this.eventListeners.set('resetBtn', { el: this.controls.resetBtn, handler: handleReset });
        }
        
        if (this.controls.helpBtn) {
            const handleHelp = () => this.showHelp();
            this.controls.helpBtn.addEventListener('click', handleHelp);
            this.eventListeners.set('helpBtn', { el: this.controls.helpBtn, handler: handleHelp });
        }
        
        // New: Fullscreen
        if (this.controls.fullscreenBtn) {
            const handleFullscreen = () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                    this.controls.fullscreenBtn.textContent = '❌ Exit Fullscreen';
                } else {
                    document.exitFullscreen();
                    this.controls.fullscreenBtn.textContent = '⛶ Fullscreen';
                }
            };
            this.controls.fullscreenBtn.addEventListener('click', handleFullscreen);
            document.addEventListener('fullscreenchange', () => {
                this.controls.fullscreenBtn.textContent = document.fullscreenElement ? '❌ Exit Fullscreen' : '⛶ Fullscreen';
            });
            this.eventListeners.set('fullscreenBtn', { el: this.controls.fullscreenBtn, handler: handleFullscreen });
        }
        
        // New: Theme switcher
        if (this.controls.themeBtn) {
            const handleTheme = () => {
                document.body.classList.toggle('dark-theme');
                const isDark = document.body.classList.contains('dark-theme');
                this.controls.themeBtn.textContent = isDark ? '☀️ Light' : '🌙 Dark';
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
            };
            // Load initial theme
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-theme');
                this.controls.themeBtn.textContent = '☀️ Light';
            }
            this.controls.themeBtn.addEventListener('click', handleTheme);
            this.eventListeners.set('themeBtn', { el: this.controls.themeBtn, handler: handleTheme });
        }
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        const handleKeydown = (e) => {
            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    document.dispatchEvent(new CustomEvent('togglePause'));
                    break;
                case 'r':
                case 'R':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        document.dispatchEvent(new CustomEvent('reset'));
                    }
                    break;
                case '?':
                case 'h':
                case 'H':
                    this.showHelp();
                    break;
                case 'f':
                case 'F':
                    if (e.altKey) {
                        if (this.controls.fullscreenBtn) this.controls.fullscreenBtn.click();
                    }
                    break;
            }
        };
        
        document.addEventListener('keydown', handleKeydown);
        this.eventListeners.set('keyboard', { el: document, handler: handleKeydown });
        
        // Announce shortcuts
        console.log('Keyboard shortcuts: Space=Pause, Ctrl+R=Reset, ?=Help, Alt+F=Fullscreen');
    }
    
    /**
     * Show help modal
     */
    showHelp() {
        if (this.modal) {
            this.modal.style.display = 'block';
            this.modal.querySelector('#help-text').innerHTML = HELP_TEXT.replace(/\n/g, '<br>');
        }
    }
    
    /**
     * Queue update for batched RAF updates
     */
    queueUpdate(updater) {
        this.updateQueue.push(updater);
        if (!this.isBatchedUpdate) {
            this.scheduleUpdate();
        }
    }
    
    /**
     * Schedule batched update
     */
    scheduleUpdate() {
        if (this.isBatchedUpdate) return;
        this.isBatchedUpdate = true;
        requestAnimationFrame(() => {
            while (this.updateQueue.length > 0) {
                const updater = this.updateQueue.shift();
                updater();
            }
            this.isBatchedUpdate = false;
        });
    }
    
    /**
     * Update UI from current settings
     */
    updateUIFromSettings() {
        // Update checkboxes and quick toggles
        const checkboxes = ['showRings', 'showMoons', 'showOrbits', 'showMagnetosphere', 'showLabels', 'showAxes'];
        checkboxes.forEach(id => {
            const checkbox = this.controls[id];
            const quick = this.controls[`quick${id.charAt(0).toUpperCase() + id.slice(1)}`];
            if (checkbox) {
                checkbox.checked = DisplaySettings[id];
                if (quick) quick.classList.toggle('active', DisplaySettings[id]);
            }
        });
        
        // Update axis helper
        if (this.axisHelper) {
            this.axisHelper.style.display = DisplaySettings.showAxes ? 'block' : 'none';
        }
        
        // Update sliders
        const sliders = { distanceScale: 'distanceValue', moonScale: 'moonSizeValue', ringShine: 'ringShineValue' };
        Object.entries(sliders).forEach(([sliderId, displayId]) => {
            const slider = this.controls[sliderId];
            if (slider) {
                slider.value = DisplaySettings[sliderId];
                this.updateSliderDisplay(displayId, DisplaySettings[sliderId]);
            }
        });
        
        // Pause button
        if (this.controls.pauseBtn) {
            this.controls.pauseBtn.textContent = UIState.isPaused ? '▶️ Resume' : '⏸️ Pause';
        }
    }
    
    /**
     * Update slider display value
     */
    updateSliderDisplay(elementId, value) {
        this.queueUpdate(() => {
            const display = this.controls[elementId];
            if (display) {
                let text = value;
                if (elementId === 'distanceValue' || elementId === 'moonSizeValue') {
                    text += 'x';
                } else if (elementId === 'ringShineValue') {
                    text = Math.round(value * 100) + '%';
                }
                display.textContent = text;
            }
        });
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
     * Update camera info display (batched)
     */
    updateCameraInfo(info) {
        this.queueUpdate(() => {
            const updates = {
                camX: info.position.x.toFixed(1),
                camY: info.position.y.toFixed(1),
                camZ: info.position.z.toFixed(1),
                camDist: info.radius.toFixed(1),
                camAzimuth: info.theta.toFixed(1),
                camElevation: info.phi.toFixed(1)
            };
            Object.entries(updates).forEach(([key, val]) => {
                const el = this.controls[key];
                if (el) el.textContent = val;
            });
        });
    }
    
    /**
     * Update stats display (batched)
     */
    updateStats(stats) {
        this.queueUpdate(() => {
            const updates = {
                fps: stats.fps,
                simDay: stats.simDay,
                rotation: stats.rotation,
                yearProgress: stats.yearProgress
            };
            Object.entries(updates).forEach(([key, val]) => {
                const el = this.controls[key];
                if (el) el.textContent = val;
            });
        });
    }
    
    /**
     * Show/hide moon info panel
     */
    showMoonInfo(moonData, visible = true) {
        const panel = this.panels.moonInfo;
        if (!panel) return;
        
        this.queueUpdate(() => {
            if (visible && moonData) {
                const nameEl = document.getElementById('moon-name');
                const detailsEl = document.getElementById('moon-details');
                const posEl = document.getElementById('moon-position');
                if (nameEl) nameEl.textContent = moonData.name;
                if (detailsEl) detailsEl.textContent = moonData.info;
                if (posEl) posEl.textContent = moonData.position;
                panel.classList.add('visible');
                panel.style.transition = 'opacity 0.3s ease';
            } else {
                panel.classList.remove('visible');
            }
        });
    }
    
    /**
     * Show loading screen
     */
    showLoading(message = 'Initializing Uranus System...') {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'block';
            const div = loading.querySelector('div') || document.createElement('div');
            div.textContent = message;
            loading.appendChild(div);
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
                <div style="color: #ff6b6b; padding: 20px; text-align: center;">
                    <div style="font-size: 24px; margin-bottom: 10px;">⚠️ Error</div>
                    <div style="font-size: 16px;">${message}</div>
                    <button id="error-retry" style="margin-top: 10px; padding: 5px 10px;">Retry</button>
                </div>
            `;
            loading.style.display = 'block';
            
            // Retry button
            const retryBtn = document.getElementById('error-retry');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    this.hideLoading();
                    document.dispatchEvent(new CustomEvent('retryInit'));
                });
                this.eventListeners.set('errorRetry', { el: retryBtn, handler: () => {
                    this.hideLoading();
                    document.dispatchEvent(new CustomEvent('retryInit'));
                } });
            }
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
            this.saveSettingsToStorage();
        }
    }
    
    /**
     * Get control value
     */
    getControlValue(controlId) {
        const control = this.controls[controlId];
        if (!control) return null;
        
        return control.type === 'checkbox' ? control.checked : parseFloat(control.value);
    }
    
    /**
     * Set control value
     */
    setControlValue(controlId, value) {
        const control = this.controls[controlId];
        if (!control) return;
        
        if (control.type === 'checkbox') {
            control.checked = !!value;
        } else {
            control.value = value;
        }
        // Trigger change if needed
        control.dispatchEvent(new Event('input'));
    }
    
    /**
     * Enable/disable controls
     */
    setControlsEnabled(enabled) {
        Object.values(this.controls).forEach(control => {
            if (control && control.disabled !== undefined) {
                control.disabled = !enabled;
                control.style.opacity = enabled ? '1' : '0.5';
            }
        });
    }
    
    /**
     * Save settings to localStorage
     */
    saveSettingsToStorage() {
        const settings = {
            ...DisplaySettings,
            panelsMinimized: this.state.panelsMinimized,
            theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light'
        };
        localStorage.setItem('uranusSettings', JSON.stringify(settings));
    }
    
    /**
     * Load settings from localStorage
     */
    loadSettingsFromStorage() {
        const saved = localStorage.getItem('uranusSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            Object.assign(DisplaySettings, settings);
            Object.assign(this.state.panelsMinimized, settings.panelsMinimized || {});
            
            // Apply theme
            if (settings.theme === 'dark') {
                document.body.classList.add('dark-theme');
            }
            
            // Re-apply minimized panels
            Object.entries(this.state.panelsMinimized).forEach(([id, minimized]) => {
                const panel = document.getElementById(id);
                if (panel && minimized) {
                    panel.classList.add('minimized');
                    const btn = panel.querySelector('.minimize-btn');
                    if (btn) btn.textContent = '+';
                }
            });
        }
    }
    
    /**
     * Dispose with cleanup
     */
    dispose() {
        // Remove event listeners
        this.eventListeners.forEach(({ el, handler }) => {
            el.removeEventListener(el.tagName === 'DOCUMENT' ? 'keydown' : el.type || 'click', handler);
        });
        this.eventListeners.clear();
        
        // Clear debounces
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        
        // Remove modal
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        
        // Clear references
        this.panels = {};
        this.controls = {};
        this.state = null;
        this.updateQueue = [];
        
        console.log('🗑️ UIManager disposed');
    }
}
