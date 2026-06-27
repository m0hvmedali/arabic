import fs from 'fs';
let content = fs.readFileSync('src/data.ts', 'utf-8');

// Replace any requirement that ends with unexpected characters outside the quote
// Actually, I can just use regex to fix broken lines
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('requirement: "اختر الإجابة النحوية الصحيحة"...')) {
        lines[i] = '    requirement: "اختر الإجابة النحوية الصحيحة",';
    } else if (lines[i].match(/requirement: ".*?\"[^,]/)) {
        // Find if there's text after the closing quote before the comma
        const m = lines[i].match(/(requirement:\s*".*?")(.*?),/);
        if (m && m[2].trim().length > 0) {
            lines[i] = `    ${m[1]},`;
        }
    }
}

fs.writeFileSync('src/data.ts', lines.join('\n'));
