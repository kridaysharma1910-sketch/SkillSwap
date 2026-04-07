# SkillSwap — Project Brain for Claude Code

## What is SkillSwap?
A skill-exchange web platform where users list skills they offer and skills they want, and get matched with others to do a skill swap. Think "I'll teach you guitar, you teach me Spanish."

**Live URL:** https://skill-swap-chi-gules.vercel.app  
**GitHub:** https://github.com/kridaysharma1910-sketch/SkillSwap  
**Supabase Project ID:** vgndpvkywvcnezvjuueq  
**Deployed via:** Vercel (auto-deploy from main branch)

---

## Tech Stack
- **Frontend:** Plain HTML, CSS, Vanilla JS (no framework)
- **Backend:** Supabase (auth + database)
- **Video Calls:** Custom WebRTC + Supabase Realtime signaling (no third-party services)
- **Payments:** Lemon Squeezy / Paddle
- **Deployment:** Vercel

---

## Supabase DB Tables (all created and live as of session 4)
- `profiles` — id, full_name, username, bio, location, website, avatar_url, avatar_emoji, plan, rating, rank, rewards[], skills_offering[], skills_wanting[], skills_offered[], skills_wanted[], hours_per_week, session_format, updated_at
- `matches` — id, sender_id → profiles, receiver_id → profiles, status (pending/accepted/rejected/completed), skill_offered, skill_wanted, created_at, updated_at
- `messages` — id, match_id → matches, sender_id → profiles, content, read, created_at
- `sessions` — id, match_id → matches, user_id → profiles, partner_id → profiles, duration_minutes, skill_taught, skill_learned, completed_at
- `webinars` — id, host_id → profiles, title, description, category, cover_emoji, jitsi_room, is_free, price, scheduled_at, duration_minutes, max_attendees, attendee_count, earnings, is_live, status, created_at
- `webinar_attendees` — id, webinar_id → webinars, user_id → profiles, paid, amount_paid, joined_at
- `analytics` — id, user_id → profiles (unique), skills_taught_count, skills_learned_count, total_video_minutes, webinars_watched, webinars_hosted, total_earnings, global_rank, updated_at
- Storage bucket: `avatars` (public) — stores profile photos at `{user_id}/avatar.{ext}`

---

## Pricing Tiers
- Free — $0
- Pro — $9/month
- Creator — $19/month

---

## Pages Status

| Page | File | Status |
|------|------|--------|
| Landing | index.html | ✅ Done — hero, globe, marquee, full black/glass redesign |
| Sign Up | signup.html | ✅ Done — Supabase auth, upsert profile, black/glass redesign |
| Login | login.html | ✅ Done — auth fixed, social proof panel, globe, black/glass redesign |
| Dashboard | dashboard.html | ✅ Done — real Supabase data, stats, plan gating, analytics section |
| Profile | profile.html | ✅ Done — avatar upload + emoji, tag input, live preview, upsert |
| Discover | discover.html | ✅ Done — real users, match scoring, send requests, filters |
| Matches | matches.html | ✅ Done — 4 tabs, accept/decline/complete, message + call links |
| Messages | messages.html | ✅ Done — real-time chat, Supabase subscriptions, URL auto-open |
| Video Call | videocall.html | ✅ Done — WebRTC P2P, ICE restart/retry, offer/answer wait-for-ICE-gathering, auto-reconnect on failure |
| Pricing | pricing.html | ✅ Done — Free/Pro/Creator features, Supabase plan update, toggle |
| Webinars | webinars.html | ✅ Done — host overlay, built-in WebRTC participant system (star topology), ended webinars filtered, participants redirect on end |
| Analytics | analytics.html | ✅ Done — 6 stat cards, activity chart, skills table, badges grid, rank, creator section |

---

## Build Priority Order
1. profile.html
2. discover.html
3. matches.html
4. messages.html
5. videocall.html
6. pricing.html
7. webinars.html

---

## Code Conventions
- Pure HTML/CSS/JS — no frameworks, no build tools
- Supabase JS client loaded via CDN
- Each page handles its own auth check (redirect to login if not logged in)
- Keep styles consistent with existing pages (same fonts, colors, button styles)
- All Supabase calls use async/await

---

## Session Log
<!-- Claude Code appends to this after every session -->

### [Session 1 — 2026-04-01]
- Discovered `dashboard.html` was missing despite being marked ✅ in CLAUDE.md — rebuilt it
- Built `dashboard.html`: sidebar nav, stat cards (skills offered/wanted/active matches), recent matches list, skills tags, profile completion banner, quick actions
- Built `profile.html`: emoji avatar picker, full/username/bio/location/website fields, tag-input for skills offered/wanted, availability selectors, live profile preview, Supabase upsert
- Built `discover.html`: search + filter bar, match-score algorithm, user cards grid, skeleton loading, send swap request (inserts into `matches` table), load-more pagination
- Built `matches.html`: 4-tab layout (Pending/Active/Sent/Completed), accept/decline/complete actions updating `matches.status` in Supabase
- Built `messages.html`: full chat UI with conversation list, real-time messaging via Supabase `postgres_changes` subscription, date dividers, auto-resize textarea
- Built `videocall.html`: Jitsi Meet embedded via iframe, call active matches directly (deterministic room name), random room generator, end-call overlay
- Built `pricing.html`: Free/$9 Pro/$19 Creator tiers, monthly/annual billing toggle (20% off), FAQ accordion, current plan detection from `profiles.plan`
- Built `webinars.html`: live/upcoming/recorded sections, host modal (Creator-gated), register/join/remind actions, Jitsi join for live sessions, demo fallback data
- All pages share same sidebar nav, color system, font stack, custom cursor, and auth guard pattern

### [Session 2 — 2026-04-01]
- Fixed `login.html` signin bug: `showAlert` was relying on CSS class specificity to unhide the alert box — now sets `style.display = 'flex'` inline so errors always show
- Fixed `hideAlert` to explicitly set `style.display = 'none'` to reset cleanly
- Added `data.session` guard before `window.location.href = 'dashboard.html'` — Supabase v2 can return `{ session: null, error: null }` when email is unconfirmed; previously this caused a silent redirect loop back to login
- All fixes committed and pushed to main (Vercel auto-deployed)

### [Session 3 — 2026-04-03]
- Redesigned `login.html` UI: sticky navbar (Syne logo + white square), 2-column grid layout (social proof left / form right), cyan+violet orbs, animated badge, "Welcome back." solid + "Keep swapping." outline heading, 3 glass stat cards with hover glow, recent activity card (3 rows with avatars + colored tags), rotating globe canvas (R=125, bottom-right, opacity 0.5), white submit button (no purple), violet-glow input focus, custom "Remember me" checkbox, custom cursor (`#ss-cursor` / `#ss-ring`), all Supabase logic preserved unchanged
- Fixed `dashboard.html` logout button: old button was a tiny `↪` icon in near-invisible muted color — replaced with full-width "↪ Sign out" button (red tint, border, always visible at bottom of sidebar); also fixed sidebar `height: 100vh` + `overflow-y: auto` so bottom of sidebar is never clipped
- Fixed `dashboard.html` logout redirect: was sending to `login.html`, now sends to `index.html` (front page)
- Fixed `signup.html` auth bug: profiles were written with `.update().eq('id', ...)` which silently fails if no row exists — changed to `.upsert({ id: data.user.id, ... })`
- Fixed `login.html` auth bug: removed `if (!data.session)` block that was incorrectly blocking valid logins — replaced with `if (data.user)` redirect per Supabase v2 pattern
- Added `console.log` on signup error, profile upsert error, and login error for easier debugging
- Diagnosed persistent "Invalid login credentials" 400 error — root cause is Supabase **email confirmation enabled**: users sign up but cannot log in until they confirm their email. Fix: Supabase Dashboard → Authentication → Providers → Email → toggle "Confirm email" OFF

### [Session 4 — 2026-04-04]
- Redesigned `profile.html` to black/glass system: SVG sidebar icons, avatar photo upload (Supabase storage) + emoji picker, mobile-friendly "Add" button for skill tag inputs, saves to both `skills_offering`/`skills_wanting` and legacy `skills_offered`/`skills_wanted` columns, logout goes to index.html
- Redesigned `pricing.html` to black/glass system: updated plan features (Free 7days/Pro unlimited+analytics/Creator+webinar hosting+earnings), Supabase plan update on click, billing toggle (20% off), FAQ accordion, plan button states reflect current plan
- Redesigned `webinars.html` to black/glass system: real Supabase data, filter by live/upcoming/recorded, creator-gated host modal (free/paid toggle), attendee registration in webinar_attendees table, Jitsi join for live sessions
- Redesigned `videocall.html` to black/glass system: session logging to `sessions` table on `endCall()` and `beforeunload`, live call timer, auto-start from URL `?match=` param, fixed match queries to use `sender_id`/`receiver_id`
- Created `analytics.html`: new page gated to pro/creator, stats pulled from `sessions` + `analytics` tables, global rank with progress bar, rewards system (4 badges), creator section with webinar earnings
- Updated all pages: SVG-only icons (no emojis in UI), consistent sidebar with analytics link shown/hidden by plan, logout goes to index.html
- Ran full SQL schema in Supabase SQL editor — all tables created, RLS policies enabled, all tables live
- CLAUDE.md updated: pages status, known issues, session log

### [Session 5 — 2026-04-05]
- Fixed mobile sidebar on ALL 9 pages (dashboard, discover, matches, messages, profile, pricing, webinars, videocall, analytics): added `#sidebar-overlay` div (rgba(0,0,0,0.85) + backdrop-filter:blur(4px), z-index:98), forced sidebar `background:#0e0e0e` on mobile, `.nav-link` color:#fff/opacity:1 in mobile media query, overlay toggles with sidebar open/close
- Fixed messages.html (Issue 2): added 3-second polling fallback (`setInterval` every 3s calls `loadMessages`), re-fetch after `sendMessage` insert, `console.error` on every Supabase error, never crashes on null data, CALL_INVITE:: messages render as "Join Call" button linking to `videocall.html?room=`, video call button now creates a Daily.co room and sends CALL_INVITE message
- Replaced Jitsi with Daily.co on videocall.html (Issue 3): complete rewrite — reads `?room=` URL param, loads Daily Prebuilt iframe fullscreen, shows "No call in progress" state if no room param, keeps call timer + session logging to `sessions` table on end/unload, sidebar fixed mobile
- Updated matches.html (Issue 3): "Call" button replaced with "Start Call" button that creates Daily.co room via API POST, inserts `CALL_INVITE::{url}` message to partner, then redirects caller to `videocall.html?room={url}`
- Daily.co API key stored in DAILY_API_KEY constant in matches.html and messages.html

### [Session 8 — 2026-04-06]
- Replaced globe canvas code on index.html, login.html, signup.html with premium dot-matrix version: 900+ explicit land coordinates across all continents, animated connection arcs with moving dots, pulsing nodes — ran via `_replace_globe.js` Node script
- Fixed 3 critical bugs across messages.html, matches.html, videocall.html, and call-notify.js (details below)

**Bug 1 — Mobile message input hidden / FAB blocking send button (messages.html):**
- Root cause: `.compose-fab` had `display:flex !important` in mobile CSS so JS `style.display='none'` was silently ignored; FAB was fixed at bottom-right directly over the send button
- Removed `!important` from compose-fab mobile rule so JS can override it
- `openConvo()` now hides FAB with `style.display='none'` on mobile; `backToConvosList()` restores it
- `.chat-panel` mobile height changed to `-webkit-fill-available` + `100dvh` (iOS address-bar clipped the input with `height:100vh` + `overflow:hidden`)
- `.chat-input-wrap` made `position:sticky; bottom:0` with `env(safe-area-inset-bottom)` padding so input stays above iOS home bar

**Bug 2 — WebRTC stuck on "Waiting for partner" / ICE race condition (videocall.html):**
- Root cause: `iceCandidateQueue`, `remoteDescSet`, `offerSent` were never reset between `initWebRTC()` calls — stale state caused ICE candidates to be applied before `setRemoteDescription()`
- Added state reset (`iceCandidateQueue=[]`, `remoteDescSet=false`, `offerSent=false`) at top of `initWebRTC()`
- Replaced `drainIceCandidates()` with `safeSetRemoteDescription(sdp)`: sets remote desc then atomically flushes buffered candidates
- Added `handleIncomingCandidate(data)`: buffers candidates if remote desc not yet set
- Both offer and answer handlers now use `safeSetRemoteDescription()`; ICE handler uses `handleIncomingCandidate()`
- `connectionState === 'failed'` now shows specific "Connection failed" message

**Bug 3 — Incoming call notification never fires (call-notify.js + matches.html + messages.html):**
- Root cause: Realtime broadcast is fire-and-forget — if receiver's subscription wasn't active when caller sent the event, it was permanently lost
- `broadcastCallInvite()` in matches.html and messages.html now inserts a row into `call_invites` table instead of broadcasting
- `call-notify.js` subscribes to `postgres_changes INSERT` on `call_invites` filtered by `callee_id` — DB row persists so event is delivered even if subscription set up just after insert
- On subscribe, polls last 60 seconds for missed pending invites (handles page-load race)
- Accept updates `status='accepted'` in DB then navigates to videocall.html; Decline sets `status='declined'`; auto-expire after 30s sets `status='expired'`
- `call-notify.js` included on all 8 authenticated pages (dashboard, discover, matches, messages, profile, pricing, webinars, analytics); NOT on videocall.html

**call_invites table — must be created in Supabase SQL editor:**
```sql
create table if not exists call_invites (
  id uuid default gen_random_uuid() primary key,
  room_id text not null,
  match_id uuid references matches(id),
  caller_id uuid references profiles(id),
  callee_id uuid references profiles(id),
  caller_name text,
  caller_avatar text,
  status text default 'pending',
  created_at timestamptz default now()
);
alter table call_invites enable row level security;
create policy "insert own" on call_invites for insert to authenticated
  with check (caller_id = auth.uid());
create policy "read own" on call_invites for select to authenticated
  using (callee_id = auth.uid() or caller_id = auth.uid());
create policy "update own" on call_invites for update to authenticated
  using (callee_id = auth.uid() or caller_id = auth.uid());
-- Also enable Realtime for this table:
alter publication supabase_realtime add table call_invites;
```

### [Session 10 — 2026-04-07]

**FIX 1 — Webinar built-in WebRTC participant system (webinars.html):**
- Replaced Jitsi `window.open` with a full-screen built-in participant overlay (star topology: each participant connects to HOST only)
- Participant overlay: host video fullscreen, own camera PiP bottom-right, mic/cam/leave controls, status pill, waiting state with spinner
- Two Supabase Realtime channels per webinar: `webinar_ctrl:{id}` (existing — mute/kick/end commands) and new `webinar_rtc:{id}` (WebRTC signaling only)
- Host side: `enterHostMode()` now subscribes to `webinar_rtc` channel; `handleParticipantJoin()` creates one `RTCPeerConnection` per participant, adds host stream tracks, sends offer after ICE gathering completes
- Host tracks `participantPCs`, `participantIceQueues`, `participantRemoteDescSet` maps per participant userId
- Screen share: when host starts/stops `getDisplayMedia`, `replaceTrack()` is called on all participant peer connections to switch the video track live
- `endWebinar()` closes all participant PCs and removes `wrtcHostChannel`; `wrtcHostChannel` is also stored in globals alongside `hostChannel`
- Participant side: `joinWebinarLive(id, title)` gets local media, subscribes to `webinar_rtc` channel, sends `{event:'join', payload:{userId, name}}`, receives `offer_to_participant`, creates answer after ICE gathering, sends answer back
- Participant `leaveWebinar(redirect, delay)` cleans up PC + stream + channel; called on Leave button or when kicked/ended
- Ended webinars filtered from listing: `.neq('status','ended')` added to `loadWebinars()` Supabase query
- `end_webinar` host command now calls `leaveWebinar(true, 3000)` — redirects to webinars.html after 3s (was just `loadWebinars()`)
- `mute_all` host command disables participant's local audio tracks directly via `participantStream.getAudioTracks()`
- ICE_SERVERS config (STUN + openrelay TURN) added to webinars.html, same as videocall.html
- `myName` global added and set in `init()` so participant join payload includes user's display name

**FIX 2 — Video call reliability (videocall.html):**
- Fix A — ICE restart on timeout: 8s `connectionTimeout` added after `RTCPeerConnection` creation; if not connected by then, caller creates a new offer with `{iceRestart:true}` and re-sends it; timeout cleared on `connectionState='connected'`
- Fix B — Bundle candidates in SDP: added `createOfferAndWaitForICE()` and `createAnswerAndWaitForICE()` helpers that wait for `iceGatheringState==='complete'` (4s max fallback) before returning `localDescription`; used in both the `ready` handler (caller) and `offer` handler (callee) — fixes mobile first-try failures caused by unreliable trickle ICE
- Fix C — Reset on failure: `connectionState='failed'` now closes and nulls `pc`, resets `remoteDescSet`/`iceCandidateQueue`/`offerSent`, shows "Reconnecting..." and calls `initWebRTC()` after 1.5s instead of leaving the call stuck

**FIX 3 — Remove Video Call sidebar nav link (all 9 pages):**
- Removed `<a href="videocall.html">Video Call</a>` from sidebar in: dashboard, discover, matches, messages, profile, pricing, webinars, videocall, analytics
- videocall.html itself is unchanged — still accessible from Messages chat header call button

### [Session 9 — 2026-04-07]

**FIX 1 — Webinar Host Controls (webinars.html):**
- Hosts now see a "Your Webinar" badge on their cards + host-specific action buttons
- Pre-session (upcoming): "Edit" opens settings modal (title, description, date, allow-unmute toggle, require-registration toggle) with Supabase update on save; "Go Live" sets `is_live=true, status='live'` in Supabase then opens host overlay
- Full-screen Host Control Overlay: live timer, local camera preview via `getUserMedia`, control bar with Mute/Camera/Screen Share (`getDisplayMedia`)/Mute All buttons
- Participants panel: loads all `webinar_attendees` joined with profiles; each attendee has a kick button that broadcasts `{cmd:'kick', target_user_id}` via Supabase Realtime channel `webinar_ctrl:{id}`
- Raise Hand panel: attendees can broadcast `raise_hand` events; host sees queue with "Call On" button per attendee; `called_on` command broadcast back
- End Webinar: confirmation → broadcasts `{cmd:'end_webinar'}` → updates DB (`status='ended', is_live=false, attendee_count=N`) → shows post-session summary modal (duration, total attendees, earnings estimate) → on close reloads webinar list
- Attendee side: `subscribeAttendeeToWebinar(id)` subscribes to `webinar_ctrl:{id}` channel on Join Live (and auto-subscribes to all live webinars on page load); receives `mute_all`, `kick`, `end_webinar` commands and shows appropriate toast / reloads
- When host is live and revisits the webinars page, "Host Controls" button on live card re-opens overlay

**FIX 2 — Analytics Dashboard (analytics.html) — completed from session 8:**
- 6 overview stat cards: Swaps Completed, Active Matches, Hours Swapped, Skills Taught, Messages Sent, Match Response Rate — all pulled from Supabase in parallel via `Promise.all`
- Activity chart: Chart.js bar chart showing sessions per day over last 30 days
- Skills analytics section: table of offered skills with request count, completion count, completion %, mini progress bar; highlights most-requested skill; tip shown for skills with 0 activity
- Messages & Engagement card: conversations started, messages sent, response rate with explanation
- Global ranking: rank number, rank title, percentile bar, points breakdown grid (swaps × 10 pts, hours × 5 pts, webinars × 2 pts, matches × 1 pt)
- Achievements grid: 8 badges (First Swap, Active Learner, Swap Master, Dedicated, Hour Hero, Social Butterfly, Knowledge Seeker, Top Ranker) — unlocked badges glow, locked ones show progress bar + fraction
- Creator section (creator plan only): 5 stat cards + best-performing webinar card

### [Session 7 — 2026-04-06]
- Added Google OAuth sign-in to login.html and signup.html (both pages already had the button, divider, CSS, and `signInWithGoogle()` wired to `supabase.auth.signInWithOAuth`)
- Fixed dashboard.html to auto-create a profile row for new Google OAuth users on first login: detects `PGRST116` (no row), upserts with `plan: 'free'`, empty skills arrays, and pulls `full_name` + `avatar_url` from Google user metadata
- Google OAuth setup required in Supabase: Authentication → Providers → Google → enable + paste Client ID & Secret
- Google Cloud Console redirect URI required: `https://vgndpvkywvcnezvjuueq.supabase.co/auth/v1/callback`

### [Session 6 — 2026-04-05]
- Replaced Daily.co with custom WebRTC + Supabase Realtime signaling in videocall.html — zero third-party services, fully free
- Signaling flow: Supabase channel `call-{roomId}` used for offer/answer/ICE candidate exchange via broadcast events; caller retries `ready` ping every 2s until callee responds
- Room ID is a random alphanumeric string (genRoomId); stored in messages table as `CALL_INVITE::{roomId}`, callee joins via `?room={roomId}&match={matchId}`, caller passes `&caller=1`
- STUN servers: stun.l.google.com:19302 + stun1.l.google.com:19302 (free, no auth)
- videocall.html UI: remote video fullscreen bg, local video PiP bottom-right, glass control bar (mute/cam/end), live dot + timer in top HUD, waiting avatar while connecting, status pill overlay, partner disconnected detection
- Updated matches.html: `startDailyCall` → `startWebRTCCall` (generates roomId, inserts CALL_INVITE message, redirects with caller=1)
- Updated messages.html: `startCallFromMessages` uses genRoomId, `bubbleContent` passes matchId + caller param to join links

## UI Design System (Updated)

### Design Theme
- Full black aesthetic: background #080808 everywhere
- Font stack: Syne (headings/logo, 800 weight) + DM Sans (body/inputs, 300-500)
- Custom cursor: 10px white dot (mix-blend-mode: difference) + 34px trailing ring, both fixed positioned, turns purple on hover
- No purple buttons anywhere — all CTAs are white bg + #080808 text
- Subtle violet (rgba(139,92,246)) and cyan (rgba(34,211,238)) used ONLY as border accents, tag colors, focus glows, and orbs

### CSS Variables (use in all pages)
--bg: #080808
--bg-card: rgba(255,255,255,0.03)
--border: rgba(255,255,255,0.08)
--border-hover: rgba(139,92,246,0.3)
--text-muted: rgba(255,255,255,0.32)
--accent-v-soft: rgba(167,139,250,0.65)
--accent-c-soft: rgba(103,232,249,0.6)

### Glass Card System (apply to ALL cards sitewide)
- background: rgba(255,255,255,0.03)
- border: 1px solid rgba(255,255,255,0.08)
- border-radius: 18px
- backdrop-filter: blur(12px)
- On hover: border-color → rgba(139,92,246,0.3), transform: translateY(-3px)
- ::before pseudo on hover: top 1px gradient glow (transparent → rgba(139,92,246,0.6) → transparent)

### Colored Tags (use on all cards)
- Violet tag: border rgba(139,92,246,0.35), color rgba(167,139,250,0.7)
- Cyan tag: border rgba(34,211,238,0.28), color rgba(103,232,249,0.65)
- White/dim tag: border rgba(255,255,255,0.18), color rgba(255,255,255,0.42)
- All tags: border-radius 100px, padding 3px 10px, font-size 10px

### Globe (rotating world, canvas-based)
- Drawn with vanilla JS Canvas API
- Continent outlines as lat/lon polygon arrays, filled rgba(139,92,246,0.12), stroked rgba(167,139,250,0.32)
- Latitude + longitude grid lines at rgba(255,255,255,0.04)
- Scattered nodes (violet, cyan, white) with connection lines
- Rotates continuously at ~0.003-0.004 rad/frame
- index.html: large globe (R=220) centered behind hero text, smaller globe (R=160) right side in "How it works"
- signup.html: globe (R=145) bottom-right of left panel, opacity 0.7
- login.html: globe (R=125) bottom-right of form panel, opacity 0.5

### Pages completed
- index.html ✅ — full redesign done (hero, globe, marquee, skills tags, step cards, feature cards, CTA, footer)
- signup.html ✅ — full redesign done (split layout, globe, glass cards, form inputs, skill tags, plan cards)
- login.html ✅ — full redesign done (navbar, 2-col grid, social proof left panel, globe bottom-right, white button, custom cursor)
- dashboard.html ✅ — real Supabase data, stats, matches, skills, analytics section, plan gating
- discover.html ✅ — real Supabase users, match scoring, send match requests, filters
- matches.html ✅ — pending/sent/active/completed tabs, accept/decline/complete, message + call buttons; "Start Call" generates roomId, sends CALL_INVITE, redirects caller
- messages.html ✅ — real-time chat + 3s polling fallback, CALL_INVITE:: renders as "Join Call" button, video call icon starts WebRTC room from chat header
- profile.html ✅ — black/glass redesign, avatar photo upload + emoji picker, mobile Add button, save to skills_offering/wanting
- pricing.html ✅ — black/glass redesign, updated Free/Pro/Creator features, Supabase plan update on selection
- webinars.html ✅ — host overlay, built-in WebRTC star-topology participant view, ended webinars filtered, participant redirect on end, screen share via replaceTrack
- videocall.html ✅ — WebRTC P2P, ICE restart on timeout, offer/answer bundled after ICE gathering, auto-teardown+reconnect on failure
- analytics.html ✅ — new page, pro/creator gate, stats from sessions + analytics tables, global rank, rewards, creator section

### Mobile Sidebar (all pages)
All 9 sidebar pages (dashboard, discover, matches, messages, profile, pricing, webinars, videocall, analytics) have:
- `#sidebar-overlay` div: rgba(0,0,0,0.85) + backdrop-filter:blur(4px), z-index:98, closes sidebar on tap
- Mobile sidebar: background:#0e0e0e (solid, not glassy), border-right:1px solid rgba(255,255,255,0.1)
- `.sidebar .nav-link` in mobile media query: color:#fff, opacity:1
- `toggleSidebar()` toggles both `.open` on sidebar and `.show` on overlay

### Pages pending UI update
(none — all pages now use black/glass design system)

### Input Style (all pages)
- background: rgba(255,255,255,0.04)
- border: 1px solid rgba(255,255,255,0.09)
- border-radius: 12px
- padding: 12px 16px
- color: #fff
- On focus: border-color rgba(139,92,246,0.45), background rgba(139,92,246,0.04), box-shadow 0 0 0 3px rgba(139,92,246,0.08)

### Navbar (all pages)
- background: rgba(8,8,8,0.94), backdrop-filter: blur(20px)
- border-bottom: 1px solid rgba(255,255,255,0.07)
- position: sticky, top: 0, z-index: 50
- Logo: Syne 800 + 9×9px white square (border-radius 2px) before text
- All nav CTAs: white bg, dark text, pill shape — no purple

---

## Known Issues / Next Steps
- Payment integration (Lemon Squeezy / Paddle) not yet wired — `selectPlan()` updates Supabase directly (no payment flow yet)
- ✅ SQL schema run in Supabase — all tables created, RLS enabled (done session 4)
- Storage bucket `avatars` must be created in Supabase dashboard for avatar uploads to work
- Realtime must be enabled in Supabase dashboard for `messages` table (for live chat to work)
- **Email confirmation must be DISABLED** in Supabase (Authentication → Providers → Email → "Confirm email" OFF)
- ✅ Google OAuth enabled (session 7) — Supabase Google provider configured, dashboard.html auto-creates profile on first OAuth login
- `profiles` uses both `skills_offering`/`skills_wanting` (new) and `skills_offered`/`skills_wanted` (legacy) — profile.html saves to both for backwards compatibility
- videocall.html logs sessions on `endCall()` + `beforeunload` via Supabase insert (no sendBeacon)
- ✅ TURN servers added (session 8) — openrelay.metered.ca on ports 80/443/443-tcp; mobile NAT traversal now covered
- ✅ ICE candidate race condition fixed (session 8) — safeSetRemoteDescription + handleIncomingCandidate with buffering
- ✅ Incoming call notifications (session 8) — call_invites table + postgres_changes; **call_invites table must be created in Supabase** (SQL in session 8 log) and Realtime enabled for it
- ✅ Mobile message input fixed (session 8) — sticky input, 100dvh height, FAB hides when chat open
- `call_invites` Realtime must be enabled: `alter publication supabase_realtime add table call_invites;`
- ✅ Video call reliability fixed (session 10) — ICE restart on 8s timeout, offer/answer wait for full ICE gathering, auto-teardown+retry on failed state
- ✅ Webinar participant system replaced (session 10) — Jitsi removed, built-in WebRTC star topology; signaling on `webinar_rtc:{id}` channel
- ✅ Sidebar "Video Call" nav link removed from all 9 pages (session 10) — access only via Messages chat header

---

## 🚀 Session Start Prompt — paste this into Claude Code at the start of every session
```
Read CLAUDE.md in the project root first. That file is the source of truth for this project.

Your job is to continue building SkillSwap — a skill-exchange web platform. The stack is plain HTML/CSS/Vanilla JS with Supabase as the backend.

Rules for this session:
1. Build pages in the priority order listed in CLAUDE.md
2. Pick up from wherever the status table says (first ⬜ page = what to build next)
3. After every meaningful change or completed page, run: git add . && git commit -m "descriptive message"
4. Keep code consistent with the existing pages in style and structure
5. At the END of this session, update the CLAUDE.md Session Log with what was done today, and update the status table for any pages completed

Start by telling me: what's the current status per CLAUDE.md, and what are you going to build this session?