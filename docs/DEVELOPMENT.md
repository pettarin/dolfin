# Development

## Project Structure

```
.
├── AGENTS.md                           <- directions for coding agents
├── docs                                <- documentation
│   ├── CHANGELOG.md                    <- releases and their changes
│   ├── CODE_OF_CONDUCT.md              <- ground rules of the project spaces
│   ├── CONTRIBUTING.md                 <- how to report issues and contribute code
│   ├── DEVELOPMENT.md                  <- this file
│   ├── ROADMAP.md                      <- planned work, broken down by future milestone
│   └── SECURITY.md                     <- supported versions and how to report a vulnerability
├── dolfin                              <- document root, can be served behind a Web server
│   ├── dolfin.js                       <- programs, parsing, timeline, clock, cues, persistence
│   ├── icon-180.png                    <- apple-touch-icon, rendered from icon.svg
│   ├── icon-192.png                    <- PWA icon, rendered from icon.svg
│   ├── icon-512.png                    <- PWA icon, also the maskable one, from icon.svg
│   ├── icon.svg                        <- the ferro di prua, source of the PNG icons above
│   ├── index.html                      <- both screens, setup and session
│   ├── manifest.json                   <- PWA metadata
│   ├── precache.js                     <- service worker: cache-first precache, for offline use
│   └── style.css                       <- dark theme, and the layout of both screens
├── imgs                                <- screenshots for the README
│   ├── phases_cool_down.png
│   ├── phases_effort.png
│   ├── phases_effort_label.png
│   ├── phases_end_of_workout.png
│   ├── phases_rest.png
│   ├── phases_warm_up.png
│   ├── setup_customization.png
│   ├── setup_generic.png
│   ├── setup_intervals.png
│   └── setup_programs.png
├── LICENSE                             <- full text of the license for this project
├── Makefile                            <- poor man's automation for local development
├── README.md                           <- main README file
├── res                                 <- miscellaneous resources
│   └── britishrowing.org               <- britishrowing.org training programs
│       ├── advanced                    <- 15 sessions, as week_N_session_M.txt
│       ├── beginner                    <- 16 sessions
│       └── intermediate                <- 15 sessions
└── VERSION                             <- version of dolfin
```

The whole app is the files in `dolfin/` directory:
no build step, no dependencies, no bundler.

Deploying means copying the contents of that directory to the document root;
everything above it is project documentation.


## Browser Support

Any reasonably recent browser is supported.

`AudioContext`, `localStorage`, the Fullscreen API,
and the Screen Wake Lock API are each used defensively:
if a browser lacks support for a feature,
that feature is skipped and the timer itself is unaffected.

On iOS the way to get a full-screen session
is to install **dolfin** to the home screen,
where it opens without browser chrome anyway.


## Branching And Versioning Policy

### Branch `main`

- Branch `main` is protected, and it represents the sources of the latest stable release.
- Only the maintainer is allowed to push there directly,
  usually merging the `devel` branch when preparing a new release.
- Published releases are from commit tagged `vX.Y.Z`.

### Branch `devel`

- Branch `devel` is protected, and it accumulates fixes and features for the next release.
- The maintainer is allowed to push there directly,
  usually merging feature or fix branches.
- Other contributors should open pull requests
  (see the [CONTRIBUTING](CONTRIBUTING.md) document)
  against the `devel` branch, which will be reviewed and, if appropriate, merged.

### Other Branches

- Fix branches should be named `fix/gh_#123_short_description`
  where `#123` is the ID of the GitHub issue being fixed.
- Feature branches should be named `feature/gh_#456_short_description`
  where `#456` is the ID of the GitHub issue describing the requested feature.
- In both cases, it is mandatory to have a GitHub issue
  describing the issue being fixed or the new feature being added.
- No need to squash commits on a fix or feature branch,
  just try to have meaningful commit messages if you have more than one commit.
  Usually it is preferable referencing the GitHub issue
  (`Fixes #123 ...` or `Implement #456 ...`) in the commit message.

### Versioning

- This project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## Contributing

See the
[CONTRIBUTING](CONTRIBUTING.md)
document.

