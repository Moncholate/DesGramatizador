// Suite de regresión del análisis NLP.
// Los casos provienen de los ejemplos documentados en REGLAS.md y de los
// bugs corregidos en la revisión de julio 2026 (C1–C5).
// Ejecutar con: npm test
import { describe, it, expect } from 'vitest';
import {
  isQuestion,
  analyzeSentenceStructure,
  buildClauseRows,
  analyzeStructure,
  tokenizeText,
  buildStructureAnswerMap,
} from './analysis.js';

// ── helpers ─────────────────────────────────────────────────────────────────
const blocks = (text, level = 'Básico') =>
  (analyzeSentenceStructure(text, level).components || []).map(c => `${c.type}:${c.text}`);

const posOf = (text, word, level = 'Básico') => {
  const tok = tokenizeText(text, level)
    .find(t => !t.isPunct && t.text.toLowerCase() === word.toLowerCase());
  return tok ? tok.pos : undefined;
};

const answerMap = (text, level = 'Básico') => {
  const toks = tokenizeText(text, level);
  const map = buildStructureAnswerMap(toks, analyzeStructure(text, level));
  const byWord = {};
  toks.filter(t => !t.isPunct).forEach(t => { byWord[t.text] = map[t.id]; });
  return byWord;
};

// ── isQuestion (C5) ─────────────────────────────────────────────────────────
describe('isQuestion — solo el "?" marca pregunta', () => {
  it('acepta preguntas con signo', () => {
    expect(isQuestion('Is she happy?')).toBe(true);
    expect(isQuestion('Where do you live?')).toBe(true);
  });
  it('imperativos NO son preguntas (bug C5)', () => {
    expect(isQuestion('Do your homework.')).toBe(false);
    expect(isQuestion('Have a nice day.')).toBe(false);
    expect(isQuestion('Where we live matters.')).toBe(false);
  });
});

// ── Estructura: declarativas básicas ────────────────────────────────────────
describe('estructura — declarativas', () => {
  it('C1: "This is..." no parte palabras ([S: Th] era el bug)', () => {
    expect(blocks('This is my book.')).toEqual(['S:This', 'V:is', 'C:my book']);
  });
  it('C1: "His name is John."', () => {
    expect(blocks('His name is John.')).toEqual(['S:His name', 'V:is', 'C:John']);
  });
  it('Regla 8: modal + have + participio en un solo bloque V', () => {
    expect(blocks('She should have called earlier.', 'Intermedio'))
      .toEqual(['S:She', 'V:should have called', 'C:earlier']);
  });
  it('Regla 6: gerundio como sujeto', () => {
    const b = blocks('Working from home has become very common since 2020.', 'Intermedio');
    expect(b[0]).toBe('S:Working from home');
    expect(b[1]).toBe('V:has become');
  });
  it('Regla 7: sujeto expletivo "It" marcado como formal', () => {
    const r = analyzeSentenceStructure(
      'It is widely believed that excessive use can contribute to anxiety.', 'Intermedio');
    const s = r.components.find(c => c.type === 'S');
    expect(s.text).toBe('It');
    expect(s.formal).toBe(true);
    expect(r.components.find(c => c.type === 'V').text).toBe('is widely believed');
  });
});

// ── Estructura: negativas (C4) ──────────────────────────────────────────────
describe('estructura — negativas incluyen el verbo principal', () => {
  it('"She doesn\'t like coffee." → V: does not like', () => {
    expect(blocks("She doesn't like coffee.")).toEqual(['S:She', 'V:does not like', 'C:coffee']);
  });
  it('con adverbio intermedio: does not really like', () => {
    expect(blocks('She does not really like coffee.'))
      .toEqual(['S:She', 'V:does not really like', 'C:coffee']);
  });
  it('pasado: did not see', () => {
    expect(blocks('I did not see the movie.')).toEqual(['S:I', 'V:did not see', 'C:the movie']);
  });
  it('"be + not" queda copular: el adjetivo es C', () => {
    expect(blocks('She is not happy.')).toEqual(['S:She', 'V:is not', 'C:happy']);
    expect(blocks('It is not a problem.')).toEqual(['S:It', 'V:is not', 'C:a problem']);
  });
  it('Regla 16 + negación: does not have to work', () => {
    expect(blocks("She doesn't have to work on Sundays."))
      .toEqual(['S:She', 'V:does not have to work', 'C:on Sundays']);
  });
});

// ── Estructura: imperativos (C5) ────────────────────────────────────────────
describe('estructura — imperativos (antes se leían como preguntas)', () => {
  it('"Do your homework."', () => {
    expect(blocks('Do your homework.')).toEqual(['V:Do', 'C:your homework']);
  });
  it('"Have a nice day." ("nice" ya no es verbo)', () => {
    expect(blocks('Have a nice day.')).toEqual(['V:Have', 'C:a nice day']);
  });
});

// ── Estructura: preguntas (C3 + REGLAS 12/14) ───────────────────────────────
describe('estructura — preguntas', () => {
  it('Tipo 1 copular: "Is she a teacher?" (REGLAS 12)', () => {
    expect(blocks('Is she a teacher?')).toEqual(['V:Is', 'S:she', 'C:a teacher']);
  });
  it('C3: copular + adjetivo — el adjetivo es C, no V', () => {
    expect(blocks('Is she happy?')).toEqual(['V:Is', 'S:she', 'C:happy']);
    expect(blocks('Is your brother tall?')).toEqual(['V:Is', 'S:your brother', 'C:tall']);
  });
  it('Tipo 2 con do: "Do you like coffee?"', () => {
    expect(blocks('Do you like coffee?')).toEqual(['V:Do', 'S:you', 'V:like', 'C:coffee']);
  });
  it('Tipo 3 wh-: "Where do you live?"', () => {
    expect(blocks('Where do you live?')).toEqual(['WH:Where', 'V:do', 'S:you', 'V:live']);
  });
  it('Regla 14: "What time is it?" / "How long does it take?"', () => {
    expect(blocks('What time is it?')).toEqual(['WH:What time', 'V:is', 'S:it']);
    expect(blocks('How long does it take?')).toEqual(['WH:How long', 'V:does', 'S:it', 'V:take']);
  });
  it('Regla 16 en pregunta: "Do you have to work tomorrow?"', () => {
    const b = blocks('Do you have to work tomorrow?');
    expect(b.slice(0, 2)).toEqual(['V:Do', 'S:you']);
    expect(b.some(x => x.startsWith('V:have to work'))).toBe(true);
  });
  it('pregunta negativa: "Don\'t you like coffee?"', () => {
    expect(blocks("Don't you like coffee?")).toEqual(['V:do not', 'S:you', 'V:like', 'C:coffee']);
  });
});

// ── Estructura: cláusulas (Regla 5) ─────────────────────────────────────────
describe('estructura — división en cláusulas', () => {
  it('coordinada con sujeto implícito heredado', () => {
    const rows = buildClauseRows('We walked slowly and took many photos.', 'Intermedio');
    expect(rows).toHaveLength(3);
    expect(rows[1]).toEqual({ isConjunction: true, text: 'and' });
    const implied = rows[2].components.find(c => c.type === 'S');
    expect(implied.text).toBe('We');
    expect(implied.implied).toBe(true);
  });
  it('lista nominal NO divide ("apples and oranges")', () => {
    const rows = buildClauseRows('I like apples and oranges.', 'Básico');
    expect(rows).toHaveLength(1);
  });
  it('condicional frontal: fila [if] antes de la condición (Regla 3)', () => {
    const rows = buildClauseRows('If you study hard, you will pass.', 'Básico');
    expect(rows[0]).toEqual({ isConjunction: true, text: 'if' });
    expect(rows.length).toBeGreaterThanOrEqual(3);
  });
});

// ── POS ─────────────────────────────────────────────────────────────────────
describe('POS palabra por palabra', () => {
  it('Regla 10: phrasal verb adyacente — ambas palabras verbo', () => {
    expect(posOf('Turn off the light.', 'Turn')).toBe('verb');
    expect(posOf('Turn off the light.', 'off')).toBe('verb');
  });
  it('Regla 16: "has to" fusionado como AUX + verbo principal', () => {
    const toks = tokenizeText('She has to study tonight.', 'Básico');
    const hasTo = toks.find(t => t.text === 'has to');
    expect(hasTo?.pos).toBe('auxiliary');
    expect(posOf('She has to study tonight.', 'study')).toBe('verb');
  });
  it('Regla 16: perfecto vs posesión', () => {
    expect(posOf('I have played football.', 'have')).toBe('auxiliary');
    expect(posOf('I have a car.', 'have')).toBe('verb');
  });
  it('C3 en POS: adverbio intermedio no se fuerza a verbo', () => {
    expect(posOf('Do you really like coffee?', 'really')).toBe('adverb');
    expect(posOf('Do you really like coffee?', 'like')).toBe('verb');
  });
  it('C3 en POS: pregunta copular mantiene el adjetivo', () => {
    expect(posOf('Is your brother tall?', 'tall')).toBe('adjective');
    expect(posOf('Is your brother tall?', 'Is')).toBe('verb');
  });
  it('I2: el análisis no cruza límites de oración', () => {
    const text = 'Is the food ready? Cooking takes time.';
    expect(posOf(text, 'ready')).toBe('adjective');
    expect(posOf(text, 'takes')).toBe('verb');
  });
  it('C5+I2: wh- se etiqueta por oración en textos multi-oración', () => {
    const text = 'Where do you live? I live in Santiago.';
    expect(posOf(text, 'Where')).toBe('wh');
    expect(posOf(text, 'Santiago')).toBe('noun');
  });
  it('Regla 13: wh- solo es WH en pregunta directa', () => {
    expect(posOf('Where do you live?', 'Where')).toBe('wh');
    expect(posOf('I know where you live.', 'where')).not.toBe('wh');
  });
  it('Regla 17: NUM en Intermedio, DET en Básico', () => {
    expect(posOf('I have three brothers.', 'three', 'Intermedio')).toBe('number');
    expect(posOf('I have three brothers.', 'three', 'Básico')).toBe('determiner');
  });
  it('adverbios temporales "Date" no quedan como no reconocidos', () => {
    const isUnrec = (s, w) => {
      const t = tokenizeText(s, 'Básico').find(x => !x.isPunct && x.text.toLowerCase() === w.toLowerCase());
      return !!(t && t.unrecognized);
    };
    expect(posOf('I turned off the lights yesterday.', 'yesterday')).toBe('adverb');
    expect(isUnrec('I turned off the lights yesterday.', 'yesterday')).toBe(false);
    expect(posOf('See you tomorrow.', 'tomorrow')).toBe('adverb');
    expect(posOf('I am busy today.', 'today')).toBe('adverb');
    // palabras de calendario con Noun NO deben volverse adverbio
    expect(posOf('I work on Monday.', 'Monday', 'Intermedio')).toBe('noun');
    expect(posOf('We met in January.', 'January', 'Intermedio')).toBe('noun');
  });
});

// ── I1: falsos positivos de phrasal verbs ───────────────────────────────────
describe('POS — phrasal verbs vs verbo + preposición (I1)', () => {
  const isPV = (text, word, level = 'Básico') => {
    const t = tokenizeText(text, level).find(x => !x.isPunct && x.text.toLowerCase() === word.toLowerCase());
    return !!(t && t.phrasalVerb);
  };
  it('NO marca phrasal cuando la partícula encabeza un adverbial', () => {
    expect(isPV('She came in the morning.', 'in')).toBe(false);
    expect(isPV('We went on holiday last week.', 'on')).toBe(false);
    expect(isPV('They arrived on Monday.', 'on')).toBe(false);
    expect(isPV('It happened in 2020.', 'in', 'Intermedio')).toBe(false);
  });
  it('la partícula-preposición rechazada vuelve a preposition', () => {
    expect(posOf('We went on holiday.', 'on')).toBe('preposition');
    expect(posOf('She came in the morning.', 'in')).toBe('preposition');
  });
  it('forma separada: "took the bus back home" no es phrasal', () => {
    expect(isPV('I took the bus back home.', 'back')).toBe(false);
  });
  it('MANTIENE los phrasal verbs legítimos', () => {
    expect(isPV('Turn off the light.', 'off')).toBe(true);
    expect(isPV('Turn the light off.', 'off')).toBe(true);
    expect(isPV('Please sit down.', 'down')).toBe(true);
    expect(isPV('I get up at seven.', 'up')).toBe(true);
    expect(isPV('Look at the board.', 'at')).toBe(true);
    expect(isPV('She looks after the kids.', 'after')).toBe(true);
    expect(isPV('Get on the bus.', 'on')).toBe(true);
    expect(isPV('We ran into a problem.', 'into')).toBe(true);
  });
});

// ── I3: cópula be + adjetivo -ing ────────────────────────────────────────────
describe('POS — be copular con adjetivo -ing (I3)', () => {
  it('adjetivo predicativo -ing → be es verbo (copula)', () => {
    expect(posOf('The movie is interesting.', 'is')).toBe('verb');
    expect(posOf('It is boring.', 'is')).toBe('verb');
    expect(posOf('The trip was tiring.', 'was', 'Intermedio')).toBe('verb');
    expect(posOf('This book is very interesting.', 'is')).toBe('verb');
  });
  it('progresivo real → be sigue siendo auxiliar', () => {
    expect(posOf('She is running fast.', 'is')).toBe('auxiliary');
    expect(posOf('I am studying English.', 'am')).toBe('auxiliary');
    expect(posOf('What are you doing?', 'are')).toBe('auxiliary');
  });
  it('pasiva con participio -built → auxiliar (fix nlpTags)', () => {
    expect(posOf('The house was built in 2020.', 'was', 'Intermedio')).toBe('auxiliary');
  });
});

// ── I4: cláusulas relativas de sujeto ────────────────────────────────────────
describe('estructura — relativas de sujeto (I4)', () => {
  it('el verbo de la relativa NO es el verbo principal', () => {
    expect(blocks('The man who called is here.', 'Intermedio'))
      .toEqual(['S:The man who called', 'V:is', 'C:here']);
    expect(blocks('The book that I read was good.', 'Intermedio'))
      .toEqual(['S:The book that I read', 'V:was', 'C:good']);
    expect(blocks('The girl who lives next door is my friend.', 'Intermedio'))
      .toEqual(['S:The girl who lives next door', 'V:is', 'C:my friend']);
  });
  it('relativa de objeto NO se confunde (verbo principal primero)', () => {
    expect(blocks('I know the man who called.', 'Intermedio'))
      .toEqual(['S:I', 'V:know', 'C:the man who called']);
  });
  it('"that" complementante no activa la relativa de sujeto', () => {
    const b = blocks('She thinks that he is right.', 'Intermedio');
    expect(b[0]).toBe('S:She');
    expect(b[1]).toBe('V:thinks');
  });
});

// ── N1: contracciones 's / 'd ambiguas (is/has, would/had) ──────────────────
describe("contracciones 's / 'd — estructura", () => {
  const V = (s, l = 'Intermedio') => {
    const c = (analyzeSentenceStructure(s, l).components || []).find(x => x.type === 'V');
    return c ? c.text : '';
  };
  it("'s + participio → has (perfecto)", () => {
    expect(V("He's eaten breakfast.")).toBe('has eaten');
    expect(V("She's gone.").startsWith('has gone')).toBe(true);
    expect(V("He's played football.")).toBe('has played');
  });
  it("'s + adjetivo/nombre → is (copular)", () => {
    expect(V("She's happy.")).toBe('is');
    expect(V("He's a doctor.")).toBe('is');
    expect(V("He's tired.").startsWith('is')).toBe(true); // "tired" es adjetivo, no participio
  });
  it("'d + participio → had; 'd + infinitivo → would", () => {
    expect(V("I'd finished before noon.")).toBe('had finished');
    expect(V("I'd like a coffee.")).toBe('would like');
  });
  it('el posesivo no se expande', () => {
    expect(blocks("John's book is here.", 'Básico')).toEqual(['S:John\'s book', 'V:is', 'C:here']);
  });
});

describe("contracciones 's / 'd — POS (split part)", () => {
  const partPos = (s, partText, l = 'Básico') => {
    const tok = tokenizeText(s, l).find(x => x.splitParts);
    const p = tok && tok.splitParts.find(pp => pp.text === partText);
    return p ? p.pos : undefined;
  };
  it("'s copular vs auxiliar según el contexto", () => {
    expect(partPos("He's happy.", "'s")).toBe('verb');
    expect(partPos("He's eaten.", "'s")).toBe('auxiliary');
    expect(partPos("She's studying.", "'s")).toBe('auxiliary');
    expect(partPos("He's tired.", "'s")).toBe('verb');
  });
  it("'d modal vs auxiliar según el contexto", () => {
    expect(partPos("I'd like coffee.", "'d")).toBe('modal');
    expect(partPos("I'd finished.", "'d")).toBe('auxiliary');
  });
});

// ── Mapa de respuestas para Práctica Manual → Estructura (C2) ───────────────
describe('buildStructureAnswerMap', () => {
  it('mapea cada token a su bloque', () => {
    expect(answerMap('My name is Valentina.')).toEqual({
      My: 'S', name: 'S', is: 'V', Valentina: 'C',
    });
  });
  it('alinea contracciones y marca el auxiliar como AUX', () => {
    const m = answerMap("She doesn't like coffee.");
    expect(m.She).toBe('S');
    expect(m["doesn't"]).toBe('AUX');
    expect(m.like).toBe('V');
    expect(m.coffee).toBe('C');
  });
  it('separa el auxiliar (AUX) del verbo principal (V) en pregunta y declarativa', () => {
    const q = answerMap('Does she work here?');
    expect(q.Does).toBe('AUX');
    expect(q.work).toBe('V');

    const d = answerMap('She is working today.', 'Intermedio');
    expect(d.is).toBe('AUX');
    expect(d.working).toBe('V');
  });
  it('la cópula "be" sigue siendo verbo principal, no auxiliar', () => {
    const q = answerMap('Is she a teacher?');
    expect(q.Is).toBe('V');
    const d = answerMap('My name is Valentina.');
    expect(d.is).toBe('V');
  });
  it('trata going to / used to / have to como unidad auxiliar (verbo principal en base)', () => {
    const g = answerMap('She is going to travel.', 'Intermedio');
    expect(g.is).toBe('AUX');
    expect(g.going).toBe('AUX');
    expect(g.to).toBe('AUX');
    expect(g.travel).toBe('V');

    const u = answerMap('She used to play football.', 'Intermedio');
    expect(u.used).toBe('AUX');
    expect(u.to).toBe('AUX');
    expect(u.play).toBe('V');

    // "have to" is grouped into a single token by POS (REGLA 16)
    const h = answerMap('They have to study hard.', 'Intermedio');
    expect(h['have to']).toBe('AUX');
    expect(h.study).toBe('V');
  });
  it('captura adverbios (ever, never) como adverbial en vez de perderlos o meterlos al verbo', () => {
    const q = answerMap('Have you ever visited Chiloe?', 'Intermedio');
    expect(q.ever).toBe('A');
    expect(q.visited).toBe('V');

    // También en Básico: los adverbios de frecuencia se muestran (no caen en C)
    const b = answerMap('Have you ever visited Chiloe?', 'Básico');
    expect(b.ever).toBe('A');

    const d = answerMap('She never eats meat.', 'Intermedio');
    expect(d.never).toBe('A');
    expect(d.eats).toBe('V');
  });
  it('la negación "not" se queda con el auxiliar', () => {
    const m = answerMap('She does not like coffee.', 'Intermedio');
    expect(m.does).toBe('AUX');
    expect(m.not).toBe('AUX');
    expect(m.like).toBe('V');
  });
  it('conjunción entre cláusulas queda sin bloque (null)', () => {
    const m = answerMap('We walked slowly and took many photos.', 'Intermedio');
    expect(m.and).toBeNull();
    expect(m.took).toBe('V');
  });
  it('funciona con varias oraciones (antes solo miraba la primera)', () => {
    const m = answerMap('I live in Santiago. My brother is a teacher.');
    expect(m.I).toBe('S');
    expect(m.brother).toBe('S');
    expect(m.teacher).toBe('C');
  });
});

// ── Ambigüedad léxica (agosto 2026) ──────────────────────────────────────────
// Todo lo de acá va en PARES MÍNIMOS a propósito: la misma palabra en sus dos
// lecturas. Un "arreglo" de ambigüedad que solo mira un lado siempre parece
// funcionar — corrige «Is the map confusing?» y rompe «Am I confusing you?», y
// nadie se entera porque nadie prueba la otra mitad.
// Portado desde Question Lab, que tiene el mismo problema con su propio
// analizador. Las reglas son PSY_TRANS/PSY_INTRANS + los dos post-procesados.
describe('ambigüedad: adjetivo en -ing vs gerundio', () => {
  const pares = [
    ['Is the map confusing?',           'confusing',  'adjective',
     'Am I confusing you?',             'confusing',  'verb'],
    ['Is the music relaxing?',          'relaxing',   'adjective',
     'Are you relaxing?',               'relaxing',   'verb'],
    ['Is your job interesting?',        'interesting','adjective',
     'Are you interesting the client?', 'interesting','verb'],
    ['Is she boring?',                  'boring',     'adjective',
     'Is the teacher boring the class?','boring',     'verb'],
    ['Is the noise annoying?',          'annoying',   'adjective',
     'Am I annoying you?',              'annoying',   'verb'],
    ['Was the trip tiring?',            'tiring',     'adjective',
     'Was the noise tiring the students?','tiring',   'verb'],
  ];
  for (const [qa, wa, pa, qv, wv, pv] of pares) {
    it(`«${qa}» → ${pa} · «${qv}» → ${pv}`, () => {
      expect(posOf(qa, wa)).toBe(pa);
      expect(posOf(qv, wv)).toBe(pv);
    });
  }
  it('un adverbio al final no es objeto', () => {
    expect(posOf('Is the music relaxing tonight?', 'relaxing')).toBe('adjective');
    expect(posOf('Are you relaxing tonight?', 'relaxing')).toBe('verb');
  });
  it('se abstiene cuando el verbo no es psicológico', () => {
    expect(posOf('Is she cooking dinner?', 'cooking')).toBe('verb');
    expect(posOf('Is it raining?', 'raining')).toBe('verb');
    expect(posOf('What are you doing?', 'doing')).toBe('verb');
    expect(posOf('Are they building a house?', 'building')).toBe('verb');
  });
});

describe('ambigüedad: -ing como núcleo del sujeto o como verbo', () => {
  it('después del núcleo del sujeto es el verbo', () => {
    expect(posOf('Is the plan working?', 'working')).toBe('verb');
    expect(posOf('Is your phone charging?', 'charging')).toBe('verb');
  });
  it('pegado al determinante es el núcleo, y el be queda de cópula', () => {
    expect(posOf('Is the building new?', 'building')).toBe('noun');
    expect(posOf('Is the building new?', 'Is')).toBe('verb');
    expect(posOf('Are the meeting rooms ready?', 'meeting')).toBe('noun');
    expect(posOf('Are the meeting rooms ready?', 'Are')).toBe('verb');
  });
});

describe('ambigüedad: sustantivo o verbo', () => {
  const pares = [
    ['Does the bus stop here?', 'stop', 'verb',   'Where is the bus stop?',   'stop',  'noun'],
    ['Did you pass the exam?',  'pass', 'verb',   'Is your pass valid?',      'pass',  'noun'],
    ['Do you watch TV?',        'watch','verb',   'Is your watch expensive?', 'watch', 'noun'],
    ['Did you order a coffee?', 'order','verb',   'Is the order ready?',      'order', 'noun'],
    ['Did she call you?',       'call', 'verb',   'Was the call important?',  'call',  'noun'],
  ];
  for (const [qv, wv, pv, qn, wn, pn] of pares) {
    it(`«${qv}» → verbo · «${qn}» → sustantivo`, () => {
      expect(posOf(qv, wv)).toBe(pv);
      expect(posOf(qn, wn)).toBe(pn);
    });
  }
  it('una pregunta con do-support siempre tiene verbo principal', () => {
    expect(posOf('Does the bus stop here?', 'stop')).toBe('verb');
  });
  it('el sujeto de do-support no puede ser un verbo pelado', () => {
    // Venían cambiados: «work» de verbo y «start» de sustantivo.
    expect(posOf('Does work start at eight?', 'work')).toBe('noun');
    expect(posOf('Does work start at eight?', 'start')).toBe('verb');
    // y la decisión debe sobrevivir a los pasos siguientes
    expect(answerMap('Does work start at eight?', 'Intermedio').work).toBe('S');
  });
  it('no toca las preguntas con sujeto normal', () => {
    expect(posOf('Do you google it?', 'google')).toBe('verb');   // caso ya documentado
    expect(posOf('Do you work here?', 'work')).toBe('verb');
    expect(posOf('Does he speak English?', 'speak')).toBe('verb');
    expect(posOf('Do people like coffee?', 'like')).toBe('verb');
  });
  it('«here» es adverbio, no sustantivo', () => {
    expect(posOf('Does the bus stop here?', 'here')).toBe('adverb');
  });
});

// Las dos capas (la que PINTA categorías y la que arma S/V/C) construyen su POS
// por separado. Si cada una resuelve la ambigüedad a su manera, la app se
// contradice en pantalla: «working» pintado de verbo y metido en el sujeto.
describe('ambigüedad: las dos capas dicen lo mismo', () => {
  const beDe = (q) => {
    const toks = tokenizeText(q, 'Intermedio');
    const map = buildStructureAnswerMap(toks, analyzeStructure(q, 'Intermedio'));
    const be = toks.find(t => ['is','are','am','was','were'].includes(t.text.toLowerCase()));
    return { pos: be.pos, bloque: map[be.id] };
  };
  const casos = [
    ['Is the plan working?',            'auxiliary', 'AUX'],  // progresivo
    ['Is your phone charging?',         'auxiliary', 'AUX'],
    ['Is the teacher boring the class?','auxiliary', 'AUX'],
    ['Is the music relaxing?',          'verb',      'V'],    // cópula + adjetivo
    ['Was the trip tiring?',            'verb',      'V'],
    ['Is the building new?',            'verb',      'V'],    // cópula + sujeto en -ing
    ['Are the meeting rooms ready?',    'verb',      'V'],
    ['Is she a teacher?',               'verb',      'V'],
    ['Is the plan ready?',              'verb',      'V'],
    ['Is the book on the table?',       'verb',      'V'],
  ];
  for (const [q, pos, bloque] of casos) {
    it(`«${q}» → ${pos}`, () => {
      // Con sujeto de UNA palabra esto ya funcionaba; con determinante no, y eso
      // lo escondía: el paso de cópula saltaba pronombres pero no sustantivos.
      expect(beDe(q)).toEqual({ pos, bloque });
    });
  }
});
