# Whostyles V1 - Go Module

Official Golang implementation of the Whostyles V1 protocol. The package exposes robust, immutable, and concurrent methods for packing, parsing, and extracting hashes in scalable web applications.

## Installation

The module is hosted following the canonical Go pattern on Codeberg:

```bash
go get codeberg.org/whostyles/whostyles/src/go/whostyles
```

## Basic Usage

The easiest and safest way to process incoming syndicated content is using the `Discover` macro. It automatically applies the strict V1 discovery hierarchy (HTTP Headers > Meta Tags > Link Tags > JSON-LD > Inline Text) and decodes the hash in one pass.

```go
package main

import (
	"fmt"
	"codeberg.org/whostyles/whostyles/src/go/whostyles"
)

func main() {
	htmlString := `<meta name="whostyle" content="{ws1:tP3ClmkB9fXwGhouAFXM3d3dGhou9fXwZqr_MzNE}">`

	// Extract headers from the HTTP request if available
	headers := map[string][]string{
		"X-Whostyle": []string{"{ws1:tP3ClmkB9fXwGhouAFXM3d3dGhou9fXwZqr_MzNE}"},
	}

	// 1. Discover the Hash (Automatically handles precedence and decoding)
	decoded := whostyles.Discover(htmlString, headers)

	// Optional: Clean the presentation layer from any inline hashes
	cleanHtml := whostyles.Clean(htmlString)

	if decoded != nil {
		fmt.Printf("Typography ID: %d\n", decoded.Config["typography"])
		fmt.Printf("Light Background: %s\n", decoded.Colors["light_bg"])

		// 2. Automatically generate the CSS classes and inline style variables
		// We have to extract the hash first since Discover returns the Decoded struct directly
		hash := whostyles.ExtractFromHeaders(headers)
		if hash == "" {
			hash = whostyles.Extract(htmlString)
		}
		
		attributes := whostyles.GenerateAttributes(hash)
		fmt.Printf("<div %s>\n", attributes)
		fmt.Printf("%s\n</div>\n", cleanHtml)
	}
}
```

## Encoding & Properties

If you are generating hashes (e.g., in a settings panel), use the `Encode(config, colors)` method. The config map accepts up to 13 parameters (including `shadow_opacity`), and internally handles the `checksum` required for data integrity verification.

The input/output format for colors uses 7-character hexadecimal strings with a hash symbol (`#ffffff`), and the configurations utilize a `uint64` map.

Please consult the main RFC in the repository root for the full index mappings (Radixes) and mathematical formulas.
