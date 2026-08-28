/* ============================================================================
   LA CLAVE DE RESPUESTA Y LA CAJA DE COLORES TIENEN QUE COINCIDIR
   ----------------------------------------------------------------------------
   El fallo que motiva este archivo (28-ago-2026): en Intermedio, «Pintar la
   estructura» pedía como respuesta correcta la etiqueta C —«I bought a book» →
   C:a book— y C no estaba en la paleta de ese nivel. La calificación es
   igualdad estricta, así que esas palabras no se podían acertar de ninguna
   manera. En un párrafo de ocho oraciones eran 22 de 41: más de la mitad.

   Nadie lo vio porque las dos mitades viven lejos: la paleta en App.jsx y las
   etiquetas en el analizador. Ninguna prueba las cruzaba. Esta sí, y es barata:
   por cada nivel y cada oración, TODA respuesta que la app espera tiene que ser
   una etiqueta que el alumno pueda elegir.

   Si esto se pone en rojo, la pregunta no es «¿relajo la prueba?», sino cuál de
   los dos lados está mal: o al nivel le falta un bloque, o el analizador está
   etiquetando algo que ese nivel no enseña.
   ========================================================================== */
import { describe, it, expect } from 'vitest';
import { tokenizeText, analyzeStructure, buildStructureAnswerMap } from './analysis';
import { bloquesDe, BLOQUES_BASICO, BLOQUES_INTERMEDIO } from '../bloques';

const NIVELES = ['Básico', 'Elemental', 'Intermedio', 'Intermedio Alto'];

/* Oraciones del tipo que el alumno pega de verdad: objeto directo con y sin
   determinante, plural desnudo, ditransitiva, copulativa, adverbial delante y
   detrás, preposicional, relativa, pregunta y negativa. */
const CORPUS = [
  'I bought a book.',
  'She reads books.',
  'They watch TV.',
  'My sister eats an apple.',
  'He plays football every day.',
  'I bought a book yesterday.',
  'They watch TV in the evening.',
  'Maria studies English at university.',
  'He gave me a present.',
  'We went to the beach.',
  'The cat is on the table.',
  'She works here.',
  'I like coffee very much.',
  'Yesterday she worked here.',
  'She never eats meat.',
  'I know the man who called.',
  'The man who called is here.',
  'She should have called earlier.',
  'I have already finished my homework.',
  'They are playing football in the park.',
  'She does not like coffee.',
  'Do you speak English?',
  'Where does she work?',
  'Cooking takes time.',
  'Learning English is difficult.',
];

const respuestas = (frase, nivel) => {
  const tokens = tokenizeText(frase);
  const mapa = buildStructureAnswerMap(tokens, analyzeStructure(frase, nivel));
  return tokens.filter(t => !t.isPunct && mapa[t.id]).map(t => ({ palabra: t.text, etiqueta: mapa[t.id] }));
};

describe('paleta y clave de respuesta', () => {
  for (const nivel of NIVELES) {
    it(`en ${nivel} no hay respuesta que el alumno no pueda elegir`, () => {
      const paleta = bloquesDe(nivel);
      const imposibles = [];
      for (const frase of CORPUS) {
        for (const r of respuestas(frase, nivel)) {
          if (!paleta.includes(r.etiqueta)) imposibles.push(`${frase} → «${r.palabra}» pide ${r.etiqueta}`);
        }
      }
      expect(imposibles, imposibles.join('\n')).toEqual([]);
    });
  }

  /* La otra mitad: que la caja no tenga colores de adorno. Si un nivel ofrece
     un bloque que su analizador no produce nunca, el alumno lo va a usar y
     siempre se va a equivocar. */
  it('Intermedio usa de verdad O y C, que son los que lo distinguen de Básico', () => {
    const vistas = new Set();
    for (const frase of CORPUS) respuestas(frase, 'Intermedio').forEach(r => vistas.add(r.etiqueta));
    expect([...vistas].sort()).toContain('O');
    expect([...vistas].sort()).toContain('C');
  });

  it('Básico no reparte objetos: ahí todo lo que sigue al verbo es C', () => {
    const vistas = new Set();
    for (const frase of CORPUS) respuestas(frase, 'Básico').forEach(r => vistas.add(r.etiqueta));
    expect([...vistas]).not.toContain('O');
  });

  it('los dos niveles comparten la base y solo Intermedio añade O', () => {
    expect(BLOQUES_INTERMEDIO.filter(b => !BLOQUES_BASICO.includes(b))).toEqual(['O']);
    expect(BLOQUES_BASICO.every(b => BLOQUES_INTERMEDIO.includes(b))).toBe(true);
  });
});

describe('el objeto se reconoce, que es lo que Intermedio enseña', () => {
  const bloques = (frase) => analyzeStructure(frase, 'Intermedio')[0].rows
    .flatMap(r => r.components).map(c => `${c.type}:${c.text}`);

  it('objeto con determinante, sin él y en plural desnudo', () => {
    expect(bloques('I bought a book.')).toEqual(['S:I', 'V:bought', 'O:a book']);
    expect(bloques('I like coffee.')).toEqual(['S:I', 'V:like', 'O:coffee']);
    expect(bloques('She reads books.')).toEqual(['S:She', 'V:reads', 'O:books']);
  });

  /* El pronombre ya se reconocía; lo que se caía en C era el objeto directo
     de detrás. Los dos son objetos. */
  it('ditransitiva: los dos objetos son O', () => {
    expect(bloques('He gave me a present.')).toEqual(['S:He', 'V:gave', 'O:me', 'O:a present']);
  });

  it('el adverbial no se mete dentro del objeto', () => {
    expect(bloques('I bought a book yesterday.')).toEqual(['S:I', 'V:bought', 'O:a book', 'A:yesterday']);
    expect(bloques('He plays football every day.')).toEqual(['S:He', 'V:plays', 'O:football', 'C:every day']);
  });

  /* «here» es adverbial aunque compromise lo etiquete `Noun|Uncountable`, y
     un adjetivo suelto no es un sintagma nominal. */
  it('lo que no es sintagma nominal no se vuelve objeto', () => {
    expect(bloques('She works here.')).toEqual(['S:She', 'V:works', 'A:here']);
    // El auxiliar va en su propio bloque: esta vista es la de la app, con markAuxiliaries.
    expect(bloques('She should have called earlier.')).toEqual(['S:She', 'AUX:should have', 'V:called', 'C:earlier']);
  });

  it('la copulativa sigue llevando complemento, no objeto', () => {
    expect(bloques('The cat is on the table.')).toEqual(['S:The cat', 'V:is', 'C:on the table']);
  });
});

/* ============================================================================
   EL BLOQUE A, POR NIVEL
   ----------------------------------------------------------------------------
   Criterio del profesor (28-ago-2026):
     · En Básico solo se ve el adverbio de FRECUENCIA — el que va delante del
       verbo. Un «quickly» detrás se queda en el complemento, porque el alumno
       todavía no ha visto qué es un adverbio.
     · La formación y el uso de los adverbios entran en Elemental II, así que
       desde Elemental el adverbio suelto tiene su propio bloque.
     · Los adverbiales PREPOSICIONALES no se ven en ningún curso: «in the
       evening» se queda en C en todos los niveles, y la app tenía una rama que
       pretendía meterlos en A (nunca se ejecutó, por un patrón roto).
   ========================================================================== */
describe('el bloque A por nivel', () => {
  const bloquesEn = (frase, nivel) => analyzeStructure(frase, nivel)[0].rows
    .flatMap(r => r.components).map(c => `${c.type}:${c.text}`);

  it('la frecuencia es A en TODOS los niveles, también en Básico', () => {
    for (const nivel of NIVELES) {
      expect(bloquesEn('She always works here.', nivel), nivel).toContain('A:always');
    }
  });

  it('en Básico el adverbio suelto de detrás NO es A todavía', () => {
    expect(bloquesEn('She works quickly.', 'Básico')).toEqual(['S:She', 'V:works', 'C:quickly']);
    expect(bloquesEn('They arrived late.', 'Básico')).toEqual(['S:They', 'V:arrived', 'C:late']);
    expect(bloquesEn('She works here.', 'Básico')).toEqual(['S:She', 'V:works', 'C:here']);
  });

  it('desde Elemental sí, que es donde se ven', () => {
    for (const nivel of ['Elemental', 'Intermedio', 'Intermedio Alto']) {
      expect(bloquesEn('She works quickly.', nivel), nivel).toEqual(['S:She', 'V:works', 'A:quickly']);
      expect(bloquesEn('They arrived late.', nivel), nivel).toEqual(['S:They', 'V:arrived', 'A:late']);
    }
  });

  it('el mismo adverbio vale igual delante que detrás', () => {
    // Antes «Yesterday she worked» llevaba C y «She never works» A.
    expect(bloquesEn('Yesterday she worked here.', 'Intermedio'))
      .toEqual(['A:Yesterday', 'S:she', 'V:worked', 'A:here']);
  });

  /* En Básico todo lo que sigue al verbo va en UN solo bloque C, así que no se
     puede pedir el bloque «C:in the evening» exacto: lo que se exige es que la
     frase preposicional viva dentro de un complemento y nunca en un A. */
  it('las frases preposicionales NO son A en ningún nivel', () => {
    const casos = [
      ['They watch TV in the evening.', 'in the evening'],
      ['We study at home.', 'at home'],
      ['The cat is on the table.', 'on the table'],
    ];
    for (const nivel of NIVELES) {
      for (const [frase, trozo] of casos) {
        const bloques = bloquesEn(frase, nivel);
        const donde = `${nivel} · ${frase}`;
        expect(bloques.filter(b => b.startsWith('A:') && b.includes(trozo.split(' ')[0])), donde).toEqual([]);
        expect(bloques.some(b => b.startsWith('C:') && b.includes(trozo)), donde).toBe(true);
      }
    }
  });

  it('una palabra, no dos: «every day» se queda en el complemento', () => {
    expect(bloquesEn('He plays football every day.', 'Intermedio'))
      .toEqual(['S:He', 'V:plays', 'O:football', 'C:every day']);
  });
});
