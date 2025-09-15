// js/physics/LagrangePoints.js
export class LagrangePointsSystem {
    calculateAllLagrangePoints(moon) {
        const μ = moon.mass / (moon.mass + URANUS_MASS); // Mass ratio
        const a = moon.distance; // Semi-major axis
        
        // L1: Between Uranus and moon
        const l1Distance = a * (1 - Math.pow(μ/3, 1/3));
        
        // L2: Beyond moon
        const l2Distance = a * (1 + Math.pow(μ/3, 1/3));
        
        // L3: Opposite side
        const l3Distance = -a * (1 + 5*μ/12);
        
        // L4 & L5: Trojan points (60° ahead/behind)
        const l4 = {
            x: a * Math.cos(Math.PI/3),
            z: a * Math.sin(Math.PI/3)
        };
        
        return { L1: l1Distance, L2: l2Distance, L3: l3Distance, L4: l4, L5: {...l4, z: -l4.z} };
    }
    
    createStabilityMap(point, moon) {
        // Create heat map showing stability regions
        const resolution = 50;
        const range = moon.distance * 0.2;
        const stabilityData = [];
        
        for (let i = 0; i < resolution; i++) {
            for (let j = 0; j < resolution; j++) {
                const x = point.x + (i - resolution/2) * range/resolution;
                const z = point.z + (j - resolution/2) * range/resolution;
                
                const stability = this.calculateJacobiConstant(x, 0, z, moon);
                stabilityData.push(stability);
            }
        }
        
        return this.createHeatMapTexture(stabilityData, resolution);
    }
}
