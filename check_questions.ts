import fs from 'fs';

const content = fs.readFileSync('./src/data.ts', 'utf-8');

const lines = content.split('\n');
let count = 0;
lines.forEach((line, index) => {
    if (line.match(/text:\s*(['"`])/)) {
        const textMatch = line.match(/text:\s*(['"`])(.*?)\1/);
        if (textMatch) {
            const text = textMatch[2];
            // keywords that usually indicate a question requirement
            const hasReq = /أعرب|حدد|ميز|بين|استخرج|ما |لماذا|كيف|هل|اختر|الصياغة|المحل الإعرابي|سبب|ماذا|؟/.test(text);
            if (!hasReq) {
                console.log(`Line ${index + 1}: ${text}`);
                count++;
            }
        }
    }
});
console.log(`Total questions without clear requirement: ${count}`);
