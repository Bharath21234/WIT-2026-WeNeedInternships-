// ═══════════════════════════════════════════════════════════════
// Life Swap Adventure — Interactive state machine & UI
// ═══════════════════════════════════════════════════════════════

import { generateAdventure } from './lifeSwapEngine.js';
import { initLifeSwapScene, setEnvironment, destroyLifeSwapScene } from './lifeSwapScene.js';
import { initChat, sendChatMessage, getGreeting } from './lifeSwapChat.js';
import { showToast } from './ui.js';

// ── State ────────────────────────────────────────────────────
let _adventure = null;
let _currentSceneIndex = 0;
let _choicesMade = [];
let _profile = null;
let _sceneMap = {};
let _isActive = false;

// ── DOM refs ─────────────────────────────────────────────────
const $ = (s) => document.querySelector(s);

/**
 * Launch the interactive adventure for a given profile.
 */
export async function startAdventure(profile) {
    _profile = profile;
    _choicesMade = [];
    _currentSceneIndex = 0;
    _isActive = true;

    const overlay = $('#adventure-overlay');
    const loadingEl = $('#adventure-loading');
    const uiEl = $('#adventure-ui');

    // Show overlay with loading
    overlay.classList.remove('hidden');
    loadingEl.classList.remove('hidden');
    uiEl.classList.add('hidden');

    // Set the person's name in the header
    $('#adventure-person-name').textContent = profile.username || 'Someone';

    // Initialize 3D scene
    const canvas = $('#adventure-canvas');
    initLifeSwapScene(canvas);

    try {
        // Generate adventure from bio
        _adventure = await generateAdventure(profile.bio);

        // Build scene lookup map
        _sceneMap = {};
        _adventure.scenes.forEach(s => { _sceneMap[s.id] = s; });

        // Hide loading, show UI
        loadingEl.classList.add('hidden');
        uiEl.classList.remove('hidden');

        // Show first scene
        showScene(_adventure.scenes[0]);
    } catch (err) {
        console.error('[Adventure] Failed to start:', err);
        showToast('Could not generate adventure. Try again.', 'error');
        exitAdventure();
    }
}

/**
 * Exit and clean up.
 */
export function exitAdventure() {
    _isActive = false;
    _adventure = null;

    destroyLifeSwapScene();
    $('#adventure-overlay').classList.add('hidden');
    $('#chat-overlay').classList.add('hidden');
}

// ── Scene Rendering ──────────────────────────────────────────

function showScene(scene) {
    if (!scene || !_isActive) return;

    // Update 3D environment
    setEnvironment(scene.environment || 'city', scene.mood || 'peaceful');

    // Update time badge
    $('#adventure-time').textContent = scene.time || '';

    // Update progress bar
    const totalScenes = _adventure.scenes.length;
    const sceneIndex = _adventure.scenes.indexOf(scene);
    const progress = ((sceneIndex + 1) / totalScenes) * 100;
    $('#adventure-progress-fill').style.width = `${progress}%`;
    $('#adventure-progress-label').textContent = `${sceneIndex + 1} / ${totalScenes}`;

    // Title
    const titleEl = $('#adventure-scene-title');
    titleEl.textContent = scene.title || '';
    titleEl.className = 'adventure-scene-title';
    // Trigger animation
    requestAnimationFrame(() => titleEl.classList.add('visible'));

    // Typewriter effect for description
    const textEl = $('#adventure-scene-text');
    textEl.textContent = '';
    typewriterEffect(textEl, scene.description, 30, () => {
        // After text finishes, show choices (or ending)
        if (scene.choices && scene.choices.length > 0) {
            showChoices(scene);
        } else {
            showEnding();
        }
    });

    // Hide choices while text types
    $('#adventure-choices').innerHTML = '';
}

function showChoices(scene) {
    const container = $('#adventure-choices');
    container.innerHTML = '';

    scene.choices.forEach((choice, i) => {
        const btn = document.createElement('button');
        btn.className = 'adventure-choice-btn';
        btn.textContent = choice.text;
        btn.style.animationDelay = `${i * 0.15}s`;

        btn.onclick = () => {
            // Record choice
            _choicesMade.push(choice.text);

            // Show consequence briefly
            showConsequence(choice.consequence, () => {
                // Navigate to next scene
                const nextScene = _sceneMap[choice.nextSceneId];
                if (nextScene) {
                    showScene(nextScene);
                } else {
                    showEnding();
                }
            });

            // Disable all buttons
            container.querySelectorAll('.adventure-choice-btn').forEach(b => {
                b.disabled = true;
                if (b !== btn) b.classList.add('not-chosen');
            });
            btn.classList.add('chosen');
        };

        container.appendChild(btn);
    });
}

function showConsequence(text, onDone) {
    const el = $('#adventure-consequence');
    el.textContent = text;
    el.classList.remove('hidden');
    el.classList.add('visible');

    setTimeout(() => {
        el.classList.remove('visible');
        el.classList.add('hidden');
        setTimeout(onDone, 300);
    }, 2000);
}

function showEnding() {
    const container = $('#adventure-choices');
    container.innerHTML = '';

    // Reflection message
    const reflection = document.createElement('div');
    reflection.className = 'adventure-reflection';
    reflection.innerHTML = `
        <p class="reflection-text">You've lived a full day as <strong>${_profile.username || 'this person'}</strong>.</p>
        <p class="reflection-sub">Every choice shaped the experience. Now, talk to the real person behind this life.</p>
    `;
    container.appendChild(reflection);

    // Talk button
    const talkBtn = document.createElement('button');
    talkBtn.className = 'adventure-choice-btn talk-btn';
    talkBtn.textContent = `💬 Talk to ${_profile.username || 'Them'}`;
    talkBtn.onclick = openChat;
    container.appendChild(talkBtn);

    // Exit button
    const exitBtn = document.createElement('button');
    exitBtn.className = 'adventure-choice-btn exit-btn';
    exitBtn.textContent = 'Return to Map';
    exitBtn.onclick = exitAdventure;
    container.appendChild(exitBtn);
}

// ── Chat ─────────────────────────────────────────────────────

function openChat() {
    // Initialize chat with context
    initChat(_profile, _choicesMade);

    // Show chat overlay
    const chatOverlay = $('#chat-overlay');
    chatOverlay.classList.remove('hidden');

    // Set header name
    $('#chat-person-name').textContent = _profile.username || 'Someone';

    // Clear previous messages
    const msgContainer = $('#chat-messages');
    msgContainer.innerHTML = '';

    // Add greeting
    addChatMessage(getGreeting(), 'them');

    // Wire up send
    const input = $('#chat-input');
    const sendBtn = $('#chat-send');

    const handleSend = async () => {
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        addChatMessage(text, 'you');

        // Show typing indicator
        const typingId = addTypingIndicator();

        try {
            const reply = await sendChatMessage(text);
            removeTypingIndicator(typingId);
            addChatMessage(reply, 'them');
        } catch (err) {
            removeTypingIndicator(typingId);
            addChatMessage("Hmm, I got distracted. What were you saying? 😅", 'them');
        }
    };

    sendBtn.onclick = handleSend;
    input.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Focus input
    setTimeout(() => input.focus(), 300);
}

function addChatMessage(text, sender) {
    const container = $('#chat-messages');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.textContent = text;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
    return bubble;
}

function addTypingIndicator() {
    const container = $('#chat-messages');
    const indicator = document.createElement('div');
    indicator.className = 'chat-bubble them typing';
    indicator.id = 'typing-' + Date.now();
    indicator.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    container.appendChild(indicator);
    container.scrollTop = container.scrollHeight;
    return indicator.id;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// ── Helpers ──────────────────────────────────────────────────

function typewriterEffect(element, text, speed, onDone) {
    let i = 0;
    element.textContent = '';

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else if (onDone) {
            setTimeout(onDone, 400);
        }
    }
    type();
}

// ── Init (wire up exit button) ───────────────────────────────
export function initAdventure() {
    // Adventure exit
    const exitBtn = $('#adventure-exit');
    if (exitBtn) exitBtn.onclick = exitAdventure;

    // Chat close
    const chatClose = $('#chat-close');
    if (chatClose) chatClose.onclick = () => {
        $('#chat-overlay').classList.add('hidden');
    };

    console.log('[Adventure] UI wired.');
}
