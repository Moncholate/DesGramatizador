/* Verbo + segundo verbo (infinitivo o gerundio), y gerundio de sujeto.
   ---------------------------------------------------------------------------
   Salió de una revisión pedida por el profesor. Grammaster y Question Lab
   manejaban las tres estructuras bien; esta app tenía cuatro fallos, y el peor
   ni siquiera era de los que se estaban buscando.

   Todos comparten la misma raíz: compromise etiqueta POR POSICIÓN, así que en
   cuanto una palabra puede leerse como sustantivo o como verbo según sus
   vecinas, decide mal. Lo que cambia es dónde duele. */
import { describe, it, expect } from 'vitest';
import { analyzeStructure } from './analysis';

const partes = (t) =>
  (analyzeStructure(t)[0].rows?.[0]?.components || []).map(c => `${c.type}:${c.text}`);

describe('«The dog runs.» — el sujeto singular con determinante', () => {
  /* EL PEOR de los cuatro, y no lo buscaba nadie: la app devolvía CERO
     componentes y un «Could not parse sentence structure» en la cara del
     alumno. Compromise lee «the dog runs» como una frase nominal de tres piezas
     y etiqueta `runs` como Noun,Plural. */
  it('analiza lo que antes no daba nada', () => {
    expect(partes('The dog runs.')).toEqual(['S:The dog', 'V:runs']);
    expect(partes('The cat sleeps.')).toEqual(['S:The cat', 'V:sleeps']);
    expect(partes('The man works.')).toEqual(['S:The man', 'V:works']);
    expect(partes('A dog runs.')).toEqual(['S:A dog', 'V:runs']);
    expect(partes('My dog runs.')).toEqual(['S:My dog', 'V:runs']);
  });

  it('lo que ya funcionaba sigue igual', () => {
    expect(partes('The dog runs fast.')).toEqual(['S:The dog', 'V:runs', 'C:fast']);
    expect(partes('She runs.')).toEqual(['S:She', 'V:runs']);
    expect(partes('The dogs run.')).toEqual(['S:The dogs', 'V:run']);
  });

  /* La regla solo se intenta cuando no se encontró NINGÚN verbo, y exige que la
     palabra, sola y sin la -s, sea un verbo. Un fragmento nominal de verdad
     sigue sin analizarse, que es lo correcto. */
  it('un fragmento sin verbo sigue sin analizarse', () => {
    expect(partes('The dog and the cat.')).toEqual([]);
  });
});

describe('gerundio como SUJETO', () => {
  /* Fallaba cuando la forma en -s del verbo también es un sustantivo plural
     (`helps`, `causes`): compromise se quedaba con el -ing de delante como
     verbo y la oración perdía el sujeto. Con `takes` o `keeps` nunca falló, así
     que la diferencia no era la estructura sino el diccionario — por eso
     mirarlo a ojo con dos o tres ejemplos no lo habría encontrado. */
  it('el gerundio es el sujeto, no el verbo', () => {
    expect(partes('Reading helps you learn.')).toEqual(['S:Reading', 'V:helps', 'C:you learn']);
    expect(partes('Smoking causes cancer.')).toEqual(['S:Smoking', 'V:causes', 'C:cancer']);
    expect(partes('Dancing helps.')).toEqual(['S:Dancing', 'V:helps']);
  });

  /* «time» pasó de C a O el 28-ago, con el arreglo del objeto: es lo que toma
     «takes». Los otros dos no se mueven porque son copulativas —«is fun», «is
     difficult»— y ahí lo que sigue al verbo es complemento de verdad. */
  it('los que ya acertaban no cambian', () => {
    expect(partes('Cooking takes time.')).toEqual(['S:Cooking', 'V:takes', 'O:time']);
    expect(partes('Swimming is fun.')).toEqual(['S:Swimming', 'V:is', 'C:fun']);
    expect(partes('Learning English is difficult.')).toEqual(['S:Learning English', 'V:is', 'C:difficult']);
  });
});

describe('verbo + segundo verbo: la misma relación, el mismo análisis', () => {
  /* El infinitivo iba al complemento y el gerundio se lo tragaba el verbo. Dos
     análisis distintos para la misma relación, según la forma del segundo
     verbo. Question Lab ya hacía el correcto. */
  it('infinitivo y gerundio se analizan igual', () => {
    expect(partes('He likes to swim.')).toEqual(['S:He', 'V:likes', 'C:to swim']);
    expect(partes('He likes swimming.')).toEqual(['S:He', 'V:likes', 'C:swimming']);
    expect(partes('I want to travel.')).toEqual(['S:I', 'V:want', 'C:to travel']);
    expect(partes('I enjoy traveling.')).toEqual(['S:I', 'V:enjoy', 'C:traveling']);
  });

  it('con complemento propio detrás del gerundio', () => {
    expect(partes('I enjoy reading books.')).toEqual(['S:I', 'V:enjoy', 'C:reading books']);
    expect(partes('They started working.')).toEqual(['S:They', 'V:started', 'C:working']);
  });

  /* EL LÍMITE de la regla anterior, y lo que más importa de este archivo: si la
     cabeza es `be` o `have`, el -ing NO es complemento sino un tiempo continuo,
     y partirlo rompería media app. La negación se salta al buscar la cabeza —
     sin eso, «isn't swimming» leía «not» como cabeza y partía el continuo. */
  it('los tiempos continuos NO se parten', () => {
    expect(partes('She is swimming.')).toEqual(['S:She', 'AUX:is', 'V:swimming']);
    expect(partes('She has been working.')).toEqual(['S:She', 'AUX:has been', 'V:working']);
    expect(partes('He is going to travel.')).toEqual(['S:He', 'AUX:is going to', 'V:travel']);
    expect(partes("She isn't swimming.")).toEqual(['S:She', 'AUX:is not', 'V:swimming']);
    expect(partes('She will be working.')).toEqual(['S:She', 'AUX:will be', 'V:working']);
  });

  it('la negación con do-support parte donde toca', () => {
    expect(partes("She doesn't like swimming."))
      .toEqual(['S:She', 'AUX:does not', 'V:like', 'C:swimming']);
  });
});

describe('el punto final no es parte de ningún componente', () => {
  /* Se colaba por dos caminos distintos: cuando el verbo cerraba la oración
     (V:「works.」) y cuando el sujeto era un gerundio (C:「fun.」). Con sujeto
     pronombre no pasaba, así que el mismo bloque salía con puntuación o sin
     ella según qué llevara delante. */
  it('ni cuando el verbo cierra la oración', () => {
    for (const c of partes('She works.')) expect(c).not.toMatch(/[.!?]$/);
    for (const c of partes('They sleep.')) expect(c).not.toMatch(/[.!?]$/);
  });

  it('ni cuando el sujeto es un gerundio', () => {
    for (const c of partes('Swimming is fun.')) expect(c).not.toMatch(/[.!?]$/);
    for (const c of partes('Reading is important.')) expect(c).not.toMatch(/[.!?]$/);
  });
});
