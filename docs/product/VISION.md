# Documentação Estratégica: Lista Pronta 🚀
*Versão 1.0 - Visão Multidisciplinar (Staff & Founder Insight)*

## 0. A Alma do Projeto (The Why)
O **Lista Pronta** nasceu da frustração real de casais e famílias que tentam usar o WhatsApp para compras. O herói é o **Usuário Sincronizado**: aquele que limpa a lista sem ruído, sem "overbooking" de itens e sem perder o foco em chats infinitos. 

**Missão:** Transformar a corveia de fazer compras em uma tarefa de alta eficiência e harmonia familiar.

---

## 1. Mapa de Rotas e Fluxos (PM/PO)

O app está organizado sob o prefixo `/app`. Abaixo, a estrutura refinada:

### 👤 Área do Usuário (Mobile-First)
- `/app` (Home): Hub de ações rápidas (Voz, Foto, Atalhos).
- `/app/lists` (Listas): Gestão de listas de compras (CRUD, Colaboração, Chat).
- `/app/recipes` (Receitas): Geração de receitas via IA, histórico e favoritos.
- `/app/products` (Meu Catálogo): Biblioteca de itens escaneados e frequentes.
- `/app/credits` (Energia IA): Gestão de Grãos, histórico de consumo e recarga.
- `/app/plans` (Planos): Checkout Stripe.
- `/app/notifications` (Avisos): Alertas de sistema e interações de amigos.
- `/app/profile` (Perfil & Ajustes): Dados pessoais, segurança e preferências.

### 🛡️ Área Administrativa (Desktop-First)
- `/admin` (Financeiro): Dashboards de receita, custo de APIs e gestão de usuários.
- `/admin/support`: Interface para o bot de suporte (abertura de tickets).

---

## 2. Experiência do Usuário & Interface (Staff Designer)

### 🍎 O "Apple Standard" (Native Feeling)
Para atingir o nível de refinamento da Apple, estamos implementando:
1. **Motion (Framer Motion):** Transições suaves entre páginas e estados.
2. **Bottom Sheets (Vaul):** Substituição de modais centralizados por gavetas que deslizam de baixo para cima.
3. **Skeletons App-Wide:** Carregamento progressivo em todos os componentes.
4. **Haptic Feedback:** Vibrações sutis para confirmação de ações.
5. **Glassmorphism:** Uso de `backdrop-blur` e bordas finas para profundidade.

### 🎨 Refatoração Crítica
- **Receitas:** Substituição do layout amador por cards premium e grid moderno.
- **Meus Produtos:** Novo fluxo de "Inventário", mais visual e intuitivo.
- **Configurações:** Divisão clara entre Perfil (quem sou) e App (como o app se comporta).

---

## 3. Inovação: O "GagaBot" (CTO/Innovation)

Um assistente de IA integrado:
- **Suporte Inteligente:** Tira dúvidas sobre o app e regras de grãos.
- **Ticket System:** Transição fluida de bot para suporte humano quando necessário.

---

## 4. Visão de Negócio (Angel/CFO/CEO)

- **Sustentabilidade:** Foco em margem bruta por grão.
- **Retenção:** Gamificação via Daily Check-in e recompensas por atividade.
- **Escalabilidade:** Arquitetura pronta para conversão em App Nativo Real.

---

## 5. Feedback Loop (Founder)

Para dar a "alma" correta ao produto, preciso saber:
1. **Dor Original:** O que te motivou a criar o app?
2. **Persona:** Quem é o usuário "Power User"?
3. **Budget de API:** Qual o teto de gastos aceitável nesta fase?
4. **Landing Page:** Futuro como blog/hub ou apenas cartão de visitas?
