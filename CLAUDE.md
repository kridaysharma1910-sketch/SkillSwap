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
| Login | login.html | ✅ Frontend done, auth working |
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