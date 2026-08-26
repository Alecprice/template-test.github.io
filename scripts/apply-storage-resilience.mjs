import { copyFile, readFile, writeFile } from 'node:fs/promises'

function insertAfterOrFail(source, needle, addition, label) {
  if (!source.includes(needle)) throw new Error(`Storage resilience patch failed: ${label}`)
  if (source.includes(addition.trim())) return source
  return source.replace(needle, `${needle}${addition}`)
}

await copyFile('resilience/browserStorage.ts', 'src/lib/browserStorage.ts')

let storage = await readFile('src/lib/storage.ts', 'utf8')
storage = insertAfterOrFail(
  storage,
  "import { sampleActivities, sampleDevices } from './sampleData'\n",
  "import { safeLocalGet, safeLocalRemove, safeLocalSet } from './browserStorage'\n",
  'storage helper import',
)
storage = storage.replaceAll('localStorage.getItem(', 'safeLocalGet(')
storage = storage.replaceAll('localStorage.setItem(', 'safeLocalSet(')
storage = storage.replaceAll('localStorage.removeItem(', 'safeLocalRemove(')
await writeFile('src/lib/storage.ts', storage)

let app = await readFile('src/App.tsx', 'utf8')
app = insertAfterOrFail(
  app,
  "import { storage } from './lib/storage'\n",
  "import { safeLocalGet, safeLocalRemove, safeLocalSet } from './lib/browserStorage'\n",
  'App storage helper import',
)
app = app.replaceAll('localStorage.getItem(', 'safeLocalGet(')
app = app.replaceAll('localStorage.setItem(', 'safeLocalSet(')
app = app.replaceAll('localStorage.removeItem(', 'safeLocalRemove(')
await writeFile('src/App.tsx', app)

let mode = await readFile('src/lib/appMode.ts', 'utf8')
if (!mode.includes("from './browserStorage'")) mode = "import { safeLocalGet, safeLocalSet } from './browserStorage'\n\n" + mode
mode = mode.replaceAll('window.localStorage.getItem(', 'safeLocalGet(')
mode = mode.replaceAll('window.localStorage.setItem(', 'safeLocalSet(')
await writeFile('src/lib/appMode.ts', mode)

let kids = await readFile('src/lib/kidsStreaming.ts', 'utf8')
kids = insertAfterOrFail(
  kids,
  "import { streamingServices, type StreamingServiceId } from './streamingServices'\n",
  "import { safeLocalGet, safeLocalSet } from './browserStorage'\n",
  'Kids streaming storage helper import',
)
kids = kids.replaceAll('localStorage.getItem(', 'safeLocalGet(')
kids = kids.replaceAll('localStorage.setItem(', 'safeLocalSet(')
await writeFile('src/lib/kidsStreaming.ts', kids)

let sync = await readFile('src/lib/useAccountSync.ts', 'utf8')
sync = sync.replace("    localStorage.setItem('tv-phone:app-mode:v1', state.preferences.appMode)", "    safeSetLocal('tv-phone:app-mode:v1', state.preferences.appMode)")
await writeFile('src/lib/useAccountSync.ts', sync)

let diagnostics = await readFile('src/components/DiagnosticsCard.tsx', 'utf8')
diagnostics = insertAfterOrFail(
  diagnostics,
  "import type { AccountPanelProps } from './AccountPanel'\n",
  "import { browserStoragePersistent } from '../lib/browserStorage'\n",
  'diagnostics storage import',
)
diagnostics = diagnostics.replace(
  "  const [copied, setCopied] = useState(false)\n",
  "  const [copied, setCopied] = useState(false)\n  const persistentStorage = browserStoragePersistent()\n",
)
diagnostics = diagnostics.replace(
  "    bridge: {\n      configured: bridgeConfigured,",
  "    storage: { persistent: persistentStorage, mode: persistentStorage ? 'persistent' : 'session-only' },\n    bridge: {\n      configured: bridgeConfigured,",
)
diagnostics = diagnostics.replace(
  "  }), [account.configured, account.ready, account.signedIn, account.status, appMode, bridgeConfigured, bridgeProtocol, comboCount, fireTvCount, fireTvNeedsPairing, fireTvTransportNeedsAttention, localRepairCandidates, mixedContentRisk, realDevices.length, samsungCount, samsungNeedsPairing])",
  "  }), [account.configured, account.ready, account.signedIn, account.status, appMode, bridgeConfigured, bridgeProtocol, comboCount, fireTvCount, fireTvNeedsPairing, fireTvTransportNeedsAttention, localRepairCandidates, mixedContentRisk, persistentStorage, realDevices.length, samsungCount, samsungNeedsPairing])",
)
diagnostics = diagnostics.replace(
  "          <span><CheckCircle2 /> {typeof navigator !== 'undefined' && navigator.onLine ? 'Online' : 'Offline'}</span>\n",
  "          <span><CheckCircle2 /> {typeof navigator !== 'undefined' && navigator.onLine ? 'Online' : 'Offline'}</span>\n          <span><CheckCircle2 /> Storage {persistentStorage ? 'persistent' : 'session only'}</span>\n",
)
diagnostics = diagnostics.replace(
  "        {mixedContentRisk && <div className=\"diagnostics-warning\" role=\"status\">Hosted HTTPS + an HTTP bridge is currently a mixed-content risk and may be blocked by the browser.</div>}\n",
  "        {mixedContentRisk && <div className=\"diagnostics-warning\" role=\"status\">Hosted HTTPS + an HTTP bridge is currently a mixed-content risk and may be blocked by the browser.</div>}\n        {!persistentStorage && <div className=\"diagnostics-warning\" role=\"status\">Browser storage is unavailable or read-only. TV Phone will keep changes for this session, but they may be lost after reload.</div>}\n",
)
await writeFile('src/components/DiagnosticsCard.tsx', diagnostics)

console.log('Browser storage resilience and session fallback applied')
