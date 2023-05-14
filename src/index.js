import * as http from 'http';
import * as path from 'path'
import * as fs from 'fs/promises';
const LISTEN_PORT = 3111;
const WASM_BASE_PATH = './wasm';

async function instantiate(module, imports = {}) {
  const adaptedImports = {
    env: Object.assign(Object.create(globalThis), imports.env || {}, {
      abort(message, fileName, lineNumber, columnNumber) {
        // ~lib/builtins/abort(~lib/string/String | null?, ~lib/string/String | null?, u32?, u32?) => void
        message = __liftString(message >>> 0);
        fileName = __liftString(fileName >>> 0);
        lineNumber = lineNumber >>> 0;
        columnNumber = columnNumber >>> 0;
        (() => {
          // @external.js
          throw Error(`${message} in ${fileName}:${lineNumber}:${columnNumber}`);
        })();
      },
    }),
  };
  const { exports } = await WebAssembly.instantiate(module, adaptedImports);
  const memory = exports.memory || imports.env.memory;
  const adaptedExports = Object.setPrototypeOf({
    handler(event) {
      // assembly/index/handler(~lib/string/String) => ~lib/string/String
      event = __lowerString(event) || __notnull();
      return __liftString(exports.handler(event) >>> 0);
    },
  }, exports);
  function __liftString(pointer) {
    if (!pointer) return null;
    const
      end = pointer + new Uint32Array(memory.buffer)[pointer - 4 >>> 2] >>> 1,
      memoryU16 = new Uint16Array(memory.buffer);
    let
      start = pointer >>> 1,
      string = "";
    while (end - start > 1024) string += String.fromCharCode(...memoryU16.subarray(start, start += 1024));
    return string + String.fromCharCode(...memoryU16.subarray(start, end));
  }
  function __lowerString(value) {
    if (value == null) return 0;
    const
      length = value.length,
      pointer = exports.__new(length << 1, 2) >>> 0,
      memoryU16 = new Uint16Array(memory.buffer);
    for (let i = 0; i < length; ++i) memoryU16[(pointer >>> 1) + i] = value.charCodeAt(i);
    return pointer;
  }
  function __notnull() {
    throw TypeError("value must not be null");
  }
  return adaptedExports;
}


const server = http.createServer(async (req, res) => {
  console.debug(req.url)

  if (req.url === '/favicon.ico') {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.end('<svg xmlns="http://www.w3.org/2000/svg"><text y="32" font-size="32">🚀</text></svg>');
    return;
  }

  const jj = `./${path.join(WASM_BASE_PATH, req.url).toLowerCase()}.wasm`;
  console.debug(jj)

  let loadedWasmBuffer = null;
  try {
    loadedWasmBuffer = await fs.readFile(jj);
  } catch (e) {
    console.error(e);
    res.end('worker load failed')
    return;
  }

  try {
    const wasmInst=await instantiate(await WebAssembly.compile(loadedWasmBuffer),{'url':jj});
    const wasmResult=await wasmInst.handler("test");

    console.debug(wasmResult);
    res.end(`${wasmResult}`);

  } catch (e) {
    console.error(e);
    res.end('worker execution failed')
    return;
  }

  return;

});

server.listen(LISTEN_PORT);