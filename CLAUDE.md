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
| Profile | profile.html | ⬜ Not started |
| Discover | discover.html | ⬜ Not started |
| Matches | matches.html | ⬜ Not started |
| Messages | messages.html | ⬜ Not started |
| Video Call | videocall.html | ⬜ Not started |
| Pricing | pricing.html | ⬜ Not started |
| Webinars | webinars.html | ⬜ Not started |

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

### [Session 1 — DATE]
- Initial CLAUDE.md created
- [Add what was built here]
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