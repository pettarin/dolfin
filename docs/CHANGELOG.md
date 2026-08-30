# Changelog

All notable changes to this project will be documented in this file.

> [!NOTE]
> The format is based on
> [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
> and this project adheres to
> [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [3.1.0] - 2026-08-30

### Added

- The "Show progress panel" setting in the "Customization" tab, choosing how
  much of the Workout screen the session panel takes: "Small", the default,
  is the third of the height it has always had; "Large" splits the screen
  into two equal bands; "Hide" drops the panel altogether, leaving the phase
  the screen down to the buttons. Every reading is sized for the room its
  band has under the value chosen, and under "Hide" the phase caption takes
  in the repetition the panel would have carried, as "EFFORT 2/5".


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
  syntax the "Generic" tab takes. The forty-six British Rowing sessions in
  the `res/` directory all come as programs of that kind, in a group per
  level: Beginner, then Intermediate, then Advanced.

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
  "Default colours" button is now "Reset colours".
- The setup screen is now split in four tabs: "Programs", "Intervals",
  "Generic", and "Customizations"; it opens on "Programs" rather than on
  "Intervals", and the tab strip wraps to two rows on a narrow screen.
- The setup card now hangs from the top of the screen rather than sitting
  in the middle of it, so switching tab no longer moves the head and the
  tab strip up or down as the panels differ in height.
- The "Allow skipping phase" setting is now on by default,
  so the "Skip" button is there unless it is cleared.
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
