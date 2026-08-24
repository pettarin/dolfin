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
- The phase label of a generic workout is shown next to the countdown
  on the Workout screen, in the same size as it,
  for the whole phase it belongs to.
- Example workout plans, in the `res/` directory.

### Changed

- The setup screen is now split in four tabs: "Intervals", "Generic",
  "Programs", and "Customizations"; the tab strip wraps to two rows
  on a narrow screen.


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
