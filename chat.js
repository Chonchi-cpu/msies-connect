/* ============================================================
   chat.js - page logic for chat.html
   Shows the list of chat rooms, the active room's message
   thread, and a send form. The "School Admin Broadcast" room
   is admin/teacher-post-only; everyone else sees it read-only.
   ============================================================ */

requireAuth();
renderNavbar('chat');

let activeRoomId = null;

function initials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function renderRoomList() {
  const rooms = getChatRooms();
  if (!activeRoomId) activeRoomId = rooms[0] && rooms[0].id;

  document.getElementById('chat-rooms').innerHTML = `
    <p><strong>Chat rooms</strong></p>
    ${rooms
      .map((r) => {
        const last = r.messages[r.messages.length - 1];
        return `
          <div class="chat-room-item ${r.id === activeRoomId ? 'active' : ''}" onclick="selectRoom('${r.id}')">
            <strong>${r.name}</strong>
            <small>${last ? (last.author + ': ' + last.text) : 'No messages yet'}</small>
          </div>
        `;
      })
      .join('')}
  `;
}

function selectRoom(id) {
  activeRoomId = id;
  renderRoomList();
  renderRoomMain();
}

function renderRoomMain() {
  const room = getChatRooms().find((r) => r.id === activeRoomId);
  const main = document.getElementById('chat-main');
  if (!room) {
    main.innerHTML = '<p class="muted">Select a chat room.</p>';
    return;
  }

  const canPost = !room.adminOnly || isStaff();

  main.innerHTML = `
    <h3>${room.name}</h3>
    <p class="muted">${room.members} members${room.adminOnly ? ' · Admin only can post' : ''}</p>
    <hr>
    <div class="chat-messages">
      ${room.messages
        .map((m) => `<p><strong>${m.author}:</strong> ${m.text}</p>`)
        .join('')}
    </div>
    ${canPost
      ? `<form class="chat-send-form" onsubmit="return sendMessage(event, '${room.id}')">
          <input type="text" placeholder="Type a message..." required>
          <button type="submit" class="btn">Send</button>
        </form>`
      : '<p class="muted">Only school admins can post in this room.</p>'
    }
  `;
}

function sendMessage(e, roomId) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  const text = input.value.trim();
  if (!text) return false;
  sendChatMessage(roomId, text);
  renderRoomList();
  renderRoomMain();
  return false;
}

renderRoomList();
renderRoomMain();
