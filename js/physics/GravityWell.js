// js/physics/GravityWell.js
export class GravityWellVisualizer {
    createGravityWell(body) {
        const size = 100;
        const segments = 50;
        const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        
        const positions = geometry.attributes.position;
        
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            const distance = Math.sqrt(x * x + z * z);
            
            // Gravitational potential: Φ = -GM/r
            const potential = -body.mass / Math.max(distance, body.radius);
            
            // Map potential to height (inverted for well appearance)
            positions.setY(i, potential * 0.001);
        }
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                bodyPosition: { value: body.position },
                bodyMass: { value: body.mass }
            },
            vertexShader: `...`, // Color by potential
            fragmentShader: `...`,
            wireframe: true,
            transparent: true
        });
        
        return new THREE.Mesh(geometry, material);
    }
}
