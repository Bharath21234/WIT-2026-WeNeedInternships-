// ═══════════════════════════════════════════════════════════════
// Life Swap Scene — Immersive 3D environment renderer
// ═══════════════════════════════════════════════════════════════

import * as THREE from 'three';

// ── Environment Presets ──────────────────────────────────────
const ENVIRONMENTS = {
    bedroom: {
        skyTop: new THREE.Color(0x1a1025),
        skyBottom: new THREE.Color(0x2d1b3d),
        ambient: new THREE.Color(0xffd9a0),
        ambientIntensity: 0.4,
        directional: new THREE.Color(0xffe4b5),
        directionalIntensity: 0.6,
        particleColor: 0xffd700,
        particleCount: 60,
        groundColor: 0x2a1f35,
        fogColor: 0x1a1025,
        fogDensity: 0.03,
    },
    kitchen: {
        skyTop: new THREE.Color(0x1e2a3a),
        skyBottom: new THREE.Color(0x3a2f28),
        ambient: new THREE.Color(0xffecd2),
        ambientIntensity: 0.5,
        directional: new THREE.Color(0xffd993),
        directionalIntensity: 0.7,
        particleColor: 0xffcc66,
        particleCount: 40,
        groundColor: 0x3a3028,
        fogColor: 0x2a2520,
        fogDensity: 0.02,
    },
    city: {
        skyTop: new THREE.Color(0x0a0a20),
        skyBottom: new THREE.Color(0x1a1a40),
        ambient: new THREE.Color(0x8888ff),
        ambientIntensity: 0.3,
        directional: new THREE.Color(0xffaa55),
        directionalIntensity: 0.5,
        particleColor: 0x44aaff,
        particleCount: 120,
        groundColor: 0x151525,
        fogColor: 0x0a0a20,
        fogDensity: 0.015,
    },
    gym: {
        skyTop: new THREE.Color(0x0d1117),
        skyBottom: new THREE.Color(0x1a2332),
        ambient: new THREE.Color(0xccddff),
        ambientIntensity: 0.6,
        directional: new THREE.Color(0xffffff),
        directionalIntensity: 0.8,
        particleColor: 0x55ddff,
        particleCount: 30,
        groundColor: 0x1a1a2e,
        fogColor: 0x0d1117,
        fogDensity: 0.01,
    },
    office: {
        skyTop: new THREE.Color(0x0f1923),
        skyBottom: new THREE.Color(0x1a2940),
        ambient: new THREE.Color(0xb8d4ff),
        ambientIntensity: 0.5,
        directional: new THREE.Color(0xe8f0ff),
        directionalIntensity: 0.7,
        particleColor: 0x6699ff,
        particleCount: 50,
        groundColor: 0x151d2e,
        fogColor: 0x0f1923,
        fogDensity: 0.02,
    },
    nature: {
        skyTop: new THREE.Color(0x1a3a2a),
        skyBottom: new THREE.Color(0x2a5a3a),
        ambient: new THREE.Color(0x88ffaa),
        ambientIntensity: 0.5,
        directional: new THREE.Color(0xffe599),
        directionalIntensity: 0.8,
        particleColor: 0x88ff88,
        particleCount: 80,
        groundColor: 0x1a3020,
        fogColor: 0x1a3a2a,
        fogDensity: 0.025,
    },
    cafe: {
        skyTop: new THREE.Color(0x1f1510),
        skyBottom: new THREE.Color(0x3a2a1a),
        ambient: new THREE.Color(0xffd9a0),
        ambientIntensity: 0.5,
        directional: new THREE.Color(0xffcc88),
        directionalIntensity: 0.6,
        particleColor: 0xffaa44,
        particleCount: 45,
        groundColor: 0x2a2015,
        fogColor: 0x1f1510,
        fogDensity: 0.025,
    },
    night: {
        skyTop: new THREE.Color(0x020210),
        skyBottom: new THREE.Color(0x0a0a25),
        ambient: new THREE.Color(0x4444aa),
        ambientIntensity: 0.2,
        directional: new THREE.Color(0x8888cc),
        directionalIntensity: 0.3,
        particleColor: 0xffffff,
        particleCount: 200,
        groundColor: 0x050515,
        fogColor: 0x020210,
        fogDensity: 0.01,
    },
    transport: {
        skyTop: new THREE.Color(0x101820),
        skyBottom: new THREE.Color(0x203040),
        ambient: new THREE.Color(0x99bbdd),
        ambientIntensity: 0.4,
        directional: new THREE.Color(0xddddff),
        directionalIntensity: 0.5,
        particleColor: 0x66aaee,
        particleCount: 70,
        groundColor: 0x151d28,
        fogColor: 0x101820,
        fogDensity: 0.02,
    },
    beach: {
        skyTop: new THREE.Color(0x1a3050),
        skyBottom: new THREE.Color(0x3a6080),
        ambient: new THREE.Color(0xaaddff),
        ambientIntensity: 0.6,
        directional: new THREE.Color(0xfff0d0),
        directionalIntensity: 0.9,
        particleColor: 0x88ddff,
        particleCount: 90,
        groundColor: 0x2a4050,
        fogColor: 0x1a3050,
        fogDensity: 0.015,
    }
};

// ── MOOD COLORS (for accent glow) ────────────────────────────
const MOOD_COLORS = {
    peaceful: 0x6EE7B7,
    energetic: 0xFF6B6B,
    focused: 0x6B9BD1,
    social: 0xFFD93D,
    reflective: 0xA78BFA,
    adventurous: 0xFF8C42,
    cozy: 0xFFA07A,
};

// ── State ────────────────────────────────────────────────────
let _renderer, _scene, _camera, _animFrameId;
let _particles, _particleVelocities;
let _ambientLight, _dirLight, _groundMesh;
let _centralOrb, _orbGlow;
let _currentEnv = null;
let _transitionProgress = 0;
let _isTransitioning = false;
let _targetEnv = null;
let _clock = new THREE.Clock();

/**
 * Initialize the 3D scene on the given canvas element.
 */
export function initLifeSwapScene(canvas) {
    // Renderer
    _renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
    });
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    _renderer.toneMapping = THREE.ACESFilmicToneMapping;
    _renderer.toneMappingExposure = 1.2;

    // Scene
    _scene = new THREE.Scene();
    _scene.fog = new THREE.FogExp2(0x0a0a20, 0.02);

    // Camera
    _camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    _camera.position.set(0, 3, 8);
    _camera.lookAt(0, 1, 0);

    // Lights
    _ambientLight = new THREE.AmbientLight(0x8888ff, 0.3);
    _scene.add(_ambientLight);

    _dirLight = new THREE.DirectionalLight(0xffaa55, 0.5);
    _dirLight.position.set(5, 10, 5);
    _scene.add(_dirLight);

    // Ground plane — infinite-looking reflective floor
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
        color: 0x151525,
        roughness: 0.8,
        metalness: 0.2,
        transparent: true,
        opacity: 0.6,
    });
    _groundMesh = new THREE.Mesh(groundGeo, groundMat);
    _groundMesh.rotation.x = -Math.PI / 2;
    _groundMesh.position.y = -0.5;
    _scene.add(_groundMesh);

    // Central orb — the focal point of each scene
    const orbGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const orbMat = new THREE.MeshStandardMaterial({
        color: 0xA78BFA,
        emissive: 0xA78BFA,
        emissiveIntensity: 0.6,
        roughness: 0.1,
        metalness: 0.8,
        transparent: true,
        opacity: 0.8,
    });
    _centralOrb = new THREE.Mesh(orbGeo, orbMat);
    _centralOrb.position.set(0, 1.5, 0);
    _scene.add(_centralOrb);

    // Orb glow (point light)
    _orbGlow = new THREE.PointLight(0xA78BFA, 2, 15);
    _orbGlow.position.copy(_centralOrb.position);
    _scene.add(_orbGlow);

    // Create initial particles
    createParticles(100, 0xffffff);

    // Resize handler
    window.addEventListener('resize', onResize);

    // Start render loop
    _clock.start();
    animate();

    console.log('[LifeSwapScene] Initialized.');
}

/**
 * Transition to a new environment.
 */
export function setEnvironment(envName, mood) {
    const env = ENVIRONMENTS[envName] || ENVIRONMENTS.city;
    _targetEnv = { ...env };

    // Override orb color with mood
    const moodColor = MOOD_COLORS[mood] || MOOD_COLORS.peaceful;
    _targetEnv.moodColor = moodColor;

    _isTransitioning = true;
    _transitionProgress = 0;

    // Recreate particles for new environment
    setTimeout(() => {
        removeParticles();
        createParticles(env.particleCount, env.particleColor);
    }, 500);

    console.log(`[LifeSwapScene] Transitioning to "${envName}" (${mood})`);
}

/**
 * Destroy the scene and free resources.
 */
export function destroyLifeSwapScene() {
    if (_animFrameId) cancelAnimationFrame(_animFrameId);
    window.removeEventListener('resize', onResize);

    if (_renderer) {
        _renderer.dispose();
        _renderer = null;
    }

    _scene = null;
    _camera = null;
    _particles = null;
    _particleVelocities = null;
    _currentEnv = null;
    _targetEnv = null;

    console.log('[LifeSwapScene] Destroyed.');
}

// ── Internal ─────────────────────────────────────────────────

function createParticles(count, color) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    _particleVelocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 40;
        positions[i3 + 1] = Math.random() * 20;
        positions[i3 + 2] = (Math.random() - 0.5) * 40;

        _particleVelocities[i3] = (Math.random() - 0.5) * 0.02;
        _particleVelocities[i3 + 1] = (Math.random() - 0.5) * 0.015;
        _particleVelocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
        color,
        size: 0.08,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
    });

    _particles = new THREE.Points(geo, mat);
    _scene.add(_particles);
}

function removeParticles() {
    if (_particles && _scene) {
        _scene.remove(_particles);
        _particles.geometry.dispose();
        _particles.material.dispose();
        _particles = null;
    }
}

function animate() {
    _animFrameId = requestAnimationFrame(animate);
    if (!_renderer || !_scene || !_camera) return;

    const t = _clock.getElapsedTime();
    const delta = _clock.getDelta();

    // ── Transition interpolation ──────────────────────────
    if (_isTransitioning && _targetEnv) {
        _transitionProgress += delta * 0.8; // ~1.25 second transition
        const p = Math.min(_transitionProgress, 1);
        const ease = p * p * (3 - 2 * p); // smoothstep

        // Sky/fog
        _scene.fog.color.lerp(_targetEnv.fogColor, ease);
        _scene.fog.density = THREE.MathUtils.lerp(
            _scene.fog.density,
            _targetEnv.fogDensity,
            ease
        );

        // Lights
        _ambientLight.color.lerp(_targetEnv.ambient, ease);
        _ambientLight.intensity = THREE.MathUtils.lerp(
            _ambientLight.intensity,
            _targetEnv.ambientIntensity,
            ease
        );
        _dirLight.color.lerp(_targetEnv.directional, ease);
        _dirLight.intensity = THREE.MathUtils.lerp(
            _dirLight.intensity,
            _targetEnv.directionalIntensity,
            ease
        );

        // Ground
        _groundMesh.material.color.lerp(new THREE.Color(_targetEnv.groundColor), ease);

        // Orb mood color
        if (_targetEnv.moodColor) {
            const mc = new THREE.Color(_targetEnv.moodColor);
            _centralOrb.material.color.lerp(mc, ease);
            _centralOrb.material.emissive.lerp(mc, ease);
            _orbGlow.color.lerp(mc, ease);
        }

        // Background
        _renderer.setClearColor(
            new THREE.Color().copy(_scene.fog.color),
            1
        );

        if (p >= 1) {
            _isTransitioning = false;
            _currentEnv = _targetEnv;
        }
    }

    // ── Animate orb ──────────────────────────────────────
    if (_centralOrb) {
        _centralOrb.position.y = 1.5 + Math.sin(t * 0.8) * 0.3;
        _centralOrb.rotation.y += 0.005;
        _centralOrb.material.emissiveIntensity = 0.4 + Math.sin(t * 1.5) * 0.2;
        _orbGlow.intensity = 1.5 + Math.sin(t * 1.5) * 0.5;
        _orbGlow.position.copy(_centralOrb.position);
    }

    // ── Animate particles ────────────────────────────────
    if (_particles) {
        const positions = _particles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += _particleVelocities[i];
            positions[i + 1] += _particleVelocities[i + 1];
            positions[i + 2] += _particleVelocities[i + 2];

            // Wrap around boundaries
            if (positions[i] > 20) positions[i] = -20;
            if (positions[i] < -20) positions[i] = 20;
            if (positions[i + 1] > 20) positions[i + 1] = 0;
            if (positions[i + 1] < 0) positions[i + 1] = 20;
            if (positions[i + 2] > 20) positions[i + 2] = -20;
            if (positions[i + 2] < -20) positions[i + 2] = 20;
        }
        _particles.geometry.attributes.position.needsUpdate = true;

        // Gentle rotation
        _particles.rotation.y += 0.0003;
    }

    // ── Gentle camera sway ───────────────────────────────
    _camera.position.x = Math.sin(t * 0.15) * 0.5;
    _camera.position.y = 3 + Math.sin(t * 0.2) * 0.2;
    _camera.lookAt(0, 1.5, 0);

    _renderer.render(_scene, _camera);
}

function onResize() {
    if (!_camera || !_renderer) return;
    _camera.aspect = window.innerWidth / window.innerHeight;
    _camera.updateProjectionMatrix();
    _renderer.setSize(window.innerWidth, window.innerHeight);
}
