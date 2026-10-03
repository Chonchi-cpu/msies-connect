/* ============================================================
   data.js - seed data + localStorage persistence helpers.
   Loaded on every page before any page-specific script.
   ============================================================ */

const DEFAULT_USERS = [
  { email: 'admin1@email.com', password: 'admin123', name: 'Admin SC', role: 'admin' },
  { email: 'j.torres@msies.edu.ph', password: 'teacher123', name: 'Mrs. Torres', role: 'teacher' },
  { email: 'maria.reyes@email.com', password: 'parent123', name: 'Maria Reyes', role: 'parent' }
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

const DEFAULT_CHATROOMS = [
  {
    id: 'g3',
    name: 'Grade 3 — Parents & Teachers',
    members: 24,
    messages: [
      { author: 'Mrs. Torres', text: 'Good morning! Just a reminder that the PTA assembly is this Saturday.' },
      { author: 'Me', text: 'Thank you po! What time should we arrive?' },
      { author: 'Mrs. Torres', text: 'Doors open 7:30 AM, program starts 8:00 sharp.' }
    ]
  },
  {
    id: 'g4',
    name: 'Grade 4 — Parents & Teachers',
    members: 26,
    messages: [
      { author: 'Mrs. Torres', text: 'Good morning! Please remind your kids to bring their permission slips on Monday.' },
      { author: 'Me', text: 'Noted, thank you po!' },
      { author: 'Mrs. Torres', text: 'See you all Saturday!' }
    ]
  },
  {
    id: 'pta',
    name: 'PTA Officers',
    members: 8,
    messages: [
      { author: 'Mrs. Torres', text: 'The budget review meeting has been moved to next Tuesday.' },
      { author: 'Me', text: "Got it, I'll update the officers' group." },
      { author: 'Mrs. Torres', text: 'Budget review moved to Sept 8, 4:00 PM.' }
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

const STORAGE_KEYS = {
  users: 'msies_users',
  announcements: 'msies_announcements',
  chatRooms: 'msies_chatrooms',
  directThreads: 'msies_direct_threads',
  chatHidden: 'msies_chat_hidden',
  nextId: 'msies_next_announcement_id',
  currentUser: 'msies_current_user'
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
}
initData();

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
function isStaff() {
  const u = getCurrentUser();
  return !!u && (u.role === 'admin' || u.role === 'teacher');
}
function updateCurrentUser(data) {
  const current = getCurrentUser();
  if (!current) return;
  const updated = { ...current, ...data };
  const users = getUsers().map((u) => (u.email === current.email ? { ...u, ...data } : u));
  saveUsers(users);
  setCurrentUser(updated);
  return updated;
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
   already have your own Profile page). Best matches come first:
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
  localStorage.setItem(STORAGE_KEYS.announcements, JSON.stringify(list));
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
function addComment(id, text) {
  const user = getCurrentUser();
  const list = getAnnouncements().map((a) => {
    if (a.id !== id) return a;
    return { ...a, comments: [...a.comments, { author: user ? user.name : 'Guest', authorEmail: user ? user.email : '', text }] };
  });
  saveAnnouncements(list);
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

/* ---- Chat rooms ---- */
function getChatRooms() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.chatRooms));
}
function saveChatRooms(rooms) {
  localStorage.setItem(STORAGE_KEYS.chatRooms, JSON.stringify(rooms));
}
function sendChatMessage(roomId, text) {
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
function migrateChatRooms() {
  const rooms = getChatRooms();
  const emails = getUsers().map((u) => u.email.toLowerCase());
  let changed = false;
  rooms.forEach((r) => {
    if (!Array.isArray(r.memberEmails)) {
      r.memberEmails = [...emails];
      r.autoJoin = true;
      changed = true;
    }
  });
  if (changed) saveChatRooms(rooms);
}
function syncAutoJoinRooms(users) {
  const raw = localStorage.getItem(STORAGE_KEYS.chatRooms);
  if (!raw) return;
  const emails = (users || getUsers()).map((u) => u.email.toLowerCase());
  let changed = false;
  const rooms = JSON.parse(raw);
  rooms.forEach((r) => {
    if (!r.autoJoin) return;
    const have = r.memberEmails || [];
    const missing = emails.filter((e) => !have.includes(e));
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

/* Redirect helper for pages that require login */
function requireAuth() {
  if (!getCurrentUser()) {
    window.location.href = 'login-choice.html';
  }
}
