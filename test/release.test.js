import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { changelogSection, checkRelease, parseVersion } from '../scripts/release.mjs'

const changelog = `# Changelog

## [Unreleased]

## [0.1.0-alpha.2] - 2026-11-02

- Second.

## [0.1.0-alpha.1] - 2026-10-25

- First.
`

describe('release rules', () => {
  it('parses alpha, beta and stable versions', () => {
    expect(parseVersion('0.1.0-alpha.3')).toMatchObject({ prerelease: 'alpha.3', channel: 'alpha' })
    expect(parseVersion('1.0.0')).toMatchObject({ prerelease: null, channel: 'stable' })
    expect(parseVersion('0.1.0-alpha')).toBeNull()
    expect(parseVersion('0.1')).toBeNull()
  })

  it('extracts just the requested changelog entry', () => {
    expect(changelogSection(changelog, '0.1.0-alpha.2')).toBe('- Second.')
    expect(changelogSection(changelog, '0.1.0-alpha.1')).toBe('- First.')
    expect(changelogSection(changelog, '0.1.0-alpha.9')).toBeNull()
  })

  it('requires an alpha version with a changelog entry during alpha', () => {
    expect(checkRelease({ version: '0.1.0-alpha.2', changelog })).toEqual([])
    expect(checkRelease({ version: '0.1.0', changelog })[0]).toMatch(/must be an alpha prerelease/)
    expect(checkRelease({ version: '0.1.0-alpha.9', changelog })).toEqual(['CHANGELOG.md has no entry for [0.1.0-alpha.9]'])
  })

  it('passes for the version this repo is on', () => {
    const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
    const repoChangelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8')
    expect(checkRelease({ version, changelog: repoChangelog })).toEqual([])
  })
})

describe('supabase settings', async () => {
  const { normalizeSupabaseUrl } = await import('../src/api/shared.js')
  it('accepts the project URL in the forms people paste', () => {
    for (const input of ['https://abc.supabase.co', 'https://abc.supabase.co/', ' https://abc.supabase.co/rest/v1/ ', 'https://abc.supabase.co/rest/v1']) {
      expect(normalizeSupabaseUrl(input)).toBe('https://abc.supabase.co')
    }
    expect(normalizeSupabaseUrl(undefined)).toBe('')
  })
})

describe('build numbers', async () => {
  const { execSync } = await import('node:child_process')
  const { mkdtempSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { buildNumber, releaseTag } = await import('../scripts/release.mjs')

  it('goes up by one for each merge to main, however many commits it brings', () => {
    const dir = mkdtempSync(join(tmpdir(), 'central-build-'))
    const git = (cmd) => execSync(`git -c user.name=t -c user.email=t@t -c init.defaultBranch=main ${cmd}`, { cwd: dir, stdio: 'ignore' })
    git('init')
    git('commit --allow-empty -m initial')
    expect(buildNumber(dir)).toBe(1)
    git('checkout -b feature')
    git('commit --allow-empty -m one')
    git('commit --allow-empty -m two')
    git('checkout main')
    git('merge --no-ff feature -m "Merge feature"')
    expect(buildNumber(dir)).toBe(2)
  })

  it('returns null outside a git checkout', () => {
    expect(buildNumber(tmpdir())).toBeNull()
  })

  it('tags each build with semver build metadata', () => {
    expect(releaseTag('0.1.0-alpha.1', 6)).toBe('v0.1.0-alpha.1+build.6')
  })
})
