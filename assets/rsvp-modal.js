(() => {
  const status = document.getElementById('rsvpStatus');
  if (!status) return;

  const modal = document.createElement('dialog');
  modal.id = 'rsvpConfirmModal';
  modal.setAttribute('aria-labelledby', 'rsvpConfirmTitle');
  modal.innerHTML = `
    <div class="rsvp-modal-shell">
      <button class="rsvp-modal-close" type="button" aria-label="Đóng">×</button>
      <div class="rsvp-modal-kicker">Đã xác nhận</div>
      <h3 class="rsvp-modal-title" id="rsvpConfirmTitle">Cảm ơn bạn nhé</h3>
      <div class="rsvp-modal-message"></div>
      <button class="btn btn-primary rsvp-modal-action" type="button">Đóng</button>
    </div>
  `;
  document.body.appendChild(modal);

  const message = modal.querySelector('.rsvp-modal-message');
  const closeButtons = modal.querySelectorAll('.rsvp-modal-close, .rsvp-modal-action');
  let lastRendered = '';

  const close = () => {
    if (typeof modal.close === 'function' && modal.open) modal.close();
  };

  closeButtons.forEach(button => button.addEventListener('click', close));

  modal.addEventListener('click', event => {
    if (event.target !== modal) return;
    const rect = modal.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right &&
      event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) close();
  });

  function maybeShowConfirmation() {
    const isSuccess = status.classList.contains('show') && status.classList.contains('success');
    const html = status.innerHTML.trim();
    if (!isSuccess || !html || html === lastRendered) return;

    lastRendered = html;
    message.innerHTML = html;

    if (typeof modal.showModal === 'function') {
      if (!modal.open) modal.showModal();
    } else {
      modal.setAttribute('open', '');
    }
  }

  new MutationObserver(maybeShowConfirmation).observe(status, {
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
    subtree: true,
    characterData: true
  });

  maybeShowConfirmation();
})();
