// ═══════════════════════════════════════════════════════════
// NLP — análisis de estructura (S/V/O/A/C) y tokenización POS
// Extraído de App.jsx para poder testearlo de forma aislada.
// Las reglas lingüísticas están documentadas en REGLAS.md (raíz del repo).
// ═══════════════════════════════════════════════════════════
import nlp from 'compromise';
/* Frasales del libro: fuente única en Grammar HUB/phrasal-verbs.json. */
import { PHRASAL_VERB_LIST, PREP_PARTICLES, ADVERBIAL_HEADS, DETERMINERS } from './phrasal.generated.js';

// Clause markers for complexity detection
const CLAUSE_MARKERS = [
  'because', 'although', 'when', 'if', 'unless', 'while', 'since',
  'before', 'after', 'that', 'which', 'who', 'whom', 'whose', 'where',
  'though', 'once', 'as', 'until', 'whereas', 'whenever',
  'even though', 'even if', 'so that', 'in case', 'now that',
  'as soon as', 'as long as',
];

// Question detection helper.
// Only an explicit "?" marks a sentence as a question: the old first-word
// heuristic ("Do...", "Have...", "Where...") misread imperatives like
// "Do your homework." / "Have a nice day." as questions (Regla 12/13 ya
// exigían el "?" en la documentación).
function isQuestion(text) {
  return text.trim().endsWith('?');
}

// Common irregular past participles (AEF vocabulary) — used to tell apart
// "'s"/"'d" = has/had (perfect) from = is/would (copula/modal). N1
const PP_IRREGULAR = new Set([
  'been','gone','done','eaten','seen','taken','given','written','spoken','broken',
  'chosen','driven','known','grown','thrown','flown','drawn','worn','torn',
  'forgotten','hidden','ridden','risen','fallen','beaten','bitten','become','come',
  'run','begun','sung','swum','drunk','won','got','gotten','made','said','told',
  'found','met','left','kept','held','brought','bought','taught','caught',
  'sold','paid','built','sent','spent','lost','meant','slept','understood','stood',
  'heard','thought','fought','read','put','cut','set','hit','let','shut','cost','hurt',
]);

// -ed words that are predicative ADJECTIVES after be, not perfect participles:
// "He's tired" = "He is tired", NOT "He has tired". These force the "is" reading.
const PREDICATIVE_ED_ADJ = new Set([
  'tired','bored','interested','excited','worried','married','surprised','scared',
  'confused','pleased','annoyed','embarrassed','exhausted','stressed','relaxed',
  'involved','amazed','frightened','disappointed','satisfied','crowded','closed',
  'divorced','dressed','prepared','qualified','experienced','worried','ashamed',
]);

// La contraparte en -ing de PREDICATIVE_ED_ADJ, y es más difícil: "tired" solo
// es adjetivo, pero "confusing" es adjetivo en "Is the map confusing?" y verbo
// en "Am I confusing you?". Es la MISMA palabra, así que ninguna lista la
// resuelve — hace falta mirar la estructura.
// Todos estos son verbos psicológicos (X interesa a Y) y en progresivo piden
// objeto. Sin nada detrás, la lectura es la adjetiva.
// Lo que entra acá NO es «verbo psicológico» en sentido estricto, es algo más
// estrecho: verbos que necesitan objeto. «move» estuvo un rato en esta lista y
// fue un error — un tren se mueve solo, así que "Is the train moving?" pasó a
// leerse como adjetivo. Antes de agregar uno: ¿puede la acción no tener objeto?
// Si sí, no va.
const PSY_TRANS = new Set([
  'interest','bore','tire','amaze','excite','disappoint','frighten','terrify',
  'disgust','challenge','confuse','surprise','annoy','embarrass','shock',
  'fascinate','depress','satisfy','exhaust',
  // mismo criterio, y son los adjetivos en -ing más frecuentes del inglés de aula
  'refresh','reward','charm','demand','promise','mislead','overwhelm','disturb',
  'alarm','convince','encourage','discourage','entertain','inspire','thrill',
  'puzzle','irritate','frustrate','please','stun',
]);
// Estos además funcionan sin objeto ("I relax"), así que el objeto no alcanza y
// hay que mirar el sujeto: "Are you relaxing?" es progresivo de verdad.
const PSY_INTRANS = new Set(['relax', 'worry']);
function psyBase(word) {
  const w = (word || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!w.endsWith('ing')) return null;
  const s = w.slice(0, -3);
  for (const c of [s, s + 'e', s.slice(0, -1)]) {   // annoy·ing · confus+e · runn→run
    if (PSY_TRANS.has(c) || PSY_INTRANS.has(c)) return c;
  }
  return null;
}
const BE_FORMS = new Set(['am', 'is', 'are', 'was', 'were']);
const SUBJ_PRON = new Set(['i', 'you', 'he', 'she', 'it', 'we', 'they']);
// Un adverbio al final no es objeto: "Is the music relaxing tonight?" sigue
// siendo adjetivo.
const TRAILING_ADV = new Set(['now','today','tonight','tomorrow','yesterday','lately',
  'recently','again','still','always','usually','often','sometimes','never','here','there']);
// Adverbios de grado. Modifican adjetivos, NUNCA un progresivo: "Are you very
// working?" no existe. Uno de estos delante zanja la lectura sin consultar
// ninguna lista, y cubre los -ing que no están en ellas. «really» y «totally»
// quedan FUERA: "Are you really working?" es normal.
const GRADO = new Set(['very','quite','extremely','incredibly','fairly','rather','pretty','so','too']);
// Palabras en -ing que SOLO son adjetivo: no hay progresivo detrás ("Is she
// willing?"). Es la lista corta; para todo lo demás, tras «be + sujeto» lo
// normal es el progresivo, así que ese es el default.
const ING_SOLO_ADJ = new Set(['outstanding','willing','unwilling','missing','cunning',
  'upcoming','ongoing','surrounding','everlasting','forthcoming','longstanding','underlying']);

// Las dos capas del análisis (el tokenizador que PINTA las categorías y el que
// arma los bloques S/V/C) construyen su propia lista de POS por separado. Estas
// reglas viven acá, en una sola copia, porque si cada capa resuelve la
// ambigüedad a su manera la app se contradice a sí misma en pantalla.
// Solo necesitan `text` y `pos` de cada elemento.
const limpio = (t) => (t.text || '').toLowerCase().replace(/[^a-zà-ÿ']/g, '');
const contenido = (arr) => arr.map((t, i) => ({ t, i })).filter(({ t }) => !t.isPunct && limpio(t));

// ¿La palabra en -ing es adjetivo predicativo, núcleo del sujeto, o gerundio?
function resolverIng(arr) {
  const cont = contenido(arr);
  for (let c = 0; c < cont.length; c++) {
    const { t: tok, i } = cont[c];
    const w = limpio(tok);
    if (!w.endsWith('ing')) continue;

    // El «be» del que cuelga. Si aparece otro verbo antes, ya no cuelga de él.
    let b = -1;
    for (let k = c - 1; k >= 0; k--) {
      const p = cont[k].t;
      if (BE_FORMS.has(limpio(p))) { b = k; break; }
      if (p.pos === 'verb' || p.pos === 'auxiliary' || p.pos === 'modal') break;
    }
    if (b === -1 || b === c - 1) continue;      // sin be, o sin sujeto en medio

    const anterior = cont[c - 1] && cont[c - 1].t;
    if (anterior && GRADO.has(limpio(anterior))) {   // "Is the drink very refreshing?"
      tok.pos = 'adjective';
      tok.psyAdj = true;
      continue;
    }

    const base = psyBase(w);
    if (base) {
      let k = cont.length - 1;                  // un adverbio final no es objeto
      while (k > c && TRAILING_ADV.has(limpio(cont[k].t))) k--;
      let esAdjetivo = k === c;
      if (esAdjetivo && PSY_INTRANS.has(base)) {
        const subj = cont.slice(b + 1, c);
        if (subj.length === 1 && SUBJ_PRON.has(limpio(subj[0].t))) esAdjetivo = false;
      }
      tok.pos = esAdjetivo ? 'adjective' : 'verb';
      if (esAdjetivo) tok.psyAdj = true;
      continue;
    }

    if (tok.pos === 'noun') {
      // Quedó de sustantivo. Decide la posición dentro del sintagma: pegada al
      // determinante es el núcleo («Is the building new?»), después del núcleo
      // es el verbo («Is the plan working?»).
      if (anterior && (anterior.pos === 'determiner' || anterior.pos === 'adjective')) tok.ingNoun = true;
      else tok.pos = 'verb';
    } else if (tok.pos === 'adjective' && !ING_SOLO_ADJ.has(w)) {
      // compromise da «moving» como adjetivo puro y "Is the train moving?"
      // quedaba sin progresivo. Tras «be + sujeto» el default correcto es el
      // verbo: los -ing que solo son adjetivo son un puñado y están arriba, y
      // los ambiguos ya se resolvieron con la lista de arriba o con el grado.
      tok.pos = 'verb';
    }
    void i;
  }
}

// Una pregunta con do-support tiene siempre SUJETO + VERBO PRINCIPAL.
function resolverDoSupport(arr) {
  const cont = contenido(arr);
  const a = cont.findIndex(({ t }) => t.pos === 'auxiliary' && DO_AUX_SET.has(limpio(t)));
  if (a === -1) return;
  const tras = cont.slice(a + 1).filter(({ t }) => !['not', "n't"].includes(limpio(t)));
  if (!tras.length) return;

  if (!tras.some(({ t }) => t.pos === 'verb')) {
    // Ningún verbo: alguno de los sustantivos lo es. Es el que va DESPUÉS del
    // núcleo del sujeto — el primero del sintagma va pegado al determinante.
    // («Does the bus stop here?», donde «the bus stop» se leía entero.)
    for (let k = 1; k < tras.length; k++) {
      if (tras[k].t.pos !== 'noun') continue;
      const prev = tras[k - 1].t;
      if (prev.pos !== 'noun' && prev.pos !== 'pronoun') continue;
      tras[k].t.pos = 'verb';
      return;
    }
    return;
  }
  // El sujeto no puede ser un verbo pelado: venían cambiados.
  // («Does work start at eight?»). Con pronombre o determinante no se dispara.
  if (tras.length >= 2 && tras[0].t.pos === 'verb' && tras[1].t.pos === 'noun') {
    tras[0].t.pos = 'noun';
    tras[0].t.subjNoun = true;      // que los pasos siguientes no lo revivan
    tras[1].t.pos = 'verb';
  }
}

// True when `word` right after 's/'d signals a PERFECT tense (→ has/had),
// as opposed to a copular adjective/noun or a modal infinitive (→ is/would).
function isPerfectParticiple(word) {
  const w = (word || '').toLowerCase().replace(/[^a-zà-ÿ]/g, '');
  if (!w) return false;
  if (PREDICATIVE_ED_ADJ.has(w)) return false;
  if (PP_IRREGULAR.has(w)) return true;
  if (w.length > 3 && w.endsWith('ed')) return true; // worked, played, finished…
  return false;
}

// Analyze sentence structure using compromise.js
// Expand common contractions so NLP can parse verb phrases correctly
function expandContractions(t) {
  // Ambiguous "'s" → "has" before a perfect participle, else "is" (copula/progressive/passive).
  // Only the listed subjects are expanded, so possessives ("John's book") are untouched.
  t = t.replace(
    /\b(what|where|who|how|when|that|there|here|it|he|she)'s\b(\s+([\wÀ-ÿ']+))?/gi,
    (m, subj, tail, next) => `${subj} ${next && isPerfectParticiple(next) ? 'has' : 'is'}${tail || ''}`
  );
  // Ambiguous "'d" → "had" before a perfect participle, else "would" (modal).
  t = t.replace(
    /\b(i|you|he|she|we|they|it|that|who)'d\b(\s+([\wÀ-ÿ']+))?/gi,
    (m, subj, tail, next) => `${subj} ${next && isPerfectParticiple(next) ? 'had' : 'would'}${tail || ''}`
  );
  return t
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

// Locate a word/phrase inside a sentence respecting word boundaries, so that
// e.g. "is" is never matched inside "This" or "His". Falls back to plain
// indexOf for phrases the regex can't anchor (leading apostrophes, etc.).
function wordIndexOf(text, phrase) {
  if (!phrase) return -1;
  const esc = phrase.trim()
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+');
  const m = text.match(new RegExp(`\\b${esc}\\b`, 'i'));
  if (m) return m.index;
  return text.toLowerCase().indexOf(phrase.toLowerCase());
}

// Mid-position adverbs (also, always, never…) that belong to the V block
const MID_ADV = new Set(['also','always','never','often','still','just','already',
                         'usually','sometimes','rarely','seldom','ever','even',
                         'almost','only','probably','certainly','perhaps','simply','really']);

/* ── Question parsing helpers (shared by structure + POS modes) ─────────────
   Used on both termPOS entries ({text, pos, tags}) and tokenizer tokens
   ({text, pos, nlpTags}). */
const DO_AUX_SET = new Set(['do', 'does', 'did']);
const MODAL_WORD_SET = new Set(['can','could','will','would','shall','should','may','might','must']);

// Scan the subject noun phrase right after an inverted auxiliary:
//   pronoun | det? adj* noun+   (optionally "NP and NP" for compound subjects)
// Returns the exclusive end index. It stops at the first word that can't
// belong to the NP, so "Is she happy?" yields subject "she" — not "she happy" —
// and "Is she a teacher?" yields "she", leaving "a teacher" as complement.
function findQuestionSubjectEnd(termPOS, start, auxWord = '') {
  let end = start;
  let sawHead = null; // 'pronoun' | 'noun' | null
  for (let i = start; i < termPOS.length; i++) {
    const p = termPOS[i];
    if (p.isPunct) break;
    const pos = p.pos;
    const tags = p.tags || p.nlpTags || [];
    // `subjNoun` lo pone la regla de do-support: ya se decidió que esta palabra
    // es el sujeto («Does work start at eight?»). Sin esto la decisión se
    // perdía acá, porque las etiquetas crudas de compromise siguen diciendo
    // Verb y este corte se quedaba con el sujeto vacío.
    const isVerb = !p.subjNoun &&
      (pos === 'verb' ||
       ['Verb', 'Infinitive', 'PresentTense', 'PastTense'].some(t => tags.includes(t)));
    if (isVerb) break;
    if (pos === 'conjunction') {
      // "you and your sister" — keep going only if another NP follows
      const nxt = termPOS[i + 1];
      const nxtOk = nxt && ['determiner', 'adjective', 'noun', 'pronoun'].includes(nxt.pos);
      if (sawHead && nxtOk) { end = i + 1; sawHead = null; continue; }
      break;
    }
    if (pos === 'pronoun') {
      if (sawHead) break;
      end = i + 1; sawHead = 'pronoun'; continue;
    }
    if (pos === 'noun') {
      if (sawHead === 'pronoun') break; // "Is she home?" → "home" is not subject
      end = i + 1; sawHead = 'noun'; continue;
    }
    if (pos === 'determiner' || pos === 'adjective') {
      if (sawHead) break; // det/adj after the head belongs to the complement
      end = i + 1; continue;
    }
    break;
  }

  // Reserve the main verb. After do-support or a modal the question MUST have a
  // bare-infinitive verb behind the subject — the same "position is proof"
  // reasoning as isLikelyQuestionMainVerb. So if the tagger found no verb at all
  // in the rest of the sentence, the last word the scan just swallowed IS that
  // verb, whatever compromise called it, and it has to be given back.
  //
  // "Will Tom and Ana work at home?" is the case that exposed this: a compound
  // proper-noun subject plus a bare verb that doubles as a noun ("work"), which
  // compromise tags Noun, so the noun+noun rule above kept eating and the
  // subject came out as "Tom and Ana work".
  //
  // Deliberately NOT applied to be/have: "Is the bus driver happy?" is copular
  // and has no main verb to reserve, so swallowing both nouns is right there.
  const requiereInfinitivo = DO_AUX_SET.has(String(auxWord).toLowerCase()) ||
    MODAL_WORD_SET.has(String(auxWord).toLowerCase());
  if (requiereInfinitivo && end > start + 1) {
    const hayVerbo = termPOS.slice(start).some(p => {
      if (p.isPunct) return false;
      const tags = p.tags || p.nlpTags || [];
      return p.pos === 'verb' ||
        ['Verb', 'Infinitive', 'PresentTense', 'PastTense'].some(t => tags.includes(t));
    });
    const ultimo = termPOS[end - 1];
    if (!hayVerbo && ultimo && ultimo.pos === 'noun') end -= 1;
  }

  return end;
}

// After aux + subject in a question: is this word really the main verb?
// do/does/did and modals must be followed by a bare-infinitive verb, so the
// position alone is proof even if the tagger read a noun ("Do you google it?").
// With be/have we require actual verb evidence — otherwise copular questions
// ("Is she happy?") would turn the adjective into a verb.
function isLikelyQuestionMainVerb(auxWord, term) {
  const tags = term.tags || term.nlpTags || [];
  const hasVerbEvidence = term.pos === 'verb' ||
    ['Verb', 'Infinitive', 'PresentTense', 'PastTense', 'Gerund', 'Participle'].some(t => tags.includes(t));
  if (hasVerbEvidence) return true;
  const aux = (auxWord || '').toLowerCase().replace(/[^a-z']/g, '');
  return DO_AUX_SET.has(aux) || MODAL_WORD_SET.has(aux);
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

      // Helper: subject starts after the auxiliary, skipping an inverted "not"
      // ("Don't you..." expands to "Do not you...")
      const negAfterAux = (idx) =>
        (termPOS[idx + 1] && ['not', "n't"].includes((termPOS[idx + 1].text || '').toLowerCase()))
          ? idx + 2 : idx + 1;

      // Context-aware correction for questions:
      // after aux + subject, promote the main-verb candidate to 'verb' — but
      // only when the position guarantees a verb (do/does/did or a modal) or
      // the tagger shows verb evidence. Copular questions ("Is she happy?")
      // must NOT turn the adjective into a verb.
      let auxIndex = -1;
      for (let i = 0; i < termPOS.length; i++) {
        if (termPOS[i].pos === 'auxiliary' || termPOS[i].pos === 'modal') {
          auxIndex = i;
          break;
        }
      }

      // Ambigüedad léxica: LAS MISMAS reglas que usa el tokenizador. Esta capa
      // arma su propio termPOS, así que si no se llaman aquí también, la app se
      // contradice: pinta «working» de verbo y lo mete en el sujeto.
      resolverIng(termPOS);
      resolverDoSupport(termPOS);

      if (auxIndex !== -1) {
        const preSubjEnd = findQuestionSubjectEnd(termPOS, negAfterAux(auxIndex), termPOS[auxIndex] && termPOS[auxIndex].text);
        // Skip mid-position adverbs: "Do you really like coffee?"
        let cand = preSubjEnd;
        while (cand < termPOS.length && termPOS[cand].pos === 'adverb') cand++;
        if (cand < termPOS.length &&
            isLikelyQuestionMainVerb(termPOS[auxIndex].text, termPOS[cand])) {
          termPOS[cand].pos = 'verb';
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
            // "How many/much" + sustantivo forma UNA sola wh: en "How many
            // people came?" el sujeto es «How many people», y sin esto «people»
            // quedaba suelto como adverbial.
            if (firstWordLower === 'how' && (nextLower === 'many' || nextLower === 'much') &&
                termPOS[2] && (termPOS[2].pos === 'noun' ||
                  (termPOS[2].tags || []).some(t => ['Noun', 'Singular', 'Plural', 'Uncountable'].includes(t)))) {
              whText += ' ' + termPOS[2].text;
              auxSearchStart = 3;
            }
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
          // 3. Auxiliary/Modal → Verb (include an inverted "not": "Why do not you...")
          const subjStart = negAfterAux(auxIndex);
          components.push({
            type: 'V',
            text: termPOS.slice(auxIndex, subjStart).map(t => t.text).join(' '),
            position: auxIndex,
            isAuxiliary: true,
          });

          // 4. Subject NP after the inverted auxiliary (shared helper)
          const subjectEnd = findQuestionSubjectEnd(termPOS, subjStart, termPOS[auxIndex] && termPOS[auxIndex].text);
          const subjectTerms = termPOS.slice(subjStart, subjectEnd);
          if (subjectTerms.length > 0) {
            components.push({ type: 'S', text: subjectTerms.map(t => t.text).join(' '), position: subjStart });
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
            // Adverbs between the subject and the main verb (ever, never, just…)
            // become adverbial instead of being dropped.
            if (mainVerbIndex > subjectEnd) {
              const advText = termPOS.slice(subjectEnd, mainVerbIndex).map(t => t.text).join(' ').trim();
              if (advText) components.push({ type: 'A', text: advText, position: subjectEnd });
            }
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
          } else if (subjectEnd < termPOS.length) {
            // No main verb after the subject → copular question tail
            // ("Whose book is this?" style remainders become C)
            const rest = termPOS.slice(subjectEnd)
              .map(t => t.text).join(' ')
              .replace(/\s+([,;:.!?])/g, '$1')
              .replace(/[?!.\s]+$/, '')
              .trim();
            if (rest) components.push({ type: 'C', text: rest, position: subjectEnd });
          }
        } else {
          /* Wh-pregunta SIN auxiliar = PREGUNTA DE SUJETO: "Who lives here?",
             "What happened?". La wh-word ocupa el lugar del sujeto, así que el
             verbo va pegado a ella y no hay inversión.
             Todo el cuerpo de arriba colgaba de `auxIndex !== -1`, así que estas
             se quedaban SOLO con el bloque WH: la fila salía con una palabra y
             el verbo y el complemento desaparecían de la pantalla. */
          let mainVerbIndex = -1;
          for (let i = auxSearchStart; i < termPOS.length; i++) {
            const pos = termPOS[i].pos;
            const tags = termPOS[i].tags || [];
            if (pos === 'verb' || tags.includes('Verb') || tags.includes('Infinitive') ||
                tags.includes('PresentTense') || tags.includes('PastTense')) { mainVerbIndex = i; break; }
          }
          if (mainVerbIndex !== -1) {
            // Adverbios entre la wh y el verbo ("Who always arrives late?")
            if (mainVerbIndex > auxSearchStart) {
              const advText = termPOS.slice(auxSearchStart, mainVerbIndex).map(t => t.text).join(' ').trim();
              if (advText) components.push({ type: 'A', text: advText, position: auxSearchStart });
            }
            components.push({ type: 'V', text: termPOS[mainVerbIndex].text, position: mainVerbIndex, isMainVerb: true });
            if (mainVerbIndex + 1 < termPOS.length) {
              const rest = termPOS.slice(mainVerbIndex + 1).map(t => t.text).join(' ')
                .replace(/\s+([,;:.!?])/g, '$1')
                .replace(/[?!.\s]+$/, '')
                .trim();
              if (rest) components.push({ type: isBasic ? 'C' : 'O', text: rest, position: mainVerbIndex + 1 });
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

        // 1. Auxiliary/Modal → Verb (include an inverted "not": "Do not you...")
        const subjStart = negAfterAux(0);
        components.push({
          type: 'V',
          text: termPOS.slice(0, subjStart).map(t => t.text).join(' '),
          position: 0,
          isAuxiliary: true,
        });

        // 2. Subject NP after the inverted auxiliary (shared helper)
        const subjectEnd = findQuestionSubjectEnd(termPOS, subjStart, termPOS[0] && termPOS[0].text);
        const subjectTerms = termPOS.slice(subjStart, subjectEnd);
        if (subjectTerms.length > 0) {
          components.push({ type: 'S', text: subjectTerms.map(t => t.text).join(' '), position: subjStart });
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
          // Adverbs between the subject and the main verb (ever, never, just…)
          // become adverbial instead of being dropped.
          if (mainVerbIndex > subjectEnd) {
            const advText = termPOS.slice(subjectEnd, mainVerbIndex).map(t => t.text).join(' ').trim();
            if (advText) components.push({ type: 'A', text: advText, position: subjectEnd });
          }
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
        } else if (subjectEnd < termPOS.length) {
          // No main verb after the subject → copular question:
          // "Is she a teacher?" → [V: Is] [S: she] [C: a teacher]
          const rest = termPOS.slice(subjectEnd)
            .map(t => t.text).join(' ')
            .replace(/\s+([,;:.!?])/g, '$1')
            .replace(/[?!.\s]+$/, '')
            .trim();
          if (rest) components.push({ type: 'C', text: rest, position: subjectEnd });
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
        const auxIndex = wordIndexOf(sentenceText, auxText);

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

          const verbIdx  = wordIndexOf(afterSubject, verbText);
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

    // Special case: SUBJECT relative clause (I4)
    // "The man who called is here." → S: "The man who called" | V: "is" | C: "here"
    // Pattern: [NP] (who|which|that|whom|whose) [rel-clause verb] … [MAIN verb] …
    // Detected when a relative pronoun appears BEFORE the first verb (so it
    // modifies the subject) and compromise found ≥2 verbs — the 2nd is the main
    // one. Object relatives ("I know the man who called") don't match because
    // the relative pronoun comes AFTER the first (main) verb.
    {
      const REL_PRONOUNS = ['who', 'which', 'that', 'whom', 'whose'];
      const relRe = new RegExp(`\\b(${REL_PRONOUNS.join('|')})\\b`, 'i');
      const relMatch = sentenceText.match(relRe);
      const verbList = doc.verbs().out('array');
      if (relMatch && relMatch.index > 0 && verbList.length >= 2) {
        const relPos = relMatch.index;
        const firstVerbPos = wordIndexOf(sentenceText, verbList[0]);
        // Relative pronoun must sit between the subject noun and the first verb
        if (firstVerbPos !== -1 && relPos < firstVerbPos) {
          // Main verb = second verb, located AFTER the relative-clause verb
          const afterFirst = firstVerbPos + verbList[0].length;
          const rel = wordIndexOf(sentenceText.slice(afterFirst), verbList[1]);
          if (rel !== -1) {
            const mainVerbPos = afterFirst + rel;
            const subjectText = sentenceText.substring(0, mainVerbPos).trim();
            const mainVerb = verbList[1];
            const afterMain = sentenceText.substring(mainVerbPos + mainVerb.length)
              .trim().replace(/[.!?]+$/, '').trim();
            return {
              components: [
                { type: 'S', text: subjectText },
                { type: 'V', text: mainVerb },
                // main verb after a subject relative is typically copular →
                // remainder is a complement in every level
                ...(afterMain ? [{ type: 'C', text: afterMain }] : []),
              ],
              isComplex,
              isQuestion: isQuestionSentence,
              error: null,
            };
          }
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
        /* SALIÓ EN CLASE (2026-08-12): «She works in Santiago» daba el verbo
           «works in». Compromise trae su propio diccionario de phrasal verbs y
           ahí están `work in` y `sleep in` —que existen: «incorporar algo»,
           «dormir hasta tarde»— así que etiqueta el `in` como Particle aunque
           sea claramente locativo. `VERB_TAGS` incluye 'Particle', y la
           preposición entraba en el sintagma verbal.
           La regla: manda NUESTRA lista, que es la del libro. Si el verbo con
           esa partícula no está en ella, la partícula no es del verbo.
           Se recorta solo la ÚLTIMA: en «came up with» las intermedias las
           protege la lista, y quitarlas de dentro rompería el sintagma. */
        while (vEnd > vStart) {
          const ult = (rawTerms[vEnd].text || '').toLowerCase().replace(/[^a-z]/g, '');
          if (!PREP_PARTICLES.has(ult)) break;
          const verbo = normVerb((rawTerms[vStart].text || '').toLowerCase().replace(/[^a-z]/g, ''));
          const sets = PHRASAL_BY_VERB.get(verbo);
          const enElLibro = sets && sets.some(ps => ps.includes(ult));
          /* Aunque el libro lo tenga, si detrás va un adverbial de tiempo o
             lugar la partícula es preposición: «We go on HOLIDAY», «She came in
             the MORNING». Es la misma regla que `particleIsPreposition` aplica
             a las palabras pintadas; sin ella las dos capas se contradicen y el
             alumno ve `on` en gris de preposición y dentro del verbo a la vez. */
          if (enElLibro && !seguidoDeAdverbial(sentenceText, rawTerms, vEnd)) break;
          vEnd--;
        }
        verbPhrase = rawTerms.slice(vStart, vEnd + 1).map(p => p.text).join(' ');
        /* Y al revés: si el libro dice que es phrasal y compromise no lo vio,
           la partícula FALTA en el verbo. Pasaba con `look at`, `listen to` y
           `look for`: el token se pintaba de verbo y el sintagma lo dejaba en el
           complemento, o sea la app se contradecía consigo misma según qué vista
           mirara el alumno. Con `run into` o `get on` no pasaba porque ahí
           compromise sí los reconoce, lo que hacía el fallo más difícil de ver. */
        verbPhrase = añadirParticulaDelLibro(sentenceText, verbPhrase);
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

    // Last resort 2: compound proper-noun subject that swallows a bare verb.
    // "Tom and Ana work at home." leaves doc.verbs() completely EMPTY: compromise
    // reads the whole "Tom and Ana work" as one noun phrase, because "work" in
    // its bare form is also a noun. Every fallback above then misses and the
    // sentence used to come back with zero components — the analysis collapsed
    // instead of merely mislabelling something.
    //
    // It takes both conditions at once, which is why it stayed hidden: "The dogs
    // work at home." parses fine (common-noun subject), and so does "Tom and Ana
    // worked at home." (inflected verb). Only compound proper noun + bare
    // noun-homonym verb hits it.
    //
    // The fix is structural rather than another word list: after "X and Y" a word
    // that compromise lumped into the noun phrase can only be the verb. Question
    // Lab guards the same noun/verb homonymy in check-analyzer.mjs, but through a
    // verb lexicon that this app does not have.
    // The cut is made on the raw words instead of asking compromise for the
    // compound: at the end of a sentence its #ProperNoun+ swallows the verb too
    // ("Tom and Ana work." matches whole), so there would be nothing left after
    // the match. Capitalisation is the same proper-noun signal Rule 11 uses.
    if (!verbPhrase) {
      const limpia = (w) => w.replace(/[.,;:!?]+$/, '');
      const esMayus = (w) => /^[A-Z]/.test(w);
      const palabras = sentenceText.trim().split(/\s+/);
      const iAnd = palabras.findIndex(w => limpia(w).toLowerCase() === 'and');
      // Proper nouns on both sides of "and", and at least one word after them.
      if (iAnd > 0 && palabras.slice(0, iAnd).every(esMayus)) {
        let k = iAnd + 1;
        while (k < palabras.length && esMayus(palabras[k])) k++;
        const siguiente = limpia(palabras[k] || '');
        // Function words can't be the verb; anything else in this slot is one.
        const NO_VERBO = new Set([
          'a','an','the','this','that','these','those','and','or','but',
          'at','in','on','of','to','for','from','with','by','about',
          'my','your','his','her','its','our','their',
        ]);
        if (k > iAnd + 1 && siguiente && !NO_VERBO.has(siguiente.toLowerCase())) {
          verbPhrase = siguiente;
        }
      }
    }

    if (!verbPhrase) {
      return { components: [], isComplex, isQuestion: isQuestionSentence, error: 'Could not parse sentence structure' };
    }

    // Sanity check: if verbPhrase appears inside a subordinate clause
    // (i.e. beforeVerb contains a subordinating conjunction), find the real main verb
    // Example: "Some employees feel isolated when they work alone" → verb should be "feel", not "work"
    {
      const tentativeIndex = wordIndexOf(sentenceText, verbPhrase);
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

    // Negatives: "does not / will not / has not…" must include the main verb
    // that follows ("She does not like coffee" → V: does not like), because
    // compromise often drops the verb tag after a negation.
    // "be + not" stays as-is: in "is not happy" the adjective is complement.
    {
      const vpWords = verbPhrase.trim().split(/\s+/);
      const lastVp = (vpWords[vpWords.length - 1] || '').toLowerCase();
      const firstVp = (vpWords[0] || '').toLowerCase();
      const BE_FORMS = new Set(['am','is','are','was','were','be','been','being']);
      if ((lastVp === 'not' || lastVp === "n't") && !BE_FORMS.has(firstVp)) {
        const vpIdx = wordIndexOf(sentenceText, verbPhrase);
        if (vpIdx !== -1) {
          const afterNeg = sentenceText.slice(vpIdx + verbPhrase.length);
          const m = afterNeg.match(/^\s+([A-Za-zÀ-ÿ']+)(?:\s+([A-Za-zÀ-ÿ']+))?/);
          if (m) {
            // Words that signal the verb is NOT next (rescued nothing to add)
            const STOP = new Set(['a','an','the','this','that','these','those','any','some','yet',
                                  'my','your','his','her','its','our','their','it','him','them','me','us']);
            let addition = null;
            if (!STOP.has(m[1].toLowerCase())) {
              addition = m[1];
              // Allow one mid adverb in between: "does not really like"
              if (MID_ADV.has(m[1].toLowerCase()) && m[2] && !STOP.has(m[2].toLowerCase())) {
                addition = m[1] + ' ' + m[2];
              }
            }
            if (addition) verbPhrase = verbPhrase + ' ' + addition;
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

    // Rule 16b: same idea for the past-habit unit "use(d) to + verb".
    // It needs its own rule because the unit sits at the END of the verb phrase
    // instead of being the whole of it, so the equality test above cannot see
    // it. With do-support compromise stops the phrase at "did not use", which
    // stranded the infinitive in the complement:
    //     "I didn't use to work at home."  →  V:「did not use」 C:「to work at home」
    // while the affirmative ("used to work") and the question path — which goes
    // through splitVerbPhrase, whose SEMI_AUX_STARTERS has accepted 'use' all
    // along — both kept it inside the verb. The bug was that disagreement.
    //
    // Only fires when the phrase ENDS in use/used and "to + verb" follows
    // immediately, so "I used a key to open the door" is untouched: there the
    // word after "used" is "a", not "to".
    if (/\b(use|used)$/i.test(verbPhrase.trim())) {
      const escapado = verbPhrase.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const useToRe = new RegExp(`\\b${escapado}\\s+to\\s+(\\w+)`, 'i');
      const m = sentenceText.match(useToRe);
      if (m) verbPhrase = verbPhrase.trim() + ' to ' + m[1];
    }

    // Find where the verb appears in the sentence (word-boundary safe)
    const verbIndex = wordIndexOf(sentenceText, verbPhrase);
    let beforeVerb = sentenceText.substring(0, verbIndex).trim();
    // Strip trailing punctuation so it doesn't appear as a lone C block
    const afterVerb = sentenceText.substring(verbIndex + verbPhrase.length).trim().replace(/[.!?]+$/, '');

    // Mid-position adverbs (MID_ADV, module level) between S and V belong to the V block
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
              const pos = wordIndexOf(beforeVerb, propMatch.text());
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
      if (obj) {
        const objIdx = wordIndexOf(remaining, obj);
        if (objIdx !== -1) remaining = remaining.substring(objIdx + obj.length).trim();
      }
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
/* Conectores que introducen una CONDICIÓN: el conector se pega a ella y las
   dos cláusulas se rotulan condición/resultado. */
const CONJ_CONDICION = ['if', 'unless', 'even if'];

/* Verbos que abren una cláusula sustantiva con `if` = «whether». Detrás de
   ellos `if` no introduce una condición sino el objeto del verbo. */
const VERBOS_WHETHER = ['know', 'knows', 'knew', 'wonder', 'wonders', 'wondered',
  'ask', 'asks', 'asked', 'see', 'saw', 'tell', 'tells', 'told', 'doubt', 'doubts',
  'remember', 'remembers', 'forget', 'forgets', 'decide', 'decides', 'decided',
  'check', 'checks', 'checked', 'care', 'cares', 'mind', 'minds', 'find out'];

/* OJO CON EL ORDEN: se devuelve el PRIMERO que corte, así que las locuciones
   largas van antes que sus partes. `if` va al final justamente por eso: si
   estuviera antes, "even if" e "in case" se partirían por la mitad.
   `if` faltaba en esta lista —estaba solo en SUBORD_CONJ, que sirve para
   detectar subordinadas, no para cortar—, y por eso "I will stay home if it
   rains" se tragaba la condición entera dentro del complemento. */
const SUBORD_SPLIT_CONJ = ['because', 'when', 'although', 'while', 'whereas', 'though', 'before', 'after', 'until', 'since', 'once', 'whenever', 'provided', 'even though', 'even if', 'in case', 'now that', 'unless', 'so that', 'if'];

// Try to split a sentence at the first clause-level conjunction (coord or subord).
// Returns { first, conj, second } or null.
function splitOnClauseConj(sentenceText) {
  const lower = sentenceText.toLowerCase().trim();

  // 0. Fronted "if" clause: "If you ..., main clause"
  //    first = clause after "if" and before comma (no "if" prefix)
  //    conj  = "if"
  //    second = main clause after the comma
  /* Subordinada ANTEPUESTA: "Cuando/Si/Aunque …, cláusula principal".
     Esta rama existía solo para `if`; el resto —when, because, although,
     unless, even if— no se partía NUNCA, porque el paso 2 encuentra la
     conjunción en el índice 0 y le queda una primera cláusula vacía. Se
     generaliza a toda la lista. El orden de SUBORD_SPLIT_CONJ importa: las
     locuciones largas van antes, así "even if" no se parte por `if`. */
  for (const conj of SUBORD_SPLIT_CONJ) {
    if (!lower.startsWith(conj + ' ')) continue;
    const commaIdx = sentenceText.indexOf(',');
    if (commaIdx === -1) break;
    const first = sentenceText.substring(conj.length, commaIdx).trim();
    const second = sentenceText.substring(commaIdx + 1).trim();
    if (first.split(/\s+/).length >= 2 && second && nlp(second).verbs().length > 0) {
      // `fronted`: la subordinada abre la oración, así que va primero.
      return { first, conj, second, fronted: true };
    }
    break;
  }

  // Helper: true if text has a verb that is NOT inside a subordinate clause
  const hasTopLevelVerb = (text) => {
    const verbDoc = nlp(text).verbs().first();
    if (!verbDoc.found) return false;
    const verbPos = wordIndexOf(text, verbDoc.text());
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
    /* `if` con estos verbos NO es condición, es «whether»: "I don't know if
       she is coming" es una cláusula sustantiva, el OBJETO de `know`. Partirla
       como condición/resultado enseña algo falso. Se deja sin cortar, igual que
       ya se hace con las de `that`. */
    if (conj === 'if' && VERBOS_WHETHER.some(v =>
      new RegExp(`\\b${v}\\b`, 'i').test(lower.substring(0, idx)))) continue;
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

  /* Con `if` el conector abre la CONDICIÓN, así que va pegado a ella — y eso
     cambia de sitio según dónde estuviera el `if` en la oración:
       "If it rains, I will stay home."  →  if · [condición] · [resultado]
       "I will stay home if it rains."   →  [resultado] · if · [condición]
     Poner el conector siempre delante invertía la segunda: se leía como si la
     condición fuera quedarse en casa. Las cláusulas se marcan con su papel para
     que la app pueda rotularlas. */
  // `unless` = «if not» y `even if` son de la misma familia: llevan condición.
  if (CONJ_CONDICION.includes(split.conj)) {
    const resto = buildClauseRows(split.second, level, firstSubject);
    if (split.fronted) {
      return [
        { isConjunction: true, text: split.conj },
        { components: firstComponents, papel: 'condicion' },
        ...resto.map((r, i) => (i === 0 && r.components ? { ...r, papel: 'resultado' } : r)),
      ];
    }
    return [
      { components: firstComponents, papel: 'resultado' },
      { isConjunction: true, text: split.conj },
      ...resto.map((r, i) => (i === 0 && r.components ? { ...r, papel: 'condicion' } : r)),
    ];
  }

  /* Antepuesta y NO condicional (when, because, although…): el conector abre la
     primera cláusula, así que también va delante. Dejarlo en medio se leía al
     revés — «When I arrive, I will call you» salía como "I arrive · when · I
     will call you". */
  if (split.fronted) {
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
// Split a verb phrase into [auxiliary, main verb]. Recognises primary
// auxiliaries/modals AND semi-auxiliary units ("going to", "used to", "have to"):
// the "to" belongs to the (semi-)auxiliary and the following main verb is in base
// form. Returns null when there's no auxiliary prefix — a single lexical verb
// ("works"), or copular "be"/possessive "have" sitting alone as the verb.
const AUX_LEX = new Set([
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having',
  'do', 'does', 'did',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must', 'ought',
]);
// Words that open a semi-auxiliary unit when immediately followed by "to"
// (future "going to", past habit "used to" / "use to").
const SEMI_AUX_STARTERS = new Set(['going', 'used', 'use']);
function splitVerbPhrase(text) {
  const words = String(text).trim().split(/\s+/);
  if (words.length < 2) return null;
  const norm = w => w.toLowerCase().replace(/[.,;:!?]+$/, '');
  const isNeg = w => { const x = norm(w); return x === 'not' || x === "n't" || x === 'n’t'; };
  let i = 0;
  while (i < words.length - 1) {
    const w = norm(words[i]);
    if (AUX_LEX.has(w)) { i++; continue; }                                              // primary auxiliary / modal
    if (i > 0 && isNeg(w)) { i++; continue; }                                           // negative particle rides with the aux
    if (SEMI_AUX_STARTERS.has(w) && norm(words[i + 1]) === 'to') { i += 2; continue; }  // "going to" / "used to"
    if (w === 'to' && i > 0) { i++; continue; }                                        // the "to" of "have to" / "ought to"
    break;
  }
  if (i === 0) return null;                     // no auxiliary prefix → don't split
  if (i >= words.length) i = words.length - 1;  // always leave one word as the main verb
  return { auxText: words.slice(0, i).join(' '), mainText: words.slice(i).join(' ') };
}

// Give auxiliaries their own AUX block, distinct from the main verb (V), while
// keeping them in the same "verb system" (rose vs deep red):
//  · question auxiliaries are already split out (isAuxiliary) → relabel AUX, but
//    only when a real main verb exists (copular "Is she a teacher?" → is stays V).
//  · any other verb phrase → pull its leading (semi-)auxiliaries into an AUX block,
//    leaving the base-form main verb as V.
function markAuxiliaries(components) {
  if (!components || !components.length) return components;
  const hasMainVerb = components.some(c => c.isMainVerb);
  const out = [];
  for (const c of components) {
    if (c.type !== 'V') { out.push(c); continue; }
    if (c.isAuxiliary) { out.push({ ...c, type: hasMainVerb ? 'AUX' : 'V' }); continue; }
    const sp = splitVerbPhrase(c.text);
    if (sp) {
      out.push({ ...c, type: 'AUX', text: sp.auxText, isAuxiliary: true, isMainVerb: false });
      out.push({ ...c, type: 'V', text: sp.mainText, isMainVerb: true, isAuxiliary: false });
    } else {
      out.push(c);
    }
  }
  return out;
}

// Common adverbs that sit in the verb region and should be their own adverbial
// block, not hidden inside the verb (frequency / indefinite time / focus).
const ADVERB_LEX = new Set([
  'ever', 'never', 'always', 'often', 'sometimes', 'usually', 'rarely', 'seldom',
  'just', 'already', 'still', 'also', 'really', 'generally', 'recently', 'frequently',
  'occasionally', 'normally', 'hardly', 'barely', 'nearly', 'almost', 'even',
]);
// Pull leading adverbs out of a verb phrase into their own adverbial (A) block —
// or Complement (C) at Básico/Elemental, where A doesn't exist.
function extractAdverbs(components, isBasic) {
  const out = [];
  for (const c of components) {
    if (c.type === 'V' && !c.isAuxiliary) {
      const words = String(c.text).trim().split(/\s+/);
      let k = 0;
      while (k < words.length - 1 && ADVERB_LEX.has(words[k].toLowerCase().replace(/[.,;:!?]+$/, ''))) k++;
      if (k > 0) {
        out.push({ ...c, type: 'A', text: words.slice(0, k).join(' '), isMainVerb: false, isAuxiliary: false });
        out.push({ ...c, type: 'V', text: words.slice(k).join(' '), isMainVerb: true });
        continue;
      }
    }
    out.push(c);
  }
  return out;
}

function analyzeStructure(text, level) {
  const doc = nlp(text);
  const sentences = doc.sentences().json();

  return sentences.map((s, idx) => {
    const sentText = s.text;
    // Flags always come from the whole-sentence analysis (isComplex counts the
    // full sentence, hasEmbeddedClause/error come from the top-level parse).
    const base = analyzeSentenceStructure(sentText, level);

    // Single-clause sentences (the common case): reuse the analysis we just did
    // instead of re-parsing inside buildClauseRows. For a no-split sentence at
    // top level buildClauseRows would return exactly [{ components }], so this
    // is behavior-preserving — it just drops the redundant second parse.
    const rawRows = splitOnClauseConj(sentText)
      ? buildClauseRows(sentText, level)
      : [{ components: base.components || [] }];
    // Split auxiliaries into their own AUX block (rose), distinct from the main
    // verb (V, deep red) — applied once here so both the display and the practice
    // answer map (buildStructureAnswerMap) stay consistent.
    const isBasic = level === 'Básico' || level === 'Elemental';
    const rows = rawRows.map(row =>
      row.components ? { ...row, components: extractAdverbs(markAuxiliaries(row.components), isBasic) } : row
    );

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

/* ── Phrasal Verb detection data ─────────────────────────────────────────────
   La lista vive en Grammar HUB/phrasal-verbs.json y llega generada. Estaba SOLO
   aquí, y Question Lab no tenía ninguna: «get up» salía bien en esta app y mal
   en la otra, que es cómo lo encontró el profesor en clase. Para cambiarla, se
   edita el JSON y se corre `npm run sync-phrasal` en Grammar HUB. */

/* ¿Detrás de la partícula viene un adverbial de tiempo/lugar? Igual que
   `particleIsPreposition`, pero para la capa de ESTRUCTURA, que no trabaja con
   los tokens del pintado sino con los términos de compromise. Se mira el texto
   de la oración porque la palabra que sigue está FUERA del sintagma verbal y
   por tanto fuera de `rawTerms`. */
function seguidoDeAdverbial(sentenceText, rawTerms, vEnd) {
  const part = (rawTerms[vEnd].text || '').replace(/[^A-Za-z]/g, '');
  if (!part) return false;
  const re = new RegExp('\\b' + part + '\\b\\s+(.*)$', 'i');
  const m = String(sentenceText || '').match(re);
  if (!m) return false;
  let resto = m[1].trim().split(/\s+/).filter(Boolean);
  if (!resto.length) return false;
  let head = resto[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  // Se salta un determinante: «on a holiday», «in the morning»
  if (DETERMINERS.includes(head)) {
    if (resto.length < 2) return false;
    head = resto[1].toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  return ADVERBIAL_HEADS.has(head) || /^\d{2,4}$/.test(head);
}

/* Añade al sintagma verbal la partícula que el LIBRO reconoce y compromise no.
   Solo se mira lo que va inmediatamente después del sintagma, y solo si el par
   verbo+partícula está en `PHRASAL_VERB_LIST`; si detrás hay un adverbial se
   deja como preposición, que es la misma regla de siempre. */
function añadirParticulaDelLibro(sentenceText, verbPhrase) {
  if (!verbPhrase) return verbPhrase;
  const palabras = verbPhrase.trim().split(/\s+/);
  const base = normVerb(palabras[0].toLowerCase().replace(/[^a-z]/g, ''));
  const sets = PHRASAL_BY_VERB.get(base);
  if (!sets) return verbPhrase;
  const esc = verbPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = String(sentenceText || '').match(new RegExp(esc + '\\s+([A-Za-z]+)', 'i'));
  if (!m) return verbPhrase;
  const sig = m[1].toLowerCase();
  const yaEsta = palabras.some(p => p.toLowerCase().replace(/[^a-z]/g, '') === sig);
  if (yaEsta) return verbPhrase;
  if (!sets.some(ps => ps.length === 1 && ps[0] === sig)) return verbPhrase;
  /* Adverbial detrás: «look after THE KIDS» sí, pero «go on HOLIDAY» no. */
  const fake = [{ text: sig }];
  if (PREP_PARTICLES.has(sig) && seguidoDeAdverbial(sentenceText, fake, 0)) return verbPhrase;
  return `${verbPhrase} ${m[1]}`;
}

// True if a PREP_PARTICLE at index p is really a preposition (adverbial PP),
// i.e. it is immediately followed by a time/place head noun or a year number.
function particleIsPreposition(tokens, p) {
  const partLower = tokens[p].text.toLowerCase();
  if (!PREP_PARTICLES.has(partLower)) return false;
  let n = p + 1;
  while (n < tokens.length && tokens[n].isPunct) n++;
  if (n >= tokens.length) return false;
  // Skip a determiner: "in the morning", "on a holiday"
  if (tokens[n].pos === 'determiner') {
    n++;
    while (n < tokens.length && tokens[n].isPunct) n++;
    if (n >= tokens.length) return false;
  }
  const head = tokens[n].text.toLowerCase();
  if (ADVERBIAL_HEADS.has(head)) return true;
  // Year / bare number after in/on/at → "in 2020", "on 5"
  if (tokens[n].pos === 'number' || /^\d{2,4}$/.test(head)) return true;
  return false;
}

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
  // compromise da here como Noun Uncountable. «there» NO va aquí: en «There is
  // a book» hace de sujeto y esa discusión es otra.
  here:'adverb',
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
  // `Date` last (after Noun): calendar words like "Monday"/"January"/"week"
  // carry Noun and resolve above; only pure-Date temporal adverbs
  // ("yesterday", "today", "tomorrow") fall through here → adverb, instead of
  // being flagged as unrecognized words (Rule 11).
  ['adverb',      ['Date']],
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

// Main tokenizer function — each sentence is processed independently so that
// question handling and the look-ahead passes never leak across sentence
// boundaries ("Is the food ready? Cooking takes time." must not let
// "Cooking" influence the analysis of "ready").
function tokenizeText(inputText, level = 'Intermedio') {
  const doc = nlp(inputText);
  const allTokens = [];
  doc.json().forEach(s => allTokens.push(...tokenizeSentence(s, level)));
  // Re-assign globally unique ids (in-sentence merges splice tokens away)
  allTokens.forEach((t, i) => { t.id = i; });
  return allTokens;
}

function tokenizeSentence(s, level) {
  // Filter out empty tokens (compromise sometimes creates empty tokens with contractions)
  const validTerms = (s.terms || []).filter(t => t.text && t.text.trim().length > 0);
  if (validTerms.length === 0) return [];

  // Question status of THIS sentence only
  const sentenceIsQuestion = isQuestion(s.text || '');

  const tokens = validTerms.map((t, i) => {
    const isPunct = /^[.,!?;:'"()[\]{}–—…-]+$/.test(t.text.trim());
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
      // 3. Capitalisation heuristic (proper nouns — Case 1 of Rule 11);
      //    skipped on the first word of the sentence
      if (!pos && i !== 0) {
        const c = t.text[0];
        if (c && c >= 'A' && c <= 'Z') pos = 'noun';
      }
    }
    // Rule 11 — unrecognized word classification
    let unrecognized = false;
    if (!isPunct && !pos) {
      const w = t.text;
      if (/[0-9]/.test(w) || /[^a-zA-ZÀ-ÿ'-]/.test(w)) {
        // Case 3: contains numbers or special chars → render as plain text
        // leave pos = null, isPunct-like behavior handled in WordToken
      } else {
        // Case 2: lowercase unrecognized word
        unrecognized = true;
      }
    }
    // Apply CONTRACTION_SPLITS: mark token with splitParts so WordToken renders two colored parts
    const split = CONTRACTION_SPLITS.get(t.text.toLowerCase());
    // compromise's doc.json() returns term.tags as an ARRAY of tag-name
    // strings (["Verb","Copula"]). The old Object.keys() turned that into
    // numeric indices ["0","1"], so every nlpTags.includes('Participle'/'Gerund'/…)
    // silently returned false. Handle both array and object shapes.
    const rawTags = t.tags || {};
    const nlpTags = !isPunct
      ? (Array.isArray(rawTags) ? [...rawTags] : Object.keys(rawTags).filter(k => rawTags[k] !== false))
      : [];
    if (split && !isPunct) {
      // Use first part's POS as the token's own pos (for stats counting etc.)
      pos = split[0].pos;
      unrecognized = false;
      // Clone so the shared CONTRACTION_SPLITS entries are never mutated by the
      // context-aware 's/'d pass below.
      const splitParts = split.map(p => ({ ...p }));
      return { id: i, text: t.text, pre: t.pre || '', post: t.post || '', pos, isPunct, unrecognized, splitParts, nlpTags };
    }
    return { id: i, text: t.text, pre: t.pre || '', post: t.post || '', pos, isPunct, unrecognized, nlpTags };
  });

  // ── Post-processing: contraction "'s"/"'d" split — copula/modal vs auxiliary (N1) ──
  // The static CONTRACTION_SPLITS map can't know context: "He's happy" → 's = is
  // (copular verb), "He's eaten" → 's = has (auxiliary). Same for 'd = would vs had.
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.isPunct || !tok.splitParts) continue;
    const part = tok.splitParts[1];
    if (!part || (part.text !== "'s" && part.text !== "'d")) continue;
    // Next content token (skip punctuation and adverbs: "he's just arrived")
    let j = i + 1;
    while (j < tokens.length && (tokens[j].isPunct || tokens[j].pos === 'adverb')) j++;
    const next = j < tokens.length ? tokens[j] : null;
    // Perfect participle → has/had: "he's eaten", "I'd finished" (isPerfectParticiple
    // already excludes predicative -ed adjectives like "tired"). A progressive
    // gerund → is: "she's studying" ('d has no progressive form).
    const afterPerfect = !!next && isPerfectParticiple(next.text);
    const afterGerund  = !!next && next.nlpTags.includes('Gerund');
    if (part.text === "'s") part.pos = (afterPerfect || afterGerund) ? 'auxiliary' : 'verb';
    else                    part.pos = afterPerfect ? 'auxiliary' : 'modal';
  }

  // ── Post-processing: ambigüedad léxica ──────────────────────────────────────
  // Va ANTES del paso de «be» porque ese consulta lo que estas dos deciden
  // (psyAdj / ingNoun). Las reglas están arriba, en una sola copia, porque la
  // capa de estructura arma su propio POS y tiene que decidir lo mismo.
  resolverIng(tokens);
  resolverDoSupport(tokens);

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
      // -ing word: it's the progressive verb ONLY if compromise did not tag it
      // as a pure adjective. "The movie is interesting" / "The trip was tiring"
      // → predicative adjective (be = copula), not "be + V-ing". But a real
      // gerund that compromise mis-tags as adjective in questions ("What are you
      // doing?") still carries the Gerund tag, so it's kept as the verb. (I3)
      if (tLow.endsWith('ing') && t.pos !== 'auxiliary' && t.pos !== 'modal') {
        // Ya decidido arriba: adjetivo predicativo ("Is the map confusing?") o
        // núcleo del sujeto ("Is the building new?"). En los dos casos el be es
        // cópula, no auxiliar de progresivo.
        if (t.psyAdj || t.ingNoun) break;
        const isPureAdj = t.nlpTags.includes('Adjective') && !t.nlpTags.includes('Gerund');
        if (isPureAdj) break; // copula + adjective → stop, leave `be` as verb
        nextVerb = t; break;
      }
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
  if (sentenceIsQuestion) {
    // Find the first auxiliary or modal
    let auxIndex = -1;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].pos === 'auxiliary' || tokens[i].pos === 'modal') {
        auxIndex = i;
        break;
      }
    }

    // If we found an auxiliary/modal, promote the main-verb candidate — with
    // the same safeguards as the structure analysis: skip adverbs ("Do you
    // really like...?") and auxiliary chunks ("have to"), and only force
    // 'verb' when the position (do/did/modal) or the tags prove it. Copular
    // questions ("Is your brother tall?") keep the adjective as adjective.
    if (auxIndex !== -1) {
      const subjEnd = findQuestionSubjectEnd(tokens, auxIndex + 1, tokens[auxIndex] && tokens[auxIndex].text);
      let candidateIdx = subjEnd;
      while (candidateIdx < tokens.length &&
             !tokens[candidateIdx].isPunct &&
             (tokens[candidateIdx].pos === 'auxiliary' || tokens[candidateIdx].pos === 'adverb')) {
        candidateIdx++;
      }
      if (candidateIdx < tokens.length && !tokens[candidateIdx].isPunct &&
          isLikelyQuestionMainVerb(tokens[auxIndex].text, tokens[candidateIdx])) {
        tokens[candidateIdx].pos = 'verb';
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

        // Saltar todo lo que puede ser el SUJETO de una pregunta invertida. Los
        // pronombres ya estaban ("is he playing?"), pero faltaban los
        // sustantivos: en "Is the plan working?" se tomaba «plan» como
        // complemento y el be quedaba de cópula. Con sujeto de una palabra
        // funcionaba y con determinante no, que es lo que lo escondía.
        // `ingNoun` es un sustantivo en -ing que encabeza el sujeto ("Is the
        // building new?"): se salta y NO cuenta como gerundio.
        if (nextToken.isPunct || nextToken.pos === 'determiner' ||
            nextToken.pos === 'pronoun' || nextToken.pos === 'noun' || nextToken.ingNoun) {
          continue;
        }
        // Adjetivo predicativo ya decidido ("Was the trip tiring?") → cópula.
        if (nextToken.psyAdj) break;

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
  if (sentenceIsQuestion) {
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
  if (sentenceIsQuestion) {
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

  /* ── Preposición que compromise dio por partícula ────────────────────────
     Mismo fallo que en el sintagma verbal, por el otro camino: aquí la palabra
     se PINTA de verbo. «She works in Santiago» salía con el `in` rojo.
     Solo se corrigen las que también son PREPOSICIÓN (in, on, at, to, for…).
     Las partículas puras —up, down, off, out, back— NO se tocan: en «She showed
     up» el `up` es del verbo aunque `show up` no esté en nuestra lista, y
     llamarlo preposición sería cambiar un error por otro peor.
     Va ANTES del paso de abajo para no deshacer lo que ese confirma. */
  for (let i = 1; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.pos !== 'verb' || tok.isPhrasalParticle) continue;
    const w = tok.text.toLowerCase();
    if (!PREP_PARTICLES.has(w)) continue;
    let v = i - 1;
    while (v >= 0 && tokens[v].isPunct) v--;
    if (v < 0 || !['verb', 'auxiliary', 'modal'].includes(tokens[v].pos)) continue;
    const sets = PHRASAL_BY_VERB.get(normVerb(tokens[v].text));
    if (sets && sets.some(ps => ps.includes(w))) continue;   // lo confirma el libro
    tok.pos = 'preposition';
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
        // I1: reject if the LAST matched particle is really a preposition
        // heading an adverbial ("came in the morning", "went on holiday").
        const lastPart = matchIdx[matchIdx.length - 1];
        if (particleIsPreposition(tokens, lastPart)) {
          // compromise sometimes tags the particle as a verb via its own
          // phrasal detection — restore it to preposition.
          if (tokens[lastPart].pos === 'verb') tokens[lastPart].pos = 'preposition';
          break;
        }

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
            // I1: reject the separated match when the particle is followed by
            // another noun ("took the bus back home" → "back" is adverbial, not
            // a particle) or heads an adverbial PP ("put it on Monday").
            let m = k + 1;
            while (m < tokens.length && tokens[m].isPunct) m++;
            const followedByNoun = m < tokens.length && tokens[m].pos === 'noun';
            if (followedByNoun || particleIsPreposition(tokens, k)) { npOnly = false; break; }

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

// ── Manual practice: map each token to its structure block ──────────────────
// Walks the tokens and the structure components in parallel (both are in
// sentence order), so repeated words ("the" in S and in O) land in the right
// block. Conjunction rows ("and", "but", "if") have no block → null.
// Token text is contraction-expanded so "doesn't" aligns with "does not".
function buildStructureAnswerMap(manualTokens, structureData) {
  const map = {};
  if (!manualTokens?.length || !structureData?.length) return map;

  const splitWords = (str) =>
    expandContractions(String(str))
      .toLowerCase()
      .replace(/[,;:.!?"“”]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

  // Flatten every sentence's rows into an ordered word list with block types
  const compWords = [];
  structureData.forEach(sent => {
    const rows = sent.rows || (sent.components ? [{ components: sent.components }] : []);
    rows.forEach(row => {
      if (row.isConjunction) {
        splitWords(row.text).forEach(w => compWords.push({ word: w, type: null }));
        return;
      }
      (row.components || []).forEach(comp => {
        if (comp.implied) return; // implied subject has no visible token
        splitWords(comp.text).forEach(w => compWords.push({ word: w, type: comp.type }));
      });
    });
  });

  let ci = 0;
  for (const tok of manualTokens) {
    if (tok.isPunct) continue;
    const tokWords = splitWords(tok.text);
    if (tokWords.length === 0) continue;
    // Find the token's first word near the current cursor (small window
    // tolerates words the structure analysis dropped or reordered)
    let found = -1;
    for (let k = ci; k < Math.min(ci + 6, compWords.length); k++) {
      if (compWords[k].word === tokWords[0]) { found = k; break; }
    }
    if (found !== -1) {
      map[tok.id] = compWords[found].type;
      ci = found + tokWords.length;
    } else {
      map[tok.id] = null;
    }
  }
  return map;
}

export {
  isQuestion,
  expandContractions,
  analyzeSentenceStructure,
  splitOnClauseConj,
  buildClauseRows,
  analyzeStructure,
  tokenizeText,
  buildStructureAnswerMap,
  wordIndexOf,
  CONTRACTION_SPLITS,
  WORD_LEXICON,
};
