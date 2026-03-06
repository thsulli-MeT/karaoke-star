# karaoke-star
Karaoke Star Vocal Training
# Karaoke Star — Powered by Side-Chain™
A Torus Media Performance-Training & Talent Discovery Platform

Karaoke Star is not traditional karaoke — it is a new kind of interactive performance experience that blends game mechanics, real-time vocal feedback, and artist-driven training tools to help performers grow, compete, and discover their unique voice.

The platform is built around **Side-Chain™**, Torus Media’s adaptive audio engine that dynamically blends the original guide vocal with the singer’s live performance. As the performer gains confidence, presence, and control, the system gradually reduces support — allowing the singer to replace the original vocal and fully own the moment.

This project is currently in **active development & prototype testing**.

---

## 🎤 Core Concept — What Makes This Different

Most karaoke systems are playback-based.

Karaoke Star is **performance-based**.

Instead of simply singing along, users:

- train their voice
- build confidence
- develop stage presence
- and earn their way into competition tiers

Side-Chain™ enables three adaptive performance modes:

- **Assist Mode** — guide vocal remains at ~50% to support phrasing & timing  
- **Share Mode** — live vocal blends forward as presence improves  
- **Ghost Mode** — guide vocal steps away completely — the singer carries the track

This creates a natural, musical feedback loop:

> “Support fades as confidence appears.”

---

## 🏆 Competition & Talent Discovery

Karaoke Star is designed for:

- casual performers
- creative players
- serious competitors
- and rising talent

Future expansion includes:

- seasonal challenges
- creator showcases
- competition brackets
- featured artist opportunities
- potential live audition integrations

Players can simply enjoy singing…

or lean in — and **treat this as a stepping-stone toward performance growth**.

---

## 🧠 Platform Vision

Karaoke Star sits at the intersection of:

- 🎤 **Entertainment** — interactive game-style performance
- 🧠 **Training** — voice, confidence & delivery development
- 🎓 **Education** — a supportive environment for emerging talent
- ⭐ **Talent Discovery** — pathways for artists ready to rise

It is not meant to replace live performance —
it prepares performers *for* it.

---

## 🛠️ Current Build Status

This repository contains:

- early-stage interactive browser prototype
- vocal ducking & live mic routing experiments
- scoring and feedback UI concepts
- Side-Chain™ mode switching framework

Features currently in development:

- improved visual scoring feedback
- leaderboard + challenge system
- mix replay enhancements
- talent-mode submission workflows

This project is evolving rapidly as part of the Torus Media ecosystem.

---

## ⚖️ Intellectual Property Notice

Side-Chain™, Karaoke Star™, and related concepts  
are proprietary Torus Media works-in-progress.

Unless explicitly authorized:

- reuse, redistribution, or cloning of this platform
is not permitted.

This repository exists for:

- version control
- collaboration development
- concept documentation
- and controlled testing

All creative, technical, and conceptual content remains:

**© Torus Media — All Rights Reserved**

---

## 🚀 About Torus Media

Torus Media creates music, film, interactive media, and emerging performance technologies that empower creators, amplify new voices, and build bridges between storytelling, art, and future-forward entertainment.

This project is part of that mission.

---

## 📩 Collaboration & Partnership

We are interested in conversations with:

- vocal coaches
- artists & performers
- creative technologists
- education partners
- talent & showcase organizations

For inquiries, collaboration, or early pilot discussions:

**Contact — Torus Media**

shortmusicvideos.com

## Side-Chain Spin-Off Prototype

A standalone prototype has been added under `side-chain/` to keep Karaoke Star intact while testing a licensing-friendly Side-Chain app variant.

Included in this spin-off:
- built-in sample song menu
- custom lead/instrument stem upload
- server-validated access gateway (Patreon L2 + promo code paths) with signed session cookies
- adaptive lead-guide levels (Practice Round, Light Guide, Medium Drop, Ghost Mode, Solo Star)
- in-app recording, replay, mic gain (+/- dB), EQ + auto-tune assist controls, and downloadable WAV mix files named with song + score
- customizable visual themes with 4 animated background presets plus custom background upload


### Side-Chain Access Gateway (Option 2 security)

Run the secure gate + static app server:

```bash
node side-chain/access-gateway.js
```

Then open: `http://localhost:4173/side-chain/index.html`

To use your own codes, create `side-chain/access-codes.json` (see `side-chain/access-codes.example.json`) and optionally set:

```bash
ACCESS_CODES_JSON=side-chain/access-codes.json SESSION_SECRET="strong-random-secret" node side-chain/access-gateway.js
```


Troubleshooting:
- If you see `Server unavailable. Start: node side-chain/access-gateway.js`, run the gateway command from repo root.
- For local fallback only (insecure), click **Use Local Demo Mode** and use demo codes `L2-DEMO-2026` or `PROMO-GUEST-2026`.
