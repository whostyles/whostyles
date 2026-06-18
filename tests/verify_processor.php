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

run_test("Valid Version 1.0 JSON Parsing", function() use ($processor) {
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
    if ($res === null) {
        throw new Exception("Returned null for valid JSON");
    }
    if ($res['typography'] !== 'monospace') {
        throw new Exception("Expected typography 'monospace', got '{$res['typography']}'");
    }
});

run_test("Reject Invalid Version 1.1 JSON", function() use ($processor) {
    $json = '{
        "whostyle": {
            "version": "1.1",
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
        throw new Exception("Expected null for version 1.1, got " . json_encode($res));
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
            "version": "1.0",
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
            "version": "1.0",
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
    
    // Light mode override check
    $light = $res['theme']['light'];
    if ($light['background'] !== '#ffffff' || $light['text'] !== '#000000') {
        throw new Exception("Light mode contrast override failed: bg={$light['background']}, text={$light['text']}");
    }

    // Dark mode override check
    $dark = $res['theme']['dark'];
    if ($dark['background'] !== '#121212' || $dark['text'] !== '#e0e0e0') {
        throw new Exception("Dark mode contrast override failed: bg={$dark['background']}, text={$dark['text']}");
    }
});

run_test("Ensure generate_inline_css Does Not Mutate Theme Array", function() use ($processor) {
    $json = '{
        "whostyle": {
            "version": "1.0",
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
    // Attempt to set locale to a comma-decimal country, e.g., pt_BR, fr_FR, de_DE
    $locales = ['pt_BR.utf8', 'pt_BR', 'fr_FR.utf8', 'fr_FR', 'de_DE.utf8', 'de_DE'];
    $currentLocale = setlocale(LC_NUMERIC, '0');
    foreach ($locales as $loc) {
        if (setlocale(LC_NUMERIC, $loc) !== false) {
            break;
        }
    }

    $json = '{
        "whostyle": {
            "version": "1.0",
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
    
    // Restore locale
    setlocale(LC_NUMERIC, $currentLocale);

    if (strpos($css, '1.50px') === false) {
        throw new Exception("Expected letter_spacing to be formatted as '1.50px', got: '$css'");
    }
});

echo "All PHP reference implementation tests completed successfully!\n";
