/* PIRL Option B. All content works without this file; it only adds behaviour. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Hero clip ---------- */
  var video = document.getElementById('hero-video');
  var toggle = document.getElementById('video-toggle');
  var userPaused = false;
  var resumeAfterFilm = false;

  function syncLabel() {
    toggle.textContent = video.paused ? 'Play clip' : 'Pause clip';
  }

  function startVideo() {
    if (reduced.matches) return;
    if (!video.currentSrc && !video.getAttribute('src')) {
      var phone = window.matchMedia('(max-width: 40rem)').matches;
      video.src = video.getAttribute(phone ? 'data-src-480' : 'data-src-720');
      /* The file fades up from near-black; the first play starts past that so the poster doesn't dip dark. */
      video.addEventListener('loadedmetadata', function () { video.currentTime = 0.6; }, { once: true });
      /* Loop inside the fades so the plate never dips to black on the bright page. */
      video.addEventListener('timeupdate', function () { if (video.currentTime > 6.9) { video.currentTime = 0.6; } });
      video.addEventListener('ended', function () { video.currentTime = 0.6; video.play(); });
    }
    toggle.hidden = false;
    var attempt = video.play();
    if (attempt && attempt.catch) attempt.catch(syncLabel);
  }

  function stopForReducedMotion() {
    video.pause();
    video.removeAttribute('src');
    video.load(); /* returns the element to its poster */
    toggle.hidden = true;
  }

  video.addEventListener('play', syncLabel);
  video.addEventListener('pause', syncLabel);

  toggle.addEventListener('click', function () {
    if (video.paused) {
      userPaused = false;
      video.play();
    } else {
      userPaused = true;
      video.pause();
    }
    syncLabel();
  });

  startVideo();

  reduced.addEventListener('change', function () {
    if (reduced.matches) stopForReducedMotion();
    else if (!userPaused) startVideo();
  });

  /* ---------- Film modal ---------- */
  var dialog = document.getElementById('film');
  var frame = document.getElementById('film-frame');
  var closeBtn = document.getElementById('film-close');
  var opener = null;

  function openFilm(trigger) {
    opener = trigger;
    resumeAfterFilm = !video.paused;
    video.pause();

    var iframe = document.createElement('iframe');
    iframe.src = 'https://player.vimeo.com/video/937372652?autoplay=' + (reduced.matches ? 0 : 1);
    iframe.title = '2025 In it to win it "Indian Relay Racing" on Vimeo';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.setAttribute('allowfullscreen', '');
    frame.appendChild(iframe);

    dialog.showModal();
    closeBtn.focus();
  }

  if (typeof dialog.showModal === 'function') {
    document.querySelectorAll('[data-film]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        openFilm(link);
      });
    });

    closeBtn.addEventListener('click', function () { dialog.close(); });

    /* The box fills the dialog, so a click landing on the dialog itself is the backdrop. */
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });

    /* Every close path, including Esc, ends here. */
    dialog.addEventListener('close', function () {
      frame.textContent = '';
      if (resumeAfterFilm && !userPaused && !reduced.matches) video.play();
      resumeAfterFilm = false;
      if (opener) opener.focus();
      opener = null;
    });
  }

  /* ---------- Preview form: never sends anything ---------- */
  var form = document.getElementById('notify');
  var send = document.getElementById('notify-send');
  var status = document.getElementById('notify-status');

  /* type="button" in the markup keeps a no-JS page from submitting an address into the URL. */
  send.type = 'submit';
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    status.textContent = '';
    setTimeout(function () { status.textContent = 'Nothing was sent. This form is a preview.'; }, 50);
  });

  /* ---------- Index: mark the section in view ---------- */
  if ('IntersectionObserver' in window) {
    var links = {};
    document.querySelectorAll('.index a[href^="#"]').forEach(function (a) {
      links[a.getAttribute('href').slice(1)] = a;
    });
    var here = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        Object.keys(links).forEach(function (id) { links[id].removeAttribute('aria-current'); });
        links[entry.target.id].setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) here.observe(section);
    });

    /* ---------- Strip: exposes one frame after another, once ---------- */
    var strip = document.getElementById('strip');
    if (!reduced.matches) {
      var run = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          run.disconnect();
          var cells = strip.querySelectorAll('.strip__cell');
          cells.forEach(function (cell, i) {
            cell.classList.add('is-waiting');
            setTimeout(function () { cell.classList.remove('is-waiting'); }, 90 + i * 130);
          });
        }
      }, { threshold: 0.05 });
      run.observe(strip);
    }
  }
})();
