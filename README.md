# FutureAI - Global AI Collaboration Platform

A bilingual (FR/EN) collaborative platform where innovators submit AI ideas, build projects together, participate in challenges, and earn badges.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** SQLite via Prisma ORM
- **Auth:** Clerk (optional, with demo mode fallback)
- **Styling:** Tailwind CSS 3.4 with custom dark theme
- **Animations:** Framer Motion
- **Celebrations:** canvas-confetti
- **i18n:** Custom React Context + TypeScript dictionaries

## Features

### Core
- **Ideas** - Submit, vote, and explore AI ideas on a world map
- **Collaborative Projects** - Multi-user projects with roles (creator/contributor/tester), contributions, versioning, and threaded comments
- **Challenges / Hackathons** - Weekly and monthly challenges with countdown, entry submission, community voting, and prizes
- **Bilingual** - Full EN/FR with instant language switching and cookie persistence
- **Dark Theme** - Polished UI with glass effects and gradient accents

### V4 - Real-Time & Enhanced Gamification
- **Real-Time SSE** - Server-Sent Events for live notifications, activity feed, and leaderboard updates
- **Multi-User Sandbox Sessions** - Collaborative AI prototyping with versioning, comments, participants, and shareable public links
- **Enhanced Gamification** - Animated badges with confetti celebrations, level-up animations, animated progress bars, points counter animations
- **Export / Viral Sharing** - Canvas-based PNG export with project overlays, resolution presets (Stories/Square/Landscape), social sharing (Twitter/LinkedIn)
- **Live Activity Feed** - Real-time activity stream on leaderboard showing contributions, votes, badges, and more
- **Live Challenge Updates** - Real-time entry counts and activity on challenge pages
- **UI/UX Animations** - Framer Motion page transitions, hover lift effects on cards, staggered lists, vote button animations

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd futureai
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

**For demo mode (no auth):** Leave the placeholder Clerk keys as-is. The app will use a demo user automatically.

**For real auth:** Get your Clerk keys at [clerk.com](https://clerk.com) and replace the placeholders in `.env.local`.

### 3. Set up database

```bash
npx prisma db push
npx prisma db seed
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Build for production

```bash
npm run build
npm start
```

## Project Structure

```
src/
  app/              # Next.js pages and API routes
    api/            # REST API endpoints
      sse/          # Server-Sent Events endpoints
      sandbox/      # Sandbox session API routes
    challenges/     # Challenge pages
    ideas/          # Idea pages
    projects/       # Project pages
    sandbox/        # Sandbox pages (including [slug] public view)
    ...
  components/       # Reusable React components
    animations/     # Framer Motion wrappers (PageTransition, FadeIn, StaggerList)
  i18n/             # Internationalization
    translations/   # FR and EN dictionaries
  lib/              # Utilities (auth, prisma, points, badges, sse, export)
prisma/
  schema.prisma     # Database schema (19 models)
  seed.ts           # Seed data
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/ideas` | List/create ideas |
| POST | `/api/ideas/:id/vote` | Vote on an idea |
| GET/POST | `/api/projects` | List/create projects |
| POST | `/api/projects/:id/members` | Join a project |
| POST | `/api/projects/:id/contributions` | Add contribution |
| POST | `/api/projects/:id/comments` | Add comment |
| POST | `/api/projects/:id/versions` | Add version |
| GET | `/api/challenges` | List challenges |
| POST | `/api/challenges/:id/entries` | Submit challenge entry |
| POST | `/api/challenges/:id/entries/:entryId/vote` | Vote on entry |
| GET | `/api/notifications` | List notifications |
| PATCH | `/api/notifications/:id` | Mark as read |
| POST | `/api/notifications/read-all` | Mark all as read |
| GET | `/api/sse/notifications` | SSE stream for real-time notifications |
| GET | `/api/sse/activity` | SSE stream for real-time activity feed |
| GET/POST | `/api/sandbox/sessions` | List/create sandbox sessions |
| GET/PATCH | `/api/sandbox/sessions/:id` | Get/update session |
| POST | `/api/sandbox/sessions/:id/versions` | Add sandbox version |
| GET/POST | `/api/sandbox/sessions/:id/comments` | Session comments |
| POST | `/api/sandbox/sessions/:id/participants` | Add participant |
| GET | `/api/sandbox/share/:slug` | Public sandbox session |

## Bilingual Support

The app detects browser language and defaults to French. Users can switch languages via the globe icon in the navbar. The preference is stored in a cookie.

- **Client components:** `const { t, locale } = useLanguage()`
- **Server components:** `const { t, locale } = getServerTranslations()`
