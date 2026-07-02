import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { WhostyleCore } from '../src/js/whostyle-core.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const matrixPath = __dirname + '/matrix.json';
const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));

let passed = 0;
let failed = 0;

for (const test of matrix) {
    console.log(`Testing: ${test.name}`);
    
    if (test.is_corruption_test) {
        const decoded = WhostyleCore.decode(test.hash);
        if (decoded !== null) {
            console.error(`  [FAIL] Corruption test decoded successfully, but should have failed (returned null)`);
            failed++;
        } else {
            console.log(`  [PASS]`);
            passed++;
        }
        continue;
    }

    // Test Encoding
    const hash = WhostyleCore.encode(test.input.config, test.input.colors);
    if (hash !== test.hash) {
        console.error(`  [FAIL] Encoding mismatch. Expected ${test.hash}, got ${hash}`);
        failed++;
        continue;
    }

    // Test Decoding
    const decoded = WhostyleCore.decode(test.hash);
    if (!decoded) {
        console.error(`  [FAIL] Decode returned null`);
        failed++;
        continue;
    }

    let decodeFail = false;
    for (const key in test.input.config) {
        if (decoded.config[key] !== test.input.config[key]) {
            console.error(`  [FAIL] Config ${key} mismatch. Expected ${test.input.config[key]}, got ${decoded.config[key]}`);
            decodeFail = true;
        }
    }
    for (const key in test.input.colors) {
        if (decoded.colors[key] !== test.input.colors[key]) {
            console.error(`  [FAIL] Color ${key} mismatch. Expected ${test.input.colors[key]}, got ${decoded.colors[key]}`);
            decodeFail = true;
        }
    }

    if (decodeFail) {
        failed++;
    } else {
        console.log(`  [PASS]`);
        passed++;
    }
}

console.log(`\nTests completed. ${passed} passed, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
