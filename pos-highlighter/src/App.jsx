import React, { useState, useEffect } from 'react';
import nlp from 'compromise';

/* ═══════════════════════════════════════════════════════════
   TRANSLATIONS
═══════════════════════════════════════════════════════════ */

const TRANSLATIONS = {
  es: {
    appTitle: 'Desgramatizador',
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
    hintManualPOS: 'Selecciona una categoría POS en la leyenda, luego haz clic en palabras para etiquetarlas.',
    hintManualStructure: 'Selecciona un tipo de bloque de estructura, luego haz clic en palabras para asignarlas.',
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
      V: 'la acción o estado',
      C: 'todo lo demás',
      O: 'recibe la acción: ¿qué? / ¿a quién?',
      A: '¿cuándo? / ¿dónde? / ¿cómo?',
    },
    // Structure warnings
    complexWarning: 'Oración compleja (múltiples cláusulas o más de 15 palabras)',
    questionNotAvailable: 'Pregunta — análisis de estructura no disponible para este tipo de oración.',
    // PWA banners
    installBannerMsg: '📲 Instala la app en tu celular para usarla sin internet',
    installBannerBtn: 'Instalar',
    iosHintMsg: '📲 iPhone: toca Compartir → Agregar a pantalla de inicio',
    offlineMsg: '⚠️ Sin conexión — la app sigue funcionando con el contenido cargado',
  },
  en: {
    appTitle: 'Desgramatizador',
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
    hintManualPOS: 'Select a POS category in the legend, then click words to label them.',
    hintManualStructure: 'Select a structure block type, then click words to assign them.',
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
      V: 'the action or state',
      C: 'everything else',
      O: 'receives the action: what? / whom?',
      A: 'when? / where? / how?',
    },
    // Structure warnings
    complexWarning: 'Complex sentence (multiple clauses or 15+ words)',
    questionNotAvailable: 'Question — structure analysis not available for this sentence type.',
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

const POS = {
  noun:         { color: '#D97706', bg: '#FEF3C7', label: 'N',    name: 'Noun',         def: 'person, place, thing, or idea', ex: 'dog, city, love'           },
  verb:         { color: '#E11D48', bg: '#FFE4E6', label: 'V',    name: 'Verb',         def: 'action or state',               ex: 'run, is, think'            },
  adjective:    { color: '#0891B2', bg: '#CFFAFE', label: 'ADJ',  name: 'Adjective',    def: 'describes a noun',              ex: 'big, happy, red'           },
  adverb:       { color: '#EAB308', bg: '#FEFCE8', label: 'ADV',  name: 'Adverb',       def: 'modifies verb or adjective',    ex: 'quickly, very, often'      },
  pronoun:      { color: '#C026D3', bg: '#FAE8FF', label: 'PRO',  name: 'Pronoun',      def: 'replaces a noun',               ex: 'he, she, they, it'         },
  preposition:  { color: '#10B981', bg: '#ECFDF5', label: 'PREP', name: 'Preposition',  def: 'shows relationship',            ex: 'in, on, at, with'          },
  conjunction:  { color: '#3B82F6', bg: '#DBEAFE', label: 'CONJ', name: 'Conjunction',  def: 'connects clauses',              ex: 'and, but, because'         },
  determiner:   { color: '#64748B', bg: '#F1F5F9', label: 'DET',  name: 'Determiner',   def: 'specifies a noun',              ex: 'the, a, this, my, some'    },
  modal:        { color: '#6366F1', bg: '#E0E7FF', label: 'MOD',  name: 'Modal',        def: 'ability / possibility',         ex: 'can, should, must, might'  },
  auxiliary:    { color: '#EF4444', bg: '#FEE2E2', label: 'AUX',  name: 'Auxiliary',    def: 'helps the main verb',           ex: 'is, have, do, was'         },
  wh:            { color: '#0F766E', bg: '#F0FDFA', label: 'WH',   name: 'Wh- Word',     def: 'introduces a question',         ex: 'what, where, when, why, how' },
  number:       { color: '#6B7280', bg: '#F3F4F6', label: 'NUM',  name: 'Numeral',      def: 'expresses quantity or a number', ex: '2020, three, 42'           },
};

const POS_ORDER = [
  'noun', 'verb', 'adjective', 'adverb', 'pronoun', 'wh',
  'preposition', 'conjunction', 'determiner', 'number', 'modal', 'auxiliary',
];

const STRUCTURE = {
  WH: { color: '#0F766E', bg: '#F0FDFA', label: 'WH', name: 'Wh- Word',   def: 'introduces the question' },
  S:  { color: '#4F46E5', bg: '#EEF2FF', label: 'S',  name: 'Subject',    def: 'who or what does the action' },
  V:  { color: '#E11D48', bg: '#FFF1F2', label: 'V',  name: 'Verb',       def: 'the action or state' },
  C:  { color: '#059669', bg: '#ECFDF5', label: 'C',  name: 'Complement', def: 'everything else' },
  O:  { color: '#059669', bg: '#ECFDF5', label: 'O',  name: 'Object',     def: 'receives the action: what? / whom?' },
  A:  { color: '#D97706', bg: '#FFFBEB', label: 'A',  name: 'Adverbial',  def: 'when? / where? / how?' },
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
   NLP — TAG MAPPING & TOKENIZER
═══════════════════════════════════════════════════════════ */

// Clause markers for complexity detection
const CLAUSE_MARKERS = [
  'because', 'although', 'when', 'if', 'unless', 'while', 'since',
  'before', 'after', 'that', 'which', 'who', 'whom', 'whose', 'where',
  'though', 'once', 'as', 'until', 'whereas', 'whenever',
  'even though', 'even if', 'so that', 'in case', 'now that',
  'as soon as', 'as long as',
];

// Question detection helper
function isQuestion(text) {
  const trimmed = text.trim();
  // Check if ends with question mark
  if (trimmed.endsWith('?')) return true;

  // Check if starts with interrogative words (Wh-questions)
  // Also check for contractions like "What's", "Where's", etc.
  const interrogativeWords = ['what', 'when', 'where', 'who', 'whom', 'whose', 'why', 'which', 'how'];
  const firstWord = trimmed.split(/\s+/)[0].toLowerCase().replace(/[,;:.!?]$/, '').replace(/'s$/, '');
  if (interrogativeWords.includes(firstWord)) return true;

  // Check if starts with auxiliary/modal (Yes/No questions)
  const auxiliaryModals = ['do', 'does', 'did', 'is', 'are', 'am', 'was', 'were', 'have', 'has', 'had', 'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must'];
  if (auxiliaryModals.includes(firstWord)) return true;

  return false;
}

// Analyze sentence structure using compromise.js
// Expand common contractions so NLP can parse verb phrases correctly
function expandContractions(t) {
  return t
    .replace(/\bwhat's\b/gi,   'What is')
    .replace(/\bwhere's\b/gi,  'Where is')
    .replace(/\bwho's\b/gi,    'Who is')
    .replace(/\bhow's\b/gi,    'How is')
    .replace(/\bwhen's\b/gi,   'When is')
    .replace(/\bthat's\b/gi,   'That is')
    .replace(/\bthere's\b/gi,  'There is')
    .replace(/\bhere's\b/gi,   'Here is')
    .replace(/\bit's\b/gi,     'It is')
    .replace(/\bhe's\b/gi,     'He is')
    .replace(/\bshe's\b/gi,    'She is')
    .replace(/\bi'm\b/gi,      'I am')
    .replace(/\byou're\b/gi,   'You are')
    .replace(/\bwe're\b/gi,    'We are')
    .replace(/\bthey're\b/gi,  'They are')
    .replace(/\bi've\b/gi,     'I have')
    .replace(/\byou've\b/gi,   'You have')
    .replace(/\bwe've\b/gi,    'We have')
    .replace(/\bthey've\b/gi,  'They have')
    .replace(/\bi'll\b/gi,     'I will')
    .replace(/\byou'll\b/gi,   'You will')
    .replace(/\bhe'll\b/gi,    'He will')
    .replace(/\bshe'll\b/gi,   'She will')
    .replace(/\bwe'll\b/gi,    'We will')
    .replace(/\bthey'll\b/gi,  'They will')
    .replace(/\bi'd\b/gi,      'I would')
    .replace(/\byou'd\b/gi,    'You would')
    .replace(/\bhe'd\b/gi,     'He would')
    .replace(/\bshe'd\b/gi,    'She would')
    .replace(/\bwe'd\b/gi,     'We would')
    .replace(/\bthey'd\b/gi,   'They would')
    .replace(/\bisn't\b/gi,    'is not')
    .replace(/\baren't\b/gi,   'are not')
    .replace(/\bwasn't\b/gi,   'was not')
    .replace(/\bweren't\b/gi,  'were not')
    .replace(/\bdon't\b/gi,    'do not')
    .replace(/\bdoesn't\b/gi,  'does not')
    .replace(/\bdidn't\b/gi,   'did not')
    .replace(/\bcan't\b/gi,    'cannot')
    .replace(/\bcouldn't\b/gi, 'could not')
    .replace(/\bwon't\b/gi,    'will not')
    .replace(/\bwouldn't\b/gi, 'would not')
    .replace(/\bshouldn't\b/gi,'should not')
    .replace(/\bmustn't\b/gi,  'must not')
    .replace(/\bhaven't\b/gi,  'have not')
    .replace(/\bhasn't\b/gi,   'has not')
    .replace(/\bhadn't\b/gi,   'had not');
}

function analyzeSentenceStructure(sentenceText, level) {
  const isBasic = level === 'Básico' || level === 'Elemental';
  // Expand contractions so NLP sees "What is" instead of "What's" etc.
  sentenceText = expandContractions(sentenceText);
  const doc = nlp(sentenceText);

  // Check if this is a question (mark it but continue analyzing)
  const isQuestionSentence = isQuestion(sentenceText);

  // Detect complexity
  const wordCount = doc.terms().length;
  const clauseMarkerCount = CLAUSE_MARKERS.filter(marker =>
    sentenceText.toLowerCase().includes(' ' + marker + ' ')
  ).length;
  const isComplex = clauseMarkerCount >= 2 || wordCount >= 15;

  // Special handling for questions (inverted structure)
  if (isQuestionSentence) {
    try {
      const components = [];
      const terms = doc.terms().out('array');

      if (terms.length === 0) {
        throw new Error('No terms found');
      }

      // Get POS tags for each term using our tokenization logic
      const termPOS = [];
      doc.json()[0].terms.forEach(t => {
        const lower = t.text.toLowerCase();
        const cleanLower = lower.replace(/[,;:.!?]$/, ''); // Remove trailing punctuation
        let pos = null;

        // Check hardcoded lexicon first (use cleanLower for lookup)
        const lexiconMatch = WORD_LEXICON.get(cleanLower);
        if (lexiconMatch) {
          pos = lexiconMatch;
        } else {
          // Use compromise tags
          for (const [ourTag, compTags] of POS_TAG_RULES) {
            if (compTags.some(tag => t.tags && t.tags.includes(tag))) {
              pos = ourTag;
              break;
            }
          }
        }

        termPOS.push({ text: t.text, pos, tags: t.tags || [] });
      });

      // Context-aware correction for questions:
      // In questions, after auxiliary + subject, the next content word must be the main verb
      // (even if compromise tagged it as a noun)

      // Find the first auxiliary or modal
      let auxIndex = -1;
      for (let i = 0; i < termPOS.length; i++) {
        if (termPOS[i].pos === 'auxiliary' || termPOS[i].pos === 'modal') {
          auxIndex = i;
          break;
        }
      }

      // If we found an auxiliary/modal, look ahead to find and fix the main verb
      if (auxIndex !== -1) {
        let lastSubjectIndex = -1;
        let previousWasConjunction = false;

        // First pass: find where the subject ends
        // Subject consists of pronouns, determiners, nouns, and conjunctions connecting them
        for (let j = auxIndex + 1; j < termPOS.length; j++) {
          const currentTerm = termPOS[j];

          if (currentTerm.pos === 'pronoun') {
            lastSubjectIndex = j;
            previousWasConjunction = false;
          } else if (currentTerm.pos === 'determiner') {
            lastSubjectIndex = j;
            previousWasConjunction = false;
          } else if (currentTerm.pos === 'conjunction') {
            lastSubjectIndex = j;
            previousWasConjunction = true;
          } else if (currentTerm.pos === 'noun') {
            // Only include noun if it's NOT right after we finished processing a conjunction's target
            // If previous was conjunction, this noun is part of compound subject
            // Otherwise, it might be the verb
            if (previousWasConjunction) {
              lastSubjectIndex = j;
              previousWasConjunction = false;
            } else if (j === auxIndex + 1 || termPOS[j - 1].pos === 'determiner') {
              // First word after aux, or after a determiner, so it's part of subject
              lastSubjectIndex = j;
            } else {
              // This noun comes after the subject is complete, it's the verb
              break;
            }
          } else {
            // Found something that's not part of the subject, stop looking
            break;
          }
        }

        // Second pass: the word right after the subject must be the main verb
        if (lastSubjectIndex !== -1 && lastSubjectIndex + 1 < termPOS.length) {
          const nextWord = termPOS[lastSubjectIndex + 1];
          // Force it to be a verb (it's the main verb position in a question)
          nextWord.pos = 'verb';
        }
      }

      // Detect question structure using POS tags
      const firstTerm = termPOS[0];

      // Check if it's a Wh-question (starts with wh-word)
      const WH_WORDS = new Set(['what','where','when','why','who','which','how','whose','whom']);
      const HOW_COMPOUNDS_STRUCT = new Set([
        'long','much','many','often','far','old','tall','big',
        'good','well','fast','late','early','hard','loud',
      ]);
      const firstWordLower = firstTerm.text.toLowerCase().replace(/[?!.]$/, '');
      if (WH_WORDS.has(firstWordLower)) {
        // Wh-question: WH-word + Auxiliary/Modal + Subject + Main Verb (+ Object/Complement)

        // 1. Wh-word → WH block; merge compound WH expressions into single text
        let whText = firstTerm.text;
        let auxSearchStart = 1;
        if (termPOS.length > 1) {
          const nextLower = termPOS[1].text.toLowerCase().replace(/[?!.]$/, '');
          const nextPos = termPOS[1].pos;
          const isNounLike = nextPos === 'noun' || termPOS[1].tags?.includes('Noun') || termPOS[1].tags?.includes('Singular') || termPOS[1].tags?.includes('Plural');
          const shouldMerge =
            (firstWordLower === 'how' && HOW_COMPOUNDS_STRUCT.has(nextLower)) ||
            ((firstWordLower === 'what' || firstWordLower === 'which' || firstWordLower === 'whose') && isNounLike);
          if (shouldMerge) {
            whText = firstTerm.text + ' ' + termPOS[1].text;
            auxSearchStart = 2;
          }
        }
        components.push({ type: 'WH', text: whText, position: 0 });

        // 1b. Check for "of + noun(s)" prepositional phrase after "what/which + noun"
        if (
          auxSearchStart === 2 &&
          (firstWordLower === 'what' || firstWordLower === 'which') &&
          termPOS[auxSearchStart]?.text.toLowerCase() === 'of'
        ) {
          // Collect "of + noun(s)" until we hit aux/modal/verb/punct
          let phraseEnd = auxSearchStart + 1;
          while (
            phraseEnd < termPOS.length &&
            termPOS[phraseEnd].pos !== 'auxiliary' &&
            termPOS[phraseEnd].pos !== 'modal' &&
            termPOS[phraseEnd].pos !== 'verb' &&
            !termPOS[phraseEnd].isPunct
          ) { phraseEnd++; }
          if (phraseEnd > auxSearchStart + 1) {
            const ofText = termPOS.slice(auxSearchStart, phraseEnd).map(t => t.text).join(' ');
            components.push({ type: 'C', text: ofText, position: auxSearchStart });
            auxSearchStart = phraseEnd;
          }
        }

        // 2. Find auxiliary or modal (should be second word typically)
        let auxIndex = -1;
        for (let i = auxSearchStart; i < termPOS.length; i++) {
          if (termPOS[i].pos === 'auxiliary' || termPOS[i].pos === 'modal') {
            auxIndex = i;
            break;
          }
        }

        if (auxIndex !== -1) {
          // 3. Auxiliary/Modal → Verb (mark as auxiliary part)
          components.push({ type: 'V', text: termPOS[auxIndex].text, position: auxIndex, isAuxiliary: true });

          // 4. Find subject (typically comes after auxiliary, before main verb)
          // Subject is usually a pronoun, noun, or determiner + noun
          // Can include conjunctions for compound subjects (e.g., "you and your sister")
          let subjectEnd = auxIndex + 1;
          for (let i = auxIndex + 1; i < termPOS.length; i++) {
            const pos = termPOS[i].pos;
            const tags = termPOS[i].tags || [];

            // Check if this is a verb (either by our POS mapping or compromise's tags)
            const isVerb = pos === 'verb' || tags.includes('Verb') || tags.includes('Infinitive') || tags.includes('PresentTense') || tags.includes('PastTense');

            // If we find a conjunction, check if it's followed by nominal elements (compound subject)
            // or by a verb (which means the subject has ended)
            if (pos === 'conjunction') {
              // Look ahead to see what comes after the conjunction
              const nextPos = i + 1 < termPOS.length ? termPOS[i + 1].pos : null;
              const nextTags = i + 1 < termPOS.length ? termPOS[i + 1].tags || [] : [];
              const nextIsVerb = nextPos === 'verb' || nextTags.includes('Verb') || nextTags.includes('Infinitive');

              if ((nextPos === 'determiner' || nextPos === 'adjective' || nextPos === 'noun' || nextPos === 'pronoun') && !nextIsVerb) {
                // Conjunction is connecting subjects (e.g., "you and your sister")
                subjectEnd = i + 1;
              } else {
                // Conjunction is not part of subject (e.g., connecting verbs or clauses)
                break;
              }
            }
            // Subject continues while we see determiners, adjectives, nouns, pronouns (but not verbs)
            else if ((pos === 'determiner' || pos === 'adjective' || pos === 'noun' || pos === 'pronoun') && !isVerb) {
              subjectEnd = i + 1;
            } else if (isVerb) {
              // Found main verb, subject ends here
              break;
            } else {
              // Other POS, subject ends
              break;
            }
          }

          const subjectTerms = termPOS.slice(auxIndex + 1, subjectEnd);
          if (subjectTerms.length > 0) {
            components.push({ type: 'S', text: subjectTerms.map(t => t.text).join(' '), position: auxIndex + 1 });
          }

          // 5. Find main verb and rest
          let mainVerbIndex = -1;
          for (let i = subjectEnd; i < termPOS.length; i++) {
            const pos = termPOS[i].pos;
            const tags = termPOS[i].tags || [];
            // Check if this is a verb (either by our POS mapping or compromise's tags)
            const isVerb = pos === 'verb' || tags.includes('Verb') || tags.includes('Infinitive') || tags.includes('PresentTense') || tags.includes('PastTense');

            if (isVerb) {
              mainVerbIndex = i;
              break;
            }
          }

          if (mainVerbIndex !== -1) {
            // Check if main verb is followed by "to + verb" (infinitive phrase, part of verb)
            let verbEndIndex = mainVerbIndex;
            let verbText = termPOS[mainVerbIndex].text;

            // Check for "to" + verb pattern (e.g., "use to play", "want to go")
            if (mainVerbIndex + 1 < termPOS.length && termPOS[mainVerbIndex + 1].text.toLowerCase() === 'to') {
              // Check if there's a verb after "to"
              if (mainVerbIndex + 2 < termPOS.length && termPOS[mainVerbIndex + 2].pos === 'verb') {
                // Include "to + verb" as part of the main verb
                verbEndIndex = mainVerbIndex + 2;
                verbText = termPOS.slice(mainVerbIndex, verbEndIndex + 1).map(t => t.text).join(' ');
              }
            }

            // Rule 16: check if "have/has/had + to" precedes the main verb
            // e.g., "What does she have to study?" → main V = "have to study"
            const HAVE_SET_WH = new Set(['have', 'has', 'had']);
            if (mainVerbIndex >= 2) {
              const tMinus2 = termPOS[mainVerbIndex - 2];
              const tMinus1 = termPOS[mainVerbIndex - 1];
              if (tMinus2 && tMinus1 &&
                  HAVE_SET_WH.has(tMinus2.text.toLowerCase()) &&
                  tMinus1.text.toLowerCase() === 'to') {
                verbText = tMinus2.text + ' ' + tMinus1.text + ' ' + verbText;
              }
            }

            // Main verb component (may include "to + verb")
            components.push({ type: 'V', text: verbText, position: mainVerbIndex, isMainVerb: true });

            // 6. Everything after main verb phrase is Object (or Complement for Básico)
            if (verbEndIndex + 1 < termPOS.length) {
              const rest = termPOS.slice(verbEndIndex + 1)
                .map(t => t.text)
                .join(' ')
                .replace(/\s+([,;:.!?])/g, '$1'); // Fix spacing before punctuation

              if (rest.trim()) {
                components.push({ type: isBasic ? 'C' : 'O', text: rest, position: verbEndIndex + 1 });
              }
            }
          }
        }

        // Sort components by original word order
        const sortedComponents = components
          .filter(c => c && c.text)
          .sort((a, b) => a.position - b.position);

        return {
          components: sortedComponents,
          isComplex,
          isQuestion: true,
          error: null,
        };
      }
      // Check if it's a Yes/No question (starts with auxiliary/modal)
      else if (firstTerm.pos === 'auxiliary' || firstTerm.pos === 'modal') {
        // Yes/No question: Auxiliary/Modal + Subject + Main Verb (+ Complement)

        // 1. Auxiliary/Modal → Verb (mark as auxiliary part)
        components.push({ type: 'V', text: firstTerm.text, position: 0, isAuxiliary: true });

        // 2. Find subject (comes after auxiliary, before main verb)
        // Can include conjunctions for compound subjects (e.g., "you and your sister")
        let subjectEnd = 1;
        for (let i = 1; i < termPOS.length; i++) {
          const pos = termPOS[i].pos;
          const tags = termPOS[i].tags || [];

          // Check if this is a verb (either by our POS mapping or compromise's tags)
          const isVerb = pos === 'verb' || tags.includes('Verb') || tags.includes('Infinitive') || tags.includes('PresentTense') || tags.includes('PastTense');

          // If we find a conjunction, check if it's followed by nominal elements (compound subject)
          // or by a verb (which means the subject has ended)
          if (pos === 'conjunction') {
            // Look ahead to see what comes after the conjunction
            const nextPos = i + 1 < termPOS.length ? termPOS[i + 1].pos : null;
            const nextTags = i + 1 < termPOS.length ? termPOS[i + 1].tags || [] : [];
            const nextIsVerb = nextPos === 'verb' || nextTags.includes('Verb') || nextTags.includes('Infinitive');

            if ((nextPos === 'determiner' || nextPos === 'adjective' || nextPos === 'noun' || nextPos === 'pronoun') && !nextIsVerb) {
              // Conjunction is connecting subjects (e.g., "you and your sister")
              subjectEnd = i + 1;
            } else {
              // Conjunction is not part of subject (e.g., connecting verbs or clauses)
              break;
            }
          }
          // Subject continues while we see determiners, adjectives, nouns, pronouns (but not verbs)
          else if ((pos === 'determiner' || pos === 'adjective' || pos === 'noun' || pos === 'pronoun') && !isVerb) {
            subjectEnd = i + 1;
          } else if (isVerb) {
            // Found main verb, subject ends here
            break;
          } else {
            break;
          }
        }

        const subjectTerms = termPOS.slice(1, subjectEnd);
        if (subjectTerms.length > 0) {
          components.push({ type: 'S', text: subjectTerms.map(t => t.text).join(' '), position: 1 });
        }

        // 3. Find main verb and rest
        let mainVerbIndex = -1;
        for (let i = subjectEnd; i < termPOS.length; i++) {
          const pos = termPOS[i].pos;
          const tags = termPOS[i].tags || [];
          // Check if this is a verb (either by our POS mapping or compromise's tags)
          const isVerb = pos === 'verb' || tags.includes('Verb') || tags.includes('Infinitive') || tags.includes('PresentTense') || tags.includes('PastTense');

          if (isVerb) {
            mainVerbIndex = i;
            break;
          }
        }

        if (mainVerbIndex !== -1) {
          // Check if main verb is followed by "to + verb" (infinitive phrase, part of verb)
          let verbEndIndex = mainVerbIndex;
          let verbText = termPOS[mainVerbIndex].text;

          // Check for "to" + verb pattern (e.g., "use to play", "want to go")
          if (mainVerbIndex + 1 < termPOS.length && termPOS[mainVerbIndex + 1].text.toLowerCase() === 'to') {
            // Check if there's a verb after "to"
            if (mainVerbIndex + 2 < termPOS.length && termPOS[mainVerbIndex + 2].pos === 'verb') {
              // Include "to + verb" as part of the main verb
              verbEndIndex = mainVerbIndex + 2;
              verbText = termPOS.slice(mainVerbIndex, verbEndIndex + 1).map(t => t.text).join(' ');
            }
          }

          // Rule 16: check if "have/has/had + to" precedes the main verb
          // e.g., "Do you have to work?" → main V = "have to work"
          const HAVE_SET_YN = new Set(['have', 'has', 'had']);
          if (mainVerbIndex >= 2) {
            const tMinus2 = termPOS[mainVerbIndex - 2];
            const tMinus1 = termPOS[mainVerbIndex - 1];
            if (tMinus2 && tMinus1 &&
                HAVE_SET_YN.has(tMinus2.text.toLowerCase()) &&
                tMinus1.text.toLowerCase() === 'to') {
              verbText = tMinus2.text + ' ' + tMinus1.text + ' ' + verbText;
            }
          }

          // Main verb component (may include "to + verb")
          components.push({ type: 'V', text: verbText, position: mainVerbIndex, isMainVerb: true });

          // 4. Everything after verb phrase is Complement
          if (verbEndIndex + 1 < termPOS.length) {
            const rest = termPOS.slice(verbEndIndex + 1)
              .map(t => t.text)
              .join(' ')
              .replace(/\s+([,;:.!?])/g, '$1');

            if (rest.trim()) {
              components.push({ type: 'C', text: rest, position: verbEndIndex + 1 });
            }
          }
        }

        // Sort components by original word order
        const sortedComponents = components
          .filter(c => c && c.text)
          .sort((a, b) => a.position - b.position);

        return {
          components: sortedComponents,
          isComplex,
          isQuestion: true,
          error: null,
        };
      }
    } catch (err) {
      console.error('Question analysis error:', err);
      // Fall through to regular analysis
    }
  }

  // Try to parse structure
  try {
    // RULE 3: Fronted subordinate clause → treat as C block, then analyze main clause
    // "If you study hard, you will pass." → C: "If you study hard," | S+V+C of main clause
    const FRONTED_SUBORD_WORDS = [
      'if', 'when', 'because', 'although', 'while', 'before', 'after',
      'since', 'unless', 'though', 'as', 'once', 'until', 'whereas',
      'whenever', 'provided', 'despite', 'contrary',
    ];
    const firstWordFronted = doc.terms().first().text().toLowerCase().replace(/[,;:.!?]$/, '');
    if (FRONTED_SUBORD_WORDS.includes(firstWordFronted)) {
      const commaIdx = sentenceText.indexOf(',');
      if (commaIdx !== -1) {
        const frontedClause = sentenceText.substring(0, commaIdx + 1).trim();
        const mainClause    = sentenceText.substring(commaIdx + 1).trim();
        if (mainClause && nlp(mainClause).verbs().length > 0) {
          const mainAnalysis = analyzeSentenceStructure(mainClause, level);
          return {
            components: [
              { type: 'C', text: frontedClause },
              ...(mainAnalysis.components || []),
            ],
            isComplex,
            isQuestion: isQuestionSentence,
            error: mainAnalysis.error,
          };
        }
      }
    }

    // Special case: Gerund phrase as subject (e.g., "Playing football is fun",
    //   "Working from home has become very common")
    // Pattern: sentence starts with -ing word + any words + finite verb/auxiliary
    const firstWord = doc.terms().first();
    const firstWordText = firstWord.text();

    if (firstWordText.toLowerCase().endsWith('ing')) {
      // Find first auxiliary or modal that appears AFTER position 0 (i.e. not the gerund itself)
      const predicateStartMatch = doc.match(
        '(is|are|was|were|am|has|have|had|will|would|can|could|may|might|must|should|shall|do|does|did)'
      ).first();

      if (predicateStartMatch.found) {
        const auxText  = predicateStartMatch.text();
        const auxIndex = sentenceText.toLowerCase().indexOf(auxText.toLowerCase());

        if (auxIndex > 0) {
          const subjectText  = sentenceText.substring(0, auxIndex).trim();
          const afterSubject = sentenceText.substring(auxIndex).trim();

          // Extract full verb phrase from afterSubject (aux + main verb if present)
          const predDoc  = nlp(afterSubject);
          const predVerb = predDoc.verbs().first();
          const VERB_T   = ['Verb','Modal','Auxiliary','PastTense','PresentTense',
                            'Infinitive','PerfectTense','Negative'];
          const AUX_W    = new Set(['am','is','are','was','were','be','been','being',
                                    'have','has','had','do','does','did',
                                    'will','would','shall','should','can','could',
                                    'may','might','must','not',"n't"]);

          let verbText = auxText; // fallback: just the auxiliary
          if (predVerb.found) {
            const cleanWords = predVerb.terms().json()
              .filter(p => {
                const inner = (p.terms && p.terms[0]) || p;
                const tags  = inner.tags || {};
                const has   = Array.isArray(tags)
                  ? VERB_T.some(t => tags.includes(t))
                  : VERB_T.some(t => t in tags);
                return has || AUX_W.has((inner.text || p.text || '').toLowerCase());
              })
              .map(p => p.text);
            if (cleanWords.length > 0) verbText = cleanWords.join(' ');
          }

          const verbIdx  = afterSubject.toLowerCase().indexOf(verbText.toLowerCase());
          const afterVerb = verbIdx !== -1
            ? afterSubject.substring(verbIdx + verbText.length).trim()
            : '';

          return {
            components: [
              { type: 'S', text: subjectText },
              { type: 'V', text: verbText },
              ...(afterVerb ? [{ type: 'C', text: afterVerb }] : []),
            ],
            isComplex,
            isQuestion: isQuestionSentence,
            error: null,
          };
        }
      }
    }

    // Helper: check if a term has a given tag (handles both array and object formats)
    const termHasTag = (term, ...tagNames) => {
      const tags = term.tags || {};
      if (Array.isArray(tags)) return tagNames.some(t => tags.includes(t));
      return tagNames.some(t => t in tags);
    };

    const VERB_TAGS = ['Verb','Modal','Auxiliary','PastTense','PresentTense',
                       'Infinitive','Gerund','PerfectTense','Negative','Particle'];
    const AUX_WORDS = new Set(['am','is','are','was','were','be','been','being',
                               'have','has','had','do','does','did',
                               'will','would','shall','should','can','could',
                               'may','might','must','not',"n't","'s","'re","'ve","'ll","'d"]);

    // Use compromise's verb detector (reliable for all verb types),
    // then strip any non-verb terms (adverbs, degree words) from the result
    let verbPhrase = '';
    const verbDoc = doc.verbs().first();

    if (verbDoc.found) {
      const rawTerms = verbDoc.terms().json();
      // Slice from first verb-tagged term to last verb-tagged term (inclusive),
      // preserving sandwiched adverbs like "widely" in "is widely believed"
      let vStart = -1, vEnd = -1;
      for (let i = 0; i < rawTerms.length; i++) {
        const inner = (rawTerms[i].terms && rawTerms[i].terms[0]) || rawTerms[i];
        if (termHasTag(inner, ...VERB_TAGS) || AUX_WORDS.has((inner.text || rawTerms[i].text || '').toLowerCase())) {
          if (vStart === -1) vStart = i;
          vEnd = i;
        }
      }
      if (vStart !== -1) {
        verbPhrase = rawTerms.slice(vStart, vEnd + 1).map(p => p.text).join(' ');
      }
    }

    // Fallback: modal + verb pattern
    if (!verbPhrase) {
      const modalMatch = doc.match('#Modal #Verb?');
      if (modalMatch.found) verbPhrase = modalMatch.first().text();
    }

    // Fallback: find any known aux word
    if (!verbPhrase) {
      for (const term of doc.terms().json()) {
        if (AUX_WORDS.has(term.text.toLowerCase())) { verbPhrase = term.text; break; }
      }
    }

    // Fallback: scan terms directly for any verb-tagged word
    if (!verbPhrase) {
      for (const phrase of doc.terms().json()) {
        const inner = (phrase.terms && phrase.terms[0]) || phrase;
        const tags = inner.tags || {};
        const isVerb = Array.isArray(tags)
          ? VERB_TAGS.some(t => tags.includes(t))
          : VERB_TAGS.some(t => t in tags);
        if (isVerb) { verbPhrase = phrase.text; break; }
      }
    }

    // Last resort: known linking/sense verbs that compromise misclassifies as Noun
    if (!verbPhrase) {
      const LINKING_VERBS = [
        'feel','feels','felt','look','looks','looked','seem','seems','seemed',
        'appear','appears','appeared','become','becomes','became',
        'remain','remains','remained','stay','stays','stayed',
        'sound','sounds','sounded','taste','tastes','tasted',
        'grow','grows','grew','get','gets','got','keep','keeps','kept',
        'go','goes','went','turn','turns','turned','fall','falls','fell',
        'come','comes','came','prove','proves','proved',
      ];
      for (const lv of LINKING_VERBS) {
        const m = sentenceText.match(new RegExp(`\\b${lv}\\b`, 'i'));
        if (m) { verbPhrase = m[0]; break; }
      }
    }

    if (!verbPhrase) {
      return { components: [], isComplex, isQuestion: isQuestionSentence, error: 'Could not parse sentence structure' };
    }

    // Sanity check: if verbPhrase appears inside a subordinate clause
    // (i.e. beforeVerb contains a subordinating conjunction), find the real main verb
    // Example: "Some employees feel isolated when they work alone" → verb should be "feel", not "work"
    {
      const tentativeIndex = sentenceText.toLowerCase().indexOf(verbPhrase.toLowerCase());
      const tentativeBefore = sentenceText.substring(0, tentativeIndex).toLowerCase();
      const subordInBefore = SUBORD_CONJ.some(sc =>
        new RegExp(`\\b${sc}\\b`).test(tentativeBefore)
      );
      if (subordInBefore) {
        // The detected verb is inside a subordinate clause — find the verb BEFORE that clause
        const subordMatch = SUBORD_CONJ
          .map(sc => ({ sc, idx: tentativeBefore.search(new RegExp(`\\b${sc}\\b`)) }))
          .filter(x => x.idx !== -1)
          .sort((a, b) => a.idx - b.idx)[0];
        if (subordMatch) {
          const beforeSubord = sentenceText.substring(0, subordMatch.idx).trim();
          const mainVerbDoc  = nlp(beforeSubord).verbs().last();
          if (mainVerbDoc.found) {
            const rawT = mainVerbDoc.terms().json();
            const VERB_T = ['Verb','Modal','Auxiliary','PastTense','PresentTense','Infinitive','PerfectTense','Negative'];
            const AUX_W = AUX_WORDS;
            let tStart = -1, tEnd = -1;
            for (let i = 0; i < rawT.length; i++) {
              const inner = (rawT[i].terms && rawT[i].terms[0]) || rawT[i];
              const tags  = inner.tags || {};
              const has   = Array.isArray(tags) ? VERB_T.some(t => tags.includes(t)) : VERB_T.some(t => t in tags);
              if (has || AUX_W.has((inner.text || rawT[i].text || '').toLowerCase())) {
                if (tStart === -1) tStart = i;
                tEnd = i;
              }
            }
            if (tStart !== -1) verbPhrase = rawT.slice(tStart, tEnd + 1).map(p => p.text).join(' ');
          }
        }
      }
    }

    // Rule 16: extend verb phrase for "have/has/had + to + verb" (obligation)
    // In case compromise only detected "have/has/had" but the pattern is "have to play"
    const HAVE_VP_SET = new Set(['have', 'has', 'had']);
    if (HAVE_VP_SET.has(verbPhrase.trim().toLowerCase())) {
      const haveToRe = new RegExp(`\\b${verbPhrase.trim()}\\s+to\\s+(\\w+)`, 'i');
      const m = sentenceText.match(haveToRe);
      if (m) verbPhrase = verbPhrase.trim() + ' to ' + m[1];
    }

    // Find where the verb appears in the sentence
    const verbIndex = sentenceText.toLowerCase().indexOf(verbPhrase.toLowerCase());
    let beforeVerb = sentenceText.substring(0, verbIndex).trim();
    // Strip trailing punctuation so it doesn't appear as a lone C block
    const afterVerb = sentenceText.substring(verbIndex + verbPhrase.length).trim().replace(/[.!?]+$/, '');

    // Mid-position adverbs (also, always, never, etc.) between S and V belong to the V block
    const MID_ADV = new Set(['also','always','never','often','still','just','already',
                             'usually','sometimes','rarely','seldom','ever','even',
                             'almost','only','probably','certainly','perhaps','simply','really']);
    const beforeWords = beforeVerb.split(/\s+/);
    const midAdvWords = [];
    while (beforeWords.length > 0) {
      const lastWord = beforeWords[beforeWords.length - 1].toLowerCase().replace(/[,;:.!?]$/, '');
      if (MID_ADV.has(lastWord)) {
        midAdvWords.unshift(beforeWords.pop());
      } else {
        break;
      }
    }
    if (midAdvWords.length > 0) {
      verbPhrase = midAdvWords.join(' ') + ' ' + verbPhrase;
      beforeVerb = beforeWords.join(' ');
    }

    // Extract subject from text before verb
    let subject = '';
    let leadingAdverbial = '';

    if (beforeVerb) {
      const beforeDoc = nlp(beforeVerb);

      // Check for leading time/place adverbials (Yesterday, Last week, In 2020, etc.)
      const firstTerm = beforeDoc.terms().first();
      const firstWord = firstTerm.text().toLowerCase().replace(/[,;:.!?]$/, '');

      // Common time/place adverbials that appear before subject
      const timeAdverbials = [
        // Time/place markers
        'yesterday', 'today', 'tomorrow', 'now', 'then', 'recently', 'soon', 'once',
        'always', 'never', 'sometimes', 'often', 'usually', 'rarely', 'seldom',
        'daily', 'weekly', 'monthly', 'early', 'late',
        'last', 'next', 'this', 'every', 'in', 'on', 'at', 'during', 'before', 'after',
        // Discourse markers (however, therefore, etc.) — also treated as fronted C
        'however', 'therefore', 'moreover', 'furthermore', 'besides', 'consequently',
        'nevertheless', 'nonetheless', 'additionally', 'meanwhile', 'otherwise',
        'unfortunately', 'fortunately', 'surprisingly', 'interestingly',
        'indeed', 'certainly', 'clearly', 'obviously',
      ];

      if (timeAdverbials.includes(firstWord)) {
        // Strategy: find where the subject starts — everything before it is the adverbial

        // 1. If there's a comma, it cleanly separates adverbial from subject
        const commaIdx = beforeVerb.indexOf(',');
        if (commaIdx !== -1) {
          leadingAdverbial = beforeVerb.substring(0, commaIdx + 1).trim();
          subject = beforeVerb.substring(commaIdx + 1).trim();
        } else {
          // 2. No comma — find subject by locating the first personal pronoun
          const pronouns = ['i', 'you', 'he', 'she', 'it', 'we', 'they'];
          let subjectPos = -1;

          const terms = beforeDoc.terms().json();
          for (const term of terms) {
            const w = term.text.toLowerCase().replace(/[,;:.!?]$/, '');
            if (pronouns.includes(w)) {
              const re = new RegExp('(?<![a-zA-Z])' + term.text + '(?![a-zA-Z])', 'i');
              const m = beforeVerb.search(re);
              if (m !== -1) { subjectPos = m; break; }
            }
          }

          if (subjectPos !== -1) {
            leadingAdverbial = beforeVerb.substring(0, subjectPos).trim();
            subject = beforeVerb.substring(subjectPos).trim();
          } else {
            // 3. No pronoun — look for ProperNoun that isn't the first word
            const propMatch = beforeDoc.match('#ProperNoun+').first();
            if (propMatch.found && propMatch.text().toLowerCase() !== firstWord) {
              const pos = beforeVerb.indexOf(propMatch.text());
              leadingAdverbial = beforeVerb.substring(0, pos).trim();
              subject = beforeVerb.substring(pos).trim();
            } else {
              // 4. Fallback: everything before verb is subject
              subject = beforeVerb;
            }
          }
        }
      } else {
        // No leading adverbial - need to extract subject properly
        // Subject is typically: Determiner? Adjective* Noun+ (or Pronoun)
        const subjectMatch = beforeDoc.match('(#Determiner|#Possessive)? #Adjective* (#Noun+|#Pronoun|#ProperNoun+)').first();
        if (subjectMatch.found) {
          subject = subjectMatch.text();
        } else {
          // Fallback: everything before verb is subject
          subject = beforeVerb;
        }
      }
    }

    // Check if imperative (no subject before verb)
    const isImperative = !subject;

    if (isImperative) {
      // Imperative: no subject, just verb + complement
      if (isBasic) {
        return {
          components: [
            { type: 'V', text: verbPhrase },
            afterVerb ? { type: 'C', text: afterVerb } : null,
          ].filter(c => c),
          isComplex,
          isQuestion: isQuestionSentence,
          error: null,
        };
      } else {
        // For intermediate: try to separate object and adverbial
        const afterDoc = nlp(afterVerb);
        const objMatch = afterDoc.match('#Determiner? #Adjective* (#Noun+|#Pronoun)').first();
        const obj = objMatch.found ? objMatch.text() : '';
        const advMatch = afterDoc.match('#Preposition .+|#Adverb+');
        const adv = advMatch.found ? advMatch.text() : '';

        return {
          components: [
            { type: 'V', text: verbPhrase },
            obj ? { type: 'O', text: obj } : null,
            adv ? { type: 'A', text: adv } : null,
            (!obj && !adv && afterVerb) ? { type: 'C', text: afterVerb } : null,
          ].filter(c => c),
          isComplex,
          isQuestion: isQuestionSentence,
          error: null,
        };
      }
    }

    // Declarative sentence with subject
    if (isBasic) {
      // Básico/Elemental: S / V / C
      // RULE: Fronted adverbials go in C at the start
      // All other content after verb also goes in C
      const components = [];

      // If there's a fronted adverbial, add it as C first (preserve original text exactly)
      if (leadingAdverbial) {
        components.push({ type: 'C', text: leadingAdverbial });
      }

      components.push({ type: 'S', text: subject });
      components.push({ type: 'V', text: verbPhrase });

      // Then add whatever comes after the verb as C
      if (afterVerb) {
        components.push({ type: 'C', text: afterVerb });
      }

      return {
        components: components.filter(c => c),
        isComplex,
        isQuestion: isQuestionSentence,
        error: null,
      };
    } else {
      // Intermedio/Intermedio Alto: S / V / O / A
      const afterDoc = nlp(afterVerb);

      // Check if copular verb
      const isCopular = ['is', 'are', 'was', 'were', 'am', 'be', 'been', 'being', 'seem', 'seems', 'become', 'becomes', 'feel', 'feels'].some(v =>
        verbPhrase.toLowerCase().includes(v)
      );

      if (isCopular) {
        // Copular: fronted adverbial as C, then rest as C
        const components = [];

        if (leadingAdverbial) {
          components.push({ type: 'C', text: leadingAdverbial });
        }

        // Rule 7: Expletive "It" — passive impersonal structure
        // e.g. "It is widely believed that..." → subject is formal placeholder
        const isExpletiveIt = subject.toLowerCase() === 'it' &&
          afterVerb.trim().toLowerCase().startsWith('that');

        components.push({ type: 'S', text: subject, formal: isExpletiveIt });
        components.push({ type: 'V', text: verbPhrase });

        if (afterVerb) {
          components.push({ type: 'C', text: afterVerb });
        }

        // Rule 9: Embedded "that" clause note
        const hasEmbeddedClause = isExpletiveIt;

        return {
          components: components.filter(c => c),
          isComplex,
          isQuestion: isQuestionSentence,
          hasEmbeddedClause,
          error: null,
        };
      }

      // Non-copular: try to separate object and adverbial
      // Priority: if afterVerb starts with an object pronoun, use it directly
      const OBJ_PRONOUNS = new Set(['it','him','her','them','me','us','whom']);
      const firstAVWord = afterVerb.trim().split(/\s+/)[0].toLowerCase().replace(/[,;:.!?]$/, '');
      let obj = '';
      if (OBJ_PRONOUNS.has(firstAVWord)) {
        obj = afterVerb.trim().split(/\s+/)[0];
      } else {
        const objMatch = afterDoc.match('(#Determiner|#Possessive)? #Adjective* #Noun+').first();
        obj = objMatch.found ? objMatch.text() : '';
      }

      const advMatch = afterDoc.match('#Preposition .+|#Adverb+');
      const adv = advMatch.found ? advMatch.text() : '';

      // Build components
      const components = [];

      // Fronted adverbial goes as C (time/place context) - preserve original text
      if (leadingAdverbial) {
        components.push({ type: 'C', text: leadingAdverbial });
      }

      components.push({ type: 'S', text: subject });
      components.push({ type: 'V', text: verbPhrase });

      // Object
      if (obj) {
        components.push({ type: 'O', text: obj });
      }

      // Post-verbal adverbial goes as A
      if (adv) {
        components.push({ type: 'A', text: adv });
      }

      // Capture any remaining text not accounted for by obj/adv → C
      // This handles cases like "prefer it because they..." where "because..." must not be lost
      let remaining = afterVerb;
      if (obj) remaining = remaining.substring(remaining.indexOf(obj) + obj.length).trim();
      if (adv) remaining = remaining.replace(adv, '').trim();
      remaining = remaining.replace(/^[,;]+/, '').trim();
      if (remaining) {
        // Single word left over (e.g. a trailing adverb "earlier") → absorb into O, not a new block
        if (obj && !/\s/.test(remaining)) {
          const oIdx = components.findIndex(c => c.type === 'O');
          if (oIdx !== -1) components[oIdx] = { ...components[oIdx], text: components[oIdx].text + ' ' + remaining };
        } else {
          components.push({ type: 'C', text: remaining });
        }
      }

      return {
        components: components.filter(c => c),
        isComplex,
        isQuestion: isQuestionSentence,
        error: null,
      };
    }
  } catch (err) {
    console.error('Structure analysis error:', err);
    return {
      components: [],
      isComplex,
      isQuestion: isQuestionSentence,
      error: 'Could not parse sentence structure',
    };
  }
}

// Coordinating conjunctions — split into equal rows
const COORD_CONJ = ['and', 'but', 'or', 'so', 'yet'];

// Subordinating conjunctions used for fronted-clause detection (Rule 3)
const SUBORD_CONJ = [
  'when', 'because', 'if', 'although', 'while', 'before', 'after',
  'until', 'since', 'that', 'who', 'which', 'where', 'though', 'unless',
  'once', 'as', 'whereas', 'whenever', 'provided',
  'even though', 'even if', 'so that', 'in case', 'now that',
  'as soon as', 'as long as',
];

// Subordinating conjunctions that introduce a visible separate clause row
// when both sides have S+V (because, when, although, while…)
const SUBORD_SPLIT_CONJ = ['because', 'when', 'although', 'while', 'whereas', 'though', 'before', 'after', 'until', 'since', 'once', 'whenever', 'provided', 'even though', 'even if', 'in case', 'now that', 'unless', 'so that'];

// Try to split a sentence at the first clause-level conjunction (coord or subord).
// Returns { first, conj, second } or null.
function splitOnClauseConj(sentenceText) {
  const lower = sentenceText.toLowerCase().trim();

  // 0. Fronted "if" clause: "If you ..., main clause"
  //    first = clause after "if" and before comma (no "if" prefix)
  //    conj  = "if"
  //    second = main clause after the comma
  if (lower.startsWith('if ')) {
    const commaIdx = sentenceText.indexOf(',');
    if (commaIdx !== -1) {
      const first  = sentenceText.substring(3, commaIdx).trim(); // strip leading "if "
      const second = sentenceText.substring(commaIdx + 1).trim();
      if (first.split(/\s+/).length >= 2 && second && nlp(second).verbs().length > 0) {
        return { first, conj: 'if', second };
      }
    }
  }

  // Helper: true if text has a verb that is NOT inside a subordinate clause
  const hasTopLevelVerb = (text) => {
    const verbDoc = nlp(text).verbs().first();
    if (!verbDoc.found) return false;
    const verbPos = text.toLowerCase().indexOf(verbDoc.text().toLowerCase());
    if (verbPos === -1) return false;
    const before = text.toLowerCase().substring(0, verbPos);
    return !SUBORD_CONJ.some(sc => new RegExp(`\\b${sc}\\b`).test(before));
  };

  // 1. Coordinating conjunctions (not inside a subordinate clause)
  for (const conj of COORD_CONJ) {
    const m = lower.match(new RegExp(`\\b${conj}\\b`, 'i'));
    if (!m) continue;
    const idx = m.index;
    const textBefore = lower.substring(0, idx);
    const insideSubord = SUBORD_CONJ.some(sc =>
      new RegExp(`\\b${sc}\\b`).test(textBefore)
    );
    if (insideSubord) continue;
    const first  = sentenceText.substring(0, idx).trim().replace(/[,]+$/, '').trim();
    const second = sentenceText.substring(idx + conj.length).trim();
    // Both sides must have a top-level verb (not buried inside a subordinate clause)
    if (first && second && hasTopLevelVerb(first) && hasTopLevelVerb(second)) {
      return { first, conj, second };
    }
  }

  // 2. Subordinating conjunctions (because/when/although…)
  //    The conjunction is NOT included in the second clause text
  for (const conj of SUBORD_SPLIT_CONJ) {
    const m = lower.match(new RegExp(`\\b${conj}\\b`, 'i'));
    if (!m) continue;
    const idx = m.index;
    const first  = sentenceText.substring(0, idx).trim().replace(/[,]+$/, '').trim();
    const second = sentenceText.substring(idx + conj.length).trim();
    // For subordinating conjunctions, only require the second clause to have a verb.
    // The first clause may contain verbs compromise misses (e.g. "feel isolated").
    if (first.split(/\s+/).length >= 2 && second && nlp(second).verbs().length > 0) {
      return { first, conj, second };
    }
  }

  return null;
}

// Extract the subject text from a components array
function subjectFromComponents(components) {
  const s = (components || []).find(c => c.type === 'S');
  return s ? s.text : '';
}

// Recursively split a clause text into rows, handling multiple conjunctions
function buildClauseRows(text, level, inheritedSubject = null) {
  const split = splitOnClauseConj(text);

  if (!split) {
    const analysis = analyzeSentenceStructure(text, level);
    const components = analysis.components || [];
    // Add implied subject if the clause has no subject (ellipsis)
    if (inheritedSubject && !components.find(c => c.type === 'S')) {
      components.unshift({ type: 'S', text: inheritedSubject, implied: true });
    }
    return [{ components }];
  }

  const r1 = analyzeSentenceStructure(split.first, level);
  const firstComponents = r1.components || [];
  const firstSubject = subjectFromComponents(firstComponents);

  // For "if", show the connector BEFORE the condition clause (since "if" opens it)
  // For all others, show the connector BETWEEN clause 1 and clause 2
  if (split.conj === 'if') {
    return [
      { isConjunction: true, text: split.conj },
      { components: firstComponents },
      ...buildClauseRows(split.second, level, firstSubject),
    ];
  }

  return [
    { components: firstComponents },
    { isConjunction: true, text: split.conj },
    ...buildClauseRows(split.second, level, firstSubject),
  ];
}

// Analyze all sentences in the text — returns rows instead of flat components
function analyzeStructure(text, level) {
  const doc = nlp(text);
  const sentences = doc.sentences().json();

  return sentences.map((s, idx) => {
    const sentText = s.text;
    const base = analyzeSentenceStructure(sentText, level);
    const rows = buildClauseRows(sentText, level);

    return {
      id: idx,
      text: sentText,
      isComplex: base.isComplex,
      isQuestion: base.isQuestion,
      hasEmbeddedClause: base.hasEmbeddedClause || false,
      error: base.error,
      rows,
    };
  });
}

// ── Phrasal Verb detection data ─────────────────────────────────────────────
// Each entry: [verbBase, ...particles]
const PHRASAL_VERB_LIST = [
  // Starter / Book 1
  ['get','up'], ['wake','up'], ['sit','down'], ['stand','up'],
  ['go','out'], ['come','in'], ['put','on'], ['take','off'],
  ['turn','on'], ['turn','off'], ['pick','up'], ['put','down'],
  ['come','back'], ['go','back'], ['look','at'], ['listen','to'],
  // Book 2 / Book 3
  ['find','out'], ['give','up'], ['look','for'], ['look','after'],
  ['carry','on'], ['set','up'], ['turn','up'], ['turn','down'],
  ['go','on'], ['come','on'], ['take','up'], ['take','out'],
  ['take','back'], ['bring','up'], ['bring','back'],
  ['run','out'], ['run','into'],
  ['come','up','with'], ['look','forward','to'],
  ['get','on'], ['get','off'], ['get','along'], ['get','back'],
  ['give','back'],
];

// Build lookup: normalized verb base → [[particles...], ...]
const PHRASAL_BY_VERB = new Map();
for (const pv of PHRASAL_VERB_LIST) {
  const base = pv[0];
  if (!PHRASAL_BY_VERB.has(base)) PHRASAL_BY_VERB.set(base, []);
  PHRASAL_BY_VERB.get(base).push(pv.slice(1));
}

// Normalize an inflected verb to its base form (covers phrasal-verb stems only)
const PV_IRREGULAR = {
  got:'get', gets:'get', gotten:'get', getting:'get',
  woke:'wake', woken:'wake', wakes:'wake', waking:'wake',
  sat:'sit', sits:'sit', sitting:'sit',
  stood:'stand', stands:'stand', standing:'stand',
  went:'go', goes:'go', going:'go', gone:'go',
  came:'come', comes:'come', coming:'come',
  put:'put', puts:'put', putting:'put',
  took:'take', takes:'take', taken:'take', taking:'take',
  turned:'turn', turns:'turn', turning:'turn',
  picked:'pick', picks:'pick', picking:'pick',
  found:'find', finds:'find', finding:'find',
  gave:'give', gives:'give', given:'give', giving:'give',
  looked:'look', looks:'look', looking:'look',
  carried:'carry', carries:'carry', carrying:'carry',
  set:'set', sets:'set', setting:'set',
  ran:'run', runs:'run', running:'run',
  brought:'bring', brings:'bring', bringing:'bring',
  listened:'listen', listens:'listen', listening:'listen',
  gotten:'get', gotten:'get',
};
function normVerb(word) {
  const w = word.toLowerCase();
  if (PV_IRREGULAR[w]) return PV_IRREGULAR[w];
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
  if (w.endsWith('ied') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('ed')  && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('es')  && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('s')   && w.length > 3) return w.slice(0, -1);
  return w;
}

// Hardcoded lexicon for common function words that compromise.js
// sometimes misclassifies (especially when capitalized at sentence start)
const WORD_LEXICON = new Map(Object.entries({
  // personal pronouns
  i:'pronoun',  me:'pronoun',  myself:'pronoun',
  you:'pronoun', yourself:'pronoun', yourselves:'pronoun',
  he:'pronoun',  him:'pronoun',  himself:'pronoun',
  she:'pronoun', herself:'pronoun',
  it:'pronoun',  itself:'pronoun',
  we:'pronoun',  us:'pronoun',   ourselves:'pronoun',
  they:'pronoun', them:'pronoun', themselves:'pronoun',
  // possessive determiners (unambiguous ones only)
  my:'determiner',   your:'determiner',  his:'determiner',
  its:'determiner',  our:'determiner',   their:'determiner',
  // possessive pronouns
  mine:'pronoun', yours:'pronoun', hers:'pronoun',
  ours:'pronoun', theirs:'pronoun',
  // interrogative / relative pronouns and adverbs
  what:'pronoun', which:'pronoun', who:'pronoun', whom:'pronoun', whose:'determiner',
  where:'adverb', when:'adverb', why:'adverb', how:'adverb',
  // Note: full contractions (what's, it's, he's, don't, etc.) are handled
  // by the CONTRACTION_SPLITS map below — they render as two colored parts.
  // articles (determiners)
  the:'determiner', a:'determiner', an:'determiner',
  // auxiliary verbs
  do:'auxiliary', does:'auxiliary', did:'auxiliary',
  is:'auxiliary', are:'auxiliary', am:'auxiliary', was:'auxiliary', were:'auxiliary',
  have:'auxiliary', has:'auxiliary', had:'auxiliary',
  been:'auxiliary', being:'auxiliary',
  // core modals
  can:'modal',   could:'modal',  will:'modal',  would:'modal',
  shall:'modal', should:'modal', may:'modal',   might:'modal',
  must:'modal',
  // contractions
  "'s":'auxiliary',  "'re":'auxiliary', "'m":'auxiliary', "'d":'auxiliary',
  "'ll":'modal', "'ve":'auxiliary',
  // common adjectives that compromise might misclassify
  best:'adjective', better:'adjective', worst:'adjective', worse:'adjective',
}));

// Contractions that render as two POS-colored parts.
// Key: lowercase full token. Value: [{text, pos}, {text, pos}]
// "'s" as VERB = copular main verb ("is/are"). "'s" as AUX = helper before another verb.
const CONTRACTION_SPLITS = new Map([
  // Wh-interrogative + is (main verb)
  ["what's",  [{text:'What',  pos:'wh'}, {text:"'s", pos:'verb'}]],
  ["who's",   [{text:'Who',   pos:'wh'}, {text:"'s", pos:'verb'}]],
  ["where's", [{text:'Where', pos:'wh'}, {text:"'s", pos:'verb'}]],
  ["when's",  [{text:'When',  pos:'wh'}, {text:"'s", pos:'verb'}]],
  ["how's",   [{text:'How',   pos:'wh'}, {text:"'s", pos:'verb'}]],
  ["that's",  [{text:'That',  pos:'pronoun'}, {text:"'s", pos:'verb'}]],
  ["there's", [{text:'There', pos:'adverb'},  {text:"'s", pos:'verb'}]],
  ["here's",  [{text:'Here',  pos:'adverb'},  {text:"'s", pos:'verb'}]],
  // Pronoun + is/are/have/will/would/had (auxiliary)
  ["it's",    [{text:'It',    pos:'pronoun'}, {text:"'s",  pos:'auxiliary'}]],
  ["he's",    [{text:'He',    pos:'pronoun'}, {text:"'s",  pos:'auxiliary'}]],
  ["she's",   [{text:'She',   pos:'pronoun'}, {text:"'s",  pos:'auxiliary'}]],
  ["i'm",     [{text:'I',     pos:'pronoun'}, {text:"'m",  pos:'auxiliary'}]],
  ["you're",  [{text:'You',   pos:'pronoun'}, {text:"'re", pos:'auxiliary'}]],
  ["we're",   [{text:'We',    pos:'pronoun'}, {text:"'re", pos:'auxiliary'}]],
  ["they're", [{text:'They',  pos:'pronoun'}, {text:"'re", pos:'auxiliary'}]],
  ["i've",    [{text:'I',     pos:'pronoun'}, {text:"'ve", pos:'auxiliary'}]],
  ["you've",  [{text:'You',   pos:'pronoun'}, {text:"'ve", pos:'auxiliary'}]],
  ["we've",   [{text:'We',    pos:'pronoun'}, {text:"'ve", pos:'auxiliary'}]],
  ["they've", [{text:'They',  pos:'pronoun'}, {text:"'ve", pos:'auxiliary'}]],
  ["i'll",    [{text:'I',     pos:'pronoun'}, {text:"'ll", pos:'modal'}]],
  ["you'll",  [{text:'You',   pos:'pronoun'}, {text:"'ll", pos:'modal'}]],
  ["he'll",   [{text:'He',    pos:'pronoun'}, {text:"'ll", pos:'modal'}]],
  ["she'll",  [{text:'She',   pos:'pronoun'}, {text:"'ll", pos:'modal'}]],
  ["we'll",   [{text:'We',    pos:'pronoun'}, {text:"'ll", pos:'modal'}]],
  ["they'll", [{text:'They',  pos:'pronoun'}, {text:"'ll", pos:'modal'}]],
  ["it'll",   [{text:'It',    pos:'pronoun'}, {text:"'ll", pos:'modal'}]],
  ["i'd",     [{text:'I',     pos:'pronoun'}, {text:"'d",  pos:'modal'}]],
  ["you'd",   [{text:'You',   pos:'pronoun'}, {text:"'d",  pos:'modal'}]],
  ["he'd",    [{text:'He',    pos:'pronoun'}, {text:"'d",  pos:'modal'}]],
  ["she'd",   [{text:'She',   pos:'pronoun'}, {text:"'d",  pos:'modal'}]],
  ["we'd",    [{text:'We',    pos:'pronoun'}, {text:"'d",  pos:'modal'}]],
  ["they'd",  [{text:'They',  pos:'pronoun'}, {text:"'d",  pos:'modal'}]],
  // Negated auxiliaries
  ["isn't",   [{text:'is',    pos:'auxiliary'},{text:"n't", pos:'adverb'}]],
  ["aren't",  [{text:'are',   pos:'auxiliary'},{text:"n't", pos:'adverb'}]],
  ["wasn't",  [{text:'was',   pos:'auxiliary'},{text:"n't", pos:'adverb'}]],
  ["weren't", [{text:'were',  pos:'auxiliary'},{text:"n't", pos:'adverb'}]],
  ["don't",   [{text:'do',    pos:'auxiliary'},{text:"n't", pos:'adverb'}]],
  ["doesn't", [{text:'does',  pos:'auxiliary'},{text:"n't", pos:'adverb'}]],
  ["didn't",  [{text:'did',   pos:'auxiliary'},{text:"n't", pos:'adverb'}]],
  ["haven't", [{text:'have',  pos:'auxiliary'},{text:"n't", pos:'adverb'}]],
  ["hasn't",  [{text:'has',   pos:'auxiliary'},{text:"n't", pos:'adverb'}]],
  ["hadn't",  [{text:'had',   pos:'auxiliary'},{text:"n't", pos:'adverb'}]],
  ["can't",   [{text:'can',   pos:'modal'},    {text:"n't", pos:'adverb'}]],
  ["couldn't",[{text:'could', pos:'modal'},    {text:"n't", pos:'adverb'}]],
  ["won't",   [{text:'will',  pos:'modal'},    {text:"n't", pos:'adverb'}]],
  ["wouldn't",[{text:'would', pos:'modal'},    {text:"n't", pos:'adverb'}]],
  ["shouldn't",[{text:'should',pos:'modal'},   {text:"n't", pos:'adverb'}]],
  ["mustn't", [{text:'must',  pos:'modal'},    {text:"n't", pos:'adverb'}]],
  ["mightn't",[{text:'might', pos:'modal'},   {text:"n't", pos:'adverb'}]],
  ["shan't",  [{text:'shall', pos:'modal'},   {text:"n't", pos:'adverb'}]],
  // Suggestions
  ["let's",   [{text:'Let',   pos:'verb'},    {text:"'s",  pos:'pronoun'}]],
]);

// Priority-ordered rules that map compromise's internal tag names to
// our 10 POS categories
const POS_TAG_RULES = [
  ['modal',       ['Modal']],
  ['auxiliary',   ['Auxiliary']],
  ['conjunction', ['Conjunction', 'Correlative']],
  ['preposition', ['Preposition']],
  ['pronoun',     ['Pronoun', 'Possessive', 'Personal', 'Reflexive',
                   'Relative', 'Demonstrative', 'Indefinite']],
  ['determiner',  ['Determiner', 'Article']],
  ['number',      ['Value', 'NumericValue', 'Cardinal']],
  ['adverb',      ['Adverb', 'Negative']],
  ['adjective',   ['Adjective', 'Comparable', 'Superlative', 'Ordinal']],
  ['verb',        ['Verb', 'PastTense', 'PresentTense', 'Gerund',
                   'Infinitive', 'Participle', 'Copula']],
  ['noun',        ['Noun', 'Plural', 'ProperNoun', 'Person',
                   'Place', 'Organization', 'Acronym']],
];

function mapTagsToPos(tagObj) {
  if (!tagObj) return null;
  const tagSet = new Set(
    Array.isArray(tagObj)
      ? tagObj
      : Object.keys(tagObj).filter(k => tagObj[k] !== false)
  );
  if (tagSet.size === 0) return null;
  for (const [pos, checkTags] of POS_TAG_RULES) {
    if (checkTags.some(t => tagSet.has(t))) return pos;
  }
  return null;
}

// Main tokenizer function
function tokenizeText(inputText, level = 'Intermedio') {
  const doc = nlp(inputText);

  const rawTerms = [];
  doc.json().forEach(s => rawTerms.push(...(s.terms || [])));
  if (rawTerms.length === 0) return [];

  // Filter out empty tokens (compromise sometimes creates empty tokens with contractions)
  const validTerms = rawTerms.filter(t => t.text && t.text.trim().length > 0);

  // Sentence-start indices (skip capitalisation heuristic there)
  const sentStarts = new Set();
  let newSent = true;
  validTerms.forEach((t, i) => {
    if (newSent && t.text.trim()) { sentStarts.add(i); newSent = false; }
    if (/[.!?]$/.test((t.post || '').trimEnd())) newSent = true;
  });

  const tokens = validTerms.map((t, i) => {
    const isPunct = /^[.,!?;:'"()\[\]{}\-–—…]+$/.test(t.text.trim());
    let pos = null;
    if (!isPunct) {
      const lower = t.text.toLowerCase();
      // 1. Hardcoded lexicon (highest priority)
      const lexiconMatch = WORD_LEXICON.get(lower);
      if (lexiconMatch) {
        pos = lexiconMatch;
      }
      // 2. Sentence-context tags
      else {
        pos = mapTagsToPos(t.tags);
      }
      // 3. Capitalisation heuristic (proper nouns — Case 1 of Rule 11)
      if (!pos && !sentStarts.has(i)) {
        const c = t.text[0];
        if (c && c >= 'A' && c <= 'Z') pos = 'noun';
      }
    }
    // Rule 11 — unrecognized word classification
    let unrecognized = false;
    if (!isPunct && !pos) {
      const w = t.text;
      if (/[0-9]/.test(w) || /[^a-zA-ZÀ-ÿ'\-]/.test(w)) {
        // Case 3: contains numbers or special chars → render as plain text
        // leave pos = null, isPunct-like behavior handled in WordToken
      } else {
        // Case 2: lowercase unrecognized word
        unrecognized = true;
      }
    }
    // Apply CONTRACTION_SPLITS: mark token with splitParts so WordToken renders two colored parts
    const split = CONTRACTION_SPLITS.get(t.text.toLowerCase());
    const nlpTags = !isPunct ? Object.keys(t.tags || {}).filter(k => (t.tags||{})[k] !== false) : [];
    if (split && !isPunct) {
      // Use first part's POS as the token's own pos (for stats counting etc.)
      pos = split[0].pos;
      unrecognized = false;
      return { id: i, text: t.text, pre: t.pre || '', post: t.post || '', pos, isPunct, unrecognized, splitParts: split, nlpTags };
    }
    return { id: i, text: t.text, pre: t.pre || '', post: t.post || '', pos, isPunct, unrecognized, nlpTags };
  });

  // ── Post-processing: differentiate auxiliary vs. copular "be" verbs ──────────
  // be + V-ing (progressive) or be + V-participle (passive) → auxiliary
  // be + noun / adjective / preposition / adverb / pronoun → verb (copula)
  const BE_VERBS = new Set(['am','is','are','was','were','been','being']);
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.isPunct || tok.pos !== 'auxiliary') continue;
    if (!BE_VERBS.has(tok.text.toLowerCase())) continue;
    // Look ahead (up to 6 tokens) for a participial form
    // compromise sometimes tags -ing words as 'adjective', so we check text too
    let nextVerb = null;
    for (let j = i + 1; j < tokens.length && j <= i + 6; j++) {
      const t = tokens[j];
      if (t.isPunct) continue;
      const tLow = t.text.toLowerCase();
      if (t.pos === 'verb') { nextVerb = t; break; }
      // -ing classified as adjective (compromise quirk with gerunds in questions)
      if (tLow.endsWith('ing') && t.pos !== 'auxiliary' && t.pos !== 'modal') { nextVerb = t; break; }
      // past participle classified as adjective but tagged Participle by NLP
      if (t.nlpTags.includes('Participle') && t.pos === 'adjective') { nextVerb = t; break; }
    }
    if (!nextVerb) {
      tok.pos = 'verb'; // no following participial → copula ("She is a teacher")
      continue;
    }
    const isParticipial =
      nextVerb.nlpTags.includes('Gerund') ||
      nextVerb.nlpTags.includes('Participle') ||
      nextVerb.text.toLowerCase().endsWith('ing') ||
      nextVerb.text.toLowerCase().endsWith('ed') ||
      nextVerb.text.toLowerCase().endsWith('en');
    if (!isParticipial) tok.pos = 'verb'; // copula, not progressive/passive
  }

  // ── Post-processing: RULE 16 — classify have/has/had (perfect vs obligation vs possession) ──
  const HAVE_VERBS_R16 = new Set(['have', 'has', 'had']);
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.isPunct || !HAVE_VERBS_R16.has(tok.text.toLowerCase())) continue;
    if (tok.pos !== 'auxiliary') continue;

    // Find immediate next non-punct token (to check for CASE 2 "to")
    let j = i + 1;
    while (j < tokens.length && tokens[j].isPunct) j++;
    if (j >= tokens.length) { tok.pos = 'verb'; continue; }
    const next = tokens[j];

    // CASE 2: have + to + infinitive → merge as single auxiliary chunk "have to"
    if (next.text.toLowerCase() === 'to') {
      let k = j + 1;
      while (k < tokens.length && tokens[k].isPunct) k++;
      const afterTo = k < tokens.length ? tokens[k] : null;
      if (afterTo && (afterTo.pos === 'verb' || afterTo.nlpTags.some(t => ['Verb', 'Infinitive'].includes(t)))) {
        tok.text = tok.text + ' ' + next.text;
        tok.post = next.post || '';
        tokens.splice(j, 1); // remove standalone "to" token
      }
      continue;
    }

    // Distinguish CASE 1 (perfect: have + past participle) vs CASE 3 (possession: have + noun)
    // If next non-punct token is a subject pronoun/noun, look past it for a participle
    // This handles perfect questions: "Have you eaten?" → have(AUX) + you(subject) + eaten(V)
    if (next.pos === 'pronoun' || next.pos === 'noun') {
      let k = j + 1;
      while (k < tokens.length && (tokens[k].isPunct || tokens[k].pos === 'adverb')) k++;
      if (k < tokens.length) {
        const afterSubject = tokens[k];
        const asLow = afterSubject.text.toLowerCase();
        const isParticipleAhead =
          afterSubject.pos === 'verb' ||
          afterSubject.nlpTags.includes('Participle') ||
          afterSubject.nlpTags.includes('PastTense') ||
          asLow.endsWith('ed') ||
          asLow.endsWith('en');
        if (isParticipleAhead) continue; // CASE 1: perfect question → keep as auxiliary
      }
      // No participle found → CASE 3
      tok.pos = 'verb';
      continue;
    }

    // Skip adverbs to find the content word (e.g., "have never played" → skip "never")
    let k = i + 1;
    while (k < tokens.length && (tokens[k].isPunct || tokens[k].pos === 'adverb')) k++;
    if (k >= tokens.length) { tok.pos = 'verb'; continue; }
    const nextContent = tokens[k];

    // CASE 1: have + past participle → keep as auxiliary (perfect tense)
    const cLow = nextContent.text.toLowerCase();
    const isParticipial =
      nextContent.pos === 'verb' ||
      nextContent.pos === 'auxiliary' || // have been...
      nextContent.nlpTags.includes('Participle') ||
      nextContent.nlpTags.includes('PastTense') ||
      nextContent.nlpTags.includes('Gerund') ||
      cLow.endsWith('ed') ||
      cLow.endsWith('en');
    if (isParticipial) continue;

    // CASE 3: have + nominal → main verb (possession)
    tok.pos = 'verb';
  }

  // Context-aware correction for questions in POS tagging
  // Check if this is a question
  if (isQuestion(inputText)) {
    // Find the first auxiliary or modal
    let auxIndex = -1;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].pos === 'auxiliary' || tokens[i].pos === 'modal') {
        auxIndex = i;
        break;
      }
    }

    // If we found an auxiliary/modal, apply the same logic as in structure analysis
    if (auxIndex !== -1) {
      let lastSubjectIndex = -1;
      let previousWasConjunction = false;

      for (let j = auxIndex + 1; j < tokens.length; j++) {
        const currentToken = tokens[j];

        if (currentToken.pos === 'pronoun') {
          lastSubjectIndex = j;
          previousWasConjunction = false;
        } else if (currentToken.pos === 'determiner') {
          lastSubjectIndex = j;
          previousWasConjunction = false;
        } else if (currentToken.pos === 'conjunction') {
          lastSubjectIndex = j;
          previousWasConjunction = true;
        } else if (currentToken.pos === 'noun') {
          if (previousWasConjunction) {
            lastSubjectIndex = j;
            previousWasConjunction = false;
          } else if (j === auxIndex + 1 || tokens[j - 1].pos === 'determiner') {
            lastSubjectIndex = j;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      // Convert the main verb after the subject to 'verb'
      // Skip any additional auxiliary chunks (e.g., "have to" compound) to find the actual verb
      if (lastSubjectIndex !== -1 && lastSubjectIndex + 1 < tokens.length) {
        let candidateIdx = lastSubjectIndex + 1;
        while (candidateIdx < tokens.length &&
               !tokens[candidateIdx].isPunct &&
               tokens[candidateIdx].pos === 'auxiliary') {
          candidateIdx++;
        }
        if (candidateIdx < tokens.length && !tokens[candidateIdx].isPunct) {
          tokens[candidateIdx].pos = 'verb';
        }
      }
    }
  }

  // Post-processing: Fix copular verbs (is, are, was, were, am) that are main verbs, not auxiliaries
  // If a copular verb is NOT followed by a verb/gerund/participle, it's the main verb
  const copularVerbs = ['is', 'are', 'was', 'were', 'am'];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.pos === 'auxiliary' && copularVerbs.includes(token.text.toLowerCase())) {
      // Check if there's a verb/gerund/participle after this copular verb
      let isAuxiliary = false;
      for (let j = i + 1; j < tokens.length; j++) {
        const nextToken = tokens[j];

        // Skip punctuation, determiners, and pronouns (subjects in inverted questions: "is he playing?")
        if (nextToken.isPunct || nextToken.pos === 'determiner' || nextToken.pos === 'pronoun') {
          continue;
        }

        // If followed by verb, gerund (-ing), or participle (-ed), it's an auxiliary
        if (nextToken.pos === 'verb') {
          isAuxiliary = true;
          break;
        }

        // Check for gerund (word ending in -ing) or participle (word ending in -ed)
        const nextWord = nextToken.text.toLowerCase();
        if (nextWord.endsWith('ing') || nextWord.endsWith('ed')) {
          isAuxiliary = true;
          break;
        }

        // Stop if we hit a punctuation that ends a clause
        if (nextToken.isPunct && ['.', '!', '?', ';', ','].includes(nextToken.text)) {
          break;
        }

        // If we hit a noun, adjective, preposition, or adverb, it's NOT an auxiliary
        if (['noun', 'adjective', 'preposition', 'adverb'].includes(nextToken.pos)) {
          break;
        }
      }

      // If not an auxiliary, this is the main verb
      if (!isAuxiliary) {
        token.pos = 'verb';
      }
    }
  }

  // ── Post-processing: "used to + verb" → single auxiliary chunk ───────────────
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.isPunct || tok.pos !== 'verb') continue;
    if (tok.text.toLowerCase() !== 'used') continue;

    let j = i + 1;
    while (j < tokens.length && tokens[j].isPunct) j++;
    if (j >= tokens.length || tokens[j].text.toLowerCase() !== 'to') continue;

    let k = j + 1;
    while (k < tokens.length && tokens[k].isPunct) k++;
    if (k >= tokens.length) continue;
    const afterTo = tokens[k];
    if (afterTo.pos === 'verb' || afterTo.nlpTags.some(t => ['Verb', 'Infinitive'].includes(t))) {
      tok.pos = 'auxiliary';
      tok.text = tok.text + ' ' + tokens[j].text;
      tok.post = tokens[j].post || '';
      tokens.splice(j, 1);
    }
  }

  // ── Post-processing: tag wh- words as 'wh' in question sentences ─────────
  const WH_WORD_SET = new Set([
    'what','who','whom','which','whose',
    'where','when','why','how',
    'whatever','whoever','wherever','whenever','however','whichever',
  ]);
  if (isQuestion(inputText)) {
    for (const tok of tokens) {
      if (!tok.isPunct && WH_WORD_SET.has(tok.text.toLowerCase())) {
        tok.pos = 'wh';
      }
    }
  }

  // ── Post-processing: merge compound WH expressions into single WH token ─────
  const HOW_COMPOUNDS = new Set([
    'long','much','many','often','far','old','tall','big',
    'good','well','fast','late','early','hard','loud',
  ]);
  if (isQuestion(inputText)) {
    for (let i = 0; i < tokens.length - 1; i++) {
      const tok = tokens[i];
      if (tok.isPunct || tok.pos !== 'wh') continue;
      const lower = tok.text.toLowerCase();
      let j = i + 1;
      while (j < tokens.length && tokens[j].isPunct) j++;
      if (j >= tokens.length) continue;
      const next = tokens[j];
      if (next.isPunct) continue;
      const nextLower = next.text.toLowerCase();
      const shouldMerge =
        (lower === 'how' && HOW_COMPOUNDS.has(nextLower)) ||
        ((lower === 'what' || lower === 'which' || lower === 'whose') && next.pos === 'noun');
      if (shouldMerge) {
        tok.text = tok.text + ' ' + next.text;
        tokens.splice(j, 1);
      }
    }
  }

  // ── Post-processing: Phrasal Verb detection ──────────────────────────────
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.isPunct || !tok.pos) continue;
    // Only check verb/aux/modal tokens
    if (!['verb','auxiliary','modal'].includes(tok.pos)) continue;

    const base = normVerb(tok.text);
    const particleSets = PHRASAL_BY_VERB.get(base);
    if (!particleSets) continue;

    for (const particles of particleSets) {
      // -- Case 1: adjacent (verb directly before particle(s)) --
      let j = i + 1;
      const matchIdx = [];
      let pIdx = 0;
      while (j < tokens.length && pIdx < particles.length) {
        if (tokens[j].isPunct) { j++; continue; }
        if (tokens[j].text.toLowerCase() === particles[pIdx]) {
          matchIdx.push(j);
          pIdx++;
          j++;
        } else {
          break;
        }
      }
      if (matchIdx.length === particles.length) {
        const pvLabel = [base, ...particles].join(' ');
        tok.phrasalVerb = pvLabel;
        tok.isPhrasalHead = true;
        tok.phrasalAdjacent = true;
        for (const mi of matchIdx) {
          tokens[mi].phrasalVerb = pvLabel;
          tokens[mi].isPhrasalParticle = true;
          tokens[mi].phrasalAdjacent = true;
          tokens[mi].pos = 'verb';
        }
        break;
      }

      // -- Case 2: separated (verb [NP] particle) — only single-particle PVs --
      if (particles.length === 1 && !tok.phrasalVerb) {
        let k = i + 1;
        let npOnly = true;
        while (k < Math.min(i + 6, tokens.length) && npOnly) {
          if (tokens[k].isPunct) { k++; continue; }
          const posK = tokens[k].pos;
          if (tokens[k].text.toLowerCase() === particles[0]) {
            const pvLabel = [base, ...particles].join(' ');
            tok.phrasalVerb = pvLabel;
            tok.isPhrasalHead = true;
            tokens[k].phrasalVerb = pvLabel;
            tokens[k].isPhrasalParticle = true;
            tokens[k].phrasalSeparated = true;
            tokens[k].pos = 'verb';
            npOnly = false;
          } else if (['noun','pronoun','determiner','adjective'].includes(posK)) {
            k++;
          } else {
            npOnly = false;
          }
        }
        if (tok.phrasalVerb) break;
      }
    }
  }

  // ── Post-processing: absorb NUM into DET at Básico / Elemental levels ────────
  if (level === 'Básico' || level === 'Elemental') {
    for (const tok of tokens) {
      if (!tok.isPunct && tok.pos === 'number') tok.pos = 'determiner';
    }
  }

  // ── Post-processing: QUANT_DETS — tag quantifiers as determiner before nouns ─
  const QUANT_DETS = new Set(['some','any','each','every','either','neither','both']);
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.isPunct || !QUANT_DETS.has(tok.text.toLowerCase())) continue;
    let j = i + 1;
    while (j < tokens.length && tokens[j].isPunct) j++;
    if (j >= tokens.length) continue;
    const next = tokens[j];
    if (next.pos === 'noun' || next.pos === 'adjective' || next.pos === 'determiner') {
      tok.pos = 'determiner';
    }
  }

  return tokens;
}

/* ═══════════════════════════════════════════════════════════
   WORD TOKEN (renders analyzed words with POS highlighting)
═══════════════════════════════════════════════════════════ */

function WordToken({ text, pos, isPunct, unlocked, showLabels, phrasalVerb, phrasalAdjacent, unrecognized, splitParts }) {
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
            const bg  = ok ? cfg.bg    : '#F1F5F9';
            const col = ok ? cfg.color : '#94A3B8';
            return (
              <ruby key={idx} title={ok ? cfg.name : '(locked for this level)'}>
                <span
                  className="inline-block px-1.5 py-0.5 cursor-default"
                  style={{
                    background: bg, color: col, fontWeight: ok ? 500 : 400,
                    borderRadius: idx === 0 ? '4px 0 0 4px' : '0 4px 4px 0',
                    borderRight: idx === 0 ? `1px solid ${ok ? col + '55' : '#CBD5E1'}` : 'none',
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
        title="Word not recognized — check spelling"
        className="inline-block px-1.5 py-0.5 rounded cursor-default"
        style={{
          background: 'white',
          color: '#EF4444',
          border: '2px dashed #EF4444',
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
  const bg = ok ? cfg.bg : '#F1F5F9';
  const col = ok ? cfg.color : '#94A3B8';

  const pvTooltip = phrasalVerb
    ? `Phrasal verb — "${phrasalVerb}" works as a single verb`
    : (ok ? cfg.name : '(locked for this level)');

  return (
    <ruby title={pvTooltip}>
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
  unlocked,
}) {
  const { text, isPunct } = token;

  // Punctuation is not clickable
  if (isPunct) {
    return <span className="text-slate-700">{text}</span>;
  }

  // Unrecognized word — not clickable, shown with dashed red border
  if (token.unrecognized) {
    return (
      <span
        title="Word not recognized — check spelling"
        className="inline-block px-2 py-1 rounded-lg cursor-not-allowed"
        style={{ background: 'white', color: '#EF4444', border: '2px dashed #EF4444' }}
      >
        {text}
      </span>
    );
  }

  // Handle POS mode
  if (!isStructureMode) {
    const hasUserTag = !!userTag;
    // Phrasal verb particle: also correct if student tags it as 'verb'
    const isCorrect = answerChecked && (
      userTag === correctTag ||
      (token.isPhrasalParticle && userTag === 'verb')
    );
    const isIncorrect = answerChecked && userTag && !isCorrect;
    const isUntagged = answerChecked && !userTag;

    let bg = '#F8FAFC';
    let col = '#64748B';
    let borderColor = '#E2E8F0';
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
          ? (token.isPhrasalParticle ? `Phrasal verb — "${token.phrasalVerb}" — tag as Verb` : POS[correctTag].name)
          : (isIncorrect && token.isPhrasalParticle ? `'${token.text}' in '${token.phrasalVerb}' is part of a phrasal verb — tag it as Verb` : 'Click to tag')
      }>
        <span
          onClick={onClick}
          className="inline-block px-2 py-1 rounded-lg cursor-pointer border-2 transition-all hover:shadow-sm relative"
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
  const isCorrect = answerChecked && userTag === correctTag;
  const isIncorrect = answerChecked && userTag && userTag !== correctTag;
  const isUntagged = answerChecked && !userTag;

  let underlineColor = 'transparent';
  let col = '#64748B';
  let indicator = '';

  if (showAnswers && correctTag) {
    const cfg = STRUCTURE[correctTag];
    underlineColor = cfg.color;
    col = cfg.color;
  } else if (hasUserTag) {
    const cfg = STRUCTURE[userTag];
    underlineColor = cfg.color;
    col = cfg.color;

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
      onClick={onClick}
      className="inline-block px-1.5 py-1 cursor-pointer transition-all hover:opacity-80"
      style={{
        color: col,
        borderBottom: `3px solid ${underlineColor}`,
        fontWeight: hasUserTag || showAnswers ? 600 : 400,
      }}
      title={showAnswers && correctTag ? STRUCTURE[correctTag].name : 'Click to tag'}
    >
      {indicator && <span className="mr-1">{indicator}</span>}
      {text}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   STRUCTURE PALETTE (block type selector for Paint Structure)
═══════════════════════════════════════════════════════════ */

function StructurePalette({ level, selectedStructure, onSelectStructure, lang }) {
  const t = TRANSLATIONS[lang];
  const isBasic = level === 'Básico' || level === 'Elemental';
  const items = isBasic ? ['WH', 'S', 'V', 'C'] : ['WH', 'S', 'V', 'O', 'A'];

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
          const isSelected = selectedStructure === key;
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
                className="w-7 h-7 rounded flex items-center justify-center text-xs font-extrabold"
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

function QuestionMessage({ text }) {
  return (
    <div className="mb-4 p-4 rounded-xl border-2 border-blue-300 bg-blue-50">
      <div className="flex items-start gap-3 mb-3">
        <div className="text-2xl">❓</div>
        <div>
          <div className="text-sm font-bold text-blue-900 mb-1">
            Esta es una pregunta (Question)
          </div>
          <div className="text-sm text-blue-800 italic mb-2">
            "{text}"
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-3 mb-3">
        <div className="text-xs font-bold text-blue-900 mb-2">
          📚 Estructura de las preguntas en inglés:
        </div>
        <div className="text-xs text-blue-800 leading-relaxed">
          Las preguntas en inglés tienen una <strong>estructura invertida</strong> comparada con las oraciones declarativas.
          El verbo auxiliar o modal aparece <strong>antes</strong> del sujeto.
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
              Yes/No Questions
            </div>
          </div>
          <div className="text-xs text-emerald-800 mb-2">
            Comienzan con auxiliar/modal + sujeto + verbo
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
              Wh-Questions
            </div>
          </div>
          <div className="text-xs text-purple-800 mb-2">
            Comienzan con palabra interrogativa + auxiliar/modal + sujeto
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
            <strong>Nota:</strong> El análisis de POS (partes de la oración) funciona normalmente con preguntas.
            Sin embargo, el análisis de estructura (Subject-Verb-Object) requiere lógica diferente debido a la inversión del sujeto y el verbo.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STRUCTURE BLOCK COMPONENT
═══════════════════════════════════════════════════════════ */

function StructureBlock({ type, text, isAuxiliary, isMainVerb, formal }) {
  const s = STRUCTURE[type];

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
          <div
            className="w-6 h-6 rounded flex items-center justify-center text-xs font-extrabold flex-shrink-0"
            style={{ background: s.color, color: 'white' }}
          >
            {s.label}
          </div>
          <span className="text-sm" style={{ color: s.color }}>
            {text}
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
        <div
          className="w-6 h-6 rounded flex items-center justify-center text-xs font-extrabold flex-shrink-0"
          style={{ background: s.color, color: 'white' }}
        >
          {s.label}
        </div>
        <span className="text-sm" style={{ color: s.color }}>
          {formal ? (
            <span
              title="Sujeto formal — el significado real está en el complemento (that...)"
              className="cursor-help border-b border-dashed"
              style={{ borderColor: s.color }}
            >
              {text}*
            </span>
          ) : text}
        </span>
      </div>
    </div>
  );
}

function ClauseRow({ components, isQuestion }) {
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
          />
        )
      )}
      {isQuestion && (
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-full text-sm cursor-default ml-1"
          title="Question — subject and verb are inverted. Normal order: [S] + [V] + [C]"
          style={{ background: '#EFF6FF', color: '#3B82F6', border: '1px solid #BFDBFE', fontSize: 12 }}
        >
          ?
        </span>
      )}
    </div>
  );
}

function SentenceStructure({ sentence, lang = 'es' }) {
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
            <ClauseRow key={i} components={row.components} isQuestion={sentence.isQuestion} />
          )
        )}
      </div>
      {sentence.hasEmbeddedClause && (
        <div className="mt-2 px-2 py-1.5 rounded bg-blue-50 border border-blue-200 text-xs text-blue-800">
          📎 Esta oración contiene una cláusula subordinada sustantiva (embedded clause). Para un análisis más profundo, consulta con tu profesor.
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

function AnalysisStats({ tokens, unlocked }) {
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
        {tagged}/{wordCount} words tagged:
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
                background: ok ? p.bg : '#F1F5F9',
                color: ok ? p.color : '#94A3B8',
                borderColor: ok ? p.color + '33' : '#E2E8F0',
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
          style={{ background: '#FEF2F2', color: '#EF4444', borderColor: '#FECACA' }}
        >
          ⚠️ {unrecognizedCount} word{unrecognizedCount > 1 ? 's' : ''} not recognized
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

  return (
    <div
      onClick={() => clickable && onSelect(posKey)}
      className={`flex items-start gap-2.5 p-2 rounded-lg border-2 transition-all ${
        isSelected ? 'border-current' : 'border-transparent'
      } ${unlocked ? 'opacity-100' : 'opacity-40'} ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
      style={{
        borderColor: isSelected ? p.color : 'transparent',
        background: isSelected ? p.bg + 'BB' : 'transparent',
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-extrabold mt-0.5"
        style={{
          background: unlocked ? p.bg : '#F1F5F9',
          color: unlocked ? p.color : '#94A3B8',
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
    ? ['WH', 'S', 'V', 'C']
    : ['WH', 'S', 'V', 'O', 'A'];

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
  showStructure,
  autoView,
  lang,
}) {
  const t = TRANSLATIONS[lang];

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
                  isSelected={selectedPos === key}
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
  level,
  lang,
}) {
  const t = TRANSLATIONS[lang];
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
  const showPOS = (isManual && manualView === 'pos')
    || (!isManual && (autoView === 'pos' || (isBoth && bothTab === 'pos')));

  if (showStructure) {
    const isBasic = level === 'Básico' || level === 'Elemental';
    const items = isBasic ? ['WH', 'S', 'V', 'C'] : ['WH', 'S', 'V', 'O', 'A'];

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
              const sel = selectedStructure === key;
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
          <div className="absolute top-0 right-0 h-full w-10 pointer-events-none" style={{background:'linear-gradient(to right, transparent, white)'}} />
        </div>
        {showScrollHint && (
          <p className="text-xs text-gray-400 text-center mt-0.5 pb-1">← desliza para ver todas las categorías →</p>
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
            const sel = selectedPos === key;
            return (
              <button
                key={key}
                onClick={() => ok && isManual && onSelectPos(key)}
                className="flex-shrink-0 flex flex-col items-center py-1.5 px-2.5 rounded-xl border-2 transition-all min-w-[50px]"
                style={{
                  background: ok ? p.bg : '#F1F5F9',
                  color: ok ? p.color : '#94A3B8',
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
        <div className="absolute top-0 right-0 h-full w-10 pointer-events-none" style={{background:'linear-gradient(to right, transparent, white)'}} />
      </div>
      {showScrollHint && (
        <p className="text-xs text-gray-400 text-center mt-0.5 pb-1">← desliza para ver todas las categorías →</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   APP
═══════════════════════════════════════════════════════════ */

function App() {
  const [lang, setLang] = useState('es'); // 'es' | 'en'
  const [level, setLevel] = useState('Básico');
  const [mode, setMode] = useState('auto');
  const [autoView, setAutoView] = useState('structure'); // 'pos' | 'structure' | 'both'
  const [manualView, setManualView] = useState('structure'); // 'pos' | 'structure'
  const [text, setText] = useState(() => new URLSearchParams(window.location.search).get('texto') || '');
  const [selectedPos, setSelectedPos] = useState(null);
  const [selectedStructure, setSelectedStructure] = useState(null); // 'S' | 'V' | 'C' | 'O' | 'A'
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

  const handleWordClick = (tokenId) => {
    if (manualView === 'pos') {
      // POS mode: assign selectedPos to the word
      if (!selectedPos) return; // No POS selected

      setUserPOSTags(prev => {
        const current = prev[tokenId];
        if (current === selectedPos) {
          // Same tag: clear it
          const updated = { ...prev };
          delete updated[tokenId];
          return updated;
        } else {
          // Different or no tag: set it
          return { ...prev, [tokenId]: selectedPos };
        }
      });
    } else if (manualView === 'structure') {
      // Structure mode: assign selectedStructure to the word
      if (!selectedStructure) return; // No structure selected

      setUserStructureTags(prev => {
        const current = prev[tokenId];
        if (current === selectedStructure) {
          // Same tag: clear it
          const updated = { ...prev };
          delete updated[tokenId];
          return updated;
        } else {
          // Different or no tag: set it
          return { ...prev, [tokenId]: selectedStructure };
        }
      });
    }
  };

  const handleCheckAnswers = () => {
    if (!canAnalyze || manualTokens.length === 0) return;
    setAnswerChecked(true);
  };

  const handleClearAll = () => {
    if (manualView === 'pos') {
      setUserPOSTags({});
    } else if (manualView === 'structure') {
      setUserStructureTags({});
    }
    setShowAnswers(false);
    setAnswerChecked(false);
  };

  const handleShowAnswers = () => {
    setShowAnswers(true);
  };

  // Get correct answer for a token
  const getCorrectAnswer = (token, mode) => {
    if (mode === 'pos') {
      return token.pos; // The POS tag from tokenizeText
    } else if (mode === 'structure') {
      // Map token to structure component based on analyzed structure
      if (structureData.length === 0) return null;

      // Get the first sentence structure (assuming single sentence for now)
      const sentence = structureData[0];
      if (!sentence || sentence.error || !sentence.components) return null;

      const tokenText = token.text.toLowerCase();
      const tokenTextClean = tokenText.replace(/[,;:.!?]$/, ''); // Remove trailing punctuation

      // Build a map of all words in each component
      const componentMap = {};

      // Helper to extract words from a component string
      const extractWords = (componentStr) => {
        if (!componentStr) return [];
        return componentStr.toLowerCase()
          .replace(/[,;:.!?]/g, ' ') // Replace punctuation with spaces
          .split(/\s+/)
          .filter(w => w.length > 0);
      };

      // Map each word to its component based on components array
      sentence.components.forEach(comp => {
        const words = extractWords(comp.text);
        words.forEach(word => {
          if (!componentMap[word]) {
            componentMap[word] = comp.type;
          }
        });
      });

      // Look up the token in the map
      return componentMap[tokenTextClean] || null;
    }
    return null;
  };

  // Calculate score for manual practice
  const calculateScore = () => {
    if (manualTokens.length === 0) return { correct: 0, total: 0 };

    const words = manualTokens.filter(t => !t.isPunct);
    const total = words.length;
    let correct = 0;

    if (manualView === 'pos') {
      words.forEach(token => {
        const userTag = userPOSTags[token.id];
        const correctTag = token.pos;
        if (userTag === correctTag) {
          correct++;
        }
      });
    } else if (manualView === 'structure') {
      // Compare against analyzed structure
      words.forEach(token => {
        const userTag = userStructureTags[token.id];
        const correctTag = getCorrectAnswer(token, 'structure');
        if (userTag === correctTag) {
          correct++;
        }
      });
    }

    return { correct, total };
  };

  const score = isManual && manualTokens.length > 0 ? calculateScore() : { correct: 0, total: 0 };

  // ── PWA install prompt ────────────────────────────────────────────────────
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const isMobileDevice = /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    const onBeforeInstall = e => {
      e.preventDefault();
      if (!isMobileDevice) return;
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('online',  () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
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
    <div className="flex flex-col h-screen bg-slate-50">
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
              src={`${import.meta.env.BASE_URL}pwa-192x192.png`}
              alt="Desgramatizador"
              className="w-11 h-11 md:w-9 md:h-9 rounded-xl flex-shrink-0"
            />
            <div>
              <div className="text-lg md:text-base font-bold text-slate-800 leading-tight">
                {t.appTitle}
              </div>
              <div className="text-xs text-slate-400">POS & Structure</div>
            </div>
          </div>

          {/* Controls: inline on md+, hidden on mobile */}
          <div className="hidden md:flex items-end gap-2">
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-1 mb-0.5">{t.langLabel}</span>
              <div className="flex bg-slate-100 border border-slate-300 rounded-lg p-0.5">
                <button onClick={() => setLang('es')} className={`px-3 py-1 rounded text-sm font-bold transition-all ${lang === 'es' ? 'bg-white shadow-sm text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`} title="Español">ES</button>
                <button onClick={() => setLang('en')} className={`px-3 py-1 rounded text-sm font-bold transition-all ${lang === 'en' ? 'bg-white shadow-sm text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`} title="English">EN</button>
              </div>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-1 mb-0.5">{t.levelLabel}</span>
              <select value={level} onChange={e => setLevel(e.target.value)} className="text-sm font-bold bg-indigo-50 border-indigo-200 border-[1.5px] text-indigo-800 rounded-lg px-3.5 py-1.5 cursor-pointer outline-none">
                {['Básico', 'Elemental', 'Intermedio', 'Intermedio Alto'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: controls on mobile only */}
        <div className="flex md:hidden items-end justify-between mt-2">
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-1 mb-0.5">{t.langLabel}</span>
            <div className="flex bg-slate-100 border border-slate-300 rounded-lg p-0.5">
              <button onClick={() => setLang('es')} className={`px-3 py-1 rounded text-sm font-bold transition-all ${lang === 'es' ? 'bg-white shadow-sm text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`} title="Español">ES</button>
              <button onClick={() => setLang('en')} className={`px-3 py-1 rounded text-sm font-bold transition-all ${lang === 'en' ? 'bg-white shadow-sm text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`} title="English">EN</button>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-1 mb-0.5">{t.levelLabel}</span>
            <select value={level} onChange={e => setLevel(e.target.value)} className="text-sm font-bold bg-indigo-50 border-indigo-200 border-[1.5px] text-indigo-800 rounded-lg px-3 py-1.5 cursor-pointer outline-none">
              {['Básico', 'Elemental', 'Intermedio', 'Intermedio Alto'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
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
                    className={`md:hidden border rounded-xl px-3.5 py-2.5 mb-4 text-xs leading-relaxed cursor-pointer select-none ${bannerColor}`}
                    onClick={() => setBannerExpanded(v => !v)}
                  >
                    <div className="flex items-center justify-between">
                      <span><strong>{bannerIcon} {bannerTitle}</strong> — toca para {bannerExpanded ? 'ocultar' : 'ver instrucciones'}</span>
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
                  <span>tagged</span>
                  {answerChecked && (
                    <>
                      <span className="mx-1 text-slate-300">•</span>
                      <strong className="text-emerald-600 text-base">{score.correct}</strong>
                      <span className="text-slate-300">/</span>
                      <strong className="text-slate-800 text-base">{score.total}</strong>
                      <span>correct</span>
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
                  <QuestionMessage text={text} />
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
                            unlocked={unlocked}
                          />
                          {t.post && <span>{t.post}</span>}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Unrecognized words warning */}
                    {manualTokens.some(t => t.unrecognized) && (
                      <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                        ⚠️ Some words were not recognized. Check spelling before practicing.
                      </div>
                    )}

                    {/* Stats for manual mode */}
                    {answerChecked && (
                      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="text-sm font-bold text-slate-700 mb-2">
                          Results: {score.correct} / {score.total} correct ({Math.round((score.correct / score.total) * 100)}%)
                        </div>
                        <div className="flex gap-2 text-xs">
                          <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold">
                            ✓ Correct
                          </span>
                          <span className="px-2 py-1 rounded bg-red-100 text-red-700 border border-red-200 font-semibold">
                            ✗ Incorrect
                          </span>
                          <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 border border-orange-200 font-semibold">
                            ? Untagged
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
              <div className="bg-white rounded-2xl border-[1.5px] border-slate-200 shadow-sm transition-all p-5">
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
                            phrasalAdjacent={t.phrasalAdjacent}
                            unrecognized={t.unrecognized}
                            splitParts={t.splitParts}
                          />
                          {t.post && <span>{t.post}</span>}
                        </React.Fragment>
                      ))}
                    </div>
                    <AnalysisStats tokens={tokens} unlocked={unlocked} />
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
                      <SentenceStructure key={sentence.id} sentence={sentence} lang={lang} />
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
        level={level}
        lang={lang}
      />
    </div>
  );
}

export default App;
