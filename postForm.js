/* ============================================================
   postForm.js - shared "new/edit announcement" form markup.
   Used by feed.js (Feed page "+ New post" / Edit) and
   calendar.js (Calendar page "+ Add event" / day click).
   The caller supplies the <form> id and wires its own submit
   handler; this file only builds the inner fields so both
   pages stay visually and structurally consistent.
   ============================================================ */

const POST_CATEGORIES = ['Events', 'Holidays', 'Reminders', 'Other'];

function postFormFields(a) {
  a = a || {};
  const catOptions = POST_CATEGORIES.map(
    (c) => `<option value="${c}" ${a.category === c || (!a.category && c === 'Events') ? 'selected' : ''}>${c}</option>`
  ).join('');

  return `
    <p>Category:<br>
      <select id="pf-category" name="category">${catOptions}</select>
    </p>
    <p>Title:<br>
      <input type="text" id="pf-title" placeholder="e.g. PTA General Assembly" value="${a.title ? escapeAttr(a.title) : ''}" oninput="updatePostPhotoPreview()" required>
    </p>
    <div>
      <p style="margin-bottom:6px;">Details:</p>
      <div class="rte-toolbar">
        <button type="button" class="rte-btn" title="Bold (Ctrl+B)" aria-label="Bold" onmousedown="event.preventDefault(); formatDetails('bold')"><strong>B</strong></button>
        <button type="button" class="rte-btn" title="Italic (Ctrl+I)" aria-label="Italic" onmousedown="event.preventDefault(); formatDetails('italic')"><em>I</em></button>
        <select class="rte-select" aria-label="Font" onchange="applyDetailsFont(this)">
          <option value="" selected disabled>Font</option>
          ${Object.keys(RTE_FONTS).map((f) => `<option value="${f}" style="font-family:${RTE_FONTS[f].replace(/"/g, '')}">${f}</option>`).join('')}
        </select>
        <select class="rte-select" aria-label="Text size" onchange="applyDetailsSize(this)">
          <option value="" selected disabled>Size</option>
          <option value="1">Tiny</option>
          <option value="2">Small</option>
          <option value="3">Normal</option>
          <option value="4">Large</option>
          <option value="5">Larger</option>
          <option value="6">Huge</option>
        </select>
      </div>
      <div id="pf-details" class="rte-editor" contenteditable="true" onmouseup="saveDetailsSelection()" onkeyup="saveDetailsSelection()" onblur="saveDetailsSelection()" role="textbox" aria-multiline="true" data-placeholder="Write what parents and teachers need to know...">${a.details ? sanitizeDetails(a.details) : ''}</div>
    </div>
    <div class="field-row">
      <div>
        <p>Date (optional):<br>
          <input type="date" id="pf-date" value="${a.date || ''}">
        </p>
      </div>
      <div>
        <p>Time (optional):<br>
          <input type="time" id="pf-time" value="${a.time || ''}">
        </p>
      </div>
    </div>
    <p>Location (optional):<br>
      <input type="text" id="pf-location" placeholder="e.g. School covered court" value="${a.location ? escapeAttr(a.location) : ''}">
    </p>
    <div>
      <strong style="display:block; margin-bottom:8px; font-size:0.85rem;">Photo (optional)</strong>
      <div class="photo-drop" onclick="document.getElementById('pf-photo-input').click()">
        Click to upload an image
        <div id="pf-photo-wrap" class="photo-preview-wrap${a.photo && a.frame ? ' is-framed' : ''}" style="${a.photo ? '' : 'display:none;'}">
          <img id="pf-photo-preview" class="photo-preview" src="${a.photo || ''}" alt="Selected photo" style="${a.frame ? 'display:none;' : ''}">
          <figure id="pf-frame-preview" class="post-frame pf-frame-preview" style="${a.photo && a.frame ? '' : 'display:none;'}">
            <img id="pf-frame-photo" class="pfr-photo" src="${a.photo || ''}" alt="">
            <img class="pfr-overlay" src="images/school-frame-overlay.png" alt="">
            <figcaption id="pf-frame-title" class="pfr-title">${a.title ? escapeHtml(a.title) : ''}</figcaption>
          </figure>
          <button type="button" class="photo-remove-x" onclick="event.stopPropagation(); clearPostPhoto();" aria-label="Remove photo" title="Remove photo">&times;</button>
        </div>
      </div>
      <input type="file" id="pf-photo-input" accept="image/*" style="display:none" onchange="handlePostPhotoChange(event)">
      <input type="hidden" id="pf-photo" value="${a.photo ? escapeAttr(a.photo) : ''}">
      <label class="frame-toggle">
        <input type="checkbox" id="pf-frame" ${a.frame ? 'checked' : ''} onchange="updatePostPhotoPreview()">
        Use school frame (logo header + green title bar)
      </label>
    </div>
  `;
}

/* Announcement photos are stored as base64 data URLs directly in
   localStorage (there's no backend/file storage), and localStorage
   has a small total quota (usually 5-10MB shared across the whole
   site). An unscaled phone photo can easily be 3-8MB on its own, so
   every upload is downscaled and re-compressed client-side before
   it's saved. This keeps typical photos in the 50-300KB range. */
const PHOTO_MAX_DIMENSION = 1280; // longest side, in px
const PHOTO_JPEG_QUALITY = 0.8;
const PHOTO_MAX_BYTES = 1.5 * 1024 * 1024; // hard ceiling after compression

function handlePostPhotoChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Please choose an image file.');
    e.target.value = '';
    return;
  }

  const dropZone = document.querySelector('.photo-drop');
  if (dropZone) dropZone.classList.add('photo-drop-loading');

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const dataUrl = downscaleImage(img);
      const approxBytes = Math.ceil((dataUrl.length * 3) / 4);

      if (approxBytes > PHOTO_MAX_BYTES) {
        alert('That image is still too large after compression. Please choose a smaller photo.');
        if (dropZone) dropZone.classList.remove('photo-drop-loading');
        e.target.value = '';
        return;
      }

      document.getElementById('pf-photo').value = dataUrl;
      updatePostPhotoPreview();
      if (dropZone) dropZone.classList.remove('photo-drop-loading');
    };
    img.onerror = () => {
      alert("Couldn't read that image. Please try a different file.");
      if (dropZone) dropZone.classList.remove('photo-drop-loading');
      e.target.value = '';
    };
    img.src = reader.result;
  };
  reader.onerror = () => {
    alert("Couldn't read that file. Please try again.");
    if (dropZone) dropZone.classList.remove('photo-drop-loading');
  };
  reader.readAsDataURL(file);
}

/* Draws the loaded image onto a canvas scaled down so its longest
   side is at most PHOTO_MAX_DIMENSION, then re-encodes it as a
   compressed JPEG data URL. Images already smaller than the max
   dimension are only re-compressed, not upscaled. */
function downscaleImage(img) {
  const scale = Math.min(1, PHOTO_MAX_DIMENSION / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', PHOTO_JPEG_QUALITY);
}

/* Keeps the form's photo preview in sync: a plain thumbnail, or - when
   "Use school frame" is ticked - the photo inside the school frame with
   the post title in the green bar (updates as the title is typed). */
function updatePostPhotoPreview() {
  const wrap = document.getElementById('pf-photo-wrap');
  if (!wrap) return;
  const src = document.getElementById('pf-photo').value;
  const frameBox = document.getElementById('pf-frame');
  const framed = !!(src && frameBox && frameBox.checked);
  const plain = document.getElementById('pf-photo-preview');
  const fig = document.getElementById('pf-frame-preview');

  wrap.style.display = src ? '' : 'none';
  wrap.classList.toggle('is-framed', framed);
  if (plain.getAttribute('src') !== src) plain.src = src;
  plain.style.display = framed ? 'none' : 'block';
  fig.style.display = framed ? 'block' : 'none';
  const fp = document.getElementById('pf-frame-photo');
  if (fp.getAttribute('src') !== src) fp.src = src;
  const titleInput = document.getElementById('pf-title');
  document.getElementById('pf-frame-title').textContent = titleInput ? titleInput.value : '';
}

function clearPostPhoto() {
  document.getElementById('pf-photo').value = '';
  updatePostPhotoPreview();
  const input = document.getElementById('pf-photo-input');
  if (input) input.value = ''; /* lets the same file be chosen again */
}

/* The font/size dropdowns steal focus from the editor and drop the
   text selection, so the last selection inside the editor is saved
   and restored before a command is applied. */
let savedDetailsRange = null;

function saveDetailsSelection() {
  const editor = document.getElementById('pf-details');
  const sel = window.getSelection();
  if (editor && sel.rangeCount && editor.contains(sel.getRangeAt(0).commonAncestorContainer)) {
    savedDetailsRange = sel.getRangeAt(0).cloneRange();
  }
}

function formatDetails(cmd, value) {
  const editor = document.getElementById('pf-details');
  editor.focus();
  if (savedDetailsRange) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedDetailsRange);
  }
  document.execCommand(cmd, false, value === undefined ? null : value);
  saveDetailsSelection();
}

function applyDetailsFont(select) {
  if (select.value) formatDetails('fontName', select.value);
  select.selectedIndex = 0;
}

function applyDetailsSize(select) {
  if (select.value) formatDetails('fontSize', select.value);
  select.selectedIndex = 0;
}

function readPostForm() {
  const category = document.getElementById('pf-category').value;
  return {
    category,
    title: document.getElementById('pf-title').value.trim(),
    details: sanitizeDetails(document.getElementById('pf-details').innerHTML).trim(),
    date: document.getElementById('pf-date').value,
    time: document.getElementById('pf-time').value,
    location: document.getElementById('pf-location').value.trim(),
    photo: document.getElementById('pf-photo').value || '',
    frame: !!(document.getElementById('pf-frame') && document.getElementById('pf-frame').checked)
  };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}
