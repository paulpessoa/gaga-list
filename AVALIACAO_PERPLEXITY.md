# LISTA PRONTA - TASK BACKLOG DE CORREÇÕES E MELHORIAS

## 🔴 TAREFAS CRÍTICAS (FAZER AGORA - Bloqueia produção)

### 1. LIMPAR DADOS DE TESTE

**Prioridade:** CRÍTICA
**Descrição:**

- Remover produto "CALDEIRA DE CALOR" do banco de dados (está em teste)
- Corrigir valores absurdos em Higiene:
  - Cotonete: "R$ 434342.54" → deveria ser valor realista (~R$ 5-10)
  - Coco: "R$ 18.00" → manter ou ajustar conforme necessidade
  - Chuchu: "R$ 123.00" → verificar preço realista
- Query: DELETE FROM products WHERE name = 'CALDEIRA DE CALOR'
- UPDATE items SET price = rrect_value> WHERE product_id IN (SELECT id FROM products WHERE status = 'test')
  **Impacto:** Alta - Evita confundimento de usuários reais

### 2. CORRIGIR TYPO NA PÁGINA DE AVISOS

**Prioridade:** CRÍTICA
**Descrição:**

- Localizar: /app/notifications
- Encontrar texto: "Clique para abrir a conversa ou fixeira"
- Corrigir para: "Clique para abrir a conversa ou fixá-la" (ou versão mais clara)
- Arquivo provável: components/NotificationsPage.tsx ou similar
  **Impacto:** Média - Melhora profissionalismo

---

## 🟠 TAREFAS ALTA PRIORIDADE (Próximas 2 semanas)

### 3. ADICIONAR INDICADOR VISUAL DE PÁGINA ATIVA NA BOTTOM BAR

**Prioridade:** ALTA
**Descrição:**

- Componente: BottomNavigation ou Navigation component
- Adicionar propriedade `active` ou `aria-current="page"` ao link ativo
- Implementar visual (underline, cor diferente, ou ícone filled)
- Atualmente: Todos links parecem iguais
- Esperado: Link ativo deve se destacar visualmente
  **Código Example:**

```tsx
// Em: components/BottomNav.tsx
<Link
  href="/app"
  aria-current={currentPath === "/app" ? "page" : undefined}
  className={currentPath === "/app" ? "active" : ""}
>
  <Icon />
  <Label>LISTAS</Label>
</Link>
```

**Impacto:** Alta - Melhora navegação e orientação

### 4. ADICIONAR TOOLTIPS/FEEDBACK PARA BOTÕES DISABLED

**Prioridade:** ALTA
**Descrição:**

- Localizar: /app (página inicial) - Botão "Criar Lista"
- Localizar: /app/recipes - Botões "GERAR SUGESTÕES", "CONSULTAR CHEF", "CRIAR RECEITA COM 0 ITENS"
- Adicionar hover tooltip explicando: "Preencha o campo acima para continuar"
- Implementar com: title attribute, Tooltip component, ou aria-description
  **Código Example:**

```tsx
<button
  disabled={!listName}
  title={!listName ? "Digite o nome da lista para continuar" : ""}
  aria-description={!listName ? "Campo obrigatório" : ""}
>
  Criar Lista
</button>
```

**Impacto:** Alta - Melhora UX e reduz frustração

### 5. MELHORAR CLAREZA DO SISTEMA DE GRÃOS MÁGICOS

**Prioridade:** ALTA
**Descrição:**

- Adicionar descrição/tooltip ao clique em "Meus Grãos Mágicos"
- Criar modal ou página explicando:
  - O que são Grãos Mágicos?
  - Quanto cada feature consome (VOZ = 1 grão, FOTO = 2 grãos, etc.)
  - Como ganhar mais grãos
- Localizar: /app/credits (já existe?)
- Adicionar: Seção de "Como usar Grãos?" na Central de Ajuda
  **Impacto:** Média - Melhora compreensão de features

### 6. ADICIONAR VALIDAÇÃO E FEEDBACK EM FORMULÁRIO DE NOVA LISTA

**Prioridade:** ALTA
**Descrição:**

- Modal: Nova Lista (ao clicar "Nova Lista" ou "+")
- Campo: "NOME DA LISTA"
- Adicionar:
  - Campo required com asterisco (\*)
  - Mensagem de erro ao tentar submeter vazio: "Campo obrigatório"
  - Enable/disable automático do botão baseado em preenchimento
  - Feedback visual (red border/icon) se vazio
    **Código Example:**

```tsx
const [listName, setListName] = useState('');

<input
  type="text"
  placeholder="Ex: Mercado da Semana..."
  value={listName}
  onChange={(e) => setListName(e.target.value)}
  required
  aria-required="true"
/>
<span className={!listName ? 'error' : 'hidden'}>
  Campo obrigatório
</span>
<button disabled={!listName}>Criar Lista</button>
```

**Impacto:** Alta - Evita erros de usuário

---

## 🟡 TAREFAS MÉDIA PRIORIDADE (Próximas 3-4 semanas)

### 7. UNIFICAR NAVEGAÇÃO (REMOVER REDUNDÂNCIA)

**Prioridade:** MÉDIA
**Descrição:**

- Problema: Links RECEITAS/PRODUTOS existem em 3 lugares:
  1. Header (ícones no topo direito)
  2. Botão "+" central bottom bar (não claro)
  3. Bottom bar (RECEITAS, LISTAS, etc.)
- Solução:
  - Manter apenas bottom bar como navegação principal
  - Remover ícones confusos do header
  - Manter ícones do header apenas para ações (não navegação)
- Impacto: Média - Simplifica navegação

### 8. REORGANIZAR PÁGINA DE RECEITAS (REDUZIR CONTEÚDO)

**Prioridade:** MÉDIA
**Descrição:**

- Página /app/recipes tem 4 seções grandes em 1 tela
- Solução A: Dividir em abas (SUGERIR, BUSCA, INVENTÁRIO, MEU LIVRO)
- Solução B: Criar sub-páginas
- Reduzir scroll necessário
- Melhorar loadtime
  **Impacto:** Média - Melhora UX em mobile

### 9. ADICIONAR FEEDBACK ANTES DE CONSUMIR GRÃOS

**Prioridade:** MÉDIA
**Descrição:**

- Ao clicar em "GERAR SUGESTÕES" (consome 1 grão)
- Ao clicar em "CONSULTAR CHEF" (consome 1 grão)
- Mostrar: Modal com "Isso consumirá 1 Grão. Continuar?" com [Cancelar] [Confirmar]
- Atualizar display de grãos após consumo
  **Impacto:** Média - Evita surpresas

### 10. MELHORAR PÁGINA VAZIA DE AVISOS

**Prioridade:** MÉDIA
**Descrição:**

- Localizar: /app/notifications
- Atual: Apenas "Tudo limpo por aqui"
- Melhorar:
  - Adicionar ícone maior e mais amigável
  - Texto mais amigável: "Nenhuma notificação no momento. Convide amigos para compartilhar listas!"
  - Botão de ação: "Convide um colaborador"
  - Explicar como funcionam notificações
    **Impacto:** Baixa-Média - Melhora UX

---

## 💡 TAREFAS DE LONGO PRAZO (Futuro)

### 11. ADICIONAR BUSCA/FILTRO GLOBAL

**Descrição:** Campo de busca na página inicial para filtrar listas por nome

### 12. ADICIONAR MENU DE CONTEXTO EM LISTAS

**Descrição:** Click direito em lista mostra: Duplicar, Compartilhar, Editar, Deletar, Arquivar

### 13. IMPLEMENTAR DARK/LIGHT MODE TOGGLE

**Descrição:** Opção em CONFIG para trocar entre dark/light mode (atualmente apenas auto)

### 14. ADICIONAR AVATAR EDITÁVEL DE PERFIL

**Descrição:** Permitir upload de foto de perfil na página CONFIG

### 15. MELHORAR PERMISSÕES DE CÂMERA

**Descrição:** Ao usar recurso FOTO, mostrar diálogo explicativo: "Lista Pronta precisa acessar a câmera para capturar sua lista"

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Tarefa 1: Limpar dados de teste
- [ ] Tarefa 2: Corrigir typo
- [ ] Tarefa 3: Indicador página ativa
- [ ] Tarefa 4: Tooltips para botões disabled
- [ ] Tarefa 5: Clareza Grãos Mágicos
- [ ] Tarefa 6: Validação nova lista
- [ ] Tarefa 7: Unificar navegação
- [ ] Tarefa 8: Reorganizar receitas
- [ ] Tarefa 9: Feedback grãos
- [ ] Tarefa 10: Melhorar avisos vazios

---

## 🧪 TESTE APÓS IMPLEMENTAÇÃO

1. Acessar /app → Verificar bottom bar com página ativa destacada
2. Tentar criar lista sem nome → Ver erro e botão desabilitado
3. Clicar em "Meus Grãos Mágicos" → Ver explicação clara
4. Acessar /app/notifications → Ver conteúdo melhorado
5. Verificar lista "Higiene" → Confirmar valores reais de produtos
6. Testar /app/recipes → Navegação menos confusa

---

## 🎯 RESULTADO ESPERADO

Após implementar as 6 tarefas críticas + 4 tarefas alta prioridade:

- ✅ Aplicativo pronto para produção (sem dados de teste)
- ✅ UX significativamente melhorada
- ✅ Usuários têm feedback claro de ações
- ✅ Navegação intuitiva e consistente
- ✅ Nota: De 7.4/10 para ~8.5/10

---
