(() => {
  const PLAUSIBLE_DOMAIN = "dekosrl.com";
  const GA4_ID = "G-XXXXXXXXXX";           // <-- metterai il tuo ID quando passi a GA

  // ----- Loader Plausible (solo dopo consenso) -----
  function loadPlausibleOnce() {
    if (document.querySelector('script[data-deko-plausible="1"]')) return;

// 1) crea lo stub prima, così se parte subito non rompe
  window.plausible = window.plausible || function () {
    (plausible.q = plausible.q || []).push(arguments);
  };
  window.plausible.init = window.plausible.init || function (i) {
    plausible.o = i || {};
  };

  // 2) carica lo script che usavi in index
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://plausible.io/js/pa-Zeybz08ecOOOBLm79kksV.js"; // <-- qui il tuo xxx.js
  s.setAttribute("data-deko-plausible", "1");
  s.onload = () => {
    // 3) inizializza come facevi prima
    window.plausible.init();
  };
  document.head.appendChild(s);
}

  // ----- GA4 Consent Mode: default denied (sicuro) -----
  function initGAConsentModeStub() {
    // Se l'utente non ha accettato, vogliamo "denied" come default.
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ dataLayer.push(arguments); };

    // Default DENIED: finché non accetti, GA non deve tracciare
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }

  // ----- Loader GA4 (solo dopo consenso) -----
  function loadGA4Once() {
    if (document.querySelector('script[data-deko-ga4="1"]')) return;

    // Se ancora non hai GA4_ID, non carichiamo nulla
    if (!GA4_ID || GA4_ID === "G-XXXXXXXXXX") return;

    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    s.setAttribute("data-deko-ga4", "1");
    document.head.appendChild(s);

    // Config (no eval, niente roba strana)
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID, {
      anonymize_ip: true
    });
  }

  // Stub consent mode subito (così gtag esiste SEMPRE e non crasha)
  initGAConsentModeStub();

  // ----- CONFIG SILKTIDE -----
  window.silktideCookieBannerManager.updateCookieBannerConfig({
    background: { showBackground: true },
    cookieIcon: { position: "bottomRight" },

    cookieTypes: [
      {
        id: "necessary",
        name: "Necessary",
        description: "<p>These cookies are required for the website to function and cannot be turned off.</p>",
        required: true,
        onAccept: function () {
          // nulla di speciale qui (tecnici)
        }
      },
      {
        id: "analytics",
        name: "Analytics",
        description: "<p>Analytics help us understand how the website is used so we can improve it.</p>",
        required: false,

        onAccept: function () {
          // 1) abilita consent mode per GA
          window.gtag('consent', 'update', { analytics_storage: 'granted' });

          // 2) carica analytics SOLO ORA
          loadPlausibleOnce();
          loadGA4Once();

          // 3) evento opzionale
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ event: "consent_accepted_analytics" });
        },

        onReject: function () {
          // GA denied
          window.gtag('consent', 'update', { analytics_storage: 'denied' });
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ event: "consent_rejected_analytics" });
        }
      }
    ],

    text: {
      banner: {
        description:
          "<p>We use necessary cookies to make the site work. With your consent, we also use analytics to improve performance. <a href=\"cookie_policy-en.html\">Cookie Policy</a>.</p>",
        acceptAllButtonText: "Accept all",
        acceptAllButtonAccessibleLabel: "Accept all cookies",
        rejectNonEssentialButtonText: "Reject non-essential",
        rejectNonEssentialButtonAccessibleLabel: "Reject non-essential cookies",
        preferencesButtonText: "Preferences",
        preferencesButtonAccessibleLabel: "Open cookie preferences"
      },
      preferences: {
        title: "Customize your cookie preferences",
        description:
          "<p>You can choose which cookies you allow. Your preferences will apply across the website.</p>"
      }
    },

    position: { banner: "bottomRight" }
  });
})();
