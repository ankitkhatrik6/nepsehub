/**
 * NEPSE Official API Token Parser & Deobfuscator
 * Reconstructs dynamic authentication tokens using NEPSE WebAssembly bytecode
 */

// NEPSE deobfuscation WebAssembly bytecode (Base64 encoded)
const WASM_BASE64 =
  'AGFzbQEAAAABGgVgBX9/f39/AX9gAAF/YAAAYAF/AGABfwF/AwwLAgAAAAAAAAEDBAEEBQFwAQICBQYBAYACgAIGCAF/AUGwiQQLB5sBDgZtZW1vcnkCAARfcmR4AAEEX2NkeAABA2NkeAACA3JkeAADA2JkeAAEA25keAAFA21keAAGGV9faW5kaXJlY3RfZnVuY3Rpb25fdGFibGUBAAtfaW5pdGlhbGl6ZQAAEF9fZXJybm9fbG9jYXRpb24ACglzdGFja1NhdmUABwxzdGFja1Jlc3RvcmUACApzdGFja0FsbG9jAAkJBwEAQQELAQAK0QILAwABCzEAIAFB5ABtQQpvIAFBCm0iAEEKb2oiAiACIAEgAEEKbGtqQQJ0QYAIaigCAGpBFmoLLAAgAUEKbSIAQQpvIAEgAEEKbGtqIAFB5ABtQQpvakECdEGACGooAgBBFmoLMQAgAUHkAG1BCm8gAUEKbSIAQQpvaiICIAIgASAAQQpsa2pBAnRBgAhqKAIAakEgagsxACABQeQAbUEKbyABQQptIgBBCm9qIgIgAiABIABBCmxrakECdEGACGooAgBqQTxqCzIAIAFBCm0iAEEKbyICIAIgASAAQQpsa2ogAUHkAG1BCm9qQQJ0QYAIaigCAGpB2ABqCzIAIAFB5ABtQQpvIgAgACABQQptIgJBCm8gASACQQpsa2pqQQJ0QYAIaigCAGpB7gBqCwQAIwALBgAgACQACxAAIwAgAGtBcHEiACQAIAALBQBBoAkLC6UBAQBBgAgLnQEFAAAACAAAAAQAAAAHAAAACQAAAAQAAAAGAAAACQAAAAUAAAAFAAAABgAAAAUAAAADAAAABQAAAAQAAAAEAAAACQAAAAYAAAAGAAAACAAAAAgAAAAGAAAACAAAAAYAAAAFAAAACAAAAAQAAAAJAAAABQAAAAkAAAAIAAAABQAAAAMAAAAEAAAABwAAAAcAAAAEAAAABwAAAAMAAAAJ';

export interface NepseTokenResponse {
  serverTime: number;
  salt: string;
  accessToken: string;
  refreshToken: string;
  salt1: number;
  salt2: number;
  salt3: number;
  salt4: number;
  salt5: number;
  isDisplayActive?: boolean;
}

export interface WasmFunctions {
  cdx: (s1: number, s2: number, s3: number, s4: number, s5: number) => number;
  rdx: (s1: number, s2: number, s3: number, s4: number, s5: number) => number;
  bdx: (s1: number, s2: number, s3: number, s4: number, s5: number) => number;
  ndx: (s1: number, s2: number, s3: number, s4: number, s5: number) => number;
  mdx: (s1: number, s2: number, s3: number, s4: number, s5: number) => number;
}

let wasmInstanceCache: WasmFunctions | null = null;

export async function getWasmFunctions(): Promise<WasmFunctions> {
  if (wasmInstanceCache) {
    return wasmInstanceCache;
  }

  let buffer: ArrayBuffer;
  if (typeof Buffer !== 'undefined') {
    const nodeBuf = Buffer.from(WASM_BASE64, 'base64');
    buffer = nodeBuf.buffer.slice(nodeBuf.byteOffset, nodeBuf.byteOffset + nodeBuf.byteLength);
  } else {
    const binaryString = atob(WASM_BASE64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    buffer = bytes.buffer;
  }

  const wasmModule = await WebAssembly.instantiate(buffer);
  const exports = wasmModule.instance.exports as unknown as WasmFunctions;
  wasmInstanceCache = exports;
  return exports;
}

/**
 * Deobfuscates raw access and refresh tokens returned by /api/authenticate/prove
 */
export async function parseTokenResponse(
  tokenResp: NepseTokenResponse
): Promise<{ accessToken: string; refreshToken: string }> {
  const wasm = await getWasmFunctions();

  const { salt1, salt2, salt3, salt4, salt5, accessToken, refreshToken } = tokenResp;

  const n = wasm.cdx(salt1, salt2, salt3, salt4, salt5);
  const l = wasm.rdx(salt1, salt2, salt4, salt3, salt5);
  const o = wasm.bdx(salt1, salt2, salt4, salt3, salt5);
  const p = wasm.ndx(salt1, salt2, salt4, salt3, salt5);
  const q = wasm.mdx(salt1, salt2, salt4, salt3, salt5);

  const a = wasm.cdx(salt2, salt1, salt3, salt5, salt4);
  const b = wasm.rdx(salt2, salt1, salt3, salt4, salt5);
  const c = wasm.bdx(salt2, salt1, salt4, salt3, salt5);
  const d = wasm.ndx(salt2, salt1, salt4, salt3, salt5);
  const e = wasm.mdx(salt2, salt1, salt4, salt3, salt5);

  const parsedAccessToken =
    accessToken.substring(0, n) +
    accessToken.substring(n + 1, l) +
    accessToken.substring(l + 1, o) +
    accessToken.substring(o + 1, p) +
    accessToken.substring(p + 1, q) +
    accessToken.substring(q + 1);

  const parsedRefreshToken =
    refreshToken.substring(0, a) +
    refreshToken.substring(a + 1, b) +
    refreshToken.substring(b + 1, c) +
    refreshToken.substring(c + 1, d) +
    refreshToken.substring(d + 1, e) +
    refreshToken.substring(e + 1);

  return {
    accessToken: parsedAccessToken,
    refreshToken: parsedRefreshToken,
  };
}
