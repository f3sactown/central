# Working on Central

Owner's standing rules for changes to this repository:

- **Branches and pull requests.** Every change goes on a branch with a pull
  request against `main`. Never push directly to `main`. Merge only when the
  owner says to.
- **Work in the cloud.** Nothing gets installed on the owner's local Windows PC.
- **Builds and releases are automatic.** Each merge to `main` gets the next
  build number and its own GitHub pre-release (see `RELEASING.md`). Don't
  add manual steps for this.
- **Versions need approval.** Keep the current version for small changes.
  When a change is bigger (new features, data or schema changes, anything
  testers would notice), ask the owner whether to bump the version before
  merging. Never bump it without asking.
- **Changelog.** Add notable changes under `## [Unreleased]` in
  `CHANGELOG.md`.

Checks to run before pushing: `npm run release:check`, `npm test`,
`npm run build`.
