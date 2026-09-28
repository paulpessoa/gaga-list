# Documentação da Skill Alexa: Gaga List

Esta documentação serve como o guia oficial de todas as configurações feitas no **Alexa Developer Console** para o projeto Gaga List. Guarde este documento para referência futura, caso precise recriar a skill ou debugar a infraestrutura.

---

## 1. Invocation Name (Nome de Invocação)
**Skill Invocation Name:** `gaga list`
É assim que o usuário acorda a skill.
Exemplo: *"Alexa, abrir gaga list"* ou *"Alexa, peça pro gaga list anotar leite"*.

---

## 2. Interaction Model (Intents & Slots)

Para garantir que a skill seja 100% conversacional e guiada por IA, nós **apagamos todas as Intents nativas antigas** (como `AddItemIntent`, `HelloWorldIntent`) e centralizamos tudo em um único ponto de entrada para o nosso Agente (LLM).

### Intent Principal: `AgentIntent`
Esta Intent captura toda e qualquer frase do usuário.
- **Nome da Intent:** `AgentIntent`
- **Slots:** 
  - Nome: `Query`
  - Slot Type: `CATCH_ALL_TYPE` (Um Custom Slot Type que criamos)

### Sample Utterances (Frases de Exemplo) da `AgentIntent`
As utterances foram configuradas para engolir qualquer frase que o usuário diga:
- `{Query}`
- `anotar {Query}`
- `quero {Query}`
- `comprei {Query}`
- `adicione {Query}`
- `marque {Query}`
- `exclua {Query}`
- `pesquisar {Query}`
- `qual o total da {Query}`

### Custom Slot Type: `CATCH_ALL_TYPE`
A Alexa não tem um tipo de slot nativo perfeito para frases 100% livres e complexas. O `AMAZON.SearchQuery` falha muito se não tiver palavras de apoio (carrier phrases).
Por isso, criamos o **`CATCH_ALL_TYPE`** e preenchemos seus valores com dezenas de frases gigantes e aleatórias (o algoritmo da Amazon usa esses valores para treinar o peso da captura).
*Exemplos de valores adicionados ao tipo `CATCH_ALL_TYPE`:*
- "anotar vinte litros de leite de soja da marca x"
- "riscar o pão de queijo da lista de festa"
- "mudar a quantidade de carvão para cinco sacos"
- "já comprei a picanha"
- "o que tem na minha lista de churrasco"

---

## 3. Endpoint (Webhook)
A Alexa precisa saber para qual servidor enviar os áudios convertidos em texto.
- **Service Endpoint Type:** `HTTPS`
- **Default Region URL:** `https://seusite.com/api/alexa` (Nossa rota serverless na Vercel).
- **SSL Certificate Type:** `My development endpoint is a sub-domain of a domain that has a wildcard certificate from a certificate authority` (Padrão para Vercel).

---

## 4. Account Linking (Vínculo de Contas)
Como o Gaga List é um aplicativo privado e requer banco de dados, configuramos o **Account Linking** para que a Alexa receba um `accessToken` do Supabase e saiba quem está falando.

- **Authorization URI:** `https://qcejgeazpduqpnsakqvn.supabase.co/auth/v1/authorize`
- **Access Token URI:** `https://qcejgeazpduqpnsakqvn.supabase.co/auth/v1/token`
- **Client ID:** (Chave invisível fornecida no painel)
- **Client Secret:** (Gerada ou extraída)
- **Client Authentication Scheme:** `HTTP Basic (Recommended)`
- **Scopes:** `profile`, `email`
- **Domain List:** Adicionamos o domínio do Supabase (`qcejgeazpduqpnsakqvn.supabase.co`)

> **Importante:** Sem o Account Linking ativo e configurado corretamente no aplicativo Alexa do celular do usuário, a nossa rota de API recusa as interações pedindo para o usuário vincular a conta primeiro.

---

## 5. Falhas Tratadas Pela Nossa Infraestrutura
Como documentado no desenvolvimento, a configuração acima transfere a inteligência de processamento da Amazon para a Vercel (onde roda o GPT-4o-mini).

**O que resolvemos no código (`route.ts`) em resposta a esse modelo:**
1. **Desambiguação Stateless:** Como a Alexa perde a memória a cada turno, usamos o `sessionAttributes` da Amazon na resposta para forçar a Alexa a nos devolver o estado (ex: "estávamos apagando o carvão") no próximo turno de fala.
2. **Latência de 8 Segundos:** A Amazon desliga a Skill automaticamente se a Vercel demorar mais de 8 segundos. Por isso o uso rigoroso do modelo `gpt-4o-mini`, que retorna a intenção JSON em menos de 1 segundo.
3. **Erros de Session Ended:** Tratamos o `SessionEndedRequest` nativo da Amazon, evitando que a Skill gerasse logs de erro ao ser fechada abruptamente.

---
**Status Atual da Skill:** Pronta para Produção / Teste Beta.
