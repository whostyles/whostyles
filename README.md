# Whostyle JSON (v1.1)

An open, structured, data-driven format for syndicating personal typographic and cosmetic styles across decentralized web platforms (IndieWeb, Fediverse) without compromising host security, performance, or layout integrity.

This repository contains the official IETF-style specification, the JSON Schema validation document, and zero-dependency reference implementations for both PHP and JavaScript.

## The Problem with Raw CSS Syndication

Prior attempts to preserve visual identity in syndicated content (such as Webmentions or comments) relied on injecting raw third-party CSS or rendering within IFrames. This introduces severe layout and security risks:
* **Security:** Arbitrary CSS ingestion allows for Cross-Site Scripting (XSS), visual deception (overlaying elements), and history sniffing.
* **Layout Hijacking:** Unsanitized CSS can inject structural properties (`position: fixed`, `float`, `z-index`, `margin`) that break the host's document geometry.
* **Performance:** Relying on IFrames adds massive memory and rendering overhead in dense comment sections.

## The Whostyle JSON Solution

Whostyle JSON abstracts cosmetic styling into non-executable design data tokens. It strips away all structural layout properties and remote third-party asset loading (such as external web fonts via `@font-face`), handing absolute layout authority back to the host platform.

### Key Architectural Rules
1. **Strict Structural Omission:** Properties altering geometry (`position`, `display`, `float`, `width`, `height`, etc.) or remote background images are explicitly forbidden.
2. **Deterministic Constraints:** Numeric parameters (borders, shadows, spacing) are strictly bounded and clamped by the host engine.
3. **Lazy Polling Caching:** To prevent distributed denial-of-service (DDoS) vectors, hosts cache processed tokens locally with a maximum Time-To-Live (TTL) of 30 days. Stale styles are updated asynchronously in the background.

---

## Specification Schema Example

Authors host a `whostyle.json` file on their own domain. The structure strictly conforms to the following schema:

```json
{
  "whostyle": {
    "version": "1.1",
    "typography": "monospace",
    "text_transform": "none",
    "text_align": "left",
    "list_style_type": "disc",
    "border_style": "dashed",
    "border_width": 2,
    "border_radius": 4,
    "shadow_offset": 1,
    "shadow_blur": 2,
    "letter_spacing": 0.5,
    "theme": {
      "light": {
        "background": "#f4f4f0",
        "text": "#222222",
        "border_color": "#dd8800",
        "link_color": "#0066cc",
        "link_hover_color": "#ff4400"
      },
      "dark": {
        "background": "#1a1a1a",
        "text": "#e0e0e0",
        "border_color": "#ffaa00",
        "link_color": "#66b2ff",
        "link_hover_color": "#ff6666"
      }
    }
  }
}

```

---

## Reference Implementations (Zero Dependencies)

### PHP (Back-end Processing)

The `WhostyleProcessor.php` class parses the raw JSON input, validates keys and strict boundaries, and generates safe inline CSS custom properties (variables).

```php
// Usage Example
$processor = new WhostyleProcessor();

// 1. Discover the Whostyle URL from a syndicated HTML document
$url = $processor->discover_url($syndicated_html);

if ($url) {
    // 2. Safely fetch the JSON payload (enforces 4KB limit and Content-Type)
    $raw_json_input = $processor->fetch_json($url);
    
    if ($raw_json_input) {
        // 3. Process the JSON and clamp numeric properties
        $processed = $processor->process($raw_json_input);

        if ($processed) {
            // 4. Generate inline style attributes safely formatted for the active theme mode
            $inline_css = $processor->generate_inline_css($processed, 'light');
            echo '<div class="comment-body whostyle-rendered" style="' . htmlspecialchars($inline_css) . '">';
            echo $sanitized_comment_content;
            echo '</div>';
        }
    }
}

```

### JavaScript / Modern Web (Front-end Engine)

The `WhostyleEngine` class can be used to validate and apply the style design tokens directly onto a specific DOM element dynamically.

```javascript
import { WhostyleEngine } from './whostyle.js';

// 1. Discover the Whostyle URL from the HTML string
const url = WhostyleEngine.discoverUrl(syndicatedHtmlString);

if (url) {
    // 2. Safely fetch the JSON payload (enforces 4KB limit and Content-Type)
    const rawJson = await WhostyleEngine.fetchJson(url);

    if (rawJson) {
        const commentElement = document.getElementById('comment-123');

        // 3. Safely sanitizes, clamps, and injects CSS custom properties inline
        WhostyleEngine.apply(commentElement, rawJson, 'dark');
    }
}

```

---

## Repository Structure

```text
├── docs/
│   └── draft-freitas-whostyle-json-11.txt  <- IETF-style RFC Specification Document
├── generator/
│   └── index.html                          <- Modern Web UI Generator for whostyle.json
├── schema/
│   └── whostyle.schema.json                <- JSON Schema Draft 2020-12 validation file
├── src/
│   ├── php/
│   │   └── WhostyleProcessor.php           <- Native PHP processing class
│   └── js/
│       └── whostyle.js                     <- ESM/JavaScript Modern runtime engine
├── tests/
│   ├── verify_processor.php                <- PHP validation script
│   └── verify_engine.js                    <- JS validation script
└── README.md                               <- This documentation file
```

## Running the Tests

To verify the compliance, safety, and correctness of both reference implementations (including type checks and WCAG contrast validation), you can run the test suite:

### PHP Implementation
Run the PHP verification script:
```bash
php tests/verify_processor.php
```

### JavaScript Implementation
Run the JS verification script (requires Node.js):
```bash
node tests/verify_engine.js
```

## Contributing and Governance

This project is a decentralized web standard proposal.

The primary development, issue tracking, and specification design discussions occur sovereignly on **Codeberg**:
👉 [https://codeberg.org/lumenpink/whostyles](https://codeberg.org/lumenpink/whostyles)

A read-only/automated mirror is maintained on GitHub to maximize developer reach and ecosystem integration. Pull Requests submitted via GitHub will be automatically evaluated and synced back to the main canonical tree.

License: MIT. Free software for a free, sovereign web.