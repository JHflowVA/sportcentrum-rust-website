// Sportcentrum Rust — mobiel menu, jaartal in de footer en het zachte "in beeld
// komen" van secties bij scrollen (.reveal)

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
