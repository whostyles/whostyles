# Whostyle V1 (Hash Protocol)

An open, structured, data-driven format for syndicating personal typographic and cosmetic styles across decentralized web platforms (IndieWeb, Fediverse) without compromising host security, performance, or layout integrity.

Whostyle V1 completely abandons JSON in favor of an ultra-compact Base64 Bitpacked Hash (`{ws1:...}`), dramatically reducing network payload to just 46 bytes while maintaining ~179.6 billion possible styling states.

## The Problem with Raw CSS Syndication

Prior attempts to preserve visual identity in syndicated content (such as Webmentions or comments) relied on injecting raw third-party CSS or rendering within IFrames. This introduces severe layout and security risks:
* **Security:** Arbitrary CSS ingestion allows for Cross-Site Scripting (XSS), visual deception (overlaying elements), and history sniffing.
* **Layout Hijacking:** Unsanitized CSS can inject structural properties (`position: fixed`, `float`, `z-index`, `margin`) that break the host's document geometry.
* **Performance:** Relying on IFrames adds massive memory and rendering overhead in dense comment sections.

## The Whostyle V1 Solution

Whostyle abstracts cosmetic styling into non-executable design data tokens encoded in a Base64 hash. It strips away all structural layout properties and remote third-party asset loading (such as external web fonts via `@font-face`), handing absolute layout authority back to the host platform.

### Key Architectural Rules
1. **Strict Structural Omission:** Properties altering geometry (`position`, `display`, `float`, `width`, `height`, etc.) or remote background images are explicitly forbidden.
2. **Deterministic Constraints:** Numeric parameters (borders, shadows, spacing, texture opacity) are strictly bounded and clamped by the host engine.
3. **Accessibility Enforcement:** Contrast ratios for text and links are strictly validated against WCAG minimums by the host.
4. **Data Integrity Checksum:** The hash includes a mathematical modulo-6 checksum to prevent accidental configuration corruption during syndication.
5. **Ultra-Compact Hash:** The entire configuration and color scheme are packed into a 46-character hash (`{ws1:...}`), allowing injection directly into HTTP Headers, meta tags, or text.

---

## Discovery Mechanism & Precedence

To protect document authors from malicious user-injected overrides (e.g., in comment fields), host platforms MUST discover hashes in the following strict order of precedence:

1. **HTTP Headers:** `X-Whostyle` (Most secure)
2. **HTML `<meta>` tag:** `<meta name="whostyle" content="...">`
3. **HTML `<link>` tag:** `<link rel="whostyle" href="...">`
4. **JSON-LD Script Data**
5. **Inline Text (Fallback):** `{ws1:...}` injected anywhere in the body text

Additionally, for **twtxt** feeds, the hash can be syndicated via the [twtxt Metadata Extension](https://twtxt.dev/exts/metadata.html) using a dedicated `extractFromTwtxt()` method:
```
# whostyle = {ws1:tP3ClmkB9fXwGhouAFXM3d3dGhou9fXwZqr_MzNE}
```

---

## Reference Implementations (Zero Dependencies)

### Backend Processing (PHP, Python, Go, Rust)

For Server-Side Rendering (SSR), authors can use the `discover()` macro to automatically handle the precedence rules, decode the hash, and generate the necessary HTML attributes (`class` and `style`).

```php
require 'src/php/Whostyles.php';

// Extract the headers if available (e.g. from getallheaders())
$headers = [
    'X-Whostyle' => '{ws1:tP3ClmkB9fXwGhouAFXM3d3dGhou9fXwZqr_MzNE}'
];

// 1. Discover the Hash (Automatically handles precedence and decoding)
$result = Whostyles::discover($syndicated_html, $headers);

// Optional: Clean the presentation layer by removing the inline hash
$clean_html = Whostyles::clean($syndicated_html);

if ($result) {
    // 2. Automatically generate the CSS classes and inline style variables
    $attributes = $result['attributes'];
    
    // 3. Inject it into your comment template wrapper
    echo "<div {$attributes}>";
    echo $clean_html;
    echo "</div>";
}
```

The `attributes` generator automatically provides both `--ws-light-*` and `--ws-dark-*` CSS variables, ensuring the element is fully responsive to the user's OS Dark/Light theme mode without needing Javascript.

To make these variables work seamlessly, simply link our pre-compiled generic stylesheet in your host's `<head>`:
```html
<link rel="stylesheet" href="src/css/whostyles.css">
```

### Manual Hash Removal (Regex)
If you are not using our libraries, you can clean the presentation layer manually by using the following Regular Expression (it targets inline hashes but explicitly protects the hash inside a `<meta>` tag):
```regex
/((?:<|&lt;)meta[\s\S]*?name=(?:["']|&quot;|&#39;|&#039;)?whostyle(?:["']|&quot;|&#39;|&#039;)?[\s\S]*?content=(?:["']|&quot;|&#39;|&#039;)?{ws1:[A-Za-z0-9\-_]{40}}(?:["']|&quot;|&#39;|&#039;)?[\s\S]*?(?:>|&gt;))|({ws1:[A-Za-z0-9\-_]{40}})/i
```
Replace matching groups: if Group 1 matches, keep Group 1. If Group 2 matches, replace with an empty string.

### JavaScript / Modern Web (Front-end Engine)

The `WhostyleCore` and `WhostyleDOM` objects decode and apply the classes and Custom Properties directly to a DOM element.

```javascript
import { WhostyleDOM } from './whostyle-dom.js';

// Apply directly to a comment element, discovering the hash inside the raw HTML/Text
const commentElement = document.getElementById('comment-123');
WhostyleDOM.applyFromMeta(commentElement); // Automatically extracts the hash and applies classes
```

---

## Repository Structure

```text
├── docs/
│   └── draft-freitas-whostyle-10.txt       <- IETF-style RFC Specification Document
├── generator/
│   └── index.html                          <- Modern Web UI Generator for the Hash
├── validator/
│   └── index.html                          <- Whostyle Hash Validator
├── src/
│   ├── php/
│   │   └── Whostyles.php                   <- Native PHP processing class
│   ├── python/
│   │   └── whostyles/core.py               <- Python implementation
│   ├── go/
│   │   └── whostyles/whostyles.go          <- Go implementation
│   ├── rust/
│   │   └── whostyles/src/lib.rs            <- Rust implementation
│   ├── js/
│   │   ├── whostyle-core.js                <- Core Encoding/Decoding Logic
│   │   └── whostyle-dom.js                 <- DOM Wrapper for Browser application
│   └── css/
│       ├── typography.css                  <- Host-enforced safe font stacks
│       └── textures.css                    <- Host-enforced native CSS textures
├── tests/
│   ├── matrix.json                         <- Canonical test cases matrix
│   ├── generate_matrix.cjs                 <- Matrix generator script
│   ├── verify.php                          <- PHP validation script
│   ├── verify_core.js                      <- JS validation script
│   ├── verify_python.py                    <- Python validation script
│   └── verify_go.go                        <- Go validation script
└── README.md                               <- This documentation file
```

## Installation & Ecosystem

The Whostyle V1 protocol is available natively across multiple backend and frontend ecosystems.

### JavaScript (NPM)
```bash
npm install @whostyles/whostyles
```

### PHP (Packagist)
```bash
composer require whostyles/whostyles
```

### Python (PyPI)
```bash
pip install whostyles
```

### Go
```bash
go get codeberg.org/whostyles/whostyles/src/go/whostyles
```

### Rust (Crates.io)
```bash
cargo add whostyles
```

## CMS and Platform Integrations (In Development)

To accelerate adoption without polluting this core protocol monorepo, we are developing official plugins and integrations in separate, dedicated repositories. 

- [ ] **WordPress Plugin**: `codeberg.org/whostyles/whostyles-wordpress`
- [ ] **Known Plugin**: `codeberg.org/whostyles/whostyles-known`
- [ ] **Ghost Integration**: `codeberg.org/whostyles/whostyles-ghost`
- [ ] **Eleventy (11ty) Plugin**: `codeberg.org/whostyles/whostyles-11ty`
- [ ] **Hugo Integration**: `codeberg.org/whostyles/whostyles-hugo`
- [ ] **Micro.blog Integration**: `codeberg.org/whostyles/whostyles-microblog`
- [ ] **Discourse Component**: `codeberg.org/whostyles/whostyles-discourse`
- [ ] **Fediverse Clients**: `codeberg.org/whostyles/whostyles-fediverse-clients`

*(Note: These integrations are currently in development. If you want to contribute, check out their respective repositories!)*

## Running the Tests

To verify the compliance and correctness of the mathematical bitpacking models:

### PHP Implementation
Run the PHP verification script:
```bash
php tests/verify.php
```

### JavaScript Implementation
Run the JS verification script (requires Node.js):
```bash
node tests/verify_core.js
```

## Contributing and Governance

This project is a decentralized web standard proposal.

The primary development, issue tracking, and specification design discussions occur sovereignly on **Codeberg**:
👉 [https://codeberg.org/whostyles/whostyles](https://codeberg.org/whostyles/whostyles)

License: Apache 2.0. Free software for a free, sovereign web.