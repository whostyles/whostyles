<?php
require_once __DIR__ . '/../src/php/WhostyleProcessor.php';

function run_test($name, $callback) {
    try {
        $callback();
        echo "✅ TEST PASSED: $name\n";
    } catch (Exception $e) {
        echo "❌ TEST FAILED: $name - " . $e->getMessage() . "\n";
        exit(1);
    }
}

$processor = new WhostyleProcessor();

run_test("Valid Version 1.1 JSON Parsing and ENUMs", function() use ($processor) {
    $json = '{
        "whostyle": {
            "version": "1.1",
            "typography": "monospace",
            "text_transform": "uppercase",
            "text_align": "center",
            "list_style_type": "square",
            "border_style": "dashed",
            "theme": {
                "light": {
                    "background": "#ffffff",
                    "text": "#000000"
                }
            }
        }
    }';
    $res = $processor->process($json);
    if ($res === null) {
        throw new Exception("Returned null for valid JSON");
    }
    if ($res['typography'] !== 'monospace') {
        throw new Exception("Expected typography 'monospace', got '{$res['typography']}'");
    }
    if ($res['text_transform'] !== 'uppercase') {
        throw new Exception("Expected text_transform 'uppercase', got '{$res['text_transform']}'");
    }
    if ($res['text_align'] !== 'center') {
        throw new Exception("Expected text_align 'center', got '{$res['text_align']}'");
    }
    if ($res['list_style_type'] !== 'square') {
        throw new Exception("Expected list_style_type 'square', got '{$res['list_style_type']}'");
    }
    if ($res['border_style'] !== 'dashed') {
        throw new Exception("Expected border_style 'dashed', got '{$res['border_style']}'");
    }
});

run_test("Reject Invalid Version 1.0 JSON", function() use ($processor) {
    $json = '{
        "whostyle": {
            "version": "1.0",
            "typography": "monospace",
            "theme": {
                "light": {
                    "background": "#ffffff",
                    "text": "#000000"
                }
            }
        }
    }';
    $res = $processor->process($json);
    if ($res !== null) {
        throw new Exception("Expected null for version 1.0, got " . json_encode($res));
    }
});

run_test("Robustness on Non-Object JSON Values", function() use ($processor) {
    $json = 'true';
    $res = $processor->process($json);
    if ($res !== null) {
        throw new Exception("Expected null for non-object JSON, got " . json_encode($res));
    }

    $json2 = '{"whostyle": "just a string"}';
    $res2 = $processor->process($json2);
    if ($res2 !== null) {
        throw new Exception("Expected null when whostyle property is a string, got " . json_encode($res2));
    }
});

run_test("Clamp Bad/Missing Numeric Limits Safely", function() use ($processor) {
    $json = '{
        "whostyle": {
            "version": "1.1",
            "typography": "sans-serif",
            "border_width": "invalid",
            "border_radius": 99,
            "shadow_offset": -10,
            "theme": {
                "light": {
                    "background": "#ffffff",
                    "text": "#000000"
                }
            }
        }
    }';
    $res = $processor->process($json);
    if ($res === null) {
        throw new Exception("Returned null for valid JSON with invalid integers");
    }
    if ($res['border_width'] !== 0) {
        throw new Exception("Expected clamped border_width to be 0, got {$res['border_width']}");
    }
    if ($res['border_radius'] !== 16) {
        throw new Exception("Expected clamped border_radius to be 16, got {$res['border_radius']}");
    }
    if ($res['shadow_offset'] !== -4) {
        throw new Exception("Expected clamped shadow_offset to be -4, got {$res['shadow_offset']}");
    }
});

run_test("Contrast Override Logic (Low Contrast)", function() use ($processor) {
    $json = '{
        "whostyle": {
            "version": "1.1",
            "typography": "sans-serif",
            "theme": {
                "light": {
                    "background": "#888888",
                    "text": "#888888"
                },
                "dark": {
                    "background": "#777777",
                    "text": "#787878"
                }
            }
        }
    }';
    $res = $processor->process($json);
    if ($res === null) {
        throw new Exception("Returned null for valid JSON with low contrast");
    }
    
    $light = $res['theme']['light'];
    if ($light['background'] !== '#ffffff' || $light['text'] !== '#000000') {
        throw new Exception("Light mode contrast override failed: bg={$light['background']}, text={$light['text']}");
    }

    $dark = $res['theme']['dark'];
    if ($dark['background'] !== '#121212' || $dark['text'] !== '#e0e0e0') {
        throw new Exception("Dark mode contrast override failed: bg={$dark['background']}, text={$dark['text']}");
    }
});

run_test("Ensure generate_inline_css Does Not Mutate Theme Array", function() use ($processor) {
    $json = '{
        "whostyle": {
            "version": "1.1",
            "typography": "sans-serif",
            "theme": {
                "light": {
                    "background": "#ffffff",
                    "text": "#000000"
                }
            }
        }
    }';
    $res = $processor->process($json);
    $css = $processor->generate_inline_css($res, 'dark'); // will fallback to light
    if (empty($res['theme'])) {
        throw new Exception("Theme array was cleared or mutated by generate_inline_css");
    }
});

run_test("Locale-Independent Float Formatting (%.2F)", function() use ($processor) {
    $locales = ['pt_BR.utf8', 'pt_BR', 'fr_FR.utf8', 'fr_FR', 'de_DE.utf8', 'de_DE'];
    $currentLocale = setlocale(LC_NUMERIC, '0');
    foreach ($locales as $loc) {
        if (setlocale(LC_NUMERIC, $loc) !== false) {
            break;
        }
    }

    $json = '{
        "whostyle": {
            "version": "1.1",
            "typography": "sans-serif",
            "letter_spacing": 1.5,
            "theme": {
                "light": {
                    "background": "#ffffff",
                    "text": "#000000"
                }
            }
        }
    }';
    $res = $processor->process($json);
    $css = $processor->generate_inline_css($res, 'light');
    
    setlocale(LC_NUMERIC, $currentLocale);

    if (strpos($css, '1.50px') === false) {
        throw new Exception("Expected letter_spacing to be formatted as '1.50px', got: '$css'");
    }
});

run_test("Discover URL in HTML", function() use ($processor) {
    $html = '<!DOCTYPE html><html><head><link rel="whostyle" type="application/json" href="https://example.com/whostyle.json"></head><body></body></html>';
    $url = $processor->discover_url($html);
    if ($url !== 'https://example.com/whostyle.json') {
        throw new Exception("Failed to discover correct URL, got: " . $url);
    }

    $invalid_html = '<html><head><link rel="whostyle" href="not-a-valid-url"></head><body></body></html>';
    if ($processor->discover_url($invalid_html) !== null) {
        throw new Exception("Should return null for missing type or invalid URL");
    }
});

run_test("Fetch JSON invalid URLs", function() use ($processor) {
    if ($processor->fetch_json('not-a-url') !== null) {
        throw new Exception("Should reject invalid URL");
    }
    // Network failure or invalid JSON should return null
    if ($processor->fetch_json('http://localhost:9999/nonexistent.json') !== null) {
        throw new Exception("Should return null when connection fails");
    }
});

echo "All PHP reference implementation tests completed successfully!\n";
