/**
 * Enhanced PanelManager - Advanced draggable panels with animations and features
 */

export default class PanelManager {
    constructor() {
        this.panels = [];
        this.dragState = {
            isDragging: false,
            currentPanel: null,
            startX: 0,
            startY: 0,
            initialX: 0,
            initialY: 0,
            velocity: { x: 0, y: 0 },
            lastTime: 0
        };
        
        // Enhanced features
        this.config = {
            snapDistance: 20,
            magneticStrength: 15,
            animationDuration: 300,
            inertia: true,
            damping: 0.9,
            collisionDetection: true,
            autoStack: true,
            savePositions: true,
            hapticFeedback: true
        };
        
        // Panel states
        this.panelStates = new Map();
        this.dockedPanels = new Set();
        this.minimizedPanels = new Set();
        
        // Animation frame ID
        this.animationFrame = null;
        
        // Resize observer
        this.resizeObserver = null;
        
        // Touch tracking
        this.touches = new Map();
    }
    
    /**
     * Initialize panel manager with enhanced features
     */
    init() {
        console.log('[PanelManager] Initializing...');
        
        // Find and setup all panels
        const panelElements = document.querySelectorAll('.ui-panel');
        
        panelElements.forEach(panel => {
            this.setupPanel(panel);
            this.panels.push(panel);
            this.initializePanelState(panel);
        });
        
        // Setup global listeners
        this.setupGlobalListeners();
        
        // Setup resize observer
        this.setupResizeObserver();
        
        // Restore saved states
        if (this.config.savePositions) {
            this.restorePanelStates();
        }
        
        // Add panel controls
        this.addPanelControls();
        
        console.log(`[PanelManager] Initialized ${this.panels.length} panels`);
    }
    
    /**
     * Setup individual panel with all features
     */
    setupPanel(panel) {
        // Add necessary attributes
        if (!panel.id) {
            panel.id = `panel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Add data attributes
        panel.dataset.panelId = panel.id;
        
        // Make draggable
        this.makeDraggable(panel);
        
        // Add resize handle if not present
        this.addResizeHandle(panel);
        
        // Add dock zones
        this.addDockZones(panel);
        
        // Initialize transitions
        this.setupTransitions(panel);
    }
    
    /**
     * Initialize panel state tracking
     */
    initializePanelState(panel) {
        const rect = panel.getBoundingClientRect();
        
        this.panelStates.set(panel.id, {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            zIndex: parseInt(window.getComputedStyle(panel).zIndex) || 200,
            minimized: panel.classList.contains('minimized'),
            docked: false,
            dockPosition: null,
            lastPosition: { x: rect.left, y: rect.top },
            velocity: { x: 0, y: 0 }
        });
    }
    
    /**
     * Enhanced draggable setup with improved event handling
     */
    makeDraggable(panel) {
        const header = panel.querySelector('.panel-header');
        if (!header) return;
        
        // Mouse events
        header.addEventListener('mousedown', (e) => this.handleDragStart(e, panel));
        
        // Touch events with better support
        header.addEventListener('touchstart', (e) => this.handleTouchStart(e, panel), { passive: false });
        
        // Pointer events for unified handling
        if (window.PointerEvent) {
            header.addEventListener('pointerdown', (e) => this.handlePointerDown(e, panel));
        }
        
        // Double-click to dock/undock
        header.addEventListener('dblclick', (e) => this.handleDoubleClick(e, panel));
    }
    
    /**
     * Unified drag start handler
     */
    handleDragStart(e, panel) {
        // Ignore button clicks
        if (e.target.classList.contains('panel-btn')) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const rect = panel.getBoundingClientRect();
        
        this.dragState = {
            isDragging: true,
            currentPanel: panel,
            startX: e.clientX,
            startY: e.clientY,
            initialX: rect.left,
            initialY: rect.top,
            velocity: { x: 0, y: 0 },
            lastTime: performance.now(),
            lastX: e.clientX,
            lastY: e.clientY
        };
        
        // Add dragging class with animation
        panel.classList.add('dragging');
        this.disableTransitions(panel);
        
        // Bring to front smoothly
        this.bringToFront(panel);
        
        // Show drop zones
        this.showDropZones();
        
        // Haptic feedback if available
        this.triggerHapticFeedback('light');
    }
    
    /**
     * Enhanced touch start handler
     */
    handleTouchStart(e, panel) {
        if (e.target.classList.contains('panel-btn')) return;
        
        e.preventDefault();
        
        const touch = e.touches[0];
        this.touches.set(touch.identifier, {
            startX: touch.clientX,
            startY: touch.clientY,
            panel: panel
        });
        
        // Use same drag logic
        this.handleDragStart(touch, panel);
    }
    
    /**
     * Pointer event handler for unified input
     */
    handlePointerDown(e, panel) {
        if (e.pointerType === 'mouse') return; // Already handled by mousedown
        
        if (e.target.classList.contains('panel-btn')) return;
        
        e.preventDefault();
        panel.setPointerCapture(e.pointerId);
        
        this.handleDragStart(e, panel);
    }
    
    /**
     * Setup global event listeners
     */
    setupGlobalListeners() {
        // Mouse events
        document.addEventListener('mousemove', (e) => this.handleDrag(e));
        document.addEventListener('mouseup', (e) => this.handleDragEnd(e));
        
        // Touch events
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        document.addEventListener('touchcancel', (e) => this.handleTouchEnd(e));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Visibility change (save state)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.config.savePositions) {
                this.saveAllPanelStates();
            }
        });
    }
    
    /**
     * Enhanced drag handler with physics
     */
    handleDrag(e) {
        if (!this.dragState.isDragging || !this.dragState.currentPanel) return;
        
        e.preventDefault();
        
        const now = performance.now();
        const dt = Math.min(now - this.dragState.lastTime, 100) / 1000; // Cap dt
        
        const deltaX = e.clientX - this.dragState.startX;
        const deltaY = e.clientY - this.dragState.startY;
        
        let newX = this.dragState.initialX + deltaX;
        let newY = this.dragState.initialY + deltaY;
        
        // Calculate velocity for inertia
        if (dt > 0) {
            this.dragState.velocity.x = (e.clientX - this.dragState.lastX) / dt;
            this.dragState.velocity.y = (e.clientY - this.dragState.lastY) / dt;
        }
        
        // Apply magnetic snapping
        const snapResult = this.applyMagneticSnap(
            this.dragState.currentPanel,
            newX,
            newY
        );
        
        newX = snapResult.x;
        newY = snapResult.y;
        
        // Check collisions
        if (this.config.collisionDetection) {
            const collision = this.checkCollisions(
                this.dragState.currentPanel,
                newX,
                newY
            );
            
            if (!collision.collides) {
                this.movePanel(this.dragState.currentPanel, newX, newY);
            } else {
                // Slide along collision edge
                this.movePanel(
                    this.dragState.currentPanel,
                    collision.safeX,
                    collision.safeY
                );
            }
        } else {
            this.movePanel(this.dragState.currentPanel, newX, newY);
        }
        
        // Update tracking
        this.dragState.lastX = e.clientX;
        this.dragState.lastY = e.clientY;
        this.dragState.lastTime = now;
        
        // Check dock zones
        this.checkDockZones(this.dragState.currentPanel);
    }
    
    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        if (!this.dragState.isDragging) return;
        
        e.preventDefault();
        
        const touch = e.touches[0];
        this.handleDrag(touch);
    }
    
    /**
     * Enhanced drag end with inertia
     */
    handleDragEnd(e) {
        if (!this.dragState.currentPanel) return;
        
        const panel = this.dragState.currentPanel;
        
        // Apply inertia if enabled
        if (this.config.inertia && 
            (Math.abs(this.dragState.velocity.x) > 50 || 
             Math.abs(this.dragState.velocity.y) > 50)) {
            this.applyInertia(panel);
        } else {
            this.finalizeDrag(panel);
        }
        
        // Hide drop zones
        this.hideDropZones();
        
        // Haptic feedback
        this.triggerHapticFeedback('light');
    }
    
    /**
     * Apply inertia animation
     */
    applyInertia(panel) {
        let velocityX = this.dragState.velocity.x;
        let velocityY = this.dragState.velocity.y;
        
        const animate = () => {
            // Apply damping
            velocityX *= this.config.damping;
            velocityY *= this.config.damping;
            
            // Stop if velocity is too small
            if (Math.abs(velocityX) < 1 && Math.abs(velocityY) < 1) {
                this.finalizeDrag(panel);
                return;
            }
            
            const rect = panel.getBoundingClientRect();
            let newX = rect.left + velocityX * 0.016; // 60fps
            let newY = rect.top + velocityY * 0.016;
            
            // Bounce off edges
            const maxX = window.innerWidth - panel.offsetWidth;
            const maxY = window.innerHeight - panel.offsetHeight;
            
            if (newX < 0 || newX > maxX) {
                velocityX *= -0.5; // Bounce with energy loss
                newX = Math.max(0, Math.min(maxX, newX));
            }
            
            if (newY < 0 || newY > maxY) {
                velocityY *= -0.5;
                newY = Math.max(0, Math.min(maxY, newY));
            }
            
            this.movePanel(panel, newX, newY);
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    /**
     * Finalize drag operation
     */
    finalizeDrag(panel) {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        panel.classList.remove('dragging');
        this.enableTransitions(panel);
        
        // Check final dock position
        const docked = this.checkFinalDock(panel);
        
        if (!docked) {
            // Snap to final position
            const rect = panel.getBoundingClientRect();
            const finalSnap = this.applyMagneticSnap(panel, rect.left, rect.top);
            
            if (finalSnap.snapped) {
                this.animatePanel(panel, finalSnap.x, finalSnap.y);
            }
        }
        
        // Save state
        this.savePanelState(panel);
        
        // Reset drag state
        this.dragState = {
            isDragging: false,
            currentPanel: null,
            startX: 0,
            startY: 0,
            initialX: 0,
            initialY: 0,
            velocity: { x: 0, y: 0 },
            lastTime: 0
        };
    }
    
    /**
     * Apply magnetic snapping to edges and other panels
     */
    applyMagneticSnap(panel, x, y) {
        const snapDistance = this.config.snapDistance;
        const magneticStrength = this.config.magneticStrength;
        
        let snappedX = x;
        let snappedY = y;
        let snapped = false;
        
        const rect = {
            left: x,
            top: y,
            right: x + panel.offsetWidth,
            bottom: y + panel.offsetHeight,
            width: panel.offsetWidth,
            height: panel.offsetHeight
        };
        
        // Snap to viewport edges
        if (Math.abs(rect.left) < snapDistance) {
            snappedX = 0;
            snapped = true;
        } else if (Math.abs(rect.right - window.innerWidth) < snapDistance) {
            snappedX = window.innerWidth - rect.width;
            snapped = true;
        }
        
        if (Math.abs(rect.top) < snapDistance) {
            snappedY = 0;
            snapped = true;
        } else if (Math.abs(rect.bottom - window.innerHeight) < snapDistance) {
            snappedY = window.innerHeight - rect.height;
            snapped = true;
        }
        
        // Snap to other panels
        this.panels.forEach(otherPanel => {
            if (otherPanel === panel) return;
            
            const otherRect = otherPanel.getBoundingClientRect();
            
            // Vertical alignment
            if (Math.abs(rect.left - otherRect.left) < magneticStrength) {
                snappedX = otherRect.left;
                snapped = true;
            } else if (Math.abs(rect.right - otherRect.right) < magneticStrength) {
                snappedX = otherRect.right - rect.width;
                snapped = true;
            } else if (Math.abs(rect.left - otherRect.right) < magneticStrength) {
                snappedX = otherRect.right;
                snapped = true;
            } else if (Math.abs(rect.right - otherRect.left) < magneticStrength) {
                snappedX = otherRect.left - rect.width;
                snapped = true;
            }
            
            // Horizontal alignment
            if (Math.abs(rect.top - otherRect.top) < magneticStrength) {
                snappedY = otherRect.top;
                snapped = true;
            } else if (Math.abs(rect.bottom - otherRect.bottom) < magneticStrength) {
                snappedY = otherRect.bottom - rect.height;
                snapped = true;
            } else if (Math.abs(rect.top - otherRect.bottom) < magneticStrength) {
                snappedY = otherRect.bottom;
                snapped = true;
            } else if (Math.abs(rect.bottom - otherRect.top) < magneticStrength) {
                snappedY = otherRect.top - rect.height;
                snapped = true;
            }
        });
        
        return { x: snappedX, y: snappedY, snapped };
    }
    
    /**
     * Check collisions with other panels
     */
    checkCollisions(panel, x, y) {
        const rect = {
            left: x,
            top: y,
            right: x + panel.offsetWidth,
            bottom: y + panel.offsetHeight
        };
        
        let collides = false;
        let safeX = x;
        let safeY = y;
        
        this.panels.forEach(otherPanel => {
            if (otherPanel === panel) return;
            if (otherPanel.classList.contains('minimized')) return;
            
            const otherRect = otherPanel.getBoundingClientRect();
            
            // Check overlap
            if (rect.left < otherRect.right &&
                rect.right > otherRect.left &&
                rect.top < otherRect.bottom &&
                rect.bottom > otherRect.top) {
                
                collides = true;
                
                // Calculate safe position (push out of collision)
                const overlapX = Math.min(
                    rect.right - otherRect.left,
                    otherRect.right - rect.left
                );
                const overlapY = Math.min(
                    rect.bottom - otherRect.top,
                    otherRect.bottom - rect.top
                );
                
                if (overlapX < overlapY) {
                    // Push horizontally
                    if (rect.left < otherRect.left) {
                        safeX = otherRect.left - panel.offsetWidth;
                    } else {
                        safeX = otherRect.right;
                    }
                } else {
                    // Push vertically
                    if (rect.top < otherRect.top) {
                        safeY = otherRect.top - panel.offsetHeight;
                    } else {
                        safeY = otherRect.bottom;
                    }
                }
            }
        });
        
        return { collides, safeX, safeY };
    }
    
    /**
     * Move panel with constraints
     */
    movePanel(panel, x, y) {
        const maxX = window.innerWidth - panel.offsetWidth;
        const maxY = window.innerHeight - panel.offsetHeight;
        
        x = Math.max(0, Math.min(maxX, x));
        y = Math.max(0, Math.min(maxY, y));
        
        panel.style.left = `${x}px`;
        panel.style.top = `${y}px`;
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
        
        // Update state
        const state = this.panelStates.get(panel.id);
        if (state) {
            state.x = x;
            state.y = y;
        }
    }
    
    /**
     * Animate panel movement
     */
    animatePanel(panel, targetX, targetY, duration = 300) {
        const startX = parseFloat(panel.style.left) || 0;
        const startY = parseFloat(panel.style.top) || 0;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const eased = 1 - Math.pow(1 - progress, 3);
            
            const x = startX + (targetX - startX) * eased;
            const y = startY + (targetY - startY) * eased;
            
            this.movePanel(panel, x, y);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    /**
     * Add resize handle to panel
     */
    addResizeHandle(panel) {
        if (panel.querySelector('.resize-handle')) return;
        
        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        handle.innerHTML = '⋮';
        panel.appendChild(handle);
        
        // Resize logic
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const startWidth = panel.offsetWidth;
            const startHeight = panel.offsetHeight;
            const startX = e.clientX;
            const startY = e.clientY;
            
            const resize = (e) => {
                const width = Math.max(200, startWidth + e.clientX - startX);
                const height = Math.max(150, startHeight + e.clientY - startY);
                
                panel.style.width = `${width}px`;
                panel.style.height = `${height}px`;
            };
            
            const stopResize = () => {
                document.removeEventListener('mousemove', resize);
                document.removeEventListener('mouseup', stopResize);
                this.savePanelState(panel);
            };
            
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        });
    }
    
    /**
     * Add dock zones for panel docking
     */
    addDockZones(panel) {
        // Dock zones are visual indicators for docking positions
        const zones = ['top', 'right', 'bottom', 'left'];
        
        zones.forEach(zone => {
            const dockZone = document.createElement('div');
            dockZone.className = `dock-zone dock-zone-${zone}`;
            dockZone.dataset.zone = zone;
            document.body.appendChild(dockZone);
        });
    }
    
    /**
     * Show drop zones when dragging
     */
    showDropZones() {
        document.querySelectorAll('.dock-zone').forEach(zone => {
            zone.classList.add('visible');
        });
    }
    
    /**
     * Hide drop zones
     */
    hideDropZones() {
        document.querySelectorAll('.dock-zone').forEach(zone => {
            zone.classList.remove('visible', 'active');
        });
    }
    
    /**
     * Check if panel is over a dock zone
     */
    checkDockZones(panel) {
        const rect = panel.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        document.querySelectorAll('.dock-zone').forEach(zone => {
            const zoneRect = zone.getBoundingClientRect();
            
            if (centerX >= zoneRect.left && centerX <= zoneRect.right &&
                centerY >= zoneRect.top && centerY <= zoneRect.bottom) {
                zone.classList.add('active');
            } else {
                zone.classList.remove('active');
            }
        });
    }
    
    /**
     * Check final dock position
     */
    checkFinalDock(panel) {
        const activeZone = document.querySelector('.dock-zone.active');
        
        if (activeZone) {
            const position = activeZone.dataset.zone;
            this.dockPanel(panel, position);
            return true;
        }
        
        return false;
    }
    
    /**
     * Dock panel to a position
     */
    dockPanel(panel, position) {
        const state = this.panelStates.get(panel.id);
        
        // Save current position before docking
        state.lastPosition = { x: state.x, y: state.y };
        state.docked = true;
        state.dockPosition = position;
        
        panel.classList.add('docked', `docked-${position}`);
        
        // Calculate docked position
        let x, y;
        const margin = 10;
        
        switch (position) {
            case 'left':
                x = margin;
                y = window.innerHeight / 2 - panel.offsetHeight / 2;
                break;
            case 'right':
                x = window.innerWidth - panel.offsetWidth - margin;
                y = window.innerHeight / 2 - panel.offsetHeight / 2;
                break;
            case 'top':
                x = window.innerWidth / 2 - panel.offsetWidth / 2;
                y = margin;
                break;
            case 'bottom':
                x = window.innerWidth / 2 - panel.offsetWidth / 2;
                y = window.innerHeight - panel.offsetHeight - margin;
                break;
        }
        
        this.animatePanel(panel, x, y);
        this.dockedPanels.add(panel.id);
    }
    
    /**
     * Undock panel
     */
    undockPanel(panel) {
        const state = this.panelStates.get(panel.id);
        
        if (state && state.docked) {
            panel.classList.remove('docked', `docked-${state.dockPosition}`);
            state.docked = false;
            state.dockPosition = null;
            
            // Restore last position
            this.animatePanel(panel, state.lastPosition.x, state.lastPosition.y);
            this.dockedPanels.delete(panel.id);
        }
    }
    
    /**
     * Handle double-click for dock/undock
     */
    handleDoubleClick(e, panel) {
        const state = this.panelStates.get(panel.id);
        
        if (state && state.docked) {
            this.undockPanel(panel);
        } else {
            // Auto-dock to nearest edge
            const rect = panel.getBoundingClientRect();
            const distances = {
                left: rect.left,
                right: window.innerWidth - rect.right,
                top: rect.top,
                bottom: window.innerHeight - rect.bottom
            };
            
            const nearest = Object.entries(distances)
                .sort((a, b) => a[1] - b[1])[0][0];
            
            this.dockPanel(panel, nearest);
        }
    }
    
    /**
     * Handle keyboard shortcuts
     */
    handleKeyboard(e) {
        // Ctrl/Cmd + Shift + A: Auto-arrange
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            this.autoArrange();
        }
        
        // Ctrl/Cmd + Shift + R: Reset positions
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            this.resetPanelPositions();
        }
        
        // Ctrl/Cmd + Shift + M: Minimize all
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
            e.preventDefault();
            this.minimizeAll();
        }
    }
    
    /**
     * Setup transitions for smooth animations
     */
    setupTransitions(panel) {
        // Add CSS transition class if not present
        if (!panel.classList.contains('panel-transitions')) {
            panel.classList.add('panel-transitions');
        }
    }
    
    /**
     * Disable transitions during drag
     */
    disableTransitions(panel) {
        panel.style.transition = 'none';
    }
    
    /**
     * Enable transitions after drag
     */
    enableTransitions(panel) {
        panel.style.transition = '';
    }
    
    /**
     * Bring panel to front with smooth z-index transition
     */
    bringToFront(panel) {
        // Get highest z-index
        let maxZ = 200;
        this.panels.forEach(p => {
            const z = parseInt(window.getComputedStyle(p).zIndex) || 200;
            maxZ = Math.max(maxZ, z);
        });
        
        panel.style.zIndex = maxZ + 1;
        
        // Update state
        const state = this.panelStates.get(panel.id);
        if (state) {
            state.zIndex = maxZ + 1;
        }
    }
    
    /**
     * Add panel control buttons
     */
    addPanelControls() {
        this.panels.forEach(panel => {
            const header = panel.querySelector('.panel-header');
            if (!header) return;
            
            let controls = header.querySelector('.panel-controls');
            if (!controls) {
                controls = document.createElement('div');
                controls.className = 'panel-controls';
                header.appendChild(controls);
            }
            
            // Add dock button if not present
            if (!controls.querySelector('.dock-btn')) {
                const dockBtn = document.createElement('button');
                dockBtn.className = 'panel-btn dock-btn';
                dockBtn.innerHTML = '⊟';
                dockBtn.title = 'Dock/Undock';
                dockBtn.addEventListener('click', () => {
                    const state = this.panelStates.get(panel.id);
                    if (state && state.docked) {
                        this.undockPanel(panel);
                    } else {
                        this.dockPanel(panel, 'left');
                    }
                });
                controls.appendChild(dockBtn);
            }
        });
    }
    
    /**
     * Setup resize observer for responsive behavior
     */
    setupResizeObserver() {
        if (!window.ResizeObserver) return;
        
        this.resizeObserver = new ResizeObserver(entries => {
            entries.forEach(entry => {
                const panel = entry.target;
                const state = this.panelStates.get(panel.id);
                
                if (state) {
                    state.width = entry.contentRect.width;
                    state.height = entry.contentRect.height;
                }
            });
        });
        
        this.panels.forEach(panel => {
            this.resizeObserver.observe(panel);
        });
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        this.panels.forEach(panel => {
            const rect = panel.getBoundingClientRect();
            const maxX = window.innerWidth - panel.offsetWidth;
            const maxY = window.innerHeight - panel.offsetHeight;
            
            if (rect.left > maxX || rect.top > maxY) {
                this.animatePanel(
                    panel,
                    Math.min(rect.left, maxX),
                    Math.min(rect.top, maxY)
                );
            }
            
            // Re-dock if needed
            const state = this.panelStates.get(panel.id);
            if (state && state.docked) {
                this.dockPanel(panel, state.dockPosition);
            }
        });
    }
    
    /**
     * Auto-arrange panels in a grid
     */
    autoArrange() {
        const margin = 20;
        const columns = Math.ceil(Math.sqrt(this.panels.length));
        const panelWidth = (window.innerWidth - margin * (columns + 1)) / columns;
        
        this.panels.forEach((panel, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            
            const x = margin + col * (panelWidth + margin);
            const y = margin + row * (panel.offsetHeight + margin);
            
            this.animatePanel(panel, x, y);
        });
        
        // Save new positions
        this.saveAllPanelStates();
    }
    
    /**
     * Minimize all panels
     */
    minimizeAll() {
        this.panels.forEach(panel => {
            if (!panel.classList.contains('minimized')) {
                const btn = panel.querySelector('.minimize-btn');
                if (btn) {
                    btn.click();
                }
            }
        });
    }
    
    /**
     * Trigger haptic feedback
     */
    triggerHapticFeedback(style = 'light') {
        if (!this.config.hapticFeedback) return;
        
        // Vibration API
        if ('vibrate' in navigator) {
            switch (style) {
                case 'light':
                    navigator.vibrate(10);
                    break;
                case 'medium':
                    navigator.vibrate(20);
                    break;
                case 'heavy':
                    navigator.vibrate(40);
                    break;
            }
        }
    }
    
    /**
     * Save panel state
     */
    savePanelState(panel) {
        if (!this.config.savePositions) return;
        
        const state = this.panelStates.get(panel.id);
        if (!state) return;
        
        try {
            const allStates = this.getAllSavedStates();
            allStates[panel.id] = {
                x: state.x,
                y: state.y,
                width: state.width,
                height: state.height,
                minimized: state.minimized,
                docked: state.docked,
                dockPosition: state.dockPosition,
                zIndex: state.zIndex
            };
            
            localStorage.setItem('uranusSimPanelStates', JSON.stringify(allStates));
        } catch (e) {
            console.warn('Could not save panel state:', e);
        }
    }
    
    /**
     * Save all panel states
     */
    saveAllPanelStates() {
        this.panels.forEach(panel => this.savePanelState(panel));
    }
    
    /**
     * Get all saved states
     */
    getAllSavedStates() {
        try {
            const saved = localStorage.getItem('uranusSimPanelStates');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    }
    
    /**
     * Restore panel states
     */
    restorePanelStates() {
        const savedStates = this.getAllSavedStates();
        
        this.panels.forEach(panel => {
            const savedState = savedStates[panel.id];
            if (!savedState) return;
            
            // Validate position for current viewport
            const x = Math.min(savedState.x, window.innerWidth - 100);
            const y = Math.min(savedState.y, window.innerHeight - 100);
            
            this.movePanel(panel, x, y);
            
            // Restore size if saved
            if (savedState.width && savedState.height) {
                panel.style.width = `${savedState.width}px`;
                panel.style.height = `${savedState.height}px`;
            }
            
            // Restore z-index
            if (savedState.zIndex) {
                panel.style.zIndex = savedState.zIndex;
            }
            
            // Restore docked state
            if (savedState.docked && savedState.dockPosition) {
                this.dockPanel(panel, savedState.dockPosition);
            }
            
            // Update internal state
            const state = this.panelStates.get(panel.id);
            if (state) {
                Object.assign(state, savedState);
            }
        });
    }
    
    /**
     * Reset panel positions
     */
    resetPanelPositions() {
        try {
            localStorage.removeItem('uranusSimPanelStates');
        } catch (e) {
            console.warn('Could not clear saved states:', e);
        }
        
        this.panels.forEach(panel => {
            panel.style.left = '';
            panel.style.top = '';
            panel.style.right = '';
            panel.style.bottom = '';
            panel.style.width = '';
            panel.style.height = '';
            panel.style.zIndex = '';
            
            panel.classList.remove('docked', 'docked-left', 'docked-right', 
                                   'docked-top', 'docked-bottom');
            
            // Reset internal state
            this.initializePanelState(panel);
        });
        
        this.dockedPanels.clear();
    }
    
    /**
     * Handle touch end
     */
    handleTouchEnd(e) {
        if (e.touches.length === 0) {
            this.handleDragEnd(e);
        }
        
        // Clean up touch tracking
        Array.from(e.changedTouches).forEach(touch => {
            this.touches.delete(touch.identifier);
        });
    }
    
    /**
     * Get panel by ID
     */
    getPanelById(id) {
        return this.panels.find(panel => panel.id === id);
    }
    
    /**
     * Toggle panel visibility
     */
    togglePanel(panelId, visible) {
        const panel = this.getPanelById(panelId);
        if (panel) {
            panel.style.display = visible ? 'block' : 'none';
        }
    }
    
    /**
     * Dispose and cleanup
     */
    dispose() {
        // Save final states
        if (this.config.savePositions) {
            this.saveAllPanelStates();
        }
        
        // Cancel any animations
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Disconnect resize observer
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        // Clear all data
        this.panels = [];
        this.panelStates.clear();
        this.dockedPanels.clear();
        this.minimizedPanels.clear();
        this.touches.clear();
        
        // Remove dock zones
        document.querySelectorAll('.dock-zone').forEach(zone => zone.remove());
    }
}
