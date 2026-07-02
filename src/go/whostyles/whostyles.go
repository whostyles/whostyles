package whostyles

import (
	"errors"
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
)

const Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-."

var radixes = []struct {
	Key   string
	Value uint64
}{
	{"typography", 28},
	{"transform", 4},
	{"align", 4},
	{"list", 5},
	{"border_style", 10},
	{"bg_texture", 32},
	{"border_width", 17},
	{"border_radius", 17},
	{"shadow_offset", 9},
	{"shadow_blur", 9},
	{"letter_spacing", 26},
	{"texture_opacity", 4},
	{"shadow_opacity", 4},
	{"texture_size", 4},
	{"checksum", 6},
}

var colorOrder = []string{
	"light_bg", "light_text", "light_accent", "light_texture", "light_border",
	"dark_bg", "dark_text", "dark_accent", "dark_texture", "dark_border",
}

type Config map[string]uint64
type Colors map[string]string

type Decoded struct {
	Config Config
	Colors Colors
}

type DiscoveryResult struct {
	Hash       string
	Decoded    *Decoded
	Attributes string
}

func decodeBase64(s string) (uint64, error) {
	var value uint64 = 0
	var multiplier uint64 = 1
	for i := 0; i < len(s); i++ {
		idx := strings.IndexByte(Alphabet, s[i])
		if idx == -1 {
			return 0, errors.New("invalid base64 character")
		}
		value += uint64(idx) * multiplier
		multiplier *= 64
	}
	return value, nil
}

func encodeBase64(value uint64, length int) string {
	result := ""
	for i := 0; i < length; i++ {
		result += string(Alphabet[value%64])
		value /= 64
	}
	return result
}

func decodeColor(s string) (string, error) {
	var val uint64 = 0
	for i := 0; i < 4; i++ {
		idx := strings.IndexByte(Alphabet, s[i])
		if idx == -1 {
			return "", errors.New("invalid base64 color character")
		}
		val = (val << 6) | uint64(idx)
	}
	return fmt.Sprintf("#%06x", val), nil
}

func encodeColor(hexStr string) (string, error) {
	if !regexp.MustCompile(`^#[0-9a-fA-F]{6}$`).MatchString(hexStr) {
		return "", fmt.Errorf("invalid hex color format: %s. Must be #RRGGBB", hexStr)
	}
	hexStr = strings.TrimPrefix(hexStr, "#")
	val, _ := strconv.ParseUint(hexStr, 16, 64)
	result := ""
	result += string(Alphabet[(val>>18)&63])
	result += string(Alphabet[(val>>12)&63])
	result += string(Alphabet[(val>>6)&63])
	result += string(Alphabet[val&63])
	return result, nil
}

func CalculateChecksum(config Config) uint64 {
	weights := []uint64{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14}
	props := []string{
		"typography", "transform", "align", "list", "border_style",
		"bg_texture", "border_width", "border_radius", "shadow_offset",
		"shadow_blur", "letter_spacing", "texture_opacity", "shadow_opacity", "texture_size",
	}
	var sum uint64 = 0
	for i, prop := range props {
		val, ok := config[prop]
		if !ok {
			val = 0
		}
		sum += val * weights[i]
	}
	return sum % 6
}

func Decode(hashStr string) (*Decoded, error) {
	pattern := regexp.MustCompile(`^\{ws1:([A-Za-z0-9\-.]{4})([A-Za-z0-9\-.]{4})([A-Za-z0-9\-.]{40})\}$`)
	matches := pattern.FindStringSubmatch(hashStr)
	if matches == nil {
		return nil, errors.New("invalid hash format")
	}

	configB64A := matches[1]
	configB64B := matches[2]
	colorsB64 := matches[3]

	config := make(Config)

	valueA, err := decodeBase64(configB64A)
	if err != nil {
		return nil, err
	}
	
	groupAProps := []string{"typography", "transform", "align", "list", "border_style", "bg_texture", "border_width"}
	for _, key := range groupAProps {
		rad := getRadixValue(key)
		config[key] = valueA % rad
		valueA /= rad
	}
	if valueA != 0 {
		return nil, errors.New("structurally invalid (residue must be 0)")
	}

	valueB, err := decodeBase64(configB64B)
	if err != nil {
		return nil, err
	}
	
	groupBProps := []string{"border_radius", "shadow_offset", "shadow_blur", "letter_spacing", "texture_opacity", "shadow_opacity", "texture_size", "checksum"}
	for _, key := range groupBProps {
		rad := getRadixValue(key)
		config[key] = valueB % rad
		valueB /= rad
	}
	if valueB != 0 {
		return nil, errors.New("structurally invalid (residue must be 0)")
	}

	expectedChecksum := CalculateChecksum(config)
	if config["checksum"] != expectedChecksum {
		return nil, errors.New("hash corrupted (checksum mismatch)")
	}

	colors := make(Colors)
	for i, key := range colorOrder {
		chunk := colorsB64[i*4 : i*4+4]
		color, err := decodeColor(chunk)
		if err != nil {
			return nil, err
		}
		colors[key] = color
	}

	return &Decoded{Config: config, Colors: colors}, nil
}

func Encode(config Config, colors Colors) (string, error) {
	// Validation
	for _, radix := range radixes {
		if radix.Key == "checksum" {
			continue
		}
		val, ok := config[radix.Key]
		if !ok {
			return "", fmt.Errorf("missing required config property: %s", radix.Key)
		}
		if val >= radix.Value {
			return "", fmt.Errorf("invalid value for %s: %d. Must be between 0 and %d", radix.Key, val, radix.Value-1)
		}
	}

	config["checksum"] = CalculateChecksum(config)

	var valueA uint64 = 0
	groupAProps := []string{"border_width", "bg_texture", "border_style", "list", "align", "transform", "typography"}
	for _, key := range groupAProps {
		valueA = valueA*getRadixValue(key) + config[key]
	}
	configB64A := encodeBase64(valueA, 4)

	var valueB uint64 = 0
	groupBProps := []string{"checksum", "texture_size", "shadow_opacity", "texture_opacity", "letter_spacing", "shadow_blur", "shadow_offset", "border_radius"}
	for _, key := range groupBProps {
		valueB = valueB*getRadixValue(key) + config[key]
	}
	configB64B := encodeBase64(valueB, 4)

	colorsB64 := ""
	for _, key := range colorOrder {
		color, ok := colors[key]
		if !ok {
			return "", fmt.Errorf("missing required color: %s", key)
		}
		encodedC, err := encodeColor(color)
		if err != nil {
			return "", err
		}
		colorsB64 += encodedC
	}

	return fmt.Sprintf("{ws1:%s%s%s}", configB64A, configB64B, colorsB64), nil
}

func getRadixValue(key string) uint64 {
	for _, r := range radixes {
		if r.Key == key {
			return r.Value
		}
	}
	return 1
}

func ExtractFromHeaders(headers map[string][]string) string {
	if headers == nil {
		return ""
	}
	hashRegex := regexp.MustCompile(`^\{ws1:[A-Za-z0-9\-.]{48}\}$`)
	for k, v := range headers {
		if strings.ToLower(k) == "x-whostyle" && len(v) > 0 {
			val := strings.TrimSpace(v[0])
			if hashRegex.MatchString(val) {
				return val
			}
		}
	}
	return ""
}

func ExtractFromTwtxt(feedString string) string {
	if feedString == "" {
		return ""
	}
	hashRegex := regexp.MustCompile(`(?i)^whostyle\s*=\s*(\{ws1:[A-Za-z0-9\-.]{48}\})\s*$`)
	lines := strings.Split(feedString, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if len(line) == 0 || line[0] != '#' {
			continue
		}
		content := strings.TrimLeft(line[1:], " \t")
		if m := hashRegex.FindStringSubmatch(content); len(m) > 1 {
			return m[1]
		}
	}
	return ""
}

func Extract(html string) string {
	// 1. Meta Tag
	reMeta := regexp.MustCompile(`(?i)<meta[^>]+name=["']?whostyle["']?[^>]+content=["']?(\{ws1:[A-Za-z0-9\-.]{48}\})["']?`)
	if m := reMeta.FindStringSubmatch(html); len(m) > 1 {
		return m[1]
	}

	// 2. JSON-LD
	reJSON := regexp.MustCompile(`(?i)"whostyle"\s*:\s*"(\{ws1:[A-Za-z0-9\-.]{48}\})"`)
	if m := reJSON.FindStringSubmatch(html); len(m) > 1 {
		return m[1]
	}

	// 3. Inline
	reInline := regexp.MustCompile(`(\{ws1:[A-Za-z0-9\-.]{48}\})`)
	matches := reInline.FindAllStringSubmatchIndex(html, -1)
	for _, match := range matches {
		if match[0] > 0 && html[match[0]-1] == '\\' {
			continue
		}
		return html[match[2]:match[3]]
	}

	return ""
}

func Clean(html string) string {
	reClean := regexp.MustCompile(`(?i)((?:<|&lt;)meta[\s\S]{0,250}?name=(?:["']|&quot;|&#39;|&#039;)?whostyle(?:["']|&quot;|&#39;|&#039;)?[\s\S]{0,250}?content=(?:["']|&quot;|&#39;|&#039;)?\{ws1:[A-Za-z0-9\-.]{48}\}(?:["']|&quot;|&#39;|&#039;)?[\s\S]{0,250}?(?:>|&gt;))|\\(\{ws1:[A-Za-z0-9\-.]{48}\})|(\{ws1:[A-Za-z0-9\-.]{48}\})`)
	return reClean.ReplaceAllStringFunc(html, func(match string) string {
		submatches := reClean.FindStringSubmatch(match)
		if len(submatches) > 1 && submatches[1] != "" {
			return submatches[1] // preserve meta tag
		}
		if len(submatches) > 2 && submatches[2] != "" {
			return submatches[2] // remove backslash from escaped hash
		}
		return "" // remove inline hash
	})
}

func Discover(html string, headers map[string][]string) *DiscoveryResult {
	hash := ExtractFromHeaders(headers)
	if hash == "" {
		hash = Extract(html)
	}
	if hash == "" {
		return nil
	}
	decoded, err := Decode(hash)
	if err != nil {
		return nil
	}
	attributes := GenerateAttributes(hash)
	return &DiscoveryResult{
		Hash:       hash,
		Decoded:    decoded,
		Attributes: attributes,
	}
}

var (
	Transforms = []string{"none", "capitalize", "uppercase", "lowercase"}
	Aligns     = []string{"left", "right", "center", "justify"}
	Lists      = []string{"disc", "circle", "square", "decimal", "lower-roman"}
	Borders    = []string{"none", "hidden", "dotted", "dashed", "solid", "double", "groove", "ridge", "inset", "outset"}
	Typography = []string{
		"system-ui", "segoe-roboto", "helvetica-neue", "verdana", "trebuchet",
		"tahoma", "century-gothic", "franklin-gothic", "gill-sans", "arial-rounded",
		"georgia", "times-new-roman", "garamond", "palatino", "baskerville",
		"bookman", "cambria", "didot", "bodoni", "rockwell",
		"monospace", "consolas", "courier-new", "monaco", "lucida-console",
		"andale-mono", "sf-mono", "cascadia-code",
	}
	Textures = []string{
		"none", "weave", "stripes-v", "stripes-h", "stripes-d-right",
		"stripes-d-left", "fine-grain", "zigzag-lines", "grid-standard",
		"grid-isometric", "crosses", "crosshatch", "checkerboard",
		"checkerboard-tilt", "triangles", "diamonds", "argyle", "honeycomb",
		"chevron", "houndstooth", "brick-wall", "brick-dots", "polka-dots",
		"circles-concentric", "scallop", "waves", "woven", "denim",
		"tartan", "soft-dapple", "confetti", "reserved",
	}
)

func getLuminance(hexStr string) float64 {
	hexStr = strings.TrimPrefix(hexStr, "#")
	val, _ := strconv.ParseUint(hexStr, 16, 64)
	r := float64((val>>16)&0xFF) / 255.0
	g := float64((val>>8)&0xFF) / 255.0
	b := float64(val&0xFF) / 255.0
	
	if r <= 0.03928 {
		r = r / 12.92
	} else {
		r = math.Pow((r+0.055)/1.055, 2.4)
	}
	if g <= 0.03928 {
		g = g / 12.92
	} else {
		g = math.Pow((g+0.055)/1.055, 2.4)
	}
	if b <= 0.03928 {
		b = b / 12.92
	} else {
		b = math.Pow((b+0.055)/1.055, 2.4)
	}
	
	return 0.2126*r + 0.7152*g + 0.0722*b
}

func getContrast(hex1, hex2 string) float64 {
	l1 := getLuminance(hex1)
	l2 := getLuminance(hex2)
	if l1 > l2 {
		return (l1 + 0.05) / (l2 + 0.05)
	}
	return (l2 + 0.05) / (l1 + 0.05)
}

func HexToRgba(hexStr string, opacityIndex uint64) string {
	if hexStr == "transparent" {
		return "transparent"
	}
	opacities := []float64{1.0, 0.75, 0.50, 0.25}
	var alpha float64 = 1.0
	if int(opacityIndex) < len(opacities) {
		alpha = opacities[opacityIndex]
	}
	hexStr = strings.TrimPrefix(hexStr, "#")
	val, _ := strconv.ParseUint(hexStr, 16, 64)
	r := (val >> 16) & 0xFF
	g := (val >> 8) & 0xFF
	b := val & 0xFF
	return fmt.Sprintf("rgba(%d, %d, %d, %g)", r, g, b, alpha)
}

func GenerateAttributes(hash string) string {
	decoded, err := Decode(hash)
	if err != nil || decoded == nil {
		return ""
	}

	config := decoded.Config
	colors := decoded.Colors

	getMapped := func(arr []string, idx uint64, def string) string {
		if int(idx) < len(arr) {
			return arr[idx]
		}
		return def
	}

	typographyClass := getMapped(Typography, config["typography"], "system-ui")
	textureClass := getMapped(Textures, config["bg_texture"], "none")

	classNames := []string{
		"whostyle-container",
		"whostyle-rendered",
		"ws-typography-" + typographyClass,
		"ws-texture-" + textureClass,
	}

	transform := getMapped(Transforms, config["transform"], "none")
	align := getMapped(Aligns, config["align"], "left")
	list := getMapped(Lists, config["list"], "disc")
	bstyle := getMapped(Borders, config["border_style"], "none")

	bwidth := fmt.Sprintf("%dpx", config["border_width"])
	bradius := fmt.Sprintf("%dpx", config["border_radius"])
	soffset := fmt.Sprintf("%dpx", int64(config["shadow_offset"]))
	sblur := fmt.Sprintf("%dpx", config["shadow_blur"])
	lspacing := fmt.Sprintf("%.1fpx", float64(config["letter_spacing"])*0.1-0.5)

	lBg := colors["light_bg"]
	lText := colors["light_text"]
	lAccent := colors["light_accent"]
	lTexture := colors["light_texture"]
	lBorder := colors["light_border"]

	if getContrast(lBg, lText) < 4.5 || getContrast(lBg, lAccent) < 4.5 || getContrast(lBg, HexToRgba(lTexture, config["texture_opacity"])) < 4.5 {
		lBg = "#ffffff"
		lText = "#000000"
		lAccent = "#0000ff"
		lTexture = "transparent"
		lBorder = "#cccccc"
	}

	dBg := colors["dark_bg"]
	dText := colors["dark_text"]
	dAccent := colors["dark_accent"]
	dTexture := colors["dark_texture"]
	dBorder := colors["dark_border"]

	if getContrast(dBg, dText) < 4.5 || getContrast(dBg, dAccent) < 4.5 || getContrast(dBg, HexToRgba(dTexture, config["texture_opacity"])) < 4.5 {
		dBg = "#000000"
		dText = "#ffffff"
		dAccent = "#00aaff"
		dTexture = "transparent"
		dBorder = "#555555"
	}

	opacities := []string{"1.0", "0.75", "0.50", "0.25"}
	tsizeMap := []string{"8px", "16px", "24px", "36px"}

	styles := []string{
		fmt.Sprintf("--ws-transform: %s", transform),
		fmt.Sprintf("--ws-align: %s", align),
		fmt.Sprintf("--ws-list: %s", list),
		fmt.Sprintf("--ws-bstyle: %s", bstyle),
		fmt.Sprintf("--ws-bwidth: %s", bwidth),
		fmt.Sprintf("--ws-bradius: %s", bradius),
		fmt.Sprintf("--ws-soffset: %s", soffset),
		fmt.Sprintf("--ws-sblur: %s", sblur),
		fmt.Sprintf("--ws-lspacing: %s", lspacing),
		fmt.Sprintf("--ws-topacity: %s", opacities[config["texture_opacity"]]),
		fmt.Sprintf("--ws-sopacity: %s", opacities[config["shadow_opacity"]]),
		fmt.Sprintf("--ws-tsize: %s", tsizeMap[config["texture_size"]]),
		fmt.Sprintf("--ws-light-bg: %s", lBg),
		fmt.Sprintf("--ws-light-text: %s", lText),
		fmt.Sprintf("--ws-light-accent: %s", lAccent),
		fmt.Sprintf("--ws-light-texture: %s", lTexture),
		fmt.Sprintf("--ws-light-border: %s", lBorder),
		fmt.Sprintf("--ws-light-shadow: %s", HexToRgba(lText, config["shadow_opacity"])),
		fmt.Sprintf("--ws-dark-bg: %s", dBg),
		fmt.Sprintf("--ws-dark-text: %s", dText),
		fmt.Sprintf("--ws-dark-accent: %s", dAccent),
		fmt.Sprintf("--ws-dark-texture: %s", dTexture),
		fmt.Sprintf("--ws-dark-border: %s", dBorder),
		fmt.Sprintf("--ws-dark-shadow: %s", HexToRgba(dText, config["shadow_opacity"])),
	}

	return fmt.Sprintf(`class="%s" style="%s;"`, strings.Join(classNames, " "), strings.Join(styles, "; "))
}
