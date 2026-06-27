import fs from 'fs';

let content = fs.readFileSync('./src/data.ts', 'utf-8');

// First, clean up any previously added " - [المطلوب: ...]" or similar
content = content.replace(/ - \[المطلوب:.*?\]/g, '');
content = content.replace(/\\n\\nالمطلوب:.*?["']/g, '"'); // just in case

const blocks = content.match(/{\s*number:\s*["'][^"']+["'],\s*text:\s*(['"`])([\s\S]*?)\1,\s*options:[\s\S]*?correctIndex:\s*\d+,\s*analysis:\s*\[[\s\S]*?\]\s*}/g);

if (blocks) {
    blocks.forEach(block => {
        const textMatch = block.match(/text:\s*(['"`])([\s\S]*?)\1/);
        const originalText = textMatch[2];
        const quoteChar = textMatch[1];
        
        const analysisMatch = block.match(/text:\s*(['"`])([\s\S]*?)\1/g);
        const analysisTexts = analysisMatch ? analysisMatch.slice(1).map(t => t.replace(/text:\s*(['"`])/, '').slice(0, -1)).join(" ") : "";
        
        const optionsMatch = block.match(/options:\s*\[([\s\S]*?)\]/);
        const optionsStr = optionsMatch ? optionsMatch[1] : "";

        let requirement = "";
        
        // Let's determine requirement
        if (originalText.includes("أعرب ما تحته خط") || originalText.includes("حدد المبتدأ") || originalText.includes("ميز خبر") || originalText.includes("حدد المحل الإعرابي") || originalText.includes("ميز العبارة") || originalText.includes("صوب الخطأ") || originalText.includes("ضع") || originalText.includes("صغ") || originalText.includes("حول") || originalText.includes("أكمل") || originalText.includes("املأ") || originalText.includes("حدد اسم")) {
            // Already has explicit requirement
            requirement = ""; 
            // The user wants it for ALL questions, "لا تترك اي سؤال". 
            // So if it's already there, maybe we don't need to add it, but to be safe, let's extract it or leave it.
            // Wait, "حط المطلوب من السؤال بجانب كل سؤال... لا تترك اي سؤال".
            // I'll add "المطلوب: اختر الإجابة الصحيحة" for those that are already explicit? No, that's redundant.
            // But wait, the user's prompt means questions 1-10 (and many others) have NO requirement at all, they are just a verse of poetry.
            // For those that already have a requirement, I won't append anything, or maybe I will just to be uniform.
            // Let's only add for those that don't have a clear instruction.
        }
        
        let targetWordMatch = analysisTexts.match(/كلمة \((.*?)\)/);
        if (!targetWordMatch) targetWordMatch = analysisTexts.match(/تعرب \((.*?)\)/);
        if (!targetWordMatch) targetWordMatch = analysisTexts.match(/\((.*?)\)\s+مبتدأ/);
        if (!targetWordMatch) targetWordMatch = analysisTexts.match(/\((.*?)\)\s+اسم/);
        if (!targetWordMatch) targetWordMatch = analysisTexts.match(/إعراب \((.*?)\)/);
        if (!targetWordMatch) targetWordMatch = analysisTexts.match(/كلمة ["'](.*?)["']/);
        
        let word = "";
        if (targetWordMatch && targetWordMatch[1].split(' ').length <= 3) {
            word = targetWordMatch[1];
        }

        if (optionsStr.includes('مبتدأ') || optionsStr.includes('خبر') || optionsStr.includes('مفعول') || optionsStr.includes('اسم') || optionsStr.includes('مضاف') || optionsStr.includes('فاعل')) {
            if (word && originalText.includes(word)) {
                requirement = `أعرب كلمة (${word})`;
            } else {
                requirement = `أعرب الكلمة البارزة في الجملة`;
            }
        } else if (optionsStr.includes('مرفوع') || optionsStr.includes('منصوب') || optionsStr.includes('مجزوم')) {
            requirement = `حدد العلامة الإعرابية أو الحالة الإعرابية`;
        } else if (optionsStr.includes('جملة') && !optionsStr.includes('مفرد')) {
            requirement = `حدد المحل الإعرابي للجملة`;
        } else if (optionsStr.includes('مفرد') && optionsStr.includes('جملة')) {
            requirement = `حدد نوع الخبر (مفرد/جملة/شبه جملة)`;
        } else if (optionsStr.includes('ناقص') || optionsStr.includes('تام')) {
            requirement = `حدد نوع الاستثناء`;
        } else if (optionsStr.includes('ممنوع من الصرف')) {
            requirement = `استخرج الممنوع من الصرف وسبب منعه`;
        } else if (optionsStr.includes('توكيد')) {
            requirement = `حدد التوكيد أو إعراب الكلمة`;
        } else {
            requirement = `اختر التحليل النحوي الصحيح`;
        }

        // Check if originalText already has an instruction
        const instructionRegex = /أعرب|حدد|ميز|بين|استخرج|صغ|حول|ضع|أكمل|املأ/;
        if (!instructionRegex.test(originalText)) {
            // Append the requirement
            const newText = originalText + `\\n\\n(المطلوب: ${requirement})`;
            const newBlock = block.replace(`text: ${quoteChar}${originalText}${quoteChar}`, `text: ${quoteChar}${newText}${quoteChar}`);
            content = content.replace(block, newBlock);
        } else {
            // Even if it has an instruction, maybe add it so we are fulfilling "ALL 202 questions"
            // Let's parse the instruction out and explicitly state it
            // Actually, if it has "أعرب ما تحته خط", it's already a requirement. The user said "حط المطلوب ... بجانب كل سؤال". 
            // So if it's there, we are good. Let's just catch the missing ones.
        }
    });
}

fs.writeFileSync('./src/data.ts', content, 'utf-8');
console.log('Successfully updated data.ts with requirements.');
