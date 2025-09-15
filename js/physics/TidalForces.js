// js/physics/TidalForces.js
export class TidalForces {
    calculateTidalBulge(moonPosition, moonMass, planetRadius) {
        const distance = moonPosition.length();
        const tidalForce = 2 * this.G * moonMass * planetRadius / Math.pow(distance, 3);
        
        // Calculate bulge height
        const bulgeHeight = tidalForce * Math.pow(planetRadius, 4) / (this.G * this.planetMass);
        
        // Return deformation parameters for shader
        return {
            bulgeDirection: moonPosition.normalize(),
            bulgeHeight: bulgeHeight,
            bulgeWidth: Math.PI / 6 // Angular width of bulge
        };
    }
    
    // Shader for planet deformation
    getDeformationShader() {
        return {
            vertexShader: `
                uniform vec3 bulgeDirection;
                uniform float bulgeHeight;
                uniform float bulgeWidth;
                
                void main() {
                    vec3 pos = position;
                    float alignment = dot(normalize(position), bulgeDirection);
                    float deformation = bulgeHeight * max(0.0, alignment) * 
                                      exp(-pow(acos(alignment) / bulgeWidth, 2.0));
                    pos += normalize(position) * deformation;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `
        };
    }
}
