import fs from 'fs';

const content = fs.readFileSync('./src/data.ts', 'utf-8');

// We will use regex to find each question block, and inject a "requirement" field or modify "text".
// The user asked to "حط المطلوب من السؤال بجانب كل سؤال من الاسئله جميعا ليفهم الطالب ماذا يجب ان يفعل في كل الاسئله ال 202 لا تترك اي سؤال"
// So let's add `requirement: "المطلوب: أعرب الكلمة / أجب عن السؤال",` if it's not clear, or extract it from analysis.

let updatedContent = content;

const blocks = content.match(/{\s*number:\s*["'][^"']+["'],\s*text:\s*["`'][^"`']+["`'],\s*options:[\s\S]*?correctIndex:\s*\d+,\s*analysis:\s*\[[\s\S]*?\]\s*}/g);

if (blocks) {
    blocks.forEach(block => {
        const textMatch = block.match(/text:\s*(['"`])(.*?)\1/);
        const text = textMatch ? textMatch[2] : '';
        
        let requirement = "";
        
        // If text already has a requirement-like keyword
        const hasReq = /أعرب|حدد|ميز|بين|استخرج|ما |لماذا|كيف|هل|اختر|الصياغة|المحل الإعرابي|سبب|ماذا|ضع|صغ|حول|املأ|أكمل|؟/.test(text);
        
        if (!hasReq) {
            // Let's guess the requirement based on options or analysis
            const analysisMatch = block.match(/text:\s*(['"`])(.*?)\1/g); // matches all text fields including analysis
            const analysisTexts = analysisMatch ? analysisMatch.slice(1).map(t => t.replace(/text:\s*(['"`])/, '').slice(0, -1)).join(" ") : "";
            
            const optionsMatch = block.match(/options:\s*\[([\s\S]*?)\]/);
            const optionsStr = optionsMatch ? optionsMatch[1] : "";
            
            if (optionsStr.includes('مبتدأ') || optionsStr.includes('خبر') || optionsStr.includes('مفعول') || optionsStr.includes('اسم') || optionsStr.includes('مضاف')) {
                // It's a parsing question
                // Find the word being parsed in the analysis
                const wordMatch = analysisTexts.match(/كلمة \((.*?)\)/) || analysisTexts.match(/تعرب \((.*?)\)/) || analysisTexts.match(/\((.*?)\)\s+مبتدأ/) || analysisTexts.match(/\((.*?)\)\s+اسم/) || analysisTexts.match(/\((.*?)\)\s+تعرب/) || analysisTexts.match(/إعراب \((.*?)\)/);
                
                let word = "الكلمة المحددة";
                if (wordMatch) word = wordMatch[1];
                else {
                    // Try to find any word in parentheses that isn't too long
                    const parens = analysisTexts.match(/\((.*?)\)/g);
                    if (parens) {
                        for (let p of parens) {
                            let w = p.slice(1, -1);
                            if (w.split(' ').length <= 2 && text.includes(w)) {
                                word = w;
                                break;
                            }
                        }
                    }
                }
                requirement = `أعرب ما تحته خط (${word})`;
            } else if (optionsStr.includes('مرفوع') || optionsStr.includes('منصوب') || optionsStr.includes('مجزوم')) {
                 requirement = `حدد إعراب الفعل / الكلمة`;
            } else if (optionsStr.includes('جملة')) {
                 requirement = `حدد المحل الإعرابي للجملة`;
            } else if (optionsStr.includes('توكيد')) {
                 requirement = `حدد التوكيد`;
            } else if (optionsStr.includes('ممنوع من الصرف')) {
                 requirement = `استخرج الممنوع من الصرف`;
            } else if (optionsStr.includes('منادى')) {
                 requirement = `حدد نوع المنادى`;
            } else if (analysisTexts.includes('نوع الخبر')) {
                 requirement = `حدد نوع الخبر`;
            } else if (analysisTexts.includes('نوع ما')) {
                 requirement = `بين نوع (ما)`;
            } else {
                 requirement = `اختر الإجابة الصحيحة بناءً على القاعدة النحوية`;
            }
        } else {
            // Already has requirement, but the user said "حط المطلوب من السؤال بجانب كل سؤال... لا تترك اي سؤال".
            // Let's extract the existing requirement from the text or just label it.
            // Actually, if it has a requirement, maybe we just leave the text as is, or explicitly add a requirement field.
            requirement = "موجود ضمن نص السؤال";
        }

        if (requirement !== "موجود ضمن نص السؤال") {
            // Append to text
            const newText = text + " - [المطلوب: " + requirement + "]";
            const newBlock = block.replace(/text:\s*(['"`])(.*?)\1/, `text: $1${newText}$1`);
            updatedContent = updatedContent.replace(block, newBlock);
        }
    });
}

fs.writeFileSync('./src/data.ts', updatedContent, 'utf-8');
console.log('Successfully updated data.ts');
