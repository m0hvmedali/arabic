import fs from 'fs';

let content = fs.readFileSync('src/data.ts', 'utf-8');
const blocks = content.match(/{\s*number:\s*["'][^"']+["'],\s*text:\s*(['"`])([\s\S]*?)\1,\s*requirement:\s*(['"`])([\s\S]*?)\3,\s*options:[\s\S]*?correctIndex:\s*\d+,\s*analysis:\s*\[[\s\S]*?\]\s*}/g);

if (blocks) {
    blocks.forEach(block => {
        const r = block.match(/requirement:\s*"(.*?)"/)[1];
        if(r.includes('اختر الإجابة') || r.includes('اختر الإعراب')){
            const n = block.match(/number:\s*"(.*?)"/)[1];
            const o = block.match(/options:\s*\[([\s\S]*?)\]/)[1];
            console.log(n, "\\nOptions:", o.trim().substring(0, 100).replace(/\n/g, ' '));
        }
    });
}
