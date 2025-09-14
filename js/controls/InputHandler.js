/**
 * InputHandler - Manages all user input (mouse, keyboard, touch)
 */

import { Controls, TouchState } from '../config/settings.js';
import { MOONS_DATA } from '../config/constants.js';

export default class InputHandler {
    constructor(domElement, cameraController, simulation) {
        this.domElement = domElement;
        this.cameraController = cameraController;
        this.simulation = simulation;
        
        // Mouse state
        this.mouseState = {
            isDown: false,
            button: null,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0
        };
        
        // Touch state
        this.touchState = TouchState;
        
        // Raycaster for object picking
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Event listeners
        this.eventListeners = [];
        
        // Input enabled state
        this.enabled = true;
    }
    
    /**
     * Initialize input handlers
     */
    init() {
        this.setupMouseEvents();
        this.setupKeyboardEvents();
        this.setupTouchEvents();
        this.setupWheelEvents();
        this.setupContextMenu();
    }
    
    /**
     * Setup mouse events
     */
    setupMouseEvents() {
        // Mouse down
        const onMouseDown = (e) => {
            if (!this.enabled) return;
            
            this.mouseState.isDown = true;
            this.mouseState.button = e.button;
            this.mouseState.startX = e.clientX;
            this.mouseState.startY = e.clientY;
            this.mouseState.currentX = e.clientX;
            this.mouseState.currentY = e.clientY;
            
            // Set cursor
            if (e.button === Controls.mouse.rotate) {
                this.domElement.style.cursor = 'grabbing';
            } else if (e.button === Controls.mouse.pan) {
                this.domElement.style.cursor = 'move';
            }
        };
        
        // Mouse move
        const onMouseMove = (e) => {
            if (!this.enabled) return;
            
            const deltaX = e.clientX - this.mouseState.currentX;
            const deltaY = e.clientY - this.mouseState.currentY;
            
            if (this.mouseState.isDown) {
                if (this.mouseState.button === Controls.mouse.rotate) {
                    // Rotate camera
                    this.cameraController.rotate(
                        deltaX * Controls.keyboard.rotationSpeed || 0.01,
                        deltaY * Controls.keyboard.rotationSpeed || 0.01
                    );
                } else if (this.mouseState.button === Controls.mouse.pan) {
                    // Pan camera
                    this.cameraController.pan(deltaX, deltaY);
                }
            }
            
            this.mouseState.currentX = e.clientX;
            this.mouseState.currentY = e.clientY;
            
            // Update mouse position for raycasting
            this.updateMousePosition(e);
            
            // Check for moon hover
            this.checkMoonHover();
        };
        
        // Mouse up
        const onMouseUp = (e) => {
            this.mouseState.isDown = false;
            this.mouseState.button = null;
            this.domElement.style.cursor = 'grab';
        };
        
        // Add listeners
        this.domElement.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        
        // Store for cleanup
        this.eventListeners.push(
            { element: this.domElement, type: 'mousedown', handler: onMouseDown },
            { element: document, type: 'mousemove', handler: onMouseMove },
            { element: document, type: 'mouseup', handler: onMouseUp }
        );
    }
    
    /**
     * Setup keyboard events
     */
    setupKeyboardEvents() {
        const onKeyDown = (e) => {
            if (!this.enabled) return;
            
            const key = e.key.toLowerCase();
            
            switch(key) {
                case Controls.keyboard.pause:
                    e.preventDefault();
                    this.simulation.togglePause();
                    break;
                    
                case Controls.keyboard.resetView:
                    this.simulation.resetView();
                    break;
                    
                case Controls.keyboard.toggleAxes:
                    this.simulation.toggleComponent('axes');
                    break;
                    
                case Controls.keyboard.toggleRings:
                    this.simulation.toggleComponent('rings');
                    break;
                    
                case Controls.keyboard.toggleMoons:
                    this.simulation.toggleComponent('moons');
                    break;
                    
                case Controls.keyboard.toggleOrbits:
                    this.simulation.toggleComponent('orbits');
                    break;
                    
                case Controls.keyboard.toggleMagnetosphere:
                    this.simulation.toggleComponent('magnetosphere');
                    break;
                    
                case Controls.keyboard.toggleLabels:
                    this.simulation.toggleComponent('labels');
                    break;
                    
                case Controls.keyboard.speedUp:
                    this.adjustTimeSpeed(1);
                    break;
                    
                case Controls.keyboard.speedDown:
                    this.adjustTimeSpeed(-1);
                    break;
                    
                // Focus on moons (1-5)
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                    const moonIndex = parseInt(key) - 1;
                    this.simulation.focusOnMoon(moonIndex);
                    break;
                    
                // Arrow keys for camera rotation
                case 'arrowleft':
                    this.cameraController.rotate(-0.05, 0);
                    break;
                case 'arrowright':
                    this.cameraController.rotate(0.05, 0);
                    break;
                case 'arrowup':
                    this.cameraController.rotate(0, -0.05);
                    break;
                case 'arrowdown':
                    this.cameraController.rotate(0, 0.05);
                    break;
            }
        };
        
        document.addEventListener('keydown', onKeyDown);
        this.eventListeners.push(
            { element: document, type: 'keydown', handler: onKeyDown }
        );
    }
    
    /**
     * Setup touch events
     */
    setupTouchEvents() {
        // Touch start
        const onTouchStart = (e) => {
            if (!this.enabled) return;
            
            const touches = e.touches;
            
            if (touches.length === 1) {
                // Single touch - rotate
                this.touchState.startX = touches[0].clientX;
                this.touchState.startY = touches[0].clientY;
                this.touchState.isTouching = true;
                this.touchState.touchCount = 1;
            } else if (touches.length === 2) {
                // Two touches - zoom
                const dx = touches[0].clientX - touches[1].clientX;
                const dy = touches[0].clientY - touches[1].clientY;
                this.touchState.startDistance = Math.sqrt(dx * dx + dy * dy);
                this.touchState.touchCount = 2;
            }
        };
        
        // Touch move
        const onTouchMove = (e) => {
            if (!this.enabled || !this.touchState.isTouching) return;
            
            e.preventDefault();
            const touches = e.touches;
            
            if (touches.length === 1 && this.touchState.touchCount === 1) {
                // Single touch - rotate
                const deltaX = touches[0].clientX - this.touchState.startX;
                const deltaY = touches[0].clientY - this.touchState.startY;
                
                this.cameraController.rotate(
                    deltaX * 0.01,
                    deltaY * 0.01
                );
                
                this.touchState.startX = touches[0].clientX;
                this.touchState.startY = touches[0].clientY;
            } else if (touches.length === 2) {
                // Two touches - zoom
                const dx = touches[0].clientX - touches[1].clientX;
                const dy = touches[0].clientY - touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                const scale = distance / this.touchState.startDistance;
                this.cameraController.zoom((1 - scale) * 0.01);
                
                this.touchState.startDistance = distance;
            }
        };
        
        // Touch end
        const onTouchEnd = (e) => {
            this.touchState.isTouching = false;
            this.touchState.touchCount = 0;
        };
        
        // Add listeners
        this.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
        this.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
        this.domElement.addEventListener('touchend', onTouchEnd);
        
        this.eventListeners.push(
            { element: this.domElement, type: 'touchstart', handler: onTouchStart },
            { element: this.domElement, type: 'touchmove', handler: onTouchMove },
            { element: this.domElement, type: 'touchend', handler: onTouchEnd }
        );
    }
    
    /**
     * Setup wheel events for zoom
     */
    setupWheelEvents() {
        const onWheel = (e) => {
            if (!this.enabled) return;
            
            e.preventDefault();
            
            // Normalize wheel delta
            const delta = e.deltaY > 0 ? 0.05 : -0.05;
            this.cameraController.zoom(delta);
        };
        
        this.domElement.addEventListener('wheel', onWheel, { passive: false });
        this.eventListeners.push(
            { element: this.domElement, type: 'wheel', handler: onWheel }
        );
    }
    
    /**
     * Setup context menu prevention
     */
    setupContextMenu() {
        const onContextMenu = (e) => {
            e.preventDefault();
        };
        
        this.domElement.addEventListener('contextmenu', onContextMenu);
        this.eventListeners.push(
            { element: this.domElement, type: 'contextmenu', handler: onContextMenu }
        );
    }
    
    /**
     * Update mouse position for raycasting
     */
    updateMousePosition(event) {
        const rect = this.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
    
    /**
     * Check for moon hover
     */
    checkMoonHover() {
        if (!this.simulation.moons) return;
        
        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.simulation.camera);
        
        // Get moon meshes
        const moonMeshes = this.simulation.moons.getMoonMeshes();
        const intersects = this.raycaster.intersectObjects(moonMeshes);
        
        // Handle hover
        const moonInfo = document.getElementById('moon-info');
        if (intersects.length > 0) {
            const moon = intersects[0].object;
            const info = this.simulation.moons.getMoonInfo(moon.name);
            
            if (info && moonInfo) {
                document.getElementById('moon-name').textContent = info.name;
                document.getElementById('moon-details').textContent = info.info;
                document.getElementById('moon-position').textContent = 
                    `Distance: ${info.distance.toFixed(2)} RU | Period: ${info.period.toFixed(2)} days`;
                moonInfo.classList.add('visible');
                
                // Change cursor
                this.domElement.style.cursor = 'pointer';
            }
        } else {
            if (moonInfo) {
                moonInfo.classList.remove('visible');
            }
            if (!this.mouseState.isDown) {
                this.domElement.style.cursor = 'grab';
            }
        }
    }
    
    /**
     * Adjust time speed
     */
    adjustTimeSpeed(direction) {
        const slider = document.getElementById('timeSpeed');
        if (slider) {
            const currentValue = parseFloat(slider.value);
            const newValue = currentValue + (direction * 0.5);
            slider.value = newValue;
            slider.dispatchEvent(new Event('input'));
        }
    }
    
    /**
     * Enable/disable input
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        this.domElement.style.pointerEvents = enabled ? 'auto' : 'none';
    }
    
    /**
     * Get current input state
     */
    getState() {
        return {
            mouse: { ...this.mouseState },
            touch: { ...this.touchState },
            enabled: this.enabled
        };
    }
    
    /**
     * Dispose of all event listeners
     */
    dispose() {
        // Remove all event listeners
        this.eventListeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
        
        // Clear arrays
        this.eventListeners = [];
        
        // Clear references
        this.domElement = null;
        this.cameraController = null;
        this.simulation = null;
        this.raycaster = null;
        this.mouse = null;
    }
}
