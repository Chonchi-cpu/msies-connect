/* ============================================================
   modal.js - reusable modal overlay component.
   Injects HTML into #modal-root. Call openModal(html) to show,
   closeModal() to hide. Clicking the overlay background or
   pressing Escape also closes the modal.
   ============================================================ */

function openModal(innerHtml) {
  const root = document.getElementById('modal-root');
  if (!root) return;
  root.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-box">${innerHtml}</div>
    </div>
  `;
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
}

function closeModal() {
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});
