const fs = require('fs');

let content = fs.readFileSync('generator/index.html', 'utf8');

const oldMethod = `    discoverInline(htmlString) {
                const regex = /<meta\\s+(?:[^>]*\\s+)?name=["']?whostyle["']?\\s+(?:[^>]*\\s+)?content=["']?({ws2:[A-Za-z0-9\\-_]{39}})["']?[^>]*>/i;
                const match = htmlString.match(regex);
                return match ? match[1] : null;
            }`;

const newMethod = `    discoverInline(htmlString) {
                let regex = /<meta\\s+(?:[^>]*\\s+)?name=["']?whostyle["']?\\s+(?:[^>]*\\s+)?content=["']?({ws2:[A-Za-z0-9\\-_]{39}})["']?[^>]*>/i;
                let match = htmlString.match(regex);
                if (match) return match[1];

                // Fallback: search for the hash anywhere in the text
                regex = /({ws2:[A-Za-z0-9\\-_]{39}})/;
                match = htmlString.match(regex);
                return match ? match[1] : null;
            }`;

content = content.replace(oldMethod, newMethod);
fs.writeFileSync('generator/index.html', content);

console.log('Generator discoverInline updated.');
