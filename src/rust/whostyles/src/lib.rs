use regex::Regex;
use std::collections::HashMap;

const ALPHABET: &str = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const RADIXES: &[(&str, u64)] = &[
    ("typography", 28),
    ("transform", 4),
    ("align", 4),
    ("list", 5),
    ("border_style", 10),
    ("bg_texture", 32),
    ("border_width", 7),
    ("border_radius", 17),
    ("shadow_offset", 9),
    ("shadow_blur", 9),
    ("letter_spacing", 26),
    ("texture_opacity", 4),
    ("shadow_opacity", 4),
    ("checksum", 6),
];

const COLOR_ORDER: &[&str] = &[
    "light_bg", "light_text", "light_accent", "light_texture",
    "dark_bg", "dark_text", "dark_accent", "dark_texture",
];

#[derive(Debug, PartialEq)]
pub struct Decoded {
    pub config: HashMap<String, u64>,
    pub colors: HashMap<String, String>,
}

#[derive(Debug, PartialEq)]
pub struct DiscoveryResult {
    pub hash: String,
    pub decoded: Decoded,
    pub attributes: String,
}

fn decode_base64(s: &str) -> Result<u64, &'static str> {
    let mut value: u64 = 0;
    let mut multiplier: u64 = 1;
    for c in s.chars() {
        if let Some(idx) = ALPHABET.find(c) {
            value += (idx as u64) * multiplier;
            multiplier *= 64;
        } else {
            return Err("Invalid base64 character");
        }
    }
    Ok(value)
}

fn encode_base64(mut value: u64, length: usize) -> String {
    let mut result = String::with_capacity(length);
    for _ in 0..length {
        let idx = (value % 64) as usize;
        result.push(ALPHABET.chars().nth(idx).unwrap());
        value /= 64;
    }
    result
}

fn decode_color(s: &str) -> Result<String, &'static str> {
    let mut val: u64 = 0;
    for c in s.chars() {
        if let Some(idx) = ALPHABET.find(c) {
            val = (val << 6) | (idx as u64);
        } else {
            return Err("Invalid base64 color character");
        }
    }
    Ok(format!("#{:06x}", val))
}

fn encode_color(hex_str: &str) -> Result<String, String> {
    let re = Regex::new(r"^#[0-9a-fA-F]{6}$").unwrap();
    if !re.is_match(hex_str) {
        return Err(format!("Invalid hex color format: {}. Must be #RRGGBB.", hex_str));
    }
    let clean_hex = hex_str.trim_start_matches('#');
    let val = u64::from_str_radix(clean_hex, 16).unwrap_or(0);
    let mut result = String::with_capacity(4);
    result.push(ALPHABET.chars().nth(((val >> 18) & 63) as usize).unwrap());
    result.push(ALPHABET.chars().nth(((val >> 12) & 63) as usize).unwrap());
    result.push(ALPHABET.chars().nth(((val >> 6) & 63) as usize).unwrap());
    result.push(ALPHABET.chars().nth((val & 63) as usize).unwrap());
    Ok(result)
}

pub fn calculate_checksum(config: &HashMap<String, u64>) -> u64 {
    let weights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    let props = [
        "typography", "transform", "align", "list", "border_style",
        "bg_texture", "border_width", "border_radius", "shadow_offset",
        "shadow_blur", "letter_spacing", "texture_opacity", "shadow_opacity",
    ];
    let mut sum: u64 = 0;
    for (i, prop) in props.iter().enumerate() {
        let val = config.get(*prop).copied().unwrap_or(0);
        sum += val * weights[i];
    }
    sum % 6
}

pub fn decode(hash_str: &str) -> Result<Decoded, String> {
    let re = Regex::new(r"^\{ws1:([A-Za-z0-9\-_]{8})([A-Za-z0-9\-_]{32})\}$").unwrap();
    let caps = re.captures(hash_str).ok_or("Invalid hash format")?;

    let config_b64 = caps.get(1).unwrap().as_str();
    let colors_b64 = caps.get(2).unwrap().as_str();

    let mut value = decode_base64(config_b64)?;

    let mut config = HashMap::new();
    for (key, radix) in RADIXES {
        config.insert(key.to_string(), value % radix);
        value /= radix;
    }

    let expected_checksum = calculate_checksum(&config);
    if *config.get("checksum").unwrap_or(&0) != expected_checksum {
        return Err("Hash corrupted (checksum mismatch)".to_string());
    }

    let mut colors = HashMap::new();
    for (i, key) in COLOR_ORDER.iter().enumerate() {
        let chunk = &colors_b64[i * 4..i * 4 + 4];
        colors.insert(key.to_string(), decode_color(chunk)?);
    }

    Ok(Decoded { config, colors })
}

pub fn encode(config: &HashMap<String, u64>, colors: &HashMap<String, String>) -> Result<String, String> {
    // Validation
    for (key, radix) in RADIXES {
        if *key == "checksum" {
            continue;
        }
        let val = config.get(*key).copied().ok_or_else(|| format!("Missing required config property: {}", key))?;
        if val >= *radix {
            return Err(format!("Invalid value for {}: {}. Must be between 0 and {}", key, val, radix - 1));
        }
    }

    let mut config_copy = config.clone();
    config_copy.insert("checksum".to_string(), calculate_checksum(&config_copy));

    let mut value: u64 = 0;
    for (key, radix) in RADIXES.iter().rev() {
        let val = config_copy.get(*key).copied().unwrap_or(0);
        value = value * radix + val;
    }

    let config_b64 = encode_base64(value, 8);

    let mut colors_b64 = String::with_capacity(32);
    for key in COLOR_ORDER {
        let color = colors.get(*key).map(|s| s.as_str()).unwrap_or("#000000");
        let encoded_c = encode_color(color)?;
        colors_b64.push_str(&encoded_c);
    }

    Ok(format!("{{ws1:{}{}}}", config_b64, colors_b64))
}

pub fn extract_from_headers(headers: &HashMap<String, String>) -> Option<String> {
    let re = Regex::new(r"^\{ws1:[A-Za-z0-9\-_]{40}\}$").unwrap();
    for (k, v) in headers {
        if k.to_lowercase() == "x-whostyle" {
            let val = v.trim();
            if re.is_match(val) {
                return Some(val.to_string());
            }
        }
    }
    None
}

pub fn extract_from_twtxt(feed_string: &str) -> Option<String> {
    if feed_string.is_empty() {
        return None;
    }
    let re = Regex::new(r"(?i)^whostyle\s*=\s*(\{ws1:[A-Za-z0-9\-_]{40}\})\s*$").unwrap();
    for line in feed_string.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || !trimmed.starts_with('#') {
            continue;
        }
        let content = trimmed[1..].trim_start();
        if let Some(caps) = re.captures(content) {
            return Some(caps.get(1).unwrap().as_str().to_string());
        }
    }
    None
}

pub fn extract(html: &str) -> Option<String> {
    // 1. Meta Tag
    let re_meta = Regex::new(r#"(?i)<meta[^>]+name=["']?whostyle["']?[^>]+content=["']?(\{ws1:[A-Za-z0-9\-_]{40}\})["']?"#).unwrap();
    if let Some(caps) = re_meta.captures(html) {
        return Some(caps.get(1).unwrap().as_str().to_string());
    }

    // 2. Link Tag
    let re_link = Regex::new(r#"(?i)<link[^>]+rel=["']?whostyle["']?[^>]+href=["']?data:text/plain,(\{ws1:[A-Za-z0-9\-_]{40}\})["']?"#).unwrap();
    if let Some(caps) = re_link.captures(html) {
        return Some(caps.get(1).unwrap().as_str().to_string());
    }

    // 3. JSON-LD
    let re_json = Regex::new(r#"(?i)"whostyle"\s*:\s*"(\{ws1:[A-Za-z0-9\-_]{40}\})""#).unwrap();
    if let Some(caps) = re_json.captures(html) {
        return Some(caps.get(1).unwrap().as_str().to_string());
    }

    // 4. Inline
    let re_inline = Regex::new(r#"(\{ws1:[A-Za-z0-9\-_]{40}\})"#).unwrap();
    if let Some(caps) = re_inline.captures(html) {
        return Some(caps.get(1).unwrap().as_str().to_string());
    }

    None
}

pub fn clean(html: &str) -> String {
    let re = Regex::new(r#"(?i)((?:<|&lt;)meta[\s\S]{0,250}?name=(?:["']|&quot;|&#39;|&#039;)?whostyle(?:["']|&quot;|&#39;|&#039;)?[\s\S]{0,250}?content=(?:["']|&quot;|&#39;|&#039;)?\{ws1:[A-Za-z0-9\-_]{40}\}(?:["']|&quot;|&#39;|&#039;)?[\s\S]{0,250}?(?:>|&gt;))|(\{ws1:[A-Za-z0-9\-_]{40}\})"#).unwrap();
    let re_protected = Regex::new(r#"(?i)(?:<meta|&lt;meta)"#).unwrap();
    re.replace_all(html, |caps: &regex::Captures| {
        let match_str = caps.get(0).unwrap().as_str();
        if re_protected.is_match(match_str) {
            caps.get(1).unwrap().as_str().to_string()
        } else {
            String::new()
        }
    }).into_owned()
}

pub fn discover(html: &str, headers: Option<&HashMap<String, String>>) -> Option<DiscoveryResult> {
    let mut hash_opt = None;
    if let Some(h) = headers {
        hash_opt = extract_from_headers(h);
    }
    if hash_opt.is_none() {
        hash_opt = extract(html);
    }

    if let Some(hash_str) = hash_opt {
        if let Ok(decoded) = decode(&hash_str) {
            let attributes = generate_attributes(&hash_str);
            return Some(DiscoveryResult {
                hash: hash_str,
                decoded,
                attributes,
            });
        }
    }
    None
}

const TRANSFORMS: &[&str] = &["none", "capitalize", "uppercase", "lowercase"];
const ALIGNS: &[&str] = &["left", "right", "center", "justify"];
const LISTS: &[&str] = &["disc", "circle", "square", "decimal", "lower-roman"];
const BORDERS: &[&str] = &["none", "hidden", "dotted", "dashed", "solid", "double", "groove", "ridge", "inset", "outset"];
const TYPOGRAPHY: &[&str] = &[
    "system-ui", "segoe-roboto", "helvetica-neue", "verdana", "trebuchet",
    "tahoma", "century-gothic", "franklin-gothic", "gill-sans", "arial-rounded",
    "georgia", "times-new-roman", "garamond", "palatino", "baskerville",
    "bookman", "cambria", "didot", "bodoni", "rockwell",
    "monospace", "consolas", "courier-new", "monaco", "lucida-console",
    "andale-mono", "sf-mono", "cascadia-code",
];
const TEXTURES: &[&str] = &[
    "none", "noise", "stripes-v", "stripes-h", "stripes-d-right",
    "stripes-d-left", "pinstripes", "wavy-lines", "zigzag-lines", "grid-standard",
    "grid-fine", "grid-isometric", "crosses", "crosshatch", "checkerboard",
    "checkerboard-tilt", "triangles", "diamonds", "argyle", "honeycomb",
    "chevron", "houndstooth", "brick-wall", "dots-sparse", "polka-dots",
    "circles-concentric", "scallop", "waves", "woven", "denim",
    "tartan", "confetti",
];

fn get_luminance(hex_str: &str) -> f64 {
    let clean_hex = hex_str.trim_start_matches('#');
    let val = u64::from_str_radix(clean_hex, 16).unwrap_or(0);
    
    let mut r = (((val >> 16) & 0xFF) as f64) / 255.0;
    let mut g = (((val >> 8) & 0xFF) as f64) / 255.0;
    let mut b = ((val & 0xFF) as f64) / 255.0;

    r = if r <= 0.03928 { r / 12.92 } else { ((r + 0.055) / 1.055).powf(2.4) };
    g = if g <= 0.03928 { g / 12.92 } else { ((g + 0.055) / 1.055).powf(2.4) };
    b = if b <= 0.03928 { b / 12.92 } else { ((b + 0.055) / 1.055).powf(2.4) };

    0.2126 * r + 0.7152 * g + 0.0722 * b
}

fn get_contrast(hex1: &str, hex2: &str) -> f64 {
    let l1 = get_luminance(hex1);
    let l2 = get_luminance(hex2);
    if l1 > l2 {
        (l1 + 0.05) / (l2 + 0.05)
    } else {
        (l2 + 0.05) / (l1 + 0.05)
    }
}

pub fn hex_to_rgba(hex_str: &str, opacity_index: u64) -> String {
    if hex_str == "transparent" {
        return "transparent".to_string();
    }
    let opacities = [1.0, 0.75, 0.50, 0.25];
    let mut alpha: f64 = 1.0;
    if (opacity_index as usize) < opacities.len() {
        alpha = opacities[opacity_index as usize];
    }
    let clean_hex = hex_str.trim_start_matches('#');
    let val = u64::from_str_radix(clean_hex, 16).unwrap_or(0);
    let r = (val >> 16) & 0xFF;
    let g = (val >> 8) & 0xFF;
    let b = val & 0xFF;
    format!("rgba({}, {}, {}, {})", r, g, b, alpha)
}

pub fn generate_attributes(hash_str: &str) -> String {
    if let Ok(decoded) = decode(hash_str) {
        let config = decoded.config;
        let colors = decoded.colors;

        let get_mapped = |arr: &[&str], idx: u64, def: &str| -> String {
            if (idx as usize) < arr.len() {
                arr[idx as usize].to_string()
            } else {
                def.to_string()
            }
        };

        let typography_class = get_mapped(TYPOGRAPHY, *config.get("typography").unwrap_or(&0), "system-ui");
        let texture_class = get_mapped(TEXTURES, *config.get("bg_texture").unwrap_or(&0), "none");

        let class_names = vec![
            "whostyle-container".to_string(),
            "whostyle-rendered".to_string(),
            format!("ws-typography-{}", typography_class),
            format!("ws-texture-{}", texture_class),
        ];

        let transform = get_mapped(TRANSFORMS, *config.get("transform").unwrap_or(&0), "none");
        let align = get_mapped(ALIGNS, *config.get("align").unwrap_or(&0), "left");
        let list = get_mapped(LISTS, *config.get("list").unwrap_or(&0), "disc");
        let bstyle = get_mapped(BORDERS, *config.get("border_style").unwrap_or(&0), "none");

        let bwidth = format!("{}px", config.get("border_width").unwrap_or(&0));
        let bradius = format!("{}px", config.get("border_radius").unwrap_or(&0));
        let soffset = format!("{}px", (*config.get("shadow_offset").unwrap_or(&4) as i64) - 4);
        let sblur = format!("{}px", config.get("shadow_blur").unwrap_or(&0));
        
        let ls = *config.get("letter_spacing").unwrap_or(&5) as f64;
        let lspacing = format!("{:.1}px", ls * 0.1 - 0.5);

        let mut c_light_bg = colors.get("light_bg").cloned().unwrap_or_else(|| "#ffffff".to_string());
        let mut c_light_text = colors.get("light_text").cloned().unwrap_or_else(|| "#000000".to_string());
        let mut c_light_accent = colors.get("light_accent").cloned().unwrap_or_else(|| "#0000ff".to_string());
        let mut c_light_texture = colors.get("light_texture").cloned().unwrap_or_else(|| "transparent".to_string());

        if get_contrast(&c_light_bg, &c_light_text) < 4.5 || get_contrast(&c_light_bg, &c_light_accent) < 4.5 {
            c_light_bg = "#ffffff".to_string();
            c_light_text = "#000000".to_string();
            c_light_accent = "#0000ff".to_string();
            c_light_texture = "transparent".to_string();
        }

        let mut c_dark_bg = colors.get("dark_bg").cloned().unwrap_or_else(|| "#000000".to_string());
        let mut c_dark_text = colors.get("dark_text").cloned().unwrap_or_else(|| "#ffffff".to_string());
        let mut c_dark_accent = colors.get("dark_accent").cloned().unwrap_or_else(|| "#00aaff".to_string());
        let mut c_dark_texture = colors.get("dark_texture").cloned().unwrap_or_else(|| "transparent".to_string());

        if get_contrast(&c_dark_bg, &c_dark_text) < 4.5 || get_contrast(&c_dark_bg, &c_dark_accent) < 4.5 {
            c_dark_bg = "#000000".to_string();
            c_dark_text = "#ffffff".to_string();
            c_dark_accent = "#00aaff".to_string();
            c_dark_texture = "transparent".to_string();
        }

        let opacity_idx = *config.get("texture_opacity").unwrap_or(&0);
        c_light_texture = hex_to_rgba(&c_light_texture, opacity_idx);
        c_dark_texture = hex_to_rgba(&c_dark_texture, opacity_idx);

        let shadow_opacity_idx = *config.get("shadow_opacity").unwrap_or(&0);
        let c_light_shadow = hex_to_rgba(&c_light_accent, shadow_opacity_idx);
        let c_dark_shadow = hex_to_rgba(&c_dark_accent, shadow_opacity_idx);

        let styles = vec![
            format!("--ws-transform: {}", transform),
            format!("--ws-align: {}", align),
            format!("--ws-list: {}", list),
            format!("--ws-bstyle: {}", bstyle),
            format!("--ws-bwidth: {}", bwidth),
            format!("--ws-bradius: {}", bradius),
            format!("--ws-soffset: {}", soffset),
            format!("--ws-sblur: {}", sblur),
            format!("--ws-lspacing: {}", lspacing),
            format!("--ws-light-bg: {}", c_light_bg),
            format!("--ws-light-text: {}", c_light_text),
            format!("--ws-light-accent: {}", c_light_accent),
            format!("--ws-light-texture: {}", c_light_texture),
            format!("--ws-light-shadow: {}", c_light_shadow),
            format!("--ws-dark-bg: {}", c_dark_bg),
            format!("--ws-dark-text: {}", c_dark_text),
            format!("--ws-dark-accent: {}", c_dark_accent),
            format!("--ws-dark-texture: {}", c_dark_texture),
            format!("--ws-dark-shadow: {}", c_dark_shadow),
        ];

        format!("class=\"{}\" style=\"{};\"", class_names.join(" "), styles.join("; "))
    } else {
        String::new()
    }
}
