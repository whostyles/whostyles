export const WhostyleCore = {
    ALPHABET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',

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
        letter_spacing: 26
    },

    encodeBase64(value, length) {
        let result = '';
        let v = Number(value);
        for (let i = 0; i < length; i++) {
            result += this.ALPHABET[v % 64];
            v = Math.floor(v / 64);
        }
        return result;
    },

    decodeBase64(str) {
        let value = 0;
        let multiplier = 1;
        for (let i = 0; i < str.length; i++) {
            const charVal = this.ALPHABET.indexOf(str[i]);
            if (charVal === -1) throw new Error("Invalid base64 character");
            value += charVal * multiplier;
            multiplier *= 64;
        }
        return value;
    },

    encodeColor(hex) {
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
        val = (val << 6) | this.ALPHABET.indexOf(str[0]);
        val = (val << 6) | this.ALPHABET.indexOf(str[1]);
        val = (val << 6) | this.ALPHABET.indexOf(str[2]);
        val = (val << 6) | this.ALPHABET.indexOf(str[3]);
        return '#' + val.toString(16).padStart(6, '0');
    },

    encode(config, colors) {
        let value = 0;
        
        const order = Object.keys(this.RADIXES).reverse();
        for (const key of order) {
            value = value * this.RADIXES[key] + Number(config[key]);
        }
        
        const configB64 = this.encodeBase64(value, 7);
        
        const colorOrder = [
            'light_bg', 'light_text', 'light_accent', 'light_texture',
            'dark_bg', 'dark_text', 'dark_accent', 'dark_texture'
        ];
        let colorsB64 = '';
        for (const key of colorOrder) {
            colorsB64 += this.encodeColor(colors[key] || '#000000');
        }
        
        return `{ws2:${configB64}${colorsB64}}`;
    },

    decode(hash) {
        const match = hash.match(/^{ws2:([A-Za-z0-9\-_]{7})([A-Za-z0-9\-_]{32})}$/);
        if (!match) return null;

        const configB64 = match[1];
        const colorsB64 = match[2];

        let value = this.decodeBase64(configB64);
        const config = {};
        const order = Object.keys(this.RADIXES);
        
        for (const key of order) {
            const radix = this.RADIXES[key];
            config[key] = value % radix;
            value = Math.floor(value / radix);
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

    discoverInline(htmlString) {
        let regex = /<meta\s+(?:[^>]*\s+)?name=["']?whostyle["']?\s+(?:[^>]*\s+)?content=["']?({ws2:[A-Za-z0-9\-_]{39}})["']?[^>]*>/i;
        let match = htmlString.match(regex);
        if (match) return match[1];

        // Fallback: search for the hash anywhere in the text
        regex = /({ws2:[A-Za-z0-9\-_]{39}})/;
        match = htmlString.match(regex);
        return match ? match[1] : null;
    }
};
