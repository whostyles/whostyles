export const WhostyleCore = {
    ALPHABET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
    ALPHABET_MAP: Object.fromEntries('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'.split('').map((c, i) => [c, i])),

    RADIXES: {
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
        const weights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
        const props = [
            'typography', 'transform', 'align', 'list', 'border_style',
            'bg_texture', 'border_width', 'border_radius', 'shadow_offset',
            'shadow_blur', 'letter_spacing', 'texture_opacity', 'shadow_opacity'
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

        let value = 0n;
        for (const key of order) {
            value = value * BigInt(this.RADIXES[key]) + BigInt(config[key]);
        }
        
        const configB64 = this.encodeBase64(value, 8);
        
        const colorOrder = [
            'light_bg', 'light_text', 'light_accent', 'light_texture',
            'dark_bg', 'dark_text', 'dark_accent', 'dark_texture'
        ];
        let colorsB64 = '';
        for (const key of colorOrder) {
            const hex = colors[key];
            if (!hex) throw new Error(`Missing required color: ${key}`);
            colorsB64 += this.encodeColor(hex);
        }
        
        return `{ws1:${configB64}${colorsB64}}`;
    },

    decode(hash) {
        const match = hash.match(/^{ws1:([A-Za-z0-9\-_]{8})([A-Za-z0-9\-_]{32})}$/);
        if (!match) return null;

        const configB64 = match[1];
        const colorsB64 = match[2];

        let value = this.decodeBase64(configB64);
        const config = {};
        const order = Object.keys(this.RADIXES);
        
        for (const key of order) {
            const radix = BigInt(this.RADIXES[key]);
            config[key] = Number(value % radix);
            value = value / radix;
        }

        const expectedChecksum = this.calculateChecksum(config);
        if (config.checksum !== expectedChecksum) {
            return null; // Hash corrupted
        }

        const colors = {};
        const colorOrder = [
            'light_bg', 'light_text', 'light_accent', 'light_texture',
            'dark_bg', 'dark_text', 'dark_accent', 'dark_texture'
        ];
        
        for (let i = 0; i < colorOrder.length; i++) {
            colors[colorOrder[i]] = this.decodeColor(colorsB64.substring(i * 4, i * 4 + 4));
        }

        return { config, colors };
    },

    extractFromHeaders(headers) {
        if (!headers) return null;
        const headerName = 'x-whostyle';
        const regex = /^{ws1:[A-Za-z0-9\-_]{40}}$/;
        
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
        const regex = /^whostyle\s*=\s*({ws1:[A-Za-z0-9\-_]{40}})\s*$/i;
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

        let m = htmlString.match(/<meta[^>]+name=["']?whostyle["']?[^>]+content=["']?({ws1:[A-Za-z0-9\-_]{40}})["']?/i);
        if (m) return m[1];

        m = htmlString.match(/<link[^>]+rel=["']?whostyle["']?[^>]+href=["']?data:text\/plain,({ws1:[A-Za-z0-9\-_]{40}})["']?/i);
        if (m) return m[1];

        m = htmlString.match(/"whostyle"\s*:\s*"({ws1:[A-Za-z0-9\-_]{40}})"/i);
        if (m) return m[1];

        m = htmlString.match(/({ws1:[A-Za-z0-9\-_]{40}})/);
        if (m) return m[1];

        return null;
    },

    clean(htmlString) {
        // Replaces raw {ws1:...} instances that are not safely inside quotes of known attributes.
        const regex = /((?:<|&lt;)meta[\s\S]{0,250}?name=(?:["']|&quot;|&#39;|&#039;)?whostyle(?:["']|&quot;|&#39;|&#039;)?[\s\S]{0,250}?content=(?:["']|&quot;|&#39;|&#039;)?{ws1:[A-Za-z0-9\-_]{40}}(?:["']|&quot;|&#39;|&#039;)?[\s\S]{0,250}?(?:>|&gt;))|({ws1:[A-Za-z0-9\-_]{40}})/gi;
        return htmlString.replace(regex, (match, protectedBlock, inlineHash) => {
            if (protectedBlock) return match;
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
            'none', 'noise', 'stripes-v', 'stripes-h', 'stripes-d-right',
            'stripes-d-left', 'pinstripes', 'wavy-lines', 'zigzag-lines', 'grid-standard',
            'grid-fine', 'grid-isometric', 'crosses', 'crosshatch', 'checkerboard',
            'checkerboard-tilt', 'triangles', 'diamonds', 'argyle', 'honeycomb',
            'chevron', 'houndstooth', 'brick-wall', 'dots-sparse', 'polka-dots',
            'circles-concentric', 'scallop', 'waves', 'woven', 'denim',
            'tartan', 'confetti'
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
        
        if (this.getContrast(l_bg, l_text) < 4.5 || this.getContrast(l_bg, l_accent) < 4.5) {
            l_bg = '#ffffff';
            l_text = '#000000';
            l_accent = '#0000ff';
            l_texture = 'transparent';
        }

        let d_bg = colors.dark_bg;
        let d_text = colors.dark_text;
        let d_accent = colors.dark_accent;
        let d_texture = colors.dark_texture;
        
        if (this.getContrast(d_bg, d_text) < 4.5 || this.getContrast(d_bg, d_accent) < 4.5) {
            d_bg = '#000000';
            d_text = '#ffffff';
            d_accent = '#00aaff';
            d_texture = 'transparent';
        }

        // Apply Opacity to Textures
        l_texture = this.hexToRgba(l_texture, config.texture_opacity);
        d_texture = this.hexToRgba(d_texture, config.texture_opacity);
        
        // Compute shadow colors
        const l_shadow = this.hexToRgba(l_accent, config.shadow_opacity);
        const d_shadow = this.hexToRgba(d_accent, config.shadow_opacity);

        const styles = [
            `--ws-transform: ${M.transforms[config.transform] || 'none'}`,
            `--ws-align: ${M.aligns[config.align] || 'left'}`,
            `--ws-list: ${M.lists[config.list] || 'disc'}`,
            `--ws-bstyle: ${M.borders[config.border_style] || 'none'}`,
            `--ws-bwidth: ${config.border_width}px`,
            `--ws-bradius: ${config.border_radius}px`,
            `--ws-soffset: ${config.shadow_offset - 4}px`,
            `--ws-sblur: ${config.shadow_blur}px`,
            `--ws-lspacing: ${(config.letter_spacing * 0.1 - 0.5).toFixed(1)}px`,
            `--ws-light-bg: ${l_bg}`,
            `--ws-light-text: ${l_text}`,
            `--ws-light-accent: ${l_accent}`,
            `--ws-light-texture: ${l_texture}`,
            `--ws-light-shadow: ${l_shadow}`,
            `--ws-dark-bg: ${d_bg}`,
            `--ws-dark-text: ${d_text}`,
            `--ws-dark-accent: ${d_accent}`,
            `--ws-dark-texture: ${d_texture}`,
            `--ws-dark-shadow: ${d_shadow}`
        ];

        return `class="${classNames.join(' ')}" style="${styles.join('; ')};"`;
    }
};
