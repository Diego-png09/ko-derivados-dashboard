/* Paso 9 · Dashboard KO. Lee window.DATA (data.js, generado por build_data.py).
   Modos: normal (público), ?presenter=1 (presentador), ?print=1 (PDF), ?sync=0 (sin sincronización). */
(function () {
  "use strict";
  const D = window.DATA;

  // ------------------------------------------------------------ configuración
  const SYNC = { servidor: "https://ntfy.sh", tema: "ko-derivados-9c31ef72c6c10002" };
  const RECOMENDACION_BORRADOR = true; // poner en false cuando el equipo valide la pantalla 8
  const q = new URLSearchParams(location.search);
  const PRESENTADOR = q.get("presenter") === "1";
  const IMPRIMIR = q.get("print") === "1";
  const CON_SYNC = !IMPRIMIR && q.get("sync") !== "0" && location.protocol.startsWith("http");

  // ------------------------------------------------------------ formato
  const nf = (v, d) => Number(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  const fm = {
    musd: (v, d = 1) => "USD " + nf(v / 1e6, d) + " M",
    meur: (v, d = 1) => "EUR " + nf(v / 1e6, d) + " M",
    usd: (v) => "USD " + nf(v, 0),
    pct: (v, d = 1) => nf(v * 100, d) + "%",
    n: (v, d = 0) => nf(v, d),
    txt: (v) => String(v),
  };
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  // cifra con su fuente (tooltip)
  const c = (o, f = "n", ...a) => `<span class="cifra" tabindex="0" data-f="${esc(o.f)}">${fm[f](o.v, ...a)}</span>`;
  const kpi = (cl, et, va, de = "") => `<div class="kpi ${cl}"><div class="et">${et}</div><div class="va">${va}</div><div class="de">${de}</div></div>`;
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const T = D.tam_6E.v;
  const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const mesES = (m) => MES[+m.slice(5, 7) - 1] + " " + m.slice(0, 4);

  // ------------------------------------------------------------ Plotly común
  function base(extra = {}) {
    const tinta = css("--tinta"), linea = css("--linea");
    return Object.assign({
      margin: { l: 56, r: 14, t: 30, b: 48 }, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: "-apple-system, Segoe UI, Roboto, Arial, sans-serif", size: 12, color: tinta },
      xaxis: { gridcolor: linea, zerolinecolor: linea }, yaxis: { gridcolor: linea, zerolinecolor: linea },
      legend: { orientation: "h", x: 0, y: 1.02, yanchor: "bottom" }, hoverlabel: { font: { size: 12 } },
    }, extra);
  }
  const CONF = { displayModeBar: false, responsive: true };
  function dibuja(id, trazos, lay) {
    const el = document.getElementById(id);
    if (!el || !window.Plotly) return;
    const conf = IMPRIMIR ? Object.assign({ staticPlot: true }, CONF) : CONF;
    Plotly.react(el, trazos, base(lay), conf);
  }
  const fuente = (arr) => arr.map((o) => "fuente: " + o.f);

  // ------------------------------------------------------------ pantallas
  const P = [];

  // 1 · El riesgo
  P.push({
    t: "El riesgo",
    html: () => {
      const et = D.exposicion_total, cr = D.costo_riesgo;
      return `
      <h1>KO recibirá cerca de EUR 1,670 M entre enero y junio de 2027</h1>
      <p class="mensaje">Si el euro cae al percentil 5, el ingreso en USD queda ${c(cr.base, "musd")} por debajo del presupuesto: es el costo en riesgo del semestre.</p>
      <div class="kpis">
        ${kpi("r", "EUR por recibir, ene–jun 2027 (base)", c(et.eur_base, "meur"), `rango ${c(et.eur_min, "meur", 0)} a ${c(et.eur_max, "meur", 0)}`)}
        ${kpi("", "Presupuesto en USD (EUR × F₀)", c(cr.presupuesto, "musd"), `ingreso a P5: ${c(cr.ingreso_P5, "musd")}`)}
        ${kpi("r", "Costo en riesgo (95 %)", c(cr.base, "musd"), `mín. ${c(cr.min, "musd")} · máx. ${c(cr.max, "musd")}`)}
        ${kpi("", "Materialidad", c(D.materialidad, "pct", 2), `de la utilidad de operación H1 2026 (${c(D.utilidad_op_H1_2026, "musd", 0)})`)}
      </div>
      <div class="rejilla">
        <div class="tarjeta"><h3>EUR por mes: base, mínimo y máximo</h3><div id="g1a" class="graf"></div>
          <p class="nota">Ingresos de KO en la eurozona estimados de abajo hacia arriba (embotelladores CCEP y CCHBC, Paso 2).</p></div>
        <div class="tarjeta"><h3>Costo en riesgo por mes (base, USD)</h3><div id="g1b" class="graf"></div>
          <p class="nota">Costo en riesgo = EUR × (F₀ − P5), con P5 = F₀·e^(−1.645·σ·√T) y σ = ${c(D.sigma_eur, "pct", 2)} (Paso 4).</p></div>
      </div>`;
    },
    g: () => {
      const e = D.exposicion, m = e.map((x) => mesES(x.mes));
      dibuja("g1a", [
        { type: "bar", name: "Base", x: m, y: e.map((x) => x.base.v / 1e6), marker: { color: css("--acento") },
          error_y: { type: "data", symmetric: false, array: e.map((x) => (x.max.v - x.base.v) / 1e6), arrayminus: e.map((x) => (x.base.v - x.min.v) / 1e6), color: css("--suave") },
          customdata: e.map((x) => [x.min.v / 1e6, x.max.v / 1e6, x.base.f]),
          hovertemplate: "%{x}<br>Base EUR %{y:,.1f} M<br>Mín. %{customdata[0]:,.1f} · Máx. %{customdata[1]:,.1f}<br>fuente: %{customdata[2]}<extra></extra>" },
      ], { yaxis: { title: { text: "millones de EUR" }, gridcolor: css("--linea") }, showlegend: false });
      const cr = D.costo_riesgo_mes;
      dibuja("g1b", [{ type: "bar", x: cr.map((x) => mesES(x.mes)), y: cr.map((x) => x.cer.v / 1e6), marker: { color: css("--sin") }, cliponaxis: false,
        customdata: fuente(cr.map((x) => x.cer)), text: cr.map((x) => nf(x.cer.v / 1e6, 1)), textposition: "outside",
        hovertemplate: "%{x}<br>USD %{y:,.1f} M<br>%{customdata}<extra></extra>" }],
        { yaxis: { title: { text: "millones de USD" }, gridcolor: css("--linea") }, showlegend: false });
    },
  });

  // 2 · Por qué el euro
  P.push({
    t: "Por qué el euro",
    html: () => {
      const k = D.cadena;
      const filas = D.candidatos.map((x) => `<tr><td>${esc(x.activo)} <span class="etiq">${esc(x.futuro)}</span></td>
        <td>${x.vol.v == null ? "—" : c(x.vol, "pct", 1)}</td><td>${x.ia.v == null ? "—" : c(x.ia, "n")}</td>
        <td class="txt"><span class="etiq ${x.estado.startsWith("Elegido") ? "si" : "no"}" title="fuente: ${esc(x.estado_f)}">${esc(x.estado)}</span></td></tr>`).join("");
      return `
      <h1>El euro es el riesgo más grande que KO puede medir y cubrir</h1>
      <p class="mensaje">KO vende concentrado a sus embotelladores europeos, que le pagan en EUR. El maíz y el azúcar se evaluaron y se descartaron: no hay datos públicos para medir esa exposición.</p>
      <div class="tarjeta" style="margin-bottom:14px"><h3>Cadena de suministro, resumida</h3>
        <div class="cadena">
          <div class="eslabon"><b>KO (TCCC)</b>Vende concentrado y jarabes; ${c(k.ingresos_intl_pct, "pct", 1)} de sus ingresos 2025 viene de fuera de EE. UU.</div>
          <div class="flecha">&#8594;</div>
          <div class="eslabon"><b>Embotelladores europeos</b>CCEP compró a TCCC ${c(k.ccep_compras, "meur", 0)} y CCHBC ${c(k.cchbc_compras, "meur", 1)} en 2025.</div>
          <div class="flecha">&#8594;</div>
          <div class="eslabon"><b>Pago en EUR</b>Europa ≈ ${c(k.europa_en_emea.base, "pct", 1)} de EMEA (rango ${c(k.europa_en_emea.min, "pct", 1)}–${c(k.europa_en_emea.max, "pct", 0)}); eurozona = ${c(k.eurozona_en_europa, "pct", 1)} de Europa.</div>
          <div class="flecha">&#8594;</div>
          <div class="eslabon"><b>Conversión a USD</b>KO ya cubre "principally euro" con forwards y opciones (nocional FX ${c(k.nocional_fx, "musd", 0)}). Deuda en EUR ${c(k.deuda_eur, "musd", 0)}: cobertura natural parcial.</div>
        </div>
        <p class="nota">Insumos: el JMAF lo compran sobre todo los embotelladores vía CCBSS; PET y diésel se relacionan con el petróleo (10-K, Item 7A), por eso CL es el activo de la estrategia C.</p>
      </div>
      <div class="tarjeta"><h3>Activos evaluados</h3><div class="tabla-env"><table>
        <thead><tr><th>Activo</th><th>Vol. anual</th><th>Interés abierto</th><th>Estado</th></tr></thead><tbody>${filas}</tbody></table></div>
        <p class="nota">Volatilidad semanal × √52 (10-nov-2023 a 13-nov-2026) e interés abierto al 13-nov-2026 (Paso 1).</p></div>`;
    },
  });

  // 3 · ¿El futuro sirve?
  P.push({
    t: "¿El futuro sirve?",
    html: () => {
      const r = Object.fromEntries(D.regresion.filter((x) => x.version === "sin roll").map((x) => [x.spot, x]));
      return `
      <h1>Sí: el futuro 6E explica ${c(D.R2, "pct", 1)} de la variación del euro</h1>
      <p class="mensaje">Con el spot oficial de FRED, la razón de cobertura óptima es h* = ${c(D.h_estrella, "n", 3)}. El spot de Yahoo, tomado a otra hora, daba una base falsa y un R² de solo ${c(r.YAHOO.R2, "n", 3)}.</p>
      <div class="kpis">
        ${kpi("a", "h* (ΔS = a + h*·ΔF, FRED)", c(D.h_estrella, "n", 4), `error estándar ${c(r.FRED.ee, "n", 4)}; se usa ${c(D.h_usada, "n", 3)}`)}
        ${kpi("a", "R²", c(D.R2, "n", 3), `BCE ${c(r.BCE.R2, "n", 3)} · Yahoo ${c(r.YAHOO.R2, "n", 3)}`)}
        ${kpi("a", "Baja de la desviación estándar", c(D.baja_desv, "pct", 1), "1 − √(1 − R²)")}
        ${kpi("", "Desv. est. de la base S − F", c(D.base_desv[0].desv, "n", 5), `Yahoo ${c(D.base_desv[2].desv, "n", 5)}`)}
      </div>
      <div class="rejilla">
        <div class="tarjeta"><h3>Curva 6E al 13-nov-2026: contango</h3><div id="g3a" class="graf"></div>
          <p class="nota">r_USD ${c(D.tasas.usd_3m, "pct", 2)} > r_EUR ${c(D.tasas.eur_3m, "pct", 2)} (3 meses): el euro cotiza con premio a plazo, lo que favorece a quien vende EUR a futuro.</p></div>
        <div class="tarjeta"><h3>Corrección del spot: base S − F en las semanas con saltos</h3><div id="g3b" class="graf"></div>
          <p class="nota">Con Yahoo, la base salta ±0.01; con FRED (mediodía de Nueva York) queda casi siempre en ±0.003.</p></div>
      </div>`;
    },
    g: () => {
      const cu = D.curva;
      dibuja("g3a", [
        { type: "scatter", mode: "lines+markers", name: "Liquidación CME", x: cu.map((x) => x.contrato), y: cu.map((x) => x.F.v), line: { color: css("--a"), width: 3 },
          customdata: fuente(cu.map((x) => x.F)), hovertemplate: "%{x}: %{y:.5f}<br>%{customdata}<extra></extra>" },
        { type: "scatter", mode: "lines", name: "Paridad de tasas", x: cu.map((x) => x.contrato), y: cu.map((x) => x.paridad.v), line: { color: css("--sin"), dash: "dot" },
          customdata: fuente(cu.map((x) => x.paridad)), hovertemplate: "%{x}: %{y:.5f}<br>%{customdata}<extra></extra>" },
        { type: "scatter", mode: "lines", name: "Spot 13-nov (" + nf(D.spot_13nov.v, 5) + ")", x: [cu[0].contrato, cu[cu.length - 1].contrato], y: [D.spot_13nov.v, D.spot_13nov.v],
          line: { color: css("--acento"), dash: "dash", width: 1.5 }, hovertemplate: "fuente: " + D.spot_13nov.f + "<extra></extra>" },
      ], { yaxis: { title: { text: "USD por EUR" }, tickformat: ".3f", gridcolor: css("--linea") } });
      const s = D.saltos_yahoo;
      dibuja("g3b", [
        { type: "bar", name: "Yahoo", x: s.map((x) => x.semana), y: s.map((x) => x.yahoo.v), marker: { color: css("--sin") },
          customdata: fuente(s.map((x) => x.yahoo)), hovertemplate: "%{x}: %{y:+.4f}<br>%{customdata}<extra></extra>" },
        { type: "bar", name: "FRED", x: s.map((x) => x.semana), y: s.map((x) => x.fred.v), marker: { color: css("--a") },
          customdata: fuente(s.map((x) => x.fred)), hovertemplate: "%{x}: %{y:+.4f}<br>%{customdata}<extra></extra>" },
      ], { barmode: "group", yaxis: { title: { text: "S − F (USD por EUR)" }, tickformat: "+.3f", gridcolor: css("--linea") }, xaxis: { type: "category", tickangle: -45 }, margin: { l: 60, r: 10, t: 30, b: 80 } });
    },
  });

  // 4 · A futuros
  P.push({
    t: "Alternativa A: futuros",
    html: () => {
      const t = D.A_total, l = D.liquidez;
      const ia = D.A_ia.map((x) => `<tr${x.pct.v > 1 ? ' class="res"' : ""}><td>${x.contrato}</td><td>${c(x.N, "n")}</td><td>${c(x.ia, "n")}</td><td>${c(x.pct, "pct", 0)}</td></tr>`).join("");
      const sr = D.stack_roll.map((x) => `<tr><td>${x.roll}</td><td>${x.fecha}</td><td>${c(x.contratos, "n")}</td><td>${c(x.spread, "n", 5)}</td><td>${c(x.resultado, "musd", 2)}</td></tr>`).join("");
      return `
      <h1>A: vender ${c(t.N, "n")} futuros 6E cubre ${c(t.cob, "pct", 1)} de los EUR</h1>
      <p class="mensaje">N = p × h* × EUR / 125,000, con p = ${c(D.p, "pct", 2)} (EUR mínimo ÷ base). No se paga prima: el costo es la liquidez para margen y pérdidas diarias.</p>
      <div class="kpis">
        ${kpi("a", "Contratos en corto", c(t.N, "n"), `EUR cubiertos ${c(t.eur_cub, "meur", 1)}`)}
        ${kpi("a", "Margen inicial (coberturista)", c(t.margen, "musd", 2), `al 110 % (simulador): ${c(l.margen_110, "musd", 1)}`)}
        ${kpi("r", "Liquidez máxima, backtest", c(l.bt_necesidad_100, "musd", 1), `margen + mayor pérdida acumulada (${c(l.bt_perdida, "musd", 1)})`)}
        ${kpi("r", "Liquidez máxima, P95 Montecarlo", c(l.mc_medio_100, "musd", 1), `σ alta: ${c(l.mc_alto_100, "musd", 1)}`)}
      </div>
      <div class="rejilla">
        <div class="tarjeta"><h3>Necesidad de liquidez (margen 100 %)</h3><div id="g4a" class="graf"></div></div>
        <div class="tarjeta"><h3>Ejecución: N frente al interés abierto</h3>
          <div class="tabla-env"><table><thead><tr><th>Contrato</th><th>N</th><th>Interés abierto</th><th>N / IA</th></tr></thead><tbody>${ia}</tbody></table></div>
          <p class="nota">ECM27 pediría más contratos que todo su interés abierto. Plan: <b>stack and roll</b> desde DEC 26 (IA ${c(D.A_dec26_ia, "n")}).</p>
          <h3 style="margin-top:12px">Stack and roll (posición corta, curva en contango)</h3>
          <div class="tabla-env"><table><thead><tr><th>Roll</th><th>Fecha</th><th>Contratos</th><th>Spread</th><th>Resultado</th></tr></thead><tbody>${sr}
          <tr class="res"><td>Total</td><td></td><td></td><td></td><td>${c(D.stack_roll_total, "musd", 2)}</td></tr></tbody></table></div>
          <p class="nota">A favor de la posición corta; ya está incluido en los F₀, no es ganancia adicional. Sin comisiones ni impacto de mercado.</p></div>
      </div>`;
    },
    g: () => {
      const l = D.liquidez;
      const it = [["Margen inicial", l.margen_100], ["Backtest", l.bt_necesidad_100], ["P95 σ media", l.mc_medio_100], ["P95 σ alta", l.mc_alto_100]];
      dibuja("g4a", [{ type: "bar", orientation: "h", y: it.map((x) => x[0]), x: it.map((x) => x[1].v / 1e6), marker: { color: [css("--sin"), css("--a"), css("--acento"), css("--acento")] },
        text: it.map((x) => "USD " + nf(x[1].v / 1e6, 1) + " M"), textposition: "auto", customdata: fuente(it.map((x) => x[1])),
        hovertemplate: "%{y}: USD %{x:,.1f} M<br>%{customdata}<extra></extra>" }],
        { xaxis: { title: { text: "millones de USD" }, gridcolor: css("--linea") }, yaxis: { autorange: "reversed" }, margin: { l: 100, r: 14, t: 10, b: 48 }, showlegend: false });
    },
  });

  // 5 · B puts
  P.push({
    t: "Alternativa B: puts",
    html: () => {
      const bt = D.B_total;
      const fil = D.B.map((x) => `<tr><td>${x.codigo} ${x.tipo}</td><td>${c(x.K, "n", 3)}</td><td>${c(x.N, "n")}</td><td>${c(x.prima, "n", 4)}</td><td>${c(x.b76, "n", 5)}</td><td>${c(x.binom, "n", 5)}</td><td>${c(x.iv, "pct", 2)}</td><td>${c(x.piso, "n", 4)}</td><td>${c(x.costo, "musd", 2)}</td></tr>`).join("");
      return `
      <h1>B: las puts fijan un piso y conservan la subida del euro</h1>
      <p class="mensaje">Las puts ATM aseguran ≈ ${c(D.B[0].piso, "n", 4)} USD por EUR cubierto, con una prima de ${c(bt.ATM.costo, "musd", 1)}. Las OTM (strike 1.050) cuestan ${c(bt.OTM.costo, "musd", 1)}, pero el piso baja a ≈ ${c(D.B[1].piso, "n", 4)}.</p>
      <div class="kpis">
        ${kpi("b", "Primas ATM (dos entregas)", c(bt.ATM.costo, "musd", 1), `ingreso mínimo EUR cubiertos ${c(bt.ATM.ingreso_min, "musd", 1)}`)}
        ${kpi("b", "Primas OTM (strike 1.050)", c(bt.OTM.costo, "musd", 1), `ingreso mínimo EUR cubiertos ${c(bt.OTM.ingreso_min, "musd", 1)}`)}
        ${kpi("", "Contratos por entrega", c(D.B[0].N, "n") + " / " + c(D.B[2].N, "n"), "EUUH27 (ene–mar) / EUUM27 (abr–jun)")}
        ${kpi("r", "Riesgo de fecha", c(D.B_vencimientos.EUUH27, "txt") + " · " + c(D.B_vencimientos.EUUM27, "txt"), "vencen antes de los flujos de marzo y junio")}
      </div>
      <div class="rejilla d3">
        <div class="tarjeta"><h3>Puts europeas sobre 6E</h3><div class="tabla-env"><table>
          <thead><tr><th>Opción</th><th>Strike</th><th>N</th><th>Prima mercado</th><th>Black-76</th><th>Binomial</th><th>Vol. impl.</th><th>Piso</th><th>Costo</th></tr></thead><tbody>${fil}</tbody></table></div>
          <p class="nota">Black-76 y binomial con σ histórica 6.89 %. Las ATM de mercado son más baratas que la teórica (vol. implícita ≈ 6.2–6.6 %); las OTM, más caras (≈ 7.7–7.9 %): sonrisa de volatilidad.</p></div>
        <div class="tarjeta"><h3>Prima de mercado vs teórica (USD por EUR)</h3><div id="g5a" class="graf"></div></div>
      </div>`;
    },
    g: () => {
      const b = D.B, x = b.map((o) => o.codigo + " " + o.tipo);
      dibuja("g5a", [
        { type: "bar", name: "Mercado", x, y: b.map((o) => o.prima.v), marker: { color: css("--b") }, customdata: fuente(b.map((o) => o.prima)), hovertemplate: "%{x}: %{y:.4f}<br>%{customdata}<extra></extra>" },
        { type: "bar", name: "Black-76 (σ hist.)", x, y: b.map((o) => o.b76.v), marker: { color: css("--sin") }, customdata: fuente(b.map((o) => o.b76)), hovertemplate: "%{x}: %{y:.5f}<br>%{customdata}<extra></extra>" },
      ], { barmode: "group", yaxis: { tickformat: ".3f", gridcolor: css("--linea") } });
    },
  });

  // 6 · Tablero
  let medida = "P5", tipoB = "ATM", eurusd = null;
  function tablaTablero() {
    const filas = D.tablero[medida], kB = tipoB === "ATM" ? "B_ATM" : "B_OTM";
    const m1 = (o) => `<span class="cifra" tabindex="0" data-f="${esc(o.f)}">${nf(o.v / 1e6, 1)}</span>`;
    return filas.map((r) => {
      const mx = Math.max(r.sin.v, r.A.v, r[kB].v);
      const td = (o) => `<td class="${o.v === mx ? "mejor" : ""}">${m1(o)}</td>`;
      return `<tr><td>${esc(r.escenario)}</td>${td(r.sin)}${td(r.A)}${td(r[kB])}<td>${m1(r.C)}</td></tr>`;
    }).join("");
  }
  function ingresos(S) {
    const tam = T, ex = D.exposicion, A = D.A;
    let sin = 0, a = 0;
    ex.forEach((m, i) => { sin += m.base.v * S; a += A[i].N.v * tam * (A[i].F0.v - S); });
    let b = 0;
    D.B.filter((o) => o.tipo === tipoB).forEach((o) => { b += o.N.v * tam * (Math.max(o.K.v - S, 0) - o.prima.v); });
    return { sin, A: sin + a, B: sin + b };
  }
  P.push({
    t: "Tablero comparativo",
    html: () => {
      const f0 = D.A[0].F0.v;
      eurusd = eurusd || f0;
      return `
      <h1>Con futuros, el peor caso al 95 % es el más alto en los cinco escenarios</h1>
      <p class="mensaje">Ingreso de KO en ene–jun 2027 (millones de USD; más es mejor). En C, ganancia o pérdida del spread. La fila de estrés es un solo escenario; las demás vienen de 100,000 semestres simulados.</p>
      <div class="rejilla d3">
        <div class="tarjeta"><div class="control">
            <div class="seg" id="sel-medida"><button data-v="P5" class="on">P5 (peor caso 95 %)</button><button data-v="media">Media</button></div>
            <div class="seg" id="sel-b"><button data-v="ATM" class="on">Puts ATM</button><button data-v="OTM">Puts OTM</button></div></div>
          <div class="tabla-env"><table><thead><tr><th>Escenario</th><th><span class="largo">Sin cobertura</span><span class="corto">Sin cob.</span></th><th><span class="largo">Futuros (A)</span><span class="corto">A</span></th><th><span class="largo">Opciones (B)</span><span class="corto">B</span></th><th><span class="largo">Especulación (C)</span><span class="corto">C</span></th></tr></thead>
          <tbody id="tb6">${tablaTablero()}</tbody></table></div>
          <p class="nota">En verde, el mayor ingreso de KO por fila. Estrés: EUR −11.89 % y CL −41.15 % en 26 semanas (2022). σ del EUR: alta 10.98 %, media 6.89 %, baja 4.61 %.</p></div>
        <div class="tarjeta"><h3>Tú decides: precio del EUR/USD al cierre</h3>
          <div class="control"><input type="range" id="r6" min="0.95" max="1.30" step="0.005" value="${eurusd}"><output id="o6">${nf(eurusd, 3)}</output></div>
          <div class="resultados" id="res6"></div>
          <div id="g6" class="graf"></div>
          <p class="nota">Ilustración con las cifras del modelo: el mismo precio para todos los meses, spot = futuro y primas pagadas al inicio (supuestos de la gráfica del Paso 5a). Ingreso del semestre en millones de USD.</p></div>
      </div>`;
    },
    g: () => {
      const pinta = () => {
        const S = eurusd, r = ingresos(S);
        document.getElementById("o6").textContent = nf(S, 3);
        document.getElementById("res6").innerHTML =
          `<div><div class="et">Sin cobertura</div><div class="va">${fm.musd(r.sin)}</div></div>` +
          `<div><div class="et">Con A (futuros)</div><div class="va" style="color:var(--a)">${fm.musd(r.A)}</div></div>` +
          `<div><div class="et">Con B (puts ${tipoB})</div><div class="va" style="color:var(--b)">${fm.musd(r.B)}</div></div>`;
        const xs = []; for (let s = 0.95; s <= 1.3001; s += 0.005) xs.push(+s.toFixed(3));
        const ys = xs.map(ingresos);
        dibuja("g6", [
          { type: "scatter", mode: "lines", name: "Sin cobertura", x: xs, y: ys.map((o) => o.sin / 1e6), line: { color: css("--sin"), width: 2 } },
          { type: "scatter", mode: "lines", name: "A futuros", x: xs, y: ys.map((o) => o.A / 1e6), line: { color: css("--a"), width: 3 } },
          { type: "scatter", mode: "lines", name: "B puts " + tipoB, x: xs, y: ys.map((o) => o.B / 1e6), line: { color: css("--b"), width: 3 } },
        ], { xaxis: { title: { text: "EUR/USD al cierre" }, gridcolor: css("--linea") }, yaxis: { title: { text: "millones de USD" }, gridcolor: css("--linea") },
          shapes: [{ type: "line", x0: S, x1: S, yref: "paper", y0: 0, y1: 1, line: { color: css("--acento"), dash: "dot" } }], margin: { l: 56, r: 10, t: 30, b: 48 } });
      };
      const r6 = document.getElementById("r6");
      r6.oninput = () => { eurusd = +r6.value; pinta(); };
      const seg = (id, set) => document.querySelectorAll(`#${id} button`).forEach((b) => {
        b.classList.toggle("on", b.dataset.v === (id === "sel-medida" ? medida : tipoB));
        b.onclick = () => { set(b.dataset.v); document.getElementById("tb6").innerHTML = tablaTablero(); seg("sel-medida", (v) => (medida = v)); seg("sel-b", (v) => (tipoB = v)); pinta(); };
      });
      seg("sel-medida", (v) => (medida = v)); seg("sel-b", (v) => (tipoB = v));
      pinta();
    },
  });

  // 7 · Estrategia C
  let cl = null;
  function neto(S) {
    const k = D.C, bbl = k.barriles.v, pn = k.prima1.v - k.prima2.v;
    const bruto = (Math.max(S - k.K1.v, 0) - Math.max(S - k.K2.v, 0)) * bbl;
    return { bruto, prima: -pn * bbl, neto: bruto - pn * bbl };
  }
  P.push({
    t: "Estrategia C",
    html: () => {
      const k = D.C, bt = D.C_backtest;
      cl = cl || k.F0.v;
      const mc = D.C_mc_6.map((x) => `<tr><td>σ ${x.sigma}</td><td>${c(x.media, "musd", 1)}</td><td>${c(x.P5, "musd", 1)}</td><td>${c(x.P95, "musd", 1)}</td></tr>`).join("");
      const cand = D.C_mc_5b.map((x, i) => `<tr${i === 2 ? ' class="res"' : ""}><td>${x.estrategia}</td><td>${c(x.E_hist, "musd", 2)}</td><td>${c(x.E_impl, "musd", 2)}</td><td>${c(x.P_hist, "pct", 1)}</td></tr>`).join("");
      return `
      <h1>C: bull call spread 84/97 sobre petróleo, con pérdida acotada a la prima</h1>
      <p class="mensaje">Se compra la call 84 y se vende la 97 (LOH27, vence el ${c(k.vencimiento, "txt")}): ${c(k.contratos, "n")} spreads con un presupuesto de USD 10 M. La volatilidad implícita (${c(D.iv_atm, "pct", 1)}) supera a la histórica (${c(D.vol_hist_cl, "pct", 1)}), y el spread vende la call más cara de la sonrisa.</p>
      <div class="kpis">
        ${kpi("c", "Prima neta pagada (pérdida máxima)", c(k.prima_total, "musd", 2), `${c(k.prima1, "n", 2)} − ${c(k.prima2, "n", 2)} USD/bbl`)}
        ${kpi("c", "Ganancia máxima (CL ≥ 97)", c(k.gan_max, "musd", 2), `equilibrio en ${c(k.equilibrio, "n", 2)} USD/bbl`)}
        ${kpi("c", "Resultado esperado (σ histórica)", c(D.C_mc_5b[2].E_hist, "musd", 2), `σ implícita: ${c(D.C_mc_5b[2].E_impl, "musd", 2)} · P(ganar) ${c(D.C_mc_5b[2].P_hist, "pct", 1)}`)}
        ${kpi("r", "Backtest (abierto el 15-may-2026)", c(bt.resultado, "musd", 1), `CL ${c(bt.CL_ini, "n", 2)} → ${c(bt.CL_fin, "n", 2)}, debajo del strike ${c(bt.K1, "n", 1)}`)}
      </div>
      <div class="rejilla">
        <div class="tarjeta"><h3>Tú decides: precio de CL al vencimiento</h3>
          <div class="control"><input type="range" id="r7" min="50" max="130" step="0.5" value="${cl}"><output id="o7">${nf(cl, 2)}</output></div>
          <div class="resultados" id="res7"></div>
          <div id="g7a" class="graf"></div></div>
        <div class="tarjeta"><h3>Volatilidad implícita (sonrisa) vs histórica</h3><div id="g7b" class="graf"></div>
          <div class="tabla-env"><table><thead><tr><th>Montecarlo (Paso 6)</th><th>Media</th><th>P5</th><th>P95</th></tr></thead><tbody>${mc}</tbody></table></div>
          <div class="tabla-env" style="margin-top:8px"><table><thead><tr><th>Candidatas (USD 10 M)</th><th>E[res.] σ hist.</th><th>E[res.] σ impl.</th><th>P(ganar)</th></tr></thead><tbody>${cand}</tbody></table></div></div>
      </div>`;
    },
    g: () => {
      const pinta = () => {
        const r = neto(cl);
        document.getElementById("o7").textContent = nf(cl, 2);
        document.getElementById("res7").innerHTML =
          `<div><div class="et">Pago de las calls</div><div class="va">${fm.musd(r.bruto, 2)}</div></div>` +
          `<div><div class="et">Prima pagada</div><div class="va" style="color:var(--malo)">${fm.musd(r.prima, 2)}</div></div>` +
          `<div><div class="et">Resultado neto</div><div class="va" style="color:${r.neto >= 0 ? "var(--ok)" : "var(--malo)"}">${fm.musd(r.neto, 2)}</div></div>`;
        const xs = []; for (let s = 50; s <= 130; s += 0.5) xs.push(s);
        const ys = xs.map(neto);
        dibuja("g7a", [
          { type: "scatter", mode: "lines", name: "Pago bruto", x: xs, y: ys.map((o) => o.bruto / 1e6), line: { color: css("--sin"), width: 2 } },
          { type: "scatter", mode: "lines", name: "Prima", x: xs, y: ys.map((o) => o.prima / 1e6), line: { color: css("--acento"), dash: "dash" } },
          { type: "scatter", mode: "lines", name: "Neto", x: xs, y: ys.map((o) => o.neto / 1e6), line: { color: css("--c"), width: 3 } },
        ], { xaxis: { title: { text: "CL al vencimiento (USD/bbl)" }, gridcolor: css("--linea") }, yaxis: { title: { text: "millones de USD" }, gridcolor: css("--linea") },
          shapes: [{ type: "line", x0: cl, x1: cl, yref: "paper", y0: 0, y1: 1, line: { color: css("--tinta"), dash: "dot" } }], margin: { l: 56, r: 10, t: 30, b: 48 } });
      };
      const r7 = document.getElementById("r7");
      r7.oninput = () => { cl = +r7.value; pinta(); };
      pinta();
      const s = D.sonrisa;
      dibuja("g7b", [
        { type: "scatter", mode: "lines", name: "Implícita call", x: s.K, y: s.iv_call.map((v) => v * 100), line: { color: css("--c"), width: 3 }, hovertemplate: "K %{x}: %{y:.2f}%<br>fuente: " + s.f + "<extra></extra>" },
        { type: "scatter", mode: "lines", name: "Implícita put", x: s.K, y: s.iv_put.map((v) => v * 100), line: { color: css("--b"), width: 2, dash: "dot" }, hovertemplate: "K %{x}: %{y:.2f}%<br>fuente: " + s.f + "<extra></extra>" },
        { type: "scatter", mode: "lines", name: "Histórica", x: [s.K[0], s.K[s.K.length - 1]], y: [D.vol_hist_cl.v * 100, D.vol_hist_cl.v * 100], line: { color: css("--sin"), dash: "dash" }, hovertemplate: "fuente: " + D.vol_hist_cl.f + "<extra></extra>" },
      ], { xaxis: { title: { text: "Strike (USD/bbl)" }, gridcolor: css("--linea") }, yaxis: { title: { text: "volatilidad (%)" }, gridcolor: css("--linea") },
        shapes: [84, 97].map((k) => ({ type: "line", x0: k, x1: k, yref: "paper", y0: 0, y1: 1, line: { color: css("--suave"), width: 1 } })) });
    },
  });

  // 8 · Recomendación
  P.push({
    t: "Recomendación",
    html: () => {
      const tb = D.tablero.P5, md = D.tablero.media, l = D.liquidez, s = D.simulador;
      const mod = tb[2], modm = md[2];
      return `
      <h1>Cubrir con futuros (A) mediante stack and roll${RECOMENDACION_BORRADOR ? '<span class="borrador">BORRADOR · validar con el equipo</span>' : ""}</h1>
      <p class="mensaje">Criterio: el mayor ingreso en el peor caso al 95 % (P5), siempre que KO pueda fondear la liquidez. La especulación (C) se evalúa por separado, con su propio presupuesto.</p>
      <div class="rejilla">
        <div class="tarjeta"><h3>Protección y costo</h3><ul class="lista">
          <li><b>P5 del semestre (riesgo moderado):</b> sin cobertura ${c(mod.sin, "musd", 1)}; con A ${c(mod.A, "musd", 1)}; con B ATM ${c(mod.B_ATM, "musd", 1)}.</li>
          <li><b>Media:</b> prácticamente igual (A ${c(modm.A, "musd", 1)} contra ${c(modm.sin, "musd", 1)} sin cobertura): la cobertura reduce el riesgo sin cambiar el valor esperado.</li>
          <li><b>Estrés 2022:</b> A ${c(tb[0].A, "musd", 1)} contra ${c(tb[0].sin, "musd", 1)} sin cobertura.</li>
          <li><b>Costo de A:</b> sin prima; margen ${c(D.A_total.margen, "musd", 2)} y liquidez P95 de ${c(l.mc_medio_100, "musd", 1)}.</li>
          <li><b>Costo de B ATM:</b> ${c(D.B_total.ATM.costo, "musd", 1)} en primas, a cambio de conservar la subida del euro y no tener llamadas de margen.</li>
        </ul></div>
        <div class="tarjeta"><h3>Riesgos que permanecen</h3><ul class="lista">
          <li><b>EUR sin cubrir:</b> ≈ ${c({ v: 1 - D.A_total.cob.v, f: D.A_total.cob.f + " (Cálculo: 1 − cobertura efectiva)" }, "pct", 1)} del base, a propósito (p × h*).</li>
          <li><b>Volumen:</b> si los EUR caen 30 %, hay ${c(D.sobrecobertura, "meur", 1)} de sobrecobertura en el semestre.</li>
          <li><b>Liquidez:</b> en σ alta, el P95 llega a ${c(l.mc_alto_100, "musd", 1)}.</li>
          <li><b>Base y fechas:</b> la base S − F no es cero; las puts vencen antes de los flujos de marzo y junio.</li>
          <li><b>Hallazgos del simulador:</b> solo listaba DEC 26 para EURUSD; hubo llenado parcial; cobró margen al 110 % (${c(s.margen_A, "usd")} contra ${c(s.margen_A_est, "usd")} estimados) y ${c(s.margen_C_extra, "usd")} adicionales por la call vendida de C (≈ ${c(s.margen_C_real, "musd", 2)} a escala real).</li>
        </ul></div>
        <div class="tarjeta"><h3>Condiciones para cambiar de alternativa</h3><ul class="lista">
          <li>Si KO no puede comprometer ≈ ${c(l.mc_medio_100, "musd", 0)} de liquidez → usar B (puts).</li>
          <li>Si se espera que el euro <b>suba</b> y se acepta pagar la prima → B ATM conserva esa subida.</li>
          <li>Si el pronóstico de EUR baja o se vuelve más incierto → reducir p o pasar parte a puts.</li>
          <li>Si el margen se cobra como especulador (110 %) → negociar el perfil de coberturista con el bróker.</li>
        </ul></div>
        <div class="tarjeta"><h3>Implementación</h3><ul class="lista">
          <li><b>Hoy:</b> vender ${c(D.A_total.N, "n")} DEC 26 (IA ${c(D.A_dec26_ia, "n")}); línea de crédito para margen.</li>
          <li><b>Rolls:</b> ${D.stack_roll.map((x) => `${x.fecha} (${c(x.contratos, "n")})`).join(" · ")}; resultado estimado ${c(D.stack_roll_total, "musd", 1)} a favor.</li>
          <li><b>Cada flujo (ene–jun 2027):</b> cerrar los contratos de ese mes y vender los EUR al contado.</li>
          <li><b>Seguimiento semanal:</b> pérdidas acumuladas contra la línea de liquidez, base S − F y pronóstico de EUR.</li>
          <li><b>C:</b> ${c(D.C.contratos, "n")} spreads 84/97; pérdida máxima ${c(D.C.prima_total, "musd", 1)}; no forma parte de la cobertura.</li>
        </ul></div>
      </div>`;
    },
  });

  // ------------------------------------------------------------ armado y navegación
  const main = document.getElementById("pantallas");
  main.innerHTML = P.map((p, i) => `<section class="pantalla" id="p${i + 1}" data-i="${i}"><div class="num">${i + 1} / ${P.length} · ${esc(p.t)}</div>${p.html()}
    <div class="pie-imp">${esc(D.meta.empresa)} · Proyecto Final Derivados · ${esc(D.meta.equipo)} · Corte ${esc(D.meta.corte)} · Pantalla ${i + 1} de ${P.length}</div></section>`).join("");
  document.getElementById("meta").textContent = `${D.meta.empresa} · corte ${D.meta.corte} · ${D.meta.equipo}`;
  const puntos = document.getElementById("puntos");
  puntos.innerHTML = P.map((p, i) => `<button data-i="${i}" title="${esc(p.t)}" aria-label="Pantalla ${i + 1}: ${esc(p.t)}">${i + 1}</button>`).join("");

  let actual = -1, siguiendo = true, ultimoPresentador = null;
  const dibujadas = new Set();
  function ir(i, origen) {
    i = Math.max(0, Math.min(P.length - 1, i));
    if (origen === "usuario" && !PRESENTADOR && CON_SYNC && ultimoPresentador !== null && i !== ultimoPresentador) { siguiendo = false; estado(); }
    if (i === actual) return;
    actual = i;
    document.querySelectorAll(".pantalla").forEach((s, k) => s.classList.toggle("activa", k === i));
    puntos.querySelectorAll("button").forEach((b, k) => b.classList.toggle("on", k === i));
    document.getElementById("ant").disabled = i === 0;
    document.getElementById("sig").disabled = i === P.length - 1;
    if (history.replaceState) history.replaceState(null, "", location.pathname + location.search + "#" + (i + 1));
    if (P[i].g) {
      requestAnimationFrame(() => {
        if (!dibujadas.has(i)) { P[i].g(); dibujadas.add(i); }
        else document.querySelectorAll(`#p${i + 1} .graf`).forEach((g) => window.Plotly && Plotly.Plots.resize(g));
      });
    }
    window.scrollTo(0, 0);
    if (PRESENTADOR) publica(i);
  }
  document.getElementById("ant").onclick = () => ir(actual - 1, "usuario");
  document.getElementById("sig").onclick = () => ir(actual + 1, "usuario");
  puntos.onclick = (e) => { const b = e.target.closest("button"); if (b) ir(+b.dataset.i, "usuario"); };
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;
    if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); ir(actual + 1, "usuario"); }
    if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); ir(actual - 1, "usuario"); }
    if (e.key === "Home") ir(0, "usuario");
    if (e.key === "End") ir(P.length - 1, "usuario");
  });
  let x0 = null;
  main.addEventListener("touchstart", (e) => { if (!e.target.closest("input,.graf,.tabla-env")) x0 = e.touches[0].clientX; }, { passive: true });
  main.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 60) ir(actual + (dx < 0 ? 1 : -1), "usuario");
  }, { passive: true });

  // ------------------------------------------------------------ tooltip de fuente
  const tip = document.getElementById("tip");
  function muestra(el, x, y) {
    tip.textContent = "fuente: " + el.dataset.f; tip.hidden = false;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, x - w / 2)) + "px";
    tip.style.top = (y - h - 10 < 8 ? y + 18 : y - h - 10) + "px";
  }
  document.addEventListener("mouseover", (e) => { const el = e.target.closest(".cifra"); if (el) muestra(el, e.clientX, e.clientY); });
  document.addEventListener("mouseout", (e) => { if (e.target.closest(".cifra")) tip.hidden = true; });
  document.addEventListener("focusin", (e) => { const el = e.target.closest(".cifra"); if (el) { const r = el.getBoundingClientRect(); muestra(el, r.left + r.width / 2, r.top); } });
  document.addEventListener("focusout", () => (tip.hidden = true));
  document.addEventListener("click", (e) => { const el = e.target.closest(".cifra"); if (el) { const r = el.getBoundingClientRect(); muestra(el, r.left + r.width / 2, r.top); } else tip.hidden = true; });
  addEventListener("scroll", () => (tip.hidden = true), { passive: true });

  // ------------------------------------------------------------ sincronización (ntfy.sh, sin cuenta)
  const est = document.getElementById("estado");
  function estado(txt) {
    if (!CON_SYNC) return;
    est.hidden = false;
    if (PRESENTADOR) { est.className = "estado vivo"; est.innerHTML = `<span class="pt"></span>Presentador · ${txt || "transmitiendo"}`; return; }
    est.className = "estado" + (siguiendo ? " vivo" : "");
    est.innerHTML = siguiendo
      ? `<span class="pt"></span>Siguiendo al presentador`
      : `<span class="pt"></span>Navegación libre · <button id="seguir">seguir al presentador</button>`;
    const b = document.getElementById("seguir");
    if (b) b.onclick = () => { siguiendo = true; estado(); if (ultimoPresentador !== null) ir(ultimoPresentador, "sync"); };
  }
  let tPub = null;
  function publica(i) {
    if (!CON_SYNC) return;
    clearTimeout(tPub);
    tPub = setTimeout(() => {
      fetch(`${SYNC.servidor}/${SYNC.tema}`, { method: "POST", body: String(i) })
        .then((r) => estado(r.ok ? `pantalla ${i + 1} enviada` : "sin conexión"))
        .catch(() => estado("sin conexión"));
    }, 150);
  }
  function recibe(msg) {
    const i = parseInt(msg, 10);
    if (isNaN(i) || i < 0 || i >= P.length) return;
    ultimoPresentador = i;
    if (siguiendo) ir(i, "sync");
  }
  function suscribe() {
    fetch(`${SYNC.servidor}/${SYNC.tema}/json?poll=1&since=latest`).then((r) => r.text()).then((t) => {
      const l = t.trim().split("\n").filter(Boolean).pop();
      if (l) recibe(JSON.parse(l).message);
    }).catch(() => {});
    const es = new EventSource(`${SYNC.servidor}/${SYNC.tema}/sse`);
    es.onmessage = (e) => { try { const m = JSON.parse(e.data); if (m.event === "message") recibe(m.message); } catch (_) {} };
    es.onopen = () => estado();
  }

  // ------------------------------------------------------------ inicio
  if (IMPRIMIR) {
    document.body.classList.add("imprimir");
    document.documentElement.setAttribute("data-theme", "light");
    document.querySelectorAll(".pantalla").forEach((s) => s.classList.add("activa"));
    P.forEach((p) => p.g && p.g());
    window.LISTO = true;
  } else {
    const h = parseInt((location.hash || "#1").slice(1), 10);
    ir(isNaN(h) ? 0 : h - 1, "inicio");
    if (CON_SYNC) { estado(); if (PRESENTADOR) publica(actual); else suscribe(); }
  }
})();
