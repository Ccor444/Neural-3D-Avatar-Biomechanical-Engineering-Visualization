class UIController {
    constructor(app) {
        this.app = app;
        this.renderer = app.getRenderer();
        this.meshData = app.getMeshData();
        
        this.init();
    }
    
    init() {
        this.bindEventListeners();
        this.populateDataLists();
        this.setupRealTimeMetrics();
    }
    
    bindEventListeners() {
        // Render mode
        const renderMode = document.getElementById('render-mode');
        if (renderMode) {
            renderMode.addEventListener('change', (e) => {
                this.onRenderModeChange(e.target.value);
            });
        }
        
        // LOD level
        const lodLevel = document.getElementById('lod-level');
        if (lodLevel) {
            lodLevel.addEventListener('change', (e) => {
                this.onLODLevelChange(e.target.value);
            });
        }
        
        // Opacity slider
        const opacitySlider = document.getElementById('opacity-slider');
        const opacityValue = document.getElementById('opacity-value');
        if (opacitySlider) {
            opacitySlider.addEventListener('input', (e) => {
                const value = e.target.value;
                if (opacityValue) opacityValue.textContent = `${value}%`;
                this.app.updateConfig({ wireframeOpacity: value / 100 });
            });
        }
        
        // Glow slider
        const glowSlider = document.getElementById('glow-slider');
        const glowValue = document.getElementById('glow-value');
        if (glowSlider) {
            glowSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                if (glowValue) glowValue.textContent = `${value}%`;
                this.app.updateConfig({ glowIntensity: value / 100 });
            });
        }
        
        // Toggle switches
        const toggles = ['show-joints', 'show-skeleton', 'show-wireframe', 'show-surface'];
        toggles.forEach(toggleId => {
            const toggle = document.getElementById(toggleId);
            if (toggle) {
                toggle.addEventListener('change', (e) => {
                    this.onToggleChange(toggleId, e.target.checked);
                });
            }
        });
        
        // Color options
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                this.onColorOptionClick(e.target.dataset.color, e);
            });
        });
        
        // Pose buttons
        const poseButtons = document.querySelectorAll('.pose-btn');
        poseButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.onPoseButtonClick(e.target.dataset.pose, e);
            });
        });
        
        // Camera buttons
        const cameraButtons = document.querySelectorAll('.camera-btn');
        cameraButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.onCameraButtonClick(e.target.dataset.view);
            });
        });
        
        // Viewer controls
        const viewerButtons = ['reset-view', 'toggle-grid', 'toggle-axis', 'screenshot'];
        viewerButtons.forEach(btnId => {
            const button = document.getElementById(btnId);
            if (button) {
                button.addEventListener('click', () => {
                    this.onViewerButtonClick(btnId);
                });
            }
        });
        
        // Close vertex info
        const closeBtn = document.getElementById('close-vertex-info');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.app.closeVertexInfo();
            });
        }
        
        // Vertex search
        const vertexSearch = document.getElementById('vertex-search');
        if (vertexSearch) {
            vertexSearch.addEventListener('input', (e) => {
                this.onVertexSearch(e.target.value);
            });
        }
        
        // Data tabs
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.onTabClick(e.target.dataset.tab, e);
            });
        });
        
        // Physics toggle
        const enablePhysics = document.getElementById('enable-physics');
        if (enablePhysics) {
            enablePhysics.addEventListener('change', (e) => {
                this.onPhysicsToggleChange(e.target.checked);
            });
        }
        
        // Gravity slider
        const gravitySlider = document.getElementById('gravity-slider');
        const gravityValue = document.getElementById('gravity-value');
        if (gravitySlider) {
            gravitySlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (gravityValue) gravityValue.textContent = value.toFixed(1);
                this.onGravityChange(value);
            });
        }
    }
    
    populateDataLists() {
        if (!this.meshData) return;
        
        // Populate vertices list
        const verticesList = document.getElementById('vertices-list');
        if (verticesList) {
            verticesList.innerHTML = '';
            
            this.meshData.vertices.forEach(vertex => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <strong>${vertex.id}</strong><br>
                    <small>Group: ${vertex.group} | Type: ${vertex.type} | Weight: ${vertex.weight.toFixed(2)}</small>
                `;
                div.dataset.vertexId = vertex.id;
                div.style.cursor = 'pointer';
                div.addEventListener('click', () => {
                    this.onVertexClick(vertex.id);
                });
                verticesList.appendChild(div);
            });
        }
        
        // Populate edges list
        const edgesList = document.getElementById('edges-list');
        if (edgesList) {
            edgesList.innerHTML = '';
            
            this.meshData.edges.forEach(edge => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <strong>${edge[0]} ↔ ${edge[1]}</strong>
                `;
                div.style.cursor = 'default';
                edgesList.appendChild(div);
            });
        }
        
        // Populate groups list
        const groupsList = document.getElementById('groups-list');
        if (groupsList) {
            groupsList.innerHTML = '';
            
            const groups = {};
            this.meshData.vertices.forEach(vertex => {
                if (!groups[vertex.group]) {
                    groups[vertex.group] = 0;
                }
                groups[vertex.group]++;
            });
            
            Object.entries(groups).forEach(([group, count]) => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <strong>${group}</strong><br>
                    <small>${count} vertices</small>
                `;
                div.style.cursor = 'pointer';
                div.addEventListener('click', () => {
                    this.onGroupClick(group);
                });
                groupsList.appendChild(div);
            });
        }
    }
    
    setupRealTimeMetrics() {
        // Simulate real-time metrics updates
        setInterval(() => {
            // CPU usage (simulated)
            const cpuValue = 30 + Math.random() * 30;
            const cpuBar = document.getElementById('cpu-bar');
            const cpuText = document.getElementById('cpu-value');
            if (cpuBar) cpuBar.style.width = `${cpuValue}%`;
            if (cpuText) cpuText.textContent = `${Math.round(cpuValue)}%`;
            
            // GPU memory (simulated)
            const gpuValue = 40 + Math.random() * 40;
            const gpuBar = document.getElementById('gpu-bar');
            const gpuText = document.getElementById('gpu-value');
            if (gpuBar) gpuBar.style.width = `${gpuValue}%`;
            if (gpuText) gpuText.textContent = `${Math.round(gpuValue)}%`;
            
            // Frame time (simulated)
            const frameValue = 8 + Math.random() * 15;
            const frameBar = document.getElementById('frame-bar');
            const frameText = document.getElementById('frame-value');
            if (frameBar) frameBar.style.width = `${(frameValue / 33) * 100}%`;
            if (frameText) frameText.textContent = `${frameValue.toFixed(1)}ms`;
            
        }, 2000);
    }
    
    onRenderModeChange(mode) {
        console.log('Render mode changed to:', mode);
        // Implementation would update renderer settings
        // For now, just show a notification
        this.showNotification(`Render mode: ${mode}`);
    }
    
    onLODLevelChange(level) {
        console.log('LOD level changed to:', level);
        // Implementation would update mesh detail level
        this.showNotification(`LOD level: ${level}`);
    }
    
    onToggleChange(toggleId, checked) {
        const configMap = {
            'show-joints': 'showJoints',
            'show-skeleton': 'showSkeleton',
            'show-wireframe': 'showWireframe',
            'show-surface': 'showSurface'
        };
        
        if (configMap[toggleId]) {
            const config = { [configMap[toggleId]]: checked };
            this.app.updateConfig(config);
        }
        
        // Show feedback for surface toggle
        if (toggleId === 'show-surface' && checked) {
            this.showNotification('Surface rendering enabled (experimental)');
        }
    }
    
    onColorOptionClick(colorScheme, event) {
        // Update active button
        const buttons = document.querySelectorAll('.color-option');
        buttons.forEach(btn => btn.classList.remove('active'));
        
        const target = event.currentTarget || event.target;
        target.classList.add('active');
        
        // Update renderer
        this.app.updateConfig({ colorScheme });
        
        // Show notification
        this.showNotification(`Color scheme: ${colorScheme}`);
    }
    
    onPoseButtonClick(pose, event) {
        // Update active button
        const buttons = document.querySelectorAll('.pose-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        
        const target = event.currentTarget || event.target;
        target.classList.add('active');
        
        console.log('Changed pose to:', pose);
        // Implementation would update mesh pose
        
        // Show notification
        this.showNotification(`Pose: ${pose}`);
    }
    
    onCameraButtonClick(view) {
        this.app.setView(view);
        
        // Show notification
        this.showNotification(`Camera view: ${view}`);
    }
    
    onViewerButtonClick(buttonId) {
        switch(buttonId) {
            case 'reset-view':
                if (this.renderer) {
                    this.renderer.resetView();
                }
                this.showNotification('View reset to default');
                break;
            case 'toggle-grid':
                // Toggle grid visibility
                if (this.renderer && this.renderer.gridHelper) {
                    this.renderer.gridHelper.visible = !this.renderer.gridHelper.visible;
                    const state = this.renderer.gridHelper.visible ? 'shown' : 'hidden';
                    this.showNotification(`Grid ${state}`);
                }
                break;
            case 'toggle-axis':
                // Toggle axis visibility
                if (this.renderer && this.renderer.axesHelper) {
                    this.renderer.axesHelper.visible = !this.renderer.axesHelper.visible;
                    const state = this.renderer.axesHelper.visible ? 'shown' : 'hidden';
                    this.showNotification(`Axes ${state}`);
                }
                break;
            case 'screenshot':
                this.takeScreenshot();
                break;
        }
    }
    
    takeScreenshot() {
        if (!this.renderer || !this.renderer.renderer) {
            this.showNotification('Renderer not available', 'error');
            return;
        }
        
        try {
            // Create a temporary canvas for the screenshot
            const canvas = this.renderer.renderer.domElement;
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
            link.download = `mesh-screenshot-${timestamp}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Show success notification
            this.showNotification('Screenshot saved!');
        } catch (error) {
            console.error('Failed to take screenshot:', error);
            this.showNotification('Failed to save screenshot', 'error');
        }
    }
    
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.ui-notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'ui-notification';
        notification.textContent = message;
        
        // Set colors based on type
        let backgroundColor, textColor;
        switch(type) {
            case 'error':
                backgroundColor = '#f72585';
                textColor = 'white';
                break;
            case 'warning':
                backgroundColor = '#ffaa00';
                textColor = 'black';
                break;
            case 'success':
                backgroundColor = '#64ffda';
                textColor = 'black';
                break;
            default:
                backgroundColor = '#2ea3ff';
                textColor = 'white';
        }
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            background: ${backgroundColor};
            color: ${textColor};
            padding: 12px 20px;
            border-radius: var(--border-radius);
            z-index: 1000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            font-size: 14px;
            font-weight: 500;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    onVertexClick(vertexId) {
        if (this.renderer && this.renderer.vertexMap) {
            const vertex = this.renderer.vertexMap[vertexId];
            if (vertex) {
                this.renderer.highlightVertex(vertex);
                this.showNotification(`Selected vertex: ${vertexId}`);
            } else {
                this.showNotification(`Vertex not found: ${vertexId}`, 'warning');
            }
        }
    }
    
    onGroupClick(group) {
        this.showNotification(`Group: ${group}`);
        // Could implement highlighting of all vertices in group
    }
    
    onVertexSearch(query) {
        const verticesList = document.getElementById('vertices-list');
        if (!verticesList) return;
        
        const items = verticesList.querySelectorAll('div');
        let foundCount = 0;
        
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (query === '' || text.includes(query.toLowerCase())) {
                item.style.display = 'block';
                foundCount++;
            } else {
                item.style.display = 'none';
            }
        });
        
        // Show search results count
        const searchBox = document.querySelector('.search-box');
        if (searchBox && query !== '') {
            // Remove existing count
            const existingCount = searchBox.querySelector('.search-count');
            if (existingCount) {
                existingCount.remove();
            }
            
            const countElement = document.createElement('span');
            countElement.className = 'search-count';
            countElement.textContent = ` (${foundCount} found)`;
            countElement.style.cssText = `
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 12px;
                color: var(--text-secondary);
            `;
            
            const searchInput = searchBox.querySelector('input');
            if (searchInput) {
                searchBox.style.position = 'relative';
                searchBox.appendChild(countElement);
            }
        } else {
            // Remove count if query is empty
            const existingCount = searchBox?.querySelector('.search-count');
            if (existingCount) {
                existingCount.remove();
            }
        }
    }
    
    onTabClick(tab, event) {
        // Update active tab
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(t => t.classList.remove('active'));
        
        const target = event.currentTarget || event.target;
        target.classList.add('active');
        
        // Show corresponding content
        const contents = ['vertices-list', 'edges-list', 'groups-list'];
        contents.forEach(contentId => {
            const element = document.getElementById(contentId);
            if (element) {
                element.style.display = contentId === `${tab}-list` ? 'block' : 'none';
            }
        });
        
        // Show notification
        this.showNotification(`Viewing: ${tab}`);
    }
    
    onPhysicsToggleChange(enabled) {
        if (this.app.physicsEngine) {
            if (enabled) {
                this.app.physicsEngine.enable();
                this.showNotification('Physics simulation enabled');
            } else {
                this.app.physicsEngine.disable();
                this.showNotification('Physics simulation disabled');
            }
        }
    }
    
    onGravityChange(value) {
        if (this.app.physicsEngine) {
            this.app.physicsEngine.setGravity(value);
        }
    }
    
    // Add CSS animations if not already present
    static addNotificationStyles() {
        if (!document.getElementById('ui-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'ui-notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Add notification styles when class is loaded
UIController.addNotificationStyles();

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIController;
}