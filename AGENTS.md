# Instructions for coding agents

## Project Overview

This repository contains `dolfin`,
a full-screen interval timer that runs entirely in the browser,
built as a visual companion to the "Indoor row" activity on Garmin watches.

## Development Environment

### Changing Code

- Always ask for confirmation before changing any source, test, or script file
- When changing public APIs and interfaces, check if the documentation needs to be updated
- Always work on a feature or fix branch, and bump the version (in VERSION file and elsewhere) before making changes to the code
- After making a change, verify the outcome if possible

### Git Commit/Merge/Push

- Ask the user explicitly when to commit, merge branches or push to origin
- When committing, stage explicit paths, never git add -A
- No co-author trailer from the agent (e.g., Claude/Anthropic) in commit messages
- No merge/pushes until confirmed by the user

### Technology Stack

- Pure Javascript, no build step
- Code (HTML, JS, CSS) should be directly servable by a Web server like nginx
- The resulting page should be a PWA (installable on home on iOS and Android)
- Use LocalStorage to remember the last settings

### Code Style

- Add a top comments to all functions and methods describing their function
- Keep lexicographic order of constants, methods, etc. within the same source file

