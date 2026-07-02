import re
from typing import Optional, Dict, Any

class Whostyles:
    ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
    
    RADIXES = {
        'typography': 28,
        'transform': 4,
        'align': 4,
        'list': 5,
        'border_style': 10,
        'bg_texture': 32,
        'border_width': 7,
        'border_radius': 17,
        'shadow_offset': 9,
        'shadow_blur': 9,
        'letter_spacing': 26,
        'texture_opacity': 4,
        'shadow_opacity': 4,
        'checksum': 6
    }
    
    COLOR_ORDER = [
        'light_bg', 'light_text', 'light_accent', 'light_texture',
        'dark_bg', 'dark_text', 'dark_accent', 'dark_texture'
    ]

    @classmethod
    def decode_base64(cls, s: str) -> int:
        value = 0
        multiplier = 1
        for char in s:
            char_val = cls.ALPHABET.find(char)
            if char_val == -1:
                raise ValueError("Invalid base64 character")
            value += char_val * multiplier
            multiplier *= 64
        return value

    @classmethod
    def encode_base64(cls, value: int, length: int) -> str:
        result = ''
        for _ in range(length):
            result += cls.ALPHABET[value % 64]
            value //= 64
        return result

    @classmethod
    def decode_color(cls, s: str) -> str:
        val = 0
        for i in range(4):
            idx = cls.ALPHABET.find(s[i])
            if idx == -1:
                raise ValueError("Invalid base64 color character")
            val = (val << 6) | idx
        return f"#{val:06x}"

    @classmethod
    def encode_color(cls, hex_str: str) -> str:
        if not re.match(r'^#[0-9a-fA-F]{6}$', hex_str):
            raise ValueError(f"Invalid hex color format: {hex_str}. Must be #RRGGBB.")
        val = int(hex_str.lstrip('#'), 16)
        result = ''
        result += cls.ALPHABET[(val >> 18) & 63]
        result += cls.ALPHABET[(val >> 12) & 63]
        result += cls.ALPHABET[(val >> 6) & 63]
        result += cls.ALPHABET[val & 63]
        return result

    @classmethod
    def calculate_checksum(cls, config: Dict[str, int]) -> int:
        weights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
        props = [
            'typography', 'transform', 'align', 'list', 'border_style',
            'bg_texture', 'border_width', 'border_radius', 'shadow_offset',
            'shadow_blur', 'letter_spacing', 'texture_opacity', 'shadow_opacity'
        ]
        s = 0
        for i, prop in enumerate(props):
            s += int(config.get(prop, 0)) * weights[i]
        return s % 6

    @classmethod
    def decode(cls, hash_str: str) -> Optional[Dict[str, Any]]:
        match = re.match(r'^{ws1:([A-Za-z0-9\-_]{8})([A-Za-z0-9\-_]{32})}$', hash_str)
        if not match:
            return None
        
        config_b64 = match.group(1)
        colors_b64 = match.group(2)
        
        try:
            value = cls.decode_base64(config_b64)
        except ValueError:
            return None
            
        config = {}
        for key, radix in cls.RADIXES.items():
            config[key] = value % radix
            value //= radix
            
        expected_checksum = cls.calculate_checksum(config)
        if config.get('checksum') != expected_checksum:
            return None # Corruption detected
            
        colors = {}
        for i, key in enumerate(cls.COLOR_ORDER):
            chunk = colors_b64[i*4 : i*4+4]
            colors[key] = cls.decode_color(chunk)
            
        return {'config': config, 'colors': colors}

    @classmethod
    def encode(cls, config: Dict[str, Any], colors: Dict[str, Any]) -> str:
        # Validation
        for key in reversed(list(cls.RADIXES.keys())):
            if key == 'checksum':
                continue
            if key not in config:
                raise ValueError(f"Missing required config property: {key}")
            val = int(config[key])
            if val < 0 or val >= cls.RADIXES[key]:
                raise ValueError(f"Invalid value for {key}: {val}. Must be integer between 0 and {cls.RADIXES[key]-1}")
                
        config['checksum'] = cls.calculate_checksum(config)
        
        value = 0
        for key in reversed(list(cls.RADIXES.keys())):
            value = value * cls.RADIXES[key] + int(config.get(key, 0))
            
        config_b64 = cls.encode_base64(value, 8)
        
        colors_b64 = ''
        for key in cls.COLOR_ORDER:
            if key not in colors:
                raise ValueError(f"Missing required color: {key}")
            colors_b64 += cls.encode_color(colors[key])
            
        return f"{{ws1:{config_b64}{colors_b64}}}"

    @classmethod
    def extract_from_headers(cls, headers: Optional[Dict[str, str]] = None) -> Optional[str]:
        if not headers:
            return None
        
        for k, val in headers.items():
            if k.lower() == 'x-whostyle':
                if re.match(r'^{ws1:[A-Za-z0-9\-_]{40}}$', val):
                    return val.strip()
        return None

    @classmethod
    def extract_from_twtxt(cls, feed_string: str) -> Optional[str]:
        if not feed_string:
            return None
        for line in feed_string.split('\n'):
            line = line.strip()
            if not line or line[0] != '#':
                continue
            content = line[1:].lstrip()
            m = re.match(r'^whostyle\s*=\s*({ws1:[A-Za-z0-9\-_]{40}})\s*$', content, re.IGNORECASE)
            if m:
                return m.group(1)
        return None

    @classmethod
    def extract(cls, html: str) -> Optional[str]:
        if not html:
            return None
            
        # 1. Meta
        m = re.search(r'<meta[^>]+name=["\']?whostyle["\']?[^>]+content=["\']?({ws1:[A-Za-z0-9\-_]{40}})["\']?', html, re.IGNORECASE)
        if m: return m.group(1)

        # 2. Link
        m = re.search(r'<link[^>]+rel=["\']?whostyle["\']?[^>]+href=["\']?data:text/plain,({ws1:[A-Za-z0-9\-_]{40}})["\']?', html, re.IGNORECASE)
        if m: return m.group(1)

        # 3. JSON-LD
        m = re.search(r'"whostyle"\s*:\s*"({ws1:[A-Za-z0-9\-_]{40}})"', html, re.IGNORECASE)
        if m: return m.group(1)

        # 4. Inline
        m = re.search(r'({ws1:[A-Za-z0-9\-_]{40}})', html)
        if m: return m.group(1)

        return None

    @classmethod
    def clean(cls, html: str) -> str:
        def repl(match):
            if match.group(1):
                return match.group(1)
            return ''
            
        pattern = re.compile(r'((?:<|&lt;)meta[\s\S]{0,250}?name=(?:["\']|&quot;|&#39;|&#039;)?whostyle(?:["\']|&quot;|&#39;|&#039;)?[\s\S]{0,250}?content=(?:["\']|&quot;|&#39;|&#039;)?{ws1:[A-Za-z0-9\-_]{40}}(?:["\']|&quot;|&#39;|&#039;)?[\s\S]{0,250}?(?:>|&gt;))|({ws1:[A-Za-z0-9\-_]{40}})', re.IGNORECASE)
        return pattern.sub(repl, html)

    @classmethod
    def discover(cls, html: str, headers: Optional[Dict[str, str]] = None) -> Optional[Dict[str, Any]]:
        hash_str = cls.extract_from_headers(headers)
        if not hash_str:
            hash_str = cls.extract(html)
        if not hash_str:
            return None
            
        decoded = cls.decode(hash_str)
        if not decoded:
            return None
            
        attributes = cls.generate_attributes(hash_str)
        return {
            'hash': hash_str,
            'decoded': decoded,
            'attributes': attributes
        }

    MAPPINGS = {
        'transforms': ['none', 'capitalize', 'uppercase', 'lowercase'],
        'aligns': ['left', 'right', 'center', 'justify'],
        'lists': ['disc', 'circle', 'square', 'decimal', 'lower-roman'],
        'borders': ['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset'],
        'typography': [
            'system-ui', 'segoe-roboto', 'helvetica-neue', 'verdana', 'trebuchet',
            'tahoma', 'century-gothic', 'franklin-gothic', 'gill-sans', 'arial-rounded',
            'georgia', 'times-new-roman', 'garamond', 'palatino', 'baskerville',
            'bookman', 'cambria', 'didot', 'bodoni', 'rockwell',
            'monospace', 'consolas', 'courier-new', 'monaco', 'lucida-console',
            'andale-mono', 'sf-mono', 'cascadia-code'
        ],
        'textures': [
            'none', 'noise', 'stripes-v', 'stripes-h', 'stripes-d-right',
            'stripes-d-left', 'pinstripes', 'wavy-lines', 'zigzag-lines', 'grid-standard',
            'grid-fine', 'grid-isometric', 'crosses', 'crosshatch', 'checkerboard',
            'checkerboard-tilt', 'triangles', 'diamonds', 'argyle', 'honeycomb',
            'chevron', 'houndstooth', 'brick-wall', 'dots-sparse', 'polka-dots',
            'circles-concentric', 'scallop', 'waves', 'woven', 'denim',
            'tartan', 'confetti'
        ]
    }

    @staticmethod
    def _get_luminance(hex_str: str) -> float:
        r = int(hex_str[1:3], 16) / 255.0
        g = int(hex_str[3:5], 16) / 255.0
        b = int(hex_str[5:7], 16) / 255.0

        r = r / 12.92 if r <= 0.03928 else ((r + 0.055) / 1.055) ** 2.4
        g = g / 12.92 if g <= 0.03928 else ((g + 0.055) / 1.055) ** 2.4
        b = b / 12.92 if b <= 0.03928 else ((b + 0.055) / 1.055) ** 2.4

        return 0.2126 * r + 0.7152 * g + 0.0722 * b

    @classmethod
    def _get_contrast(cls, hex1: str, hex2: str) -> float:
        l1 = cls._get_luminance(hex1)
        l2 = cls._get_luminance(hex2)
        return (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)

    @classmethod
    def hex_to_rgba(cls, hex_str: str, opacity_index: int) -> str:
        if hex_str == 'transparent':
            return 'transparent'
        opacities = [1.0, 0.75, 0.50, 0.25]
        alpha = opacities[opacity_index] if 0 <= opacity_index < len(opacities) else 1.0
        r = int(hex_str[1:3], 16)
        g = int(hex_str[3:5], 16)
        b = int(hex_str[5:7], 16)
        return f"rgba({r}, {g}, {b}, {alpha})"

    @classmethod
    def generate_attributes(cls, hash_str: str) -> str:
        decoded = cls.decode(hash_str)
        if not decoded:
            return ''

        config = decoded['config']
        colors = decoded['colors']
        M = cls.MAPPINGS

        def get_mapped(arr_name, idx, default):
            arr = M[arr_name]
            return arr[idx] if 0 <= idx < len(arr) else default

        typography_class = get_mapped('typography', config['typography'], 'system-ui')
        texture_class = get_mapped('textures', config['bg_texture'], 'none')

        class_names = [
            'whostyle-container',
            'whostyle-rendered',
            f"ws-typography-{typography_class}",
            f"ws-texture-{texture_class}"
        ]

        transform = get_mapped('transforms', config['transform'], 'none')
        align = get_mapped('aligns', config['align'], 'left')
        list_style = get_mapped('lists', config['list'], 'disc')
        bstyle = get_mapped('borders', config['border_style'], 'none')

        bwidth = f"{config['border_width']}px"
        bradius = f"{config['border_radius']}px"
        soffset = f"{config['shadow_offset'] - 4}px"
        sblur = f"{config['shadow_blur']}px"
        lspacing = f"{config['letter_spacing'] * 0.1 - 0.5:.1f}px"

        l_bg = colors['light_bg']
        l_text = colors['light_text']
        l_accent = colors['light_accent']
        l_texture = colors['light_texture']

        if cls._get_contrast(l_bg, l_text) < 4.5 or cls._get_contrast(l_bg, l_accent) < 4.5:
            l_bg = '#ffffff'
            l_text = '#000000'
            l_accent = '#0000ff'
            l_texture = 'transparent'

        d_bg = colors['dark_bg']
        d_text = colors['dark_text']
        d_accent = colors['dark_accent']
        d_texture = colors['dark_texture']

        if cls._get_contrast(d_bg, d_text) < 4.5 or cls._get_contrast(d_bg, d_accent) < 4.5:
            d_bg = '#000000'
            d_text = '#ffffff'
            d_accent = '#00aaff'
            d_texture = 'transparent'
            
        l_texture = cls.hex_to_rgba(l_texture, config['texture_opacity'])
        d_texture = cls.hex_to_rgba(d_texture, config['texture_opacity'])

        l_shadow = cls.hex_to_rgba(l_accent, config['shadow_opacity'])
        d_shadow = cls.hex_to_rgba(d_accent, config['shadow_opacity'])

        styles = [
            f"--ws-transform: {transform}",
            f"--ws-align: {align}",
            f"--ws-list: {list_style}",
            f"--ws-bstyle: {bstyle}",
            f"--ws-bwidth: {bwidth}",
            f"--ws-bradius: {bradius}",
            f"--ws-soffset: {soffset}",
            f"--ws-sblur: {sblur}",
            f"--ws-lspacing: {lspacing}",
            f"--ws-light-bg: {l_bg}",
            f"--ws-light-text: {l_text}",
            f"--ws-light-accent: {l_accent}",
            f"--ws-light-texture: {l_texture}",
            f"--ws-light-shadow: {l_shadow}",
            f"--ws-dark-bg: {d_bg}",
            f"--ws-dark-text: {d_text}",
            f"--ws-dark-accent: {d_accent}",
            f"--ws-dark-texture: {d_texture}",
            f"--ws-dark-shadow: {d_shadow}"
        ]

        classes_str = ' '.join(class_names)
        style_str = '; '.join(styles) + ';'

        return f'class="{classes_str}" style="{style_str}"'
