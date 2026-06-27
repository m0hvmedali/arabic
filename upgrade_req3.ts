import fs from 'fs';

let content = fs.readFileSync('src/data.ts', 'utf-8');
const blocks = content.match(/{\s*number:\s*["'][^"']+["'],\s*text:\s*(['"`])([\s\S]*?)\1,\s*requirement:\s*(['"`])([\s\S]*?)\3,\s*options:[\s\S]*?correctIndex:\s*\d+,\s*analysis:\s*\[[\s\S]*?\]\s*}/g);

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function removeTashkeel(text: string) {
  return text.replace(/[\u0617-\u061A\u064B-\u0652]/g, '');
}

let newContent = content;

if (blocks) {
    blocks.forEach(block => {
        const textMatch = block.match(/text:\s*(['"`])([\s\S]*?)\1/);
        const textStr = textMatch ? textMatch[2] : "";
        const cleanText = removeTashkeel(textStr);

        const reqMatch = block.match(/requirement:\s*(['"`])([\s\S]*?)\1/);
        const reqStr = reqMatch ? reqMatch[2] : "";
        
        const optionsMatch = block.match(/options:\s*\[([\s\S]*?)\]/);
        const optionsStr = optionsMatch ? optionsMatch[1] : "";

        const analysisMatch = block.match(/analysis:\s*\[([\s\S]*?)\]/);
        const analysisStr = analysisMatch ? analysisMatch[1] : "";

        let newReq = reqStr;

        if (!newReq.includes("كلمة (") && !newReq.includes("جملة (") && !newReq.includes("المحل الإعرابي للجملة") && !newReq.includes("منع كلمة")) {
            
            let word = "";
            
            const parens = [...analysisStr.matchAll(/\((.*?)\)/g)].map(m => m[1].trim()).filter(w => w.split(' ').length <= 3 && !w.includes('أو') && !w.includes('،'));
            
            for (let w of parens) {
                if (['كذا', 'كان', 'ما', 'لا', 'مبتدأ', 'خبر', 'فاعل', 'مفعول', 'من'].includes(w)) continue;
                
                const ew = escapeRegExp(w);
                
                const patterns = [
                    new RegExp(`\\(${ew}\\)\\s+(?:تعرب|مبتدأ|خبر|فاعل|مفعول|اسم|حال|تمييز|نعت|مضاف|مستثنى|بدل)`),
                    new RegExp(`(?:ف)?\\(${ew}\\)\\s+(?:هنا\\s+)?تعرب`),
                    new RegExp(`إعراب\\s+\\(${ew}\\)`),
                    new RegExp(`كلمة\\s+\\(${ew}\\)`),
                    new RegExp(`\\(${ew}\\)\\s+اسم`),
                    new RegExp(`\\(${ew}\\)\\s+هي\\s+`)
                ];
                
                if (patterns.some(p => p.test(analysisStr)) && (cleanText.includes(removeTashkeel(w)))) {
                    word = w;
                    break;
                }
            }
            
            if (!word) {
                const quotes = [...analysisStr.matchAll(/(?:'|")([^'"]+)(?:'|")/g)].map(m => m[1].trim()).filter(w => w.split(' ').length <= 2);
                for (let w of quotes) {
                     const ew = escapeRegExp(w);
                     if (new RegExp(`كلمة\\s+['"]${ew}['"]`).test(analysisStr) && cleanText.includes(removeTashkeel(w))) {
                         word = w;
                         break;
                     }
                }
            }

            if (!word && optionsStr.match(/(?:مبتدأ|خبر|فاعل|مفعول|مضاف|اسم|تمييز|حال|مستثنى|بدل|منادى|اسم فعل)/)) {
                 const wordsInText = removeTashkeel(textStr).replace(/[^\u0621-\u064A\s]/g, '').split(/\s+/).filter(w => w.length >= 2);
                 for (let w of wordsInText) {
                     const ew = escapeRegExp(w);
                     if (new RegExp(`\\b${ew}\\b\\s+(?:مبتدأ|خبر|فاعل|مفعول|مضاف|اسم|تمييز|حال|مستثنى|بدل|منادى|بدلا)`).test(analysisStr)) {
                         word = w;
                         break;
                     }
                 }
            }

            if (word) {
                if (optionsStr.includes('مبتدأ') || optionsStr.includes('خبر') || optionsStr.includes('مفعول') || optionsStr.includes('فاعل') || optionsStr.includes('حال') || optionsStr.includes('تمييز') || optionsStr.includes('نعت') || optionsStr.includes('مضاف') || optionsStr.includes('مستثنى') || optionsStr.includes('بدل') || optionsStr.includes('اسم')) {
                    newReq = `أعرب كلمة (${word})`;
                } else if (optionsStr.includes('مرفوع') || optionsStr.includes('منصوب') || optionsStr.includes('مجزوم')) {
                    newReq = `حدد العلامة الإعرابية لكلمة (${word})`;
                } else if (optionsStr.includes('مصدر')) {
                    newReq = `حدد نوع المصدر في كلمة (${word})`;
                } else if (optionsStr.includes('ممنوع من الصرف')) {
                    newReq = `بين سبب منع كلمة (${word}) من الصرف`;
                } else if (optionsStr.includes('منادى')) {
                    newReq = `حدد نوع المنادى في كلمة (${word})`;
                } else {
                    newReq = `أعرب أو بين نوع كلمة (${word})`;
                }
            } else {
                if (optionsStr.includes('محل') && optionsStr.includes('جملة')) {
                    newReq = `حدد المحل الإعرابي للجملة المذكورة`;
                } else if (optionsStr.includes('ناقص') || optionsStr.includes('تام') || optionsStr.includes('مفرغ')) {
                    newReq = `حدد نوع أسلوب الاستثناء`;
                } else if (optionsStr.includes('ممنوع من الصرف')) {
                    newReq = `استخرج الممنوع من الصرف`;
                } else if (optionsStr.includes('مصدر')) {
                    newReq = `استخرج المصدر وبين نوعه`;
                } else if (optionsStr.includes('اسم فاعل') || optionsStr.includes('اسم مفعول') || optionsStr.includes('صيغة مبالغة')) {
                    newReq = `حدد نوع المشتق`;
                } else if (optionsStr.includes('توكيد')) {
                    newReq = `حدد التوكيد وبين إعرابه`;
                } else if (optionsStr.includes('ما')) {
                    newReq = `بين نوع (ما) في الجملة`;
                } else if (optionsStr.includes('لا')) {
                    newReq = `بين نوع (لا) في الجملة`;
                } else if (optionsStr.includes('كم')) {
                    newReq = `بين نوع (كم) في الجملة`;
                } else if (optionsStr.match(/(?:مبتدأ|خبر|فاعل|مفعول|مضاف|اسم|تمييز|حال|مستثنى|بدل)/)) {
                    newReq = `اختر الإعراب الصحيح للكلمة المطلوبة`;
                } else {
                    newReq = `اختر الإجابة النحوية الصحيحة`;
                }
            }
        }
        
        // Final sanity check for Q9 which had "لعمري"
        // If the word doesn't exist in cleanText, clear the word!
        if (newReq.includes('كلمة (')) {
            const wordMatch = newReq.match(/كلمة \((.*?)\)/);
            if (wordMatch) {
                const w = removeTashkeel(wordMatch[1]);
                if (!cleanText.includes(w) && !optionsStr.includes(w)) {
                    // It's a mistake, probably leaked from previous run
                    newReq = `اختر الإعراب الصحيح للكلمة المطلوبة`;
                }
            }
        }

        if (newReq !== reqStr) {
            const newBlock = block.replace(`requirement: "${reqStr}"`, `requirement: "${newReq.replace(/"/g, '\\"')}"`);
            newContent = newContent.replace(block, newBlock);
        }
    });
}

fs.writeFileSync('src/data.ts', newContent, 'utf-8');
console.log('Requirements upgraded again with tashkeel removal.');
