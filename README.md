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
- `localStorage` used as the data layer so state (login session, posts, calendar
  events, chat messages, profile edits) persists across page loads/navigation,
  since there is no backend

## Folder structure
```
msies-connect/
├── index.html              # Homepage (recent posts + upcoming events)
├── login-staff.html        # Staff (teacher / Super Admin) login
├── dashboard.html          # Super Admin dashboard: manage posts + manage calendar
├── reports.html            # Super Admin: comment moderation (review queue, blocked log, history) + contact-info requests
├── accounts.html           # Super Admin: manage accounts (dashboard tab)
├── login-parent.html       # Parent & student login
├── register.html           # Account creation
├── reset-password.html     # Forgot password (parents & students): verify identity, then set a new password
├── feed.html                # Announcements feed
├── calendar.html            # Events calendar
├── chat.html                 # Group chat rooms
├── profile.html               # Account settings
├── view-profile.html          # Read-only view of another user's profile
├── css/
│   └── style.css            # Shared stylesheet
└── js/
    ├── data.js               # Seed data + localStorage helpers (shared "backend"), incl. moderation data
    ├── spamFilter.js         # Automated spam detection (pure functions, no storage/DOM)
    ├── abuseFilter.js        # Automated abuse detection: profanity, insults, harassment, threats (pure functions)
    ├── components/           # Reusable UI components (plain JS, return/inject HTML)
    │   ├── navbar.js           # Top navigation bar
    │   ├── dashTabs.js         # Super Admin dashboard tab bar
    │   ├── modal.js            # Generic modal overlay (open/close)
    │   ├── postForm.js         # Shared announcement/event form fields
    │   └── announcementCard.js # Announcement card: badge, meta, comments, staff controls
    └── pages/
        ├── reports.js          # Comment moderation: review queue, blocked-by-filter log, history
        ├── dashboard.js        # Super Admin dashboard (posts, reported comments, calendar)
        ├── feed.js             # Feed page logic
        ├── calendar.js         # Calendar page logic
        ├── chat.js             # Chat page logic (rooms + direct messages)
        ├── profile.js          # Profile page logic
        └── view-profile.js     # Read-only profile view + "Message" action
```

## Setup instructions
No build tools or installation needed.
1. Download/clone the project folder.
2. Serve the folder with any static server (recommended, since some browsers
   restrict `localStorage` on the `file://` protocol):
   ```
   npx serve .
   ```
   or, with Python:
   ```
   python3 -m http.server 8000
   ```
   Then visit `http://localhost:8000`.

## Demo accounts
| Role    | Email                       | Password    |
|---------|------------------------------|-------------|
| Super Admin | admin1@email.com        | admin123    |
| Teacher | j.torres@msies.edu.ph       | teacher123  |
| Parent  | maria.reyes@email.com       | parent123   |
| Student | juan.reyes@email.com       | student123  |

New accounts created via `register.html` (student or parent) are saved to
`localStorage` and can log in through the parent & student login form.

**Linked parent / student accounts.** The student creates their account **first**
(name, email, password, grade & section). A parent then registers and links to that
existing account by entering the child's login email **and** full name (case, spacing and
accents are ignored, so the name just has to match the student's account). If the student
hasn't registered yet, or the name doesn't match, the parent account is not created and
they're told why. A parent who is already registered can link more children later from
**Profile > Linked student account**. A student can have up to 2 linked parents or
guardians (`MAX_PARENTS_PER_STUDENT` in `data.js`); a parent can link several children.
The student's Profile page shows what their parent needs (their email and full name) until
a parent has linked.

## What's implemented this milestone
- **Auth**: staff login, parent/student login, registration (student first, then parent links to the student), forgot-password
  request flow (client-side only — no real email is sent), and session
  persistence via `localStorage`.
- **Super Admin dashboard** (`dashboard.html`): tabs for **Manage posts**
  (search/filter, add, edit, delete posts; review and delete reported comments),
  **Manage calendar** (month grid to add, edit, delete events) and **Accounts**.
  Overview cards show total posts, upcoming events, reported comments and accounts.
- **Feed**: category filters (All/Events/Holidays/Reminders), an upcoming
  events sidebar, and:
  - Staff-only **New post**, **Edit**, and **Delete** (with confirmation)
    for announcements, via modal forms.
  - **Comments**: teachers can only edit or delete their own comments (only the Super Admin can delete anyone's); everyone logged in can read comments; teachers, parents and
    students can add them (the Super Admin cannot comment). Teachers, parents and
    students can report a comment (see Content moderation below).
  - **Photo upload**: staff can attach an optional photo to a post via
    click-to-upload. Images are automatically downscaled and
    compressed client-side (max 1280px, JPEG) before being stored, to
    stay well within `localStorage`'s quota.
- **Calendar**: month grid with prev/next navigation and a badge per dated
  announcement, color-coded by category. Clicking a day shows that day's
  events; staff can add, edit, or delete events from the same modal, reusing
  the same form as the feed's post modal so the two stay in sync (an event
  saved from either page shows up on both).
- **Chat**: multiple rooms seeded with sample threads (grade-level rooms,
  a PTA officers room, and an admin-only broadcast room). Sending is
  disabled for non-staff in the admin broadcast room; all other rooms are
  open to everyone.
- **Profile**: account settings form (name, email, phone, password) for
  every role, plus a notification-preference field for parents, and a
  working log-out button.
- **People search & direct messages**: a search bar in the navbar (visible
  on every page once logged in) looks up other users by name or email as
  you type. Selecting someone opens a read-only view of their public
  profile (name, role, section, email — never their password or other
  private settings), with a **Message** button that opens a 1:1 direct
  message thread with them in Chat. DMs live alongside the existing group
  chat rooms in the Chat sidebar, under a separate "Direct messages"
  heading.

## Forgot password (parents & students)
`reset-password.html` lets a parent or student set a new password without an email service.
They first confirm it's them, then choose a new password:
- **Student:** account email + full name + grade & section (spacing and punctuation are ignored, so `grade 3 mabini` matches `Grade 3 - Mabini`).
- **Parent:** account email + full name + the email of a linked child's student account.

Safety rules (constants at the top of the reset section in `data.js`): 5 wrong tries lock that email
for 15 minutes; the check works only once and the new password must be set within 10 minutes; new
passwords need at least 6 characters and must differ from the old one; unknown emails and wrong
details give the same message, so the page never reveals whether an account exists. Teachers and
the Super Admin are not reset here: the Super Admin resets teacher passwords from **Accounts**.

## Content moderation
**Automated spam detection** (`js/spamFilter.js`). Every comment a parent or student
posts or edits is scored from 0 to 100 before it is saved. Teachers and the Super
Admin are trusted and skip the filter. Rules add points, so one weak signal (an ALL
CAPS reply, a phone number) never trips it on its own:
- links (school/government domains such as `deped.gov.ph` are allowed; shorteners and
  chat-invite links score higher), promo/scam wording in English and Filipino
  ("free money", "pautang", "online sugal"...), phone numbers, email addresses
- shouting, stretched letters, punctuation/emoji floods, repeated words
- evasion tricks: `fr33 m0ney`, hidden zero-width characters, full-width letters
- behaviour: the same text posted again within 10 minutes, or posting too quickly

| Score  | Result |
|--------|--------|
| < 40   | Posted normally |
| 40-69  | Posted, but **flagged** into the Super Admin review queue (the author is told it may be reviewed) |
| 70+    | **Blocked**: not posted, author sees why, and it is logged for the Super Admin |

Thresholds and word lists are constants at the top of `spamFilter.js`. A clean comment
can't be edited into spam: edits are screened the same way.

**Automated abuse detection** (`js/abuseFilter.js`). Runs next to the spam filter on every
comment a parent or student posts or edits (teachers and the Super Admin skip it), in English
and Filipino. It uses the same 0-100 score and the same cut-offs (40 flag, 70 block), and looks
for five kinds of abuse:

| Kind | Examples | Usual result |
|------|----------|--------------|
| Profanity | strong swearing, including masked forms such as `f*ck` or `f u c k` | Blocked |
| Hateful slurs | racist, homophobic and ableist slurs | Blocked |
| Milder swearing | "gago", "bwisit", "ulol" | Flagged (blocked when aimed at a person) |
| Insults | "stupid", "tanga", "bobo" | Flagged only when **aimed at a person** ("you are stupid", "tanga ka"); a mild insult on its own ("these rules are stupid hard") is posted |
| Harassment / bullying | "nobody likes you", "tumahimik ka" | Flagged |
| Threats | "I will hurt you", "papatayin kita", "I know where you live" | Blocked |
| Telling someone to hurt themselves | "kill yourself", "sana mamatay ka" | Blocked |

The word lists cover English, Tagalog/Filipino and common Cebuano curses, plus vulgar and
sexual words, and also catch the usual ways of dodging a filter: stretched letters
(`fuuuck`), digits and symbols (`t4ngina`, `sh!t`, `a$$hole`, `f*ck`), dots or spaces
(`f.u.c.k`) and dropped vowels (`tngina`, `ptngina`). To add a word, put its plain spelling in
one of the lists at the top of `abuseFilter.js`. Innocent phrases that contain a listed word
(for example *leche flan* or *cum laude*) are listed under `ABUSE_EXCEPTIONS` and ignored.
Words are matched as whole words, so "class", "assignment", "putahe" or "shiitake" are never
caught, and some words (ugly, fat, trash, pangit...) only count when the comment is aimed at
someone. Swearing plus an insult aimed at a person quickly reaches the block level. The author
is told why, in plain words; blocked and flagged comments go to the same Super Admin queue and
blocked log as spam, labelled **Abuse filter** (or **Spam & abuse filter** when both fire), and
the *Delete comment* and *Warn user* dialogs pre-select the matching warning reason
(*Abusive or offensive language* or *Harassment or bullying*). Word lists and points are
constants at the top of `abuseFilter.js`.

**Comment reporting.** Teachers, parents and students can report someone else's comment
from its menu, choosing a reason (spam, offensive, harassment, false information, other)
and adding optional details. One report per person per comment, no reporting your own
comment, and a limit of 10 reports per hour to stop report spam.

**Administrative review** (`reports.html`, Super Admin only). The page has three views:
- **Review queue**: comments with user reports and/or a spam-filter flag, with the
  filter's score, reasons and matched words next to each reporter's reason. Sort by most
  reported, newest or spam score. *Dismiss & keep* closes the review (the same people
  can't report that comment again); *Delete comment* removes it and can also **warn** or
  **mute** the author in the same step.
- **Blocked by filter**: everything the filter refused, with repeat-sender counts, plus
  warn / mute / remove-from-log actions.
- **History**: a record of every closed review (the comment as it was, who closed it,
  what was done).

A red badge on the Dashboard menu shows how many reviews and contact requests are waiting.
Comments are always addressed by id, not list position, so an admin action can never hit
the wrong comment.

## Known limitations / next steps
- There's no real backend or email service — password reset, chat, and all
  data changes are simulated with `localStorage` and reset if it's cleared.
- No per-child roster is enforced: any parent can currently comment on or
  view any announcement rather than only their child's grade/section.
- No real-time updates between browser tabs/users; chat and feed changes
  only appear after the acting user's own next render.
- The abuse filter is a word-list heuristic too. It can't understand sarcasm, context or
  slang it doesn't know, so it will miss some abuse and occasionally flag an innocent comment
  (a human reviews every flag). It only screens comments, not chat messages.
- The spam filter is a rule-based heuristic, not a guarantee: it catches common
  patterns (links, scam/promo wording, copy-paste floods, shouting) and leaves the rest
  to user reports. It only screens comments, not chat messages, and its "same text
  again" memory is kept per browser in `localStorage`, so a determined user could clear it.
- Photos are stored as base64 data URLs inside `localStorage` rather than
  uploaded to real file storage, so there's still a practical ceiling on
  how many/how large the images across all posts can get (compression
  keeps each one small, but the browser's total `localStorage` quota,
  typically 5–10MB, still applies site-wide).
