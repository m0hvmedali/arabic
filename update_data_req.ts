import fs from 'fs';

let content = fs.readFileSync('src/data.ts', 'utf-8');

// Update Question interface
if (!content.includes('requirement: string;')) {
    content = content.replace(
        'export interface Question {',
        'export interface Question {\n  requirement: string;'
    );
}

// Clean up previous hacks
content = content.replace(/\\n\\n\(المطلوب:.*?\)/g, '');
content = content.replace(/ - \[المطلوب:.*?\]/g, '');

const blocks = content.match(/{\s*number:\s*["'][^"']+["'],\s*text:\s*(['"`])([\s\S]*?)\1,\s*options:[\s\S]*?correctIndex:\s*\d+,\s*analysis:\s*\[[\s\S]*?\]\s*}/g);

let newContent = content;

if (blocks) {
    blocks.forEach(block => {
        const textMatch = block.match(/text:\s*(['"`])([\s\S]*?)\1/);
        let originalText = textMatch[2];
        const quoteChar = textMatch[1];
        
        let req = "";
        let newText = originalText;
        
        const splitRegex = /(أعرب|حدد|ميز|بين|استخرج|صغ|حول|ضع|أكمل|املأ|ما المحل|ما إعراب|ما سبب|ما نوع)[\s\S]*$/;
        const match = originalText.match(splitRegex);
        
        if (match && match.index > 10) {
            req = originalText.slice(match.index).trim();
            newText = originalText.slice(0, match.index).trim();
            // remove trailing dots or dashes from newText if any
            newText = newText.replace(/[-.\s]+$/, '');
        } else if (match && match.index <= 10) {
            req = originalText;
            newText = "اقرأ العبارة التالية ثم أجب:";
        } else {
            // Check analysis for words
            const analysisMatch = block.match(/text:\s*(['"`])([\s\S]*?)\1/g);
            const analysisTexts = analysisMatch ? analysisMatch.slice(1).map(t => t.replace(/text:\s*(['"`])/, '').slice(0, -1)).join(" ") : "";
            const optionsMatch = block.match(/options:\s*\[([\s\S]*?)\]/);
            const optionsStr = optionsMatch ? optionsMatch[1] : "";
            
            let targetWordMatch = analysisTexts.match(/كلمة \((.*?)\)/) || analysisTexts.match(/تعرب \((.*?)\)/) || analysisTexts.match(/\((.*?)\)\s+مبتدأ/) || analysisTexts.match(/\((.*?)\)\s+اسم/);
            let word = targetWordMatch && targetWordMatch[1].split(' ').length <= 3 ? targetWordMatch[1] : "";
            
            if (optionsStr.includes('مبتدأ') || optionsStr.includes('خبر') || optionsStr.includes('مفعول') || optionsStr.includes('اسم ') || optionsStr.includes('مضاف') || optionsStr.includes('فاعل')) {
                req = word ? `أعرب ما تحته خط (${word})` : `أعرب الكلمة البارزة في الجملة`;
            } else if (optionsStr.includes('مرفوع') || optionsStr.includes('منصوب') || optionsStr.includes('مجزوم')) {
                req = `حدد إعراب الكلمة`;
            } else if (optionsStr.includes('جملة')) {
                req = `حدد المحل الإعرابي للجملة`;
            } else if (optionsStr.includes('ممنوع من الصرف')) {
                req = `استخرج الممنوع من الصرف`;
            } else if (optionsStr.includes('توكيد')) {
                req = `حدد التوكيد`;
            } else {
                req = `اختر الإجابة الصحيحة`;
            }
        }
        
        // Escape quotes
        req = req.replace(/"/g, '\\"');
        newText = newText.replace(/"/g, '\\"');
        
        // Replace in block
        let newBlock = block.replace(
            `text: ${quoteChar}${originalText}${quoteChar}`,
            `text: "${newText}",\n    requirement: "${req}"`
        );
        
        newContent = newContent.replace(block, newBlock);
    });
}

fs.writeFileSync('src/data.ts', newContent, 'utf-8');
console.log('Successfully updated data.ts to have requirement fields.');
