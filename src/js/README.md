# Whostyles V2 - JavaScript Core & DOM

O módulo JavaScript do Whostyles V2 atua tanto em ambientes Node.js (Isomórfico) quanto diretamente no Browser. 
Ele expõe o módulo puro `WhostyleCore` (apenas processamento matemático e parser) e o utilitário `WhostyleDOM` (que injeta propriedades CSS no DOM do navegador).

## Instalação

```bash
npm install @whostyles/whostyles
```

## Uso no Node.js / Server-side

Se você está processando o Whostyles no servidor, utilize apenas o `WhostyleCore` para evitar problemas com falta de objetos DOM (ex: `window`, `document`).

```javascript
import { WhostyleCore } from '@whostyles/whostyles';

const htmlString = '<meta name="whostyle" content="{ws2:1mBxq6lG0u0uG0u1g1E4a4a1g1E2e2e}">';

// 1. Descobrir a Hash na String HTML
const hash = WhostyleCore.discoverInline(htmlString);

if (hash) {
    // 2. Decodificar a Hash
    const decoded = WhostyleCore.decode(hash);
    console.log(decoded.config.typography); // Retorna um Int correspondente
    console.log(decoded.colors.light_bg);   // Retorna '#ffffff'
}
```

## Uso no Browser / DOM

Para capturar e aplicar um Whostyle automaticamente em uma página da web cliente:

```html
<script type="module">
import { WhostyleDOM } from '@whostyles/whostyles/src/js/whostyle-dom.js';

// Applica o estilo capturado no <meta> diretamente no <body>
WhostyleDOM.applyFromMeta(document.body);
</script>
```

Para maiores informações, confira o documento principal de especificação no repositório.
