import fs from 'fs';

const content = fs.readFileSync('src/data.ts', 'utf-8');
const blocks = content.match(/{\s*number:\s*["'][^"']+["'],\s*text:\s*(['"`])([\s\S]*?)\1,\s*options:[\s\S]*?correctIndex:\s*\d+,\s*analysis:\s*\[[\s\S]*?\]\s*}/g);

let parsed = 0;
let defaultReq = 0;

blocks.forEach(b => {
    const textMatch = b.match(/text:\s*(['"`])([\s\S]*?)\1/);
    let text = textMatch[2];
    
    // remove previous hacks
    text = text.replace(/\\n\\n\(المطلوب:.*?\)/, '');
    
    // Try to split
    let req = "";
    const splitRegex = /(أعرب|حدد|ميز|بين|استخرج|صغ|حول|ضع|أكمل|املأ|ما|لماذا|كيف|هل|اختر|ماذا)[\s\S]*$/;
    const match = text.match(splitRegex);
    
    // We only want to split if the requirement is at the end and doesn't take up the whole text.
    // However, some texts are ONLY the question, e.g., "حول المصدر المؤول...".
    if (match && match.index > 10) {
        req = text.slice(match.index).trim();
        text = text.slice(0, match.index).trim();
        parsed++;
    } else {
        // Either it's just a question with no text before it, or no requirement
        if (match && match.index <= 10) {
            req = text;
            text = "";
            parsed++;
        } else {
            req = "اختر الإجابة الصحيحة";
            defaultReq++;
        }
    }
});

console.log(`Parsed requirements from text: ${parsed}`);
console.log(`Fallback to default requirement: ${defaultReq}`);
