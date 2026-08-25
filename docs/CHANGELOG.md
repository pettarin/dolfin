# Changelog

All notable changes to this project will be documented in this file.

> [!NOTE]
> The format is based on
> [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
> and this project adheres to
> [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [3.0.0] - 2026-08-24

### Added

- The "Generic" tab, for workouts that are not a plain repetition
  of the same effort and rest: the phases are written out one per line,
  as `e: 02:00` (effort) and `r: 01:30` (rest),
  with an optional `@ 20 spm` label and `#` comments.
- The phase label of a generic workout is shown on the Workout screen
  under the countdown, on a line of its own and in the same size as it,
  for the whole phase it belongs to.
- Example workout plans, in the `res/` directory.
- Generic programs on the "Programs" tab: a program is now either an
  interval block, as before, or a workout written out phase by phase in the
  syntax the "Generic" tab takes. The two British Rowing intermediate
  sessions in the `res/` directory are the first of them.

### Changed

- The Workout screen now gives the phase being run two thirds of the height,
  and the session as a whole the remaining third.
- The bottom band of the Workout screen is now the whole session laid out
  end to end, one box per phase, each proportional to its duration and in
  the colour of its phase; what is left to run is dimmed, replacing the
  single progress bar.
- The tagline is now "indoor row companion", the workouts no longer being
  intervals only.
- The five phase colours now sit in a "Colours" box of their own on the
  "Customizations" tab, their labels dropping the word "colour", and the
  "Default colours" button is now "Reset defaults".
- The setup screen is now split in four tabs: "Intervals", "Generic",
  "Programs", and "Customizations"; the tab strip wraps to two rows
  on a narrow screen.
- Every program now carries the label it is listed by, rather than having one
  derived from its times, and the "Program" combobox groups the programs by
  where they come from. The labels of the interval programs consequently drop
  their `INT: ` prefix, the "Intervals" group heading now saying as much.


## [2.0.0] - 2026-08-24

### Added

- The "Programs" tab, containing pre-defined workout programs
  (for now only interval-type workouts).
- The "Allow skipping phase" setting in the "Customizations" tab,
  and the "Skip" button in the Workout screen.
- The capability of defining in the "Customizations" tab
  the colours used in the Workout screen.

### Changed

- The setup screen is now split in three tabs: "Intervals", "Programs",
  and "Customizations".
- The "Full screen" setting is now labelled "Launch full screen".
- The "OK" button is now labelled "Start".
- The "End" button is now labelled "Stop".
- The default warm up and cool down times are now `00:01:00`
  rather than `00:05:00`.
- The finished screen reads "Workout Completed" rather than "N reps done".
- Various UI fixes.


## [1.0.0] - 2026-08-14

### Added

- Initial release
