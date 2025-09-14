/**
 * AnimationLoop - Central animation and update logic
 */

import { SimulationState, PerformanceSettings } from '../config/settings.js';

export default class AnimationLoop {
  constructor(renderer, scene, camera, components = {}) {
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
    this.components.moons?.update?.(
      deltaTime,
      SimulationState.timeSpeed,
      SimulationState.simulationTime
    );
  }

  /**
   * Variable timestep update (for animations and visuals)
   */
  update(deltaTime, alpha) {
    // Update camera
    this.components.cameraController?.update?.(deltaTime, alpha);

    // Update Uranus rotation
    if (this.components.uranus && !SimulationState.isPaused) {
      this.components.uranus.update(deltaTime, SimulationState.timeSpeed);
    }

    // Update rings with moon positions for gravitational effects
    if (this.components.rings && !SimulationState.isPaused) {
      const uranusRotation = this.components.uranus?.getRotation?.() ?? 0;

      const moonPositions =
        this.components.moons?.getCurrentMoonPositions?.() ?? [];

      this.components.rings.update(deltaTime, uranusRotation, moonPositions);
    }

    // Update magnetosphere
    if (this.components.magnetosphere && !SimulationState.isPaused) {
      const uranusRotation = this.components.uranus?.getRotation?.() ?? 0;
      this.components.magnetosphere.update(deltaTime, uranusRotation);
    }

    // Update starfield (very slow rotation)
    this.components.starfield?.update?.(deltaTime);

    // Update stats display
    if (this.components.statsDisplay) {
      const uranusRotation = this.components.uranus?.getRotation?.() ?? 0;
      this.components.statsDisplay.update(uranusRotation);
    }

    // Update camera info in UI
    this.updateCameraInfo();

    // Check for quality adjustments
    this.checkQualityAdjustment();
  }

  /**
   * Render the scene
   */
  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Update camera info display
   */
  updateCameraInfo() {
    const info = this.components.cameraController?.getInfo?.();
    if (!info) return;

    const elements = {
      camX: document.getElementById('camX'),
      camY: document.getElementById('camY'),
      camZ: document.getElementById('camZ'),
      camDist: document.getElementById('camDist'),
      camAzimuth: document.getElementById('camAzimuth'),
      camElevation: document.getElementById('camElevation')
    };

    elements.camX && (elements.camX.textContent = info.position.x.toFixed(1));
    elements.camY && (elements.camY.textContent = info.position.y.toFixed(1));
    elements.camZ && (elements.camZ.textContent = info.position.z.toFixed(1));
    elements.camDist && (elements.camDist.textContent = info.radius.toFixed(1));
    elements.camAzimuth && (elements.camAzimuth.textContent = info.theta.toFixed(1));
    elements.camElevation && (elements.camElevation.textContent = info.phi.toFixed(1));
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(deltaTime) {
    const pm = this.performanceMonitor;
    pm.frameCount += 1;
    pm.totalTime += deltaTime;

    // Update average frame time every 60 frames
    if (pm.frameCount > 60) {
      pm.averageFrameTime = pm.totalTime / pm.frameCount;

      // Reset counters
      pm.frameCount = 0;
      pm.totalTime = 0;
    }

    // Track slow frames (less than ~30 FPS)
    if (deltaTime > 33.33) {
      pm.slowFrames += 1;
    }
  }

  /**
   * Check and adjust quality based on performance
   */
  checkQualityAdjustment() {
    if (!PerformanceSettings.adaptiveQuality) return;

    const { averageFrameTime, frameCount, slowFrames } = this.performanceMonitor;
    const currentQuality = PerformanceSettings.currentQuality;

    // Only check right after averages are refreshed (when frameCount resets to 0)
    if (frameCount !== 0) return;

    // Downgrade quality if performance is poor
    if (averageFrameTime > 33.33 && currentQuality !== 'low') {
      if (currentQuality === 'high') {
        this.setQuality('medium');
      } else if (currentQuality === 'medium') {
        this.setQuality('low');
      }
    }
    // Upgrade quality if performance is good
    else if (averageFrameTime < 16.67 && slowFrames < 5) {
      if (currentQuality === 'low') {
        this.setQuality('medium');
      } else if (currentQuality === 'medium') {
        this.setQuality('high');
      }
    }

    // Reset slow frame counter
    this.performanceMonitor.slowFrames = 0;
  }

  /**
   * Set rendering quality
   */
  setQuality(quality) {
    console.log(`Adjusting quality to: ${quality}`);
    PerformanceSettings.currentQuality = quality;

    this.components.sceneManager?.applyQualitySettings?.(quality);
    this.components.uranus?.updateQuality?.(quality);
    this.components.rings?.updateQuality?.(quality);
    this.components.moons?.updateQuality?.(quality);
    this.components.starfield?.updateQuality?.(quality);
  }

  /**
   * Pause the simulation
   */
  pause() {
    SimulationState.isPaused = true;
  }

  /**
   * Resume the simulation
   */
  resume() {
    SimulationState.isPaused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
  }

  /**
   * Toggle pause state
   */
  togglePause() {
    if (SimulationState.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  /**
   * Set simulation speed
   */
  setTimeSpeed(speed) {
    SimulationState.timeSpeed = speed;
  }

  /**
   * Get current FPS
   */
  getFPS() {
    const aft = this.performanceMonitor.averageFrameTime;
    if (!aft) return 60;
    return Math.round(1000 / aft);
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    return {
      fps: this.getFPS(),
      averageFrameTime: this.performanceMonitor.averageFrameTime,
      slowFrames: this.performanceMonitor.slowFrames,
      quality: PerformanceSettings.currentQuality,
      adaptiveQuality: PerformanceSettings.adaptiveQuality
    };
  }

  /**
   * Enable/disable adaptive quality
   */
  setAdaptiveQuality(enabled) {
    PerformanceSettings.adaptiveQuality = enabled;
  }

  /**
   * Force quality level
   */
  forceQuality(quality) {
    PerformanceSettings.adaptiveQuality = false;
    this.setQuality(quality);
  }

  /**
   * Reset simulation
   */
  reset() {
    SimulationState.simulationTime = 0;
    SimulationState.timeSpeed = 1;
    SimulationState.isPaused = false;
    this.accumulator = 0;
    this.lastTime = performance.now();
  }

  /**
   * Dispose
   */
  dispose() {
    this.stop();

    // Clear references
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.components = null;
  }
}
