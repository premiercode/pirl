(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero video. Without JS, or with reduced motion, the poster stays.
  const video = document.querySelector('.hero-media');
  const toggle = document.querySelector('.motion');
  if (video && toggle && !reduced) {
    video.src = innerWidth < 700 ? video.dataset.srcSm : video.dataset.srcLg;
    const sync = () => { toggle.textContent = video.paused ? 'Play video' : 'Pause video'; };
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    toggle.hidden = false;
    toggle.addEventListener('click', () => (video.paused ? video.play() : video.pause()));
    video.play().catch(sync);
  }

  // Preview form: says so instead of pretending to submit.
  document.querySelectorAll('.form').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const note = form.querySelector('.form-note');
      note.textContent = '';
      setTimeout(() => { note.textContent = 'Preview only. Nothing was sent. This form isn’t connected yet.'; }, 50);
    });
  });

  // Film modal. The iframe exists only while open, so closing stops playback.
  const dialog = document.querySelector('.film');
  if (dialog && dialog.showModal) {
    const frame = dialog.querySelector('.film-frame');
    let trigger = null;
    let resume = false;
    document.querySelectorAll('.js-film').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        trigger = link;
        const iframe = document.createElement('iframe');
        iframe.src = `https://player.vimeo.com/video/937372652?autoplay=${reduced ? 0 : 1}&title=0&byline=0&portrait=0`;
        iframe.title = 'Indian Relay Racing film on Vimeo';
        iframe.allow = 'autoplay; fullscreen; picture-in-picture';
        frame.replaceChildren(iframe);
        resume = video && !video.paused;
        if (video) video.pause();
        dialog.showModal();
      });
    });
    dialog.querySelector('.film-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => {
      frame.replaceChildren();
      if (trigger) trigger.focus();
      if (resume) video.play();
    });
  }
})();
