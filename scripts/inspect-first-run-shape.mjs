import { readFile } from 'node:fs/promises'

for (const path of ['src/App.tsx', 'src/lib/storage.ts']) {
  const text = await readFile(path, 'utf8')
  const lines = text.split('\n')
  console.log(`\n--- FIRST RUN SHAPE: ${path} ---`)
  lines.forEach((line, index) => {
    if (/demoMode|setDemo|loadDemo|saveDemo|persistDevices|loadDevices|defaultDevices|sample|reset\b|fatal-state|No TVs added yet/i.test(line)) {
      const start = Math.max(0, index - 3)
      const end = Math.min(lines.length, index + 4)
      for (let i = start; i < end; i += 1) console.log(`${i + 1}: ${lines[i]}`)
      console.log('---')
    }
  })
}
