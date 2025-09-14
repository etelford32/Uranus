/**
 * OrbitalMechanics - Calculations for realistic orbital motion
 */

/**
 * Calculate orbital position using Kepler's laws
 * @param {Object} orbitalElements - Orbital parameters
 * @param {number} time - Current simulation time in hours
 * @param {number} distanceScale - Scale factor for distances
 * @returns {THREE.Vector3} Position in 3D space
 */
export function calculateOrbitalPosition(orbitalElements, time, distanceScale = 1) {
    // Extract orbital elements
    const {
        distance,      // Semi-major axis
        period,        // Orbital period in hours
        eccentricity,  // Orbital eccentricity
        inclination,   // Orbital inclination
        argumentOfPeriapsis = 0,  // Argument of periapsis
        longitudeOfAscendingNode = 0  // Longitude of ascending node
    } = orbitalElements;
    
    // Calculate mean motion (radians per hour)
    const meanMotion = (2 * Math.PI) / period;
    
    // Calculate mean anomaly
    const meanAnomaly = (meanMotion * time) % (2 * Math.PI);
    
    // Solve Kepler's equation for eccentric anomaly
    const eccentricAnomaly = solveKeplersEquation(meanAnomaly, eccentricity);
    
    // Calculate true anomaly
    const trueAnomaly = calculateTrueAnomaly(eccentricAnomaly, eccentricity);
    
    // Calculate radius (distance from focus)
    const radius = distance * (1 - eccentricity * eccentricity) / 
                  (1 + eccentricity * Math.cos(trueAnomaly));
    
    // Position in orbital plane
    const x_orbital = radius * Math.cos(trueAnomaly);
    const y_orbital = radius * Math.sin(trueAnomaly);
    
    // Apply orbital orientation
    const position = applyOrbitalOrientation(
        x_orbital,
        y_orbital,
        inclination,
        argumentOfPeriapsis,
        longitudeOfAscendingNode
    );
    
    // Apply distance scale
    position.multiplyScalar(distanceScale);
    
    return position;
}

/**
 * Solve Kepler's equation using Newton-Raphson method
 * M = E - e * sin(E)
 */
function solveKeplersEquation(meanAnomaly, eccentricity, tolerance = 1e-6) {
    let E = meanAnomaly; // Initial guess
    let delta = 1;
    let iterations = 0;
    const maxIterations = 30;
    
    while (Math.abs(delta) > tolerance && iterations < maxIterations) {
        delta = (E - eccentricity * Math.sin(E) - meanAnomaly) / 
                (1 - eccentricity * Math.cos(E));
        E -= delta;
        iterations++;
    }
    
    return E;
}

/**
 * Calculate true anomaly from eccentric anomaly
 */
function calculateTrueAnomaly(eccentricAnomaly, eccentricity) {
    const numerator = Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2);
    const denominator = Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2);
    
    return 2 * Math.atan2(numerator, denominator);
}

/**
 * Apply orbital orientation transformations
 */
function applyOrbitalOrientation(x, y, inclination, argPeriapsis, longAscNode) {
    // Rotation matrices for orbital elements
    const cosI = Math.cos(inclination);
    const sinI = Math.sin(inclination);
    const cosW = Math.cos(argPeriapsis);
    const sinW = Math.sin(argPeriapsis);
    const cosO = Math.cos(longAscNode);
    const sinO = Math.sin(longAscNode);
    
    // Apply transformations
    const xTemp = x * cosW - y * sinW;
    const yTemp = x * sinW + y * cosW;
    
    const xFinal = xTemp * cosO - yTemp * cosI * sinO;
    const yFinal = yTemp * sinI;
    const zFinal = xTemp * sinO + yTemp * cosI * cosO;
    
    return new THREE.Vector3(xFinal, yFinal, zFinal);
}

/**
 * Calculate orbital velocity at a given position
 */
export function calculateOrbitalVelocity(orbitalElements, trueAnomaly) {
    const { distance, eccentricity, period } = orbitalElements;
    
    // Semi-major axis
    const a = distance;
    
    // Standard gravitational parameter (scaled for simulation)
    const mu = (4 * Math.PI * Math.PI * a * a * a) / (period * period);
    
    // Current radius
    const r = a * (1 - eccentricity * eccentricity) / 
             (1 + eccentricity * Math.cos(trueAnomaly));
    
    // Velocity magnitude (vis-viva equation)
    const v = Math.sqrt(mu * (2 / r - 1 / a));
    
    // Velocity components in orbital plane
    const h = Math.sqrt(mu * a * (1 - eccentricity * eccentricity)); // Angular momentum
    const vr = (mu / h) * eccentricity * Math.sin(trueAnomaly); // Radial velocity
    const vt = h / r; // Tangential velocity
    
    return {
        magnitude: v,
        radial: vr,
        tangential: vt
    };
}

/**
 * Calculate synodic period between two orbiting bodies
 */
export function calculateSynodicPeriod(period1, period2) {
    if (period1 === period2) return Infinity;
    
    return Math.abs(1 / (1 / period1 - 1 / period2));
}

/**
 * Calculate phase angle between two moons
 */
export function calculatePhaseAngle(moon1Data, moon2Data, time) {
    const pos1 = calculateOrbitalPosition(moon1Data, time);
    const pos2 = calculateOrbitalPosition(moon2Data, time);
    
    const angle1 = Math.atan2(pos1.z, pos1.x);
    const angle2 = Math.atan2(pos2.z, pos2.x);
    
    let phase = angle2 - angle1;
    
    // Normalize to [0, 2π]
    while (phase < 0) phase += 2 * Math.PI;
    while (phase > 2 * Math.PI) phase -= 2 * Math.PI;
    
    return phase;
}

/**
 * Calculate conjunction/opposition times
 */
export function calculateConjunctionTimes(moon1Data, moon2Data, startTime, endTime, stepSize = 0.1) {
    const conjunctions = [];
    const oppositions = [];
    
    let lastPhase = calculatePhaseAngle(moon1Data, moon2Data, startTime);
    
    for (let time = startTime; time <= endTime; time += stepSize) {
        const currentPhase = calculatePhaseAngle(moon1Data, moon2Data, time);
        
        // Check for conjunction (phase crosses 0)
        if (lastPhase > Math.PI && currentPhase < Math.PI) {
            conjunctions.push(time);
        }
        
        // Check for opposition (phase crosses π)
        if ((lastPhase < Math.PI && currentPhase > Math.PI) ||
            (lastPhase > currentPhase && Math.abs(currentPhase - Math.PI) < 0.1)) {
            oppositions.push(time);
        }
        
        lastPhase = currentPhase;
    }
    
    return { conjunctions, oppositions };
}

/**
 * Calculate orbital elements from state vectors
 */
export function stateVectorsToOrbitalElements(position, velocity, mu) {
    const r = position.length();
    const v = velocity.length();
    
    // Specific orbital energy
    const energy = (v * v) / 2 - mu / r;
    
    // Semi-major axis
    const a = -mu / (2 * energy);
    
    // Eccentricity vector
    const h = new THREE.Vector3().crossVectors(position, velocity);
    const evec = new THREE.Vector3()
        .copy(velocity)
        .cross(h)
        .divideScalar(mu)
        .sub(position.clone().normalize());
    
    const e = evec.length();
    
    // Inclination
    const i = Math.acos(h.z / h.length());
    
    // Longitude of ascending node
    const n = new THREE.Vector3(-h.y, h.x, 0);
    const Omega = n.x >= 0 ? 
        Math.acos(n.x / n.length()) : 
        2 * Math.PI - Math.acos(n.x / n.length());
    
    // Argument of periapsis
    const w = Math.acos(n.dot(evec) / (n.length() * e));
    
    // True anomaly
    const nu = Math.acos(evec.dot(position) / (e * r));
    
    return {
        semiMajorAxis: a,
        eccentricity: e,
        inclination: i,
        longitudeOfAscendingNode: Omega,
        argumentOfPeriapsis: w,
        trueAnomaly: nu
    };
}

/**
 * Predict future position
 */
export function predictPosition(orbitalElements, currentTime, futureTime, distanceScale = 1) {
    return calculateOrbitalPosition(orbitalElements, futureTime, distanceScale);
}

/**
 * Calculate Lagrange points (simplified for circular orbits)
 */
export function calculateLagrangePoints(primaryRadius, moonData) {
    const points = {};
    const { distance } = moonData;
    
    // L1 - Between Uranus and moon
    points.L1 = new THREE.Vector3(distance * 0.85, 0, 0);
    
    // L2 - Beyond moon
    points.L2 = new THREE.Vector3(distance * 1.15, 0, 0);
    
    // L3 - Opposite side of Uranus
    points.L3 = new THREE.Vector3(-distance, 0, 0);
    
    // L4 - Leading triangular point
    const angle4 = Math.PI / 3;
    points.L4 = new THREE.Vector3(
        distance * Math.cos(angle4),
        0,
        distance * Math.sin(angle4)
    );
    
    // L5 - Trailing triangular point
    const angle5 = -Math.PI / 3;
    points.L5 = new THREE.Vector3(
        distance * Math.cos(angle5),
        0,
        distance * Math.sin(angle5)
    );
    
    return points;
}

/**
 * Export all functions as default object for convenience
 */
export default {
    calculateOrbitalPosition,
    calculateOrbitalVelocity,
    calculateSynodicPeriod,
    calculatePhaseAngle,
    calculateConjunctionTimes,
    stateVectorsToOrbitalElements,
    predictPosition,
    calculateLagrangePoints
};
