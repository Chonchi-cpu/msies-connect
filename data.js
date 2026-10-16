/* ============================================================
   data.js - seed data + localStorage persistence helpers.
   Loaded on every page before any page-specific script.
   ============================================================ */

const DEFAULT_USERS = [
  { email: 'admin1@email.com', password: 'admin123', name: 'Super Admin', role: 'superadmin' },
  { email: 'j.torres@msies.edu.ph', password: 'teacher123', name: 'Mrs. Torres', role: 'teacher' },
  { email: 'maria.reyes@email.com', password: 'parent123', name: 'Maria Reyes', role: 'parent', section: 'Grade 3 - Mabini', linked: ['juan.reyes@email.com'] },
  { email: 'juan.reyes@email.com', password: 'student123', name: 'Juan Reyes', role: 'student', section: 'Grade 3 - Mabini', linked: ['maria.reyes@email.com'] }
];

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: 1,
    category: 'Events',
    title: 'PTA General Assembly',
    date: '2026-08-30',
    time: '08:00',
    location: 'School covered court',
    details:
      "All parents and guardians are invited to the first PTA General Assembly of the school year. We'll cover the school calendar, canteen guidelines, and open the floor for questions.",
    comments: [
      { author: 'Maria Reyes', authorEmail: 'maria.reyes@email.com', text: 'Is this the same venue as last year, the covered court?' },
      { author: 'Mrs. Torres (Grade 3 Adviser)', authorEmail: 'j.torres@msies.edu.ph', text: 'Yes, same venue. Doors open 7:30 AM.' }
    ]
  },
  {
    id: 2,
    category: 'Holidays',
    title: 'National Heroes Day — No classes',
    date: '2026-08-31',
    time: '',
    location: '',
    details:
      'Classes are suspended on Monday, August 31 in observance of National Heroes Day. Regular classes resume Tuesday, September 1.',
    comments: []
  },
  {
    id: 3,
    category: 'Reminders',
    title: 'Submit Form 137 copies',
    date: '2026-09-04',
    time: '',
    location: "Registrar's office",
    details:
      "Parents of graduating Grade 6 students are reminded to submit Form 137 copies at the registrar's office on or before the deadline.",
    comments: []
  }
];

/* Chat has two rooms: "Staff" (Super Admin + teachers) and the
   read-only-for-everyone-else "School Admin Broadcast". */
const DEFAULT_CHATROOMS = [
  {
    id: 'staff',
    name: 'Staff',
    staffOnly: true,
    autoJoin: true,
    messages: [
      { author: 'Super Admin', authorEmail: 'admin1@email.com', text: 'Welcome to the staff room. Use this space to coordinate announcements and school events.' },
      { author: 'Mrs. Torres', authorEmail: 'j.torres@msies.edu.ph', text: "Noted. I'll post the Grade 3 reminder for the PTA assembly today." }
    ]
  },
  {
    id: 'grade3',
    name: 'Grade 3 - Students & Teacher',
    gradeRoom: 'Grade 3',
    teacherEmails: ['j.torres@msies.edu.ph'],
    messages: [
      { author: 'Mrs. Torres', authorEmail: 'j.torres@msies.edu.ph', text: 'Welcome, Grade 3! This is our class group chat. Ask questions about lessons and homework here, and please be kind and respectful to one another.' },
      { author: 'Juan Reyes', authorEmail: 'juan.reyes@email.com', text: 'Good morning, Ma\'am! Is there homework for tomorrow?' }
    ]
  },
  {
    id: 'admin',
    name: 'School Admin Broadcast',
    members: 412,
    adminOnly: true,
    messages: [
      { author: 'School Admin', text: "Reminder: Submit Form 137 copies to the registrar's office on or before Sept 4." },
      { author: 'School Admin', text: 'This message was sent to all parents and guardians.' }
    ]
  }
];

/* October 2026 posts. Photos are image files in /images; the posters
   use the school's green-and-gold frame. They are added once, also to
   browsers that already have the older posts saved (see below). */
const OCTOBER_POSTS = [
  {
    id: 4,
    category: 'Events',
    title: 'World Mental Health Day',
    date: '2026-10-10',
    time: '',
    location: '',
    photo: 'images/world-mental-health-day.jpg',
    details:
      'Malipampang Elementary School joined the Schools Division of Bulacan in observing World Mental Health Day. This year\'s theme: \u201cLived experiences heard: real voices, real change.\u201d Let\'s keep being kind, caring, and supportive of one another.',
    comments: []
  },
  {
    id: 5,
    category: 'Events',
    title: 'Happy Birthday, Dr. Cecilia E. Valderama, CESO VI!',
    date: '2026-10-13',
    time: '',
    location: '',
    photo: 'images/happy-birthday-valderama.jpg',
    details:
      'The Malipampang Elementary School community sends warm birthday greetings to Dr. Cecilia E. Valderama, CESO VI. Thank you for your leadership and service to our schools!',
    comments: []
  },
  {
    id: 6,
    category: 'Reminders',
    title: 'Suspension of Classes \u2014 October 15',
    date: '2026-10-15',
    time: '',
    location: '',
    photo: 'images/class-suspension.jpg',
    details:
      'Classes in all grade levels are suspended on <strong>Thursday, October 15, 2026</strong>. Please stay safe and watch this page for updates and any make-up class schedule.',
    comments: []
  },
  {
    id: 7,
    category: 'Events',
    title: 'PTA Meeting',
    date: '2026-10-24',
    time: '08:00',
    location: 'School covered court',
    photo: 'images/pta-meeting.jpg',
    details:
      'All parents and guardians are invited to the PTA meeting on <strong>Saturday, October 24, 2026</strong>. We will share school updates and open the floor for questions and suggestions.',
    comments: []
  },
  {
    id: 8,
    category: 'Reminders',
    title: 'First Quarterly Examination',
    date: '2026-10-27',
    time: '',
    location: '',
    photo: 'images/first-quarter-examination.jpg',
    details:
      'The First Quarterly Examination will be held on <strong>October 27 to 29, 2026</strong> (Tuesday to Thursday). Please remind your child to review, get enough rest, and bring pencils, ballpens, and erasers.',
    comments: []
  }
];

/* Extra calendar events (with poster photos), all on Oct 24 so the
   calendar can be tested with several events in one day. Added once,
   also to browsers that already have older posts saved. */
const MORE_EVENTS = [
  {
    id: 9,
    category: 'Events',
    title: 'Science and Math Fair',
    date: '2026-10-24',
    time: '09:00',
    location: 'School covered court',
    photo: 'images/science-math-fair.jpg',
    details:
      'Students will showcase their science and math projects on <strong>Saturday, October 24, 2026</strong>. Parents and guardians are invited to visit the exhibits and cheer on our young scientists and mathematicians.',
    comments: []
  },
  {
    id: 10,
    category: 'Other',
    title: 'School Clean-Up Drive',
    date: '2026-10-24',
    time: '13:00',
    location: 'School grounds',
    photo: 'images/clean-up-drive.jpg',
    details:
      'Join our school clean-up drive on <strong>Saturday, October 24, 2026</strong>. Please bring gloves, sacks, and a helping hand so we can keep our school clean and green.',
    comments: []
  },
  {
    id: 11,
    category: 'Reminders',
    title: 'Fair Forms Deadline',
    date: '2026-10-24',
    time: '',
    location: '',
    photo: 'images/fair-forms-deadline.jpg',
    details:
      'Reminder: please submit your Science and Math Fair participation forms to your class adviser on or before <strong>Saturday, October 24, 2026</strong>.',
    comments: []
  }
];

const STORAGE_KEYS = {
  users: 'msies_users',
  announcements: 'msies_announcements',
  chatRooms: 'msies_chatrooms',
  directThreads: 'msies_direct_threads',
  chatHidden: 'msies_chat_hidden',
  nextId: 'msies_next_announcement_id',
  currentUser: 'msies_current_user',
  contactRequests: 'msies_contact_requests',
  modCases: 'msies_mod_cases',
  spamLog: 'msies_spam_log',
  postActivity: 'msies_post_activity'
};

function initData() {
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.announcements)) {
    localStorage.setItem(STORAGE_KEYS.announcements, JSON.stringify(DEFAULT_ANNOUNCEMENTS));
    localStorage.setItem(STORAGE_KEYS.nextId, '4');
  }
  if (!localStorage.getItem(STORAGE_KEYS.chatRooms)) {
    localStorage.setItem(STORAGE_KEYS.chatRooms, JSON.stringify(DEFAULT_CHATROOMS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.directThreads)) {
    localStorage.setItem(STORAGE_KEYS.directThreads, JSON.stringify([]));
  }
  migrateChatRooms();
  migrateAdminRole();
  migrateOctoberPosts();
  migrateMoreEvents();
  migrateCommentIds();
}

/* Adds the October 2026 posts once to an existing set of announcements
   (skipping any id that is already taken) and moves the id counter past
   them, so posts made later never reuse an id. */
function migrateOctoberPosts() {
  if (localStorage.getItem('msies_october_posts') === 'done') return;
  const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.announcements) || '[]');
  OCTOBER_POSTS.forEach((p) => {
    if (!list.some((a) => a.id === p.id || (a.title === p.title && a.date === p.date))) {
      list.push(JSON.parse(JSON.stringify(p)));
    }
  });
  localStorage.setItem(STORAGE_KEYS.announcements, JSON.stringify(list));
  const maxId = list.reduce((m, a) => Math.max(m, Number(a.id) || 0), 0);
  const next = parseInt(localStorage.getItem(STORAGE_KEYS.nextId), 10) || 0;
  if (next <= maxId) localStorage.setItem(STORAGE_KEYS.nextId, String(maxId + 1));
  localStorage.setItem('msies_october_posts', 'done');
}

/* Adds the MORE_EVENTS once. Earlier versions of these sample events
   (same ids, spread over different dates) are replaced; nothing else is
   touched. Keeps the id counter ahead of them. */
function migrateMoreEvents() {
  if (localStorage.getItem('msies_more_events_v2') === 'done') return;
  const OLD_TITLES = ['Science and Math Fair', 'Report Card Distribution', 'Bonifacio Day \u2014 No classes'];
  let list = JSON.parse(localStorage.getItem(STORAGE_KEYS.announcements) || '[]');
  list = list.filter((a) => !(a.id >= 9 && a.id <= 11 && OLD_TITLES.includes(a.title)));
  MORE_EVENTS.forEach((p) => {
    if (!list.some((a) => a.id === p.id || (a.title === p.title && a.date === p.date))) {
      list.push(JSON.parse(JSON.stringify(p)));
    }
  });
  localStorage.setItem(STORAGE_KEYS.announcements, JSON.stringify(list));
  const maxId = list.reduce((m, a) => Math.max(m, Number(a.id) || 0), 0);
  const next = parseInt(localStorage.getItem(STORAGE_KEYS.nextId), 10) || 0;
  if (next <= maxId) localStorage.setItem(STORAGE_KEYS.nextId, String(maxId + 1));
  localStorage.setItem('msies_more_events_v2', 'done');
}

/* The old "admin" role is now "Super Admin" (manages accounts).
   Teachers are the school's day-to-day admins (posts, calendar). */
function migrateAdminRole() {
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
  if (users.some((u) => u.role === 'admin')) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users.map((u) => (u.role === 'admin' ? { ...u, role: 'superadmin' } : u))));
  }
  const raw = localStorage.getItem(STORAGE_KEYS.currentUser);
  if (raw) {
    const me = JSON.parse(raw);
    if (me.role === 'admin') localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify({ ...me, role: 'superadmin' }));
  }
}
/* Older saved data (from earlier versions of the prototype) can be
   missing a demo account, which makes the demo login fail. Re-add any
   demo account whose email isn't in storage; existing accounts are
   never overwritten. */
function ensureDemoAccounts() {
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
  const missing = DEFAULT_USERS.filter((d) => !users.some((u) => String(u.email).toLowerCase() === d.email));
  if (missing.length) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify([...users, ...missing.map((m) => ({ ...m }))]));
  }
}
/* Older saved data can have the demo parent and student unlinked.
   Link them once (both directions); later unlinking is respected. */
function ensureDemoLinks() {
  if (localStorage.getItem('msies_demo_links') === 'done') return;
  const pair = ['maria.reyes@email.com', 'juan.reyes@email.com'];
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
  if (!pair.every((e) => users.some((u) => String(u.email).toLowerCase() === e))) return;
  users.forEach((u) => {
    const mine = String(u.email).toLowerCase();
    if (!pair.includes(mine)) return;
    const other = pair.find((e) => e !== mine);
    const linked = u.linked || [];
    if (!linked.some((e) => String(e).toLowerCase() === other)) u.linked = [...linked, other];
  });
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  localStorage.setItem('msies_demo_links', 'done');
}

/* One-time sample conversation between the demo teacher and parent,
   so the direct-message feature can be tried right away. */
function migrateDemoDm() {
  if (localStorage.getItem('msies_demo_dm') === 'done') return;
  const t = 'j.torres@msies.edu.ph';
  const p = 'maria.reyes@email.com';
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
  if (![t, p].every((e) => users.some((u) => String(u.email).toLowerCase() === e))) return;
  const threads = JSON.parse(localStorage.getItem(STORAGE_KEYS.directThreads) || '[]');
  const id = dmThreadId(t, p);
  if (!threads.some((x) => x.id === id)) {
    threads.push({
      id,
      participants: [t, p].sort(),
      messages: [
        { author: 'Mrs. Torres', authorEmail: t, text: 'Good afternoon, Mrs. Reyes! Juan did very well in class today.' },
        { author: 'Maria Reyes', authorEmail: p, text: 'Thank you po, Ma\'am! Please let me know if he needs help with anything.' }
      ]
    });
    localStorage.setItem(STORAGE_KEYS.directThreads, JSON.stringify(threads));
  }
  localStorage.setItem('msies_demo_dm', 'done');
}

ensureDemoAccounts();
ensureDemoLinks();
initData();
migrateDemoDm();

/* ---- Users ---- */
function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
}
function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  syncAutoJoinRooms(users);
}

/* ---- Current session ---- */
function getCurrentUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.currentUser);
  return raw ? JSON.parse(raw) : null;
}
function setCurrentUser(user) {
  localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
}
function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.currentUser);
}
/* Staff = teachers (the school admins) and super admins. They can
   post announcements and manage the calendar. Only the Super Admin
   can delete other people's comments (teachers: their own only).
   The Super Admin can't comment, but receives comment reports. */
function isStaff() {
  const u = getCurrentUser();
  return !!u && (u.role === 'superadmin' || u.role === 'teacher');
}
/* Only super admins can manage accounts (and other super admins). */
function isSuperAdmin() {
  const u = getCurrentUser();
  return !!u && u.role === 'superadmin';
}
function updateCurrentUser(data) {
  const current = getCurrentUser();
  if (!current) return;
  const updated = { ...current, ...data };
  const oldEmail = current.email.toLowerCase();
  const emailChanged = data.email && data.email.toLowerCase() !== oldEmail;
  const users = getUsers().map((u) => {
    if (u.email.toLowerCase() === oldEmail) return { ...u, ...data };
    /* keep parent/student links pointing at the renamed email */
    if (emailChanged && (u.linked || []).some((e) => e.toLowerCase() === oldEmail)) {
      return { ...u, linked: u.linked.map((e) => (e.toLowerCase() === oldEmail ? data.email : e)) };
    }
    return u;
  });
  saveUsers(users);
  setCurrentUser(updated);
  return updated;
}

/* ---- Parent <-> student account links ---- */

/* Connects two accounts to each other (both directions). */
function linkAccounts(emailA, emailB) {
  const a = emailA.toLowerCase();
  const b = emailB.toLowerCase();
  const users = getUsers().map((u) => {
    const mail = u.email.toLowerCase();
    const other = mail === a ? emailB : mail === b ? emailA : null;
    if (!other) return u;
    const linked = u.linked || [];
    return linked.some((e) => e.toLowerCase() === other.toLowerCase()) ? u : { ...u, linked: [...linked, other] };
  });
  saveUsers(users);
}

/* The accounts connected to this email (a parent's children, or a
   student's parents), read fresh from storage. */
function getLinkedAccounts(email) {
  const me = getUserByEmail(email);
  if (!me) return [];
  return (me.linked || []).map(getUserByEmail).filter(Boolean);
}
/* ---- Linking a parent to a student who registered first ----
   Students create their own account first. A parent then registers
   (or later uses Profile > "Link a student account") and links to
   that account by giving the child's login email AND full name, so
   a parent can't link to a stranger just by guessing an email.
   One student can have up to MAX_PARENTS_PER_STUDENT linked parents
   or guardians; one parent can link several children. */
const MAX_PARENTS_PER_STUDENT = 2;
const LINK_MESSAGES = {
  'not-found': 'No student account was found with that email. Your child needs to create their student account first, then you can link to it.',
  'not-student': 'That email belongs to an account that is not a student account.',
  'name-mismatch': "That name doesn't match the student account with that email. Enter your child's full name exactly as they registered it.",
  'already-linked': "You're already linked to this student.",
  'full': 'This student account already has the maximum of ' + MAX_PARENTS_PER_STUDENT + ' linked parent or guardian accounts. Please contact the school if this is a mistake.',
  'not-parent': 'Only parent accounts can link to a student.'
};
function sameFullName(a, b) {
  const norm = (n) => String(n || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();
  return !!norm(a) && norm(a) === norm(b);
}
/* Checks (without saving) whether a parent may link to the student
   with this email and full name. parentEmail may be empty while the
   parent is still registering.
   Returns { ok: true, student } or { ok: false, reason, student? }
   with reason one of the keys of LINK_MESSAGES. */
function checkStudentLink(parentEmail, childEmail, childName) {
  const student = getUserByEmail(String(childEmail || '').trim());
  if (!student) return { ok: false, reason: 'not-found' };
  if (student.role !== 'student') return { ok: false, reason: 'not-student' };
  if (!sameFullName(student.name, childName)) return { ok: false, reason: 'name-mismatch' };
  const parents = (student.linked || []).map(getUserByEmail).filter((u) => u && u.role === 'parent');
  if (parentEmail && parents.some((p) => p.email.toLowerCase() === String(parentEmail).toLowerCase())) {
    return { ok: false, reason: 'already-linked', student };
  }
  if (parents.length >= MAX_PARENTS_PER_STUDENT) return { ok: false, reason: 'full', student };
  return { ok: true, student };
}
/* Links an existing parent account to a student account (both
   directions). The parent picks up the child's grade/section if they
   don't have one yet. Returns the same shape as checkStudentLink. */
function linkParentToStudent(parentEmail, childEmail, childName) {
  const parent = getUserByEmail(parentEmail);
  if (!parent || parent.role !== 'parent') return { ok: false, reason: 'not-parent' };
  const check = checkStudentLink(parent.email, childEmail, childName);
  if (!check.ok) return check;
  linkAccounts(parent.email, check.student.email);
  if (!parent.section && check.student.section) {
    saveUsers(getUsers().map((u) => (
      u.email.toLowerCase() === parent.email.toLowerCase() ? { ...u, section: check.student.section } : u
    )));
  }
  return check;
}
function getUserByEmail(email) {
  if (!email) return null;
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}
/* Lower-cases, strips accents and collapses extra spaces so
   "  JUAN   dela Cruz " and "juan dela cruz" compare equal. */
function normalizeText(str) {
  return String(str == null ? '' : str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Directory search used by the navbar search bar. Every registered
   account is searchable the moment it exists. Matching is
   order-independent ("cruz juan" finds Juan Dela Cruz) and also looks
   at email, role and grade/section. Excludes the current user (you
   already have your own Profile page) and the Super Admin (people
   reach them through Profile > Help). Best matches come first:
   name starts with the query, then a name word starts with it, then
   anything else; ties keep sign-up order. */
function searchUsers(query, limit) {
  const q = normalizeText(query);
  if (!q) return [];
  const tokens = q.split(' ');
  const current = getCurrentUser();
  const me = current ? (current.email || '').toLowerCase() : '';
  const scored = [];

  getUsers().forEach((u, index) => {
    if (!u || !u.email) return;
    if (me && u.email.toLowerCase() === me) return;
    if (u.role === 'superadmin') return; /* the Super Admin isn't listed in search */
    const name = normalizeText(u.name);
    const hay = [name, normalizeText(u.email), normalizeText(u.role), normalizeText(u.section)].join(' ');
    if (!tokens.every((t) => hay.includes(t))) return;

    let score = 0;
    if (name.startsWith(q)) score = 3;
    else if (name.split(' ').some((w) => w.startsWith(tokens[0]))) score = 2;
    else if (name.includes(q)) score = 1;
    scored.push({ u, score, index });
  });

  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.slice(0, limit || 25).map((x) => x.u);
}

/* ---- Announcements ---- */
function getAnnouncements() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.announcements));
}
function saveAnnouncements(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.announcements, JSON.stringify(list));
    return true;
  } catch (e) {
    /* Browser storage is full (usually too many photos). Tell the user
       instead of failing silently. */
    if (typeof alert === 'function') {
      alert('Could not save: browser storage is full. Try removing the photo from this post or deleting older posts with photos.');
    }
    return false;
  }
}
function addAnnouncement(data) {
  const list = getAnnouncements();
  let nextId = parseInt(localStorage.getItem(STORAGE_KEYS.nextId), 10) || (list.length + 1);
  const newItem = { id: nextId, comments: [], ...data };
  list.push(newItem);
  saveAnnouncements(list);
  localStorage.setItem(STORAGE_KEYS.nextId, String(nextId + 1));
  return newItem;
}
function updateAnnouncement(id, data) {
  const list = getAnnouncements().map((a) => (a.id === id ? { ...a, ...data } : a));
  saveAnnouncements(list);
}
function deleteAnnouncement(id) {
  const list = getAnnouncements().filter((a) => a.id !== id);
  saveAnnouncements(list);
}
/* ---- Comments ----
   Every comment has a stable id (cid) so moderation actions and
   reports always hit the right comment, even if other comments
   above it were deleted in the meantime. Comments saved before
   ids existed get one the next time any page loads. */
function newCommentId() {
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function migrateCommentIds() {
  const raw = localStorage.getItem(STORAGE_KEYS.announcements);
  if (!raw) return;
  const list = JSON.parse(raw);
  let changed = false;
  list.forEach((a) => (a.comments || []).forEach((c) => {
    if (!c.cid) { c.cid = newCommentId(); changed = true; }
  }));
  if (changed) localStorage.setItem(STORAGE_KEYS.announcements, JSON.stringify(list));
}

/* Returns { ok, reason?, flagged?, analysis? }
     reason: 'not-allowed' | 'muted' | 'blocked'
   'blocked' means an automatic filter (spam and/or abuse) refused the
   comment (it is logged for the Super Admin); analysis.kind says
   which one. flagged:true means it was posted but also sent to the
   Super Admin review queue. Needs spamFilter.js and abuseFilter.js. */
function addComment(id, text) {
  if (isSuperAdmin()) return { ok: false, reason: 'not-allowed' }; /* Super Admin can't comment on posts */
  if (isCurrentUserMuted()) return { ok: false, reason: 'muted' }; /* muted accounts can't comment */
  const user = getCurrentUser();
  const screen = screenComment(text, id, false);
  if (screen.verdict === 'block') return { ok: false, reason: 'blocked', analysis: screen };
  const comment = {
    cid: newCommentId(),
    author: user ? user.name : 'Guest',
    authorEmail: user ? user.email : '',
    text,
    at: Date.now()
  };
  if (screen.verdict === 'flag') comment.autoFlag = autoFlagFrom(screen);
  const list = getAnnouncements().map((a) => (
    a.id !== id ? a : { ...a, comments: [...(a.comments || []), comment] }
  ));
  saveAnnouncements(list);
  return { ok: true, flagged: screen.verdict === 'flag', analysis: screen };
}

/* Edits the text of a comment and marks it as edited. The new text
   goes through the spam filter too, so a clean comment can't be
   edited into spam. Returns { ok, reason?, flagged?, analysis? }. */
function editComment(id, index, text) {
  const screen = screenComment(text, id, true);
  if (screen.verdict === 'block') return { ok: false, reason: 'blocked', analysis: screen };
  const list = getAnnouncements().map((a) => {
    if (a.id !== id) return a;
    return {
      ...a,
      comments: a.comments.map((c, i) => {
        if (i !== index) return c;
        const next = { ...c, text, edited: true };
        if (screen.verdict === 'flag') next.autoFlag = autoFlagFrom(screen);
        else delete next.autoFlag; /* the text that was flagged is gone */
        return next;
      })
    };
  });
  saveAnnouncements(list);
  return { ok: true, flagged: screen.verdict === 'flag', analysis: screen };
}

/* Removes a comment. If it had open reports or an auto-flag, a copy
   is kept in the moderation history first (who removed it, and why
   it was in the queue). meta: { warned, warnReason, muted }. */
function deleteComment(id, index, meta) {
  const post = getAnnouncements().find((a) => a.id === id);
  const c = post && post.comments[index];
  /* Only the Super Admin can delete someone else's comment; everyone
     else (teachers included) can only delete their own. */
  if (c && !isSuperAdmin()) {
    const me = getCurrentUser();
    const author = findCommentAuthor(c);
    if (!me || !author || author.email.toLowerCase() !== me.email.toLowerCase()) return;
  }
  if (c && ((c.reports || []).length || c.autoFlag)) recordModerationCase(post, c, 'deleted', meta);
  const list = getAnnouncements().map((a) => {
    if (a.id !== id) return a;
    return { ...a, comments: a.comments.filter((_, i) => i !== index) };
  });
  saveAnnouncements(list);
}

/* Same as deleteComment, but finds the comment by its id. Used by the
   review queue so a stale page can never delete the wrong comment. */
function deleteCommentById(postId, cid, meta) {
  const post = getAnnouncements().find((a) => a.id === postId);
  const index = post ? post.comments.findIndex((c) => c.cid === cid) : -1;
  if (index < 0) return false;
  deleteComment(postId, index, meta);
  return true;
}

/* ---- Automatic screening (spam + abuse) ----
   Runs the spam filter and the abuse filter on a comment about to be
   posted or edited, and combines them: the worse verdict wins, and
   the reasons come from whichever filter(s) actually fired.
   Teachers are trusted (they often share form links) and skip both.
   Each attempt is remembered for ten minutes so copy-paste and
   flooding can be recognised; blocked attempts are logged for the
   Super Admin. The result has kind: 'spam' | 'abuse' | 'spam+abuse'
   (empty when the comment is fine) and categories (abuse types). */
const CLEAN_RESULT = { score: 0, verdict: 'ok', reasons: [], matches: [], categories: [], kind: '' };
const VERDICT_RANK = { ok: 0, flag: 1, block: 2 };

function combineScreens(spam, abuse) {
  const fired = [];
  if (spam.verdict !== 'ok') fired.push(['spam', spam]);
  if (abuse.verdict !== 'ok') fired.push(['abuse', abuse]);
  if (!fired.length) return { ...CLEAN_RESULT, score: Math.max(spam.score, abuse.score) };
  const uniq = (list) => Array.from(new Set(list));
  const worst = fired.reduce((w, f) => (VERDICT_RANK[f[1].verdict] > VERDICT_RANK[w] ? f[1].verdict : w), 'flag');
  return {
    score: Math.max(...fired.map((f) => f[1].score)),
    verdict: worst,
    reasons: uniq([].concat(...fired.map((f) => f[1].reasons || []))),
    matches: uniq([].concat(...fired.map((f) => f[1].matches || []))),
    categories: abuse.verdict !== 'ok' ? (abuse.categories || []) : [],
    kind: fired.map((f) => f[0]).join('+')
  };
}

function screenComment(text, postId, isEdit) {
  const me = getCurrentUser();
  if (!me || me.role === 'teacher' || me.role === 'superadmin') return { ...CLEAN_RESULT };
  const email = me.email.toLowerCase();
  const recent = isEdit ? undefined : getRecentPostActivity(email);
  /* a filter script that isn't loaded on this page is simply skipped */
  const spam = typeof analyzeSpam === 'function' ? analyzeSpam(text, { recent }) : { ...CLEAN_RESULT };
  const abuse = typeof analyzeAbuse === 'function' ? analyzeAbuse(text) : { ...CLEAN_RESULT };
  const result = combineScreens(spam, abuse);
  if (!isEdit && typeof spamKey === 'function') recordPostActivity(email, text);
  if (result.verdict === 'block') logSpamBlock(me, postId, text, result);
  return result;
}
function autoFlagFrom(result) {
  return { score: result.score, reasons: result.reasons, matches: result.matches, kind: result.kind || 'spam', categories: result.categories || [], at: Date.now() };
}

function readJsonList(key) {
  try { const v = JSON.parse(localStorage.getItem(key)); return Array.isArray(v) ? v : []; } catch (e) { return []; }
}
const SPAM_MEMORY_MS = 10 * 60 * 1000;
function readPostActivity() {
  try { const v = JSON.parse(localStorage.getItem(STORAGE_KEYS.postActivity)); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; }
}
function getRecentPostActivity(email) {
  const cutoff = Date.now() - SPAM_MEMORY_MS;
  return (readPostActivity()[email] || []).filter((r) => r.at > cutoff);
}
function recordPostActivity(email, text) {
  const cutoff = Date.now() - SPAM_MEMORY_MS;
  const map = readPostActivity();
  Object.keys(map).forEach((k) => {
    map[k] = map[k].filter((r) => r.at > cutoff);
    if (!map[k].length) delete map[k];
  });
  map[email] = [...(map[email] || []), { at: Date.now(), key: spamKey(text) }].slice(-20);
  localStorage.setItem(STORAGE_KEYS.postActivity, JSON.stringify(map));
}

/* Comments the spam or abuse filter refused. Newest last; capped at 100. */
function getSpamLog() { return readJsonList(STORAGE_KEYS.spamLog); }
function logSpamBlock(user, postId, text, result) {
  const post = getAnnouncements().find((a) => a.id === postId);
  const log = getSpamLog();
  log.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    at: Date.now(),
    userEmail: user.email.toLowerCase(),
    userName: user.name,
    postId,
    postTitle: post ? post.title : '',
    text: String(text).slice(0, 300),
    score: result.score,
    reasons: result.reasons,
    matches: result.matches,
    kind: result.kind || 'spam',
    categories: result.categories || []
  });
  localStorage.setItem(STORAGE_KEYS.spamLog, JSON.stringify(log.slice(-100)));
}
function removeSpamLogEntry(id) {
  localStorage.setItem(STORAGE_KEYS.spamLog, JSON.stringify(getSpamLog().filter((e) => e.id !== id)));
}
function clearSpamLog() {
  localStorage.setItem(STORAGE_KEYS.spamLog, JSON.stringify([]));
}

/* ---- Comment reports ----
   Teachers, parents and students can report someone else's comment
   (reason + optional details). Reports and spam-filter flags both
   land in one review queue for the Super Admin. A report is
   { by, reason, note, at } stored on the comment.
   Returns 'ok' | 'duplicate' | 'self' | 'limit' | 'denied' | 'missing'. */
const REPORT_LIMIT_PER_HOUR = 10;
function reportComment(postId, cid, reason, note) {
  const user = getCurrentUser();
  if (!user || user.role === 'superadmin') return 'denied';
  const who = user.email.toLowerCase();
  const list = getAnnouncements();
  const hourAgo = Date.now() - 3600000;
  let recentReports = 0;
  list.forEach((a) => (a.comments || []).forEach((c) => (c.reports || []).forEach((r) => {
    if (r.by === who && (r.at || 0) > hourAgo) recentReports++;
  })));
  if (recentReports >= REPORT_LIMIT_PER_HOUR) return 'limit';

  let result = 'missing';
  const next = list.map((a) => {
    if (a.id !== postId) return a;
    return {
      ...a,
      comments: a.comments.map((c) => {
        if (c.cid !== cid) return c;
        if ((c.authorEmail || '').toLowerCase() === who) { result = 'self'; return c; }
        const reports = c.reports || [];
        /* one report per person per comment, even after the Super Admin dismissed it */
        if (reports.some((r) => r.by === who) || (c.reporters || []).includes(who)) { result = 'duplicate'; return c; }
        result = 'ok';
        return { ...c, reports: [...reports, { by: who, reason, note: String(note || '').trim().slice(0, 200), at: Date.now() }] };
      })
    };
  });
  if (result === 'ok') saveAnnouncements(next);
  return result;
}

/* ---- Review queue (Super Admin) ----
   Open items = comments with at least one user report or a
   spam-filter flag. Resolving one (dismiss or delete) moves it into
   the history, with a copy of the comment as it was. */
function getModerationQueue() {
  const out = [];
  getAnnouncements().forEach((a) => (a.comments || []).forEach((c, i) => {
    if ((c.reports || []).length || c.autoFlag) out.push({ post: a, comment: c, index: i });
  }));
  return out;
}
function getOpenModerationCount() {
  return getModerationQueue().length;
}
/* Everything waiting on the Super Admin: open comment reviews plus
   pending contact-info requests. Shown as a badge on the dashboard menu. */
function getAdminAttentionCount() {
  const pending = getContactRequests().filter((r) => r.status === 'pending').length;
  return getOpenModerationCount() + pending;
}
function getModerationCases() { return readJsonList(STORAGE_KEYS.modCases); }

function recordModerationCase(post, c, action, extra) {
  const me = getCurrentUser();
  const x = extra || {};
  const cases = getModerationCases();
  cases.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    at: Date.now(),
    action, /* 'dismissed' | 'deleted' */
    by: me ? { name: me.name, email: me.email.toLowerCase(), role: me.role } : null,
    postId: post.id,
    postTitle: post.title,
    cid: c.cid,
    authorName: c.author,
    authorEmail: (c.authorEmail || '').toLowerCase(),
    text: c.text,
    reports: (c.reports || []).map((r) => ({ by: r.by, reason: r.reason, note: r.note || '', at: r.at })),
    autoFlag: c.autoFlag || null,
    warned: !!x.warned,
    warnReason: x.warnReason || '',
    muted: !!x.muted
  });
  localStorage.setItem(STORAGE_KEYS.modCases, JSON.stringify(cases.slice(-200)));
}

/* Keeps the comment and closes the review. We remember who reported
   it so the same people can't report it again. */
function dismissComment(postId, cid) {
  let snapPost = null;
  let snapComment = null;
  const list = getAnnouncements().map((a) => {
    if (a.id !== postId) return a;
    return {
      ...a,
      comments: a.comments.map((c) => {
        if (c.cid !== cid) return c;
        snapPost = a;
        snapComment = c;
        const reporters = Array.from(new Set([...(c.reporters || []), ...(c.reports || []).map((r) => r.by)]));
        const next = { ...c, reports: [], reporters, reviewedAt: Date.now() };
        delete next.autoFlag;
        return next;
      })
    };
  });
  if (!snapComment) return false;
  if ((snapComment.reports || []).length || snapComment.autoFlag) recordModerationCase(snapPost, snapComment, 'dismissed');
  saveAnnouncements(list);
  return true;
}

/* Finds the registered user behind a comment so the card can link to
   their profile / start a DM. New comments store authorEmail; older
   ones (saved before that existed) fall back to matching the display
   name, ignoring a trailing "(Grade 3 Adviser)" style suffix. Returns
   null for guests or names that match no account. */
function findCommentAuthor(comment) {
  if (!comment) return null;
  const byEmail = getUserByEmail(comment.authorEmail);
  if (byEmail) return byEmail;
  const name = (comment.author || '').replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase();
  if (!name || name === 'guest') return null;
  return getUsers().find((u) => u.name.trim().toLowerCase() === name) || null;
}

/* ---- Moderation: warn / mute ----
   Super Admin can warn a user for a violation (e.g. chat abuse) or
   mute them. Stored on the user record in msies_users:
     warnings: [{ reason, note, at, by, seen }]
     muted: true, mutedAt
   A muted user can still read posts and chats but can't comment or
   send messages. Always read fresh from storage (not the cached
   current-user copy) so changes apply right away. */
const WARNING_REASONS = [
  'Abusive or offensive language',
  'Harassment or bullying',
  'Spam or irrelevant content',
  'Sharing inappropriate content',
  'Other violation of the community rules'
];

function getWarnings(email) {
  const u = getUserByEmail(email);
  return (u && u.warnings) || [];
}
function isUserMuted(email) {
  const u = getUserByEmail(email);
  return !!(u && u.muted);
}
/* True when the current user can't comment or chat: muted by the
   admin, or under an active temporary restriction. */
function isCurrentUserMuted() {
  return !!getCurrentUserBlockMessage();
}
/* The notice shown in place of the comment box / chat input, or
   null when the user can post normally. */
function getCurrentUserBlockMessage() {
  const me = getCurrentUser();
  if (!me) return null;
  const st = getAccountStatus(me.email);
  if (st.state === 'restricted') {
    return 'Your account is temporarily restricted until ' + fmtStatusDate(st.until) +
      '. You can read posts and messages but can\'t comment or chat.' + (st.reason ? ' Reason: ' + st.reason : '');
  }
  if (isUserMuted(me.email)) {
    return 'You have been muted by the school admin. You can read posts and messages but can\'t comment or chat.';
  }
  return null;
}
/* Only the Super Admin can't be muted or warned (teachers can be). */
function canModerateUser(email) {
  const u = getUserByEmail(email);
  return !!u && u.role !== 'superadmin';
}
function warnUser(email, reason, note) {
  if (!canModerateUser(email)) return false;
  const by = getCurrentUser();
  const users = getUsers().map((u) => {
    if (u.email.toLowerCase() !== email.toLowerCase()) return u;
    const warnings = [...(u.warnings || []), {
      reason, note: note || '', at: Date.now(), by: by ? by.name : 'Super Admin', seen: false
    }];
    return { ...u, warnings };
  });
  saveUsers(users);
  return true;
}
function setUserMuted(email, muted) {
  if (!canModerateUser(email)) return false;
  const users = getUsers().map((u) => {
    if (u.email.toLowerCase() !== email.toLowerCase()) return u;
    const next = { ...u, muted: !!muted };
    if (muted) next.mutedAt = Date.now(); else delete next.mutedAt;
    return next;
  });
  saveUsers(users);
  return true;
}
/* Removes one warning (identified by its timestamp) from a user's
   record, or all of them when `at` is omitted. Super Admin only. */
function removeWarning(email, at) {
  if (!isSuperAdmin() || !canModerateUser(email)) return false;
  updateUserRecord(email, (u) => {
    let left = [];
    if (at != null) {
      left = (u.warnings || []).slice();
      const i = left.findIndex((w) => w.at === at);
      if (i >= 0) left.splice(i, 1);
    }
    if (left.length) u.warnings = left; else delete u.warnings;
    return u;
  });
  return true;
}
/* Warnings the current user hasn't acknowledged yet. */
function getUnseenWarnings() {
  const me = getCurrentUser();
  return me ? getWarnings(me.email).filter((w) => !w.seen) : [];
}
function markWarningsSeen() {
  const me = getCurrentUser();
  if (!me) return;
  const users = getUsers().map((u) => (
    u.email.toLowerCase() === me.email.toLowerCase()
      ? { ...u, warnings: (u.warnings || []).map((w) => ({ ...w, seen: true })) }
      : u
  ));
  saveUsers(users);
}

/* ---- Account status: temporary restriction, suspension, disabling ----
   Like Facebook's account controls, Super Admin can apply to parent
   and student accounts:
     restriction  - temporary: can log in and read, but can't comment
                    or chat until the date passes.
     suspension   - temporary: can't log in until the date passes.
     disabled     - can't log in until the Super Admin re-enables it.
   Stored on the user record in msies_users:
     restriction: { until, reason, at }
     suspension:  { until, reason, at }
     disabled:    { reason, at }
   Expired restrictions/suspensions are simply treated as lifted. */
const STATUS_DURATIONS = [
  { days: 1, label: '1 day' },
  { days: 3, label: '3 days' },
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' }
];
function fmtStatusDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) +
    ', ' + new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
/* -> { state: 'active'|'restricted'|'suspended'|'disabled', until?, reason? }
   Priority: disabled > suspended > restricted. */
function getAccountStatus(email) {
  const u = getUserByEmail(email);
  if (!u) return { state: 'active' };
  const now = Date.now();
  if (u.disabled) return { state: 'disabled', reason: u.disabled.reason || '' };
  if (u.suspension && u.suspension.until > now) {
    return { state: 'suspended', until: u.suspension.until, reason: u.suspension.reason || '' };
  }
  if (u.restriction && u.restriction.until > now) {
    return { state: 'restricted', until: u.restriction.until, reason: u.restriction.reason || '' };
  }
  return { state: 'active' };
}
/* Only parent and student accounts can be restricted/suspended/disabled. */
function canManageStatus(email) {
  const u = getUserByEmail(email);
  return !!u && (u.role === 'parent' || u.role === 'student');
}
function updateUserRecord(email, fn) {
  saveUsers(getUsers().map((u) => (u.email.toLowerCase() === email.toLowerCase() ? fn({ ...u }) : u)));
}
function restrictAccount(email, days, reason) {
  if (!canManageStatus(email)) return false;
  updateUserRecord(email, (u) => {
    u.restriction = { until: Date.now() + days * 86400000, reason: reason || '', at: Date.now() };
    return u;
  });
  return true;
}
function suspendAccount(email, days, reason) {
  if (!canManageStatus(email)) return false;
  updateUserRecord(email, (u) => {
    u.suspension = { until: Date.now() + days * 86400000, reason: reason || '', at: Date.now() };
    return u;
  });
  return true;
}
function disableAccount(email, reason) {
  if (!canManageStatus(email)) return false;
  updateUserRecord(email, (u) => {
    u.disabled = { reason: reason || '', at: Date.now() };
    return u;
  });
  return true;
}
/* Lifts whatever is currently applied: restriction, suspension or
   disabling (everything is cleared). */
function restoreAccount(email) {
  updateUserRecord(email, (u) => {
    delete u.restriction;
    delete u.suspension;
    delete u.disabled;
    return u;
  });
}
/* Message for a login attempt on a suspended/disabled account, or
   null when the account may log in. */
function getLoginBlockMessage(email) {
  const st = getAccountStatus(email);
  const why = st.reason ? '\n\nReason: ' + st.reason : '';
  if (st.state === 'disabled') {
    return 'This account has been disabled by the school admin. Please contact the school office.' + why;
  }
  if (st.state === 'suspended') {
    return 'This account is suspended until ' + fmtStatusDate(st.until) + '.' + why;
  }
  return null;
}

/* ---- Chat rooms ---- */
function getChatRooms() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.chatRooms));
}
function saveChatRooms(rooms) {
  localStorage.setItem(STORAGE_KEYS.chatRooms, JSON.stringify(rooms));
}
function sendChatMessage(roomId, text) {
  if (isCurrentUserMuted()) return false; /* muted accounts can't chat */
  const user = getCurrentUser();
  const author = user ? user.name : 'Me';
  const rooms = getChatRooms().map((r) =>
    r.id === roomId ? { ...r, messages: [...r.messages, { author, text }] } : r
  );
  saveChatRooms(rooms);
}

/* ---- Group membership, rename, create, delete-for-me ----
   Every room has a memberEmails list and only its members see it.
   The original school rooms are marked autoJoin, so anyone who
   registers later is added to them automatically (as before, where
   everyone saw every room). Groups made with "+ New group" are
   private to whoever is added. Rooms keep one shared message list;
   "system" messages record who renamed or added whom. */
function staffEmails(users) {
  return (users || getUsers()).filter((u) => u.role === 'superadmin' || u.role === 'teacher').map((u) => u.email.toLowerCase());
}
/* Class rooms (gradeRoom: 'Grade 3') hold the students of that grade
   plus the room's teacher(s). Parents are not members. */
function gradeRoomMembers(room, users) {
  const list = users || getUsers();
  const grade = String(room.gradeRoom || '').toLowerCase();
  const students = list
    .filter((u) => u.role === 'student' && String(u.section || '').toLowerCase().startsWith(grade))
    .map((u) => u.email.toLowerCase());
  const teachers = (room.teacherEmails || [])
    .map((e) => e.toLowerCase())
    .filter((e) => list.some((u) => u.email.toLowerCase() === e));
  return [...teachers, ...students.filter((e) => !teachers.includes(e))];
}
function migrateChatRooms() {
  let rooms = getChatRooms();
  let changed = false;
  /* One time: chat used to have grade/PTA rooms and groups. It now
     only has the Staff room and the School Admin Broadcast. */
  if (localStorage.getItem('msies_rooms_set') !== 'staff-admin') {
    rooms = rooms.filter((r) => r.id === 'admin' || r.id === 'staff');
    DEFAULT_CHATROOMS.forEach((d) => {
      if (!rooms.some((r) => r.id === d.id)) rooms.push(JSON.parse(JSON.stringify(d)));
    });
    rooms.sort((a, b) => (a.id === 'staff' ? -1 : 0) - (b.id === 'staff' ? -1 : 0));
    localStorage.setItem('msies_rooms_set', 'staff-admin');
    changed = true;
  }
  /* One time: add the Grade 3 class group chat to existing saved data. */
  if (localStorage.getItem('msies_grade3_room') !== 'done') {
    const g3 = DEFAULT_CHATROOMS.find((d) => d.id === 'grade3');
    if (g3 && !rooms.some((r) => r.id === 'grade3')) {
      const at = rooms.findIndex((r) => r.id === 'admin');
      const copy = JSON.parse(JSON.stringify(g3));
      if (at === -1) rooms.push(copy); else rooms.splice(at, 0, copy);
      changed = true;
    }
    localStorage.setItem('msies_grade3_room', 'done');
  }
  const emails = getUsers().map((u) => u.email.toLowerCase());
  rooms.forEach((r) => {
    if (r.gradeRoom && !Array.isArray(r.memberEmails)) {
      r.memberEmails = gradeRoomMembers(r);
      changed = true;
    }
    if (!Array.isArray(r.memberEmails)) {
      r.memberEmails = r.staffOnly ? staffEmails() : [...emails];
      r.autoJoin = true;
      changed = true;
    }
  });
  if (changed) saveChatRooms(rooms);
}
function syncAutoJoinRooms(users) {
  const raw = localStorage.getItem(STORAGE_KEYS.chatRooms);
  if (!raw) return;
  const everyone = (users || getUsers()).map((u) => u.email.toLowerCase());
  const staff = staffEmails(users);
  let changed = false;
  const rooms = JSON.parse(raw);
  rooms.forEach((r) => {
    if (r.gradeRoom) {
      const have = r.memberEmails || [];
      const add = gradeRoomMembers(r, users).filter((e) => !have.includes(e));
      if (add.length) { r.memberEmails = [...have, ...add]; changed = true; }
      return;
    }
    if (!r.autoJoin) return;
    const have = r.memberEmails || [];
    const missing = (r.staffOnly ? staff : everyone).filter((e) => !have.includes(e));
    if (missing.length) { r.memberEmails = [...have, ...missing]; changed = true; }
  });
  if (changed) saveChatRooms(rooms);
}
function getChatRoomsForCurrentUser() {
  const user = getCurrentUser();
  if (!user) return [];
  const me = user.email.toLowerCase();
  return getChatRooms().filter((r) => (r.memberEmails || []).includes(me));
}
function updateChatRoom(id, fn) {
  saveChatRooms(getChatRooms().map((r) => (r.id === id ? fn(r) : r)));
}
function renameChatRoom(id, newName) {
  const user = getCurrentUser();
  const who = user ? user.name : 'Someone';
  updateChatRoom(id, (r) => ({
    ...r,
    name: newName,
    messages: [...r.messages, { system: true, text: `${who} renamed the group to \u201c${newName}\u201d` }]
  }));
}
function addChatRoomMembers(id, emails) {
  const user = getCurrentUser();
  const who = user ? user.name : 'Someone';
  updateChatRoom(id, (r) => {
    const have = r.memberEmails || [];
    const fresh = emails.map((e) => e.toLowerCase()).filter((e) => !have.includes(e));
    if (!fresh.length) return r;
    const names = fresh.map((e) => (getUserByEmail(e) || { name: e }).name).join(', ');
    return {
      ...r,
      memberEmails: [...have, ...fresh],
      messages: [...r.messages, { system: true, text: `${who} added ${names}` }]
    };
  });
}
function createChatGroup(name, emails) {
  const user = getCurrentUser();
  if (!user) return null;
  const members = Array.from(new Set([user.email, ...emails].map((e) => e.toLowerCase())));
  const room = {
    id: 'grp_' + Date.now().toString(36),
    name,
    createdBy: user.email.toLowerCase(),
    memberEmails: members,
    messages: [{ system: true, text: `${user.name} created the group` }]
  };
  saveChatRooms([...getChatRooms(), room]);
  return room;
}

/* "Delete conversation" works like Messenger: it clears the chat from
   YOUR list only. Per user and thread we remember how many messages
   were cleared; the conversation comes back (showing only newer
   messages) if someone writes again, or via "Show deleted". */
function getHiddenMap() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.chatHidden) || '{}');
}
function getThreadState(id) {
  const user = getCurrentUser();
  if (!user) return { cleared: 0, hidden: false };
  const mine = getHiddenMap()[user.email.toLowerCase()] || {};
  return mine[id] || { cleared: 0, hidden: false };
}
function setThreadState(id, patch) {
  const user = getCurrentUser();
  if (!user) return;
  const key = user.email.toLowerCase();
  const map = getHiddenMap();
  map[key] = map[key] || {};
  map[key][id] = { ...(map[key][id] || { cleared: 0, hidden: false }), ...patch };
  localStorage.setItem(STORAGE_KEYS.chatHidden, JSON.stringify(map));
}
function restoreDeletedThreads() {
  const user = getCurrentUser();
  if (!user) return;
  const key = user.email.toLowerCase();
  const map = getHiddenMap();
  Object.keys(map[key] || {}).forEach((id) => { map[key][id].hidden = false; });
  localStorage.setItem(STORAGE_KEYS.chatHidden, JSON.stringify(map));
}

/* ---- Direct (1:1) messages ----
   Stored separately from chat rooms. A thread's id is derived
   deterministically from the two participants' emails so the same
   pair of users always lands on the same thread, however either
   side navigates there. */
function dmThreadId(emailA, emailB) {
  return 'dm_' + [emailA.toLowerCase(), emailB.toLowerCase()].sort().join('|');
}
function getDirectThreads() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.directThreads) || '[]');
}
function saveDirectThreads(threads) {
  localStorage.setItem(STORAGE_KEYS.directThreads, JSON.stringify(threads));
}
/* Ensures a thread with otherEmail exists for the current user and
   returns it (without sending a message). Used when opening a DM
   from someone's profile before they've typed anything yet. */
function getOrCreateDirectThread(otherEmail) {
  const user = getCurrentUser();
  if (!user || !otherEmail) return null;
  const id = dmThreadId(user.email, otherEmail);
  const threads = getDirectThreads();
  let thread = threads.find((t) => t.id === id);
  if (!thread) {
    thread = { id, participants: [user.email.toLowerCase(), otherEmail.toLowerCase()], messages: [] };
    threads.push(thread);
    saveDirectThreads(threads);
  }
  return thread;
}
function sendDirectMessage(otherEmail, text) {
  const user = getCurrentUser();
  if (!user || !otherEmail) return;
  if (isCurrentUserMuted()) return false; /* muted accounts can't chat */
  const id = dmThreadId(user.email, otherEmail);
  const threads = getDirectThreads();
  let thread = threads.find((t) => t.id === id);
  if (!thread) {
    thread = { id, participants: [user.email.toLowerCase(), otherEmail.toLowerCase()], messages: [] };
    threads.push(thread);
  }
  thread.messages.push({ author: user.name, authorEmail: user.email, text });
  saveDirectThreads(threads);
}
/* Returns the current user's DM threads, each annotated with the
   other participant's display name/email so chat.js doesn't need to
   know about the raw participants array. */
function getDirectThreadsForCurrentUser() {
  const user = getCurrentUser();
  if (!user) return [];
  const myEmail = user.email.toLowerCase();
  return getDirectThreads()
    .filter((t) => t.participants.includes(myEmail))
    .map((t) => {
      const otherEmail = t.participants.find((e) => e !== myEmail);
      const otherUser = getUserByEmail(otherEmail);
      return {
        id: t.id,
        name: otherUser ? otherUser.name : otherEmail,
        otherEmail,
        messages: t.messages
      };
    });
}

/* ---- Helpers ---- */
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
/* Shared initials helper for the navbar search dropdown and the
   view-profile page. (chat.js and profile.js each keep their own
   page-local copy of this same logic.) */
function personInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

/* Inner HTML of an .avatar circle: the user's profile photo if they
   uploaded one, otherwise their initials. */
function avatarInner(user, fallbackName) {
  if (user && user.photo) {
    return '<img src="' + String(user.photo).replace(/"/g, '&quot;') + '" alt="">';
  }
  return personInitials((user && user.name) || fallbackName);
}

/* Profile pictures are stored as small data URLs in localStorage, so
   the chosen image is cropped to a centred square and shrunk to
   256x256 before saving. Calls done(dataUrl) or fail(message). */
const AVATAR_SIZE = 256;
function resizeAvatarFile(file, done, fail) {
  if (!file || !file.type.startsWith('image/')) { fail('Please choose an image file.'); return; }
  const reader = new FileReader();
  reader.onerror = () => fail("Couldn't read that file. Please try again.");
  reader.onload = () => {
    const img = new Image();
    img.onerror = () => fail("Couldn't read that image. Please try a different file.");
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = AVATAR_SIZE;
      canvas.getContext('2d').drawImage(
        img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE
      );
      done(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

/* Redirect helper for pages that require login */
function requireAuth() {
  const me = getCurrentUser();
  if (!me) {
    window.location.href = 'login-parent.html';
    return;
  }
  /* an account suspended or disabled while logged in is signed out */
  const blocked = getLoginBlockMessage(me.email);
  if (blocked) {
    logoutUser();
    alert(blocked);
    window.location.href = 'login-parent.html';
  }
}


/* ---- Rich text for announcement details ----
   Details support bold, italic, a short list of fonts, a few text
   sizes and line breaks. Anything else is stripped so user-entered
   HTML can never run as markup. */
const RTE_FONTS = {
  'Inter': "'Inter', sans-serif",
  'Playfair Display': "'Playfair Display', Georgia, serif",
  'Georgia': "Georgia, serif",
  'Arial': "Arial, Helvetica, sans-serif",
  'Times New Roman': "'Times New Roman', Times, serif",
  'Courier New': "'Courier New', monospace"
};
/* execCommand('fontSize') levels -> real sizes (3 = normal, no span) */
const RTE_SIZES = { '1': '0.7rem', '2': '0.85rem', '4': '1.2rem', '5': '1.5rem', '6': '2rem' };

function sanitizeDetails(html) {
  const src = document.createElement('div');
  src.innerHTML = html || '';
  const esc = (t) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const fontKey = (name) => {
    const first = String(name || '').split(',')[0].replace(/["']/g, '').trim().toLowerCase();
    return Object.keys(RTE_FONTS).find((k) => k.toLowerCase() === first);
  };
  const sizeVals = Object.values(RTE_SIZES);
  function walk(node) {
    let out = '';
    node.childNodes.forEach((n) => {
      if (n.nodeType === 3) {
        out += esc(n.textContent);
      } else if (n.nodeType === 1) {
        const tag = n.tagName.toLowerCase();
        let inner = walk(n);
        if (tag === 'b' || tag === 'strong') out += '<strong>' + inner + '</strong>';
        else if (tag === 'i' || tag === 'em') out += '<em>' + inner + '</em>';
        else if (tag === 'br') out += '<br>';
        else if (tag === 'font' || tag === 'span') {
          let face = tag === 'font' ? fontKey(n.getAttribute('face')) : fontKey(n.style.fontFamily);
          let size = tag === 'font' ? RTE_SIZES[n.getAttribute('size')] : n.style.fontSize;
          if (size && !sizeVals.includes(size)) size = '';
          if (size) inner = '<span style="font-size:' + size + '">' + inner + '</span>';
          if (face) inner = '<span style="font-family:' + RTE_FONTS[face] + '">' + inner + '</span>';
          out += inner;
        }
        else if (tag === 'div' || tag === 'p') out += (out && !out.endsWith('<br>') ? '<br>' : '') + inner;
        else out += inner;
      }
    });
    return out;
  }
  return walk(src).replace(/(<br>)+$/, '');
}


/* ---- Account management (Super Admin) ---- */

function addUser(user) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}

/* Updates any account by email. Keeps parent/student links and the
   signed-in session in sync when the email or role changes. */
function updateUser(email, data) {
  const old = email.toLowerCase();
  const emailChanged = data.email && data.email.toLowerCase() !== old;
  const users = getUsers().map((u) => {
    if (u.email.toLowerCase() === old) return { ...u, ...data };
    if (emailChanged && (u.linked || []).some((e) => e.toLowerCase() === old)) {
      return { ...u, linked: u.linked.map((e) => (e.toLowerCase() === old ? data.email : e)) };
    }
    return u;
  });
  saveUsers(users);
  const me = getCurrentUser();
  if (me && me.email.toLowerCase() === old) setCurrentUser({ ...me, ...data });
}

/* Removes an account and every link that pointed to it. */
function deleteUser(email) {
  const gone = email.toLowerCase();
  const users = getUsers()
    .filter((u) => u.email.toLowerCase() !== gone)
    .map((u) => ((u.linked || []).some((e) => e.toLowerCase() === gone)
      ? { ...u, linked: u.linked.filter((e) => e.toLowerCase() !== gone) }
      : u));
  saveUsers(users);
}

/* Drops every parent/student link of one account (both directions). */
function clearLinks(email) {
  const mine = email.toLowerCase();
  const users = getUsers().map((u) => {
    if (u.email.toLowerCase() === mine) return { ...u, linked: [] };
    return (u.linked || []).some((e) => e.toLowerCase() === mine)
      ? { ...u, linked: u.linked.filter((e) => e.toLowerCase() !== mine) }
      : u;
  });
  saveUsers(users);
}

/* ---- Contact info change requests (parents & students -> Super Admin) ---- */

function getContactRequests() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.contactRequests)) || []; } catch (e) { return []; }
}
function saveContactRequests(list) {
  localStorage.setItem(STORAGE_KEYS.contactRequests, JSON.stringify(list));
}
/* data: { email?, phone?, reason } - only the fields that differ are sent. */
function addContactRequest(userEmail, data) {
  const list = getContactRequests();
  list.push({
    id: Date.now() + Math.floor(Math.random() * 1000),
    userEmail: userEmail.toLowerCase(),
    newEmail: data.email || '',
    newPhone: data.phone || '',
    reason: data.reason || '',
    status: 'pending',
    at: Date.now()
  });
  saveContactRequests(list);
}
/* Approve applies the change to the account. Returns an error string or ''. */
function resolveContactRequest(id, approve) {
  const list = getContactRequests();
  const r = list.find((x) => x.id === id);
  if (!r || r.status !== 'pending') return '';
  if (approve) {
    const user = getUserByEmail(r.userEmail);
    if (!user) return 'That account no longer exists.';
    const patch = {};
    if (r.newEmail) {
      const taken = getUsers().some((u) => u.email.toLowerCase() === r.newEmail.toLowerCase() && u.email.toLowerCase() !== r.userEmail);
      if (taken) return 'Another account already uses ' + r.newEmail + '.';
      patch.email = r.newEmail;
    }
    if (r.newPhone) patch.phone = r.newPhone;
    updateUser(r.userEmail, patch);
    if (patch.email) list.forEach((x) => { if (x.userEmail === r.userEmail) x.userEmail = patch.email.toLowerCase(); });
  }
  r.status = approve ? 'approved' : 'declined';
  r.resolvedAt = Date.now();
  saveContactRequests(list);
  return '';
}

function countSuperAdmins() {
  return getUsers().filter((u) => u.role === 'superadmin').length;
}


/* ---- Post photo (optionally inside the school poster frame) ----
   cls: the plain-image class (post-photo / recent-post-photo).
   When a.frame is true the photo is wrapped in the school frame:
   logo header on top, green title bar at the bottom. */
function postPhotoHtml(a, cls) {
  if (!a || !a.photo) return '';
  const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const src = esc(a.photo);
  const title = esc(a.title || '');
  if (!a.frame) return `<img class="${cls}" src="${src}" alt="${title}" loading="lazy">`;
  return `
    <figure class="post-frame ${cls === 'recent-post-photo' ? 'post-frame-compact' : ''}">
      <img class="pfr-photo" src="${src}" alt="${title}" loading="lazy">
      <img class="pfr-overlay" src="images/school-frame-overlay.png" alt="">
      <figcaption class="pfr-title">${title}</figcaption>
    </figure>`;
}

/* ---- Forgot password (parents & students) ----
   There is no email service, so identity is checked with details only
   the real account holder should know:
     student: full name + grade & section
     parent:  full name + the email of a linked child's student account
   Staff (teacher / Super Admin) accounts are not reset here; the Super
   Admin resets those from the Accounts page.
   Wrong answers are counted per email: 5 misses lock that email for
   15 minutes. A successful check lets the person set a new password
   within 10 minutes, once (kept in sessionStorage). */
const RESET_MAX_ATTEMPTS = 5;
const RESET_LOCK_MS = 15 * 60 * 1000;
const RESET_WINDOW_MS = 10 * 60 * 1000;
const RESET_MIN_PASSWORD = 6;
const RESET_KEYS = { attempts: 'msies_reset_attempts', verified: 'msies_reset_verified' };

function getResetAttempts() {
  try { return JSON.parse(localStorage.getItem(RESET_KEYS.attempts)) || {}; } catch (e) { return {}; }
}
function saveResetAttempts(obj) {
  try { localStorage.setItem(RESET_KEYS.attempts, JSON.stringify(obj)); } catch (e) { /* ignore */ }
}
/* Minutes left on the lock for this email, or 0. */
function resetLockMinutes(email) {
  const rec = getResetAttempts()[String(email || '').trim().toLowerCase()];
  if (!rec || !rec.lockedUntil || rec.lockedUntil <= Date.now()) return 0;
  return Math.ceil((rec.lockedUntil - Date.now()) / 60000);
}
function recordResetMiss(email) {
  const key = String(email || '').trim().toLowerCase();
  const all = getResetAttempts();
  let rec = all[key] || { count: 0 };
  if (rec.lockedUntil && rec.lockedUntil <= Date.now()) rec = { count: 0 };
  rec.count += 1;
  if (rec.count >= RESET_MAX_ATTEMPTS) rec.lockedUntil = Date.now() + RESET_LOCK_MS;
  all[key] = rec;
  saveResetAttempts(all);
}
function clearResetAttempts(email) {
  const all = getResetAttempts();
  delete all[String(email || '').trim().toLowerCase()];
  saveResetAttempts(all);
}
/* "Grade 3 - Mabini" and "grade 3 mabini" count as the same section. */
function sameSection(a, b) {
  const n = (x) => normalizeText(x).replace(/[^a-z0-9]/g, '');
  return !!n(a) && n(a) === n(b);
}

/* role: 'parent' | 'student'. detail: section (student) or a child's email (parent).
   Returns { ok: true } or { ok: false, reason: 'locked' | 'staff' | 'no-match', minutes? }.
   'no-match' is the same answer for an unknown email and for a wrong detail,
   so the page never reveals whether an account exists. */
function verifyResetIdentity(role, email, fullName, detail) {
  const mail = String(email || '').trim().toLowerCase();
  const locked = resetLockMinutes(mail);
  if (locked) return { ok: false, reason: 'locked', minutes: locked };
  const user = getUserByEmail(mail);
  if (user && (user.role === 'teacher' || user.role === 'superadmin')) return { ok: false, reason: 'staff' };

  let match = false;
  if (user && user.role === role && sameFullName(user.name, fullName)) {
    if (role === 'student') {
      match = sameSection(user.section, detail);
    } else if (role === 'parent') {
      const child = getUserByEmail(String(detail || '').trim());
      match = !!child && child.role === 'student' &&
        (user.linked || []).some((e) => String(e).toLowerCase() === child.email.toLowerCase());
    }
  }
  if (!match) {
    recordResetMiss(mail);
    const left = resetLockMinutes(mail);
    return left ? { ok: false, reason: 'locked', minutes: left } : { ok: false, reason: 'no-match' };
  }
  clearResetAttempts(mail);
  try { sessionStorage.setItem(RESET_KEYS.verified, JSON.stringify({ email: user.email.toLowerCase(), at: Date.now() })); } catch (e) { return { ok: false, reason: 'no-match' }; }
  return { ok: true };
}
/* Only works right after verifyResetIdentity succeeded for this email.
   Returns { ok: true } or { ok: false, reason: 'not-verified' | 'expired' | 'short' | 'same' }. */
function completePasswordReset(email, newPassword) {
  const mail = String(email || '').trim().toLowerCase();
  let v = null;
  try { v = JSON.parse(sessionStorage.getItem(RESET_KEYS.verified)); } catch (e) { v = null; }
  if (!v || v.email !== mail) return { ok: false, reason: 'not-verified' };
  if (Date.now() - v.at > RESET_WINDOW_MS) {
    sessionStorage.removeItem(RESET_KEYS.verified);
    return { ok: false, reason: 'expired' };
  }
  const user = getUserByEmail(mail);
  if (!user || (user.role !== 'parent' && user.role !== 'student')) return { ok: false, reason: 'not-verified' };
  if (String(newPassword || '').length < RESET_MIN_PASSWORD) return { ok: false, reason: 'short' };
  if (newPassword === user.password) return { ok: false, reason: 'same' };
  saveUsers(getUsers().map((u) => (u.email.toLowerCase() === mail ? { ...u, password: newPassword } : u)));
  sessionStorage.removeItem(RESET_KEYS.verified);
  return { ok: true };
}
