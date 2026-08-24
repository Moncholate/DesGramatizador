/* ============================================================================
   CONTRASTE DE LO QUE SE VE · Desgramatizador
   Uso:  npm run check-contraste
   ----------------------------------------------------------------------------
   El motor vive en design-tokens y llega generado: mide cada elemento con texto
   propio contra el fondo que REALMENTE tiene, componiendo translúcidos y
   subiendo por el árbol hasta el primer opaco. Es el punto ciego que dejan
   `check-contraste-tw` (solo mide pares dentro de un mismo className) y
   `check-dark` (solo comprueba cobertura de fondos). Su cabecera cuenta el
   porqué largo y los fallos reales que encontró en Grammaster.

   Aquí va lo único que es de esta app: cómo llegar a la pantalla que vale la
   pena auditar, y qué fallos se decidieron dejar.

   Necesita Playwright, y a propósito NO está en package.json — el despliegue
   corre `npm ci` y se bajaría los navegadores en cada build:

       npm i -D playwright && npx playwright install chromium
   ============================================================================ */
import { correr } from './contraste-render.generated.mjs';

correr({
  nombre: 'DESGRAMATIZADOR',
  puerto: 5188,

  /* Sin analizar una oración, la pantalla es un campo vacío y no hay nada que
     medir: todo el color de esta app está en las palabras etiquetadas y en las
     filas de estructura. Se pide «Mostrar Ambos» porque estructura y POS pintan
     cosas distintas —bloques S/V/C por un lado, categorías por palabra por
     otro— y auditar solo una mitad dejaría la otra sin mirar.

     La oración lleva sujeto compuesto, adverbio de frecuencia y complemento
     para que salgan cuantos más roles mejor de una sola pasada. */
  conducir: async (page) => {
    await page.getByPlaceholder(/Escribe o pega texto/).fill('My sister always works in a hospital.');
    const ambos = page.locator('button:has-text("Mostrar Ambos")').first();
    if (await ambos.count()) { await ambos.click(); await page.waitForTimeout(200); }
    await page.getByRole('button', { name: 'Analizar' }).click();
    await page.waitForTimeout(900);
  },

  /* Las cuatro pestañas, no solo Análisis. Auditar únicamente donde quedó
     `conducir` daba un verde que valía para un cuarto de la app: había 33
     elementos bajo AA escondidos aquí, y la mayor parte en la GUÍA, que es la
     pantalla donde el estudiante se aprende el código de colores. */
  pantallas: [
    { nombre: 'Análisis', ir: (page) => page.locator('nav button:has-text("Análisis")').first().click().then(() => page.waitForTimeout(500)) },
    { nombre: 'Guía',     ir: (page) => page.locator('nav button:has-text("Guía")').first().click().then(() => page.waitForTimeout(500)) },
    { nombre: 'Práctica', ir: (page) => page.locator('nav button:has-text("Práctica")').first().click().then(() => page.waitForTimeout(500)) },
    { nombre: 'Progreso', ir: (page) => page.locator('nav button:has-text("Progreso")').first().click().then(() => page.waitForTimeout(500)) },
  ],

  cambiarTema: async (page) => {
    await page.locator('button:has-text("Oscuro")').first().click();
    await page.waitForTimeout(600);
  },

  /* Un fallo que se decide no arreglar se anota aquí con su motivo, y entonces
     deja de contar. Mismo criterio que `check-dark.mjs`: exige una decisión
     humana UNA VEZ y la deja escrita. */
  revisados: [
    {
      txt: 'Conjunction',
      motivo: 'Categoría POS por encima del nivel elegido: la fila va bloqueada. ' +
              'WCAG 1.4.3 exime del contraste mínimo a los componentes de interfaz ' +
              'INACTIVOS, y este lo está de verdad (no es clicable, no recibe foco, ' +
              'no tiene rol). El estado no lo comunica solo el gris: la etiqueta se ' +
              'sustituye por un 🔒 y la fila entera va al 40% de opacidad, así que ' +
              'quien no distinga el gris igual ve que está cerrada. Oscurecerlo para ' +
              'que pase la medición lo dejaría con el mismo peso que una categoría ' +
              'abierta, que es justo lo contrario de lo que tiene que decir.',
    },
    {
      txt: 'Numeral',
      motivo: 'La otra categoría bloqueada en Básico/Elemental. Mismo motivo que «Conjunction».',
    },
  ],
});
