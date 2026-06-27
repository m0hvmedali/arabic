import fs from 'fs';

const content = fs.readFileSync('src/data.ts', 'utf-8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('text: "(\\",') || lines[i].includes('text: "(\\",') || lines[i].includes('text: "\\",') || lines[i].match(/text:\s*"(\\|\\")",/)) {
        // Look at the next line for the requirement
        if (lines[i+1] && lines[i+1].includes('requirement:')) {
            const reqLine = lines[i+1];
            // requirement: "اختر الإجابة الصحيحة"ليتما أولي العلم والمعرفة ناصحون شبابنا\".) ميز الصيغة الصحيحة عند حذف (ما) الكافة.",
            const match = reqLine.match(/requirement:\s*"(.*?)"(.*)",/);
            if (match) {
                const req = match[1];
                const textRest = match[2];
                // text should have been `("...textRest")` and req should be req
                lines[i] = `    text: "(\\"${textRest.replace(/^\\"/, '').replace(/\\"/g, '"').replace(/"/g, '\\"')}",`;
                lines[i+1] = `    requirement: "${req}",`;
            } else {
                // simple fix
                const reqMatch = reqLine.match(/requirement:\s*"(.*?)",/);
                if (!reqMatch) {
                    // Try to guess from the line
                    const splitReq = reqLine.split('"');
                    if (splitReq.length >= 4) {
                        const req = splitReq[1];
                        const textPart = splitReq.slice(2, -1).join('"');
                        lines[i] = `    text: "(\\"${textPart.replace(/^\\"/, '').replace(/\\"/g, '"').replace(/"/g, '\\"')}",`;
                        lines[i+1] = `    requirement: "${req}",`;
                    }
                }
            }
        }
    }
}

fs.writeFileSync('src/data.ts', lines.join('\n'));
console.log("Fixed lines.");
