import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { buildNumber, parseVersion } from './scripts/release.mjs'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// Build details. In GitHub Actions the build number counts merges to main
// (see scripts/release.mjs); local builds are labelled "local".
// Which backend the build will use. A half-configured build falls back to
// the demo, so warn loudly (as a GitHub Actions annotation in CI).
const supabaseUrl = (process.env.VITE_SUPABASE_URL || '').trim()
const supabaseKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim()
const backend = supabaseUrl && supabaseKey ? 'supabase' : 'demo'
if (Boolean(supabaseUrl) !== Boolean(supabaseKey)) {
  const missing = supabaseUrl ? 'SUPABASE_ANON_KEY' : 'SUPABASE_URL'
  const message = `Supabase is half-configured: ${missing} is empty, so this build runs in demo mode.`
  console.warn(process.env.GITHUB_ACTIONS ? `::warning title=Supabase settings::${message}` : `\n⚠ ${message}\n`)
}

const ciBuild = process.env.GITHUB_ACTIONS ? buildNumber() : null
if (process.env.GITHUB_ACTIONS && ciBuild === null) {
  throw new Error('Cannot work out the build number: check out full history (actions/checkout with fetch-depth: 0).')
}

const build = {
  version,
  backend,
  channel: parseVersion(version)?.channel || 'dev',
  number: ciBuild ?? 'local',
  commit: (process.env.GITHUB_SHA || '').slice(0, 7) || 'local',
  date: new Date().toISOString(),
}

// Publishes build details at ./version.json so anyone can check what is deployed.
function versionFile() {
  return {
    name: 'version-file',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify(build, null, 2) + '\n' })
    },
  }
}

// Relative base so the build works at https://<owner>.github.io/<repo>/
// (routing uses the URL hash, so no server rewrites are needed).
export default defineConfig({
  base: './',
  plugins: [react(), versionFile()],
  define: { __BUILD__: JSON.stringify(build) },
  test: { environment: 'node' },
})
