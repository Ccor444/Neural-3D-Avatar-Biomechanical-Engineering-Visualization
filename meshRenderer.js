class MeshRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.mesh = null;
        this.wireframe = null;
        this.joints = null;
        this.skeleton = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.highlightedVertex = null;
        this.vertexSprites = [];
        
        // Configuration
        this.config = {
            wireframeOpacity: 0.8,
            glowIntensity: 0.7,
            showWireframe: true,
            showJoints: true,
            showSkeleton: true,
            showSurface: false,
            colorScheme: 'biomechanical',
            lodLevel: 'high'
        };
        
        // Animation
        this.clock = new THREE.Clock();
        this.animationMixer = null;
        this.currentPose = 't-pose';
        
        // Stats
        this.stats = null;
        
        this.init();
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050a14);
        this.scene.fog = new THREE.Fog(0x050a14, 100, 500);
        
        // Create camera
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000);
        this.camera.position.set(0, 0, 200);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add orbit controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 50;
        this.controls.maxDistance = 500;
        this.controls.maxPolarAngle = Math.PI;
        
        // Add lighting
        this.setupLighting();
        
        // Add grid helper
        this.gridHelper = new THREE.GridHelper(200, 20, 0x3a506b, 0x233554);
        this.gridHelper.position.y = -50;
        this.scene.add(this.gridHelper);
        
        // Add axes helper
        this.axesHelper = new THREE.AxesHelper(50);
        this.scene.add(this.axesHelper);
        
        // Initialize performance stats
        this.initStats();
        
        // Load mesh data
        this.loadMeshData();
        
        // Event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // Start animation loop
        this.animate();
    }
    
    initStats() {
        // Initialize Stats.js for performance monitoring
        if (typeof Stats !== 'undefined') {
            this.stats = new Stats();
            this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb
            document.body.appendChild(this.stats.dom);
            this.stats.dom.style.position = 'absolute';
            this.stats.dom.style.top = '80px';
            this.stats.dom.style.left = '10px';
            this.stats.dom.style.zIndex = '100';
        }
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
        
        // Hemisphere light
        const hemisphereLight = new THREE.HemisphereLight(0x2ea3ff, 0xffaa00, 0.3);
        this.scene.add(hemisphereLight);
        
        // Point lights for glow effect
        const pointLight1 = new THREE.PointLight(0x00ffff, 0.5, 200);
        pointLight1.position.set(30, 30, 30);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0x2ea3ff, 0.5, 200);
        pointLight2.position.set(-30, -30, -30);
        this.scene.add(pointLight2);
    }
    
    async loadMeshData() {
        try {
            const response = await fetch('mesh_data.json');
            this.meshData = await response.json();
            
            // Parse vertices and edges
            this.parseVertices();
            this.createMesh();
            this.createWireframe();
            this.createJoints();
            this.createSkeleton();
            
            // Update statistics
            this.updateStatistics();
            
            // Center camera on mesh
            this.centerCamera();
            
            console.log('Mesh data loaded successfully:', this.meshData);
        } catch (error) {
            console.error('Error loading mesh data:', error);
            this.showErrorMessage('Failed to load mesh data. Please check your internet connection and try again.');
        }
    }
    
    parseVertices() {
        this.vertices = this.meshData.vertices.map(v => ({
            id: v.id,
            position: new THREE.Vector3(v.x, v.y, v.z),
            group: v.group,
            type: v.type,
            weight: v.weight,
            originalData: v
        }));
        
        // Create lookup map for quick access
        this.vertexMap = {};
        this.vertices.forEach(v => {
            this.vertexMap[v.id] = v;
        });
        
        // Parse edges
        this.edges = this.meshData.edges.map(edge => {
            const v1 = this.vertexMap[edge[0]];
            const v2 = this.vertexMap[edge[1]];
            return { v1, v2, length: v1.position.distanceTo(v2.position) };
        });
    }
    
    createMesh() {
        // Create geometry from vertices
        const geometry = new THREE.BufferGeometry();
        
        // Add positions
        const positions = new Float32Array(this.vertices.length * 3);
        this.vertices.forEach((vertex, i) => {
            positions[i * 3] = vertex.position.x;
            positions[i * 3 + 1] = vertex.position.y;
            positions[i * 3 + 2] = vertex.position.z;
        });
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Add colors based on weight
        const colors = new Float32Array(this.vertices.length * 3);
        this.vertices.forEach((vertex, i) => {
            const color = this.getColorForVertex(vertex);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        });
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Create index for faces (simplified - in production would use proper triangulation)
        const indices = [];
        for (let i = 0; i < this.edges.length; i++) {
            const edge = this.edges[i];
            const v1Index = this.vertices.indexOf(edge.v1);
            const v2Index = this.vertices.indexOf(edge.v2);
            
            // Add triangle indices (simplified representation)
            if (i % 3 === 0 && i + 2 < this.edges.length) {
                indices.push(v1Index, v2Index, this.vertices.indexOf(this.edges[i + 1].v2));
            }
        }
        geometry.setIndex(indices);
        
        // Compute normals
        geometry.computeVertexNormals();
        
        // Create material
        const material = new THREE.MeshPhongMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            shininess: 100,
            specular: 0x222222
        });
        
        // Create mesh
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
    }
    
    createWireframe() {
        // Create wireframe geometry
        const wireframeGeometry = new THREE.BufferGeometry();
        
        const wireframePositions = [];
        this.edges.forEach(edge => {
            wireframePositions.push(
                edge.v1.position.x, edge.v1.position.y, edge.v1.position.z,
                edge.v2.position.x, edge.v2.position.y, edge.v2.position.z
            );
        });
        
        wireframeGeometry.setAttribute('position', 
            new THREE.Float32BufferAttribute(wireframePositions, 3));
        
        // Create wireframe material
        const wireframeMaterial = new THREE.LineBasicMaterial({
            color: new THREE.Color(this.meshData.materials.wireframe.color),
            transparent: true,
            opacity: this.config.wireframeOpacity,
            linewidth: this.meshData.materials.wireframe.thickness
        });
        
        // Create wireframe
        this.wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        this.scene.add(this.wireframe);
    }
    
    createJoints() {
        const jointGeometry = new THREE.SphereGeometry(1, 16, 16);
        const jointMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(this.meshData.materials.joints.color),
            transparent: true,
            opacity: 0.8
        });
        
        this.joints = new THREE.Group();
        
        // Create joint markers
        this.vertices.forEach(vertex => {
            if (vertex.type === 'joint') {
                const joint = new THREE.Mesh(jointGeometry, jointMaterial);
                joint.position.copy(vertex.position);
                joint.scale.setScalar(vertex.weight * 2);
                joint.userData = { vertex };
                
                // Add glow effect
                const glowGeometry = new THREE.SphereGeometry(1.2, 8, 8);
                const glowMaterial = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(this.meshData.materials.joints.color),
                    transparent: true,
                    opacity: 0.3
                });
                const glow = new THREE.Mesh(glowGeometry, glowMaterial);
                joint.add(glow);
                
                this.joints.add(joint);
            }
        });
        
        this.scene.add(this.joints);
    }
    
    createSkeleton() {
        const skeletonGeometry = new THREE.BufferGeometry();
        
        const skeletonPositions = [];
        const skeletonColors = [];
        
        this.edges.forEach(edge => {
            // Only add skeleton lines for major body parts
            const isSkeletonEdge = 
                edge.v1.group.includes('head') || edge.v1.group.includes('neck') ||
                edge.v1.group.includes('spine') || edge.v1.group.includes('shoulder') ||
                edge.v1.group.includes('hip') || edge.v1.group.includes('arm') ||
                edge.v1.group.includes('leg');
            
            if (isSkeletonEdge) {
                skeletonPositions.push(
                    edge.v1.position.x, edge.v1.position.y, edge.v1.position.z,
                    edge.v2.position.x, edge.v2.position.y, edge.v2.position.z
                );
                
                // Add color for each vertex
                const color = new THREE.Color(this.meshData.materials.skeleton.color);
                skeletonColors.push(
                    color.r, color.g, color.b,
                    color.r, color.g, color.b
                );
            }
        });
        
        skeletonGeometry.setAttribute('position', 
            new THREE.Float32BufferAttribute(skeletonPositions, 3));
        skeletonGeometry.setAttribute('color', 
            new THREE.Float32BufferAttribute(skeletonColors, 3));
        
        const skeletonMaterial = new THREE.LineBasicMaterial({
            vertexColors: true,
            linewidth: this.meshData.materials.skeleton.thickness,
            transparent: true,
            opacity: 0.9
        });
        
        this.skeleton = new THREE.LineSegments(skeletonGeometry, skeletonMaterial);
        this.scene.add(this.skeleton);
    }
    
    getColorForVertex(vertex) {
        switch(this.config.colorScheme) {
            case 'biomechanical':
                // Color by group
                const groupColors = {
                    'head': 0x2ea3ff,
                    'neck': 0x2ea3ff,
                    'shoulder': 0xff6b6b,
                    'chest': 0x4ecdc4,
                    'back': 0x45b7d1,
                    'waist': 0x96ceb4,
                    'hip': 0xfeca57,
                    'arm': 0xff9ff3,
                    'hand': 0x54a0ff,
                    'leg': 0x5f27cd,
                    'foot': 0x00d2d3
                };
                const baseColor = groupColors[vertex.group.split('_')[0]] || 0xffffff;
                return new THREE.Color(baseColor);
                
            case 'thermal':
                // Color by weight (heat map)
                const weight = vertex.weight;
                const r = Math.min(1, weight * 2);
                const g = Math.min(1, Math.abs(weight - 0.5) * 2);
                const b = Math.max(0, 1 - weight * 2);
                return new THREE.Color(r, g, b);
                
            case 'group':
                // Random color per group
                const groups = {};
                let colorIndex = 0;
                this.vertices.forEach(v => {
                    if (!groups[v.group]) {
                        groups[v.group] = new THREE.Color().setHSL(colorIndex / Object.keys(groups).length, 0.7, 0.6);
                        colorIndex++;
                    }
                });
                return groups[vertex.group] || new THREE.Color(0xffffff);
                
            case 'weight':
                // Grayscale by weight
                const intensity = 0.2 + vertex.weight * 0.8;
                return new THREE.Color(intensity, intensity, intensity);
                
            default:
                return new THREE.Color(0x2ea3ff);
        }
    }
    
    updateStatistics() {
        // Update UI statistics
        const vertexCount = document.getElementById('stat-vertices');
        const edgeCount = document.getElementById('stat-edges');
        const triangleCount = document.getElementById('triangle-counter');
        
        if (vertexCount) vertexCount.textContent = this.vertices.length;
        if (edgeCount) edgeCount.textContent = this.edges.length;
        if (triangleCount) {
            // Estimate triangle count (simplified)
            const triangles = Math.floor(this.edges.length / 3);
            triangleCount.textContent = triangles;
        }
        
        // Count unique groups
        const groups = new Set(this.vertices.map(v => v.group));
        const groupCount = document.getElementById('stat-groups');
        if (groupCount) groupCount.textContent = groups.size;
        
        // Count joints
        const joints = this.vertices.filter(v => v.type === 'joint').length;
        const jointCount = document.getElementById('stat-joints');
        if (jointCount) jointCount.textContent = joints;
    }
    
    centerCamera() {
        if (!this.mesh) return;
        
        const box = new THREE.Box3().setFromObject(this.mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
        
        // Add some padding
        cameraZ *= 1.5;
        
        this.camera.position.set(center.x, center.y, cameraZ);
        this.controls.target.copy(center);
        this.controls.update();
    }
    
    onCanvasClick(event) {
        // Calculate mouse position in normalized device coordinates
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Update the picking ray
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Find intersections
        const intersects = this.raycaster.intersectObjects(this.joints.children);
        
        if (intersects.length > 0) {
            const vertex = intersects[0].object.userData.vertex;
            this.highlightVertex(vertex);
        }
    }
    
    onMouseMove(event) {
        // Update mouse position
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Update coordinate display
        this.updateCoordinateDisplay();
    }
    
    updateCoordinateDisplay() {
        // Create ray from camera through mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Create a plane at y=0 for intersection
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersection = new THREE.Vector3();
        
        if (this.raycaster.ray.intersectPlane(plane, intersection)) {
            const coordX = document.getElementById('coord-x');
            const coordY = document.getElementById('coord-y');
            const coordZ = document.getElementById('coord-z');
            
            if (coordX) coordX.textContent = intersection.x.toFixed(2);
            if (coordY) coordY.textContent = intersection.y.toFixed(2);
            if (coordZ) coordZ.textContent = intersection.z.toFixed(2);
        }
    }
    
    highlightVertex(vertex) {
        // Remove previous highlight
        if (this.highlightMesh) {
            this.scene.remove(this.highlightMesh);
            this.highlightMesh = null;
        }
        
        this.highlightedVertex = vertex;
        
        // Show vertex info panel
        this.showVertexInfo(vertex);
        
        // Create highlight effect
        const geometry = new THREE.SphereGeometry(2, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.5
        });
        
        this.highlightMesh = new THREE.Mesh(geometry, material);
        this.highlightMesh.position.copy(vertex.position);
        this.scene.add(this.highlightMesh);
    }
    
    showVertexInfo(vertex) {
        const panel = document.getElementById('vertex-info');
        const vertexId = document.getElementById('vertex-id');
        const vertexGroup = document.getElementById('vertex-group');
        const vertexType = document.getElementById('vertex-type');
        const vertexWeight = document.getElementById('vertex-weight');
        const vertexPosition = document.getElementById('vertex-position');
        const connectionsList = document.getElementById('connections-list');
        
        if (panel && vertexId) {
            vertexId.textContent = vertex.id;
            vertexGroup.textContent = vertex.group;
            vertexType.textContent = vertex.type;
            vertexWeight.textContent = vertex.weight.toFixed(2);
            vertexPosition.textContent = `[${vertex.position.x.toFixed(1)}, ${vertex.position.y.toFixed(1)}, ${vertex.position.z.toFixed(1)}]`;
            
            // Find connections for this vertex
            if (connectionsList) {
                connectionsList.innerHTML = '';
                const connectedVertices = [];
                
                this.edges.forEach(edge => {
                    if (edge.v1.id === vertex.id) {
                        connectedVertices.push(edge.v2);
                    } else if (edge.v2.id === vertex.id) {
                        connectedVertices.push(edge.v1);
                    }
                });
                
                connectedVertices.forEach(connectedVertex => {
                    const div = document.createElement('div');
                    div.textContent = `${connectedVertex.id} (${connectedVertex.group})`;
                    div.style.cursor = 'pointer';
                    div.addEventListener('click', () => {
                        this.highlightVertex(connectedVertex);
                    });
                    connectionsList.appendChild(div);
                });
                
                if (connectedVertices.length === 0) {
                    const div = document.createElement('div');
                    div.textContent = 'No connections';
                    div.style.color = '#8892b0';
                    connectionsList.appendChild(div);
                }
            }
            
            panel.classList.add('visible');
        }
    }
    
    onWindowResize() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    updateConfig(config) {
        Object.assign(this.config, config);
        
        // Update wireframe opacity
        if (this.wireframe) {
            this.wireframe.material.opacity = this.config.wireframeOpacity;
        }
        
        // Update mesh visibility
        if (this.mesh) {
            this.mesh.visible = this.config.showSurface;
        }
        
        if (this.wireframe) {
            this.wireframe.visible = this.config.showWireframe;
        }
        
        if (this.joints) {
            this.joints.visible = this.config.showJoints;
        }
        
        if (this.skeleton) {
            this.skeleton.visible = this.config.showSkeleton;
        }
        
        // Update colors if color scheme changed
        if (this.mesh && config.colorScheme) {
            const colors = this.mesh.geometry.attributes.color;
            this.vertices.forEach((vertex, i) => {
                const color = this.getColorForVertex(vertex);
                colors.array[i * 3] = color.r;
                colors.array[i * 3 + 1] = color.g;
                colors.array[i * 3 + 2] = color.b;
            });
            colors.needsUpdate = true;
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update stats
        if (this.stats) {
            this.stats.begin();
        }
        
        const delta = this.clock.getDelta();
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Update animation
        if (this.animationMixer) {
            this.animationMixer.update(delta);
        }
        
        // Update FPS counter
        this.updateFPSCounter(delta);
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
        
        // End stats
        if (this.stats) {
            this.stats.end();
        }
    }
    
    updateFPSCounter(delta) {
        const fpsCounter = document.getElementById('fps-counter');
        if (fpsCounter && delta > 0) {
            const fps = Math.round(1 / delta);
            fpsCounter.textContent = fps;
            
            // Color code based on performance
            if (fps >= 50) {
                fpsCounter.style.color = '#64ffda'; // Good - green
            } else if (fps >= 30) {
                fpsCounter.style.color = '#ffaa00'; // Warning - orange
            } else {
                fpsCounter.style.color = '#f72585'; // Bad - red
            }
        }
    }
    
    setView(view) {
        const distance = 200;
        
        switch(view) {
            case 'front':
                this.camera.position.set(0, 0, distance);
                this.controls.target.set(0, 0, 0);
                break;
            case 'side':
                this.camera.position.set(distance, 0, 0);
                this.controls.target.set(0, 0, 0);
                break;
            case 'top':
                this.camera.position.set(0, distance, 0);
                this.controls.target.set(0, 0, 0);
                break;
            case 'perspective':
                this.camera.position.set(distance, distance, distance);
                this.controls.target.set(0, 0, 0);
                break;
        }
        
        this.controls.update();
    }
    
    resetView() {
        this.centerCamera();
    }
    
    showErrorMessage(message) {
        console.error('Renderer Error:', message);
        
        // Create a simple error message in the console
        // In a production app, you might want to show this in the UI
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(247, 37, 133, 0.9);
            color: white;
            padding: 20px 30px;
            border-radius: 8px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            text-align: center;
            max-width: 400px;
        `;
        errorDiv.innerHTML = `
            <h3 style="margin-bottom: 10px;">⚠️ Renderer Error</h3>
            <p>${message}</p>
            <button onclick="this.parentElement.remove()" 
                    style="margin-top: 15px; padding: 8px 16px; background: white; color: #f72585; border: none; border-radius: 4px; cursor: pointer;">
                Dismiss
            </button>
        `;
        document.body.appendChild(errorDiv);
    }
    
    // Helper method to get connected vertices
    getConnectedVertices(vertexId) {
        const connected = [];
        this.edges.forEach(edge => {
            if (edge.v1.id === vertexId) {
                connected.push(edge.v2);
            } else if (edge.v2.id === vertexId) {
                connected.push(edge.v1);
            }
        });
        return connected;
    }
    
    // Clean up resources
    dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        if (this.wireframe) {
            this.wireframe.geometry.dispose();
            this.wireframe.material.dispose();
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
        window.removeEventListener('resize', this.onWindowResize);
        if (this.canvas) {
            this.canvas.removeEventListener('click', this.onCanvasClick);
            this.canvas.removeEventListener('mousemove', this.onMouseMove);
        }
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MeshRenderer;
}