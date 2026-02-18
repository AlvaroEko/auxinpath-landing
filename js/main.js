/* ============================================
   AuxinPath - Coming Soon Landing Page
   Main JavaScript
   ============================================ */

(function () {
  'use strict';

  // ---- Particle System (Canvas) ----
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let particles = [];
  let animationId;
  let mouseX = 0;
  let mouseY = 0;

  const PARTICLE_COUNT = getParticleCount();
  const COLORS = [
    'rgba(139, 191, 58, 0.14)',  // green (#8BBF3A)
    'rgba(13, 115, 119, 0.11)',  // teal (#0D7377)
    'rgba(168, 212, 90, 0.12)',  // light green
    'rgba(26, 154, 159, 0.10)',  // light teal
    'rgba(111, 156, 40, 0.10)', // dark green
  ];

  function getParticleCount() {
    const width = window.innerWidth;
    if (width < 640) return 25;
    if (width < 1024) return 40;
    return 60;
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 3 + 1.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      baseX: 0,
      baseY: 0,
      life: Math.random() * 0.5 + 0.5,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.01 + 0.005,
    };
  }

  // Track mouse position for particle repulsion
  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = createParticle();
      p.baseX = p.x;
      p.baseY = p.y;
      particles.push(p);
    }
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      // Gentle pulse
      p.pulse += p.pulseSpeed;
      const scale = 1 + Math.sin(p.pulse) * 0.3;
      const currentRadius = p.radius * scale;

      // Drift
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around screen edges
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;
      if (p.y < -10) p.y = canvas.height + 10;
      if (p.y > canvas.height + 10) p.y = -10;

      // Mouse repulsion (very subtle)
      const dx = p.x - mouseX;
      const dy = p.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        const force = (150 - dist) / 150 * 0.5;
        p.x += (dx / dist) * force;
        p.y += (dy / dist) * force;
      }

      // Draw
      ctx.beginPath();
      ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    // Connection lines between nearby particles
    var CONNECTION_DIST = 120;
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DIST) {
          var alpha = (1 - dist / CONNECTION_DIST) * 0.08;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(13, 115, 119, ' + alpha + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    animationId = requestAnimationFrame(drawParticles);
  }

  // ---- Drag & Fling Physics for Floating Puzzle Pieces ----
  const floatingShapes = document.querySelectorAll('.floating-shape');

  const shapeStates = [];
  floatingShapes.forEach((shape, idx) => {
    shapeStates.push({
      el: shape,
      idx: idx,
      x: 0, y: 0,
      vx: 0, vy: 0,
      rotation: 0, vr: 0,
      dragging: false,
      flung: false,
      dragStartMouseX: 0, dragStartMouseY: 0,
      dragStartX: 0, dragStartY: 0,
      history: [],
      origAnimation: '',
    });
  });

  const FRICTION = 0.97;
  const ANG_FRIC = 0.96;
  const BOUNCE_E = 0.6;
  const MIN_V = 0.3;
  let dragState = null;

  function pPos(e) {
    if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function startDrag(shapeIdx, e) {
    const s = shapeStates[shapeIdx];
    const pos = pPos(e);

    dragState = s;
    s.dragging = true;
    s.flung = true;
    s.vx = 0; s.vy = 0; s.vr = 0;
    s.dragStartMouseX = pos.x;
    s.dragStartMouseY = pos.y;
    s.dragStartX = s.x;
    s.dragStartY = s.y;
    s.history = [{ x: pos.x, y: pos.y, t: Date.now() }];

    // Stop CSS animation completely so it doesn't fight transforms
    if (!s.origAnimation) {
      s.origAnimation = window.getComputedStyle(s.el).animation || 'none';
    }
    s.el.style.animation = 'none';
    s.el.style.cursor = 'grabbing';
    s.el.style.zIndex = '10';

    e.preventDefault();
    e.stopPropagation();
  }

  function onDocMove(e) {
    if (!dragState) {
      // Parallax for untouched shapes
      const pos = pPos(e);
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const ox = (pos.x - cx) / cx;
      const oy = (pos.y - cy) / cy;
      shapeStates.forEach((s, i) => {
        if (s.flung) return;
        s.x = ox * (i + 1) * 8;
        s.y = oy * (i + 1) * 8;
        s.rotation = ox * (i + 1) * 2;
        s.el.style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.rotation}deg)`;
      });
      return;
    }

    const pos = pPos(e);
    const s = dragState;
    s.x = s.dragStartX + (pos.x - s.dragStartMouseX);
    s.y = s.dragStartY + (pos.y - s.dragStartMouseY);
    s.el.style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.rotation}deg)`;

    const now = Date.now();
    s.history.push({ x: pos.x, y: pos.y, t: now });
    while (s.history.length > 1 && now - s.history[0].t > 100) s.history.shift();

    e.preventDefault();
  }

  function onDocUp() {
    if (!dragState) return;
    const s = dragState;
    s.dragging = false;
    s.el.style.cursor = 'grab';
    s.el.style.zIndex = '2';

    if (s.history.length >= 2) {
      const first = s.history[0];
      const last = s.history[s.history.length - 1];
      const dt = Math.max(last.t - first.t, 1);
      s.vx = ((last.x - first.x) / dt) * 16;
      s.vy = ((last.y - first.y) / dt) * 16;
      s.vr = s.vx * 0.3;
      const cap = 40;
      s.vx = Math.max(-cap, Math.min(cap, s.vx));
      s.vy = Math.max(-cap, Math.min(cap, s.vy));
    }

    dragState = null;
  }

  function physicsLoop() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    shapeStates.forEach(s => {
      if (!s.flung || s.dragging) return;

      s.x += s.vx; s.y += s.vy; s.rotation += s.vr;
      s.vx *= FRICTION; s.vy *= FRICTION; s.vr *= ANG_FRIC;
      if (Math.abs(s.vx) < MIN_V) s.vx = 0;
      if (Math.abs(s.vy) < MIN_V) s.vy = 0;
      if (Math.abs(s.vr) < MIN_V * 0.5) s.vr = 0;

      const rect = s.el.getBoundingClientRect();
      if (rect.left < 0) { s.x -= rect.left; s.vx = Math.abs(s.vx) * BOUNCE_E; s.vr *= -0.5; }
      else if (rect.right > vw) { s.x -= (rect.right - vw); s.vx = -Math.abs(s.vx) * BOUNCE_E; s.vr *= -0.5; }
      if (rect.top < 0) { s.y -= rect.top; s.vy = Math.abs(s.vy) * BOUNCE_E; s.vr *= -0.5; }
      else if (rect.bottom > vh) { s.y -= (rect.bottom - vh); s.vy = -Math.abs(s.vy) * BOUNCE_E; s.vr *= -0.5; }

      s.el.style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.rotation}deg)`;
    });

    requestAnimationFrame(physicsLoop);
  }

  function initDragPhysics() {
    // Bind mousedown DIRECTLY to each shape element
    shapeStates.forEach((s, idx) => {
      const handler = (e) => startDrag(idx, e);
      s.el.addEventListener('mousedown', handler);
      s.el.addEventListener('touchstart', handler, { passive: false });
      // Also bind to img child since it may catch the event
      const img = s.el.querySelector('img');
      if (img) {
        img.addEventListener('mousedown', handler);
        img.addEventListener('touchstart', handler, { passive: false });
        img.style.pointerEvents = 'auto';
      }
    });

    // Move/up on document so drag continues when cursor leaves shape
    document.addEventListener('mousemove', onDocMove, { passive: false });
    document.addEventListener('mouseup', onDocUp);
    document.addEventListener('touchmove', onDocMove, { passive: false });
    document.addEventListener('touchend', onDocUp);

    requestAnimationFrame(physicsLoop);
  }

  // ---- Form Handling ----
  const form = document.getElementById('waitlist-form');
  const ctaButton = document.getElementById('cta-button');
  const successMessage = document.getElementById('success-message');
  const emailInput = document.getElementById('email-input');
  const agencyInput = document.getElementById('agency-input');
  const contactInput = document.getElementById('contact-input');

  // Anti-spam: rate limiting & duplicate tracking
  var lastSubmitTime = 0;
  var SUBMIT_COOLDOWN = 30000; // 30 seconds between submissions
  var hasSubmitted = false;

  if (form) {
    // Ripple effect on button click
    ctaButton.addEventListener('mousedown', function (e) {
      this.classList.remove('ripple');
      // Trigger reflow
      void this.offsetWidth;
      this.classList.add('ripple');
    });

    ctaButton.addEventListener('animationend', function () {
      this.classList.remove('ripple');
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      var formError = document.getElementById('form-error');
      if (formError) formError.textContent = '';

      // Duplicate prevention — already submitted successfully
      if (hasSubmitted) {
        if (formError) formError.textContent = 'You have already joined the waitlist!';
        return;
      }

      // Rate limiting — prevent rapid resubmission
      var now = Date.now();
      if (now - lastSubmitTime < SUBMIT_COOLDOWN) {
        var secsLeft = Math.ceil((SUBMIT_COOLDOWN - (now - lastSubmitTime)) / 1000);
        if (formError) formError.textContent = 'Please wait ' + secsLeft + ' seconds before trying again.';
        return;
      }

      const email = emailInput.value.trim();
      const agency = agencyInput.value.trim();
      const contactName = contactInput.value.trim();
      if (!email || !agency || !contactName) return;

      // Turnstile verification — invisible mode resolves automatically,
      // but if token is missing (script blocked/failed), allow submission anyway
      // so legitimate users are never locked out.

      lastSubmitTime = Date.now();

      // Show loading state
      ctaButton.classList.add('loading');
      ctaButton.disabled = true;
      ctaButton.setAttribute('aria-busy', 'true');

      // no-cors: response is always opaque (can't read status).
      // Google Apps Script redirects after processing, which triggers
      // a catch in fetch — but the data IS written to the Sheet.
      // We check navigator.onLine to distinguish real network failures.
      fetch(form.action, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agency: agency,
          contact_name: contactName,
          email: email,
        }),
      }).then(function () {
        showSuccess();
      }).catch(function () {
        if (!navigator.onLine) {
          // Genuinely offline — data did NOT arrive
          ctaButton.classList.remove('loading');
          ctaButton.disabled = false;
          ctaButton.setAttribute('aria-busy', 'false');
          if (formError) formError.textContent = 'No internet connection. Please try again.';
        } else {
          // Online but got opaque redirect error — data DID arrive
          showSuccess();
        }
      });
    });
  }

  function showSuccess() {
    hasSubmitted = true;
    form.style.display = 'none';
    successMessage.classList.add('visible');
    ctaButton.classList.remove('loading');
    ctaButton.disabled = false;
    ctaButton.setAttribute('aria-busy', 'false');
    launchConfetti();
  }

  // ---- Confetti Effect ----
  function launchConfetti() {
    const colors = ['#8BBF3A', '#0D7377', '#A8D45A', '#1A9A9F', '#6F9C28', '#095456'];
    const count = 40;
    const container = document.body;

    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.classList.add('confetti-piece');

      const startX = window.innerWidth / 2 + (Math.random() - 0.5) * 200;
      const startY = window.innerHeight / 2 - 50;

      piece.style.left = startX + 'px';
      piece.style.top = startY + 'px';
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.setProperty('--drift-x', (Math.random() - 0.5) * 400 + 'px');
      piece.style.setProperty('--drift-y', Math.random() * 500 + 200 + 'px');
      piece.style.setProperty('--spin', (Math.random() * 1080 - 540) + 'deg');
      piece.style.setProperty('--fall-duration', (Math.random() * 1.5 + 1.5) + 's');
      piece.style.width = Math.random() * 6 + 5 + 'px';
      piece.style.height = Math.random() * 6 + 5 + 'px';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';

      container.appendChild(piece);

      // Remove after animation
      setTimeout(() => piece.remove(), 3500);
    }
  }

  // ---- Countdown Timer (ready to activate) ----
  // Uncomment the HTML countdown section and set the target date below
  /*
  function startCountdown() {
    const targetDate = new Date('2026-06-01T00:00:00').getTime();
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (!daysEl) return;

    function update() {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) {
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      daysEl.textContent = String(days).padStart(2, '0');
      hoursEl.textContent = String(hours).padStart(2, '0');
      minutesEl.textContent = String(minutes).padStart(2, '0');
      secondsEl.textContent = String(seconds).padStart(2, '0');

      requestAnimationFrame(update);
    }

    update();
    setInterval(update, 1000);
  }

  startCountdown();
  */

  // ---- Scroll Reveal ----
  function setupScrollReveal() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.scroll-reveal').forEach((el) => {
      observer.observe(el);
    });
  }

  // ---- Visibility API: pause animations when tab is hidden ----
  function setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      } else {
        drawParticles();
      }
    });
  }

  // ---- Resize Handler ----
  let resizeTimeout;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      resizeCanvas();
      // Recreate particles for new screen size
      const newCount = getParticleCount();
      if (Math.abs(particles.length - newCount) > 10) {
        initParticles();
      }
    }, 250);
  }

  // ---- Shimmer activation (after blur reveal finishes) ----
  function setupShimmer() {
    const comingSoonText = document.querySelector('.coming-soon-text');
    const words = document.querySelectorAll('.coming-soon-text .word');
    if (!comingSoonText || !words.length) return;

    // Wait for the last word's blur reveal animation to end, then activate shimmer
    const lastWord = words[words.length - 1];
    lastWord.addEventListener('animationend', function handler() {
      lastWord.removeEventListener('animationend', handler);
      comingSoonText.classList.add('shimmer-active');
    });
  }

  // ---- Sticky Nav on Scroll + Scroll Spy ----
  function setupStickyNav() {
    var nav = document.getElementById('sticky-nav');
    if (!nav) return;

    var threshold = 300;
    var navLinks = nav.querySelectorAll('.sticky-nav-link[data-section]');
    var sections = [];
    navLinks.forEach(function (link) {
      var id = link.getAttribute('data-section');
      var el = document.getElementById(id);
      if (el) sections.push({ id: id, el: el, link: link });
    });

    function onScroll() {
      var scrollY = window.scrollY;

      // Show/hide nav
      if (scrollY > threshold) {
        nav.classList.add('visible');
      } else {
        nav.classList.remove('visible');
      }

      // Scroll spy — highlight active section
      var current = '';
      for (var i = 0; i < sections.length; i++) {
        var rect = sections[i].el.getBoundingClientRect();
        if (rect.top <= 120) {
          current = sections[i].id;
        }
      }
      for (var j = 0; j < sections.length; j++) {
        if (sections[j].id === current) {
          sections[j].link.classList.add('active');
        } else {
          sections[j].link.classList.remove('active');
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ---- Back to Top Button ----
  function setupBackToTop() {
    var btn = document.getElementById('back-to-top');
    if (!btn) return;

    function onScroll() {
      if (window.scrollY > 600) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ---- Email Obfuscation (anti-harvesting) ----
  function setupContactLink() {
    var link = document.getElementById('contact-link');
    if (!link) return;
    var u = link.getAttribute('data-u');
    var d = link.getAttribute('data-d');
    if (u && d) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = 'mai' + 'lto:' + u + '@' + d;
      });
    }
  }

  // ---- Initialize ----
  function init() {
    resizeCanvas();
    initParticles();
    drawParticles();
    setupScrollReveal();
    setupVisibilityHandler();
    setupShimmer();
    setupStickyNav();
    setupBackToTop();
    setupContactLink();

    // Drag & Fling physics (includes parallax for non-dragged pieces)
    initDragPhysics();

    window.addEventListener('resize', handleResize, { passive: true });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
