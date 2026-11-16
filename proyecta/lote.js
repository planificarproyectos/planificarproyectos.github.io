/* Proyecta · Analizador de lotes de Bogotá
   Consulta en vivo los mapas oficiales (Catastro / IDECA y POT Decreto 555 de 2021 de la Secretaría Distrital de Planeación),
   arma la ficha de norma del lote, calcula un volumen edificable preliminar y lo pasa al asistente de proyecto nuevo.
   Es una prefactibilidad: no reemplaza el concepto de norma ni la licencia de una curaduría.
   Fuentes de las reglas: Decreto 555 de 2021 (arts. 260, 266, 281, 283, 304, 310, 317 a 322, 338, 379) y Anexo 5
   "Manual de normas comunes a los tratamientos urbanísticos" (actualizado por el Decreto 466 de 2024). */
(function (G) {
'use strict';
const CAT = 'https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/';
const POT = 'https://services7.arcgis.com/lsxbLWF2l19Rmhqj/ArcGIS/rest/services/POT_Bogota_Decreto_555_2021/FeatureServer/';
const MAPLIBRE = G.LOTE_MAPLIBRE || 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl';
const MINPLATE = 60;          // m²: por debajo de esto un piso tipo deja de ser viable
const TR_NAME = { C: 'Consolidación', R: 'Renovación urbana', D: 'Desarrollo', MI: 'Mejoramiento integral', CO: 'Conservación' };
const ROLE_NAME = { F: 'Frente', L: 'Lateral', P: 'Posterior', X: 'Sin aislamiento' };
const ROLE_COLOR = { F: '#4FC3F7', L: '#FFB74D', P: '#EF5350', X: '#9E9E9E' };
/* Estacionamientos (art. 389): tope como % del área construida, según el área de actividad. Solo se precargan los valores
   confirmados en conceptos de norma de curaduría; en las demás áreas queda un valor editable marcado "por verificar". */
const PARQ = { AAERVIS: { max: 10, adic: 15 }, AAPRSU: { max: 20, adic: 15 }, AAPGSU: { max: 15, adic: 10 } };

/* ---------------- Geometría (metros, plano local) ---------------- */
const R_T = 6378137, RAD = Math.PI / 180;
function projector(lon0, lat0) { const kx = Math.cos(lat0 * RAD) * R_T * RAD, ky = R_T * RAD;
  return { to: p => [(p[0] - lon0) * kx, (p[1] - lat0) * ky], back: p => [p[0] / kx + lon0, p[1] / ky + lat0] }; }
function sArea(r) { let s = 0; for (let i = 0, n = r.length; i < n; i++) { const a = r[i], b = r[(i + 1) % n]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
const area = r => Math.abs(sArea(r));
function centroid(r) { let x = 0, y = 0, s = 0; for (let i = 0, n = r.length; i < n; i++) { const a = r[i], b = r[(i + 1) % n], c = a[0] * b[1] - b[0] * a[1]; x += (a[0] + b[0]) * c; y += (a[1] + b[1]) * c; s += c; }
  return s ? [x / (3 * s), y / (3 * s)] : r[0]; }
function pip(p, r) { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j];
  if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function inner(r) { const c = centroid(r); if (pip(c, r)) return c; for (const v of r) { const m = [(c[0] + v[0]) / 2, (c[1] + v[1]) / 2]; if (pip(m, r)) return m; }
  for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length], d = r[(i + 2) % r.length], m = [(a[0] + b[0] + d[0]) / 3, (a[1] + b[1] + d[1]) / 3]; if (pip(m, r)) return m; } return c; }
function distSeg(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy; let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
/* Quita el vértice de cierre repetido y deja el anillo en sentido antihorario */
function normRing(r) { r = r.slice(); const a = r[0], z = r[r.length - 1]; if (r.length > 1 && Math.abs(a[0] - z[0]) < 1e-9 && Math.abs(a[1] - z[1]) < 1e-9) r.pop();
  const o = []; r.forEach(p => { const q = o[o.length - 1]; if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.02) o.push(p); });
  if (sArea(o) < 0) o.reverse(); return o; }
/* Recorta un polígono con el semiplano interior de la arista a→b corrida d metros hacia adentro (Sutherland–Hodgman) */
function clip(poly, a, b, d) { const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy); if (len < 1e-6 || !poly.length) return poly;
  const f = p => (dx * (p[1] - a[1]) - dy * (p[0] - a[0])) / len - d, out = [];
  for (let i = 0, n = poly.length; i < n; i++) { const p = poly[i], q = poly[(i + 1) % n], fp = f(p), fq = f(q);
    if (fp >= 0) out.push(p); if ((fp >= 0) !== (fq >= 0)) { const t = fp / (fp - fq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); } }
  return out; }
/* Retira cada lindero su aislamiento. En lotes cóncavos es conservador (recorta de más). */
function inset(ring, offs) { let p = ring.slice(); for (let i = 0, n = ring.length; i < n && p.length; i++) if (offs[i] > 0) p = clip(p, ring[i], ring[(i + 1) % n], offs[i]); return p.length >= 3 ? p : []; }

/* Clasifica cada lindero: frente (da a espacio público), lateral o posterior (colinda con otro lote) */
function classify(ring, neigh, placas) {
  const n = ring.length, E = [];
  for (let i = 0; i < n; i++) { const a = ring[i], b = ring[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1e-9;
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], q = [m[0] + dy / len * 1.5, m[1] - dx / len * 1.5];
    E.push({ a, b, len, m, ang: Math.atan2(dy, dx), front: !neigh.some(r => pip(q, r)) }); }
  const dev = (x, y) => { let d = Math.abs(x - y) % Math.PI; return d > Math.PI / 2 ? Math.PI - d : d; };
  (placas || []).forEach(pt => { let bi = -1, bd = 8; E.forEach((e, i) => { const d = distSeg(pt, e.a, e.b); if (d < bd) { bd = d; bi = i; } });
    if (bi < 0 || E[bi].front) return; E[bi].front = true;
    for (const s of [1, -1]) for (let k = 1; k < n; k++) { const e = E[(bi + s * k + n * k) % n]; if (e.front || dev(e.ang, E[bi].ang) > 0.26) break; e.front = true; } });
  const fr = E.filter(e => e.front), roles = new Array(n).fill('L'), g = { frente: 0, fondo: 0, esquina: false, sinFrente: !fr.length };
  if (!fr.length) return { roles, g };
  let sx = 0, sy = 0; fr.forEach(e => { sx += e.len * Math.cos(2 * e.ang); sy += e.len * Math.sin(2 * e.ang); g.frente += e.len; });
  const th = Math.atan2(sy, sx) / 2, cross = fr.filter(e => dev(e.ang, th) > Math.PI / 4).reduce((s, e) => s + e.len, 0);
  g.esquina = cross >= 3 && cross >= 0.2 * g.frente;
  const main = fr.filter(e => dev(e.ang, th) <= Math.PI / 4).sort((x, y) => y.len - x.len)[0] || fr[0];
  const dl = p => distSeg2(p, main); ring.forEach(p => { g.fondo = Math.max(g.fondo, dl(p)); });
  E.forEach((e, i) => { if (e.front) roles[i] = 'F'; else if (!g.esquina && dev(e.ang, th) < 0.61 && dl(e.m) > 0.5 * g.fondo) roles[i] = 'P'; });
  return { roles, g };
}
function distSeg2(p, e) { const dx = e.b[0] - e.a[0], dy = e.b[1] - e.a[1]; return Math.abs(dx * (p[1] - e.a[1]) - dy * (p[0] - e.a[0])) / (Math.hypot(dx, dy) || 1e-9); }

/* ---------------- Reglas de la norma ---------------- */
const postC = n => n <= 3 ? 3 : n <= 6 ? 5 : n <= 9 ? 6 : n <= 12 ? 8 : n <= 15 ? 10 : n <= 18 ? 12 : n <= 22 ? 14 : n <= 25 ? 16 : n <= 28 ? 18 : 20;   // Consolidación, por pisos
const postR = h => h <= 12 ? 4 : h <= 18 ? 5 : h <= 27 ? 6 : h <= 36 ? 8 : h <= 45 ? 10 : h <= 54 ? 12 : h <= 66 ? 14 : h <= 75 ? 16 : h <= 84 ? 18 : 20; // Renovación, por altura en metros
const postMI = n => n <= 3 ? 0 : n <= 6 ? 5 : n <= 9 ? 6 : 8;
function trCode(name) { const s = String(name || '').toUpperCase(); return /RENOV/.test(s) ? 'R' : /CONSOL/.test(s) ? 'C' : /DESARR/.test(s) ? 'D' : /MEJORA/.test(s) ? 'MI' : /CONSERV/.test(s) ? 'CO' : ''; }
function parseAlt(s) { const m = String(s || '').match(/\d+/g); if (!m) return null; const a = +m[0], b = m[1] ? +m[1] : a; return a > 0 ? [a, Math.max(a, b)] : null; }
const TIPOS0 = [35, 45, 55, 65, 75];
/* Reparte los apartamentos según el área vendible y la mezcla de tipologías */
function mezcla(vend, tipos) { const T = (tipos || []).filter(t => t.a >= 15 && t.pct > 0), sp = T.reduce((x, t) => x + t.pct, 0);
  if (!T.length || !(vend > 0)) return { filas: [], und: 0, prom: 0, usada: 0 };
  const prom = T.reduce((x, t) => x + t.a * t.pct, 0) / sp, tot = Math.floor(vend / prom + 1e-9);
  const f = T.map(t => { const q = tot * t.pct / sp; return { a: t.a, pct: t.pct * 100 / sp, und: Math.floor(q), r: q % 1 }; });
  let falta = tot - f.reduce((x, t) => x + t.und, 0); f.slice().sort((x, y) => y.r - x.r).forEach(t => { if (falta > 0) { t.und++; falta--; } });
  let usada = f.reduce((x, t) => x + t.und * t.a, 0);
  while (usada > vend + 1e-6) { const t = f.filter(x => x.und > 0).sort((x, y) => y.a - x.a)[0]; if (!t) break; t.und--; usada -= t.a; }
  const filas = f.sort((x, y) => x.a - y.a).map(t => ({ a: t.a, pct: t.pct, und: t.und, m2: t.und * t.a })), und = filas.reduce((x, t) => x + t.und, 0);
  return { filas, und, prom, usada };
}
function defaults(norm) { const pq = PARQ[norm.aaCod];
  return { auto: true, pisos: 0, hPiso: 3, antejardin: norm.tr === 'C' ? (norm.antejardin || 0) : 0, modalidad: norm.ae ? 'base' : '5', anchoVia: 0,
    computable: 85, eficiencia: 80, areaApto: 55, tipos: TIPOS0.map(t => ({ a: t, pct: 20 })), parqPct: pq ? pq.max : 15, m2Cupo: 25 }; }
/* Topes de altura e índice según el tratamiento */
function limits(S) { const t = S.norm.tr, p = S.p, A = S.geo.area, alt = S.norm.alt, L = { nDef: 3, nMax: 60, cap: 0, notas: [] };
  if (S.norm.aero > 0) L.nMax = Math.max(1, Math.min(L.nMax, Math.floor(S.norm.aero / p.hPiso)));
  if (t === 'C') { if (alt) { L.nDef = alt[0]; L.nMax = Math.min(L.nMax, alt[1]); if (alt[1] > alt[0]) L.notas.push('De ' + (alt[0] + 1) + ' a ' + alt[1] + ' pisos solo con las condiciones del art. 310 (frente, área del lote y perfil de la vía).'); }
    else L.notas.push('El mapa no trae altura máxima para este lote: revisa el plano CU-5.4 de la UPL.'); }
  else if (t === 'R') { L.cap = { base: 1.3, 5: 5, 6: 6, 7: 7 }[p.modalidad] || 5; }
  else if (t === 'MI') { L.nDef = 3; L.nMax = Math.min(L.nMax, 12); L.notas.push('En mejoramiento integral la altura (3, 5, 8 o 12 pisos) depende del ancho de la vía y del área del lote (art. 338).'); }
  else if (t === 'D') { L.cap = { 1: 2.25, 2: 2, 3: 1.75 }[S.norm.rango] || 0;
    if (A <= 1000) { const f = S.geo.frente >= 16, d = S.geo.fondo > 13.5; L.nMax = Math.min(L.nMax, f && d ? 6 : (f || d) || (S.geo.frente >= 10.5 && S.geo.fondo > 8) ? 3 : 2); L.nDef = L.nMax; L.notas.push('Lote de hasta 1.000 m² en desarrollo: altura según frente y fondo (art. 283).'); }
    else L.notas.push('Desarrollo: el índice se aplica sobre el área neta urbanizable y exige cesiones de parques y equipamiento (arts. 281, 288 y 290). Aquí se usa el área bruta del lote.');
    if (!L.cap) L.notas.push('Rango de edificabilidad ' + (S.norm.rango || 'sin dato') + ': revisa el índice en el art. 281.'); }
  else if (t === 'CO') { L.nDef = alt ? alt[0] : 2; L.nMax = alt ? alt[1] : L.nDef; L.notas.push('Conservación: la intervención depende del nivel del inmueble y del concepto del IDPC.'); }
  else L.notas.push('Sin tratamiento urbanístico identificado: ajusta los pisos a mano.');
  L.nDef = Math.min(L.nDef, L.nMax); return L; }
/* Aislamientos y retrocesos para una edificación de N pisos */
function setbacks(S, N) { const p = S.p, t = S.norm.tr, h = p.hPiso, H = N * h, ante = +p.antejardin || 0; let post = 0, lat = 0, latFrom = Infinity, retro = 0, retroFrom = Infinity;
  if (t === 'C') { post = postC(N); if (S.norm.tip === 'TA' && N >= 2) { latFrom = h; lat = Math.max(4, (H - h) / 5); } }
  else if (t === 'R') { post = postR(H); if (H > 11.4) { latFrom = Math.max(1, Math.floor(11.4 / h)) * h; lat = Math.max(4, (H - latFrom) / 5); } }
  else if (t === 'MI') { post = postMI(N); if (N > 5) { latFrom = 2 * h; lat = Math.max(4, (H - latFrom) / 5); } }
  else if (t === 'D') { if (N > 3) { post = lat = Math.max(4, H / 3); latFrom = 0; } else if (S.geo.area <= 1000) post = 3; }
  if (S.geo.fondo && S.geo.fondo <= 8) post = 0;
  if (p.anchoVia > 0) { const D = +p.anchoVia + ante; if (D <= 30 && H > 2.5 * D) { retroFrom = 2.5 * D; retro = Math.max(4, (H - retroFrom) / 5); } }
  return { ante, post, lat, latFrom, retro, retroFrom, H }; }
/* Volumen: pisos agrupados en franjas con la misma planta */
function envelope(S, N) { const sb = setbacks(S, N), h = S.p.hPiso, ring = S.geo.ring, bands = []; let key = null, built = 0;
  for (let k = 0; k < N; k++) { const z = k * h, uL = z >= sb.latFrom - 1e-6, uR = z + h > sb.retroFrom + 1e-6, kk = uL + '|' + uR;
    if (kk !== key) { key = kk; const poly = inset(ring, S.roles.map(r => r === 'F' ? sb.ante + (uR ? sb.retro : 0) : r === 'L' ? (uL ? sb.lat : 0) : r === 'P' ? sb.post : 0));
      bands.push({ from: k, to: k + 1, poly, area: poly.length ? area(poly) : 0, lat: uL ? sb.lat : 0, retro: uR ? sb.retro : 0 }); }
    else bands[bands.length - 1].to = k + 1; }
  bands.forEach(b => built += b.area * (b.to - b.from)); return { sb, bands, built, foot: bands.length ? bands[0].area : 0, H: N * h }; }
function autoN(S, L) { if (!L.cap) return L.nDef; let best = 1, bestA = -1;
  for (let n = 1; n <= L.nMax; n++) { const e = envelope(S, n), top = e.bands[e.bands.length - 1]; if (!top || top.area < Math.min(MINPLATE, e.foot)) break;
    const a = e.built * S.p.computable / 100; if (a > bestA) { bestA = a; best = n; } if (a >= L.cap * S.geo.area) return n; } return best; }
/* Obligaciones urbanísticas por edificabilidad (arts. 317, 318, 320 y 322), consolidación y renovación sin plan parcial */
function oblig(S, ic, year) { const t = S.norm.tr, AT = S.geo.area, V = S.norm.vref || 0, y = year || new Date().getFullYear(), k = y <= 2024 ? 0.3 : y <= 2027 ? 0.5 : 0.8, d = y <= 2024 ? 0.25 : y <= 2027 ? 0.45 : 0.75;
  let fce = 0, fd = 0, vis = '';
  if (t === 'C') { if (ic > 4) { fce = 0.10; fd = 0.05; } else if (ic > 3) fce = 0.10; else if (ic > 2) fce = 0.05;
    vis = ic > 4 ? '6 % VIP o 12 % VIS (3 % u 8 % hasta 2027)' : ic > 3 ? '5 % VIP o 10 % VIS (2,5 % o 6 % hasta 2027)' : ''; }
  else if (t === 'R') { if (ic > 1.3) { fce = ic > 6 ? 0.25 : 0.20; fd = ic > 6 ? 0.35 : ic > 5 ? 0.34 : ic > 4 ? 0.25 : ic > 3 ? 0.15 : ic > 2 ? 0.07 : 0; if (AT < 400 && ic <= 2) { fce = 0.10; fd = 0; } }
    vis = ic > 2 ? 'Aplica obligación VIS/VIP (art. 322); el porcentaje depende del rango del índice' : ''; }
  else return null;
  const cs = AT * fce, enSitio = cs >= 400, comp = enSitio ? 0 : cs * V * k, pago = AT * fd * V * d, redes = ic > 1.3 && !(AT <= 300 && ic < 2) ? AT * (fce + fd) * V * 0.064 : 0;
  return { fs: fce + fd, fce, fd, cs, enSitio, comp, pago, redes, total: comp + pago + redes, vis, k, d }; }
/* Cálculo completo */
function compute(S) { const p = S.p, L = limits(S), AT = S.geo.area, avis = L.notas.slice();
  let N = p.auto || !(p.pisos > 0) ? autoN(S, L) : Math.round(p.pisos); N = Math.max(1, Math.min(60, N));
  const e = envelope(S, N), pct = p.computable / 100; let built = e.built, comp = built * pct, limitado = false;
  if (L.cap && comp > L.cap * AT + 0.5) { comp = L.cap * AT; built = comp / pct; limitado = true; }
  const ic = AT ? comp / AT : 0, io = AT ? e.foot / AT : 0, vend = built * p.eficiencia / 100, mz = mezcla(vend, p.tipos), und = mz.und;
  const aParq = built * p.parqPct / 100, cupos = Math.floor(aParq / Math.max(10, p.m2Cupo)), top = e.bands[e.bands.length - 1];
  if (N > L.nMax) avis.push('Los ' + N + ' pisos superan el máximo de ' + L.nMax + ' que resulta de la norma para este lote.');
  if (S.norm.aero > 0 && e.H > S.norm.aero) avis.push('La altura (' + e.H.toFixed(1) + ' m) supera el límite de la Aeronáutica Civil (' + S.norm.aero + ' m).');
  if (top && top.area < MINPLATE && e.foot >= MINPLATE) avis.push('Con los aislamientos, la planta de los pisos altos queda en ' + top.area.toFixed(0) + ' m²: es poco viable.');
  if (!e.foot) avis.push('Los aislamientos consumen todo el lote: revisa el tipo de cada lindero.');
  if (limitado) avis.push('El volumen cabe, pero el índice de construcción (' + L.cap.toLocaleString('es-CO') + ') limita el área: no se aprovechan todos los pisos completos.');
  if (S.g.sinFrente) avis.push('No identifiqué el frente del lote: toca en el mapa el lindero que da a la calle.');
  if (S.g.esquina) avis.push('Lote esquinero: no se exige aislamiento posterior; la transición se resuelve con patio en la esquina interior.');
  if (S.geo.fondo && S.geo.fondo <= 8) avis.push('Fondo de 8 m o menos: no se exige aislamiento posterior.');
  return { N, L, e, sb: e.sb, built, comp, ic, io, vend, und, mz, aParq, cupos, limitado, avis, ob: oblig(S, ic), valorLote: (S.norm.vref || 0) * AT }; }

/* ---------------- Servicios oficiales ---------------- */
async function ags(url, params, post) { const q = new URLSearchParams(Object.assign({ f: 'json' }, params));
  const r = post ? await fetch(url + '/query', { method: 'POST', body: q }) : await fetch(url + '/query?' + q);
  if (!r.ok) throw new Error('El servicio respondió ' + r.status); const j = await r.json(); if (j.error) throw new Error(j.error.message || 'Error del servicio'); return j; }
const attrs = j => (j.features || []).map(f => f.attributes || f.properties || {});
const sq = s => String(s).replace(/'/g, "''");
const LOTE = CAT + 'catastro/lote/MapServer/';
function rings(g) { return !g ? [] : g.type === 'Polygon' ? [g.coordinates[0]] : g.type === 'MultiPolygon' ? g.coordinates.map(c => c[0]) : []; }
function normDir(s) { return String(s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\b(NO|NUM|NUMERO)\b\.?|[#°º.,-]/g, ' ')
  .replace(/\bAV(ENIDA)?\s+(CARRERA|CRA|KRA|KR|CR|K)\b/g, 'AK').replace(/\bAV(ENIDA)?\s+(CALLE|CLL|CL|C)\b/g, 'AC')
  .replace(/\b(CARRERA|CRA|KRA|CR|KR|K)\b/g, 'KR').replace(/\b(CALLE|CLL|CL)\b/g, 'CL').replace(/\b(DIAGONAL|DIAG|DG)\b/g, 'DG').replace(/\b(TRANSVERSAL|TRANSV|TR|TV)\b/g, 'TV')
  .replace(/(\d)\s+([A-Z])\b(?!\w)/g, '$1$2').replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }
/* Busca por CHIP o por dirección. Devuelve los lotes candidatos */
async function buscar(txt) { const t = String(txt || '').trim(); if (!t) return [];
  const chip = t.toUpperCase().replace(/\s/g, ''), isChip = /^AAA\d{4}[A-Z]{3,4}$/.test(chip), d = normDir(t);
  if (!isChip && d.length < 5) throw new Error('Escribe la dirección completa, por ejemplo KR 7 62 57');
  const j = await ags(LOTE + '3', { where: isChip ? "PRECHIP='" + sq(chip) + "'" : "PREDIRECC LIKE '" + sq(d) + "%'", outFields: 'PRECHIP,PREDIRECC,BARMANPRE,PRENBARRIO', returnGeometry: false, resultRecordCount: 60, orderByFields: 'PREDIRECC' });
  const m = new Map(); attrs(j).forEach(a => { if (!a.BARMANPRE) return; const o = m.get(a.BARMANPRE); if (o) o.n++; else m.set(a.BARMANPRE, { code: a.BARMANPRE, dir: a.PREDIRECC, chip: a.PRECHIP, barrio: a.PRENBARRIO, n: 1 }); });
  return [...m.values()]; }
async function lotAt(lng, lat) { const j = await ags(LOTE + '0', { f: 'geojson', geometry: lng + ',' + lat, geometryType: 'esriGeometryPoint', inSR: 4326, spatialRel: 'esriSpatialRelIntersects', outFields: 'LOTCODIGO', outSR: 4326 });
  const f = (j.features || [])[0]; return f ? { code: f.properties.LOTCODIGO, geometry: f.geometry } : null; }
/* Capas del POT que se consultan. pt: en un punto interior del lote; poly: contra el polígono (encogido 0,4 m) */
const CAPAS_PT = [15, 14, 22, 21, 25, 35, 43];
const CAPAS_POLY = [185, 18, 13, 12, 9, 0, 6, 45, 102, 69, 63, 96, 101, 182, 159, 191, 193, 16];
async function cargar(code, geom) {
  if (!geom) { const j = await ags(LOTE + '0', { f: 'geojson', where: "LOTCODIGO='" + sq(code) + "'", outFields: 'LOTCODIGO', outSR: 4326 }); const f = (j.features || [])[0]; if (!f) throw new Error('Catastro no tiene geometría para ese lote'); geom = f.geometry; }
  const rl = rings(geom).sort((a, b) => b.length - a.length)[0]; if (!rl || rl.length < 4) throw new Error('La geometría del lote no es válida');
  let lon0 = 0, lat0 = 0; rl.forEach(p => { lon0 += p[0]; lat0 += p[1]; }); lon0 /= rl.length; lat0 /= rl.length;
  const pr = projector(lon0, lat0), ring = normRing(rl.map(pr.to)), ip = pr.back(inner(ring));
  const xs = rl.map(p => p[0]), ys = rl.map(p => p[1]), dd = 0.00045, env = { geometry: [Math.min(...xs) - dd, Math.min(...ys) - dd, Math.max(...xs) + dd, Math.max(...ys) + dd].join(','), geometryType: 'esriGeometryEnvelope', inSR: 4326, spatialRel: 'esriSpatialRelIntersects', outSR: 4326, geometryPrecision: 7, f: 'geojson' };
  const small = inset(ring, ring.map(() => 0.4)), qr = (small.length ? small : ring).map(pr.back); qr.push(qr[0]);
  const pt = { geometry: ip[0] + ',' + ip[1], geometryType: 'esriGeometryPoint', inSR: 4326, spatialRel: 'esriSpatialRelIntersects', outFields: '*', returnGeometry: false };
  const pg = { geometry: JSON.stringify({ rings: [qr], spatialReference: { wkid: 4326 } }), geometryType: 'esriGeometryPolygon', inSR: 4326, spatialRel: 'esriSpatialRelIntersects', outFields: '*', returnGeometry: false };
  const safe = (pm, def) => pm.catch(e => { fallos.push(e.message); return def; }), fallos = [];
  const [pred, plac, vec, cons, vref, cpt, cpg] = await Promise.all([
    safe(ags(LOTE + '3', { where: "BARMANPRE='" + sq(code) + "'", outFields: 'PRECHIP,PREDIRECC,PRENBARRIO,PREATERRE,PREACONST,PRECDESTIN', returnGeometry: false, resultRecordCount: 400 }).then(attrs), []),
    safe(ags(CAT + 'catastro/placadomiciliaria/MapServer/0', { f: 'geojson', where: "PDOCLOTE='" + sq(code) + "'", outFields: 'PDOTEXTO,PDONVIAL', outSR: 4326 }).then(j => j.features || []), []),
    safe(ags(LOTE + '0', Object.assign({ outFields: 'LOTCODIGO' }, env)).then(j => j.features || []), []),
    safe(ags(CAT + 'catastro/construccion/MapServer/0', Object.assign({ outFields: 'CONNPISOS,LOTECODIGO' }, env)).then(j => j.features || []), []),
    safe(ags(CAT + 'catastro/valorreferencia/MapServer/0', { where: "MANCODIGO='" + sq(code.slice(0, 9)) + "'", outFields: 'V_REF,ANO', returnGeometry: false, orderByFields: 'ANO DESC', resultRecordCount: 1 }).then(attrs), []),
    Promise.all(CAPAS_PT.map(i => safe(ags(POT + i, pt, true).then(attrs), null))),
    Promise.all(CAPAS_POLY.map(i => safe(ags(POT + i, pg, true).then(attrs), null)))]);
  const P = {}; CAPAS_PT.forEach((i, k) => P[i] = cpt[k]); CAPAS_POLY.forEach((i, k) => P[i] = cpg[k]);
  const one = i => (P[i] || [])[0] || {}, str = v => String(v == null ? '' : v).trim(), tr = one(15), aa = one(14);
  const norm = { tr: trCode(tr.TRATAMIENTO), trNombre: str(tr.TRATAMIENTO), tip: str(tr.TIPOLOGIA).toUpperCase(), altTxt: str(tr.ALTURA_MAXIMA), alt: parseAlt(tr.ALTURA_MAXIMA),
    aaCod: str(aa.CODIGO_AREA_ACTIVIDAD), aa: str(aa.NOMBRE_AREA_ACTIVIDAD), antejardin: parseFloat(str(one(22).DIMENSION).replace(',', '.')) || 0, antejardinDato: str(one(22).DIMENSION) !== '',
    rango: str(one(21).RANGO), upl: str(one(35).NIOMBRE || one(35).NOMBRE), suelo: str(one(43).CLASE_SUELO), aero: +one(25).ALTURA || 0, aeroCota: +one(25)['ELEVACIÓN_MAXIMA'] || 0, aeroDato: !!(P[25] || []).length,
    vref: vref[0] ? +vref[0].V_REF || 0 : 0, vrefAno: vref[0] && vref[0].ANO ? new Date(vref[0].ANO).getUTCFullYear() : 0, ae: str(one(18).NOMBRE), sinPot: P[15] === null };
  const neigh = []; vec.forEach(f => { if (f.properties.LOTCODIGO !== code) rings(f.geometry).forEach(r => neigh.push(normRing(r.map(pr.to)))); });
  const cl = classify(ring, neigh, plac.filter(f => f.geometry && f.geometry.type === 'Point').map(f => pr.to(f.geometry.coordinates)));
  const vistos = new Set(), unicos = pred.filter(a => !vistos.has(a.PRECHIP) && vistos.add(a.PRECHIP));
  const propios = unicos.slice().sort((a, b) => String(a.PREDIRECC).length - String(b.PREDIRECC).length), p0 = propios[0] || {};
  const S = { code, pr, lonlat: rl, ip, geo: { ring, area: area(ring), frente: cl.g.frente, fondo: cl.g.fondo }, g: cl.g, roles: cl.roles, norm, alertas: alertas(P, norm),
    predio: { dir: str(p0.PREDIRECC), chip: unicos.length === 1 ? str(p0.PRECHIP) : '', barrio: str(p0.PRENBARRIO), n: unicos.length, aTerr: unicos.length === 1 ? +p0.PREATERRE || 0 : 0, aCons: unicos.reduce((s, a) => s + (+a.PREACONST || 0), 0) },
    vecinos: vec.filter(f => f.properties.LOTCODIGO !== code), cons: cons.filter(f => f.properties.LOTECODIGO !== code), consPropia: cons.filter(f => f.properties.LOTECODIGO === code), fallos };
  S.p = defaults(norm); return S; }
/* Restricciones y avisos a partir de las capas del POT. nivel: 2 alto, 1 medio, 0 informativo */
function alertas(P, norm) { const A = [], has = i => (P[i] || []).length > 0, one = i => (P[i] || [])[0] || {}, add = (nivel, t, d) => A.push({ nivel, t, d });
  if (norm.suelo && !/^URB/i.test(norm.suelo)) add(2, 'Suelo ' + (/EXP/i.test(norm.suelo) ? 'de expansión' : 'rural o de protección'), 'Este análisis solo aplica a suelo urbano.');
  if (has(185)) { const v = one(185); add(2, 'Reserva vial: ' + (v.NOMBRE || 'malla vial arterial'), 'En la franja afectada solo se permite 1 piso, sin sótanos ni vivienda (art. 379).' + (v.ANCHO ? ' Ancho previsto de la vía: ' + v.ANCHO + ' m.' : '')); }
  if (has(45) || has(102)) add(2, 'Estructura Ecológica Principal', 'Parte del lote toca la estructura ecológica o el sistema hídrico: esa área no es edificable.');
  if (has(101)) add(2, 'Suelo de protección por riesgo', 'No se puede urbanizar ni construir en el área afectada.');
  if (has(13)) add(2, 'Plan parcial', 'El lote está en el ámbito de un plan parcial: la norma la define ese plan.');
  if (has(18)) add(2, 'Actuación Estratégica: ' + norm.ae, 'Mientras no se adopte el instrumento solo se puede desarrollar el índice base de 1,3 (art. 483, par. 3). Verifica si ya fue adoptada.');
  if (has(12) || has(9)) add(2, 'Bien de interés cultural', 'El lote es o colinda con un bien de interés cultural: requiere concepto del IDPC.');
  if (has(0)) add(1, 'Sector de interés cultural', 'Aplica la norma de conservación del sector.');
  if (has(6)) add(1, 'Zona de influencia de bienes de interés cultural', 'La intervención puede requerir aprobación del IDPC antes de la licencia.');
  if (has(96)) add(2, 'Riesgo por movimientos en masa', 'Área en condición de riesgo: requiere estudios detallados.');
  if (has(69)) { const c = +one(69).CATEGORIZACION_AMENAZA; if (c >= 2) add(c >= 3 ? 2 : 1, 'Amenaza ' + (c >= 3 ? 'alta' : 'media') + ' por movimientos en masa', 'Antes de construir se exigen estudios detallados de riesgo (art. 22).'); }
  if (has(63)) add(1, 'Amenaza de inundación por desbordamiento', 'Revisa la categoría de amenaza y las medidas exigidas.');
  if (has(182) || has(159)) add(1, 'Área de influencia del aeropuerto El Dorado', 'La vivienda exige mitigación de ruido y la altura depende de la Aeronáutica Civil.');
  if (norm.aeroDato && !norm.aero) add(1, 'Altura sujeta a la Aeronáutica Civil', 'El mapa de elevación máxima marca 0 m: se necesita concepto técnico favorable.');
  else if (norm.aero) add(0, 'Límite aeronáutico: ' + norm.aero + ' m', 'Altura máxima sobre el terreno según el mapa de elevación máxima' + (norm.aeroCota ? ' (cota ' + norm.aeroCota + ' msnm).' : '.'));
  if (has(191)) add(1, 'Suelo de reserva', 'El lote toca un área de reserva para infraestructura o equipamientos.');
  if (has(193)) add(1, 'Plan de implantación o de regularización', 'El lote hace parte de un plan complementario vigente.');
  if (has(16)) add(1, 'Sector incompatible con vivienda', 'El uso residencial está restringido en este sector.');
  return A.sort((a, b) => b.nivel - a.nivel); }

/* ======================= Interfaz ======================= */
const H = () => G.LoteHost || {};
const tell = m => { if (H().toast) H().toast(m); else console.log('[Lote]', m); };
const nf = (v, d) => (+v || 0).toLocaleString('es-CO', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fM = v => { v = +v || 0; return v >= 1e9 ? '$ ' + nf(v / 1e6, 0) + ' M' : v >= 1e6 ? '$ ' + nf(v / 1e6, 1) + ' M' : '$ ' + nf(v); };
const U = { el: null, map: null, S: null, R: null, tab: 'norma', base: '', ov: 0, d3: true, busy: false, cands: null, raf: 0, ovT: 0, ready: null };
const IC = { back: '<path d="m15 6-6 6 6 6"/>', norma: '<path d="M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h7"/>', vol: '<path d="M12 3 4 7v10l8 4 8-4V7zM4 7l8 4 8-4M12 11v10"/>', proy: '<path d="M4 20h16M7 16v-5M12 16V6M17 16v-8"/>',
  layers: '<path d="m12 4 9 5-9 5-9-5zM3 14l9 5 9-5"/>', search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>' };
const ic = k => '<svg viewBox="0 0 24 24" aria-hidden="true">' + IC[k] + '</svg>';
const CSS = `
#lote{position:fixed;inset:0;z-index:40;background:var(--bg,#0E0F10);color:var(--ink,#F2F2EE);display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);color-scheme:inherit}
#lote *{box-sizing:border-box}
#lote svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:none}
.lt-top{display:flex;gap:8px;align-items:center;padding:calc(8px + env(safe-area-inset-top,0px)) max(10px,env(safe-area-inset-right,0px)) 8px max(10px,env(safe-area-inset-left,0px));border-bottom:1px solid var(--line,#2B2D2A);background:var(--panel,#17191A)}
.lt-ib{width:40px;height:40px;border-radius:50%;border:0;background:transparent;color:inherit;display:grid;place-items:center;cursor:pointer;flex:none}
.lt-ib:hover{background:var(--sunk,#222)}
.lt-q{flex:1;min-width:0;display:flex;align-items:center;gap:8px;background:var(--sunk,#222);border-radius:99px;padding:0 6px 0 14px;height:42px}
.lt-q input{flex:1;min-width:0;border:0;background:transparent;color:inherit;font:inherit;font-size:15px;outline:0}
.lt-q button{border:0;border-radius:99px;height:32px;padding:0 14px;font:inherit;font-weight:700;font-size:13px;background:var(--acc,#4FC3F7);color:var(--on-acc,#06222E);cursor:pointer}
.lt-main{position:relative;min-height:0;display:grid;grid-template-columns:minmax(340px,420px) minmax(0,1fr)}
.lt-panel{overflow:auto;padding:14px 14px 96px;min-height:0;scrollbar-width:thin;scrollbar-color:var(--line,#333) transparent}
.lt-map{position:relative;min-height:0;background:#0b0c0d}
.lt-map>.mp{position:absolute;inset:0}
.lt-tools{position:absolute;top:10px;right:10px;z-index:3;display:flex;flex-direction:column;gap:6px;align-items:flex-end}
.lt-seg{max-width:100%;overflow-x:auto;scrollbar-width:none;display:flex;background:var(--panel,#17191A);border:1px solid var(--line,#2B2D2A);border-radius:99px;padding:3px;box-shadow:0 6px 18px rgba(0,0,0,.3)}
.lt-seg button{border:0;background:transparent;color:var(--muted,#9A9D96);font:inherit;font-size:12px;font-weight:700;padding:6px 11px;border-radius:99px;cursor:pointer;white-space:nowrap}
.lt-seg button[aria-pressed=true]{background:color-mix(in srgb,var(--acc,#4FC3F7) 24%,transparent);color:var(--acc-ink,#8FD8FA)}
.lt-leg{position:absolute;left:10px;bottom:10px;z-index:3;background:var(--panel,#17191A);border:1px solid var(--line,#2B2D2A);border-radius:12px;padding:8px 10px;font-size:11px;display:grid;gap:3px;max-width:230px}
.lt-leg i{display:inline-block;width:14px;height:4px;border-radius:2px;margin-right:6px;vertical-align:middle}
.lt-leg b{font-weight:700}
.lt-tabs{position:absolute;left:210px;bottom:calc(14px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:6;display:flex;gap:4px;padding:6px;border-radius:99px;background:var(--panel,#17191A);border:1px solid var(--line,#2B2D2A);box-shadow:0 10px 30px rgba(0,0,0,.4)}
.lt-tabs button{border:0;background:transparent;color:var(--muted,#9A9D96);display:flex;align-items:center;gap:6px;font:inherit;font-size:12px;font-weight:700;padding:9px 14px;border-radius:99px;cursor:pointer}
.lt-tabs button[aria-selected=true]{background:color-mix(in srgb,var(--acc,#4FC3F7) 24%,transparent);color:var(--acc-ink,#8FD8FA)}
.lt-tp{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 36px;gap:8px;margin-bottom:6px;align-items:center}.lt-tph{font-size:11px;color:var(--muted,#9A9D96);font-weight:700}
.lt-tp input{width:100%;box-sizing:border-box;height:38px;border-radius:10px;border:1px solid var(--line,#2B2D2A);background:var(--sunk,#222);color:inherit;font:inherit;font-size:14px;padding:0 10px;color-scheme:dark}
.lt-tp button{border:0;width:36px;height:36px;border-radius:50%;background:transparent;color:var(--muted,#9A9D96);font-size:20px;cursor:pointer}.lt-tp button:hover{background:var(--sunk,#222)}
.lt-card{background:var(--panel,#17191A);border-radius:var(--r,18px);padding:14px 16px;margin-bottom:10px}
.lt-card h3{margin:0 0 8px;font-size:13px;letter-spacing:.02em;text-transform:uppercase;color:var(--muted,#9A9D96)}
.lt-h{font-size:19px;font-weight:800;line-height:1.2;margin:0}
.lt-sub{color:var(--muted,#9A9D96);font-size:12.5px;margin:2px 0 0}
.lt-kv{display:grid;grid-template-columns:1fr auto;gap:5px 12px;font-size:13.5px}
.lt-kv span{color:var(--muted,#9A9D96)} .lt-kv b{text-align:right;font-weight:700;font-variant-numeric:tabular-nums}
.lt-big{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:10px}
.lt-big div{background:var(--panel,#17191A);border-radius:14px;padding:11px 13px}
.lt-big span{display:block;color:var(--muted,#9A9D96);font-size:11.5px} .lt-big b{font-size:19px;font-weight:800;font-variant-numeric:tabular-nums}
.lt-big small{display:block;color:var(--muted,#9A9D96);font-size:11px}
.lt-al{display:grid;grid-template-columns:auto 1fr;gap:9px;padding:9px 0;border-top:1px solid var(--line,#2B2D2A);font-size:13px}
.lt-al:first-of-type{border-top:0;padding-top:2px}
.lt-al i{width:9px;height:9px;border-radius:50%;margin-top:5px} .lt-al i.n2{background:#EF5350} .lt-al i.n1{background:#FFB74D} .lt-al i.n0{background:#4FC3F7}
.lt-al p{margin:1px 0 0;color:var(--muted,#9A9D96);font-size:12.5px}
.lt-f{display:grid;gap:3px;margin-bottom:11px}
.lt-f label{display:flex;justify-content:space-between;gap:10px;font-size:13px} .lt-f label b{font-variant-numeric:tabular-nums}
.lt-f input[type=range]{width:100%;accent-color:var(--acc,#4FC3F7);margin:2px 0;color-scheme:inherit}
.lt-f small{color:var(--muted,#9A9D96);font-size:11.5px}
.lt-opt{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:11px}
.lt-opt button{border:1px solid var(--line,#2B2D2A);background:transparent;color:inherit;font:inherit;font-size:12.5px;font-weight:700;border-radius:99px;padding:7px 12px;cursor:pointer}
.lt-opt button[aria-pressed=true]{background:color-mix(in srgb,var(--acc,#4FC3F7) 24%,transparent);border-color:transparent;color:var(--acc-ink,#8FD8FA)}
.lt-note{font-size:12px;color:var(--muted,#9A9D96);margin:6px 0 0}
.lt-warn{font-size:12.5px;margin:0 0 10px;padding:10px 12px;border-radius:12px;background:color-mix(in srgb,#FFB74D 14%,transparent)}
.lt-warn p{margin:0 0 4px} .lt-warn p:last-child{margin:0}
.lt-cta{width:100%;border:0;border-radius:99px;padding:14px;font:inherit;font-size:15px;font-weight:800;background:var(--acc,#4FC3F7);color:var(--on-acc,#06222E);cursor:pointer}
.lt-cta[disabled]{opacity:.5;cursor:default}
.lt-list button{display:block;width:100%;text-align:left;border:0;border-top:1px solid var(--line,#2B2D2A);background:transparent;color:inherit;font:inherit;padding:10px 2px;cursor:pointer}
.lt-list button:first-child{border-top:0} .lt-list small{display:block;color:var(--muted,#9A9D96)}
.lt-load{position:absolute;left:50%;top:14px;transform:translateX(-50%);z-index:4;background:var(--panel,#17191A);border:1px solid var(--line,#2B2D2A);border-radius:99px;padding:7px 14px;font-size:12.5px;font-weight:700;box-shadow:0 6px 18px rgba(0,0,0,.3)}
#lote .maplibregl-ctrl-attrib{font-size:10px;background:rgba(0,0,0,.45);color:#ccc} #lote .maplibregl-ctrl-attrib a{color:#ddd}
#lote.lt-dark .maplibregl-ctrl-group{background:#17191A;border:1px solid #2B2D2A} #lote.lt-dark .maplibregl-ctrl-group button+button{border-top-color:#2B2D2A}
#lote.lt-dark .maplibregl-ctrl-group button span{filter:invert(.85)}
@media(max-width:820px){.lt-main{grid-template-columns:minmax(0,1fr);grid-template-rows:44vh minmax(0,1fr)}.lt-map{order:-1}.lt-tabs{left:50%}.lt-leg{display:none}.lt-seg button{padding:6px 9px}.lt-tools{max-width:calc(100% - 64px)}.lt-tabs button{padding:9px 12px}}
`;
function isDark() { try { const c = getComputedStyle(U.el).backgroundColor.match(/[\d.]+/g).map(Number); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) < 128; } catch (e) { return true; } }
const tiles = name => [CAT + 'Mapa_Referencia/' + name + '/MapServer/tile/{z}/{y}/{x}'];
const BASES = { osc: 'mapa_base_oscuro_3857', cla: 'mapa_base_3857', sat: 'mapa_hibrido' };
const OVS = [null, { id: 15, n: 'Tratamientos', f: 'TRATAMIENTO', col: ['match', ['slice', ['upcase', ['to-string', ['get', 'TRATAMIENTO']]], 0, 5], 'RENOV', '#E57373', 'CONSO', '#FFD54F', 'DESAR', '#81C784', 'MEJOR', '#BA68C8', 'CONSE', '#4DB6AC', '#90A4AE'] },
  { id: 14, n: 'Actividad', f: 'CODIGO_AREA_ACTIVIDAD', col: ['match', ['slice', ['to-string', ['get', 'CODIGO_AREA_ACTIVIDAD']], 0, 3], 'AAP', '#FFD54F', 'AAE', '#FF8A65', 'AAG', '#64B5F6', '#90A4AE'] },
  { id: 185, n: 'Reserva vial', f: 'NOMBRE', col: '#EF5350' }, { id: 45, n: 'Ecológica', f: 'NOMBRE', col: '#66BB6A' }];

function loadLib() { if (G.maplibregl) return Promise.resolve(); if (U.ready) return U.ready;
  U.ready = new Promise((ok, no) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = MAPLIBRE + '.css'; document.head.appendChild(l);
    const s = document.createElement('script'); s.src = MAPLIBRE + '.js'; s.onload = ok; s.onerror = () => { U.ready = null; no(new Error('No se pudo cargar el visor de mapas. Revisa tu conexión.')); }; document.head.appendChild(s); });
  return U.ready; }
const FC = f => ({ type: 'FeatureCollection', features: f || [] });
function accent() { try { const c = document.createElement('canvas'); c.width = c.height = 1; const x = c.getContext('2d'); x.fillStyle = getComputedStyle(U.el).getPropertyValue('--acc').trim() || '#4FC3F7'; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return 'rgb(' + d[0] + ',' + d[1] + ',' + d[2] + ')'; } catch (e) { return '#4FC3F7'; } }
function initMap() { const mg = G.maplibregl, dark = isDark(); U.base = dark ? 'osc' : 'cla'; U.acc = accent(); U.el.classList.toggle('lt-dark', dark);
  const map = U.map = new mg.Map({ container: U.el.querySelector('.mp'), center: [-74.085, 4.65], zoom: 11.2, maxZoom: 20.9, minZoom: 9, maxPitch: 75, attributionControl: false,
    style: { version: 8, sources: { base: { type: 'raster', tiles: tiles(BASES[U.base]), tileSize: 256, maxzoom: 19, attribution: 'Mapa de referencia IDECA · Catastro Distrital · POT: Secretaría Distrital de Planeación' } }, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#0b0c0d' } }, { id: 'base', type: 'raster', source: 'base' }] } });
  map.addControl(new mg.AttributionControl({ compact: true }), 'bottom-right'); map.addControl(new mg.NavigationControl({ visualizePitch: true }), 'top-left');
  /* Las capas se montan apenas carga el estilo, sin esperar a que lleguen todas las teselas del mapa base */
  const setup = () => { if (U.mapOk || !(map.style && map.style._loaded) || map.getSource('ov')) return; ['ov', 'vec', 'cons', 'lot', 'env', 'edges'].forEach(s => map.addSource(s, { type: 'geojson', data: FC() }));
    map.addLayer({ id: 'ov-f', type: 'fill', source: 'ov', paint: { 'fill-color': '#90A4AE', 'fill-opacity': 0.3 } });
    map.addLayer({ id: 'ov-l', type: 'line', source: 'ov', paint: { 'line-color': '#fff', 'line-opacity': 0.35, 'line-width': 0.8 } });
    map.addLayer({ id: 'vec-l', type: 'line', source: 'vec', paint: { 'line-color': '#8a8f93', 'line-opacity': 0.6, 'line-width': 0.8 } });
    map.addLayer({ id: 'cons-x', type: 'fill-extrusion', source: 'cons', paint: { 'fill-extrusion-color': '#7d868c', 'fill-extrusion-height': ['get', 'h'], 'fill-extrusion-opacity': 0.55 } });
    map.addLayer({ id: 'lot-f', type: 'fill', source: 'lot', paint: { 'fill-color': U.acc, 'fill-opacity': 0.16 } });
    map.addLayer({ id: 'env-x', type: 'fill-extrusion', source: 'env', paint: { 'fill-extrusion-color': ['get', 'c'], 'fill-extrusion-height': ['get', 'h'], 'fill-extrusion-base': ['get', 'b'], 'fill-extrusion-opacity': 0.82 } });
    map.addLayer({ id: 'edges-l', type: 'line', source: 'edges', layout: { 'line-cap': 'round' }, paint: { 'line-color': ['get', 'c'], 'line-width': 4.5 } });
    map.addLayer({ id: 'edges-h', type: 'line', source: 'edges', paint: { 'line-color': '#000', 'line-opacity': 0, 'line-width': 22 } });
    U.mapOk = true; tools(); draw(); if (U.S) fit(); const at = U.el.querySelector('.maplibregl-ctrl-attrib'); if (at) at.classList.remove('maplibregl-compact-show'); };
  map.on('styledata', setup); map.on('load', setup); const iv = setInterval(() => { setup(); if (U.mapOk) clearInterval(iv); }, 300);
  map.on('click', e => { if (U.busy) return; const hit = U.S ? map.queryRenderedFeatures([[e.point.x - 6, e.point.y - 6], [e.point.x + 6, e.point.y + 6]], { layers: ['edges-h'] }) : [];
    if (hit.length) { const i = hit[0].properties.i, o = ['F', 'L', 'P', 'X']; U.S.roles[i] = o[(o.indexOf(U.S.roles[i]) + 1) % 4]; regeo(); recalc(true); return; }
    if (map.getZoom() < 15.5) { tell('Acércate más para elegir un lote'); return; } pick(e.lngLat.lng, e.lngLat.lat); });
  map.on('moveend', () => { clearTimeout(U.ovT); U.ovT = setTimeout(overlay, 350); });
  map.on('mouseenter', 'edges-h', () => map.getCanvas().style.cursor = 'pointer'); map.on('mouseleave', 'edges-h', () => map.getCanvas().style.cursor = ''); }
function fit() { const S = U.S, m = U.map; if (!S || !m) return; const xs = S.lonlat.map(p => p[0]), ys = S.lonlat.map(p => p[1]);
  m.fitBounds([[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]], { padding: 90, maxZoom: 18.6, pitch: U.d3 ? 58 : 0, bearing: U.d3 ? -18 : 0, duration: 900 }); }
/* Tras cambiar el tipo de un lindero: vuelve a medir frente y fondo */
function regeo() { const S = U.S, r = S.geo.ring, n = r.length; let fr = 0, main = null; S.roles.forEach((x, i) => { if (x !== 'F') return; const a = r[i], b = r[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]); fr += l; if (!main || l > main.l) main = { a, b, l }; });
  S.geo.frente = fr; S.g.sinFrente = !main; S.geo.fondo = main ? Math.max(...r.map(p => distSeg2(p, main))) : 0; S.g.esquina = false; }
function draw() { const m = U.map, S = U.S; if (!m || !U.mapOk) return; const set = (k, f) => m.getSource(k).setData(FC(f));
  if (!S) { ['vec', 'cons', 'lot', 'env', 'edges'].forEach(k => set(k, [])); return; }
  const poly = (ringLocal, props) => { const c = ringLocal.map(S.pr.back); c.push(c[0]); return { type: 'Feature', properties: props || {}, geometry: { type: 'Polygon', coordinates: [c] } }; };
  set('vec', S.vecinos); set('cons', S.cons.map(f => ({ type: 'Feature', geometry: f.geometry, properties: { h: Math.max(1, +f.properties.CONNPISOS || 1) * 3 } })));
  set('lot', [poly(S.geo.ring)]);
  const r = S.geo.ring; set('edges', r.map((a, i) => ({ type: 'Feature', properties: { i, c: ROLE_COLOR[S.roles[i]] }, geometry: { type: 'LineString', coordinates: [S.pr.back(a), S.pr.back(r[(i + 1) % r.length])] } })));
  const R = U.R, h = S.p.hPiso, cols = [U.acc || '#4FC3F7'];
  set('env', R ? R.e.bands.filter(b => b.poly.length).map((b, k) => poly(b.poly, { b: U.d3 ? b.from * h : 0, h: U.d3 ? b.to * h : 0.2, c: cols[0] })) : []);
  m.setLayoutProperty('cons-x', 'visibility', U.d3 ? 'visible' : 'none'); }
async function overlay() { const m = U.map, o = OVS[U.ov]; if (!m || !U.mapOk) return; const src = m.getSource('ov');
  if (!o || m.getZoom() < 13.5) { src.setData(FC()); return; }
  const b = m.getBounds(), key = U.ov + '|' + [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].map(v => v.toFixed(4)).join(','); U.ovKey = key;
  try { const j = await ags(POT + o.id, { f: 'geojson', geometry: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].join(','), geometryType: 'esriGeometryEnvelope', inSR: 4326, spatialRel: 'esriSpatialRelIntersects', outFields: o.f, outSR: 4326, geometryPrecision: 6 });
    if (U.ovKey !== key) return; m.setPaintProperty('ov-f', 'fill-color', o.col); src.setData(FC(j.features)); } catch (e) { /* capa opcional: se ignora el fallo */ } }

/* ---------- Paneles ---------- */
function shell() { return `<div class="lt-top"><button class="lt-ib" data-la="close" aria-label="Volver a Proyecta" title="Volver">${ic('back')}</button>
  <form class="lt-q" data-la="search">${ic('search')}<input name="q" placeholder="CHIP o dirección · ej. KR 7 62 57" autocomplete="off" enterkeyhint="search" aria-label="CHIP o dirección del lote"><button type="submit">Buscar</button></form></div>
 <div class="lt-main"><div class="lt-panel" data-panel></div>
  <div class="lt-map"><div class="mp"></div><div class="lt-load" data-load hidden></div>
   <div class="lt-tools"><div class="lt-seg" data-bases></div><div class="lt-seg" data-ovs></div><div class="lt-seg" data-d3></div></div>
   <div class="lt-leg"><b>Linderos · toca para cambiar</b>${Object.keys(ROLE_NAME).map(k => `<span><i style="background:${ROLE_COLOR[k]}"></i>${ROLE_NAME[k]}</span>`).join('')}</div></div>
  <div class="lt-tabs" role="tablist">${[['norma', 'Norma'], ['vol', 'Volumen'], ['proy', 'Proyecto']].map(([k, l]) => `<button role="tab" data-la="tab" data-k="${k}">${ic(k)}${l}</button>`).join('')}</div></div>`; }
function tools() { const q = s => U.el.querySelector(s);
  q('[data-bases]').innerHTML = [['osc', 'Oscuro'], ['cla', 'Claro'], ['sat', 'Satélite']].map(([k, l]) => `<button data-la="base" data-k="${k}" aria-pressed="${U.base === k}">${l}</button>`).join('');
  q('[data-ovs]').innerHTML = OVS.map((o, i) => `<button data-la="ov" data-k="${i}" aria-pressed="${U.ov === i}" title="${o ? 'Capa del POT: ' + o.n : 'Sin capa del POT'}">${o ? o.n : 'Sin capa'}</button>`).join('');
  q('[data-d3]').innerHTML = `<button data-la="d3" data-k="1" aria-pressed="${U.d3}">3D</button><button data-la="d3" data-k="0" aria-pressed="${!U.d3}">Planta</button>`;
  U.el.querySelectorAll('.lt-tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.k === U.tab)); }
const kv = rows => '<div class="lt-kv">' + rows.filter(Boolean).map(([l, v]) => `<span>${l}</span><b>${v}</b>`).join('') + '</div>';
function pNorma() { const S = U.S, n = S.norm, pd = S.predio;
  return `<div class="lt-card"><p class="lt-h">${esc(pd.dir || 'Lote ' + S.code)}</p><p class="lt-sub">${[pd.barrio && esc(pd.barrio), n.upl && 'UPL ' + esc(n.upl), pd.chip && 'CHIP ' + esc(pd.chip), pd.n > 1 && pd.n + ' predios (propiedad horizontal)'].filter(Boolean).join(' · ')}</p></div>
  <div class="lt-big"><div><span>Área del lote</span><b>${nf(S.geo.area)} m²</b><small>${pd.aTerr ? 'Catastro: ' + nf(pd.aTerr, 1) + ' m²' : 'medida sobre el plano'}</small></div>
   <div><span>Frente × fondo</span><b>${S.geo.frente ? nf(S.geo.frente, 1) + ' × ' + nf(S.geo.fondo, 1) : '—'}</b><small>metros, aproximado</small></div></div>
  <div class="lt-card"><h3>Norma POT · Decreto 555 de 2021</h3>${n.sinPot ? '<p class="lt-note">No se pudo consultar el mapa del POT. Intenta de nuevo.</p>' : kv([
    ['Tratamiento', esc(TR_NAME[n.tr] || n.trNombre || 'Sin dato')],
    n.tr === 'C' && ['Tipología', n.tip === 'TA' ? 'Aislada' : 'Continua'],
    n.altTxt && ['Altura máxima', esc(n.altTxt) + ' pisos'], (n.tr === 'R' || n.tr === 'D') && ['Altura', 'Resultante de la norma'],
    ['Área de actividad', esc(n.aaCod || '—')], n.tr === 'D' && ['Rango de edificabilidad', esc(n.rango || '—')],
    ['Antejardín', n.tr === 'C' ? (n.antejardinDato ? nf(n.antejardin, 2) + ' m' : 'Sin dato en el mapa') : 'No se exige'],
    ['Índice base', (n.tr === 'C' || n.tr === 'R') ? '1,3' : '—'], ['Clase de suelo', /^URB/i.test(n.suelo) ? 'Urbano' : esc(n.suelo || '—')]])}
   ${n.aa ? `<p class="lt-note">${esc(n.aa)}</p>` : ''}</div>
  <div class="lt-card"><h3>Catastro</h3>${kv([['Valor de referencia del suelo', n.vref ? '$ ' + nf(n.vref) + ' /m²' : 'Sin dato'], n.vref && ['Valor estimado del lote', fM(n.vref * S.geo.area)], pd.aCons && ['Área construida actual', nf(pd.aCons) + ' m²'], ['Código del lote', S.code]])}
   ${n.vref ? `<p class="lt-note">Mediana del valor comercial del suelo en la manzana${n.vrefAno ? ', año ' + n.vrefAno : ''}. No es un avalúo.</p>` : ''}</div>
  <div class="lt-card"><h3>Restricciones y avisos</h3>${S.alertas.length ? S.alertas.map(a => `<div class="lt-al"><i class="n${a.nivel}"></i><div><b>${esc(a.t)}</b><p>${esc(a.d)}</p></div></div>`).join('') : '<p class="lt-note" style="margin:0">Ninguna de las capas consultadas afecta el lote.</p>'}
   ${S.fallos.length ? `<p class="lt-note">${S.fallos.length} consulta(s) no respondieron; puede faltar información.</p>` : ''}</div>
  <p class="lt-note">Prefactibilidad con datos abiertos de Catastro y Planeación. No reemplaza el concepto de norma ni la licencia de la curaduría.</p>`; }
function sl(k, label, min, max, step, unit, help) { const v = U.S.p[k]; return `<div class="lt-f"><label><span>${label}</span><b data-val="${k}">${nf(v, step < 1 ? 1 : 0)} ${unit}</b></label><input type="range" data-lp="${k}" min="${min}" max="${max}" step="${step}" value="${v}" data-u="${unit}" aria-label="${label}">${help ? `<small>${help}</small>` : ''}</div>`; }
function pVol() { const S = U.S, R = U.R, t = S.norm.tr, L = R.L;
  return `<div data-out="volTop"></div>
  <div class="lt-card"><h3>Altura</h3>
   <div class="lt-opt"><button data-la="auto" data-k="1" aria-pressed="${!!S.p.auto}">${t === 'R' || (t === 'D' && L.cap) ? 'Pisos según el índice' : 'Pisos de la norma'}</button><button data-la="auto" data-k="0" aria-pressed="${!S.p.auto}">Elegir pisos</button></div>
   ${S.p.auto ? '' : `<div class="lt-f"><label><span>Pisos</span><b data-val="pisos">${R.N}</b></label><input type="range" data-lp="pisos" min="1" max="${Math.max(L.nMax, R.N, 3)}" step="1" value="${R.N}" data-u="" aria-label="Pisos"></div>`}
   ${sl('hPiso', 'Altura de cada piso', 2.5, 3.8, 0.1, 'm', 'Entre placas. El máximo libre en vivienda es 3,80 m.')}
   ${t === 'R' ? `<h3 style="margin-top:6px">Índice de construcción que se busca</h3><div class="lt-opt">${[['base', 'Base 1,3'], ['5', 'Hasta 5,0'], ['6', 'Hasta 6,0'], ['7', 'Hasta 7,0']].map(([k, l]) => `<button data-la="mod" data-k="${k}" aria-pressed="${S.p.modalidad === k}">${l}</button>`).join('')}</div><p class="lt-note" style="margin-top:-4px">5,0 con licencia directa; 6,0 con esquina de manzana y cesión en sitio mayor a 400 m²; 7,0 con manzana completa (art. 304).</p>` : ''}</div>
  <div class="lt-card"><h3>Aislamientos</h3>
   ${sl('antejardin', 'Antejardín', 0, 10, 0.5, 'm', t === 'C' ? 'Dimensión del mapa CU-5.5 para este lote.' : 'En este tratamiento no se exige; solo por empate con vecinos.')}
   ${sl('anchoVia', 'Ancho de la vía del frente', 0, 60, 1, 'm', 'Opcional. Con vías de hasta 30 m entre paramentos, la fachada no puede pasar de 2,5 veces esa distancia sin retroceder.')}
   <div data-out="sb"></div></div>
  <div class="lt-card"><h3>Obligaciones urbanísticas</h3><div data-out="ob"></div></div>`; }
function oVolTop() { const R = U.R, S = U.S;
  return (R.avis.length ? `<div class="lt-warn">${R.avis.map(a => `<p>${esc(a)}</p>`).join('')}</div>` : '') +
  `<div class="lt-big"><div><span>Pisos</span><b>${R.N}</b><small>${nf(R.e.H, 1)} m de altura</small></div>
   <div><span>Área construida</span><b>${nf(R.built)} m²</b><small>sobre el terreno</small></div>
   <div><span>Índice de construcción</span><b>${nf(R.ic, 2)}</b><small>${R.L.cap ? 'tope ' + nf(R.L.cap, 2) : 'resultante'}</small></div>
   <div><span>Ocupación primer piso</span><b>${nf(R.io * 100)} %</b><small>${nf(R.e.foot)} m²</small></div></div>`; }
function oSb() { const R = U.R, sb = R.sb, h = U.S.p.hPiso, piso = z => 'desde el piso ' + (Math.round(z / h) + 1);
  return kv([['Posterior', sb.post ? nf(sb.post, 1) + ' m' : 'No se exige'], ['Lateral', sb.lat ? nf(sb.lat, 1) + ' m, ' + piso(sb.latFrom) : 'No se exige'], sb.retro ? ['Retroceso de fachada', nf(sb.retro, 1) + ' m sobre los ' + nf(sb.retroFrom, 1) + ' m'] : null,
    ['Planta de los pisos altos', nf((R.e.bands[R.e.bands.length - 1] || {}).area || 0) + ' m²']]) + '<p class="lt-note">Toca un lindero en el mapa para marcarlo como frente, lateral o posterior. En lotes de forma irregular el recorte es aproximado.</p>'; }
function oOb() { const R = U.R, o = R.ob, S = U.S; if (!o) return '<p class="lt-note" style="margin:0">En este tratamiento las cargas se liquidan con las reglas del tratamiento (cesiones de urbanización o norma específica); no se estiman aquí.</p>';
  if (!o.fs) return `<p class="lt-note" style="margin:0">Con índice ${nf(R.ic, 2)} no se generan cesiones por edificabilidad${S.norm.tr === 'C' ? ' (empiezan por encima de 2,0)' : ' (empiezan por encima de 1,3)'}.</p>`;
  return kv([['Cesión para espacio público', nf(o.fs * 100) + ' % del lote'], ['Parte en suelo', nf(o.cs) + ' m² ' + (o.enSitio ? '(en sitio)' : '(se paga, menos de 400 m²)')],
    S.norm.vref && ['Compensación en dinero', fM(o.comp + o.pago)], S.norm.vref && o.redes ? ['Redes locales', fM(o.redes)] : null, S.norm.vref && ['Total estimado', fM(o.total)], o.vis && ['Vivienda social', esc(o.vis)]]) +
   `<p class="lt-note">Estimado con el valor de referencia de Catastro y los factores vigentes este año (arts. 317 a 322). La liquidación oficial la hace la curaduría.</p>`; }
function pTip() { const T = U.S.p.tipos, sp = T.reduce((x, t) => x + (+t.pct || 0), 0);
  return `<div class="lt-tp lt-tph"><span>Área m²</span><span>Mezcla %</span><span></span></div>` + T.map((t, i) => `<div class="lt-tp"><input type="number" inputmode="decimal" min="15" max="250" step="1" value="${t.a}" data-tp="a" data-i="${i}" aria-label="Área de la tipología ${i + 1}"><input type="number" inputmode="decimal" min="0" max="100" step="5" value="${t.pct}" data-tp="pct" data-i="${i}" aria-label="Mezcla de la tipología ${i + 1}"><button data-la="tdel" data-k="${i}" aria-label="Quitar tipología">×</button></div>`).join('')
   + `<div class="lt-opt" style="margin-top:8px"><button data-la="tadd">+ Agregar tipología</button><button data-la="tigual">Mezcla pareja</button></div><p class="lt-note" style="margin:8px 0 0">Los m² de cada tipo se cuentan contra el área vendible. La mezcla suma ${nf(sp)} % y se normaliza sola.</p>`; }
function oMezcla() { const R = U.R, M = R.mz; if (!M.filas.length) return '<p class="lt-warn">Agrega al menos una tipología con área y mezcla mayores a cero.</p>';
  return `<div class="lt-card"><h3>Apartamentos que caben</h3>` + kv(M.filas.map(t => [nf(t.a) + ' m² · ' + nf(t.pct) + ' %', nf(t.und) + ' apto' + (t.und === 1 ? '' : 's') + ' · ' + nf(t.m2) + ' m²']).concat([['Total', nf(M.und) + ' aptos · ' + nf(M.usada) + ' de ' + nf(R.vend) + ' m² vendibles'], ['Área promedio', nf(M.prom, 1) + ' m²'], ['Por piso', nf(R.und / R.N, 1) + ' aptos']])) + '</div>'; }
function pProy() { const S = U.S, pq = PARQ[S.norm.aaCod];
  return `<div data-out="proyTop"></div>
  <div class="lt-card"><h3>Tipologías de apartamento</h3><div data-tp-box>${pTip()}</div></div>
  <div data-out="mezcla"></div>
  <div class="lt-card"><h3>Supuestos del proyecto</h3>
   ${sl('eficiencia', 'Área vendible sobre área construida', 55, 92, 1, '%', 'Lo que queda después de puntos fijos, circulaciones y zonas comunes.')}
   ${sl('computable', 'Área que cuenta para el índice', 60, 100, 1, '%', 'El índice no incluye estacionamientos, circulaciones ni cuartos técnicos (art. 266).')}
   ${sl('parqPct', 'Estacionamientos sobre área construida', 0, 35, 1, '%', pq ? 'Tope de ' + pq.max + ' % para ' + esc(S.norm.aaCod) + '; hasta ' + pq.adic + ' % más con pago compensatorio (art. 389).' : 'Valor por verificar para esta área de actividad (art. 389).')}
   ${sl('m2Cupo', 'Área por cupo, con maniobra', 18, 35, 1, 'm²')}</div>
  <button class="lt-cta" data-la="crear">Crear proyecto en Proyecta con estos datos</button>
  <p class="lt-note">Abre el asistente con las torres, pisos, apartamentos, parqueaderos y valor del lote ya llenos. Puedes cambiarlos antes de guardar.</p>`; }
function oProyTop() { const R = U.R, S = U.S;
  return `<div class="lt-big"><div><span>Área vendible</span><b>${nf(R.vend)} m²</b><small>${nf(R.built)} m² construidos</small></div>
   <div><span>Apartamentos</span><b>${nf(R.und)}</b><small>promedio ${nf(R.mz.prom, 1)} m² en ${R.N} pisos</small></div>
   <div><span>Parqueaderos</span><b>${nf(R.cupos)}</b><small>${nf(R.aParq)} m², tope aproximado</small></div>
   <div><span>Valor del lote</span><b>${R.valorLote ? fM(R.valorLote) : '—'}</b><small>${R.valorLote ? 'referencia Catastro' : 'sin valor de referencia'}</small></div></div>`; }
function panel() { const el = U.el.querySelector('[data-panel]');
  if (U.cands) { el.innerHTML = `<div class="lt-card"><h3>${U.cands.length} lotes coinciden</h3><div class="lt-list">${U.cands.map(c => `<button data-la="cand" data-k="${esc(c.code)}"><b>${esc(c.dir)}</b><small>${[c.barrio, c.n > 1 ? c.n + ' predios' : c.chip].filter(Boolean).map(esc).join(' · ')}</small></button>`).join('')}</div></div>`; return; }
  if (!U.S) { el.innerHTML = `<div class="lt-card"><p class="lt-h">Analiza un lote de Bogotá</p><p class="lt-sub" style="margin-top:6px">Busca por CHIP o dirección, o acércate en el mapa y toca el lote.</p></div>
    <div class="lt-card"><h3>Qué vas a ver</h3><div class="lt-al"><i class="n0"></i><div><b>Norma</b><p>Tratamiento, área de actividad, altura, antejardín y restricciones del POT.</p></div></div>
    <div class="lt-al"><i class="n0"></i><div><b>Volumen</b><p>Pisos, aislamientos, área construible e índices, en 3D sobre el mapa.</p></div></div>
    <div class="lt-al"><i class="n0"></i><div><b>Proyecto</b><p>Apartamentos, parqueaderos y valor del lote, listos para la factibilidad.</p></div></div></div>
    <p class="lt-note">Datos en vivo de Catastro Distrital (IDECA) y de la Secretaría Distrital de Planeación.</p>`; return; }
  el.innerHTML = U.tab === 'norma' ? pNorma() : U.tab === 'vol' ? pVol() : pProy(); outs(); el.scrollTop = 0; }
function outs() { const O = { volTop: oVolTop, sb: oSb, ob: oOb, proyTop: oProyTop, mezcla: oMezcla }; U.el.querySelectorAll('[data-out]').forEach(e => { e.innerHTML = O[e.dataset.out](); }); }
function recalc(full) { if (!U.S) return; U.R = compute(U.S); if (full) panel(); else outs(); draw(); save(); }
function loading(t) { U.busy = !!t; const l = U.el.querySelector('[data-load]'); l.hidden = !t; l.textContent = t || ''; }
async function abrir(code, geom, keep) { loading('Consultando Catastro y POT…'); U.cands = null;
  try { const S = await cargar(code, geom); if (keep && keep.code === code) { Object.assign(S.p, keep.p || {}); if (keep.roles && keep.roles.length === S.roles.length) { S.roles = keep.roles; U.S = S; regeo(); } }
    U.S = S; U.R = compute(S); U.tab = 'norma'; tools(); panel(); draw(); fit(); save(); if (S.norm.sinPot) tell('No respondió el mapa del POT'); }
  catch (e) { tell(e.message || 'No se pudo consultar el lote'); } loading(''); }
async function pick(lng, lat) { loading('Buscando el lote…'); try { const l = await lotAt(lng, lat); if (!l) { tell('Ahí no hay un lote de Catastro'); loading(''); return; } await abrir(l.code, l.geometry); } catch (e) { tell(e.message); loading(''); } }
async function onSearch(q) { if (U.busy) return; loading('Buscando…'); try { const c = await buscar(q); loading('');
    if (!c.length) { tell('No encontré ese CHIP o dirección en Catastro'); return; } if (c.length === 1) return abrir(c[0].code); U.cands = c; panel(); } catch (e) { loading(''); tell(e.message); } }
function save() { try { const S = U.S; if (S) localStorage.setItem('proyecta.lote', JSON.stringify({ code: S.code, p: S.p, roles: S.roles })); } catch (e) { } }
function prefill() { const S = U.S, R = U.R, und = Math.max(1, R.und);
  return { nombre: S.predio.dir ? 'Lote ' + S.predio.dir : '', ciudad: 'Bogotá', pisos: R.N, und, areaApto: Math.round(R.mz.prom), tipos: R.mz.filas.filter(t => t.und > 0).map(t => ({ n: t.a + ' m²', area: t.a, und: t.und })), cupos: R.cupos, lote: Math.round(R.valorLote / 1e6) * 1e6,
    loteInfo: { code: S.code, chip: S.predio.chip, dir: S.predio.dir, area: Math.round(S.geo.area), tratamiento: TR_NAME[S.norm.tr] || S.norm.trNombre, actividad: S.norm.aaCod, pisos: R.N, construida: Math.round(R.built), vendible: Math.round(R.vend), ic: +R.ic.toFixed(2), fecha: new Date().toISOString().slice(0, 10) } }; }
function onClick(e) { const b = e.target.closest('[data-la]'); if (!b || b.tagName === 'FORM') return; const a = b.dataset.la, k = b.dataset.k, S = U.S;
  if (a === 'close') Lote.close();
  else if (a === 'tab') { U.tab = k; U.cands = null; tools(); panel(); }
  else if (a === 'base') { U.base = k; tools(); if (U.map && U.mapOk) U.map.getSource('base').setTiles(tiles(BASES[k])); }
  else if (a === 'ov') { U.ov = +k; tools(); overlay(); if (U.ov && U.map && U.map.getZoom() < 13.5) tell('Acércate para ver la capa'); }
  else if (a === 'd3') { U.d3 = k === '1'; tools(); draw(); if (U.map) U.map.easeTo({ pitch: U.d3 ? 58 : 0, bearing: U.d3 ? -18 : 0, duration: 600 }); }
  else if (a === 'cand') abrir(k);
  else if (!S) return;
  else if (a === 'auto') { S.p.auto = k === '1'; if (!S.p.auto) S.p.pisos = U.R.N; recalc(true); }
  else if (a === 'mod') { S.p.modalidad = k; S.p.auto = true; recalc(true); }
  else if (a === 'tadd') { const T = S.p.tipos, u = T.length ? Math.max(...T.map(t => t.a)) + 10 : 55; T.push({ a: Math.min(250, u), pct: 10 }); tipRender(); }
  else if (a === 'tdel') { S.p.tipos.splice(+k, 1); tipRender(); }
  else if (a === 'tigual') { S.p.tipos.forEach(t => { t.pct = 20; }); tipRender(); }
  else if (a === 'crear') { if (H().crear) H().crear(prefill()); else tell('Abre el analizador desde Proyecta para crear el proyecto'); } }
function tipRender() { const b = U.el.querySelector('[data-tp-box]'); if (b) b.innerHTML = pTip(); recalc(false); }
function onInput(e) { const tp = e.target.closest('[data-tp]'); if (tp && U.S) { const t = U.S.p.tipos[+tp.dataset.i]; if (t) { t[tp.dataset.tp] = Math.max(0, +tp.value || 0); recalc(false); } return; } const i = e.target.closest('[data-lp]'); if (!i || !U.S) return; const k = i.dataset.lp, v = +i.value; U.S.p[k] = v;
  const o = U.el.querySelector('[data-val="' + k + '"]'); if (o) o.textContent = nf(v, +i.step < 1 ? 1 : 0) + (i.dataset.u ? ' ' + i.dataset.u : '');
  cancelAnimationFrame(U.raf); U.raf = requestAnimationFrame(() => recalc(false)); }

const Lote = { open(opt) { opt = opt || {};
    if (!U.el) { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); const el = U.el = document.createElement('section'); el.id = 'lote'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Analizador de lotes de Bogotá'); el.innerHTML = shell(); document.body.appendChild(el);
      el.addEventListener('click', onClick); el.addEventListener('input', onInput); el.addEventListener('submit', e => { e.preventDefault(); const q = e.target.elements.q; q.blur(); onSearch(q.value); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && Lote.isOpen() && !/INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) Lote.close(); });
      tools(); panel(); loadLib().then(initMap).catch(e => tell(e.message)); }
    U.el.hidden = false; document.body.classList.add('loteon'); if (U.map) setTimeout(() => U.map.resize(), 30);
    if (!U.S && !U.busy) { let last = null; try { last = JSON.parse(localStorage.getItem('proyecta.lote') || 'null'); } catch (e) { }
      const code = opt.code || (last && last.code); if (code) abrir(code, null, last); } },
  close() { if (U.el) U.el.hidden = true; document.body.classList.remove('loteon'); },
  isOpen: () => !!(U.el && !U.el.hidden), _: { projector, normRing, area, inset, classify, setbacks, envelope, compute, limits, oblig, defaults, parseAlt, trCode, normDir, postC, postR, alertas, U } };
G.Lote = Lote; if (typeof module !== 'undefined' && module.exports) module.exports = Lote;
})(typeof window !== 'undefined' ? window : globalThis);
