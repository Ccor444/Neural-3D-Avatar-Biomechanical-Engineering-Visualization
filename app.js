class MeshVisualizerApp {
    constructor() {
        this.renderer = null;
        this.uiController = null;
        this.physicsEngine = null;
        this.meshData = null;
        this.animationLoopId = null;
        this.lastTime = 0;
        
        this.init();
    }
    
    async init() {
        // Show loading screen
        this.showLoading(true);
        
        try {
            // Update loading progress
            this.updateLoadingProgress(10, 'Initializing application...');
            
            // Load mesh data
            await this.loadMeshData();
            
            // Update loading progress
            this.updateLoadingProgress(50, 'Initializing renderer...');
            
            // Initialize renderer
            this.renderer = new MeshRenderer('mesh-canvas');
            
            // Update loading progress
            this.updateLoadingProgress(70, 'Initializing physics engine...');
            
            // Initialize physics engine
            this.physicsEngine = new PhysicsEngine();
            
            // Initialize with mesh data
            if (this.meshData) {
                this.physicsEngine.init(this.meshData);
            }
            
            // Update loading progress
            this.updateLoadingProgress(85, 'Initializing UI controller...');
            
            // Initialize UI controller
            this.uiController = new UIController(this);
            
            // Update loading progress
            this.updateLoadingProgress(95, 'Setting up event listeners...');
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start physics simulation loop
            this.startPhysicsLoop();
            
            // Update loading progress
            this.updateLoadingProgress(100, 'Ready');
            
            // Hide loading screen after a short delay
            setTimeout(() => {
                this.showLoading(false);
                this.showWelcomeNotification();
            }, 500);
            
            console.log('Mesh Visualizer initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError(`Failed to initialize application: ${error.message}`);
        }
    }
    
    async loadMeshData() {
        this.updateLoadingProgress(20, 'Loading mesh data...');
        
        try {
            // Try to load from network first
            const response = await fetch('mesh_data.json', {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.meshData = await response.json();
            
            this.updateLoadingProgress(40, 'Parsing vertices and edges...');
            
            // Validate data structure
            if (!this.meshData.vertices || !this.meshData.edges) {
                throw new Error('Invalid mesh data structure: missing vertices or edges');
            }
            
            // Validate vertices array
            if (!Array.isArray(this.meshData.vertices)) {
                throw new Error('Invalid vertices data: expected array');
            }
            
            // Validate edges array
            if (!Array.isArray(this.meshData.edges)) {
                throw new Error('Invalid edges data: expected array');
            }
            
            console.log(`Loaded ${this.meshData.vertices.length} vertices and ${this.meshData.edges.length} edges`);
            
        } catch (error) {
            console.error('Error loading mesh data:', error);
            
            // Provide more specific error message
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Failed to load mesh data. Please check if mesh_data.json exists and the server is running.');
            } else if (error.message.includes('JSON')) {
                throw new Error('Invalid mesh data format. Please check mesh_data.json file.');
            } else {
                throw new Error(`Failed to load mesh data: ${error.message}`);
            }
        }
    }
    
    updateLoadingProgress(percent, message) {
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const loadingDetails = document.getElementById('loading-details');
        
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${percent}%`;
        }
        
        if (loadingDetails) {
            loadingDetails.textContent = message;
        }
    }
    
    showLoading(show) {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }
    
    showError(message) {
        // Remove any existing error overlays
        const existingErrors = document.querySelectorAll('.error-overlay');
        existingErrors.forEach(error => error.remove());
        
        // Create error overlay
        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'error-overlay';
        errorOverlay.innerHTML = `
            <div class="error-content">
                <div class="error-icon">❌</div>
                <h3>Error</h3>
                <p>${message}</p>
                <div class="error-actions">
                    <button id="error-reload" class="error-btn primary">Reload Application</button>
                    <button id="error-details" class="error-btn secondary">Show Details</button>
                </div>
                <div class="error-details" id="error-details-content" style="display: none; margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 4px; font-family: monospace; font-size: 12px; max-height: 100px; overflow-y: auto;">
                    ${message}
                </div>
            </div>
        `;
        
        document.body.appendChild(errorOverlay);
        
        // Add event listeners
        const reloadBtn = document.getElementById('error-reload');
        const detailsBtn = document.getElementById('error-details');
        const detailsContent = document.getElementById('error-details-content');
        
        if (reloadBtn) {
            reloadBtn.addEventListener('click', () => {
                location.reload();
            });
        }
        
        if (detailsBtn) {
            detailsBtn.addEventListener('click', () => {
                const isVisible = detailsContent.style.display === 'block';
                detailsContent.style.display = isVisible ? 'none' : 'block';
                detailsBtn.textContent = isVisible ? 'Show Details' : 'Hide Details';
            });
        }
        
        // Add styles if not already present
        this.addErrorStyles();
        
        // Hide loading screen
        this.showLoading(false);
    }
    
    addErrorStyles() {
        if (!document.getElementById('error-styles')) {
            const style = document.createElement('style');
            style.id = 'error-styles';
            style.textContent = `
                .error-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(5, 10, 20, 0.98);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    backdrop-filter: blur(10px);
                }
                
                .error-content {
                    background: var(--background-medium);
                    padding: 40px;
                    border-radius: var(--border-radius);
                    text-align: center;
                    max-width: 500px;
                    border: 1px solid var(--error-color);
                    box-shadow: 0 10px 30px rgba(247, 37, 133, 0.2);
                }
                
                .error-icon {
                    font-size: 48px;
                    color: var(--error-color);
                    margin-bottom: 20px;
                }
                
                .error-content h3 {
                    color: var(--error-color);
                    margin-bottom: 15px;
                    font-size: 24px;
                }
                
                .error-content p {
                    color: var(--text-secondary);
                    margin-bottom: 25px;
                    line-height: 1.5;
                }
                
                .error-actions {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    flex-wrap: wrap;
                }
                
                .error-btn {
                    padding: 12px 24px;
                    border-radius: var(--border-radius);
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    border: none;
                    transition: all 0.3s ease;
                }
                
                .error-btn.primary {
                    background: var(--error-color);
                    color: white;
                }
                
                .error-btn.primary:hover {
                    background: #e01e5a;
                    transform: translateY(-2px);
                }
                
                .error-btn.secondary {
                    background: var(--background-light);
                    color: var(--text-primary);
                    border: 1px solid var(--background-light);
                }
                
                .error-btn.secondary:hover {
                    background: var(--background-medium);
                    border-color: var(--text-secondary);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    setupEventListeners() {
        // Window resize
        const resizeHandler = () => {
            if (this.renderer) {
                this.renderer.onWindowResize();
            }
        };
        
        window.addEventListener('resize', resizeHandler);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Prevent default behavior for our shortcuts
            const handledKeys = [' ', '1', '2', '3', 'Escape', 'p', 'r'];
            
            if (handledKeys.includes(e.key)) {
                e.preventDefault();
            }
            
            switch(e.key) {
                case ' ':
                    // Space bar - reset view
                    if (this.renderer) {
                        this.renderer.resetView();
                    }
                    break;
                case '1':
                    // Number 1 - front view
                    this.setView('front');
                    break;
                case '2':
                    // Number 2 - side view
                    this.setView('side');
                    break;
                case '3':
                    // Number 3 - top view
                    this.setView('top');
                    break;
                case 'p':
                    // P key - toggle physics
                    this.togglePhysics();
                    break;
                case 'r':
                    // R key - reset physics
                    this.resetPhysics();
                    break;
                case 'Escape':
                    // Escape - close vertex info
                    this.closeVertexInfo();
                    break;
            }
        });
        
        // Performance button
        const performanceBtn = document.getElementById('performance-btn');
        if (performanceBtn) {
            performanceBtn.addEventListener('click', () => {
                this.togglePerformanceStats();
            });
        }
        
        // Add unload handler to clean up
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }
    
    setView(view) {
        if (this.renderer) {
            this.renderer.setView(view);
        }
        
        // Update UI
        const buttons = document.querySelectorAll('.camera-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === view) {
                btn.classList.add('active');
            }
        });
        
        // Show notification
        if (this.uiController && this.uiController.showNotification) {
            this.uiController.showNotification(`View changed to: ${view}`);
        }
    }
    
    closeVertexInfo() {
        const panel = document.getElementById('vertex-info');
        if (panel) {
            panel.classList.remove('visible');
        }
    }
    
    getMeshData() {
        return this.meshData;
    }
    
    getRenderer() {
        return this.renderer;
    }
    
    updateConfig(config) {
        if (this.renderer) {
            this.renderer.updateConfig(config);
        }
    }
    
    startPhysicsLoop() {
        if (this.animationLoopId) {
            cancelAnimationFrame(this.animationLoopId);
        }
        
        const physicsLoop = (currentTime) => {
            // Calculate delta time
            if (this.lastTime === 0) {
                this.lastTime = currentTime;
            }
            
            const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
            this.lastTime = currentTime;
            
            // Clamp delta time to prevent large jumps
            const clampedDeltaTime = Math.min(deltaTime, 0.1);
            
            // Update physics if engine is enabled
            if (this.physicsEngine && this.physicsEngine.enabled && this.renderer) {
                try {
                    const updatedPositions = this.physicsEngine.update(clampedDeltaTime);
                    
                    // Update mesh positions in renderer
                    if (updatedPositions && this.renderer.vertexMap) {
                        updatedPositions.forEach(vertexData => {
                            const vertex = this.renderer.vertexMap[vertexData.id];
                            if (vertex) {
                                vertex.position.set(
                                    vertexData.position.x,
                                    vertexData.position.y,
                                    vertexData.position.z
                                );
                            }
                        });
                        
                        // Update mesh geometry if needed
                        if (this.renderer.mesh && this.renderer.mesh.geometry) {
                            const positions = this.renderer.mesh.geometry.attributes.position;
                            if (positions) {
                                this.renderer.vertices.forEach((vertex, i) => {
                                    positions.array[i * 3] = vertex.position.x;
                                    positions.array[i * 3 + 1] = vertex.position.y;
                                    positions.array[i * 3 + 2] = vertex.position.z;
                                });
                                positions.needsUpdate = true;
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error in physics loop:', error);
                    // Don't stop the loop, just log the error
                }
            }
            
            this.animationLoopId = requestAnimationFrame(physicsLoop);
        };
        
        this.lastTime = 0;
        this.animationLoopId = requestAnimationFrame(physicsLoop);
    }
    
    togglePhysics() {
        if (this.physicsEngine) {
            this.physicsEngine.enabled = !this.physicsEngine.enabled;
            
            const status = this.physicsEngine.enabled ? 'enabled' : 'disabled';
            
            // Update UI checkbox
            const physicsCheckbox = document.getElementById('enable-physics');
            if (physicsCheckbox) {
                physicsCheckbox.checked = this.physicsEngine.enabled;
            }
            
            // Show notification
            if (this.uiController) {
                this.uiController.showNotification(`Physics ${status}`, this.physicsEngine.enabled ? 'success' : 'info');
            }
            
            console.log(`Physics ${status}`);
        }
    }
    
    resetPhysics() {
        if (this.physicsEngine) {
            this.physicsEngine.reset();
            
            // Update mesh positions in renderer
            if (this.renderer && this.renderer.vertexMap) {
                // Reset to original positions from mesh data
                if (this.meshData && this.meshData.vertices) {
                    this.meshData.vertices.forEach(vertexData => {
                        const vertex = this.renderer.vertexMap[vertexData.id];
                        if (vertex) {
                            vertex.position.set(vertexData.x, vertexData.y, vertexData.z);
                        }
                    });
                }
                
                // Update mesh geometry
                if (this.renderer.mesh && this.renderer.mesh.geometry) {
                    const positions = this.renderer.mesh.geometry.attributes.position;
                    if (positions) {
                        this.renderer.vertices.forEach((vertex, i) => {
                            positions.array[i * 3] = vertex.position.x;
                            positions.array[i * 3 + 1] = vertex.position.y;
                            positions.array[i * 3 + 2] = vertex.position.z;
                        });
                        positions.needsUpdate = true;
                    }
                }
            }
            
            // Show notification
            if (this.uiController) {
                this.uiController.showNotification('Physics reset to initial state', 'success');
            }
            
            console.log('Physics reset');
        }
    }
    
    togglePerformanceStats() {
        if (this.renderer && this.renderer.stats) {
            const stats = this.renderer.stats;
            stats.dom.style.display = stats.dom.style.display === 'none' ? 'block' : 'none';
            
            // Show notification
            if (this.uiController) {
                const isVisible = stats.dom.style.display !== 'none';
                this.uiController.showNotification(
                    `Performance stats ${isVisible ? 'shown' : 'hidden'}`,
                    isVisible ? 'info' : 'info'
                );
            }
        }
    }
    
    showWelcomeNotification() {
        if (this.uiController && this.uiController.showNotification) {
            setTimeout(() => {
                this.uiController.showNotification(
                    'Neural 3D Avatar Viewer Ready! Use spacebar to reset view, P to toggle physics.',
                    'success'
                );
                
                // Show keyboard shortcuts after a delay
                setTimeout(() => {
                    this.uiController.showNotification(
                        'Keyboard shortcuts: 1-Front, 2-Side, 3-Top, Space-Reset, P-Physics, R-Reset Physics',
                        'info'
                    );
                }, 3000);
            }, 1000);
        }
    }
    
    cleanup() {
        // Stop animation loops
        if (this.animationLoopId) {
            cancelAnimationFrame(this.animationLoopId);
            this.animationLoopId = null;
        }
        
        // Clean up renderer
        if (this.renderer && typeof this.renderer.dispose === 'function') {
            this.renderer.dispose();
        }
        
        console.log('Application cleaned up');
    }
    
    // Utility method to export current state
    exportState() {
        const state = {
            timestamp: new Date().toISOString(),
            meshData: this.meshData ? {
                vertices: this.meshData.vertices.length,
                edges: this.meshData.edges.length,
                metadata: this.meshData.metadata
            } : null,
            physics: this.physicsEngine ? this.physicsEngine.getPhysicsData() : null,
            renderer: this.renderer ? {
                config: this.renderer.config,
                statistics: {
                    vertices: this.renderer.vertices ? this.renderer.vertices.length : 0,
                    edges: this.renderer.edges ? this.renderer.edges.length : 0
                }
            } : null
        };
        
        return state;
    }
}

// Start application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.app = new MeshVisualizerApp();
        
        // Make app available globally for debugging
        window.MeshVisualizerApp = MeshVisualizerApp;
        
        // Add global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            
            if (window.app && window.app.showError) {
                // Don't show error if it's already being shown
                const existingError = document.querySelector('.error-overlay');
                if (!existingError) {
                    window.app.showError(`Unexpected error: ${event.error.message}`);
                }
            }
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            if (window.app && window.app.showError) {
                const existingError = document.querySelector('.error-overlay');
                if (!existingError) {
                    window.app.showError(`Promise rejected: ${event.reason}`);
                }
            }
        });
        
    } catch (error) {
        console.error('Failed to start application:', error);
        
        // Create emergency error display
        const emergencyError = document.createElement('div');
        emergencyError.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #050a14;
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            text-align: center;
            padding: 20px;
            font-family: Arial, sans-serif;
        `;
        emergencyError.innerHTML = `
            <h1 style="color: #f72585; margin-bottom: 20px;">⚠️ Critical Error</h1>
            <p style="margin-bottom: 20px; max-width: 600px;">Failed to start Neural 3D Avatar Viewer</p>
            <code style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 4px; margin-bottom: 20px; max-width: 600px; overflow: auto;">
                ${error.message}
            </code>
            <button onclick="location.reload()" style="padding: 12px 24px; background: #2ea3ff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Reload Application
            </button>
        `;
        document.body.appendChild(emergencyError);
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MeshVisualizerApp;
}