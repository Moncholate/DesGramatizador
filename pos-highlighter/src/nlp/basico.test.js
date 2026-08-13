/* ============================================================================
   LO BÁSICO · Desgramatizador
   ----------------------------------------------------------------------------
   Existe por un fallo de clase (2026-08-12): «She works in Santiago» daba el
   verbo «works in». Palabra del profesor: el idioma es ambiguo y eso se acepta,
   pero fallar en LO BÁSICO le quita valor a la propuesta.

   Los 103 tests de analysis.test.js cubren casos finos —contracciones, pasivas,
   condicionales, subordinadas— y ninguno cubría «sujeto + verbo + lugar», que es
   la primera oración que alguien escribe en la app. Este archivo cubre eso: el
   suelo, no el techo.

   Regla para agregar aquí: solo oraciones que un profesor calificaría de
   INDISCUTIBLES. Si hay que pensarlo, va en analysis.test.js con su explicación,
   no aquí. Lo de aquí tiene que poder romperse solo si la app está mal.
   ============================================================================ */
import { describe, it, expect } from 'vitest';
import { analyzeStructure, tokenizeText } from './analysis';
/* La lista compartida, para comprobar que llega y no viene vacía. */
import { PHRASAL_VERB_LIST, PREP_PARTICLES } from './phrasal.generated.js';

/* S/V/C de la oración, en una cadena legible. */
const svc = (s) => {
  const out = [];
  for (const sen of analyzeStructure(s)) for (const row of (sen.rows || []))
    for (const c of (row.components || [])) out.push(`${c.type}:${c.text}`);
  return out.join(' | ');
};
const verbo = (s) => {
  const m = svc(s).match(/V:([^|]*)/);
  return m ? m[1].trim().replace(/[.?!]$/, '') : null;
};
const posDe = (s, palabra) => {
  const t = tokenizeText(s).find(x => x.text.toLowerCase() === palabra);
  return t ? t.pos : null;
};

describe('el verbo no se traga la preposición', () => {
  /* EL FALLO DE CLASE. Compromise trae su propio diccionario de phrasal verbs y
     ahí están `work in` y `sleep in`, que existen («incorporar algo», «dormir
     hasta tarde»), así que etiquetaba el `in` como partícula del verbo aunque
     fuera claramente un lugar. Manda NUESTRA lista, que es la del libro. */
  const casos = [
    ['She works in Santiago.', 'works'],
    ['She sleeps in Santiago.', 'sleeps'],
    ['He lives in Chile.', 'lives'],
    ['They work in Valparaíso.', 'work'],
    ['I study in the library.', 'study'],
    ['She works in a bank.', 'works'],
    ['We live in an apartment.', 'live'],
    ['He arrives at eight.', 'arrives'],
    ['She travels to Peru.', 'travels'],
    ['They wait for the bus.', 'wait'],
  ];
  for (const [oracion, v] of casos) {
    it(oracion, () => expect(verbo(oracion)).toBe(v));
  }
  it('y la preposición queda pintada como preposición, no como verbo', () => {
    expect(posDe('She works in Santiago.', 'in')).toBe('preposition');
    expect(posDe('She sleeps in Santiago.', 'in')).toBe('preposition');
  });
});

describe('sujeto, verbo y complemento en la oración más simple', () => {
  /* Ninguna de estas tiene nada que discutir, y por eso están aquí. */
  const casos = [
    ['She works.', 'She', 'works'],
    ['I study English.', 'I', 'study'],
    ['They play football.', 'They', 'play'],
    ['He reads the newspaper.', 'He', 'reads'],
    ['We cook dinner.', 'We', 'cook'],
    ['My brother drives a car.', 'My brother', 'drives'],
    ['The students finished the exam.', 'The students', 'finished'],
  ];
  for (const [oracion, s, v] of casos) {
    it(oracion, () => {
      const r = svc(oracion);
      expect(r).toContain(`S:${s}`);
      expect(verbo(oracion)).toBe(v);
    });
  }
});

describe('el auxiliar va aparte del verbo, y entero', () => {
  /* La app separa AUX de V A PROPÓSITO: el auxiliar es una pieza distinta, que
     es justo lo que enseña la suite. Lo que se comprueba aquí es que el
     auxiliar salga COMPLETO («has been») y que el verbo principal no se lo
     coma ni al revés. */
  const casos = [
    ['She is working.', 'is', 'working'],
    ['They are studying at home.', 'are', 'studying'],
    ['I have finished.', 'have', 'finished'],
    ['She has been working.', 'has been', 'working'],
    ['He was reading a book.', 'was', 'reading'],
    ['We will travel to Peru.', 'will', 'travel'],
    ['She had left.', 'had', 'left'],
  ];
  for (const [oracion, aux, v] of casos) {
    it(oracion, () => {
      expect(svc(oracion)).toContain(`AUX:${aux}`);
      expect(verbo(oracion)).toBe(v);
    });
  }
});

describe('los phrasal verbs del libro NO se rompen', () => {
  /* La contracara del arreglo: al quitarle al verbo las preposiciones que no le
     tocaban, lo fácil es pasarse y romper los phrasal de verdad. Estos salen de
     PHRASAL_VERB_LIST, que es la lista del curso. */
  const casos = [
    ['She turned off the light.', 'turned off'],
    ['We ran into a problem.', 'ran into'],
    ['I get up at seven.', 'get up'],
    ['She gets on the bus.', 'gets on'],
    ['She looks after the kids.', 'looks after'],
    /* Estos tres los reconoce el LIBRO y no compromise, así que el sintagma
       verbal se quedaba sin la partícula mientras la palabra sí se pintaba de
       verbo: la app se contradecía según qué vista mirara el alumno. */
    ['He looks at the board.', 'looks at'],
    ['She listens to music.', 'listens to'],
    ['I look for my keys.', 'look for'],
  ];
  for (const [oracion, v] of casos) {
    it(oracion, () => expect(verbo(oracion)).toBe(v));
  }
  it('la vista de palabras y la de estructura dicen LO MISMO', () => {
    /* La contradicción es tan grave como el error: si `at` se pinta de verbo,
       tiene que estar dentro del verbo, y si no, no. */
    for (const [oracion, palabra] of [['He looks at the board.', 'at'],
                                      ['She listens to music.', 'to'],
                                      ['We go on holiday.', 'on'],
                                      ['She works in Santiago.', 'in']]) {
      const enElVerbo = new RegExp(`\\b${palabra}\\b`).test(verbo(oracion) || '');
      const pintadaVerbo = posDe(oracion, palabra) === 'verb';
      expect(`${oracion} ${enElVerbo}`).toBe(`${oracion} ${pintadaVerbo}`);
    }
  });
  it('la partícula pura sigue siendo del verbo aunque no esté en la lista', () => {
    /* «show up» no está en la lista del libro, pero `up` NO es preposición:
       llamarla preposición sería cambiar un error por otro peor. */
    expect(posDe('He showed up late.', 'up')).toBe('verb');
  });
});

describe('el adverbial de tiempo no es parte del verbo', () => {
  const casos = [
    ['She came in the morning.', 'came'],
    ['We go on holiday.', 'go'],
    ['He works on Mondays.', 'works'],
    ['They arrived in 2020.', 'arrived'],
  ];
  for (const [oracion, v] of casos) {
    it(oracion, () => expect(verbo(oracion)).toBe(v));
  }
});

describe('la negación y la pregunta básicas', () => {
  it('She does not work in Santiago.', () => {
    expect(verbo('She does not work in Santiago.')).toContain('work');
    expect(posDe('She does not work in Santiago.', 'in')).toBe('preposition');
  });
  it('Does she work in Santiago?', () => {
    expect(posDe('Does she work in Santiago?', 'in')).toBe('preposition');
  });
  it('Where does she work?', () => {
    expect(verbo('Where does she work?')).toContain('work');
  });
});

/* ── Los frasales vienen de una lista COMPARTIDA ────────────────────────────
   Esta lista vivía solo aquí. Question Lab no tenía ninguna, así que «get up»
   salía bien en esta app y partido en la otra: el profesor lo encontró en clase
   y dijo «pensé que habíamos solucionado el problema». Lo estaba, en una sola
   app. Ahora la fuente es Grammar HUB/phrasal-verbs.json y la consumen las dos;
   estas pruebas fijan que consumirla desde fuera no cambió nada. */
describe('verbos frasales desde la lista compartida', () => {
  const bloques = (frase) => analyzeStructure(frase, 'C1')
    .flatMap(s => (s.rows || [{ components: s.components }])
      .flatMap(r => (r.components || []).map(c => `${c.text}=${c.type}`)))
    .join(' | ');

  it('la partícula va con el verbo', () => {
    expect(bloques('I get up during the week.')).toMatch(/get up=V/);
    expect(bloques('She looks for her keys.')).toMatch(/looks for=V/);
    expect(bloques('They turn off the light.')).toMatch(/turn off=V/);
  });

  it('la partícula ambigua delante de un adverbial NO se absorbe', () => {
    // «on» es partícula en «go on», pero aquí encabeza un adverbial de tiempo.
    // Es la mitad difícil de la regla y la que hay que proteger al tocar la lista.
    expect(bloques('They go on holiday in summer.')).not.toMatch(/go on=V/);
    expect(bloques('She came in the morning.')).not.toMatch(/came in=V/);
  });

  it('la lista llega entera desde el archivo generado', () => {
    // Si el sync no corrió o el import se rompió, la lista queda vacía y los
    // frasales dejan de detectarse EN SILENCIO: la app sigue analizando, solo
    // que peor. Ese es el modo de fallo que hay que cazar aquí.
    expect(PHRASAL_VERB_LIST.length).toBeGreaterThan(30);
    expect(PHRASAL_VERB_LIST.some(e => e[0] === 'get' && e[1] === 'up')).toBe(true);
    expect(PREP_PARTICLES.has('on')).toBe(true);
    expect(PREP_PARTICLES.has('up')).toBe(false);   // `up` no es ambigua
  });
});
