/**
 * Scientific Constants and Data for Uranus Simulation
 * All values based on NASA Voyager 2 and modern observations
 */

// Physical Constants
export const URANUS_RADIUS = 10; // Base radius units for 3D model
export const URANUS_TILT = 97.77 * Math.PI / 180; // Extreme axial tilt in radians
export const URANUS_ROTATION_PERIOD = 17.24; // Hours (retrograde)
export const URANUS_YEAR = 84 * 365.25 * 24; // Hours in one Uranian year

// Ring System Data
// Distances in Uranus radii, based on actual measurements
export const RINGS_DATA = [
    { 
        name: 'ζ', 
        innerRadius: 1.487 * URANUS_RADIUS, 
        outerRadius: 1.491 * URANUS_RADIUS, 
        opacity: 0.4,
        segments: 256
    },
    { 
        name: '6', 
        innerRadius: 1.637 * URANUS_RADIUS, 
        outerRadius: 1.638 * URANUS_RADIUS, 
        opacity: 0.6,
        segments: 256
    },
    { 
        name: '5', 
        innerRadius: 1.652 * URANUS_RADIUS, 
        outerRadius: 1.653 * URANUS_RADIUS, 
        opacity: 0.6,
        segments: 256
    },
    { 
        name: '4', 
        innerRadius: 1.666 * URANUS_RADIUS, 
        outerRadius: 1.667 * URANUS_RADIUS, 
        opacity: 0.6,
        segments: 256
    },
    { 
        name: 'α', 
        innerRadius: 1.750 * URANUS_RADIUS, 
        outerRadius: 1.752 * URANUS_RADIUS, 
        opacity: 0.8,
        segments: 256
    },
    { 
        name: 'β', 
        innerRadius: 1.786 * URANUS_RADIUS, 
        outerRadius: 1.789 * URANUS_RADIUS, 
        opacity: 0.8,
        segments: 256
    },
    { 
        name: 'η', 
        innerRadius: 1.847 * URANUS_RADIUS, 
        outerRadius: 1.848 * URANUS_RADIUS, 
        opacity: 0.5,
        segments: 256
    },
    { 
        name: 'γ', 
        innerRadius: 1.863 * URANUS_RADIUS, 
        outerRadius: 1.864 * URANUS_RADIUS, 
        opacity: 0.7,
        segments: 256
    },
    { 
        name: 'δ', 
        innerRadius: 1.890 * URANUS_RADIUS, 
        outerRadius: 1.893 * URANUS_RADIUS, 
        opacity: 0.7,
        segments: 256
    },
    { 
        name: 'λ', 
        innerRadius: 1.958 * URANUS_RADIUS, 
        outerRadius: 1.959 * URANUS_RADIUS, 
        opacity: 0.4,
        segments: 256
    },
    { 
        name: 'ε', 
        innerRadius: 2.000 * URANUS_RADIUS, 
        outerRadius: 2.006 * URANUS_RADIUS, 
        opacity: 1.0,
        segments: 512 // Higher resolution for the main ring
    },
    { 
        name: 'ν', 
        innerRadius: 2.586 * URANUS_RADIUS, 
        outerRadius: 2.734 * URANUS_RADIUS, 
        opacity: 0.2,
        segments: 256
    },
    { 
        name: 'μ', 
        innerRadius: 3.366 * URANUS_RADIUS, 
        outerRadius: 4.038 * URANUS_RADIUS, 
        opacity: 0.15,
        segments: 256
    }
];

// Moon Data - The five major moons
// Orbital elements from IAU/NASA ephemeris
export const MOONS_DATA = [
    { 
        name: 'Miranda',
        radius: 0.5, // Relative size for visualization
        distance: 5.08 * URANUS_RADIUS, // 129,900 km / 25,559 km
        period: 33.923, // 1.413 days in hours
        inclination: 4.34 * Math.PI / 180,
        eccentricity: 0.0013,
        color: 0x4A4A4A,
        info: 'Smallest major moon with 20km high cliffs (Verona Rupes)',
        // Additional data for accurate simulation
        meanAnomaly: Math.random() * Math.PI * 2, // Random starting position
        argumentOfPeriapsis: 0,
        longitudeOfAscendingNode: 0
    },
    { 
        name: 'Ariel',
        radius: 0.8,
        distance: 7.47 * URANUS_RADIUS, // 190,900 km
        period: 60.489, // 2.520 days
        inclination: 0.04 * Math.PI / 180,
        eccentricity: 0.0012,
        color: 0x5C5C5C,
        info: 'Brightest moon with youngest surface, possible past ocean',
        meanAnomaly: Math.random() * Math.PI * 2,
        argumentOfPeriapsis: 0,
        longitudeOfAscendingNode: 0
    },
    { 
        name: 'Umbriel',
        radius: 0.8,
        distance: 10.41 * URANUS_RADIUS, // 266,000 km
        period: 99.460, // 4.144 days
        inclination: 0.13 * Math.PI / 180,
        eccentricity: 0.0039,
        color: 0x2E2E2E,
        info: 'Darkest moon with ancient, heavily cratered surface',
        meanAnomaly: Math.random() * Math.PI * 2,
        argumentOfPeriapsis: 0,
        longitudeOfAscendingNode: 0
    },
    { 
        name: 'Titania',
        radius: 1.0,
        distance: 17.07 * URANUS_RADIUS, // 436,300 km
        period: 208.941, // 8.706 days
        inclination: 0.08 * Math.PI / 180,
        eccentricity: 0.0011,
        color: 0x494949,
        info: 'Largest moon, possible subsurface ocean',
        meanAnomaly: Math.random() * Math.PI * 2,
        argumentOfPeriapsis: 0,
        longitudeOfAscendingNode: 0
    },
    { 
        name: 'Oberon',
        radius: 0.95,
        distance: 22.83 * URANUS_RADIUS, // 583,500 km
        period: 323.118, // 13.463 days
        inclination: 0.07 * Math.PI / 180,
        eccentricity: 0.0014,
        color: 0x453939,
        info: 'Most distant major moon, heavily cratered',
        meanAnomaly: Math.random() * Math.PI * 2,
        argumentOfPeriapsis: 0,
        longitudeOfAscendingNode: 0
    }
];

// Magnetosphere Configuration
export const MAGNETOSPHERE_CONFIG = {
    tiltAngle: 58.6 * Math.PI / 180, // Magnetic field tilt from rotation axis
    offsetDistance: 0.31, // Offset from center in planetary radii
    color: 0xff6b9d,
    opacity: 0.2,
    tailLength: 60,
    fieldLineCount: 6
};

// Color Palette
export const COLORS = {
    uranus: {
        main: 0x4FD0E7,
        emissive: 0x0a2a3a,
        specular: 0x6FE5F5,
        atmosphere: 0x6FE5F5,
        glow: 0x4FD0E7
    },
    rings: {
        epsilon: 0xb0c0d0,
        main: 0x808890,
        outer: {
            mu: 0x7a9aba,
            nu: 0x8a7a7a
        },
        glow: 0xc0d0e0
    },
    space: {
        fog: 0x000822,
        stars: 0xffffff
    },
    ui: {
        primary: '#4FD0E7',
        secondary: '#6FE5F5',
        text: '#b0d0e0',
        background: 'rgba(0, 20, 40, 0.9)'
    }
};

// Camera Configuration
export const CAMERA_CONFIG = {
    fov: 60,
    near: 0.1,
    far: 10000,
    initialRadius: 100,
    minRadius: 20,
    maxRadius: 500,
    initialTheta: 0,
    initialPhi: Math.PI / 3,
    rotationSpeed: 0.01,
    zoomSpeed: 0.05
};

// Animation Configuration
export const ANIMATION_CONFIG = {
    defaultTimeSpeed: 1, // hours per second
    minTimeSpeed: 0.01,
    maxTimeSpeed: 1000,
    shimmerSpeed: 0.2,
    shimmerAmplitude: 0.05
};

// Scene Configuration
export const SCENE_CONFIG = {
    fogDensity: 0.0002,
    shadowMapSize: 4096,
    starCount: 20000,
    starFieldRadius: 3000
};

// Help Text
export const HELP_TEXT = `🌌 URANUS SIMULATION CONTROLS 🌌
                
CAMERA:
• Left Click & Drag: Rotate view (full 3D)
• Right Click & Drag: Pan view
• Scroll: Zoom in/out
• Touch: Pinch to zoom, drag to rotate

PANELS:
• Drag panel headers to move
• Click − to minimize, + to expand

ADJUSTMENTS:
• Time Speed: Control simulation speed
• Distance Scale: Spread out moon orbits
• Moon Size: Make moons larger/smaller
• Ring Shine: Adjust metallic shine

QUICK TOGGLES (left side):
⭕ Rings
🌙 Moons  
⚪ Orbits
🧲 Magnetosphere
📝 Labels
📐 Axis Helper

3D COORDINATES:
Bottom right shows camera position
X (Red), Y (Green), Z (Blue) axes

Created with scientific data from NASA Voyager 2`;
