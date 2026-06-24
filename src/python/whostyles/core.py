import re

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
        'letter_spacing': 26
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
        val = int(hex_str.lstrip('#'), 16)
        result = ''
        result += cls.ALPHABET[(val >> 18) & 63]
        result += cls.ALPHABET[(val >> 12) & 63]
        result += cls.ALPHABET[(val >> 6) & 63]
        result += cls.ALPHABET[val & 63]
        return result

    @classmethod
    def decode(cls, hash_str: str) -> dict:
        match = re.match(r'^{ws2:([A-Za-z0-9\-_]{7})([A-Za-z0-9\-_]{32})}$', hash_str)
        if not match:
            return None
        
        config_b64 = match.group(1)
        colors_b64 = match.group(2)
        
        try:
            value = cls.decode_base64(config_b64)
        except ValueError:
            return None
            
        config = {}
        # Iterate in original order
        for key, radix in cls.RADIXES.items():
            config[key] = value % radix
            value //= radix
            
        colors = {}
        for i, key in enumerate(cls.COLOR_ORDER):
            chunk = colors_b64[i*4 : i*4+4]
            colors[key] = cls.decode_color(chunk)
            
        return {'config': config, 'colors': colors}

    @classmethod
    def encode(cls, config: dict, colors: dict) -> str:
        value = 0
        # Pack config in reverse order
        for key in reversed(list(cls.RADIXES.keys())):
            value = value * cls.RADIXES[key] + int(config.get(key, 0))
            
        config_b64 = cls.encode_base64(value, 7)
        
        colors_b64 = ''
        for key in cls.COLOR_ORDER:
            colors_b64 += cls.encode_color(colors.get(key, '#000000'))
            
        return f"{{ws2:{config_b64}{colors_b64}}}"

    @classmethod
    def discover_inline(cls, html: str) -> str:
        # Search for meta tag
        meta_pattern = re.compile(r'<meta\s+(?:[^>]*\s+)?name=["\']?whostyle["\']?\s+(?:[^>]*\s+)?content=["\']?({ws2:[A-Za-z0-9\-_]{39}})["\']?[^>]*>', re.IGNORECASE)
        match = meta_pattern.search(html)
        if match:
            return match.group(1)
            
        # Fallback to plain text search
        fallback_pattern = re.compile(r'({ws2:[A-Za-z0-9\-_]{39}})')
        match = fallback_pattern.search(html)
        if match:
            return match.group(1)
            
        return None
