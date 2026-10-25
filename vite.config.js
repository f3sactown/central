import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the build works at https://<owner>.github.io/<repo>/
// (routing uses the URL hash, so no server rewrites are needed).
export default defineConfig({
  base: './',
  plugins: [react()],
  test: { environment: 'node' },
})
