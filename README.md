# Farol - Finanças Pessoais

Aplicação web simples para gestão de finanças pessoais, pensada para telemóvel.

## O que inclui

- Registo rápido de receitas e despesas.
- Dashboard mensal com saldo, receitas, despesas e taxa de poupança.
- Lista de movimentos por mês.
- Despesas fixas reutilizáveis.
- Registo e gráfico de património.
- Simulador de investimento com juros compostos.
- Dark mode.
- Exportação e importação de dados.
- Funcionamento sem contas, integrações bancárias ou servidor de dados.

## Privacidade

Os dados não são enviados para o GitHub nem para qualquer servidor. A app guarda os dados no próprio navegador do dispositivo, usando armazenamento local.

Isto significa que:

- Os dados registados no iPhone ficam nesse iPhone/Safari.
- Os dados registados no computador ficam nesse computador/navegador.
- Para mudar de dispositivo, usa **Exportar** no dispositivo antigo e **Importar** no novo.

## Publicar no GitHub Pages

1. Cria um repositório no GitHub.
2. Envia todos os ficheiros desta pasta para o repositório.
3. No GitHub, abre **Settings**.
4. Entra em **Pages**.
5. Em **Build and deployment**, escolhe:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/ (root)`
6. Clica em **Save**.
7. Aguarda 1 a 3 minutos.
8. O GitHub vai mostrar o link da app, normalmente:

```text
https://o-teu-utilizador.github.io/nome-do-repositorio/
```

## Usar no iPhone

1. Abre o link do GitHub Pages no Safari.
2. Toca no botão de partilha.
3. Escolhe **Adicionar ao ecrã principal**.
4. Abre pelo ícone criado.

## Ficheiros principais

- `index.html`: página principal da app.
- `styles.css`: estilos.
- `script.js`: lógica da aplicação.
- `manifest.webmanifest`: configuração para instalação no telemóvel.
- `sw.js`: cache offline básica.
- `icon.svg`: ícone da app.
- `farol-financas-single.html`: versão num único ficheiro, útil para arquivo, mas não recomendada para iPhone.
