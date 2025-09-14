/**
 * PanelManager - Handles draggable panels
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
            initialY: 0
        };
    }
    
    /**
     * Initialize panel manager
     */
    init() {
        // Find all panels
        const panelElements = document.querySelectorAll('.ui-panel');
        
        panelElements.forEach(panel => {
            this.makeDraggable(panel);
            this.panels.push(panel);
        });
        
        // Restore panel positions from localStorage if available
        this.restorePanelPositions();
    }
    
    /**
     * Make a panel draggable
     */
    makeDraggable(panel) {
        const header = panel.querySelector('.panel-header');
        if (!header) return;
        
        // Mouse events
        header.addEventListener('mousedown', (e) => this.startDrag(e, panel));
        
        // Touch events
        header.addEventListener('touchstart', (e) => this.startDragTouch(e, panel), { passive: false });
        
        // Global move and end events
        if (!this.globalListenersAdded) {
            document.addEventListener('mousemove', (e) => this.drag(e));
            document.addEventListener('mouseup', () => this.endDrag());
            
            document.addEventListener('touchmove', (e) => this.dragTouch(e), { passive: false });
            document.addEventListener('touchend', () => this.endDrag());
            
            this.globalListenersAdded = true;
        }
    }
    
    /**
     * Start dragging (mouse)
     */
    startDrag(e, panel) {
        // Only drag from header, not from buttons
        if (e.target.classList.contains('panel-btn')) return;
        
        e.preventDefault();
        
        this.dragState.isDragging = true;
        this.dragState.currentPanel = panel;
        this.dragState.startX = e.clientX;
        this.dragState.startY = e.clientY;
        
        const rect = panel.getBoundingClientRect();
        this.dragState.initialX = rect.left;
        this.dragState.initialY = rect.top;
        
        // Add dragging class
        panel.classList.add('dragging');
        
        // Bring to front
        this.bringToFront(panel);
    }
    
    /**
     * Start dragging (touch)
     */
    startDragTouch(e, panel) {
        // Only drag from header, not from buttons
        if (e.target.classList.contains('panel-btn')) return;
        
        e.preventDefault();
        
        const touch = e.touches[0];
        
        this.dragState.isDragging = true;
        this.dragState.currentPanel = panel;
        this.dragState.startX = touch.clientX;
        this.dragState.startY = touch.clientY;
        
        const rect = panel.getBoundingClientRect();
        this.dragState.initialX = rect.left;
        this.dragState.initialY = rect.top;
        
        // Add dragging class
        panel.classList.add('dragging');
        
        // Bring to front
        this.bringToFront(panel);
    }
    
    /**
     * Drag panel (mouse)
     */
    drag(e) {
        if (!this.dragState.isDragging || !this.dragState.currentPanel) return;
        
        e.preventDefault();
        
        const deltaX = e.clientX - this.dragState.startX;
        const deltaY = e.clientY - this.dragState.startY;
        
        this.movePanel(
            this.dragState.currentPanel,
            this.dragState.initialX + deltaX,
            this.dragState.initialY + deltaY
        );
    }
    
    /**
     * Drag panel (touch)
     */
    dragTouch(e) {
        if (!this.dragState.isDragging || !this.dragState.currentPanel) return;
        
        e.preventDefault();
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.dragState.startX;
        const deltaY = touch.clientY - this.dragState.startY;
        
        this.movePanel(
            this.dragState.currentPanel,
            this.dragState.initialX + deltaX,
            this.dragState.initialY + deltaY
        );
    }
    
    /**
     * Move panel to position
     */
    movePanel(panel, x, y) {
        // Get viewport dimensions
        const maxX = window.innerWidth - panel.offsetWidth;
        const maxY = window.innerHeight - panel.offsetHeight;
        
        // Constrain to viewport
        x = Math.max(0, Math.min(maxX, x));
        y = Math.max(0, Math.min(maxY, y));
        
        // Apply position
        panel.style.left = `${x}px`;
        panel.style.top = `${y}px`;
        
        // Remove any right/bottom positioning
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
    }
    
    /**
     * End dragging
     */
    endDrag() {
        if (this.dragState.currentPanel) {
            this.dragState.currentPanel.classList.remove('dragging');
            
            // Save panel position
            this.savePanelPosition(this.dragState.currentPanel);
        }
        
        this.dragState.isDragging = false;
        this.dragState.currentPanel = null;
    }
    
    /**
     * Bring panel to front
     */
    bringToFront(panel) {
        // Reset z-index for all panels
        this.panels.forEach(p => {
            p.style.zIndex = '200';
        });
        
        // Set higher z-index for current panel
        panel.style.zIndex = '201';
    }
    
    /**
     * Save panel position to localStorage
     */
    savePanelPosition(panel) {
        if (!panel.id) return;
        
        const positions = this.getSavedPositions();
        positions[panel.id] = {
            left: panel.style.left,
            top: panel.style.top
        };
        
        try {
            localStorage.setItem('uranusSimPanelPositions', JSON.stringify(positions));
        } catch (e) {
            console.warn('Could not save panel positions:', e);
        }
    }
    
    /**
     * Get saved positions from localStorage
     */
    getSavedPositions() {
        try {
            const saved = localStorage.getItem('uranusSimPanelPositions');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    }
    
    /**
     * Restore panel positions from localStorage
     */
    restorePanelPositions() {
        const positions = this.getSavedPositions();
        
        this.panels.forEach(panel => {
            if (panel.id && positions[panel.id]) {
                const pos = positions[panel.id];
                
                // Validate position is still valid for current viewport
                const x = parseInt(pos.left);
                const y = parseInt(pos.top);
                
                if (!isNaN(x) && !isNaN(y)) {
                    this.movePanel(panel, x, y);
                }
            }
        });
    }
    
    /**
     * Reset all panels to default positions
     */
    resetPanelPositions() {
        // Clear saved positions
        try {
            localStorage.removeItem('uranusSimPanelPositions');
        } catch (e) {
            console.warn('Could not clear saved positions:', e);
        }
        
        // Reset panel styles
        this.panels.forEach(panel => {
            panel.style.left = '';
            panel.style.top = '';
            panel.style.right = '';
            panel.style.bottom = '';
            panel.style.zIndex = '';
        });
    }
    
    /**
     * Snap panel to edge
     */
    snapToEdge(panel, threshold = 20) {
        const rect = panel.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let x = rect.left;
        let y = rect.top;
        
        // Snap to left
        if (x < threshold) x = 0;
        
        // Snap to right
        if (x + rect.width > viewportWidth - threshold) {
            x = viewportWidth - rect.width;
        }
        
        // Snap to top
        if (y < threshold) y = 0;
        
        // Snap to bottom
        if (y + rect.height > viewportHeight - threshold) {
            y = viewportHeight - rect.height;
        }
        
        this.movePanel(panel, x, y);
    }
    
    /**
     * Auto-arrange panels
     */
    autoArrange() {
        const margin = 10;
        let currentX = margin;
        let currentY = margin;
        let rowHeight = 0;
        
        this.panels.forEach(panel => {
            const width = panel.offsetWidth;
            const height = panel.offsetHeight;
            
            // Check if panel fits in current row
            if (currentX + width > window.innerWidth - margin) {
                // Move to next row
                currentX = margin;
                currentY += rowHeight + margin;
                rowHeight = 0;
            }
            
            // Position panel
            this.movePanel(panel, currentX, currentY);
            
            // Update position for next panel
            currentX += width + margin;
            rowHeight = Math.max(rowHeight, height);
        });
        
        // Save positions
        this.panels.forEach(panel => {
            this.savePanelPosition(panel);
        });
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Ensure panels stay within viewport
        this.panels.forEach(panel => {
            const rect = panel.getBoundingClientRect();
            const maxX = window.innerWidth - panel.offsetWidth;
            const maxY = window.innerHeight - panel.offsetHeight;
            
            if (rect.left > maxX || rect.top > maxY) {
                this.movePanel(
                    panel,
                    Math.min(rect.left, maxX),
                    Math.min(rect.top, maxY)
                );
            }
        });
    }
    
    /**
     * Get panel by ID
     */
    getPanelById(id) {
        return this.panels.find(panel => panel.id === id);
    }
    
    /**
     * Show/hide panel
     */
    togglePanel(panelId, visible) {
        const panel = this.getPanelById(panelId);
        if (panel) {
            panel.style.display = visible ? 'block' : 'none';
        }
    }
    
    /**
     * Dispose
     */
    dispose() {
        // Save current positions before disposing
        this.panels.forEach(panel => {
            this.savePanelPosition(panel);
        });
        
        // Clear references
        this.panels = [];
        this.dragState = {
            isDragging: false,
            currentPanel: null,
            startX: 0,
            startY: 0,
            initialX: 0,
            initialY: 0
        };
    }
}
