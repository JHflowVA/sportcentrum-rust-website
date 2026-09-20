// Sportcentrum Rust — mobiel menu, jaartal in de footer, de homepage-carousel en het
// zachte "in beeld komen" van secties bij scrollen (.reveal)

document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('hoofdmenu');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var jaarEl = document.getElementById('jaar');
  if (jaarEl) {
    jaarEl.textContent = new Date().getFullYear();
  }

  // Contact: "Hoe kunnen we u helpen?"-knoppen vullen alleen het onderwerp-veld van het
  // bestaande formulier, geen apart systeem (zie contact.html).
  var helpmenuKnoppen = document.querySelectorAll('.helpmenu-button');
  var onderwerpVeld = document.getElementById('onderwerp');
  if (helpmenuKnoppen.length && onderwerpVeld) {
    helpmenuKnoppen.forEach(function (knop) {
      knop.addEventListener('click', function () {
        onderwerpVeld.value = knop.getAttribute('data-onderwerp') || '';
        helpmenuKnoppen.forEach(function (k) { k.classList.remove('is-actief'); });
        knop.classList.add('is-actief');
        onderwerpVeld.focus();
      });
    });
  }

  // Homepage-carousel (index.html, [data-carousel]). Zonder dit script blijven de dia's een
  // gewone, met de hand te bladeren rij. Met dit script liggen alle dia's op elkaar en
  // vloeit de volgende zacht over de vorige heen (zie .carousel.is-enhanced in style.css);
  // daar komen de knoppen, de teller, vegen en het automatisch wisselen bij. Dat wisselen
  // stopt zodra iemand de muis of vinger erop zet, zodra er focus in komt, of via de
  // pauzeknop, en het start niet voor wie minder beweging wil.
  var carouselSectie = document.querySelector('[data-carousel]');
  if (carouselSectie) {
    (function () {
      var carousel = carouselSectie.querySelector('.carousel');
      var track = carouselSectie.querySelector('.carousel-track');
      var dias = carouselSectie.querySelectorAll('.carousel-slide');
      var bediening = carouselSectie.querySelector('.carousel-bediening');
      var knopVorige = carouselSectie.querySelector('[data-vorige]');
      var knopVolgende = carouselSectie.querySelector('[data-volgende]');
      var knopPauze = carouselSectie.querySelector('[data-pauze]');
      var tellerNu = carouselSectie.querySelector('[data-teller-nu]');
      var tellerTotaal = carouselSectie.querySelector('[data-teller-totaal]');
      if (!carousel || !track || dias.length < 2 || !bediening) { return; }

      var totaal = dias.length;
      // Alle tijden staan hier en alleen hier: verderop in dit blok worden ze als
      // CSS-variabelen aan de stijlen doorgegeven, zodat die er nooit van af kunnen wijken.
      var interval = 3500;  // tijd per foto, inclusief de overgang naar de volgende
      var overgang = 1400;  // duur van het overvloeien
      var minderBeweging =
        !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var huidig = 0;
      var gebruikerPauze = minderBeweging; // pauzeknop, of vinger erop gezet
      var muisErboven = false;
      var toetsenbordErin = false;         // alleen echte toetsenbordfocus, zie focusin
      var inBeeld = !('IntersectionObserver' in window);
      var timer = null;
      var opruimTimer = null;

      carousel.classList.add('is-enhanced');
      // Staan de nieuwe stijlen er niet bij (een oude style.css uit het geheugen van de
      // browser), dan zouden de dia's wel wisselen maar niets zichtbaars doen. Dan liever niets
      // aanzetten en de gewone, bladerbare rij laten staan.
      if (window.getComputedStyle(track).display !== 'grid') {
        carousel.classList.remove('is-enhanced');
        if (window.console) { console.warn('Carousel: oude style.css geladen, herlaad met Ctrl+F5.'); }
        return;
      }
      carousel.style.setProperty('--overgang', overgang + 'ms');
      // De foto zoomt heel langzaam in en blijft dat doen terwijl hij wegvervaagt, dus de
      // zoom duurt precies zo lang als de foto in beeld is plus de overgang.
      carousel.style.setProperty('--zoom-duur', (interval + overgang) + 'ms');
      track.removeAttribute('tabindex'); // niet meer scrollbaar, dus geen focusstop nodig
      dias[0].classList.add('is-actief');
      bediening.hidden = false;
      tellerTotaal.textContent = totaal;
      if (minderBeweging) { knopPauze.hidden = true; }

      // De dia's na de eerste laden "lazy". Een dia die nog niet binnen is, zou als leeg vlak
      // in beeld vervagen, dus de eerstvolgende wordt alvast opgehaald.
      function voorlaad(i) {
        var img = dias[i % totaal].querySelector('img');
        if (img) { img.loading = 'eager'; }
      }
      voorlaad(1);

      // De nieuwe dia vervaagt IN over de vorige, die zolang volledig zichtbaar blijft.
      // Zo zakt het beeld nooit even weg naar de achtergrond, wat bij twee dia's die tegelijk
      // vervagen wel gebeurt.
      function toon(index) {
        var nieuw = (index + totaal) % totaal;
        if (nieuw === huidig) { return; }
        var oud = dias[huidig];
        for (var i = 0; i < totaal; i++) { dias[i].classList.remove('is-vorige'); }
        oud.classList.remove('is-actief');
        oud.classList.add('is-vorige');
        dias[nieuw].classList.add('is-actief');
        huidig = nieuw;
        tellerNu.textContent = huidig + 1;
        voorlaad(huidig + 1);
        clearTimeout(opruimTimer);
        opruimTimer = setTimeout(function () {
          oud.classList.remove('is-vorige');
        }, minderBeweging ? 0 : overgang);
      }

      // De zoom van de eerste foto begint pas zodra de carousel voor het eerst in beeld is.
      // Anders was die al afgelopen terwijl je nog bovenaan de pagina zat, en stond de eerste
      // foto stil tot de eerste wissel terwijl alle volgende foto's wel bewegen.
      var gestart = false;
      function start() {
        if (gestart) { return; }
        gestart = true;
        carousel.classList.add('is-gestart');
      }

      function stopTimer() {
        if (timer) { clearInterval(timer); timer = null; }
      }

      // Zet de timer opnieuw op de volle tijd, of laat hem uit als er reden is om te wachten.
      function herstartTimer() {
        stopTimer();
        if (!gebruikerPauze && !muisErboven && !toetsenbordErin && inBeeld && !document.hidden) {
          timer = setInterval(function () { toon(huidig + 1); }, interval);
        }
      }

      // Bij een pauze geeft de dia-wissel een melding aan schermlezers; tijdens automatisch
      // wisselen niet, dat zou de gebruiker telkens onderbreken.
      function zetPauzeStand() {
        knopPauze.classList.toggle('is-gepauzeerd', gebruikerPauze);
        knopPauze.setAttribute('aria-label', gebruikerPauze
          ? 'Start het automatisch wisselen'
          : 'Pauzeer het automatisch wisselen');
        track.setAttribute('aria-live', gebruikerPauze ? 'polite' : 'off');
      }
      zetPauzeStand();

      knopVorige.addEventListener('click', function () { toon(huidig - 1); herstartTimer(); });
      knopVolgende.addEventListener('click', function () { toon(huidig + 1); herstartTimer(); });
      knopPauze.addEventListener('click', function () {
        gebruikerPauze = !gebruikerPauze;
        zetPauzeStand();
        herstartTimer();
      });

      carousel.addEventListener('mouseenter', function () { muisErboven = true; herstartTimer(); });
      carousel.addEventListener('mouseleave', function () { muisErboven = false; herstartTimer(); });
      // Alleen toetsenbordfocus pauzeert. Na een muisklik op een knop blijft de focus er ook
      // staan, en dan zou het wisselen anders stilvallen tot je ergens anders klikt.
      carousel.addEventListener('focusin', function (e) {
        var zichtbaar = true;
        try { zichtbaar = e.target.matches(':focus-visible'); } catch (fout) { zichtbaar = true; }
        if (zichtbaar) { toetsenbordErin = true; herstartTimer(); }
      });
      carousel.addEventListener('focusout', function (e) {
        if (!carousel.contains(e.relatedTarget)) { toetsenbordErin = false; herstartTimer(); }
      });
      // Vinger erop: blijvend pauzeren tot iemand zelf op start drukt. Op een telefoon is er
      // geen "muis weg" waarna het vanzelf weer zou moeten beginnen.
      carousel.addEventListener('touchstart', function () {
        if (!gebruikerPauze) { gebruikerPauze = true; zetPauzeStand(); herstartTimer(); }
      }, { passive: true });

      // Vegen over de foto: naar links is volgende, naar rechts is vorige. Alleen een
      // duidelijk horizontale veeg telt, zodat gewoon omlaag scrollen niet per ongeluk wisselt.
      var veegX = null;
      var veegY = null;
      track.addEventListener('touchstart', function (e) {
        veegX = e.touches[0].clientX;
        veegY = e.touches[0].clientY;
      }, { passive: true });
      track.addEventListener('touchend', function (e) {
        if (veegX === null) { return; }
        var dx = e.changedTouches[0].clientX - veegX;
        var dy = e.changedTouches[0].clientY - veegY;
        veegX = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          toon(huidig + (dx < 0 ? 1 : -1));
        }
      }, { passive: true });

      document.addEventListener('visibilitychange', herstartTimer);

      if ('IntersectionObserver' in window) {
        // 10% is genoeg: op een gewoon scherm steekt de carousel bij het laden al deels onder
        // de hero uit, en bij 30% zou de timer dan pas lopen nadat je verder gescrold hebt.
        new IntersectionObserver(function (entries) {
          inBeeld = entries[0].isIntersecting;
          if (inBeeld) { start(); }
          herstartTimer();
        }, { threshold: 0.1 }).observe(carousel);
      } else {
        start();
        herstartTimer();
      }
    })();
  }

  var revealElementen = document.querySelectorAll('.reveal');
  var geenVoorkeurVoorMinderBeweging =
    !window.matchMedia || window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

  if (revealElementen.length && geenVoorkeurVoorMinderBeweging && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealElementen.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Geen animatie-ondersteuning of de voorkeur staat uit: toon alles direct.
    revealElementen.forEach(function (el) {
      el.classList.add('in-view');
    });
  }
});
