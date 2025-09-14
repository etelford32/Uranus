/**
 * CameraController - Handles camera movement and positioning
 */

import { CameraState } from '../config/settings.js';
import { CAMERA_CONFIG } from '../config/constants.js';

export default class CameraController {
    constructor(camera) {
        this.camera = camera;
        this.state = CameraState;
        
        // Animation properties
        this.animating = false;
        this.animationStart = null;
        this.animationDuration = 1000;
        this.animationStartValues = {};
        this.animationTargetValues = {};
        
        // Smooth rotation
        this.smoothingFactor = 0.1;
        this.velocityTheta = 0;
        this.velocityPhi = 0;
        
        // Constraints
        this.minPhi = 0.1;
        this.maxPhi = Math.PI - 0.1;
    }
    
    /**
     * Initialize camera controller
     */
    init() {
        this.updatePosition();
        this.camera.lookAt(
            this.state.target.x,
            this.state.target.y,
            this.state.target.z
        );
    }
    
    /**
     * Update camera position based on spherical coordinates
     */
    updatePosition() {
        // Convert spherical to Cartesian coordinates
        const x = this.state.radius * Math.sin(this.state.phi) * Math.cos(this.state.theta);
        const y = this.state.radius * Math.cos(this.state.phi);
        const z = this.state.radius * Math.sin(this.state.phi) * Math.sin(this.state.theta);
        
        this.camera.position.set(x, y, z);
        this.camera.lookAt(
            this.state.target.x,
            this.state.target.y,
            this.state.target.z
        );
        
        // Ensure up vector is correct
        this.camera.up.set(0, 1, 0);
    }
    
    /**
     * Rotate camera around target
     */
    rotate(deltaTheta, deltaPhi) {
        this.state.theta -= deltaTheta;
        this.state.phi = Math.max(
            this.minPhi,
            Math.min(this.maxPhi, this.state.phi + deltaPhi)
        );
        
        this.updatePosition();
    }
    
    /**
     * Zoom camera
     */
    zoom(delta) {
        this.state.radius *= (1 + delta);
        this.state.radius = Math.max(
            CAMERA_CONFIG.minRadius,
            Math.min(CAMERA_CONFIG.maxRadius, this.state.radius)
        );
        
        this.updatePosition();
    }
    
    /**
     * Set zoom level directly
     */
    setZoom(radius) {
        this.state.radius = Math.max(
            CAMERA_CONFIG.minRadius,
            Math.min(CAMERA_CONFIG.maxRadius, radius)
        );
        
        this.updatePosition();
    }
    
    /**
     * Pan camera (move target)
     */
    pan(deltaX, deltaY) {
        // Calculate right and up vectors
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        
        this.camera.getWorldDirection(new THREE.Vector3());
        right.crossVectors(this.camera.up, this.camera.getWorldDirection(new THREE.Vector3()));
        right.normalize();
        
        up.copy(this.camera.up);
        
        // Apply pan
        const panSpeed = this.state.radius * 0.001;
        
        this.state.target.x += right.x * deltaX * panSpeed - up.x * deltaY * panSpeed;
        this.state.target.y += right.y * deltaX * panSpeed - up.y * deltaY * panSpeed;
        this.state.target.z += right.z * deltaX * panSpeed - up.z * deltaY * panSpeed;
        
        this.updatePosition();
    }
    
    /**
     * Reset camera to default position
     */
    reset() {
        this.animateToPosition(
            CAMERA_CONFIG.initialRadius,
            CAMERA_CONFIG.initialTheta,
            CAMERA_CONFIG.initialPhi,
            { x: 0, y: 0, z: 0 }
        );
    }
    
    /**
     * Animate camera to specific position
     */
    animateToPosition(radius, theta, phi, target = null, duration = 1000) {
        this.animating = true;
        this.animationStart = Date.now();
        this.animationDuration = duration;
        
        // Store start values
        this.animationStartValues = {
            radius: this.state.radius,
            theta: this.state.theta,
            phi: this.state.phi,
            target: { ...this.state.target }
        };
        
        // Store target values
        this.animationTargetValues = {
            radius: radius,
            theta: theta,
            phi: phi,
            target: target || this.state.target
        };
    }
    
    /**
     * Animate to specific radius (for moon focus)
     */
    animateToRadius(radius, duration = 1000) {
        this.animateToPosition(
            radius,
            this.state.theta,
            this.state.phi,
            this.state.target,
            duration
        );
    }
    
    /**
     * Update animation
     */
    updateAnimation() {
        if (!this.animating) return;
        
        const now = Date.now();
        const elapsed = now - this.animationStart;
        const progress = Math.min(elapsed / this.animationDuration, 1);
        
        // Easing function (ease-in-out)
        const eased = progress < 0.5 ?
            2 * progress * progress :
            -1 + (4 - 2 * progress) * progress;
        
        // Interpolate values
        this.state.radius = this.lerp(
            this.animationStartValues.radius,
            this.animationTargetValues.radius,
            eased
        );
        
        this.state.theta = this.lerpAngle(
            this.animationStartValues.theta,
            this.animationTargetValues.theta,
            eased
        );
        
        this.state.phi = this.lerp(
            this.animationStartValues.phi,
            this.animationTargetValues.phi,
            eased
        );
        
        if (this.animationTargetValues.target) {
            this.state.target.x = this.lerp(
                this.animationStartValues.target.x,
                this.animationTargetValues.target.x,
                eased
            );
            this.state.target.y = this.lerp(
                this.animationStartValues.target.y,
                this.animationTargetValues.target.y,
                eased
            );
            this.state.target.z = this.lerp(
                this.animationStartValues.target.z,
                this.animationTargetValues.target.z,
                eased
            );
        }
        
        this.updatePosition();
        
        // Check if animation is complete
        if (progress >= 1) {
            this.animating = false;
        }
    }
    
    /**
     * Linear interpolation
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    }
    
    /**
     * Angular interpolation (handles wrapping)
     */
    lerpAngle(start, end, t) {
        let diff = end - start;
        
        // Wrap to [-π, π]
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        
        return start + diff * t;
    }
    
    /**
     * Apply smooth rotation (with momentum)
     */
    applySmoothRotation(deltaTheta, deltaPhi) {
        // Add to velocity
        this.velocityTheta += deltaTheta;
        this.velocityPhi += deltaPhi;
        
        // Apply damping
        const damping = 0.9;
        this.velocityTheta *= damping;
        this.velocityPhi *= damping;
        
        // Apply rotation
        this.rotate(this.velocityTheta, this.velocityPhi);
    }
    
    /**
     * Update camera (call each frame)
     */
    update() {
        // Update animation if active
        this.updateAnimation();
        
        // Apply any smooth rotation
        if (Math.abs(this.velocityTheta) > 0.0001 || Math.abs(this.velocityPhi) > 0.0001) {
            this.rotate(this.velocityTheta, this.velocityPhi);
            
            // Damping
            this.velocityTheta *= 0.95;
            this.velocityPhi *= 0.95;
            
            // Stop if velocity is very small
            if (Math.abs(this.velocityTheta) < 0.0001) this.velocityTheta = 0;
            if (Math.abs(this.velocityPhi) < 0.0001) this.velocityPhi = 0;
        }
    }
    
    /**
     * Get camera state
     */
    getState() {
        return {
            radius: this.state.radius,
            theta: this.state.theta,
            phi: this.state.phi,
            target: { ...this.state.target }
        };
    }
    
    /**
     * Set camera state
     */
    setState(state) {
        if (state.radius !== undefined) this.state.radius = state.radius;
        if (state.theta !== undefined) this.state.theta = state.theta;
        if (state.phi !== undefined) this.state.phi = state.phi;
        if (state.target) {
            this.state.target = { ...state.target };
        }
        
        this.updatePosition();
    }
    
    /**
     * Look at specific object
     */
    lookAt(position) {
        this.state.target.x = position.x;
        this.state.target.y = position.y;
        this.state.target.z = position.z;
        
        this.updatePosition();
    }
    
    /**
     * Get camera direction
     */
    getDirection() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        return direction;
    }
    
    /**
     * Get camera distance from target
     */
    getDistance() {
        return this.state.radius;
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Camera aspect ratio is handled by SceneManager
        // This is here for any additional resize logic
    }
    
    /**
     * Get camera info for UI display
     */
    getInfo() {
        return {
            position: this.camera.position.clone(),
            radius: this.state.radius,
            theta: this.state.theta * 180 / Math.PI,
            phi: (Math.PI/2 - this.state.phi) * 180 / Math.PI, // Convert to elevation
            target: { ...this.state.target }
        };
    }
    
    /**
     * Dispose
     */
    dispose() {
        // Clear references
        this.camera = null;
        this.state = null;
    }
}
