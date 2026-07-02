import { WhostyleCore } from './whostyle-core.js';

export const WhostyleDOM = {
    /**
     * Initializes Whostyle on the given element by looking for the meta tag.
     * @param {HTMLElement} element 
     * @param {boolean} prefersDark 
     * @returns {boolean} True if successful
     */
    applyFromMeta(element) {
        if (!document) return false;
        
        const htmlString = document.documentElement.outerHTML;
        const hash = WhostyleCore.extract(htmlString);
        
        if (!hash) return false;
        return this.applyHash(element, hash);
    },

    /**
     * Applies a specific Whostyle hash to an element.
     * @param {HTMLElement} element 
     * @param {string} hash 
     * @param {boolean} prefersDark 
     */
    applyHash(element, hash) {
        try {
            const decoded = WhostyleCore.decode(hash);
            if (!decoded) return false;

            const { config, colors } = decoded;

            let l_bg = colors.light_bg;
            let l_text = colors.light_text;
            let l_accent = colors.light_accent;
            let l_texture = colors.light_texture;
            
            if (WhostyleCore.getContrast(l_bg, l_text) < 4.5 || WhostyleCore.getContrast(l_bg, l_accent) < 4.5) {
                l_bg = '#ffffff';
                l_text = '#000000';
                l_accent = '#0000ff';
                l_texture = 'transparent';
            }

            let d_bg = colors.dark_bg;
            let d_text = colors.dark_text;
            let d_accent = colors.dark_accent;
            let d_texture = colors.dark_texture;
            
            if (WhostyleCore.getContrast(d_bg, d_text) < 4.5 || WhostyleCore.getContrast(d_bg, d_accent) < 4.5) {
                d_bg = '#000000';
                d_text = '#ffffff';
                d_accent = '#00aaff';
                d_texture = 'transparent';
            }

            const s = element.style;
            
            // Map configuration to CSS Custom Properties
            const M = WhostyleCore.MAPPINGS;

            s.setProperty('--ws-transform', M.transforms[config.transform] || 'none');
            s.setProperty('--ws-align', M.aligns[config.align] || 'left');
            s.setProperty('--ws-list', M.lists[config.list] || 'disc');
            s.setProperty('--ws-bstyle', M.borders[config.border_style] || 'none');
            
            s.setProperty('--ws-bwidth', `${config.border_width}px`);
            s.setProperty('--ws-bradius', `${config.border_radius}px`);
            s.setProperty('--ws-soffset', `${config.shadow_offset - 4}px`); // Shifted back by 4 (-4 to 4)
            s.setProperty('--ws-sblur', `${config.shadow_blur}px`);
            s.setProperty('--ws-lspacing', `${(config.letter_spacing * 0.1 - 0.5).toFixed(1)}px`);

            // Apply Opacity to Textures
            l_texture = WhostyleCore.hexToRgba(l_texture, config.texture_opacity);
            d_texture = WhostyleCore.hexToRgba(d_texture, config.texture_opacity);

            // Compute shadow colors
            const l_shadow = WhostyleCore.hexToRgba(l_accent, config.shadow_opacity);
            const d_shadow = WhostyleCore.hexToRgba(d_accent, config.shadow_opacity);

            // Apply light colors
            s.setProperty('--ws-light-bg', l_bg);
            s.setProperty('--ws-light-text', l_text);
            s.setProperty('--ws-light-accent', l_accent);
            s.setProperty('--ws-light-texture', l_texture);
            s.setProperty('--ws-light-shadow', l_shadow);

            // Apply dark colors
            s.setProperty('--ws-dark-bg', d_bg);
            s.setProperty('--ws-dark-text', d_text);
            s.setProperty('--ws-dark-accent', d_accent);
            s.setProperty('--ws-dark-texture', d_texture);
            s.setProperty('--ws-dark-shadow', d_shadow);

            // Clean up old classes using classList
            const classesToRemove = [];
            element.classList.forEach(cls => {
                if (cls.startsWith('ws-typography-') || cls.startsWith('ws-texture-')) {
                    classesToRemove.push(cls);
                }
            });
            classesToRemove.forEach(cls => element.classList.remove(cls));
            
            // Apply new class names for Typography and Textures
            element.classList.add('whostyle-container');
            element.classList.add(`ws-typography-${M.typography[config.typography] || 'system-ui'}`);
            element.classList.add(`ws-texture-${M.textures[config.bg_texture] || 'none'}`);
            element.classList.add('whostyle-rendered');

            return true;
        } catch (e) {
            console.error("Whostyle validation failed:", e);
            return false;
        }
    }
};
