/* AUTO-GENERATED from Grammar HUB/gamification-engine.js + gamification.json — do not edit.
   Regenerate: node scripts/sync-gamification.mjs (from Grammar HUB). */
/* ============================================================================
   Grammar Hub · motor de progreso (gamificación)
   ----------------------------------------------------------------------------
   Lógica PURA y neutral al framework sobre la forma `gh_progress` definida en
   gamification.json. Se distribuye a cada app (vanilla o React la importan).
   No toca el DOM: recibe un `storage` (localStorage) y los defs de insignias.
   ============================================================================ */
export const SHARED_KEY = 'gh_progress';
export const SCHEMA_V = 1;

/* Fecha LOCAL, no UTC. Con `toISOString()` el día cambiaba a medianoche de
   Greenwich, o sea a las 20:00 en Chile, y la racha dejaba de contar el día del
   alumno. Dos fallas reales, las dos sobre el que estudia de noche:
     · practicar lunes 18:00 y lunes 22:00 → el motor veía DOS días (racha inflada)
     · practicar domingo 22:00 y lunes 18:00 → veía UN día, y la racha no avanzaba
       aunque el alumno sí había practicado dos días seguidos.
   `dayGap` no cambia: compara dos strings del mismo formato, así que la resta
   sigue dando días completos. */
const todayISO = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const dayGap = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

export function emptyProgress() {
  return {
    v: SCHEMA_V,
    dayStreak: { count: 0, best: 0, lastDay: null },
    practiceDays: [],
    totalCorrect: 0,
    bestAnswerStreak: 0,
    sentencesAnalyzed: 0,       // Desgramatizador
    tenses: {},                 // { [tenseId]: { attempts, correct, days: [ISO] } }
    appsUsed: {},               // { grammaster:true, ... }
    badges: {}                  // { [badgeId]: unlockedISO }  (perTense → `${id}:${tenseId}`)
  };
}

export function loadProgress(storage) {
  try {
    const raw = storage && storage.getItem(SHARED_KEY);
    if (!raw) return emptyProgress();
    const p = JSON.parse(raw);
    if (!p || p.v !== SCHEMA_V) return emptyProgress();   // schema bumped → start clean
    return { ...emptyProgress(), ...p };
  } catch (e) { return emptyProgress(); }
}

export function saveProgress(storage, p) {
  try { storage && storage.setItem(SHARED_KEY, JSON.stringify(p)); } catch (e) {}
}

/* Registra UN intento de práctica calificado. Muta y devuelve `p`.
   `answerStreak` (opcional) = racha de aciertos actual de la actividad local. */
/* Marca "practiqué hoy" y actualiza la racha de días. Devuelve la fecha de hoy. */
function markDay(p) {
  const today = todayISO();
  if (p.dayStreak.lastDay !== today) {
    const gap = p.dayStreak.lastDay ? dayGap(p.dayStreak.lastDay, today) : null;
    p.dayStreak.count = gap === 1 ? p.dayStreak.count + 1 : 1;
    p.dayStreak.lastDay = today;
    p.dayStreak.best = Math.max(p.dayStreak.best, p.dayStreak.count);
    if (!p.practiceDays.includes(today)) p.practiceDays.push(today);
  }
  return today;
}

export function recordAttempt(p, { app, tenseId, correct, answerStreak } = {}) {
  if (app) p.appsUsed[app] = true;
  const today = markDay(p);

  if (correct) p.totalCorrect += 1;
  if (typeof answerStreak === 'number') p.bestAnswerStreak = Math.max(p.bestAnswerStreak, answerStreak);

  if (tenseId) {
    const t = p.tenses[tenseId] || (p.tenses[tenseId] = { attempts: 0, correct: 0, days: [] });
    t.attempts += 1;
    if (correct) t.correct += 1;
    if (!t.days.includes(today)) t.days.push(today);
  }
  return p;
}

/* Registra UN análisis de oración (Desgramatizador): cuenta para racha de días,
   apps usadas y el contador de oraciones analizadas. */
export function recordAnalysis(p, { app } = {}) {
  if (app) p.appsUsed[app] = true;
  markDay(p);
  p.sentencesAnalyzed = (p.sentencesAnalyzed || 0) + 1;
  return p;
}

function meets(p, criteria, tenseId) {
  const c = criteria;
  switch (c.type) {
    case 'dayStreak':        return p.dayStreak.count >= c.gte || p.dayStreak.best >= c.gte;
    case 'totalCorrect':     return p.totalCorrect >= c.gte;
    case 'bestAnswerStreak': return p.bestAnswerStreak >= c.gte;
    case 'appsUsed':         return Object.values(p.appsUsed).filter(Boolean).length >= c.gte;
    case 'sentencesAnalyzed':return (p.sentencesAnalyzed || 0) >= c.gte;
    case 'tenseFamiliar': {
      const t = p.tenses[tenseId];
      return !!t && t.correct >= c.correctGte;
    }
    case 'tenseMastery': {
      const t = p.tenses[tenseId];
      return !!t && t.attempts >= c.attemptsGte && t.days.length >= c.daysGte && (t.correct / t.attempts) >= c.accuracyGte;
    }
    default: return false;
  }
}

/* Evalúa todas las insignias contra el progreso. Estampa las nuevas en p.badges
   y devuelve { newly:[keys], all:[keys] }. `tenseIds` acota las perTense. */
export function evaluateBadges(p, badges, tenseIds) {
  const newly = [];
  const stamp = today => today;
  for (const b of badges) {
    if (b.perTense) {
      const ids = tenseIds && tenseIds.length ? tenseIds : Object.keys(p.tenses);
      for (const tid of ids) {
        const key = `${b.id}:${tid}`;
        if (!p.badges[key] && meets(p, b.criteria, tid)) { p.badges[key] = todayISO(); newly.push(key); }
      }
    } else {
      if (!p.badges[b.id] && meets(p, b.criteria)) { p.badges[b.id] = todayISO(); newly.push(b.id); }
    }
  }
  return { newly, all: Object.keys(p.badges) };
}

export const BADGES = [{"id":"streak-3","category":"habito","icon":"🔥","scope":"suite","name":{"es":"En marcha","en":"On a roll"},"desc":{"es":"3 días seguidos","en":"3-day streak"},"criteria":{"type":"dayStreak","gte":3}},{"id":"streak-7","category":"habito","icon":"🔥","scope":"suite","name":{"es":"Constante","en":"Consistent"},"desc":{"es":"7 días seguidos","en":"7-day streak"},"criteria":{"type":"dayStreak","gte":7}},{"id":"streak-30","category":"habito","icon":"🏆","scope":"suite","name":{"es":"Imparable","en":"Unstoppable"},"desc":{"es":"30 días seguidos","en":"30-day streak"},"criteria":{"type":"dayStreak","gte":30}},{"id":"correct-10","category":"volumen","icon":"✅","scope":"suite","name":{"es":"Primeros pasos","en":"First steps"},"desc":{"es":"10 respuestas correctas","en":"10 correct answers"},"criteria":{"type":"totalCorrect","gte":10}},{"id":"correct-100","category":"volumen","icon":"💯","scope":"suite","name":{"es":"Centenario","en":"Centurion"},"desc":{"es":"100 respuestas correctas","en":"100 correct answers"},"criteria":{"type":"totalCorrect","gte":100}},{"id":"analyst","category":"volumen","icon":"🔍","scope":"suite","name":{"es":"Analista","en":"Analyst"},"desc":{"es":"50 oraciones analizadas","en":"50 sentences analyzed"},"criteria":{"type":"sentencesAnalyzed","gte":50}},{"id":"precision-5","category":"precision","icon":"🎯","scope":"activity","name":{"es":"Puntería","en":"Sharp aim"},"desc":{"es":"5 aciertos seguidos","en":"5 in a row"},"criteria":{"type":"bestAnswerStreak","gte":5}},{"id":"tense-familiar","category":"maestria","icon":"🌱","scope":"suite","perTense":true,"name":{"es":"Familiarizado con {tense}","en":"Familiar with {tense}"},"desc":{"es":"~10 aciertos en ese tiempo","en":"~10 correct in that tense"},"criteria":{"type":"tenseFamiliar","correctGte":10}},{"id":"tense-mastery","category":"maestria","icon":"⭐","scope":"suite","perTense":true,"name":{"es":"Dominas {tense}","en":"You've mastered {tense}"},"desc":{"es":"≥90% en ≥12 intentos, en ≥2 días distintos","en":"≥90% over ≥12 attempts, on ≥2 different days"},"criteria":{"type":"tenseMastery","accuracyGte":0.9,"attemptsGte":12,"daysGte":2}},{"id":"explorer","category":"suite","icon":"🧩","scope":"suite","name":{"es":"Explorador del Hub","en":"Hub explorer"},"desc":{"es":"Usaste las 3 apps","en":"Used all 3 apps"},"criteria":{"type":"appsUsed","gte":3}}];
