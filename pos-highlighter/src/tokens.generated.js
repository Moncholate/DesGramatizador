/* AUTO-GENERATED from design-tokens/tokens.json — do not edit by hand.
   Change tokens.json and run `npm run sync` in Apps/design-tokens. */
// Colores canónicos por rol para los mapas POS y estructural (S/V/C).
export const TOKENS = {
  wh: { color: "#115E59", bg: "#F0FDFA" },
  subject: { color: "#1D4ED8", bg: "#DBEAFE" },
  auxiliary: { color: "#BE123C", bg: "#FFE4E6" },
  verb: { color: "#B91C1C", bg: "#FEE2E2" },
  complement: { color: "#475569", bg: "#F1F5F9" },
  modal: { color: "#4F46E5", bg: "#E0E7FF" },
  adverb: { color: "#854D0E", bg: "#FEF3C7" },
};
export const TOKENS_DARK = {
  wh: { color: "#2DD4BF", bg: "#18343d" },
  subject: { color: "#60A5FA", bg: "#1f2d46" },
  auxiliary: { color: "#FDA4AF", bg: "#372d3b" },
  verb: { color: "#F87171", bg: "#362531" },
  complement: { color: "#CBD5E1", bg: "#2f3442" },
  modal: { color: "#A5B4FC", bg: "#2a2f46" },
  adverb: { color: "#FBBF24", bg: "#373126" },
};
// Tinta para cuando el color de un rol se usa como RELLENO sólido (insignias
// S/V/A/C). Va suelta y no dentro de cada rol porque no depende del rol: ver
// `roles._inkDesc` en tokens.json. En claro el relleno es oscuro y la tinta es
// la superficie; en oscuro el relleno se invierte y la tinta pasa a ser el fondo.
export const INK = { light: "#FFFFFF", dark: "#0C0E15" };
