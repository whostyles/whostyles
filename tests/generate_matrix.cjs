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
    letter_spacing: 26,
    texture_opacity: 4,
    shadow_opacity: 4,
    checksum: 6
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

function calculateChecksum(config) {
    const weights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    const props = [
        'typography', 'transform', 'align', 'list', 'border_style',
        'bg_texture', 'border_width', 'border_radius', 'shadow_offset',
        'shadow_blur', 'letter_spacing', 'texture_opacity', 'shadow_opacity'
    ];
    let sum = 0;
    for (let i = 0; i < props.length; i++) {
        sum += config[props[i]] * weights[i];
    }
    return sum % 6;
}

function generateHash(config, colors) {
    let value = 0n;
    
    // Calculate checksum and add to config
    config.checksum = calculateChecksum(config);
    
    // Pack config
    const order = Object.keys(RADIXES).reverse();
    for (const key of order) {
        value = value * BigInt(RADIXES[key]) + BigInt(config[key]);
    }
    
    const configB64 = encodeBase64(value, 8);
    
    // Pack colors
    const colorOrder = [
        'light_bg', 'light_text', 'light_accent', 'light_texture',
        'dark_bg', 'dark_text', 'dark_accent', 'dark_texture'
    ];
    let colorsB64 = '';
    for (const key of colorOrder) {
        colorsB64 += encodeColor(colors[key]);
    }
    
    return `{ws1:${configB64}${colorsB64}}`;
}

const testCases = [
    {
        name: "Canonical Test Vector (Appendix A)",
        config: {
            typography: 5, transform: 2, align: 1, list: 3,
            border_style: 4, bg_texture: 10, border_width: 2,
            border_radius: 8, shadow_offset: 3, shadow_blur: 5, letter_spacing: 12,
            texture_opacity: 2, shadow_opacity: 1
        },
        colors: {
            light_bg: '#f5f5f0', light_text: '#1a1a2e', light_accent: '#0055cc', light_texture: '#dddddd',
            dark_bg: '#1a1a2e', dark_text: '#f5f5f0', dark_accent: '#66aaff', dark_texture: '#333344'
        }
    },
    {
        name: "Zero State (All 0s)",
        config: {
            typography: 0, transform: 0, align: 0, list: 0,
            border_style: 0, bg_texture: 0, border_width: 0,
            border_radius: 0, shadow_offset: 0, shadow_blur: 0, letter_spacing: 0,
            texture_opacity: 0, shadow_opacity: 0
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
            border_radius: 16, shadow_offset: 8, shadow_blur: 8, letter_spacing: 25,
            texture_opacity: 3, shadow_opacity: 3
        },
        colors: {
            light_bg: '#ffffff', light_text: '#ffffff', light_accent: '#ffffff', light_texture: '#ffffff',
            dark_bg: '#ffffff', dark_text: '#ffffff', dark_accent: '#ffffff', dark_texture: '#ffffff'
        }
    },
    {
        name: "Typical State (Bootstrap-like)",
        config: {
            typography: 1, transform: 0, align: 0, list: 0,
            border_style: 4, bg_texture: 9, border_width: 1,
            border_radius: 4, shadow_offset: 5, shadow_blur: 4, letter_spacing: 5,
            texture_opacity: 0, shadow_opacity: 2
        },
        colors: {
            light_bg: '#f8f9fa', light_text: '#212529', light_accent: '#0d6efd', light_texture: '#e9ecef',
            dark_bg: '#212529', dark_text: '#f8f9fa', dark_accent: '#0d6efd', dark_texture: '#343a40'
        }
    },
    {
        name: "Contrast Fallback Trigger (Light fails, Dark passes)",
        config: {
            typography: 10, transform: 0, align: 2, list: 0,
            border_style: 0, bg_texture: 0, border_width: 0,
            border_radius: 0, shadow_offset: 4, shadow_blur: 0, letter_spacing: 5,
            texture_opacity: 0, shadow_opacity: 0
        },
        colors: {
            // Light: white bg with light gray text = fails 4.5:1
            light_bg: '#ffffff', light_text: '#cccccc', light_accent: '#dddddd', light_texture: '#eeeeee',
            // Dark: proper contrast
            dark_bg: '#121212', dark_text: '#e0e0e0', dark_accent: '#82b1ff', dark_texture: '#2a2a2a'
        }
    },
    {
        name: "Boundary Values (Single property at max, rest zero)",
        config: {
            typography: 27, transform: 0, align: 0, list: 0,
            border_style: 0, bg_texture: 0, border_width: 0,
            border_radius: 0, shadow_offset: 0, shadow_blur: 0, letter_spacing: 0,
            texture_opacity: 0, shadow_opacity: 0
        },
        colors: {
            light_bg: '#ffffff', light_text: '#000000', light_accent: '#0000ff', light_texture: '#888888',
            dark_bg: '#000000', dark_text: '#ffffff', dark_accent: '#00aaff', dark_texture: '#444444'
        }
    },
    {
        name: "Mid Values (All properties at midpoint)",
        config: {
            typography: 14, transform: 2, align: 2, list: 2,
            border_style: 5, bg_texture: 16, border_width: 3,
            border_radius: 8, shadow_offset: 4, shadow_blur: 4, letter_spacing: 13,
            texture_opacity: 2, shadow_opacity: 1
        },
        colors: {
            light_bg: '#fafafa', light_text: '#333333', light_accent: '#6366f1', light_texture: '#d4d4d8',
            dark_bg: '#18181b', dark_text: '#fafafa', dark_accent: '#818cf8', dark_texture: '#3f3f46'
        }
    },
    {
        name: "Transparent Opacity Test",
        config: {
            typography: 1, transform: 0, align: 0, list: 0,
            border_style: 0, bg_texture: 1, border_width: 0,
            border_radius: 0, shadow_offset: 4, shadow_blur: 0, letter_spacing: 5,
            texture_opacity: 3, shadow_opacity: 3
        },
        colors: {
            light_bg: '#ffffff', light_text: '#000000', light_accent: '#0000ff', light_texture: '#000000',
            dark_bg: '#000000', dark_text: '#ffffff', dark_accent: '#0000ff', dark_texture: '#000000'
        }
    },
    {
        name: "Checksum Failure Test (Same as canonical, but mutated hash)",
        config: {
            typography: 5, transform: 2, align: 1, list: 3,
            border_style: 4, bg_texture: 10, border_width: 2,
            border_radius: 8, shadow_offset: 3, shadow_blur: 5, letter_spacing: 12,
            texture_opacity: 2, shadow_opacity: 1
        },
        colors: {
            light_bg: '#f5f5f0', light_text: '#1a1a2e', light_accent: '#0055cc', light_texture: '#dddddd',
            dark_bg: '#1a1a2e', dark_text: '#f5f5f0', dark_accent: '#66aaff', dark_texture: '#333344'
        },
        is_corruption_test: true
    }
];

const matrix = testCases.map(tc => {
    let hash = generateHash(tc.config, tc.colors);
    
    if (tc.is_corruption_test) {
        // Mutate the hash by flipping the first character of the config block
        // Assuming hash starts with {ws1:
        // config block is 7 chars starting at index 5
        let chars = hash.split('');
        let charCode = chars[5].charCodeAt(0);
        chars[5] = String.fromCharCode(charCode + 1); // simple mutation
        hash = chars.join('');
    }
    
    return {
        name: tc.name,
        input: {
            config: tc.config,
            colors: tc.colors
        },
        hash: hash,
        is_corruption_test: tc.is_corruption_test || false
    };
});

fs.writeFileSync(__dirname + '/matrix.json', JSON.stringify(matrix, null, 2));
console.log("matrix.json generated successfully with " + matrix.length + " test cases.");
