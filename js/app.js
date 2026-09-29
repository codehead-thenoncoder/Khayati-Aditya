/**
 * Khyati & Aditya — Royal Wedding Celebrations
 * Interactive Invitation Engine (HTML5 / CSS3 / JavaScript / GSAP / Canvas Confetti)
 */

(function () {
  "use strict";

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var deck = document.getElementById('deck');
  var pages = Array.prototype.slice.call(deck.querySelectorAll('.page'));
  var cover = document.getElementById('cover');
  var tapBtn = document.getElementById('tap');
  var sealBtn = document.querySelector('.seal');
  var nextBtn = document.getElementById('next');
  var railNav = document.getElementById('rail-dots');
  var current = 0;
  var isOpen = false;

  /* ── Helper: point + tangent on a cubic bezier ───────────────── */
  function bez(p0, p1, p2, p3, t) {
    var mt = 1 - t;
    return {
      x: mt * mt * mt * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t * t * t * p3[0],
      y: mt * mt * mt * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t * t * t * p3[1],
      a: Math.atan2(
        3 * mt * mt * (p1[1] - p0[1]) + 6 * mt * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]),
        3 * mt * mt * (p0[0] - p0[0]) + 6 * mt * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0])
      ) * 180 / Math.PI
    };
  }

  /* ── Generate wreath leaves procedurally ────────────────────── */
  (function generateWreath() {
    var arcs = [
      [[100, 44], [62, 44], [40, 70], [40, 100]],
      [[40, 100], [40, 132], [66, 158], [100, 160]],
      [[100, 44], [138, 44], [160, 70], [160, 100]],
      [[160, 100], [160, 132], [134, 158], [100, 160]]
    ];
    var out = '';
    arcs.forEach(function (a, ai) {
      var flip = ai > 1 ? -1 : 1;
      for (var i = 1; i <= 9; i++) {
        var t = i / 10;
        var p = bez(a[0], a[1], a[2], a[3], t);
        var sc = 0.92 + Math.sin(i * 1.4) * 0.16;
        out += '<use href="#leafs" transform="translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) +
          ') rotate(' + (p.a + 118 * flip).toFixed(1) + ') scale(' + sc.toFixed(2) + ')"/>';
        out += '<use href="#leafs" opacity=".82" transform="translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) +
          ') rotate(' + (p.a - 118 * flip).toFixed(1) + ') scale(' + (sc * 0.78).toFixed(2) + ')"/>';
      }
    });
    Array.prototype.forEach.call(document.querySelectorAll('.wreathLeaves'), function (g) {
      g.innerHTML = out;
    });
  })();

  /* ── Navigation dots setup ──────────────────────────────────── */
  pages.forEach(function (p, i) {
    var b = document.createElement('button');
    b.setAttribute('aria-label', p.dataset.label || ('Section ' + (i + 1)));
    if (i === 0) b.className = 'on';
    b.addEventListener('click', function () {
      goTo(i);
    });
    railNav.appendChild(b);
  });
  var railBtns = railNav.children;

  function goTo(i) {
    if (deck.classList.contains('locked') && i > 0) {
      nudge();
      return;
    }
    i = Math.max(0, Math.min(pages.length - 1, i));
    deck.scrollTo({
      top: pages[i].offsetTop,
      behavior: reduce ? 'auto' : 'smooth'
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      goTo(current + 1);
    });
  }

  /* ── IntersectionObserver for live slide detection ───────────── */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.intersectionRatio > 0.52) {
          e.target.classList.add('live');
          current = pages.indexOf(e.target);
          for (var j = 0; j < railBtns.length; j++) {
            railBtns[j].classList.toggle('on', j === current);
          }
          if (nextBtn) {
            nextBtn.classList.toggle('gone', current === pages.length - 1);
          }
        }
      });
    }, { root: deck, threshold: [0, 0.52, 1] });

    pages.forEach(function (p) {
      io.observe(p);
    });
  } else {
    pages.forEach(function (p) {
      p.classList.add('live');
    });
  }

  window.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      goTo(current + 1);
    }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      goTo(current - 1);
    }
  });

  /* ── Scroll lock & nudge behavior ────────────────────────────── */
  function nudge() {
    var w = document.querySelector('.scratch-wrap');
    var hint = document.getElementById('scratchHint');
    if (w) {
      w.classList.remove('nudge');
      void w.offsetWidth;
      w.classList.add('nudge');
    }
    if (hint) {
      hint.classList.remove('flash');
      void hint.offsetWidth;
      hint.classList.add('flash');
    }
  }

  function unlock() {
    deck.classList.remove('locked');
    document.body.classList.remove('pre-scratch');
  }

  /* ── Envelope Open Handler ───────────────────────────────────── */
  function openEnvelope() {
    if (isOpen) return;
    isOpen = true;

    cover.classList.add('open');
    document.body.classList.add('opened');
    deck.classList.remove('hidden');
    deck.classList.add('locked');
    document.body.classList.add('pre-scratch');
    deck.scrollTop = 0;

    pages[0].classList.add('live');

    try {
      musicOn();
    } catch (err) {
      console.warn("Audio autoplay deferred:", err);
    }

    setTimeout(function () {
      cover.style.display = 'none';
    }, 1400);
  }

  if (tapBtn) tapBtn.addEventListener('click', openEnvelope);
  if (sealBtn) sealBtn.addEventListener('click', openEnvelope);

  /* ── Interactive Canvas Scratch to Reveal ────────────────────── */
  var cv = document.getElementById('scratch');
  var ctx = cv ? cv.getContext('2d') : null;
  var scratching = false, revealed = false, moves = 0;

  function paintScratch() {
    if (!cv || revealed) return;
    var w = cv.offsetWidth;
    var h = cv.offsetHeight;
    if (!w || !h) {
      setTimeout(paintScratch, 200);
      return;
    }
    cv.width = w * dpr;
    cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    var g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#22507E');
    g.addColorStop(0.55, '#1B3A5C');
    g.addColorStop(1, '#12304F');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Gold dust speckles
    for (var i = 0; i < 75; i++) {
      ctx.globalAlpha = Math.random() * 0.55 + 0.15;
      ctx.fillStyle = Math.random() > 0.4 ? '#D9BE79' : '#F0E5C6';
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 2 + 0.5, 0, 6.284);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(6, 20, 38, 0.65)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 1;

    ctx.fillStyle = '#F0DCA0';
    ctx.font = '700 15px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('S C R A T C H   T O   R E V E A L', w / 2, h / 2 - 5);

    ctx.fillStyle = 'rgba(253, 250, 243, 0.94)';
    ctx.font = 'italic 600 20px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('our wedding celebrations', w / 2, h / 2 + 25);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.globalCompositeOperation = 'destination-out';
  }

  function reveal() {
    if (revealed || !cv) return;
    revealed = true;
    cv.classList.add('done');
    unlock();

    // Trigger fireworks and confetti!
    celebrate();
  }

  function getScratchPos(e) {
    var r = cv.getBoundingClientRect();
    var p = e.touches ? e.touches[0] : e;
    return {
      x: p.clientX - r.left,
      y: p.clientY - r.top
    };
  }

  function doScratch(e) {
    if (!scratching || revealed || !ctx) return;
    if (e.cancelable) e.preventDefault();
    var p = getScratchPos(e);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 26, 0, 6.284);
    ctx.fill();
    if (++moves % 6 === 0) checkScratchProgress();
  }

  function checkScratchProgress() {
    if (!ctx) return;
    var d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    var step = 4 * 64, clear = 0, total = 0;
    for (var i = 3; i < d.length; i += step) {
      total++;
      if (d[i] < 45) clear++;
    }
    if (total && clear / total > 0.42) {
      reveal();
    }
  }

  if (cv) {
    cv.addEventListener('mousedown', function (e) {
      scratching = true;
      doScratch(e);
    });
    cv.addEventListener('mousemove', doScratch);
    window.addEventListener('mouseup', function () {
      scratching = false;
    });

    cv.addEventListener('touchstart', function (e) {
      scratching = true;
      doScratch(e);
    }, { passive: false });
    cv.addEventListener('touchmove', doScratch, { passive: false });
    window.addEventListener('touchend', function () {
      scratching = false;
    });

    window.addEventListener('resize', function () {
      paintScratch();
    });

    paintScratch();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (!revealed && moves === 0) paintScratch();
      });
    }
  }

  ['wheel', 'touchmove'].forEach(function (ev) {
    deck.addEventListener(ev, function (e) {
      if (!deck.classList.contains('locked')) return;
      if (e.cancelable) e.preventDefault();
      nudge();
    }, { passive: false });
  });

  document.addEventListener('pointerdown', function (e) {
    if (!deck.classList.contains('locked')) return;
    if (e.target.closest('.scratch-wrap') || e.target.closest('#music')) return;
    nudge();
  }, true);

  /* ── Confetti & Celebration Burst ───────────────────────────── */
  function celebrate() {
    // If external canvas-confetti library is loaded via CDN:
    if (typeof window.confetti === 'function') {
      window.confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1B3A5C', '#B08D3F', '#C9A961', '#8DA184', '#F4F2E9']
      });
      setTimeout(function () {
        window.confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#B08D3F', '#F4F2E9', '#1B3A5C']
        });
        window.confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#C9A961', '#8DA184', '#1B3A5C']
        });
      }, 250);
    }
    // Also run high-performance soft particle rain
    runCanvasPetalRain();
  }

  function runCanvasPetalRain() {
    var c = document.getElementById('confetti');
    if (!c) return;
    var x = c.getContext('2d');
    c.style.display = 'block';
    c.width = window.innerWidth * dpr;
    c.height = window.innerHeight * dpr;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);

    var cols = ['#1B3A5C', '#2C5480', '#4A6E8C', '#8A6A22', '#B08D3F', '#C9A961', '#E0CB97', '#6F8468', '#8DA184', '#F4F2E9'];
    var box = cv ? cv.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 200, height: 100 };
    var ox = box.left + box.width / 2;
    var oy = box.top + box.height / 2;
    var bits = [];

    function piece(o) {
      return {
        x: o.x, y: o.y, vx: o.vx, vy: o.vy,
        s: 4.5 + Math.random() * 4,
        r: Math.random() * 6.284,
        vr: (Math.random() - 0.5) * 0.25,
        flip: Math.random() * 6.284,
        vf: 0.08 + Math.random() * 0.12,
        sway: (Math.random() - 0.5) * 0.8,
        c: cols[(Math.random() * cols.length) | 0],
        life: 0, max: o.max, perm: !!o.perm
      };
    }

    var burst = window.innerWidth < 480 ? 160 : 230;
    for (var i = 0; i < burst; i++) {
      var a = Math.random() * 6.284;
      var sp = 1.6 + Math.pow(Math.random(), 0.65) * 7.2;
      bits.push(piece({
        x: ox + (Math.random() - 0.5) * box.width * 0.5,
        y: oy + (Math.random() - 0.5) * box.height * 0.4,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 5.2,
        max: 450
      }));
    }

    var rain = window.innerWidth < 480 ? 100 : 160;
    for (var j = 0; j < rain; j++) {
      bits.push(piece({
        x: Math.random() * window.innerWidth,
        y: -25 - Math.random() * window.innerHeight * 2,
        vx: (Math.random() - 0.5) * 1.6,
        vy: 1.1 + Math.random() * 1.8,
        max: 600
      }));
    }

    var DRIFT = Math.round(rain / 2.2);
    function drifter(fromTop) {
      return piece({
        x: Math.random() * window.innerWidth,
        y: fromTop ? -30 - Math.random() * 60 : -30 - Math.random() * window.innerHeight * 1.3,
        vx: (Math.random() - 0.5) * 1.3,
        vy: 0.85 + Math.random() * 1.4,
        max: Infinity,
        perm: true
      });
    }
    for (var d = 0; d < DRIFT; d++) bits.push(drifter(false));

    window.addEventListener('resize', function () {
      c.width = window.innerWidth * dpr;
      c.height = window.innerHeight * dpr;
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
    });

    (function loop() {
      x.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (var k = 0; k < bits.length; k++) {
        var b = bits[k];
        b.life++;
        b.vy += b.perm ? 0.04 : 0.12;
        if (b.perm && b.vy > 2.0) b.vy = 2.0;
        b.vy *= 0.992;
        b.vx *= 0.988;
        b.vx += Math.sin(b.life * 0.04 + b.flip) * b.sway * 0.08;
        b.x += b.vx;
        b.y += b.vy;
        b.r += b.vr;
        b.flip += b.vf;

        if (b.y > window.innerHeight + 50 || b.life > b.max) {
          if (b.perm) bits[k] = drifter(true);
          continue;
        }

        var sq = Math.abs(Math.cos(b.flip));
        var fade = b.life > b.max - 50 ? Math.max(0, (b.max - b.life) / 50) : 1;

        x.save();
        x.translate(b.x, b.y);
        x.rotate(b.r);
        x.globalAlpha = fade;
        x.fillStyle = b.c;
        x.fillRect(-b.s / 2, -b.s * sq / 2, b.s, b.s * sq);
        x.restore();
      }
      requestAnimationFrame(loop);
    })();
  }

  /* ── Real-time Countdown Timer ───────────────────────────────── */
  var target = new Date('2026-12-03T13:00:00+05:30').getTime();
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var elDays = document.getElementById('cd');
  var elHours = document.getElementById('ch');
  var elMins = document.getElementById('cm');
  var elSecs = document.getElementById('cs');

  function tick() {
    var gap = target - Date.now();
    if (gap <= 0) {
      if (elDays) elDays.textContent = '00';
      if (elHours) elHours.textContent = '00';
      if (elMins) elMins.textContent = '00';
      if (elSecs) elSecs.textContent = '00';
      clearInterval(countdownTimer);
      return;
    }
    var s = Math.floor(gap / 1000);
    if (elDays) elDays.textContent = pad(Math.floor(s / 86400));
    if (elHours) elHours.textContent = pad(Math.floor((s % 86400) / 3600));
    if (elMins) elMins.textContent = pad(Math.floor((s % 3600) / 60));
    if (elSecs) elSecs.textContent = pad(s % 60);
  }
  tick();
  var countdownTimer = setInterval(tick, 1000);

  /* ── Venue Contact & Clipboard ──────────────────────────────── */
  var PHONE = '+91 98290 12345';
  function flashNote(msg) {
    var n = document.getElementById('callNote');
    if (!n) return;
    n.textContent = msg;
    n.classList.add('on');
    clearTimeout(n._t);
    n._t = setTimeout(function () {
      n.classList.remove('on');
    }, 3200);
  }

  function copyPhone() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(PHONE);
    }
    return new Promise(function (res, rej) {
      try {
        var ta = document.createElement('textarea');
        ta.value = PHONE;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, PHONE.length);
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? res() : rej();
      } catch (err) {
        rej(err);
      }
    });
  }

  var callBtn = document.getElementById('callBtn');
  var phoneLink = document.getElementById('phone');
  function wireCall(elem) {
    if (!elem) return;
    elem.addEventListener('click', function (e) {
      var mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      copyPhone()
        .then(function () {
          flashNote('Resort phone copied: ' + PHONE);
        })
        .catch(function () {
          flashNote(PHONE);
        });
      if (!mobile) e.preventDefault();
    });
  }
  wireCall(callBtn);
  wireCall(phoneLink);

  /* ── Save / Share Actions ────────────────────────────────────── */
  var printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', function () {
      window.print();
    });
  }

  var shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', function () {
      var shareText = "Khyati & Aditya have something to tell you \uD83D\uDE42\nTap, scratch, and see for yourself \u2192\n" + window.location.href;
      if (navigator.share) {
        navigator.share({
          title: 'Khyati & Aditya — Our Wedding Celebrations',
          text: shareText,
          url: window.location.href
        }).catch(function () {});
      } else {
        var waUrl = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(shareText);
        window.open(waUrl, '_blank');
      }
    });
  }

  /* ── Interactive Ceremonies Day Navigator ────────────────────── */
  var dayPills = document.querySelectorAll('.day-pill');
  var dayPanels = {
    day1: document.getElementById('panel-day1'),
    day2: document.getElementById('panel-day2'),
    day3: document.getElementById('panel-day3')
  };

  dayPills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      var selectedDay = pill.dataset.day;
      dayPills.forEach(function (p) { p.classList.remove('active'); });
      pill.classList.add('active');

      if (selectedDay === 'all') {
        Object.keys(dayPanels).forEach(function (key) {
          if (dayPanels[key]) dayPanels[key].classList.add('active-panel');
        });
      } else {
        Object.keys(dayPanels).forEach(function (key) {
          if (dayPanels[key]) {
            if (key === selectedDay) {
              dayPanels[key].classList.add('active-panel');
            } else {
              dayPanels[key].classList.remove('active-panel');
            }
          }
        });
      }

      // Smooth GSAP animation on switching day cards
      if (typeof window.gsap !== 'undefined') {
        gsap.fromTo('.ceremony-day-panel.active-panel .ceremony-card', 
          { opacity: 0, y: 12 }, 
          { opacity: 1, y: 0, duration: 0.35, stagger: 0.07, ease: "power2.out" }
        );
      }
    });
  /* ── Interactive Blessing Box ────────────────────────────────── */
  var sendBlessingBtn = document.getElementById('sendBlessingBtn');
  var blessingInput = document.getElementById('blessingInput');
  var blessingFeedback = document.getElementById('blessingFeedback');

  if (sendBlessingBtn && blessingInput) {
    sendBlessingBtn.addEventListener('click', function () {
      var text = blessingInput.value.trim();
      if (!text) {
        if (blessingFeedback) blessingFeedback.textContent = "Please enter your wish or blessing first! ✨";
        return;
      }
      blessingInput.value = "";
      if (blessingFeedback) {
        blessingFeedback.textContent = "Thank you for your heartfelt blessing! 🙏✨";
      }
      celebrate();
    });

    blessingInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        sendBlessingBtn.click();
      }
    });
  }

  /* ── Built-in Romantic Web Audio Synthesizer ────────────────── */

  var mb = document.getElementById('music');
  var track = document.getElementById('track');
  var hasFile = !!(track && track.querySelector('source'));
  var audio = { ctx: null, master: null, bus: null, timer: null, step: 0, next: 0, on: false };

  var BPM = 66, BEAT = 60 / BPM, EIGHTH = BEAT / 2, LOOP = 64;
  var CHORDS = [
    [50, 54, 57, 62], // D
    [47, 50, 54, 59], // Bm
    [43, 47, 50, 55], // G
    [45, 49, 52, 57]  // A
  ];
  var BASS = [38, 35, 31, 33];
  var MELODY = [
    [0, 78, 4], [4, 81, 2], [6, 79, 2], [8, 78, 4], [12, 74, 4],
    [16, 76, 3], [19, 78, 1], [20, 79, 4], [24, 81, 4], [28, 78, 2], [30, 76, 2],
    [32, 81, 4], [36, 83, 2], [38, 81, 2], [40, 78, 4], [44, 76, 4],
    [48, 74, 3], [51, 76, 1], [52, 78, 4], [56, 76, 4], [60, 74, 4]
  ];

  function hz(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  function makeReverb(ctx) {
    var len = ctx.sampleRate * 2.5;
    var buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
      }
    }
    var cv = ctx.createConvolver();
    cv.buffer = buf;
    return cv;
  }

  function buildAudio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    var ctx = new AC();
    var master = ctx.createGain();
    master.gain.value = 0;

    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    comp.attack.value = 0.006;
    comp.release.value = 0.25;

    var bus = ctx.createGain();
    bus.gain.value = 1;
    var tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 3200;
    tone.Q.value = 0.4;

    var verb = makeReverb(ctx);
    var wet = ctx.createGain();
    wet.gain.value = 0.35;
    var dry = ctx.createGain();
    dry.gain.value = 0.82;

    bus.connect(tone);
    tone.connect(dry);
    dry.connect(comp);
    tone.connect(verb);
    verb.connect(wet);
    wet.connect(comp);
    comp.connect(master);
    master.connect(ctx.destination);

    audio.ctx = ctx;
    audio.master = master;
    audio.bus = bus;
    return true;
  }

  function synthPad(t, midi, dur, vol) {
    var ctx = audio.ctx;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 1.2);
    g.gain.setValueAtTime(vol, t + dur - 1.2);
    g.gain.linearRampToValueAtTime(0, t + dur);
    g.connect(audio.bus);
    [0, -6, 7].forEach(function (cents, i) {
      var o = ctx.createOscillator();
      o.type = i === 0 ? 'triangle' : 'sine';
      o.frequency.value = hz(midi);
      o.detune.value = cents;
      o.connect(g);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
  }

  function synthBass(t, midi, dur) {
    var ctx = audio.ctx;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.14, t + 0.09);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    var o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = hz(midi);
    o.connect(g);
    g.connect(audio.bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function synthPluck(t, midi, vel) {
    var ctx = audio.ctx;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    var o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = hz(midi);
    var o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = hz(midi + 12);
    var g2 = ctx.createGain();
    g2.gain.value = 0.14;
    o2.connect(g2);
    g2.connect(g);
    o.connect(g);
    g.connect(audio.bus);
    o.start(t);
    o.stop(t + 1.9);
    o2.start(t);
    o2.stop(t + 1.9);
  }

  function synthLead(t, midi, dur) {
    var ctx = audio.ctx;
    var g = ctx.createGain();
    var peak = 0.17;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.05);
    g.gain.linearRampToValueAtTime(peak * 0.72, t + 0.34);
    g.gain.setValueAtTime(peak * 0.72, t + Math.max(0.36, dur - 0.28));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);
    g.connect(audio.bus);

    var o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = hz(midi);
    var o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = hz(midi);
    o2.detune.value = 6;
    var g2 = ctx.createGain();
    g2.gain.value = 0.55;
    o2.connect(g2);
    g2.connect(g);

    var lfo = ctx.createOscillator();
    lfo.frequency.value = 5.1;
    var lg = ctx.createGain();
    lg.gain.setValueAtTime(0, t);
    lg.gain.linearRampToValueAtTime(3.4, t + Math.min(0.7, dur));
    lfo.connect(lg);
    lg.connect(o.detune);
    lg.connect(o2.detune);

    o.connect(g);
    o.start(t);
    o.stop(t + dur + 0.6);
    o2.start(t);
    o2.stop(t + dur + 0.6);
    lfo.start(t);
    lfo.stop(t + dur + 0.6);
  }

  function scheduleSynth() {
    var ctx = audio.ctx;
    while (audio.next < ctx.currentTime + 0.4) {
      var t = audio.next;
      var step = audio.step % LOOP;
      var bar = Math.floor(step / 8);
      var chord = CHORDS[bar % 4];

      if (step % 8 === 0) {
        chord.forEach(function (n, i) {
          synthPad(t, n, BEAT * 4, i === 0 ? 0.06 : 0.045);
        });
        synthBass(t, BASS[bar % 4], BEAT * 2.6);
      }
      if (step % 8 === 4) {
        synthBass(t, BASS[bar % 4] + 7, BEAT * 1.6);
      }

      var pattern = [0, 2, 1, 3, 2, 1, 3, 2];
      if (step % 2 === 0 && step % 8 !== 6) {
        synthPluck(t, chord[pattern[step % 8]] + 12, step % 8 === 0 ? 0.07 : 0.05);
      }

      for (var i = 0; i < MELODY.length; i++) {
        if (MELODY[i][0] === step) {
          synthLead(t, MELODY[i][1], MELODY[i][2] * EIGHTH);
        }
      }

      audio.next += EIGHTH;
      audio.step++;
    }
  }

  function musicOn() {
    if (hasFile && track) {
      track.play().catch(function () {
        hasFile = false;
        musicOn();
      });
    } else {
      if (!audio.ctx && !buildAudio()) return;
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      audio.next = audio.ctx.currentTime + 0.1;
      if (!audio.timer) audio.timer = setInterval(scheduleSynth, 90);
      var now = audio.ctx.currentTime;
      audio.master.gain.cancelScheduledValues(now);
      audio.master.gain.setValueAtTime(audio.master.gain.value, now);
      audio.master.gain.linearRampToValueAtTime(0.62, now + 2.0);
    }
    audio.on = true;
    if (mb) {
      mb.classList.remove('off');
      mb.setAttribute('aria-pressed', 'true');
    }
  }

  function musicOff() {
    if (hasFile && track) {
      track.pause();
    } else if (audio.ctx) {
      var now = audio.ctx.currentTime;
      audio.master.gain.cancelScheduledValues(now);
      audio.master.gain.setValueAtTime(audio.master.gain.value, now);
      audio.master.gain.linearRampToValueAtTime(0, now + 0.6);
      setTimeout(function () {
        if (!audio.on && audio.timer) {
          clearInterval(audio.timer);
          audio.timer = null;
        }
      }, 700);
    }
    audio.on = false;
    if (mb) {
      mb.classList.add('off');
      mb.setAttribute('aria-pressed', 'false');
    }
  }

  if (mb) {
    mb.addEventListener('click', function (e) {
      e.stopPropagation();
      audio.on ? musicOff() : musicOn();
    });
  }

})();
