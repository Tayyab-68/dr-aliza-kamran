(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Nav border on scroll + active section link
  const nav = $('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const links = $$('.nav-links a');
  const sectionObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const s = $(a.getAttribute('href')); if (s) sectionObs.observe(s); });

  // Case filters
  const chips = $$('.chip');
  const cases = $$('.case');
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.toggle('is-active', c === chip));
    const f = chip.dataset.filter;
    cases.forEach(c => c.classList.toggle('is-hidden', f !== 'all' && c.dataset.cat !== f));
  }));

  // Sensitive (surgical) images: blurred until revealed
  $$('[data-sensitive]').forEach(box => {
    $('.reveal', box).addEventListener('click', () => box.classList.add('revealed'));
  });

  // Videos: play only while on screen
  const vidObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); }
      else v.pause();
    });
  }, { threshold: 0.35 });
  $$('video').forEach(v => { if (!v.closest('.lightbox')) vidObs.observe(v); });

  // Lightbox
  const lb = $('#lightbox');
  const fig = $('figure', lb);
  const cap = $('figcaption', lb);
  let group = [], idx = 0;

  const show = i => {
    idx = (i + group.length) % group.length;
    const item = group[idx];
    const old = $('img, video', fig);
    let media;
    if (item.tagName === 'VIDEO') {
      media = document.createElement('video');
      Object.assign(media, { src: item.currentSrc || item.src, muted: true, loop: true, autoplay: true, playsInline: true, controls: true });
    } else {
      media = document.createElement('img');
      media.src = item.currentSrc || item.src;
      media.alt = item.alt;
    }
    old.replaceWith(media);
    cap.textContent = item.dataset.caption || item.alt || item.getAttribute('aria-label') || '';
    const multi = group.length > 1;
    $$('.lb-nav', lb).forEach(b => b.hidden = !multi);
  };

  const zoomable = el => (el.matches('img[data-caption]') || el.matches('.thumbs video, .step-media video, .media-hero video'));

  document.addEventListener('click', e => {
    const el = e.target.closest('img, video');
    if (!el || el.closest('.lightbox') || !zoomable(el)) return;
    const sens = el.closest('[data-sensitive]');
    if (sens && !sens.classList.contains('revealed')) { sens.classList.add('revealed'); return; }
    const scope = el.closest('.case, .tl-body') || document;
    group = $$('img[data-caption], .thumbs video, .step-media video, .media-hero video', scope);
    show(group.indexOf(el));
    lb.showModal();
  });

  $('.lb-close', lb).addEventListener('click', () => lb.close());
  $('.lb-prev', lb).addEventListener('click', () => show(idx - 1));
  $('.lb-next', lb).addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  lb.addEventListener('close', () => { const v = $('video', fig); if (v) v.pause(); });
  document.addEventListener('keydown', e => {
    if (!lb.open || group.length < 2) return;
    if (e.key === 'ArrowRight') show(idx + 1);
    if (e.key === 'ArrowLeft') show(idx - 1);
  });

  // Swipe in lightbox
  let x0 = null;
  lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (x0 === null || group.length < 2) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    x0 = null;
  });

  // Gentle fade-in on scroll
  const fadeObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); fadeObs.unobserve(e.target); } });
  }, { threshold: 0.08 });
  $$('.section-head, .case, .timeline > li, .card, .impact-num, .role').forEach(el => { el.classList.add('fade'); fadeObs.observe(el); });

  $('#year').textContent = new Date().getFullYear();
})();
