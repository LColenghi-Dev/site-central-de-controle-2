# Oceano Editorial — Design System v3
**Data:** 2026-06-25  
**Projeto:** Marazul — Central de Controle  
**Escopo:** Rebrand completo da interface, dual-theme (dark + light), arquitetura de tokens CSS

---

## Contexto

O projeto está 100% em modo escuro hardcoded. O `data-theme` já existe em Configurações mas não há tokens `[data-theme='light']` nem `[data-theme='dark']` no CSS — tudo corre em `:root` com valores void-black. O resultado é:

- `dash-card--light` injeta `#ffffff` fixo dentro do dark → mistura de temas
- Animações de fundo excessivas (aurora, smoke, bubbles) competem com o conteúdo
- Paleta base muito escura (`#030711`) sem profundidade oceânica real
- Nenhum modo claro funcional apesar do seletor em Configurações

---

## Direção Visual

**Oceano Editorial** — tecnologia, profundidade e exclusividade inspiradas no mar.  
Aparência corporativa sofisticada. Espaçamento generoso. Tipografia refinada.  
Cores aplicadas com intenção semântica. Microinterações discretas.

---

## Decisões Aprovadas

### 1. Arquitetura de Tokens

```css
[data-theme='dark']  { /* dark values */ }
[data-theme='light'] { /* light values */ }
```

- `<html>` recebe `data-theme='dark'` por padrão ao montar
- Configurações.jsx já aplica `data-theme` via `setAttribute` — sem mudança no JSX
- Nenhum anti-FOUC script em `index.html` (escuro é o default)

### 2. Tokens Semânticos

| Token | Dark | Light |
|-------|------|-------|
| `--color-bg` | `#071322` | `#edf1f7` |
| `--color-surface` | `#0d1f38` | `#f4f7fb` |
| `--color-surface-raised` | `#122844` | `#ffffff` |
| `--color-surface-muted` | `#09182e` | `#e4ecf5` |
| `--color-text` | `#dde8f5` | `#0d2b4b` |
| `--color-text-secondary` | `#7da8cc` | `#2c567a` |
| `--color-text-muted` | `#4e7899` | `#5a7d9e` |
| `--color-border` | `rgba(94,160,220,.10)` | `rgba(13,43,75,.10)` |
| `--color-border-strong` | `rgba(94,160,220,.22)` | `rgba(13,43,75,.22)` |
| `--color-primary` | `#0ea5e9` | `#0891b2` |
| `--color-primary-hover` | `#38bdf8` | `#0e7490` |
| `--color-success` | `#10b981` | `#059669` |
| `--color-warning` | `#f59e0b` | `#d97706` |
| `--color-danger` | `#ef4444` | `#dc2626` |

Tokens de sombra:
- `--shadow-sm`: elevação leve (cards)
- `--shadow-md`: elevação média (modais)
- `--shadow-lg`: elevação alta (drawers)

### 3. Animações

**Mantidas mas sutis (~40% opacidade atual):**
- `auroraA` / `auroraB` no `body::before/after`
- `sea-glow-pulse` / `ray-sway` no `dash::before/after`
- `dash-smoke` no `dash__main::before`
- `dash-bubbles` no `dash__main::after`

**No modo claro:** todas desativadas via `animation: none` dentro de `[data-theme='light']`

**Sempre mantidas (semânticas):**
- `statusPulse` — dots de conexão
- `barGrow` — gráficos de barras
- `fadeSlideUp` — transições de aba
- `ctaShimmer` — botão CTA primário
- `lvCardFloat` — métricas animadas no login

### 4. Estrutura Visual

- **`dash-card--light` removido** → substituído por `--color-surface-raised`
- **glassmorphism apenas em modais e drawers** — cards usam `background: var(--color-surface)` + borda semântica
- **`line-height`** do body: `1` → `1.6`
- **Scrollbar** com tokens de cor adaptados por tema
- **Workspace hero ClickUp** usa `--color-surface-raised` (não `#ffffff` fixo)

---

## Fluxo de Implementação

1. Reescrever os tokens no topo de `src/index.css` (dual-theme)
2. Aplicar tema default em `src/main.jsx` ou `src/App.jsx`
3. Substituir valores hardcoded pelos tokens ao longo do CSS
4. Adicionar bloco `[data-theme='light']` com ajustes específicos por componente
5. Ajustar animações de fundo com opacidade reduzida + `animation: none` no light
6. Remover `dash-card--light`
7. Refinar glassmorphism (somente modais/drawers)
8. Melhorar tipografia global
9. `npm run build` para verificar

---

## Arquivos Afetados

- `src/index.css` — arquivo principal (único CSS)
- `src/App.jsx` — adicionar `data-theme='dark'` default no `<html>`
- Nenhum arquivo JSX de funcionalidade é alterado
