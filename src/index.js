import * as http from 'http';
import * as path from 'path'
import * as fs from 'fs/promises';
const LISTEN_PORT = 3111;
const WASM_BASE_PATH = './wasm';

async function fileExists(filepath) {
  try {
    return (await fs.lstat(filepath)).isFile()
  } catch (e) {
    return false
  }
}

const server = http.createServer(async (req, res) => {
  console.debug(req.url)

  if (req.url === '/favicon.ico') {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.end('<svg xmlns="http://www.w3.org/2000/svg"><text y="32" font-size="32">🚀</text></svg>');
    return;
  }

  const dirpath = `./${path.join(WASM_BASE_PATH, req.url).toLowerCase()}`;
  let jsFilePath = '';
  let loadMod = undefined;
  try {
    if (await fileExists(path.join(dirpath, 'release.js'))) {
      jsFilePath = path.join(dirpath, 'release.js');
    }
    if (await fileExists(path.join(dirpath, 'release.cjs'))) {
      jsFilePath = path.join(dirpath, 'release.cjs');
    }
    if (jsFilePath === '') {
      throw new Error('release.js or release.cjs file not found');
    }
    console.debug(jsFilePath);
    loadMod = (await import(`./${jsFilePath}`));
  } catch (e) {
    console.error(e);
    res.end('worker load failed')
    return;
  }

  try {
    const funcRes = loadMod.handler()
    console.log(funcRes);
    res.end(JSON.stringify({"status":'ok',"res":funcRes}));
  } catch (e) {
    console.error(e);
    res.end('worker execution failed');
  }

  return;

});

server.listen(LISTEN_PORT);