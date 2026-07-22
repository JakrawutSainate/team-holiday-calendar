import fs from 'fs';
import path from 'path';

const tsDir = path.join(process.cwd(), 'node_modules', 'typescript', 'lib');
const tsPath = path.join(tsDir, 'typescript.js');

try {
  if (fs.existsSync(tsDir) && !fs.existsSync(tsPath)) {
    fs.writeFileSync(
      tsPath,
      "import tsc from './tsc.js';\nexport default tsc;\nexport * from './tsc.js';\n"
    );
    console.log('✓ Successfully created typescript/lib/typescript.js entry for TS 7');
  }
} catch (err) {
  console.warn('Warning: Failed to patch typescript entry file:', err);
}
