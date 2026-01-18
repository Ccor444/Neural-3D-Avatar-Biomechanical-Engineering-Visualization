🧠 Neural 3D Avatar | Biomechanical Engineering & Visualization

https://img.shields.io/badge/version-2.0.0-blue.svg?style=for-the-badge
https://img.shields.io/badge/Three.js-r128-000000.svg?style=for-the-badge
https://img.shields.io/badge/Physics-Verlet_Integration-ff69b4.svg?style=for-the-badge
https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge

An advanced, high-precision biomechanical mesh visualizer and physics simulator. This project implements a mass-spring system to simulate human tissue behavior, coupled with anatomical joint constraints for medical, robotic, and sports science applications.

✨ Features

🎯 Core Visualization

· High-precision 3D mesh rendering with wireframe, skeleton, and joint visualization
· Real-time physics simulation using mass-spring dynamics
· Multiple color schemes: Biomechanical, Thermal, Group-based, Weight-based
· Dynamic LOD (Level of Detail) management for optimal performance
· Interactive vertex selection with detailed information panels

🔬 Biomechanical Simulation

· Anatomical accuracy with joint constraints based on human range of motion
· Mass-spring physics for realistic tissue deformation
· Collision detection with ground and self-collision prevention
· Gravity simulation with adjustable parameters (0-20 m/s²)
· Wind and explosion effects for stress testing

💻 Technical Architecture

· Modular design with separated concerns (Renderer, Physics, UI)
· GPU-accelerated rendering using Three.js WebGL 2.0
· Real-time performance monitoring with FPS counter and metrics
· Responsive UI that works on desktop and mobile devices
· Keyboard shortcuts for quick access to all features

🏗️ Project Structure

```
neural-3d-avatar/
├── index.html              # Main HTML file with UI structure
├── styles.css              # Complete styling with responsive design
├── app.js                  # Main application orchestrator
├── meshRenderer.js         # Three.js based 3D rendering engine
├── physicsEngine.js        # Mass-spring physics simulation engine
├── uiController.js         # User interface controller and event handling
├── mesh_data.json          # Biomechanical mesh data (vertices, edges, physics)
└── README.md               # This documentation
```

🚀 Quick Start

Prerequisites

· Modern web browser with WebGL 2.0 support (Chrome 80+, Firefox 75+, Safari 14+)
· Local web server (for loading JSON files)

Installation & Running

1. Clone or download the project
   ```bash
   git clone [repository-url]
   cd neural-3d-avatar
   ```
2. Start a local server
   Option 1: Using Python
   ```bash
   python -m http.server 8000
   ```
   Option 2: Using Node.js
   ```bash
   npx serve .
   ```
   Option 3: Using VS Code Live Server extension
3. Open in browser
   ```
   http://localhost:8000
   ```

🎮 Controls & Shortcuts

Mouse Controls

· Left Click + Drag: Rotate view
· Right Click + Drag: Pan view
· Scroll Wheel: Zoom in/out
· Click on joints: Select vertex for details

Keyboard Shortcuts

Key Action
Space Reset view to default
1 Front view
2 Side view
3 Top view
P Toggle physics simulation
R Reset physics to initial state
G Toggle grid visibility
X Toggle axis visibility
S Take screenshot
F1 Show help modal
F4 Toggle performance stats
ESC Close all panels

Physics Controls

· Enable/Disable Physics: Toggle in left panel or press 'P'
· Adjust Gravity: Use slider (0-20 m/s²)
· Apply Forces: Use quick action buttons (Wind, Explosion)
· Reset Physics: Button in left panel or press 'R'

📊 Mesh Data Structure

The biomechanical mesh is defined in mesh_data.json with:

Vertices

· 143 vertices with anatomical accuracy
· Each vertex includes: position (x, y, z), group, type, weight
· Types: joint (fixed points), surface, feature, contour
· Groups: Head, Neck, Chest, Arms, Legs, etc.

Edges

· 151 edges connecting vertices
· Defines the wireframe structure
· Used for spring physics calculations

Physics Properties

· Mass distribution per body part
· Spring stiffness for different tissue types
· Joint constraints for anatomical accuracy
· Collision parameters

🔧 Development

Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  MeshVisualizerApp                   │
│  (Orchestrator / Application Controller)            │
└─────────────────┬───────────────────┬───────────────┘
                  │                   │
    ┌─────────────▼──────┐  ┌─────────▼──────────┐
    │    MeshRenderer    │  │   PhysicsEngine    │
    │  (Three.js based)  │  │ (Mass-Spring Sys.) │
    └─────────────┬──────┘  └─────────┬──────────┘
                  │                   │
          ┌───────▼───────────────────▼───────┐
          │          UIController             │
          │   (Event Handling & UI Updates)   │
          └───────────────────────────────────┘
```

Key Components

1. MeshRenderer (meshRenderer.js)
   · Handles Three.js scene setup and rendering
   · Manages mesh, wireframe, joints, and skeleton
   · Implements LOD switching and color schemes
   · Provides camera controls and view management
2. PhysicsEngine (physicsEngine.js)
   · Implements mass-spring dynamics using Verlet integration
   · Handles constraints and collision detection
   · Manages gravity, wind, and explosion effects
   · Provides real-time physics simulation
3. UIController (uiController.js)
   · Manages all UI event listeners
   · Updates real-time metrics and statistics
   · Handles notifications and user feedback
   · Controls data exploration panels
4. MeshVisualizerApp (app.js)
   · Main application orchestrator
   · Manages initialization and cleanup
   · Coordinates between renderer, physics, and UI
   · Handles error management and loading states

Extending the Project

Adding New Features

1. New visualization mode: Extend MeshRenderer.updateConfig()
2. Additional physics effects: Add methods to PhysicsEngine
3. New UI controls: Add elements in index.html and handlers in UIController
4. Custom mesh data: Update mesh_data.json with proper structure

Performance Optimization

· Adjust LOD settings in mesh_data.json
· Toggle physics complexity based on performance
· Use fewer iterations for constraints on slower devices
· Implement Web Workers for heavy physics calculations

📈 Performance Monitoring

The application includes built-in performance tools:

Real-time Metrics

· FPS Counter: Frame rate display with color coding (green > 50, orange > 30, red < 30)
· CPU/GPU Usage: Simulated metrics showing resource utilization
· Frame Time: Latency per frame in milliseconds
· Physics Stats: Spring count, gravity settings, simulation status

Stats.js Integration

· Press F4 or click Performance button to toggle stats
· Shows FPS, MS (frame time), and MB (memory usage)
· Helps identify performance bottlenecks

🗺️ Roadmap

Phase 1 (Current)

· ✅ Basic 3D mesh visualization
· ✅ Mass-spring physics simulation
· ✅ Interactive UI with real-time controls
· ✅ Performance monitoring and optimization

Phase 2 (Planned)

· 🚧 Multi-threaded physics using Web Workers
· 🚧 Integration with IMU/BNO055 sensors via WebBluetooth
· 🚧 AI-driven pose estimation using MediaPipe
· 🚧 Export/Import functionality for mesh states

Phase 3 (Future)

· 📋 Real-time motion capture integration
· 📋 Advanced muscle simulation with fatigue modeling
· 📋 VR/AR support using WebXR
· 📋 Cloud-based collaboration features

🧪 Testing & Validation

Data Validation

The mesh data is validated on load:

· ✅ All vertices have required properties
· ✅ Edges reference existing vertices
· ✅ Physics properties are within valid ranges
· ✅ JSON structure is properly formatted

Physics Validation

· ✅ Energy conservation in closed systems
· ✅ Stable simulation without explosions
· ✅ Realistic deformation under stress
· ✅ Proper collision response

Performance Testing

· ✅ 60 FPS on modern desktop browsers
· ✅ 30+ FPS on mobile devices
· ✅ Memory usage within reasonable limits
· ✅ Smooth interaction during physics simulation

🐛 Troubleshooting

Common Issues

1. Black screen or no rendering
   · Check browser WebGL 2.0 support
   · Verify mesh_data.json is accessible
   · Check browser console for errors
2. Physics simulation not working
   · Ensure physics is enabled (checkbox or 'P' key)
   · Check gravity slider is not set to 0
   · Verify mesh data loaded correctly
3. Poor performance
   · Reduce LOD level in visualization controls
   · Disable physics if not needed
   · Close other tabs/applications
   · Use Chrome/Firefox for best performance
4. UI elements not responding
   · Refresh the page
   · Check for JavaScript errors in console
   · Ensure all files are properly loaded

Browser Compatibility

· Chrome 80+: Full support
· Firefox 75+: Full support
· Safari 14+: Full support
· Edge 80+: Full support
· Mobile browsers: Limited support (reduced performance)

🤝 Contributing

1. Fork the repository
2. Create a feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

Code Standards

· Use meaningful variable and function names
· Add comments for complex logic
· Follow existing code structure
· Test changes on multiple browsers
· Update documentation as needed

📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments

· Three.js team for the amazing WebGL library
· Stats.js for performance monitoring
· Biomechanics research community for anatomical data
· Open source contributors who make projects like this possible

📞 Support & Contact

For questions, issues, or feature requests:

1. Check the Issues page
2. Create a new issue with detailed description
3. Include browser info and error messages if applicable

---

Built with ❤️ for the biomechanics and visualization communities

"Simulating the human form, one vertex at a time"
