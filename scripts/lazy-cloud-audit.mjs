import { readFile } from 'node:fs/promises'

const cloud = await readFile('src/lib/cloud.ts', 'utf8')
const sync = await readFile('src/lib/useAccountSync.ts', 'utf8')

for (const marker of ["import('@supabase/supabase-js')", 'export function getSupabase()', 'clientPromise']) {
  if (!cloud.includes(marker)) throw new Error(`Lazy cloud audit failed: cloud client missing ${marker}`)
}
if (cloud.includes("import { createClient } from '@supabase/supabase-js'")) throw new Error('Lazy cloud audit failed: Supabase still has a static runtime import')
for (const marker of ['requestIdleCallback', 'getSupabase()', 'SupabaseClient', 'RealtimeChannel']) {
  if (!sync.includes(marker)) throw new Error(`Lazy cloud audit failed: account sync missing ${marker}`)
}
if (sync.includes("import { cloudConfigured, supabase } from './cloud'")) throw new Error('Lazy cloud audit failed: eager Supabase singleton remains')

console.log('TV Phone lazy cloud startup audit passed.')
