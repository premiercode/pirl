/* PIRL Option A. Everything here is enhancement: the page is complete without it. */
(function () {
  'use strict';
  var root = document.documentElement;

  /* ---- Exchange scrub ---------------------------------------------------- */
  var FRAMES = 40;
  var START = 2;             // f03: first frame with the whole rider in shot.
  var CUT = 16;              // Measured: the camera cut is between f16 and f17.
  var OPEN = 20;             // f21: the second shot opens on the rider above the horses.
  var BEAT1 = [0.03, 0.47];  // f03 to f16
  var CLOSE = [0.47, 0.525]; // Diamond closes on f16
  var BEAT2 = [0.545, 0.97]; // Diamond opens on f21, runs to f40
  var OPENED = 0.61;
  var STEPS = [0.03, 0.545, 0.8]; // Where each caption takes over

  var query = matchMedia('(prefers-reduced-motion: no-preference) and (min-height: 480px) and (max-height: 1599px)');
  var run = document.querySelector('.run');
  var stage = run.querySelector('.stage');
  var intro = stage.querySelector('.intro');
  var frame = stage.querySelector('.frame');
  var canvas = stage.querySelector('.frame-canvas');
  var steps = Array.prototype.slice.call(stage.querySelectorAll('.step'));
  var ctx = canvas.getContext('2d');
  var images = [];
  var loaded = false;
  var ticking = false;

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function ramp(v, a, b) { return clamp((v - a) / (b - a), 0, 1); }

  function nearest(i) {
    for (var d = 0; d < FRAMES; d++) {
      if (images[i - d] && images[i - d].ready) return images[i - d];
      if (images[i + d] && images[i + d].ready) return images[i + d];
    }
    return null;
  }

  function paint(pos) {
    var image = nearest(Math.round(pos));
    if (image) ctx.drawImage(image.el, 0, 0, canvas.width, canvas.height);
  }

  function framePos(p) {
    if (p < BEAT2[0]) return START + ramp(p, BEAT1[0], BEAT1[1]) * (CUT - 1 - START);
    return OPEN + ramp(p, BEAT2[0], BEAT2[1]) * (FRAMES - 1 - OPEN);
  }

  function irisRadius(p) {
    if (p <= CLOSE[0] || p >= OPENED) return null;
    if (p < BEAT2[0]) return 2 * (1 - ramp(p, CLOSE[0], CLOSE[1]));
    return 2 * ramp(p, BEAT2[0], OPENED);
  }

  function measure() {
    if (!root.classList.contains('scrub')) return;
    var introH = intro.offsetHeight;
    var frameH = frame.offsetHeight;
    var scale = clamp((stage.clientHeight - introH - 30) / frameH, 0.5, 1);
    var dy = introH - frame.offsetTop;
    stage.style.setProperty('--s', scale.toFixed(4));
    stage.style.setProperty('--dy', dy.toFixed(1) + 'px');
    stage.style.setProperty('--dy-band', (dy - frameH * (1 - scale)).toFixed(1) + 'px');
  }

  function update() {
    ticking = false;
    if (!root.classList.contains('scrub')) return;
    var box = run.getBoundingClientRect();
    var styles = getComputedStyle(run);
    var pad = parseFloat(styles.paddingTop) || 0;
    var travel = run.offsetHeight - pad - stage.offsetHeight;
    var top = parseFloat(getComputedStyle(stage).top) || 0;
    var p = clamp((top - (box.top + pad)) / (travel || 1), 0, 1);

    // The hero text is fully gone before the frame moves, so text never crosses footage.
    var introShown = 1 - ramp(p, 0, 0.03);
    var heroState = 1 - ramp(p, 0.03, 0.1);
    stage.style.setProperty('--o', introShown.toFixed(4));
    stage.style.setProperty('--i', heroState.toFixed(4));
    stage.style.setProperty('--p', ramp(p, 0, 0.97).toFixed(4));
    intro.style.pointerEvents = introShown > 0.01 ? '' : 'none';

    var current = -1;
    STEPS.forEach(function (start, n) { if (p >= start) current = n; });
    steps.forEach(function (el, n) { el.classList.toggle('on', n === current); });

    var r = irisRadius(p);
    if (r === null) {
      canvas.style.clipPath = 'none';
    } else {
      var v = (r * 50).toFixed(2);
      canvas.style.clipPath = 'polygon(50% calc(50% - ' + v + '%), calc(50% + ' + v + '%) 50%, 50% calc(50% + ' + v + '%), calc(50% - ' + v + '%) 50%)';
    }
    if (loaded) paint(framePos(p));
  }

  function request() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  function load() {
    if (loaded) return;
    loaded = true;
    for (var i = 0; i < FRAMES; i++) {
      (function (n) {
        var img = new Image();
        var rec = { el: img, ready: false };
        images[n] = rec;
        img.onload = function () {
          rec.ready = true;
          if (n === 0) root.classList.add('canvas-ready');
          request();
        };
        img.onerror = function () { if (n === 0) disable(); };
        img.src = '../assets/img/seq/f' + String(n + 1).padStart(2, '0') + '.webp';
      })(i);
    }
  }

  function disable() {
    root.classList.remove('scrub');
    intro.style.pointerEvents = '';
  }

  function enable() {
    root.classList.add('scrub');
    measure();
    load();
    request();
  }

  query.addEventListener('change', function (e) { if (e.matches) enable(); else disable(); });
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', function () { measure(); request(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); request(); });
  // The hero text stays in the tab order, so bring it back when it takes focus.
  intro.addEventListener('focusin', function () { if (root.classList.contains('scrub')) scrollTo(0, 0); });
  if (query.matches) enable();

  /* ---- Film modal --------------------------------------------------------- */
  var modal = document.getElementById('film-modal');
  var slot = document.getElementById('film-slot');
  var closeBtn = document.getElementById('film-close');
  var trigger = null;

  if (typeof modal.showModal === 'function') {
    document.querySelectorAll('.js-film').forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        trigger = link;
        var iframe = document.createElement('iframe');
        iframe.src = 'https://player.vimeo.com/video/937372652';
        iframe.title = '2025 In it to win it, Indian Relay Racing, on Vimeo';
        iframe.allow = 'autoplay; fullscreen; picture-in-picture';
        iframe.allowFullscreen = true;
        slot.appendChild(iframe);
        root.classList.add('film-open');
        modal.showModal();
      });
    });
    closeBtn.addEventListener('click', function () { modal.close(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.close(); });
    modal.addEventListener('close', function () {
      slot.textContent = '';
      root.classList.remove('film-open');
      if (trigger) trigger.focus();
    });
  }

  /* ---- Preview form: never sends anything ---------------------------------- */
  var form = document.getElementById('notify');
  form.querySelector('button').disabled = false;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var status = form.querySelector('.notify-status');
    status.textContent = '';
    setTimeout(function () { status.textContent = 'Nothing was sent. This is a preview.'; }, 50);
  });
})();
