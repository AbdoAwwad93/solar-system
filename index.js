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

const hemiLight = new THREE.HemisphereLight(0x0099ff, 0xaa5500);
scene.add(hemiLight);

const planetData = [
  { name: 'Mercury', radius: 1, distance: 20, orbitalPeriod: 88, rotationPeriod: 58.65, texture: './textures/Planets/8k_mercury.jpg', color: 0xaaaaaa },
  { name: 'Venus', radius: 1.5, distance: 30, orbitalPeriod: 224.7, rotationPeriod: -243, texture: './textures/Planets/8k_venus_surface.jpg', color: 0xffd700 },
  { name: 'Earth', radius: 2, distance: 40, orbitalPeriod: 365.25, rotationPeriod: 1, texture: './textures/Earth/8k_earth_daymap.jpg', color: 0x00ff00 },
  { name: 'Mars', radius: 1.7, distance: 55, orbitalPeriod: 687, rotationPeriod: 1.03, texture: './textures/Planets/8k_mars.jpg', color: 0xff4500 },
  { name: 'Jupiter', radius: 11.2, distance: 100, orbitalPeriod: 4333, rotationPeriod: 0.41, texture: './textures/Planets/8k_jupiter.jpg', color: 0xffa500 },
  { name: 'Saturn', radius: 6, distance: 138, orbitalPeriod: 10759, rotationPeriod: 0.44, texture: './textures/Planets/8k_saturn.jpg', color: 0xffd700, hasRing: true },
  { name: 'Uranus', radius: 4, distance: 176, orbitalPeriod: 30687, rotationPeriod: -0.72, texture: './textures/Planets/2k_uranus.jpg', color: 0x00ffff },
  { name: 'Neptune', radius: 3.88, distance: 200, orbitalPeriod: 60190, rotationPeriod: 0.67, texture: './textures/Planets/2k_neptune.jpg', color: 0x0000ff },
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

  const planetLight = new THREE.HemisphereLight(data.color, 0x000000, 0.9); 
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
    name: data.name,
    distance: data.distance,
    orbitalPeriod: data.orbitalPeriod,
    rotationPeriod: data.rotationPeriod,
    originalPosition: new THREE.Vector3(data.distance, 0, 0),
    originalAngle: Math.random() * Math.PI * 2,
    angle: Math.random() * Math.PI * 2,
    viewDistance: data.radius * 5 // Fixed viewing distance for each planet
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

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let selectedPlanet = null;
let travelProgress = 0;
const travelSpeed = 0.09;
let focusTimer = null;
let isFocused = false;

const infoDiv = document.createElement('div');
infoDiv.style.position = 'absolute';
infoDiv.style.bottom = '10px';
infoDiv.style.left = '10px';
infoDiv.style.color = 'white';
infoDiv.style.fontSize = '18px';
infoDiv.style.padding = '10px';
infoDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
infoDiv.style.display = 'none';
document.body.appendChild(infoDiv);

let cameraStartPos = new THREE.Vector3(); // Variable to store camera start position

function onMouseClick(event) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(planets);
  if (intersects.length > 0) {
    selectedPlanet = intersects[0].object;
    travelProgress = 0;
    showPlanetInfo(selectedPlanet);
    startFocus();
  }
}

function showPlanetInfo(planet) {
  infoDiv.style.display = 'block';
  infoDiv.innerHTML = `
    <strong>${planet.userData.name}</strong><br>
    Distance from Sun: ${planet.userData.distance} million km<br>
    Orbital Period: ${planet.userData.orbitalPeriod} days<br>
    Rotation Period: ${planet.userData.rotationPeriod} days
  `;
}

let cameraMoving = false;
let cameraMovementProgress = 0;
const cameraMovementDuration = 2; // Duration in seconds

function startFocus() {
  isFocused = true;
  cameraMoving = true;
  cameraMovementProgress = 0;

  // Disable controls during focus
  controls.enabled = false;

  // Store the camera's current position
  cameraStartPos.copy(camera.position);

  // Don't hide other planets immediately
}

function createSpotlight(color, intensity) {
  const light = new THREE.SpotLight(color, intensity);
  light.castShadow = true;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  return light;
}

let focusedPlanetSpotlight = null;
let focusedPlanetLight = null;

function moveCameraTowardsPlanet(deltaTime) {
  if (cameraMoving && selectedPlanet) {
    cameraMovementProgress += deltaTime / cameraMovementDuration;

    if (cameraMovementProgress >= 1) {
      cameraMoving = false;
      cameraMovementProgress = 1;

      // Hide other planets and the sun as before
      scene.children.forEach(child => {
        if (child !== selectedPlanet && child !== starSphere && !(child instanceof THREE.Light)) {
          child.visible = false;
        }
      });

      // Hide the sun's mesh (keep light active)
      sunMesh.visible = false;

      // Spotlight setup remains the same
      if (!focusedPlanetSpotlight) {
        focusedPlanetSpotlight = createSpotlight(0xffffff, 2);
        scene.add(focusedPlanetSpotlight);
      }
      focusedPlanetSpotlight.position.copy(camera.position);
      focusedPlanetSpotlight.target = selectedPlanet;

      if (!focusedPlanetLight) {
        focusedPlanetLight = createPlanetLight(0xffffff, 2);
        selectedPlanet.add(focusedPlanetLight);
      }

      selectedPlanet.userData.isStopped = true;
      enhancePlanetMaterial(selectedPlanet);

      focusTimer = setTimeout(endFocus, 5000); // End focus after 30 seconds
    }

    // Start from the camera's current position instead of a fixed position
    const endPos = new THREE.Vector3(
      selectedPlanet.position.x + selectedPlanet.userData.viewDistance,
      selectedPlanet.position.y + selectedPlanet.userData.viewDistance * 0.5,
      selectedPlanet.position.z + selectedPlanet.userData.viewDistance
    );

    // Interpolate between the current camera position and the target position
    camera.position.lerpVectors(cameraStartPos, endPos, cameraMovementProgress);
    controls.target.lerp(selectedPlanet.position, cameraMovementProgress);
  }
}

// Call this when you want to reset to the default view
function resetView() {
  camera.position.set(0, 50, 150);
  controls.target.set(0, 0, 0);

  // Make all planets and the sun visible again
  scene.children.forEach(child => {
    if (child instanceof THREE.Mesh) {
      child.visible = true;
    }
  });

  sunMesh.visible = true;

  // Re-enable controls
  controls.enabled = true;

  // Reset focus state
  isFocused = false;
  if (focusTimer) {
    clearTimeout(focusTimer);
  }

  infoDiv.style.display = 'none';
}

function createPlanetLight(color, intensity) {
  const planetLight = new THREE.PointLight(color, intensity, 50);
  return planetLight;
}

function enhancePlanetMaterial(planet) {
  if (planet && planet.material) {
    planet.material.emissive = new THREE.Color(0x222222);
    planet.material.emissiveIntensity = 1;
  }
}

function endFocus() {
  if (!isFocused) return;

  resetView();
}

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});

window.addEventListener('click', onMouseClick);

const clock = new THREE.Clock();

function animate() {
  const deltaTime = clock.getDelta();
  
  // Planet orbit and rotation logic
  planets.forEach(planet => {
    // Update the orbit movement only if the planet is not focused
    if (!planet.userData.isStopped) {
      planet.userData.angle += deltaTime / planet.userData.orbitalPeriod * Math.PI * 2;
      planet.position.x = planet.userData.distance * Math.cos(planet.userData.angle);
      planet.position.z = planet.userData.distance * Math.sin(planet.userData.angle);
    }
  
    
    planet.rotation.y += (deltaTime / planet.userData.rotationPeriod) * Math.PI * 2 * 0.01; 
  });

  moveCameraTowardsPlanet(deltaTime);

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
