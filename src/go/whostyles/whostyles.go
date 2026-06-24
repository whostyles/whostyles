package whostyles

import (
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

const Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"

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
	{"border_width", 7},
	{"border_radius", 17},
	{"shadow_offset", 9},
	{"shadow_blur", 9},
	{"letter_spacing", 26},
}

var colorOrder = []string{
	"light_bg", "light_text", "light_accent", "light_texture",
	"dark_bg", "dark_text", "dark_accent", "dark_texture",
}

type Config map[string]uint64
type Colors map[string]string

type Decoded struct {
	Config Config
	Colors Colors
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

func encodeColor(hexStr string) string {
	hexStr = strings.TrimPrefix(hexStr, "#")
	val, _ := strconv.ParseUint(hexStr, 16, 64)
	result := ""
	result += string(Alphabet[(val>>18)&63])
	result += string(Alphabet[(val>>12)&63])
	result += string(Alphabet[(val>>6)&63])
	result += string(Alphabet[val&63])
	return result
}

func Decode(hashStr string) (*Decoded, error) {
	pattern := regexp.MustCompile(`^{ws2:([A-Za-z0-9\-_]{7})([A-Za-z0-9\-_]{32})}$`)
	matches := pattern.FindStringSubmatch(hashStr)
	if matches == nil {
		return nil, errors.New("invalid hash format")
	}

	configB64 := matches[1]
	colorsB64 := matches[2]

	value, err := decodeBase64(configB64)
	if err != nil {
		return nil, err
	}

	config := make(Config)
	for _, radix := range radixes {
		config[radix.Key] = value % radix.Value
		value /= radix.Value
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

func Encode(config Config, colors Colors) string {
	var value uint64 = 0
	// Pack config in reverse order
	for i := len(radixes) - 1; i >= 0; i-- {
		radix := radixes[i]
		val, ok := config[radix.Key]
		if !ok {
			val = 0
		}
		value = value*radix.Value + val
	}

	configB64 := encodeBase64(value, 7)

	colorsB64 := ""
	for _, key := range colorOrder {
		color, ok := colors[key]
		if !ok {
			color = "#000000"
		}
		colorsB64 += encodeColor(color)
	}

	return fmt.Sprintf("{ws2:%s%s}", configB64, colorsB64)
}

func DiscoverInline(html string) string {
	metaPattern := regexp.MustCompile(`(?i)<meta\s+(?:[^>]*\s+)?name=["']?whostyle["']?\s+(?:[^>]*\s+)?content=["']?({ws2:[A-Za-z0-9\-_]{39}})["']?[^>]*>`)
	if matches := metaPattern.FindStringSubmatch(html); matches != nil {
		return matches[1]
	}

	fallbackPattern := regexp.MustCompile(`({ws2:[A-Za-z0-9\-_]{39}})`)
	if matches := fallbackPattern.FindStringSubmatch(html); matches != nil {
		return matches[1]
	}

	return ""
}
