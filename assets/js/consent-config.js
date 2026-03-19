(() => {
  const GA4_ID = "G-1P1TZ9YN6Y"; // Il tuo ID GA4

  // ----- GA4 Consent Mode: default denied (privacy by design) -----
  function initGAConsentModeStub() {
    window.dataLayer = window.dataLayer || [];

    // Definisci gtag se non esiste
    window.gtag =
      window.gtag ||
      function () {
        dataLayer.push(arguments);
      };

    // Default DENIED: finché non accetti, GA non deve tracciare
    window.gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      wait_for_update: 500, // aspetta mezzo secondo per eventuali aggiornamenti
      region: ["IT"], // specifico per Italia
    });

    console.log("Consent Mode inizializzato - default denied");
  }

  // ----- Loader GA4 (solo dopo consenso) -----
  function loadGA4Once() {
    // Evita caricamenti multipli
    if (document.querySelector('script[data-deko-ga4="1"]')) {
      console.log("GA4 già caricato");
      return;
    }

    console.log("Caricamento GA4 in corso...");

    // Crea e carica lo script GA4
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    s.setAttribute("data-deko-ga4", "1");

    s.onload = function () {
      console.log("GA4 caricato con successo");

      // Configura GA4 dopo il caricamento
      window.gtag("js", new Date());
      window.gtag("config", GA4_ID, {
        anonymize_ip: true, // Anonimizza gli IP (GDPR)
        allow_google_signals: false, // Disabilita reportistica annunci
        allow_ad_personalization_signals: false, // Disabilita personalizzazione annunci
        restricted_data_processing: true, // Modalità elaborazione dati ristretta
        send_page_view: true, // Invia page view
        cookie_flags: "SameSite=None;Secure", // Configurazione cookie sicuri
      });

      console.log("GA4 configurato con impostazioni privacy");
    };

    s.onerror = function () {
      console.error("Errore nel caricamento di GA4");
    };

    document.head.appendChild(s);
  }

  // Inizializza il Consent Mode stub (IMMEDIATAMENTE)
  initGAConsentModeStub();

  // Attendi che il DOM sia pronto per configurare il banner
  function initCookieBanner() {
    // Verifica che Silktide sia disponibile
    if (!window.silktideCookieBannerManager) {
      console.error("Silktide Cookie Banner Manager non trovato");
      return;
    }

    console.log("Configurazione Silktide Cookie Banner in corso...");

    // ----- CONFIGURAZIONE SILKTIDE COMPLETA -----
    window.silktideCookieBannerManager.updateCookieBannerConfig({
      // Background settings
      background: {
        showBackground: true,
        backgroundColor: "rgba(0,0,0,0.5)",
      },

      // Posizione icona cookie
      cookieIcon: {
        position: "bottomRight",
        colorScheme: "light",
      },

      // TIPI DI COOKIE
      cookieTypes: [
        {
          id: "necessary",
          name: "Cookie Necessari",
          description:
            "<p>Questi cookie sono essenziali per il funzionamento del sito e non possono essere disattivati. Includono cookie tecnici per la navigazione e l'accesso ad aree protette.</p>",
          required: true, // Sempre attivi, non modificabili
          onAccept: function () {
            console.log("Cookie necessari attivi");
            // Qui puoi eventualmente caricare script tecnici necessari
          },
        },
        {
          id: "analytics",
          name: "Cookie Analytics",
          description:
            "<p>Questi cookie ci aiutano a capire come i visitatori interagiscono con il sito, raccogliendo informazioni in forma anonima. Utilizziamo Google Analytics per migliorare costantemente i nostri contenuti.</p>",
          required: false,
          defaultValue: false, // Non attivi di default

          onAccept: function () {
            console.log("Cookie analytics ACCETTATI - Attivazione GA4");

            // 1. Aggiorna il consenso per GA4
            window.gtag("consent", "update", {
              analytics_storage: "granted",
            });

            // 2. Carica GA4 solo ora (dopo il consenso)
            loadGA4Once();

            // 3. Evento personalizzato per tracciare il consenso
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
              event: "consent_accepted",
              consent_type: "analytics",
            });
          },

          onReject: function () {
            console.log("Cookie analytics RIFIUTATI - GA4 disattivato");

            // Aggiorna il consenso per GA4
            window.gtag("consent", "update", {
              analytics_storage: "denied",
            });

            // Evento per tracciare il rifiuto (opzionale)
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
              event: "consent_rejected",
              consent_type: "analytics",
            });

            // Se GA4 era già stato caricato, non possiamo "scaricarlo"
            // ma il consent update blocca l'invio di dati
          },
        },
      ],

      // TESTI DEL BANNER (ITALIANO)
      text: {
        banner: {
          description:
            '<p>Utilizziamo cookie tecnici necessari per il funzionamento del sito. Con il tuo consenso, utilizziamo anche cookie analytics (Google Analytics) per migliorare le performance e capire come viene utilizzato il sito. <a href="/cookie-policy" style="text-decoration: underline; color: inherit;">Leggi la Cookie Policy</a> per maggiori informazioni.</p>',
          acceptAllButtonText: "Accetta tutti",
          acceptAllButtonAccessibleLabel:
            "Accetta tutti i cookie, inclusi quelli analytics",
          rejectNonEssentialButtonText: "Solo necessari",
          rejectNonEssentialButtonAccessibleLabel:
            "Accetta solo i cookie necessari",
          preferencesButtonText: "Personalizza",
          preferencesButtonAccessibleLabel: "Apri le preferenze cookie",
        },
        preferences: {
          title: "Personalizza le tue preferenze sui cookie",
          description:
            "<p>Puoi scegliere quali tipi di cookie accettare. I cookie necessari sono sempre attivi perchè essenziali per il funzionamento del sito. Le tue preferenze verranno salvate per 6 mesi.</p>",
          creditLinkText: "Cookie manager by Silktide",
        },
      },

      // POSIZIONE E COMPORTAMENTO
      position: {
        banner: "bottom", // Banner in fondo alla pagina
      },

      // SUFFISSO PER LOCALSTORAGE (per evitare conflitti con altri siti)
      bannerSuffix: "deko_main",

      // MOSTRA BANNER (true = mostra se non ci sono preferenze salvate)
      showBanner: true,

      // CALLBACK OPZIONALI
      onBannerOpen: function () {
        console.log("Banner cookie visualizzato");
      },

      onBannerClose: function () {
        console.log("Banner cookie chiuso");
      },

      onPreferencesOpen: function () {
        console.log("Pannello preferenze aperto");
      },

      onPreferencesClose: function () {
        console.log("Pannello preferenze chiuso");
      },

      onAcceptAll: function () {
        console.log("Tutti i cookie accettati");
      },

      onRejectAll: function () {
        console.log("Cookie non necessari rifiutati");
      },
    });

    console.log("Configurazione Silktide completata");
  }

  // Inizializza il banner quando il DOM è pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCookieBanner);
  } else {
    // DOM già caricato
    initCookieBanner();
  }

  // ESPONI FUNZIONI UTILI PER IL DEBUG (opzionale, rimuovere in produzione)
  window.DEKO = window.DEKO || {};
  window.DEKO.cookieManager = {
    getPreferences: function () {
      const prefs = {};
      const cookieTypes = ["necessary", "analytics"];
      cookieTypes.forEach((type) => {
        prefs[type] =
          localStorage.getItem(`silktideCookieChoice_${type}_deko_main`) ===
          "true";
      });
      console.log("Preferenze cookie correnti:", prefs);
      return prefs;
    },
    resetPreferences: function () {
      const cookieTypes = ["necessary", "analytics"];
      cookieTypes.forEach((type) => {
        localStorage.removeItem(`silktideCookieChoice_${type}_deko_main`);
      });
      localStorage.removeItem("silktideCookieBanner_InitialChoice_deko_main");
      console.log(
        "Preferenze cookie resettate. Ricarica la pagina per vedere il banner.",
      );
      location.reload();
    },
  };
})();
