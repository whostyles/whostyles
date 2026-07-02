export const WhostyleCore = {
    ALPHABET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-.',
    ALPHABET_MAP: Object.fromEntries('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-.'.split('').map((c, i) => [c, i])),

    RADIXES: {
        typography: 28,
        transform: 4,
        align: 4,
        list: 5,
        border_style: 10,
        bg_texture: 32,
        border_width: 17,
        border_radius: 17,
        shadow_offset: 9,
        shadow_blur: 9,
        letter_spacing: 26,
        texture_opacity: 4,
        shadow_opacity: 4,
        texture_size: 4,
        checksum: 6
    },

    encodeBase64(value, length) {
        let result = '';
        let v = BigInt(value);
        for (let i = 0; i < length; i++) {
            result += this.ALPHABET[Number(v % 64n)];
            v = v / 64n;
        }
        return result;
    },

    decodeBase64(str) {
        let value = 0n;
        let multiplier = 1n;
        for (let i = 0; i < str.length; i++) {
            const charVal = this.ALPHABET_MAP[str[i]];
            if (charVal === undefined) throw new Error("Invalid base64 character");
            value += BigInt(charVal) * multiplier;
            multiplier *= 64n;
        }
        return value;
    },

    encodeColor(hex) {
        if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            throw new Error(`Invalid hex color format: ${hex}. Must be #RRGGBB.`);
        }
        const val = parseInt(hex.replace('#', ''), 16);
        let result = '';
        result += this.ALPHABET[(val >> 18) & 63];
        result += this.ALPHABET[(val >> 12) & 63];
        result += this.ALPHABET[(val >> 6) & 63];
        result += this.ALPHABET[val & 63];
        return result;
    },

    decodeColor(str) {
        let val = 0;
        val = (val << 6) | this.ALPHABET_MAP[str[0]];
        val = (val << 6) | this.ALPHABET_MAP[str[1]];
        val = (val << 6) | this.ALPHABET_MAP[str[2]];
        val = (val << 6) | this.ALPHABET_MAP[str[3]];
        return '#' + val.toString(16).padStart(6, '0');
    },

    calculateChecksum(config) {
        const weights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
        const props = [
            'typography', 'transform', 'align', 'list', 'border_style',
            'bg_texture', 'border_width', 'border_radius', 'shadow_offset',
            'shadow_blur', 'letter_spacing', 'texture_opacity', 'shadow_opacity', 'texture_size'
        ];
        let sum = 0;
        for (let i = 0; i < props.length; i++) {
            sum += Number(config[props[i]]) * weights[i];
        }
        return sum % 6;
    },

    encode(config, colors) {
        // Validation
        const order = Object.keys(this.RADIXES).reverse();
        for (const key of order) {
            if (key === 'checksum') continue;
            const val = Number(config[key]);
            if (isNaN(val) || val < 0 || val >= this.RADIXES[key]) {
                throw new Error(`Invalid value for ${key}: ${config[key]}. Must be integer between 0 and ${this.RADIXES[key] - 1}`);
            }
        }

        config.checksum = this.calculateChecksum(config);

        const groupAProps = ['border_width', 'bg_texture', 'border_style', 'list', 'align', 'transform', 'typography'];
        let valueA = 0n;
        for (const key of groupAProps) {
            valueA = valueA * BigInt(this.RADIXES[key]) + BigInt(config[key]);
        }
        const configB64A = this.encodeBase64(valueA, 4);

        const groupBProps = ['checksum', 'texture_size', 'shadow_opacity', 'texture_opacity', 'letter_spacing', 'shadow_blur', 'shadow_offset', 'border_radius'];
        let valueB = 0n;
        for (const key of groupBProps) {
            valueB = valueB * BigInt(this.RADIXES[key]) + BigInt(config[key]);
        }
        const configB64B = this.encodeBase64(valueB, 4);
        
        const colorOrder = [
            'light_bg', 'light_text', 'light_accent', 'light_texture', 'light_border',
            'dark_bg', 'dark_text', 'dark_accent', 'dark_texture', 'dark_border'
        ];
        let colorsB64 = '';
        for (const key of colorOrder) {
            const hex = colors[key];
            if (!hex) throw new Error(`Missing required color: ${key}`);
            colorsB64 += this.encodeColor(hex);
        }
        
        return `{ws1:${configB64A}${configB64B}${colorsB64}}`;
    },

    decode(hash) {
        const match = hash.match(/^\{ws1:([A-Za-z0-9\-.]{4})([A-Za-z0-9\-.]{4})([A-Za-z0-9\-.]{40})\}$/);
        if (!match) return null;

        const configB64A = match[1];
        const configB64B = match[2];
        const colorsB64 = match[3];

        const config = {};
        
        let valueA = this.decodeBase64(configB64A);
        const groupAProps = ['typography', 'transform', 'align', 'list', 'border_style', 'bg_texture', 'border_width'];
        for (const key of groupAProps) {
            const radix = BigInt(this.RADIXES[key]);
            config[key] = Number(valueA % radix);
            valueA = valueA / radix;
        }
        if (valueA !== 0n) return null;

        let valueB = this.decodeBase64(configB64B);
        const groupBProps = ['border_radius', 'shadow_offset', 'shadow_blur', 'letter_spacing', 'texture_opacity', 'shadow_opacity', 'texture_size', 'checksum'];
        for (const key of groupBProps) {
            const radix = BigInt(this.RADIXES[key]);
            config[key] = Number(valueB % radix);
            valueB = valueB / radix;
        }
        if (valueB !== 0n) return null;

        const expectedChecksum = this.calculateChecksum(config);
        if (config.checksum !== expectedChecksum) {
            return null; // Hash corrupted
        }

        const colors = {};
        const colorOrder = [
            'light_bg', 'light_text', 'light_accent', 'light_texture', 'light_border',
            'dark_bg', 'dark_text', 'dark_accent', 'dark_texture', 'dark_border'
        ];
        
        for (let i = 0; i < colorOrder.length; i++) {
            colors[colorOrder[i]] = this.decodeColor(colorsB64.substring(i * 4, i * 4 + 4));
        }

        return { config, colors };
    },

    extractFromHeaders(headers) {
        if (!headers) return null;
        const headerName = 'x-whostyle';
        const regex = /^\{ws1:[A-Za-z0-9\-.]{48}\}$/;
        
        // Handle Headers object (Fetch API)
        if (typeof headers.get === 'function') {
            const val = headers.get(headerName) || headers.get('X-Whostyle');
            if (val && regex.test(val.trim())) return val.trim();
        }
        // Handle plain object (Node.js/Express)
        for (const [key, value] of Object.entries(headers)) {
            if (key.toLowerCase() === headerName && typeof value === 'string' && regex.test(value.trim())) {
                return value.trim();
            }
        }
        return null;
    },

    extractFromTwtxt(feedString) {
        if (!feedString || typeof feedString !== 'string') return null;
        const regex = /^whostyle\s*=\s*(\{ws1:[A-Za-z0-9\-.]{48}\})\s*$/i;
        const lines = feedString.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('#')) continue;
            const content = trimmed.substring(1).trimStart();
            const m = content.match(regex);
            if (m) return m[1];
        }
        return null;
    },

    extract(htmlString) {
        if (!htmlString || typeof htmlString !== 'string') return null;

        let m = htmlString.match(/<meta[^>]+name=["']?whostyle["']?[^>]+content=["']?(\{ws1:[A-Za-z0-9\-.]{48}\})["']?/i);
        if (m) return m[1];

        m = htmlString.match(/"whostyle"\s*:\s*"(\{ws1:[A-Za-z0-9\-.]{48}\})"/i);
        if (m) return m[1];

        const inlineRegex = /(\{ws1:[A-Za-z0-9\-.]{48}\})/g;
        let match;
        while ((match = inlineRegex.exec(htmlString)) !== null) {
            if (match.index > 0 && htmlString[match.index - 1] === '\\') continue;
            return match[1];
        }

        return null;
    },

    clean(htmlString) {
        // Replaces raw {ws1:...} instances that are not safely inside quotes of known attributes.
        const regex = /((?:<|&lt;)meta[\s\S]{0,250}?name=(?:["']|&quot;|&#39;|&#039;)?whostyle(?:["']|&quot;|&#39;|&#039;)?[\s\S]{0,250}?content=(?:["']|&quot;|&#39;|&#039;)?\{ws1:[A-Za-z0-9\-.]{48}\}(?:["']|&quot;|&#39;|&#039;)?[\s\S]{0,250}?(?:>|&gt;))|\\(\{ws1:[A-Za-z0-9\-.]{48}\})|(\{ws1:[A-Za-z0-9\-.]{48}\})/gi;
        return htmlString.replace(regex, (match, protectedBlock, escapedHash, inlineHash) => {
            if (protectedBlock) return match;
            if (escapedHash) return escapedHash; // remove backslash
            return '';
        });
    },

    discover(htmlString, headers = null) {
        let hash = this.extractFromHeaders(headers);
        if (!hash) hash = this.extract(htmlString);
        if (!hash) return null;

        const decoded = this.decode(hash);
        if (!decoded) return null;

        const attributes = this.generateAttributes(hash);
        return {
            hash,
            decoded,
            attributes
        };
    },

    MAPPINGS: {
        transforms: ['none', 'capitalize', 'uppercase', 'lowercase'],
        aligns: ['left', 'right', 'center', 'justify'],
        lists: ['disc', 'circle', 'square', 'decimal', 'lower-roman'],
        borders: ['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset'],
        typography: [
            'system-ui', 'segoe-roboto', 'helvetica-neue', 'verdana', 'trebuchet',
            'tahoma', 'century-gothic', 'franklin-gothic', 'gill-sans', 'arial-rounded',
            'georgia', 'times-new-roman', 'garamond', 'palatino', 'baskerville',
            'bookman', 'cambria', 'didot', 'bodoni', 'rockwell',
            'monospace', 'consolas', 'courier-new', 'monaco', 'lucida-console',
            'andale-mono', 'sf-mono', 'cascadia-code'
        ],
        textures: [
            'none', 'weave', 'stripes-v', 'stripes-h', 'stripes-d-right',
            'stripes-d-left', 'fine-grain', 'zigzag-lines', 'grid-standard',
            'grid-isometric', 'crosses', 'crosshatch', 'checkerboard',
            'checkerboard-tilt', 'triangles', 'diamonds', 'argyle', 'honeycomb',
            'chevron', 'houndstooth', 'brick-wall', 'brick-dots', 'polka-dots',
            'circles-concentric', 'scallop', 'waves', 'woven', 'denim',
            'tartan', 'soft-dapple', 'confetti', 'reserved'
        ]
    },

    getLuminance(hex) {
        let r = parseInt(hex.slice(1, 3), 16) / 255;
        let g = parseInt(hex.slice(3, 5), 16) / 255;
        let b = parseInt(hex.slice(5, 7), 16) / 255;

        r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
        g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
        b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    },

    getContrast(hex1, hex2) {
        const l1 = this.getLuminance(hex1);
        const l2 = this.getLuminance(hex2);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    },

    hexToRgba(hex, opacityIndex) {
        if (hex === 'transparent') return 'transparent';
        const opacities = [1.0, 0.75, 0.50, 0.25];
        const alpha = opacities[opacityIndex] !== undefined ? opacities[opacityIndex] : 1.0;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    generateAttributes(hash) {
        const decoded = this.decode(hash);
        if (!decoded) return '';

        const { config, colors } = decoded;
        const M = this.MAPPINGS;

        const classNames = [
            'whostyle-container',
            'whostyle-rendered',
            `ws-typography-${M.typography[config.typography] || 'system-ui'}`,
            `ws-texture-${M.textures[config.bg_texture] || 'none'}`
        ];

        let l_bg = colors.light_bg;
        let l_text = colors.light_text;
        let l_accent = colors.light_accent;
        let l_texture = colors.light_texture;
        let l_border = colors.light_border;
        let d_bg = colors.dark_bg;
        let d_text = colors.dark_text;
        let d_accent = colors.dark_accent;
        let d_texture = colors.dark_texture;
        let d_border = colors.dark_border;

        // Apply contrast fallbacks
        if (this.getContrast(l_bg, l_text) < 4.5 || 
            this.getContrast(l_bg, l_accent) < 4.5 ||
            this.getContrast(l_bg, this.hexToRgba(l_texture, config.texture_opacity)) < 4.5) {
            l_bg = '#ffffff'; l_text = '#000000'; l_accent = '#0000ff'; l_texture = 'transparent'; l_border = '#cccccc';
        }
        if (this.getContrast(d_bg, d_text) < 4.5 || 
            this.getContrast(d_bg, d_accent) < 4.5 ||
            this.getContrast(d_bg, this.hexToRgba(d_texture, config.texture_opacity)) < 4.5) {
            d_bg = '#000000'; d_text = '#ffffff'; d_accent = '#00aaff'; d_texture = 'transparent'; d_border = '#555555';
        }

        const opacities = [1.0, 0.75, 0.50, 0.25];
        let ls = ((config.letter_spacing * 0.1) - 0.5).toFixed(1);

        const tsizeMap = ['8px', '16px', '24px', '36px'];

        const styles = [
            `--ws-transform: ${M.transforms[config.transform]}`,
            `--ws-align: ${M.aligns[config.align]}`,
            `--ws-list: ${M.lists[config.list]}`,
            `--ws-bstyle: ${M.borders[config.border_style]}`,
            `--ws-bwidth: ${config.border_width}px`,
            `--ws-bradius: ${config.border_radius}px`,
            `--ws-soffset: ${config.shadow_offset}px`,
            `--ws-sblur: ${config.shadow_blur}px`,
            `--ws-lspacing: ${ls}px`,
            `--ws-topacity: ${opacities[config.texture_opacity]}`,
            `--ws-sopacity: ${opacities[config.shadow_opacity]}`,
            `--ws-tsize: ${tsizeMap[config.texture_size]}`,
            
            `--ws-light-bg: ${l_bg}`,
            `--ws-light-text: ${l_text}`,
            `--ws-light-accent: ${l_accent}`,
            `--ws-light-texture: ${l_texture}`,
            `--ws-light-border: ${l_border}`,
            `--ws-light-shadow: ${this.hexToRgba(l_text, config.shadow_opacity)}`,

            `--ws-dark-bg: ${d_bg}`,
            `--ws-dark-text: ${d_text}`,
            `--ws-dark-accent: ${d_accent}`,
            `--ws-dark-texture: ${d_texture}`,
            `--ws-dark-border: ${d_border}`,
            `--ws-dark-shadow: ${this.hexToRgba(d_text, config.shadow_opacity)}`
        ];

        return `class="${classNames.join(' ')}" style="${styles.join('; ')};"`;
    }
};
