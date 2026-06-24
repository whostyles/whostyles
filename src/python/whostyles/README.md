# Whostyles V2 - Python Backend Module

Implementação nativa do protocolo Whostyles V2 para ecosistemas em Python, como Django, Flask, FastAPI e scripts genéricos. Utiliza inteiros Python nativos (que suportam precisão arbitrária nativamente) para perfeita reprodução do Base64 bitpacking.

## Instalação

```bash
pip install whostyles
```

## Uso Básico

```python
from whostyles import Whostyles

html_string = '<meta name="whostyle" content="{ws2:1mBxq6lG0u0uG0u1g1E4a4a1g1E2e2e}">'

# 1. Descobrir a Hash dentro de um HTML
hash_str = Whostyles.discover_inline(html_string)

if hash_str:
    # 2. Decodificar a Hash
    decoded = Whostyles.decode(hash_str)
    
    if decoded is not None:
        # Recupera as configurações e cores mapeadas
        print(f"Typography ID: {decoded['config']['typography']}")
        print(f"Light Background: {decoded['colors']['light_bg']}")

# Para gerar hashes:
# hash_output = Whostyles.encode(config_dict, colors_dict)
```
