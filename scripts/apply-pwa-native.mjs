import { copyFile, readFile, writeFile } from 'node:fs/promises'

function replaceOrFail(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`PWA patch failed: ${label}`)
  return source.replace(needle, replacement)
}

await copyFile('pwa/PwaInstallCard.tsx', 'src/components/PwaInstallCard.tsx')

await writeFile('vite.config.ts', `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nimport { VitePWA } from 'vite-plugin-pwa'\n\nexport default defineConfig({\n  plugins: [\n    react(),\n    VitePWA({\n      registerType: 'autoUpdate',\n      includeAssets: [\n        'tv-phone.svg',\n        'tv-phone-180.png',\n        'tv-phone-192.png',\n        'tv-phone-512.png',\n        'tv-phone-maskable-512.png',\n      ],\n      manifest: {\n        id: '/',\n        name: 'TV Phone Remote',\n        short_name: 'TV Phone',\n        description: 'Universal phone and tablet remote for Samsung TV and Fire TV devices.',\n        theme_color: '#07090d',\n        background_color: '#07090d',\n        display: 'standalone',\n        orientation: 'any',\n        start_url: '/',\n        scope: '/',\n        lang: 'en-US',\n        categories: ['utilities', 'productivity'],\n        icons: [\n          { src: '/tv-phone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },\n          { src: '/tv-phone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },\n          { src: '/tv-phone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },\n        ],\n      },\n      workbox: {\n        navigateFallback: '/index.html',\n        cleanupOutdatedCaches: true,\n        clientsClaim: true,\n        skipWaiting: true,\n        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],\n      },\n    }),\n  ],\n})\n`)

await writeFile('index.html', `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />\n    <meta name="theme-color" content="#07090d" />\n    <meta name="color-scheme" content="dark" />\n    <meta name="mobile-web-app-capable" content="yes" />\n    <meta name="apple-mobile-web-app-capable" content="yes" />\n    <meta name="apple-mobile-web-app-title" content="TV Phone" />\n    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />\n    <meta name="format-detection" content="telephone=no" />\n    <link rel="apple-touch-icon" sizes="180x180" href="/tv-phone-180.png" />\n    <link rel="icon" href="/tv-phone.svg" type="image/svg+xml" />\n    <title>TV Phone</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`)

let settings = await readFile('src/components/SettingsView.tsx', 'utf8')
settings = replaceOrFail(
  settings,
  "import { AccountPanel, type AccountPanelProps } from './AccountPanel'",
  "import { AccountPanel, type AccountPanelProps } from './AccountPanel'\nimport { PwaInstallCard } from './PwaInstallCard'",
  'Settings install card import',
)
settings = replaceOrFail(
  settings,
  '      <AccountPanel {...account} />\n\n      <div className="settings-subheading">LAN bridge</div>',
  '      <AccountPanel {...account} />\n\n      <PwaInstallCard />\n\n      <div className="settings-subheading">LAN bridge</div>',
  'Settings install card placement',
)
await writeFile('src/components/SettingsView.tsx', settings)

let styles = await readFile('src/styles.css', 'utf8')
styles += `\n/* v0.7 native-style PWA + tablet polish */\nhtml { background:#07090d; overscroll-behavior:none; }\nbody { overscroll-behavior-y:none; -webkit-tap-highlight-color:transparent; }\nbutton, [role='button'] { touch-action:manipulation; }\n.pwa-install-button { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; }\n.pwa-install-button svg { width:17px; height:17px; }\n.pwa-install-message { display:block; color:#8c98ad !important; }\n@media (display-mode: standalone) {\n  body { min-height:100dvh; }\n  .app-shell { min-height:100dvh; }\n}\n@media (min-width:820px) and (pointer:coarse) {\n  .app-shell { max-width:1080px; }\n  .bottom-nav { width:min(100%,1080px); }\n  .remote-page, .content-page { padding-left:42px; padding-right:42px; }\n  .quick-controls button { min-height:60px; }\n  .button-primary, .button-secondary { min-height:52px; }\n  .settings-row { padding:17px; }\n  .streaming-shortcuts { width:min(100%,840px); }\n}\n@media (min-width:900px) and (min-height:700px) {\n  .remote-page { max-width:1040px; margin:0 auto; }\n  .remote-body { display:grid; grid-template-columns:minmax(320px,380px) minmax(340px,1fr); grid-template-rows:auto auto auto; gap:16px 44px; align-items:center; justify-items:center; padding-top:30px; }\n  .remote-body .dpad, .remote-body .touchpad-wrap, .remote-body .keypad-panel { grid-column:1; grid-row:1 / 4; }\n  .remote-body .navigation-row { grid-column:2; grid-row:1; margin-top:0; width:100%; max-width:420px; }\n  .remote-body .media-row { grid-column:2; grid-row:2; margin-top:0; width:100%; max-width:420px; }\n  .remote-body .rocker-grid { grid-column:2; grid-row:3; margin-top:0; width:100%; max-width:460px; }\n  .dpad { width:340px; }\n  .touchpad-wrap { width:360px; }\n  .keypad-panel { width:330px; }\n}\n@media (min-width:1100px) {\n  .app-shell { max-width:1120px; }\n  .bottom-nav { width:min(100%,1120px); }\n}\n`
await writeFile('src/styles.css', styles)

console.log('Native PWA + tablet patch applied')
