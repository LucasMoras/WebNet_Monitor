# WebNet_Monitor

Monitoramento simples e offline de dispositivos de rede local (computadores, impressoras, roteadores, câmeras etc.) usando apenas **HTML, CSS e JavaScript puro**.
Node.js, banco de dados externo — tudo roda direto no navegador e os dados ficam salvos no **localStorage** do seu computador.
Ideal para laboratórios de informática, pequenas redes ou uso em sala de aula.

## Funcionalidades
- Cadastro de dispositivos (nome, IP, tipo e localização)
- Teste de conectividade via **ping** diretamente no navegador
- Status em tempo real (online/offline com tempo de resposta)
- Histórico completo de testes por dispositivo
- Persistência total dos dados usando **localStorage**
- Tudo offline – abre o `index.html` e já funciona!

## Capturas de Tela
<img src="screentiro.png" width="800" alt="Tela principal">

## Como usar
1. Clone ou baixe o repositório
2. Abra o arquivo em seu editor de texto
3. No terminal rode "npm i" para instalar as dependências 
4. Baixe o arquivo .sql e adicione ao seu MySQL
5. Inicie o banco no terminal com node script.js
6. Cadastre seus dispositivos
7. Clique em "Testar Todos" ou no ícone de play do dispositivo
8. Pronto! O monitoramento já está rodando

## Tecnologias utilizadas
- HTML5
- CSS3 (com Flexbox e Grid)
- JavaScript puro (Vanilla JS)
- Node JS
- localStorage para persistência
