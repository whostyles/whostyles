<?php
class WhostyleProcessor {
    private array $safe_fonts = ['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui'];
    private array $safe_align = ['left', 'right', 'center', 'justify'];
    private array $safe_lists = ['disc', 'circle', 'square', 'decimal', 'lower-roman'];
    private array $safe_borders = ['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset'];

    public function process(string $json_raw): ?array {
        $data = json_decode($json_raw, true);
        if (!is_array($data) || !isset($data['whostyle']) || !is_array($data['whostyle'])) return null;

        $ws = $data['whostyle'];
        if (($ws['version'] ?? '') !== '1.1') return null;

        // 1. Typography and Enum Validation
        $output = [
            'typography' => in_array($ws['typography'] ?? '', $this->safe_fonts) ? $ws['typography'] : 'sans-serif',
            'text_transform' => in_array($ws['text_transform'] ?? '', ['none', 'capitalize', 'uppercase', 'lowercase']) ? $ws['text_transform'] : 'none',
            'text_align' => in_array($ws['text_align'] ?? '', $this->safe_align) ? $ws['text_align'] : 'left',
            'list_style_type' => in_array($ws['list_style_type'] ?? '', $this->safe_lists) ? $ws['list_style_type'] : 'disc',
            'border_style' => in_array($ws['border_style'] ?? '', $this->safe_borders) ? $ws['border_style'] : 'none',
        ];

        // 2. Validation and Clamp of Numeric Limits
        $output['border_width'] = max(0, min(4, (int)($ws['border_width'] ?? 0)));
        $output['border_radius'] = max(0, min(16, (int)($ws['border_radius'] ?? 0)));
        $output['shadow_offset'] = max(-4, min(4, (int)($ws['shadow_offset'] ?? 0)));
        $output['shadow_blur'] = max(0, min(8, (int)($ws['shadow_blur'] ?? 0)));
        $output['letter_spacing'] = max(-0.5, min(2.0, (float)($ws['letter_spacing'] ?? 0.0)));

        // 3. Theme and Color Processing
        if (!isset($ws['theme']) || !is_array($ws['theme']) || (!isset($ws['theme']['light']) && !isset($ws['theme']['dark']))) return null;
        
        $output['theme'] = [];
        foreach (['light', 'dark'] as $mode) {
            if (isset($ws['theme'][$mode]) && is_array($ws['theme'][$mode])) {
                $theme = $ws['theme'][$mode];
                if (!$this->validate_color($theme['background'] ?? '') || !$this->validate_color($theme['text'] ?? '')) continue;
                
                $bg = $theme['background'];
                $text = $theme['text'];
                
                // Basic Contrast Validation (Optional, but recommended in the spec)
                if (!$this->check_contrast($bg, $text)) {
                    // Local fallback if contrast is absurdly illegible (WCAG 2.1 < 4.5:1)
                    if ($mode === 'dark') {
                        $bg = '#121212';
                        $text = '#e0e0e0';
                    } else {
                        $bg = '#ffffff';
                        $text = '#000000';
                    }
                }

                $output['theme'][$mode] = [
                    'background' => $bg,
                    'text' => $text,
                    'border_color' => $this->validate_color($theme['border_color'] ?? '') ? $theme['border_color'] : $text,
                    'link_color' => $this->validate_color($theme['link_color'] ?? '') ? $theme['link_color'] : $text,
                    'link_hover_color' => $this->validate_color($theme['link_hover_color'] ?? '') ? $theme['link_hover_color'] : $text,
                ];
            }
        }

        if (empty($output['theme'])) return null;

        return $output;
    }

    public function generate_inline_css(array $processed_data, string $mode = 'light'): string {
        $theme = $processed_data['theme'][$mode] ?? reset($processed_data['theme']);
        if (!$theme) return '';

        return sprintf(
            '--ws-font: %s; --ws-transform: %s; --ws-align: %s; --ws-list: %s; --ws-bstyle: %s; ' .
            '--ws-bwidth: %dpx; --ws-bradius: %dpx; --ws-soffset: %dpx; --ws-sblur: %dpx; --ws-lspacing: %.2Fpx; ' .
            '--ws-bg: %s; --ws-text: %s; --ws-bcolor: %s; --ws-link: %s; --ws-lhover: %s;',
            $processed_data['typography'], $processed_data['text_transform'], $processed_data['text_align'],
            $processed_data['list_style_type'], $processed_data['border_style'], $processed_data['border_width'],
            $processed_data['border_radius'], $processed_data['shadow_offset'], $processed_data['shadow_blur'],
            $processed_data['letter_spacing'], $theme['background'], $theme['text'], $theme['border_color'],
            $theme['link_color'], $theme['link_hover_color']
        );
    }

    private function validate_color(string $hex): bool {
        return (bool)preg_match('/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/', $hex);
    }

    private function get_relative_luminance(string $hex): float {
        $clean = ltrim($hex, '#');
        if (strlen($clean) === 3) {
            $r = hexdec($clean[0] . $clean[0]);
            $g = hexdec($clean[1] . $clean[1]);
            $b = hexdec($clean[2] . $clean[2]);
        } else {
            $r = hexdec(substr($clean, 0, 2));
            $g = hexdec(substr($clean, 2, 2));
            $b = hexdec(substr($clean, 4, 2));
        }

        $a = array_map(function($v) {
            $v /= 255;
            return $v <= 0.03928 ? $v / 12.92 : pow(($v + 0.055) / 1.055, 2.4);
        }, [$r, $g, $b]);

        return $a[0] * 0.2126 + $a[1] * 0.7152 + $a[2] * 0.0722;
    }

    private function check_contrast(string $c1, string $c2): bool {
        $lum1 = $this->get_relative_luminance($c1);
        $lum2 = $this->get_relative_luminance($c2);
        $brightest = max($lum1, $lum2);
        $darkest = min($lum1, $lum2);
        return (($brightest + 0.05) / ($darkest + 0.05)) >= 4.5;
    }

    public function discover_url(string $html): ?string {
        libxml_use_internal_errors(true);
        $doc = new DOMDocument();
        if (!$doc->loadHTML($html)) {
            libxml_clear_errors();
            return null;
        }
        libxml_clear_errors();

        $xpath = new DOMXPath($doc);
        $links = $xpath->query('//link[@rel="whostyle"]');
        if ($links !== false && $links->length > 0) {
            foreach ($links as $link) {
                if ($link->getAttribute('type') === 'application/json' && $link->hasAttribute('href')) {
                    $url = $link->getAttribute('href');
                    if (filter_var($url, FILTER_VALIDATE_URL)) {
                        return $url;
                    }
                }
            }
        }
        return null;
    }

    public function fetch_json(string $url): ?string {
        if (!filter_var($url, FILTER_VALIDATE_URL)) return null;

        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => "Accept: application/json\r\n",
                'timeout' => 5,
                'ignore_errors' => true
            ]
        ]);

        $stream = @fopen($url, 'r', false, $context);
        if (!$stream) return null;

        $meta = stream_get_meta_data($stream);
        $headers = $meta['wrapper_data'] ?? [];
        $content_type_valid = false;
        
        foreach ($headers as $header) {
            if (stripos($header, 'Content-Length:') === 0) {
                $len = (int)trim(substr($header, 15));
                if ($len > 4096) {
                    fclose($stream);
                    return null;
                }
            }
            if (stripos($header, 'Content-Type:') === 0) {
                $type = strtolower(trim(substr($header, 13)));
                if (strpos($type, 'application/json') !== false) {
                    $content_type_valid = true;
                }
            }
        }
        
        if (!$content_type_valid) {
            fclose($stream);
            return null;
        }

        $data = stream_get_contents($stream, 4097);
        fclose($stream);
        
        if (strlen($data) > 4096) return null;

        return $data;
    }
}