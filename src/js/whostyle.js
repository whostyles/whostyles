export class WhostyleEngine {
    static safeFonts = ['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui'];
    static safeAlign = ['left', 'right', 'center', 'justify'];
    static safeLists = ['disc', 'circle', 'square', 'decimal', 'lower-roman'];
    static safeBorders = ['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset'];
    static colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

    static apply(element, whostyleJson, mode = 'light') {
        try {
            const data = typeof whostyleJson === 'string' ? JSON.parse(whostyleJson) : whostyleJson;
            if (!data || typeof data !== 'object' || !data.whostyle || typeof data.whostyle !== 'object') return false;

            const ws = data.whostyle;
            if (ws.version !== '1.1') return false;
            if (!ws.theme || typeof ws.theme !== 'object') return false;

            const theme = ws.theme[mode] || Object.values(ws.theme)[0];
            if (!theme || typeof theme !== 'object' || !this.colorRegex.test(theme.background) || !this.colorRegex.test(theme.text)) return false;

            // Sanitization and Assignment via Element Style List
            const s = element.style;
            s.setProperty('--ws-font', this.safeFonts.includes(ws.typography) ? ws.typography : 'sans-serif');
            s.setProperty('--ws-transform', ['none', 'capitalize', 'uppercase', 'lowercase'].includes(ws.text_transform) ? ws.text_transform : 'none');
            s.setProperty('--ws-align', this.safeAlign.includes(ws.text_align) ? ws.text_align : 'left');
            s.setProperty('--ws-list', this.safeLists.includes(ws.list_style_type) ? ws.list_style_type : 'disc');
            s.setProperty('--ws-bstyle', this.safeBorders.includes(ws.border_style) ? ws.border_style : 'none');

            // Safe Numeric Clamping
            const bwidth = parseInt(ws.border_width);
            const bradius = parseInt(ws.border_radius);
            const soffset = parseInt(ws.shadow_offset);
            const sblur = parseInt(ws.shadow_blur);
            const lspacing = parseFloat(ws.letter_spacing);

            s.setProperty('--ws-bwidth', `${Math.max(0, Math.min(4, isNaN(bwidth) ? 0 : bwidth))}px`);
            s.setProperty('--ws-bradius', `${Math.max(0, Math.min(16, isNaN(bradius) ? 0 : bradius))}px`);
            s.setProperty('--ws-soffset', `${Math.max(-4, Math.min(4, isNaN(soffset) ? 0 : soffset))}px`);
            s.setProperty('--ws-sblur', `${Math.max(0, Math.min(8, isNaN(sblur) ? 0 : sblur))}px`);
            s.setProperty('--ws-lspacing', `${Math.max(-0.5, Math.min(2.0, isNaN(lspacing) ? 0.0 : lspacing))}px`);

            // Theme Colors and Contrast Override
            let bg = theme.background;
            let text = theme.text;
            if (this.getContrastRatio(bg, text) < 4.5) {
                if (mode === 'dark') {
                    bg = '#121212';
                    text = '#e0e0e0';
                } else {
                    bg = '#ffffff';
                    text = '#000000';
                }
            }

            s.setProperty('--ws-bg', bg);
            s.setProperty('--ws-text', text);
            s.setProperty('--ws-bcolor', this.colorRegex.test(theme.border_color) ? theme.border_color : text);
            s.setProperty('--ws-link', this.colorRegex.test(theme.link_color) ? theme.link_color : text);
            s.setProperty('--ws-lhover', this.colorRegex.test(theme.link_hover_color) ? theme.link_hover_color : text);

            element.classList.add('whostyle-rendered');
            return true;
        } catch (e) {
            console.error("Whostyle validation failed:", e);
            return false;
        }
    }

    static getRelativeLuminance(hex) {
        const cleanHex = hex.replace(/^#/, '');
        let r, g, b;
        if (cleanHex.length === 3) {
            r = parseInt(cleanHex[0] + cleanHex[0], 16);
            g = parseInt(cleanHex[1] + cleanHex[1], 16);
            b = parseInt(cleanHex[2] + cleanHex[2], 16);
        } else {
            r = parseInt(cleanHex.substring(0, 2), 16);
            g = parseInt(cleanHex.substring(2, 4), 16);
            b = parseInt(cleanHex.substring(4, 6), 16);
        }

        const a = [r, g, b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });

        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    static getContrastRatio(color1, color2) {
        const lum1 = this.getRelativeLuminance(color1);
        const lum2 = this.getRelativeLuminance(color2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
    }

    static discoverInline(htmlString) {
        if (typeof DOMParser !== 'undefined') {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlString, 'text/html');
                const script = doc.querySelector('script[type="application/whostyle+json"]');
                if (script && script.textContent.trim()) {
                    return script.textContent.trim();
                }
            } catch (e) {
                return null;
            }
        } else {
            // Fallback for Node.js test environments
            const scriptRegex = /<script\s+[^>]*type=["']?application\/whostyle\+json["']?[^>]*>([\s\S]*?)<\/script>/i;
            const match = htmlString.match(scriptRegex);
            if (match && match[1] && match[1].trim()) {
                return match[1].trim();
            }
        }
        return null;
    }

    static discoverUrl(htmlString) {
        // In browser context or DOM environment
        if (typeof DOMParser !== 'undefined') {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlString, 'text/html');
                const link = doc.querySelector('link[rel="whostyle"][type="application/json"]');
                if (link && link.href) {
                    new URL(link.href); // throws if invalid
                    return link.href;
                }
            } catch (e) {
                return null;
            }
        } else {
            // Robust fallback for Node.js test environments without JSDOM
            const linkRegex = /<link\s+([^>]+)>/gi;
            let match;
            while ((match = linkRegex.exec(htmlString)) !== null) {
                const attrs = match[1];
                if (/rel=["']?whostyle["']?/i.test(attrs) && /type=["']?application\/json["']?/i.test(attrs)) {
                    const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
                    if (hrefMatch && hrefMatch[1]) {
                        try {
                            new URL(hrefMatch[1]); // throws if invalid
                            return hrefMatch[1];
                        } catch(e) {
                            return null;
                        }
                    }
                }
            }
        }
        return null;
    }

    static async fetchJson(url) {
        try {
            new URL(url); // validate URL format
            
            const abortController = new AbortController();
            const id = setTimeout(() => abortController.abort(), 5000);
            
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' },
                signal: abortController.signal
            });
            clearTimeout(id);

            if (!response.ok) return null;
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.toLowerCase().includes('application/json')) return null;

            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength, 10) > 4096) return null;

            // Environments with Web Streams (Browser / Node 18+)
            if (response.body && typeof response.body.getReader === 'function') {
                const reader = response.body.getReader();
                let receivedLength = 0;
                let chunks = [];
                while(true) {
                    const {done, value} = await reader.read();
                    if (done) break;
                    chunks.push(value);
                    receivedLength += value.length;
                    if (receivedLength > 4096) {
                        return null; // Exceeded 4KB limit
                    }
                }
                const bodyString = new TextDecoder("utf-8").decode(
                    chunks.reduce((acc, val) => {
                        const c = new Uint8Array(acc.length + val.length);
                        c.set(acc);
                        c.set(val, acc.length);
                        return c;
                    }, new Uint8Array(0))
                );
                return bodyString;
            } 
            // Environments with Node.js Async Iterators (node-fetch v2/v3 fallback)
            else if (response.body && typeof response.body[Symbol.asyncIterator] === 'function') {
                let receivedLength = 0;
                let chunks = [];
                for await (const chunk of response.body) {
                    chunks.push(chunk);
                    receivedLength += chunk.length;
                    if (receivedLength > 4096) {
                        return null; // Exceeded 4KB limit
                    }
                }
                return Buffer.concat(chunks).toString('utf-8');
            } 
            // Absolute last resort fallback (less safe against OOM)
            else {
                const text = await response.text();
                if (text.length > 4096) return null;
                return text;
            }
        } catch (e) {
            return null;
        }
    }
}