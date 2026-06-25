// ── One-Time Demo Usage Store ─────────────────────────────────
// Tracks whether a non-admin user has already used the platform.
// Persists in localStorage so the restriction survives page refreshes.
// Identifiers used: email, a pseudo-IP derived from the browser, and a fingerprint.
// Super users (admin / super_admin) are never restricted.

const USAGE_STORE_KEY = 'kavachiq_usage_store';

function getIpFingerprint() {
  try {
    // Build a deterministic pseudo-IP from available browser signals
    const parts = [
      navigator.userAgent || 'unknown',
      navigator.language || 'en',
      screen.width || 0,
      screen.height || 0,
      navigator.hardwareConcurrency || 0
    ];
    const hash = parts.join('|');
    // Use a simple hash to produce a consistent IP-like string
    let h = 0;
    for (let i = 0; i < hash.length; i++) {
      const c = hash.charCodeAt(i);
      h = ((h << 5) - h) + c;
      h = h & h;
    }
    const abs = Math.abs(h);
    return `10.${(abs >> 16) & 0xFF}.${(abs >> 8) & 0xFF}.${abs & 0xFF}`;
  } catch {
    return '10.0.0.1';
  }
}

function getDefaultStore() {
  return {
    // Map of "email|ipFingerprint" -> timestamp of first use
    usedIdentities: {},
    // Set of email addresses that have been blocked from re-use
    usedEmails: []
  };
}

function loadStore() {
  try {
    const raw = localStorage.getItem(USAGE_STORE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        usedIdentities: data.usedIdentities || {},
        usedEmails: Array.isArray(data.usedEmails) ? data.usedEmails : []
      };
    }
  } catch (e) {
    // ignore
  }
  return getDefaultStore();
}

function saveStore(store) {
  try {
    localStorage.setItem(USAGE_STORE_KEY, JSON.stringify(store));
  } catch (e) {
    // ignore
  }
}

/**
 * Check if the given user has already used the platform.
 * @param {object} user - { email, role }
 * @returns {{ allowed: boolean, reason: string | null }}
 */
export function checkDemoAccess(user) {
  if (!user || !user.email) {
    return { allowed: false, reason: 'No user data available' };
  }

  // Super users always have access
  if (user.role === 'admin' || user.role === 'super_admin') {
    return { allowed: true, reason: null };
  }

  const store = loadStore();
  const ipFingerprint = getIpFingerprint();
  const identityKey = `${user.email}|${ipFingerprint}`;

  // Check if this identity has been used before
  if (store.usedIdentities[identityKey]) {
    const usedAt = new Date(store.usedIdentities[identityKey]);
    return {
      allowed: false,
      reason: `This account has already used the demo. Please upgrade to continue. First used: ${usedAt.toLocaleDateString()}`
    };
  }

  // Also check if just the email has been used (from a different device)
  if (store.usedEmails.includes(user.email)) {
    return {
      allowed: false,
      reason: 'This account has already used the demo from another device. Please upgrade to continue.'
    };
  }

  return { allowed: true, reason: null };
}

/**
 * Record that a user has used the platform.
 * @param {object} user - { email, role }
 */
export function recordDemoUsage(user) {
  if (!user || !user.email) return;

  // Don't record for super users — they are never restricted
  if (user.role === 'admin' || user.role === 'super_admin') return;

  const store = loadStore();
  const ipFingerprint = getIpFingerprint();
  const identityKey = `${user.email}|${ipFingerprint}`;

  if (!store.usedIdentities[identityKey]) {
    store.usedIdentities[identityKey] = new Date().toISOString();
  }
  if (!store.usedEmails.includes(user.email)) {
    store.usedEmails.push(user.email);
  }

  saveStore(store);
}

/**
 * Check access and record usage in one call (for first-time users).
 * @param {object} user - { email, role }
 * @returns {{ allowed: boolean, reason: string | null, isNewUser: boolean }}
 */
export function checkAndRecordDemoUsage(user) {
  const result = checkDemoAccess(user);

  if (result.allowed) {
    // First time — record the usage
    recordDemoUsage(user);
    return { ...result, isNewUser: true };
  }

  return { ...result, isNewUser: false };
}

/**
 * Clear usage data (useful for testing or admin reset).
 */
export function resetDemoUsage() {
  saveStore(getDefaultStore());
}
