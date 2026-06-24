import { WhostyleCore } from './whostyle-core.js';

export const WhostyleDOM = {
    /**
     * Initializes Whostyle on the given element by looking for the meta tag.
     * @param {HTMLElement} element 
     * @param {boolean} prefersDark 
     * @returns {boolean} True if successful
     */
    applyFromMeta(element, prefersDark = null) {
        if (!document) return false;
        
        const htmlString = document.documentElement.outerHTML;
        const hash = WhostyleCore.discoverInline(htmlString);
        
        if (!hash) return false;
        return this.applyHash(element, hash, prefersDark);
    },

    /**
     * Applies a specific Whostyle hash to an element.
     * @param {HTMLElement} element 
     * @param {string} hash 
     * @param {boolean} prefersDark 
     */
    applyHash(element, hash, prefersDark = null) {
        try {
            const decoded = WhostyleCore.decode(hash);
            if (!decoded) return false;

            const { config, colors } = decoded;

            // Determine mode
            let isDark = prefersDark;
            if (isDark === null && typeof window !== 'undefined') {
                isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            }

            const prefix = isDark ? 'dark_' : 'light_';
            const bg = colors[prefix + 'bg'];
            const text = colors[prefix + 'text'];
            const accent = colors[prefix + 'accent'];
            const textureColor = colors[prefix + 'texture'];

            const s = element.style;
            
            // Map configuration to CSS Custom Properties
            const transforms = ['none', 'capitalize', 'uppercase', 'lowercase'];
            const aligns = ['left', 'right', 'center', 'justify'];
            const lists = ['disc', 'circle', 'square', 'decimal', 'lower-roman'];
            const borders = ['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset'];

            s.setProperty('--ws-transform', transforms[config.transform] || 'none');
            s.setProperty('--ws-align', aligns[config.align] || 'left');
            s.setProperty('--ws-list', lists[config.list] || 'disc');
            s.setProperty('--ws-bstyle', borders[config.border_style] || 'none');
            
            s.setProperty('--ws-bwidth', `${config.border_width}px`);
            s.setProperty('--ws-bradius', `${config.border_radius}px`);
            s.setProperty('--ws-soffset', `${config.shadow_offset - 4}px`); // Shifted back by 4 (-4 to 4)
            s.setProperty('--ws-sblur', `${config.shadow_blur}px`);
            s.setProperty('--ws-lspacing', `${(config.letter_spacing * 0.1 - 0.5).toFixed(1)}px`);

            // Apply colors
            s.setProperty('--ws-bg', bg);
            s.setProperty('--ws-text', text);
            s.setProperty('--ws-bcolor', accent);
            s.setProperty('--ws-link', accent);
            s.setProperty('--ws-texture', textureColor);

            // Clean up old classes
            element.className = element.className.replace(/\bws-typography-[\w-]+\b/g, '');
            element.className = element.className.replace(/\bws-texture-[\w-]+\b/g, '');
            
            const typographyNames = [
                'system-ui', 'segoe-roboto', 'helvetica-neue', 'verdana', 'trebuchet',
                'tahoma', 'century-gothic', 'franklin-gothic', 'gill-sans', 'arial-rounded',
                'georgia', 'times-new-roman', 'garamond', 'palatino', 'baskerville',
                'bookman', 'cambria', 'didot', 'bodoni', 'rockwell',
                'monospace', 'consolas', 'courier-new', 'monaco', 'lucida-console',
                'andale-mono', 'sf-mono', 'cascadia-code'
            ];

            const textureNames = [
                'none', 'noise', 'stripes-v', 'stripes-h', 'stripes-d-right',
                'stripes-d-left', 'pinstripes', 'wavy-lines', 'zigzag-lines', 'grid-standard',
                'grid-fine', 'grid-isometric', 'crosses', 'crosshatch', 'checkerboard',
                'checkerboard-tilt', 'triangles', 'diamonds', 'argyle', 'honeycomb',
                'chevron', 'houndstooth', 'brick-wall', 'dots-sparse', 'polka-dots',
                'circles-concentric', 'scallop', 'waves', 'woven', 'denim',
                'tartan', 'confetti'
            ];

            // Apply new class names for Typography and Textures
            element.classList.add(`ws-typography-${typographyNames[config.typography] || 'system-ui'}`);
            element.classList.add(`ws-texture-${textureNames[config.bg_texture] || 'none'}`);
            element.classList.add('whostyle-rendered');

            return true;
        } catch (e) {
            console.error("Whostyle validation failed:", e);
            return false;
        }
    }
};
