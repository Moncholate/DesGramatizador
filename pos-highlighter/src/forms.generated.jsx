/* AUTO-GENERATED from design-tokens/tokens.json — do not edit by hand.
   Change tokens.json and run `npm run sync` in Apps/design-tokens. */
// Los dos ejes de la oración: forma (+ − ?) y tipo de pregunta (abierta/cerrada).
// Los colores NO están aquí: viven en forms.generated.css como variables, para que
// el chip sea theme-aware sin que cada app tenga que resolver el tema en JS.
export const FORM_SIGNS = {
  "affirmative": {
    "sign": "+",
    "cssVar": "--f-aff",
    "label": {
      "es": "Afirmativa",
      "en": "Affirmative"
    }
  },
  "negative": {
    "sign": "−",
    "cssVar": "--f-neg",
    "label": {
      "es": "Negativa",
      "en": "Negative"
    }
  },
  "interrogative": {
    "sign": "?",
    "cssVar": "--f-int",
    "label": {
      "es": "Interrogativa",
      "en": "Interrogative"
    }
  }
};
export const QUESTION_TYPES = {
  "open": {
    "role": "wh",
    "label": {
      "es": "Abierta (Wh-)",
      "en": "Open (Wh-)"
    },
    "rule": {
      "es": "Empieza con wh-word",
      "en": "Starts with a wh-word"
    }
  },
  "closed": {
    "role": "auxiliary",
    "label": {
      "es": "Cerrada (Yes/No)",
      "en": "Closed (Yes/No)"
    },
    "rule": {
      "es": "Empieza con auxiliar",
      "en": "Starts with an auxiliary"
    }
  }
};
export const FORM_ORDER = ["affirmative","negative","interrogative"];

/* El MARCADO va generado por el mismo motivo que el CSS: si cada app se escribe
   su propio JSX, el chip deja de ser el mismo objeto en dos cambios.

   <FormSign> es el glifo solo, para barras de modo y botones.
   <FormChip> es la cápsula de dos ranuras.
   Los signos van con aria-hidden porque la ranura de al lado ya dice el nombre;
   si alguna vez se usa un chip SIN rótulo, hay que darle aria-label a mano — si
   no, el color y el glifo quedan comunicando solos, que es justo lo que el DUA
   pide no hacer. */
export function FormSign({ form, className = '' }) {
  const s = FORM_SIGNS[form];
  return (
    <span className={`ghf__g ${className}`} data-form={form} aria-hidden="true">
      {s ? s.sign : '?'}
    </span>
  );
}

export function FormChip({ form = 'interrogative', negative = false, type = null,
                          lang = 'es', label, className = '' }) {
  const signos = [form];
  /* «Negativa» ya trae su signo; solo se añade cuando la forma es OTRA — una
     pregunta negativa lleva los dos («?−»). */
  if (negative && form !== 'negative') signos.push('negative');
  const base = label
    ?? (type ? QUESTION_TYPES[type].label[lang] : (FORM_SIGNS[form]?.label[lang] ?? ''));
  const texto = negative && form !== 'negative'
    ? `${base} · ${FORM_SIGNS.negative.label[lang].toLowerCase()}`
    : base;
  return (
    <span className={`ghf ${className}`}>
      <span className="ghf__sign">
        {signos.map(f => <FormSign key={f} form={f} />)}
      </span>
      <span className="ghf__slot" {...(type ? { 'data-type': type } : {})}>{texto}</span>
    </span>
  );
}
