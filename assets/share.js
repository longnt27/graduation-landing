(() => {
  const shareBtn = document.getElementById('shareBtn');
  if (!shareBtn) return;

  const cleanUrl = () => `${location.origin}${location.pathname}${location.search}`;

  function showShareToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showShareToast.timer);
    showShareToast.timer = setTimeout(() => toast.classList.remove('show'), 2300);
  }

  async function copyInviteLink(url) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }

    const input = document.createElement('textarea');
    input.value = url;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    input.setSelectionRange(0, input.value.length);
    const copied = document.execCommand('copy');
    input.remove();
    return copied;
  }

  shareBtn.addEventListener('click', async event => {
    // app-core.js contains an older share listener. This capture-phase handler is
    // deliberately authoritative so a tap can never trigger two share actions.
    event.stopImmediatePropagation();

    const url = cleanUrl();
    const shareData = {
      title: document.title,
      text: 'Mời bạn tới dự lễ tốt nghiệp của em Long ngày 27/09/2026.',
      url
    };

    try {
      // Call navigator.share directly from the user gesture. On supported mobile
      // browsers this opens the operating system's native share sheet.
      if (typeof navigator.share === 'function' &&
          (typeof navigator.canShare !== 'function' || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        return;
      }

      if (await copyInviteLink(url)) {
        showShareToast('Trình duyệt này không hỗ trợ bảng chia sẻ. Đã copy link thiệp mời.');
      } else {
        showShareToast('Không thể mở bảng chia sẻ trên trình duyệt này.');
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;

      try {
        if (await copyInviteLink(url)) {
          showShareToast('Không thể mở bảng chia sẻ. Đã copy link thiệp mời.');
          return;
        }
      } catch (_) {
        // Fall through to the generic message below.
      }
      showShareToast('Không thể chia sẻ link trên trình duyệt này.');
    }
  }, { capture: true });
})();
