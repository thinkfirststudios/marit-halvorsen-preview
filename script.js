(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header condenses once the page moves
  var head = document.querySelector('[data-head]');
  if (head) {
    var onScroll = function () { head.classList.toggle('is-condensed', window.scrollY > 32); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Mobile menu
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      head.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
    };
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
  }

  // Content rises with a 70ms stagger
  document.querySelectorAll('[data-rise-group]').forEach(function (group) {
    group.querySelectorAll('[data-rise]').forEach(function (el, i) {
      el.style.transitionDelay = (i * 70) + 'ms';
    });
  });

  var groups = document.querySelectorAll('[data-rise-group]');
  var shown = document.querySelectorAll('.strip__photo, .place');

  if (reduced || !('IntersectionObserver' in window)) {
    groups.forEach(function (g) { g.classList.add('is-risen'); });
    shown.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add(entry.target.hasAttribute('data-rise-group') ? 'is-risen' : 'is-in');
        seen.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    groups.forEach(function (g) { seen.observe(g); });
    shown.forEach(function (el) { seen.observe(el); });
  }

  // Full-width photographs drift slightly against the scroll
  var drifting = document.querySelectorAll('.hero__photo, .vista__photo, .place__photo');
  if (!reduced && window.matchMedia('(min-width: 800px)').matches) {
    var ticking = false;
    var drift = function () {
      ticking = false;
      var vh = window.innerHeight;
      drifting.forEach(function (img) {
        var r = img.parentElement.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) return;
        var progress = (r.top + r.height / 2 - vh / 2) / (vh + r.height);
        img.style.setProperty('--py', (progress * -r.height * 0.05).toFixed(1) + 'px');
      });
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(drift); }
    }, { passive: true });
    drift();
  }

  // Contact form: name plus one way to reach you, nothing else required
  var form = document.querySelector('[data-form]');
  if (!form) return;

  var field = function (name) { return form.elements[name]; };
  var summary = form.querySelector('[data-summary]');

  var setError = function (input, message) {
    var err = document.getElementById(input.id + '-err');
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      err.textContent = message;
      err.hidden = false;
    } else {
      input.removeAttribute('aria-invalid');
      err.textContent = '';
      err.hidden = true;
      if (!form.querySelector('[aria-invalid="true"]')) summary.hidden = true;
    }
  };

  var checkName = function () {
    var ok = field('name').value.trim() !== '';
    setError(field('name'), ok ? '' : 'Enter your name.');
    return ok;
  };

  var checkContact = function () {
    var email = field('email').value.trim();
    var phone = field('phone').value.trim();
    var emailOk = email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    var phoneOk = phone === '' || phone.replace(/\D/g, '').length >= 10;

    setError(field('email'), emailOk ? '' : 'Enter an email address like name@example.com.');
    setError(field('phone'), phoneOk ? '' : 'Enter a phone number with its area code.');
    if (email === '' && phone === '') {
      setError(field('email'), 'Enter an email or a phone number so Marit can reach you.');
      return false;
    }
    return emailOk && phoneOk;
  };

  // Errors clear as the visitor types, not on blur, so the button can't shift out from under a click
  field('name').addEventListener('input', function () {
    if (field('name').hasAttribute('aria-invalid')) checkName();
  });
  ['email', 'phone'].forEach(function (name) {
    field(name).addEventListener('input', function () {
      if (field('email').hasAttribute('aria-invalid') || field('phone').hasAttribute('aria-invalid')) checkContact();
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var nameOk = checkName();
    var contactOk = checkContact();
    if (nameOk && contactOk) {
      window.location.href = form.getAttribute('action');
      return;
    }
    summary.textContent = 'Check the highlighted fields, then send again.';
    summary.hidden = false;
    form.querySelector('[aria-invalid="true"]').focus();
  });
})();
