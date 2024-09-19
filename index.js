import * as THREE from 'three';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';

const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const fov = 75;
const aspect = w / h;
const near = 0.1;
const far = 2000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(0, 50, 150);
const scene = new THREE.Scene();
const loader = new THREE.TextureLoader();
const starTexture = loader.load('./textures/MOON/8k_stars_milky_way.jpg');
const starGeo = new THREE.SphereGeometry(1000, 64, 64);
const starMat = new THREE.MeshBasicMaterial({
  map: starTexture,
  side: THREE.BackSide,
});
const starSphere = new THREE.Mesh(starGeo, starMat);
scene.add(starSphere);

const sunGeo = new THREE.SphereGeometry(5, 64, 64);
const sunMat = new THREE.MeshBasicMaterial({
  map: loader.load('./textures/Planets/8k_sun.jpg'),
  emissive: 0xFFFF00,
  emissiveIntensity: 1,
});
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
scene.add(sunMesh);


const sunlight = new THREE.PointLight(0xffffff, 10, 1000); 
sunlight.position.set(0, 0, 0);
sunlight.castShadow = true;
sunlight.shadow.mapSize.width = 2048;
sunlight.shadow.mapSize.height = 2048;
scene.add(sunlight);


const ambientLight = new THREE.AmbientLight(0x404040, 0.5); 
scene.add(ambientLight);


const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
scene.add(hemisphereLight);

const planetData = [
  { name: 'Mercury', radius: 1, distance: 20, orbitalPeriod: 88, rotationPeriod: 58.65, texture: './textures/planets/8k_mercury.jpg', color: 0xaaaaaa },
  { name: 'Venus', radius: 1.5, distance: 30, orbitalPeriod: 224.7, rotationPeriod: -243, texture: './textures/planets/8k_venus_surface.jpg', color: 0xffd700 },
  { name: 'Earth', radius: 2, distance: 40, orbitalPeriod: 365.25, rotationPeriod: 1, texture: './textures/Earth/8k_earth_daymap.jpg', color: 0x00ff00 },
  { name: 'Mars', radius: 1.7, distance: 55, orbitalPeriod: 687, rotationPeriod: 1.03, texture: './textures/planets/8k_mars.jpg', color: 0xff4500 },
  { name: 'Jupiter', radius: 11.2, distance: 100, orbitalPeriod: 4333, rotationPeriod: 0.41, texture: './textures/planets/8k_jupiter.jpg', color: 0xffa500 },
  { name: 'Saturn', radius: 6, distance: 138, orbitalPeriod: 10759, rotationPeriod: 0.44, texture: './textures/planets/8k_saturn.jpg', color: 0xffd700, hasRing: true },
  { name: 'Uranus', radius: 4, distance: 176, orbitalPeriod: 30687, rotationPeriod: -0.72, texture: './textures/planets/2k_uranus.jpg', color: 0x00ffff },
  { name: 'Neptune', radius: 3.88, distance: 200, orbitalPeriod: 60190, rotationPeriod: 0.67, texture: './textures/planets/2k_neptune.jpg', color: 0x0000ff },
];


const planets = [];
planetData.forEach(data => {
  const planetGeo = new THREE.SphereGeometry(data.radius, 64, 64);
  const planetMat = new THREE.MeshStandardMaterial({
    map: loader.load(data.texture),
   
  });
  const planetMesh = new THREE.Mesh(planetGeo, planetMat);
  planetMesh.position.x = data.distance;
  planetMesh.castShadow = true;
  planetMesh.receiveShadow = true;
  const orbitGeometry = new THREE.RingGeometry(data.distance - 0.1, data.distance + 0.1, 64);
  const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
  const orbitMesh = new THREE.Mesh(orbitGeometry, orbitMaterial);
  orbitMesh.rotation.x = Math.PI / 2;
  scene.add(orbitMesh);


  const planetLight = new THREE.HemisphereLight(data.color, 0x000000, 0.5); 
  planetLight.position.set(0, data.radius, 0);
  planetMesh.add(planetLight);

  if (data.hasRing) {
    const saturnRingTexture = loader.load('./textures/Planets/8k_saturn_ring_alpha.png'); 
    const ringGeometry = new THREE.RingGeometry(data.radius * 1.4, data.radius * 2, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      map: saturnRingTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI / 2;
    planetMesh.add(ringMesh);
  }

  planetMesh.userData = {
    distance: data.distance,
    orbitalPeriod: data.orbitalPeriod,
    rotationPeriod: data.rotationPeriod,
  };

  planets.push(planetMesh);
  scene.add(planetMesh);
});


const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 10;
controls.maxDistance = 500;


const earthYear = 365.25; 
const simulationSpeed = 1; 

function animate(currentTime) {
  requestAnimationFrame(animate);

  if (animate.lastTime === undefined) {
    animate.lastTime = currentTime;
  }

  const deltaTime = (currentTime - animate.lastTime) / 1000; // Convert to seconds
  animate.lastTime = currentTime;


  planets.forEach((planet, index) => {

    const rotationSpeed = (2 * Math.PI) / (planet.userData.rotationPeriod * 24); // Convert days to hours
    planet.rotateY(rotationSpeed * deltaTime * simulationSpeed);


    const orbitalSpeed = (2 * Math.PI) / planet.userData.orbitalPeriod;
    if (planet.userData.angle === undefined) {
      planet.userData.angle = 0; // Initialize angle if not set
    }
    planet.userData.angle += orbitalSpeed * deltaTime * simulationSpeed;
    const newX = planet.userData.distance * Math.cos(planet.userData.angle);
    const newZ = planet.userData.distance * Math.sin(planet.userData.angle);
    planet.position.set(newX, 0, newZ);


    if (animate.frameCount % 100 === 0) {
      console.log(`Planet ${index}: x=${planet.position.x.toFixed(2)}, z=${planet.position.z.toFixed(2)}`);
    }
  });


  controls.update(deltaTime);

  renderer.render(scene, camera);


  animate.frameCount = (animate.frameCount || 0) + 1;
}


planets.forEach(planet => {
  planet.userData.angle = Math.random() * Math.PI * 2; // Random starting position
});

animate(0);

// Handle window resize
function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize);
