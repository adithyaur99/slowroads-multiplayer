import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import Peer from 'peerjs';
import { Vehicle } from './src/Vehicle.js';
import { Road } from './src/Road.js';
import { NetworkManager } from './src/NetworkManager.js';

class Game {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.world = null;
    this.vehicle = null;
    this.road = null;
    this.networkManager = null;
    this.remotePlayers = new Map(); // peerId -> { vehicle, mesh }

    this.clock = new THREE.Clock();
    this.isPlaying = false;

    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      brake: false
    };

    this.initUI();
  }

  initUI() {
    // Lobby buttons
    document.getElementById('create-room-btn').addEventListener('click', () => this.createRoom());
    document.getElementById('join-room-btn').addEventListener('click', () => this.showJoinScreen());
    document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
    document.getElementById('join-btn').addEventListener('click', () => this.joinRoom());
    document.getElementById('back-from-create-btn').addEventListener('click', () => this.showLobbyMenu());
    document.getElementById('back-from-join-btn').addEventListener('click', () => this.showLobbyMenu());
  }

  showLobbyMenu() {
    document.getElementById('lobby-menu').classList.remove('hidden');
    document.getElementById('create-room-screen').classList.add('hidden');
    document.getElementById('join-room-screen').classList.add('hidden');
  }

  createRoom() {
    document.getElementById('lobby-menu').classList.add('hidden');
    document.getElementById('create-room-screen').classList.remove('hidden');

    // Initialize network manager
    this.networkManager = new NetworkManager(true); // isHost = true

    this.networkManager.on('ready', (peerId) => {
      document.getElementById('room-code-display').textContent = `Room Code: ${peerId}`;
      this.updateStatus('Waiting for players...', 'connecting');
    });

    this.networkManager.on('player-joined', (playerId) => {
      console.log('Player joined:', playerId);
      this.addRemotePlayer(playerId);
      this.updatePlayerList();
    });

    this.networkManager.on('player-left', (playerId) => {
      console.log('Player left:', playerId);
      this.removeRemotePlayer(playerId);
      this.updatePlayerList();
    });

    this.networkManager.on('player-update', (data) => {
      this.updateRemotePlayer(data);
    });

    this.networkManager.init();
  }

  showJoinScreen() {
    document.getElementById('lobby-menu').classList.add('hidden');
    document.getElementById('join-room-screen').classList.remove('hidden');
  }

  joinRoom() {
    const roomCode = document.getElementById('room-code-input').value.trim();
    if (!roomCode) {
      alert('Please enter a room code');
      return;
    }

    // Initialize network manager as client
    this.networkManager = new NetworkManager(false, roomCode);

    this.networkManager.on('ready', () => {
      this.updateStatus('Connected!', 'connected');
      setTimeout(() => this.startGame(), 500);
    });

    this.networkManager.on('player-update', (data) => {
      this.updateRemotePlayer(data);
    });

    this.networkManager.on('disconnected', () => {
      this.updateStatus('Disconnected', 'disconnected');
    });

    this.networkManager.init();
  }

  startGame() {
    document.getElementById('lobby').classList.add('hidden');
    this.isPlaying = true;
    this.updateStatus('Connected', 'connected');

    this.initThree();
    this.initPhysics();
    this.initVehicle();
    this.initRoad();
    this.initLights();
    this.initControls();

    this.animate();
  }

  initThree() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 10, 300);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 4, -10);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(this.renderer.domElement);

    // Ground (far distance)
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshLambertMaterial({
      color: 0x5a9367,
      side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initPhysics() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.defaultContactMaterial.friction = 0.4;

    // Ground plane
    const groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(groundBody);
  }

  initVehicle() {
    this.vehicle = new Vehicle(this.scene, this.world, new THREE.Vector3(0, 2, 0));
  }

  initRoad() {
    this.road = new Road(this.scene, this.world);
    this.road.generate(this.vehicle.chassis.position);
  }

  initLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
  }

  initControls() {
    window.addEventListener('keydown', (e) => {
      switch(e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          this.keys.forward = true;
          break;
        case 's':
        case 'arrowdown':
          this.keys.backward = true;
          break;
        case 'a':
        case 'arrowleft':
          this.keys.left = true;
          break;
        case 'd':
        case 'arrowright':
          this.keys.right = true;
          break;
        case ' ':
          this.keys.brake = true;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch(e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          this.keys.forward = false;
          break;
        case 's':
        case 'arrowdown':
          this.keys.backward = false;
          break;
        case 'a':
        case 'arrowleft':
          this.keys.left = false;
          break;
        case 'd':
        case 'arrowright':
          this.keys.right = false;
          break;
        case ' ':
          this.keys.brake = false;
          break;
      }
    });
  }

  addRemotePlayer(playerId) {
    const remoteVehicle = new Vehicle(
      this.scene,
      this.world,
      new THREE.Vector3(Math.random() * 10 - 5, 2, Math.random() * 10 - 5),
      0xff6b6b // Different color for remote players
    );

    this.remotePlayers.set(playerId, remoteVehicle);
  }

  removeRemotePlayer(playerId) {
    const remoteVehicle = this.remotePlayers.get(playerId);
    if (remoteVehicle) {
      remoteVehicle.destroy(this.scene, this.world);
      this.remotePlayers.delete(playerId);
    }
  }

  updateRemotePlayer(data) {
    const { playerId, position, rotation, velocity } = data;
    const remoteVehicle = this.remotePlayers.get(playerId);

    if (remoteVehicle) {
      // Smoothly interpolate position and rotation
      remoteVehicle.chassis.position.lerp(
        new CANNON.Vec3(position.x, position.y, position.z),
        0.3
      );

      remoteVehicle.chassis.quaternion.copy(
        new CANNON.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
      );

      if (velocity) {
        remoteVehicle.chassis.velocity.set(velocity.x, velocity.y, velocity.z);
      }
    }
  }

  updatePlayerList() {
    const listContent = document.getElementById('player-list-content');
    listContent.innerHTML = '';

    // Add yourself
    const youItem = document.createElement('div');
    youItem.className = 'player-item player-you';
    youItem.textContent = 'You';
    listContent.appendChild(youItem);

    // Add remote players
    this.remotePlayers.forEach((vehicle, playerId) => {
      const playerItem = document.createElement('div');
      playerItem.className = 'player-item';
      playerItem.textContent = `Player ${playerId.slice(0, 6)}`;
      listContent.appendChild(playerItem);
    });
  }

  updateStatus(text, status) {
    const statusText = document.getElementById('status-text');
    statusText.textContent = text;
    statusText.className = `status-${status}`;
  }

  animate() {
    if (!this.isPlaying) return;
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Update physics
    this.world.step(1 / 60, delta, 3);

    // Update vehicle
    if (this.vehicle) {
      this.vehicle.update(this.keys, delta);

      // Send position to other players
      if (this.networkManager && this.networkManager.isConnected) {
        this.networkManager.sendUpdate({
          position: this.vehicle.chassis.position,
          rotation: this.vehicle.chassis.quaternion,
          velocity: this.vehicle.chassis.velocity
        });
      }

      // Update camera to follow vehicle
      const vehiclePos = this.vehicle.mesh.position;
      const vehicleRot = this.vehicle.mesh.rotation;

      const cameraOffset = new THREE.Vector3(0, 4, -10);
      cameraOffset.applyEuler(new THREE.Euler(0, vehicleRot.y, 0));

      this.camera.position.lerp(
        new THREE.Vector3(
          vehiclePos.x + cameraOffset.x,
          vehiclePos.y + cameraOffset.y,
          vehiclePos.z + cameraOffset.z
        ),
        0.1
      );

      this.camera.lookAt(vehiclePos.x, vehiclePos.y + 1, vehiclePos.z);

      // Update road generation
      this.road.update(this.vehicle.chassis.position);

      // Update speed display
      const speed = this.vehicle.getSpeed();
      document.getElementById('speed-display').textContent = `${Math.abs(speed)} km/h`;
    }

    // Update remote players
    this.remotePlayers.forEach(vehicle => {
      vehicle.updateMesh();
    });

    // Render
    this.renderer.render(this.scene, this.camera);
  }
}

// Start the game
const game = new Game();
