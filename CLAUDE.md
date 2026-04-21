# SkillSwap — Claude Code Context

## Project
Skill-exchange platform: users list skills they offer/want, get matched, swap sessions.

**Live:** https://skillswap.buzz  
**GitHub:** https://github.com/kridaysharma1910-sketch/SkillSwap  
**Supabase ID:** vgndpvkywvcnezvjuueq  
**Deploy:** Vercel (auto from main)

---

## Stack
- Frontend: Plain HTML + CSS + Vanilla JS (no frameworks, no build tools)
- Backend: Supabase (auth + DB + Realtime)
- Video: Custom WebRTC + Supabase Realtime signaling; Google STUN + OpenRelay TURN
- Deploy: Vercel

---

## Supabase Tables
- `profiles` — id, full_name, username, bio, location, website, avatar_url, avatar_emoji, plan, rating, rank, rewards[], skills_offering[], skills_wanting[], skills_offered[], skills_wanted[], hours_per_week, session_format, updated_at
- `matches` — id, sender_id→profiles, receiver_id→profiles, status (pending/accepted/rejected/completed), skill_offered, skill_wanted, end_requested_by→profiles (nullable), end_requested_at (timestamptz, nullable), created_at, updated_at
- `messages` — id, match_id→matches, sender_id→profiles, content, read, created_at
- `sessions` — id, match_id→matches, user_id→profiles, partner_id→profiles, duration_minutes, skill_taught, skill_learned, completed_at
- `webinars` — id, host_id→profiles, title, description, category, cover_emoji, jitsi_room, is_free, price, scheduled_at, duration_minutes, max_attendees, attendee_count, earnings, is_live, status, created_at
- `webinar_attendees` — id, webinar_id→webinars, user_id→profiles, paid, amount_paid, joined_at
- `analytics` — id, user_id→profiles (unique), skills_taught_count, skills_learned_count, total_video_minutes, webinars_watched, webinars_hosted, total_earnings, global_rank, updated_at
- `call_invites` — id, room_id, match_id→matches, caller_id→profiles, callee_id→profiles, caller_name, caller_avatar, status (pending/accepted/declined/expired), created_at
- `reviews` — id, match_id→matches, reviewer_id→profiles, reviewee_id→profiles, rating (1-5), comment, created_at
- Storage: `avatars` bucket (public) — `{user_id}/avatar.{ext}`

---

## Pages

| Page | File | Status |
|------|------|--------|
| Landing | index.html | ✅ |
| Sign Up | signup.html | ✅ |
| Login | login.html | ✅ |
| Reset Password | reset-password.html | ✅ |
| Dashboard | dashboard.html | ✅ |
| Profile | profile.html | ✅ |
| Public User Profile | user.html | ✅ |
| Discover | discover.html | ✅ |
| Matches | matches.html | ✅ |
| Messages | messages.html | ✅ |
| Video Call | videocall.html | ✅ |
| Pricing | pricing.html | ✅ |
| Webinars | webinars.html | ✅ |
| Analytics | analytics.html | ✅ |
| Webinar Host Room | webinar-host.html | ✅ |
| Terms of Service | terms.html | ✅ |
| Privacy Policy | privacy.html | ✅ |
| Refund Policy | refund.html | ✅ |

---

## Pricing Tiers
- Free — $0
- Pro — $9/month
- Creator — $19/month

---

## Design System
- **Theme:** Full black (#080808 bg), Syne (headings 800w) + DM Sans (body 300-500w)
- **No purple buttons** — all CTAs white bg + #080808 text
- **Accents:** violet rgba(139,92,246) + cyan rgba(34,211,238) for borders/glows only
- **Cards:** bg rgba(255,255,255,0.03), border rgba(255,255,255,0.08), radius 18px, backdrop-filter blur(12px)
- **Inputs:** bg rgba(255,255,255,0.04), border rgba(255,255,255,0.09), radius 12px, violet glow on focus
- **CSS vars:** `--bg:#080808`, `--bg-card:rgba(255,255,255,0.03)`, `--border:rgba(255,255,255,0.08)`, `--border-hover:rgba(139,92,246,0.3)`, `--text-muted:rgba(255,255,255,0.32)`
- **Globe:** Canvas-based dot-matrix globe on index/login/signup (premium version via _replace_globe.js)
- **Custom cursor:** 10px white dot + 34px trailing ring, both fixed, turns purple on hover
- **Tags:** violet / cyan / dim-white variants, 100px radius, 3px 10px padding, 10px font
- **Sidebar scrollbar:** 4px wide, dark themed (no white line)
- **Sidebar collapse:** Hamburger always visible on desktop, toggles body.sidebar-collapsed, state in localStorage ss_sidebar

---

## Code Conventions
- Each page handles its own auth check (redirect to login if not logged in)
- All Supabase calls use async/await
- Supabase JS client loaded via CDN
- All 10 sidebar pages share same sidebar pattern with `#sidebar-overlay` for mobile
- `input-validation.js` loaded on every page that handles user input (after `supabase-client.js`)
- All user-controlled values rendered into the DOM use `.textContent` / `setAttribute` — never `innerHTML` with raw input

---

## Key Implementation Notes

### WebRTC (videocall.html)
- Room ID: random alphanumeric, passed as `?room=` URL param
- Signaling: Supabase broadcast channel `call-{roomId}` for offer/answer/ICE
- ICE servers: Google STUN (free) + OpenRelay TURN (ports 80/443)
- Caller retries `ready` ping every 2s until callee responds
- `createOfferAndWaitForICE()` / `createAnswerAndWaitForICE()` — wait for iceGatheringState=complete (4s max) before sending SDP
- ICE restart on 8s timeout if not connected; auto-teardown+retry on failed state
- `safeSetRemoteDescription()` + `handleIncomingCandidate()` to prevent race conditions
- Voice-only mode: `?voice=1` skips video getUserMedia
- Screen share: `replaceTrack()` to peer, auto-reverts on stop
- Recording: MediaRecorder, pro/creator only, saves .webm locally
- Persistent calls: `ss_active_call` in localStorage, cleared only on explicit hangup; NO beforeunload hangup
- Cam-off placeholder: `#localCamOff` div shown when camera off or voice-only

### Call Notifications (call-notify.js)
- Inserts row into `call_invites` table instead of broadcast (DB-persistent)
- Subscribes to `postgres_changes INSERT` on `call_invites` filtered by `callee_id`
- On subscribe, polls last 60s for missed pending invites
- Included on all 8 authenticated pages EXCEPT videocall.html
- **Requires:** `call_invites` table + Realtime enabled (already set up in Supabase)

### Messages (messages.html)
- Real-time via Supabase postgres_changes + 3s polling fallback
- Voice call: `VOICE_INVITE::roomId`; Video call: `CALL_INVITE::roomId`
- Emoji picker: 80+ emojis, inserts at cursor
- Read receipts: "Seen" below last read message sent by me
- Active call banner: green pulsing banner with Rejoin link if `ss_active_call` matches open convo

### Webinars
- Star topology WebRTC: each participant connects to HOST only
- Two channels per webinar: `webinar_ctrl:{id}` (commands) + `webinar_rtc:{id}` (signaling)
- `webinar-host.html`: dedicated full-screen host room, opens in named tab `wh_{id}`
- BroadcastChannel duplicate tab detection in webinar-host.html
- Fallback quick controls dropdown on webinar cards in webinars.html
- Recording saves as .webm locally (no server storage)
- Ended webinars filtered from listing via `.neq('status','ended')`

### Auth
- Email confirmation must be DISABLED in Supabase (Auth → Providers → Email → "Confirm email" OFF)
- Google OAuth enabled; dashboard.html auto-creates profile on first OAuth login (detects PGRST116)
- `profiles` saves to both `skills_offering/wanting` (new) and `skills_offered/wanted` (legacy) for compatibility

### Input Validation (input-validation.js)
- Shared `InputValidator` module loaded on all pages with user input
- Validators: `email` (RFC-5321, ≤254), `password` (8–128 chars), `name` (≤100), `username` (alphanum+underscore, ≤50), `text(v, max)`, `url` (https:// only, ≤300), `uuid` (v4), `roomId` (alphanum/dash/underscore, 4–64), `skill` (2–80), `int(v, min, max)`, `price(v, max)`
- Per-page limits: messages ≤5000 chars; chat ≤500; webinar title ≤200, desc ≤2000, duration 1–480 min, attendees 1–1000, price $0–9999, date must be future; profile bio ≤500, location ≤100
- `call-notify.js` has inline equivalents (no external dependency): validates `roomId` format before rendering overlay, strips HTML chars from `callerName`, rejects non-https avatar URLs, enforces UUID format on `inviteId`/`matchId`
- `videocall.html` validates `?room=` param format and silently drops a malformed `?match=` UUID

---

## Known Issues / Pending
- **Payment not wired** — `selectPlan()` updates Supabase directly, no Lemon Squeezy/Paddle flow yet
- `reviews` table — **live in Supabase** (id, match_id, reviewer_id, reviewee_id, rating 1-5, comment, created_at; RLS: insert own, read all)
- `avatars` storage bucket must be created in Supabase dashboard
- Realtime must be enabled for `messages` table in Supabase dashboard
- Webinar cloud recording not implemented — local .webm download only

---

## Session Start Prompt
```
Read CLAUDE.md in the project root first. That file is the source of truth for this project.

Your job is to continue building SkillSwap — a skill-exchange web platform. Stack: plain HTML/CSS/Vanilla JS + Supabase backend.

Rules:
1. After every meaningful change: git add . && git commit -m "descriptive message"
2. Keep code consistent with existing pages in style and structure
3. At END of session: update CLAUDE.md — add a brief session entry (5-10 lines max) to the Session Log below, and update the Pages table if anything changed

Start by telling me: what's the current state per CLAUDE.md, and what are we building this session?
```

---

## Session Log

### [Session 23 — 2026-04-21]
- **terms.html**: new Terms of Service page (`/terms`) — 15 sections, table of contents with smooth scroll, public layout (no sidebar)
- **privacy.html**: new Privacy Policy page (`/privacy`) — 12 sections, data collection tables, legal basis table, cookies/localStorage list
- **refund.html**: new Refund Policy page (`/refund`) — 7-day money-back guarantee, eligible/not-eligible grid, 4-step request flow, webinar refund rules
- **vercel.json**: added rewrites + redirects for `/terms`, `/privacy`, `/refund`
- **index.html**: fixed dead `#` footer links → real links to `/privacy`, `/terms`, `/refund`, `mailto:support@skillswap.buzz`
- **pricing.html**: added legal link row below FAQ; updated "Lemon Squeezy" → "Paddle" in FAQ answer
- **terms.html**: updated payment processor reference to Paddle
- **Paddle**: researched setup — merchant must be 18+; Paddle chosen as payment provider over Lemon Squeezy

### [Session 22 — 2026-04-21]
- **call-notify.js**: fixed relative `videocall.html?room=` URLs → `/videocall?room=` in 2 places (accept navigation + active pill); avoids unnecessary 301 redirect
- **videocall.html**: added `calleeReadyInterval` — callee now retries `ready` broadcast every 2s until offer arrives (Supabase broadcast is at-most-once; dropped ready = stalled call)
- **videocall.html**: caller restarts `readyInterval` if `createOffer()` throws, enabling automatic retry instead of going silent
- **videocall.html**: `calleeReadyInterval` cleaned up in all exit paths (`cancelCall`, `showCallEnded`, `endCall`, `gracefulFail`)
- **.gitignore**: added `.claude/settings.local.json` to stop it showing as modified
- **Payments**: researched Dodo Payments — their acceptable use policy restricts coaching/P2P/matchmaking platforms; drafted merchant reply email framing SkillSwap as SaaS subscription + event ticketing to maximise acceptance odds; payment still not wired (Lemon Squeezy / Paddle remain the planned providers)

### [Session 21 — 2026-04-15]
- **dashboard.html**: `loadAnalytics` now queries `sessions` + `analytics` tables directly — the `analytics` table was never auto-populated so stats always showed `—`; also upserts analytics row to keep it in sync going forward
- **webinars.html**: added raise hand button (hand icon, amber when active) to participant overlay controls; sends `raise_hand` / `lower_hand` broadcasts to host channel; persisted webinar reminders to localStorage (`ss_reminders`) so they survive page reload; `remindedIds` Set loaded from storage before webinar cards render so bell button correctly hidden
- **webinar-host.html**: added `lower_hand` broadcast handler — removes attendee from raised-hand queue and re-renders panel + badge
- **call-notify.js**: removed debug `console.log('[call-notify] channel status:', status)` left in production code

### [Session 20 — 2026-04-14]
- **matches.html — mutual-consent end match**: removed unilateral "Mark Done"; active matches now have "End Match" button → sets `end_requested_by` + `end_requested_at` on the row; partner sees yellow warning banner ("X wants to end this swap") with Accept End / Keep Going buttons; requester sees clock label + Cancel End option; auto-expires to `completed` on next page load after 24 hrs without a response
- **matches.html — cancel sent request**: Sent tab now has "Cancel Request" button (confirms → deletes the pending match row)
- **matches.html — active tab states**: 3 distinct render paths (normal / I-requested-end / partner-requested-end) with appropriate status badges (Active / Ending... / End Requested)
- **notif-bell.js**: new notification type when partner sets `end_requested_by` — appears in bell dropdown linking to /matches
- **Supabase migration**: `ALTER TABLE matches ADD COLUMN end_requested_by uuid REFERENCES profiles(id) ON DELETE SET NULL, ADD COLUMN end_requested_at timestamptz` — already applied

### [Session 19 — 2026-04-14]
- **reset-password.html**: new page handles Supabase PASSWORD_RECOVERY magic link — strength meter, show/hide, confirm field, auto-redirect to dashboard; `login.html` redirectTo updated to `/reset-password`
- **user.html**: public profile page (`/user?id=X`) — avatar, name, bio, location, rating, plan badge, skills offered/wanted, session stats, reviews list, Send Request / Message / Past Messages CTA based on match state; linked from discover cards
- **discover.html**: added "View" button on every user card linking to `/user?id=X`
- **matches.html**: post-completion 5-star review modal — writes to `reviews` table, recalculates `profiles.rating` as running average; graceful fallback if table not yet created; "View Profile" button on completed matches
- **videocall.html**: session logging now also saves `partner_id`, `skill_taught`, `skill_learned` (from match data fetched on init)
- **notif-bell.js**: new shared script injected on all 9 authenticated pages — bell icon above user pill, badge count of unseen, dropdown listing new match requests, acceptances, completions, unread messages; 45s polling; seen state in localStorage
- **webinars.html**: removed dead `#hostOverlay` HTML (55 lines), 40 lines of dead CSS, and 230 lines of dead JS (enterHostMode + 12 helper functions) — fully replaced by webinar-host.html
- **vercel.json**: added rewrites + redirects for `/reset-password` and `/user`
- **reviews table SQL**: added to Known Issues/Pending with ready-to-run CREATE TABLE + RLS statement

### [Session 18 — 2026-04-13]
- **Custom domain**: connected `skillswap.buzz` to Vercel; updated CLAUDE.md live URL
- **OAuth domain fix**: updated hardcoded `skill-swap-chi-gules.vercel.app` → `skillswap.buzz` in `login.html` (resetPasswordForEmail + signInWithOAuth redirectTo)
- **Clean URLs**: created `vercel.json` with rewrites (`/dashboard` → `dashboard.html`) and 301 redirects (`/dashboard.html` → `/dashboard`); all 13 HTML files updated — every `href`, `window.location`, template-literal nav, and query-string concat stripped of `.html`
- **Google Cloud Console**: Authorized JavaScript Origins = `https://skillswap.buzz`; Authorized Redirect URIs = `https://vgndpvkywvcnezvjuueq.supabase.co/auth/v1/callback` (Supabase handles OAuth callback, not the app directly)
- **Supabase Auth config**: Site URL = `https://skillswap.buzz`; Redirect URLs = `https://skillswap.buzz/dashboard` + `https://skillswap.buzz/login`
- Google OAuth confirmed working on new domain

### [Session 17 — 2026-04-12]
- **Call back-button bug fixed**: videocall.html uses replaceState+pushState sentinel; popstate intercepted to call endCall(); back_forward nav type detected on load → redirect to dashboard if no active call; all call-end navigations use window.location.replace()
- **callEnded flag**: prevents double-execution of endCall(); hangup/cancelled signal handlers check flag; gracefulFail() wraps all setup errors with try/catch
- **Viewport**: all 12 remaining pages updated to `maximum-scale=1.0, user-scalable=no`; html rule added with `overflow-x:hidden; -webkit-text-size-adjust:100%`
- **Mobile stability**: `touch-action:manipulation` on all buttons/links; `font-size:max(16px,1em)` on all inputs to prevent iOS zoom; 44px min tap targets on mobile; sidebar body-lock (`overflow:hidden`) when open; videocall controls use `position:fixed; bottom:env(safe-area-inset-bottom,20px)`
- **Auth redirects**: all `if(!session)` guards and post-login redirects use `window.location.replace()` — no garbage in history
- **messages.html polish**: send button has disabled+opacity loading state; call start buttons disabled during initiation; error toast on send/call failure; DB-verifies active call status before showing rejoin banner; upgraded empty state to icon+CTA
- **matches.html**: respond() accept/decline buttons show disabled state during async op

### [Session 16 — 2026-04-12]
- Created `call_invites` table in Supabase: RLS policies (insert own, read own, update own), Realtime enabled via `supabase_realtime` publication
- Removed `call_invites` setup from Known Issues — fully live in Supabase
- Updated `call-notify.js` note in CLAUDE.md to reflect table is already set up

### [Session 15 — 2026-04-10]
- Created `input-validation.js`: shared `InputValidator` module with helpers for email, password, name, username, text, url, uuid, roomId, skill, int, price
- login.html: email format + password length cap on login and password-reset flows
- signup.html: email format, password 8–128 chars, first/last name ≤50, username format, bio ≤500; skill tags capped at 80 chars and 20 per array
- profile.html: fullName ≤100, username format, bio ≤500, location ≤100, website https:// URL; skill tags max 80 chars
- messages.html: outgoing message content capped at 5000 chars
- webinars.html: createWebinar validates title ≤200, desc ≤2000, duration 1–480, attendees 1–1000, price $0–9999, date must be future; savePreSession same title/desc checks; attendee chat ≤500 chars
- webinar-host.html: host chat messages capped at 500 chars
- videocall.html: URL param `?room=` validated against roomId format; malformed `?match=` UUID dropped silently
- call-notify.js: inline validators added — roomId format checked before overlay renders; callerName HTML-stripped and capped at 100 chars; callerAvatar must be https://; inviteId/matchId enforced as UUIDs
- XSS hardening (prior session): all user-controlled data rendered via `.textContent` / safe DOM methods across all pages

### [Session 14 — 2026-04-10]
- videocall.html: WhatsApp-style ringing screen for caller (pulsing avatar, "Ringing...", red cancel button); callee auto-starts WebRTC directly (no join screen); iOS fallback join screen if getUserMedia throws NotAllowedError
- Signal events: `accepted` (callee accepted → caller ringing screen → "Connecting..."), `declined` (caller sees "Call declined"), `cancelled` (caller cancelled → callee dismissed), `ended` (call_invites marked on endCall)
- ICE gathering timeout reduced 4s → 2s; `cancelCall()` and `showCallEnded(reason)` added
- call-notify.js: Accept broadcasts `accepted` before navigating; Decline broadcasts `declined`; subscribes to `call-{roomId}` to dismiss overlay if caller cancels; floating `#__ssActivePill` green pill on all pages (top-right, links to rejoin)
- messages.html: `bubbleContent()` wraps call invites in `data-call-room` divs; `updateCallBubbleStatuses()` batch-queries call_invites and patches in ended/declined/cancelled/no-answer state after render
- Bug fix (same session): ringing screen showed double avatar — fixed by making ringing screen background opaque (#000) and hiding waitingBg while ringing
- Bug fix (same session): calls disconnecting due to premature 8s ICE restart firing before callee accepted — moved ICE restart timeout to fire only after offer is sent
- Bug fix (same session): initWebRTC() on reconnect leaked signalChannel + readyInterval — added cleanup of both at the top of initWebRTC()
- Bug fix (same session): call log flickering between "Join Call" and "Call ended" — replaced async DOM-patching with pre-fetch cache (fetchCallStatuses) called before renderMessages(); bubbleContent() now renders final state synchronously

### [Session 13 — 2026-04-09]
- Persistent calls: tab close no longer ends call; `ss_active_call` localStorage key stores call state; Messages shows green "Rejoin" banner for ongoing calls
- Voice call cam-off: `#localCamOff` PiP overlay with initials; waiting bg stays visible in voice-only mode
- Sidebar scrollbar: custom webkit scrollbar on all 9 pages (no white line)
- Desktop hamburger toggle: always visible, collapses sidebar with slide animation, state in `ss_sidebar` localStorage

### [Session 12 — 2026-04-09]
- Messages: separate voice + video call buttons; emoji picker (80+ emojis, cursor-insert); read receipts ("Seen")
- videocall: screen share (replaceTrack), recording (pro/creator, .webm), end redirects to messages, voice-only mode (?voice=1)
- call-notify.js: detects VOICE_ prefix, shows correct overlay title, adds &voice=1 to accept URL

### [Session 11 — 2026-04-08]
- Built webinar-host.html: full-screen host room, named tab, BroadcastChannel dup detection, HUD + controls + 3-tab side panel (participants/chat/raised hands), recording, end webinar with summary modal
- webinars.html: Go Live opens host tab; fallback quick-controls dropdown on live cards; participant chat panel in overlay

### [Session 10 — 2026-04-07]
- webinars.html: replaced Jitsi with built-in WebRTC star-topology; host/participant channels; screen share via replaceTrack; ended webinars filtered; participant redirect on end
- videocall.html: ICE restart on 8s timeout; offer/answer wait for full ICE gather; auto-teardown+retry on failure
- Removed Video Call sidebar nav link from all 9 pages

### [Session 9 — 2026-04-07]
- webinars.html: full host control overlay (pre/live controls, participant panel, raise hand, end with summary)
- analytics.html: 6 stat cards, Chart.js activity chart, skills table, global rank, 8 badges, creator section

### [Session 8 — 2026-04-06]
- Replaced globe on index/login/signup with premium dot-matrix version
- messages.html: mobile input fix (sticky, 100dvh, FAB hides in chat)
- videocall.html: ICE race condition fix (safeSetRemoteDescription, handleIncomingCandidate, state reset)
- call-notify.js: switched from broadcast to call_invites DB table for reliable delivery; polls missed invites on subscribe

### [Sessions 1–7 — 2026-04-01 to 2026-04-06]
- Built all pages from scratch; black/glass design system applied to all
- Replaced Daily.co with custom WebRTC; replaced Jitsi in videocall with WebRTC
- Fixed auth bugs (login, signup, OAuth); Google OAuth + auto-profile creation
- Mobile sidebar fix on all 9 pages; various UX polish across pages