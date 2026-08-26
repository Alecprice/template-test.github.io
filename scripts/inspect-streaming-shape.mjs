import { readFile } from 'node:fs/promises'

for (const path of ['src/components/RemoteView.tsx', 'src/types/remote.ts', 'src/App.tsx']) {
  const text = await readFile(path, 'utf8')
  const lines = text.split('\n')
  console.log(`\n--- STREAMING SHAPE: ${path} ---`)
  lines.forEach((line, index) => {
    if (/favorite|streaming|shortcut|appId|apps\b|launchApp/i.test(line)) {
      const start = Math.max(0, index - 2)
      const end = Math.min(lines.length, index + 3)
      for (let i = start; i < end; i += 1) console.log(`${i + 1}: ${lines[i]}`)
      console.log('---')
    }
  })
}
