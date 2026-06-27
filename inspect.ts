import fs from 'fs';

const content = fs.readFileSync('src/data.ts', 'utf-8');
const blocks = content.match(/{\s*number:\s*["'][^"']+["'],\s*text:\s*(['"`])([\s\S]*?)\1,\s*requirement:\s*(['"`])([\s\S]*?)\3/g);

if (blocks) {
    blocks.slice(0, 10).forEach(b => console.log(b));
}
