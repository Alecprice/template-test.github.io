import { readFile } from 'node:fs/promises'

for (const file of [
  'src/lib/useSpeechRecognition.ts',
  'src/components/RemoteView.tsx',
  'src/components/VoiceCommandSheet.tsx',
  'src/App.tsx',
  'src/index.css',
  'src/styles.css',
]) {
  try {
    const text = await readFile(file, 'utf8')
    console.log(`=== BEGIN ${file} ===`)
    console.log(text)
    console.log(`=== END ${file} ===`)
  } catch {}
}
