import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const container = document.getElementById("hero-container");
const loader = new GLTFLoader();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// light
const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(-1, 2, 4);
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 1));

// load model
let fish;
// loader.load(
//   "assets/Fish-Bone.glb",
//   function (gltf) {
//     fish = gltf.scene;
//     scene.add(fish);
//   },
//   undefined,
//   function (error) {
//     console.error("Error loading model:", error);
//   }
// );

loader.load("assets/Fish-Bone.glb", (gltf) => {
  fish = gltf.scene;
  scene.add(fish);
  console.log(fish); // inspect in devtools
  fish.scale.set(0.5, 0.5, 0.5); // adjust if needed
  fish.position.set(0, 0, 0);
});

camera.position.z = 20;

// animation loop
function animate() {
  requestAnimationFrame(animate);
  if (fish) fish.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();
