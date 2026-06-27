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

        if (newReq === 'حدد المحل الإعرابي للجملة المذكورة' || newReq === 'أعرب أو بين نوع كلمة (لعمري)' || newReq.includes('أعرب أو بين نوع كلمة')) {
            // Check if there's a clear word being parsed
            let word = "";
            const parens = [...analysisStr.matchAll(/إعراب\s+\((.*?)\)/g)].map(m => m[1].trim());
            if (parens.length > 0) word = parens[0];
            
            if (!word) {
                const wordsInText = removeTashkeel(textStr).replace(/[^\u0621-\u064A\s]/g, '').split(/\s+/).filter(w => w.length >= 3);
                for (let w of wordsInText) {
                    const ew = escapeRegExp(w);
                    if (new RegExp(`(?:^|\\s|["'(])(?:ف|و|ب|ك|ل)?${ew}(?:$|\\s|[.,'"])\\s*(?:تعرب|هي|مبتدأ|خبر|فاعل|مفعول|مضاف|اسم|تمييز|حال|مستثنى|بدل|منادى|بدلا)`).test(analysisStr)) {
                        word = w;
                        break;
                    }
                }
            }
            
            if (!word) {
                const parens2 = [...analysisStr.matchAll(/\((.*?)\)\s+(?:تعرب|مبتدأ|خبر|فاعل|مفعول|اسم|حال|تمييز|نعت|مضاف|مستثنى|بدل)/g)].map(m => m[1].trim());
                if (parens2.length > 0) word = parens2[0];
            }

            if (word && optionsStr.match(/(?:مبتدأ|خبر|فاعل|مفعول|مضاف|اسم|تمييز|حال|مستثنى|بدل|منادى)/)) {
                newReq = `أعرب كلمة (${word})`;
            }
        }

        if (newReq !== reqStr) {
            const newBlock = block.replace(`requirement: "${reqStr}"`, `requirement: "${newReq.replace(/"/g, '\\"')}"`);
            newContent = newContent.replace(block, newBlock);
        }
    });
}

fs.writeFileSync('src/data.ts', newContent, 'utf-8');
console.log('Requirements upgraded final pass.');
