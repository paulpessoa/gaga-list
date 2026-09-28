# Skill Alexa do Gaga List

Guia de referência da skill: como funciona, o que configurar (Vercel + Alexa Developer Console) e como testar.
Siga as seções na ordem para recriar a skill do zero.

---

## 1. Visão geral

```
Usuário ──fala──▶ Alexa ──AgentIntent {Query}──▶ POST /api/alexa (Vercel)
                                                   │ 1. verifica assinatura + skill ID
                                                   │ 2. valida token (Supabase) e carrega as listas
                                                   │ 3. gpt-4o-mini interpreta a frase (JSON)
                                                   │ 4. executa no Supabase (RLS)
Usuário ◀──fala── Alexa ◀──resposta do resultado real──┘
```

- **Uma intent só (`AgentIntent`)** recebe a frase inteira. Quem entende o pedido é o LLM, não o modelo da Amazon.
- **O LLM só interpreta.** O que a Alexa fala vem do resultado real no banco, então ela nunca confirma algo que não aconteceu.
- **As listas compartilhadas funcionam**, porque a busca usa o RLS do Supabase com o token do usuário.

### Arquivos

| Arquivo | Papel |
|---|---|
| `app/api/alexa/route.ts` | Endpoint da skill (todas as falas passam aqui) |
| `app/api/alexa/authorize/route.ts` | Valida `client_id`/`redirect_uri` e gera o código do vínculo |
| `app/api/alexa/token/route.ts` | Access Token URI do OAuth (troca código por tokens e renova) |
| `app/alexa/link/page.tsx` | Tela de login que o app da Alexa abre no vínculo |
| `lib/alexa/verify-request.ts` | Verificação de assinatura da Amazon |
| `lib/alexa/oauth.ts` | Helpers do vínculo (código cifrado, client auth, allowlist) |
| `lib/alexa/speech.ts` | Busca de lista por nome, "12 reais e 50 centavos", "a, b e c" |
| `alexa/interactionModel.pt-BR.json` | Modelo de interação (colar no JSON Editor do console) |

---

## 2. Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Variável | Valor | De onde vem |
|---|---|---|
| `ALEXA_SKILL_ID` | `amzn1.ask.skill.0ac2316e-2310-4484-b69b-cc0cdd52f520` | Console → lista de skills → "Copy Skill ID" |
| `ALEXA_CLIENT_ID` | ex.: `gaga-list-alexa` | **Você inventa.** O mesmo valor vai no console (seção 3.4) |
| `ALEXA_CLIENT_SECRET` | string aleatória longa | **Você gera:** `openssl rand -hex 32`. O mesmo valor vai no console |
| `ALEXA_REDIRECT_URIS` | as 3 URLs separadas por vírgula | Console → Account Linking → "Alexa Redirect URLs" |
| `OPENAI_API_KEY` | chave da OpenAI | já existente |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | já existentes |

> Sem `ALEXA_CLIENT_ID`, `ALEXA_CLIENT_SECRET` e `ALEXA_REDIRECT_URIS`, o vínculo e a renovação de token **falham de propósito**, porque o fluxo não roda sem proteção. Configure as variáveis **antes** do deploy.

`ALEXA_SKIP_VERIFICATION=true` desliga a verificação de assinatura **somente fora de produção** (útil para testar com `curl`). Nunca use na Vercel.

---

## 3. Alexa Developer Console

Em [developer.amazon.com/alexa/console/ask](https://developer.amazon.com/alexa/console/ask) → skill **Gaga List** (Custom, pt-BR, hospedagem "Provision your own").

### 3.1 Modelo de interação

1. **Build → Interaction Model → JSON Editor**.
2. Cole o conteúdo de `alexa/interactionModel.pt-BR.json`.
3. **Save** e depois **Build Model**.

O que o modelo contém:

- **Invocation name:** `gaga list`.
- **`AgentIntent`**, com o slot `Query` do tipo `CATCH_ALL_TYPE`.
- **Intents nativas:** Help, Stop, Cancel, NavigateHome, Fallback, Yes e No.
- **Sensibilidade do Fallback:** `LOW`, para ele não "roubar" frases da `AgentIntent`.

**Regras para mexer no modelo:**

- **Frases de exemplo só com palavras neutras** (`quero {Query}`, `por favor {Query}`). O texto fora do `{Query}` **não chega na API**: com `comprei {Query}`, a frase "comprei o leite" chegaria como "o leite" e o LLM entenderia "adicionar".
- **`CATCH_ALL_TYPE` com frases variadas, de 1 a 12 palavras.** A Alexa usa esses exemplos para saber quanto texto capturar; com poucos exemplos curtos, ela corta frases longas.
- Não use `AMAZON.SearchQuery`, porque ele não aceita a frase de exemplo `{Query}` sozinha.
- Depois de editar no console, exporte o JSON de volta para o repositório.

### 3.2 Endpoint

- **Build → Endpoint → HTTPS**
- Default Region: `https://gaga-list.vercel.app/api/alexa`
- Certificado: *"My development endpoint is a sub-domain of a domain that has a wildcard certificate from a certificate authority"* (para `*.vercel.app`). Com um domínio próprio, use *"trusted certificate authority"*.

### 3.3 Permissões

Nenhuma. A skill não usa as listas nativas da Alexa.

### 3.4 Account Linking (Build → Tools → Account Linking)

| Campo | Valor |
|---|---|
| Do you allow users to create an account or link…? | **Ligado** |
| Allow users to enable skill without account linking | **Desligado** |
| Authorization Grant Type | **Auth Code Grant** |
| Your Web Authorization URI | `https://gaga-list.vercel.app/alexa/link` |
| Access Token URI | `https://gaga-list.vercel.app/api/alexa/token` |
| Your Client ID | mesmo valor de `ALEXA_CLIENT_ID` |
| Your Secret | mesmo valor de `ALEXA_CLIENT_SECRET` |
| Your Authentication Scheme | **HTTP Basic (Recommended)** |
| Scope | `lists` |
| Domain List | `gaga-list.vercel.app` |
| Default Access Token Expiration Time | vazio (usa o `expires_in` do Supabase) |

Na mesma página, copie as **Alexa Redirect URLs** (`pitangui.amazon.com`, `layla.amazon.com` e `alexa.amazon.co.jp`) para `ALEXA_REDIRECT_URIS`.

### 3.5 Distribution (necessário para publicar)

- **Skill Preview:**
  - nome, descrição curta e descrição completa
  - ícones de 108×108 e 512×512 px
  - categoria **Shopping**
  - frases de exemplo, sempre com o invocation name e só com comandos que a skill suporta:
    - "Alexa, abrir gaga list"
    - "Alexa, pede pro gaga list anotar leite"
    - "Alexa, pergunta pro gaga list o que falta no mercado"
- **Privacy & Compliance:**
  - Privacy Policy: `https://gaga-list.vercel.app/privacy`
  - Terms: `https://gaga-list.vercel.app/terms`
  - Nas perguntas: sem compras dentro da skill, sem publicidade, não direcionada a menores de 13 anos, não coleta informações pessoais pela voz.
- **Availability:** Beta test com 2 ou 3 e-mails antes de submeter para certificação.

---

## 4. Como funciona o vínculo de conta

```
App Alexa ─▶ /alexa/link?client_id&redirect_uri&state
               │ GET /api/alexa/authorize  → recusa client_id ou redirect_uri fora da allowlist
               │ login e-mail/senha → cria uma sessão NOVA, só da Alexa (não persiste no navegador)
               │ POST /api/alexa/authorize → code = refresh token cifrado (AES-256-GCM, expira em 5 min)
               ▼
           redirect_uri da Amazon ?code&state
               ▼
Amazon ─▶ POST /api/alexa/token (HTTP Basic client_id:secret)
               │ authorization_code → decifra o code → Supabase refreshSession → tokens
               │ refresh_token      → Supabase refreshSession (a Alexa renova sozinha a cada ~1h)
```

**Por que uma sessão dedicada?** O Supabase troca o refresh token a cada renovação. Se a Alexa usasse o mesmo token do navegador, quem renovasse primeiro invalidaria o outro: a Alexa "desvincularia sozinha" ou o app web deslogaria.

**Para desvincular:** app da Alexa → Skills → Gaga List → Desativar. Para revogar pelo lado do Gaga List, basta trocar a senha, que encerra todas as sessões.

---

## 5. Comportamento da skill

| O usuário diz | O que acontece |
|---|---|
| "Alexa, abrir gaga list" | Abre a conversa ("O que você precisa anotar?") |
| "Alexa, pede pro gaga list anotar leite" | Executa e **encerra** (one-shot) |
| Dentro da conversa | Executa e pergunta "Algo mais?". "não", "só isso" ou "tchau" encerram |
| "anotar leite" (sem lista) | Usa a última lista da conversa ou, se não houver, a lista editada mais recentemente |
| "anotar leite na lista de festa" (não existe) | Cria a lista "festa" |
| "mercado" | Encontra "Mercado do Mês" (ignora acento, maiúsculas e "lista de") |
| Item em 2 listas diferentes | Pergunta de qual lista. A resposta ("a de mercado") segue pelo `sessionAttributes` |
| "o que falta comprar" | Lê os pendentes da lista padrão (no máximo 10 itens, depois "e mais N") |
| "quanto deu a lista" | "O total da lista Mercado é 52 reais e 30 centavos" |
| "ajuda" | Exemplos de comandos |
| Sem conta vinculada | Fala e manda o card **LinkAccount** para o app da Alexa |

Ações que o LLM reconhece: `ADD_ITEM`, `CHECK_ITEM`, `UNCHECK_ITEM`, `REMOVE_ITEM`, `UPDATE_ITEM` (preço, quantidade, unidade, categoria, renomear, mover), `LIST_ITEMS`, `CALCULATE_TOTAL`, `SEARCH_ITEM`, `UNDO_ACTION` (por enquanto só explica), `END_SESSION` e `UNKNOWN`.

---

## 6. Segurança (requisitos da certificação)

Toda requisição em `/api/alexa` passa por `verifyAlexaRequest` e recebe **HTTP 400** se falhar qualquer uma destas checagens:

1. `applicationId` igual a `ALEXA_SKILL_ID`
2. `timestamp` com no máximo 150 s de diferença
3. `SignatureCertChainUrl` com https, host `s3.amazonaws.com`, caminho `/echo.api/` e porta 443
4. Certificado dentro da validade, com SAN `echo-api.amazon.com`, encadeado até uma CA raiz confiável (fica em cache)
5. `Signature-256` confere com o corpo bruto (RSA-SHA256)

Os logs registram só o tipo da requisição, a intent e o `requestId`, nunca o body, que contém o `accessToken`.

---

## 7. Testes

**No console (aba Test → Development):**

1. "abrir gaga list" e depois "ajuda"
2. "anotar leite" (sem lista), depois "anotar pão na lista de mercado"
3. "já comprei o leite", "o que falta no mercado", "quanto deu a lista de mercado"
4. "pede pro gaga list anotar café" (one-shot, deve encerrar)

O simulador usa a conta vinculada no app da Alexa do mesmo login da Amazon. Depois de mudar o fluxo de vínculo, **desative e reative a skill** para vincular de novo.

**Local, com curl (sem assinatura):**

```bash
ALEXA_SKIP_VERIFICATION=true npm run dev
curl -s -X POST localhost:3000/api/alexa \
  -d '{"session":{"new":true,"user":{}},"request":{"type":"IntentRequest","intent":{"name":"AMAZON.HelpIntent"}}}'
```

Para testar com o token de um usuário, coloque `"accessToken":"<jwt do supabase>"` em `session.user`.

---

## 8. Problemas comuns

| Sintoma | Causa provável |
|---|---|
| "Houve um problema com a resposta da skill" | O endpoint devolveu 400/500: veja os logs da Vercel (`Alexa: requisição rejeitada: …`) |
| `applicationId inválido` nos logs | `ALEXA_SKILL_ID` ausente ou diferente na Vercel |
| Vínculo falha logo após o login | `ALEXA_REDIRECT_URIS` não tem a URL exata da Amazon, ou o `ALEXA_CLIENT_ID` não bate |
| Vínculo falha depois do redirect | Client ID/Secret do console diferente das variáveis, ou esquema diferente de HTTP Basic |
| A Alexa corta frases longas | Faltam exemplos longos no `CATCH_ALL_TYPE` |
| A Alexa demora e desiste (limite de 8 s) | Lentidão da OpenAI ou do Supabase: veja a duração da função na Vercel |

---

## 9. Próximos passos

- Vários itens por frase ("leite, pão e ovos")
- Desfazer de verdade (guardar a última operação em `sessionAttributes`)
- Confirmar antes de criar uma lista nova
- Beta test e submissão para certificação

Plano completo e diagramas: `docs/alexa-plano-melhorias.html`.
