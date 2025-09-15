// js/physics/HillSphere.js
export class HillSphere {
    calculateHillRadius(moonMass, moonDistance, planetMass) {
        // Hill radius: r_H = a * (m_moon / 3*M_planet)^(1/3)
        return moonDistance * Math.pow(moonMass / (3 * planetMass), 1/3);
    }
    
    createHillSphereVisualization(moon) {
        const radius = this.calculateHillRadius(
            moon.mass, 
            moon.distance, 
            URANUS_MASS
        );
        
        // Create transparent sphere showing gravitational influence
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.1,
            wireframe: true
        });
        
        return new THREE.Mesh(geometry, material);
    }
    
    checkStability(moon) {
        const hillRadius = this.calculateHillRadius(moon.mass, moon.distance, URANUS_MASS);
        const rocheLimit = this.calculateRocheLimit(moon.density);
        
        return {
            stable: moon.distance > rocheLimit && hillRadius > moon.radius * 3,
            hillRadius,
            rocheLimit,
            stabilityFactor: hillRadius / moon.radius
        };
    }
}
