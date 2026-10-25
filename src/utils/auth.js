import { db } from '../db/db';

const SALT = 'petrol_pump_secure_offline_salt_v1';
const SESSION_KEY = 'PP_AUTH_SESSION';
const REMEMBER_USER_KEY = 'PP_REMEMBERED_USERNAME';

/**
 * Computes SHA-256 hash using native Web Crypto API (100% offline).
 */
export async function hashPassword(password) {
  if (!password) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Initializes default administrator if no users exist.
 * Default admin username: 'admin', initial password: 'admin'
 */
export async function ensureDefaultAdmin() {
  try {
    const userCount = await db.users.count();
    if (userCount === 0) {
      const defaultPasswordHash = await hashPassword('admin');
      await db.users.add({
        username: 'admin',
        passwordHash: defaultPasswordHash,
        name: 'Station Administrator',
        role: 'Administrator',
        status: 'Active',
        createdAt: new Date().toISOString()
      });
      console.log('Default administrator initialized: username=admin');
    }
  } catch (err) {
    console.error('Failed to ensure default admin user:', err);
  }
}

/**
 * Authenticates a user offline using Dexie DB.
 */
export async function authenticateUser(username, password) {
  if (!username?.trim() || !password) {
    throw new Error('Please enter both username and password.');
  }

  const cleanUser = username.trim().toLowerCase();
  const user = await db.users.where('username').equalsIgnoreCase(cleanUser).first();

  if (!user) {
    throw new Error('User not found. Check username or contact manager.');
  }

  if (user.status !== 'Active') {
    throw new Error('This account has been deactivated. Contact administrator.');
  }

  const computedHash = await hashPassword(password);
  if (computedHash !== user.passwordHash) {
    throw new Error('Invalid password. Please check your credentials.');
  }

  return {
    id: user.id,
    username: user.username,
    name: user.name || user.username,
    role: user.role || 'Staff',
    loginTime: new Date().toISOString()
  };
}

/**
 * Session persistence helpers
 */
export function setSessionUser(user, remember = false) {
  const json = JSON.stringify(user);
  sessionStorage.setItem(SESSION_KEY, json);
  if (remember) {
    localStorage.setItem(REMEMBER_USER_KEY, user.username);
  } else {
    localStorage.removeItem(REMEMBER_USER_KEY);
  }
}

export function getSessionUser() {
  try {
    // Clean up any old localStorage session so new browser/app starts always require login
    localStorage.removeItem(SESSION_KEY);
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSessionUser() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function getRememberedUsername() {
  return localStorage.getItem(REMEMBER_USER_KEY) || '';
}
