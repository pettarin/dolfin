# Changelog

All notable changes to this project will be documented in this file.

> [!NOTE]
> The format is based on
> [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
> and this project adheres to
> [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [2.0.0] - 2026-08-24

### Added

- The five phase colours -- warm up, effort, rest, cool down and finished -- can
  be set on the "Customization" tab. Each one drives the phase name and the upper
  progress bar; the lower bar and the page background are computed from it. A
  "Default colours" button restores them without touching anything else.
- A "Skip" button on the timer screen, which jumps to the end of the current
  phase; skipping the last phase finishes the session. It works while paused too.
  It is offered only when the new "Allow skipping phase" setting is selected.
- A "Programs" tab, offering twenty-six ready-made effort blocks written as
  `INT: (effort time + rest time) x repetitions`. It carries its own warm up and cool
  down times, independent of the ones on "Intervals", and its own session total.
  The tab you are on when you press "Start" is the one that runs.


### Changed

- The setup screen is now split in three tabs: "Intervals" (warm up, repetitions,
  effort, rest, cool down, session total), "Programs" and "Customization"
  (full screen, transition notice time). "Intervals" is the tab shown on load.
- The "Full screen" setting is now labelled "Launch full screen".
- The "Start" button is hidden while the "Customization" tab is showing,
  since that tab describes no session to start.
- The setup screen button that starts a session is now labelled "Start"
  rather than "OK", and the button shown on the finished screen "Home".
- The button that ends a running session is now labelled "Stop" rather than
  "End", and carries the accent colour for the whole session, not only once
  the session is over.
- The default warm up and cool down times are now `00:01:00` rather than
  `00:05:00`, making the default session 1h02m rather than 1h10m.
- The finished screen reads "Workout Completed" rather than "N reps done".


## [1.0.0] - 2026-08-14

### Added

- Initial release
