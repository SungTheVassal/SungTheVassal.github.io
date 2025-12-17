document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('header.site-header');
  const navLinks = document.querySelectorAll('nav.top-nav a[href^="#"]');
  const navBtns = document.querySelectorAll('.nav-btn');
  const navItems = document.querySelectorAll('.nav-item');
  const hero = document.querySelector('.hero');

  // Carousel images (from /assets)
  const heroSlides = [
    '../assets/Vista.jpg',
    '../assets/Vista_de_Prebo.jpg',
    '../assets/Vista_hacia_el_este.jpg',
    '../assets/Vista_Noche.jpg'
  ];
  let heroIndex = 0;
  function setHeroBg(i){
    if (!hero) return;
    const url = heroSlides[i];
    hero.style.backgroundImage = `linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.08)), url('${url}')`;
    // analyze image brightness and set hero class for text color
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = function(){
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
        // threshold: if avg < 130 treat image as dark
        hero.classList.remove('hero--dark-image','hero--light-image');
        if (avg < 130) hero.classList.add('hero--dark-image');
        else hero.classList.add('hero--light-image');
      };
    } catch (e){
      // ignore
    }
  }
  setHeroBg(heroIndex);
  setInterval(()=>{ heroIndex = (heroIndex + 1) % heroSlides.length; setHeroBg(heroIndex); }, 4500);

  // Shrink header on scroll
  function onScroll() {
    if (window.scrollY > 80) header.classList.add('shrink');
    else header.classList.remove('shrink');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
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
          const btn = it.querySelector('.nav-btn');
          if (btn) btn.setAttribute('aria-expanded','false');
        }
      });
      // set accessible state
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      e.stopPropagation();
    });
  });

  // Keyboard navigation for menu buttons (arrow keys, down to open)
  const btns = Array.from(navBtns);
  btns.forEach((btn, idx) => {
    btn.addEventListener('keydown', (e) => {
      const key = e.key;
      if (key === 'ArrowRight'){
        const next = btns[(idx + 1) % btns.length]; next.focus(); e.preventDefault();
      } else if (key === 'ArrowLeft'){
        const prev = btns[(idx - 1 + btns.length) % btns.length]; prev.focus(); e.preventDefault();
      } else if (key === 'ArrowDown' || key === 'Enter' || key === ' '){
        // open submenu and focus first link
        const parent = btn.closest('.nav-item');
        const submenu = parent.querySelector('.submenu');
        if (submenu){
          parent.classList.add('open');
          btn.setAttribute('aria-expanded','true');
          const first = submenu.querySelector('[role="menuitem"]');
          if (first){ first.focus(); e.preventDefault(); }
        // After opening, adjust submenu to prevent overflow
        setTimeout(adjustSubmenuPosition, 0);
        }
      } else if (key === 'Escape'){
        // close all
        navItems.forEach(it => { it.classList.remove('open'); const b = it.querySelector('.nav-btn'); if (b) b.setAttribute('aria-expanded','false'); });
        btn.focus();
      }
    });
  });

  // Allow submenu links to be keyboard navigable and close menu with Escape
  const submenuLinks = document.querySelectorAll('.submenu [role="menuitem"]');
  submenuLinks.forEach(link => {
    link.addEventListener('keydown', (e) => {
      if (e.key === 'Escape'){
        // find parent nav-item and close
        const parent = link.closest('.nav-item');
        if (parent){ parent.classList.remove('open'); const b = parent.querySelector('.nav-btn'); if (b) { b.setAttribute('aria-expanded','false'); b.focus(); } }
      }
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
      if (rect.right > window.innerWidth - 12){
        // move submenu so its right edge aligns with viewport right padding
        submenu.style.left = 'auto';
        submenu.style.right = '0';
      } else if (rect.left < 12){
        submenu.style.left = '0';
        submenu.style.right = 'auto';
      }
    });
  }
  window.addEventListener('resize', adjustSubmenuPosition, { passive:true });
  // call after DOM ready for initial layout
  adjustSubmenuPosition();
});
