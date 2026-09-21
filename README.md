Markdown
# ♻️ Reuse & Connect — Community Sustainability & Resource Sharing Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-reuse--connect.vercel.app-22c55e?style=for-the-badge&logo=vercel&logoColor=white)](https://reuse-connect.vercel.app/)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/kartik28rathod-max/Reuse-Connect)
[![Next.js](https://img.shields.io/badge/Next.js%2014-App%20Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> 🌿 **Empowering local communities to minimize waste, redistribute surplus food, share reusable resources, organize sustainability events, and track eco-impact via gamified Green Points.**

---

## 🔗 Quick Links

- 🚀 **Live Demo:** [https://reuse-connect.vercel.app/](https://reuse-connect.vercel.app/)
- 💻 **GitHub Repo:** [https://github.com/kartik28rathod-max/Reuse-Connect](https://github.com/kartik28rathod-max/Reuse-Connect)

---

## 📌 Overview

**Reuse & Connect** is a collaborative circular-economy web application designed to foster local sustainability. It bridges the gap between surplus resources and community needs by facilitating food donation claims, item reuse exchanges, neighborhood environmental events, and rewarding active contributors through an impact-driven Green Points leaderboard.

---

## ✨ Core Features

- 🍲 **Surplus Food Sharing**: List excess cooked or raw edible food with quantity, expiry window, and pickup coordinates to prevent food waste.
- 📦 **Resource & Item Reusable Exchange**: Give away or discover pre-loved goods, books, clothes, and electronics instead of sending them to landfills.
- 📅 **Community Green Events**: Host and RSVP for local tree plantation drives, neighborhood cleanups, and eco-workshops.
- 🏆 **Gamified Green Points & Leaderboard**: Earn tracked impact points for every donation, reuse claim, or event participation, displayed on a real-time community leaderboard.
- 🔒 **Secure Role & Session Management**: Server-side authentication and cookie session controls safeguarding user contributions.

---

## 🏗️ System Architecture

```text
               [ Client Browser / Mobile Web ]
                             │
                             ▼ HTTPS
             [ Next.js 14 App Router on Vercel ]
              • Server Components & React UI
              • API Route Handlers (/api/*)
              • Session & Point Logic (lib/auth.ts)
                             │
                             ▼ PostgREST / SQL
           [ Supabase Cloud Database (PostgreSQL) ]
              ├── users & sessions
              ├── food_posts
              ├── resource_posts
              ├── events & event_participants
              └── points_tx (Green Points Audit Log)
🛠️ Tech Stack
Framework: Next.js (App Router, Server Components & Route Handlers)

Frontend: React, Tailwind CSS, TypeScript

Database & Auth: Supabase (PostgreSQL engine, RLS policies, SQL helper functions)

Deployment: Vercel (CI/CD integration)

📂 Project Structure
Plaintext
Reuse-Connect/
├── app/                  # Next.js App Router pages and API routes
│   ├── api/              # Backend endpoints (auth, posts, events, points)
│   ├── food/             # Food donation and listing views
│   ├── items/            # Resource exchange marketplace
│   ├── events/           # Community sustainability events
│   └── leaderboard/      # Green Points rankings
├── components/           # Reusable UI components (Navbar, Cards, Modals)
├── lib/
│   ├── supabase.ts       # Server-only Supabase client initialization
│   ├── auth.ts           # Password hashing, sessions, & points awarding
│   └── types.ts          # Shared TypeScript interfaces & types
└── supabase/
    └── schema.sql        # Database schema definitions & SQL functions
🚀 Getting Started Locally
Prerequisites
Node.js (v18 or higher)

npm or yarn

A free Supabase project account

1. Clone & Install
Bash
# Clone the repository
git clone [https://github.com/kartik28rathod-max/Reuse-Connect.git](https://github.com/kartik28rathod-max/Reuse-Connect.git)
cd Reuse-Connect

# Install dependencies
npm install
2. Configure Database (Supabase)
Open your project on Supabase.

Navigate to SQL Editor -> New query.

Copy the contents of supabase/schema.sql, paste it into the editor, and click Run.
(This initializes tables: users, sessions, food_posts, resource_posts, events, event_participants, points_tx alongside helper routines).

Navigate to Project Settings -> API and copy:

Project URL

service_role secret key (Server-only access key)

3. Setup Environment Variables
Create a .env.local file in the project root:

Code snippet
SUPABASE_URL=[https://your-project-ref.supabase.co](https://your-project-ref.supabase.co)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-secret-key
Security Note: SUPABASE_SERVICE_ROLE_KEY has administrative database privileges and is exclusively accessed server-side. Never expose it on the client or commit it to version control.

4. Run Development Server
Bash
npm run dev
Open http://localhost:3000 in your browser.

🌐 Production Deployment (Vercel)
Push your latest code to GitHub.

Import the repository in Vercel.

Under Settings -> Environment Variables, add:

SUPABASE_URL

SUPABASE_SERVICE_ROLE_KEY

Click Deploy. Vercel will build and launch the application globally.

🔮 Roadmap & Upcoming Features
[ ] 🚗 Eco-Carpooling Module: Local commute matching to cut transport emissions.

[ ] 🏅 Badges & Achievement Unlocks: Digital achievement tokens for milestone contributions.

[ ] 🛡️ Municipal & NGO Admin Portal: Verified partner portal for large-scale surplus bulk routing.

👥 Authors & Collaborators
Aditya Sahane — GitHub Profile • LinkedIn

Kartik Rathod — GitHub Profile

📄 License
This project is licensed under the MIT License.
