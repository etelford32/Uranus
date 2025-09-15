// js/physics/RocheLimit.js
export class RocheLimit {
    calculateRigidBodyLimit(planetRadius, planetDensity, moonDensity) {
        // Roche limit for rigid body: d = 2.456 * R * (ρ_planet/ρ_moon)^(1/3)
        return 2.456 * planetRadius * Math.pow(planetDensity / moonDensity, 1/3);
    }
    
    calculateFluidLimit(planetRadius, planetDensity, moonDensity) {
        // Fluid Roche limit: d = 2.88 * R * (ρ_planet/ρ_moon)^(1/3)
        return 2.88 * planetRadius * Math.pow(planetDensity / moonDensity, 1/3);
    }
    
    visualizeTidalStress(moon) {
        const stress = this.calculateTidalStress(moon);
        
        // Color moon by stress level
        const color = new THREE.Color();
        color.setHSL(
            0.7 - stress * 0.7, // Blue to red
            1.0,
            0.5
        );
        
        moon.material.emissive = color;
        moon.material.emissiveIntensity = stress;
    }
}
