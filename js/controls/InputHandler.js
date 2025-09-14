/**
 * Enhanced InputHandler - Advanced input management with smooth interactions
 */

import { Controls, TouchState } from '../config/settings.js';
import { MOONS_DATA } from '../config/constants.js';

// Utility functions for smooth animations
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const lerp = (start, end, t) => start + (end - start) * t;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Gesture recognizer class
class GestureRecognizer {
    constructor() {
        this.gestures = new Map();
        this.activeGesture = null;
        this.gestureThreshold = 10; // pixels
    }
    
    addGesture(name, detector, handler) {
        this.gestures.set(name, { detector, handler });
    }
    
    processTouch(touches, prevTouches) {
        for (const [name, gesture] of this.gestures) {
            if (gesture.detector(touches, prevTouches)) {
                if (this.activeGesture !== name) {
                    this.activeGesture = name;
                }
                return gesture.handler(touches, prevTouches);
            }
        }
        this.activeGesture = null;
        return null;
    }
    
    reset() {
        this.activeGesture = null;
    }
}

// Input state manager
class InputStateManager {
    constructor() {
        this.states = new Map();
        this.history = [];
        this.maxHistory = 10;
    }
    
    setState(key, value) {
        const oldValue = this.states.get(key);
        this.states.set(key, value);
        
        // Track state changes
        if (oldValue !== value) {
            this.history.push({
                key,
                oldValue,
                newValue: value,
                timestamp: performance.now()
            });
            
            if (this.history.length > this.maxHistory) {
                this.history.shift();
            }
        }
    }
    
    getState(key) {
        return this.states.get(key);
    }
    
    getRecentChanges(timeWindow = 100) {
        const now = performance.now();
        return this.history.filter(change => 
            now - change.timestamp < timeWindow
        );
    }
}

// Main enhanced InputHandler class
export default class InputHandler {
    constructor(domElement, cameraController, simulation) {
        this.domElement = domElement;
        this.cameraController = cameraController;
        this.simulation = simulation;
        
        // Enhanced state management
        this.stateManager = new InputStateManager();
        
        // Mouse state with velocity tracking
        this.mouseState = {
            isDown: false,
            button: null,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            velocityX: 0,
            velocityY: 0,
            lastMoveTime: 0
        };
        
        // Touch state with gesture support
        this.touchState = {
            ...TouchState,
            touches: [],
            prevTouches: [],
            gestureScale: 1,
            gestureRotation: 0
        };
        
        // Gesture recognizer
        this.gestureRecognizer = new GestureRecognizer();
        
        // Raycaster with optimizations
        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.Points.threshold = 0.1;
        this.mouse = new THREE.Vector2();
        this.hoveredObject = null;
        this.selectedObject = null;
        
        // Performance optimizations
        this.throttledFunctions = new Map();
        this.debouncedFunctions = new Map();
        
        // Animation frame tracking
        this.animationFrameId = null;
        this.isAnimating = false;
        
        // Event listeners
        this.eventListeners = [];
        
        // Input enabled state
        this.enabled = true;
        
        // Inertia settings
        this.inertia = {
            enabled: true,
            damping: 0.95,
            threshold: 0.01
        };
        
        // Double-click/tap detection
        this.doubleClickTime = 300; // ms
        this.lastClickTime = 0;
        this.lastClickPosition = { x: 0, y: 0 };
        
        // Initialize performance monitoring
        this.performanceMonitor = {
            frameCount: 0,
            lastTime: performance.now(),
            fps: 60
        };
    }
    
    /**
     * Initialize input handlers
     */
    init() {
        this.setupGestures();
        this.setupMouseEvents();
        this.setupKeyboardEvents();
        this.setupTouchEvents();
        this.setupWheelEvents();
        this.setupContextMenu();
        this.setupPointerLock();
        this.startAnimationLoop();
    }
    
    /**
     * Setup gesture recognition
     */
    setupGestures() {
        // Pinch gesture
        this.gestureRecognizer.addGesture('pinch',
            (touches) => touches.length === 2,
            (touches, prevTouches) => {
                if (!prevTouches || prevTouches.length !== 2) return null;
                
                const currDist = this.getTouchDistance(touches[0], touches[1]);
                const prevDist = this.getTouchDistance(prevTouches[0], prevTouches[1]);
                
                return {
                    type: 'pinch',
                    scale: currDist / prevDist,
                    center: this.getTouchCenter(touches)
                };
            }
        );
        
        // Rotate gesture
        this.gestureRecognizer.addGesture('rotate',
            (touches) => touches.length === 2,
            (touches, prevTouches) => {
                if (!prevTouches || prevTouches.length !== 2) return null;
                
                const currAngle = this.getTouchAngle(touches[0], touches[1]);
                const prevAngle = this.getTouchAngle(prevTouches[0], prevTouches[1]);
                
                return {
                    type: 'rotate',
                    rotation: currAngle - prevAngle,
                    center: this.getTouchCenter(touches)
                };
            }
        );
        
        // Swipe gesture
        this.gestureRecognizer.addGesture('swipe',
            (touches, prevTouches) => {
                if (touches.length !== 1 || !prevTouches) return false;
                const velocity = this.getTouchVelocity(touches[0], prevTouches[0]);
                return Math.abs(velocity.x) > 2 || Math.abs(velocity.y) > 2;
            },
            (touches, prevTouches) => {
                const velocity = this.getTouchVelocity(touches[0], prevTouches[0]);
                return {
                    type: 'swipe',
                    velocity,
                    direction: this.getSwipeDirection(velocity)
                };
            }
        );
    }
    
    /**
     * Setup mouse events with enhanced features
     */
    setupMouseEvents() {
        // Mouse down with double-click detection
        const onMouseDown = (e) => {
            if (!this.enabled) return;
            
            const now = performance.now();
            const dx = e.clientX - this.lastClickPosition.x;
            const dy = e.clientY - this.lastClickPosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check for double-click
            if (now - this.lastClickTime < this.doubleClickTime && distance < 5) {
                this.handleDoubleClick(e);
            }
            
            this.lastClickTime = now;
            this.lastClickPosition = { x: e.clientX, y: e.clientY };
            
            // Update state
            this.mouseState.isDown = true;
            this.mouseState.button = e.button;
            this.mouseState.startX = e.clientX;
            this.mouseState.startY = e.clientY;
            this.mouseState.currentX = e.clientX;
            this.mouseState.currentY = e.clientY;
            
            // Update cursor with smooth transition
            this.updateCursor(e.button);
            
            // Check for object selection
            this.handleObjectSelection(e);
        };
        
        // Mouse move with velocity tracking
        const onMouseMove = this.throttle((e) => {
            if (!this.enabled) return;
            
            const now = performance.now();
            const deltaTime = now - this.mouseState.lastMoveTime;
            const deltaX = e.clientX - this.mouseState.currentX;
            const deltaY = e.clientY - this.mouseState.currentY;
            
            // Calculate velocity
            if (deltaTime > 0) {
                this.mouseState.velocityX = deltaX / deltaTime * 16; // Normalize to ~60fps
                this.mouseState.velocityY = deltaY / deltaTime * 16;
            }
            
            if (this.mouseState.isDown) {
                if (this.mouseState.button === Controls.mouse.rotate) {
                    // Smooth rotation with velocity
                    this.smoothRotate(deltaX, deltaY);
                } else if (this.mouseState.button === Controls.mouse.pan) {
                    // Smooth panning
                    this.smoothPan(deltaX, deltaY);
                }
            }
            
            this.mouseState.currentX = e.clientX;
            this.mouseState.currentY = e.clientY;
            this.mouseState.lastMoveTime = now;
            
            // Update mouse position for raycasting
            this.updateMousePosition(e);
            
            // Debounced hover check for performance
            this.debouncedCheckHover();
        }, 16); // ~60fps throttle
        
        // Mouse up with inertia
        const onMouseUp = (e) => {
            if (this.inertia.enabled && this.mouseState.isDown) {
                this.applyInertia();
            }
            
            this.mouseState.isDown = false;
            this.mouseState.button = null;
            this.updateCursor(null);
        };
        
        // Mouse leave
        const onMouseLeave = (e) => {
            if (this.mouseState.isDown) {
                onMouseUp(e);
            }
        };
        
        // Add listeners
        this.domElement.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        this.domElement.addEventListener('mouseleave', onMouseLeave);
        
        // Store for cleanup
        this.eventListeners.push(
            { element: this.domElement, type: 'mousedown', handler: onMouseDown },
            { element: document, type: 'mousemove', handler: onMouseMove },
            { element: document, type: 'mouseup', handler: onMouseUp },
            { element: this.domElement, type: 'mouseleave', handler: onMouseLeave }
        );
    }
    
    /**
     * Enhanced keyboard events
     */
    setupKeyboardEvents() {
        const onKeyDown = this.throttle((e) => {
            if (!this.enabled) return;
            
            const key = e.key.toLowerCase();
            
            // Store key state
            this.stateManager.setState(`key_${key}`, true);
            
            // Handle key combinations
            const ctrl = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;
            const alt = e.altKey;
            
            // Handle controls based on configuration
            this.handleKeyControl(key, ctrl, shift, alt, e);
        }, 50);
        
        const onKeyUp = (e) => {
            const key = e.key.toLowerCase();
            this.stateManager.setState(`key_${key}`, false);
        };
        
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        
        this.eventListeners.push(
            { element: document, type: 'keydown', handler: onKeyDown },
            { element: document, type: 'keyup', handler: onKeyUp }
        );
    }
    
    /**
     * Enhanced touch events with gesture support
     */
    setupTouchEvents() {
        const onTouchStart = (e) => {
            if (!this.enabled) return;
            
            // Store touch state
            this.touchState.prevTouches = [...this.touchState.touches];
            this.touchState.touches = Array.from(e.touches).map(t => ({
                id: t.identifier,
                x: t.clientX,
                y: t.clientY,
                timestamp: performance.now()
            }));
            
            this.touchState.isTouching = true;
            this.touchState.touchCount = e.touches.length;
            
            // Check for double tap
            if (e.touches.length === 1) {
                this.checkDoubleTap(e.touches[0]);
            }
        };
        
        const onTouchMove = this.throttle((e) => {
            if (!this.enabled || !this.touchState.isTouching) return;
            
            e.preventDefault();
            
            // Update touch state
            this.touchState.prevTouches = [...this.touchState.touches];
            this.touchState.touches = Array.from(e.touches).map(t => ({
                id: t.identifier,
                x: t.clientX,
                y: t.clientY,
                timestamp: performance.now()
            }));
            
            // Process gestures
            const gesture = this.gestureRecognizer.processTouch(
                this.touchState.touches,
                this.touchState.prevTouches
            );
            
            if (gesture) {
                this.handleGesture(gesture);
            } else if (e.touches.length === 1) {
                // Single touch rotation
                this.handleSingleTouch(e.touches[0]);
            }
        }, 16);
        
        const onTouchEnd = (e) => {
            // Apply inertia if needed
            if (this.inertia.enabled && this.touchState.touches.length === 1) {
                const lastTouch = this.touchState.touches[0];
                const prevTouch = this.touchState.prevTouches.find(t => t.id === lastTouch.id);
                if (prevTouch) {
                    const velocity = this.getTouchVelocity(lastTouch, prevTouch);
                    this.applyTouchInertia(velocity);
                }
            }
            
            this.touchState.isTouching = e.touches.length > 0;
            this.touchState.touchCount = e.touches.length;
            
            if (e.touches.length === 0) {
                this.gestureRecognizer.reset();
            }
        };
        
        // Add listeners with passive flag management
        this.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
        this.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
        this.domElement.addEventListener('touchend', onTouchEnd, { passive: true });
        
        this.eventListeners.push(
            { element: this.domElement, type: 'touchstart', handler: onTouchStart },
            { element: this.domElement, type: 'touchmove', handler: onTouchMove },
            { element: this.domElement, type: 'touchend', handler: onTouchEnd }
        );
    }
    
    /**
     * Enhanced wheel events with smooth zoom
     */
    setupWheelEvents() {
        let zoomVelocity = 0;
        let lastWheelTime = 0;
        
        const onWheel = (e) => {
            if (!this.enabled) return;
            
            e.preventDefault();
            
            const now = performance.now();
            const deltaTime = now - lastWheelTime;
            lastWheelTime = now;
            
            // Normalize wheel delta across browsers
            let delta = e.deltaY;
            if (e.deltaMode === 1) delta *= 40; // Line mode
            if (e.deltaMode === 2) delta *= 800; // Page mode
            
            // Apply acceleration for fast scrolling
            const acceleration = deltaTime < 50 ? 2 : 1;
            delta *= acceleration;
            
            // Convert to zoom velocity
            zoomVelocity = clamp(delta * 0.0001, -0.1, 0.1);
            
            // Smooth zoom animation
            this.animateZoom(zoomVelocity);
        };
        
        this.domElement.addEventListener('wheel', onWheel, { passive: false });
        this.eventListeners.push(
            { element: this.domElement, type: 'wheel', handler: onWheel }
        );
    }
    
    /**
     * Setup pointer lock for immersive control
     */
    setupPointerLock() {
        this.pointerLockActive = false;
        
        const onPointerLockChange = () => {
            this.pointerLockActive = document.pointerLockElement === this.domElement;
            
            if (this.pointerLockActive) {
                this.domElement.addEventListener('mousemove', this.onPointerLockMove);
            } else {
                this.domElement.removeEventListener('mousemove', this.onPointerLockMove);
            }
        };
        
        this.onPointerLockMove = (e) => {
            if (!this.enabled) return;
            
            const movementX = e.movementX || e.mozMovementX || 0;
            const movementY = e.movementY || e.mozMovementY || 0;
            
            this.cameraController.rotate(
                movementX * 0.002,
                movementY * 0.002
            );
        };
        
        document.addEventListener('pointerlockchange', onPointerLockChange);
        document.addEventListener('mozpointerlockchange', onPointerLockChange);
        
        this.eventListeners.push(
            { element: document, type: 'pointerlockchange', handler: onPointerLockChange },
            { element: document, type: 'mozpointerlockchange', handler: onPointerLockChange }
        );
    }
    
    /**
     * Handle keyboard controls
     */
    handleKeyControl(key, ctrl, shift, alt, event) {
        // Handle based on Controls configuration
        switch(key) {
            case Controls.keyboard.pause:
                event.preventDefault();
                this.simulation.togglePause();
                break;
                
            case Controls.keyboard.resetView:
                this.animateViewReset();
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
                
            // Number keys for moon focus
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
                const moonIndex = parseInt(key) - 1;
                this.animateFocusOnMoon(moonIndex);
                break;
                
            // Arrow keys for smooth camera movement
            case 'arrowleft':
                this.smoothRotate(-50, 0);
                break;
            case 'arrowright':
                this.smoothRotate(50, 0);
                break;
            case 'arrowup':
                this.smoothRotate(0, -50);
                break;
            case 'arrowdown':
                this.smoothRotate(0, 50);
                break;
        }
    }
    
    /**
     * Smooth rotation with easing
     */
    smoothRotate(deltaX, deltaY) {
        const rotationSpeed = Controls.keyboard.rotationSpeed || 0.01;
        
        const targetRotationX = deltaX * rotationSpeed;
        const targetRotationY = deltaY * rotationSpeed;
        
        // Apply rotation with smoothing
        this.animateRotation(targetRotationX, targetRotationY);
    }
    
    /**
     * Smooth panning
     */
    smoothPan(deltaX, deltaY) {
        const panSpeed = 0.5;
        
        // Apply smooth panning
        this.animatePan(deltaX * panSpeed, deltaY * panSpeed);
    }
    
    /**
     * Animate rotation
     */
    animateRotation(targetX, targetY, duration = 200) {
        const startTime = performance.now();
        const startRotation = this.cameraController.getRotation();
        
        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(progress);
            
            this.cameraController.rotate(
                targetX * eased - (startRotation.x * (eased - 1)),
                targetY * eased - (startRotation.y * (eased - 1))
            );
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    /**
     * Animate pan
     */
    animatePan(targetX, targetY, duration = 200) {
        const startTime = performance.now();
        let lastX = 0;
        let lastY = 0;
        
        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(progress);
            
            const currentX = targetX * eased;
            const currentY = targetY * eased;
            
            this.cameraController.pan(currentX - lastX, currentY - lastY);
            
            lastX = currentX;
            lastY = currentY;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    /**
     * Animate zoom
     */
    animateZoom(velocity, duration = 300) {
        const startTime = performance.now();
        
        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 2); // Ease out quad
            
            const currentVelocity = velocity * (1 - eased);
            
            if (Math.abs(currentVelocity) > 0.001) {
                this.cameraController.zoom(currentVelocity);
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    /**
     * Apply inertia after mouse release
     */
    applyInertia() {
        if (Math.abs(this.mouseState.velocityX) < this.inertia.threshold &&
            Math.abs(this.mouseState.velocityY) < this.inertia.threshold) {
            return;
        }
        
        const animate = () => {
            this.mouseState.velocityX *= this.inertia.damping;
            this.mouseState.velocityY *= this.inertia.damping;
            
            if (Math.abs(this.mouseState.velocityX) > this.inertia.threshold ||
                Math.abs(this.mouseState.velocityY) > this.inertia.threshold) {
                
                this.cameraController.rotate(
                    this.mouseState.velocityX * 0.01,
                    this.mouseState.velocityY * 0.01
                );
                
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    /**
     * Apply touch inertia
     */
    applyTouchInertia(velocity) {
        let velocityX = velocity.x;
        let velocityY = velocity.y;
        
        const animate = () => {
            velocityX *= this.inertia.damping;
            velocityY *= this.inertia.damping;
            
            if (Math.abs(velocityX) > this.inertia.threshold ||
                Math.abs(velocityY) > this.inertia.threshold) {
                
                this.cameraController.rotate(
                    velocityX * 0.01,
                    velocityY * 0.01
                );
                
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    /**
     * Handle double click
     */
    handleDoubleClick(e) {
        // Check for moon under cursor
        this.updateMousePosition(e);
        this.raycaster.setFromCamera(this.mouse, this.simulation.camera);
        
        const moonMeshes = this.simulation.moons?.getMoonMeshes() || [];
        const intersects = this.raycaster.intersectObjects(moonMeshes);
        
        if (intersects.length > 0) {
            const moon = intersects[0].object;
            const moonIndex = moonMeshes.indexOf(moon);
            if (moonIndex !== -1) {
                this.animateFocusOnMoon(moonIndex);
            }
        } else {
            // Reset view on empty space double-click
            this.animateViewReset();
        }
    }
    
    /**
     * Handle double tap
     */
    checkDoubleTap(touch) {
        const now = performance.now();
        const dx = touch.clientX - this.lastClickPosition.x;
        const dy = touch.clientY - this.lastClickPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (now - this.lastClickTime < this.doubleClickTime && distance < 30) {
            this.handleDoubleClick({ clientX: touch.clientX, clientY: touch.clientY });
        }
        
        this.lastClickTime = now;
        this.lastClickPosition = { x: touch.clientX, y: touch.clientY };
    }
    
    /**
     * Handle gestures
     */
    handleGesture(gesture) {
        switch (gesture.type) {
            case 'pinch':
                this.cameraController.zoom((1 - gesture.scale) * 0.5);
                break;
                
            case 'rotate':
                this.cameraController.rotate(0, 0, gesture.rotation * 0.01);
                break;
                
            case 'swipe':
                if (gesture.direction === 'left' || gesture.direction === 'right') {
                    this.navigateMoons(gesture.direction === 'right' ? 1 : -1);
                }
                break;
        }
    }
    
    /**
     * Navigate between moons
     */
    navigateMoons(direction) {
        const currentFocus = this.simulation.getCurrentFocus();
        const moonCount = MOONS_DATA.length;
        
        let nextIndex = 0;
        if (currentFocus && currentFocus.type === 'moon') {
            nextIndex = (currentFocus.index + direction + moonCount) % moonCount;
        }
        
        this.animateFocusOnMoon(nextIndex);
    }
    
    /**
     * Animate focus on moon
     */
    animateFocusOnMoon(moonIndex, duration = 1000) {
        this.simulation.focusOnMoon(moonIndex, {
            animate: true,
            duration,
            easing: easeOutCubic
        });
    }
    
    /**
     * Animate view reset
     */
    animateViewReset(duration = 1000) {
        this.simulation.resetView({
            animate: true,
            duration,
            easing: easeOutCubic
        });
    }
    
    /**
     * Handle object selection
     */
    handleObjectSelection(e) {
        if (e.button !== 0) return; // Only left click
        
        this.updateMousePosition(e);
        this.raycaster.setFromCamera(this.mouse, this.simulation.camera);
        
        const objects = [
            ...this.simulation.moons?.getMoonMeshes() || [],
            this.simulation.planet?.mesh
        ].filter(Boolean);
        
        const intersects = this.raycaster.intersectObjects(objects);
        
        if (intersects.length > 0) {
            this.selectObject(intersects[0].object);
        } else {
            this.deselectObject();
        }
    }
    
    /**
     * Select an object
     */
    selectObject(object) {
        if (this.selectedObject === object) return;
        
        this.deselectObject();
        this.selectedObject = object;
        
        // Add selection effect
        if (object.material) {
            object.userData.originalEmissive = object.material.emissive?.getHex();
            object.material.emissive = new THREE.Color(0x444444);
        }
        
        // Dispatch selection event
        this.domElement.dispatchEvent(new CustomEvent('objectSelected', {
            detail: { object }
        }));
    }
    
    /**
     * Deselect current object
     */
    deselectObject() {
        if (!this.selectedObject) return;
        
        // Remove selection effect
        if (this.selectedObject.material && this.selectedObject.userData.originalEmissive !== undefined) {
            this.selectedObject.material.emissive = new THREE.Color(this.selectedObject.userData.originalEmissive);
        }
        
        this.selectedObject = null;
        
        // Dispatch deselection event
        this.domElement.dispatchEvent(new CustomEvent('objectDeselected'));
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
     * Debounced hover check
     */
    debouncedCheckHover = this.debounce(() => {
        this.checkMoonHover();
    }, 50);
    
    /**
     * Check for moon hover with improved performance
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
            
            if (this.hoveredObject !== moon) {
                this.hoveredObject = moon;
                
                const info = this.simulation.moons.getMoonInfo(moon.name);
                
                if (info && moonInfo) {
                    // Update info with smooth transition
                    this.updateMoonInfo(info);
                    moonInfo.classList.add('visible');
                    
                    // Add hover effect to moon
                    if (moon.material) {
                        moon.userData.originalEmissiveIntensity = moon.material.emissiveIntensity;
                        moon.material.emissiveIntensity = 0.3;
                    }
                }
            }
            
            this.updateCursor('pointer');
        } else {
            if (this.hoveredObject) {
                // Remove hover effect
                if (this.hoveredObject.material && this.hoveredObject.userData.originalEmissiveIntensity !== undefined) {
                    this.hoveredObject.material.emissiveIntensity = this.hoveredObject.userData.originalEmissiveIntensity;
                }
                
                this.hoveredObject = null;
            }
            
            if (moonInfo) {
                moonInfo.classList.remove('visible');
            }
            
            if (!this.mouseState.isDown) {
                this.updateCursor('grab');
            }
        }
    }
    
    /**
     * Update moon info display
     */
    updateMoonInfo(info) {
        const elements = {
            name: document.getElementById('moon-name'),
            details: document.getElementById('moon-details'),
            position: document.getElementById('moon-position')
        };
        
        if (elements.name) {
            elements.name.textContent = info.name;
        }
        
        if (elements.details) {
            elements.details.textContent = info.info;
        }
        
        if (elements.position) {
            elements.position.textContent = 
                `Distance: ${info.distance.toFixed(2)} RU | Period: ${info.period.toFixed(2)} days`;
        }
    }
    
    /**
     * Update cursor with smooth transition
     */
    updateCursor(type) {
        const cursors = {
            grab: 'grab',
            grabbing: 'grabbing',
            move: 'move',
            pointer: 'pointer',
            null: 'default'
        };
        
        const cursor = cursors[type] || cursors.null;
        
        if (this.domElement.style.cursor !== cursor) {
            this.domElement.style.cursor = cursor;
        }
    }
    
    /**
     * Get touch distance
     */
    getTouchDistance(touch1, touch2) {
        const dx = touch1.x - touch2.x;
        const dy = touch1.y - touch2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Get touch angle
     */
    getTouchAngle(touch1, touch2) {
        return Math.atan2(touch2.y - touch1.y, touch2.x - touch1.x);
    }
    
    /**
     * Get touch center
     */
    getTouchCenter(touches) {
        const sum = touches.reduce((acc, touch) => ({
            x: acc.x + touch.x,
            y: acc.y + touch.y
        }), { x: 0, y: 0 });
        
        return {
            x: sum.x / touches.length,
            y: sum.y / touches.length
        };
    }
    
    /**
     * Get touch velocity
     */
    getTouchVelocity(currentTouch, prevTouch) {
        const deltaTime = currentTouch.timestamp - prevTouch.timestamp;
        if (deltaTime === 0) return { x: 0, y: 0 };
        
        return {
            x: (currentTouch.x - prevTouch.x) / deltaTime * 16,
            y: (currentTouch.y - prevTouch.y) / deltaTime * 16
        };
    }
    
    /**
     * Get swipe direction
     */
    getSwipeDirection(velocity) {
        const absX = Math.abs(velocity.x);
        const absY = Math.abs(velocity.y);
        
        if (absX > absY) {
            return velocity.x > 0 ? 'right' : 'left';
        } else {
            return velocity.y > 0 ? 'down' : 'up';
        }
    }
    
    /**
     * Handle single touch
     */
    handleSingleTouch(touch) {
        if (!this.touchState.prevTouches.length) return;
        
        const prevTouch = this.touchState.prevTouches[0];
        const deltaX = touch.clientX - prevTouch.x;
        const deltaY = touch.clientY - prevTouch.y;
        
        this.smoothRotate(deltaX, deltaY);
    }
    
    /**
     * Throttle function calls
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Debounce function calls
     */
    debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    /**
     * Adjust time speed
     */
    adjustTimeSpeed(direction) {
        const slider = document.getElementById('timeSpeed');
        if (slider) {
            const currentValue = parseFloat(slider.value);
            const step = 0.5;
            const newValue = clamp(currentValue + (direction * step), 
                parseFloat(slider.min), 
                parseFloat(slider.max));
            
            // Animate slider change
            this.animateSlider(slider, currentValue, newValue, 200);
        }
    }
    
    /**
     * Animate slider value
     */
    animateSlider(slider, from, to, duration) {
        const startTime = performance.now();
        
        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(progress);
            
            slider.value = lerp(from, to, eased);
            slider.dispatchEvent(new Event('input'));
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    /**
     * Start animation loop for continuous updates
     */
    startAnimationLoop() {
        const animate = () => {
            // Update performance monitor
            this.updatePerformance();
            
            // Continue loop
            this.animationFrameId = requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    /**
     * Update performance metrics
     */
    updatePerformance() {
        const now = performance.now();
        const deltaTime = now - this.performanceMonitor.lastTime;
        
        if (deltaTime >= 1000) {
            this.performanceMonitor.fps = Math.round(this.performanceMonitor.frameCount * 1000 / deltaTime);
            this.performanceMonitor.frameCount = 0;
            this.performanceMonitor.lastTime = now;
            
            // Dispatch performance event
            this.domElement.dispatchEvent(new CustomEvent('performanceUpdate', {
                detail: { fps: this.performanceMonitor.fps }
            }));
        }
        
        this.performanceMonitor.frameCount++;
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
     * Enable/disable input
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        this.domElement.style.pointerEvents = enabled ? 'auto' : 'none';
        
        if (!enabled) {
            // Reset states
            this.mouseState.isDown = false;
            this.touchState.isTouching = false;
            this.updateCursor(null);
        }
    }
    
    /**
     * Get current input state
     */
    getState() {
        return {
            mouse: { ...this.mouseState },
            touch: { ...this.touchState },
            enabled: this.enabled,
            hoveredObject: this.hoveredObject,
            selectedObject: this.selectedObject,
            performance: {
                fps: this.performanceMonitor.fps
            }
        };
    }
    
    /**
     * Dispose of all resources
     */
    dispose() {
        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // Remove all event listeners
        this.eventListeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
        
        // Clear arrays and maps
        this.eventListeners = [];
        this.throttledFunctions.clear();
        this.debouncedFunctions.clear();
        this.stateManager.states.clear();
        
        // Deselect any selected object
        this.deselectObject();
        
        // Clear references
        this.domElement = null;
        this.cameraController = null;
        this.simulation = null;
        this.raycaster = null;
        this.mouse = null;
        this.hoveredObject = null;
        this.selectedObject = null;
        this.gestureRecognizer = null;
        this.stateManager = null;
    }
}
