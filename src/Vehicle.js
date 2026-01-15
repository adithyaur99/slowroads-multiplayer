import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Vehicle {
  constructor(scene, world, position = new THREE.Vector3(0, 2, 0), color = 0x4CAF50) {
    this.scene = scene;
    this.world = world;
    this.color = color;

    // Physics properties
    this.maxSteerVal = 0.5;
    this.maxForce = 1500;
    this.brakeForce = 10;
    this.currentSpeed = 0;

    this.init(position);
  }

  init(position) {
    // Create chassis body
    const chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
    this.chassis = new CANNON.Body({ mass: 500 });
    this.chassis.addShape(chassisShape);
    this.chassis.position.set(position.x, position.y, position.z);
    this.chassis.linearDamping = 0.5;
    this.chassis.angularDamping = 0.5;

    // Create vehicle
    this.vehicle = new CANNON.RaycastVehicle({
      chassisBody: this.chassis,
      indexRightAxis: 0,
      indexUpAxis: 1,
      indexForwardAxis: 2
    });

    // Wheel options
    const wheelOptions = {
      radius: 0.4,
      directionLocal: new CANNON.Vec3(0, -1, 0),
      suspensionStiffness: 30,
      suspensionRestLength: 0.3,
      frictionSlip: 1.5,
      dampingRelaxation: 2.3,
      dampingCompression: 4.4,
      maxSuspensionForce: 100000,
      rollInfluence: 0.01,
      axleLocal: new CANNON.Vec3(-1, 0, 0),
      chassisConnectionPointLocal: new CANNON.Vec3(1, 0, 1),
      maxSuspensionTravel: 0.3,
      customSlidingRotationalSpeed: -30,
      useCustomSlidingRotationalSpeed: true
    };

    // Add wheels
    wheelOptions.chassisConnectionPointLocal.set(-0.8, 0, 1.2);
    this.vehicle.addWheel(wheelOptions);

    wheelOptions.chassisConnectionPointLocal.set(0.8, 0, 1.2);
    this.vehicle.addWheel(wheelOptions);

    wheelOptions.chassisConnectionPointLocal.set(-0.8, 0, -1.2);
    this.vehicle.addWheel(wheelOptions);

    wheelOptions.chassisConnectionPointLocal.set(0.8, 0, -1.2);
    this.vehicle.addWheel(wheelOptions);

    this.vehicle.addToWorld(this.world);

    // Create Three.js mesh for visual representation
    this.createMesh();
    this.createWheels();
  }

  createMesh() {
    // Car body
    const bodyGeometry = new THREE.BoxGeometry(2, 1, 4);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: this.color });
    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Car roof
    const roofGeometry = new THREE.BoxGeometry(1.6, 0.6, 2);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: this.color });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 0.8, -0.3);
    roof.castShadow = true;
    this.mesh.add(roof);

    // Windows
    const windowMaterial = new THREE.MeshLambertMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.8
    });

    // Windshield
    const windshieldGeometry = new THREE.BoxGeometry(1.5, 0.5, 0.1);
    const windshield = new THREE.Mesh(windshieldGeometry, windowMaterial);
    windshield.position.set(0, 0.8, 0.65);
    this.mesh.add(windshield);

    // Rear window
    const rearWindow = new THREE.Mesh(windshieldGeometry, windowMaterial);
    rearWindow.position.set(0, 0.8, -1.35);
    this.mesh.add(rearWindow);

    // Side windows
    const sideWindowGeometry = new THREE.BoxGeometry(0.1, 0.4, 1.5);
    const leftWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    leftWindow.position.set(-0.75, 0.8, -0.3);
    this.mesh.add(leftWindow);

    const rightWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    rightWindow.position.set(0.75, 0.8, -0.3);
    this.mesh.add(rightWindow);

    this.scene.add(this.mesh);
  }

  createWheels() {
    this.wheelMeshes = [];
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

    for (let i = 0; i < 4; i++) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      this.wheelMeshes.push(wheel);
      this.scene.add(wheel);
    }
  }

  update(keys, delta) {
    const maxSteerVal = this.maxSteerVal;
    const maxForce = this.maxForce;
    const brakeForce = this.brakeForce;

    // Calculate steering
    let steerValue = 0;
    if (keys.left) steerValue += maxSteerVal;
    if (keys.right) steerValue -= maxSteerVal;

    // Calculate engine force
    let engineForce = 0;
    if (keys.forward) engineForce = maxForce;
    if (keys.backward) engineForce = -maxForce / 2;

    // Apply brake
    let brake = 0;
    if (keys.brake) brake = brakeForce;

    // Apply to vehicle
    this.vehicle.setSteeringValue(steerValue, 0);
    this.vehicle.setSteeringValue(steerValue, 1);

    this.vehicle.applyEngineForce(engineForce, 2);
    this.vehicle.applyEngineForce(engineForce, 3);

    this.vehicle.setBrake(brake, 0);
    this.vehicle.setBrake(brake, 1);
    this.vehicle.setBrake(brake, 2);
    this.vehicle.setBrake(brake, 3);

    // Update current speed for display
    this.currentSpeed = this.chassis.velocity.length() * 3.6; // Convert to km/h

    // Update mesh position and rotation
    this.updateMesh();
  }

  updateMesh() {
    // Update chassis mesh
    this.mesh.position.copy(this.chassis.position);
    this.mesh.quaternion.copy(this.chassis.quaternion);

    // Update wheel meshes
    for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
      this.vehicle.updateWheelTransform(i);
      const transform = this.vehicle.wheelInfos[i].worldTransform;

      this.wheelMeshes[i].position.copy(transform.position);
      this.wheelMeshes[i].quaternion.copy(transform.quaternion);
    }
  }

  getSpeed() {
    return Math.round(this.currentSpeed);
  }

  destroy(scene, world) {
    // Remove from scene
    scene.remove(this.mesh);
    this.wheelMeshes.forEach(wheel => scene.remove(wheel));

    // Remove from physics world
    this.vehicle.removeFromWorld(world);
  }
}
