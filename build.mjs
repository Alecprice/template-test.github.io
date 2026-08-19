import { cp, mkdir } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await cp('index.html', 'dist/index.html');
await cp('tv-phone-test.html', 'dist/tv-phone-test.html');

console.log('TV Phone static bundle copied to dist/');
