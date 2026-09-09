(() => {
  const input = document.querySelector('#arrivalTime');
  if (!input || input.dataset.wheelTimeReady === 'true') return;
  input.dataset.wheelTimeReady = 'true';

  const ITEM_HEIGHT = 44;
  const DEFAULT_TIME = '08:00';
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  input.classList.add('native-time-proxy');

  const root = document.createElement('div');
  root.className = 'wheel-time-picker';
  input.parentNode.insertBefore(root, input);
  root.appendChild(input);

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'wheel-time-trigger is-placeholder';
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.textContent = 'Chọn giờ';

  const backdrop = document.createElement('div');
  backdrop.className = 'wheel-time-backdrop';
  backdrop.hidden = true;

  const panel = document.createElement('div');
  panel.className = 'wheel-time-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-label', 'Chọn giờ dự kiến có mặt');

  panel.innerHTML = `
    <div class="wheel-time-head">
      <div>
        <div class="wheel-time-kicker">DỰ KIẾN CÓ MẶT</div>
        <div class="wheel-time-title">Chọn giờ</div>
      </div>
      <button class="wheel-time-done" type="button">Xong</button>
    </div>
    <div class="wheel-time-labels" aria-hidden="true">
      <span>Giờ</span><span>Phút</span>
    </div>
    <div class="wheel-time-wheels">
      <div class="wheel-time-selection" aria-hidden="true"></div>
      <div class="wheel-time-column" data-wheel="hour" role="listbox" aria-label="Giờ"></div>
      <div class="wheel-time-colon" aria-hidden="true">:</div>
      <div class="wheel-time-column" data-wheel="minute" role="listbox" aria-label="Phút"></div>
    </div>
    <div class="wheel-time-footer">
      <button class="wheel-time-clear" type="button">Bỏ chọn</button>
      <span>Mỗi nấc 15 phút</span>
    </div>
  `;

  root.append(trigger, panel);
  document.body.appendChild(backdrop);

  const hourWheel = panel.querySelector('[data-wheel="hour"]');
  const minuteWheel = panel.querySelector('[data-wheel="minute"]');
  const done = panel.querySelector('.wheel-time-done');
  const clear = panel.querySelector('.wheel-time-clear');
  let draftHour = '08';
  let draftMinute = '00';
  let scrollTimer = null;

  function buildWheel(container, values) {
    const topSpacer = document.createElement('div');
    topSpacer.className = 'wheel-time-spacer';
    container.appendChild(topSpacer);

    values.forEach(value => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'wheel-time-item';
      item.dataset.value = value;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');
      item.textContent = value;
      item.addEventListener('click', () => {
        scrollToValue(container, value, true);
      });
      container.appendChild(item);
    });

    const bottomSpacer = document.createElement('div');
    bottomSpacer.className = 'wheel-time-spacer';
    container.appendChild(bottomSpacer);
  }

  buildWheel(hourWheel, hours);
  buildWheel(minuteWheel, minutes);

  function valuesFor(container) {
    return container === hourWheel ? hours : minutes;
  }

  function nearestValue(container) {
    const values = valuesFor(container);
    const index = Math.max(0, Math.min(values.length - 1, Math.round(container.scrollTop / ITEM_HEIGHT)));
    return values[index];
  }

  function paintSelection(container, value) {
    container.querySelectorAll('.wheel-time-item').forEach(item => {
      const selected = item.dataset.value === value;
      item.classList.toggle('is-selected', selected);
      item.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
  }

  function commitDraftFromScroll(container) {
    const value = nearestValue(container);
    if (container === hourWheel) draftHour = value;
    else draftMinute = value;
    paintSelection(container, value);
  }

  function snap(container) {
    const value = nearestValue(container);
    scrollToValue(container, value, true);
  }

  [hourWheel, minuteWheel].forEach(container => {
    container.addEventListener('scroll', () => {
      commitDraftFromScroll(container);
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => snap(container), 90);
    }, { passive: true });

    container.addEventListener('keydown', event => {
      const values = valuesFor(container);
      const current = values.indexOf(nearestValue(container));
      let next = current;
      if (event.key === 'ArrowDown') next = Math.min(values.length - 1, current + 1);
      else if (event.key === 'ArrowUp') next = Math.max(0, current - 1);
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = values.length - 1;
      else return;
      event.preventDefault();
      scrollToValue(container, values[next], true);
    });
  });

  function scrollToValue(container, value, smooth = false) {
    const values = valuesFor(container);
    const index = Math.max(0, values.indexOf(value));
    container.scrollTo({ top: index * ITEM_HEIGHT, behavior: smooth ? 'smooth' : 'auto' });
    if (container === hourWheel) draftHour = values[index];
    else draftMinute = values[index];
    paintSelection(container, values[index]);
  }

  function parseTime(value) {
    const match = /^(\d{2}):(\d{2})$/.exec(value || '');
    if (!match) return DEFAULT_TIME.split(':');
    const hour = hours.includes(match[1]) ? match[1] : '08';
    const rawMinute = Number(match[2]);
    const snappedMinute = minutes.reduce((best, candidate) =>
      Math.abs(Number(candidate) - rawMinute) < Math.abs(Number(best) - rawMinute) ? candidate : best
    , '00');
    return [hour, snappedMinute];
  }

  function syncTrigger() {
    if (input.value) {
      trigger.textContent = input.value;
      trigger.classList.remove('is-placeholder');
    } else {
      trigger.textContent = 'Chọn giờ';
      trigger.classList.add('is-placeholder');
    }
    trigger.disabled = input.disabled;
    root.classList.toggle('is-disabled', input.disabled);
    if (input.disabled && root.classList.contains('is-open')) close();
  }

  function open() {
    if (input.disabled) return;
    const [hour, minute] = parseTime(input.value);
    draftHour = hour;
    draftMinute = minute;
    root.classList.add('is-open');
    panel.hidden = false;
    backdrop.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');

    requestAnimationFrame(() => {
      scrollToValue(hourWheel, draftHour, false);
      scrollToValue(minuteWheel, draftMinute, false);
      hourWheel.focus({ preventScroll: true });
    });
  }

  function close({ focusTrigger = false } = {}) {
    root.classList.remove('is-open');
    panel.hidden = true;
    backdrop.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (focusTrigger) trigger.focus();
  }

  function setValue(value) {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    syncTrigger();
  }

  trigger.addEventListener('click', () => root.classList.contains('is-open') ? close() : open());
  done.addEventListener('click', () => {
    setValue(`${draftHour}:${draftMinute}`);
    close({ focusTrigger: true });
  });
  clear.addEventListener('click', () => {
    setValue('');
    close({ focusTrigger: true });
  });
  backdrop.addEventListener('click', () => close({ focusTrigger: true }));

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && root.classList.contains('is-open')) close({ focusTrigger: true });
  });

  const label = document.querySelector('label[for="arrivalTime"]');
  label?.addEventListener('click', event => {
    event.preventDefault();
    trigger.focus();
  });

  input.addEventListener('change', syncTrigger);
  input.form?.addEventListener('reset', () => setTimeout(syncTrigger, 0));
  document.querySelector('#attendance')?.addEventListener('change', () => setTimeout(syncTrigger, 0));

  const disabledObserver = new MutationObserver(syncTrigger);
  disabledObserver.observe(input, { attributes: true, attributeFilter: ['disabled'] });

  const style = document.createElement('style');
  style.textContent = `
    .native-time-proxy {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0 0 0 0) !important;
      clip-path: inset(50%) !important;
      white-space: nowrap !important;
      border: 0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
    .wheel-time-picker {
      position: relative;
      width: 100%;
      min-width: 0;
    }
    .wheel-time-trigger {
      width: 100%;
      min-height: 49px;
      border-radius: 14px;
      border: 1px solid rgba(233,207,147,.17);
      background: rgba(255,250,240,.085);
      color: #fff8ef;
      padding: 14px 46px 14px 15px;
      text-align: left;
      font: inherit;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      outline: none;
      position: relative;
      transition: border-color .18s ease, background .18s ease, box-shadow .18s ease;
    }
    .wheel-time-trigger::after {
      content: '◷';
      position: absolute;
      right: 15px;
      top: 50%;
      transform: translateY(-52%);
      color: #e9cf93;
      font-size: 20px;
      line-height: 1;
    }
    .wheel-time-trigger.is-placeholder { color: rgba(255,239,219,.55); }
    .wheel-time-trigger:hover { background: rgba(255,250,240,.105); border-color: rgba(233,207,147,.30); }
    .wheel-time-trigger:focus-visible,
    .wheel-time-picker.is-open .wheel-time-trigger {
      background: rgba(255,250,240,.12);
      border-color: rgba(233,207,147,.48);
      box-shadow: 0 0 0 3px rgba(233,207,147,.08);
    }
    .wheel-time-trigger:disabled {
      opacity: .42;
      cursor: not-allowed;
    }
    .wheel-time-backdrop[hidden], .wheel-time-panel[hidden] { display: none !important; }
    .wheel-time-backdrop {
      position: fixed;
      inset: 0;
      z-index: 119;
      background: rgba(20,0,4,.28);
      backdrop-filter: blur(1px);
    }
    .wheel-time-panel {
      position: absolute;
      z-index: 120;
      left: 0;
      right: 0;
      top: calc(100% + 8px);
      padding: 16px;
      border-radius: 18px;
      border: 1px solid rgba(233,207,147,.24);
      background: linear-gradient(180deg,#3b070d 0%,#2a0408 100%);
      box-shadow: 0 22px 60px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.035);
    }
    .wheel-time-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 8px;
    }
    .wheel-time-kicker {
      color: #d5b96f;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: .18em;
    }
    .wheel-time-title {
      margin-top: 3px;
      color: #fff5e8;
      font-family: 'Cormorant Garamond', serif;
      font-size: 25px;
      font-weight: 700;
      line-height: 1;
    }
    .wheel-time-done, .wheel-time-clear {
      border: 0;
      background: transparent;
      color: #f0d485;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      padding: 8px 4px;
    }
    .wheel-time-labels {
      display: grid;
      grid-template-columns: 1fr 24px 1fr;
      padding: 0 12px 4px;
      color: rgba(255,239,219,.52);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .12em;
      text-transform: uppercase;
      text-align: center;
    }
    .wheel-time-labels span:first-child { grid-column: 1; }
    .wheel-time-labels span:last-child { grid-column: 3; }
    .wheel-time-wheels {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 24px 1fr;
      align-items: center;
      height: 220px;
      overflow: hidden;
      border-top: 1px solid rgba(233,207,147,.10);
      border-bottom: 1px solid rgba(233,207,147,.10);
    }
    .wheel-time-selection {
      position: absolute;
      z-index: 0;
      left: 8px;
      right: 8px;
      top: 50%;
      height: 44px;
      transform: translateY(-50%);
      border-top: 1px solid rgba(233,207,147,.28);
      border-bottom: 1px solid rgba(233,207,147,.28);
      background: rgba(233,207,147,.065);
      border-radius: 9px;
      pointer-events: none;
    }
    .wheel-time-column {
      position: relative;
      z-index: 1;
      height: 220px;
      overflow-y: auto;
      scroll-snap-type: y mandatory;
      overscroll-behavior: contain;
      scrollbar-width: none;
      -ms-overflow-style: none;
      -webkit-overflow-scrolling: touch;
      touch-action: pan-y;
      outline: none;
      -webkit-mask-image: linear-gradient(to bottom,transparent 0%,#000 27%,#000 73%,transparent 100%);
      mask-image: linear-gradient(to bottom,transparent 0%,#000 27%,#000 73%,transparent 100%);
    }
    .wheel-time-column::-webkit-scrollbar { display: none; }
    .wheel-time-column[data-wheel="hour"] { grid-column: 1; }
    .wheel-time-column[data-wheel="minute"] { grid-column: 3; }
    .wheel-time-spacer { height: 88px; flex: 0 0 88px; }
    .wheel-time-item {
      display: block;
      width: 100%;
      height: 44px;
      scroll-snap-align: center;
      border: 0;
      background: transparent;
      color: rgba(255,245,232,.43);
      font-family: 'Montserrat', sans-serif;
      font-size: 24px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      text-align: center;
      cursor: pointer;
      outline: none;
      transition: color .12s ease, transform .12s ease;
    }
    .wheel-time-item.is-selected {
      color: #fff8ef;
      font-size: 28px;
      font-weight: 700;
    }
    .wheel-time-item:focus-visible { color: #f5d988; }
    .wheel-time-colon {
      position: absolute;
      z-index: 3;
      left: 50%;
      top: 50%;
      transform: translate(-50%,-55%);
      color: #e9cf93;
      font-size: 27px;
      font-weight: 700;
      pointer-events: none;
    }
    .wheel-time-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-top: 8px;
      color: rgba(255,239,219,.45);
      font-size: 10px;
    }
    .wheel-time-clear { color: rgba(255,239,219,.72); font-size: 11px; }

    @media (max-width: 639px) {
      .wheel-time-backdrop { background: rgba(15,0,3,.55); backdrop-filter: blur(3px); }
      .wheel-time-panel {
        position: fixed;
        left: 10px;
        right: 10px;
        top: auto;
        bottom: calc(76px + env(safe-area-inset-bottom));
        border-radius: 22px;
        padding: 17px 16px 14px;
      }
      .wheel-time-wheels { height: 220px; }
      .wheel-time-column { height: 220px; }
    }
  `;
  document.head.appendChild(style);

  syncTrigger();
})();
