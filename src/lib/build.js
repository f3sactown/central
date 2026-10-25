/* global __BUILD__ */

// Injected by vite.config.js at build time.
export const BUILD = typeof __BUILD__ !== 'undefined' ? __BUILD__ : { version: '0.0.0', channel: 'dev', number: 'local', commit: 'local', date: '' }

export const VERSION_LABEL = `v${BUILD.version} · build ${BUILD.number}${BUILD.commit !== 'local' ? ` (${BUILD.commit})` : ''}`
