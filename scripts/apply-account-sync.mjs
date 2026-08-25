import { copyFile, readFile, writeFile } from 'node:fs/promises'

function replaceOrFail(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Account sync patch failed: ${label}`)
  return source.replace(needle, replacement)
}

function modernizeEmptyTypedRefs(source, label) {
  const pattern = /useRef<([^>\n]+)>\(\)/g
  const matches = source.match(pattern) ?? []
  if (!matches.length) throw new Error(`Account sync patch failed: no empty typed refs found in ${label}`)
  return source.replace(pattern, 'useRef<$1 | undefined>(undefined)')
}

await copyFile('account-sync/cloud.ts', 'src/lib/cloud.ts')
await copyFile('account-sync/useAccountSync.ts', 'src/lib/useAccountSync.ts')
await copyFile('account-sync/AccountPanel.tsx', 'src/components/AccountPanel.tsx')
await copyFile('voice-tools/useSpeechSynthesis.ts', 'src/lib/useSpeechSynthesis.ts')

let app = await readFile('src/App.tsx', 'utf8')
app = modernizeEmptyTypedRefs(app, 'App.tsx')
app = replaceOrFail(
  app,
  "import { storage } from './lib/storage'",
  "import { storage } from './lib/storage'\nimport { useAccountSync } from './lib/useAccountSync'",
  'App account-sync import',
)
app = replaceOrFail(
  app,
  '  useWakeLock(keepAwake)\n',
  `  useWakeLock(keepAwake)\n\n  const account = useAccountSync({\n    devices,\n    activities,\n    activeDeviceId,\n    haptics,\n    keepAwake,\n    bridgeConfig,\n    setDevices,\n    setActivities,\n    setActiveDeviceId,\n    setHaptics,\n    setKeepAwake,\n    setBridgeConfig: setBridgeConfigState,\n  })\n`,
  'App account-sync hook',
)
app = replaceOrFail(
  app,
  '  const manager = managerRef.current\n',
  `  const manager = managerRef.current\n\n  useEffect(() => {\n    if (!account.syncGeneration) return\n    void manager.invalidate()\n    setLiveStates({})\n  }, [account.syncGeneration, manager])\n`,
  'App adapter invalidation after cloud hydrate',
)
app = replaceOrFail(
  app,
  "        {tab === 'settings' && <SettingsView demoMode={demoMode} haptics={haptics} keepAwake={keepAwake} bridgeConfig={bridgeConfig} onDemoMode={setDemo} onHaptics={setHaptic} onKeepAwake={setAwake} onBridgeConfig={setBridgeConfig} onReset={reset} />}",
  "        {tab === 'settings' && <SettingsView demoMode={demoMode} haptics={haptics} keepAwake={keepAwake} bridgeConfig={bridgeConfig} account={account} onDemoMode={setDemo} onHaptics={setHaptic} onKeepAwake={setAwake} onBridgeConfig={setBridgeConfig} onReset={reset} />}",
  'Settings account prop',
)
await writeFile('src/App.tsx', app)

let speech = await readFile('src/lib/useSpeechRecognition.ts', 'utf8')
speech = modernizeEmptyTypedRefs(speech, 'useSpeechRecognition.ts')
await writeFile('src/lib/useSpeechRecognition.ts', speech)

let remote = await readFile('src/components/RemoteView.tsx', 'utf8')
remote = replaceOrFail(
  remote,
  '  Play, RefreshCw, Rewind, RotateCcw, Tv, Volume1, Volume2, VolumeX,',
  '  Play, RefreshCw, Rewind, RotateCcw, Square, Tv, Volume1, Volume2, VolumeX,',
  'RemoteView speech stop icon',
)
remote = replaceOrFail(
  remote,
  "import { useEffect, useMemo, useState } from 'react'",
  "import { useEffect, useMemo, useRef, useState } from 'react'",
  'RemoteView dictation ref import',
)
remote = replaceOrFail(
  remote,
  "import { useSpeechRecognition } from '../lib/useSpeechRecognition'",
  "import { useSpeechRecognition } from '../lib/useSpeechRecognition'\nimport { useSpeechSynthesis } from '../lib/useSpeechSynthesis'",
  'RemoteView speech synthesis import',
)
remote = replaceOrFail(
  remote,
  "  const [text, setText] = useState('')\n  const [mode, setMode] = useState<RemoteMode>('buttons')\n  const voice = useSpeechRecognition((value) => setText(value))",
  "  const [text, setText] = useState('')\n  const [mode, setMode] = useState<RemoteMode>('buttons')\n  const dictationBaseRef = useRef('')\n  const speechOut = useSpeechSynthesis()\n  const voice = useSpeechRecognition((value) => {\n    const base = dictationBaseRef.current\n    setText(base ? `${base}${value ? ` ${value}` : ''}` : value)\n  })",
  'RemoteView shared voice tools state',
)
remote = replaceOrFail(
  remote,
  "  const submitText = () => { const value = text.trim(); if (!value) return; voice.stop(); onSendText(value); setText(''); setKeyboardOpen(false) }\n  const closeKeyboard = () => { voice.stop(); setKeyboardOpen(false) }\n  const selectInput = (input: InputSource) => { onSetInput(input); setInputOpen(false) }",
  "  const submitText = () => { const value = text.trim(); if (!value) return; voice.stop(); speechOut.stop(); onSendText(value); setText(''); setKeyboardOpen(false) }\n  const closeKeyboard = () => { voice.stop(); speechOut.stop(); setKeyboardOpen(false) }\n  const startDictation = () => {\n    speechOut.stop()\n    speechOut.reset()\n    dictationBaseRef.current = text.trim()\n    voice.reset()\n    voice.start()\n  }\n  const toggleReadAloud = () => {\n    voice.stop()\n    if (speechOut.speaking) speechOut.stop()\n    else speechOut.speak(text)\n  }\n  const selectInput = (input: InputSource) => { onSetInput(input); setInputOpen(false) }",
  'RemoteView coordinated voice actions',
)
const oldVoicePanel = [
  "            <div className={`voice-panel ${voice.listening ? 'voice-panel--listening' : ''}`}>",
  "              <button className=\"voice-record-button\" onClick={voice.listening ? voice.stop : voice.start} disabled={!voice.supported}>{voice.listening ? <MicOff /> : <Mic />}<span>{!voice.supported ? 'Voice unavailable' : voice.listening ? 'Stop listening' : 'Start voice-to-text'}</span></button>",
  "              <small>{voice.listening ? 'Listening… speak naturally.' : 'Microphone permission may be requested by your browser.'}</small>",
  '            </div>',
].join('\n')
const newVoicePanel = [
  "            <div className={`voice-panel ${voice.listening ? 'voice-panel--listening' : ''}`}>",
  '              <div className="voice-tool-grid">',
  "                <button type=\"button\" className=\"voice-record-button\" aria-pressed={voice.listening} onClick={voice.listening ? voice.stop : startDictation} disabled={!voice.supported}>{voice.listening ? <MicOff /> : <Mic />}<span>{!voice.supported ? 'Dictation unavailable' : voice.listening ? 'Stop listening' : 'Dictate text'}</span></button>",
  "                <button type=\"button\" className={`voice-speak-button ${speechOut.speaking ? 'voice-speak-button--speaking' : ''}`} aria-pressed={speechOut.speaking} onClick={toggleReadAloud} disabled={!speechOut.supported || (!text.trim() && !speechOut.speaking)}>{speechOut.speaking ? <Square /> : <Volume2 />}<span>{!speechOut.supported ? 'Read aloud unavailable' : speechOut.speaking ? 'Stop speaking' : 'Read aloud'}</span></button>",
  '              </div>',
  "              <small>{voice.listening ? 'Listening… your words appear in the text box.' : speechOut.speaking ? 'Speaking on this phone or computer.' : 'Dictate text, edit it, hear it aloud, or send it to the TV.'}</small>",
  '            </div>',
].join('\n')
remote = replaceOrFail(remote, oldVoicePanel, newVoicePanel, 'RemoteView voice tool controls')
remote = replaceOrFail(
  remote,
  "            {voice.error && <div className=\"voice-error\" role=\"alert\">{voice.error}</div>}\n            <textarea",
  "            {voice.error && <div className=\"voice-error\" role=\"alert\">{voice.error}</div>}\n            {speechOut.error && <div className=\"voice-error\" role=\"alert\">{speechOut.error}</div>}\n            <textarea",
  'RemoteView speech output error',
)
remote = replaceOrFail(
  remote,
  "            <div className=\"voice-privacy-note\">Speech recognition can be processed by the browser/device or by a browser speech service depending on platform.</div>",
  "            <div className=\"voice-privacy-note\">Dictation support varies by browser and may use a browser speech service. Read aloud uses your device/browser speech engine and plays through this device, not the TV.</div>",
  'RemoteView voice privacy and output copy',
)
await writeFile('src/components/RemoteView.tsx', remote)

let styles = await readFile('src/styles.css', 'utf8')
styles += `\n/* v0.7 coordinated dictation + read aloud */\n.voice-tool-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }\n.voice-speak-button { min-height:48px; border:1px solid rgba(124,102,255,.18); border-radius:12px; background:#17182a; color:#e6e2ff; display:flex; align-items:center; justify-content:center; gap:8px; font-weight:850; cursor:pointer; }\n.voice-speak-button svg { width:18px; }\n.voice-speak-button--speaking { border-color:rgba(124,102,255,.42); background:rgba(124,102,255,.13); box-shadow:inset 0 0 0 1px rgba(124,102,255,.07); }\n.voice-speak-button:disabled { opacity:.45; cursor:not-allowed; }\n@media (max-width:420px) { .voice-tool-grid { grid-template-columns:1fr; } }\n`
await writeFile('src/styles.css', styles)

let settings = await readFile('src/components/SettingsView.tsx', 'utf8')
settings = replaceOrFail(
  settings,
  "import { useState } from 'react'\nimport type { BridgeConfig } from '../types/remote'",
  "import { useState } from 'react'\nimport type { BridgeConfig } from '../types/remote'\nimport { AccountPanel, type AccountPanelProps } from './AccountPanel'",
  'Settings account panel import',
)
settings = replaceOrFail(
  settings,
  '  bridgeConfig: BridgeConfig\n',
  '  bridgeConfig: BridgeConfig\n  account: AccountPanelProps\n',
  'Settings account prop type',
)
settings = replaceOrFail(
  settings,
  'export function SettingsView({ demoMode, haptics, keepAwake, bridgeConfig, onDemoMode, onHaptics, onKeepAwake, onBridgeConfig, onReset }: Props) {',
  'export function SettingsView({ demoMode, haptics, keepAwake, bridgeConfig, account, onDemoMode, onHaptics, onKeepAwake, onBridgeConfig, onReset }: Props) {',
  'Settings account prop destructure',
)
settings = replaceOrFail(
  settings,
  '      </div>\n\n      <div className="settings-subheading">LAN bridge</div>',
  '      </div>\n\n      <AccountPanel {...account} />\n\n      <div className="settings-subheading">LAN bridge</div>',
  'Settings account panel placement',
)
settings = replaceOrFail(
  settings,
  '<div className="security-note"><strong>Pairing credentials</strong><span>The web MVP stores device settings locally. Native production builds should move Samsung tokens and Fire TV certificates into Keychain/Keystore secure storage.</span></div>',
  '<div className="security-note"><strong>Pairing credentials stay on this device</strong><span>Your account syncs TV names, rooms, favorites, streaming shortcuts, activities, and shared preferences. Samsung pairing tokens, Fire TV certificates, bridge bearer tokens, live connection state, and last-seen data are not uploaded.</span></div>',
  'Settings pairing credential copy',
)
settings = replaceOrFail(
  settings,
  '<button className="danger-outline" onClick={onReset}><RotateCcw /> Reset all local data</button>',
  '<button className="danger-outline" onClick={onReset}><RotateCcw /> Clear this device’s local data</button>',
  'Settings reset copy',
)
await writeFile('src/components/SettingsView.tsx', settings)

console.log('Account sync + voice tools patch applied')
