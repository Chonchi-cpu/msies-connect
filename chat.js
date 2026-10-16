/* ============================================================
   chat.js - page logic for chat.html
   Shows the chat rooms the current user belongs to: "Staff" (Super
   Admin + teachers) and "School Admin Broadcast" (read by everyone,
   posted to by staff only), the active room's messages, and a send
   form. Options live in the "\u22ee" menu of each room:
     Members, Add member, Edit group name, Delete conversation
   Only staff can rename a room or add people to it.
   "Delete conversation" clears it from the current user's list
   only (see data.js), like Messenger.
   ============================================================ */

requireAuth();
renderNavbar('chat');

let activeRoomId = null;

const ROLE_LABELS_CHAT = { superadmin: 'Super Admin', teacher: 'Teacher', parent: 'Parent', student: 'Student' };

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function initials(name) {
  return personInitials(name);
}

/* ---- Rooms ----
   Two rooms: "Staff" (Super Admin + teachers) and "School Admin
   Broadcast" (everyone can read it, only staff can post). Messages
   are already trimmed to what I haven't deleted; rooms I deleted are
   split into `hidden` until a newer message arrives. */
function loadThreads() {
  const raw = getChatRoomsForCurrentUser().map((r) => ({ ...r, type: 'room' }))
    .concat(getDirectThreadsForCurrentUser().map((d) => ({ ...d, type: 'dm' })));
  const visible = [];
  const hidden = [];
  raw.forEach((t) => {
    /* an empty direct thread (opened but never used) stays out of the other person's list */
    if (t.type === 'dm' && !t.messages.length && t.id !== activeRoomId) return;
    const st = getThreadState(t.id);
    const trimmed = { ...t, messages: t.messages.slice(st.cleared) };
    if (!st.hidden || t.messages.length > st.cleared) visible.push(trimmed);
    else hidden.push(trimmed);
  });
  return { visible, hidden };
}

function getActiveThread() {
  return loadThreads().visible.find((t) => t.id === activeRoomId) || null;
}

function previewText(t) {
  const last = t.messages[t.messages.length - 1];
  if (!last) return 'No messages yet';
  return last.system ? last.text : `${last.author}: ${last.text}`;
}

function roomListItemHtml(t) {
  return `
    <div class="chat-room-item ${t.id === activeRoomId ? 'active' : ''}" onclick="selectRoom(${esc(JSON.stringify(t.id))})">
      <strong>${esc(t.name)}</strong>
      <small>${esc(previewText(t))}</small>
    </div>
  `;
}

function renderRoomList() {
  const { visible, hidden } = loadThreads();
  if (!visible.some((t) => t.id === activeRoomId)) {
    activeRoomId = (visible[0] && visible[0].id) || null;
  }
  const dms = visible.filter((t) => t.type === 'dm');
  const restoreHtml = hidden.length
    ? `<a href="#" class="chat-restore" onclick="restoreDeleted(); return false;">Show ${hidden.length} deleted conversation${hidden.length > 1 ? 's' : ''}</a>`
    : '';

  document.getElementById('chat-rooms').innerHTML = `
    <div class="chat-rooms-head">
      <strong class="chat-rooms-title">Chat rooms</strong>
    </div>
    ${visible.filter((t) => t.type === 'room').map(roomListItemHtml).join('')}
    ${dms.length ? '<div class="chat-rooms-head"><strong class="chat-rooms-title">Direct messages</strong></div>' : ''}
    ${dms.map(roomListItemHtml).join('')}
    ${restoreHtml}
  `;
}

function selectRoom(id) {
  activeRoomId = id;
  renderRoomList();
  renderRoomMain();
}

function refreshChat() {
  renderRoomList();
  renderRoomMain();
}

/* ---- Messages ---- */
function isMyMessage(m) {
  const me = getCurrentUser();
  if (!me) return false;
  if (m.authorEmail) return m.authorEmail.toLowerCase() === me.email.toLowerCase();
  return m.author === 'Me' || m.author === me.name;
}

function messageHtml(m) {
  if (m.system) return `<div class="chat-system">${esc(m.text)}</div>`;
  const mine = isMyMessage(m);
  return `
    <div class="chat-msg ${mine ? 'mine' : 'theirs'}">
      <span class="chat-msg-author">${mine ? 'You' : esc(m.author)}</span>
      <span class="chat-msg-text">${esc(m.text)}</span>
    </div>
  `;
}

/* Admin-only broadcast: only staff manage it. Everything else: any member. */
function canManageRoom(t) {
  return t.type === 'room' && (!t.adminOnly || isStaff());
}

function conversationMenuHtml(t) {
  const manage = canManageRoom(t);
  return `
    ${t.type === 'room' ? '<button type="button" class="chat-menu-item" onclick="openMembersModal()">Members</button>' : ''}
    ${manage ? '<button type="button" class="chat-menu-item" onclick="openAddMemberModal()">Add member</button>' : ''}
    ${manage ? '<button type="button" class="chat-menu-item" onclick="openRenameModal()">Edit group name</button>' : ''}
    <button type="button" class="chat-menu-item danger" onclick="openDeleteModal()">Delete conversation</button>
  `;
}

function renderRoomMain() {
  const thread = getActiveThread();
  const main = document.getElementById('chat-main');
  if (!thread) {
    main.innerHTML = '<p class="muted">No conversation selected.</p>';
    return;
  }

  const canPost = !thread.adminOnly || isStaff();
  const count = (thread.memberEmails || []).length;
  const other = thread.type === 'dm' ? getUserByEmail(thread.otherEmail) : null;
  const subtitle = thread.type === 'dm'
    ? 'Direct message' + (other ? ' · ' + (ROLE_LABELS_CHAT[other.role] || other.role) : '')
    : `${count} member${count === 1 ? '' : 's'}${thread.adminOnly ? ' · Staff only can post' : ''}`;

  main.innerHTML = `
    <div class="chat-header">
      <div class="chat-header-info">
        <h3>${esc(thread.name)}</h3>
        <p class="muted">${subtitle}</p>
      </div>
      <div class="chat-menu-wrap">
        <button type="button" class="chat-menu-btn" id="chat-menu-btn" onclick="toggleChatMenu()" aria-label="Conversation options" aria-haspopup="true" aria-expanded="false">&#8942;</button>
        <div class="chat-menu" id="chat-menu" role="menu">${conversationMenuHtml(thread)}</div>
      </div>
    </div>
    <hr>
    <div class="chat-messages">
      ${thread.messages.length
        ? thread.messages.map(messageHtml).join('')
        : '<p class="chat-empty muted">No messages yet. Say hello!</p>'
      }
    </div>
    ${canPost && isCurrentUserMuted()
      ? `<p class="mute-notice">&#128263; ${esc(getCurrentUserBlockMessage())}</p>`
      : canPost
      ? `<form class="chat-send-form" onsubmit="return sendMessage(event, ${esc(JSON.stringify(thread.id))})">
          <input type="text" placeholder="Type a message..." required>
          <button type="submit" class="btn">Send</button>
        </form>`
      : '<p class="muted">Only school staff can post in this room.</p>'
    }
  `;

  const list = main.querySelector('.chat-messages');
  if (list) list.scrollTop = list.scrollHeight;
}

function sendMessage(e, id) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  const text = input.value.trim();
  if (!text) return false;
  if (isCurrentUserMuted()) { refreshChat(); return false; }

  const t = getActiveThread();
  if (t && t.type === 'dm') sendDirectMessage(t.otherEmail, text);
  else sendChatMessage(id, text);
  refreshChat();
  return false;
}

/* ---- "⋮" options menu ---- */
function toggleChatMenu(force) {
  const menu = document.getElementById('chat-menu');
  const btn = document.getElementById('chat-menu-btn');
  if (!menu) return;
  const open = typeof force === 'boolean' ? force : !menu.classList.contains('open');
  menu.classList.toggle('open', open);
  if (btn) btn.setAttribute('aria-expanded', String(open));
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('.chat-menu-wrap')) toggleChatMenu(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') toggleChatMenu(false);
});

/* ---- Modal helpers ---- */
function modalHeader(title) {
  return `
    <div class="modal-header">
      <h2>${esc(title)}</h2>
      <button type="button" class="modal-close" onclick="closeModal()" aria-label="Close">&times;</button>
    </div>
  `;
}

/* A searchable checklist of people. `exclude` = emails to leave out. */
function pickListHtml(exclude) {
  const skip = exclude.map((e) => e.toLowerCase());
  const people = getUsers()
    .filter((u) => u.role !== 'superadmin' && !skip.includes(u.email.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (!people.length) return '<p class="muted">Everyone is already in this group.</p>';
  return `
    <input type="text" class="pick-search" placeholder="Search people..." oninput="filterPickList(this.value)" autocomplete="off">
    <div class="pick-list" id="pick-list" onchange="hideFormError()">
      ${people.map((u) => `
        <label class="pick-row" data-search="${esc((u.name + ' ' + u.email).toLowerCase())}">
          <input type="checkbox" value="${esc(u.email)}">
          <span class="avatar">${avatarInner(u)}</span>
          <span class="pick-text"><strong>${esc(u.name)}</strong><small>${esc(ROLE_LABELS_CHAT[u.role] || u.role)}${u.section ? ' · ' + esc(u.section) : ''}</small></span>
        </label>
      `).join('')}
    </div>
  `;
}

function filterPickList(q) {
  const term = q.trim().toLowerCase();
  document.querySelectorAll('#pick-list .pick-row').forEach((row) => {
    row.style.display = !term || row.dataset.search.includes(term) ? '' : 'none';
  });
}

function checkedEmails() {
  return Array.from(document.querySelectorAll('#pick-list input[type="checkbox"]:checked')).map((c) => c.value);
}

function hideFormError() {
  const el = document.getElementById('form-error');
  if (el) el.style.display = 'none';
}

function showFormError(msg) {
  const el = document.getElementById('form-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

/* ---- Members ---- */
function openMembersModal() {
  toggleChatMenu(false);
  const room = getActiveThread();
  if (!room || room.type !== 'room') return;
  const me = getCurrentUser();
  const people = (room.memberEmails || []).map(getUserByEmail).filter(Boolean);

  const rows = people.map((u) => {
    const isMe = u.email.toLowerCase() === me.email.toLowerCase();
    const href = isMe ? 'profile.html' : `view-profile.html?email=${encodeURIComponent(u.email)}`;
    return `
      <a class="member-row" href="${href}">
        <span class="avatar">${avatarInner(u)}</span>
        <span class="pick-text"><strong>${esc(u.name)}${isMe ? ' (You)' : ''}</strong><small>${esc(ROLE_LABELS_CHAT[u.role] || u.role)}${u.section ? ' · ' + esc(u.section) : ''}</small></span>
      </a>
    `;
  }).join('');

  openModal(`
    ${modalHeader(`Members (${people.length})`)}
    <div class="member-list">${rows || '<p class="muted">No members yet.</p>'}</div>
    <p style="text-align:right">
      ${canManageRoom(room) ? '<button type="button" class="btn btn-outline" onclick="openAddMemberModal()">+ Add member</button>' : ''}
      <button type="button" class="btn" onclick="closeModal()">Close</button>
    </p>
  `);
}

/* ---- Add member ---- */
function openAddMemberModal() {
  toggleChatMenu(false);
  const room = getActiveThread();
  if (!room || !canManageRoom(room)) return;
  const hasPeople = getUsers().some((u) => !(room.memberEmails || []).includes(u.email.toLowerCase()));
  openModal(`
    ${modalHeader('Add member')}
    <form onsubmit="return submitAddMembers(event)">
      ${pickListHtml(room.memberEmails || [])}
      <p id="form-error" class="form-error" style="display:none"></p>
      <p style="text-align:right">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        ${hasPeople ? '<button type="submit" class="btn">Add</button>' : ''}
      </p>
    </form>
  `);
}

function submitAddMembers(e) {
  e.preventDefault();
  const room = getActiveThread();
  const emails = checkedEmails();
  if (!room || !canManageRoom(room)) return false;
  if (!emails.length) { showFormError('Pick at least one person to add.'); return false; }
  addChatRoomMembers(room.id, emails);
  closeModal();
  refreshChat();
  return false;
}

/* ---- Edit group name ---- */
function openRenameModal() {
  toggleChatMenu(false);
  const room = getActiveThread();
  if (!room || !canManageRoom(room)) return;
  openModal(`
    ${modalHeader('Edit group name')}
    <form onsubmit="return submitRename(event)">
      <p>Group name:<br>
        <input type="text" id="rename-input" value="${esc(room.name)}" maxlength="50" required>
      </p>
      <p id="form-error" class="form-error" style="display:none"></p>
      <p style="text-align:right">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn">Save</button>
      </p>
    </form>
  `);
  const input = document.getElementById('rename-input');
  if (input) { input.focus(); input.select(); }
}

function submitRename(e) {
  e.preventDefault();
  const room = getActiveThread();
  const name = document.getElementById('rename-input').value.trim();
  if (!room || !canManageRoom(room)) return false;
  if (!name) { showFormError('Please enter a group name.'); return false; }
  if (name !== room.name) renameChatRoom(room.id, name);
  closeModal();
  refreshChat();
  return false;
}

/* ---- Delete conversation (for me) ---- */
function openDeleteModal() {
  toggleChatMenu(false);
  const t = getActiveThread();
  if (!t) return;
  const what = `\u201c${esc(t.name)}\u201d`;
  openModal(`
    ${modalHeader('Delete conversation?')}
    <div class="icon-circle danger">&#9888;</div>
    <p style="text-align:center">This clears ${what} from your chat list. Other people keep their copy, and it comes back if someone sends a new message.</p>
    <p style="text-align:right">
      <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button type="button" class="btn btn-danger" onclick="doDeleteConversation()">Delete</button>
    </p>
  `);
}

function doDeleteConversation() {
  const id = activeRoomId;
  const t = getChatRooms().find((x) => x.id === id)
    || getDirectThreadsForCurrentUser().find((x) => x.id === id);
  if (t) setThreadState(id, { cleared: t.messages.length, hidden: true });
  activeRoomId = null;
  closeModal();
  refreshChat();
}

function restoreDeleted() {
  restoreDeletedThreads();
  refreshChat();
}

/* chat.html?dm=<email> opens (or starts) a direct message with that person */
(function openRequestedDm() {
  const target = new URLSearchParams(window.location.search).get('dm');
  const me = getCurrentUser();
  if (!target || !me || target.toLowerCase() === me.email.toLowerCase()) return;
  const person = getUserByEmail(target);
  if (!person || person.role === 'superadmin') return;
  const thread = getOrCreateDirectThread(person.email);
  if (!thread) return;
  if (getThreadState(thread.id).hidden) setThreadState(thread.id, { hidden: false });
  activeRoomId = thread.id;
})();

refreshChat();
