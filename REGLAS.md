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

La app usa **11 categorías** con colores del esquema Okabe-Ito (accesible para daltonismo):

| Clave | Label | Color texto | Color fondo | Descripción |
|---|---|---|---|---|
| `noun` | N | `#D97706` | `#FEF3C7` | Sustantivo |
| `verb` | V | `#E11D48` | `#FFE4E6` | Verbo |
| `adjective` | ADJ | `#0891B2` | `#CFFAFE` | Adjetivo |
| `adverb` | ADV | `#EAB308` | `#FEFCE8` | Adverbio |
| `pronoun` | PRO | `#C026D3` | `#FAE8FF` | Pronombre |
| `wh` | WH | `#0F766E` | `#F0FDFA` | Palabra interrogativa (wh-word) |
| `preposition` | PREP | `#10B981` | `#ECFDF5` | Preposición |
| `conjunction` | CONJ | `#3B82F6` | `#DBEAFE` | Conjunción |
| `determiner` | DET | `#64748B` | `#F1F5F9` | Determinante |
| `modal` | MOD | `#6366F1` | `#E0E7FF` | Modal |
| `auxiliary` | AUX | `#EF4444` | `#FEE2E2` | Auxiliar |
| `number` | NUM | `#059669` | `#D1FAE5` | Número |

### Niveles CEFR — categorías desbloqueadas

| Nivel | Categorías visibles |
|---|---|
| Básico (A1) | N, V, ADJ, DET, PRO, WH, PREP, ADV, MOD, AUX, NUM |
| Elemental (A2) | N, V, ADJ, DET, PRO, WH, PREP, ADV, MOD, AUX, NUM |
| Intermedio (B1) | todo lo anterior + CONJ |
| Intermedio Alto (B2) | todo lo anterior + CONJ |

---

## Bloques de estructura (S/V/O/A/C)

| Bloque | Color | Descripción |
|---|---|---|
| WH | `#0F766E` / `#F0FDFA` | Palabra interrogativa (preguntas) |
| S | `#4F46E5` / `#EEF2FF` | Sujeto |
| V | `#E11D48` / `#FFF1F2` | Verbo |
| C | `#059669` / `#ECFDF5` | Complemento (nivel básico) |
| O | `#059669` / `#ECFDF5` | Objeto directo (nivel intermedio) |
| A | `#D97706` / `#FFFBEB` | Adverbial (cuándo / dónde / cómo) |

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
