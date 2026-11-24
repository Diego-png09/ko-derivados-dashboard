/* Paso 10c · Dashboard KO. Lee window.DATA (data.js, generado por build_data.py).
   4 pantallas principales para la exposición oral + menú "Anexo".
   Cada cifra muestra su fuente (tooltip) y un enlace ↗ a su ubicación exacta (ancla de la SEC, #page=N del PDF o página de CME/FRED/BCE).
   Modos: normal (público), ?presenter=1 (presentador), ?print=1 (PDF), ?sync=0 (sin sincronización). */
(function () {
  "use strict";
  const D = window.DATA;

  // ------------------------------------------------------------ configuración
  const SYNC = { servidor: "https://ntfy.sh", tema: "ko-derivados-9c31ef72c6c10002" };
  const q = new URLSearchParams(location.search);
  const PRESENTADOR = q.get("presenter") === "1";
  const IMPRIMIR = q.get("print") === "1";
  const CON_SYNC = !IMPRIMIR && q.get("sync") !== "0" && location.protocol.startsWith("http");

  // ------------------------------------------------------------ formato
  const nf = (v, d) => Number(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  const fm = {
    musd: (v, d = 1) => "USD " + nf(v / 1e6, d) + " M",
    meur: (v, d = 1) => "EUR " + nf(v / 1e6, d) + " M",
    usd: (v, d = 0) => "USD " + nf(v, d),
    pct: (v, d = 1) => nf(v * 100, d) + "%",
    n: (v, d = 0) => nf(v, d),
    txt: (v) => String(v),
  };
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  // cifra con su fuente (tooltip) y enlace a la ubicación exacta
  const c = (o, f = "n", ...a) => {
    if (!o) return "—";
    const lk = o.u ? `<a class="lk" href="${esc(o.u)}" target="_blank" rel="noopener" title="Abrir la fuente">↗</a>` : "";
    return `<span class="cifra" tabindex="0" data-f="${esc(o.f)}">${fm[f](o.v, ...a)}</span>${lk}`;
  };
  const kpi = (cl, et, va, de = "") => `<div class="kpi ${cl}"><div class="et">${et}</div><div class="va">${va}</div><div class="de">${de}</div></div>`;
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  // ------------------------------------------------------------ Plotly común
  function base(extra = {}) {
    const tinta = css("--tinta"), linea = css("--linea");
    return Object.assign({
      margin: { l: 60, r: 14, t: 30, b: 48 }, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: "-apple-system, Segoe UI, Roboto, Arial, sans-serif", size: 12, color: tinta },
      xaxis: { gridcolor: linea, zerolinecolor: linea }, yaxis: { gridcolor: linea, zerolinecolor: linea },
      legend: { orientation: "h", x: 0, y: 1.02, yanchor: "bottom" }, hoverlabel: { font: { size: 12 } },
    }, extra);
  }
  const CONF = { displayModeBar: false, responsive: true };
  function dibuja(id, trazos, lay) {
    const el = document.getElementById(id);
    if (!el || !window.Plotly) return;
    Plotly.react(el, trazos, base(lay), IMPRIMIR ? Object.assign({ staticPlot: true }, CONF) : CONF);
  }

  // ------------------------------------------------------------ pantallas
  const P = [];
  const E = D.exp, A = D.A, esc3 = D.esc, ES = D.estres, V = D.vol30, L = D.liq, C = D.C;
  const medio = esc3.find((x) => x.nivel === "medio");
  const alto = esc3.find((x) => x.nivel === "alto");

  // 1 · Contexto y riesgo
  P.push({
    t: "Contexto y riesgo",
    html: () => `
      <h1>KO recibe euros de Europa; el riesgo cambiario del semestre es pequeño frente a su utilidad</h1>
      <div class="rejilla d3">
        <div class="tarjeta texto">
          <p><b>The Coca-Cola Company (KO)</b> vende concentrado y jarabes a embotelladores de todo el mundo. En Europa, sus dos embotelladores principales, <b>Coca-Cola Europacific Partners (CCEP)</b> y <b>Coca-Cola HBC (CCHBC)</b>, le compran en euros. KO reporta en dólares, así que si el euro baja, los mismos euros valen menos dólares. Su propio 10-K dice que cubre sobre todo el euro (${c(D.principally_euro, "txt")}).</p>
          <p>Medimos cuántos euros recibirá KO de enero a junio de 2027 con <b>datos directos en euros</b> de los reportes anuales de CCEP y CCHBC (lo que le compraron a KO en 2025 en la eurozona), sin proyecciones. El escenario <b>mínimo</b> es la parte verificable; el base y el máximo dependen de supuestos.</p>
          <p>Con la volatilidad histórica del euro, en el peor caso al 95 % KO dejaría de recibir ${c(D.costo_riesgo, "musd")} en el semestre. Es el <b>${c(D.materialidad, "pct", 2)}</b> de su utilidad de operación del primer semestre de 2026 (${c(D.util_h1, "musd", 0)}).</p>
        </div>
        <div class="tarjeta"><h3>EUR por recibir, ene–jun 2027</h3><div id="g1" class="graf"></div>
          <p class="nota">Semestre = compras anuales 2025 ÷ 2. Máximo = base × (1 + ${c(E.g_max, "pct", 2)}), supuesto del equipo.</p></div>
      </div>
      <div class="kpis">
        ${kpi("a", "Mínimo (verificable)", c(E.sem_minimo, "meur"), `CCEP eurozona ${c(E.ccep_eur, "meur")} + CCHBC Italia ${c(E.cchbc_min, "meur")}, ÷ 2`)}
        ${kpi("", "Base", c(E.sem_base, "meur"), `CCEP + CCHBC con mezcla euro base (${c(E.cchbc_base, "meur")}), ÷ 2`)}
        ${kpi("", "Máximo (supuesto)", c(E.sem_maximo, "meur"), "base × (1 + mayor crecimiento de EMEA)")}
        ${kpi("r", "Costo en riesgo (P5, 95 %)", c(D.costo_riesgo, "musd"), `presupuesto al F₀: ${c(D.presupuesto, "musd")} (mín. ${c(D.presupuesto_min, "musd")} · máx. ${c(D.presupuesto_max, "musd")})`)}
        ${kpi("r", "Materialidad", c(D.materialidad, "pct", 2), "de la utilidad de operación H1 2026")}
      </div>
      <p class="nota">Fuentes primarias: CCEP 20-F FY2025 (Nota 20, p. 186; Nota 4, p. 151; p. 49), CCHBC Integrated Annual Report 2025 (Nota 27 a), p. 322; Nota 6 a), pp. 275–276), KO 10-Q Q2-2026 (p. 2). Cada cifra enlaza (↗) a su ubicación exacta; la cadena completa está en Anexo · Exposición.</p>`,
    g: () => {
      const x = ["Mínimo", "Base", "Máximo"], o = [E.sem_minimo, E.sem_base, E.sem_maximo];
      dibuja("g1", [{ type: "bar", x, y: o.map((v) => v.v / 1e6), marker: { color: [css("--a"), css("--sin"), css("--linea")] },
        text: o.map((v) => nf(v.v / 1e6, 1)), textposition: "outside", cliponaxis: false,
        customdata: o.map((v) => v.f), hovertemplate: "%{x}: EUR %{y:,.1f} M<br>fuente: %{customdata}<extra></extra>" }],
        { yaxis: { title: { text: "millones de EUR" }, gridcolor: css("--linea") }, showlegend: false });
    },
  });

  // 2 · Cobertura sobre el euro
  P.push({
    t: "Cobertura sobre el euro",
    html: () => {
      const filas = esc3.map((e) => `<tr><td class="txt">${esc(e.nombre)}</td><td>${c(e.sigma, "pct", 2)}</td>
        <td>${c(e.spot_ene, "n", 4)} → ${c(e.spot_jun, "n", 4)}</td><td>${c(e.sin_cobertura, "musd")}</td><td class="mejor">${c(e.con_futuros, "musd")}</td>
        <td>${c(e.con_puts_ATM, "musd")}</td><td>${c(e.con_puts_OTM, "musd")}</td>
        <td>${c(e.gp_futuros, "musd")} / ${c(e.gp_puts_ATM, "musd")} / ${c(e.gp_puts_OTM, "musd")}</td></tr>`).join("");
      const riesgo = esc3.map((e) => `<tr><td class="txt">${esc(e.nombre)}</td><td>${c(e.sigma, "pct", 2)}</td><td>${c(e.costo_en_riesgo, "musd")}</td><td>${c(e.materialidad, "pct", 2)}</td></tr>`).join("");
      return `
      <h1>Con un precio pactado, los futuros dan el ingreso más alto cuando el euro cae</h1>
      <p class="mensaje">Cubrimos solo el escenario mínimo: ${c(A.N_mes, "n")} futuros 6E por mes (${c(A.N, "n")} en total, ${c(A.cob_base, "pct", 0)} de los EUR base), con razón de cobertura h = 1 porque es el mismo activo. Precio pactado: F₀ de marzo ${c(A.F0.ECH27, "n", 4)}, junio ${c(A.F0.ECM27, "n", 4)} y septiembre ${c(A.F0.ECU27, "n", 4)}.</p>
      <div class="tarjeta"><h3>Tres escenarios con precio pactado único (spot al cierre = P5 adverso del euro), ingreso del semestre</h3>
        <div class="tabla-env"><table>
        <thead><tr><th>Escenario</th><th>σ</th><th>Spot al cierre (ene → jun)</th><th>Sin cobertura</th><th>Con futuros</th><th>Con puts ATM</th><th>Con puts OTM</th><th>Ganancia del derivado: fut. / ATM / OTM</th></tr></thead>
        <tbody>${filas}</tbody></table></div>
        <div id="g2" class="graf"></div>
        <p class="nota">Puts: prima ATM ${c(D.B_costo.ATM, "musd")} y OTM (1.050) ${c(D.B_costo.OTM, "musd")} en total, ya restadas. Futuros: sin prima; margen inicial ${c(A.margen, "musd")}.</p></div>
      <div class="rejilla">
        <div class="tarjeta"><h3>¿Qué tan riesgoso es el euro?</h3><div class="tabla-env"><table>
          <thead><tr><th>Escenario</th><th>σ</th><th>Costo en riesgo</th><th>Materialidad</th></tr></thead><tbody>${riesgo}</tbody></table></div>
          <p class="nota">Materialidad = costo en riesgo ÷ utilidad de operación H1 2026 (${c(D.util_h1, "musd", 0)}).</p></div>
        <div class="tarjeta"><h3>Estrés histórico y volumen −30 %</h3><ul class="lista">
          <li><b>Estrés 2022</b> (euro ${c(ES.eur, "pct", 2)} en 26 semanas, ${esc(ES.periodo_eur)}): sin cobertura ${c(ES.sin, "musd")}; con futuros ${c(ES.A, "musd")}; puts ATM ${c(ES.B_ATM, "musd")}; puts OTM ${c(ES.B_OTM, "musd")}.</li>
          <li><b>Si llega 30 % menos volumen</b>, sobran ${c(V.sobre, "meur")} cubiertos (${c(V.sobre_pct, "pct", 1)} de los euros reales): esa parte de los futuros ya no tiene ingreso detrás. Con puts, la sobrecobertura solo cuesta la prima de más.</li>
          <li>P5 con volumen −30 %: sin cobertura ${c(V.P5_sin, "musd")}; futuros ${c(V.P5_A, "musd")}; puts ATM ${c(V.P5_B_ATM, "musd")}.</li>
        </ul></div>
      </div>`;
    },
    g: () => {
      const x = esc3.map((e) => e.nombre);
      const tr = [["Sin cobertura", "sin_cobertura", "--sin"], ["Con futuros", "con_futuros", "--a"], ["Puts ATM", "con_puts_ATM", "--b"], ["Puts OTM", "con_puts_OTM", "--b2"]]
        .map(([n, k, col]) => ({ type: "bar", name: n, x, y: esc3.map((e) => e[k].v / 1e6), marker: { color: css(col) },
          customdata: esc3.map((e) => e[k].f), hovertemplate: n + ": USD %{y:,.1f} M<br>fuente: %{customdata}<extra></extra>" }));
      const ys = esc3.flatMap((e) => ["sin_cobertura", "con_futuros", "con_puts_ATM", "con_puts_OTM"].map((k) => e[k].v / 1e6));
      dibuja("g2", tr, { barmode: "group", yaxis: { title: { text: "ingreso del semestre, millones de USD" }, range: [Math.min(...ys) * 0.97, Math.max(...ys) * 1.01], gridcolor: css("--linea") } });
    },
  });

  // 3 · Especulación con CL
  P.push({
    t: "Especulación con CL",
    html: () => {
      const fil = D.activos.map((a) => `<tr><td class="txt">${esc(a.desc)} <span class="etiq ${a.ticker === "CL=F" ? "si" : ""}">${esc(a.ticker)}</span></td>
        <td>${a.vol ? c(a.vol, "pct", 1) : "No encontrado"}</td><td>${a.volumen ? c(a.volumen, "n") : "—"}</td><td>${a.oi ? c(a.oi, "n") : "—"}</td></tr>`).join("");
      const cand = D.C_cand.map((x) => `<tr><td class="txt">${esc(x.nombre)}</td><td>${c(x.n, "n")}</td><td>${c(x.prima, "musd", 2)}</td><td>${c(x.E_hist, "musd", 2)}</td><td>${c(x.E_impl, "musd", 2)}</td><td>${c(x.P, "pct", 1)}</td></tr>`).join("");
      return `
      <h1>Petróleo: el más volátil con liquidez profunda; bull call spread 84/97 con pérdida acotada</h1>
      <p class="mensaje">La especulación (C) es independiente de la cobertura y se asigna a Strategic Growth, con presupuesto de primas de USD 10 M. Se eligió CL porque tiene la volatilidad más alta de los candidatos (${c(C.vol_hist, "pct", 1)}) con liquidez profunda: el mayor volumen de opciones (${c(D.opc_vol_cl, "n")} en DEC26) y casi 2 millones de contratos de interés abierto. Además se relaciona con PET y diésel del sistema Coca-Cola.</p>
      <div class="rejilla">
        <div class="tarjeta"><h3>Los 11 activos evaluados: volatilidad y liquidez (13-nov-2026)</h3><div id="g3a" class="graf"></div>
          <div class="tabla-env solo-pantalla"><table class="chica"><thead><tr><th>Serie</th><th>Vol. anual</th><th>Volumen</th><th>Interés abierto</th></tr></thead><tbody>${fil}</tbody></table></div></div>
        <div class="tarjeta"><h3>Pago al vencimiento (17-feb-2027), por barril</h3><div id="g3b" class="graf"></div>
          <p class="nota">Compra call 84 @ ${c(C.p1, "n", 2)}, vende call 97 @ ${c(C.p2, "n", 2)}: prima neta ${c(C.prima_neta, "n", 2)} USD/bbl, que se dibuja aparte. ${c(C.n, "n")} spreads; pérdida máxima ${c(C.prima_total, "musd", 2)}; ganancia máxima ${c(C.gan_max, "musd", 2)}; equilibrio en ${c(C.equilibrio, "n", 2)}. F₀ = ${c(C.F0, "n", 2)}. Ejercicio ${c(C.americana, "txt")}.</p></div>
      </div>
      <div class="rejilla">
        <div class="tarjeta"><h3>Resultado esperado (Montecarlo, 100,000 trayectorias)</h3><div class="tabla-env"><table>
          <thead><tr><th>Estrategia</th><th>Contratos</th><th>Prima</th><th>E[resultado] σ hist.</th><th>E[resultado] σ impl.</th><th>P(ganar)</th></tr></thead><tbody>${cand}</tbody></table></div>
          <p class="nota">El spread tiene el mejor resultado esperado con las dos volatilidades: vende la call de 97, la más cara de la sonrisa (implícita ATM ${c(C.iv_atm, "pct", 1)} contra histórica ${c(C.vol_hist, "pct", 1)}).</p></div>
        <div class="tarjeta"><h3>Backtest (15-may a 13-nov-2026)</h3>
          <p>La misma regla aplicada en mayo de 2026 (call ATM 105.5 / +15 % 121) habría perdido toda la prima: ${c(D.bt.C, "musd", 1)}. CL terminó en 97.97, debajo del strike comprado. Es el riesgo que se acepta: la pérdida nunca pasa del presupuesto.</p></div>
      </div>`;
    },
    g: () => {
      const fut = D.activos.filter((a) => a.vol && a.oi);
      dibuja("g3a", [{ type: "scatter", mode: "markers+text", x: fut.map((a) => a.oi.v), y: fut.map((a) => a.vol.v * 100), text: fut.map((a) => a.ticker.replace("=F", "")),
        textposition: "top center", marker: { size: 11, color: fut.map((a) => (a.ticker === "CL=F" ? css("--c") : css("--sin"))) },
        customdata: fut.map((a) => [a.vol.f, a.oi.f]), hovertemplate: "%{text}<br>Vol. %{y:.1f}%<br>IA %{x:,}<br>%{customdata[0]}<extra></extra>" }],
        { xaxis: { type: "log", title: { text: "interés abierto (escala log)" }, gridcolor: css("--linea") }, yaxis: { title: { text: "volatilidad anual (%)" }, gridcolor: css("--linea") }, showlegend: false });
      const K1 = C.K1.v, K2 = C.K2.v, pr = C.prima_neta.v, xs = [];
      for (let s = 60; s <= 115; s += 0.5) xs.push(s);
      const bruto = xs.map((s) => Math.max(s - K1, 0) - Math.max(s - K2, 0));
      dibuja("g3b", [
        { type: "scatter", name: "Pago bruto", x: xs, y: bruto, line: { color: css("--a") } },
        { type: "scatter", name: "Prima neta (costo)", x: xs, y: xs.map(() => -pr), line: { color: css("--acento"), dash: "dash" } },
        { type: "scatter", name: "Resultado neto", x: xs, y: bruto.map((b) => b - pr), line: { color: css("--c"), width: 3 } },
      ], { xaxis: { title: { text: "CL al vencimiento (USD/bbl)" }, gridcolor: css("--linea") }, yaxis: { title: { text: "USD por barril" }, gridcolor: css("--linea") } });
    },
  });

  // 4 · Recomendación
  P.push({
    t: "Recomendación",
    html: () => `
      <h1>La cobertura no es indispensable; si la Mesa quiere certeza, futuros sobre la parte verificable</h1>
      <p class="mensaje">El riesgo cambiario del semestre es pequeño frente a la utilidad de operación (materialidad ≈ ${c(D.materialidad, "pct", 2)}), por lo que la cobertura no es indispensable. Si la Mesa prioriza certeza del presupuesto, recomendamos futuros 6E en corto sobre la parte verificable (escenario mínimo), ejecutados con stack and roll. Las puts OTM son la alternativa barata si se quiere conservar la ganancia cuando el euro sube. C es independiente, para Strategic Growth.</p>
      <div class="rejilla">
        <div class="tarjeta"><h3>Costo y protección</h3><ul class="lista">
          <li><b>Futuros:</b> sin prima. Margen inicial ${c(A.margen, "musd")}; liquidez para pérdidas en el peor caso al 95 % ${c(L.mc_medio, "musd")} (σ media).</li>
          <li><b>Puts OTM:</b> ${c(D.B_costo.OTM, "musd")} de prima; <b>ATM:</b> ${c(D.B_costo.ATM, "musd")}. Conservan la subida del euro y no piden margen.</li>
          <li><b>Protección (riesgo medio, euro al P5):</b> sin cobertura ${c(medio.sin_cobertura, "musd")}; con futuros ${c(medio.con_futuros, "musd")}; con puts OTM ${c(medio.con_puts_OTM, "musd")}.</li>
          <li><b>A lo que se renuncia:</b> con futuros, a la ganancia si el euro sube, sobre los euros cubiertos. El resultado del stack and roll no se suma como ganancia: ya está en los precios pactados.</li>
        </ul></div>
        <div class="tarjeta"><h3>Riesgos que permanecen</h3><ul class="lista">
          <li><b>Volumen:</b> si llegan 30 % menos euros, ${c(V.sobre, "meur")} de futuros quedan sin ingreso detrás (${c(V.sobre_pct, "pct", 1)} de los euros reales).</li>
          <li><b>Liquidez:</b> con σ alta, el P95 de margen más pérdidas llega a ${c(L.mc_alto, "musd")}; si el bróker cobra 110 %, el margen sube a ${c(L.margen_110, "musd")}.</li>
          <li><b>Base por fecha y horario:</b> los flujos llegan antes del vencimiento de los contratos; el spot se fija a otra hora que la liquidación de CME.</li>
          <li><b>Simulador de CME:</b> no lista marzo 2027 para el euro (se ejecutó en diciembre 2026, ${c(D.sim.A_px, "n", 4)}), cobra margen de especulador (${c(D.sim.margen_A, "usd")} por contrato) y cobra margen por la call vendida de C.</li>
        </ul></div>
        <div class="tarjeta"><h3>Condiciones para cambiar</h3><ul class="lista">
          <li>Si el pronóstico de euros cae debajo de lo cubierto (mínimo) → reducir futuros o pasar a puts.</li>
          <li>Si KO no puede comprometer la liquidez del P95 → usar puts OTM.</li>
          <li>Si la materialidad sube (σ alta: ${c(alto.materialidad, "pct", 2)}) o la Mesa prioriza certeza → ampliar la cobertura.</li>
          <li>Si la prima de las puts supera el límite que fije la Mesa → quedarse con futuros o sin cobertura.</li>
        </ul></div>
        <div class="tarjeta"><h3>Implementación</h3><ul class="lista">
          <li><b>Quién:</b> Tesorería de KO, con un bróker de CME en perfil de coberturista.</li>
          <li><b>Cuándo:</b> vender ${c(A.N, "n")} DEC 26 (IA ${c(A.dec26_ia, "n")}) y rolar en cada vencimiento; cerrar cada mes en su flujo, ene–jun 2027.</li>
          <li><b>Qué se monitorea:</b> margen y pérdidas acumuladas contra la línea de liquidez, el pronóstico de euros contra lo cubierto y la base S − F.</li>
        </ul></div>
      </div>`,
  });

  // ------------------------------------------------------------ Anexo
  P.push({
    t: "Anexo · Exposición", anexo: true,
    html: () => `
      <h1>Cadena de la exposición (v3): cada cifra con documento, nota y página</h1>
      <div class="tarjeta"><div class="tabla-env"><table class="chica">
        <thead><tr><th>Cifra</th><th>Valor</th><th>Tipo</th><th>Documento · nota</th><th>Pág. impresa</th><th>Pág. PDF</th></tr></thead>
        <tbody>${D.cadena.map((r) => `<tr><td class="txt">${esc(r.concepto)}</td><td>${esc(!isNaN(+r.valor) && r.valor.includes(".") && r.valor.split(".")[1].length > 4 ? nf(+r.valor, 4) : r.valor)}</td><td class="txt">${esc(r.tipo)}</td>
          <td class="txt">${esc(r.documento)}${r.nota ? " · " + esc(r.nota) : ""}${r.u ? ` <a class="lk" href="${esc(r.u)}" target="_blank" rel="noopener">↗</a>` : ""}</td><td>${esc(r.pag)}</td><td>${esc(r.pdf)}</td></tr>`).join("")}</tbody></table></div></div>
      <div class="tarjeta" style="margin-top:14px"><h3>Método evaluado y reemplazado (v2)</h3>
        <p>La versión anterior estimaba ${c(D.v2.eur_base, "meur")} combinando ventas de EMEA en USD de 2026, crecimiento, una participación implícita de Europa y la conversión con el EURUSD de 2026. Se reemplazó el 24-nov-2026 porque el profesor pidió datos verificables sin proyecciones complejas.</p></div>`,
  });
  P.push({
    t: "Anexo · Estadística", anexo: true,
    html: () => `
      <h1>Regresión ΔS = a + h·ΔF: herramienta de coberturas cruzadas (h = 1 en este caso)</h1>
      <div class="rejilla"><div class="tarjeta"><div class="tabla-env"><table>
        <thead><tr><th>Spot</th><th>Versión</th><th>h*</th><th>R²</th></tr></thead>
        <tbody>${D.reg.map((r) => `<tr><td class="txt">${esc(r.spot.toUpperCase())}</td><td class="txt">${esc(r.version)}</td><td>${c(r.h, "n", 4)}</td><td>${c(r.R2, "n", 4)}</td></tr>`).join("")}</tbody></table></div>
        <p class="nota">Se usa h = 1 porque los euros de KO y el subyacente del 6E son el mismo activo. h* sale menor que 1 por el horario del spot (FRED, mediodía en Nueva York) contra la liquidación de CME, y por el diferencial de tasas, que mueve la base S − F con el plazo. En una cobertura cruzada (activo distinto) h* sí sería la razón óptima.</p></div>
        <div class="tarjeta"><h3>Base S − F semanal (FRED − 6E=F)</h3><div id="ga2" class="graf"></div></div></div>`,
    g: () => {
      const s = D.serie_base;
      dibuja("ga2", [{ type: "scatter", x: s.fecha, y: s.base, line: { color: css("--a") }, hovertemplate: "%{x}: %{y:.4f}<br>fuente: " + s.f + "<extra></extra>" }],
        { yaxis: { title: { text: "USD por EUR" }, gridcolor: css("--linea") }, showlegend: false });
    },
  });
  P.push({
    t: "Anexo · Futuros y liquidez", anexo: true,
    html: () => `
      <h1>Futuros: interés abierto, stack and roll y liquidez</h1>
      <div class="rejilla">
        <div class="tarjeta"><h3>N frente al interés abierto</h3><div class="tabla-env"><table><thead><tr><th>Contrato</th><th>N</th><th>IA</th><th>N / IA</th></tr></thead>
          <tbody>${A.ia.map((x) => `<tr><td class="txt">${esc(x.codigo)}</td><td>${c(x.N, "n")}</td><td>${c(x.ia, "n")}</td><td>${c(x.pct, "pct", 0)}</td></tr>`).join("")}</tbody></table></div>
          <p class="nota">ECM27 no tiene interés abierto suficiente: por eso se abre todo en DEC 26 (IA ${c(A.dec26_ia, "n")}) y se rola.</p></div>
        <div class="tarjeta"><h3>Stack and roll</h3><div class="tabla-env"><table><thead><tr><th>Roll</th><th>Fecha</th><th>Contratos</th><th>Spread</th><th>Resultado</th></tr></thead>
          <tbody>${A.roll.map((x) => `<tr><td class="txt">${esc(x.de)} → ${esc(x.a)}</td><td>${esc(x.fecha)}</td><td>${c(x.N, "n")}</td><td>${c(x.spread, "n", 5)}</td><td>${c(x.res, "musd", 2)}</td></tr>`).join("")}</tbody></table></div>
          <p class="nota">Total ${c(A.roll_total, "musd", 2)} a favor por el contango, pero ya está incluido en los F₀: no es ganancia adicional.</p></div>
      </div>
      <div class="tarjeta" style="margin-top:14px"><h3>Liquidez (margen + mayor pérdida acumulada de los futuros)</h3><ul class="lista">
        <li>Backtest may–nov 2026: ${c(L.bt, "musd")} (P&amp;L de futuros ${c(D.bt.pnl, "musd")}; mayor pérdida acumulada ${c(D.bt.max_perdida, "musd")}).</li>
        <li>Montecarlo, P95: σ media ${c(L.mc_medio, "musd")}; σ alta ${c(L.mc_alto, "musd")}.</li></ul></div>`,
  });
  P.push({
    t: "Anexo · Puts (B)", anexo: true,
    html: () => `
      <h1>Puts: Black-76 contra la prima de mercado (un solo modelo)</h1>
      <div class="tarjeta"><div class="tabla-env"><table>
        <thead><tr><th>Opción</th><th>Strike</th><th>N</th><th>Prima de mercado</th><th>Black-76</th><th>Diferencia</th><th>Diferencia total</th><th>¿Significativa (&gt;10 %)?</th><th>Vol. implícita</th><th>Costo</th><th>Binomial (verificación)</th></tr></thead>
        <tbody>${D.B.map((x) => `<tr><td class="txt">${esc(x.codigo)} ${esc(x.tipo)}</td><td>${c(x.K, "n", 3)}</td><td>${c(x.N, "n")}</td><td>${c(x.prima, "n", 4)}</td><td>${c(x.b76, "n", 5)}</td>
          <td>${c(x.dif_pct, "pct", 1)}</td><td>${c(x.dif_usd, "usd")}</td><td>${x.sig ? "Sí" : "No"}</td><td>${c(x.iv, "pct", 2)}</td><td>${c(x.costo, "musd", 2)}</td><td>${c(x.binom, "n", 5)}</td></tr>`).join("")}</tbody></table></div>
        <p class="nota">Con σ histórica (6.89 %), Black-76 sobrevalúa las ATM y subvalúa las OTM ≈ 33–35 %: el mercado cobra más volatilidad en las alas (sonrisa). El costo usa la prima de mercado. El umbral de 10 % es supuesto del equipo (CME no publica bid-ask en las liquidaciones). Las puts de marzo y junio vencen antes de los flujos de esos meses.</p></div>`,
  });
  P.push({
    t: "Anexo · Tablero Montecarlo", anexo: true,
    html: () => {
      const tb = (s) => D.tablero[s].map((r) => `<tr><td class="txt">${esc(r.esc)}</td><td>${c(r.sin, "musd")}</td><td>${c(r.A, "musd")}</td><td>${c(r.B_ATM, "musd")}</td><td>${c(r.B_OTM, "musd")}</td><td>${c(r.C, "musd")}</td></tr>`).join("");
      const cab = "<thead><tr><th>Escenario</th><th>Sin cobertura</th><th>Futuros</th><th>Puts ATM</th><th>Puts OTM</th><th>C (CL)</th></tr></thead>";
      return `
      <h1>Tablero: 100,000 semestres simulados (P5 y media)</h1>
      <div class="rejilla"><div class="tarjeta"><h3>Peor caso al 95 % (P5)</h3><div class="tabla-env"><table>${cab}<tbody>${tb("P5")}</tbody></table></div></div>
      <div class="tarjeta"><h3>Media</h3><div class="tabla-env"><table>${cab}<tbody>${tb("media")}</tbody></table></div></div></div>
      <p class="nota">Máximo estrés = valor del escenario 2022. La cobertura reduce el peor caso sin cambiar la media: no es una apuesta, es certeza.</p>`;
    },
  });
  P.push({
    t: "Anexo · Simulador", anexo: true,
    html: () => `
      <h1>CME Trading Simulator: 1 contrato representativo por estrategia (24-nov-2026)</h1>
      <div class="tarjeta"><ul class="lista">
        <li><b>A:</b> venta de 1 6EZ6 @ ${c(D.sim.A_px, "n", 4)}; margen cobrado ${c(D.sim.margen_A, "usd", 2)} (≈ 110 % del mantenimiento, perfil HRP).</li>
        <li><b>B:</b> compra de 1 put 6E66 1.0975 (vence el 4-dic) @ ${c(D.sim.B_px, "n", 4)}.</li>
        <li><b>C:</b> bull call spread CLH7 79.5/91.5: compra @ ${c(D.sim.C1_px, "n", 2)} y venta @ ${c(D.sim.C2_px, "n", 2)} (prima neta ${c(D.sim.C_neta, "usd")} por spread), con la regla ATM / +15 % al precio del día.</li>
        <li><b>Hallazgo:</b> el simulador no lista marzo 2027 para EURUSD (ni futuro ni opciones), así que A y B se representan en diciembre 2026, como primer tramo del stack and roll. El modelo sigue con ECH27/ECM27/ECU27 y 84/97 al 13-nov.</li>
        <li><b>Saldo final:</b> fondos ${c(D.sim.fondos, "usd", 2)}; margen ${c(D.sim.margen_final, "usd", 2)}. Primer intento (17-nov, escala 1:1,000) cerrado con Flatten.</li></ul></div>`,
  });

  // ------------------------------------------------------------ armado y navegación
  const main = document.getElementById("pantallas");
  const principales = P.filter((p) => !p.anexo).length;
  const etiqueta = (i) => (P[i].anexo ? "A" + (i - principales + 1) : String(i + 1));
  main.innerHTML = P.map((p, i) => `<section class="pantalla${p.anexo ? " anexo" : ""}" id="p${i + 1}" data-i="${i}"><div class="num">${p.anexo ? "Anexo " + etiqueta(i) : i + 1 + " / " + principales} · ${esc(p.t.replace("Anexo · ", ""))}</div>${p.html()}
    <div class="pie-imp">${esc(D.meta.empresa)} · Proyecto Final Derivados · ${esc(D.meta.equipo)} · Corte ${esc(D.meta.corte)} · ${p.anexo ? "Anexo " + etiqueta(i) : "Pantalla " + (i + 1) + " de " + principales}</div></section>`).join("");
  document.getElementById("meta").textContent = `${D.meta.empresa} · corte ${D.meta.corte} · ${D.meta.equipo}`;
  const puntos = document.getElementById("puntos");
  puntos.innerHTML = P.map((p, i) => (p.anexo ? "" : `<button data-i="${i}" title="${esc(p.t)}" aria-label="Pantalla ${i + 1}: ${esc(p.t)}">${i + 1}</button>`)).join("") +
    `<select id="anexo" aria-label="Anexo"><option value="">Anexo ▾</option>${P.map((p, i) => (p.anexo ? `<option value="${i}">${etiqueta(i)} · ${esc(p.t.replace("Anexo · ", ""))}</option>` : "")).join("")}</select>`;
  const selA = document.getElementById("anexo");
  selA.onchange = () => { if (selA.value !== "") ir(+selA.value, "usuario"); };

  let actual = -1, siguiendo = true, ultimoPresentador = null;
  const dibujadas = new Set();
  function ir(i, origen) {
    i = Math.max(0, Math.min(P.length - 1, i));
    if (origen === "usuario" && !PRESENTADOR && CON_SYNC && ultimoPresentador !== null && i !== ultimoPresentador) { siguiendo = false; estado(); }
    if (i === actual) return;
    actual = i;
    document.querySelectorAll(".pantalla").forEach((s, k) => s.classList.toggle("activa", k === i));
    puntos.querySelectorAll("button").forEach((b) => b.classList.toggle("on", +b.dataset.i === i));
    selA.value = P[i].anexo ? String(i) : "";
    document.getElementById("ant").disabled = i === 0;
    document.getElementById("sig").disabled = i === P.length - 1;
    if (history.replaceState) history.replaceState(null, "", location.pathname + location.search + "#" + etiqueta(i));
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
    if (["INPUT", "SELECT"].includes(e.target.tagName)) return;
    if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); ir(actual + 1, "usuario"); }
    if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); ir(actual - 1, "usuario"); }
    if (e.key === "Home") ir(0, "usuario");
    if (e.key === "End") ir(P.length - 1, "usuario");
  });
  let x0 = null;
  main.addEventListener("touchstart", (e) => { if (!e.target.closest("input,select,.graf,.tabla-env")) x0 = e.touches[0].clientX; }, { passive: true });
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
        .then((r) => estado(r.ok ? `pantalla ${etiqueta(i)} enviada` : "sin conexión"))
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
    const h = (location.hash || "#1").slice(1);
    const idx = h.startsWith("A") ? principales + parseInt(h.slice(1), 10) - 1 : parseInt(h, 10) - 1;
    ir(isNaN(idx) ? 0 : idx, "inicio");
    if (CON_SYNC) { estado(); if (PRESENTADOR) publica(actual); else suscribe(); }
  }
})();
