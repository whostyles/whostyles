# Whostyles V1 - PHP Backend Module

The native PHP module for packaging and validating Whostyles V1 hashes with extremely high mathematical performance using robust native typing and PSR-4 Namespacing.

## Installation

```bash
composer require whostyles/whostyles
```

Composer will handle the autoloading of the `\Whostyles\Whostyles` class natively.

## Basic Usage

The easiest and safest way to process incoming syndicated content is using the `discover` macro. It automatically applies the strict V1 discovery hierarchy (HTTP Headers > Meta Tags > Link Tags > JSON-LD > Inline Text) and decodes the hash in one pass.

```php
<?php
require 'vendor/autoload.php';

use Whostyles\Whostyles;

$htmlString = '<meta name="whostyle" content="{ws1:tP3ClmkB9fXwGhouAFXM3d3dGhou9fXwZqr_MzNE}">';

// Extract the headers if available (e.g. from getallheaders())
$headers = [
    'X-Whostyle' => '{ws1:tP3ClmkB9fXwGhouAFXM3d3dGhou9fXwZqr_MzNE}'
];

// 1. Discover the Hash (Automatically handles precedence and decoding)
$result = Whostyles::discover($htmlString, $headers);

// Optional: Clean the presentation layer from any inline hashes to protect layout
$cleanHtml = Whostyles::clean($htmlString);

if ($result) {
    // Output will be the integer of the selected typography
    echo "Typography: " . $result['decoded']['config']['typography'] . "\n";
    
    // Output will be the exact hexadecimal color
    echo "Light Background: " . $result['decoded']['colors']['light_bg'] . "\n";

    // 2. Automatically generate the CSS classes and inline style variables
    $attributes = $result['attributes'];
    
    // 3. Inject it into your comment template wrapper
    echo "<div {$attributes}>";
    echo $cleanHtml;
    echo "</div>";
}
```

## Encoding & Properties

If you are generating hashes (e.g., in a settings panel), use the `encode($config, $colors)` method. The config array accepts up to 13 parameters (including `shadow_opacity`), and internally handles the `checksum` required for data integrity verification.

Please consult the main RFC in the repository root for the full index mappings (Radixes) and mathematical formulas.
