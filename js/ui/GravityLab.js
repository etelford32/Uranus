// js/ui/GravityLab.js
export class GravityLab {
    constructor() {
        this.testBodies = [];
        this.trajectoryPrediction = true;
        this.showPotentialField = false;
    }
    
    launchTestParticle(position, velocity) {
        const particle = {
            position: position.clone(),
            velocity: velocity.clone(),
            mass: 1, // Negligible mass
            trail: new TrajectoryTrail()
        };
        
        this.testBodies.push(particle);
        
        // Predict trajectory
        if (this.trajectoryPrediction) {
            this.predictTrajectory(particle, 1000); // 1000 steps
        }
    }
    
    createGravityFieldVisualization() {
        // Create vector field showing gravitational acceleration
        const arrows = [];
        const gridSize = 20;
        
        for (let x = -gridSize; x <= gridSize; x += 2) {
            for (let z = -gridSize; z <= gridSize; z += 2) {
                const position = new THREE.Vector3(x * 10, 0, z * 10);
                const acceleration = this.calculateNetGravity(position);
                
                const arrow = new THREE.ArrowHelper(
                    acceleration.normalize(),
                    position,
                    acceleration.length() * 100,
                    0x00ff00
                );
                
                arrows.push(arrow);
            }
        }
        
        return arrows;
    }
}
