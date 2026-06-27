import fs from 'fs';
let content = fs.readFileSync('src/data.ts', 'utf-8');

// fix bad syntax
content = content.replace(/requirement:\s*"اختر الإجابة النحوية الصحيحة"\.\.\.أن الهوى ألد أعداء العقل\\"\.",/, `requirement: "اختر الإجابة النحوية الصحيحة",`);

fs.writeFileSync('src/data.ts', content, 'utf-8');
