<?php
require_once __DIR__ . '/../src/php/Whostyles.php';

$matrixPath = __DIR__ . '/matrix.json';
$matrixJson = file_get_contents($matrixPath);
$matrix = json_decode($matrixJson, true);

$passed = 0;
$failed = 0;

foreach ($matrix as $test) {
    echo "Testing: {$test['name']}\n";
    
    if (!empty($test['is_corruption_test'])) {
        $decoded = \Whostyles\Whostyles::decode($test['hash']);
        if ($decoded !== null) {
            echo "  [FAIL] Corruption test decoded successfully, but should have failed (returned null)\n";
            $failed++;
        } else {
            echo "  [PASS]\n";
            $passed++;
        }
        continue;
    }

    // Test Encoding
    $hash = \Whostyles\Whostyles::encode($test['input']['config'], $test['input']['colors']);
    if ($hash !== $test['hash']) {
        echo "  [FAIL] Encoding mismatch. Expected {$test['hash']}, got {$hash}\n";
        $failed++;
        continue;
    }

    // Test Decoding
    $decoded = \Whostyles\Whostyles::decode($test['hash']);
    if (!$decoded) {
        echo "  [FAIL] Decode returned null\n";
        $failed++;
        continue;
    }

    $decodeFail = false;
    foreach ($test['input']['config'] as $key => $val) {
        if ($decoded['config'][$key] !== $val) {
            echo "  [FAIL] Config {$key} mismatch. Expected {$val}, got {$decoded['config'][$key]}\n";
            $decodeFail = true;
        }
    }
    foreach ($test['input']['colors'] as $key => $val) {
        if ($decoded['colors'][$key] !== $val) {
            echo "  [FAIL] Color {$key} mismatch. Expected {$val}, got {$decoded['colors'][$key]}\n";
            $decodeFail = true;
        }
    }

    if ($decodeFail) {
        $failed++;
    } else {
        echo "  [PASS]\n";
        $passed++;
    }
}

echo "\nTests completed. {$passed} passed, {$failed} failed.\n";
exit($failed > 0 ? 1 : 0);
