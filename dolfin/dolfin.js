/* dolfin — interval timer companion for indoor rowing.
   No dependencies, no build step. */
'use strict';

(function () {
  // ── configuration ──────────────────────────────────────────────────────

  // preset effort/rest blocks offered on the Programs tab; the labels are derived
  // from these by programLabel(), so the format lives in exactly one place
  const PROGRAMS = [
    { reps: 5, effort: 90, rest: 30 },
    { reps: 10, effort: 90, rest: 30 },
    { reps: 15, effort: 90, rest: 30 },
    { reps: 20, effort: 90, rest: 30 },
    { reps: 30, effort: 90, rest: 30 },
    { reps: 45, effort: 90, rest: 30 },
    { reps: 60, effort: 90, rest: 30 },
    { reps: 4, effort: 105, rest: 45 },
    { reps: 6, effort: 105, rest: 45 },
    { reps: 8, effort: 105, rest: 45 },
    { reps: 12, effort: 105, rest: 45 },
    { reps: 16, effort: 105, rest: 45 },
    { reps: 18, effort: 105, rest: 45 },
    { reps: 20, effort: 105, rest: 45 },
    { reps: 24, effort: 105, rest: 45 },
    { reps: 30, effort: 105, rest: 45 },
    { reps: 32, effort: 105, rest: 45 },
    { reps: 36, effort: 105, rest: 45 },
    { reps: 48, effort: 105, rest: 45 },
    { reps: 5, effort: 120, rest: 60 },
    { reps: 10, effort: 120, rest: 60 },
    { reps: 15, effort: 120, rest: 60 },
    { reps: 20, effort: 120, rest: 60 },
    { reps: 25, effort: 120, rest: 60 },
    { reps: 30, effort: 120, rest: 60 },
    { reps: 40, effort: 120, rest: 60 },
  ];

  const DEFAULTS = {
    reps: 24,
    effort: 105,
    rest: 45,
    warmup: 60,
    cooldown: 60,
    // the Programs tab keeps its own warm up and cool down, independent of the
    // ones above, so a preset can carry a different opening and closing
    progWarmup: 60,
    progCooldown: 60,
    // the same block the manual defaults above describe, so the two tabs open
    // on the same workout; falls back to the first entry if it ever leaves
    // the list
    program: Math.max(0, findProgram({ reps: 24, effort: 105, rest: 45 })),
    config: 'intervals', // the tab whose settings Start will run
    notice: 5, // seconds of blinking and blips before a phase ends
    fullscreen: true,
    allowSkip: false, // opt in to the Skip button on the timer screen
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
  const TIME_FIELDS = [
    'warmup', 'effort', 'rest', 'cooldown', 'prog-warmup', 'prog-cooldown', 'notice',
  ];
  const ALL_FIELDS = [
    'warmup', 'reps', 'effort', 'rest', 'cooldown', 'prog-warmup', 'prog-cooldown', 'notice',
  ];

  // shown as a bare number rather than hh:mm:ss
  const PLAIN_FIELDS = ['reps', 'notice'];

  // the setup form is split in three panels; the first one is shown on load
  const TABS = ['intervals', 'programs', 'customization'];

  // the two panels that describe a session; Customization only holds preferences,
  // so visiting it leaves the choice of which one Start runs alone
  const CONFIG_TABS = ['intervals', 'programs'];

  // which panel holds each field, so a failed validation can reveal it
  const FIELD_TAB = {
    warmup: 'intervals',
    reps: 'intervals',
    effort: 'intervals',
    rest: 'intervals',
    cooldown: 'intervals',
    'prog-warmup': 'programs',
    'prog-cooldown': 'programs',
    notice: 'customization',
  };

  // the durations each configuration contributes to the timeline, in on-screen
  // order, keyed by the field that carries them
  const CONFIG_FIELDS = {
    intervals: { warmup: 'warmup', cooldown: 'cooldown' },
    programs: { warmup: 'prog-warmup', cooldown: 'prog-cooldown' },
  };

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
    startBtn: $('start-btn'),
    endBtn: $('end-btn'),
    summaryTotal: $('summary-total'),
    progSummaryTotal: $('prog-summary-total'),
    program: $('program'),
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
    allowSkip: $('allow-skip'),
    fsBtn: $('fs-btn'),
    skipBtn: $('skip-btn'),
    tabs: $('tabs'),
  };

  ALL_FIELDS.forEach((f) => {
    els[f] = $(f);
    els[f + 'Error'] = $(f + '-error');
    els[f + 'Range'] = $(f + '-range');
  });

  TABS.forEach((t) => {
    els[t + 'Tab'] = $('tab-' + t);
    els[t + 'Panel'] = $('panel-' + t);
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

  /** Zero-padded minutes and seconds: "01:45". Programs never run to hours. */
  function formatMS(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return [m, s].map((n) => String(n).padStart(2, '0')).join(':');
  }

  /** A program read out as "INT: (01:45 + 00:45) x 8". The prefix names the kind
      of program; kinds other than intervals will bring their own prefix and their
      own body. */
  function programLabel(p) {
    return 'INT: (' + formatMS(p.effort) + ' + ' + formatMS(p.rest) + ') x ' + p.reps;
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

  // the last known good state of the whole setup screen, both configurations
  let settings = Object.assign({}, DEFAULTS);

  /** Fills the combobox from PROGRAMS. Called once, at boot. */
  function fillPrograms() {
    PROGRAMS.forEach((p, i) => {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = programLabel(p);
      els.program.appendChild(option);
    });
  }

  /** Where a stored program sits in the list now, or -1 if it is gone. */
  function findProgram(p) {
    if (!p || typeof p !== 'object') return -1;
    return PROGRAMS.findIndex(
      (q) => q.reps === p.reps && q.effort === p.effort && q.rest === p.rest
    );
  }

  /** The index the combobox is on, falling back to the first program. */
  function selectedProgram() {
    const i = Number(els.program.value);
    return Number.isInteger(i) && i >= 0 && i < PROGRAMS.length ? i : 0;
  }

  /** The program the combobox is sitting on. */
  function currentProgram() {
    return PROGRAMS[selectedProgram()];
  }

  /** Reads one configuration into the flat shape the timeline wants. */
  function readConfig(name) {
    const values = {};
    const errors = {};
    const fields = CONFIG_FIELDS[name];

    if (name === 'programs') {
      // the effort block comes from the list, so it cannot be out of range
      const p = currentProgram();
      values.reps = p.reps;
      values.effort = p.effort;
      values.rest = p.rest;
    } else {
      const reps = parseField('reps', els.reps.value);
      if (reps === null || reps < 0 || reps > MAX_REPS) {
        errors.reps = 'Enter a whole number from 0 to ' + MAX_REPS + '.';
      } else {
        values.reps = reps; // zero is legal: warm up and cool down only
      }

      ['effort', 'rest'].forEach((f) => {
        const secs = parseDuration(els[f].value);
        if (secs === null) errors[f] = 'Use hh:mm:ss, mm:ss or plain seconds.';
        else values[f] = secs;
      });

      if (!errors.effort && values.effort === 0 && values.reps > 0) {
        errors.effort = 'Effort time must be greater than zero.';
      }
    }

    // the warm up and cool down come from whichever tab owns them
    ['warmup', 'cooldown'].forEach((key) => {
      const secs = parseDuration(els[fields[key]].value);
      if (secs === null) errors[fields[key]] = 'Use hh:mm:ss, mm:ss or plain seconds.';
      else values[key] = secs;
    });

    // everything at zero would build an empty timeline and start nothing
    if (Object.keys(errors).length === 0 && totalSeconds(values) === 0) {
      errors[name === 'programs' ? fields.warmup : 'reps'] =
        'Nothing to run: add a warm up, a cool down or a repetition.';
    }

    return { values: values, errors: errors };
  }

  /** Reads the active configuration plus the preferences. Returns { values, errors }. */
  function readForm() {
    const read = readConfig(activeConfig);

    const notice = parseDuration(els.notice.value);
    if (notice === null) read.errors.notice = 'Use hh:mm:ss, mm:ss or plain seconds.';
    else read.values.notice = notice;

    read.values.fullscreen = els.fullscreen.checked === true;
    read.values.allowSkip = els.allowSkip.checked === true;

    return read;
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

  /** The stored key each duration field is filled from and saved back into. */
  const FIELD_KEY = {
    warmup: 'warmup',
    effort: 'effort',
    rest: 'rest',
    cooldown: 'cooldown',
    'prog-warmup': 'progWarmup',
    'prog-cooldown': 'progCooldown',
    notice: 'notice',
  };

  function fillForm(cfg) {
    els.reps.value = String(cfg.reps);
    syncRange('reps', cfg.reps);
    TIME_FIELDS.forEach((f) => {
      const secs = cfg[FIELD_KEY[f]];
      els[f].value = formatField(f, secs);
      syncRange(f, secs);
    });
    els.program.value = String(cfg.program);
    els.fullscreen.checked = cfg.fullscreen !== false;
    els.allowSkip.checked = cfg.allowSkip === true;
  }

  /** Every control on the setup screen, in the shape that gets stored. A field
      that will not parse keeps its previous value rather than poisoning storage:
      the inactive configuration is never validated on submit. */
  function collectSettings() {
    const cfg = Object.assign({}, settings);

    const reps = parseField('reps', els.reps.value);
    if (reps !== null && reps >= 0 && reps <= MAX_REPS) cfg.reps = reps;

    TIME_FIELDS.forEach((f) => {
      const secs = parseDuration(els[f].value);
      if (secs !== null) cfg[FIELD_KEY[f]] = secs;
    });

    cfg.program = selectedProgram();
    cfg.config = activeConfig;
    cfg.fullscreen = els.fullscreen.checked === true;
    cfg.allowSkip = els.allowSkip.checked === true;

    return cfg;
  }

  /** Rewrites one configuration's boxes in canonical form, after a start. */
  function canonicalize(name) {
    const fields = CONFIG_FIELDS[name];
    const list =
      name === 'programs'
        ? [fields.warmup, fields.cooldown]
        : ['warmup', 'effort', 'rest', 'cooldown'];

    list.forEach((f) => {
      const secs = parseDuration(els[f].value);
      if (secs === null) return;
      els[f].value = formatField(f, secs);
      syncRange(f, secs);
    });
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
      const key = FIELD_KEY[f];
      if (Number.isInteger(stored[key]) && stored[key] >= 0 && stored[key] <= MAX_SECONDS) {
        cfg[key] = stored[key];
      }
    });
    const found = findProgram(stored.program);
    if (found !== -1) cfg.program = found;
    // 2.0.0 development builds stored a bare index; honour one that still fits
    else if (Number.isInteger(stored.program) && stored.program >= 0
             && stored.program < PROGRAMS.length) {
      cfg.program = stored.program;
    }
    if (CONFIG_TABS.indexOf(stored.config) !== -1) cfg.config = stored.config;
    if (typeof stored.fullscreen === 'boolean') cfg.fullscreen = stored.fullscreen;
    if (typeof stored.allowSkip === 'boolean') cfg.allowSkip = stored.allowSkip;
    return cfg;
  }

  function saveSettings(cfg) {
    try {
      // the program goes out by value, so growing or reordering PROGRAMS later
      // cannot silently move somebody's saved choice
      const out = Object.assign({}, cfg, { program: PROGRAMS[cfg.program] });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
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

  /** Must be called straight from the Start gesture, or browsers refuse it. */
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

    els.endBtn.textContent = 'Stop';
    els.skipBtn.hidden = !cfg.allowSkip;
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
    setBigText(els.repCounter, 'Workout Completed', 7);
    setText(els.countdown, '0:00');
    setText(els.nextUp, '');
    setText(els.overallRemaining, '00:00:00');
    setBar(els.phaseFill, 1);
    setBar(els.overallFill, 1);
    els.phaseBar.setAttribute('aria-valuenow', '100');
    els.pausedOverlay.hidden = true;
    els.endBtn.textContent = 'Home';

    cue.finish();
    releaseWakeLock();
  }

  /** Jumps to the end of the current phase, finishing if it was the last one.
      Works by moving the start of the session back, so everything downstream --
      the phase index, the cue, the bars, the overall clock -- follows as if the
      time had really elapsed. */
  function skipPhase() {
    if (!session || session.finished) return;

    const remaining = session.segs[session.index].end - elapsedNow();
    if (remaining > 0) session.startedAt -= remaining;

    // paused sessions have no loop running, so draw the new phase right away
    render();
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
    selectTab(activeConfig);
    els[activeConfig === 'programs' ? 'prog-warmup' : 'reps'].focus({ preventScroll: true });
  }

  // ── setup tabs ─────────────────────────────────────────────────────────

  let activeTab = TABS[0];
  let activeConfig = DEFAULTS.config;

  /** Selects a tab and moves focus onto it, as arrow-key navigation expects. */
  function focusTab(name) {
    selectTab(name);
    els[name + 'Tab'].focus();
  }

  /** Reveals one panel and marks its tab selected; the other panels go hidden. */
  function selectTab(name) {
    if (TABS.indexOf(name) === -1) return;
    activeTab = name;
    // Customization holds preferences, not a session, so it leaves the choice be
    if (CONFIG_TABS.indexOf(name) !== -1) activeConfig = name;
    // ... and offers nothing to start, so it does not show the button either
    els.startBtn.hidden = CONFIG_TABS.indexOf(name) === -1;
    TABS.forEach((t) => {
      const on = t === name;
      els[t + 'Tab'].setAttribute('aria-selected', on ? 'true' : 'false');
      els[t + 'Tab'].tabIndex = on ? 0 : -1; // roving tabindex: one stop for the strip
      els[t + 'Panel'].hidden = !on;
    });
  }

  TABS.forEach((t) => {
    els[t + 'Tab'].addEventListener('click', () => selectTab(t));
  });

  els.tabs.addEventListener('keydown', (event) => {
    const at = TABS.indexOf(activeTab);

    if (event.key === 'ArrowLeft') focusTab(TABS[(at - 1 + TABS.length) % TABS.length]);
    else if (event.key === 'ArrowRight') focusTab(TABS[(at + 1) % TABS.length]);
    else if (event.key === 'Home') focusTab(TABS[0]);
    else if (event.key === 'End') focusTab(TABS[TABS.length - 1]);
    else return;

    event.preventDefault();
  });

  // ── setup screen wiring ────────────────────────────────────────────────

  /** Both totals stay live, so each is already right when you switch to it. */
  function updateSummary() {
    CONFIG_TABS.forEach((name) => {
      const read = readConfig(name);
      const ok = Object.keys(read.errors).length === 0;
      const out = name === 'programs' ? els.progSummaryTotal : els.summaryTotal;
      setText(out, ok ? formatHMS(totalSeconds(read.values)) : '—');
    });
  }

  els.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const read = readForm();
    showErrors(read.errors);

    const bad = ALL_FIELDS.find((f) => read.errors[f]);
    if (bad) {
      selectTab(FIELD_TAB[bad]); // the offending field may sit under the other tab
      els[bad].focus();
      return;
    }

    settings = collectSettings();
    canonicalize(activeConfig);
    saveSettings(settings);
    initAudio(); // created inside the click gesture, so autoplay policy is happy
    if (read.values.fullscreen) enterFullscreen();
    startSession(read.values);
  });

  els.resetBtn.addEventListener('click', () => {
    clearSettings();
    settings = Object.assign({}, DEFAULTS);
    fillForm(settings);
    showErrors({});
    updateSummary();
    selectTab(TABS[0]);
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

  els.program.addEventListener('change', updateSummary);

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

  els.skipBtn.addEventListener('click', (event) => {
    event.stopPropagation(); // skipping a phase must not also pause the session
    skipPhase();
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

  fillPrograms();
  settings = loadSettings();
  fillForm(settings);
  showErrors({});
  updateSummary();
  selectTab(settings.config);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./precache.js').catch(() => {});
    });
  }
})();
