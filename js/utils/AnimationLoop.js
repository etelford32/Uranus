/**
 * AnimationLoop - Central animation and update logic
 */

import { SimulationState, PerformanceSettings } from '../config/settings.js';

export default class AnimationLoop {
    constructor(renderer, scene, camera, components) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.components = components;
        
        // Animation state
        this.animationId = null;
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.fixedTimeStep = 1000 / 60; // 60 FPS fixed timestep
        this.maxSubSteps = 5;
        
        // Performance monitoring
        this.performanceMonitor = {
            frameCount: 0,
            totalTime: 0,
            averageFrameTime: 16.67,
            slowFrames: 0
        };
        
        // Bind the animation function
        this.animate = this.animate.bind(this);
    }
    
    /**
     * Start the animation loop
     */
    start() {
        if (this.animationId === null) {
            this.lastTime = performance.now();
            this.animate();
        }
    }
    
    /**
     * Stop the animation loop
     */
    stop() {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    /**
     * Main animation loop
     */
    animate() {
        this.animationId = requestAnimationFrame(this.animate);
        
        const currentTime = performance.now();
        const rawDeltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Cap delta time to prevent spiral of death
        const deltaTime = Math.min(rawDeltaTime, 100);
        
        // Update performance metrics
        this.updatePerformanceMetrics(deltaTime);
        
        // Fixed timestep with interpolation for physics
        this.accumulator += deltaTime;
        
        let substeps = 0;
        while (this.accumulator >= this.fixedTimeStep && substeps < this.maxSubSteps) {
            this.fixedUpdate(this.fixedTimeStep / 1000); // Convert to seconds
            this.accumulator -= this.fixedTimeStep;
            substeps++;
        }
        
        // Interpolation alpha for smooth rendering
        const alpha = this.accumulator / this.fixedTimeStep;
        
        // Variable timestep updates (animations, camera, etc.)
        this.update(deltaTime / 1000, alpha); // Convert to seconds
        
        // Render the scene
        this.render();
    }
    
    /**
     * Fixed timestep update (for physics and orbital mechanics)
     */
    fixedUpdate(deltaTime) {
        if (SimulationState.isPaused) return;
        
        // Update simulation time
        SimulationState.simulationTime += deltaTime * SimulationState.timeSpeed;
        
        // Update orbital mechanics with fixed timestep
        if (this.components.moons) {
            this.components.moons.update(
                deltaTime,
                SimulationState.timeSpeed,
                SimulationState.simulationTime
            );
        }
    }
    
    /**
     * Variable timestep update (for animations and visuals)
     */
    update(deltaTime, alpha) {
    // Update camera first (needed for other components)
    if (this.components.cameraController) {
        this.components.cameraController.update();
    }
    
    // Get camera for components that need it
    const camera = this.camera || (this.components.cameraController ? this.components.cameraController.camera : null);
    
    // === PLANETARY SYSTEM UPDATES === //
    
    // Update Uranus rotation (central body)
    let uranusRotation = 0;
    let uranusPosition = new THREE.Vector3(0, 0, 0);
    
    if (this.components.uranus && !SimulationState.isPaused) {
        this.components.uranus.update(deltaTime, SimulationState.timeSpeed);
        uranusRotation = this.components.uranus.getRotation();
        uranusPosition = this.components.uranus.getWorldPosition();
    }
    
    // === MOON SYSTEM UPDATES === //
    
    // Update moon positions and get their current state
    let moonPositions = [];
    let moonVelocities = [];
    let moonMasses = [];
    
    if (this.components.moons && !SimulationState.isPaused) {
        // Update moon orbital mechanics
        this.components.moons.update(
            deltaTime,
            SimulationState.timeSpeed,
            SimulationState.simulationTime
        );
        
        // Get current moon positions for gravitational calculations
        if (typeof this.components.moons.getCurrentMoonPositions === 'function') {
            moonPositions = this.components.moons.getCurrentMoonPositions();
        }
        
        // Get moon velocities if available (for more accurate physics)
        if (typeof this.components.moons.getCurrentMoonVelocities === 'function') {
            moonVelocities = this.components.moons.getCurrentMoonVelocities();
        }
        
        // Get moon masses if available
        if (typeof this.components.moons.getMoonMasses === 'function') {
            moonMasses = this.components.moons.getMoonMasses();
        }
    }
    
    // === RING SYSTEM UPDATES WITH GRAVITATIONAL EFFECTS === //
    
    if (this.components.rings && !SimulationState.isPaused) {
        // Pass all relevant data to rings for gravitational calculations
        this.components.rings.update(deltaTime, uranusRotation, moonPositions);
        
        // Optional: Add ring-moon interaction feedback
        if (typeof this.components.rings.getRingDensityAt === 'function' && moonPositions.length > 0) {
            // Check if any moons are passing through ring plane
            moonPositions.forEach((moonPos, index) => {
                const moonY = Math.abs(moonPos.y);
                if (moonY < 1.0) { // Moon is near ring plane
                    // Could trigger special effects like ring waves
                    if (typeof this.components.rings.createMoonWake === 'function') {
                        this.components.rings.createMoonWake(moonPos, moonVelocities[index]);
                    }
                }
            });
        }
    }
    
    // === MAGNETOSPHERE UPDATES === //
    
    if (this.components.magnetosphere && !SimulationState.isPaused) {
        this.components.magnetosphere.update(deltaTime, uranusRotation);
        
        // Optional: Add magnetosphere-moon interactions
        if (typeof this.components.magnetosphere.updateMoonInteractions === 'function') {
            this.components.magnetosphere.updateMoonInteractions(moonPositions);
        }
        
        // Optional: Aurora intensity based on solar wind (simplified)
        if (typeof this.components.magnetosphere.setAuroraIntensity === 'function') {
            const solarWindStrength = 0.5 + 0.5 * Math.sin(SimulationState.simulationTime * 0.001);
            this.components.magnetosphere.setAuroraIntensity(solarWindStrength);
        }
    }
    
    // === BACKGROUND UPDATES === //
    
    // Update starfield (very slow rotation for realism)
    if (this.components.starfield) {
        this.components.starfield.update(deltaTime);
        
        // Optional: Parallax effect based on camera movement
        if (camera && typeof this.components.starfield.updateParallax === 'function') {
            this.components.starfield.updateParallax(camera.position);
        }
    }
    
    // === UI AND STATS UPDATES === //
    
    // Update stats display with comprehensive data
    if (this.components.statsDisplay) {
        this.components.statsDisplay.update(uranusRotation);
        
        // Pass additional stats if the display supports them
        if (typeof this.components.statsDisplay.updateExtendedStats === 'function') {
            const extendedStats = {
                moonCount: moonPositions.length,
                ringOpacity: this.components.rings ? this.components.rings.getAverageOpacity() : 1.0,
                magnetosphereActive: this.components.magnetosphere ? this.components.magnetosphere.group.visible : false,
                cameraDistance: camera ? camera.position.length() : 0,
                simulationSpeed: SimulationState.timeSpeed,
                quality: PerformanceSettings.currentQuality
            };
            this.components.statsDisplay.updateExtendedStats(extendedStats);
        }
    }
    
    // Update camera info in UI
    this.updateCameraInfo();
    
    // === PERFORMANCE MONITORING === //
    
    // Check for quality adjustments based on performance
    this.checkQualityAdjustment();
    
    // === INTERPOLATION FOR SMOOTH RENDERING === //
    
    // Apply interpolation for smoother visual updates (alpha blending)
    if (alpha < 1.0 && !SimulationState.isPaused) {
        this.applyInterpolation(alpha);
    }
    
    // === SPECIAL EFFECTS AND EVENTS === //
    
    // Check for special astronomical events
    this.checkAstronomicalEvents();
    
    // Update any particle effects
    if (this.components.particleEffects) {
        this.components.particleEffects.update(deltaTime);
    }
    
    // === DEBUG VISUALIZATIONS === //
    
    // Update debug visualizations if enabled
    if (this.debugMode) {
        this.updateDebugVisualizations();
    }
}

/**
 * Apply interpolation for smooth rendering between physics steps
 */
applyInterpolation(alpha) {
    // Interpolate moon positions for smooth motion
    if (this.components.moons && typeof this.components.moons.interpolatePositions === 'function') {
        this.components.moons.interpolatePositions(alpha);
    }
    
    // Interpolate ring particles if supported
    if (this.components.rings && typeof this.components.rings.interpolateParticles === 'function') {
        this.components.rings.interpolateParticles(alpha);
    }
}

/**
 * Check for special astronomical events (eclipses, conjunctions, etc.)
 */
checkAstronomicalEvents() {
    const currentTime = SimulationState.simulationTime;
    
    // Check for moon-moon conjunctions
    if (this.components.moons && typeof this.components.moons.checkConjunctions === 'function') {
        const conjunctions = this.components.moons.checkConjunctions();
        if (conjunctions.length > 0) {
            // Trigger visual effects for conjunctions
            conjunctions.forEach(conjunction => {
                console.log(`Conjunction: ${conjunction.moon1} and ${conjunction.moon2} at angle ${conjunction.angle}°`);
            });
        }
    }
    
    // Check for moon eclipses (moon in Uranus's shadow)
    if (this.components.moons && typeof this.components.moons.checkEclipses === 'function') {
        const eclipses = this.components.moons.checkEclipses(this.components.uranus);
        if (eclipses.length > 0) {
            // Darken eclipsed moons
            eclipses.forEach(moonName => {
                if (typeof this.components.moons.setMoonBrightness === 'function') {
                    this.components.moons.setMoonBrightness(moonName, 0.3); // 30% brightness
                }
            });
        }
    }
    
    // Check for ring plane crossing events
    if (this.lastRingPlaneAngle !== undefined) {
        const currentAngle = uranusRotation % (Math.PI * 2);
        const crossingThreshold = 0.1; // radians
        
        // Check if we've crossed the ring plane
        if (Math.abs(currentAngle - Math.PI/2) < crossingThreshold || 
            Math.abs(currentAngle - 3*Math.PI/2) < crossingThreshold) {
            if (!this.ringPlaneCrossing) {
                this.ringPlaneCrossing = true;
                console.log('Ring plane crossing event!');
                
                // Temporarily reduce ring opacity for edge-on view
                if (this.components.rings && typeof this.components.rings.setEdgeOnMode === 'function') {
                    this.components.rings.setEdgeOnMode(true);
                }
            }
        } else {
            if (this.ringPlaneCrossing) {
                this.ringPlaneCrossing = false;
                if (this.components.rings && typeof this.components.rings.setEdgeOnMode === 'function') {
                    this.components.rings.setEdgeOnMode(false);
                }
            }
        }
    }
    this.lastRingPlaneAngle = uranusRotation % (Math.PI * 2);
}

/**
 * Update debug visualizations
 */
updateDebugVisualizations() {
    // Visualize gravitational field lines
    if (this.debugGravityField && this.components.moons) {
        const positions = this.components.moons.getCurrentMoonPositions();
        // Update gravity field visualization
        this.debugGravityField.update(positions);
    }
    
    // Visualize orbital paths
    if (this.debugOrbitalPaths && this.components.moons) {
        // Update predicted orbital paths
        this.debugOrbitalPaths.update(SimulationState.simulationTime);
    }
    
    // Show performance overlay
    if (this.debugPerformance) {
        const stats = this.getPerformanceReport();
        this.debugPerformance.update(stats);
    }
}
