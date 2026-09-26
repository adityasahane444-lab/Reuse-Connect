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

<img src="https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=next.js&logoColor=white"/>
<img src="https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
<img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white"/>
<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white"/>
<img src="https://img.shields.io/badge/Supabase%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white"/>
<img src="https://img.shields.io/badge/Vercel%20Hosting-000000?style=for-the-badge&logo=vercel&logoColor=white"/>

</div>

<br>

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend UI** | Next.js 16 App Router, React, Tailwind CSS | Modular components, responsive forms & real-time views |
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
             [ Next.js 16 App Router on Vercel ]
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

```


## 🔮 Roadmap

```yaml
Upcoming Milestones:
  - 🚗 Eco-Carpooling: Commute matching to lower neighborhood vehicle emissions.
  - 🏅 Achievement Badges: Verifiable sustainability digital collectibles.
  - 🏢 Bulk Municipal Portal: Dedicated pipeline for bulk NGO food distribution.
```
  
👥 Authors & Collaborators

👨‍💻 Kartik Rathod

👨‍💻 Aditya Sahane


*Built for sustainable communities and zero-waste initiatives. 🌍*

              

## 🔐 Email verification / OTP

New registrations now require a 6-digit email OTP before the first login. The project uses the existing custom password/session system and adds email verification; it does not replace your authentication with Supabase Auth.

Email delivery is configured with Mailjet. Mailjet currently lists a Free plan with up to 6,000 emails/month and a 200-email daily limit. Mailjet requires the sender address or domain to be validated before sending.

Required Vercel/server environment variables:

```env
MAILJET_API_KEY=your-mailjet-api-key
MAILJET_SECRET_KEY=your-mailjet-secret-key
MAILJET_FROM_EMAIL=your-verified-sender@example.com
MAILJET_FROM_NAME=Reuse & Connect
```

Create the API credentials in Mailjet under API Key Management, and validate the sender address you use in `MAILJET_FROM_EMAIL`. You can validate an individual sender address without buying a domain.

For local testing without Mailjet, set `DEV_LOG_OTP=true` and leave the Mailjet variables empty; the OTP will be logged to the terminal in development only.

Official Mailjet references: https://www.mailjet.com/pricing/ and https://documentation.mailjet.com/hc/en-us/articles/360042759253-How-to-add-a-sender-address

Run `supabase/migration-003-auth-edit-delete.sql` once after migration 002. Existing users are treated as verified; only new registrations require OTP.

## 🛡️ Admin access

The admin dashboard is available at:

```text
/admin
```

It is protected by `is_admin` on the `users` table. To make your account an admin, run this **once** in Supabase SQL Editor:

```sql
update users
set is_admin = true
where email = 'YOUR-EMAIL@example.com';
```

Then log out and log in again (or refresh the session). The account menu will show **🛡️ Admin**.

Do not expose or share your Supabase service-role key. Admin permissions are enforced server-side by `getCurrentAdmin()`.

## 🌱 Green Points rules
Food and resource listing points are awarded only after the recipient confirms receipt (50 for food, 30 for an item). If a completed listing is later deleted or removed by moderators, its earned reward is reversed once. Event organization (+50) and event participation (+20) remain action-based.

## 📷 Listing photos

Food, Resource and Event posts support one optional photo. Photos are stored in the Supabase `post-images` public bucket and displayed on listing cards so other users can inspect an item before sending a request. Uploads accept JPG, PNG or WebP images up to 5 MB and are processed only through the authenticated server API.

Run `supabase/migration-004-post-images.sql` once after migration 003. The photo helps users visually inspect an item, but a photo alone does not guarantee that an item is authentic or safe.

## ✏️ Edit / delete your posts

Owners now get an **✏️ Edit** button on their own Food, Resource, and Event listings.

- Food: edit title, description, category, quantity, location, expiry and map pin.
- Resources: edit title, description, category, condition, price and tags.
- Events: edit title, description, category, date, time, location and map pin.
- Delete is owner-only and requires confirmation.
- Deleting a food/resource listing cancels pending or accepted exchange requests for that listing.
- Other users cannot edit or delete another user's listing because ownership is checked server-side.
