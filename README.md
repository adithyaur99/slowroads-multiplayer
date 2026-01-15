# 🚗 Slow Roads - Multiplayer

A multiplayer version of Slow Roads built with **Three.js**, **Cannon.js**, and **PeerJS**. Drive together with friends on endless procedurally generated roads!

## Features

- ✨ **Real-time multiplayer** - Drive with friends using peer-to-peer connections
- 🌍 **Procedural road generation** - Endless roads with trees and scenery
- 🚙 **Realistic vehicle physics** - Powered by Cannon.js
- 🎮 **Simple controls** - WASD or arrow keys to drive
- 🌐 **No server needed** - P2P connections using PeerJS
- 👥 **Room system** - Create or join rooms with simple codes

## How It Works

### Architecture

This game uses a **host-authority** multiplayer model:

1. **Host creates room** → Gets a unique room code
2. **Clients join** → Connect directly to host via PeerJS
3. **Host relays data** → All player positions go through the host
4. **Client prediction** → Smooth interpolation of remote players

### Technology Stack

- **Three.js** - 3D rendering and scene management
- **Cannon.js** - Physics simulation for realistic vehicle handling
- **PeerJS** - WebRTC wrapper for peer-to-peer networking
- **Vite** - Fast development server and bundler

## Getting Started

### Installation

```bash
cd ~/slowroads-multiplayer
npm install
```

### Running the Game

```bash
npm run dev
```

Then open your browser to `http://localhost:5173`

### Playing Multiplayer

**To Host:**
1. Click "Create Room"
2. Share the room code with friends
3. Click "Start Driving" when ready

**To Join:**
1. Click "Join Room"
2. Enter your friend's room code
3. Start driving!

## Controls

| Key | Action |
|-----|--------|
| W / ↑ | Accelerate |
| S / ↓ | Brake/Reverse |
| A / ← | Steer Left |
| D / → | Steer Right |
| Space | Handbrake |

## Project Structure

```
slowroads-multiplayer/
├── index.html              # Main HTML with UI
├── main.js                 # Game initialization and loop
├── src/
│   ├── Vehicle.js          # Car physics and rendering
│   ├── Road.js             # Procedural road generation
│   └── NetworkManager.js   # PeerJS multiplayer networking
├── package.json
└── README.md
```

## Code Overview

### Vehicle.js

Handles vehicle physics using Cannon.js raycast vehicle:
- 4-wheel physics simulation
- Suspension, steering, and acceleration
- 3D mesh synchronization with physics body

### Road.js

Procedural road generation system:
- Infinite road segments
- Dynamic loading/unloading based on player position
- Trees and vegetation
- Road markings

### NetworkManager.js

PeerJS-based multiplayer:
- Host/client architecture
- Player position synchronization (20 updates/second)
- Connection management
- Event system for game integration

## Customization

### Change Car Color

In `main.js`, modify the Vehicle instantiation:

```javascript
this.vehicle = new Vehicle(
  this.scene,
  this.world,
  new THREE.Vector3(0, 2, 0),
  0xFF5733  // Your color here (hex)
);
```

### Adjust Physics

In `src/Vehicle.js`, tweak these values:

```javascript
this.maxSteerVal = 0.5;     // Steering sensitivity
this.maxForce = 1500;        // Engine power
this.brakeForce = 10;        // Brake strength
```

### Change Update Rate

In `src/NetworkManager.js`:

```javascript
this.updateRate = 1000 / 20;  // 20 updates/sec
```

## Known Limitations

- **8-10 player maximum** - P2P mesh network performance degrades
- **Host dependency** - Game ends if host disconnects
- **No reconnection** - Players must rejoin if disconnected
- **Client-side authority** - Host can theoretically cheat
- **NAT traversal** - Some firewalls may block P2P connections

## Future Improvements

- [ ] Host migration (if host leaves, elect new host)
- [ ] Player names/colors customization
- [ ] Chat system
- [ ] Minimap showing other players
- [ ] Different vehicle types
- [ ] Day/night cycle
- [ ] Weather effects
- [ ] Power-ups (speed boost, jump)
- [ ] Collision detection between players
- [ ] Dedicated server option for competitive play

## Troubleshooting

**Players can't connect:**
- Check firewall settings
- Try different browser (Chrome/Firefox work best)
- Both players must be on same PeerJS version

**Laggy gameplay:**
- Reduce update rate in NetworkManager.js
- Close unnecessary browser tabs
- Check internet connection

**Cars teleporting:**
- Normal for high latency connections
- Increase lerp smoothing in main.js `updateRemotePlayer()`

## License

MIT License - feel free to modify and share!

## Credits

Inspired by the original [Slow Roads](https://slowroads.io) by Anslo

Built as an educational project to demonstrate:
- Three.js 3D game development
- Physics-based vehicle simulation
- Real-time multiplayer with PeerJS
