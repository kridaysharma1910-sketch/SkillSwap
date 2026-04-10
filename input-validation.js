'use strict';
/* SkillSwap — shared client-side input validation
 * Include before any page script that handles user input.
 * All checks are defence-in-depth; Supabase RLS + DB constraints remain
 * the authoritative server-side enforcement layer.
 */
const InputValidator = (() => {
  const EMAIL_RE   = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  const UUID_RE    = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const ROOM_ID_RE = /^[a-zA-Z0-9_\-]{4,64}$/;
  const URL_RE     = /^https?:\/\/[^\s<>'"]{1,290}$/;

  return {
    /** Valid RFC-5321 email address, max 254 chars */
    email(v)          { return typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v); },
    /** Password between 8 and 128 chars */
    password(v)       { return typeof v === 'string' && v.length >= 8 && v.length <= 128; },
    /** Non-empty string up to 100 chars */
    name(v)           { return typeof v === 'string' && v.trim().length > 0 && v.length <= 100; },
    /** Alphanumeric + underscore, 1-50 chars */
    username(v)       { return typeof v === 'string' && /^[a-zA-Z0-9_]{1,50}$/.test(v); },
    /** Generic text within a max byte length */
    text(v, max)      { return typeof v === 'string' && v.length <= max; },
    /** Optional URL — empty passes, present must be http(s) and ≤ 300 chars */
    url(v)            { return !v || (typeof v === 'string' && v.length <= 300 && URL_RE.test(v)); },
    /** Standard UUID v4 */
    uuid(v)           { return typeof v === 'string' && UUID_RE.test(v); },
    /** WebRTC room ID — alphanumeric / dash / underscore, 4-64 chars */
    roomId(v)         { return typeof v === 'string' && ROOM_ID_RE.test(v); },
    /** Skill tag — 2-80 chars */
    skill(v)          { return typeof v === 'string' && v.trim().length >= 2 && v.length <= 80; },
    /** Integer within an inclusive range */
    int(v, min, max)  { const n = parseInt(v, 10); return Number.isFinite(n) && n >= min && n <= max; },
    /** Non-negative float up to a maximum */
    price(v, max)     { const n = parseFloat(v); return Number.isFinite(n) && n >= 0 && n <= max; },
  };
})();
