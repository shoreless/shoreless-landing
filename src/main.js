import * as THREE from 'three';

// === Mouse tracking ===
const mouse = new THREE.Vector2();
const mouseWorld = new THREE.Vector3();
let isMouseInScene = false;
let isHoveringText = false;

// === Scene Setup ===
const scene = new THREE.Scene();
scene.background = new THREE.Color('#6e4b2a'); // Solid dark brown background

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

// === Mouse Movement ===
window.addEventListener('mousemove', (event) => {
  // Get mouse position relative to canvas
  const rect = renderer.domElement.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Check if mouse is within canvas bounds
  if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
    isMouseInScene = true;
    // Convert to normalized device coordinates
    mouse.x = (x / rect.width) * 2 - 1;
    mouse.y = -(y / rect.height) * 2 + 1;
    
    // Convert to world coordinates on z=0 plane
    const planeZ = 0;
    const vector = new THREE.Vector3(mouse.x, mouse.y, -1).unproject(camera);
    const cameraPosition = camera.position.clone();
    const directionVector = vector.sub(cameraPosition);
    
    // Prevent division by zero
    if (Math.abs(directionVector.z) > 0.0001) {
      const distance = (planeZ - cameraPosition.z) / directionVector.z;
      mouseWorld.copy(cameraPosition).add(directionVector.multiplyScalar(distance));
      
      // Clamp to reasonable bounds
      mouseWorld.x = Math.max(-15, Math.min(15, mouseWorld.x));
      mouseWorld.y = Math.max(-15, Math.min(15, mouseWorld.y));
      mouseWorld.z = 0;
    }
  } else {
    isMouseInScene = false;
  }
});

// === Create Kanji Sprite ===
function createKanjiSprite(kanji, color, index) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  // Clear background
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw kanji
  ctx.fillStyle = color;
  ctx.font = '80px "Noto Sans JP"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(kanji, canvas.width/2, canvas.height/2);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.32 // Lower alpha for kanji sprites
  });
  
  const sprite = new THREE.Sprite(material);
  
  // Random size between 1.2 and 2.8
  const size = 1.2 + Math.random() * 1.6;
  sprite.scale.set(size, size, 1);

  // Calculate initial position using the sprite's index
  const radius = 6; // Reduced radius of distribution
  const angle = (index / 50) * Math.PI * 2; // Distribute evenly in a circle
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const z = (Math.random() - 0.5) * 5; // Small random Z variation

  sprite.position.set(x, y, z);
  
  // Store the base position and movement parameters
  sprite.userData = {
    baseX: x,
    baseY: y,
    baseZ: z,
    phase: Math.random() * Math.PI * 2, // Random starting phase
    speed: 0.2 + Math.random() * 0.3,
    repulsion: 0, // Track repulsion force
    driftSpeed: 0.1 + Math.random() * 0.2, // Random drift speed
    driftPhase: Math.random() * Math.PI * 2, // Random drift phase
    driftRadius: 0.5 + Math.random() * 1.5, // Random drift radius
    baseSize: size // Store the base size for reference
  };

  return sprite;
}

// === Create Sakura Petal ===
function createSakuraPetal(index) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  // Clear background
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw sakura emoji with lighter color
  ctx.fillStyle = 'rgba(255, 192, 203, 0.6)'; // Lighter pink
  ctx.font = '48px "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🌸', canvas.width/2, canvas.height/2);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.25, // Lower alpha for more subtle effect
    depthWrite: false
  });
  
  const sprite = new THREE.Sprite(material);
  
  // Slightly smaller size for emoji
  const size = 1.0 + Math.random() * 0.8;
  sprite.scale.set(size, size, 1);

  // Random starting position across the screen
  const x = (Math.random() - 0.5) * 30;
  const y = (Math.random() - 0.5) * 30;
  const z = -2 + Math.random() * 2;

  sprite.position.set(x, y, z);
  
  // Store movement parameters with more natural leaf-like behavior
  sprite.userData = {
    baseX: x,
    baseY: y,
    baseZ: z,
    fallSpeed: 0.15 + Math.random() * 0.2, // Slower fall
    driftSpeed: 0.2 + Math.random() * 0.3, // More horizontal drift
    driftPhase: Math.random() * Math.PI * 2,
    rotationSpeed: 0.2 + Math.random() * 0.3, // More rotation
    size: size,
    edgeAttraction: Math.random() * 0.02, // Random edge attraction strength
    edgePhase: Math.random() * Math.PI * 2, // Random edge attraction phase
    startTime: 0 // Per-petal time offset for falling
  };

  return sprite;
}

// === Create Shoreless Text ===
function createShorelessText() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  // Clear background
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 25% smaller font size
  const fontSize = 135; // 180 * 0.75

  // Draw huge bright white blurred halo
  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,1)';
  ctx.shadowBlur = 96;
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fontSize}px Montserrat`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('shoreless', canvas.width/2, canvas.height/2);
  ctx.restore();

  // Draw subtle dark shadow for extra contrast
  ctx.save();
  ctx.shadowColor = 'rgba(30,20,10,0.45)';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fontSize}px Montserrat`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('shoreless', canvas.width/2, canvas.height/2);
  ctx.restore();

  // Draw sharp white text on top
  ctx.save();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fontSize}px Montserrat`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('shoreless', canvas.width/2, canvas.height/2);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 1.0
  });
  
  // 25% smaller scale
  const scaleX = 16 * 0.75;
  const scaleY = 4 * 0.75;
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(scaleX, scaleY, 1);
  sprite.position.set(0, 0, 0);
  
  // Store original values for hover effect
  sprite.userData.isShorelessText = true;
  sprite.userData.originalScale = sprite.scale.clone();
  sprite.userData.originalOpacity = material.opacity;
  sprite.userData.targetScale = sprite.scale.clone();
  sprite.userData.targetOpacity = material.opacity;
  sprite.userData.targetGlow = 96;
  sprite.userData.currentGlow = 96;
  
  return sprite;
}

// === Setup Sprites ===
const particles = [];
const sakuraParticles = [];
const kanjiList = ['夢', '考', '思', '引', '心', '光', '本'];
const colors = ['#b48a56', '#a05a2c', '#6e4b2a', '#b0a98f', '#3d2c1e'];

// --- Randomize kanji assignment ---
const totalSprites = 50;
let kanjiPool = [];
while (kanjiPool.length < totalSprites) {
  kanjiPool = kanjiPool.concat(kanjiList);
}
kanjiPool = kanjiPool.slice(0, totalSprites);
// Fisher-Yates shuffle
for (let i = kanjiPool.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [kanjiPool[i], kanjiPool[j]] = [kanjiPool[j], kanjiPool[i]];
}

// Add shoreless text to the center
const shorelessText = createShorelessText();
scene.add(shorelessText);

// Create sakura petals
for (let i = 0; i < 30; i++) {
  const petal = createSakuraPetal(i);
  scene.add(petal);
  sakuraParticles.push(petal);
}

// Create kanji sprites with shuffled kanji
for (let i = 0; i < totalSprites; i++) {
  const kanji = kanjiPool[i];
  const color = colors[Math.floor(Math.random() * colors.length)];
  // Diffuse cloud: random angle and radius
  const angle = Math.random() * Math.PI * 2;
  const radius = 4 + Math.random() * 8; // Radius from 4 to 12
  const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 2; // Add a little extra jitter
  const y = Math.sin(angle) * radius + (Math.random() - 0.5) * 2;
  const z = (Math.random() - 0.5) * 6; // More diffuse in Z
  const sprite = createKanjiSprite(kanji, color, i);
  sprite.position.set(x, y, z);
  // Update base positions for animation
  sprite.userData.baseX = x;
  sprite.userData.baseY = y;
  sprite.userData.baseZ = z;
  scene.add(sprite);
  particles.push(sprite);
}

// === Animation Loop ===
function animate(time) {
  requestAnimationFrame(animate);
  const t = time * 0.001;

  // Smooth transitions for shoreless text
  if (shorelessText) {
    // Smooth scale transition
    shorelessText.scale.lerp(shorelessText.userData.targetScale, 0.05);
    
    // Smooth opacity transition
    shorelessText.material.opacity += (shorelessText.userData.targetOpacity - shorelessText.material.opacity) * 0.05;
    
    // Smooth glow transition
    shorelessText.userData.currentGlow += (shorelessText.userData.targetGlow - shorelessText.userData.currentGlow) * 0.05;
    
    // Update glow effect with correct large font and effects
    const ctx = shorelessText.material.map.image.getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // 25% smaller font size for redraw
    const fontSize = 135;
    // Draw huge bright white blurred halo
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,1)';
    ctx.shadowBlur = shorelessText.userData.currentGlow;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSize}px Montserrat`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('shoreless', ctx.canvas.width/2, ctx.canvas.height/2);
    ctx.restore();
    // Draw subtle dark shadow for extra contrast
    ctx.save();
    ctx.shadowColor = 'rgba(30,20,10,0.45)';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSize}px Montserrat`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('shoreless', ctx.canvas.width/2, ctx.canvas.height/2);
    ctx.restore();
    // Draw sharp white text on top
    ctx.save();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSize}px Montserrat`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('shoreless', ctx.canvas.width/2, ctx.canvas.height/2);
    ctx.restore();
    shorelessText.material.map.needsUpdate = true;
  }

  // Animate sakura petals
  sakuraParticles.forEach((petal, index) => {
    const { baseX, baseY, baseZ, fallSpeed, driftSpeed, driftPhase, rotationSpeed, size, edgeAttraction, edgePhase, startTime } = petal.userData;
    
    // Falling motion with diagonal drift, using per-petal startTime
    let targetY = baseY - (t - startTime) * fallSpeed;
    
    // Enhanced horizontal drift
    const driftX = Math.sin(t * driftSpeed + driftPhase) * 1.2; // Increased amplitude
    let targetX = baseX + driftX;
    
    // Edge attraction effect
    const distanceFromCenter = Math.sqrt(targetX * targetX + targetY * targetY);
    const edgeForce = Math.max(0, distanceFromCenter - 10) * edgeAttraction;
    const edgeAngle = Math.atan2(targetY, targetX) + edgePhase;
    
    targetX += Math.cos(edgeAngle) * edgeForce;
    targetY += Math.sin(edgeAngle) * edgeForce;
    
    // Reset position when petal falls below screen or goes too far
    if (targetY < -15 || Math.abs(targetX) > 20) {
      targetY = 15;
      targetX = (Math.random() - 0.5) * 20; // Start from a narrower range
      petal.userData.baseX = targetX;
      petal.userData.baseY = targetY;
      petal.userData.startTime = t; // Reset the fall timer
      petal.position.x = targetX; // Instantly move to new position
      petal.position.y = targetY;
    }
    
    // Update position with smoother interpolation
    petal.position.x += (targetX - petal.position.x) * 0.03;
    petal.position.y += (targetY - petal.position.y) * 0.03;
    
    // More natural rotation
    petal.rotation.z += rotationSpeed * 0.02 * (1 + Math.sin(t * driftSpeed + driftPhase) * 0.5);
    
    // Subtle size pulsing
    const sizePulse = Math.sin(t * driftSpeed + driftPhase) * 0.1;
    petal.scale.set(
      size * (1 + sizePulse),
      size * (1 + sizePulse),
      1
    );
  });

  // Animate kanji sprites
  particles.forEach((sprite) => {
    const { baseX, baseY, baseZ, phase, speed, driftSpeed, driftPhase, driftRadius, baseSize } = sprite.userData;
    
    // Update base position with drift
    const driftX = Math.cos(t * driftSpeed + driftPhase) * driftRadius;
    const driftY = Math.sin(t * driftSpeed * 0.7 + driftPhase) * driftRadius;
    
    // Base movement with drift
    let targetX = baseX + driftX + Math.sin(t * speed + phase) * 0.5;
    let targetY = baseY + driftY + Math.cos(t * speed + phase) * 0.5;
    let targetZ = baseZ + Math.sin(t * speed * 0.5 + phase) * 0.3;
    
    // Only apply mouse repulsion if mouse is in scene
    if (isMouseInScene) {
      // Calculate distance to mouse
      const dx = sprite.position.x - mouseWorld.x;
      const dy = sprite.position.y - mouseWorld.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Apply repulsion if mouse is close and distance is valid
      const repulsionRadius = 4;
      if (distance < repulsionRadius && !isNaN(distance) && distance > 0.0001) {
        const repulsionStrength = (1 - distance / repulsionRadius) * 2;
        sprite.userData.repulsion = repulsionStrength;
        
        // Add repulsion force to target position
        targetX += (dx / distance) * repulsionStrength;
        targetY += (dy / distance) * repulsionStrength;
      } else {
        sprite.userData.repulsion *= 0.95;
      }
    } else {
      sprite.userData.repulsion *= 0.95;
    }
    
    // Add some randomness to scattered sprites
    if (sprite.userData.repulsion > 0.1) {
      targetX += Math.sin(t * 10 + phase) * 0.1;
      targetY += Math.cos(t * 10 + phase) * 0.1;
    }
    
    // Ensure all values are valid before updating position
    if (!isNaN(targetX) && !isNaN(targetY) && !isNaN(targetZ)) {
      // Smooth movement with variable speed based on repulsion
      const moveSpeed = 0.05 + sprite.userData.repulsion * 0.1;
      sprite.position.x += (targetX - sprite.position.x) * moveSpeed;
      sprite.position.y += (targetY - sprite.position.y) * moveSpeed;
      sprite.position.z += (targetZ - sprite.position.z) * moveSpeed;
    }
    
    // Subtle size pulsing based on movement
    const sizePulse = Math.sin(t * speed + phase) * 0.1;
    sprite.scale.set(
      baseSize * (1 + sizePulse),
      baseSize * (1 + sizePulse),
      1
    );
    
    // Rotate faster when scattered
    sprite.rotation.z += 0.003 + sprite.userData.repulsion * 0.01;
  });

  renderer.render(scene, camera);
}

animate(0);

// Add hover and click handlers for the shoreless text
window.addEventListener('mousemove', (event) => {
  // Get mouse position relative to canvas
  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  // Create raycaster
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
  
  // Check for intersections with the shoreless text
  const intersects = raycaster.intersectObject(shorelessText);
  
  // Update cursor and hover state
  if (intersects.length > 0) {
    if (!isHoveringText) {
      document.body.style.cursor = 'pointer';
      isHoveringText = true;
      
      // Set target values for hover
      shorelessText.userData.targetScale = shorelessText.userData.originalScale.clone().multiplyScalar(1.03);
      shorelessText.userData.targetOpacity = 0.9;
      shorelessText.userData.targetGlow = 15;
    }
  } else {
    if (isHoveringText) {
      document.body.style.cursor = 'default';
      isHoveringText = false;
      
      // Reset target values
      shorelessText.userData.targetScale = shorelessText.userData.originalScale.clone();
      shorelessText.userData.targetOpacity = shorelessText.userData.originalOpacity;
      shorelessText.userData.targetGlow = 0;
    }
  }
});

window.addEventListener('click', (event) => {
  // Get mouse position relative to canvas
  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  // Create raycaster
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
  
  // Check for intersections with the shoreless text
  const intersects = raycaster.intersectObject(shorelessText);
  
  if (intersects.length > 0) {
    window.location.href = 'mailto:shaz@shoreless.org';
  }
});