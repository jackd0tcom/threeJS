import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const container = document.getElementById("hero-container");

// Get container dimensions for responsive sizing
const containerRect = container.getBoundingClientRect();

// === Scene + Camera ===
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  35,
  containerRect.width / containerRect.height,
  1,
  500
);
camera.position.set(0, 0, 5);

// === Renderer ===
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(containerRect.width, containerRect.height);
container.appendChild(renderer.domElement);

// === Lights ===
scene.add(new THREE.AmbientLight(0xbefcfd, 1));
const dirLight = new THREE.DirectionalLight(0xfdfefb, 2.25);
dirLight.position.set(10, 10, 10);
scene.add(dirLight);

// === Cursor setup ===
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});
const targetPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const targetPoint = new THREE.Vector3();

// === Load model ===
const loader = new GLTFLoader();
let fish,
  headBone,
  vertebraeBones = [],
  tailBone;
let mixer;

loader.load(
  "https://www.jackballdev.com/threeJS/assets/Fish-Bone-Computer-refinedAnimation.glb",
  (gltf) => {
    fish = gltf.scene;

    fish.traverse((child) => {
      if (
        child.isMesh &&
        child.material?.name.toLowerCase().includes("screen")
      ) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: 0xbefcfd,
          transparent: true,
          opacity: 0.2,
          roughness: 0.15,
          metalness: 0,
          transmission: 1.0,
          ior: 5,
          thickness: 0.3,
          envMapIntensity: 1.0,
        });
      }

      if (child.isBone && child.name === "Head") {
        headBone = child;
      }

      // Add vertebrae bones in order (from head to tail)
      if (
        child.isBone &&
        (child.name === "Bone" ||
          child.name === "Bone002" ||
          child.name === "Bone003" ||
          child.name === "Bone004" ||
          child.name === "Bone005" ||
          child.name === "Bone008" ||
          child.name === "Bone009")
      ) {
        vertebraeBones.push(child);
      }

      if (child.isBone && child.name === "Tail") {
        tailBone = child;
      }
    });

    // Center model
    const box = new THREE.Box3().setFromObject(fish);
    const center = box.getCenter(new THREE.Vector3());
    fish.position.sub(center);
    scene.add(fish);

    fish.rotation.y = -1.5;

    if (gltf.animations && gltf.animations.length) {
      mixer = new THREE.AnimationMixer(fish);

      const action = mixer.clipAction(gltf.animations[0]);

      // Animation optimization settings
      action.setLoop(THREE.LoopRepeat); // Ensure looping
      action.setEffectiveWeight(1.0); // Full influence
      action.setEffectiveTimeScale(1.0); // Normal speed

      // Optimize animation for performance
      action.clampWhenFinished = true;
      action.enabled = true;

      action.play();

      console.log(
        `Animation loaded: ${gltf.animations[0].name}, duration: ${gltf.animations[0].duration}s`
      );
    }
  },
  undefined,
  (error) => console.error("Error loading model:", error)
);

// === Resize ===
window.addEventListener("resize", () => {
  // Get updated container dimensions
  const newContainerRect = container.getBoundingClientRect();

  camera.aspect = newContainerRect.width / newContainerRect.height;
  camera.updateProjectionMatrix();
  renderer.setSize(newContainerRect.width, newContainerRect.height);
});

// === Animation ===
const clock = new THREE.Clock();
const smoothedTarget = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // Optimized animation update with frame rate independence
  if (mixer) {
    // Cap delta time to prevent large jumps
    const cappedDelta = Math.min(delta, 1 / 30); // Max 30fps equivalent
    mixer.update(cappedDelta);
  }

  // Raycast to get smoothed target
  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.intersectPlane(targetPlane, targetPoint);
  smoothedTarget.lerp(targetPoint, 0.2);

  if (headBone) {
    const headPos = new THREE.Vector3();
    headBone.getWorldPosition(headPos);

    // Direction from head to target
    const targetDir = new THREE.Vector3()
      .subVectors(smoothedTarget, headPos)
      .normalize();

    // Only track up/down movement (Y-axis), ignore left/right movement
    // Use just the Y component of the target direction for up/down tracking
    // Flip the direction so up cursor = up fish movement
    const pitch = -targetDir.y; // This gives us -1 to +1 range, flipped

    // Clamp the range (±25°) and scale the -1 to +1 range to radians
    const maxPitch = THREE.MathUtils.degToRad(20);
    const clampedPitch = THREE.MathUtils.clamp(
      pitch * maxPitch,
      -maxPitch,
      maxPitch
    );

    // Construct a rotation quaternion (lock X, rotate around Z)
    const targetQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(clampedPitch, 0, 0)
    );

    // Blend animation with cursor tracking for smooth movement
    if (mixer) {
      headBone.rotation.z = clampedPitch + 1.5; // Z-axis for cursor tracking
      headBone.rotation.x = 0; // Blended X-axis
    } else {
      // If no animation, we can control both axes directly
      headBone.rotation.z = clampedPitch + 1.5;
      headBone.rotation.x = 0;
    }
  }
  renderer.render(scene, camera);
}

animate();
