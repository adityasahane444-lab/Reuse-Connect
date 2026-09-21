<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:064E3B,50:065F46,100:059669&height=260&section=header&text=REUSE%20%26%20CONNECT&fontSize=70&fontColor=F8FAFC&fontAlignY=38&animation=fadeIn"/>

<img src="https://readme-typing-svg.herokuapp.com?font=JetBrains+Mono&size=24&pause=900&color=34D399&center=true&vCenter=true&width=900&lines=Community+Circular+Economy;Surplus+Food+Redistribution;Sustainable+Resource+Sharing;Gamified+Green+Points+Leaderboard"/>

<br>

<img src="https://img.shields.io/badge/Sustainability%20%7C%20Community%20%7C%20Impact-064E3B?style=for-the-badge&logo=leaf&logoColor=34D399"/>
<img src="https://img.shields.io/badge/Full%20Stack%20Platform-064E3B?style=for-the-badge&logo=next.js&logoColor=34D399"/>

<br><br>

<a href="https://reuse-connect.vercel.app/">
<img src="https://img.shields.io/badge/🚀%20Live%20Demo-Open%20App-059669?style=for-the-badge&logo=vercel&logoColor=white"/>
</a>

<a href="https://github.com/kartik28rathod-max/Reuse-Connect">
<img src="https://img.shields.io/badge/💻%20GitHub-Source%20Code-181717?style=for-the-badge&logo=github&logoColor=white"/>
</a>

</div>

---

## 🌿 Overview

**Reuse & Connect** is a community-driven circular economy platform designed to eliminate urban waste and foster neighborhood cooperation. By integrating food surplus alerts, reusable material exchanges, and neighborhood eco-initiatives, it creates a quantifiable environmental impact powered by a live **Green Points** audit system.

---

## 🛠️ Tech Stack

<div align="center">

<img src="https://img.shields.io/badge/Next.js%2014-000000?style=for-the-badge&logo=next.js&logoColor=white"/>
<img src="https://img.shields.io/badge/React%2018-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
<img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white"/>
<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white"/>
<img src="https://img.shields.io/badge/Supabase%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white"/>
<img src="https://img.shields.io/badge/Vercel%20Hosting-000000?style=for-the-badge&logo=vercel&logoColor=white"/>

</div>

<br>

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend UI** | Next.js 14 App Router, React, Tailwind CSS | Modular components, responsive forms & real-time views |
| **Server Backend** | Next.js Server Components & Route Handlers | Server-side validation, password hashing & auth cookies |
| **Database** | Supabase (Managed PostgreSQL) | Relational storage, triggers & atomic point increments |
| **Hosting** | Vercel CI/CD | Edge-optimized deployment & global asset caching |

---

## ✨ Core Highlights

<table>
<tr>
<td width="50%">

### 🍲 Surplus Food Rescue
- Post surplus home or commercial food instantly.
- Specifies expiration times, quantities, and map coordinates.
- Prevents good food from ending up in local landfills.

</td>
<td width="50%">

### 📦 Reusable Goods Exchange
- Peer-to-peer sharing of electronics, books, and clothes.
- Zero-cost neighborhood pickup claims.
- Extends product lifecycles within local residential hubs.

</td>
</tr>
<tr>
<td width="50%">

### 📅 Community Green Drives
- Create and discover tree planting, clean-up, and recycling drives.
- Automated RSVP counters and volunteer coordination.
- Real-time event updates and notifications.

</td>
<td width="50%">

### 🏆 Impact Points & Leaderboards
- Transparent `points_tx` ledger for every verified eco-action.
- Live community leaderboard ranks top contributors.
- Gamified sustainability milestones for neighborhood pride.

</td>
</tr>
</table>

---

## 🏗️ Architecture & Data Flow

```text
               [ Client Browser / Mobile PWA ]
                             │
                             ▼ HTTPS
             [ Next.js 14 App Router on Vercel ]
              ├── Server Components & Interactive Client UI
              ├── API Route Handlers (/api/*)
              └── Secure Session & Auth Utilities (lib/auth.ts)
                             │
                             ▼ PostgREST / Supabase Client
           [ Supabase Cloud Database (PostgreSQL Engine) ]
              ├── users & sessions
              ├── food_posts
              ├── resource_posts
              ├── events & event_participants
              └── points_tx (Green Points Audit Log)
