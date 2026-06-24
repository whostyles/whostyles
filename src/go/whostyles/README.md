# Whostyles V2 - Go Module

Implementação oficial em Golang do protocolo Whostyles V2. O pacote expõe métodos robustos, imutáveis e concorrentes para empacotamento, parseamento e extração de hashes em aplicações web escaláveis.

## Instalação

O módulo está hospedado seguindo o padrão canônico do Go no Codeberg:

```bash
go get codeberg.org/whostyles/whostyles/src/go/whostyles
```

## Uso Básico

```go
package main

import (
	"fmt"
	"codeberg.org/whostyles/whostyles/src/go/whostyles"
)

func main() {
	htmlString := `<meta name="whostyle" content="{ws2:1mBxq6lG0u0uG0u1g1E4a4a1g1E2e2e}">`

	// 1. Descoberta Automática
	hash := whostyles.DiscoverInline(htmlString)

	if hash != "" {
		// 2. Decodificação
		decoded, err := whostyles.Decode(hash)
		if err == nil {
			fmt.Printf("Typography ID: %d\n", decoded.Config["typography"])
			fmt.Printf("Light Background: %s\n", decoded.Colors["light_bg"])
		}
	}
}
```

O formato de entrada/saída das cores usa strings hexadecimais de 7 caracteres com cerquilha (`#ffffff`) e as configurações utilizam um mapa de `uint64`.
