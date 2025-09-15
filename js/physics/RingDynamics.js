// js/physics/RingDynamics.js
export class RingDynamics {
    constructor() {
        this.particles = [];
        this.shepherdMoons = ['Cordelia', 'Ophelia']; // ε ring shepherds
    }
    
    initializeRingParticles(ring) {
        const particleCount = 10000; // Per ring
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = ring.innerRadius + 
                          Math.random() * (ring.outerRadius - ring.innerRadius);
            
            this.particles.push({
                position: new THREE.Vector3(
                    Math.cos(angle) * radius,
                    (Math.random() - 0.5) * 0.1, // Small vertical spread
                    Math.sin(angle) * radius
                ),
                velocity: this.calculateOrbitalVelocity(radius),
                radius: radius,
                ringName: ring.name
            });
        }
    }
    
    applyShepherdingForces(particle, shepherdMoons) {
        let totalForce = new THREE.Vector3();
        
        for (const moon of shepherdMoons) {
            const toMoon = new THREE.Vector3().subVectors(moon.position, particle.position);
            const distance = toMoon.length();
            
            // Gravitational force
            const force = moon.mass / (distance * distance);
            
            // Resonant torques (for gap creation)
            if (this.isInResonance(particle, moon)) {
                force *= 2; // Amplify at resonances
            }
            
            totalForce.add(toMoon.normalize().multiplyScalar(force));
        }
        
        return totalForce;
    }
    
    createDensityWaves(moonPosition, ringParticles) {
        // Spiral density waves from moon gravity
        const waveNumber = 3; // m=3 spiral pattern
        
        ringParticles.forEach(particle => {
            const angle = Math.atan2(particle.position.z, particle.position.x);
            const moonAngle = Math.atan2(moonPosition.z, moonPosition.x);
            const phase = waveNumber * (angle - moonAngle);
            
            const waveAmplitude = 0.1 / particle.position.length();
            particle.position.y += Math.sin(phase) * waveAmplitude;
        });
    }
}
