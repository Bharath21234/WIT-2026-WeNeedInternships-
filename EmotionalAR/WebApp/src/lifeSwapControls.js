// ═══════════════════════════════════════════════════════════════
// Life Swap Controls — First-person camera + WASD movement
// ═══════════════════════════════════════════════════════════════

import * as THREE from 'three';

const MOVE_SPEED = 4.0;       // units per second
const LOOK_SPEED = 0.002;     // radians per pixel
const EYE_HEIGHT = 1.6;
const DAMPING = 0.88;         // velocity damping

// ── State ────────────────────────────────────────────────────
let _camera = null;
let _canvas = null;
let _enabled = false;
let _bounds = null;

// Movement
const _velocity = new THREE.Vector3();
const _direction = new THREE.Vector3();
const _keys = { forward: false, backward: false, left: false, right: false };

// Mouse look
let _euler = new THREE.Euler(0, 0, 0, 'YXZ');
let _isPointerLocked = false;

// ── Public API ───────────────────────────────────────────────

/**
 * Initialize first-person controls on the given camera and canvas.
 */
export function initControls(camera, canvas) {
    _camera = camera;
    _canvas = canvas;
    _enabled = true;

    // Set initial camera position + look
    _camera.position.set(0, EYE_HEIGHT, 3);
    _euler.set(0, 0, 0);
    _camera.rotation.copy(_euler);

    // Keyboard
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Pointer lock for mouse look
    _canvas.addEventListener('click', requestPointerLock);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('mousemove', onMouseMove);

    console.log('[Controls] Initialized.');
}

/**
 * Set movement bounds (room boundaries).
 */
export function setBounds(bounds) {
    _bounds = bounds;
}

/**
 * Reset camera to spawn position for a new room.
 */
export function resetPosition() {
    if (!_camera) return;
    _camera.position.set(0, EYE_HEIGHT, 3);
    _euler.set(0, 0, 0);
    _camera.rotation.copy(_euler);
    _velocity.set(0, 0, 0);
}

/**
 * Update controls each frame. Call from render loop.
 * @param {number} delta — seconds since last frame
 */
export function updateControls(delta) {
    if (!_enabled || !_camera) return;

    // Build direction from keys
    _direction.set(0, 0, 0);
    if (_keys.forward) _direction.z -= 1;
    if (_keys.backward) _direction.z += 1;
    if (_keys.left) _direction.x -= 1;
    if (_keys.right) _direction.x += 1;

    if (_direction.lengthSq() > 0) {
        _direction.normalize();

        // Transform direction by camera yaw (only Y rotation)
        const yaw = _euler.y;
        const dx = _direction.x * Math.cos(yaw) + _direction.z * Math.sin(yaw);
        const dz = -_direction.x * Math.sin(yaw) + _direction.z * Math.cos(yaw);

        _velocity.x += dx * MOVE_SPEED * delta;
        _velocity.z += dz * MOVE_SPEED * delta;
    }

    // Apply damping
    _velocity.x *= DAMPING;
    _velocity.z *= DAMPING;

    // Move camera
    _camera.position.x += _velocity.x;
    _camera.position.z += _velocity.z;
    _camera.position.y = EYE_HEIGHT;

    // Clamp to bounds
    if (_bounds) {
        _camera.position.x = THREE.MathUtils.clamp(_camera.position.x, _bounds.minX + 0.5, _bounds.maxX - 0.5);
        _camera.position.z = THREE.MathUtils.clamp(_camera.position.z, _bounds.minZ + 0.5, _bounds.maxZ - 0.5);
    }
}

/**
 * Enable/disable controls (e.g. pause during transitions).
 */
export function setControlsEnabled(enabled) {
    _enabled = enabled;
    if (!enabled) {
        _keys.forward = _keys.backward = _keys.left = _keys.right = false;
        _velocity.set(0, 0, 0);
    }
}

/**
 * Destroy controls and remove listeners.
 */
export function destroyControls() {
    _enabled = false;
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('pointerlockchange', onPointerLockChange);
    document.removeEventListener('mousemove', onMouseMove); tion

    if (_canvas) {
        _canvas.removeEventListener('click', requestPointerLock);
    }

    if (document.pointerLockElement) {
        document.exitPointerLock();
    }

    _camera = null;
    _canvas = null;
    _bounds = null;
    console.log('[Controls] Destroyed.');
}

/**
 * Get whether pointer is currently locked (mouse look active).
 */
export function isPointerLocked() {
    return _isPointerLocked;
}

// ── Internal ─────────────────────────────────────────────────

function requestPointerLock() {
    if (_canvas && _enabled) {
        _canvas.requestPointerLock();
    }
}

function onPointerLockChange() {
    _isPointerLocked = document.pointerLockElement === _canvas;
}

function onMouseMove(e) {
    if (!_isPointerLocked || !_enabled || !_camera) return;

    _euler.y -= e.movementX * LOOK_SPEED;
    _euler.x -= e.movementY * LOOK_SPEED;

    // Clamp pitch
    _euler.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, _euler.x));

    _camera.rotation.copy(_euler);
}

function onKeyDown(e) {
    if (!_enabled) return;
    switch (e.code) {
        case 'KeyW': case 'ArrowUp': _keys.forward = true; break;
        case 'KeyS': case 'ArrowDown': _keys.backward = true; break;
        case 'KeyA': case 'ArrowLeft': _keys.left = true; break;
        case 'KeyD': case 'ArrowRight': _keys.right = true; break;
    }
}

function onKeyUp(e) {
    switch (e.code) {
        case 'KeyW': case 'ArrowUp': _keys.forward = false; break;
        case 'KeyS': case 'ArrowDown': _keys.backward = false; break;
        case 'KeyA': case 'ArrowLeft': _keys.left = false; break;
        case 'KeyD': case 'ArrowRight': _keys.right = false; break;
    }
}
