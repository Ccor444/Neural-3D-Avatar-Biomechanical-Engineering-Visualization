class PhysicsEngine {
    constructor() {
        this.gravity = 9.8;
        this.damping = 0.95;
        this.stiffness = 0.15;
        this.enabled = false;
        this.timeStep = 1/60; // 60 FPS
        
        this.springs = [];
        this.masses = [];
        this.constraints = [];
        this.originalPositions = new Map(); // Store original positions
    }
    
    init(meshData) {
        if (!meshData) return;
        
        // Parse physics data from mesh
        this.parsePhysicsData(meshData);
        
        console.log('Physics engine initialized with', this.masses.length, 'masses and', this.springs.length, 'springs');
    }
    
    parsePhysicsData(meshData) {
        // Clear existing data
        this.masses = [];
        this.springs = [];
        this.constraints = [];
        this.originalPositions.clear();
        
        // Create masses from vertices
        meshData.vertices.forEach(vertex => {
            const mass = {
                id: vertex.id,
                position: { x: vertex.x, y: vertex.y, z: vertex.z },
                originalPosition: { x: vertex.x, y: vertex.y, z: vertex.z },
                velocity: { x: 0, y: 0, z: 0 },
                force: { x: 0, y: 0, z: 0 },
                mass: vertex.weight * 10, // Scale weight to mass
                fixed: vertex.type === 'joint' || vertex.group.includes('head'), // Joints and head are fixed
                group: vertex.group,
                type: vertex.type
            };
            
            this.masses.push(mass);
            this.originalPositions.set(vertex.id, { x: vertex.x, y: vertex.y, z: vertex.z });
        });
        
        // Create springs from edges
        meshData.edges.forEach(edge => {
            const v1 = this.masses.find(m => m.id === edge[0]);
            const v2 = this.masses.find(m => m.id === edge[1]);
            
            if (v1 && v2) {
                const dx = v2.position.x - v1.position.x;
                const dy = v2.position.y - v1.position.y;
                const dz = v2.position.z - v1.position.z;
                const length = Math.sqrt(dx*dx + dy*dy + dz*dz);
                
                const spring = {
                    mass1: v1,
                    mass2: v2,
                    restLength: length,
                    stiffness: (meshData.physics?.springs?.muscleTension || 0.3) * this.stiffness,
                    damping: 0.1
                };
                
                this.springs.push(spring);
            }
        });
        
        // Add constraints from biomechanical data
        if (meshData.metadata?.biomechanical?.jointConstraints) {
            this.addJointConstraints();
        }
        
        // Add collision constraints for body parts
        this.addCollisionConstraints();
    }
    
    addJointConstraints() {
        // Add distance constraints for major joints
        const jointConstraints = [
            // Head constraints
            ['head_top', 'neck_top_center', 15],
            ['head_chin', 'neck_top_front', 8],
            
            // Shoulder constraints
            ['shoulder_left_top', 'clavicle_left', 12],
            ['shoulder_right_top', 'clavicle_right', 12],
            
            // Hip constraints
            ['hip_left', 'waist_left', 10],
            ['hip_right', 'waist_right', 10],
            
            // Spine constraints
            ['neck_base_center', 'spine_center', 30],
            ['spine_center', 'waist_center_front', 15]
        ];
        
        jointConstraints.forEach(([id1, id2, distance]) => {
            const m1 = this.masses.find(m => m.id === id1);
            const m2 = this.masses.find(m => m.id === id2);
            
            if (m1 && m2) {
                this.constraints.push({
                    type: 'distance',
                    mass1: m1,
                    mass2: m2,
                    distance: distance,
                    stiffness: 0.9
                });
            }
        });
    }
    
    addCollisionConstraints() {
        // Add simple ground collision constraint
        const groundY = -50; // Ground level
        
        this.masses.forEach(mass => {
            if (!mass.fixed && mass.position.y < groundY) {
                this.constraints.push({
                    type: 'collision',
                    mass: mass,
                    groundY: groundY,
                    restitution: 0.7
                });
            }
        });
    }
    
    update(deltaTime = this.timeStep) {
        if (!this.enabled || deltaTime <= 0) return;
        
        // Apply forces
        this.applyForces();
        
        // Integrate velocities and positions
        this.integrate(deltaTime);
        
        // Apply constraints
        this.applyConstraints();
        
        // Handle collisions
        this.handleCollisions();
        
        // Clear forces for next frame
        this.clearForces();
        
        return this.getMassPositions();
    }
    
    applyForces() {
        // Apply gravity to all non-fixed masses
        this.masses.forEach(mass => {
            if (!mass.fixed) {
                mass.force.y -= mass.mass * this.gravity;
            }
        });
        
        // Apply spring forces
        this.springs.forEach(spring => {
            const dx = spring.mass2.position.x - spring.mass1.position.x;
            const dy = spring.mass2.position.y - spring.mass1.position.y;
            const dz = spring.mass2.position.z - spring.mass1.position.z;
            
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            // Avoid division by zero
            if (distance === 0) return;
            
            const displacement = distance - spring.restLength;
            
            // Spring force (Hooke's Law)
            const forceMagnitude = spring.stiffness * displacement;
            
            // Normalize direction vector
            const dirX = dx / distance;
            const dirY = dy / distance;
            const dirZ = dz / distance;
            
            // Apply forces to masses
            if (!spring.mass1.fixed) {
                spring.mass1.force.x += forceMagnitude * dirX;
                spring.mass1.force.y += forceMagnitude * dirY;
                spring.mass1.force.z += forceMagnitude * dirZ;
            }
            
            if (!spring.mass2.fixed) {
                spring.mass2.force.x -= forceMagnitude * dirX;
                spring.mass2.force.y -= forceMagnitude * dirY;
                spring.mass2.force.z -= forceMagnitude * dirZ;
            }
        });
    }
    
    integrate(deltaTime) {
        this.masses.forEach(mass => {
            if (mass.fixed) return;
            
            // Calculate acceleration (a = F/m)
            const ax = mass.force.x / mass.mass;
            const ay = mass.force.y / mass.mass;
            const az = mass.force.z / mass.mass;
            
            // Update velocity (v = v0 + a*dt)
            mass.velocity.x += ax * deltaTime;
            mass.velocity.y += ay * deltaTime;
            mass.velocity.z += az * deltaTime;
            
            // Apply damping
            mass.velocity.x *= this.damping;
            mass.velocity.y *= this.damping;
            mass.velocity.z *= this.damping;
            
            // Update position (x = x0 + v*dt)
            mass.position.x += mass.velocity.x * deltaTime;
            mass.position.y += mass.velocity.y * deltaTime;
            mass.position.z += mass.velocity.z * deltaTime;
        });
    }
    
    applyConstraints() {
        // Apply distance constraints
        for (let i = 0; i < 3; i++) { // Multiple iterations for better convergence
            this.constraints.forEach(constraint => {
                if (constraint.type === 'distance') {
                    this.applyDistanceConstraint(constraint);
                }
            });
        }
    }
    
    applyDistanceConstraint(constraint) {
        const dx = constraint.mass2.position.x - constraint.mass1.position.x;
        const dy = constraint.mass2.position.y - constraint.mass1.position.y;
        const dz = constraint.mass2.position.z - constraint.mass1.position.z;
        
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        // Avoid division by zero
        if (distance === 0) return;
        
        const diff = (distance - constraint.distance) / distance;
        
        const adjustX = dx * diff * 0.5 * constraint.stiffness;
        const adjustY = dy * diff * 0.5 * constraint.stiffness;
        const adjustZ = dz * diff * 0.5 * constraint.stiffness;
        
        if (!constraint.mass1.fixed) {
            constraint.mass1.position.x += adjustX;
            constraint.mass1.position.y += adjustY;
            constraint.mass1.position.z += adjustZ;
        }
        
        if (!constraint.mass2.fixed) {
            constraint.mass2.position.x -= adjustX;
            constraint.mass2.position.y -= adjustY;
            constraint.mass2.position.z -= adjustZ;
        }
    }
    
    handleCollisions() {
        const groundY = -50; // Ground level
        
        this.masses.forEach(mass => {
            if (!mass.fixed && mass.position.y < groundY) {
                // Move mass above ground
                mass.position.y = groundY;
                
                // Apply restitution (bounce)
                mass.velocity.y = -mass.velocity.y * 0.7;
                
                // Add some friction
                mass.velocity.x *= 0.9;
                mass.velocity.z *= 0.9;
            }
        });
    }
    
    clearForces() {
        this.masses.forEach(mass => {
            mass.force.x = 0;
            mass.force.y = 0;
            mass.force.z = 0;
        });
    }
    
    enable() {
        this.enabled = true;
        console.log('Physics engine enabled');
    }
    
    disable() {
        this.enabled = false;
        console.log('Physics engine disabled');
    }
    
    setGravity(value) {
        this.gravity = value;
        console.log('Gravity set to:', value, 'm/s²');
    }
    
    getMassPositions() {
        return this.masses.map(mass => ({
            id: mass.id,
            position: { ...mass.position }
        }));
    }
    
    applyForce(massId, force) {
        const mass = this.masses.find(m => m.id === massId);
        if (mass && !mass.fixed) {
            mass.force.x += force.x;
            mass.force.y += force.y;
            mass.force.z += force.z;
            console.log(`Applied force to ${massId}:`, force);
        }
    }
    
    applyImpulse(massId, impulse) {
        const mass = this.masses.find(m => m.id === massId);
        if (mass && !mass.fixed) {
            mass.velocity.x += impulse.x / mass.mass;
            mass.velocity.y += impulse.y / mass.mass;
            mass.velocity.z += impulse.z / mass.mass;
            console.log(`Applied impulse to ${massId}:`, impulse);
        }
    }
    
    reset() {
        // Reset all masses to original positions
        this.masses.forEach(mass => {
            const originalPos = this.originalPositions.get(mass.id);
            if (originalPos) {
                mass.position.x = originalPos.x;
                mass.position.y = originalPos.y;
                mass.position.z = originalPos.z;
            }
            mass.velocity.x = 0;
            mass.velocity.y = 0;
            mass.velocity.z = 0;
            mass.force.x = 0;
            mass.force.y = 0;
            mass.force.z = 0;
        });
        
        console.log('Physics engine reset to initial state');
    }
    
    setStiffness(stiffness) {
        this.stiffness = Math.max(0, Math.min(1, stiffness));
        
        // Update all springs
        this.springs.forEach(spring => {
            spring.stiffness = this.stiffness;
        });
        
        console.log('Stiffness set to:', stiffness);
    }
    
    setDamping(damping) {
        this.damping = Math.max(0, Math.min(1, damping));
        console.log('Damping set to:', damping);
    }
    
    getPhysicsData() {
        return {
            enabled: this.enabled,
            gravity: this.gravity,
            damping: this.damping,
            stiffness: this.stiffness,
            massCount: this.masses.length,
            springCount: this.springs.length,
            constraintCount: this.constraints.length
        };
    }
    
    // Method to get vertex by ID
    getMassById(id) {
        return this.masses.find(m => m.id === id);
    }
    
    // Method to toggle fixed state of a mass
    toggleFixed(massId) {
        const mass = this.getMassById(massId);
        if (mass) {
            mass.fixed = !mass.fixed;
            console.log(`${massId} fixed state: ${mass.fixed}`);
            return mass.fixed;
        }
        return null;
    }
    
    // Method to simulate wind force
    applyWind(windForce) {
        this.masses.forEach(mass => {
            if (!mass.fixed) {
                mass.force.x += windForce.x * mass.mass;
                mass.force.y += windForce.y * mass.mass;
                mass.force.z += windForce.z * mass.mass;
            }
        });
    }
    
    // Method to simulate explosion/implosion at a point
    applyExplosion(center, radius, force) {
        this.masses.forEach(mass => {
            if (!mass.fixed) {
                const dx = mass.position.x - center.x;
                const dy = mass.position.y - center.y;
                const dz = mass.position.z - center.z;
                const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
                
                if (distance < radius && distance > 0) {
                    const attenuation = (radius - distance) / radius;
                    const dirX = dx / distance;
                    const dirY = dy / distance;
                    const dirZ = dz / distance;
                    
                    mass.force.x += dirX * force * attenuation * mass.mass;
                    mass.force.y += dirY * force * attenuation * mass.mass;
                    mass.force.z += dirZ * force * attenuation * mass.mass;
                }
            }
        });
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhysicsEngine;
}