

requireAuth();
renderNavbar('calendar');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const today = new Date();
let viewYear = today.getFullYear();
let viewMonth = today.getMonth(); // 0-indexed

function pad(n) { return String(n).padStart(2, '0'); }
function isoFor(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

function prevMonth() {
  viewMonth--;
  if (viewMonth < 0) { viewMonth = 11; viewYear--; }
  renderCalendar();
}
function nextMonth() {
  viewMonth++;
  if (viewMonth > 11) { viewMonth = 0; viewYear++; }
  renderCalendar();
}

function renderAddEventButton() {
  document.getElementById('add-event-wrap').innerHTML = isStaff()
    ? `<button type="button" class="btn btn-small" onclick="openDayModal(null)">+ Add event</button>`
    : '';
}

function renderCalendar() {
  document.getElementById('cal-title').textContent = `${MONTH_NAMES[viewMonth]} ${viewYear}`;
  renderAddEventButton();

  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const announcements = getAnnouncements().filter((a) => a.date);
  const todayIso = isoFor(today.getFullYear(), today.getMonth(), today.getDate());

  let html = '<tr>' + ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => `<th>${d}</th>`).join('') + '</tr>';

  let day = 1;
  for (let row = 0; row < 6 && day <= daysInMonth; row++) {
    html += '<tr>';
    for (let col = 0; col < 7; col++) {
      if ((row === 0 && col < firstDay) || day > daysInMonth) {
        html += '<td></td>';
      } else {
        const iso = isoFor(viewYear, viewMonth, day);
        const dayEvents = announcements.filter((a) => a.date === iso);
        const badges = dayEvents
          .map((a) => `<div class="day-event badge-${a.category.toLowerCase()}">${a.photo ? '📷 ' : ''}${a.title}</div>`)
          .join('');
        const todayClass = iso === todayIso ? ' is-today' : '';
        html += `<td class="clickable${todayClass}" onclick="openDayModal('${iso}')">
          <div class="day-num">${day}</div>
          ${badges}
        </td>`;
        day++;
      }
    }
    html += '</tr>';
  }

  document.getElementById('calendar-table').innerHTML = html;
}

/* ---- Day / event modal ---- */

function openDayModal(iso) {
  if (iso === null) {
    // "+ Add event" with no date preselected
    openEventForm(null, {});
    return;
  }

  const events = getAnnouncements().filter((a) => a.date === iso);
  const label = fmtDate(iso);

  if (!events.length) {
    if (isStaff()) {
      openEventForm(null, { date: iso });
    } else {
      openModal(`
        <div class="modal-header">
          <h2>${label}</h2>
          <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <p class="muted">No events on this date.</p>
        <p style="text-align:right"><button type="button" class="btn" onclick="closeModal()">Close</button></p>
      `);
    }
    return;
  }

  const rows = events
    .map((a) => `
      <div class="card">
        <div class="card-top">
          <span class="badge badge-${a.category.toLowerCase()}">${a.category}</span>
          ${isStaff() ? `
            <div>
              <button type="button" class="btn btn-small btn-outline" onclick="openEventForm(${a.id}, {})">Edit</button>
              <button type="button" class="btn btn-small btn-danger" onclick="deleteEvent(${a.id})">Delete</button>
            </div>` : ''}
        </div>
        <h3>${a.title}</h3>
        <p class="muted">${[a.time, a.location].filter(Boolean).join(' · ')}</p>
        ${a.photo ? `<img class="post-photo" src="${a.photo}" alt="${a.title}">` : ''}
        <p>${a.details || ''}</p>
      </div>
    `)
    .join('');

  openModal(`
    <div class="modal-header">
      <h2>${label}</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    ${rows}
    <p style="text-align:right">
      ${isStaff() ? `<button type="button" class="btn btn-outline" onclick="openEventForm(null, {date:'${iso}'})">+ Add another event</button>` : ''}
      <button type="button" class="btn" onclick="closeModal()">Close</button>
    </p>
  `);
}

function openEventForm(id, presets) {
  const existing = id ? getAnnouncements().find((a) => a.id === id) : { ...presets };
  const isEdit = !!id;
  openModal(`
    <div class="modal-header">
      <h2>${isEdit ? 'Edit event' : 'New event'}</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <form id="event-form" onsubmit="return ${isEdit ? `submitEditEvent(event, ${id})` : 'submitNewEvent(event)'}">
      ${postFormFields(existing)}
      <p style="text-align:right">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn">Save event</button>
      </p>
    </form>
  `);
}

function submitNewEvent(e) {
  e.preventDefault();
  addAnnouncement(readPostForm());
  closeModal();
  renderCalendar();
  return false;
}

function submitEditEvent(e, id) {
  e.preventDefault();
  updateAnnouncement(id, readPostForm());
  closeModal();
  renderCalendar();
  return false;
}

function deleteEvent(id) {
  const a = getAnnouncements().find((x) => x.id === id);
  if (!a) return;
  openModal(`
    <div class="modal-header">
      <h2>Delete this event?</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="icon-circle danger">&#9888;</div>
    <p style="text-align:center">"${a.title}" will be removed from the calendar and feed. This can't be undone.</p>
    <p style="text-align:right">
      <button type="button" class="btn btn-outline" onclick="openDayModal('${a.date}')">Cancel</button>
      <button type="button" class="btn btn-danger" onclick="doDeleteEvent(${id})">Delete</button>
    </p>
  `);
}

function doDeleteEvent(id) {
  deleteAnnouncement(id);
  closeModal();
  renderCalendar();
}

renderCalendar();
