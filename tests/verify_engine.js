import { WhostyleEngine } from '../src/js/whostyle.js';

function runTest(name, callback) {
    try {
        let isAsync = callback.constructor.name === "AsyncFunction";
        if (isAsync) {
            return callback().then(() => {
                console.log(`✅ TEST PASSED: ${name}`);
            }).catch(e => {
                console.error(`❌ TEST FAILED: ${name} - ${e.message}`);
                process.exit(1);
            });
        } else {
            callback();
            console.log(`✅ TEST PASSED: ${name}`);
        }
    } catch (e) {
        console.error(`❌ TEST FAILED: ${name} - ${e.message}`);
        process.exit(1);
    }
}

function createMockElement() {
    return {
        style: {
            properties: {},
            setProperty(name, value) {
                this.properties[name] = value;
            }
        },
        classList: {
            classes: [],
            add(className) {
                this.classes.push(className);
            }
        }
    };
}

const tests = async () => {
    runTest("Valid Version 1.1 JSON Parsing and ENUMs", () => {
        const el = createMockElement();
        const json = {
            whostyle: {
                version: "1.1",
                typography: "monospace",
                text_transform: "uppercase",
                text_align: "center",
                list_style_type: "square",
                border_style: "dashed",
                theme: {
                    light: {
                        background: "#ffffff",
                        text: "#000000"
                    }
                }
            }
        };
        const success = WhostyleEngine.apply(el, json, 'light');
        if (!success) throw new Error("apply returned false for valid JSON");
        if (el.style.properties['--ws-font'] !== 'monospace') {
            throw new Error(`Expected monospace, got ${el.style.properties['--ws-font']}`);
        }
        if (el.style.properties['--ws-transform'] !== 'uppercase') {
            throw new Error(`Expected uppercase, got ${el.style.properties['--ws-transform']}`);
        }
        if (el.style.properties['--ws-align'] !== 'center') {
            throw new Error(`Expected center, got ${el.style.properties['--ws-align']}`);
        }
        if (el.style.properties['--ws-list'] !== 'square') {
            throw new Error(`Expected square, got ${el.style.properties['--ws-list']}`);
        }
        if (el.style.properties['--ws-bstyle'] !== 'dashed') {
            throw new Error(`Expected dashed, got ${el.style.properties['--ws-bstyle']}`);
        }
        if (!el.classList.classes.includes('whostyle-rendered')) {
            throw new Error("Class 'whostyle-rendered' not added to element");
        }
    });

    runTest("Reject Invalid Version 1.0 JSON", () => {
        const el = createMockElement();
        const json = {
            whostyle: {
                version: "1.0",
                typography: "monospace",
                theme: {
                    light: {
                        background: "#ffffff",
                        text: "#000000"
                    }
                }
            }
        };
        const success = WhostyleEngine.apply(el, json, 'light');
        if (success) throw new Error("apply returned true for version 1.0 JSON");
    });

    runTest("Robustness on Non-Object JSON Values", () => {
        const el = createMockElement();
        if (WhostyleEngine.apply(el, "true", 'light')) {
            throw new Error("Expected false for non-object JSON string");
        }
        if (WhostyleEngine.apply(el, { whostyle: "version 1.1" }, 'light')) {
            throw new Error("Expected false when whostyle property is a string");
        }
    });

    runTest("Clamp Bad/Missing Numeric Limits Safely (NaN protection)", () => {
        const el = createMockElement();
        const json = {
            whostyle: {
                version: "1.1",
                typography: "sans-serif",
                border_width: "invalid",
                border_radius: 99,
                shadow_offset: -10,
                theme: {
                    light: {
                        background: "#ffffff",
                        text: "#000000"
                    }
                }
            }
        };
        const success = WhostyleEngine.apply(el, json, 'light');
        if (!success) throw new Error("apply failed on bad numbers");
        if (el.style.properties['--ws-bwidth'] !== '0px') {
            throw new Error(`Expected clamped border_width to be 0px, got ${el.style.properties['--ws-bwidth']}`);
        }
        if (el.style.properties['--ws-bradius'] !== '16px') {
            throw new Error(`Expected clamped border_radius to be 16px, got ${el.style.properties['--ws-bradius']}`);
        }
        if (el.style.properties['--ws-soffset'] !== '-4px') {
            throw new Error(`Expected clamped shadow_offset to be -4px, got ${el.style.properties['--ws-soffset']}`);
        }
    });

    runTest("Contrast Override Logic (Low Contrast)", () => {
        const elLight = createMockElement();
        const elDark = createMockElement();
        const json = {
            whostyle: {
                version: "1.1",
                typography: "sans-serif",
                theme: {
                    light: {
                        background: "#888888",
                        text: "#888888"
                    },
                    dark: {
                        background: "#777777",
                        text: "#787878"
                    }
                }
            }
        };

        let success = WhostyleEngine.apply(elLight, json, 'light');
        if (!success) throw new Error("apply failed for light theme");
        if (elLight.style.properties['--ws-bg'] !== '#ffffff' || elLight.style.properties['--ws-text'] !== '#000000') {
            throw new Error(`Light theme contrast override failed: bg=${elLight.style.properties['--ws-bg']}, text=${elLight.style.properties['--ws-text']}`);
        }

        success = WhostyleEngine.apply(elDark, json, 'dark');
        if (!success) throw new Error("apply failed for dark theme");
        if (elDark.style.properties['--ws-bg'] !== '#121212' || elDark.style.properties['--ws-text'] !== '#e0e0e0') {
            throw new Error(`Dark theme contrast override failed: bg=${elDark.style.properties['--ws-bg']}, text=${elDark.style.properties['--ws-text']}`);
        }
    });

    runTest("Luminance shorthand 3-digit and 6-digit hex parity", () => {
        const lum3 = WhostyleEngine.getRelativeLuminance('#fff');
        const lum6 = WhostyleEngine.getRelativeLuminance('#ffffff');
        if (Math.abs(lum3 - lum6) > 0.0001) {
            throw new Error(`Expected identical relative luminance for #fff and #ffffff, got ${lum3} vs ${lum6}`);
        }
    });

    runTest("Discover URL and Inline JSON in HTML string", () => {
        const html = '<!DOCTYPE html><html><head><link rel="whostyle" type="application/json" href="https://example.com/whostyle.json"></head><body></body></html>';
        const url = WhostyleEngine.discoverUrl(html);
        if (url !== 'https://example.com/whostyle.json') {
            throw new Error(`Expected https://example.com/whostyle.json, got ${url}`);
        }

        const invalidHtml = '<html><head><link rel="whostyle" href="invalid-url"></head><body></body></html>';
        if (WhostyleEngine.discoverUrl(invalidHtml) !== null) {
            throw new Error("Should return null for invalid URL format or missing type");
        }

        const htmlInline = '<!DOCTYPE html><html><head><script type="application/whostyle+json">{"whostyle":{"version":"1.1"}}</script></head><body></body></html>';
        const jsonStr = WhostyleEngine.discoverInline(htmlInline);
        if (jsonStr !== '{"whostyle":{"version":"1.1"}}') {
            throw new Error(`Expected inline JSON string, got ${jsonStr}`);
        }
    });

    await runTest("Fetch JSON safely", async () => {
        const res = await WhostyleEngine.fetchJson("not-a-url");
        if (res !== null) throw new Error("Expected null for invalid URL");

        // Use a definitely non-existent URL (should fail)
        const res2 = await WhostyleEngine.fetchJson("http://localhost:9999/does-not-exist.json");
        if (res2 !== null) throw new Error("Expected null for failing request");
    });

    console.log("All JS reference implementation tests completed successfully!");
};

tests().catch(e => {
    console.error("Test execution failed: ", e);
    process.exit(1);
});
