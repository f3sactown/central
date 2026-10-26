# Releasing Central

Central is in **alpha**. Every version is a prerelease such as
`0.1.0-alpha.1`. CI refuses any other version until the phase changes
(`RELEASE_CHANNEL` in `scripts/release.mjs`).

## Builds and releases: every merge

Each merge to `main` is a new **build**, and the build number goes up by one.
It counts the commits on `main`'s first-parent line, so it doesn't matter how
many commits a pull request had.

Every merge automatically:

- **deploys the site** to GitHub Pages. The app shows an ALPHA badge, and the
  account menu and footer show the version and build, e.g.
  `v0.1.0-alpha.1 · build 6 (a1b2c3d)`. `version.json` on the site has the
  same details.
- **publishes a GitHub pre-release** tagged `v<version>+build.<n>`, e.g.
  `v0.1.0-alpha.1+build.6`. Its notes list the pull requests merged since the
  previous build. The first build of a new version also includes that
  version's CHANGELOG entry. The built site is attached as a zip.

Every pull request is checked for a valid alpha version with a CHANGELOG
entry, and its build shows the build number it will get once merged.

## Changing the version

The version only changes when a pull request bumps it, and the owner decides
when. Small fixes keep the current version and simply get a new build. For
bigger changes, ask the owner whether to bump the version.

To bump it, in the pull request:

1. Run `npm run release:bump`. It moves `0.1.0-alpha.1` to `0.1.0-alpha.2`,
   updating `package.json` and `package-lock.json`.
2. In `CHANGELOG.md`, rename `## [Unreleased]` to the new version and date,
   e.g. `## [0.1.0-alpha.2] - 2026-11-02`, and add a fresh empty
   `## [Unreleased]` above it.
3. Merge. The next build is released under the new version.

## Leaving alpha

When the app moves to beta, change `RELEASE_CHANNEL` to `beta`, update the
`--preid` in the `release:bump` script, and bump to e.g. `0.2.0-beta.1`.
For the first stable release, set the channel to `stable` and use a plain
version such as `1.0.0`. Stable releases are marked *latest*, not
pre-release.
