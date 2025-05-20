import * as THREE from 'three';

console.log('Starting Three.js initialization...');

// === Scene Setup ===
const scene = new THREE.Scene();
// Warm parchment background inspired by the reference image
scene.background = new THREE.Color('#e6d3a3');

// Simple lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 100);
camera.position.z = 20;
camera.updateProjectionMatrix();

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor('#e6d3a3', 1);
document.body.appendChild(renderer.domElement);

// === Resize Handling ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === Create Text Sprite ===
const createTextSprite = (text) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 1024;
  canvas.height = 256;
  
  context.fillStyle = 'rgba(0, 0, 0, 0)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  context.font = '200 120px "Montserrat"';
  // Warm brown for text
  context.fillStyle = '#6e4b2a';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  context.shadowColor = 'rgba(160, 90, 44, 0.25)'; // Muted red shadow
  context.shadowBlur = 16;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.98
  });
  
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(15, 3.75, 1);
  return sprite;
};

const textSprite = createTextSprite('Shoreless');
scene.add(textSprite);

// === Create Particles ===
const particles = [];
const particleCount = 100;

// Palette inspired by the reference image
const ukiyoPalette = [
  '#b48a56', // Ochre
  '#a05a2c', // Muted red
  '#6e4b2a', // Warm brown
  '#b0a98f', // Soft gray
  '#3d2c1e', // Deep brown
  '#d9a066', // Muted orange
  '#e6d3a3'  // Parchment
];

// Function to create a kanji sprite
const createKanjiSprite = (char, color) => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'bold 48px "Noto Sans JP", "Hiragino Mincho Pro", "Yu Mincho", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(char, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.5
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.setScalar(0.6 + Math.random() * 0.3);
  return sprite;
};

const kanjiList = ['夢', '考', '思', '引', '心', '光', '本']; // Add more if desired

for (let i = 0; i < particleCount; i++) {
  const color = ukiyoPalette[Math.floor(Math.random() * ukiyoPalette.length)];
  const char = kanjiList[Math.floor(Math.random() * kanjiList.length)];
  const sprite = createKanjiSprite(char, color);
  sprite.position.set(
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20
  );
  sprite.userData = {
    initialX: sprite.position.x,
    initialY: sprite.position.y,
    initialZ: sprite.position.z,
    speed: 0.5 + Math.random() * 0.5
  };
  scene.add(sprite);
  particles.push(sprite);
}

// === Animation Loop ===
function animate(time) {
  requestAnimationFrame(animate);
  const t = time * 0.001;

  particles.forEach((particle, i) => {
    const { initialX, initialY, initialZ, speed } = particle.userData;
    
    particle.position.x = initialX + Math.sin(t * speed) * 2;
    particle.position.y = initialY + Math.cos(t * speed) * 2;
    particle.position.z = initialZ + Math.sin(t * speed * 0.5) * 2;
    
    particle.rotation.z += 0.01;
  });

  textSprite.position.y = Math.sin(t * 0.5) * 0.1;

  renderer.render(scene, camera);
}

console.log('Starting animation loop...');
animate();