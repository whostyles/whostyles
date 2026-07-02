# Whostyles V1 - Rust Crate

Incredibly fast native Rust library designed to validate, decode, and process Whostyles V1 hashes. Focused on performance and type safety with `Option` and `Result`, free from panics.

## Installation

Available directly via Crates.io:

```bash
cargo add whostyles
```

## Basic Usage

The easiest and safest way to process incoming syndicated content is using the `discover` macro. It automatically applies the strict V1 discovery hierarchy (HTTP Headers > Meta Tags > Link Tags > JSON-LD > Inline Text) and decodes the hash in one pass.

```rust
use std::collections::HashMap;
use whostyles::{discover, clean, generate_attributes, extract, extract_from_headers};

fn main() {
    let html = r#"<meta name="whostyle" content="{ws1:tP3ClmkB9fXwGhouAFXM3d3dGhou9fXwZqr_MzNE}">"#;

    // Extract headers from the HTTP request if available
    let mut headers = HashMap::new();
    headers.insert("X-Whostyle".to_string(), "{ws1:tP3ClmkB9fXwGhouAFXM3d3dGhou9fXwZqr_MzNE}".to_string());

    // 1. Discover the Hash (Automatically handles precedence and decoding)
    let decoded_opt = discover(html, Some(&headers));

    // Optional: Clean the presentation layer from any inline hashes
    let clean_html = clean(html);

    if let Some(decoded) = decoded_opt {
        // Access to the Configuration and Colors HashMaps
        if let Some(typography) = decoded.config.get("typography") {
            println!("Typography ID: {}", typography);
        }
        
        if let Some(bg_color) = decoded.colors.get("light_bg") {
            println!("Light Background: {}", bg_color);
        }

        // 2. Automatically generate the CSS classes and inline style variables
        // We extract the hash first since discover returns the Decoded struct directly
        let hash = extract_from_headers(&headers).or_else(|| extract(html)).unwrap_or_default();
        if !hash.is_empty() {
            let attributes = generate_attributes(&hash);
            println!("<div {}>", attributes);
            println!("{}", clean_html);
            println!("</div>");
        }
    }
}
```

## Encoding & Properties

If you are generating hashes (e.g., in a settings panel), use the `encode(&config, &colors)` method. The config map accepts up to 13 parameters (including `shadow_opacity`), and internally handles the `checksum` required for data integrity verification.

To consult the mathematical bitpacking documentation, refer to the full RFC in the main project root.
