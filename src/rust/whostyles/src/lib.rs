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

fn encode_color(hex_str: &str) -> String {
    let clean_hex = hex_str.trim_start_matches('#');
    let val = u64::from_str_radix(clean_hex, 16).unwrap_or(0);
    let mut result = String::with_capacity(4);
    result.push(ALPHABET.chars().nth(((val >> 18) & 63) as usize).unwrap());
    result.push(ALPHABET.chars().nth(((val >> 12) & 63) as usize).unwrap());
    result.push(ALPHABET.chars().nth(((val >> 6) & 63) as usize).unwrap());
    result.push(ALPHABET.chars().nth((val & 63) as usize).unwrap());
    result
}

pub fn decode(hash_str: &str) -> Result<Decoded, &'static str> {
    let re = Regex::new(r"^\{ws2:([A-Za-z0-9\-_]{7})([A-Za-z0-9\-_]{32})\}$").unwrap();
    let caps = re.captures(hash_str).ok_or("Invalid hash format")?;

    let config_b64 = caps.get(1).unwrap().as_str();
    let colors_b64 = caps.get(2).unwrap().as_str();

    let mut value = decode_base64(config_b64)?;

    let mut config = HashMap::new();
    for (key, radix) in RADIXES {
        config.insert(key.to_string(), value % radix);
        value /= radix;
    }

    let mut colors = HashMap::new();
    for (i, key) in COLOR_ORDER.iter().enumerate() {
        let chunk = &colors_b64[i * 4..i * 4 + 4];
        colors.insert(key.to_string(), decode_color(chunk)?);
    }

    Ok(Decoded { config, colors })
}

pub fn encode(config: &HashMap<String, u64>, colors: &HashMap<String, String>) -> String {
    let mut value: u64 = 0;
    for (key, radix) in RADIXES.iter().rev() {
        let val = config.get(*key).copied().unwrap_or(0);
        value = value * radix + val;
    }

    let config_b64 = encode_base64(value, 7);

    let mut colors_b64 = String::with_capacity(32);
    for key in COLOR_ORDER {
        let color = colors.get(*key).map(|s| s.as_str()).unwrap_or("#000000");
        colors_b64.push_str(&encode_color(color));
    }

    format!("{{ws2:{}{}}}", config_b64, colors_b64)
}

pub fn discover_inline(html: &str) -> Option<String> {
    let meta_re = Regex::new(r#"(?i)<meta\s+(?:[^>]*\s+)?name=["']?whostyle["']?\s+(?:[^>]*\s+)?content=["']?(\{ws2:[A-Za-z0-9\-_]{39}\})["']?[^>]*>"#).unwrap();
    if let Some(caps) = meta_re.captures(html) {
        return Some(caps.get(1).unwrap().as_str().to_string());
    }

    let fallback_re = Regex::new(r"(\{ws2:[A-Za-z0-9\-_]{39}\})").unwrap();
    if let Some(caps) = fallback_re.captures(html) {
        return Some(caps.get(1).unwrap().as_str().to_string());
    }

    None
}
