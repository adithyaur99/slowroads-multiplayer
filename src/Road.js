import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Road {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;

    this.segments = [];
    this.maxSegments = 50;
    this.segmentLength = 20;
    this.roadWidth = 8;
    this.lastSegmentPosition = new THREE.Vector3(0, 0, 0);
    this.segmentCount = 0;
  }

  generate(vehiclePosition) {
    // Generate initial road segments ahead of vehicle
    for (let i = 0; i < 30; i++) {
      this.addSegment();
    }
  }

  addSegment() {
    const segment = this.createSegment(this.lastSegmentPosition, this.segmentCount);
    this.segments.push(segment);
    this.scene.add(segment.mesh);

    // Add physics body for the road segment
    const shape = new CANNON.Box(
      new CANNON.Vec3(this.roadWidth / 2, 0.1, this.segmentLength / 2)
    );
    const body = new CANNON.Body({ mass: 0 });
    body.addShape(shape);
    body.position.copy(segment.mesh.position);
    this.world.addBody(body);
    segment.body = body;

    // Update position for next segment
    this.lastSegmentPosition.z += this.segmentLength;
    this.segmentCount++;

    // Remove old segments if too many
    if (this.segments.length > this.maxSegments) {
      const oldSegment = this.segments.shift();
      this.scene.remove(oldSegment.mesh);
      this.world.removeBody(oldSegment.body);
    }
  }

  createSegment(position, index) {
    // Create road segment with slight curves
    const curve = Math.sin(index * 0.1) * 2;

    const geometry = new THREE.PlaneGeometry(this.roadWidth, this.segmentLength);
    const material = new THREE.MeshLambertMaterial({
      color: 0x404040,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(
      position.x + curve,
      position.y,
      position.z + this.segmentLength / 2
    );
    mesh.receiveShadow = true;

    // Add road markings
    const markings = this.createRoadMarkings(index);
    mesh.add(markings);

    // Add side vegetation
    this.addVegetation(mesh, curve);

    return { mesh, position: mesh.position.clone() };
  }

  createRoadMarkings(index) {
    const markingsGroup = new THREE.Group();

    // Center line (dashed)
    if (index % 2 === 0) {
      const lineGeometry = new THREE.PlaneGeometry(0.3, 8);
      const lineMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        side: THREE.DoubleSide
      });
      const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
      centerLine.rotation.x = -Math.PI / 2;
      centerLine.position.y = 0.02;
      markingsGroup.add(centerLine);
    }

    // Side lines
    const sideLineGeometry = new THREE.PlaneGeometry(0.2, this.segmentLength);
    const sideLineMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      side: THREE.DoubleSide
    });

    const leftLine = new THREE.Mesh(sideLineGeometry, sideLineMaterial);
    leftLine.rotation.x = -Math.PI / 2;
    leftLine.position.set(-this.roadWidth / 2 + 0.3, 0.02, 0);
    markingsGroup.add(leftLine);

    const rightLine = new THREE.Mesh(sideLineGeometry, sideLineMaterial);
    rightLine.rotation.x = -Math.PI / 2;
    rightLine.position.set(this.roadWidth / 2 - 0.3, 0.02, 0);
    markingsGroup.add(rightLine);

    return markingsGroup;
  }

  addVegetation(mesh, curve) {
    // Add simple trees/vegetation on the sides
    const treeCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < treeCount; i++) {
      // Left side
      const leftTree = this.createSimpleTree();
      leftTree.position.set(
        -this.roadWidth / 2 - Math.random() * 5 - 3,
        0,
        (Math.random() - 0.5) * this.segmentLength
      );
      mesh.add(leftTree);

      // Right side
      const rightTree = this.createSimpleTree();
      rightTree.position.set(
        this.roadWidth / 2 + Math.random() * 5 + 3,
        0,
        (Math.random() - 0.5) * this.segmentLength
      );
      mesh.add(rightTree);
    }
  }

  createSimpleTree() {
    const tree = new THREE.Group();

    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    tree.add(trunk);

    // Foliage
    const foliageGeometry = new THREE.ConeGeometry(1.5, 3, 8);
    const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = 4;
    foliage.castShadow = true;
    tree.add(foliage);

    return tree;
  }

  update(vehiclePosition) {
    // Check if we need to generate more road ahead
    const distanceToLastSegment = this.lastSegmentPosition.z - vehiclePosition.z;

    if (distanceToLastSegment < this.segmentLength * 20) {
      this.addSegment();
    }

    // Remove segments that are far behind the vehicle
    while (this.segments.length > 0) {
      const firstSegment = this.segments[0];
      const distanceBehind = vehiclePosition.z - firstSegment.position.z;

      if (distanceBehind > this.segmentLength * 10) {
        const removed = this.segments.shift();
        this.scene.remove(removed.mesh);
        this.world.removeBody(removed.body);
      } else {
        break;
      }
    }
  }
}
