
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  ShapeType, 
  GameObject, 
  GameState 
} from '../types';
import { 
  BELT_Z_POSITIONS, 
  BELT_START_X, 
  BELT_END_X, 
  BELT_Y,
  CHUTE_X,
  CHUTE_Y_START,
  LANDING_Y,
  PLAYER_X, 
  GRAVITY, 
  INITIAL_SPEED, 
  SHAPE_TYPES, 
  SHAPE_COLORS 
} from '../constants';

interface GameCanvasProps {
  onUpdate: (scoreChange: number, lifeChange: number, caught: boolean, type: ShapeType) => void;
  gameState: GameState;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onUpdate, gameState }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const objectsRef = useRef<Map<string, { mesh: THREE.Mesh; data: GameObject }>>(new Map());
  const playerMeshRef = useRef<THREE.Group>(null);
  const activeTimeRef = useRef<number>(0);
  const speedRef = useRef<number>(INITIAL_SPEED);
  
  // Logic for guaranteeing target shape within 5 seconds
  const lastTargetRef = useRef<ShapeType>(gameState.targetShape);
  const targetDeadlineRef = useRef<number>(5); // Target must appear by this activeTime

  const gameStateRef = useRef<GameState>(gameState);
  useEffect(() => {
    // If target shape changed, reset the 5s deadline
    if (gameState.targetShape !== lastTargetRef.current) {
      lastTargetRef.current = gameState.targetShape;
      targetDeadlineRef.current = activeTimeRef.current + 4.8; // 4.8s buffer to ensure it starts spawning
    }
    gameStateRef.current = gameState;
  }, [gameState]);

  const createGeometry = (type: ShapeType) => {
    switch (type) {
      case ShapeType.BOX:
        return new THREE.BoxGeometry(1.4, 1.4, 1.4);
      case ShapeType.CYLINDER:
        return new THREE.CylinderGeometry(0.8, 0.8, 1.4, 32);
      case ShapeType.SPHERE:
        return new THREE.SphereGeometry(0.8, 32, 32);
      case ShapeType.TORUS:
        return new THREE.TorusGeometry(0.6, 0.25, 16, 100);
      case ShapeType.CONE:
        return new THREE.ConeGeometry(0.8, 1.5, 32);
      case ShapeType.ROOF: {
        const shape = new THREE.Shape();
        shape.moveTo(-0.7, -0.7);
        shape.lineTo(0.7, -0.7);
        shape.lineTo(0, 0.7);
        shape.closePath();
        const extrudeSettings = { depth: 1.4, bevelEnabled: false };
        return new THREE.ExtrudeGeometry(shape, extrudeSettings).translate(0, 0, -0.7);
      }
      case ShapeType.PARABOLOID: {
        const points = [];
        const height = 1.5;
        const radius = 0.8;
        const segments = 16;
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const y = (1 - t) * height;
          const x = radius * Math.sqrt(t); 
          points.push(new THREE.Vector2(x, y));
        }
        points.push(new THREE.Vector2(0, 0));
        const geometry = new THREE.LatheGeometry(points, 32);
        geometry.computeVertexNormals();
        return geometry.translate(0, -height / 2, 0);
      }
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  };

  const spawnObjectInLane = (currentScene: THREE.Scene, beltIndex: number) => {
    // Determine type: Force target if deadline passed
    let type: ShapeType;
    if (activeTimeRef.current >= targetDeadlineRef.current) {
      type = gameStateRef.current.targetShape;
      targetDeadlineRef.current = activeTimeRef.current + 5.0; // Reset deadline
    } else {
      type = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];
      // If we happened to spawn the target randomly, push the deadline back
      if (type === gameStateRef.current.targetShape) {
        targetDeadlineRef.current = activeTimeRef.current + 5.0;
      }
    }

    const id = Math.random().toString(36).substr(2, 9);
    
    const geometry = createGeometry(type);
    const material = new THREE.MeshPhongMaterial({ 
      color: SHAPE_COLORS[type], 
      emissive: SHAPE_COLORS[type], 
      emissiveIntensity: 0.3,
      shininess: 100
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    const z = BELT_Z_POSITIONS[beltIndex];
    mesh.position.set(CHUTE_X, CHUTE_Y_START, z);
    mesh.castShadow = true;
    currentScene.add(mesh);
    
    // Apply belt-specific speed factors to prevent objects from aligning (0.9x, 1.0x, 1.1x)
    const laneSpeed = speedRef.current * (0.9 + beltIndex * 0.1);
    
    const data: GameObject = {
      id,
      type,
      position: { x: CHUTE_X, y: CHUTE_Y_START, z },
      velocity: { x: laneSpeed, y: 0 },
      isFalling: false,
      isSpawning: true,
      beltIndex
    };
    
    objectsRef.current.set(id, { mesh, data });
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    mountRef.current.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 20, 30);
    camera.lookAt(0, 2, 0);

    const scene = sceneRef.current;
    scene.background = new THREE.Color(0x020205);

    const ambient = new THREE.AmbientLight(0x3333ff, 0.2);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 25, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const dropSpot = new THREE.SpotLight(0x00ffff, 1000, 50, Math.PI / 4, 0.5);
    dropSpot.position.set(5, 20, 0);
    dropSpot.target.position.set(5, 0, 0);
    scene.add(dropSpot);
    scene.add(dropSpot.target);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshPhongMaterial({ color: 0x000000 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(120, 40, 0x00ffff, 0x003333);
    grid.position.y = 0.05;
    scene.add(grid);

    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(150, 60),
      new THREE.MeshPhongMaterial({ color: 0x050510 })
    );
    backdrop.position.set(0, 20, -25);
    scene.add(backdrop);

    // Create Chutes
    BELT_Z_POSITIONS.forEach((z) => {
      const chuteGeo = new THREE.CylinderGeometry(1.2, 1.2, 4, 32);
      const chuteMat = new THREE.MeshPhongMaterial({ color: 0x444444, shininess: 80 });
      const chute = new THREE.Mesh(chuteGeo, chuteMat);
      chute.position.set(CHUTE_X - 1, CHUTE_Y_START + 1, z);
      chute.rotation.z = Math.PI / 4;
      scene.add(chute);
    });

    BELT_Z_POSITIONS.forEach((z) => {
      const beltGroup = new THREE.Group();
      const belt = new THREE.Mesh(
        new THREE.BoxGeometry(22, 1, 5.5),
        new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 50 })
      );
      belt.position.set(-4, BELT_Y - 0.5, z);
      belt.receiveShadow = true;
      beltGroup.add(belt);

      const legGeo = new THREE.BoxGeometry(0.5, BELT_Y, 0.5);
      const legMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
      
      const leg1 = new THREE.Mesh(legGeo, legMat);
      leg1.position.set(-14, (BELT_Y / 2) - 0.5, z - 2);
      beltGroup.add(leg1);

      const leg2 = new THREE.Mesh(legGeo, legMat);
      leg2.position.set(-14, (BELT_Y / 2) - 0.5, z + 2);
      beltGroup.add(leg2);

      const leg3 = new THREE.Mesh(legGeo, legMat);
      leg3.position.set(4, (BELT_Y / 2) - 0.5, z - 2);
      beltGroup.add(leg3);

      const leg4 = new THREE.Mesh(legGeo, legMat);
      leg4.position.set(4, (BELT_Y / 2) - 0.5, z + 2);
      beltGroup.add(leg4);

      const stripes = new THREE.Mesh(
        new THREE.PlaneGeometry(22, 0.6),
        new THREE.MeshBasicMaterial({ color: 0xdddd00, side: THREE.DoubleSide })
      );
      stripes.rotation.x = -Math.PI / 2;
      stripes.position.set(-4, BELT_Y + 0.01, z + 2.5);
      beltGroup.add(stripes);

      const stripesBack = stripes.clone();
      stripesBack.position.z = z - 2.5;
      beltGroup.add(stripesBack);

      scene.add(beltGroup);
    });

    const binGroup = new THREE.Group();
    const binMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x0088ff, 
      roughness: 0.3,
      metalness: 0.2
    });
    
    const wallThickness = 0.2;
    const binW = 4;
    const binH = 3;
    const binD = 5;

    const bottomMesh = new THREE.Mesh(new THREE.BoxGeometry(binW, wallThickness, binD), binMaterial);
    bottomMesh.position.y = -binH / 2 + wallThickness / 2;
    bottomMesh.castShadow = true;
    bottomMesh.receiveShadow = true;
    binGroup.add(bottomMesh);

    const frontMesh = new THREE.Mesh(new THREE.BoxGeometry(binW, binH, wallThickness), binMaterial);
    frontMesh.position.z = -binD / 2 + wallThickness / 2;
    frontMesh.castShadow = true;
    frontMesh.receiveShadow = true;
    binGroup.add(frontMesh);

    const backMesh = new THREE.Mesh(new THREE.BoxGeometry(binW, binH, wallThickness), binMaterial);
    backMesh.position.z = binD / 2 - wallThickness / 2;
    backMesh.castShadow = true;
    backMesh.receiveShadow = true;
    binGroup.add(backMesh);

    const leftMesh = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, binH, binD), binMaterial);
    leftMesh.position.x = -binW / 2 + wallThickness / 2;
    leftMesh.castShadow = true;
    leftMesh.receiveShadow = true;
    binGroup.add(leftMesh);

    const rightMesh = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, binH, binD), binMaterial);
    rightMesh.position.x = binW / 2 - wallThickness / 2;
    rightMesh.castShadow = true;
    rightMesh.receiveShadow = true;
    binGroup.add(rightMesh);
    
    binGroup.position.set(PLAYER_X, 2.5, gameStateRef.current.playerZ);
    scene.add(binGroup);
    playerMeshRef.current = binGroup;

    const clock = new THREE.Clock();
    const animate = () => {
      const delta = clock.getDelta();
      const currentGS = gameStateRef.current;

      // Only run game loop if started
      if (currentGS.gameStarted && !currentGS.gameOver && !currentGS.isPaused) {
        activeTimeRef.current += delta;
        const totalActiveTime = activeTimeRef.current;

        // Lane monitoring: count active objects per belt
        const laneCounts = [0, 0, 0];
        const laneMinX = [Infinity, Infinity, Infinity];
        
        objectsRef.current.forEach(obj => {
          if (!obj.data.isFalling) {
            laneCounts[obj.data.beltIndex]++;
            laneMinX[obj.data.beltIndex] = Math.min(laneMinX[obj.data.beltIndex], obj.data.position.x);
          }
        });

        // Maintain 1-3 objects per belt
        for (let i = 0; i < 3; i++) {
          if (laneCounts[i] < 3) {
            // Distance check to avoid overlapping at spawn
            const clearingDistance = 7; 
            const canSpawn = laneCounts[i] === 0 || laneMinX[i] > CHUTE_X + clearingDistance;
            
            if (canSpawn) {
              // Staggered start logic:
              // Lane 1 (middle) can spawn immediately.
              // Lane 0 and 2 wait until game has been running for at least 3 seconds.
              const isInitialStaggered = (i !== 1 && totalActiveTime < 3.0);
              
              if (!isInitialStaggered) {
                // If lane is empty, spawn immediately. 
                // If lane has objects but is below max, spawn with a small random staggered delay
                if (laneCounts[i] === 0 || Math.random() < 0.02) {
                  spawnObjectInLane(scene, i);
                  speedRef.current += 0.005; // Gentle speed scaling
                }
              }
            }
          }
        }

        if (playerMeshRef.current) {
          playerMeshRef.current.position.z = THREE.MathUtils.lerp(
            playerMeshRef.current.position.z, 
            currentGS.playerZ, 
            0.25
          );
          playerMeshRef.current.position.y = 2.5 + Math.sin(totalActiveTime * 2) * 0.1;
        }

        objectsRef.current.forEach((val, id) => {
          const { mesh, data } = val;
          
          if (data.isSpawning) {
            data.velocity.y += GRAVITY * delta;
            data.position.y += data.velocity.y * delta;
            data.position.x += 2 * delta; 
            
            if (data.position.y <= LANDING_Y) {
              data.position.y = LANDING_Y;
              data.velocity.y = 0;
              data.isSpawning = false;
            }
          } else if (!data.isFalling) {
            data.position.x += data.velocity.x * delta;
            if (data.position.x > BELT_END_X) {
              data.isFalling = true;
              data.velocity.y = 6; 
            }
          } else {
            data.velocity.y += GRAVITY * delta;
            data.position.y += data.velocity.y * delta;
            data.position.x += data.velocity.x * delta;
          }

          mesh.position.set(data.position.x, data.position.y, data.position.z);
          mesh.rotation.x += delta * 3;
          mesh.rotation.z += delta * 1.5;

          if (data.isFalling && data.position.y < 4.0 && data.position.y > 0) {
            const distZ = Math.abs(data.position.z - currentGS.playerZ);
            const distX = Math.abs(data.position.x - PLAYER_X);
            
            if (distX < 2 && distZ < 2.5) {
              const isCorrect = data.type === currentGS.targetShape;
              onUpdate(isCorrect ? 100 : 0, isCorrect ? 0 : -1, true, data.type);
              scene.remove(mesh);
              objectsRef.current.delete(id);
              return;
            }
          }

          if (data.position.y < -2) {
            const isCorrect = data.type === currentGS.targetShape;
            onUpdate(0, isCorrect ? -1 : 0, false, data.type);
            scene.remove(mesh);
            objectsRef.current.delete(id);
          }
        });
      } else if (!currentGS.gameStarted) {
        // Subtle background idle movement even when not started
        const time = clock.getElapsedTime();
        if (playerMeshRef.current) {
          playerMeshRef.current.position.y = 2.5 + Math.sin(time * 0.5) * 0.05;
        }
      }

      renderer.render(scene, camera);
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      objectsRef.current.forEach(({ mesh }) => scene.remove(mesh));
      objectsRef.current.clear();
      scene.remove(binGroup);
    };
  }, [onUpdate]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default GameCanvas;
