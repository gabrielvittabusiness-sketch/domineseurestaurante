# Painel do Closer — Domine Seu Restaurante

Ferramenta para colar a transcrição de uma call, analisá-la com o Gemini,
comparar com a autoavaliação do vendedor, acompanhar a evolução de cada
closer/SDR ao longo do tempo (com pontos que sobem e descem a cada call) e
gerenciar o plano de treinamento de cada um.

Você **não precisa saber programar** para colocar isso no ar. Siga os passos
na ordem. Leva uns 15-20 minutos na primeira vez.

## O que você vai usar

- **Google AI Studio** → para pegar a chave (senha) do Gemini.
- **GitHub** → só guarda os arquivos (você já tem conta).
- **Vercel** → coloca a ferramenta no ar e guarda o histórico (você já tem conta).

## Passo 1 — Pegar a chave do Gemini

1. Acesse https://aistudio.google.com/apikey
2. Clique em "Create API key" (ou "Criar chave de API").
3. Copie a chave gerada (uma sequência de letras/números) e guarde — vai usar no Passo 4.

## Passo 2 — Subir os arquivos no GitHub

1. Entre em https://github.com e clique em **"New repository"**.
2. Dê um nome, por exemplo `painel-closer-dsr`. Marque como **Private**
   (assim só quem você convidar acessa o código). Clique em **"Create repository"**.
3. Na página do repositório recém-criado, clique em **"uploading an existing file"**
   (ou "Add file" → "Upload files").
4. No seu computador, **extraia a pasta** que eu te entreguei (o arquivo `.zip`)
   e **arraste a pasta inteira** (com o `index.html`, a pasta `api` e o
   `package.json` dentro) para a área de upload do GitHub. Ele preserva as
   pastas automaticamente.
5. Role para baixo e clique em **"Commit changes"**.

## Passo 3 — Importar na Vercel

1. Entre em https://vercel.com/new
2. Escolha **"Import Git Repository"** e selecione o repositório
   `painel-closer-dsr` que você acabou de criar.
3. Não precisa mudar nenhuma configuração — clique direto em **"Deploy"**.
4. Vai falhar ou ficar incompleto nessa primeira vez, e tudo bem — falta ligar
   o banco de dados e a chave do Gemini (próximos passos). Depois de fazer
   isso, é só clicar em "Redeploy".

## Passo 4 — Criar o banco de histórico (Vercel KV)

1. Dentro do projeto na Vercel, clique na aba **"Storage"**.
2. Clique em **"Create Database"** → escolha **"KV"** (às vezes aparece como
   parte do "Marketplace", pelo provedor Upstash — é a mesma coisa).
3. Dê um nome e clique em **"Connect"** para ligar ao projeto
   `painel-closer-dsr`. A Vercel configura tudo sozinha (nenhuma senha para
   copiar manualmente).

## Passo 5 — Guardar a chave do Gemini com segurança

1. Ainda no projeto, vá em **"Settings"** → **"Environment Variables"**.
2. Adicione uma variável:
   - Nome: `GEMINI_API_KEY`
   - Valor: cole a chave que você pegou no Passo 1.
3. Clique em **"Save"**.
4. (Opcional) Se um dia quiser trocar o modelo do Gemini usado, adicione outra
   variável `GEMINI_MODEL` com o nome do modelo (por padrão a ferramenta usa
   `gemini-2.5-flash`, rápido e barato).

## Passo 6 — Publicar de novo

1. Vá na aba **"Deployments"** do projeto e clique nos "..." do último
   deploy → **"Redeploy"**.
2. Quando terminar, a Vercel te dá um link tipo
   `https://painel-closer-dsr.vercel.app` — esse é o link da sua ferramenta,
   pronta pra usar com sua equipe.

## Como atualizar no futuro

Sempre que eu te mandar um arquivo novo ou corrigido:
1. Abra o repositório no GitHub, entre no arquivo que mudou.
2. Clique no ícone de lápis (editar), apague o conteúdo antigo, cole o novo.
3. Clique em **"Commit changes"**.
4. A Vercel detecta sozinha e já publica a nova versão em ~1 minuto — não
   precisa repetir os outros passos.

## Como funciona o sistema de pontos

Cada call analisada soma ou diminui pontos do vendedor com base na nota
ponderada da IA, usando 60 como "neutro" (nem bom nem ruim):

- nota 100 → **+8 pontos**
- nota 80 → **+4 pontos**
- nota 60 → **0 pontos**
- nota 40 → **−4 pontos**
- nota 20 → **−8 pontos**

Isso fica no arquivo `api/evaluations.js`, na função `pointsFor` — se quiser
mudar a régua (por exemplo, dar mais peso às notas altas), é só eu ajustar
essa fórmula e te mandar o arquivo atualizado.

## Estrutura dos arquivos

```
index.html          → a tela toda (Avaliar, Vendedores, Histórico, Critérios)
api/analyze.js       → chama o Gemini com a transcrição (chave fica só aqui)
api/criteria.js       → salva/lê os critérios e pesos definidos pelo gestor
api/evaluations.js    → salva/lê o histórico de calls analisadas
api/sellers.js        → pontos, etapa do funil e ações de cada vendedor
package.json          → lista a única dependência (@vercel/kv)
```
