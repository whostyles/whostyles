# Whostyle V2 (Hash Protocol)

An open, structured, data-driven format for syndicating personal typographic and cosmetic styles across decentralized web platforms (IndieWeb, Fediverse) without compromising host security, performance, or layout integrity.

Whostyle V2 completely abandons JSON in favor of an ultra-compact Base64 Bitpacked Hash (`{ws2:...}`), dramatically reducing network payload to just 45 bytes while maintaining ~179.6 billion possible styling states.

## The Problem with Raw CSS Syndication

Prior attempts to preserve visual identity in syndicated content (such as Webmentions or comments) relied on injecting raw third-party CSS or rendering within IFrames. This introduces severe layout and security risks:
* **Security:** Arbitrary CSS ingestion allows for Cross-Site Scripting (XSS), visual deception (overlaying elements), and history sniffing.
* **Layout Hijacking:** Unsanitized CSS can inject structural properties (`position: fixed`, `float`, `z-index`, `margin`) that break the host's document geometry.
* **Performance:** Relying on IFrames adds massive memory and rendering overhead in dense comment sections.

## The Whostyle V2 Solution

Whostyle abstracts cosmetic styling into non-executable design data tokens encoded in a Base64 hash. It strips away all structural layout properties and remote third-party asset loading (such as external web fonts via `@font-face`), handing absolute layout authority back to the host platform.

### Key Architectural Rules
1. **Strict Structural Omission:** Properties altering geometry (`position`, `display`, `float`, `width`, `height`, etc.) or remote background images are explicitly forbidden.
2. **Deterministic Constraints:** Numeric parameters (borders, shadows, spacing) are strictly bounded and clamped by the host engine.
3. **Accessibility Enforcement:** Contrast ratios for text and links are strictly validated against WCAG minimums by the host.
4. **Ultra-Compact Hash:** The entire configuration and color scheme are packed into a 45-character hash (`{ws2:...}`), allowing injection directly into text or meta tags without JSON overhead.

---

## Discovery Mechanism

Authors can embed their Whostyle hash in two ways:

**Option A: Meta Tag (Recommended)**
```html
<meta name="whostyle" content="{ws2:1mBxq6lG0u0uG0u1g1E4a4a1g1E2e2e}">
```

**Option B: Inline Text Fallback**
For systems that do not support custom `<meta>` tags in the `<head>` (like Commentpara.de), the hash can be placed anywhere in the raw text content:
```text
This is an amazing post! I really enjoyed it.
{ws2:1mBxq6lG0u0uG0u1g1E4a4a1g1E2e2e}
```
The parsers will automatically extract the valid `{ws2:...}` sequence from the text body.

---

## Reference Implementations (Zero Dependencies)

### PHP (Back-end Processing)

The `Whostyles` class decodes the Base64 hash into configuration variables and colors, safely validating bounds.

```php
require 'src/php/Whostyles.php';

// 1. Discover the Whostyle hash either from a <meta> tag or directly from raw text
$hash = Whostyles::discoverInline($syndicated_html);

if ($hash) {
    // 2. Decode the hash into safe styling properties
    $decoded = Whostyles::decode($hash);

    if ($decoded) {
        $config = $decoded['config']; // typography, border_style, etc.
        $colors = $decoded['colors']; // light_bg, dark_bg, etc.
        
        // 3. Generate and inject CSS variables to the host wrapper...
    }
}
```

### JavaScript / Modern Web (Front-end Engine)

The `WhostyleCore` and `WhostyleDOM` objects decode and apply the classes and Custom Properties directly to a DOM element.

```javascript
import { WhostyleCore } from './whostyle-core.js';
import { WhostyleDOM } from './whostyle-dom.js';

// Apply directly to a comment element, discovering the hash inside the raw HTML/Text
const commentElement = document.getElementById('comment-123');
WhostyleDOM.applyFromMeta(commentElement); // Automatically extracts the hash and applies classes
```

---

## Repository Structure

```text
├── docs/
│   └── draft-freitas-whostyle-20.txt       <- IETF-style RFC Specification Document
├── generator/
│   └── index.html                          <- Modern Web UI Generator for the Hash
├── src/
│   ├── php/
│   │   └── Whostyles.php                   <- Native PHP processing class
│   ├── js/
│   │   ├── whostyle-core.js                <- Core Encoding/Decoding Logic
│   │   └── whostyle-dom.js                 <- DOM Wrapper for Browser application
│   └── css/
│       ├── typography.css                  <- Host-enforced safe font stacks
│       └── textures.css                    <- Host-enforced native CSS textures
├── tests/
│   ├── verify.php                          <- PHP validation script
│   └── verify_core.js                      <- JS validation script
└── README.md                               <- This documentation file
```

## Installation & Ecosystem

The Whostyles V2 protocol is available natively across multiple backend and frontend ecosystems.

### JavaScript (NPM)
```bash
npm install @whostyles/whostyles
```
```javascript
import { WhostyleCore } from '@whostyles/whostyles';
```

### PHP (Packagist)
```bash
composer require whostyles/whostyles
```
```php
use Whostyles\Whostyles;
```

### Python (PyPI)
```bash
pip install whostyles
```
```python
from whostyles import Whostyles
```

### Go
```bash
go get codeberg.org/whostyles/whostyles/src/go/whostyles
```
```go
import "codeberg.org/whostyles/whostyles"
```

### Rust (Crates.io)
```bash
cargo add whostyles
```
```rust
use whostyles::{encode, decode, discover_inline};
```

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

License: MIT. Free software for a free, sovereign web.