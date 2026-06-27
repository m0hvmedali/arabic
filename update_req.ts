import fs from 'fs';

const content = fs.readFileSync('src/data.ts', 'utf-8');
const blocks = content.match(/{\s*number:\s*["'][^"']+["'],\s*text:\s*(['"`])([\s\S]*?)\1,\s*requirement:\s*(['"`])([\s\S]*?)\3,\s*options:[\s\S]*?correctIndex:\s*\d+,\s*analysis:\s*\[[\s\S]*?\]\s*}/g);

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

        // Clean up previous placeholders
        if (newReq.includes("الكلمة البارزة") || newReq.includes("ما تحته خط") || newReq.includes("الكلمة") || newReq === "اختر الإجابة الصحيحة" || newReq.includes("اختر التحليل") || newReq.includes("اقرأ العبارة")) {
            
            // Try to find the target word in the analysis or options
            // Patterns in analysis: "كلمة (كذا)", "تعرب (كذا)", "(كذا) مبتدأ", "(كذا) تعرب"
            let word = "";
            const wordMatch1 = analysisStr.match(/كلمة \((.*?)\)/);
            const wordMatch2 = analysisStr.match(/تعرب \((.*?)\)/);
            const wordMatch3 = analysisStr.match(/\((.*?)\)\s+مبتدأ/);
            const wordMatch4 = analysisStr.match(/\((.*?)\)\s+اسم/);
            const wordMatch5 = analysisStr.match(/إعراب \((.*?)\)/);
            const wordMatch6 = analysisStr.match(/كلمة ["'](.*?)["']/);
            const wordMatch7 = analysisStr.match(/\((.*?)\)\s+تعرب/);
            const wordMatch8 = analysisStr.match(/\((.*?)\)\s+حال/);
            const wordMatch9 = analysisStr.match(/\((.*?)\)\s+فاعل/);
            const wordMatch10 = analysisStr.match(/\((.*?)\)\s+مفعول/);
            const wordMatch11 = analysisStr.match(/\((.*?)\)\s+خبر/);
            const wordMatch12 = analysisStr.match(/\((.*?)\)\s+مضاف/);
            const wordMatch13 = analysisStr.match(/\((.*?)\)\s+تمييز/);
            const wordMatch14 = analysisStr.match(/\((.*?)\)\s+نعت/);
            
            // Or look in the text if there's a specific instruction (e.g. "أعرب كلمة كذا")
            const textWordMatch = textStr.match(/أعرب\s+(?:كلمة\s+)?['"\(\[]?(.*?)['"\)\]]?/);
            
            const matches = [wordMatch1, wordMatch2, wordMatch3, wordMatch4, wordMatch5, wordMatch6, wordMatch7, wordMatch8, wordMatch9, wordMatch10, wordMatch11, wordMatch12, wordMatch13, wordMatch14];
            
            for (let m of matches) {
                if (m && m[1].trim().split(' ').length <= 4 && !m[1].includes('أو') && !m[1].includes('،')) {
                    word = m[1].trim();
                    break;
                }
            }

            if (!word && textWordMatch && textWordMatch[1].split(' ').length <= 3) {
                word = textWordMatch[1].trim();
            }

            // Some specific fallbacks based on options
            if (!word && optionsStr.includes("مبتدأ")) {
                // If it asks for إعراب without a word, see if we can find a word in quotes in the options
                const optWord = optionsStr.match(/(?:أ|ب|ج|د\))\s*['"](.*?)['"]/);
                if (optWord) word = optWord[1].trim();
            }

            // Determine what to ask for
            if (word) {
                // Determine if it's asking for إعراب, سبب منع من الصرف, الخ
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
                } else if (optionsStr.includes('استثناء') || optionsStr.includes('ناقص') || optionsStr.includes('تام')) {
                    newReq = `حدد نوع أسلوب الاستثناء`;
                } else {
                    newReq = `حدد إعراب أو نوع كلمة (${word})`;
                }
            } else {
                // Fallback if no specific word is found
                if (optionsStr.includes('جملة') && (optionsStr.includes('محل') || optionsStr.includes('خبر') || optionsStr.includes('نعت'))) {
                    newReq = `حدد المحل الإعرابي للجملة المذكورة`;
                } else if (optionsStr.includes('ناقص') || optionsStr.includes('تام') || optionsStr.includes('مفرغ')) {
                    newReq = `حدد نوع أسلوب الاستثناء`;
                } else if (optionsStr.includes('ممنوع من الصرف')) {
                    newReq = `استخرج الممنوع من الصرف`;
                } else if (optionsStr.includes('مصدر')) {
                    newReq = `حدد نوع المصدر`;
                } else if (optionsStr.includes('اسم فاعل') || optionsStr.includes('اسم مفعول') || optionsStr.includes('صيغة مبالغة')) {
                    newReq = `حدد نوع المشتق`;
                } else if (optionsStr.includes('مبتدأ مؤخر') || optionsStr.includes('خبر مقدم')) {
                    newReq = `بين حكم تقديم الخبر`;
                } else if (optionsStr.includes('توكيد')) {
                    newReq = `حدد التوكيد`;
                } else if (optionsStr.includes('كم')) {
                    newReq = `بين نوع (كم)`;
                } else if (optionsStr.includes('ما')) {
                    newReq = `بين نوع (ما)`;
                } else if (optionsStr.includes('لا')) {
                    newReq = `بين نوع (لا)`;
                } else if (optionsStr.includes('بدل')) {
                    newReq = `استخرج البدل وبين نوعه`;
                } else if (optionsStr.includes('مضارع')) {
                    newReq = `حدد إعراب الفعل المضارع`;
                } else {
                    newReq = `اختر الإجابة النحوية الصحيحة`;
                }
            }
        }
        
        // Final sanity check, if reqStr was already a precise requirement (not generic), keep it unless we just improved it
        if (!reqStr.includes("الكلمة البارزة") && !reqStr.includes("اقرأ العبارة") && reqStr !== "اختر الإجابة الصحيحة" && reqStr !== "حدد إعراب الكلمة" && reqStr !== "أعرب الكلمة البارزة في الجملة") {
            // Keep original if it seems better
            // Except if it has "ما تحته خط" and we found a word
            if (reqStr.includes("ما تحته خط") && newReq.includes("كلمة (")) {
                // Use newReq
            } else if (reqStr !== newReq) {
                // Prefer the user's specific text if it was extracted properly
                if (!newReq.includes("كلمة (") && !reqStr.includes("كلمة (")) {
                     newReq = reqStr;
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
console.log('Requirements updated successfully.');
