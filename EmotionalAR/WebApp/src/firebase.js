// ═══════════════════════════════════════════════════════════════
// Firebase Client — Web SDK
// ═══════════════════════════════════════════════════════════════

// ── Config ────────────────────────────────────────────────────
// TODO: PASTE YOUR FIREBASE CONFIG HERE
// Get this from: Firebase Console > Project Settings > General > Your Apps > Web App
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCtWoI5S9QVlD1uJa9YfkUU2SMRe4JBDa8",
    authDomain: "emotionalar.firebaseapp.com",
    projectId: "emotionalar",
    storageBucket: "emotionalar.firebasestorage.app",
    messagingSenderId: "850673778327",
    appId: "1:850673778327:web:2035a24abedacb6c28f3d2",
    measurementId: "G-9SS3SBDGNM"
};

// Check if config is missing
if (!FIREBASE_CONFIG.apiKey) {
    console.error('Firebase Config missing! Please update src/firebase.js');
    // Note: We don't throw an error here so the app doesn't crash immediately,
    // but auth/db calls will likely fail or warn.
}

let _db, _auth, _functions, _userId;
let _ready = false;

// ── Emotion colors ────────────────────────────────────────────
const EMOTION_COLORS = {
    comfort: '#6EE7B7',
    hope: '#FFD93D',
    sadness: '#6B9BD1',
    stress: '#A78BFA',
    loneliness: '#F9A8D4',
};

const EMOTIONS = Object.keys(EMOTION_COLORS);

// ── Initialization ────────────────────────────────────────────

export async function initFirebase() {
    // Dynamically import Firebase to save bundle size if not used immediately
    const { initializeApp } = await import('firebase/app');
    const { getAuth, onAuthStateChanged } = await import('firebase/auth');
    const { getFirestore } = await import('firebase/firestore');
    // const { getFunctions } = await import('firebase/functions'); // Not using functions for now

    try {
        const app = initializeApp(FIREBASE_CONFIG);
        _auth = getAuth(app);
        _db = getFirestore(app);
        // _functions = getFunctions(app);

        return new Promise((resolve) => {
            onAuthStateChanged(_auth, (user) => {
                if (user) {
                    _userId = user.uid;
                    console.log(`[Firebase] User authenticated: ${_userId}`);
                } else {
                    _userId = null;
                    console.log('[Firebase] No user authenticated.');
                }
                _ready = true;
                resolve(user);
            });
        });
    } catch (e) {
        console.error("[Firebase] Initialization failed. Check your config in src/firebase.js", e);
        _ready = false;
        return null;
    }
}

export function isReady() { return _ready; }
export function getUserId() { return _userId; }

// ── Authentication ────────────────────────────────────────────

export async function signUp(email, password, username) {
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
    try {
        const res = await createUserWithEmailAndPassword(_auth, email, password);
        await updateProfile(res.user, { displayName: username });

        // Try to create initial profile, but don't block auth if it fails (e.g. Firestore not set up)
        try {
            await saveProfile({ username, bio: '' }, res.user.uid);
        } catch (profileErr) {
            console.warn("[Firebase] Failed to create initial profile (Firestore might be disabled):", profileErr);
        }

        return res.user;
    } catch (e) {
        console.error("[Firebase] SignUp failed:", e);
        throw e;
    }
}

export async function logIn(email, password) {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    try {
        const res = await signInWithEmailAndPassword(_auth, email, password);
        return res.user;
    } catch (e) {
        console.error("[Firebase] Login failed:", e);
        throw e;
    }
}

export async function logOut() {
    const { signOut } = await import('firebase/auth');
    await signOut(_auth);
}

// ── Profile Management ────────────────────────────────────────

export async function saveProfile(data, uid = _userId) {
    if (!uid) return;
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    await setDoc(doc(_db, 'profiles', uid), {
        ...data,
        updatedAt: serverTimestamp()
    }, { merge: true });
}

export async function getProfile(uid = _userId) {
    if (!uid) return null;
    const { doc, getDoc } = await import('firebase/firestore');
    try {
        const snap = await getDoc(doc(_db, 'profiles', uid));
        return snap.exists() ? snap.data() : null;
    } catch (e) {
        console.warn("[Firebase] Error fetching profile:", e);
        return null;
    }
}

export async function getRandomOtherProfile() {
    const { collection, getDocs, query, limit } = await import('firebase/firestore');
    // Simple random approach: fetch top 20 and pick random one not equal to current user
    try {
        const q = query(collection(_db, 'profiles'), limit(20));
        const snap = await getDocs(q);
        const others = snap.docs.filter(d => d.id !== _userId);

        if (others.length === 0) return null;

        const randomDoc = others[Math.floor(Math.random() * others.length)];
        return { uid: randomDoc.id, ...randomDoc.data() };
    } catch (e) {
        console.warn("[Firebase] Error fetching random profile:", e);
        return null;
    }
}

// ── Fetch Nearby Messages ─────────────────────────────────────

export async function fetchNearbyMessages(lat, lng, radiusMeters = 5000) {
    const { collection, getDocs, query, limit, orderBy } = await import('firebase/firestore');

    // FETCH POLICY:
    // We are simply fetching the most recent 50 messages globally for this demo.
    // In a real app with Geo queries, you'd use geohashing or Firestore GeoPoints with specific queries.

    try {
        const q = query(collection(_db, 'messages'), orderBy('createdAt', 'desc'), limit(50));
        const snap = await getDocs(q);

        return snap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Ensure date string for UI
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
            };
        });
    } catch (e) {
        console.warn("[Firebase] Error fetching messages:", e);
        return [];
    }
}

// ── Post Message ──────────────────────────────────────────────

export async function postMessage(text, lat, lng, emotion) {
    if (!_auth.currentUser) throw new Error("Must be logged in to post.");

    const selectedEmotion = emotion && EMOTION_COLORS[emotion] ? emotion : 'hope';
    const colorHex = EMOTION_COLORS[selectedEmotion];

    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

    await addDoc(collection(_db, 'messages'), {
        text,
        emotion: selectedEmotion,
        colorHex,
        latitude: Number(lat),
        longitude: Number(lng),
        userId: _userId, // Crucial: Link message to user
        responseCount: 0,
        createdAt: serverTimestamp(),
    });
    return true;
}

// ── Post Response ────────────────────────────────────────────

export async function postResponse(messageId, text) {
    if (!_auth.currentUser) throw new Error("Must be logged in to respond.");

    const { collection, addDoc, serverTimestamp, doc, updateDoc, increment } = await import('firebase/firestore');

    // 1. Add response document
    await addDoc(collection(_db, 'messages', messageId, 'responses'), {
        text,
        userId: _userId,
        createdAt: serverTimestamp(),
    });

    // 2. Increment counter on parent message
    await updateDoc(doc(_db, 'messages', messageId), {
        responseCount: increment(1)
    });
    return true;
}

// ── Fetch Responses ──────────────────────────────────────────

export async function fetchResponses(messageId) {
    const { collection, getDocs, orderBy, query } = await import('firebase/firestore');

    try {
        const q = query(
            collection(_db, 'messages', messageId, 'responses'),
            orderBy('createdAt', 'asc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, text: d.data().text }));
    } catch (e) {
        console.warn("[Firebase] Error fetching responses:", e);
        return [];
    }
}

// ── Presence ─────────────────────────────────────────────────

export async function updatePresence(messageId) {
    if (!_userId) return;
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    // We store presence in a subcollection 'viewers'
    await setDoc(doc(_db, 'messages', messageId, 'viewers', _userId), {
        activeAt: serverTimestamp()
    });
}

export async function getPresenceCount(messageId) {
    const { collection, getCountFromServer } = await import('firebase/firestore');
    try {
        const snap = await getCountFromServer(collection(_db, 'messages', messageId, 'viewers'));
        return snap.data().count;
    } catch (e) {
        console.warn("[Firebase] Error fetching presence:", e);
        return 0; // Fallback
    }
}
