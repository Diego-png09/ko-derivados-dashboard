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
  const HASH_INICIAL = location.hash;   // antes de que ir() escriba #N
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
  const amp = (id) => `<button class="ampliar" data-g="${id}" title="Ver en pantalla completa (Esc para salir)" aria-label="Pantalla completa">⤢</button>`;
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

  // 0 · Portada
  P.push({
    t: "Portada", portada: true,
    html: () => `
      <div class="portada">
        <div class="port-izq">
          <div class="port-kicker">Proyecto Final · Mercado de Futuros y Opciones</div>
          <h1 class="port-tit">The Coca-Cola Company <span>(KO)</span></h1>
          <p class="port-sub">¿Debe KO proteger los euros que recibirá de enero a junio de 2027?</p>
          <p class="port-sub2">Cobertura con futuros y opciones sobre el euro, y una estrategia de especulación con petróleo.</p>
          <div class="port-pie">
            <div><b>Equipo</b>Diego Avila Chavez · Santiago Mondragon Apodaca</div>
            <div><b>Datos de mercado</b>al viernes ${esc(D.meta.corte)}</div>
          </div>
          <svg class="port-onda" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0,80 C150,20 300,130 600,40 L600,120 L0,120 Z"/></svg>
        </div>
        <div class="port-der">
          <div class="port-bloque"><div class="port-n">01</div><div><h3>La empresa</h3>
            <p>Vende concentrado y jarabes a embotelladores, que producen y distribuyen las bebidas. Reporta en dólares, pero el ${c(D.intl_pct_2025, "pct", 0)} de sus ingresos de 2025 vino de fuera de EUA (${c(D.intl_2025, "musd", 0)} de ${c(D.ingresos_2025, "musd", 0)}).</p></div></div>
          <div class="port-bloque"><div class="port-n">02</div><div><h3>Su exposición al riesgo</h3>
            <p>En Europa, sus embotelladores CCEP y Coca-Cola HBC le pagan en <b>euros</b>. Si el euro baja frente al dólar, esos mismos euros se convierten en menos dólares.</p></div></div>
          <div class="port-bloque"><div class="port-n">03</div><div><h3>Qué presentamos</h3>
            <ol class="port-lista"><li>Justificación de la cobertura</li><li>Diseño de la cobertura</li><li>Especulación con petróleo</li><li>Recomendación a la Mesa</li></ol></div></div>
          <div class="port-bloque"><div class="port-n">04</div><div><h3>Con qué datos</h3>
            <p>Reportes oficiales (10-K y 10-Q de KO, 20-F de CCEP, informe anual de CCHBC), precios de CME del 13-nov-2026 y 3 años de precios semanales.</p></div></div>
        </div>
      </div>`,
  });

  // 1 · Justificación de la cobertura
  P.push({
    t: "Justificación de la cobertura",
    html: () => `
      <h1>Justificación de la cobertura: ¿cuántos euros recibe KO y cuánto puede perder?</h1>
      <div class="rejilla d3 igual">
        <div class="tarjeta texto pasos3">
          <div class="paso"><div class="paso-t">El riesgo</div>
            <p>KO vende concentrado a sus embotelladores europeos, <b>CCEP</b> y <b>Coca-Cola HBC</b>, que le pagan en euros. KO reporta en dólares: si el euro baja, recibe menos. Su 10-K dice que cubre sobre todo el euro (${c(D.principally_euro, "txt")}).</p></div>
          <div class="paso"><div class="paso-t">Cómo lo medimos</div>
            <p>Sin proyecciones: usamos lo que esos embotelladores reportan que le compraron a KO en 2025 en la eurozona. El <b>mínimo</b> es la parte verificable; el base y el máximo dependen de supuestos.</p></div>
          <div class="paso"><div class="paso-t">Cuánto puede costar</div>
            <p>En el peor caso al 95 %, KO dejaría de recibir <b>${c(D.costo_riesgo, "musd")}</b> en el semestre: el <b>${c(D.materialidad, "pct", 2)}</b> de su utilidad de operación del primer semestre de 2026.</p></div>
        </div>
        <div class="tarjeta"><h3>EUR por recibir, ene–jun 2027 (millones)</h3>${amp("g1")}<div id="g1" class="graf"></div></div>
      </div>
      <div class="kpis k5">
        ${kpi("a", "Mínimo (verificable)", c(E.sem_minimo, "meur"), `CCEP eurozona ${c(E.ccep_eur, "meur")} + CCHBC Italia ${c(E.cchbc_min, "meur")}, ÷ 2`)}
        ${kpi("", "Base", c(E.sem_base, "meur"), `CCEP + CCHBC con mezcla euro (${c(E.cchbc_base, "meur")}), ÷ 2`)}
        ${kpi("", "Máximo (supuesto)", c(E.sem_maximo, "meur"), `base × (1 + ${c(E.g_max, "pct", 2)}, mayor crecimiento de EMEA)`)}
        ${kpi("r", "Costo en riesgo (P5, 95 %)", c(D.costo_riesgo, "musd"), `contra el presupuesto al F₀ de ${c(D.presupuesto, "musd")}`)}
        ${kpi("r", "Materialidad", c(D.materialidad, "pct", 2), `÷ utilidad de operación H1 2026 (${c(D.util_h1, "musd", 0)})`)}
      </div>
      <p class="fuentes">Fuentes: 20-F CCEP 2025 · Informe anual CCHBC 2025 · 10-Q KO Q2-2026 · cadena completa en Anexo A1</p>`,
    g: () => {
      const x = ["Mínimo", "Base", "Máximo"], o = [E.sem_minimo, E.sem_base, E.sem_maximo];
      dibuja("g1", [{ type: "bar", x, y: o.map((v) => v.v / 1e6), marker: { color: [css("--a"), css("--b2"), css("--sin")] },
        text: o.map((v) => nf(v.v / 1e6, 1)), textposition: "outside", cliponaxis: false, textfont: { size: 15 },
        customdata: o.map((v) => v.f), hovertemplate: "%{x}: EUR %{y:,.1f} M<br>fuente: %{customdata}<extra></extra>" }],
        { margin: { l: 50, r: 10, t: 24, b: 36 }, yaxis: { title: { text: "millones de EUR" }, gridcolor: css("--linea"), range: [0, E.sem_maximo.v / 1e6 * 1.18] },
          xaxis: { tickfont: { size: 14 } }, showlegend: false });
    },
  });

  // 2 · Diseño de la cobertura
  P.push({
    t: "Diseño de la cobertura",
    html: () => {
      const filas = esc3.map((e) => `<tr class="${e.nivel === "medio" ? "res" : ""}"><td class="txt">${esc(e.nombre)}</td><td>${c(e.sigma, "pct", 2)}</td>
        <td>${c(e.spot_ene, "n", 4)} → ${c(e.spot_jun, "n", 4)}</td><td>${c(e.sin_cobertura, "musd")}</td><td class="mejor">${c(e.con_futuros, "musd")}</td>
        <td>${c(e.con_puts_ATM, "musd")}</td><td>${c(e.con_puts_OTM, "musd")}</td>
        <td>${c(e.gp_futuros, "musd")} / ${c(e.gp_puts_ATM, "musd")} / ${c(e.gp_puts_OTM, "musd")}</td></tr>`).join("");
      const riesgo = esc3.map((e) => `<tr class="${e.nivel === "medio" ? "res" : ""}"><td class="txt">${esc(e.nombre)}</td><td>${c(e.sigma, "pct", 2)}</td><td>${c(e.costo_en_riesgo, "musd")}</td><td>${c(e.materialidad, "pct", 2)}</td></tr>`).join("");
      return `
      <h1>Diseño de la cobertura: futuros (A) y puts (B) sobre el euro</h1>
      <div class="ficha">
        <div><div class="et">Qué cubrimos</div><div class="va">Escenario mínimo</div><div class="de">${c(E.sem_minimo, "meur")} · ${c(A.cob_base, "pct", 0)} del base</div></div>
        <div><div class="et">Cuántos futuros 6E</div><div class="va">${c(A.N_mes, "n")} por mes</div><div class="de">${c(A.N, "n")} en total · EUR 125,000 c/u</div></div>
        <div><div class="et">Razón de cobertura</div><div class="va">h = 1</div><div class="de">mismo activo: EUR/USD</div></div>
        <div><div class="et">Dirección</div><div class="va">Venta (corto)</div><div class="de">KO fija hoy a cuánto vende sus euros</div></div>
        <div><div class="et">Precio pactado (F₀)</div><div class="va f0"><span>${c(A.F0.ECH27, "n", 4)}</span><span>${c(A.F0.ECM27, "n", 4)}</span><span>${c(A.F0.ECU27, "n", 4)}</span></div><div class="de f0d"><span>mar</span><span>jun</span><span>sep 2027</span></div></div>
      </div>
      <div class="tarjeta"><h3>Tres escenarios con precio pactado único: el euro cierra en su peor caso (P5) · ingreso del semestre</h3>
        <div class="tabla-env"><table>
        <thead><tr><th>Escenario</th><th>σ</th><th>Spot al cierre (ene → jun)</th><th>Sin cobertura</th><th>Con futuros</th><th>Con puts ATM</th><th>Con puts OTM</th><th>Ganancia del derivado: fut. / ATM / OTM</th></tr></thead>
        <tbody>${filas}</tbody></table></div>
        <p class="nota">Puts con prima ya restada: ATM ${c(D.B_costo.ATM, "musd")} y OTM (1.050) ${c(D.B_costo.OTM, "musd")}. Futuros: sin prima; margen inicial ${c(A.margen, "musd")}.</p></div>
      <div class="rejilla r3">
        <div class="tarjeta"><h3>Ingreso en el peor caso (millones de USD)</h3>${amp("g2")}<div id="g2" class="graf"></div></div>
        <div class="tarjeta"><h3>¿Qué tan riesgoso es el euro?</h3><div class="tabla-env"><table>
          <thead><tr><th>Escenario</th><th>σ</th><th>Costo en riesgo</th><th>Materialidad</th></tr></thead><tbody>${riesgo.replace(/Riesgo /g, "")}</tbody></table></div>
          <p class="nota">Aun con la volatilidad más alta de 5 años, el riesgo es ≈ 2 % de la utilidad del semestre.</p></div>
        <div class="tarjeta"><h3>Pruebas de estrés</h3>
          <div class="estres-t"><b>Crisis 2022</b> (euro ${c(ES.eur, "pct", 2)} en 26 semanas):</div>
          <table class="mini"><tbody>
            <tr><td class="txt">Sin cubrir</td><td>${c(ES.sin, "musd")}</td><td class="txt">Futuros</td><td class="mejor">${c(ES.A, "musd")}</td></tr>
            <tr><td class="txt">Puts ATM</td><td>${c(ES.B_ATM, "musd")}</td><td class="txt">Puts OTM</td><td>${c(ES.B_OTM, "musd")}</td></tr></tbody></table>
          <div class="estres-t"><b>Volumen −30 %:</b> sobran ${c(V.sobre, "meur")} cubiertos (${c(V.sobre_pct, "pct", 1)} de lo que llega).</div>
        </div>
      </div>`;
    },
    g: () => {
      const x = esc3.map((e) => e.nombre.replace("Riesgo ", ""));
      const tr = [["Sin cobertura", "sin_cobertura", "--sin"], ["Con futuros", "con_futuros", "--a"], ["Puts ATM", "con_puts_ATM", "--b"], ["Puts OTM", "con_puts_OTM", "--b2"]]
        .map(([n, k, col]) => ({ type: "bar", name: n, x, y: esc3.map((e) => e[k].v / 1e6), marker: { color: css(col) },
          customdata: esc3.map((e) => e[k].f), hovertemplate: n + ": USD %{y:,.1f} M<br>fuente: %{customdata}<extra></extra>" }));
      const ys = esc3.flatMap((e) => ["sin_cobertura", "con_futuros", "con_puts_ATM", "con_puts_OTM"].map((k) => e[k].v / 1e6));
      dibuja("g2", tr, { barmode: "group", margin: { l: 46, r: 8, t: 8, b: 56 }, legend: { orientation: "h", x: 0, y: -0.16, yanchor: "top", font: { size: 11 } }, yaxis: { range: [Math.min(...ys) * 0.97, Math.max(...ys) * 1.01], gridcolor: css("--linea") } });
    },
  });

  // 3 · Especulación con petróleo
  P.push({
    t: "Especulación con petróleo",
    html: () => {
      const cand = D.C_cand.map((x) => `<tr class="${/spread/i.test(x.nombre) ? "res" : ""}"><td class="txt">${esc(x.nombre)}</td><td>${c(x.n, "n")}</td><td>${c(x.E_hist, "musd", 2)}</td><td>${c(x.E_impl, "musd", 2)}</td><td>${c(x.P, "pct", 1)}</td></tr>`).join("");
      return `
      <h1>Especulación con petróleo (C): bull call spread 84/97, con pérdida acotada</h1>
      <div class="ficha c">
        <div><div class="et">Presupuesto y área</div><div class="va">USD 10 M</div><div class="de">Strategic Growth, aparte</div></div>
        <div><div class="et">Activo</div><div class="va">Petróleo WTI (CL)</div><div class="de">el más volátil: ${c(C.vol_hist, "pct", 1)} anual</div></div>
        <div><div class="et">Estrategia (LOH27)</div><div class="va">Compra 84 · vende 97</div><div class="de">calls de mar-2027, vencen 17-feb</div></div>
        <div><div class="et">Tamaño</div><div class="va">${c(C.n, "n")} spreads</div><div class="de">prima neta ${c(C.prima_neta, "n", 2)} USD/bbl × 1,000 bbl</div></div>
        <div><div class="et">Pérdida máx. · ganancia máx. (USD)</div><div class="va"><span class="malo">${c(C.prima_total, "musd", 1).replace("USD ", "")}</span> · <span class="bueno">${c(C.gan_max, "musd", 2).replace("USD ", "")}</span></div><div class="de">gana arriba de ${c(C.equilibrio, "n", 2)}</div></div>
      </div>
      <div class="rejilla r2c">
        <div class="tarjeta"><h3>Por qué petróleo: volatilidad contra liquidez de los 11 activos</h3>${amp("g3a")}<div id="g3a" class="graf"></div></div>
        <div class="tarjeta"><h3>Pago al vencimiento, por barril</h3>${amp("g3b")}<div id="g3b" class="graf"></div></div>
      </div>
      <div class="rejilla r2d">
        <div class="tarjeta"><h3>Por qué esta estrategia: resultado esperado (100,000 simulaciones)</h3><div class="tabla-env"><table>
          <thead><tr><th>Estrategia</th><th>Contratos</th><th>E[resultado] σ hist.</th><th>E[resultado] σ impl.</th><th>P(ganar)</th></tr></thead><tbody>${cand}</tbody></table></div></div>
        <div class="tarjeta"><h3>Backtest (mayo a noviembre 2026)</h3>
          <p class="estres-t"><span class="va malo grande">${c(D.bt.C, "musd", 1)}</span> con la misma regla: el petróleo bajó de 105.42 a 97.97, debajo del strike comprado, y se perdió toda la prima. Es el riesgo aceptado: nunca pasa del presupuesto.</p></div>
      </div>`;
    },
    g: () => {
      const fut = D.activos.filter((a) => a.vol && a.oi);
      dibuja("g3a", [{ type: "scatter", mode: "markers+text", x: fut.map((a) => a.oi.v), y: fut.map((a) => a.vol.v * 100), text: fut.map((a) => a.ticker.replace("=F", "")),
        textposition: "top center", marker: { size: 12, color: fut.map((a) => (a.ticker === "CL=F" ? css("--a") : css("--sin"))) },
        customdata: fut.map((a) => [a.vol.f, a.oi.f]), hovertemplate: "%{text}<br>Vol. %{y:.1f}%<br>IA %{x:,}<br>%{customdata[0]}<extra></extra>" }],
        { margin: { l: 50, r: 10, t: 18, b: 40 }, yaxis: { title: { text: "volatilidad anual (%)" }, gridcolor: css("--linea"), range: [0, 50] }, xaxis: { type: "log", title: { text: "interés abierto (escala log)" }, gridcolor: css("--linea") }, showlegend: false });
      const K1 = C.K1.v, K2 = C.K2.v, pr = C.prima_neta.v, xs = [];
      for (let s = 60; s <= 115; s += 0.5) xs.push(s);
      const bruto = xs.map((s) => Math.max(s - K1, 0) - Math.max(s - K2, 0));
      dibuja("g3b", [
        { type: "scatter", name: "Pago bruto", x: xs, y: bruto, line: { color: css("--b2") } },
        { type: "scatter", name: "Prima neta (costo)", x: xs, y: xs.map(() => -pr), line: { color: css("--b"), dash: "dash" } },
        { type: "scatter", name: "Resultado neto", x: xs, y: bruto.map((b) => b - pr), line: { color: css("--a"), width: 3 } },
      ], { margin: { l: 50, r: 10, t: 30, b: 40 }, xaxis: { title: { text: "CL al vencimiento (USD/bbl)" }, gridcolor: css("--linea") }, yaxis: { title: { text: "USD por barril" }, gridcolor: css("--linea") } });
    },
  });

  // 4 · Recomendación
  P.push({
    t: "Recomendación",
    html: () => `
      <h1>Recomendación a la Mesa: qué hacer, cuánto cuesta y qué nos haría cambiar</h1>
      <div class="recomendacion">El riesgo cambiario del semestre es pequeño frente a la utilidad de operación (materialidad ≈ ${c(D.materialidad, "pct", 2)}), por lo que la cobertura no es indispensable. <b>Si la Mesa prioriza certeza del presupuesto, recomendamos futuros 6E en corto sobre la parte verificable (escenario mínimo), ejecutados con stack and roll.</b> Las puts OTM son la alternativa barata si se quiere conservar la ganancia cuando el euro sube. La especulación con petróleo es independiente, para Strategic Growth.</div>
      <div class="ficha">
        <div><div class="et">Costo de los futuros</div><div class="va">Sin prima</div><div class="de">margen ${c(A.margen, "musd")} · liquidez al 95 % ${c(L.mc_medio, "musd")}</div></div>
        <div><div class="et">Costo de las puts</div><div class="va">OTM ${c(D.B_costo.OTM, "musd")}</div><div class="de">ATM ${c(D.B_costo.ATM, "musd")} · sin margen</div></div>
        <div><div class="et">Protección (peor caso, σ media)</div><div class="va">${c(medio.con_futuros, "musd")}</div><div class="de">con futuros, contra ${c(medio.sin_cobertura, "musd")} sin cubrir</div></div>
        <div><div class="et">A lo que se renuncia</div><div class="va">Subida del euro</div><div class="de">con futuros, sobre los euros cubiertos</div></div>
      </div>
      <div class="rejilla r3i">
        <div class="tarjeta"><h3>Riesgos que permanecen</h3><ul class="lista">
          <li><b>Volumen:</b> si llegan 30 % menos euros, ${c(V.sobre, "meur")} quedan cubiertos de más.</li>
          <li><b>Liquidez:</b> con σ alta, margen y pérdidas llegan a ${c(L.mc_alto, "musd")}.</li>
          <li><b>Base:</b> los euros llegan a fin de mes y los futuros vencen después; el spot se fija a otra hora.</li>
        </ul></div>
        <div class="tarjeta"><h3>Condiciones para cambiar</h3><ul class="lista">
          <li>Baja el pronóstico de euros → reducir futuros o pasar a puts.</li>
          <li>KO no puede comprometer la liquidez → puts OTM.</li>
          <li>Sube la volatilidad (materialidad ${c(alto.materialidad, "pct", 2)}) o la Mesa quiere certeza total → ampliar la cobertura.</li>
        </ul></div>
        <div class="tarjeta"><h3>Implementación</h3><ul class="lista">
          <li><b>Quién:</b> Tesorería de KO, con un bróker de CME como coberturista.</li>
          <li><b>Cómo:</b> vender ${c(A.N, "n")} futuros de diciembre 2026 (IA ${c(A.dec26_ia, "n")}) y rolarlos en cada vencimiento.</li>
          <li><b>Qué se vigila:</b> pérdidas contra la línea de liquidez y euros esperados contra lo cubierto.</li>
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

  P.push({
    t: "Anexo · Activos (C)", anexo: true,
    html: () => `
      <h1>Los 11 activos evaluados para la especulación: volatilidad y liquidez (13-nov-2026)</h1>
      <div class="tarjeta"><div class="tabla-env"><table><thead><tr><th>Serie</th><th>Vol. anual</th><th>Volumen</th><th>Interés abierto</th></tr></thead><tbody>${D.activos.map((a) => `<tr><td class="txt">${esc(a.desc)} <span class="etiq ${a.ticker === "CL=F" ? "si" : ""}">${esc(a.ticker)}</span></td>
        <td>${a.vol ? c(a.vol, "pct", 1) : "No encontrado"}</td><td>${a.volumen ? c(a.volumen, "n") : "—"}</td><td>${a.oi ? c(a.oi, "n") : "—"}</td></tr>`).join("")}</tbody></table></div>
        <p class="nota">CL: mayor volatilidad con liquidez profunda y el mayor volumen de opciones (${c(D.opc_vol_cl, "n")} en DEC26). HO es casi igual de volátil, pero sus opciones casi no se negocian. Compra call 84 @ ${c(C.p1, "n", 2)}, vende call 97 @ ${c(C.p2, "n", 2)}; F₀ = ${c(C.F0, "n", 2)}; ejercicio ${c(C.americana, "txt")}; implícita ATM ${c(C.iv_atm, "pct", 1)}.</p></div>`,
  });

  // ------------------------------------------------------------ armado y navegación
  const main = document.getElementById("pantallas");
  // índice 0 = portada; 1..principales = pantallas; después, el anexo
  const principales = P.filter((p) => !p.anexo && !p.portada).length;
  const etiqueta = (i) => (P[i].portada ? "0" : P[i].anexo ? "A" + (i - principales) : String(i));
  main.innerHTML = P.map((p, i) => `<section class="pantalla${p.anexo ? " anexo" : ""}${p.portada ? " es-portada" : ""}" id="p${i}" data-i="${i}">${p.portada ? "" : `<div class="num">${p.anexo ? "Anexo " + etiqueta(i) : i + " / " + principales} · ${esc(p.t.replace("Anexo · ", ""))}</div>`}${p.html()}
    ${p.portada ? "" : `<div class="pie-imp">${esc(D.meta.empresa)} · Proyecto Final Derivados · ${esc(D.meta.equipo)} · Corte ${esc(D.meta.corte)} · ${p.anexo ? "Anexo " + etiqueta(i) : "Pantalla " + i + " de " + principales}</div>`}</section>`).join("");
  document.getElementById("meta").textContent = `${D.meta.empresa} · corte ${D.meta.corte} · ${D.meta.equipo}`;
  const puntos = document.getElementById("puntos");
  puntos.innerHTML = P.map((p, i) => (p.anexo ? "" : `<button data-i="${i}" title="${esc(p.t)}" aria-label="${p.portada ? "Portada" : "Pantalla " + i + ": " + esc(p.t)}">${p.portada ? "⌂" : i}</button>`)).join("") +
    `<select id="anexo" aria-label="Anexo"><option value="">Anexo ▾</option>${P.map((p, i) => (p.anexo ? `<option value="${i}">${etiqueta(i)} · ${esc(p.t.replace("Anexo · ", ""))}</option>` : "")).join("")}</select>`;
  const selA = document.getElementById("anexo");
  selA.onchange = () => { if (selA.value !== "") ir(+selA.value, "usuario"); };

  let actual = -1, siguiendo = true, ultimoPresentador = null;
  const dibujadas = new Set();
  function ir(i, origen) {
    i = Math.max(0, Math.min(P.length - 1, i));
    if (origen === "usuario" && !PRESENTADOR && CON_SYNC && ultimoPresentador !== null && i !== ultimoPresentador) { siguiendo = false; estado(); }
    if (i === actual) return;
    cierraFull();
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
        else document.querySelectorAll(`#p${i} .graf`).forEach((g) => window.Plotly && Plotly.Plots.resize(g));
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

  // ------------------------------------------------------------ gráfica en pantalla completa
  function cierraFull() {
    const f = document.querySelector(".tarjeta.full");
    if (!f) return;
    f.classList.remove("full"); document.body.classList.remove("con-full");
    f.querySelectorAll(".graf").forEach((g) => window.Plotly && Plotly.Plots.resize(g));
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".ampliar");
    if (!b) return;
    const t = b.closest(".tarjeta");
    if (t.classList.contains("full")) { cierraFull(); return; }
    cierraFull(); t.classList.add("full"); document.body.classList.add("con-full");
    requestAnimationFrame(() => t.querySelectorAll(".graf").forEach((g) => window.Plotly && Plotly.Plots.resize(g)));
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") cierraFull(); }, true);

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
        .then((r) => estado(r.ok ? (i < 0 ? "bienvenida (QR) enviada" : `pantalla ${etiqueta(i)} enviada`) : "sin conexión"))
        .catch(() => estado("sin conexión"));
    }, 150);
  }
  function recibe(msg) {
    const i = parseInt(msg, 10);
    if (i === -1) { if (siguiendo) muestraInstr(true); return; }   // el presentador tiene abierto el QR de bienvenida
    if (isNaN(i) || i < 0 || i >= P.length) return;
    muestraInstr(false);
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

  // ------------------------------------------------------------ QR de bienvenida (solo presentador)
  // Se muestra al abrir ?presenter=1, antes de la portada. Los espectadores no lo ven: mientras está abierto
  // el presentador publica la pantalla 0 (portada). → / Enter / Espacio / clic en "Comenzar" lo cierra; la tecla Q lo vuelve a abrir.
  const QR_IFRAME = "https://ctrl-x.com.mx/qr-3d-view.php?id=ecf5c1ae2b&embed=1";   // QR 3D cuyo contenido es URL_PUBLICA (verificado 26-nov-2026)
  const URL_PUBLICA = "https://diego-png09.github.io/ko-derivados-dashboard/";
  let qrAbierto = false;
  const INSTR = `<ol class="instr">
      <li><span class="ic">✋</span><div><b>No toques nada.</b> Tu pantalla avanza sola, al mismo tiempo que la nuestra.</div></li>
      <li><span class="ic"><u>123</u></span><div><b>Cifras subrayadas:</b> tócalas y aparece de dónde sale el dato (documento, nota y página).</div></li>
      <li><span class="ic">↗</span><div><b>Flechita junto a una cifra:</b> abre la fuente original (SEC, CME, reportes anuales). Mejor ábrela al final, para no perderte.</div></li>
      <li><span class="ic">⤢</span><div><b>En una gráfica:</b> la abre en pantalla completa.</div></li>
      <li><span class="ic">↩</span><div><b>Si te mueves de pantalla,</b> arriba aparece "seguir al presentador": tócalo y vuelves con nosotros.</div></li>
      <li><span class="ic">▾</span><div><b>Anexo:</b> el detalle técnico, para revisarlo después.</div></li>
    </ol>`;
  function abreQR() {
    let el = document.getElementById("bienvenida");
    if (!el) {
      el = document.createElement("div");
      el.id = "bienvenida";
      el.innerHTML = `<div class="bv-caja">
          <div class="bv-izq">
            <div class="port-kicker">The Coca-Cola Company (KO) · Proyecto Final Derivados</div>
            <h1>Escanea para seguir la presentación en tu celular</h1>
            <p class="bv-url">${esc(URL_PUBLICA.replace("https://", ""))}</p>
            ${INSTR}
            <button id="bv-ir">Comenzar →</button>
          </div>
          <div class="bv-qr"><iframe src="${esc(QR_IFRAME)}" title="Código QR de la presentación" allowfullscreen></iframe>
            <img src="qr.png" alt="QR de respaldo" class="bv-respaldo"></div>
        </div>`;
      document.body.appendChild(el);
      el.querySelector("#bv-ir").onclick = cierraQR;
    }
    el.hidden = false; qrAbierto = true;
    publica(-1);   // los espectadores ven las instrucciones
  }
  function cierraQR() {
    const el = document.getElementById("bienvenida");
    if (el) el.hidden = true;
    qrAbierto = false;
    publica(actual);   // los espectadores pasan a la pantalla actual (la portada al empezar)
  }
  // vista del espectador mientras el presentador tiene abierto el QR
  function muestraInstr(si) {
    let el = document.getElementById("instr-esp");
    if (!si) { if (el) el.hidden = true; return; }
    if (!el) {
      el = document.createElement("div");
      el.id = "instr-esp";
      el.innerHTML = `<div class="ie-caja"><div class="port-kicker">The Coca-Cola Company (KO) · Proyecto Final Derivados</div>
        <h1>Bienvenido: así funciona esta presentación</h1>${INSTR}
        <p class="ie-espera"><span class="pt"></span>Esperando a que empiece la presentación…</p></div>`;
      document.body.appendChild(el);
    }
    el.hidden = false;
  }
  document.addEventListener("keydown", (e) => {
    if (!PRESENTADOR || IMPRIMIR) return;
    if (qrAbierto && ["ArrowRight", "Enter", " ", "PageDown", "Escape"].includes(e.key)) { e.preventDefault(); e.stopImmediatePropagation(); cierraQR(); }
    else if (!qrAbierto && (e.key === "q" || e.key === "Q") && !["INPUT", "SELECT"].includes(e.target.tagName)) abreQR();
  }, true);

  // ------------------------------------------------------------ inicio
  if (PRESENTADOR) document.body.classList.add("proyeccion");
  if (IMPRIMIR) {
    document.body.classList.add("imprimir");
    document.documentElement.setAttribute("data-theme", "light");
    document.querySelectorAll(".pantalla").forEach((s) => s.classList.add("activa"));
    P.forEach((p) => p.g && p.g());
    window.LISTO = true;
  } else {
    const h = (location.hash || "#0").slice(1);
    const idx = h.startsWith("A") ? principales + parseInt(h.slice(1), 10) : parseInt(h, 10);
    ir(isNaN(idx) ? 0 : idx, "inicio");
    if (CON_SYNC) { estado(); if (PRESENTADOR) publica(actual); else suscribe(); }
    if (PRESENTADOR && !HASH_INICIAL) abreQR();   // al abrir el enlace del presentador sin #pantalla
  }
})();
