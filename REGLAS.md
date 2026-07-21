# Desgramatizador — Reglas de análisis
> Documentación de todas las reglas implementadas durante el desarrollo de la app.

---

## Stack técnico

| Componente | Tecnología |
|---|---|
| Framework | React 18 + Vite 7 |
| Estilos | Tailwind CSS v4 |
| NLP | compromise.js v14 |
| Deploy | GitHub Pages + GitHub Actions |
| PWA | vite-plugin-pwa + Workbox |

---

## Categorías POS (Partes de la Oración)

La app usa **12 categorías** con colores del esquema Okabe-Ito (accesible para daltonismo):

> Los **colores de texto** se oscurecieron (jul 2026) para cumplir WCAG AA (≥4.5:1)
> sobre su fondo; los fondos NO cambiaron. Ver sección I5 al final. Si se alinea
> con Grammar HUB, usar estos valores nuevos.

| Clave | Label | Color texto | Color fondo | Descripción |
|---|---|---|---|---|
| `noun` | N | `#B45309` | `#FEF3C7` | Sustantivo |
| `verb` | V | `#BE123C` | `#FFE4E6` | Verbo |
| `adjective` | ADJ | `#0E7490` | `#CFFAFE` | Adjetivo |
| `adverb` | ADV | `#A16207` | `#FEFCE8` | Adverbio |
| `pronoun` | PRO | `#A21CAF` | `#FAE8FF` | Pronombre |
| `wh` | WH | `#0F766E` | `#F0FDFA` | Palabra interrogativa (wh-word) |
| `preposition` | PREP | `#047857` | `#ECFDF5` | Preposición |
| `conjunction` | CONJ | `#1D4ED8` | `#DBEAFE` | Conjunción |
| `determiner` | DET | `#475569` | `#F1F5F9` | Determinante |
| `number` | NUM | `#4B5563` | `#F3F4F6` | Numeral *(Regla 17)* |
| `modal` | MOD | `#4338CA` | `#E0E7FF` | Modal |
| `auxiliary` | AUX | `#B91C1C` | `#FEE2E2` | Auxiliar |

### Niveles CEFR — categorías desbloqueadas

| Nivel | Categorías visibles |
|---|---|
| Básico (A1) | N, V, ADJ, DET, PRO, WH, PREP, ADV, MOD, AUX |
| Elemental (A2) | N, V, ADJ, DET, PRO, WH, PREP, ADV, MOD, AUX |
| Intermedio (B1) | todo lo anterior + CONJ + **NUM** |
| Intermedio Alto (B2) | todo lo anterior + CONJ + **NUM** |

> En Básico/Elemental los números cardinales se absorben como `DET` y NUM aparece 🔒 en la leyenda.

---

## Bloques de estructura (S/V/O/A/C)

| Bloque | Color | Descripción |
|---|---|---|
| WH | `#0F766E` / `#F0FDFA` | Palabra interrogativa (preguntas) |
| S | `#4F46E5` / `#EEF2FF` | Sujeto |
| V | `#BE123C` / `#FFF1F2` | Verbo |
| C | `#047857` / `#ECFDF5` | Complemento (nivel básico) |
| O | `#047857` / `#ECFDF5` | Objeto directo (nivel intermedio) |
| A | `#B45309` / `#FFFBEB` | Adverbial (cuándo / dónde / cómo) |

---

## Reglas de análisis estructural

### REGLA 1 — Orden básico S / V / C
El análisis detecta sujeto, verbo y complemento en ese orden.
En niveles **Básico/Elemental** todo lo que sigue al verbo va en `[C]`.
En niveles **Intermedio/Intermedio Alto** se separa `[O]` y `[A]`.

---

### REGLA 2 — Adverbiales frontales
Elementos que aparecen antes del sujeto (tiempo, lugar, conectores discursivos) se muestran como `[C]` al inicio.

**Detectados automáticamente:**
- Tiempo/lugar: *yesterday, last week, every morning, in the afternoon, at 7pm…*
- Conectores: *however, therefore, moreover, furthermore, besides, consequently…*

**Estrategia de detección:**
1. Si hay coma: todo antes de la coma = adverbial frontal `[C]`
2. Sin coma: buscar el primer pronombre personal (`I/you/he/she/we/they`) → todo antes = adverbial

---

### REGLA 3 — Cláusula subordinada frontal
Una cláusula que comienza con `if/when/because/although/while/before/after/since/unless/though/as/once/until` seguida de coma se muestra como `[C]` antes del análisis de la cláusula principal.

**Ejemplo:**
> *"If you study hard, you will pass."*
> → `[C: If you study hard,]` `[S: you]` `[V: will pass]`

Para `if` frontal, la etiqueta `[IF]` aparece **antes** de la cláusula condicional.

---

### REGLA 4 — Adverbios de posición media
Adverbios entre sujeto y verbo (*also, always, never, often, still, just, already, usually, sometimes, rarely, seldom, ever, even*) se agrupan al bloque `[V]`.

**Ejemplo:**
> *"She has also created serious problems."*
> → `[S: She]` `[V: has also created]` `[O: serious problems]`

---

### REGLA 5 — División en cláusulas (buildClauseRows)
Oraciones con varias cláusulas se muestran en filas separadas.

**Conjunciones coordinantes** (`and, but, or, so`) → filas iguales
**Conjunciones subordinantes** (`because, when, although, while, whereas, though, before, after, until`) → fila subordinada

**Condición anti-falso-split:** una conjunción coordinante solo divide si **ambos lados tienen verbo principal** (no uno dentro de una cláusula subordinada).

---

### REGLA 6 — Sujeto gerundio
Cuando la oración comienza con un gerundio (`-ing`) seguido de un auxiliar/modal, el gerundio + su frase nominal se tratan como sujeto `[S]`.

**Ejemplo:**
> *"Working from home has become very common since 2020."*
> → `[S: Working from home]` `[V: has become]` `[C: very common since 2020]`

---

### REGLA 7 — Sujeto expletivo "It" (voz pasiva impersonal)
Cuando el sujeto es `it` y el complemento comienza con `that`, se marca el sujeto como **formal** (`It*`) con tooltip explicativo.

**Ejemplo:**
> *"It is widely believed that excessive use can contribute to anxiety."*
> → `[S: It*]` `[V: is widely believed]` `[C: that excessive use…]`

`*` = sujeto formal — el significado real está en el complemento (`that…`)

---

### REGLA 8 — Modales en el bloque V
Los verbos modales forman parte del bloque `[V]` junto con el verbo principal.

**Ejemplo:**
> *"She should have called earlier."*
> → `[S: She]` `[V: should have called]` `[C: earlier]`

---

### REGLA 9 — Cláusula embedded (sustantiva)
Cuando se detecta una estructura pasiva impersonal con cláusula `that`, se muestra una nota informativa debajo del análisis:

> 📎 *Esta oración contiene una cláusula subordinada sustantiva (embedded clause). Para un análisis más profundo, consulta con tu profesor.*

---

### REGLA 10 — Phrasal Verbs

Los phrasal verbs se detectan y ambas palabras (verbo + partícula) reciben el color de **verbo**.

**Lista incluida (American English File Starter–Book 3):**

*Starter/Book 1:* get up, wake up, sit down, stand up, go out, come in, put on, take off, turn on, turn off, pick up, put down, come back, go back, look at, listen to

*Book 2/Book 3:* find out, give up, look for, look after, carry on, set up, turn up, turn down, go on, come on, take up, take out, take back, bring up, bring back, run out, run into, come up with, look forward to, get on, get off, get along, get back, give back

**Casos:**
- **Adyacente:** `turn off the light` → ambas palabras en rojo verbo
- **Separado:** `turn the light off` → ambas en rojo verbo, sin conector visual
- **Tooltip:** *"Phrasal verb — 'turn off' works as a single verb"*
- **Modo práctica:** la partícula taggeada como Verb = correcto ✓

---

### REGLA 11 — Palabras no reconocidas

| Caso | Condición | Renderizado |
|---|---|---|
| **Case 1** | Mayúscula a mitad de oración | → Sustantivo propio (N), sin advertencia |
| **Case 2** | Minúscula no reconocida | → Borde rojo discontinuo + tooltip *"Word not recognized — check spelling"* |
| **Case 3** | Contiene números o caracteres especiales | → Texto plano sin color |

**Barra de estadísticas:** muestra `⚠️ X word(s) not recognized` si hay palabras no identificadas.

**Modo práctica:** palabras no reconocidas = no clickeables + nota de advertencia.

---

### REGLA 12 — Preguntas (estructura invertida)

#### PARTE A — Contracciones
Las contracciones se expanden antes del análisis NLP y se renderizan como **dos tokens coloreados** con el texto original en gris pequeño encima:

| Contracción | Parte 1 | Parte 2 |
|---|---|---|
| What's | WH: What | V: 's |
| Don't | AUX: do | ADV: n't |
| Can't | MOD: can | ADV: n't |
| I'm | PRO: I | AUX: 'm |
| They're | PRO: They | AUX: 're |

#### PARTE B — Tres tipos de pregunta

**Tipo 1 — Sí/No con "be":**
> *"Is she a teacher?"*
> → `[V: Is]` `[S: she]` `[C: a teacher]` ❓

**Tipo 2 — Sí/No con do/does/did:**
> *"Do you like coffee?"*
> → `[V: Do]` `[S: you]` `[V: like]` `[C: coffee]` ❓

**Tipo 3 — Wh- questions:**
> *"Where do you live?"*
> → `[WH: Where]` `[V: do]` `[S: you]` `[V: live]` ❓

Todas las filas de pregunta muestran un badge **❓** al final con tooltip:
*"Question — subject and verb are inverted. Normal order: [S] + [V] + [C]"*

#### PARTE C — Wh-words como POS
| Palabra | POS en pregunta | POS fuera de pregunta |
|---|---|---|
| what, who, whom, which | WH | Pronoun |
| where, when, why, how | WH | Adverb |
| whose | WH | Determiner |

---

### REGLA 13 — WH como 11ª categoría POS

Las palabras interrogativas tienen su propia categoría `wh` (teal, `#0F766E` / `#F0FDFA`) desbloqueada en **todos los niveles**.

**Palabras:** what, who, whom, which, whose, where, when, why, how, whatever, whoever, wherever, whenever, however, whichever

**Condición de activación:** solo se tagean como WH cuando la oración es una pregunta directa (termina en `?`). En otros contextos (pronombres relativos, conectores) mantienen su POS por defecto.

**En estructura:** bloque `[WH]` propio en color teal, aparece antes de `[V]` en preguntas Wh-.

**Paleta de práctica manual:** botón `[WH]` disponible en todos los niveles.

---

### REGLA 14 — Expresiones WH compuestas

Cuando la oración es una pregunta directa, ciertos pares de palabras se fusionan en un único token `[WH]`. Aplica tanto en **Análisis Automático** (POS y Estructura) como en **Práctica Manual**.

#### Orden de prioridad (primera coincidencia gana)

| Prioridad | Patrón | Resultado |
|---|---|---|
| 1 | `what/which` + sustantivo + `of` + frase nominal | `[WH: what + noun]` + `[C: of + noun]` |
| 2 | `what/which/whose` + sustantivo | `[WH: what + noun]` |
| 3 | `how` + adjetivo/adverbio | `[WH: how + adj/adv]` |
| 4 | WH simple | `[WH]` (Regla 13) |

#### Patrón 1 — `what/which` + sustantivo + `of` + frase nominal

El bloque WH captura solo el par `wh + noun`. La frase `of + noun` se separa como bloque `[C]` inmediatamente después, antes del auxiliar invertido.

**Ejemplos:**
```
"What kind of music do you listen to?"
→ [WH: What kind] [C: of music] [V: do] [S: you] [V: listen to] ❓

"What type of food do you prefer?"
→ [WH: What type] [C: of food] [V: do] [S: you] [V: prefer] ❓

"What level of English do you have?"
→ [WH: What level] [C: of English] [V: do] [S: you] [V: have] ❓

"What part of Chile are you from?"
→ [WH: What part] [C: of Chile] [V: are] [S: you] [C: from] ❓
```

**Detección:** el sustantivo después de `what/which` se detecta por POS tag (`#Noun`) — sin lista hardcodeada.

#### Patrón 2 — `what/which/whose` + sustantivo (sin `of`)

```
"What time is it?"      → [WH: What time] [V: is] [S: it] ❓
"Which one do you prefer?" → [WH: Which one] [V: do] [S: you] [V: prefer] ❓
"Whose book is this?"   → [WH: Whose book] [V: is] [S: this] ❓
```

#### Patrón 3 — `how` + adjetivo o adverbio

Lista implementada (no cerrada — cualquier adj/adv puede extenderla):
`how long · how much · how many · how often · how far · how old · how tall · how big · how good · how well · how fast · how late · how early · how hard · how loud`

```
"How long does it take?"  → [WH: How long] [V: does] [S: it] [V: take] ❓
"How often do you exercise?" → [WH: How often] [V: do] [S: you] [V: exercise] ❓
```

#### POS mode

Los tokens compuestos se renderizan como una única píldora coloreada:
- `[WH: How long]` — una sola píldora teal, no dos separadas
- `[WH: What time]` — ídem
- En Patrón 1, `of + noun` se renderiza con sus colores POS normales (PREP + N)

#### Modo práctica manual

El token compuesto es una única unidad clickeable. El alumno hace clic una vez para etiquetar todo el compuesto como `[WH]`.

- Etiquetar el compuesto completo como WH = ✓ correcto
- Etiquetar solo la primera palabra como WH = ✗ incorrecto

---

## PWA — Progressive Web App

| Característica | Implementación |
|---|---|
| Instalación Android | Banner automático vía `beforeinstallprompt` |
| Instalación iOS | Hint *"Share → Add to Home Screen"* |
| Modo offline | Service Worker (Workbox) + banner de advertencia |
| Cache CDN | `unpkg.com` cacheado por 30 días |
| Deploy | GitHub Actions → GitHub Pages automático en push a `main` |
| URL base | `/pos-highlighter/` |

---

## Notas de implementación

### compromise.js — quirks conocidos
- `tags` en `.json()` es un **objeto** `{Verb: true}`, no un array → usar `t in tags`
- `.terms().json()` retorna `[{text, terms:[{text, tags}]}]` — los tags están en `.terms[0]`
- Gerundios al inicio de oración se detectan como Verb, no como Noun → Regla 6
- `doc.verbs().first()` en "is widely believed" devuelve la frase completa → preservar adverbios sandwiched entre verbos usando slice first-to-last

### Detección de sujeto
- Si hay adverbial frontal con coma: sujeto = texto después de la coma
- Si no hay coma: buscar primer pronombre personal como ancla del sujeto
- Si no hay pronombre: buscar ProperNoun que no sea la primera palabra

### Contracciones y NLP
- Antes de análisis estructural, todas las contracciones se expanden (`expandContractions()`)
- Esto permite que compromise detecte "is/are/do" como verbos reales
- La expansión es interna — el display siempre muestra el texto original

---

### REGLA 15 — Auxiliar "be" vs. verbo copular

*(Ya implementada — ver código)*

El auxiliar "be" (am/is/are/was/were/been/being) se clasifica como:
- **AUX** cuando va seguido de V-ing (progresivo) o V-participle (pasivo)
- **V** (copular) cuando va seguido de sustantivo, adjetivo, preposición o adverbio

---

### REGLA 16 — "have to" como unidad auxiliar

"have to" expresa obligación y es enseñado en AEF como una unidad junto a must/should/can (Libro 1 File 7B, Libro 2 File 1B). Se trata como chunk auxiliar, NO como verbo principal + infinitivo.

#### Tres usos de "have"

| Caso | Patrón | Clasificación |
|---|---|---|
| CASE 1 | have + participio pasado | AUX (tiempo perfecto) |
| CASE 2 | have/has/had + to + infinitivo | AUX chunk "have to" (obligación) |
| CASE 3 | have/has/had + sustantivo/pronombre | V (verbo principal, posesión) |

**CASE 1 — perfecto:**
```
"I have played football."   → [AUX: have] [V: played] [N: football]
"She has eaten already."    → [AUX: has] [V: eaten] [ADV: already]
"Have you finished?"        → [AUX: Have] [PRO: you] [V: finished]
```

**CASE 2 — obligación (token fusionado):**
```
"I have to play football."     → [PRO: I] [AUX: have to] [V: play] [N: football]
"She has to study tonight."    → [PRO: She] [AUX: has to] [V: study] [ADV: tonight]
"Do you have to work tomorrow?"→ [AUX: Do] [PRO: you] [AUX: have to] [V: work] [N: tomorrow]
```

**CASE 3 — posesión:**
```
"I have a car."     → [PRO: I] [V: have] [DET: a] [N: car]
"She has brothers." → [PRO: She] [V: has] [N: brothers]
```

#### Modo estructura

**CASE 2:** "have to + verbo principal" van juntos en el bloque V:
```
"I have to play football."       → [S: I] [V: have to play] [C: football]
"She has to study every night."  → [S: She] [V: has to study] [A: every night]
"Do you have to work tomorrow?"  → [V: Do] [S: you] [V: have to work] [A: tomorrow] ❓
```

**CASE 1:** ambos van en bloque V (ya cubierto por Regla 8):
```
"I have played football."  → [S: I] [V: have played] [C: football]
```

**CASE 3:** have = verbo principal, bloque V normal:
```
"I have a car."  → [S: I] [V: have] [C: a car]
```

#### Semi-modales relacionados (misma lógica CASE 2)

| Expresión | Ejemplo | Resultado POS |
|---|---|---|
| used to | "We used to live there." | [AUX: used to] [V: live] |
| be going to | "She is going to study." | [AUX: is going to] [V: study] |
| be able to | "He was able to finish." | [AUX: was able to] [V: finish] |

Referencia AEF: Starter File 6B (be going to), Libro 1 File 9B (be able to), Libro 2 File 6A (used to).

#### Ejemplos completos

```
"I have to play football after school."
POS:       [PRO:I] [AUX:have to] [V:play] [N:football] [PREP:after] [N:school]
Estructura: [S: I] [V: have to play] [C: football] [A: after school]

"She doesn't have to work on Sundays."
POS:       [PRO:She] [AUX:does] [ADV:n't] [AUX:have to] [V:work] [PREP:on] [N:Sundays]
Estructura: [S: She] [V: doesn't have to work] [A: on Sundays]

"Do they have to wear a uniform?"
POS:       [AUX:Do] [PRO:they] [AUX:have to] [V:wear] [DET:a] [N:uniform]
Estructura: [V: Do] [S: they] [V: have to wear] [C: a uniform] ❓

"I have a lot of homework." (CASE 3 — posesión)
POS:       [PRO:I] [V:have] [DET:a] [N:lot] [PREP:of] [N:homework]
Estructura: [S: I] [V: have] [C: a lot of homework]

"We used to live in Valparaíso."
POS:       [PRO:We] [AUX:used to] [V:live] [PREP:in] [N:Valparaíso]
Estructura: [S: We] [V: used to live] [A: in Valparaíso]
```

---

### REGLA 17 — NUM (Numeral) como 12ª categoría POS

Los numerales cardinales son una categoría propia a partir de **Intermedio (B1)**. En Básico/Elemental se absorben como `DET` para simplificar el análisis en A1–A2.

#### Color
| Clave | Label | Color | Fondo |
|---|---|---|---|
| `number` | NUM | `#6B7280` | `#F3F4F6` |

#### Qué se etiqueta como NUM

| ✅ Etiquetar como NUM | ❌ No etiquetar como NUM |
|---|---|
| Cardinales escritos: *one, two, three, hundred, thousand* | Ordinales (*first, second, third, last, next*) → **ADJ** |
| Dígitos: *1, 2, 42, 100, 1000* | Adverbios multiplicativos (*once, twice*) → **ADV** |
| Años y fechas: *2020, 1999, 1492* | *Many, few, several, much* → **DET** (cuantificadores) |
| Fracciones: *half, quarter* (como cantidad) | *One* usado como pronombre → **PRO** |
| Expresiones numéricas: *11:00, 3.5, 50%* | |

#### Lógica de detección (compromise.js)

```
if (#Ordinal)                          → adjective
else if (#Cardinal | #NumericValue | #Value) → number
```

#### Comportamiento por nivel

| Nivel | Comportamiento |
|---|---|
| Básico / Elemental | Tokens `number` → convertidos a `determiner` en tokenizeText(text, level) |
| Intermedio / Intermedio Alto | Tokens `number` se muestran con color NUM propio |

#### Modo estructura

NUM sigue las mismas reglas de bloque que DET — pertenece al bloque de su sustantivo.

```
"Working from home has become very common since 2020."
→ [S: Working from home] [V: has become] [C: very common since 2020]
                                                              ↑ 2020 = NUM dentro del bloque C

"Many people prefer it."
→ [S: Many people]   ← "Many" = DET (cuantificador, no NUM)
```

#### Posición en la leyenda

```
Noun / Verb / Adjective / Adverb / Pronoun / Wh- Word /
Preposition / Conjunction / Determiner / Numeral / Modal / Auxiliary
```

---

## Mantenimiento — correcciones de julio 2026

La lógica NLP se extrajo de `App.jsx` a **`src/nlp/analysis.js`** y ahora tiene
suite de regresión en `src/nlp/analysis.test.js` (`npm test`, Vitest, 37 casos
basados en los ejemplos de este documento).

| Fix | Antes | Ahora |
|---|---|---|
| **C1** — búsqueda del verbo con límite de palabra | *"This is my book."* → `[S: Th]` ("is" se encontraba dentro de "This") | `[S: This] [V: is] [C: my book]` |
| **C2** — Práctica Manual → Pintar Estructura | Toda respuesta se calificaba ✗ (comparaba contra un campo inexistente) | `buildStructureAnswerMap` alinea token↔bloque en orden, soporta contracciones, varias oraciones y deja las conjunciones sin calificar |
| **C3** — preguntas copulares | *"Is she happy?"* → `[V: happy]` (adjetivo forzado a verbo) | `[V: Is] [S: she] [C: happy]`; solo se fuerza verbo tras do/does/did/modal o con evidencia de tags |
| **C4** — negativas | *"She doesn't like coffee."* → `[V: does not] [C: like coffee]` | `[V: does not like] [C: coffee]`; con "be + not" el adjetivo sigue en C |
| **C5** — detección de pregunta | *"Do your homework."* se analizaba como pregunta | `isQuestion` exige `?` (como ya documentaban las Reglas 12/13); imperativos → `[V] [C]` |
| **I2** — tokenización por oración | Los pases de análisis cruzaban límites de oración (*"Is the food ready? Cooking..."* → "ready" = verbo) | Cada oración se tokeniza y post-procesa de forma independiente |

Cambio de comportamiento a tener en cuenta: una pregunta **sin** signo `?` ya
no activa la ruta de preguntas (antes bastaba empezar con Do/Is/Where…). Esto
es intencional — el costo de leer imperativos como preguntas era mayor.

### Segundo lote — I1 / I3 / I4

| Fix | Antes | Ahora |
|---|---|---|
| **I1** — phrasal verbs vs verbo+preposición | *"came in the morning"*, *"went on holiday"* se marcaban como phrasal (color verbo + tooltip) | Partículas que también son preposiciones (in/on/at/into/after/to/for) no se marcan phrasal si encabezan un adverbial de tiempo/lugar (`ADVERBIAL_HEADS`) o un año; la forma separada se rechaza si la partícula va seguida de otro sustantivo (*"took the bus back home"*). Los phrasal legítimos (turn off, look at, get on the bus…) se mantienen |
| **I3** — cópula *be* + adjetivo -ing | *"The movie is interesting"* → `is` = auxiliar | Se respeta la etiqueta de compromise: adjetivo predicativo -ing (interesting, boring, tiring) → `is` = verbo copular; progresivo real (running, studying) → auxiliar |
| **nlpTags (bug raíz)** | `term.tags` de `doc.json()` es un **array** de nombres, pero el código hacía `Object.keys()` → índices numéricos; todo `nlpTags.includes('Participle'/'Gerund'/…)` devolvía `false` en silencio | Se maneja array/objeto correctamente. Bonus: la pasiva *"was built"* ahora se detecta como auxiliar |
| **I4** — relativas de sujeto | *"The man who called is here."* → `[V: called] [C: is here]` (verbo de la relativa tratado como principal) | `[S: The man who called] [V: is] [C: here]`. Se activa solo cuando un pronombre relativo (who/which/that/whom/whose) aparece antes del primer verbo y hay ≥2 verbos; las relativas de objeto y los "that" complementantes no se ven afectados |

Limitación conocida: si compromise etiqueta mal como sustantivo el verbo principal de una relativa (*"Students who study hard pass their exams."* → "pass" = noun), el verbo principal no se detecta. Es una limitación del tagger, no de la regla.

### I5 — Contraste de color (WCAG AA)

Los colores de **texto** de las categorías POS y de los bloques de estructura se
oscurecieron al tono Tailwind más claro que alcanza AA (≥4.5:1) sobre su fondo
original (los fondos NO cambiaron, para preservar la identidad visual). Antes,
10 de 12 categorías POS estaban por debajo del umbral (el adverbio en 1.85:1 era
prácticamente ilegible en proyector/celular).

| POS | texto antes → ahora | ratio | | Estructura | antes → ahora |
|---|---|---|---|---|---|
| noun | `#D97706` → `#B45309` | 4.51 | | V | `#E11D48` → `#BE123C` |
| verb | `#E11D48` → `#BE123C` | 5.24 | | C / O | `#059669` → `#047857` |
| adjective | `#0891B2` → `#0E7490` | 4.79 | | A | `#D97706` → `#B45309` |
| adverb | `#EAB308` → `#A16207` | 4.76 | | (WH, S sin cambio: ya pasaban) | |
| pronoun | `#C026D3` → `#A21CAF` | 5.43 | | | |
| preposition | `#10B981` → `#047857` | 5.21 | | | |
| conjunction | `#3B82F6` → `#1D4ED8` | 5.49 | | | |
| determiner | `#64748B` → `#475569` | 6.92 | | | |
| modal | `#6366F1` → `#4338CA` | 6.41 | | | |
| auxiliary | `#EF4444` → `#B91C1C` | 5.30 | | | |
| number | `#6B7280` → `#4B5563` | 6.87 | | | |
| wh | `#0F766E` (sin cambio) | 5.25 | | | |

> Los colores semánticos de feedback (error rojo, ✓/✗/? indicadores) NO se
> tocaron: usan símbolos redundantes además del color, así que no dependen solo
> del color para transmitir el significado.
>
> **Para alinear Grammar HUB:** usar los valores "ahora" de estas tablas.

### I8 — Alineación de color Grammar Hub (jul 2026)

Al unificar la paleta del hub (un color por rol, ver `Apps/design-tokens/`), el
sistema verbal se separó **por luminosidad**: el **verbo principal** toma el rojo
más grave y el **auxiliar** el rose más liviano. Como Desgramatizador pinta texto
de color sobre tinte claro, el rose y el azul usan su variante `onTint` (más
oscura) para no romper AA. Todos siguen cumpliendo ≥4.5:1.

| Rol | I5 (antes) | Ahora (hub) | ratio sobre su tinte |
|---|---|---|---|
| verb · estructura V | `#BE123C` | `#B91C1C` | 5.31 sobre `#FEE2E2` |
| auxiliary | `#B91C1C` | `#BE123C` | 5.23 sobre `#FFE4E6` |
| modal | `#4338CA` | `#4F46E5` | 5.07 sobre `#E0E7FF` |
| estructura S | `#4F46E5` | `#1D4ED8` (azul-700) | 5.49 sobre `#DBEAFE` |
| estructura C | `#047857` | `#475569` (slate) | 6.92 sobre `#F1F5F9` |

Los valores llegan vía `src/tokens.generated.js`, que produce `npm run sync`
en `Apps/design-tokens/`. **No editar los colores a mano acá**: cambiarlos en
`tokens.json` y re-sincronizar.

### I6 / I7 — Accesibilidad

**I6 — Ayuda visible en táctil.** Las explicaciones educativas (phrasal verbs,
sujeto formal `It*`, inversión en preguntas, categorías bloqueadas) vivían solo
en `title=`, invisible en móvil (y la app es una PWA móvil). Nuevo componente
`InfoTip`: muestra el mismo texto como burbuja al **tocar o enfocar**, conserva
el `title` nativo para hover en desktop, es operable por teclado (Enter/Espacio/
Escape) y se cierra al tocar fuera o hacer scroll. Los textos de estos tips
ahora están traducidos (es/en) en `TRANSLATIONS.tip*`.

**I7 — Teclado.** Los elementos clickeables que eran `<div>`/`<span>` sueltos
(`LegendItem` selección de categoría, `ManualWordPill` etiquetado de palabras,
banner colapsable móvil) ahora tienen `role="button"`, `tabIndex`, `aria-pressed`/
`aria-expanded`, manejo de Enter/Espacio y anillo de foco visible. Los tokens
sin respuesta conocida no se vuelven interactivos.

**N4 (de paso).** Se eliminó código muerto que ensuciaba el lint: prop
`phrasalAdjacent` sin usar, y variables `unlocked`/`showStructure`/`showPOS`
sin usar. Lint queda en 0 errores.

### N1 — Contracciones ambiguas 's / 'd (is/has, would/had)

`'s` y `'d` se expandían siempre igual (`'s`→"is", `'d`→"would"), lo que
producía análisis incorrectos en tiempos perfectos:

| Antes | Ahora |
|---|---|
| *"He's eaten"* → `[V: is eaten]` (pasiva falsa) | `[V: has eaten]` |
| *"I'd finished"* → `[V: would finished]` | `[V: had finished]` |

**Regla de desambiguación:** `'s`/`'d` + **participio pasado** → has/had
(perfecto); si no, is/would (copular/modal). Se usa un set de participios
irregulares + heurístico `-ed`, **con denylist de adjetivos predicativos en
-ed** (`tired, bored, married, interested…`) que fuerzan "is" (*"He's tired"*
= is tired, no has tired). Los casos copulares/modales/progresivos que ya
funcionaban (*"She's happy"*, *"I'd like"*, *"She's studying"*) se mantienen.

Aplica en **ambos modos**: estructura (`expandContractions` context-aware) y
POS (la píldora partida `'s`/`'d` se recolorea según lo que sigue). El
posesivo (*"John's book"*) sigue sin expandirse.

### N5 — Internacionalización (es/en) completa

Varios textos estaban hardcodeados en un idioma e ignoraban el toggle ES/EN.
Todos los strings visibles ahora pasan por `TRANSLATIONS[lang]`:

- **QuestionMessage** completo (título, explicación de estructura invertida,
  Yes/No vs Wh-, nota final) → clave `q` con subclaves.
- Nota de embedded clause (📎), hint de scroll (móvil), banner colapsable
  ("toca para ver/ocultar").
- Estaban en **inglés** hardcodeado (rompían el modo ES): barra de stats
  ("words tagged", "not recognized"), contador de score ("tagged"/"correct"),
  resultados de práctica ("Results:", "Correct/Incorrect/Untagged", aviso de
  ortografía) y tooltips de `ManualWordPill`/`WordToken` ("Click to tag",
  "Word not recognized", tooltips de phrasal en práctica).
- Subtítulo del header.

Se pasó `lang` a los componentes que no lo recibían (`QuestionMessage`,
`AnalysisStats`, `ManualWordPill`).

**Fuera de alcance (intencional):** los nombres de nivel (Básico/Elemental/
Intermedio/Intermedio Alto) se muestran en español en ambos idiomas porque son
las claves de `LEVELS` e identificadores app-wide; traducirlos requeriría
refactor de la lógica de niveles.

### N7 — Evitar doble análisis en `analyzeStructure`

`analyzeStructure` analizaba cada oración dos veces: una con
`analyzeSentenceStructure` (para los flags isComplex/isQuestion/
hasEmbeddedClause/error) y otra con `buildClauseRows` (para las filas), que a
su vez volvía a llamar `analyzeSentenceStructure` sobre el mismo texto.

Ahora, para oraciones de **una sola cláusula** (el caso común) se reutiliza el
análisis ya hecho para construir la fila, en vez de re-parsear. Las oraciones
multi-cláusula siguen usando `buildClauseRows` (ahí los dos análisis son
genuinamente distintos: oración completa vs. cláusulas). Equivalencia de salida
verificada; sin cambio de comportamiento. Reducción ~50% de parses en textos de
oraciones simples.

### Práctica Manual — rotar categorías con clicks repetidos

En Práctica Manual, si **no** hay categoría seleccionada en la paleta, hacer
clic repetido en una palabra rota entre las categorías disponibles y vuelve a
"sin etiqueta" al terminar el ciclo:

- **POS:** rota por las categorías desbloqueadas del nivel (orden de la leyenda).
- **Estructura:** rota por WH/S/V/C (Básico/Elemental) o WH/S/V/O/A (Intermedio).

Si **sí** hay una categoría seleccionada, se mantiene el comportamiento anterior
(pintar la seleccionada; volver a hacer clic la quita). Antes, un clic sin
categoría seleccionada no hacía nada.
