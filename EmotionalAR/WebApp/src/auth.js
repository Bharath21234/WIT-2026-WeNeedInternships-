import { signUp, logIn, logOut, getProfile, saveProfile } from './firebase.js';

const $ = (s) => document.querySelector(s);

export function initAuth(onAuthSuccess) {
    const authOverlay = $('#auth-overlay');
    const loginForm = $('#login-form');
    const signupForm = $('#signup-form');
    const authSub = $('#auth-sub');

    // Toggle forms
    $('#link-to-login').onclick = (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        authSub.textContent = 'Log in to continue';
    };

    $('#link-to-signup').onclick = (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        authSub.textContent = 'Sign up to join the landscape';
    };

    // Signup Logic
    $('#btn-do-signup').onclick = async () => {
        const username = $('#signup-username').value.trim();
        const email = $('#signup-email').value.trim();
        const password = $('#signup-password').value.trim();

        if (!username || !email || !password) {
            alert('Please fill in all fields');
            return;
        }

        try {
            $('#btn-do-signup').disabled = true;
            $('#btn-do-signup').textContent = 'Creating account...';
            await signUp(email, password, username);
            authOverlay.classList.add('hidden');
            if (onAuthSuccess) onAuthSuccess();
        } catch (err) {
            alert(err.message);
        } finally {
            $('#btn-do-signup').disabled = false;
            $('#btn-do-signup').textContent = 'Sign Up';
        }
    };

    // Login Logic
    $('#btn-do-login').onclick = async () => {
        const email = $('#login-email').value.trim();
        const password = $('#login-password').value.trim();

        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        try {
            $('#btn-do-login').disabled = true;
            $('#btn-do-login').textContent = 'Logging in...';
            await logIn(email, password);
            authOverlay.classList.add('hidden');
            if (onAuthSuccess) onAuthSuccess();
        } catch (err) {
            alert(err.message);
        } finally {
            $('#btn-do-login').disabled = false;
            $('#btn-do-login').textContent = 'Log In';
        }
    };
}

export function showAuth() {
    $('#auth-overlay').classList.remove('hidden');
}

export function hideAuth() {
    $('#auth-overlay').classList.add('hidden');
}
