/**
 * @file sampleWasm.ts
 * @module StyxOS/Kernel/SampleWasm
 * @description Built-in WASI executable WebAssembly binary generator for sample app testing.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

export function createHelloWasmBinary(): Uint8Array {
  const wasmHex =
    "0061736d01000000" +
    "010c0260047f7f7f7f017f600000" + // type section
    "02230116776173695f736e617073686f745f70726576696577310866645f77726974650000" + // import section
    "03020101" + // function section
    "0503010001" + // memory section
    "071302066d656d6f72790200065f73746172740001" + // export section
    "0a0f010d00410141384101411010001a0b" + // code section (41 10 = nwrittenPtr 16)
    "0b3e020041080b2b48656c6c6f2066726f6d205761736d2041707020696e736964652053747978204f53204b65726e656c210a0041380b08080000002b000000"; // data section (48 65 6c 6c 6f 20 66 72 6f 6d 20 57 61 73 6d 20 41 70 70 20 69 6e 73 69 64 65 20 53 74 79 78 20 4f 53 20 4b 65 72 6e 65 6c 21 0a = "Hello from Wasm App inside Styx OS Kernel!\n")

  const bytes = new Uint8Array(wasmHex.length / 2);
  for (let i = 0; i < wasmHex.length; i += 2) {
    bytes[i / 2] = parseInt(wasmHex.substring(i, i + 2), 16);
  }
  return bytes;
}
