/**
 * Enhanced AnimationLoop - Advanced animation and update orchestration
 * Features: Adaptive frame skipping, smooth interpolation, intelligent quality management
 */

import { SimulationState, PerformanceSettings, DisplaySettings } from '../config/settings.js';

// Animation easing functions
const Easing = {
  linear: t => t,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutQuart: t => 1 - Math.pow(1 - t, 4),
  smoothStep: (t, min = 0, max = 1) => {
    const x = Math.max(0, Math.min(1, (t - min) / (max - min)));
    return x * x * (3 - 2 * x);
  }
};

// Performance profiler
class PerformanceProfiler {
  constructor() {
    this.metrics = new Map();
    this.enabled = false;
  }
  
  start(label) {
    if (!this.enabled) return;
    this.metrics.set(label, performance.now());
  }
  
  end(label) {
    if (!this.enabled) return;
    const start = this.metrics.get(label);
    if (start) {
      const duration = performance.now() - start;
      this.metrics.set(`${label}_duration`, duration);
    }
  }
  
  getReport() {
    const report = {};
    for (const [key, value] of this.metrics) {
      if (key.endsWith('_duration')) {
        report[key] = value.toFixed(2);
      }
    }
    return report;
  }
  
  reset() {
    this.metrics.clear();
  }
}

// Frame timing controller
class FrameTimingController {
  constructor(targetFPS = 60) {
    this.targetFPS = targetFPS;
    this.targetFrameTime = 1000 / targetFPS;
    this.frameHistory = [];
    this.maxHistorySize = 120;
    this.adaptiveSync = true;
  }
  
  recordFrame(deltaTime) {
    this.frameHistory.push(deltaTime);
    if (this.frameHistory.length > this.maxHistorySize) {
      this.frameHistory.shift();
    }
  }
  
  getAverageFrameTime() {
    if (this.frameHistory.length === 0) return this.targetFrameTime;
    const sum = this.frameHistory.reduce((a, b) => a + b, 0);
    return sum / this.frameHistory.length;
  }
  
  getFrameTimeVariance() {
    if (this.frameHistory.length < 2) return 0;
    const avg = this.getAverageFrameTime();
    const variance = this.frameHistory.reduce((sum, time) => {
      return sum + Math.pow(time - avg, 2);
    }, 0) / this.frameHistory.length;
    return Math.sqrt(variance);
  }
  
  shouldSkipFrame() {
    const avgTime = this.getAverageFrameTime();
    return avgTime > this.targetFrameTime * 1.5;
  }
  
  getInterpolationFactor() {
    const variance = this.getFrameTimeVariance();
    // Higher variance = more aggressive interpolation
    return Math.min(1, variance / this.targetFrameTime);
  }
}

// Update orchestrator for component dependencies
class UpdateOrchestrator {
  constructor() {
    this.updateOrder = [
      'input',
      'physics',
      'simulation',
      'animation',
      'rendering',
      'ui'
    ];
    this.updateGroups = new Map();
  }
  
  register(component, group, priority = 0) {
    if (!this.updateGroups.has(group)) {
      this.updateGroups.set(group, []);
    }
    this.updateGroups.get(group).push({ component, priority });
    
    // Sort by priority
    const groupArray = this.updateGroups.get(group);
    groupArray.sort((a, b) => b.priority - a.priority);
  }
  
  executeUpdates(deltaTime, updateCallback) {
    for (const group of this.updateOrder) {
      const components = this.updateGroups.get(group) || [];
      for (const { component } of components) {
        updateCallback(component, group, deltaTime);
      }
    }
  }
}

// Main Enhanced AnimationLoop class
export default class AnimationLoop {
  constructor(renderer, scene, camera, components = {}) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.components = components;

    // Enhanced animation state
    this.animationId = null;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.fixedTimeStep = 1000 / 60;
    this.maxSubSteps = 5;
    this.frameCount = 0;
    this.totalTime = 0;
    
    // Interpolation state
    this.interpolationEnabled = true;
    this.interpolationStates = new Map();
    
    // Advanced performance monitoring
    this.performanceMonitor = {
      frameCount: 0,
      totalTime: 0,
      averageFrameTime: 16.67,
      slowFrames: 0,
      droppedFrames: 0,
      qualityChanges: 0,
      lastQualityChange: 0
    };
    
    // Frame timing controller
    this.frameTimer = new FrameTimingController(60);
    
    // Performance profiler
    this.profiler = new PerformanceProfiler();
    this.profiler.enabled = false; // Enable for debugging
    
    // Update orchestrator
    this.orchestrator = new UpdateOrchestrator();
    this.setupUpdateOrchestration();
    
    // Quality adaptation
    this.qualityAdapter = {
      cooldownTime: 5000, // 5 seconds between quality changes
      thresholds: {
        upgrade: { fps: 58, variance: 2 },
        downgrade: { fps: 25, variance: 10 }
      },
      smoothingFactor: 0.1
    };
    
    // Animation state machine
    this.animationState = {
      running: false,
      transitioning: false,
      targetState: null
    };
    
    // Error recovery
    this.errorCount = 0;
    this.maxErrors = 10;
    
    // Bind methods
    this.animate = this.animate.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  /**
   * Setup update orchestration
   */
  setupUpdateOrchestration() {
    // Register components in update groups
    this.orchestrator.register('cameraController', 'input', 10);
    this.orchestrator.register('moons', 'physics', 10);
    this.orchestrator.register('uranus', 'simulation', 10);
    this.orchestrator.register('rings', 'simulation', 5);
    this.orchestrator.register('magnetosphere', 'simulation', 3);
    this.orchestrator.register('starfield', 'animation', 1);
    this.orchestrator.register('statsDisplay', 'ui', 10);
    this.orchestrator.register('panelManager', 'ui', 5);
  }

  /**
   * Start the animation loop
   */
  start() {
    if (this.animationId === null) {
      this.animationState.running = true;
      this.lastTime = performance.now();
      this.totalTime = 0;
      this.frameCount = 0;
      
      console.log('🎬 AnimationLoop started');
      this.animate();
    }
  }

  /**
   * Stop the animation loop
   */
  stop() {
    if (this.animationId !== null) {
      this.animationState.running = false;
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
      
      console.log('🛑 AnimationLoop stopped');
    }
  }

  /**
   * Main animation loop with enhanced error handling
   */
  animate() {
    try {
      this.animationId = requestAnimationFrame(this.animate);
      
      const currentTime = performance.now();
      const rawDeltaTime = currentTime - this.lastTime;
      this.lastTime = currentTime;
      
      // Advanced frame timing
      const deltaTime = this.processFrameTiming(rawDeltaTime);
      
      // Update profiler
      this.profiler.reset();
      this.profiler.start('frame');
      
      // Fixed timestep with improved interpolation
      this.processFixedUpdate(deltaTime);
      
      // Calculate interpolation alpha with smoothing
      const alpha = this.calculateInterpolationAlpha();
      
      // Variable timestep updates with orchestration
      this.processVariableUpdate(deltaTime, alpha);
      
      // Render with optional frame skipping
      this.processRender(deltaTime);
      
      // Update monitoring
      this.updateMonitoring(deltaTime);
      
      // End profiling
      this.profiler.end('frame');
      
      // Reset error count on successful frame
      this.errorCount = 0;
      
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Process frame timing with adaptive sync
   */
  processFrameTiming(rawDeltaTime) {
    // Cap delta time to prevent spiral of death
    let deltaTime = Math.min(rawDeltaTime, 100);
    
    // Record frame for analysis
    this.frameTimer.recordFrame(deltaTime);
    
    // Apply adaptive sync if enabled
    if (this.frameTimer.adaptiveSync) {
      const avgFrameTime = this.frameTimer.getAverageFrameTime();
      const variance = this.frameTimer.getFrameTimeVariance();
      
      // Smooth out spikes
      if (deltaTime > avgFrameTime * 2 && variance < 10) {
        deltaTime = avgFrameTime * 1.5;
        this.performanceMonitor.droppedFrames++;
      }
    }
    
    return deltaTime;
  }

  /**
   * Process fixed timestep updates with substep limiting
   */
  processFixedUpdate(deltaTime) {
    if (SimulationState.isPaused) return;
    
    this.profiler.start('fixed_update');
    
    this.accumulator += deltaTime;
    
    let substeps = 0;
    const adaptiveTimeStep = this.getAdaptiveTimeStep();
    
    while (this.accumulator >= adaptiveTimeStep && substeps < this.maxSubSteps) {
      this.fixedUpdate(adaptiveTimeStep / 1000);
      this.accumulator -= adaptiveTimeStep;
      substeps++;
    }
    
    // Handle excessive accumulation
    if (this.accumulator > adaptiveTimeStep * this.maxSubSteps) {
      console.warn('Excessive accumulation, resetting');
      this.accumulator = adaptiveTimeStep;
    }
    
    this.profiler.end('fixed_update');
  }

  /**
   * Get adaptive timestep based on performance
   */
  getAdaptiveTimeStep() {
    const quality = PerformanceSettings.currentQuality;
    
    switch (quality) {
      case 'low':
        return this.fixedTimeStep * 1.5; // 40 FPS physics
      case 'medium':
        return this.fixedTimeStep; // 60 FPS physics
      case 'high':
        return this.fixedTimeStep * 0.75; // 80 FPS physics
      default:
        return this.fixedTimeStep;
    }
  }

  /**
   * Calculate interpolation alpha with smoothing
   */
  calculateInterpolationAlpha() {
    const adaptiveTimeStep = this.getAdaptiveTimeStep();
    let alpha = this.accumulator / adaptiveTimeStep;
    
    // Apply smoothing based on frame variance
    if (this.interpolationEnabled) {
      const interpolationFactor = this.frameTimer.getInterpolationFactor();
      alpha = Easing.smoothStep(alpha, 0, 1 + interpolationFactor);
    }
    
    return Math.min(alpha, 1);
  }

  /**
   * Fixed timestep update for physics
   */
  fixedUpdate(deltaTime) {
    // Update simulation time
    SimulationState.simulationTime += deltaTime * SimulationState.timeSpeed;
    
    // Update physics if enabled
    if (this.components.physicsEngine && this.components.physicsEngine.enabled) {
        this.components.physicsEngine.update(deltaTime, SimulationState.timeSpeed);
    }
    
    // Update orbital mechanics with interpolation state caching
    if (this.components.moons) {
      this.cacheInterpolationState('moons', this.components.moons.getCurrentMoonPositions());
      this.components.moons.update(
        deltaTime,
        SimulationState.timeSpeed,
        SimulationState.simulationTime
      );
    }
  }

  /**
   * Process variable timestep updates
   */
  processVariableUpdate(deltaTime, alpha) {
    this.profiler.start('variable_update');
    
    // Use orchestrator for organized updates
    this.orchestrator.executeUpdates(deltaTime, (componentName, group, dt) => {
      this.updateComponent(componentName, dt, alpha, group);
    });
    
    this.profiler.end('variable_update');
  }

  /**
   * Update individual component with error handling
   */
  updateComponent(componentName, deltaTime, alpha, group) {
    try {
      const component = this.components[componentName];
      if (!component) return;
      
      switch (componentName) {
        case 'cameraController':
          component.update?.(deltaTime, alpha);
          break;
          
        case 'uranus':
          if (!SimulationState.isPaused) {
            // Smooth rotation with interpolation
            const smoothDelta = this.applySmoothDelta(deltaTime, 'uranus');
            component.update(smoothDelta, SimulationState.timeSpeed);
          }
          break;
          
        case 'rings':
          if (!SimulationState.isPaused) {
            const uranusRotation = this.components.uranus?.getRotation?.() ?? 0;
            const moonPositions = this.getInterpolatedMoonPositions(alpha);
            component.update(deltaTime, uranusRotation, moonPositions);
          }
          break;
          
        case 'magnetosphere':
          if (!SimulationState.isPaused && DisplaySettings.showMagnetosphere) {
            const uranusRotation = this.components.uranus?.getRotation?.() ?? 0;
            component.update(deltaTime, uranusRotation);
          }
          break;
          
        case 'starfield':
          // Very slow rotation, always update
          component.update?.(deltaTime * 0.1); // Slow it down
          break;
          
        case 'statsDisplay':
          const uranusRotation = this.components.uranus?.getRotation?.() ?? 0;
          component.update?.(uranusRotation);
          break;
          
        default:
          // Generic update
          component.update?.(deltaTime, alpha);
      }
      
    } catch (error) {
      console.error(`Error updating ${componentName}:`, error);
    }
  }

  /**
   * Apply smooth delta for component updates
   */
  applySmoothDelta(deltaTime, componentName) {
    const smoothingFactor = 0.1;
    const prevDelta = this.interpolationStates.get(`${componentName}_delta`) || deltaTime;
    const smoothDelta = prevDelta + (deltaTime - prevDelta) * smoothingFactor;
    this.interpolationStates.set(`${componentName}_delta`, smoothDelta);
    return smoothDelta;
  }

  /**
   * Get interpolated moon positions
   */
  getInterpolatedMoonPositions(alpha) {
    const current = this.components.moons?.getCurrentMoonPositions?.() ?? [];
    const previous = this.interpolationStates.get('moons') ?? current;
    
    if (!this.interpolationEnabled || alpha >= 1) {
      return current;
    }
    
    // Interpolate positions
    return current.map((moon, index) => {
      if (!previous[index]) return moon;
      
      const interpolated = {
        name: moon.name,
        type: moon.type,
        position: new THREE.Vector3().lerpVectors(
          previous[index].position,
          moon.position,
          alpha
        )
      };
      
      return interpolated;
    });
  }

  /**
   * Cache interpolation state
   */
  cacheInterpolationState(key, value) {
    if (this.interpolationEnabled) {
      this.interpolationStates.set(key, value);
    }
  }

  /**
   * Process rendering with optional frame skipping
   */
  processRender(deltaTime) {
    this.profiler.start('render');
    
    // Check if we should skip this frame
    if (this.shouldSkipFrame(deltaTime)) {
      this.performanceMonitor.droppedFrames++;
      this.profiler.end('render');
      return;
    }
    
    // Update camera info before render
    this.updateCameraInfo();
    
    // Render the scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
    
    this.profiler.end('render');
  }

  /**
   * Determine if frame should be skipped
   */
  shouldSkipFrame(deltaTime) {
    // Never skip if quality is high
    if (PerformanceSettings.currentQuality === 'high') {
      return false;
    }
    
    // Skip if running way behind
    if (deltaTime > 50 && this.frameCount % 2 === 0) {
      return true;
    }
    
    // Adaptive frame skipping based on performance
    if (this.frameTimer.shouldSkipFrame() && this.frameCount % 3 === 0) {
      return true;
    }
    
    return false;
  }

  /**
   * Update monitoring and statistics
   */
  updateMonitoring(deltaTime) {
    this.frameCount++;
    this.totalTime += deltaTime;
    
    // Update performance metrics
    this.updatePerformanceMetrics(deltaTime);
    
    // Check for quality adjustments
    this.checkQualityAdjustment();
    
    // Log performance report periodically
    if (this.frameCount % 300 === 0 && this.profiler.enabled) {
      console.log('Performance Report:', this.profiler.getReport());
    }
  }

  /**
   * Update performance metrics with enhanced tracking
   */
  updatePerformanceMetrics(deltaTime) {
    const pm = this.performanceMonitor;
    pm.frameCount += 1;
    pm.totalTime += deltaTime;

    // Update average frame time every 60 frames
    if (pm.frameCount >= 60) {
      pm.averageFrameTime = pm.totalTime / pm.frameCount;
      
      // Calculate FPS
      const fps = Math.round(1000 / pm.averageFrameTime);
      
      // Dispatch performance event
      if (this.renderer && this.renderer.domElement) {
        this.renderer.domElement.dispatchEvent(new CustomEvent('performanceUpdate', {
          detail: {
            fps,
            averageFrameTime: pm.averageFrameTime,
            droppedFrames: pm.droppedFrames,
            quality: PerformanceSettings.currentQuality
          }
        }));
      }
      
      // Reset counters
      pm.frameCount = 0;
      pm.totalTime = 0;
      pm.droppedFrames = 0;
    }

    // Track slow frames
    if (deltaTime > 33.33) {
      pm.slowFrames += 1;
    }
  }

  /**
   * Enhanced quality adjustment with cooldown
   */
  checkQualityAdjustment() {
    if (!PerformanceSettings.adaptiveQuality) return;
    
    const now = performance.now();
    const { cooldownTime, thresholds } = this.qualityAdapter;
    
    // Check cooldown
    if (now - this.performanceMonitor.lastQualityChange < cooldownTime) {
      return;
    }
    
    const avgFrameTime = this.frameTimer.getAverageFrameTime();
    const variance = this.frameTimer.getFrameTimeVariance();
    const fps = Math.round(1000 / avgFrameTime);
    const currentQuality = PerformanceSettings.currentQuality;
    
    // Determine if quality change is needed
    let newQuality = currentQuality;
    
    if (fps < thresholds.downgrade.fps || variance > thresholds.downgrade.variance) {
      // Downgrade quality
      if (currentQuality === 'high') {
        newQuality = 'medium';
      } else if (currentQuality === 'medium') {
        newQuality = 'low';
      }
    } else if (fps > thresholds.upgrade.fps && variance < thresholds.upgrade.variance) {
      // Upgrade quality
      if (currentQuality === 'low') {
        newQuality = 'medium';
      } else if (currentQuality === 'medium' && fps > thresholds.upgrade.fps + 2) {
        newQuality = 'high';
      }
    }
    
    // Apply quality change with smooth transition
    if (newQuality !== currentQuality) {
      this.transitionQuality(currentQuality, newQuality);
      this.performanceMonitor.lastQualityChange = now;
      this.performanceMonitor.qualityChanges++;
    }
  }

  /**
   * Smooth quality transition
   */
  transitionQuality(fromQuality, toQuality) {
    console.log(`📊 Quality transition: ${fromQuality} → ${toQuality}`);
    
    this.animationState.transitioning = true;
    this.animationState.targetState = toQuality;
    
    // Fade out effect
    const fadeOutDuration = 200;
    const startOpacity = this.renderer.domElement.style.opacity || 1;
    
    const fadeOut = (timestamp) => {
      const elapsed = timestamp - performance.now();
      const progress = Math.min(elapsed / fadeOutDuration, 1);
      const opacity = startOpacity * (1 - progress * 0.3); // Fade to 70%
      
      this.renderer.domElement.style.opacity = opacity;
      
      if (progress < 1) {
        requestAnimationFrame(fadeOut);
      } else {
        // Apply quality change
        this.setQuality(toQuality);
        
        // Fade back in
        requestAnimationFrame(() => {
          this.renderer.domElement.style.opacity = startOpacity;
          this.animationState.transitioning = false;
        });
      }
    };
    
    requestAnimationFrame(fadeOut);
  }

  /**
   * Set rendering quality
   */
  setQuality(quality) {
    PerformanceSettings.currentQuality = quality;
    
    // Update all components
    this.components.sceneManager?.applyQualitySettings?.(quality);
    this.components.uranus?.updateQuality?.(quality);
    this.components.rings?.updateQuality?.(quality);
    this.components.moons?.updateQuality?.(quality);
    this.components.starfield?.updateQuality?.(quality);
    
    // Adjust settings based on quality
    switch (quality) {
      case 'low':
        this.maxSubSteps = 3;
        this.interpolationEnabled = false;
        break;
      case 'medium':
        this.maxSubSteps = 5;
        this.interpolationEnabled = true;
        break;
      case 'high':
        this.maxSubSteps = 7;
        this.interpolationEnabled = true;
        break;
    }
    
    console.log(`✅ Quality set to: ${quality}`);
  }

  /**
   * Update camera info display
   */
  updateCameraInfo() {
    const info = this.components.cameraController?.getInfo?.();
    if (!info) return;

    // Cache DOM elements for performance
    if (!this.cameraInfoElements) {
      this.cameraInfoElements = {
        camX: document.getElementById('camX'),
        camY: document.getElementById('camY'),
        camZ: document.getElementById('camZ'),
        camDist: document.getElementById('camDist'),
        camAzimuth: document.getElementById('camAzimuth'),
        camElevation: document.getElementById('camElevation')
      };
    }

    const e = this.cameraInfoElements;
    if (e.camX) e.camX.textContent = info.position.x.toFixed(1);
    if (e.camY) e.camY.textContent = info.position.y.toFixed(1);
    if (e.camZ) e.camZ.textContent = info.position.z.toFixed(1);
    if (e.camDist) e.camDist.textContent = info.radius.toFixed(1);
    if (e.camAzimuth) e.camAzimuth.textContent = info.theta.toFixed(1);
    if (e.camElevation) e.camElevation.textContent = info.phi.toFixed(1);
  }

  /**
   * Handle errors gracefully
   */
  handleError(error) {
    console.error('AnimationLoop error:', error);
    this.errorCount++;
    
    if (this.errorCount > this.maxErrors) {
      console.error('Too many errors, stopping animation loop');
      this.stop();
      
      // Display error to user
      const loading = document.getElementById('loading');
      if (loading) {
        loading.style.display = 'block';
        loading.innerHTML = `
          <div style="color: #ff6b6b;">
            <div>⚠️ Animation Error</div>
            <div style="font-size: 14px; margin-top: 10px;">
              The animation has encountered an error and stopped.
              Please refresh the page.
            </div>
          </div>
        `;
      }
    }
  }

  /**
   * Pause the simulation
   */
  pause() {
    SimulationState.isPaused = true;
    console.log('⏸️ Simulation paused');
  }

  /**
   * Resume the simulation
   */
  resume() {
    SimulationState.isPaused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
    console.log('▶️ Simulation resumed');
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
   * Set simulation speed with smooth transition
   */
  setTimeSpeed(speed, duration = 500) {
    const startSpeed = SimulationState.timeSpeed;
    const startTime = performance.now();
    
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = Easing.easeInOutCubic(progress);
      
      SimulationState.timeSpeed = startSpeed + (speed - startSpeed) * eased;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  /**
   * Get current FPS
   */
  getFPS() {
    const avgFrameTime = this.frameTimer.getAverageFrameTime();
    return Math.round(1000 / avgFrameTime);
  }

  /**
   * Get detailed performance report
   */
  getPerformanceReport() {
    return {
      fps: this.getFPS(),
      averageFrameTime: this.frameTimer.getAverageFrameTime(),
      frameTimeVariance: this.frameTimer.getFrameTimeVariance(),
      slowFrames: this.performanceMonitor.slowFrames,
      droppedFrames: this.performanceMonitor.droppedFrames,
      qualityChanges: this.performanceMonitor.qualityChanges,
      quality: PerformanceSettings.currentQuality,
      adaptiveQuality: PerformanceSettings.adaptiveQuality,
      interpolationEnabled: this.interpolationEnabled,
      errorCount: this.errorCount
    };
  }

  /**
   * Enable/disable adaptive quality
   */
  setAdaptiveQuality(enabled) {
    PerformanceSettings.adaptiveQuality = enabled;
    console.log(`Adaptive quality: ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Force quality level
   */
  forceQuality(quality) {
    PerformanceSettings.adaptiveQuality = false;
    this.setQuality(quality);
  }

  /**
   * Enable/disable interpolation
   */
  setInterpolation(enabled) {
    this.interpolationEnabled = enabled;
    console.log(`Interpolation: ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Enable/disable performance profiling
   */
  setProfilingEnabled(enabled) {
    this.profiler.enabled = enabled;
    console.log(`Profiling: ${enabled ? 'enabled' : 'disabled'}`);
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
    this.frameCount = 0;
    this.totalTime = 0;
    this.errorCount = 0;
    this.interpolationStates.clear();
    this.frameTimer.frameHistory = [];
    
    console.log('🔄 Simulation reset');
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.stop();
    
    // Clear all maps
    this.interpolationStates.clear();
    this.orchestrator.updateGroups.clear();
    
    // Clear cached elements
    this.cameraInfoElements = null;
    
    // Clear references
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.components = null;
    this.frameTimer = null;
    this.profiler = null;
    this.orchestrator = null;
    
    console.log('🗑️ AnimationLoop disposed');
  }
}
