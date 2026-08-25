import { readFile } from 'node:fs/promises'
for (const file of ['vite.config.ts','index.html','src/main.tsx']) {
  try {
    console.log(`=== BEGIN ${file} ===`)
    console.log(await readFile(file,'utf8'))
    console.log(`=== END ${file} ===`)
  } catch (error) { console.log(`missing ${file}: ${error?.message ?? error}`) }
}
