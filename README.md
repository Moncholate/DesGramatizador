# Desgramatizador

Identificador interactivo de Partes de la Oración (POS) para estudiantes de inglés.
Diseñado para uso en aula con _American English File_ (3.ª ed.) en Duoc UC, Santiago.

🔗 **App en vivo:** https://moncholate.github.io/Desgramatizador/

---

## Características

- **11 categorías POS** con colores del esquema Okabe-Ito (accesible para daltonismo)
- **Categoría WH** exclusiva para palabras interrogativas (teal `#0F766E`)
- **Análisis estructural S / V / O / A / C** con soporte para preguntas (Wh-, sí/no)
- **Contracciones** renderizadas como dos tokens coloreados con el original encima
- **Phrasal verbs** detectados automáticamente (adyacente y separado)
- **Palabras no reconocidas** marcadas con borde rojo discontinuo
- **3 tipos de pregunta** con badge ❓ y explicación de inversión S/V
- **Niveles CEFR:** Básico (A1) · Elemental (A2) · Intermedio (B1) · Intermedio Alto (B2)
- **Modo Práctica** — pintar tokens manualmente y verificar respuestas
- **PWA** — instalable en Android/iOS, funciona offline
- **Deploy automático** vía GitHub Actions → GitHub Pages

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

## Categorías POS

| Clave | Label | Color texto | Color fondo | Descripción |
|---|---|---|---|---|
| `noun` | N | `#D97706` | `#FEF3C7` | Sustantivo |
| `verb` | V | `#E11D48` | `#FFE4E6` | Verbo |
| `adjective` | ADJ | `#0891B2` | `#CFFAFE` | Adjetivo |
| `adverb` | ADV | `#EAB308` | `#FEFCE8` | Adverbio |
| `pronoun` | PRO | `#C026D3` | `#FAE8FF` | Pronombre |
| `wh` | WH | `#0F766E` | `#F0FDFA` | Palabra interrogativa |
| `preposition` | PREP | `#10B981` | `#ECFDF5` | Preposición |
| `conjunction` | CONJ | `#3B82F6` | `#DBEAFE` | Conjunción |
| `determiner` | DET | `#64748B` | `#F1F5F9` | Determinante |
| `modal` | MOD | `#6366F1` | `#E0E7FF` | Modal |
| `auxiliary` | AUX | `#EF4444` | `#FEE2E2` | Auxiliar |
| `number` | NUM | `#059669` | `#D1FAE5` | Número |

---

## Puesta en marcha (local)

```bash
cd pos-highlighter
npm install
npm run dev
```

Abre `http://localhost:5173/Desgramatizador/`

### Build de producción

```bash
npm run build
```

El output queda en `pos-highlighter/dist/`. El deploy a GitHub Pages se hace automáticamente al hacer push a `main`.

---

## Deploy (GitHub Actions)

El workflow `.github/workflows/deploy.yml` ejecuta en cada push a `main`:

1. `npm install` en `pos-highlighter/`
2. `npm run build`
3. Publica `pos-highlighter/dist/` en GitHub Pages

---

## Documentación de reglas

Ver [REGLAS.md](REGLAS.md) para la documentación completa de las 13 reglas de análisis implementadas.

---

## Licencia

MIT
