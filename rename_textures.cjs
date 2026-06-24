const fs = require('fs');

const textureNames = [
    'none', 'noise', 'stripes-v', 'stripes-h', 'stripes-d-right',
    'stripes-d-left', 'pinstripes', 'wavy-lines', 'zigzag-lines', 'grid-standard',
    'grid-fine', 'grid-isometric', 'crosses', 'crosshatch', 'checkerboard',
    'checkerboard-tilt', 'triangles', 'diamonds', 'argyle', 'honeycomb',
    'chevron', 'houndstooth', 'brick-wall', 'dots-sparse', 'polka-dots',
    'circles-concentric', 'scallop', 'waves', 'woven', 'denim',
    'tartan', 'confetti'
];

let content = fs.readFileSync('src/css/textures.css', 'utf8');
for (let i = 0; i < 32; i++) {
    const regex = new RegExp(`\\.ws-texture-${i} \\{`, 'g');
    content = content.replace(regex, `.ws-texture-${textureNames[i]} {`);
}
fs.writeFileSync('src/css/textures.css', content);

console.log('Textures CSS updated.');
