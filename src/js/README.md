# Whostyles V1 - JavaScript Core & DOM

The Whostyles V1 JavaScript module runs in both Node.js environments (Isomorphic) and directly in the browser. 
It exposes the pure `WhostyleCore` module (only mathematical processing and parsing) and the `WhostyleDOM` utility (which injects CSS properties into the browser's DOM).

## Installation

```bash
npm install @whostyles/whostyles
```

## Node.js / Server-side Usage

If you are processing Whostyles on the server, use only `WhostyleCore` to avoid issues with missing DOM objects (e.g., `window`, `document`).

The easiest and safest way to process incoming syndicated content is using the `discover` macro. It automatically applies the strict V1 discovery hierarchy (HTTP Headers > Meta Tags > Link Tags > JSON-LD > Inline Text) and decodes the hash in one pass.

```javascript
import { WhostyleCore } from '@whostyles/whostyles';

const htmlString = '<meta name="whostyle" content="{ws1:tP3ClmkB9fXwGhouAFXM3d3dGhou9fXwZqr_MzNE}">';

// Extract headers from the request if available
const headers = {
    'x-whostyle': '{ws1:tP3ClmkB9fXwGhouAFXM3d3dGhou9fXwZqr_MzNE}'
};

// 1. Discover the Hash (Automatically handles precedence and decoding)
const result = WhostyleCore.discover(htmlString, headers);

// Optional: Clean the presentation layer from any inline hashes
const cleanHtml = WhostyleCore.clean(htmlString);

if (result) {
    console.log(result.decoded.config.typography); // Returns the matching Integer
    console.log(result.decoded.colors.light_bg);   // Returns the exact hexadecimal
    
    // You can also get the direct CSS attributes string:
    console.log(result.attributes);
}
```

## Browser / DOM Usage

To capture and apply a Whostyle automatically on a client web page:

```html
<script type="module">
import { WhostyleDOM } from '@whostyles/whostyles/src/js/whostyle-dom.js';

// Applies the style captured in the <meta> tag directly to the <body>
WhostyleDOM.applyFromMeta(document.body);
</script>
```

## Encoding & Properties

If you are generating hashes (e.g., in a settings panel), use the `encode(config, colors)` method. The config object accepts up to 13 parameters (including `shadow_opacity`), and internally handles the `checksum` required for data integrity verification.

For more information, please check the main specification document in the repository.
