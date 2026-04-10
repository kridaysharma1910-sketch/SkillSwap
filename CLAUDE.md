# SkillSwap — Claude Code Context

## Project
Skill-exchange platform: users list skills they offer/want, get matched, swap sessions.

**Live:** https://skill-swap-chi-gules.vercel.app  
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
- `matches` — id, sender_id→profiles, receiver_id→profiles, status (pending/accepted/rejected/completed), skill_offered, skill_wanted, created_at, updated_at
- `messages` — id, match_id→matches, sender_id→profiles, content, read, created_at
- `sessions` — id, match_id→matches, user_id→profiles, partner_id→profiles, duration_minutes, skill_taught, skill_learned, completed_at
- `webinars` — id, host_id→profiles, title, description, category, cover_emoji, jitsi_room, is_free, price, scheduled_at, duration_minutes, max_attendees, attendee_count, earnings, is_live, status, created_at
- `webinar_attendees` — id, webinar_id→webinars, user_id→profiles, paid, amount_paid, joined_at
- `analytics` — id, user_id→profiles (unique), skills_taught_count, skills_learned_count, total_video_minutes, webinars_watched, webinars_hosted, total_earnings, global_rank, updated_at
- `call_invites` — id, room_id, match_id→matches, caller_id→profiles, callee_id→profiles, caller_name, caller_avatar, status (pending/accepted/declined/expired), created_at
- Storage: `avatars` bucket (public) — `{user_id}/avatar.{ext}`

---

## Pages

| Page | File | Status |
|------|------|--------|
| Landing | index.html | ✅ |
| Sign Up | signup.html | ✅ |
| Login | login.html | ✅ |
| Dashboard | dashboard.html | ✅ |
| Profile | profile.html | ✅ |
| Discover | discover.html | ✅ |
| Matches | matches.html | ✅ |
| Messages | messages.html | ✅ |
| Video Call | videocall.html | ✅ |
| Pricing | pricing.html | ✅ |
| Webinars | webinars.html | ✅ |
| Analytics | analytics.html | ✅ |
| Webinar Host Room | webinar-host.html | ✅ |

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
- All 9 sidebar pages share same sidebar pattern with `#sidebar-overlay` for mobile

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
- **Requires:** `call_invites` table created + Realtime enabled (SQL in Known Issues section)

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

---

## Known Issues / Pending
- **Payment not wired** — `selectPlan()` updates Supabase directly, no Lemon Squeezy/Paddle flow yet
- `call_invites` table must be created manually in Supabase SQL editor:
```sql
create table if not exists call_invites (
  id uuid default gen_random_uuid() primary key,
  room_id text not null,
  match_id uuid references matches(id),
  caller_id uuid references profiles(id),
  callee_id uuid references profiles(id),
  caller_name text, caller_avatar text,
  status text default 'pending',
  created_at timestamptz default now()
);
alter table call_invites enable row level security;
create policy "insert own" on call_invites for insert to authenticated with check (caller_id = auth.uid());
create policy "read own" on call_invites for select to authenticated using (callee_id = auth.uid() or caller_id = auth.uid());
create policy "update own" on call_invites for update to authenticated using (callee_id = auth.uid() or caller_id = auth.uid());
alter publication supabase_realtime add table call_invites;
```
- `avatars` storage bucket must be created in Supabase dashboard
- Realtime must be enabled for `messages` table in Supabase dashboard
- `#hostOverlay` in webinars.html is dead code (replaced by webinar-host.html) — safe to remove
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

### [Session 14 — 2026-04-10]
- videocall.html: WhatsApp-style ringing screen for caller (pulsing avatar, "Ringing...", red cancel button); callee auto-starts WebRTC directly (no join screen); iOS fallback join screen if getUserMedia throws NotAllowedError
- Signal events: `accepted` (callee accepted → caller ringing screen → "Connecting..."), `declined` (caller sees "Call declined"), `cancelled` (caller cancelled → callee dismissed), `ended` (call_invites marked on endCall)
- ICE gathering timeout reduced 4s → 2s; `cancelCall()` and `showCallEnded(reason)` added
- call-notify.js: Accept broadcasts `accepted` before navigating; Decline broadcasts `declined`; subscribes to `call-{roomId}` to dismiss overlay if caller cancels; floating `#__ssActivePill` green pill on all pages (top-right, links to rejoin)
- messages.html: `bubbleContent()` wraps call invites in `data-call-room` divs; `updateCallBubbleStatuses()` batch-queries call_invites and patches in ended/declined/cancelled/no-answer state after render

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