/* AUTO-GENERATED from design-tokens/contraste-render.mjs — do not edit.
   Regenerate: npm run sync (from Apps/design-tokens). */
/* ============================================================================
   Grammar Hub · auditor de contraste RENDERIZADO
   ----------------------------------------------------------------------------
   Motor compartido. No sabe conducir ninguna app: cada una le pasa su guion.
   Se distribuye con `sync.mjs` como `contraste-render.generated.mjs`.

   POR QUÉ EXISTE, teniendo ya dos chequeos de contraste aquí mismo.

   `check-contraste-tw.mjs` mide pares de clases dentro de un mismo `className`,
   y lo dice en su cabecera: NO infiere el fondo del padre. `check-dark.mjs`
   comprueba cobertura de fondos, que es otra cosa todavía. Entre los dos queda
   un punto ciego enorme: el texto cuyo fondo lo pone un ANCESTRO, que en estas
   apps es prácticamente todo — la tarjeta envuelve el panel entero.

   Ahí vivían TODOS los fallos que se arreglaron en agosto de 2026, ninguno
   visible para un analizador de clases:

     el botón «Ver los 3 modos»           2,81:1   índigo sobre la tarjeta
     los colores de rol en oscuro         2,73:1   el VERBO, el peor sitio posible
     la fórmula del tiempo en oscuro      2,04:1   el texto que enseña la estructura
     «(Opcional)», pistas, barra inferior 2,54:1   el mismo gris en siete sitios

   Este arranca la app de verdad, recorre cada elemento con texto propio y mide
   su color contra el fondo que REALMENTE tiene: compone los translúcidos y sube
   por el árbol hasta el primer fondo opaco. Aplica el umbral que toca —4,5:1, o
   3:1 si el texto es grande— leyendo el tamaño y el peso ya calculados por el
   navegador, no adivinándolos de las clases.

   ── Por qué el motor está aquí y no copiado en cada app ────────────────────
   Porque copiarlo daría tres implementaciones de la misma regla, que es la
   lección que este repositorio lleva escrita en varios sitios (phrasal-verbs,
   spelling-engine, gamification-engine). Lo que cambia entre apps es CÓMO se
   llega a la pantalla que vale la pena auditar, y eso es lo único que cada una
   aporta.
   ============================================================================ */
import { spawn } from 'node:child_process';

/* ── El auditor, que corre DENTRO del navegador ───────────────────────────── */
export const AUDITOR = () => {
  const lum = (r, g, b) => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  /* Resolver el color lo hace el NAVEGADOR, pintando un píxel y leyéndolo. Sacar
     los números del string a mano funcionaba mientras todo fuera `rgb()`, y se
     rompió en cuanto se auditó una app con Tailwind 4: ahí los colores llegan en
     `oklch(...)` y el parser ingenuo leía «0.869, 0.022, 252.894» como si
     fueran canales sRGB, inventando ratios. Esto entiende cualquier sintaxis que
     entienda el navegador, presente y futura. */
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = 1;
  const ctx = lienzo.getContext('2d', { willReadFrequently: true });
  const parse = (s) => {
    if (!s || s === 'transparent') return null;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = s;                       // si no la entiende, se queda en negro
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };

  /* Un degradado NO tiene `backgroundColor`: la pinta `background-image`, así
     que la propiedad de color sale transparente. El auditor se saltaba esa capa
     y seguía subiendo, y acababa midiendo contra un fondo que el usuario no ve
     en ningún momento. Costó dos falsos positivos seguidos en la tarjeta de
     racha de Desgramatizador —texto rojo muy oscuro sobre un degradado ROSA
     BRILLANTE, o sea perfectamente legible— que el auditor daba en 1,19:1
     porque medía contra la página.
     Se sacan las paradas del degradado y luego se mide contra TODAS: un texto
     encima de un degradado tiene que leerse en todo su recorrido, así que el
     ratio bueno es el PEOR de sus paradas. Es aproximado (ignora el punto medio
     de la interpolación) pero es conservador, que es como tiene que fallar una
     herramienta de accesibilidad. */
  const paradasDe = (bi) => {
    if (!bi || bi === 'none') return [];
    const m = bi.match(/rgba?\([^)]*\)|oklch\([^)]*\)|oklab\([^)]*\)|color\([^)]*\)|#[0-9a-fA-F]{3,8}/g) || [];
    return m.map(parse).filter(c => c && (c[3] ?? 1) > 0);
  };

  /* Compone las capas translúcidas acumuladas sobre una base opaca. */
  const componer = (capas, base) => {
    let out = base.slice(0, 3);
    for (let i = capas.length - 1; i >= 0; i--) {
      const c = capas[i], a = c[3] ?? 1;
      out = [0, 1, 2].map(k => Math.round(c[k] * a + out[k] * (1 - a)));
    }
    return out;
  };

  /* Los fondos EFECTIVOS: sube por el árbol hasta el primer fondo opaco (o el
     primer degradado) y compone los translúcidos del camino. Devuelve una LISTA
     porque un degradado da varios candidatos; lo normal es que traiga uno solo.
     Suponer blanco —o el fondo del padre inmediato— daba ratios inventados en
     cadena. */
  const fondos = (el) => {
    const capas = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      const c = parse(cs.backgroundColor);
      if (c && (c[3] ?? 1) >= 1) return [componer(capas, c)];
      const paradas = paradasDe(cs.backgroundImage);
      if (paradas.length) return paradas.map(p => componer(capas, p));
      if (c && (c[3] ?? 1) > 0) capas.push(c);
    }
    return [componer(capas, [255, 255, 255])];
  };

  const out = [];
  for (const el of document.querySelectorAll('*')) {
    // Solo el texto PROPIO del elemento: contando el heredado, cada contenedor
    // repetiría el fallo de sus hijos y la lista sería ilegible.
    const txt = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    if (!txt) continue;

    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (el.closest('.sr-only')) continue;

    /* Un elemento cuyo texto es SOLO emoji no se audita: el emoji trae sus
       propios colores y la propiedad `color` no lo alcanza. Los símbolos que no
       son emoji («*», «●») SÍ se auditan: esos sí los pinta el CSS. */
    if (!txt.replace(/\p{Extended_Pictographic}|[️‍\s]/gu, '')) continue;

    const fg = parse(cs.color);
    if (!fg || (fg[3] ?? 1) === 0) continue;
    // Contra un degradado hay varios fondos posibles: se guarda el PEOR, que es
    // el que decide si el texto se lee en todo el recorrido.
    const l1 = lum(...fg.slice(0, 3));
    let ratio = Infinity, bg = null;
    for (const cand of fondos(el)) {
      const l2 = lum(...cand);
      const r = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      if (r < ratio) { ratio = r; bg = cand; }
    }

    const px = parseFloat(cs.fontSize), peso = parseInt(cs.fontWeight) || 400;
    const grande = px >= 24 || (px >= 18.66 && peso >= 700);
    const umbral = grande ? 3 : 4.5;
    if (ratio >= umbral) continue;

    out.push({
      txt: txt.slice(0, 40), ratio: +ratio.toFixed(2), umbral,
      px: Math.round(px), peso,
      fg: 'rgb(' + fg.slice(0, 3).join(',') + ')', bg: 'rgb(' + bg.join(',') + ')',
    });
  }
  return out;
};

/* ── El arnés ─────────────────────────────────────────────────────────────────
   `conducir(page)`    deja la app en el estado que hace falta para auditar
                       (escribir, analizar, abrir un panel…). Corre UNA vez.
   `pantallas`         [{ nombre, ir(page) }] — las vistas que hay que recorrer
                       en CADA tema. Si no se pasa, se audita solo donde dejó
                       `conducir`, que es como se comportaba antes.
   `cambiarTema(page)` la pone en oscuro. Cada app tiene su propio conmutador.
   `revisados`         excepciones decididas: { txt, motivo }. Se comparan por
                       inclusión para no depender de la traducción exacta.

   POR QUÉ `pantallas` y no una sola vista: auditar donde quedó `conducir`
   daba un verde que solo valía para esa pantalla. Desgramatizador salía
   «CONTRASTE OK» con 33 elementos bajo AA esperando en Guía y Práctica —
   incluida la Guía, que es justo donde el estudiante va a aprenderse el código
   de colores. Un chequeo que aprueba mirando un cuarto de la app es peor que
   no tenerlo, porque además da permiso para no mirar.
   -------------------------------------------------------------------------- */
export async function correr({ nombre, puerto, conducir, pantallas, cambiarTema, revisados = [], viewport }) {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error('\n  Falta Playwright. Esta sonda arranca la app de verdad, así que lo necesita:\n');
    console.error('      npm i -D playwright && npx playwright install chromium\n');
    console.error('  No está en package.json a propósito: `npm ci` corre en el despliegue');
    console.error('  y se bajaría los navegadores en cada build.\n');
    process.exit(1);
  }

  const url = `http://localhost:${puerto}`;
  /* Por `npx` y con `shell:true`: resolver el binario de vite a mano falla
     porque su package.json no exporta `./bin/vite.js`, y la ruta de
     `node_modules/.bin` cambia de nombre entre Windows y Linux.
     `--strictPort` para que no se mude en silencio a otro puerto si el elegido
     está ocupado — pasó, y la sonda acabó auditando OTRA app. */
  const vite = spawn('npx', ['vite', '--port', String(puerto), '--strictPort'],
    { cwd: process.cwd(), stdio: 'ignore', shell: true });
  const cerrar = () => { try { vite.kill(); } catch {} };
  process.on('exit', cerrar);
  process.on('SIGINT', () => { cerrar(); process.exit(130); });

  let vivo = false;
  for (let i = 0; i < 60 && !vivo; i++) {
    try { vivo = (await fetch(url)).ok; } catch {}
    if (!vivo) await new Promise(r => setTimeout(r, 500));
  }
  if (!vivo) { console.error(`  El servidor de desarrollo no levantó en ${url}`); cerrar(); process.exit(1); }

  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: viewport || { width: 1100, height: 1050 } })).newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await conducir(page);

  console.log(`\n${nombre} · contraste de lo que se ve`);
  const perdonar = (f) => revisados.find(r => f.txt.includes(r.txt));
  let fallos = 0, perdonados = 0;

  // Sin `pantallas`, una sola vista implícita: la que dejó `conducir`.
  const vistas = (pantallas && pantallas.length) ? pantallas : [{ nombre: null, ir: null }];

  for (const tema of ['claro', 'oscuro']) {
    if (tema === 'oscuro') await cambiarTema(page);
    console.log(`\n── modo ${tema} ──`);
    let enTema = 0;

    for (const vista of vistas) {
      if (vista.ir) await vista.ir(page);
      const hallados = await page.evaluate(AUDITOR);
      const nuevos = hallados.filter(f => !perdonar(f));
      perdonados += hallados.length - nuevos.length;
      if (!nuevos.length) continue;

      enTema += nuevos.length;
      if (vista.nombre) console.log(`   · ${vista.nombre}`);
      for (const f of nuevos.sort((a, b) => a.ratio - b.ratio)) {
        fallos++;
        console.log(`   ✗ ${String(f.ratio).padStart(5)}:1 (pide ${f.umbral})  ${f.px}px/${f.peso}  «${f.txt}»`);
        console.log(`       ${f.fg} sobre ${f.bg}`);
      }
    }
    if (!enTema) console.log('   ✓ ningún elemento bajo AA');
  }

  await browser.close();
  cerrar();
  if (perdonados) console.log(`\n   ${perdonados} perdonado(s) por estar en REVISADOS`);
  console.log(fallos ? `\n✗ ${fallos} elemento(s) bajo AA` : '\nCONTRASTE OK · lo que se ve, se lee');
  process.exit(fallos ? 1 : 0);
}
