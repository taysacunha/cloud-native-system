

## Correção: Form não reseta ao abrir novo cadastro

### Problema

O `useEffect` de reset (linha 378-461) tem dependência `[ferias]`. Quando você cadastra Iasmin (ferias=null → salva → fecha) e abre outro cadastro (ferias=null novamente), o React não re-executa o effect porque `null === null` — a dependência não mudou. O formulário mantém os dados de Iasmin.

### Solução

Adicionar `open` como dependência do useEffect de reset, e condicionar o reset para quando `open` muda para `true`:

```typescript
useEffect(() => {
  if (!open) return; // só reseta ao abrir
  
  if (ferias) {
    // ... código existente de preenchimento para edição
  } else {
    form.reset({ /* valores vazios */ });
  }
  // ... reset dos estados excecao
}, [ferias, open]);
```

### Arquivo impactado

| Arquivo | Mudança |
|---------|---------|
| `FeriasDialog.tsx` | Adicionar `open` na dependência do useEffect de reset (linha 461) e guard `if (!open) return;` no início |

Mudança de 2 linhas. Sem impacto em outros componentes.

