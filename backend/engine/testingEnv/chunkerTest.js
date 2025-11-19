import fs from 'node:fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { chunkFile } from '../ingestion/chunker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

async function runTest() {
  const filePath = path.resolve(__dirname, 'sampleFile.js');
  const chunks   = await chunkFile(filePath);
  console.log('Chunks found:', chunks);
  chunks.forEach((c,i) => {
    console.log(`Chunk #${i+1}`);
    console.log('  Type:    ', c.type);
    console.log('  StartRow:', c.startRow, 'EndRow:', c.endRow);
    console.log('  Text:\n', c.text);
    console.log('----------------------');
  });
}

runTest().catch(err => console.error(err));
