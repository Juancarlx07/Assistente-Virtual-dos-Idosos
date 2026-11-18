# Modelo de negócio — opções a testar (sem implementar ainda)

Três formas de receita a avaliar. Nenhuma está implementada no código; este
documento existe para orientar os testes de validação (ver `validacao.md`).
O produto precisa cobrar de um jeito que **não** entre em conflito com os
princípios — em especial, o valor percebido deve estar na **curadoria e no
lembrete**, não em transformar carinho em transação.

Premissa central a validar: **as pessoas pagam pela curadoria e pelo lembrete,
não só pelo presente** (hipótese 2 da validação).

---

## 1. Assinatura de lembretes e curadoria

Mensalidade por manter os lembretes semanais e a curadoria com toque humano.

**Prós**
- Receita recorrente e previsível; bom para planejar.
- Alinha o preço ao valor real (curadoria/lembrete), não ao presente.
- Incentiva o produto a gerar valor contínuo, não só vender.
- Independe de ter parceiros logísticos — dá para começar sem entrega.

**Contras**
- Barreira de entrada: pagar antes de perceber o valor.
- Risco de churn quando "a vida fica corrida" ou a relação muda.
- Pressão para justificar a mensalidade toda semana.

**Quando faz sentido:** se as entrevistas mostram que a **carga mental** é a dor
principal (e não o presente em si).

**Como testar:** no protótipo manual, após ~2 semanas, oferecer um valor mensal
simbólico (ex.: R$ 9–19) e medir quantos aceitam com cobrança real.

---

## 2. Comissão sobre entregas com parceiros locais

Grátis (ou barato) para lembrar/sugerir; receita vem de comissão quando o gesto
é comprado via floricultura/papelaria parceira.

**Prós**
- Sem barreira de entrada; cresce o topo do funil.
- Receita atrelada a gesto concretizado (valor entregue).
- Apoia comércio local — bom para narrativa e parcerias.

**Contras**
- Depende de **operação logística e parceiros** desde cedo — caro e lento.
- Incentivo perverso: empurrar compras pode ferir a autenticidade e a confiança.
- Margem fina; sensível a disponibilidade e qualidade do parceiro.
- Muitos gestos bons (carta, uma frase) **não geram** comissão.

**Quando faz sentido:** mais tarde, como receita **complementar**, depois que a
curadoria já provou valor — nunca como único motor no início.

**Como testar:** só depois das hipóteses 1 e 3 confirmadas. Começar com 1–2
parceiros em uma cidade, medir taxa de conversão sugestão → compra sem empurrar.

---

## 3. Cobrança por gesto avulso (pay-per-use)

Sem assinatura: a pessoa paga uma pequena taxa por gesto que quiser preparar/
organizar pela plataforma.

**Prós**
- Menor compromisso; bom para quem rejeita assinatura.
- Fácil de entender; paga quem usa.
- Boa porta de entrada que pode converter em assinatura depois.

**Contras**
- Receita imprevisível e provavelmente baixa por usuário.
- Micro-cobranças podem fazer o carinho parecer transacional (risco ao princípio).
- Pouco incentivo à constância — que é justamente a proposta de valor.

**Quando faz sentido:** como **opção de entrada** ao lado da assinatura, para
não perder quem não quer se comprometer.

**Como testar:** oferecer no protótipo como alternativa à assinatura e comparar
qual as pessoas escolhem e quanto efetivamente pagam.

---

## Recomendação de sequência de testes

1. **Começar pela assinatura (opção 1)** — é a que melhor alinha preço e valor
   e a que mais depende da hipótese central. Se ninguém paga pela curadoria, o
   negócio não se sustenta de qualquer forma.
2. **Oferecer o avulso (opção 3)** como porta de entrada em paralelo, para medir
   a elasticidade de compromisso.
3. **Deixar a comissão (opção 2) para depois**, como receita complementar, só
   quando a autenticidade estiver comprovada e houver demanda por entrega.

> Atenção ao conflito de incentivos: qualquer modelo que ganhe mais quando a
> pessoa **compra mais** precisa de salvaguardas para não empurrar consumo e
> ferir a confiança. A assinatura é a que menos sofre desse problema.
