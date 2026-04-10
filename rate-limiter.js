/**
 * rate-limiter.js — Client-side rate limiting via localStorage
 * Max 5 attempts per 15-minute sliding window per action key.
 *
 * Usage:
 *   const r = RateLimiter.check('login');
 *   if (!r.allowed) return showAlert('Too many attempts. Try again in ' + r.wait + ' min.');
 *
 *   RateLimiter.reset('login'); // clear on success (optional)
 */
const RateLimiter = (() => {
  const MAX = 5;
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  function check(key) {
    const now = Date.now();
    let s;
    try {
      const raw = localStorage.getItem('rl_' + key);
      s = raw ? JSON.parse(raw) : null;
    } catch (e) {
      s = null;
    }
    if (!s || now - s.start >= WINDOW_MS) s = { count: 0, start: now };
    if (s.count >= MAX) {
      const wait = Math.ceil((WINDOW_MS - (now - s.start)) / 60000);
      return { allowed: false, wait };
    }
    s.count++;
    try { localStorage.setItem('rl_' + key, JSON.stringify(s)); } catch (e) {}
    return { allowed: true };
  }

  function reset(key) {
    try { localStorage.removeItem('rl_' + key); } catch (e) {}
  }

  return { check, reset };
})();
