const fs = require('fs');

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

const RADIXES = {
    typography: 28,
    transform: 4,
    align: 4,
    list: 5,
    border_style: 10,
    bg_texture: 32,
    border_width: 7,
    border_radius: 17,
    shadow_offset: 9,
    shadow_blur: 9,
    letter_spacing: 26
};

// Base64 encoding/decoding
function encodeBase64(value, length) {
    let result = '';
    let v = BigInt(value);
    for (let i = 0; i < length; i++) {
        result += ALPHABET[Number(v % 64n)];
        v = v / 64n;
    }
    return result;
}

function encodeColor(hex) {
    const val = parseInt(hex.replace('#', ''), 16);
    let result = '';
    result += ALPHABET[(val >> 18) & 63];
    result += ALPHABET[(val >> 12) & 63];
    result += ALPHABET[(val >> 6) & 63];
    result += ALPHABET[val & 63];
    return result;
}

function generateHash(config, colors) {
    let value = 0n;
    
    // Pack config
    const order = Object.keys(RADIXES).reverse();
    for (const key of order) {
        value = value * BigInt(RADIXES[key]) + BigInt(config[key]);
    }
    
    const configB64 = encodeBase64(value, 7);
    
    // Pack colors
    const colorOrder = [
        'light_bg', 'light_text', 'light_accent', 'light_texture',
        'dark_bg', 'dark_text', 'dark_accent', 'dark_texture'
    ];
    let colorsB64 = '';
    for (const key of colorOrder) {
        colorsB64 += encodeColor(colors[key]);
    }
    
    return `{ws2:${configB64}${colorsB64}}`;
}

const testCases = [
    {
        name: "Zero State (All 0s)",
        config: {
            typography: 0, transform: 0, align: 0, list: 0,
            border_style: 0, bg_texture: 0, border_width: 0,
            border_radius: 0, shadow_offset: 0, shadow_blur: 0, letter_spacing: 0
        },
        colors: {
            light_bg: '#000000', light_text: '#000000', light_accent: '#000000', light_texture: '#000000',
            dark_bg: '#000000', dark_text: '#000000', dark_accent: '#000000', dark_texture: '#000000'
        }
    },
    {
        name: "Max State (All Max)",
        config: {
            typography: 27, transform: 3, align: 3, list: 4,
            border_style: 9, bg_texture: 31, border_width: 6,
            border_radius: 16, shadow_offset: 8, shadow_blur: 8, letter_spacing: 25
        },
        colors: {
            light_bg: '#ffffff', light_text: '#ffffff', light_accent: '#ffffff', light_texture: '#ffffff',
            dark_bg: '#ffffff', dark_text: '#ffffff', dark_accent: '#ffffff', dark_texture: '#ffffff'
        }
    },
    {
        name: "Typical State 1",
        config: {
            typography: 1, transform: 0, align: 0, list: 0, // sans-serif, none, left, disc
            border_style: 4, bg_texture: 9, border_width: 1, // solid, grid, 1px
            border_radius: 4, shadow_offset: 5, shadow_blur: 4, letter_spacing: 5 // 4px, 1px (5-4), 4px blur, 0px (5*0.1-0.5)
        },
        colors: {
            light_bg: '#f8f9fa', light_text: '#212529', light_accent: '#0d6efd', light_texture: '#e9ecef',
            dark_bg: '#212529', dark_text: '#f8f9fa', dark_accent: '#0d6efd', dark_texture: '#343a40'
        }
    }
];

const matrix = testCases.map(tc => {
    return {
        name: tc.name,
        input: {
            config: tc.config,
            colors: tc.colors
        },
        hash: generateHash(tc.config, tc.colors)
    };
});

fs.writeFileSync(__dirname + '/matrix.json', JSON.stringify(matrix, null, 2));
console.log("matrix.json generated successfully.");
