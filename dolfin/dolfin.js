/* dolfin -- interval timer companion for indoor rowing.
   No dependencies, no build step. */
'use strict';

(function () {
  // -- configuration ------------------------------------------------------

  // the workouts offered on the Programs tab. A program is either an interval
  // block, run as the Intervals tab runs one, or a generic plan, written in the
  // syntax the Generic tab takes; either way it carries the group it is listed
  // under and the label the combobox shows it by. Rows of a group sit together,
  // which is how fillPrograms() knows where one optgroup ends and the next opens
  const PROGRAMS = [
    { type: 'intervals', group: 'Intervals', label: '(01:30 + 00:30) x 5',
      reps: 5, effort: 90, rest: 30 },
    { type: 'intervals', group: 'Intervals', label: '(01:30 + 00:30) x 10',
      reps: 10, effort: 90, rest: 30 },
    { type: 'intervals', group: 'Intervals', label: '(01:30 + 00:30) x 15',
      reps: 15, effort: 90, rest: 30 },
    { type: 'intervals', group: 'Intervals', label: '(01:30 + 00:30) x 20',
      reps: 20, effort: 90, rest: 30 },
    { type: 'intervals', group: 'Intervals', label: '(01:30 + 00:30) x 30',
      reps: 30, effort: 90, rest: 30 },
    { type: 'intervals', group: 'Intervals', label: '(01:30 + 00:30) x 45',
      reps: 45, effort: 90, rest: 30 },
    { type: 'intervals', group: 'Intervals', label: '(01:30 + 00:30) x 60',
      reps: 60, effort: 90, rest: 30 },
    { type: 'intervals', group: 'Intervals', label: '(01:45 + 00:45) x 4',
      reps: 4, effort: 105, rest: 45 },
    { type: 'intervals', group: 'Intervals', label: '(01:45 + 00:45) x 6',
      reps: 6, effort: 105, rest: 45 },
    { type: 'intervals', group: 'Intervals', label: '(01:45 + 00:45) x 8',
      reps: 8, effort: 105, rest: 45 },
    { type: 'intervals', group: 'Intervals', label: '(01:45 + 00:45) x 12',
      reps: 12, effort: 105, rest: 45 },
    { type: 'intervals', group: 'Intervals', label: '(01:45 + 00:45) x 16',
      reps: 16, effort: 105, rest: 45 },
    { type: 'intervals', group: 'Intervals', label: '(01:45 + 00:45) x 18',
      reps: 18, effort: 105, rest: 45 },
    { type: 'intervals', group: 'Intervals', label: '(01:45 + 00:45) x 20',
      reps: 20, effort: 105, rest: 45 },
    { type: 'intervals', group: 'Intervals', label: '(01:45 + 00:45) x 24',
      reps: 24, effort: 105, rest: 45 },
    { type: 'intervals', group: 'Intervals', label: '(01:45 + 00:45) x 30',
      reps: 30, effort: 105, rest: 45 },
    { type: 'intervals', group: 'Intervals', label: '(01:45 + 00:45) x 32',
      reps: 32, effort: 105, rest: 45 },
    { type: 'intervals', group: 'Intervals', label: '(01:45 + 00:45) x 36',
      reps: 36, effort: 105, rest: 45 },
    { type: 'intervals', group: 'Intervals', label: '(01:45 + 00:45) x 48',
      reps: 48, effort: 105, rest: 45 },
    { type: 'intervals', group: 'Intervals', label: '(02:00 + 01:00) x 5',
      reps: 5, effort: 120, rest: 60 },
    { type: 'intervals', group: 'Intervals', label: '(02:00 + 01:00) x 10',
      reps: 10, effort: 120, rest: 60 },
    { type: 'intervals', group: 'Intervals', label: '(02:00 + 01:00) x 15',
      reps: 15, effort: 120, rest: 60 },
    { type: 'intervals', group: 'Intervals', label: '(02:00 + 01:00) x 20',
      reps: 20, effort: 120, rest: 60 },
    { type: 'intervals', group: 'Intervals', label: '(02:00 + 01:00) x 25',
      reps: 25, effort: 120, rest: 60 },
    { type: 'intervals', group: 'Intervals', label: '(02:00 + 01:00) x 30',
      reps: 30, effort: 120, rest: 60 },
    { type: 'intervals', group: 'Intervals', label: '(02:00 + 01:00) x 40',
      reps: 40, effort: 120, rest: 60 },

    { type: 'generic', group: 'britishrowing.org',
      label: 'Intermediate - Week 1 - Session 1',
      plan: [
        'e: 02:00 @ 20 spm',
        'e: 02:00 @ 22 spm',
        'e: 02:00 @ 24 spm',
        'e: 02:00 @ 22 spm',
        'e: 02:00 @ 20 spm',
      ].join('\n') },
    { type: 'generic', group: 'britishrowing.org',
      label: 'Intermediate - Week 1 - Session 2',
      plan: [
        'e: 01:00',
        'r: 01:30',
        'e: 01:00',
        'r: 01:30',
        'e: 01:00',
        'r: 01:30',
        'r: 03:00',
        'e: 01:00',
        'r: 01:30',
        'e: 01:00',
        'r: 01:30',
        'e: 01:00',
        'r: 01:30',
      ].join('\n') },
  ];

  // the five phase colours; keep in step with the fallbacks in style.css. One
  // value each: the bottom bar and the page background are color-mix()ed from it
  const PHASE_COLORS = {
    warmup: '#f2a63a',
    effort: '#ff5c3d',
    rest: '#35b7ff',
    cooldown: '#2fd6a6',
    done: '#9ab0c6',
  };

  // on-screen order, which is also the order a session runs in
  const COLOR_FIELDS = ['warmup', 'effort', 'rest', 'cooldown', 'done'];

  // the plan the Generic tab opens on: week 1 session 1 of the British Rowing
  // intermediate programme, verbatim, so the format is plain from the first look
  const DEFAULT_PLAN = [
    '#: britishrowing.org',
    '#: Intermediate - Week 1 - Session 1',
    'e: 02:00 @ 20 spm',
    'e: 02:00 @ 22 spm',
    'e: 02:00 @ 24 spm',
    'e: 02:00 @ 22 spm',
    'e: 02:00 @ 20 spm',
  ].join('\n');

  const DEFAULTS = {
    reps: 24,
    effort: 105,
    rest: 45,
    warmup: 60,
    cooldown: 60,
    // the Generic and Programs tabs keep their own warm up and cool down,
    // independent of the ones above, so each can carry a different opening and
    // closing without disturbing the others
    genWarmup: 60,
    genCooldown: 60,
    plan: DEFAULT_PLAN,
    progWarmup: 60,
    progCooldown: 60,
    // the same block the manual defaults above describe, so the two tabs open
    // on the same workout; falls back to the first entry if it ever leaves
    // the list
    program: Math.max(0, findIntervals({ reps: 24, effort: 105, rest: 45 })),
    config: 'programs', // the tab whose settings Start will run
    notice: 5, // seconds of blinking and blips before a phase ends
    fullscreen: true,
    allowSkip: true, // the Skip button on the timer screen, until it is cleared
    colors: Object.assign({}, PHASE_COLORS),
  };


  // A rest is scheduled after every repetition, including the last one, before
  // the cool-down. Set to false to drop that final rest.
  const INCLUDE_TRAILING_REST = true;

  const STORAGE_KEY = 'dolfin.settings.v1';
  const MAX_SECONDS = 6 * 3600;
  // well past any session anybody rows, and low enough that the timeline it
  // builds -- two segments per repetition -- stays a sane thing to draw
  const MAX_REPS = 999;
  // the same guard for a generic plan, on both the phases it builds and the text
  // it is read from, which also bounds what goes into storage
  const MAX_PLAN_CHARS = 20000;
  const MAX_PLAN_SEGMENTS = 999;
  const RANGE_MAX = 300; // the sliders cover 0..5 minutes; type for anything longer

  // the boxes of the strip are told apart by the track showing between them. The
  // gaps share out a slice of the width rather than taking a fixed size each, so
  // they stay wide while the phases are few and thin out as they multiply,
  // instead of crowding the boxes out; the cap keeps a short plan from being
  // mostly gap. Both are percentages of the strip.
  const STRIP_GAP_SHARE = 12;
  const STRIP_GAP_MAX = 1.2;
  // past this many phases a box would be thinner than a hairline, so the strip
  // is drawn as one band instead
  const STRIP_MAX_BOXES = 1000;

  // both lists follow the on-screen order, so the first invalid field gets focus
  const TIME_FIELDS = [
    'prog-warmup', 'prog-cooldown', 'warmup', 'effort', 'rest', 'cooldown',
    'gen-warmup', 'gen-cooldown', 'notice',
  ];
  // the plan rides along: it has an error box, a tab to be revealed in and a
  // total to keep live, like every other field, it just holds no single value
  const ALL_FIELDS = [
    'prog-warmup', 'prog-cooldown', 'warmup', 'reps', 'effort', 'rest', 'cooldown',
    'gen-warmup', 'plan', 'gen-cooldown', 'notice',
  ];

  // shown as a bare number rather than hh:mm:ss
  const PLAIN_FIELDS = ['reps', 'notice'];

  // the setup form is split in four panels; the first one is shown on load
  const TABS = ['programs', 'intervals', 'generic', 'customization'];

  // the three panels that describe a session; Customization only holds
  // preferences, so visiting it leaves the choice of which one Start runs alone
  const CONFIG_TABS = ['programs', 'intervals', 'generic'];

  // which panel holds each field, so a failed validation can reveal it
  const FIELD_TAB = {
    warmup: 'intervals',
    reps: 'intervals',
    effort: 'intervals',
    rest: 'intervals',
    cooldown: 'intervals',
    'gen-warmup': 'generic',
    plan: 'generic',
    'gen-cooldown': 'generic',
    'prog-warmup': 'programs',
    'prog-cooldown': 'programs',
    notice: 'customization',
  };

  // what each configuration owns on the setup screen, in on-screen order: the two
  // duration fields, the field that gets the focus and the blame when there is
  // nothing to run, the message that goes with it, and its total readout
  const CONFIG_FIELDS = {
    intervals: {
      warmup: 'warmup',
      cooldown: 'cooldown',
      focus: 'reps',
      empty: 'Nothing to run: add a warm up, a cool down or a repetition.',
      total: 'summary-total',
    },
    generic: {
      warmup: 'gen-warmup',
      cooldown: 'gen-cooldown',
      focus: 'plan',
      empty: 'Nothing to run: add a warm up, a cool down or a phase.',
      total: 'gen-summary-total',
    },
    programs: {
      warmup: 'prog-warmup',
      cooldown: 'prog-cooldown',
      focus: 'prog-warmup',
      empty: 'Nothing to run: add a warm up, a cool down or a repetition.',
      total: 'prog-summary-total',
    },
  };

  // what a plan line may open with, and how it reads on the session screen
  const PLAN_KINDS = { e: 'effort', r: 'rest' };

  // "e: 02:00 @ 20 spm": a kind, a duration, and an optional label after the @.
  // The kind is left wide open so a typo is reported rather than mistaken for
  // something else
  const PLAN_SEGMENT = /^([a-z]+)\s*:\s*([^@]*?)\s*(?:@\s*(.*))?$/i;

  const LABEL = {
    warmup: 'WARM UP',
    effort: 'EFFORT',
    rest: 'REST',
    cooldown: 'COOL DOWN',
  };

  // -- dom ----------------------------------------------------------------

  const $ = (id) => document.getElementById(id);

  const els = {
    body: document.body,
    setup: $('setup'),
    session: $('session'),
    form: $('setup-form'),
    resetBtn: $('reset-btn'),
    startBtn: $('start-btn'),
    endBtn: $('end-btn'),
    program: $('program'),
    phaseName: $('phase-name'),
    phaseLabel: $('phase-label'),
    repCounter: $('rep-counter'),
    phaseBar: $('phase-bar'),
    phaseFill: $('phase-bar-fill'),
    countdown: $('countdown'),
    nextUp: $('next-up'),
    overallStrip: $('overall-strip'),
    overallVeil: $('overall-veil'),
    overallRemaining: $('overall-remaining'),
    pausedOverlay: $('paused-overlay'),
    fullscreen: $('fullscreen'),
    allowSkip: $('allow-skip'),
    defaultColorsBtn: $('default-colors-btn'),
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

  CONFIG_TABS.forEach((t) => {
    els[CONFIG_FIELDS[t].total] = $(CONFIG_FIELDS[t].total);
  });

  COLOR_FIELDS.forEach((k) => {
    els['color-' + k] = $('color-' + k);
  });

  // -- parsing / formatting -----------------------------------------------

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

  /** Reads the plan text into a list of { kind, secs, label } phases. Blank lines
      and lines opening with '#' are skipped; a line may hold several phases
      separated by ';', which is the one-line form of the same workout. Returns
      { segments: [...], error: null }, or { segments: null, error: 'Line 4: ...' }. */
  function parsePlan(text) {
    const segments = [];
    const lines = String(text == null ? '' : text).split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // the comment is spotted before the split, so a title may contain a ';'
      if (line === '' || line.charAt(0) === '#') continue;

      const where = 'Line ' + (i + 1) + ': ';
      const chunks = line.split(';');

      for (let j = 0; j < chunks.length; j++) {
        const chunk = chunks[j].trim();
        if (chunk === '') continue;

        const parts = PLAN_SEGMENT.exec(chunk);
        const kind = parts ? PLAN_KINDS[parts[1].toLowerCase()] : null;
        if (!kind) {
          return {
            segments: null,
            error: where + 'use "e: mm:ss" for an effort or "r: mm:ss" for a rest,'
              + ' with an optional "@ label".',
          };
        }

        const secs = parseDuration(parts[2]);
        if (secs === null) {
          return { segments: null, error: where + 'use hh:mm:ss, mm:ss or plain seconds.' };
        }
        if (secs === 0) {
          return { segments: null, error: where + 'the time must be greater than zero.' };
        }
        if (segments.length === MAX_PLAN_SEGMENTS) {
          return {
            segments: null,
            error: 'Too many phases: keep the plan to ' + MAX_PLAN_SEGMENTS + '.',
          };
        }

        segments.push({
          kind: kind,
          secs: secs,
          label: parts[3] ? parts[3].trim() : '',
        });
      }
    }

    return { segments: segments, error: null };
  }

  /** Numbers the phases of a plan by the group each belongs to, and returns how
      many groups there are. A group is an effort and the rest after it, the pair
      the counter on the session screen counts -- but a plan is free to depart
      from that pattern, so the rule is that an effort opens a group and a rest
      closes the one it is in. A rest following a rest therefore stands as a group
      of its own, and so does a plan of nothing but efforts, one per effort. */
  function numberPlan(segments) {
    let rep = 0;
    let open = false; // whether the group being numbered can still take a phase

    segments.forEach((seg) => {
      if (seg.kind === 'effort' || !open) {
        rep++;
        open = true;
      }
      if (seg.kind === 'rest') open = false;
      seg.rep = rep;
    });

    return rep;
  }

  /** Reads a field's box: a plain count for reps, a duration for the rest. */
  function parseField(field, text) {
    // free text, several phases at a time: there is no single value to read
    if (field === 'plan') return null;
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

  // -- settings -----------------------------------------------------------

  // the last known good state of the whole setup screen, both configurations;
  // replaced at boot by loadSettings(), which owns its colours (see freshDefaults)
  let settings = freshDefaults();

  /** Fills the combobox from PROGRAMS: an optgroup per group, an option per
      program, reading the label it carries. A change of group opens the next
      optgroup, so the list only has to keep the rows of a group together.
      Called once, at boot. */
  function fillPrograms() {
    let group = null;

    PROGRAMS.forEach((p, i) => {
      if (group === null || group.label !== p.group) {
        group = document.createElement('optgroup');
        group.label = p.group;
        els.program.appendChild(group);
      }
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = p.label;
      group.appendChild(option);
    });
  }

  /** Where an interval block sits in the list, or -1 if it is not there. The
      defaults name a program this way, and so did the value stored back when
      every program was an interval block. */
  function findIntervals(p) {
    return PROGRAMS.findIndex(
      (q) => q.type === 'intervals' && q.reps === p.reps
        && q.effort === p.effort && q.rest === p.rest
    );
  }

  /** Where a stored program sits in the list now, or -1 if it is gone. A program
      is named by the group and the label it is shown under, a pair that survives
      the list growing or being reordered. */
  function findProgram(p) {
    if (!p || typeof p !== 'object') return -1;
    if (typeof p.label === 'string') {
      return PROGRAMS.findIndex((q) => q.group === p.group && q.label === p.label);
    }
    return findIntervals(p);
  }

  /** Reads the plan of every generic program into the phases it spells out, once,
      at boot. The plans ship with the app, so they parse by construction; a
      program then carries its segments and its repetitions the way a plan typed
      into the Generic tab does. */
  function preparePrograms() {
    PROGRAMS.forEach((p) => {
      if (p.type !== 'generic') return;
      p.segments = parsePlan(p.plan).segments || [];
      p.reps = numberPlan(p.segments);
    });
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

    if (name === 'generic') {
      const parsed = parsePlan(els.plan.value);
      if (parsed.error) {
        errors.plan = parsed.error;
      } else {
        values.segments = parsed.segments;
        // the groups of a plan are its repetitions, so the counter on the session
        // screen reads the same as it does for the other two tabs
        values.reps = numberPlan(parsed.segments);
      }
    } else if (name === 'programs') {
      const p = currentProgram();
      if (p.type === 'generic') {
        // the plan was read at boot; its groups are its repetitions, so the
        // counter on the session screen reads as it does on the Generic tab
        values.segments = p.segments;
        values.reps = p.reps;
      } else {
        // the effort block comes from the list, so it cannot be out of range
        values.reps = p.reps;
        values.effort = p.effort;
        values.rest = p.rest;
      }
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
      errors[fields.focus] = fields.empty;
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

  /** Pushes the chosen phase colours onto the root, where the CSS picks them up
      as the fallbacks of the five body.phase-* rules. */
  function applyColors(colors) {
    COLOR_FIELDS.forEach((k) => {
      document.documentElement.style.setProperty('--color-' + k, colors[k]);
    });
  }

  /** Reads the five swatches. Anything a browser hands back is already a valid
      "#rrggbb", so there is nothing to reject here. */
  function readColors() {
    const colors = {};
    COLOR_FIELDS.forEach((k) => {
      colors[k] = els['color-' + k].value;
    });
    return colors;
  }

  /** The stored key each duration field is filled from and saved back into. */
  const FIELD_KEY = {
    warmup: 'warmup',
    effort: 'effort',
    rest: 'rest',
    cooldown: 'cooldown',
    'gen-warmup': 'genWarmup',
    'gen-cooldown': 'genCooldown',
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
    els.plan.value = cfg.plan;
    els.program.value = String(cfg.program);
    els.fullscreen.checked = cfg.fullscreen !== false;
    els.allowSkip.checked = cfg.allowSkip === true;
    COLOR_FIELDS.forEach((k) => {
      els['color-' + k].value = cfg.colors[k];
    });
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

    // stored as typed, invalid lines and all: a plan half written is still worth
    // coming back to, unlike a box that will not parse into a number
    cfg.plan = els.plan.value.slice(0, MAX_PLAN_CHARS);
    cfg.program = selectedProgram();
    cfg.config = activeConfig;
    cfg.fullscreen = els.fullscreen.checked === true;
    cfg.allowSkip = els.allowSkip.checked === true;
    cfg.colors = readColors();

    return cfg;
  }

  /** Rewrites one configuration's boxes in canonical form, after a start. */
  function canonicalize(name) {
    const fields = CONFIG_FIELDS[name];
    const list =
      name === 'intervals'
        ? ['warmup', 'effort', 'rest', 'cooldown']
        : [fields.warmup, fields.cooldown];

    list.forEach((f) => {
      const secs = parseDuration(els[f].value);
      if (secs === null) return;
      els[f].value = formatField(f, secs);
      syncRange(f, secs);
    });
  }

  /** A copy of the defaults that owns its colours: Object.assign is shallow, so
      without this the caller would hold a reference to DEFAULTS.colors itself. */
  function freshDefaults() {
    return Object.assign({}, DEFAULTS, { colors: Object.assign({}, PHASE_COLORS) });
  }

  function loadSettings() {
    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (err) {
      stored = null;
    }
    if (!stored || typeof stored !== 'object') return freshDefaults();

    const cfg = freshDefaults();
    if (Number.isInteger(stored.reps) && stored.reps >= 0 && stored.reps <= MAX_REPS) {
      cfg.reps = stored.reps;
    }
    TIME_FIELDS.forEach((f) => {
      const key = FIELD_KEY[f];
      if (Number.isInteger(stored[key]) && stored[key] >= 0 && stored[key] <= MAX_SECONDS) {
        cfg[key] = stored[key];
      }
    });
    if (typeof stored.plan === 'string' && stored.plan.length <= MAX_PLAN_CHARS) {
      cfg.plan = stored.plan;
    }
    const found = findProgram(stored.program);
    if (found !== -1) cfg.program = found;
    // 3.0.0 development builds stored a bare index; honour one that still fits
    else if (Number.isInteger(stored.program) && stored.program >= 0
             && stored.program < PROGRAMS.length) {
      cfg.program = stored.program;
    }
    if (CONFIG_TABS.indexOf(stored.config) !== -1) cfg.config = stored.config;
    if (typeof stored.fullscreen === 'boolean') cfg.fullscreen = stored.fullscreen;
    if (typeof stored.allowSkip === 'boolean') cfg.allowSkip = stored.allowSkip;
    // each colour is checked on its own, so one bad entry cannot lose the rest
    if (stored.colors && typeof stored.colors === 'object') {
      COLOR_FIELDS.forEach((k) => {
        if (/^#[0-9a-f]{6}$/i.test(stored.colors[k])) cfg.colors[k] = stored.colors[k];
      });
    }
    return cfg;
  }

  function saveSettings(cfg) {
    try {
      // the program goes out by name rather than by index, so growing or
      // reordering PROGRAMS later cannot silently move somebody's saved choice
      const p = PROGRAMS[cfg.program];
      const out = Object.assign({}, cfg, {
        program: { group: p.group, label: p.label },
      });
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

  // -- timeline -----------------------------------------------------------

  /** Flat list of segments with cumulative offsets; zero-length ones dropped. */
  function buildTimeline(cfg) {
    const segs = [];
    let t = 0;

    function push(kind, secs, rep, label) {
      if (secs <= 0) return;
      const ms = secs * 1000;
      segs.push({ kind: kind, rep: rep, label: label || '', ms: ms, start: t, end: t + ms });
      t += ms;
    }

    push('warmup', cfg.warmup, 0);
    if (cfg.segments) {
      // a generic plan spells its phases out, each carrying the number of the
      // group it belongs to, which numberPlan() worked out when it was read
      cfg.segments.forEach((seg) => push(seg.kind, seg.secs, seg.rep, seg.label));
    } else {
      for (let r = 1; r <= cfg.reps; r++) {
        push('effort', cfg.effort, r);
        if (INCLUDE_TRAILING_REST || r < cfg.reps) push('rest', cfg.rest, r);
      }
    }
    push('cooldown', cfg.cooldown, 0);

    return { segs: segs, totalMs: t };
  }

  function totalSeconds(cfg) {
    // a generic plan brings its own phases; the other two describe a block of
    // repetitions instead
    if (cfg.segments) {
      return cfg.segments.reduce((sum, seg) => sum + seg.secs, cfg.warmup + cfg.cooldown);
    }
    const rests = INCLUDE_TRAILING_REST ? cfg.reps : cfg.reps - 1;
    return cfg.warmup + cfg.reps * cfg.effort + Math.max(0, rests) * cfg.rest + cfg.cooldown;
  }

  // -- audio cues ---------------------------------------------------------

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

  // -- full screen --------------------------------------------------------

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

  // -- wake lock ----------------------------------------------------------

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

  // -- session ------------------------------------------------------------

  let session = null;

  function setText(el, value) {
    if (el.textContent !== value) el.textContent = value;
  }

  /** A reading centred in a bar: past `fits` characters it drops a size. */
  function setBigText(el, value, fits) {
    setText(el, value);
    el.classList.toggle('long', value.length > fits);
  }

  /** The top bar holds the countdown, and under it, on a line of its own, the
      label of the phase it belongs to, if it has one. The bar is told how many
      characters that label runs to, which is one of the things that sizes the
      pair: a longer label is drawn smaller, so it still fits the width. */
  function setReading(clock, label) {
    // the step-down only applies while the countdown has the bar to itself: with
    // a label under it, the two-line budget decides the size instead
    setBigText(els.countdown, clock, 5);
    setText(els.phaseLabel, label ? '@ ' + label : '');
    els.phaseBar.classList.toggle('labelled', !!label);

    // the '@ ' it is printed with counts, the label line being the wider of the
    // two and so the one that sizes them; never zero, it being a divisor
    const chars = label ? label.length + 2 : 1;
    if (chars !== session.lastChars) {
      session.lastChars = chars;
      els.phaseBar.style.setProperty('--label-chars', String(chars));
    }
  }

  /** Draws the session as a row of boxes, one per phase, each as wide a share of
      the strip as its duration is of the session, and in the colour of its kind.
      Too many phases to tell apart and the strip is left as one band instead:
      the veil over it reads the same either way. */
  function buildStrip(timeline) {
    const count = timeline.segs.length;
    const strip = els.overallStrip;

    strip.textContent = '';
    strip.classList.toggle('plain', count > STRIP_MAX_BOXES);
    strip.style.setProperty('--seg-gap',
      (count > 1 ? Math.min(STRIP_GAP_MAX, STRIP_GAP_SHARE / (count - 1)) : 0) + '%');
    if (count > STRIP_MAX_BOXES) return;

    // one insertion, so a long session does not lay the strip out over and over
    const batch = document.createDocumentFragment();
    timeline.segs.forEach((seg) => {
      const box = document.createElement('div');
      box.className = 'strip-seg strip-seg-' + seg.kind;
      box.style.flexGrow = String(seg.ms);
      batch.appendChild(box);
    });
    strip.appendChild(batch);
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
      lastChars: -1,
      lastPercent: -1,
    };

    buildStrip(timeline);
    // nothing run yet, so the veil covers the whole strip
    setBar(els.overallVeil, 1);

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
    setReading(formatClock(remainSec), seg.label);
    setBigText(els.repCounter, repLabel(seg), 7);
    setText(els.nextUp, nextLabel(session.index));
    setBar(els.phaseFill, inPhase / seg.ms);
    // the veil covers what is left, so it shrinks towards the right as time goes
    setBar(els.overallVeil, 1 - elapsed / session.totalMs);
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
    setReading('0:00', '');
    setBigText(els.repCounter, 'Workout Completed', 7);
    setText(els.nextUp, '');
    setText(els.overallRemaining, '00:00:00');
    setBar(els.phaseFill, 1);
    setBar(els.overallVeil, 0);
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
    els.overallStrip.textContent = ''; // a long session holds a lot of boxes
    els.body.classList.remove('screen-session');
    els.body.classList.add('screen-setup');
    if (els.body.dataset.phase) {
      els.body.classList.remove(els.body.dataset.phase);
      delete els.body.dataset.phase;
    }
    selectTab(activeConfig);
    els[CONFIG_FIELDS[activeConfig].focus].focus({ preventScroll: true });
  }

  // -- setup tabs ---------------------------------------------------------

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

  // -- setup screen wiring ------------------------------------------------

  /** Every total stays live, so each is already right when you switch to it. */
  function updateSummary() {
    CONFIG_TABS.forEach((name) => {
      const read = readConfig(name);
      const ok = Object.keys(read.errors).length === 0;
      setText(
        els[CONFIG_FIELDS[name].total],
        ok ? formatHMS(totalSeconds(read.values)) : '-'
      );
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
    settings = freshDefaults();
    fillForm(settings);
    applyColors(settings.colors);
    showErrors({});
    updateSummary();
    selectTab(TABS[0]);
    els[CONFIG_FIELDS[TABS[0]].focus].focus();
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

  COLOR_FIELDS.forEach((k) => {
    // live, so what the swatch shows and what a session would use never differ
    els['color-' + k].addEventListener('input', () => applyColors(readColors()));
  });

  els.defaultColorsBtn.addEventListener('click', () => {
    COLOR_FIELDS.forEach((k) => {
      els['color-' + k].value = PHASE_COLORS[k];
    });
    applyColors(PHASE_COLORS);
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

  // -- session screen wiring ----------------------------------------------

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

  // -- boot ---------------------------------------------------------------

  preparePrograms();
  fillPrograms();
  settings = loadSettings();
  fillForm(settings);
  applyColors(settings.colors);
  showErrors({});
  updateSummary();
  selectTab(settings.config);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./precache.js').catch(() => {});
    });
  }
})();
