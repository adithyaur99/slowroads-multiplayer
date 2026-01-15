import Peer from 'peerjs';

export class NetworkManager {
  constructor(isHost = false, hostId = null) {
    this.isHost = isHost;
    this.hostId = hostId;
    this.peer = null;
    this.connections = new Map(); // peerId -> connection
    this.isConnected = false;
    this.updateRate = 1000 / 20; // 20 updates per second
    this.lastUpdateTime = 0;
    this.eventHandlers = new Map();
  }

  // Event system
  on(event, callback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(callback);
  }

  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(callback => callback(data));
    }
  }

  init() {
    // Create PeerJS instance
    if (this.isHost) {
      // Host creates a peer with random ID
      this.peer = new Peer();
    } else {
      // Client creates a peer and connects to host
      this.peer = new Peer();
    }

    this.peer.on('open', (id) => {
      console.log('My peer ID is:', id);
      this.myId = id;
      this.isConnected = true;

      if (this.isHost) {
        this.emit('ready', id);
        this.setupHostListeners();
      } else {
        this.connectToHost();
      }
    });

    this.peer.on('error', (err) => {
      console.error('PeerJS error:', err);
      this.emit('error', err);
    });

    this.peer.on('disconnected', () => {
      console.log('Disconnected from signaling server');
      this.isConnected = false;
      this.emit('disconnected');
    });
  }

  setupHostListeners() {
    // Host listens for incoming connections
    this.peer.on('connection', (conn) => {
      console.log('New player connecting:', conn.peer);

      conn.on('open', () => {
        console.log('Connection established with:', conn.peer);
        this.connections.set(conn.peer, conn);
        this.emit('player-joined', conn.peer);

        // Send welcome message with current game state
        conn.send({
          type: 'welcome',
          hostId: this.myId,
          players: Array.from(this.connections.keys())
        });

        // Notify other players about the new player
        this.broadcast({
          type: 'player-joined',
          playerId: conn.peer
        }, conn.peer);
      });

      conn.on('data', (data) => {
        this.handleData(conn.peer, data);
      });

      conn.on('close', () => {
        console.log('Player disconnected:', conn.peer);
        this.connections.delete(conn.peer);
        this.emit('player-left', conn.peer);

        // Notify other players
        this.broadcast({
          type: 'player-left',
          playerId: conn.peer
        });
      });

      conn.on('error', (err) => {
        console.error('Connection error with', conn.peer, err);
      });
    });
  }

  connectToHost() {
    console.log('Connecting to host:', this.hostId);

    const conn = this.peer.connect(this.hostId, {
      reliable: true
    });

    conn.on('open', () => {
      console.log('Connected to host!');
      this.connections.set(this.hostId, conn);
      this.isConnected = true;
      this.emit('ready', this.myId);
    });

    conn.on('data', (data) => {
      this.handleData(this.hostId, data);
    });

    conn.on('close', () => {
      console.log('Disconnected from host');
      this.isConnected = false;
      this.connections.delete(this.hostId);
      this.emit('disconnected');
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
      this.emit('error', err);
    });
  }

  handleData(peerId, data) {
    switch (data.type) {
      case 'welcome':
        console.log('Received welcome from host');
        // Host sent us the current game state
        break;

      case 'player-update':
        // Received position update from another player
        this.emit('player-update', {
          playerId: data.playerId || peerId,
          position: data.position,
          rotation: data.rotation,
          velocity: data.velocity
        });
        break;

      case 'player-joined':
        console.log('Player joined:', data.playerId);
        this.emit('player-joined', data.playerId);
        break;

      case 'player-left':
        console.log('Player left:', data.playerId);
        this.emit('player-left', data.playerId);
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }

  sendUpdate(vehicleData) {
    // Throttle updates
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateRate) {
      return;
    }
    this.lastUpdateTime = now;

    const updateData = {
      type: 'player-update',
      playerId: this.myId,
      position: {
        x: vehicleData.position.x,
        y: vehicleData.position.y,
        z: vehicleData.position.z
      },
      rotation: {
        x: vehicleData.rotation.x,
        y: vehicleData.rotation.y,
        z: vehicleData.rotation.z,
        w: vehicleData.rotation.w
      },
      velocity: {
        x: vehicleData.velocity.x,
        y: vehicleData.velocity.y,
        z: vehicleData.velocity.z
      }
    };

    if (this.isHost) {
      // Host broadcasts to all connected clients
      this.broadcast(updateData);
    } else {
      // Client sends to host only
      const hostConn = this.connections.get(this.hostId);
      if (hostConn && hostConn.open) {
        hostConn.send(updateData);
      }
    }
  }

  broadcast(data, excludePeerId = null) {
    // Send data to all connected peers except excluded one
    this.connections.forEach((conn, peerId) => {
      if (peerId !== excludePeerId && conn.open) {
        conn.send(data);
      }
    });
  }

  disconnect() {
    if (this.peer) {
      this.peer.destroy();
      this.isConnected = false;
    }
  }

  getConnectedPlayers() {
    return Array.from(this.connections.keys());
  }
}
