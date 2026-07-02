# Whostyles V1 - Python Backend Module

Native implementation of the Whostyles V1 protocol for Python ecosystems, such as Django, Flask, FastAPI, and generic scripts. It utilizes native Python integers (which support arbitrary precision natively) for perfect reproduction of the Base64 bitpacking.

## Installation

```bash
pip install whostyles
```

## Basic Usage

The easiest and safest way to process incoming syndicated content is using the `discover` macro. It automatically applies the strict V1 discovery hierarchy (HTTP Headers > Meta Tags > Link Tags > JSON-LD > Inline Text) and decodes the hash in one pass.

```python
from whostyles import Whostyles

html_string = '<meta name="whostyle" content="{ws1:tP3ClmkB9fXwGhouAFXM3d3dGhou9fXwZqr_MzNE}">'

# Extract headers from the request if available
headers = {
    'X-Whostyle': '{ws1:tP3ClmkB9fXwGhouAFXM3d3dGhou9fXwZqr_MzNE}'
}

# 1. Discover the Hash (Automatically handles precedence and decoding)
result = Whostyles.discover(html_string, headers)

# Optional: Clean the presentation layer from any inline hashes
clean_html = Whostyles.clean(html_string)

if result is not None:
    # Retrieve the mapped configurations and colors
    print(f"Typography ID: {result['decoded']['config']['typography']}")
    print(f"Light Background: {result['decoded']['colors']['light_bg']}")

    # 2. Automatically generate the CSS classes and inline style variables
    attributes = result['attributes']
    print(f'<div {attributes}>')
    print(clean_html)
    print('</div>')

# To generate hashes:
# hash_output = Whostyles.encode(config_dict, colors_dict)
```

## Encoding & Properties

If you are generating hashes (e.g., in a settings panel), use the `encode(config, colors)` method. The config dictionary accepts up to 13 parameters (including `shadow_opacity`), and internally handles the `checksum` required for data integrity verification.

Please consult the main RFC in the repository root for the full index mappings (Radixes) and mathematical formulas.
