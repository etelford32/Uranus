/**
 * StatsDisplay - Performance and simulation statistics display
 */

import { SimulationState } from '../config/settings.js';
import { URANUS_ROTATION_PERIOD, URANUS_YEAR } from '../config/constants.js';

export default class StatsDisplay {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        this.fpsUpdateInterval = 500; // Update FPS every 500ms
        this.lastFpsUpdate = 0;
        
        // Performance monitoring
        this.frameTimes = [];
        this.maxFrameSamples = 60;
        
        // DOM elements
        this.elements = {};
    }
    
    /**
     * Initialize stats display
     */
    init() {
        this.cacheElements();
        this.startPerformanceMonitoring();
    }
    
    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            fps: document.getElementById('fps'),
            simDay: document.getElementById('simDay'),
            rotation: document.getElementById('rotation'),
            yearProgress: document.getElementById('yearProgress')
        };
    }
    
    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        // Check if Performance API is available
        if (window.performance && window.performance.memory) {
            this.memoryMonitoring = true;
        }
    }
    
    /**
     * Update stats (called each frame)
     */
    update(uranusRotation) {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        
        // Update FPS
        this.updateFPS(currentTime, deltaTime);
        
        // Update simulation stats
        this.updateSimulationStats(uranusRotation);
        
        // Update performance metrics
        this.updatePerformanceMetrics(deltaTime);
        
        this.lastTime = currentTime;
    }
    
    /**
     * Update FPS counter
     */
    updateFPS(currentTime, deltaTime) {
        this.frameCount++;
        
        // Record frame time
        this.frameTimes.push(deltaTime);
        if (this.frameTimes.length > this.maxFrameSamples) {
            this.frameTimes.shift();
        }
        
        // Update FPS display at interval
        if (currentTime - this.lastFpsUpdate > this.fpsUpdateInterval) {
            const averageFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
            this.fps = Math.round(1000 / averageFrameTime);
            
            if (this.elements.fps) {
                this.elements.fps.textContent = this.fps;
                
                // Color code FPS
                if (this.fps >= 55) {
                    this.elements.fps.style.color = '#6FE5F5'; // Good
                } else if (this.fps >= 30) {
                    this.elements.fps.style.color = '#F5E56F'; // OK
                } else {
                    this.elements.fps.style.color = '#F56F6F'; // Poor
                }
            }
            
            this.lastFpsUpdate = currentTime;
            this.frameCount = 0;
        }
    }
    
    /**
     * Update simulation statistics
     */
    updateSimulationStats(uranusRotation) {
        const simTime = SimulationState.simulationTime;
        
        // Simulation days
        const days = simTime / 24;
        if (this.elements.simDay) {
            if (days < 1) {
                const hours = simTime;
                this.elements.simDay.textContent = `${hours.toFixed(1)}h`;
            } else if (days < 365) {
                this.elements.simDay.textContent = `${days.toFixed(1)}d`;
            } else {
                const years = days / 365.25;
                this.elements.simDay.textContent = `${years.toFixed(2)}y`;
            }
        }
        
        // Uranus rotation
        if (this.elements.rotation && uranusRotation !== undefined) {
            const degrees = (((-uranusRotation * 180 / Math.PI) % 360) + 360) % 360;
            this.elements.rotation.textContent = `${degrees.toFixed(0)}°`;
        }
        
        // Year progress
        if (this.elements.yearProgress) {
            const yearProgress = ((simTime / URANUS_YEAR) * 100) % 100;
            this.elements.yearProgress.textContent = `${yearProgress.toFixed(1)}%`;
        }
    }
    
    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(deltaTime) {
        // Track frame drops
        if (deltaTime > 33.33) { // Less than 30 FPS
            this.handleFrameDrop(deltaTime);
        }
        
        // Memory usage (if available)
        if (this.memoryMonitoring && window.performance.memory) {
            const memory = window.performance.memory;
            const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(1);
            const limitMB = (memory.jsHeapSizeLimit / 1048576).toFixed(1);
            
            // You could display this in a debug panel if needed
            this.memoryUsage = {
                used: usedMB,
                limit: limitMB,
                percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100).toFixed(1)
            };
        }
    }
    
    /**
     * Handle frame drops
     */
    handleFrameDrop(frameTime) {
        console.warn(`Frame drop detected: ${frameTime.toFixed(2)}ms`);
        
        // Could trigger quality reduction here
        // this.triggerQualityReduction();
    }
    
    /**
     * Get current FPS
     */
    getFPS() {
        return this.fps;
    }
    
    /**
     * Get average frame time
     */
    getAverageFrameTime() {
        if (this.frameTimes.length === 0) return 16.67;
        return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    }
    
    /**
     * Get performance report
     */
    getPerformanceReport() {
        return {
            fps: this.fps,
            averageFrameTime: this.getAverageFrameTime(),
            frameDrops: this.frameTimes.filter(t => t > 33.33).length,
            memory: this.memoryUsage || null,
            simulationTime: SimulationState.simulationTime,
            timeSpeed: SimulationState.timeSpeed
        };
    }
    
    /**
     * Format time display
     */
    formatTime(hours) {
        if (hours < 24) {
            return `${hours.toFixed(1)} hours`;
        } else if (hours < 24 * 30) {
            return `${(hours / 24).toFixed(1)} days`;
        } else if (hours < 24 * 365) {
            return `${(hours / (24 * 30)).toFixed(1)} months`;
        } else {
            return `${(hours / (24 * 365.25)).toFixed(2)} years`;
        }
    }
    
    /**
     * Create detailed stats panel (optional)
     */
    createDetailedStats() {
        const panel = document.createElement('div');
        panel.className = 'detailed-stats-panel';
        panel.style.cssText = `
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 20, 40, 0.9);
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 11px;
            color: #6FE5F5;
            pointer-events: none;
            z-index: 1000;
        `;
        
        panel.innerHTML = `
            <div>FPS: <span id="detailed-fps">60</span></div>
            <div>Frame Time: <span id="detailed-frametime">16.67</span>ms</div>
            <div>Draw Calls: <span id="detailed-drawcalls">0</span></div>
            <div>Triangles: <span id="detailed-triangles">0</span></div>
            <div>Memory: <span id="detailed-memory">0</span>MB</div>
        `;
        
        document.body.appendChild(panel);
        return panel;
    }
    
    /**
     * Toggle detailed stats
     */
    toggleDetailedStats() {
        if (!this.detailedPanel) {
            this.detailedPanel = this.createDetailedStats();
            this.showDetailedStats = true;
        } else {
            this.detailedPanel.style.display = 
                this.detailedPanel.style.display === 'none' ? 'block' : 'none';
            this.showDetailedStats = !this.showDetailedStats;
        }
    }
    
    /**
     * Update detailed stats
     */
    updateDetailedStats(renderer) {
        if (!this.showDetailedStats || !this.detailedPanel) return;
        
        const info = renderer.info;
        
        document.getElementById('detailed-fps').textContent = this.fps;
        document.getElementById('detailed-frametime').textContent = 
            this.getAverageFrameTime().toFixed(2);
        document.getElementById('detailed-drawcalls').textContent = 
            info.render.calls;
        document.getElementById('detailed-triangles').textContent = 
            info.render.triangles;
        
        if (this.memoryUsage) {
            document.getElementById('detailed-memory').textContent = 
                this.memoryUsage.used;
        }
    }
    
    /**
     * Export stats data
     */
    exportStats() {
        return {
            timestamp: Date.now(),
            performance: this.getPerformanceReport(),
            simulation: {
                time: SimulationState.simulationTime,
                timeSpeed: SimulationState.timeSpeed,
                isPaused: SimulationState.isPaused
            }
        };
    }
    
    /**
     * Reset stats
     */
    reset() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        this.frameTimes = [];
        this.lastFpsUpdate = 0;
    }
    
    /**
     * Dispose
     */
    dispose() {
        if (this.detailedPanel) {
            this.detailedPanel.remove();
            this.detailedPanel = null;
        }
        
        this.elements = {};
        this.frameTimes = [];
    }
}
