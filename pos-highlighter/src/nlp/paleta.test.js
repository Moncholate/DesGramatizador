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
    expect(bloques('I bought a book yesterday.')).toEqual(['S:I', 'V:bought', 'O:a book', 'C:yesterday']);
    expect(bloques('He plays football every day.')).toEqual(['S:He', 'V:plays', 'O:football', 'C:every day']);
  });

  /* «here» es adverbial aunque compromise lo etiquete `Noun|Uncountable`, y
     un adjetivo suelto no es un sintagma nominal. */
  it('lo que no es sintagma nominal no se vuelve objeto', () => {
    expect(bloques('She works here.')).toEqual(['S:She', 'V:works', 'C:here']);
    // El auxiliar va en su propio bloque: esta vista es la de la app, con markAuxiliaries.
    expect(bloques('She should have called earlier.')).toEqual(['S:She', 'AUX:should have', 'V:called', 'C:earlier']);
  });

  it('la copulativa sigue llevando complemento, no objeto', () => {
    expect(bloques('The cat is on the table.')).toEqual(['S:The cat', 'V:is', 'C:on the table']);
  });
});
