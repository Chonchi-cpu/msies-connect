# MSIES Connect (HTML / CSS / JS)

A frontend prototype for a school announcements, events, and chat platform —
built with plain HTML, CSS, and JavaScript only (no frameworks, no build step).

## Group members
MINOY, JERWIN DE GUIA
OLIVER, EVAN CALALO
PALADIN, JOHN CHRISTIAN
PASCUAL, JHEREMY DAVID
PERALTA, DAVE NORIEL

## Project description
MSIES Connect gives parents, teachers, students, and school admins one place to see
announcements, check the events calendar, and chat in group rooms, instead of relying
on the physical bulletin board. Admins and teachers can publish announcements/events;
parents and students can view them, comment, and chat.

## Technology used
- HTML5 (multi-page site, one .html file per screen)
- CSS3 (single shared stylesheet, `css/style.css`)
- Vanilla JavaScript (ES6+), no frameworks or libraries
- `localStorage` used as the data layer so state (login session, posts, chat
  messages) persists across page loads/navigation, since there is no backend

## Folder structure (this week's progress)
```
msies-connect/
├── index.html            # Homepage
├── login-choice.html     # Login role picker + quick demo login (see below)
├── feed.html             # Announcements feed (read-only this week)
├──login-staff.html       # Admin Login
├──login-parent.html      # User Login
├── css/
│   └── style.css          # Shared stylesheet
└── js/
    ├── data.js             # Seed data + localStorage helpers (shared "backend")
    ├── components/         # Reusable UI components (plain JS, return/inject HTML)
    │   ├── navbar.js         # Top navigation bar
    │   └── announcementCard.js # Reusable announcement/post card
    └── pages/
        └── feed.js           # Feed page logic
```

## Setup instructions
No build tools or installation needed.
1. Download/clone the project folder.
2. Open `index.html` directly in a browser, **or** serve the folder with any
   static server for best results (recommended, since some browsers restrict
   `localStorage`/module loading on the `file://` protocol):
   ```
   npx serve .
   ```
   or, with Python:
   ```
   python3 -m http.server 8000
   ```
   Then visit `http://localhost:8000`.

## Known limitations this week
- `feed.html` requires a logged-in user (`requireAuth()` in `js/data.js`). The
  full staff/parent login forms aren't part of this week's upload yet, so
  `login-choice.html` includes a temporary "Quick demo login" button that logs
  in as the seeded parent account and redirects to the feed, so the navigation
  flow can still be demoed end-to-end. This will be replaced by the real login
  forms next week.
- The feed is **read-only** this week: it shows seeded announcements with
  category filtering (All/Events/Holidays/Reminders) and an upcoming events
  list. Creating, editing, and deleting posts, plus the comment thread, are
  planned for a later milestone.

## Completed for this milestone (Week 5)
- Initialized frontend project (plain HTML/CSS/JS)
- Organized folder/file structure (css/, js/components/, js/pages/)
- Working homepage based on the approved Figma design (`index.html`)
- Navigation bar component (`navbar.js`) shown on every page
- Reusable UI components: `navbar.js`, `announcementCard.js`
- Feed page displaying seeded announcements with working category filters
  and an upcoming events list (read-only)
