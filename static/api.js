/**
 * api.js — load this FIRST in every HTML page (before any other script).
 *
 * 1. Monkey-patches window.fetch so every request automatically sends the
 *    httpOnly auth cookie — no changes needed in any other JS file.
 * 2. Provides doLogout() — clears cookie server-side + localStorage + redirects.
 */

(function patchFetch() {
  const _orig = window.fetch;
  window.fetch = function (input, init = {}) {
    // Always send cookies for same-origin requests
    if (!init.credentials) {
      init.credentials = 'include';
    }
    return _orig.call(this, input, init);
  };
})();


/**
 * doLogout()
 * Call instead of inline localStorage-clear + redirect.
 * Tells the server to clear the httpOnly cookie, then cleans up localStorage.
 */
async function doLogout() {
  try {
    await fetch('/auth/logout', { method: 'POST' });
  } catch (_) { /* best-effort */ }
  ['vfa_token', 'vfa_role', 'vfa_api_user', 'vfa_session_id'].forEach(k => localStorage.removeItem(k));
  window.location.href = '/index.html';
}
