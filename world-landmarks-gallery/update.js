const fs = require('fs');
const path = require('path');

const listPath = path.join(__dirname, 'list.md');
const indexPath = path.join(__dirname, 'index.html');

const listContent = fs.readFileSync(listPath, 'utf8');
const indexContent = fs.readFileSync(indexPath, 'utf8');

// Parse list.md
const lines = listContent.split('\n').filter(line => line.trim().startsWith('- **'));
const landmarks = lines.map(line => {
    const match = line.match(/- \*\*(.*?)\*\* \((.*?)\)/);
    if (match) {
        return {
            name: match[1].trim(),
            country: match[2].trim(),
            id: match[1].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15) + Math.floor(Math.random()*1000)
        };
    }
    return null;
}).filter(Boolean);

// Generate JS Data
let jsData = '{\n';
landmarks.forEach((lm, index) => {
    jsData += `            '${lm.id}': {\n`;
    jsData += `                title: ${JSON.stringify(lm.name)},\n`;
    jsData += `                country: ${JSON.stringify(lm.country)},\n`;
    jsData += `                location: ${JSON.stringify(lm.country)},\n`;
    jsData += `                year: 'Unknown',\n`;
    jsData += `                height: 'Various',\n`;
    jsData += `                desc: ${JSON.stringify(`The ${lm.name} is a renowned landmark located in ${lm.country}. It is recognized globally as an important cultural and historical site, attracting visitors from all over the world.`)}\n`;
    jsData += `            }${index < landmarks.length - 1 ? ',' : ''}\n`;
});
jsData += '        };';

// Inject JS
const jsRegex = /const landmarkData = \{[\s\S]*?\};\s*const track =/i;
const finalContent = indexContent.replace(jsRegex, `const landmarkData = ${jsData}\n\n        const track =`);

if (finalContent === indexContent) {
    console.log("No changes made. Regex might have failed.");
} else {
    fs.writeFileSync(indexPath, finalContent, 'utf8');
    console.log("Successfully updated landmarkData in index.html!");
}
