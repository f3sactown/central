# Releasing Central

Central is in **alpha**. Every version is a prerelease such as
`0.1.0-alpha.1`. CI refuses any other version until the phase changes
(`RELEASE_CHANNEL` in `scripts/release.mjs`).

## What runs automatically

- **Every push to `main`** deploys the site to GitHub Pages. The app shows an
  ALPHA badge, and the version and build number appear in the account menu
  and page footer (e.g. `v0.1.0-alpha.1 · build 14 (a1b2c3d)`). The same
  details are published at `version.json` on the site.
- **When `main` has a version that hasn't been released yet**, the
  *Release* workflow tags it (`v0.1.0-alpha.1`), creates a GitHub Release
  marked **pre-release** with that version's CHANGELOG entry as the notes,
  and attaches the built site as a zip.
- **Every pull request** checks that the version is a valid alpha version
  and that `CHANGELOG.md` has an entry for it.

## Cutting a new alpha

In the pull request that should become the next release:

1. Run `npm run release:bump`. It moves `0.1.0-alpha.1` to `0.1.0-alpha.2`,
   updating `package.json` and `package-lock.json`.
2. In `CHANGELOG.md`, rename `## [Unreleased]` to the new version and date,
   e.g. `## [0.1.0-alpha.2] - 2026-11-02`, and add a fresh empty
   `## [Unreleased]` above it.
3. Merge the pull request. The release is published automatically.

Changes merged without a version bump are deployed to the site but are not
released. They collect under `[Unreleased]` until the next bump.

## Leaving alpha

When the app moves to beta, change `RELEASE_CHANNEL` to `beta`, update the
`--preid` in the `release:bump` script, and bump to e.g. `0.2.0-beta.1`.
For the first stable release, set the channel to `stable` and use a plain
version such as `1.0.0`. Stable releases are marked *latest*, not
pre-release.
