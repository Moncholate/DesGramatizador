import { describe, it, expect } from 'vitest';
import { tokenizeText, analyzeStructure } from './nlp/analysis';
import { etiquetasPos, etiquetasEstructura } from './reporte';

/* El reporte llegaba con la oración y SIN UNA SOLA ETIQUETA. La causa: solo
   sabía leer `tokens`, que únicamente se llena en la vista de categorías,
   mientras que la vista por defecto de la app es la de estructura.

   Lo peligroso de este fallo es que no se ve: un reporte incompleto se lee
   igual que uno completo hasta que lo necesitas, y para entonces la oración que
   fallaba ya no está en pantalla. Por eso estas pruebas van contra la SALIDA
   REAL del analizador y no contra objetos inventados: lo que se comprueba es
   que las etiquetas salgan de verdad. */

const NIVEL = 'C1';

describe('las etiquetas del reporte', () => {
  it('las categorías salen palabra por palabra', () => {
    const linea = etiquetasPos(tokenizeText('She works in Santiago.', NIVEL));
    expect(linea).toBeTruthy();
    // La oración del fallo de clase: cada palabra con su categoría.
    expect(linea).toMatch(/She=/);
    expect(linea).toMatch(/works=/);
    expect(linea).toMatch(/Santiago=/);
  });

  it('la puntuación no ensucia la línea', () => {
    expect(etiquetasPos(tokenizeText('She works in Santiago.', NIVEL))).not.toMatch(/\.=/);
  });

  it('la estructura sale, que es la vista POR DEFECTO de la app', () => {
    // Este es el caso que llegaba vacío: el alumno abre la app, analiza, y lo
    // que ve es la estructura. Si esto devuelve null, el reporte vuelve a no
    // decir nada.
    const linea = etiquetasEstructura(analyzeStructure('She works in Santiago.', NIVEL));
    expect(linea).toBeTruthy();
    expect(linea).toMatch(/She=/);
    expect(linea).toMatch(/·/);           // más de un bloque
  });

  it('una oración con dos cláusulas no pierde la segunda', () => {
    // Las filas pueden venir en `rows` o sueltas en `components`; leer solo una
    // de las dos deja media salida fuera y nadie lo nota.
    const linea = etiquetasEstructura(analyzeStructure('She works in Santiago and he studies at home.', NIVEL));
    expect(linea).toMatch(/She=/);
    expect(linea).toMatch(/he=/);
  });

  it('una pregunta también se etiqueta', () => {
    const linea = etiquetasEstructura(analyzeStructure('Where do you live?', NIVEL));
    expect(linea).toBeTruthy();
    expect(linea).toMatch(/live=/);
  });

  it('sin datos devuelven null y no una cadena vacía', () => {
    // `null` hace que la línea entera desaparezca del reporte; una cadena vacía
    // dejaría «La app leyó: » aparentando información que no está.
    for (const vacio of [null, undefined, []]) {
      expect(etiquetasPos(vacio)).toBeNull();
      expect(etiquetasEstructura(vacio)).toBeNull();
    }
  });

  it('ninguna etiqueta sale como «undefined»', () => {
    // Un `undefined` impreso en el correo es ruido que se lee como si la app
    // hubiera fallado, cuando lo que falló es el reporte.
    for (const frase of ['She works in Santiago.', 'Where do you live?', 'I have been waiting.']) {
      expect(etiquetasPos(tokenizeText(frase, NIVEL)) || '').not.toMatch(/undefined/);
      expect(etiquetasEstructura(analyzeStructure(frase, NIVEL)) || '').not.toMatch(/undefined/);
    }
  });
});
