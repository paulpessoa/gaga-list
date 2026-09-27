# Checklist: Configuração da Skill Alexa para Gaga List

Este documento serve como um guia passo-a-passo para a configuração da Alexa Developer Console, bem como um repositório central para as variáveis de ambiente necessárias no Next.js (Supabase) e na Amazon.

## 🔗 1. Variáveis a Coletar (Levar para a Amazon)
Estas são as informações do seu projeto Next.js que a Alexa vai precisar:

- [ ] **Endpoint HTTPS da sua API:**
  - *Local (ngrok)*: `https://<seu-ngrok-id>.ngrok.app/api/alexa`
  - *Produção (Vercel)*: `https://<seu-dominio>.com/api/alexa`
- [ ] **Account Linking (Supabase / NextAuth):**
  - *Authorization URI*: (Ex: `https://<seu-dominio>.com/api/auth/signin` ou URL do Supabase)
  - *Access Token URI*: (Ex: `https://<seu-dominio>.com/api/auth/token`)
  - *Client ID*: (ID do App OAuth que você registrará)
  - *Client Secret*: (Segredo do App OAuth)
- [ ] **Links de Compliance e Distribuição (Obrigatórios na Amazon):**
  - *Privacy Policy URL*: `https://<seu-dominio>.com/privacy`
  - *Terms of Use URL*: `https://<seu-dominio>.com/terms`

---

## 🔗 2. Variáveis a Trazer (Deixar no `.env.local` do Next.js)
Quando você criar a Skill, a Amazon te dará IDs. Traga-os para cá:

- [x] **Skill ID:**
  - `ALEXA_SKILL_ID=amzn1.ask.skill.0ac2316e-2310-4484-b69b-cc0cdd52f520`
- [ ] **Client ID (Account Linking):**
  - `ALEXA_CLIENT_ID=` (Para validar de onde vem a requisição OAuth)

---

## ✅ 3. Passo a Passo no Alexa Developer Console

Siga estes passos lá em [developer.amazon.com/alexa/console/ask](https://developer.amazon.com/alexa/console/ask):

### Fase A: Criação
- [x] **1.** Clique em "Create Skill".
- [x] **2.** Nomeie a Skill como **Gaga List** e escolha a Primary Locale (Ex: `pt-BR`).
- [x] **3.** Escolha o tipo de modelo: **Custom** (Custom model).
- [x] **4.** Escolha o método de hospedagem: **Provision your own** (Pois vamos usar o Next.js).
- [x] **5.** Escolha um template do zero (Start from scratch).

### Fase B: Interação (Interaction Model - Arquitetura Agent LLM)
- [ ] **1.** Vá em **Invocations > Skill Invocation Name** e escreva `gaga list`.
- [ ] **2.** Vá em **Intents** e exclua as intents antigas (`AddItemIntent`, `ReadListsIntent`, `CheckItemIntent`) se elas existirem. O nosso Agente cuidará de tudo!
- [ ] **3.** Clique em **Add Intent**, escolha *Create custom intent* e nomeie como `AgentIntent`.
- [ ] **4.** Adicione as seguintes **Utterances** contendo apenas o slot `{Query}`:
  - `{Query}`
  - `fazer {Query}`
  - `quero {Query}`
  - `pedir {Query}`
  - `avisar que {Query}`
- [ ] **5.** Na parte debaixo (Intent Slots), crie o slot `Query` e selecione o tipo de slot (Slot Type) como **`AMAZON.SearchQuery`**.
  - *(Nota: O `AMAZON.SearchQuery` serve para capturar qualquer texto livre e passar direto para a nossa API)*
- [ ] **6.** Clique em **Save Model** e depois **Build Model**.

### Fase C: Endpoint (Conectando com o Next.js)
- [x] **1.** Vá no menu esquerdo em **Endpoint**.
- [x] **2.** Escolha a opção **HTTPS**.
- [x] **3.** No campo `Default Region`, cole o seu **Endpoint HTTPS da API** (Aquele coletado na Sessão 1).
- [x] **4.** No dropdown de certificado SSL, escolha a opção:
  - Se for Vercel/ngrok: *"My development endpoint is a sub-domain of a domain that has a wildcard certificate from a certificate authority"*.
- [x] **5.** Salve as configurações.

### Fase D: Account Linking (Opcional, porém Recomendado)
*(Se você quiser segurança e RLS)*
- [x] **1.** Vá em **Tools > Account Linking**.
- [x] **2.** Habilite o Account Linking.
- [x] **3.** Em *Grant type*, selecione *Auth Code Grant*.
- [x] **4.** Preencha os campos de URI, ID e Secret coletados na Sessão 1.
- [x] **5.** Salve as configurações.

### Fase E: Teste
- [x] **1.** Vá na aba **Test** e habilite o teste para "Development".
- [x] **2.** Digite "pedir ao gaga list para adicionar maçã na lista de mercado".
- [x] **3.** Confira o log no seu terminal local (ou Vercel) e veja se o JSON chegou.

### Fase F: Distribuição e Privacidade (Distribution > Privacy & Compliance)
*(Requisito para publicação e certificação na Amazon Alexa Skills Store)*
- [ ] **1.** Acesse a aba superior **Distribution** > **Privacy & Compliance**.
- [ ] **2.** No campo **Privacy Policy URL**, cole: `https://<seu-dominio>.com/privacy`.
- [ ] **3.** No campo **Terms of Use URL**, cole: `https://<seu-dominio>.com/terms`.
- [ ] **4.** Responda as perguntas regulatórias (ex: sem cobrança direta in-skill, não direcionado a menores de 13 anos, sem anúncios).
- [ ] **5.** Salve as configurações.

