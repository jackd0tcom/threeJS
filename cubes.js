import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js"; // 👈 import

const container = document.getElementById("container");

// Scene + Camera
const scene = new THREE.Scene();
scene.background = new THREE.Color("skyblue");

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);
camera.position.set(0, 0, 3); // pull back a little

// Renderer
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Controls 👇
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // smooth motion
controls.dampingFactor = 0.05;
controls.enablePan = false; // optional, disable panning
controls.target.set(0, 0, 0); // look at center
controls.update();

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 1));
const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(10, 10, 10);
scene.add(dirLight);

// Load Fish Model
const loader = new GLTFLoader();
let fish;
let mixer;

loader.load(
  "assets/blue-fish.glb",
  (gltf) => {
    fish = gltf.scene;

    fish.traverse((child) => {
      if (child.isMesh) {
        child.material.transparent = false;
        child.material.opacity = 1;
      }
    });

    // Center model
    const box = new THREE.Box3().setFromObject(fish);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());

    fish.position.sub(center); // move fish so it's centered at origin
    scene.add(fish);

    if (gltf.animations && gltf.animations.length) {
      mixer = new THREE.AnimationMixer(fish);

      const action = mixer.clipAction(gltf.animations[0]);
      action.play();
    }

    fish.rotation.y = -1.5;

    // Adjust camera distance
    camera.position.z = size * 1.5;
    controls.update();
  },
  undefined,
  (error) => console.error("Error loading model:", error)
);

// Cube test
// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

// Resize handler
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

// Animate
function animate() {
  requestAnimationFrame(animate);

  // if (fish) fish.rotation.x += 0.005;

  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);

  controls.update(); // 👈 make orbit controls work
  renderer.render(scene, camera);
}
animate();
