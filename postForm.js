/* ============================================================
   postForm.js - shared "new/edit announcement" form markup.
   Used by feed.js (Feed page "+ New post" / Edit) and
   calendar.js (Calendar page "+ Add event" / day click).
   The caller supplies the <form> id and wires its own submit
   handler; this file only builds the inner fields so both
   pages stay visually and structurally consistent.
   ============================================================ */

const POST_CATEGORIES = ['Events', 'Holidays', 'Reminders'];

function postFormFields(a) {
  a = a || {};
  const catButtons = POST_CATEGORIES.map(
    (c) => `<label><input type="radio" name="category" value="${c}" ${a.category === c || (!a.category && c === 'Events') ? 'checked' : ''}> ${c}</label>`
  ).join(' ');

  return `
    <p><strong>Category</strong><br>${catButtons}</p>
    <p>Title:<br>
      <input type="text" id="pf-title" placeholder="e.g. PTA General Assembly" value="${a.title ? escapeAttr(a.title) : ''}" required>
    </p>
    <p>Details:<br>
      <textarea id="pf-details" placeholder="Write what parents and teachers need to know...">${a.details ? escapeHtml(a.details) : ''}</textarea>
    </p>
    <p>
      Date (optional):<br>
      <input type="date" id="pf-date" value="${a.date || ''}">
    </p>
    <p>
      Time (optional):<br>
      <input type="time" id="pf-time" value="${a.time || ''}">
    </p>
    <p>Location (optional):<br>
      <input type="text" id="pf-location" placeholder="e.g. School covered court" value="${a.location ? escapeAttr(a.location) : ''}">
    </p>
  `;
}

function readPostForm() {
  const category = document.querySelector('input[name="category"]:checked').value;
  return {
    category,
    title: document.getElementById('pf-title').value.trim(),
    details: document.getElementById('pf-details').value.trim(),
    date: document.getElementById('pf-date').value,
    time: document.getElementById('pf-time').value,
    location: document.getElementById('pf-location').value.trim()
  };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}
