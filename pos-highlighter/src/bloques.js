/* ============================================================================
   LOS BLOQUES QUE EL ALUMNO PUEDE PINTAR, por nivel
   ----------------------------------------------------------------------------
   Vive fuera de App.jsx por dos motivos. El primero es que estaba copiado en
   CUATRO sitios —la paleta, la leyenda, la barra de móvil y el ciclo del toque—
   y basta con que una copia se desfase para que el ejercicio pida un color que
   no está en la caja. El segundo es que así se puede cruzar con lo que el
   analizador contesta, que es justo la prueba que faltaba (`paleta.test.js`).

   POR QUÉ C ESTÁ EN INTERMEDIO (28-ago-2026). No estaba, y el analizador sí
   etiquetaba C: las copulativas («The cat is on the table») y los adverbiales
   de lugar y tiempo son complemento también en ese nivel. O sea que la clave de
   respuesta pedía una etiqueta que el alumno no podía elegir — en un párrafo de
   ocho oraciones, 22 de 41 palabras eran imposibles de acertar.

   La otra mitad del arreglo va en el analizador: los objetos ahora salen O y no
   C, que es lo que ese nivel viene a enseñar. Las dos mitades juntas o ninguna:
   con solo esta, el alumno vería «a book» como complemento; con solo la otra,
   las copulativas seguirían sin poder responderse.
   ========================================================================== */

export const BLOQUES_BASICO = ['WH', 'S', 'AUX', 'V', 'A', 'C'];
export const BLOQUES_INTERMEDIO = ['WH', 'S', 'AUX', 'V', 'O', 'A', 'C'];

/** Los bloques del nivel. Básico y Elemental no distinguen objeto: S / V / C. */
export const bloquesDe = (level) =>
  (level === 'Básico' || level === 'Elemental') ? BLOQUES_BASICO : BLOQUES_INTERMEDIO;
