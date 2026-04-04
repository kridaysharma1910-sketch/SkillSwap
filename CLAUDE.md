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
- **Video Calls:** Jitsi (to be integrated)
- **Payments:** Lemon Squeezy / Paddle
- **Deployment:** Vercel

---

## Supabase DB Tables
- `profiles` — user profile data (skills offered, skills wanted, bio, etc.)
- `matches` — match records between two users
- `messages` — chat messages between matched users
- `webinars` — webinar/session listings

---

## Pricing Tiers
- Free — $0
- Pro — $9/month
- Creator — $19/month

---

## Pages Status

| Page | File | Status |
|------|------|--------|
| Landing | index.html | ✅ Frontend done, needs polish |
| Sign Up | signup.html | ✅ Frontend done, Supabase auth working (creates profile) |
| Login | login.html | ✅ UI redesigned + auth fixed — white button, globe, social proof panel, upsert fix |
| Dashboard | dashboard.html | ✅ Frontend done, pulls real Supabase data |
| Profile | profile.html | ✅ Done — avatar picker, tag input, live preview, Supabase upsert |
| Discover | discover.html | ✅ Done — search, filters, match scoring, swap request sending |
| Matches | matches.html | ✅ Done — pending/active/sent/completed tabs, accept/decline/complete |
| Messages | messages.html | ✅ Done — real-time chat, conversation list, Supabase subscriptions |
| Video Call | videocall.html | ✅ Done — Jitsi integration, match calling, room generator |
| Pricing | pricing.html | ✅ Done — 3-tier plans, billing toggle, FAQ accordion |
| Webinars | webinars.html | ✅ Done — live/upcoming/recorded, host modal, Jitsi join |

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

### [Session 4 — 2026-04-04]
- Redesigned `profile.html` to black/glass system: SVG sidebar icons, avatar photo upload (Supabase storage) + emoji picker, mobile-friendly "Add" button for skill tag inputs, saves to both `skills_offering`/`skills_wanting` and legacy `skills_offered`/`skills_wanted` columns, logout goes to index.html
- Redesigned `pricing.html` to black/glass system: updated plan features (Free 7days/Pro unlimited+analytics/Creator+webinar hosting+earnings), Supabase plan update on click, billing toggle (20% off), FAQ accordion, plan button states reflect current plan
- Redesigned `webinars.html` to black/glass system: real Supabase data, filter by live/upcoming/recorded, creator-gated host modal (free/paid toggle), attendee registration in webinar_attendees table, Jitsi join for live sessions
- Redesigned `videocall.html` to black/glass system: session logging to `sessions` table on `endCall()` and `beforeunload`, live call timer, auto-start from URL `?match=` param, fixed match queries to use `sender_id`/`receiver_id`
- Created `analytics.html`: new page gated to pro/creator, stats pulled from `sessions` + `analytics` tables, global rank with progress bar, rewards system (4 badges), creator section with webinar earnings
- Updated all pages: SVG-only icons (no emojis in UI), consistent sidebar with analytics link shown/hidden by plan, logout goes to index.html
- CLAUDE.md updated: pages status, known issues, session log

### [Session 3 — 2026-04-03]
- Redesigned `login.html` UI: sticky navbar (Syne logo + white square), 2-column grid layout (social proof left / form right), cyan+violet orbs, animated badge, "Welcome back." solid + "Keep swapping." outline heading, 3 glass stat cards with hover glow, recent activity card (3 rows with avatars + colored tags), rotating globe canvas (R=125, bottom-right, opacity 0.5), white submit button (no purple), violet-glow input focus, custom "Remember me" checkbox, custom cursor (`#ss-cursor` / `#ss-ring`), all Supabase logic preserved unchanged
- Fixed `dashboard.html` logout button: old button was a tiny `↪` icon in near-invisible muted color — replaced with full-width "↪ Sign out" button (red tint, border, always visible at bottom of sidebar); also fixed sidebar `height: 100vh` + `overflow-y: auto` so bottom of sidebar is never clipped
- Fixed `dashboard.html` logout redirect: was sending to `login.html`, now sends to `index.html` (front page)
- Fixed `signup.html` auth bug: profiles were written with `.update().eq('id', ...)` which silently fails if no row exists — changed to `.upsert({ id: data.user.id, ... })`
- Fixed `login.html` auth bug: removed `if (!data.session)` block that was incorrectly blocking valid logins — replaced with `if (data.user)` redirect per Supabase v2 pattern
- Added `console.log` on signup error, profile upsert error, and login error for easier debugging
- Diagnosed persistent "Invalid login credentials" 400 error — root cause is Supabase **email confirmation enabled**: users sign up but cannot log in until they confirm their email. Fix: Supabase Dashboard → Authentication → Providers → Email → toggle "Confirm email" OFF

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
- matches.html ✅ — pending/sent/active/completed tabs, accept/decline/complete, message + call buttons
- messages.html ✅ — real-time chat, conversation list, Supabase subscriptions
- profile.html ✅ — black/glass redesign, avatar photo upload + emoji picker, mobile Add button, save to skills_offering/wanting
- pricing.html ✅ — black/glass redesign, updated Free/Pro/Creator features, Supabase plan update on selection
- webinars.html ✅ — black/glass redesign, real Supabase data, filter by status, creator gating, attendee registration
- videocall.html ✅ — black/glass redesign, session logging to sessions table, live call timer, auto-start from URL param
- analytics.html ✅ — new page, pro/creator gate, stats from sessions + analytics tables, global rank, rewards, creator section

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
- Run the SQL schema from session 4 task prompt in Supabase SQL editor to create all required tables and enable RLS
- Storage bucket `avatars` must be created in Supabase dashboard for avatar uploads to work
- Realtime must be enabled in Supabase dashboard for `messages` table (for live chat to work)
- **Email confirmation must be DISABLED** in Supabase (Authentication → Providers → Email → "Confirm email" OFF)
- `profiles` uses both `skills_offering`/`skills_wanting` (new) and `skills_offered`/`skills_wanted` (legacy) — profile.html saves to both for backwards compatibility
- videocall.html logs sessions on `endCall()` + `beforeunload`; `sendBeacon` to `/api/session-log` will 404 (expected) but sb.from insert still runs
```

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