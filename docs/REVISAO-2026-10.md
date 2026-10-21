# Revisão de layout, limpeza e admin — Out/2026

Resumo do que foi analisado, o que já virou PR e o que fica para depois.

## Status dos PRs
| PR | Branch | Conteúdo | Migration? | Status |
|---|---|---|---|---|
| #11 | `claude/desktop-layout` | App no desktop: SideNav, fim do DesktopBlocker | Não | ✅ Mergeado |
| #12 | `claude/admin-panel` | Painel `/admin` com layout próprio | Opcional (só índices) | Aguardando review |
| #13 | `claude/cleanup-docs` | Limpeza segura + esta documentação | Não | Aguardando review |

Ordem sugerida de merge: #13 e #12 são independentes (qualquer ordem).

## 1. Desktop (feito no #11)
- Antes: acima de 1024px a tela era bloqueada; entre 768–1024px **não havia navegação**.
- Agora: TabBar no celular, trilho de ícones no tablet, barra lateral completa no desktop.
- Próximos passos de UX desktop (não feitos):
  - [ ] Página da lista em 2 colunas no `xl` (itens à esquerda, chat/resumo à direita)
  - [ ] Atalhos de teclado: `N` nova lista/item, `/` buscar
  - [ ] Hover states nos cards de lista (hoje pensados só para toque)
  - [ ] `viewport` bloqueia zoom (`userScalable: false`, `maximumScale: 1`) → ruim para acessibilidade; avaliar liberar

## 2. Limpeza (feito no #13)
- Removido do git: `trash/`, `metadata.json` (sobra do AI Studio), `test-results/`, `supabase/.temp/`,
  e os arquivos gerados pelo next-pwa (`public/sw.js`, `workbox-*.js`, `worker-*.js`) → agora no `.gitignore`.
- Middleware não loga mais path/user id/cookies a cada request (ruído + dado pessoal no log).
- Microsoft Clarity só carrega com `NEXT_PUBLIC_CLARITY_ID` (antes carregava com `YOUR_CLARITY_ID`).

## 3. Limpeza que ficou para depois (precisa decisão ou teste)
| Item | Por que não foi feito agora |
|---|---|
| `package-lock.json` fora de sincronia com `package.json` (`npm ci` falha) | Regerar mexe em centenas de versões; rodar `npm install` localmente, testar e commitar sozinho |
| Dependências duplicadas: `framer-motion` + `motion`, `@google/generative-ai` + `@google/genai`, `node-fetch`, `dotenv` | Precisa trocar imports e testar IA |
| `next build` com lint falha (`react-hooks/set-state-in-effect`) em ~10 arquivos | Erros já existiam; corrigir arquivo a arquivo |
| `tsconfig` usa `baseUrl` (depreciado no TS 6) | Trocar por `paths` relativos |
| `components/navigation-wrapper.tsx`: `VisionScanner` nunca abre (TabBar ignora `onScanClick`) | Decidir: remover ou recolocar botão de scan |
| `lib/supabase/server.ts` tem anon key/URL hardcoded como fallback | Anon key é pública, mas deixar só env é mais limpo |
| `public/testes-com-ia/` (fixtures de teste servidas publicamente) | Ver se scripts usam; mover para `tests/fixtures` |
| `scripts/` com 15 scripts de teste manuais | Virar testes Playwright/Vitest ou apagar |
| Migration `20260319010500_disable_rls_for_testing.sql` no histórico | Já revertida pela seguinte; **não apagar** (histórico de migrations) |
| `.geminirc` aponta para `gemini-1.5-pro` | Atualizar para o modelo atual |
| `internacionalizar.md` na raiz | Mover para `docs/` ou BACKLOG |
| `ReactQueryDevtools` carregado em produção | Envolver em `process.env.NODE_ENV === "development"` |

## 4. Admin (PR #12)
Ver `docs/admin/README.md`. Decisão pendente: custos de IA via env (hoje) ou via banco com cache.

## 5. Melhorias sugeridas (backlog)
- **Observabilidade:** Sentry para erros; `profiles.last_seen_at` para DAU/MAU de verdade.
- **Funil no admin:** cadastro → 1ª lista → 1º item → convidou alguém → pagou.
- **Retenção por coorte** (semana de cadastro x semanas ativas).
- **Tema:** tokens em `globals.css` já existem, mas as páginas usam hex fixo (`#131313`, `#53E076`). Migrar para `bg-surface`, `text-brand-primary` facilita evolução.
