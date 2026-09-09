(() => {
  // Keep the hero to the two intended actions even if an older cached app.js
  // still injects the temporary Messenger CTA into the invitation itself.
  const heroMessenger = document.querySelector('.hero-actions #messengerBtn');
  if (heroMessenger) heroMessenger.remove();

  const style = document.createElement('style');
  style.textContent = `
    /* The wheel picker panel lives inside the RSVP card while the original
       backdrop was appended to <body>. The card creates its own stacking
       context, so the backdrop could sit above the picker and swallow every
       tap/scroll. This picker does not need to modalize the whole page: keep
       the sheet/popover interactive and remove the blocking backdrop. */
    .wheel-time-backdrop {
      display: none !important;
      pointer-events: none !important;
    }
    .wheel-time-picker.is-open {
      z-index: 200 !important;
    }
    .wheel-time-panel {
      pointer-events: auto !important;
    }
    #rsvp .panel,
    #rsvp .forms-grid {
      overflow: visible !important;
    }

    /* Keep the invitation close to the next section on phones/tablets. Desktop
       spacing is intentionally untouched. */
    @media (max-width: 639px) {
      .hero {
        padding-top: 5px !important;
        padding-bottom: 7px !important;
      }
      #countdown {
        padding-top: 4px !important;
      }

      /* Keep Google Maps embedded on phones, just make it compact enough that it
         does not dominate the viewport. This intentionally overrides the older
         mobile rule in custom-ui.js that hid the iframe completely. */
      .map-embed-wrap {
        display: block !important;
        width: 100% !important;
        height: clamp(160px, 46vw, 190px) !important;
        min-height: 0 !important;
        aspect-ratio: auto !important;
      }
      .map-embed {
        display: block !important;
        width: 100% !important;
        height: 100% !important;
        min-height: 0 !important;
        border: 0 !important;
      }
    }

    @media (min-width: 640px) and (max-width: 899px) {
      .hero {
        padding-top: 8px !important;
        padding-bottom: 10px !important;
      }
      #countdown {
        padding-top: 5px !important;
      }
    }
  `;
  document.head.appendChild(style);
})();
