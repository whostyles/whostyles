# Whostyles V2 - Rust Crate

Biblioteca nativa e incrivelmente rápida para Rust, desenhada para validar, decodificar e processar os hashes do Whostyles V2. Focada em performance e tipagem segura com `Option` e `Result`, livre de panics.

## Instalação

Disponível diretamente via Crates.io:

```bash
cargo add whostyles
```

## Uso Básico

```rust
use whostyles::{decode, discover_inline};

fn main() {
    let html = r#"<meta name="whostyle" content="{ws2:1mBxq6lG0u0uG0u1g1E4a4a1g1E2e2e}">"#;

    // 1. Encontrar o Hash na string HTML
    if let Some(hash) = discover_inline(html) {
        
        // 2. Decodificar o Hash de forma segura
        match decode(&hash) {
            Ok(decoded) => {
                // Acesso aos HashMaps de Configuração e Cores
                if let Some(typography) = decoded.config.get("typography") {
                    println!("Typography ID: {}", typography);
                }
                
                if let Some(bg_color) = decoded.colors.get("light_bg") {
                    println!("Light Background: {}", bg_color);
                }
            },
            Err(e) => println!("Hash inválido: {}", e),
        }
    }
}
```

Para consultar a documentação matemática de bitpacking, veja a RFC completa no root do projeto principal.
