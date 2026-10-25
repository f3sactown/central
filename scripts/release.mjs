// Release helpers, used by CI and runnable locally:
//   node scripts/release.mjs check   validate the version and its changelog entry
//   node scripts/release.mjs notes   print the changelog entry for this version
//   node scripts/release.mjs info    print version, tag and prerelease flag

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Semver with an optional prerelease, e.g. 0.1.0-alpha.1.
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:alpha|beta|rc)\.(?:0|[1-9]\d*)))?$/

// The current phase. Versions must carry this prerelease label until it changes.
export const RELEASE_CHANNEL = 'alpha'

export function parseVersion(version) {
  const m = SEMVER.exec(version)
  if (!m) return null
  return { version, prerelease: m[4] || null, channel: m[4] ? m[4].split('.')[0] : 'stable' }
}

// Returns the body of the "## [version]" section of a Keep a Changelog file.
export function changelogSection(changelog, version) {
  const lines = changelog.split(/\r?\n/)
  const heading = new RegExp(`^## \\[${version.replace(/[.]/g, '\\.')}\\]`)
  const start = lines.findIndex((l) => heading.test(l))
  if (start === -1) return null
  let end = lines.findIndex((l, i) => i > start && /^## /.test(l))
  if (end === -1) end = lines.length
  return lines.slice(start + 1, end).join('\n').trim()
}

export function checkRelease({ version, changelog, channel = RELEASE_CHANNEL }) {
  const errors = []
  const parsed = parseVersion(version)
  if (!parsed) errors.push(`package.json version "${version}" is not valid semver like 0.1.0-${channel}.1`)
  else if (parsed.channel !== channel) errors.push(`version "${version}" must be an ${channel} prerelease (e.g. 0.1.0-${channel}.1) during the ${channel} phase`)
  if (!changelogSection(changelog, version)) errors.push(`CHANGELOG.md has no entry for [${version}]`)
  return errors
}

function main() {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const { version } = JSON.parse(readFileSync(root + 'package.json', 'utf8'))
  const changelog = readFileSync(root + 'CHANGELOG.md', 'utf8')
  const cmd = process.argv[2]
  if (cmd === 'check') {
    const errors = checkRelease({ version, changelog })
    for (const e of errors) console.error('✗ ' + e)
    if (errors.length) process.exit(1)
    console.log(`✓ v${version} is a valid ${RELEASE_CHANNEL} release with a changelog entry`)
  } else if (cmd === 'notes') {
    console.log(changelogSection(changelog, version) || '')
  } else if (cmd === 'info') {
    const parsed = parseVersion(version)
    console.log(`version=${version}\ntag=v${version}\nprerelease=${parsed?.prerelease ? 'true' : 'false'}`)
  } else {
    console.error('usage: node scripts/release.mjs check|notes|info')
    process.exit(2)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
