(() => {
  // Keep the hero to the two intended actions even if an older cached app.js
  // still injects the temporary Messenger CTA into the invitation itself.
  const heroMessenger = document.querySelector('.hero-actions #messengerBtn');
  if (heroMessenger) heroMessenger.remove();

  const style = document.createElement('style');
  style.textContent = `
    /* On phones and small tablets the old section rhythm left ~60px between the
       invitation card and the countdown while horizontal gutters were ~16-18px.
       Tighten only that vertical rhythm; desktop composition stays untouched. */
    @media (max-width: 639px) {
      .hero {
        padding-top: 10px !important;
        padding-bottom: 14px !important;
      }
      #countdown {
        padding-top: 8px !important;
      }
    }

    @media (min-width: 640px) and (max-width: 899px) {
      .hero {
        padding-top: 16px !important;
        padding-bottom: 20px !important;
      }
      #countdown {
        padding-top: 10px !important;
      }
    }
  `;
  document.head.appendChild(style);
})();
