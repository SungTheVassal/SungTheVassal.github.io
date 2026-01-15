document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('header.site-header');
  const navLinks = document.querySelectorAll('nav.top-nav a[href^="#"]');
  const navBtns = document.querySelectorAll('.nav-btn');
  const navItems = document.querySelectorAll('.nav-item');
  const hero = document.querySelector('.hero');

  // Carousel images (root-relative paths so they work from any page)
  const heroSlides = [
    '/assets/Vista.jpg',
    '/assets/Vista_de_Prebo.jpg',
    '/assets/Vista_hacia_el_este.jpg',
    '/assets/Vista_Noche.jpg'
  ];

  // Respect reduce motion preference
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Preload images
  const preloaded = heroSlides.map(src => {
    const img = new Image(); img.src = src; return img;
  });

  let heroIndex = 0;
  function computeAndApplyLuminance(img){
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const w = 100, h = 60;
      canvas.width = w; canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0,0,w,h).data;
      let total = 0, count = 0;
      for (let p = 0; p < data.length; p += 4) {
        const r = data[p], g = data[p+1], b = data[p+2];
        const lum = 0.2126*r + 0.7152*g + 0.0722*b;
        total += lum; count++;
      }
      const avg = total / count;
      hero.classList.remove('hero--dark-image','hero--light-image');
      if (avg < 130) hero.classList.add('hero--dark-image');
      else hero.classList.add('hero--light-image');
    } catch (err){
      // canvas may fail in some edge cases; fallback to light image
      hero.classList.remove('hero--dark-image'); hero.classList.add('hero--light-image');
    }
  }

  function setHeroBg(i){
    if (!hero) return;
    const url = heroSlides[i];
    hero.style.backgroundImage = `linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.08)), url('${url}')`;

    const img = preloaded[i];
    if (img.complete) {
      computeAndApplyLuminance(img);
    } else {
      img.onload = function(){ computeAndApplyLuminance(img); };
    }
  }

  setHeroBg(heroIndex);
  let carouselInterval = null;
  if (!reduceMotion && hero && heroSlides.length > 1){
    carouselInterval = setInterval(()=>{ heroIndex = (heroIndex + 1) % heroSlides.length; setHeroBg(heroIndex); }, 4500);
  }

  // Pause carousel when user focuses inside the hero for accessibility
  if (hero && carouselInterval){
    hero.addEventListener('mouseenter', ()=> clearInterval(carouselInterval));
    hero.addEventListener('focusin', ()=> clearInterval(carouselInterval));
  }

  // Shrink header on scroll using rAF for better performance
  let ticking = false;
  function onScroll(){
    if (!header) return;
    if (window.scrollY > 80) header.classList.add('shrink');
    else header.classList.remove('shrink');
  }
  window.addEventListener('scroll', () => {
    if (!ticking){
      window.requestAnimationFrame(()=>{ onScroll(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  // Smooth scroll for in-page links
  navLinks.forEach(a => {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      const id = this.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Dropdown behavior for nav buttons
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const parent = btn.closest('.nav-item');
      const isOpen = parent.classList.toggle('open');
      // close others
      navItems.forEach(it => {
        if (it !== parent) {
          it.classList.remove('open');
          const b = it.querySelector('.nav-btn');
          if (b) b.setAttribute('aria-expanded','false');
        }
      });
      // set accessible state
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      e.stopPropagation();
    });
  });

  // Enhanced keyboard navigation for menu buttons and submenu items
  const btns = Array.from(navBtns);
  btns.forEach((btn, idx) => {
    btn.addEventListener('keydown', (e) => {
      const key = e.key;
      if (key === 'ArrowRight'){
        const next = btns[(idx + 1) % btns.length]; next.focus(); e.preventDefault();
      } else if (key === 'ArrowLeft'){
        const prev = btns[(idx - 1 + btns.length) % btns.length]; prev.focus(); e.preventDefault();
      } else if (key === 'ArrowDown' || key === 'Enter' || key === ' '){
        const parent = btn.closest('.nav-item');
        const submenu = parent.querySelector('.submenu');
        if (submenu){
          parent.classList.add('open');
          btn.setAttribute('aria-expanded','true');
          const first = submenu.querySelector('[role="menuitem"]');
          if (first){ first.focus(); e.preventDefault(); }
          setTimeout(adjustSubmenuPosition, 0);
        }
      } else if (key === 'Escape'){
        navItems.forEach(it => { it.classList.remove('open'); const b = it.querySelector('.nav-btn'); if (b) b.setAttribute('aria-expanded','false'); });
        btn.focus();
      }
    });
  });

  // Submenu keyboard navigation (ArrowUp/ArrowDown/Home/End/Escape)
  const submenuLinks = Array.from(document.querySelectorAll('.submenu [role="menuitem"]'));
  function focusAt(index){ if (submenuLinks[index]) submenuLinks[index].focus(); }
  submenuLinks.forEach((link, idx) => {
    link.addEventListener('keydown', (e) => {
      if (e.key === 'Escape'){
        const parent = link.closest('.nav-item');
        if (parent){ parent.classList.remove('open'); const b = parent.querySelector('.nav-btn'); if (b) { b.setAttribute('aria-expanded','false'); b.focus(); } }
      } else if (e.key === 'ArrowDown'){
        const nextIdx = (idx + 1) % submenuLinks.length; focusAt(nextIdx); e.preventDefault();
      } else if (e.key === 'ArrowUp'){
        const prevIdx = (idx - 1 + submenuLinks.length) % submenuLinks.length; focusAt(prevIdx); e.preventDefault();
      } else if (e.key === 'Home'){
        focusAt(0); e.preventDefault();
      } else if (e.key === 'End'){
        focusAt(submenuLinks.length - 1); e.preventDefault();
      }
    });

    // Close menus when a link is clicked (useful for mobile)
    link.addEventListener('click', () => {
      const parent = link.closest('.nav-item');
      if (parent){ parent.classList.remove('open'); const b = parent.querySelector('.nav-btn'); if (b) { b.setAttribute('aria-expanded','false'); } }
    });
  });

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-item')) navItems.forEach(it => { it.classList.remove('open'); const btn = it.querySelector('.nav-btn'); if (btn) btn.setAttribute('aria-expanded','false'); });
  });

  // Ensure submenu stays within viewport horizontally (basic collision detection)
  function adjustSubmenuPosition(){
    navItems.forEach(it => {
      const submenu = it.querySelector('.submenu');
      if (!submenu) return;
      submenu.style.left = '';
      submenu.style.right = '';
      const rect = submenu.getBoundingClientRect();
      const padding = 12;
      if (rect.right > window.innerWidth - padding){
        submenu.style.left = 'auto';
        submenu.style.right = '0';
      } else if (rect.left < padding){
        submenu.style.left = '0';
        submenu.style.right = 'auto';
      }
    });
  }

  // Debounce resize
  let resizeTimeout = null;
  window.addEventListener('resize', () => { clearTimeout(resizeTimeout); resizeTimeout = setTimeout(adjustSubmenuPosition, 120); }, { passive: true });

  // call after DOM ready for initial layout
  adjustSubmenuPosition();
});
