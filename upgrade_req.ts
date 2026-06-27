import fs from 'fs';

let content = fs.readFileSync('src/data.ts', 'utf-8');
const blocks = content.match(/{\s*number:\s*["'][^"']+["'],\s*text:\s*(['"`])([\s\S]*?)\1,\s*requirement:\s*(['"`])([\s\S]*?)\3,\s*options:[\s\S]*?correctIndex:\s*\d+,\s*analysis:\s*\[[\s\S]*?\]\s*}/g);

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

let newContent = content;

if (blocks) {
    blocks.forEach(block => {
        const textMatch = block.match(/text:\s*(['"`])([\s\S]*?)\1/);
        const textStr = textMatch ? textMatch[2] : "";

        const reqMatch = block.match(/requirement:\s*(['"`])([\s\S]*?)\1/);
        const reqStr = reqMatch ? reqMatch[2] : "";
        
        const optionsMatch = block.match(/options:\s*\[([\s\S]*?)\]/);
        const optionsStr = optionsMatch ? optionsMatch[1] : "";

        const analysisMatch = block.match(/analysis:\s*\[([\s\S]*?)\]/);
        const analysisStr = analysisMatch ? analysisMatch[1] : "";

        let newReq = reqStr;

        // Try to identify if we need to refine the requirement
        if (!newReq.includes("كلمة (") && !newReq.includes("جملة (") && !newReq.includes("المحل الإعرابي للجملة") && !newReq.includes("منع كلمة")) {
            
            let word = "";
            
            // Collect all parenthesized words from analysis
            const parens = [...analysisStr.matchAll(/\((.*?)\)/g)].map(m => m[1].trim()).filter(w => w.split(' ').length <= 3 && !w.includes('أو') && !w.includes('،'));
            
            // Check if any of these words is the subject of parsing in the text
            for (let w of parens) {
                // Ignore generic terms
                if (['كذا', 'كان', 'ما', 'لا', 'مبتدأ', 'خبر', 'فاعل', 'مفعول'].includes(w)) continue;
                
                const ew = escapeRegExp(w);
                
                const patterns = [
                    new RegExp(`\\(${ew}\\)\\s+(?:تعرب|مبتدأ|خبر|فاعل|مفعول|اسم|حال|تمييز|نعت|مضاف)`),
                    new RegExp(`(?:ف)?\\(${ew}\\)\\s+(?:هنا\\s+)?تعرب`),
                    new RegExp(`إعراب\\s+\\(${ew}\\)`),
                    new RegExp(`كلمة\\s+\\(${ew}\\)`),
                    new RegExp(`\\(${ew}\\)\\s+اسم`)
                ];
                
                if (patterns.some(p => p.test(analysisStr))) {
                    word = w;
                    break;
                }
            }
            
            if (!word) {
                // Try quotes
                const quotes = [...analysisStr.matchAll(/(?:'|")([^'"]+)(?:'|")/g)].map(m => m[1].trim()).filter(w => w.split(' ').length <= 2);
                for (let w of quotes) {
                     const ew = escapeRegExp(w);
                     if (new RegExp(`كلمة\\s+['"]${ew}['"]`).test(analysisStr)) {
                         word = w;
                         break;
                     }
                }
            }

            // If we found a word, format the requirement
            if (word) {
                if (optionsStr.includes('مبتدأ') || optionsStr.includes('خبر') || optionsStr.includes('مفعول') || optionsStr.includes('فاعل') || optionsStr.includes('حال') || optionsStr.includes('تمييز') || optionsStr.includes('نعت') || optionsStr.includes('مضاف')) {
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
                // Maybe it's not a word, but a sentence or something else
                if (optionsStr.includes('محل') && optionsStr.includes('جملة')) {
                    newReq = `حدد المحل الإعرابي للجملة`;
                } else if (optionsStr.includes('ناقص') || optionsStr.includes('تام')) {
                    newReq = `حدد نوع أسلوب الاستثناء`;
                } else if (optionsStr.includes('ممنوع من الصرف')) {
                    newReq = `استخرج الممنوع من الصرف`;
                } else if (optionsStr.includes('بدل')) {
                    newReq = `حدد البدل`;
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
console.log('Requirements upgraded.');
