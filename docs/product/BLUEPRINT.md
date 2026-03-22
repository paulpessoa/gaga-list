# Fluxograma de Navegação: Lista Pronta 🗺️

Este diagrama representa a arquitetura de informação e os fluxos de navegação propostos para o aplicativo, seguindo as diretrizes de "Native Feeling" e a organização solicitada.

```mermaid
graph TD
    %% TabBar Principais
    Root[Landing Page / Login] --> AppRoot((/app))

    subgraph TabBar [Menu Inferior]
        Lists[Listas - Destaque]
        Recipes[Receitas]
        People[Pessoas / Colaboradores]
        Profile[Perfil]
    end

    AppRoot --> Lists

    %% Fluxo de Listas
    Lists --> NewList[Nova Lista Bottom Sheet]
    NewList --> AudioFlow[Captura de Áudio]
    NewList --> PhotoFlow[Captura de Foto OCR]
    NewList --> ManualFlow[Input Manual]

    Lists --> ListDetails[Detalhes da Lista]
    ListDetails --> Chat[Chat da Lista]
    ListDetails --> Map[Mapa/Radar]
    ListDetails --> EditList[Editar Título/Config]
    ListDetails --> AddItemIA[Adicionar via Voz/Foto]

    %% Fluxo de Receitas
    Recipes --> CreativeSearch[Busca Criativa / Chef IA]
    Recipes --> SavedRecipes[Meu Livro de Receitas]
    SavedRecipes --> RecipeDetails[Detalhes da Receita Drawer]
    RecipeDetails --> ConvertToList[Transformar em Lista]

    %% Fluxo de Perfil
    Profile --> Settings[Configurações do App]
    Profile --> Credits[Energia IA / Grãos]
    Credits --> Stripe[Checkout Stripe]

    %% Notificações (Transversal)
    Avisos[Avisos / Notificações] -.-> Lists
    Avisos -.-> Items
    Avisos -.-> Recipes
    Avisos -.-> Profile
```

## Próximos Passos de Revisão:

1.  **[ ] Tela de Listas:** Organização do Box, Cards e Drawer de Nova Lista.
2.  **[ ] Tela de Pessoas:** Gerenciamento de convites e amigos.
3.  **[ ] Tela de Perfil & Configurações:** Separação das áreas.
