# Real TV Setup

TV Phone has two pieces: the Vercel-hosted phone UI and a LAN transport that communicates with TVs on private Wi-Fi. Vercel cannot directly initiate connections to private addresses such as 192.168.x.x.

## Fastest hardware test

On a Mac/PC on the same LAN as the TVs:

```bash
npm install
npm run bridge:setup
npm run bridge:doctor
npm run bridge:start
```

The setup command creates `bridge/.env` with a random bearer token and never overwrites an existing configuration.

Then configure the LAN bridge in TV Phone Settings using the bridge machine's LAN address and bearer token.

## Browser limitation

The deployed Vercel PWA uses HTTPS. Browsers block an HTTPS page from calling a plain HTTP LAN bridge. For immediate protocol testing, use the local development UI on the same network. For the final phone experience, prefer the Capacitor native build/local-network transport.

## Samsung

- Prefer secure local WebSocket port 8002.
- Approve the first TV pairing prompt and persist the returned token.
- Add the TV MAC address for Wake-on-LAN.
- A fully powered-off TV may require Wake-on-LAN before WebSocket commands can work.

## Fire TV

- Prefer Remote v2 where supported.
- ADB remains a development fallback.
- Keep bridge credentials and pairing material private and local.

## Network checklist

- Phone, bridge machine, Samsung TV, and Fire TV are on the same LAN/VLAN.
- Guest-network/client isolation is disabled.
- Do not port-forward the LAN bridge.
- Do not commit `bridge/.env` or publish bridge tokens.
- Run the in-app bridge health check before pairing devices.
