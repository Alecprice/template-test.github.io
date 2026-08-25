import { readFile, writeFile } from 'node:fs/promises'

let vite = await readFile('vite.config.ts', 'utf8')

if (!vite.includes("return 'vendor-supabase'")) {
  const end = vite.lastIndexOf('\n})')
  if (end < 0) throw new Error('Bundle polish failed: could not locate Vite config end')
  const build = `,\n  build: {\n    rollupOptions: {\n      output: {\n        manualChunks(id) {\n          if (id.includes('node_modules/@supabase')) return 'vendor-supabase'\n          if (id.includes('node_modules/lucide-react')) return 'vendor-icons'\n          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'vendor-react'\n          return undefined\n        },\n      },\n    },\n  }`
  vite = `${vite.slice(0, end)}${build}${vite.slice(end)}`
  await writeFile('vite.config.ts', vite)
}

console.log('Vendor bundle polish applied')
