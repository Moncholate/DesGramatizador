import React, { useState, useEffect, useMemo, useRef } from 'react';
import { isQuestion, tokenizeText, analyzeStructure, buildStructureAnswerMap } from './nlp/analysis';
import { loadProgress, saveProgress, recordAnalysis, recordAttempt, evaluateBadges, BADGES } from './gamification.generated.js';
import { TOKENS as TOKENS_LIGHT, TOKENS_DARK } from './tokens.generated.js';
// Elige colores de rol según el tema del SO al cargar (modo oscuro dark-aware)
const IS_DARK = (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
const TOKENS = IS_DARK ? TOKENS_DARK : TOKENS_LIGHT;
// Neutros por defecto (casilla bloqueada / palabra sin reconocer / superficie / fundido de scroll)
// sensibles al tema — los estilos inline no los alcanza el override CSS de modo oscuro.
const NEUTRAL = IS_DARK
  ? { lockBg: '#1d2233', lockText: '#8b93a7', lockBorder: '#2a3042', surface: '#141826', fade: '#141826', warnBg: '#3a1720', warnText: '#f28b82', warnBorder: '#5c2b2b', pillBg: '#1d2233', pillText: '#9aa2b6', pillBorder: '#2a3042', text: '#eceff8' }
  : { lockBg: '#F1F5F9', lockText: '#94A3B8', lockBorder: '#E2E8F0', surface: 'white',   fade: 'white',   warnBg: '#FEF2F2', warnText: '#EF4444', warnBorder: '#FECACA', pillBg: '#F8FAFC', pillText: '#64748B', pillBorder: '#E2E8F0', text: '#1e293b' };

/* ═══════════════════════════════════════════════════════════
   TRANSLATIONS
═══════════════════════════════════════════════════════════ */

const TRANSLATIONS = {
  es: {
    appTitle: 'DesGramatizador',
    appSubtitle: 'Descubre el ADN de tus oraciones.',
    autoAnalysis: 'Análisis Automático',
    manualPractice: 'Práctica Manual',
    showStructure: 'Mostrar Estructura',
    showPOS: 'Mostrar POS',
    showBoth: 'Mostrar Ambos',
    loadExample: 'Cargar texto de ejemplo ▾',
    analyze: 'Analizar',
    reanalyze: 'Re-analizar',
    prepare: 'Iniciar Práctica',
    checkAnswers: 'Verificar Respuestas',
    showAnswers: 'Mostrar Respuestas',
    hideAnswers: 'Ocultar Respuestas',
    showHideLabels: 'Mostrar/Ocultar Etiquetas',
    textPlaceholder: 'Escribe o pega texto en inglés aquí…',
    charsCount: 'caracteres',
    partsOfSpeech: 'Partes de la Oración',
    sentenceStructure: 'Estructura de la Oración',
    colorReference: 'Referencia de colores para el texto resaltado',
    clickToSelect: 'Haz clic para seleccionar una categoría para pintar',
    categoriesUnlocked: 'categorías desbloqueadas',
    painting: 'Pintando',
    selectCategory: 'Selecciona una categoría arriba',
    levelLabel: 'Nivel',
    langLabel: 'Idioma',
    showLabels: 'Mostrar Etiquetas',
    hideLabels: 'Ocultar Etiquetas',
    clearAll: 'Limpiar Todo',
    englishText: 'Texto en Inglés',
    analyzed: 'Analizado',
    paintPOS: 'Pintar POS',
    paintStructure: 'Pintar Estructura',
    assigning: 'Asignando',
    structureModeMobile: 'MODO ESTRUCTURA — toca tipo de bloque, luego toca palabras',
    paintModeMobile: 'MODO PINTAR — toca categoría, luego toca palabras',
    hintManualPOS: 'Selecciona una categoría POS en la leyenda y haz clic en palabras para etiquetarlas — o toca una palabra varias veces para rotar entre categorías.',
    hintManualStructure: 'Selecciona un tipo de bloque de estructura y haz clic en palabras para asignarlas — o toca una palabra varias veces para rotar entre bloques.',
    hintCheckAnswers: 'Presiona "Verificar Respuestas" cuando termines.',
    hintAutoAnalysis: 'Escribe o pega texto en inglés, luego haz clic en "Analizar" para resaltar automáticamente cada parte de la oración.',
    placeholderEmpty: 'Ingresa texto arriba o carga un ejemplo para comenzar.',
    placeholderAuto: 'Haz clic en "Analizar" para resaltar las partes de la oración.',
    placeholderManual: 'Haz clic en "Iniciar Práctica" para comenzar.',
    // POS definitions in Spanish
    posDef: {
      noun: 'persona, lugar, cosa o idea',
      verb: 'acción o estado',
      adjective: 'describe un sustantivo',
      adverb: 'modifica verbo o adjetivo',
      pronoun: 'reemplaza un sustantivo',
      preposition: 'muestra relación',
      conjunction: 'conecta cláusulas',
      determiner: 'especifica un sustantivo',
      modal: 'habilidad / posibilidad',
      auxiliary: 'ayuda al verbo principal',
      wh: 'introduce una pregunta',
      number: 'expresa una cantidad o número',
    },
    // Structure definitions in Spanish
    structureDef: {
      WH: 'introduce la pregunta',
      S: 'quién o qué hace la acción',
      AUX: 'auxiliar — ayuda al verbo principal (van unidos)',
      V: 'la acción o estado',
      C: 'todo lo demás',
      O: 'recibe la acción: ¿qué? / ¿a quién?',
      A: '¿cuándo? / ¿dónde? / ¿cómo?',
    },
    // Structure warnings
    complexWarning: 'Oración compleja (múltiples cláusulas o más de 15 palabras)',
    questionNotAvailable: 'Pregunta — análisis de estructura no disponible para este tipo de oración.',
    // Educational hints (shown via InfoTip on hover/tap)
    tipLocked: 'Categoría bloqueada en este nivel',
    tipPhrasal: (pv) => `Phrasal verb — "${pv}" funciona como un solo verbo`,
    tipFormalSubject: 'Sujeto formal — el significado real está en el complemento (that…)',
    tipQuestion: 'Pregunta — el sujeto y el verbo están invertidos. Orden normal: [S] + [V] + [C]',
    // Embedded clause note + mobile hints
    embeddedNote: '📎 Esta oración contiene una cláusula subordinada sustantiva (embedded clause). Para un análisis más profundo, consulta con tu profesor.',
    scrollHint: '← desliza para ver todas las categorías →',
    bannerHide: 'toca para ocultar',
    bannerShow: 'toca para ver instrucciones',
    // Stats + manual results
    wordsTagged: 'palabras etiquetadas:',
    notRecognizedStat: (n) => `${n} palabra${n > 1 ? 's' : ''} no reconocida${n > 1 ? 's' : ''}`,
    tagged: 'etiquetadas',
    correctLabel: 'correctas',
    unrecognizedWarn: 'Algunas palabras no se reconocieron. Revisa la ortografía antes de practicar.',
    resultsLabel: 'Resultados:',
    legendCorrect: 'Correcto',
    legendIncorrect: 'Incorrecto',
    legendUntagged: 'Sin etiquetar',
    notRecognizedTip: 'Palabra no reconocida — revisa la ortografía',
    clickToTag: 'Haz clic para etiquetar',
    tipPhrasalTagVerb: (pv) => `Phrasal verb — "${pv}" — etiquétalo como Verbo`,
    tipPhrasalPart: (word, pv) => `'${word}' en '${pv}' es parte de un phrasal verb — etiquétalo como Verbo`,
    // Question educational message
    q: {
      title: 'Esta es una pregunta (Question)',
      structureHeader: '📚 Estructura de las preguntas en inglés:',
      structureBody: 'Las preguntas en inglés tienen una estructura invertida comparada con las oraciones declarativas. El verbo auxiliar o modal aparece antes del sujeto.',
      yesNoTitle: 'Yes/No Questions',
      yesNoDesc: 'Comienzan con auxiliar/modal + sujeto + verbo',
      whTitle: 'Wh- Questions',
      whDesc: 'Comienzan con palabra interrogativa + auxiliar/modal + sujeto',
      noteLabel: 'Nota:',
      noteBody: 'El análisis de POS (partes de la oración) funciona normalmente con preguntas. Sin embargo, el análisis de estructura (Sujeto-Verbo-Objeto) requiere una lógica diferente debido a la inversión del sujeto y el verbo.',
    },
    // PWA banners
    installBannerMsg: '📲 Instala la app en tu celular para usarla sin internet',
    installBannerBtn: 'Instalar',
    iosHintMsg: '📲 iPhone: toca Compartir → Agregar a pantalla de inicio',
    offlineMsg: '⚠️ Sin conexión — la app sigue funcionando con el contenido cargado',
  },
  en: {
    appTitle: 'DesGramatizador',
    appSubtitle: 'Discover the DNA of your sentences.',
    autoAnalysis: 'Auto Analysis',
    manualPractice: 'Manual Practice',
    showStructure: 'Show Structure',
    showPOS: 'Show POS',
    showBoth: 'Show Both',
    loadExample: 'Load example text ▾',
    analyze: 'Analyze',
    reanalyze: 'Re-analyze',
    prepare: 'Start Practice',
    checkAnswers: 'Check Answers',
    showAnswers: 'Show Answers',
    hideAnswers: 'Hide Answers',
    showHideLabels: 'Show/Hide Labels',
    textPlaceholder: 'Type or paste English text here…',
    charsCount: 'chars',
    partsOfSpeech: 'Parts of Speech',
    sentenceStructure: 'Sentence Structure',
    colorReference: 'Colour reference for highlighted text',
    clickToSelect: 'Click to select a category for painting',
    categoriesUnlocked: 'categories unlocked',
    painting: 'Painting',
    selectCategory: 'Select a category above',
    levelLabel: 'Level',
    langLabel: 'Language',
    showLabels: 'Show Labels',
    hideLabels: 'Hide Labels',
    clearAll: 'Clear All',
    englishText: 'English Text',
    analyzed: 'Analyzed',
    paintPOS: 'Paint POS',
    paintStructure: 'Paint Structure',
    assigning: 'Assigning',
    structureModeMobile: 'STRUCTURE MODE — tap block type then tap words',
    paintModeMobile: 'PAINT MODE — tap category then tap words',
    hintManualPOS: 'Select a POS category in the legend and click words to label them — or tap a word repeatedly to cycle through the categories.',
    hintManualStructure: 'Select a structure block type and click words to assign them — or tap a word repeatedly to cycle through the blocks.',
    hintCheckAnswers: 'Press "Check Answers" when done.',
    hintAutoAnalysis: 'Type or paste English text, then click "Analyze" to automatically highlight each part of speech.',
    placeholderEmpty: 'Enter text above or load an example to get started.',
    placeholderAuto: 'Click "Analyze" to highlight parts of speech.',
    placeholderManual: 'Click "Start Practice" to begin.',
    // POS definitions in English
    posDef: {
      noun: 'person, place, thing, or idea',
      verb: 'action or state',
      adjective: 'describes a noun',
      adverb: 'modifies verb or adjective',
      pronoun: 'replaces a noun',
      preposition: 'shows relationship',
      conjunction: 'connects clauses',
      determiner: 'specifies a noun',
      modal: 'ability / possibility',
      auxiliary: 'helps the main verb',
      wh: 'introduces a question',
      number: 'expresses quantity or a number',
    },
    // Structure definitions in English
    structureDef: {
      WH: 'introduces the question',
      S: 'who or what does the action',
      AUX: 'auxiliary — helps the main verb (they go together)',
      V: 'the action or state',
      C: 'everything else',
      O: 'receives the action: what? / whom?',
      A: 'when? / where? / how?',
    },
    // Structure warnings
    complexWarning: 'Complex sentence (multiple clauses or 15+ words)',
    questionNotAvailable: 'Question — structure analysis not available for this sentence type.',
    // Educational hints (shown via InfoTip on hover/tap)
    tipLocked: 'Category locked for this level',
    tipPhrasal: (pv) => `Phrasal verb — "${pv}" works as a single verb`,
    tipFormalSubject: 'Formal subject — the real meaning is in the complement (that…)',
    tipQuestion: 'Question — subject and verb are inverted. Normal order: [S] + [V] + [C]',
    // Embedded clause note + mobile hints
    embeddedNote: '📎 This sentence contains an embedded (noun) clause. For a deeper analysis, check with your teacher.',
    scrollHint: '← swipe to see all categories →',
    bannerHide: 'tap to hide',
    bannerShow: 'tap to see instructions',
    // Stats + manual results
    wordsTagged: 'words tagged:',
    notRecognizedStat: (n) => `${n} word${n > 1 ? 's' : ''} not recognized`,
    tagged: 'tagged',
    correctLabel: 'correct',
    unrecognizedWarn: 'Some words were not recognized. Check spelling before practicing.',
    resultsLabel: 'Results:',
    legendCorrect: 'Correct',
    legendIncorrect: 'Incorrect',
    legendUntagged: 'Untagged',
    notRecognizedTip: 'Word not recognized — check spelling',
    clickToTag: 'Click to tag',
    tipPhrasalTagVerb: (pv) => `Phrasal verb — "${pv}" — tag as Verb`,
    tipPhrasalPart: (word, pv) => `'${word}' in '${pv}' is part of a phrasal verb — tag it as Verb`,
    // Question educational message
    q: {
      title: 'This is a question',
      structureHeader: '📚 Structure of questions in English:',
      structureBody: 'Questions in English have an inverted structure compared with statements. The auxiliary or modal verb comes before the subject.',
      yesNoTitle: 'Yes/No Questions',
      yesNoDesc: 'Start with auxiliary/modal + subject + verb',
      whTitle: 'Wh- Questions',
      whDesc: 'Start with a wh- word + auxiliary/modal + subject',
      noteLabel: 'Note:',
      noteBody: 'POS (parts of speech) analysis works normally with questions. However, structure analysis (Subject-Verb-Object) needs different logic because of subject-verb inversion.',
    },
    // PWA banners
    installBannerMsg: '📲 Install this app on your phone for offline use',
    installBannerBtn: 'Install',
    iosHintMsg: '📲 iPhone: tap Share → Add to Home Screen to install',
    offlineMsg: '⚠️ You are offline — the app still works with previously loaded content',
  },
};

/* ═══════════════════════════════════════════════════════════
   DATA & CONSTANTS
═══════════════════════════════════════════════════════════ */

// Text colours darkened to Tailwind 700/600 shades so every text/bg pair
// clears WCAG AA (≥4.5:1); backgrounds kept unchanged to preserve the palette
// identity. Ratios verified against each `bg` (see REGLAS.md, sección I5).
// Las categorías POS que no vienen de TOKENS (noun, adjective, …) traen su par
// claro y su par oscuro; `pc` elige según el tema del SO para no quedar con
// tintes claros en modo oscuro (verb/modal/auxiliary/wh ya son dark-aware vía TOKENS).
const pc = (light, lbg, dark, dbg) => IS_DARK ? { color: dark, bg: dbg } : { color: light, bg: lbg };
const POS = {
  noun:         { ...pc('#B45309', '#FEF3C7', '#fbbf24', '#2e2410'), label: 'N',    name: 'Noun',         def: 'person, place, thing, or idea', ex: 'dog, city, love'           },
  verb:         { color: TOKENS.verb.color, bg: TOKENS.verb.bg, label: 'V',    name: 'Verb',         def: 'action or state',               ex: 'run, is, think'            },
  adjective:    { ...pc('#0E7490', '#CFFAFE', '#22d3ee', '#0e2a30'), label: 'ADJ',  name: 'Adjective',    def: 'describes a noun',              ex: 'big, happy, red'           },
  adverb:       { ...pc('#A16207', '#FEFCE8', '#fde047', '#2c2910'), label: 'ADV',  name: 'Adverb',       def: 'modifies verb or adjective',    ex: 'quickly, very, often'      },
  pronoun:      { ...pc('#A21CAF', '#FAE8FF', '#e879f9', '#2a1633'), label: 'PRO',  name: 'Pronoun',      def: 'replaces a noun',               ex: 'he, she, they, it'         },
  preposition:  { ...pc('#047857', '#ECFDF5', '#34d399', '#123024'), label: 'PREP', name: 'Preposition',  def: 'shows relationship',            ex: 'in, on, at, with'          },
  conjunction:  { ...pc('#1D4ED8', '#DBEAFE', '#60a5fa', '#1a2036'), label: 'CONJ', name: 'Conjunction',  def: 'connects clauses',              ex: 'and, but, because'         },
  determiner:   { ...pc('#475569', '#F1F5F9', '#94a3b8', '#1d2233'), label: 'DET',  name: 'Determiner',   def: 'specifies a noun',              ex: 'the, a, this, my, some'    },
  modal:        { color: TOKENS.modal.color, bg: TOKENS.modal.bg, label: 'MOD',  name: 'Modal',        def: 'ability / possibility',         ex: 'can, should, must, might'  },
  auxiliary:    { color: TOKENS.auxiliary.color, bg: TOKENS.auxiliary.bg, label: 'AUX',  name: 'Auxiliary',    def: 'helps the main verb',           ex: 'is, have, do, was'         },
  wh:            { color: TOKENS.wh.color, bg: TOKENS.wh.bg, label: 'WH',   name: 'Wh- Word',     def: 'introduces a question',         ex: 'what, where, when, why, how' },
  number:       { ...pc('#4B5563', '#F3F4F6', '#9ca3af', '#1f2430'), label: 'NUM',  name: 'Numeral',      def: 'expresses quantity or a number', ex: '2020, three, 42'           },
};

const POS_ORDER = [
  'noun', 'verb', 'adjective', 'adverb', 'pronoun', 'wh',
  'preposition', 'conjunction', 'determiner', 'number', 'modal', 'auxiliary',
];

// Text colours darkened for WCAG AA on their (unchanged) backgrounds — see POS above.
const STRUCTURE = {
  WH: { color: TOKENS.wh.color, bg: TOKENS.wh.bg, label: 'WH', name: 'Wh- Word',   def: 'introduces the question' },
  S:  { color: TOKENS.subject.color, bg: TOKENS.subject.bg, label: 'S',  name: 'Subject',    def: 'who or what does the action' },
  AUX:{ color: TOKENS.auxiliary.color, bg: TOKENS.auxiliary.bg, label: 'AUX', name: 'Auxiliary',  def: 'helps the main verb (bound to it)' },
  V:  { color: TOKENS.verb.color, bg: TOKENS.verb.bg, label: 'V',  name: 'Verb',       def: 'the action or state' },
  C:  { color: TOKENS.complement.color, bg: TOKENS.complement.bg, label: 'C',  name: 'Complement', def: 'everything else' },
  O:  { color: '#047857', bg: '#ECFDF5', label: 'O',  name: 'Object',     def: 'receives the action: what? / whom?' },
  A:  { color: TOKENS.adverb.color, bg: TOKENS.adverb.bg, label: 'A',  name: 'Adverbial',  def: 'when? / where? / how?' },
};

const LEVELS = {
  'Básico':          ['noun', 'verb', 'adjective', 'determiner', 'pronoun', 'wh', 'preposition', 'adverb', 'modal', 'auxiliary'],
  'Elemental':       ['noun', 'verb', 'adjective', 'determiner', 'pronoun', 'wh', 'preposition', 'adverb', 'modal', 'auxiliary'],
  'Intermedio':      ['noun', 'verb', 'adjective', 'determiner', 'pronoun', 'wh', 'preposition', 'adverb', 'modal', 'auxiliary', 'conjunction', 'number'],
  'Intermedio Alto': ['noun', 'verb', 'adjective', 'determiner', 'pronoun', 'wh', 'preposition', 'adverb', 'modal', 'auxiliary', 'conjunction', 'number'],
};

const EXAMPLES = [
  {
    label: 'Básico — Daily Life in Santiago',
    level: 'Básico',
    text: "My name is Valentina. I am a student at a university in Santiago. I live in a small apartment with my family. My brother is twenty years old. Every morning, I get up at seven o'clock and I go to class by bus. I like my classes because the teachers are very friendly. In the afternoon, I study at the library. I can speak Spanish and English.",
  },
  {
    label: 'Elemental — A Weekend in Valparaíso',
    level: 'Elemental',
    text: "Last weekend, my friend Diego and I visited Valparaíso. We took the bus early in the morning and arrived at ten o'clock. The city was more beautiful than I expected. We walked slowly through the colorful streets and took many photos. We also ate delicious seafood at a small restaurant near the port. In the evening, we were very tired but very happy.",
  },
  {
    label: 'Intermedio — Working from Home',
    level: 'Intermedio',
    text: "Working from home has become very common since 2020. Many people prefer it because they can organize their own schedule and avoid long commutes. However, it is not always easy. Some employees feel isolated when they work alone, and it can be difficult to separate work from personal life. If you are thinking about working from home, you should consider both the advantages and the disadvantages before you make a decision.",
  },
  {
    label: 'Intermedio Alto — Social Media and Society',
    level: 'Intermedio Alto',
    text: "Social media has transformed the way people communicate, but it has also created a number of serious problems. It is widely believed that excessive use of these platforms can contribute to anxiety, particularly among younger users. If governments had regulated social media companies earlier, some of these issues might have been avoided. Despite these challenges, social media continues to be used by billions of people worldwide.",
  },
];


/* ═══════════════════════════════════════════════════════════
   INFO TIP — accessible tooltip that works on hover AND tap (I6)
   The educational hints (phrasal verbs, formal subject, question
   inversion, locked categories) used to live only in `title=`, which is
   invisible on touch devices — and this is a mobile-first PWA. InfoTip
   shows the same text as a bubble on tap/focus, keeps the native `title`
   for desktop hover, and is keyboard-operable.
═══════════════════════════════════════════════════════════ */

function InfoTip({ content, children, wrapClassName = '', wrapStyle = {} }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onScroll = () => setOpen(false);
    document.addEventListener('pointerdown', onOutside);
    window.addEventListener('scroll', onScroll, { capture: true, once: true });
    return () => {
      document.removeEventListener('pointerdown', onOutside);
      window.removeEventListener('scroll', onScroll, { capture: true });
    };
  }, [open]);

  return (
    <span ref={ref} className={`relative inline-block ${wrapClassName}`} style={wrapStyle}>
      <span
        role="button"
        tabIndex={0}
        aria-label={content}
        aria-expanded={open}
        title={content}
        className="cursor-help select-none"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o); }
          else if (e.key === 'Escape') setOpen(false);
        }}
      >
        {children}
      </span>
      {open && (
        <span
          role="tooltip"
          className="absolute z-50 left-1/2 bottom-full mb-1.5 px-2.5 py-1.5 rounded-lg text-xs leading-snug text-white shadow-lg"
          style={{
            transform: 'translateX(-50%)',
            width: 'max-content',
            maxWidth: 220,
            whiteSpace: 'normal',
            background: '#1E293B',
          }}
        >
          {content}
          <span
            className="absolute left-1/2 top-full"
            style={{
              transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid #1E293B',
            }}
          />
        </span>
      )}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   WORD TOKEN (renders analyzed words with POS highlighting)
═══════════════════════════════════════════════════════════ */

function WordToken({ text, pos, isPunct, unlocked, showLabels, phrasalVerb, unrecognized, splitParts, lang = 'es' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.es;
  // Punctuation: plain unstyled text
  if (isPunct) {
    return <span className="text-slate-700">{text}</span>;
  }
  // Contraction split: render as two adjacent colored parts with original form above
  if (splitParts) {
    return (
      <span className="inline-flex flex-col items-center" style={{ verticalAlign: 'bottom' }}>
        <span className="text-slate-400 leading-none mb-0.5" style={{ fontSize: 9 }}>{text}</span>
        <span className="inline-flex items-end gap-0">
          {splitParts.map((part, idx) => {
            const cfg = POS[part.pos];
            const ok = unlocked.includes(part.pos);
            const bg  = ok ? cfg.bg    : NEUTRAL.lockBg;
            const col = ok ? cfg.color : NEUTRAL.lockText;
            return (
              <ruby key={idx} title={ok ? cfg.name : t.tipLocked}>
                <span
                  className="inline-block px-1.5 py-0.5 cursor-default"
                  style={{
                    background: bg, color: col, fontWeight: ok ? 500 : 400,
                    borderRadius: idx === 0 ? '4px 0 0 4px' : '0 4px 4px 0',
                    borderRight: idx === 0 ? `1px solid ${ok ? col + '55' : NEUTRAL.lockBorder}` : 'none',
                  }}
                >
                  {part.text}
                </span>
                {showLabels && ok && (
                  <rt style={{ fontSize: 9, color: col }}>{cfg.label}</rt>
                )}
              </ruby>
            );
          })}
        </span>
      </span>
    );
  }
  // Rule 11 Case 2 — unrecognized lowercase word
  if (unrecognized) {
    return (
      <span
        title={t.notRecognizedTip}
        className="inline-block px-1.5 py-0.5 rounded cursor-default"
        style={{
          background: NEUTRAL.surface,
          color: NEUTRAL.warnText,
          border: `2px dashed ${NEUTRAL.warnText}`,
        }}
      >
        {text}
      </span>
    );
  }
  // Unknown but not flagged (numbers/special chars) — plain text
  if (!pos) {
    return <span className="text-slate-700">{text}</span>;
  }

  const cfg = POS[pos];
  const ok = unlocked.includes(pos);
  const bg = ok ? cfg.bg : NEUTRAL.lockBg;
  const col = ok ? cfg.color : NEUTRAL.lockText;

  const ruby = (
    <ruby title={ok && !phrasalVerb ? cfg.name : undefined}>
      <span
        className="inline-block px-1.5 py-0.5 rounded cursor-default"
        style={{
          background: bg,
          color: col,
          fontWeight: ok ? 500 : 400,
        }}
      >
        {text}
      </span>
      {showLabels && ok && (
        <rt style={{ fontSize: 9, color: col }}>
          {cfg.label}
        </rt>
      )}
    </ruby>
  );

  // Educational hints get a tap/hover popover (I6); ordinary words keep the
  // lightweight native title so they don't all become interactive elements.
  if (phrasalVerb) {
    return <InfoTip content={t.tipPhrasal(phrasalVerb)}>{ruby}</InfoTip>;
  }
  if (!ok) {
    return <InfoTip content={t.tipLocked}>{ruby}</InfoTip>;
  }
  return ruby;
}

/* ═══════════════════════════════════════════════════════════
   MANUAL WORD PILL (clickable word for manual practice)
═══════════════════════════════════════════════════════════ */

function ManualWordPill({
  token,
  userTag,
  correctTag,
  isStructureMode,
  onClick,
  showAnswers,
  answerChecked,
  lang = 'es',
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.es;
  const { text, isPunct } = token;

  // Punctuation is not clickable
  if (isPunct) {
    return <span className="text-slate-700">{text}</span>;
  }

  // Unrecognized word — not clickable, shown with dashed red border
  if (token.unrecognized) {
    return (
      <span
        title={t.notRecognizedTip}
        className="inline-block px-2 py-1 rounded-lg cursor-not-allowed"
        style={{ background: NEUTRAL.surface, color: NEUTRAL.warnText, border: `2px dashed ${NEUTRAL.warnText}` }}
      >
        {text}
      </span>
    );
  }

  // Handle POS mode
  if (!isStructureMode) {
    const hasUserTag = !!userTag;
    // Tokens without a known correct answer are not graded (no ✗ / ? marks)
    const gradable = !!correctTag;
    // Phrasal verb particle: also correct if student tags it as 'verb'
    const isCorrect = answerChecked && gradable && (
      userTag === correctTag ||
      (token.isPhrasalParticle && userTag === 'verb')
    );
    const isIncorrect = answerChecked && gradable && userTag && !isCorrect;
    const isUntagged = answerChecked && gradable && !userTag;

    let bg = NEUTRAL.pillBg;
    let col = NEUTRAL.pillText;
    let borderColor = NEUTRAL.pillBorder;
    let indicator = '';

    if (showAnswers && correctTag) {
      const cfg = POS[correctTag];
      bg = cfg.bg;
      col = cfg.color;
      borderColor = cfg.color;
    } else if (hasUserTag) {
      const cfg = POS[userTag];
      bg = cfg.bg;
      col = cfg.color;
      borderColor = cfg.color;

      if (answerChecked) {
        if (isCorrect) {
          indicator = '✓';
          borderColor = '#10B981';
        } else if (isIncorrect) {
          indicator = '✗';
          borderColor = '#EF4444';
        }
      }
    } else if (isUntagged) {
      indicator = '?';
      borderColor = '#F59E0B';
    }

    return (
      <ruby title={
        showAnswers && correctTag
          ? (token.isPhrasalParticle ? t.tipPhrasalTagVerb(token.phrasalVerb) : POS[correctTag].name)
          : (isIncorrect && token.isPhrasalParticle ? t.tipPhrasalPart(token.text, token.phrasalVerb) : t.clickToTag)
      }>
        <span
          role="button"
          tabIndex={0}
          aria-pressed={hasUserTag}
          aria-label={`${text}${userTag ? ` — ${POS[userTag].name}` : ''}`}
          onClick={onClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
          className="inline-block px-2 py-1 rounded-lg cursor-pointer border-2 transition-all hover:shadow-sm relative focus:outline-none focus:ring-2 focus:ring-indigo-400 select-none"
          style={{
            background: bg,
            color: col,
            borderColor: borderColor,
            fontWeight: hasUserTag || showAnswers ? 600 : 400,
          }}
        >
          {indicator && (
            <span
              className="mr-1 font-bold"
              style={{
                color: isCorrect ? '#10B981' : isIncorrect ? '#EF4444' : '#F59E0B'
              }}
            >
              {indicator}
            </span>
          )}
          {text}
        </span>
        {showAnswers && correctTag && (
          <rt style={{ fontSize: 9, color: col, fontWeight: 800 }}>
            {POS[correctTag].label}
          </rt>
        )}
      </ruby>
    );
  }

  // Handle Structure mode
  const hasUserTag = !!userTag;
  // Tokens without a known correct answer are not graded (no ✗ / ? marks)
  const gradable = !!correctTag;
  const isCorrect = answerChecked && gradable && userTag === correctTag;
  const isIncorrect = answerChecked && gradable && userTag && userTag !== correctTag;
  const isUntagged = answerChecked && gradable && !userTag;

  // DUA: el texto de la palabra se lee siempre a alto contraste; el rol lo
  // comunica el subrayado de color (+ la etiqueta), no el color del texto.
  let underlineColor = 'transparent';
  let col = NEUTRAL.text;
  let indicator = '';

  if (showAnswers && correctTag) {
    underlineColor = STRUCTURE[correctTag].color;
  } else if (hasUserTag) {
    underlineColor = STRUCTURE[userTag].color;

    if (answerChecked) {
      if (isCorrect) {
        indicator = '✓';
      } else if (isIncorrect) {
        indicator = '✗';
        underlineColor = '#EF4444';
      }
    }
  } else if (isUntagged) {
    indicator = '?';
  }

  return (
    <span
      role="button"
      tabIndex={0}
      aria-pressed={hasUserTag}
      aria-label={`${text}${userTag ? ` — ${STRUCTURE[userTag].name}` : ''}`}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className="inline-block px-1.5 py-1 cursor-pointer transition-all hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded select-none"
      style={{
        color: col,
        borderBottom: `3px solid ${underlineColor}`,
        fontWeight: hasUserTag || showAnswers ? 600 : 400,
      }}
      title={showAnswers && correctTag ? STRUCTURE[correctTag].name : t.clickToTag}
    >
      {indicator && <span className="mr-1">{indicator}</span>}
      {text}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   STRUCTURE PALETTE (block type selector for Paint Structure)
═══════════════════════════════════════════════════════════ */

function StructurePalette({ level, selectedStructure, onSelectStructure, activeStruct, lang }) {
  const t = TRANSLATIONS[lang];
  const isBasic = level === 'Básico' || level === 'Elemental';
  const items = isBasic ? ['WH', 'S', 'AUX', 'V', 'A', 'C'] : ['WH', 'S', 'AUX', 'V', 'O', 'A'];
  const highlight = selectedStructure || activeStruct;

  return (
    <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-0.5 h-4 bg-indigo-600 rounded"></div>
        <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
          {isBasic ? 'Básico/Elemental' : 'Intermedio/Intermedio Alto'} — {t.paintStructure}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(key => {
          const s = STRUCTURE[key];
          const isSelected = highlight === key;
          return (
            <button
              key={key}
              onClick={() => onSelectStructure(key)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all cursor-pointer"
              style={{
                borderColor: isSelected ? s.color : 'transparent',
                background: isSelected ? s.bg + 'BB' : s.bg,
              }}
            >
              <div
                className="h-7 min-w-[1.75rem] px-1 rounded flex items-center justify-center text-xs font-extrabold"
                style={{ background: s.bg, color: s.color }}
              >
                {s.label}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-tight" style={{ color: s.color }}>
                  {s.name}
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">
                  {s.def}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {selectedStructure && (
        <div
          className="mt-3 p-2 rounded-lg font-bold text-xs flex items-center gap-2"
          style={{
            background: STRUCTURE[selectedStructure].bg,
            color: STRUCTURE[selectedStructure].color,
          }}
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: STRUCTURE[selectedStructure].color, color: 'white' }}
          >
            ●
          </div>
          {t.assigning}: {STRUCTURE[selectedStructure].name.toUpperCase()}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   QUESTION EDUCATIONAL MESSAGE
═══════════════════════════════════════════════════════════ */

function QuestionMessage({ text, lang = 'es' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.es;
  const q = t.q;
  return (
    <div className="mb-4 p-4 rounded-xl border-2 border-blue-300 bg-blue-50">
      <div className="flex items-start gap-3 mb-3">
        <div className="text-2xl">❓</div>
        <div>
          <div className="text-sm font-bold text-blue-900 mb-1">
            {q.title}
          </div>
          <div className="text-sm text-blue-800 italic mb-2">
            "{text}"
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-3 mb-3">
        <div className="text-xs font-bold text-blue-900 mb-2">
          {q.structureHeader}
        </div>
        <div className="text-xs text-blue-800 leading-relaxed">
          {q.structureBody}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Yes/No Questions */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3 border border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
              1
            </div>
            <div className="text-xs font-bold text-emerald-900">
              {q.yesNoTitle}
            </div>
          </div>
          <div className="text-xs text-emerald-800 mb-2">
            {q.yesNoDesc}
          </div>
          <div className="bg-white rounded p-2 mb-1">
            <div className="text-xs text-emerald-700 font-mono">
              <strong className="text-emerald-900">Do</strong> you like pizza?
            </div>
          </div>
          <div className="bg-white rounded p-2 mb-1">
            <div className="text-xs text-emerald-700 font-mono">
              <strong className="text-emerald-900">Is</strong> she a student?
            </div>
          </div>
          <div className="bg-white rounded p-2">
            <div className="text-xs text-emerald-700 font-mono">
              <strong className="text-emerald-900">Can</strong> you help me?
            </div>
          </div>
        </div>

        {/* Wh-Questions */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
              2
            </div>
            <div className="text-xs font-bold text-purple-900">
              {q.whTitle}
            </div>
          </div>
          <div className="text-xs text-purple-800 mb-2">
            {q.whDesc}
          </div>
          <div className="bg-white rounded p-2 mb-1">
            <div className="text-xs text-purple-700 font-mono">
              <strong className="text-purple-900">What</strong> do you want?
            </div>
          </div>
          <div className="bg-white rounded p-2 mb-1">
            <div className="text-xs text-purple-700 font-mono">
              <strong className="text-purple-900">Where</strong> is she going?
            </div>
          </div>
          <div className="bg-white rounded p-2">
            <div className="text-xs text-purple-700 font-mono">
              <strong className="text-purple-900">Why</strong> did they leave?
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2.5">
        <div className="flex items-start gap-2">
          <div className="text-sm">💡</div>
          <div className="text-xs text-yellow-900 leading-relaxed">
            <strong>{q.noteLabel}</strong> {q.noteBody}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STRUCTURE BLOCK COMPONENT
═══════════════════════════════════════════════════════════ */

function StructureBlock({ type, text, isAuxiliary, isMainVerb, formal, showLabels = true, lang = 'es' }) {
  const s = STRUCTURE[type];
  const t = TRANSLATIONS[lang] || TRANSLATIONS.es;

  // Render auxiliary verb (same as regular block, no special styling)
  if (isAuxiliary || isMainVerb) {
    return (
      <div
        className="block w-full md:w-auto md:inline-block px-3 py-2 rounded-lg mr-2 mb-2 border-2"
        style={{
          borderColor: s.color,
          background: s.bg,
        }}
      >
        <div className="flex items-center gap-2">
          {showLabels && (
            <div
              className="h-6 min-w-[1.5rem] px-1 rounded flex items-center justify-center text-xs font-extrabold flex-shrink-0"
              style={{ background: s.color, color: 'white' }}
            >
              {s.label}
            </div>
          )}
          <span className="text-sm" style={{ color: s.color }}>
            {type === 'AUX'
              ? text.split(/\s+/).map((w, i) => {
                  const bare = w.replace(/[.,;:!?]+$/, '').toLowerCase();
                  const isNeg = bare === 'not' || bare === "n't" || bare === 'n’t';
                  return <span key={i} style={isNeg ? { color: TOKENS.adverb.color } : undefined}>{i > 0 ? ' ' : ''}{w}</span>;
                })
              : text}
          </span>
        </div>
      </div>
    );
  }

  // Regular component (no special verb handling)
  return (
    <div
      className="block w-full md:w-auto md:inline-block px-3 py-2 rounded-lg mr-2 mb-2 border-2"
      style={{
        borderColor: s.color,
        background: s.bg,
      }}
    >
      <div className="flex items-center gap-2">
        {showLabels && (
          <div
            className="h-6 min-w-[1.5rem] px-1 rounded flex items-center justify-center text-xs font-extrabold flex-shrink-0"
            style={{ background: s.color, color: 'white' }}
          >
            {s.label}
          </div>
        )}
        <span className="text-sm" style={{ color: s.color }}>
          {formal ? (
            <InfoTip content={t.tipFormalSubject}>
              <span className="border-b border-dashed" style={{ borderColor: s.color }}>
                {text}*
              </span>
            </InfoTip>
          ) : text}
        </span>
      </div>
    </div>
  );
}

function ClauseRow({ components, isQuestion, showLabels = true, lang = 'es' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.es;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {components.map((comp, idx) =>
        comp.implied ? (
          <span key={idx} className="text-xs text-slate-400 italic px-1">
            [{comp.type}: ({comp.text})]
          </span>
        ) : (
          <StructureBlock
            key={idx}
            type={comp.type}
            text={comp.text}
            isAuxiliary={comp.isAuxiliary}
            isMainVerb={comp.isMainVerb}
            formal={comp.formal}
            showLabels={showLabels}
            lang={lang}
          />
        )
      )}
      {isQuestion && (
        <InfoTip content={t.tipQuestion} wrapClassName="ml-1">
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-sm"
            style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontSize: 12 }}
          >
            ?
          </span>
        </InfoTip>
      )}
    </div>
  );
}

function SentenceStructure({ sentence, showLabels = true, lang = 'es' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.es;
  const rows = sentence.rows || [{ components: sentence.components || [] }];
  const hasContent = rows.some(r => !r.isConjunction && r.components && r.components.length > 0);

  // Questions with no parseable content: still show QuestionMessage
  if (sentence.isQuestion && !hasContent) {
    return (
      <div className="mb-4 p-3 rounded-lg border border-blue-200 bg-blue-50">
        <div className="text-sm text-blue-700 italic mb-1">{sentence.text}</div>
        <div className="text-xs text-blue-600">❓ {t.questionNotAvailable}</div>
      </div>
    );
  }

  // Error with no content
  if (sentence.error && !hasContent) {
    return (
      <div className="mb-4 p-3 rounded-lg border-2 border-slate-300 bg-slate-50">
        <div className="text-sm text-slate-500 italic">{sentence.text}</div>
        <div className="mt-2 text-xs text-slate-400">⚠️ {sentence.error}</div>
      </div>
    );
  }

  const inner = (
    <div className="mb-4 p-3 rounded-lg border border-slate-200 bg-white">
      {sentence.isComplex && (
        <div className="mb-2 px-2 py-1 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800">
          ⚠️ {t.complexWarning}
        </div>
      )}
      <div className="flex flex-col gap-2">
        {rows.map((row, i) =>
          row.isConjunction ? (
            <div key={i} className="flex items-center gap-1 pl-1">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400 border border-slate-300 rounded px-1.5 py-0.5 bg-slate-50">
                {row.text}
              </span>
            </div>
          ) : (
            <ClauseRow key={i} components={row.components} isQuestion={sentence.isQuestion} showLabels={showLabels} lang={lang} />
          )
        )}
      </div>
      {sentence.hasEmbeddedClause && (
        <div className="mt-2 px-2 py-1.5 rounded bg-blue-50 border border-blue-200 text-xs text-blue-800">
          {t.embeddedNote}
        </div>
      )}
    </div>
  );

  if (sentence.isQuestion) {
    return inner;
  }

  return inner;
}

/* ═══════════════════════════════════════════════════════════
   ANALYSIS STATS BAR
═══════════════════════════════════════════════════════════ */

function AnalysisStats({ tokens, unlocked, lang = 'es' }) {
  const tr = TRANSLATIONS[lang] || TRANSLATIONS.es;
  const counts = {};
  tokens.forEach(t => {
    if (t.pos && !t.isPunct) counts[t.pos] = (counts[t.pos] || 0) + 1;
  });
  const wordCount = tokens.filter(t => !t.isPunct && t.text.trim()).length;
  const tagged = Object.values(counts).reduce((a, b) => a + b, 0);
  const unrecognizedCount = tokens.filter(t => t.unrecognized).length;

  return (
    <div className="mt-3.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-1.5 items-center">
      <span className="text-xs text-slate-600 font-semibold mr-0.5">
        {tagged}/{wordCount} {tr.wordsTagged}
      </span>
      {POS_ORDER
        .filter(k => counts[k] > 0)
        .map(key => {
          const p = POS[key];
          const ok = unlocked.includes(key);
          return (
            <span
              key={key}
              className="px-2.5 py-1 rounded-full text-xs font-bold border"
              style={{
                background: ok ? p.bg : NEUTRAL.lockBg,
                color: ok ? p.color : NEUTRAL.lockText,
                borderColor: ok ? p.color + '33' : NEUTRAL.lockBorder,
              }}
            >
              {p.label} × {counts[key]}
            </span>
          );
        })
      }
      {unrecognizedCount > 0 && (
        <span
          className="px-2.5 py-1 rounded-full text-xs font-bold border"
          style={{ background: NEUTRAL.warnBg, color: NEUTRAL.warnText, borderColor: NEUTRAL.warnBorder }}
        >
          ⚠️ {tr.notRecognizedStat(unrecognizedCount)}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LEGEND ITEM
═══════════════════════════════════════════════════════════ */

function LegendItem({ posKey, unlocked, isManual, isSelected, onSelect }) {
  const p = POS[posKey];
  const clickable = isManual && unlocked;

  // Only interactive (keyboard-focusable, toggle role) when it can be selected
  const interactiveProps = clickable
    ? {
        role: 'button',
        tabIndex: 0,
        'aria-pressed': isSelected,
        'aria-label': `${p.name} — ${p.def}`,
        onClick: () => onSelect(posKey),
        onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(posKey); } },
      }
    : {};

  return (
    <div
      {...interactiveProps}
      className={`flex items-start gap-2.5 p-2 rounded-lg border-2 transition-all ${
        isSelected ? 'border-current' : 'border-transparent'
      } ${unlocked ? 'opacity-100' : 'opacity-40'} ${clickable ? 'cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-indigo-400' : 'cursor-default'}`}
      style={{
        borderColor: isSelected ? p.color : 'transparent',
        background: isSelected ? p.bg + 'BB' : 'transparent',
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-extrabold mt-0.5"
        style={{
          background: unlocked ? p.bg : NEUTRAL.lockBg,
          color: unlocked ? p.color : NEUTRAL.lockText,
        }}
      >
        {unlocked ? p.label : '🔒'}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold leading-tight" style={{ color: unlocked ? p.color : '#94A3B8' }}>
          {p.name}
        </div>
        <div className="text-xs text-slate-600 mt-0.5 leading-snug">
          {p.def}{' '}
          <span className="italic text-slate-400">({p.ex})</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STRUCTURE LEGEND
═══════════════════════════════════════════════════════════ */

function StructureLegend({ level, lang }) {
  const t = TRANSLATIONS[lang];
  const isBasic = level === 'Básico' || level === 'Elemental';
  const items = isBasic
    ? ['WH', 'S', 'AUX', 'V', 'A', 'C']
    : ['WH', 'S', 'AUX', 'V', 'O', 'A'];

  return (
    <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-0.5 h-4 bg-indigo-600 rounded"></div>
        <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
          {t.sentenceStructure}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {items.map(key => {
          const s = STRUCTURE[key];
          return (
            <div key={key} className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-extrabold flex-shrink-0"
                style={{ background: s.bg, color: s.color }}
              >
                {s.label}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold leading-tight mb-0.5" style={{ color: s.color }}>
                  {s.name}
                </div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  {t.structureDef[key]}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SIDEBAR (desktop)
═══════════════════════════════════════════════════════════ */

function Sidebar({
  level,
  unlocked,
  isManual,
  manualView,
  selectedPos,
  onSelectPos,
  selectedStructure,
  onSelectStructure,
  activePos,
  activeStruct,
  autoView,
  lang,
}) {
  const t = TRANSLATIONS[lang];
  // Legend highlight: the palette selection if any, else the last-touched
  // word's category (so its name is visible even when colours look similar).
  const highlightPos = selectedPos || activePos;

  // In manual mode, show either POS legend or Structure palette based on manualView
  // In auto mode, show only the corresponding legend based on autoView
  const showPOSLegend = isManual
    ? manualView === 'pos'
    : (autoView === 'pos' || autoView === 'both');

  const showStructurePalette = isManual && manualView === 'structure';

  const showStructureLegend = isManual
    ? false
    : (autoView === 'structure' || autoView === 'both');

  return (
    <aside className="hidden md:flex flex-col bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0 w-64">
      <div className="p-4 pb-5">
        {showStructureLegend && <StructureLegend level={level} lang={lang} />}

        {showPOSLegend && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-0.5 h-4 bg-indigo-600 rounded"></div>
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                {t.partsOfSpeech}
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-3.5 ml-2.5">
              {isManual ? t.clickToSelect : t.colorReference}
            </p>

            <div className="flex flex-col gap-0.5">
              {POS_ORDER.map(key => (
                <LegendItem
                  key={key}
                  posKey={key}
                  unlocked={unlocked.includes(key)}
                  isManual={isManual}
                  isSelected={highlightPos === key}
                  onSelect={onSelectPos}
                />
              ))}
            </div>

            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-700">{unlocked.length}</span>
              {' '}{t.categoriesUnlocked.replace('{total}', POS_ORDER.length)}
              {isManual && selectedPos && (
                <div
                  className="mt-2 p-2 rounded-lg font-bold text-xs"
                  style={{
                    background: POS[selectedPos].bg,
                    color: POS[selectedPos].color,
                  }}
                >
                  ✏️ {t.painting}: {POS[selectedPos].name}
                </div>
              )}
              {isManual && !selectedPos && (
                <div className="mt-1.5 text-indigo-600 font-semibold">
                  ↑ {t.selectCategory}
                </div>
              )}
            </div>
          </>
        )}

        {showStructurePalette && (
          <StructurePalette
            level={level}
            selectedStructure={selectedStructure}
            onSelectStructure={onSelectStructure}
            activeStruct={activeStruct}
            lang={lang}
          />
        )}
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════
   MOBILE LEGEND BAR (bottom)
═══════════════════════════════════════════════════════════ */

function MobileBar({
  unlocked,
  isManual,
  manualView,
  autoView,
  selectedPos,
  onSelectPos,
  selectedStructure,
  onSelectStructure,
  activePos,
  activeStruct,
  level,
  lang,
}) {
  const t = TRANSLATIONS[lang];
  // Highlight the palette selection, or the last-touched word's category
  const highlightPos = selectedPos || activePos;
  const highlightStruct = selectedStructure || activeStruct;
  const isBoth = !isManual && autoView === 'both';
  const [bothTab, setBothTab] = useState('structure');
  const [showScrollHint, setShowScrollHint] = useState(
    () => localStorage.getItem('legendScrolled') !== '1'
  );
  const handleLegendScroll = () => {
    if (showScrollHint) {
      localStorage.setItem('legendScrolled', '1');
      setShowScrollHint(false);
    }
  };

  const showStructure = (isManual && manualView === 'structure')
    || (!isManual && (autoView === 'structure' || (isBoth && bothTab === 'structure')));

  if (showStructure) {
    const isBasic = level === 'Básico' || level === 'Elemental';
    const items = isBasic ? ['WH', 'S', 'AUX', 'V', 'A', 'C'] : ['WH', 'S', 'AUX', 'V', 'O', 'A'];

    return (
      <div className="md:hidden flex-shrink-0 bg-white border-t border-gray-200 z-30 shadow-[0_-2px_14px_rgba(0,0,0,0.08)]">
        {isBoth && (
          <div className="flex bg-slate-100 rounded-lg p-0.5 mx-3 mt-1.5 gap-0.5">
            <button onClick={() => setBothTab('structure')} className={`flex-1 py-1 rounded text-xs font-bold transition-all ${bothTab === 'structure' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>{t.sentenceStructure}</button>
            <button onClick={() => setBothTab('pos')} className={`flex-1 py-1 rounded text-xs font-bold transition-all ${bothTab === 'pos' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>{t.partsOfSpeech}</button>
          </div>
        )}
        {!isBoth && (
          <div className="px-3 pt-1.5 text-xs font-semibold text-slate-400 tracking-wide">
            {isManual ? t.structureModeMobile : t.sentenceStructure.toUpperCase()}
          </div>
        )}
        <div className="relative">
          <div className="flex gap-1.5 px-3 pt-1.5 pb-2.5 overflow-x-auto" onScroll={handleLegendScroll}>
            {items.map(key => {
              const s = STRUCTURE[key];
              const sel = highlightStruct === key;
              return (
                <button
                  key={key}
                  onClick={() => isManual && onSelectStructure(key)}
                  className="flex-shrink-0 flex flex-col items-center py-1.5 px-2.5 rounded-xl border-2 transition-all min-w-[50px]"
                  style={{
                    background: s.bg,
                    color: s.color,
                    borderColor: sel ? s.color : 'transparent',
                    cursor: isManual ? 'pointer' : 'default',
                  }}
                >
                  <span className="font-extrabold text-xs">{s.label}</span>
                  <span className="text-[9px] mt-0.5">{s.name}</span>
                </button>
              );
            })}
          </div>
          <div className="absolute top-0 right-0 h-full w-10 pointer-events-none" style={{background:`linear-gradient(to right, transparent, ${NEUTRAL.fade})`}} />
        </div>
        {showScrollHint && (
          <p className="text-xs text-gray-400 text-center mt-0.5 pb-1">{t.scrollHint}</p>
        )}
      </div>
    );
  }

  return (
    <div className="md:hidden flex-shrink-0 bg-white border-t border-gray-200 z-30 shadow-[0_-2px_14px_rgba(0,0,0,0.08)]">
      {isBoth && (
        <div className="flex bg-slate-100 rounded-lg p-0.5 mx-3 mt-1.5 gap-0.5">
          <button onClick={() => setBothTab('structure')} className={`flex-1 py-1 rounded text-xs font-bold transition-all ${bothTab === 'structure' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>{t.sentenceStructure}</button>
          <button onClick={() => setBothTab('pos')} className={`flex-1 py-1 rounded text-xs font-bold transition-all ${bothTab === 'pos' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>{t.partsOfSpeech}</button>
        </div>
      )}
      {!isBoth && (
        <div className="px-3 pt-1.5 text-xs font-semibold text-slate-400 tracking-wide">
          {isManual ? t.paintModeMobile : t.partsOfSpeech.toUpperCase()}
        </div>
      )}
      <div className="relative">
        <div className="flex gap-1.5 px-3 pt-1.5 pb-2.5 overflow-x-auto" onScroll={handleLegendScroll}>
          {POS_ORDER.map(key => {
            const p = POS[key];
            const ok = unlocked.includes(key);
            const sel = highlightPos === key;
            return (
              <button
                key={key}
                onClick={() => ok && isManual && onSelectPos(key)}
                className="flex-shrink-0 flex flex-col items-center py-1.5 px-2.5 rounded-xl border-2 transition-all min-w-[50px]"
                style={{
                  background: ok ? p.bg : NEUTRAL.lockBg,
                  color: ok ? p.color : NEUTRAL.lockText,
                  borderColor: sel ? p.color : 'transparent',
                  cursor: ok && isManual ? 'pointer' : 'default',
                  opacity: ok ? 1 : 0.5,
                }}
              >
                <span className="font-extrabold text-xs">{ok ? p.label : '🔒'}</span>
                <span className="text-[9px] mt-0.5">{p.name}</span>
              </button>
            );
          })}
        </div>
        <div className="absolute top-0 right-0 h-full w-10 pointer-events-none" style={{background:`linear-gradient(to right, transparent, ${NEUTRAL.fade})`}} />
      </div>
      {showScrollHint && (
        <p className="text-xs text-gray-400 text-center mt-0.5 pb-1">{t.scrollHint}</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   APP
═══════════════════════════════════════════════════════════ */

function App() {
  const [lang, setLang] = useState('es'); // 'es' | 'en'
  const [fromHub, setFromHub] = useState(() => window.self !== window.top);
  const [level, setLevel] = useState('Básico');
  const [mode, setMode] = useState('auto');
  const [autoView, setAutoView] = useState('structure'); // 'pos' | 'structure' | 'both'
  const [manualView, setManualView] = useState('structure'); // 'pos' | 'structure'
  const [text, setText] = useState(() => new URLSearchParams(window.location.search).get('texto') || '');
  const [selectedPos, setSelectedPos] = useState(null);
  const [selectedStructure, setSelectedStructure] = useState(null); // 'S' | 'V' | 'C' | 'O' | 'A'
  // Category of the last word touched in practice — highlighted in the legend
  // so the student can read its name (colours alone can look similar).
  const [activePos, setActivePos] = useState(null);
  const [activeStruct, setActiveStruct] = useState(null);
  const [showLabels, setShowLabels] = useState(true);

  const t = TRANSLATIONS[lang];
  // Auto-analysis state
  const [tokens, setTokens] = useState([]);
  const [structureData, setStructureData] = useState([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [nlpError, setNlpError] = useState(null);
  // Manual practice state
  const [manualTokens, setManualTokens] = useState([]);
  const [userPOSTags, setUserPOSTags] = useState({}); // { tokenId: 'noun' | 'verb' | ... }
  const [userStructureTags, setUserStructureTags] = useState({}); // { tokenId: 'S' | 'V' | 'C' | 'O' | 'A' }
  const [showAnswers, setShowAnswers] = useState(false);
  const [answerChecked, setAnswerChecked] = useState(false);
  const [badgeToasts, setBadgeToasts] = useState([]);   // gamificación de suite
  const [highlightTextarea, setHighlightTextarea] = useState(false);
  const [bannerExpanded, setBannerExpanded] = useState(false);

  const unlocked = LEVELS[level];
  const isManual = mode === 'manual';
  const showStructure = mode === 'auto' && (autoView === 'structure' || autoView === 'both');
  const canAnalyze = !!text.trim();

  const switchMode = m => {
    setMode(m);
    setSelectedPos(null);
    setSelectedStructure(null);
    setActivePos(null);
    setActiveStruct(null);
    // Clear auto-analysis when switching modes
    setAnalyzed(false);
    setTokens([]);
    setStructureData([]);
    setManualTokens([]);
    setUserPOSTags({});
    setUserStructureTags({});
    setShowAnswers(false);
    setAnswerChecked(false);
    setNlpError(null);
  };

  const togglePos = k => setSelectedPos(p => (p === k ? null : k));
  const toggleStructure = k => setSelectedStructure(s => (s === k ? null : k));

  const handleTextChange = e => {
    setText(e.target.value);
    // Mark as dirty so the output area reverts to placeholder
    if (analyzed) {
      setAnalyzed(false);
      setTokens([]);
      setStructureData([]);
    }
    setNlpError(null);
  };

  const loadExample = e => {
    if (e.target.value !== '') {
      const example = EXAMPLES[+e.target.value];
      setText(example.text);
      setLevel(example.level);
      setAnalyzed(false);
      setTokens([]);
      setStructureData([]);
      setNlpError(null);

      // Trigger yellow highlight animation
      setHighlightTextarea(true);
      setTimeout(() => setHighlightTextarea(false), 600);
    }
    e.target.value = '';
  };

  // Gamificación de suite: cuenta el análisis en gh_progress + toasts de logro
  const recordGameAnalysis = () => {
    try {
      const p = loadProgress(window.localStorage);
      recordAnalysis(p, { app: 'desgramatizador' });
      const { newly } = evaluateBadges(p, BADGES);
      saveProgress(window.localStorage, p);
      if (newly.length) setBadgeToasts(prev => [...prev, ...newly]);
    } catch (e) {}
  };
  useEffect(() => {
    if (!badgeToasts.length) return;
    const timer = setTimeout(() => setBadgeToasts(prev => prev.slice(1)), 3800);
    return () => clearTimeout(timer);
  }, [badgeToasts]);

  // Práctica calificada → cuenta como intento en el progreso compartido
  const recordGamePractice = (correct) => {
    try {
      const p = loadProgress(window.localStorage);
      recordAttempt(p, { app: 'desgramatizador', correct });
      const { newly } = evaluateBadges(p, BADGES);
      saveProgress(window.localStorage, p);
      if (newly.length) setBadgeToasts(prev => [...prev, ...newly]);
    } catch (e) {}
  };

  // Centrar la vista en el análisis al generarlo (queda escondido en móvil)
  const analysisRef = useRef(null);
  const [analysisTick, setAnalysisTick] = useState(0);
  useEffect(() => {
    if (!analysisTick || !analysisRef.current) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    analysisRef.current.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [analysisTick]);

  const handleAnalyze = () => {
    if (!canAnalyze) return;
    setNlpError(null);
    try {
      // Run POS tokenization if showing POS or both
      if (autoView === 'pos' || autoView === 'both') {
        const result = tokenizeText(text, level);
        setTokens(result);
      }

      // Run structure analysis if showing structure or both
      if (autoView === 'structure' || autoView === 'both') {
        const structure = analyzeStructure(text, level);
        setStructureData(structure);
      }

      setAnalyzed(true);
      recordGameAnalysis();
      setAnalysisTick(t => t + 1);   // dispara el scroll al análisis
    } catch (err) {
      console.error('NLP analysis error:', err);
      setNlpError('Analysis failed. Please check your text and try again.');
      setAnalyzed(false);
    }
  };

  /* ══════════════════════════════════════════════════════════
     MANUAL PRACTICE HANDLERS
  ══════════════════════════════════════════════════════════ */

  const handlePrepareManual = () => {
    if (!canAnalyze) return;
    setNlpError(null);
    try {
      // Tokenize the text
      const result = tokenizeText(text, level);
      setManualTokens(result);
      // Clear previous user tags and answers
      setUserPOSTags({});
      setUserStructureTags({});
      setActivePos(null);
      setActiveStruct(null);
      setShowAnswers(false);
      setAnswerChecked(false);
      setAnalyzed(true);

      // Also run structure analysis for structure mode answer checking
      try {
        const structResult = analyzeStructure(text, level);
        setStructureData(structResult);
      } catch (structErr) {
        console.error('Structure analysis error:', structErr);
        // Don't fail the whole preparation if structure analysis fails
      }
    } catch (err) {
      console.error('Tokenization error:', err);
      setNlpError('Failed to prepare text. Please try again.');
    }
  };

  // Next tag when cycling through a category list: none → 1 → 2 → … → N → none
  const nextInCycle = (current, list) => {
    if (!current) return list[0];
    const i = list.indexOf(current);
    if (i === -1) return list[0];
    return i + 1 < list.length ? list[i + 1] : null; // wrap back to unset
  };

  // Set or clear a token's tag inside a state updater (null clears)
  const applyTag = (prev, tokenId, tag) => {
    if (!tag) { const updated = { ...prev }; delete updated[tokenId]; return updated; }
    return { ...prev, [tokenId]: tag };
  };

  const handleWordClick = (tokenId) => {
    if (manualView === 'pos') {
      // With a palette category selected → paint it (toggle off if same).
      // With nothing selected → cycle through the level's unlocked categories.
      const current = userPOSTags[tokenId];
      const applied = selectedPos
        ? (current === selectedPos ? null : selectedPos)
        : nextInCycle(current, POS_ORDER.filter(k => unlocked.includes(k)));
      setUserPOSTags(prev => applyTag(prev, tokenId, applied));
      setActivePos(applied);
    } else if (manualView === 'structure') {
      const isBasic = level === 'Básico' || level === 'Elemental';
      const cycle = isBasic ? ['WH', 'S', 'AUX', 'V', 'A', 'C'] : ['WH', 'S', 'AUX', 'V', 'O', 'A'];
      const current = userStructureTags[tokenId];
      const applied = selectedStructure
        ? (current === selectedStructure ? null : selectedStructure)
        : nextInCycle(current, cycle);
      setUserStructureTags(prev => applyTag(prev, tokenId, applied));
      setActiveStruct(applied);
    }
  };

  const handleCheckAnswers = () => {
    if (!canAnalyze || manualTokens.length === 0) return;
    if (!answerChecked) {              // una vez por ronda (se resetea al limpiar/preparar)
      const s = calculateScore();
      recordGamePractice(s.total > 0 && s.correct === s.total);
    }
    setAnswerChecked(true);
  };

  const handleClearAll = () => {
    if (manualView === 'pos') {
      setUserPOSTags({});
      setActivePos(null);
    } else if (manualView === 'structure') {
      setUserStructureTags({});
      setActiveStruct(null);
    }
    setShowAnswers(false);
    setAnswerChecked(false);
  };

  const handleShowAnswers = () => {
    setShowAnswers(true);
  };

  // Token → structure block map, aligned token-by-token across all sentences
  const structureAnswerMap = useMemo(
    () => buildStructureAnswerMap(manualTokens, structureData),
    [manualTokens, structureData]
  );

  // Get correct answer for a token
  const getCorrectAnswer = (token, mode) => {
    if (mode === 'pos') {
      return token.pos; // The POS tag from tokenizeText
    } else if (mode === 'structure') {
      return structureAnswerMap[token.id] || null;
    }
    return null;
  };

  // Calculate score for manual practice.
  // Only words with a known correct answer count toward the total, so
  // conjunctions between clauses / unrecognized words don't penalize.
  const calculateScore = () => {
    if (manualTokens.length === 0) return { correct: 0, total: 0 };

    const words = manualTokens.filter(t => !t.isPunct);
    let total = 0;
    let correct = 0;

    if (manualView === 'pos') {
      words.forEach(token => {
        if (!token.pos) return;
        total++;
        if (userPOSTags[token.id] === token.pos) correct++;
      });
    } else if (manualView === 'structure') {
      words.forEach(token => {
        const correctTag = getCorrectAnswer(token, 'structure');
        if (!correctTag) return;
        total++;
        if (userStructureTags[token.id] === correctTag) correct++;
      });
    }

    return { correct, total };
  };

  const score = isManual && manualTokens.length > 0 ? calculateScore() : { correct: 0, total: 0 };

  // ── PWA install prompt ────────────────────────────────────────────────────
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Grammar HUB: escuchar cambio de idioma y nivel vía postMessage
  useEffect(() => {
    const levelMap = {
      basico1: 'Básico', basico2: 'Básico',
      elemental1: 'Elemental', elemental2: 'Elemental',
      intermedio1: 'Intermedio', intermedio2: 'Intermedio',
      avanzado: 'Intermedio Alto',
    };
    const handler = (e) => {
      if (e.data?.type === 'GRAMMAR_HUB_LANG' && (e.data.lang === 'es' || e.data.lang === 'en')) {
        setLang(e.data.lang);
        setFromHub(true);
      }
      if (e.data?.type === 'GRAMMAR_HUB_LEVEL' && levelMap[e.data.level]) {
        setLevel(levelMap[e.data.level]);
        setFromHub(true);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    // userAgent is fixed for the session, so this is effect-local (no dependency)
    const isMobileDevice = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    const onBeforeInstall = e => {
      e.preventDefault();
      if (!isMobileDevice) return;
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setShowInstallBanner(false);
  };

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const [showIOSHint, setShowIOSHint] = useState(isIOS && !isStandalone);

  return (
    <div className="flex flex-col h-screen bg-[#f5f6fb]">
      {badgeToasts.length > 0 && (
        <div className="fixed left-0 right-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none" aria-live="polite">
          {badgeToasts.map((key, i) => {
            const ci = key.indexOf(':'); const bid = ci < 0 ? key : key.slice(0, ci); const tid = ci < 0 ? '' : key.slice(ci + 1);
            const b = BADGES.find(x => x.id === bid); if (!b) return null;
            const name = (lang === 'es' ? b.name.es : b.name.en).replace('{tense}', tid);
            return (
              <div key={key + i} role="status" className="gtoast-in pointer-events-auto flex items-center gap-2.5 max-w-sm px-3.5 py-2.5 rounded-xl text-white shadow-lg bg-gradient-to-br from-rose-500 to-amber-400">
                <span className="text-2xl leading-none">{b.icon}</span>
                <span className="flex flex-col leading-tight">
                  <b className="text-[0.68rem] uppercase tracking-wide opacity-90 font-extrabold">{lang === 'es' ? '¡Logro!' : 'Achievement!'}</b>
                  <span className="text-sm font-semibold">{name}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
      {/* ── PWA: Android install banner ── */}
      {showInstallBanner && (
        <div className="flex-shrink-0 bg-indigo-600 text-white px-4 py-2 flex items-center justify-between text-sm z-50">
          <span>{t.installBannerMsg}</span>
          <div className="flex gap-2">
            <button onClick={handleInstall} className="bg-white text-indigo-600 px-3 py-1 rounded font-medium">{t.installBannerBtn}</button>
            <button onClick={() => setShowInstallBanner(false)} className="text-white opacity-70 px-2">✕</button>
          </div>
        </div>
      )}
      {/* ── PWA: iOS Safari hint ── */}
      {showIOSHint && (
        <div className="flex-shrink-0 bg-indigo-50 border-b border-indigo-200 text-indigo-800 px-4 py-2 text-sm flex items-center justify-between z-50">
          <span>{t.iosHintMsg}</span>
          <button onClick={() => setShowIOSHint(false)} className="ml-2 opacity-60">✕</button>
        </div>
      )}
      {/* ── Offline indicator ── */}
      {!isOnline && (
        <div className="flex-shrink-0 bg-amber-50 border-b border-amber-300 text-amber-800 px-4 py-2 text-sm text-center z-50">
          {t.offlineMsg}
        </div>
      )}
      {/* ══ HEADER ══════════════════════════════════════════ */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm z-10 px-4 pt-3 pb-2.5">
        {/* Row 1: logo + title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}web-app-manifest-192x192.png`}
              alt="DesGramatizador"
              className="w-11 h-11 md:w-9 md:h-9 rounded-[22%] flex-shrink-0"
            />
            <div>
              <div className="text-lg md:text-base font-bold text-slate-800 leading-tight">
                {t.appTitle}
              </div>
              <div className="text-xs text-slate-400">{t.appSubtitle}</div>
            </div>
          </div>

          {/* Controls: inline on md+, hidden on mobile */}
          {!fromHub && (
            <div className="hidden md:flex items-center gap-1.5">
              <select value={level} onChange={e => setLevel(e.target.value)} className="px-1.5 py-1 border border-slate-200 rounded-lg text-xs font-medium text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer" title={t.levelLabel}>
                {['Básico', 'Elemental', 'Intermedio', 'Intermedio Alto'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <div className="flex bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                <button onClick={() => setLang('es')} className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${lang === 'es' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} title="Español">ES</button>
                <button onClick={() => setLang('en')} className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${lang === 'en' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} title="English">EN</button>
              </div>
            </div>
          )}
        </div>

        {/* Row 2: controls on mobile only */}
        {!fromHub && (
          <div className="flex md:hidden items-center justify-end gap-1.5 mt-2">
            <select value={level} onChange={e => setLevel(e.target.value)} className="px-1.5 py-1 border border-slate-200 rounded-lg text-xs font-medium text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer" title={t.levelLabel}>
              {['Básico', 'Elemental', 'Intermedio', 'Intermedio Alto'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <div className="flex bg-slate-100 border border-slate-200 rounded-lg p-0.5">
              <button onClick={() => setLang('es')} className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${lang === 'es' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} title="Español">ES</button>
              <button onClick={() => setLang('en')} className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${lang === 'en' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} title="English">EN</button>
            </div>
          </div>
        )}
      </header>

      {/* ══ BODY ════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          level={level}
          unlocked={unlocked}
          isManual={isManual}
          manualView={manualView}
          selectedPos={selectedPos}
          onSelectPos={togglePos}
          selectedStructure={selectedStructure}
          onSelectStructure={toggleStructure}
          activePos={activePos}
          activeStruct={activeStruct}
          showStructure={showStructure}
          autoView={autoView}
          lang={lang}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 pt-5 pb-6 md:px-6 md:pt-6 md:pb-10">
            {/* ── Top controls row ── */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
              {/* Mode toggle */}
              <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
                {[
                  { key: 'auto', icon: '⚡', label: t.autoAnalysis },
                  { key: 'manual', icon: '✏️', label: t.manualPractice },
                ].map(({ key, icon, label }) => {
                  const active = mode === key;
                  return (
                    <button
                      key={key}
                      onClick={() => switchMode(key)}
                      className={`px-4 py-2 rounded-lg border-none text-sm transition-all ${
                        active
                          ? 'bg-white text-indigo-600 shadow-md font-semibold'
                          : 'bg-transparent text-gray-500 font-medium'
                      }`}
                    >
                      {icon} {label}
                    </button>
                  );
                })}
              </div>

              {/* Example loader */}
              <select
                onChange={loadExample}
                defaultValue=""
                className="text-xs bg-white border border-slate-200 text-slate-600 rounded-lg px-3 py-1.5 cursor-pointer outline-none"
              >
                <option value="" disabled>{t.loadExample}</option>
                {EXAMPLES.map((ex, i) => (
                  <option key={i} value={i}>{ex.label}</option>
                ))}
              </select>
            </div>

            {/* ── Secondary toggle (Auto mode only) ── */}
            {!isManual && (
              <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5 mb-4 max-w-md">
                {[
                  { key: 'structure', label: t.showStructure },
                  { key: 'pos', label: t.showPOS },
                  { key: 'both', label: t.showBoth },
                ].map(({ key, label }) => {
                  const active = autoView === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setAutoView(key)}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        active
                          ? 'bg-white text-indigo-800 shadow-sm font-bold'
                          : 'bg-transparent text-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Manual Practice sub-mode toggle ── */}
            {isManual && (
              <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5 mb-4 max-w-xs">
                {[
                  { key: 'structure', label: t.paintStructure },
                  { key: 'pos', label: t.paintPOS },
                ].map(({ key, label }) => {
                  const active = manualView === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setManualView(key);
                        setSelectedPos(null);
                        setSelectedStructure(null);
                        setActivePos(null);
                        setActiveStruct(null);
                        setShowAnswers(false);
                        setAnswerChecked(false);
                      }}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        active
                          ? 'bg-white text-indigo-800 shadow-sm font-bold'
                          : 'bg-transparent text-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Hint banner ── */}
            {(() => {
              const bannerColor = isManual
                ? 'bg-orange-50 border-orange-200 text-orange-900'
                : 'bg-blue-50 border-blue-200 text-blue-900';
              const bannerIcon = isManual ? '✏️' : '⚡';
              const bannerTitle = isManual ? t.manualPractice : t.autoAnalysis;
              const bannerFull = isManual
                ? `${manualView === 'pos' ? t.hintManualPOS : t.hintManualStructure} ${t.hintCheckAnswers}`
                : t.hintAutoAnalysis;
              return (
                <>
                  {/* Mobile: collapsible */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={bannerExpanded}
                    className={`md:hidden border rounded-xl px-3.5 py-2.5 mb-4 text-xs leading-relaxed cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-indigo-400 ${bannerColor}`}
                    onClick={() => setBannerExpanded(v => !v)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setBannerExpanded(v => !v); } }}
                  >
                    <div className="flex items-center justify-between">
                      <span><strong>{bannerIcon} {bannerTitle}</strong> — {bannerExpanded ? t.bannerHide : t.bannerShow}</span>
                      <span className={`ml-2 transition-transform duration-200 ${bannerExpanded ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                    {bannerExpanded && (
                      <div className="mt-2">{bannerFull}</div>
                    )}
                  </div>
                  {/* Desktop: always expanded */}
                  <div className={`hidden md:block border rounded-xl px-3.5 py-2.5 mb-4 text-xs leading-relaxed ${bannerColor}`}>
                    <strong>{bannerIcon} {bannerTitle}:</strong> {bannerFull}
                  </div>
                </>
              );
            })()}

            {/* ── Text input card ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold text-slate-700">{t.englishText}</label>
                  {/* "Analyzed" badge */}
                  {analyzed && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                      ✓ {t.analyzed}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">{text.length} {t.charsCount}</span>
              </div>
              <textarea
                value={text}
                onChange={handleTextChange}
                placeholder={t.textPlaceholder}
                rows={4}
                className={`w-full rounded-xl border-[1.5px] border-slate-200 bg-slate-50 px-3.5 py-3 text-base leading-relaxed text-slate-800 resize-vertical focus:border-indigo-400 transition-colors ${highlightTextarea ? 'highlight-flash' : ''}`}
              />
            </div>

            {/* ── Action buttons ── */}
            <div className="flex flex-wrap items-center gap-2.5 mb-5">
              {!isManual ? (
                <>
                  <button
                    disabled={!canAnalyze}
                    onClick={handleAnalyze}
                    className={`px-8 py-3 rounded-xl text-sm font-semibold text-white shadow-md transition-all ${
                      canAnalyze
                        ? 'bg-indigo-600 cursor-pointer hover:bg-indigo-700'
                        : 'bg-indigo-300 cursor-not-allowed'
                    }`}
                  >
                    {analyzed ? t.reanalyze : t.analyze}
                  </button>

                  {/* Show / Hide Labels toggle */}
                  <button
                    onClick={() => setShowLabels(v => !v)}
                    className="px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-600 text-sm font-medium transition-all hover:bg-gray-50"
                  >
                    {showLabels ? t.hideLabels : t.showLabels}
                  </button>
                </>
              ) : (
                <>
                  {/* Start Practice button (before practice started) */}
                  {!analyzed && (
                    <button
                      disabled={!canAnalyze}
                      onClick={handlePrepareManual}
                      className={`px-8 py-3 rounded-xl text-sm font-semibold text-white shadow-md transition-all ${
                        canAnalyze
                          ? 'bg-indigo-600 cursor-pointer hover:bg-indigo-700'
                          : 'bg-indigo-300 cursor-not-allowed'
                      }`}
                    >
                      {t.prepare}
                    </button>
                  )}

                  {/* Practice controls (after practice started) */}
                  {analyzed && (
                    <>
                      <button
                        disabled={!canAnalyze}
                        onClick={handleCheckAnswers}
                        className={`px-5 py-2.5 rounded-xl border-none text-sm font-bold text-white transition-all ${
                          canAnalyze
                            ? 'bg-emerald-600 shadow-lg shadow-emerald-600/30 cursor-pointer hover:shadow-xl'
                            : 'bg-emerald-200 cursor-not-allowed'
                        }`}
                      >
                        ✓ {t.checkAnswers}
                      </button>
                      <button
                        onClick={handleClearAll}
                        className="px-4 py-2.5 rounded-xl border-[1.5px] border-slate-200 bg-white text-slate-600 text-sm font-semibold cursor-pointer hover:bg-slate-50 transition-all"
                      >
                        ✕ {t.clearAll}
                      </button>
                      <button
                        onClick={handleShowAnswers}
                        className="px-4 py-2.5 rounded-xl border-[1.5px] border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold cursor-pointer hover:bg-indigo-100 transition-all"
                      >
                        👁️ {t.showAnswers}
                      </button>
                    </>
                  )}
                </>
              )}

              {/* Score counter — manual mode */}
              {isManual && analyzed && (
                <div className="ml-auto bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-600 flex items-center gap-1.5">
                  <strong className="text-slate-800 text-base">
                    {manualView === 'pos' ? Object.keys(userPOSTags).length : Object.keys(userStructureTags).length}
                  </strong>
                  <span className="text-slate-300">/</span>
                  <strong className="text-slate-800 text-base">{score.total}</strong>
                  <span>{t.tagged}</span>
                  {answerChecked && (
                    <>
                      <span className="mx-1 text-slate-300">•</span>
                      <strong className="text-emerald-600 text-base">{score.correct}</strong>
                      <span className="text-slate-300">/</span>
                      <strong className="text-slate-800 text-base">{score.total}</strong>
                      <span>{t.correctLabel}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── NLP error ── */}
            {nlpError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 mb-4 text-xs text-red-900">
                ⚠️ {nlpError}
              </div>
            )}

            {/* ══ OUTPUT / RESULT AREA ══════════════════════ */}
            {/* ── MANUAL PRACTICE MODE ── */}
            {isManual && analyzed && manualTokens.length > 0 && (
              <div className="bg-white rounded-2xl border-[1.5px] border-slate-200 shadow-sm transition-all p-5">
                {/* Question detection for structure mode */}
                {manualView === 'structure' && isQuestion(text) ? (
                  <QuestionMessage text={text} lang={lang} />
                ) : (
                  <div className="flex flex-col">
                    <div
                      className="text-base"
                      style={{
                        lineHeight: 2.5,
                        wordSpacing: '2px',
                      }}
                    >
                      {manualTokens.map(t => (
                        <React.Fragment key={t.id}>
                          {t.pre && <span>{t.pre}</span>}
                          <ManualWordPill
                            token={t}
                            userTag={manualView === 'pos' ? userPOSTags[t.id] : userStructureTags[t.id]}
                            correctTag={manualView === 'pos' ? t.pos : getCorrectAnswer(t, 'structure')}
                            isStructureMode={manualView === 'structure'}
                            onClick={() => handleWordClick(t.id)}
                            showAnswers={showAnswers}
                            answerChecked={answerChecked}
                            lang={lang}
                          />
                          {t.post && <span>{t.post}</span>}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Unrecognized words warning */}
                    {manualTokens.some(t => t.unrecognized) && (
                      <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                        ⚠️ {t.unrecognizedWarn}
                      </div>
                    )}

                    {/* Stats for manual mode */}
                    {answerChecked && (
                      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="text-sm font-bold text-slate-700 mb-2">
                          {t.resultsLabel} {score.correct} / {score.total} {t.correctLabel} ({Math.round((score.correct / score.total) * 100)}%)
                        </div>
                        <div className="flex gap-2 text-xs">
                          <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold">
                            ✓ {t.legendCorrect}
                          </span>
                          <span className="px-2 py-1 rounded bg-red-100 text-red-700 border border-red-200 font-semibold">
                            ✗ {t.legendIncorrect}
                          </span>
                          <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 border border-orange-200 font-semibold">
                            ? {t.legendUntagged}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── AUTO ANALYSIS MODE ── */}
            {analyzed && !isManual && (
              <div ref={analysisRef} className="bg-white rounded-2xl border-[1.5px] border-slate-200 shadow-sm transition-all p-5 scroll-mt-4">
                {/* Show POS tokens */}
                {(autoView === 'pos' || autoView === 'both') && tokens.length > 0 && (
                  <>
                    <div
                      className="text-base"
                      style={{
                        // Extra line-height when labels are visible so rt text doesn't collide
                        lineHeight: showLabels ? 3.0 : 2.0,
                        wordSpacing: '1px',
                      }}
                    >
                      {tokens.map(t => (
                        <React.Fragment key={t.id}>
                          {t.pre && <span>{t.pre}</span>}
                          <WordToken
                            text={t.text}
                            pos={t.pos}
                            isPunct={t.isPunct}
                            unlocked={unlocked}
                            showLabels={showLabels}
                            phrasalVerb={t.phrasalVerb}
                            unrecognized={t.unrecognized}
                            splitParts={t.splitParts}
                            lang={lang}
                          />
                          {t.post && <span>{t.post}</span>}
                        </React.Fragment>
                      ))}
                    </div>
                    <AnalysisStats tokens={tokens} unlocked={unlocked} lang={lang} />
                  </>
                )}

                {/* Divider if showing both */}
                {autoView === 'both' && tokens.length > 0 && structureData.length > 0 && (
                  <div className="my-5 border-t-2 border-slate-100"></div>
                )}

                {/* Show Structure blocks */}
                {(autoView === 'structure' || autoView === 'both') && structureData.length > 0 && (
                  <div>
                    {structureData.map(sentence => (
                      <SentenceStructure key={sentence.id} sentence={sentence} showLabels={showLabels} lang={lang} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ══ MOBILE LEGEND BAR ═══════════════════════════════ */}
      <MobileBar
        unlocked={unlocked}
        isManual={isManual}
        manualView={manualView}
        autoView={autoView}
        selectedPos={selectedPos}
        onSelectPos={togglePos}
        selectedStructure={selectedStructure}
        onSelectStructure={toggleStructure}
        activePos={activePos}
        activeStruct={activeStruct}
        level={level}
        lang={lang}
      />
    </div>
  );
}

export default App;
