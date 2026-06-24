# Whostyles V2 - PHP Backend Module

O módulo nativo de PHP para empacotar e validar hashes do Whostyles V2 com altíssima performance matemática utilizando tipagem robusta nativa e Namespace PSR-4.

## Instalação

```bash
composer require whostyles/whostyles
```

O Composer cuidará do autoload da classe `\Whostyles\Whostyles` nativamente.

## Uso Básico

```php
<?php
require 'vendor/autoload.php';

use Whostyles\Whostyles;

$htmlString = '<meta name="whostyle" content="{ws2:1mBxq6lG0u0uG0u1g1E4a4a1g1E2e2e}">';

// 1. Descobrir a Hash dentro de um HTML
$hash = Whostyles::discoverInline($htmlString);

if ($hash) {
    // 2. Decodificar a Hash de volta para configurações e cores
    $decoded = Whostyles::decode($hash);
    
    if ($decoded !== null) {
        // Output será o integer da tipografia selecionada
        echo "Typography: " . $decoded['config']['typography'] . "\n";
        
        // Output será o hexadecimal
        echo "Light Background: " . $decoded['colors']['light_bg'] . "\n";
    }
}
```

Para criação e uso de geradores no backend, veja o método `encode($config, $colors)` disponível na classe.
