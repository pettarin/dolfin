/* dolfin — interval timer companion for indoor rowing.
   No dependencies, no build step. */
'use strict';

(function () {
  // ── configuration ──────────────────────────────────────────────────────

  const DEFAULTS = {
    reps: 24,
    effort: 105,
    rest: 45,
    warmup: 300,
    cooldown: 300,
    notice: 5, // seconds of blinking and blips before a phase ends
    fullscreen: true,
  };

  // A rest is scheduled after every repetition, including the last one, before
  // the cool-down. Set to false to drop that final rest.
  const INCLUDE_TRAILING_REST = true;

  const STORAGE_KEY = 'dolfin.settings.v1';
  const MAX_SECONDS = 6 * 3600;
  // no practical ceiling, just a guard: the timeline holds two segments per rep,
  // and an unbounded value would build enough of them to hang the tab
  const MAX_REPS = 9999;
  const RANGE_MAX = 300; // the sliders cover 0..5 minutes; type for anything longer

  // both lists follow the on-screen order, so the first invalid field gets focus
  const TIME_FIELDS = ['warmup', 'effort', 'rest', 'cooldown', 'notice'];
  const ALL_FIELDS = ['warmup', 'reps', 'effort', 'rest', 'cooldown', 'notice'];

  // shown as a bare number rather than hh:mm:ss
  const PLAIN_FIELDS = ['reps', 'notice'];

  const LABEL = {
    warmup: 'WARM UP',
    effort: 'EFFORT',
    rest: 'REST',
    cooldown: 'COOL DOWN',
  };

  // ── dom ────────────────────────────────────────────────────────────────

  const $ = (id) => document.getElementById(id);

  const els = {
    body: document.body,
    setup: $('setup'),
    session: $('session'),
    form: $('setup-form'),
    resetBtn: $('reset-btn'),
    endBtn: $('end-btn'),
    summaryTotal: $('summary-total'),
    phaseName: $('phase-name'),
    repCounter: $('rep-counter'),
    phaseBar: $('phase-bar'),
    phaseFill: $('phase-bar-fill'),
    countdown: $('countdown'),
    nextUp: $('next-up'),
    overallFill: $('overall-fill'),
    overallRemaining: $('overall-remaining'),
    pausedOverlay: $('paused-overlay'),
    fullscreen: $('fullscreen'),
    fsBtn: $('fs-btn'),
  };

  ALL_FIELDS.forEach((f) => {
    els[f] = $(f);
    els[f + 'Error'] = $(f + '-error');
    els[f + 'Range'] = $(f + '-range');
  });

  // ── parsing / formatting ───────────────────────────────────────────────

  /** Accepts "105", "1:45" and "00:01:45". Returns whole seconds, or null. */
  function parseDuration(raw) {
    const s = String(raw == null ? '' : raw).trim();
    let total = null;

    if (/^\d{1,5}$/.test(s)) {
      total = Number(s);
    } else if (/^\d{1,3}(?::\d{1,2}){1,2}$/.test(s)) {
      const parts = s.split(':').map(Number);
      if (parts.slice(1).some((n) => n > 59)) return null;
      total =
        parts.length === 2
          ? parts[0] * 60 + parts[1]
          : parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    if (total === null || !Number.isInteger(total) || total < 0 || total > MAX_SECONDS) return null;
    return total;
  }

  /** Canonical input form: "00:01:45". */
  function formatHMS(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
  }

  /** Reads a field's box: a plain count for reps, a duration for the rest. */
  function parseField(field, text) {
    if (field === 'reps') {
      const s = String(text).trim();
      return /^\d+$/.test(s) ? Number(s) : null;
    }
    return parseDuration(text);
  }

  /** How a given field writes its value back into its box. */
  function formatField(field, secs) {
    return PLAIN_FIELDS.indexOf(field) !== -1 ? String(secs) : formatHMS(secs);
  }

  /** Display form: "1:45", "12:03:00". */
  function formatClock(sec) {
    const total = Math.max(0, Math.round(sec));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const ss = String(s).padStart(2, '0');
    return h > 0 ? h + ':' + String(m).padStart(2, '0') + ':' + ss : m + ':' + ss;
  }

  // ── settings ───────────────────────────────────────────────────────────

  /** Reads the five controls. Returns { values, errors }. */
  function readForm() {
    const values = {};
    const errors = {};

    const reps = parseField('reps', els.reps.value);
    if (reps === null || reps < 0 || reps > MAX_REPS) {
      errors.reps = 'Enter a whole number from 0 to ' + MAX_REPS + '.';
    } else {
      values.reps = reps; // zero is legal: warm up and cool down only
    }

    TIME_FIELDS.forEach((f) => {
      const secs = parseDuration(els[f].value);
      if (secs === null) errors[f] = 'Use hh:mm:ss, mm:ss or plain seconds.';
      else values[f] = secs;
    });

    if (!errors.effort && values.effort === 0 && values.reps > 0) {
      errors.effort = 'Effort time must be greater than zero.';
    }

    // everything at zero would build an empty timeline and start nothing
    if (Object.keys(errors).length === 0 && totalSeconds(values) === 0) {
      errors.reps = 'Nothing to run: add a warm up, a cool down or a repetition.';
    }

    values.fullscreen = els.fullscreen.checked === true;

    return { values: values, errors: errors };
  }

  function showErrors(errors) {
    ALL_FIELDS.forEach((f) => {
      const msg = errors[f];
      const box = els[f + 'Error'];
      box.textContent = msg || '';
      box.hidden = !msg;
      if (msg) els[f].setAttribute('aria-invalid', 'true');
      else els[f].removeAttribute('aria-invalid');
    });
  }

  /** Parks the slider at the field's value; values past its max peg it at max. */
  function syncRange(field, secs) {
    const range = els[field + 'Range'];
    if (!range) return;
    const max = Number(range.max) > 0 ? Number(range.max) : RANGE_MAX;
    range.value = String(Math.max(0, Math.min(max, secs)));
  }

  function clearError(field) {
    if (els[field + 'Error'].hidden) return;
    els[field + 'Error'].hidden = true;
    els[field].removeAttribute('aria-invalid');
  }

  function fillForm(cfg) {
    els.reps.value = String(cfg.reps);
    syncRange('reps', cfg.reps);
    TIME_FIELDS.forEach((f) => {
      els[f].value = formatField(f, cfg[f]);
      syncRange(f, cfg[f]);
    });
    els.fullscreen.checked = cfg.fullscreen !== false;
  }

  function loadSettings() {
    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (err) {
      stored = null;
    }
    if (!stored || typeof stored !== 'object') return Object.assign({}, DEFAULTS);

    const cfg = Object.assign({}, DEFAULTS);
    if (Number.isInteger(stored.reps) && stored.reps >= 0 && stored.reps <= MAX_REPS) {
      cfg.reps = stored.reps;
    }
    TIME_FIELDS.forEach((f) => {
      if (Number.isInteger(stored[f]) && stored[f] >= 0 && stored[f] <= MAX_SECONDS) {
        cfg[f] = stored[f];
      }
    });
    if (typeof stored.fullscreen === 'boolean') cfg.fullscreen = stored.fullscreen;
    return cfg;
  }

  function saveSettings(cfg) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch (err) {
      /* private mode / quota: not worth bothering the user */
    }
  }

  function clearSettings() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* ignore */
    }
  }

  // ── timeline ───────────────────────────────────────────────────────────

  /** Flat list of segments with cumulative offsets; zero-length ones dropped. */
  function buildTimeline(cfg) {
    const segs = [];
    let t = 0;

    function push(kind, secs, rep) {
      if (secs <= 0) return;
      const ms = secs * 1000;
      segs.push({ kind: kind, rep: rep, ms: ms, start: t, end: t + ms });
      t += ms;
    }

    push('warmup', cfg.warmup, 0);
    for (let r = 1; r <= cfg.reps; r++) {
      push('effort', cfg.effort, r);
      if (INCLUDE_TRAILING_REST || r < cfg.reps) push('rest', cfg.rest, r);
    }
    push('cooldown', cfg.cooldown, 0);

    return { segs: segs, totalMs: t };
  }

  function totalSeconds(cfg) {
    const rests = INCLUDE_TRAILING_REST ? cfg.reps : cfg.reps - 1;
    return cfg.warmup + cfg.reps * cfg.effort + Math.max(0, rests) * cfg.rest + cfg.cooldown;
  }

  // ── audio cues ─────────────────────────────────────────────────────────

  let audioCtx = null;

  function initAudio() {
    if (audioCtx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      audioCtx = new AC();
    } catch (err) {
      audioCtx = null;
    }
  }

  function tone(freq, durMs, peak, delayMs) {
    if (!audioCtx || audioCtx.state === 'closed') return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const t0 = audioCtx.currentTime + (delayMs || 0) / 1000;
    const dur = durMs / 1000;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  const cue = {
    blip: () => tone(880, 90, 0.2, 0),
    start: (kind) => tone(kind === 'effort' ? 1200 : 660, 220, 0.3, 0),
    finish: () => {
      tone(880, 200, 0.3, 0);
      tone(660, 200, 0.3, 240);
      tone(440, 480, 0.3, 480);
    },
  };

  // ── full screen ────────────────────────────────────────────────────────

  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function fullscreenSupported() {
    const el = document.documentElement;
    return !!(el && (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen));
  }

  /** The button toggles, so it always says what pressing it will do. */
  function updateFsButton() {
    els.fsBtn.hidden = !fullscreenSupported(); // iOS Safari: nothing to offer
    setText(els.fsBtn, isFullscreen() ? 'Exit Full Screen' : 'Go Full Screen');
  }

  /** Must be called straight from the OK gesture, or browsers refuse it. */
  function enterFullscreen() {
    const el = document.documentElement;
    if (!el) return;
    const request = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (!request) return; // iOS Safari: no full screen outside <video>
    try {
      const p = request.call(el);
      if (p && p.then) p.then(updateFsButton, () => {});
    } catch (err) {
      /* refused: the session runs windowed, which is no great loss */
    }
  }

  function exitFullscreen() {
    if (!isFullscreen()) return;
    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (!exit) return;
    try {
      const p = exit.call(document);
      if (p && p.then) p.then(updateFsButton, () => {});
    } catch (err) {
      /* ignore */
    }
  }

  // ── wake lock ──────────────────────────────────────────────────────────

  let wakeLock = null;

  function acquireWakeLock() {
    if (!('wakeLock' in navigator)) return;
    navigator.wakeLock
      .request('screen')
      .then((lock) => {
        wakeLock = lock;
        lock.addEventListener('release', () => {
          wakeLock = null;
        });
      })
      .catch(() => {
        wakeLock = null;
      });
  }

  function releaseWakeLock() {
    if (!wakeLock) return;
    const lock = wakeLock;
    wakeLock = null;
    Promise.resolve(lock.release()).catch(() => {});
  }

  // ── session ────────────────────────────────────────────────────────────

  let session = null;

  function setText(el, value) {
    if (el.textContent !== value) el.textContent = value;
  }

  /** A reading centred in a bar: past `fits` characters it drops a size. */
  function setBigText(el, value, fits) {
    setText(el, value);
    el.classList.toggle('long', value.length > fits);
  }

  function setBar(el, ratio) {
    const p = Math.min(1, Math.max(0, ratio));
    el.style.transform = 'scaleX(' + p.toFixed(5) + ')';
  }

  function setPhaseClass(kind) {
    const cls = 'phase-' + kind;
    if (els.body.dataset.phase === cls) return;
    if (els.body.dataset.phase) els.body.classList.remove(els.body.dataset.phase);
    els.body.classList.add(cls);
    els.body.dataset.phase = cls;
  }

  function elapsedNow() {
    const ref = session.pausedAt !== null ? session.pausedAt : performance.now();
    return Math.max(0, ref - session.startedAt - session.pausedAccum);
  }

  function nextLabel(index) {
    const next = session.segs[index + 1];
    if (!next) return 'next: finish';
    return 'next: ' + LABEL[next.kind] + ' ' + formatClock(next.ms / 1000);
  }

  function repLabel(seg) {
    return seg.rep ? seg.rep + ' / ' + session.reps : '';
  }

  function startSession(cfg) {
    const timeline = buildTimeline(cfg);
    if (!timeline.segs.length) return;

    session = {
      segs: timeline.segs,
      totalMs: timeline.totalMs,
      reps: cfg.reps,
      notice: cfg.notice,
      startedAt: performance.now(),
      pausedAt: null,
      pausedAccum: 0,
      index: 0,
      raf: 0,
      finished: false,
      lastBlip: -1,
      lastPercent: -1,
    };

    els.endBtn.textContent = 'End';
    updateFsButton();
    els.pausedOverlay.hidden = true;
    els.session.classList.remove('urgent');
    els.setup.hidden = true;
    els.session.hidden = false;
    els.body.classList.remove('screen-setup');
    els.body.classList.add('screen-session');

    setPhaseClass(session.segs[0].kind);
    cue.start(session.segs[0].kind);
    acquireWakeLock();
    loop();
  }

  function loop() {
    render();
    if (session && !session.finished && session.pausedAt === null) {
      session.raf = requestAnimationFrame(loop);
    }
  }

  function render() {
    const elapsed = elapsedNow();

    if (elapsed >= session.totalMs) {
      finish();
      return;
    }

    let changed = false;
    while (session.index < session.segs.length - 1 && elapsed >= session.segs[session.index].end) {
      session.index++;
      changed = true;
    }

    const seg = session.segs[session.index];
    if (changed) {
      session.lastBlip = -1;
      setPhaseClass(seg.kind);
      cue.start(seg.kind);
    }

    const inPhase = elapsed - seg.start;
    const remainSec = Math.ceil(Math.max(0, seg.ms - inPhase) / 1000);

    const notice = remainSec >= 1 && remainSec <= session.notice;

    if (notice && remainSec !== session.lastBlip) {
      session.lastBlip = remainSec;
      cue.blip();
    }

    setText(els.phaseName, LABEL[seg.kind]);
    setBigText(els.repCounter, repLabel(seg), 7);
    setBigText(els.countdown, formatClock(remainSec), 5);
    setText(els.nextUp, nextLabel(session.index));
    setBar(els.phaseFill, inPhase / seg.ms);
    setBar(els.overallFill, elapsed / session.totalMs);
    setText(els.overallRemaining, formatHMS(Math.ceil((session.totalMs - elapsed) / 1000)));

    els.session.classList.toggle('urgent', notice);

    const percent = Math.round((inPhase / seg.ms) * 100);
    if (percent !== session.lastPercent) {
      session.lastPercent = percent;
      els.phaseBar.setAttribute('aria-valuenow', String(percent));
    }
  }

  function finish() {
    if (session.finished) return;
    session.finished = true;
    cancelAnimationFrame(session.raf);

    setPhaseClass('done');
    els.session.classList.remove('urgent');
    setText(els.phaseName, 'FINISHED');
    setBigText(els.repCounter, session.reps + ' reps done', 7);
    setText(els.countdown, '0:00');
    setText(els.nextUp, '');
    setText(els.overallRemaining, '00:00:00');
    setBar(els.phaseFill, 1);
    setBar(els.overallFill, 1);
    els.phaseBar.setAttribute('aria-valuenow', '100');
    els.pausedOverlay.hidden = true;
    els.endBtn.textContent = 'Back to setup';

    cue.finish();
    releaseWakeLock();
  }

  function togglePause() {
    if (!session || session.finished) return;

    if (session.pausedAt === null) {
      session.pausedAt = performance.now();
      cancelAnimationFrame(session.raf);
      els.pausedOverlay.hidden = false;
    } else {
      session.pausedAccum += performance.now() - session.pausedAt;
      session.pausedAt = null;
      session.lastBlip = -1;
      els.pausedOverlay.hidden = true;
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      acquireWakeLock();
      loop();
    }
  }

  function endSession() {
    if (session) cancelAnimationFrame(session.raf);
    session = null;

    releaseWakeLock();
    exitFullscreen();
    updateFsButton();
    els.pausedOverlay.hidden = true;
    els.session.classList.remove('urgent');
    els.session.hidden = true;
    els.setup.hidden = false;
    els.body.classList.remove('screen-session');
    els.body.classList.add('screen-setup');
    if (els.body.dataset.phase) {
      els.body.classList.remove(els.body.dataset.phase);
      delete els.body.dataset.phase;
    }
    els.reps.focus({ preventScroll: true });
  }

  // ── setup screen wiring ────────────────────────────────────────────────

  function updateSummary() {
    const read = readForm();
    const ok = Object.keys(read.errors).length === 0;
    setText(els.summaryTotal, ok ? formatHMS(totalSeconds(read.values)) : '—');
  }

  els.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const read = readForm();
    showErrors(read.errors);

    const bad = ALL_FIELDS.find((f) => read.errors[f]);
    if (bad) {
      els[bad].focus();
      return;
    }

    fillForm(read.values);
    saveSettings(read.values);
    initAudio(); // created inside the click gesture, so autoplay policy is happy
    if (read.values.fullscreen) enterFullscreen();
    startSession(read.values);
  });

  els.resetBtn.addEventListener('click', () => {
    clearSettings();
    fillForm(DEFAULTS);
    showErrors({});
    updateSummary();
    els.reps.focus();
  });

  ALL_FIELDS.forEach((f) => {
    els[f].addEventListener('input', () => {
      clearError(f);
      const value = parseField(f, els[f].value);
      if (value !== null) syncRange(f, value);
      updateSummary();
    });

    const range = els[f + 'Range'];
    if (!range) return;

    range.addEventListener('input', () => {
      els[f].value = formatField(f, Number(range.value));
      clearError(f);
      updateSummary();
    });
  });

  // only the durations get rewritten into hh:mm:ss when you leave the box
  TIME_FIELDS.forEach((f) => {
    els[f].addEventListener('blur', () => {
      const secs = parseDuration(els[f].value);
      if (secs !== null) {
        els[f].value = formatField(f, secs);
        syncRange(f, secs);
      }
      updateSummary();
    });
  });

  // ── session screen wiring ──────────────────────────────────────────────

  els.endBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    endSession();
  });

  els.fsBtn.addEventListener('click', (event) => {
    event.stopPropagation(); // toggling full screen must not pause the session
    if (isFullscreen()) exitFullscreen();
    else enterFullscreen();
    updateFsButton();
  });

  ['fullscreenchange', 'webkitfullscreenchange'].forEach((evt) => {
    document.addEventListener(evt, updateFsButton);
  });

  els.session.addEventListener('click', (event) => {
    if (event.target.closest('button')) return;
    togglePause();
  });

  document.addEventListener('keydown', (event) => {
    if (!session) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      endSession();
      return;
    }

    if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'Enter') {
      event.preventDefault();
      if (session.finished) endSession();
      else togglePause();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    if (session && !session.finished && session.pausedAt === null) acquireWakeLock();
  });

  // ── boot ───────────────────────────────────────────────────────────────

  fillForm(loadSettings());
  showErrors({});
  updateSummary();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./precache.js').catch(() => {});
    });
  }
})();
