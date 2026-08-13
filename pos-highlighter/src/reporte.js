/* ============================================================================
   Desgramatizador · las etiquetas del reporte
   ----------------------------------------------------------------------------
   Convierten lo que la app entendió en una línea de texto que quepa en un
   correo. Viven aquí y no dentro del componente por una razón concreta: el
   reporte SALÍA SIN ETIQUETAS y nadie se enteró.

   El fallo: el reporte solo sabía leer `tokens`, que se llena únicamente en la
   vista de CATEGORÍAS, y la vista por defecto de la app es la de ESTRUCTURA. En
   el caso normal, entonces, el correo llegaba con la oración y sin una sola
   etiqueta — justo el dato que hace falta para entender de qué se queja quien
   reporta. Un reporte incompleto no da error: se ve igual que uno bueno hasta
   que lo necesitas.

   Fuera del componente se pueden probar, que es la única forma de que no vuelva
   a pasar en silencio.
   ============================================================================ */

/* Categorías: `palabra=sustantivo`. La puntuación se cae — no es una palabra y
   solo alarga la línea. */
export function etiquetasPos(lista) {
  if (!lista || !lista.length) return null;
  const txt = lista.filter(tk => !tk.isPunct).map(tk => `${tk.text}=${tk.pos || '?'}`).join(' ');
  return txt || null;
}

/* Estructura: `palabras=bloque`, separados por «·» porque un bloque puede tener
   varias palabras y con espacios no se vería dónde acaba uno.
   Dos casos que no son obvios y que salen de cómo `analyzeStructure` devuelve
   las oraciones:
     · las filas pueden venir en `rows` o, en las oraciones simples, sueltas en
       `components`. Leer solo una de las dos deja media salida fuera.
     · el sujeto TÁCITO no tiene palabra en pantalla, así que se marca en vez de
       fingir que hay texto. */
export function etiquetasEstructura(data) {
  if (!data || !data.length) return null;
  const partes = [];
  for (const s of data) {
    const filas = s.rows || (s.components ? [{ components: s.components }] : []);
    for (const fila of filas) {
      if (fila.isConjunction) { partes.push(`${fila.text}=conjunción`); continue; }
      for (const c of (fila.components || [])) {
        partes.push(`${c.text}=${c.type}${c.implied ? ' (tácito)' : ''}`);
      }
    }
  }
  return partes.length ? partes.join(' · ') : null;
}
