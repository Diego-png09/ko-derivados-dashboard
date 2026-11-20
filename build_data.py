"""Paso 9 · Exporta a dashboard/data.json (y data.js) las cifras que usa el dashboard.

Solo LEE outputs/*.md y entregables/modelo/Modelo_KO_derivados.xlsx; no recalcula nada.
Cada cifra va como {"v": valor, "f": "archivo · sección/hoja"}.
data.js contiene lo mismo como `window.DATA = ...` para que el sitio funcione también abriendo
index.html directo (file://), sin servidor.
Uso: .venv/bin/python dashboard/build_data.py
"""
from pathlib import Path
import json, re
import openpyxl

R = Path(__file__).resolve().parents[1]
O = R / "outputs"
XL = R / "entregables/modelo/Modelo_KO_derivados.xlsx"
XLN = "entregables/modelo/Modelo_KO_derivados.xlsx"
D = Path(__file__).resolve().parent


# ---------------------------------------------------------------- lectura
def num(s):
    """'1,636.1' → 1636.1 · '77.83%' → 0.7783 · 'USD 1,900' → 1900 · '−0.089%' → -0.00089."""
    if s is None:
        return None
    t = str(s).replace("**", "").replace("USD", "").replace("−", "-").replace(",", "").strip()
    t = re.sub(r"\s*\(.*\)$", "", t).strip()
    t = re.sub(r"\s*M$", "", t)
    pct = t.endswith("%")
    t = t.rstrip("%").replace(" ", "").lstrip("+")
    try:
        x = float(t)
    except ValueError:
        return None
    return x / 100 if pct else x


def limpio(s):
    return re.sub(r"\*\*|`", "", s).strip()


def md_tabla(archivo, seccion, cabecera=None):
    """Primera tabla después del encabezado que contiene `seccion` (y cuya cabecera
    contiene `cabecera`, si se da). Devuelve (lista de dicts, fuente)."""
    lineas = (O / archivo).read_text().splitlines()
    ini = next(i for i, l in enumerate(lineas) if l.startswith("#") and seccion in l)
    titulo = limpio(lineas[ini].lstrip("# "))
    i = ini + 1
    while True:
        while not lineas[i].startswith("|"):
            i += 1
        bloque = []
        while i < len(lineas) and lineas[i].startswith("|"):
            bloque.append(lineas[i]); i += 1
        cab = [limpio(c) for c in bloque[0].strip().strip("|").split("|")]
        if cabecera is None or any(cabecera in c for c in cab):
            break
    filas = [[limpio(c) for c in l.strip().strip("|").split("|")] for l in bloque[2:]]
    return [dict(zip(cab, f)) for f in filas], f"outputs/{archivo} · {titulo}"


def md_dato(archivo, cifra):
    """Valor (texto) de la tabla 'Datos para interpretar' cuya cifra empieza con `cifra`."""
    filas, f = md_tabla(archivo, "Datos para interpretar")
    fila = next(x for x in filas if x["Cifra"].startswith(cifra))
    return fila["Valor"], f


def xl_hoja(nombre, fila_cab=4):
    ws = wb[nombre]
    filas = list(ws.iter_rows(min_row=fila_cab, values_only=True))
    cab = [c for c in filas[0] if c is not None]
    out = []
    for r in filas[1:]:
        if r[0] is None:
            break
        out.append(dict(zip(cab, r)))
    return out, f"{XLN} · hoja {nombre}"


def c(v, f):
    return {"v": v, "f": f}


wb = openpyxl.load_workbook(XL, data_only=True)
DATA = {"meta": {
    "titulo": "Cobertura cambiaria de KO con derivados",
    "empresa": "The Coca-Cola Company (KO)",
    "equipo": "Diego Avila Chavez y Santiago Mondragon Apodaca",
    "corte": "13-nov-2026",
    "periodo": "ene–jun 2027",
    "nota": "Cifras leídas de outputs/ y entregables/modelo/ por dashboard/build_data.py; el dashboard no recalcula nada, salvo los dos controles interactivos (fórmulas de pago con las cifras exportadas).",
}}

# ---------------------------------------------------------------- 1 · El riesgo
exp, fx = xl_hoja("Exposición")
DATA["exposicion"] = [{"mes": e["mes"], "base": c(e["eur_base"], fx), "min": c(e["eur_minimo"], fx),
                       "max": c(e["eur_maximo"], fx)} for e in exp]
cal, fcal = md_tabla("paso2_exposicion.md", "C.6 Calendario mensual")
tot = next(x for x in cal if x["Mes"].startswith("Total"))
DATA["exposicion_total"] = {k: c(num(tot[col]), fcal) for k, col in
                            [("eur_base", "EUR base"), ("eur_min", "EUR mínimo"), ("eur_max", "EUR máximo"),
                             ("usd_base", "USD base"), ("usd_min", "USD mínimo"), ("usd_max", "USD máximo")]}
cer, fcer = md_tabla("paso4_estadistica.md", "4. Costo en riesgo por mes")
DATA["costo_riesgo_mes"] = [{"mes": x["Mes"], "F0": c(num(x["F₀"]), fcer), "P5": c(num(x["P5"]), fcer),
                             "presupuesto": c(num(x["Presupuesto USD (base)"]), fcer),
                             "ingreso_P5": c(num(x["Ingreso a P5 USD (base)"]), fcer),
                             "cer": c(num(x["Costo en riesgo (base)"]), fcer)}
                            for x in cer if x["Mes"].startswith("2027")]
sem = next(x for x in cer if x["Mes"].startswith("Semestre"))
DATA["costo_riesgo"] = {"base": c(num(sem["Costo en riesgo (base)"]), fcer),
                        "min": c(num(sem["Costo en riesgo (mín.)"]), fcer),
                        "max": c(num(sem["Costo en riesgo (máx.)"]), fcer),
                        "presupuesto": c(num(sem["Presupuesto USD (base)"]), fcer),
                        "ingreso_P5": c(num(sem["Ingreso a P5 USD (base)"]), fcer)}
v, f = md_dato("paso4_estadistica.md", "Materialidad")
DATA["materialidad"] = c(num(v), f)
DATA["utilidad_op_H1_2026"] = c(9031e6, "outputs/paso4_estadistica.md · 4. Costo en riesgo por mes (Materialidad: XBRL OperatingIncomeLoss, 10-Q Q2-2026)")
v, f = md_dato("paso4_estadistica.md", "σ usada en el costo en riesgo")
DATA["sigma_eur"] = c(num(v), f)

# ---------------------------------------------------------------- 2 · Por qué el euro
fb3 = "outputs/paso2_exposicion.md · B.3 Ingresos fuera de EE. UU. y menciones del euro"
fb4 = "outputs/paso2_exposicion.md · B.4 Coberturas cambiarias y sensibilidad"
fc3 = "outputs/paso2_exposicion.md · C.3 Escalón EMEA → Europa"
fc4 = "outputs/paso2_exposicion.md · C.4 Participación de la eurozona en Europa (CCEP)"
DATA["cadena"] = {
    "ingresos_intl_pct": c(0.601, fb3 + " (10-K FY2025, Nota 17, p. 116)"),
    "ingresos_intl": c(28814e6, fb3), "ingresos_tot": c(47941e6, fb3),
    "euro_2025": c(0.04, fb3 + " (10-K, Item 7, p. 57)"),
    "deuda_eur": c(15470e6, fb3 + " (10-K, nota de deuda, p. 89)"),
    "nocional_fx": c(21128e6, fb4 + " (10-K, Item 7A, p. 58)"),
    "ccep_compras": c(4543e6, fc3 + " (CCEP 20-F FY2025, Nota 20, p. 186; EUR)"),
    "cchbc_compras": c(1931.2e6, fc3 + " (CCHBC IAR 2025, Nota 27 a), p. 322; EUR)"),
    "suma_base": c(3021e6, fc3 + " (EUR, 2025)"),
    "europa_en_emea": {"min": c(0.3575, fc3), "base": c(0.4157, fc3), "max": c(0.50, fc3 + " (supuesto del equipo)")},
    "eurozona_en_europa": c(0.7132, fc4),
    "emea_2025_usd": c(11513e6, fc3),
}
cand, fcand = md_tabla("paso1_candidatos.md", "C) Tabla de candidatos")
motivo = {
    "6E": ("Elegido · cobertura A y B", "outputs/paso5a_coberturas.md"),
    "CL": ("Elegido · especulación C", "outputs/paso5b_especulacion.md"),
    "ZC": ("Descartado: sin serie semanal pública del JMAF; KO no publica volumen ni costo; lo compran los embotelladores (CCBSS)", "outputs/paso2_viabilidad_maiz.md"),
    "SB": ("Descartado: sin serie semanal gratuita del azúcar refinada; KO no publica volumen ni costo", "outputs/paso2_viabilidad_azucar.md"),
    "6M": ("No elegido: opciones casi sin liquidez (DEC26: volumen 0, IA 398)", "outputs/paso1_candidatos.md"),
    "ALI": ("No elegido: liquidez muy baja (volumen 77)", "outputs/paso1_candidatos.md"),
    "HO": ("No elegido: opciones con poca liquidez (281 en DEC26)", "outputs/paso1_candidatos.md"),
    "KC": ("No elegido", "outputs/paso1_candidatos.md"),
    "OJ": ("Descartado: Yahoo sin historial al 16-nov-2026", "outputs/paso1_candidatos.md"),
}
DATA["candidatos"] = [{"activo": x["Activo"], "futuro": x["Futuro"], "bolsa": x["Bolsa"],
                       "vol": c(num(x["Vol. anual (Cálculo)"]), fcand),
                       "ia": c(num(x["Interés abierto"]), fcand),
                       "estado": motivo.get(x["Futuro"], ("", ""))[0],
                       "estado_f": motivo.get(x["Futuro"], ("", ""))[1]} for x in cand]

# ---------------------------------------------------------------- 3 · ¿El futuro sirve?
reg, freg = md_tabla("paso4_estadistica.md", "3. Regresión")
DATA["regresion"] = [{"spot": x["Spot"], "version": x["Versión"], "h": c(num(x["h*"]), freg),
                      "ee": c(num(x["Error estándar de h*"]), freg), "R2": c(num(x["R²"]), freg)} for x in reg]
fred = next(x for x in reg if x["Spot"] == "FRED" and x["Versión"] == "sin roll")
DATA["h_estrella"] = c(num(fred["h*"]), freg)
DATA["R2"] = c(num(fred["R²"]), freg)
v, f = md_dato("paso4_estadistica.md", "Baja de la desviación estándar")
DATA["baja_desv"] = c(num(v), f)
DATA["h_usada"] = c(0.942, "outputs/paso5a_coberturas.md · Decisiones del equipo (h* = 0.942, Paso 4b)")
bst, fbst = md_tabla("paso4_estadistica.md", "3. Regresión", cabecera="Media")
DATA["base_desv"] = [{"spot": x["Spot"], "desv": c(num(x["Desviación estándar"]), fbst)} for x in bst]
sal, fsal = md_tabla("paso4_estadistica.md", "2. ¿El error está en Yahoo?")
DATA["saltos_yahoo"] = [{"semana": x["Semana"], "yahoo": c(num(x["S−F Yahoo"]), fsal),
                         "fred": c(num(x["S−F FRED"]), fsal)} for x in sal]
dat, fdat = xl_hoja("Datos")
DATA["serie_base_fred"] = {"f": fdat, "fecha": [str(x["viernes"])[:10] for x in dat],
                           "S": [x["spot_FRED_DEXUSEU"] for x in dat], "F": [x["fut_6E=F"] for x in dat],
                           "base": [x["base_S-F"] for x in dat], "CL": [x["CL=F"] for x in dat]}
cur, fcur = md_tabla("paso3_contrato.md", "3. Curva de futuros y paridad")
DATA["curva"] = [{"contrato": x["Contrato"], "F": c(num(x["Liquidación 6E"]), fcur),
                  "paridad": c(num(x["F de paridad"]), fcur)} for x in cur]
DATA["spot_13nov"] = c(1.10502, fcur.split(" · ")[0] + " · 3. Curva de futuros y paridad de tasas (Yahoo EURUSD=X)")
DATA["spot_fred_13nov"] = c(1.1034, "outputs/paso5a_coberturas.md · A) Futuros 6E en corto (FRED DEXUSEU)")
DATA["tam_6E"] = c(125000, "outputs/paso3_contrato.md · 1. Ficha del contrato 6E (Euro FX, CME)")
DATA["bbl_CL"] = c(1000, "outputs/paso5b_especulacion.md · 1. Estilo de ejercicio y último día (\"1,000 barrels\")")
DATA["tasas"] = {"usd_3m": c(0.04209, fcur), "eur_3m": c(0.02641, fcur)}

# ---------------------------------------------------------------- 4 · A futuros
fa, ffa = md_tabla("paso5a_coberturas.md", "A) Futuros 6E en corto")
DATA["A"] = [{"mes": x["Mes"], "codigo": x["Código"], "N": c(num(x["N"]), ffa),
              "eur_cub": c(num(x["EUR cubiertos"]), ffa), "cob": c(num(x["Cobertura efectiva"]), ffa),
              "F0": c(num(x["F₀ (CME)"]), ffa), "justo": c(num(x["Precio justo"]), ffa),
              "margen": c(num(x["Margen inicial (USD 1,900 × N)"]), ffa)} for x in fa if x["Mes"].startswith("2027")]
t = next(x for x in fa if x["Mes"].startswith("Total"))
DATA["A_total"] = {"N": c(num(t["N"]), ffa), "eur_cub": c(num(t["EUR cubiertos"]), ffa),
                   "cob": c(num(t["Cobertura efectiva"]), ffa), "margen": c(num(t["Margen inicial (USD 1,900 × N)"]), ffa)}
v, f = md_dato("paso5a_coberturas.md", "p (EUR mínimo")
DATA["p"] = c(num(v), f)
ia, fia = md_tabla("paso5a_coberturas.md", "Ejecución: N frente al interés abierto")
DATA["A_ia"] = [{"contrato": x["Contrato"], "N": c(num(x["N total"]), fia), "ia": c(num(x["IA"]), fia),
                 "pct": c(num(x["N / IA"]), fia)} for x in ia]
DATA["A_dec26_ia"] = c(830219, "outputs/paso5a_coberturas.md · Plan alternativo: stack and roll")
sr, fsr = md_tabla("paso5a_coberturas.md", "Plan alternativo: stack and roll")
DATA["stack_roll"] = [{"roll": x["Roll"], "fecha": x["Fecha (vencimiento del cercano)"],
                       "contratos": c(num(x["Contratos rolados"]), fsr), "spread": c(num(x["Spread (lejano − cercano)"]), fsr),
                       "resultado": c(num(x["Resultado estimado (USD)"]), fsr)} for x in sr if x["Roll"] != "Total"]
DATA["stack_roll_total"] = c(num(next(x for x in sr if x["Roll"] == "Total")["Resultado estimado (USD)"]), fsr)
liq, fliq = md_tabla("paso6_evaluacion.md", "5. Liquidez")
def liqv(concepto, col=1):
    fila = next(x for x in liq if x["Concepto"].startswith(concepto))
    return c(num(list(fila.values())[col]) * 1e6, fliq)
DATA["liquidez"] = {
    "margen_100": liqv("Margen inicial"), "margen_110": liqv("Margen inicial", 2),
    "bt_perdida": liqv("Backtest: mayor pérdida"), "bt_necesidad_100": liqv("Backtest: necesidad"),
    "bt_necesidad_110": liqv("Backtest: necesidad", 2),
    "mc_medio_100": liqv("Montecarlo σ media: P95 de la necesidad"), "mc_medio_110": liqv("Montecarlo σ media: P95 de la necesidad", 2),
    "mc_alto_100": liqv("Montecarlo σ alta"), "mc_perdida_medio": liqv("Montecarlo σ media: P95 de la mayor"),
}
bt, fbt = xl_hoja("Backtest")
DATA["backtest"] = [{"flujo": x["flujo"], "sin": c(x["sin_cobertura"], fbt), "A": c(x["con_A"], fbt),
                     "B_ATM": c(x["con_B_ATM"], fbt), "B_OTM": c(x["con_B_OTM"], fbt),
                     "pnl_fut": c(x["pnl_futuros"], fbt), "spot": c(x["spot_fred"], fbt)} for x in bt]
btm, fbtm = md_tabla("paso6_evaluacion.md", "A, B y C por mes")
tb = next(x for x in btm if "Total" in x["Flujo"])
DATA["backtest_total"] = {k: c(num(tb[col]) * 1e6, fbtm) for k, col in
                          [("sin", "Sin cobertura"), ("pnl_fut", "P&L futuros"), ("A", "Con A"),
                           ("B_ATM", "Con B ATM"), ("B_OTM", "Con B OTM"), ("C", "C")]}

# ---------------------------------------------------------------- 5 · B puts
pb, fpb = md_tabla("paso5a_coberturas.md", "B) Puts europeos")
DATA["B"] = [{"entrega": int(x["Entrega"]), "codigo": x["Código"], "tipo": x["Tipo"],
              "K": c(num(x["Strike (vs F₀)"].split(" ")[0]), fpb), "N": c(num(x["N"]), fpb),
              "prima": c(num(x["Prima de mercado"]), fpb), "b76": c(num(x["Prima Black-76"]), fpb),
              "binom": c(num(x["Prima binomial"]), fpb), "iv": c(num(x["Vol. implícita"]), fpb),
              "costo": c(num(x["Costo total en primas (USD)"]), fpb), "piso": c(num(x["Piso por EUR (K − prima)"]), fpb),
              "ingreso_min": c(num(x["Ingreso mínimo de la entrega (USD)"]), fpb)} for x in pb]
pt, fpt = md_tabla("paso5a_coberturas.md", "B) Puts europeos", cabecera="Ingreso mínimo sobre EUR cubiertos")
DATA["B_total"] = {x["Strike"]: {"costo": c(num(x["Costo total en primas (USD)"]), fpt),
                                 "ingreso_min": c(num(x["Ingreso mínimo sobre EUR cubiertos (USD)"]), fpt)} for x in pt}
DATA["B_vencimientos"] = {"EUUH27": c("05-mar-2027", fpb), "EUUM27": c("04-jun-2027", fpb)}

# ---------------------------------------------------------------- 6 · Tablero
def tablero(hoja_fila):
    ws = wb["Tablero"]
    filas = list(ws.iter_rows(min_row=hoja_fila, values_only=True))
    out = []
    for r in filas[1:6]:
        out.append({"escenario": r[0], "sin": c(r[1], f"{XLN} · hoja Tablero"), "A": c(r[2], f"{XLN} · hoja Tablero"),
                    "B_ATM": c(r[3], f"{XLN} · hoja Tablero"), "B_OTM": c(r[4], f"{XLN} · hoja Tablero"),
                    "C": c(r[5], f"{XLN} · hoja Tablero")})
    return out
ws = wb["Tablero"]
fila_media = next(i for i, r in enumerate(ws.iter_rows(values_only=True), 1) if r[0] == "Escenario (media)")
DATA["tablero"] = {"P5": tablero(4), "media": tablero(fila_media)}
esc, fesc = md_tabla("paso6_evaluacion.md", "a) Estrés histórico")
DATA["estres"] = [{"activo": x["Activo"], "cambio": c(num(x["Peor cambio de 26 semanas"]), fesc),
                   "periodo": x["Periodo"], "evento": x["Evento (fuente)"].split(" Fuente")[0]} for x in esc]
DATA["sigmas"] = c({"EUR": [0.1098, 0.0689, 0.0461], "CL": [0.7566, 0.419, 0.2183]},
                   "outputs/paso6_evaluacion.md · b) Montecarlo (σ alto / medio / bajo)")
DATA["sobrecobertura"] = c(130.8e6, "outputs/paso6_evaluacion.md · c) Riesgo moderado con volumen −30 %")

# ---------------------------------------------------------------- 7 · C
est, fest = md_tabla("paso5b_especulacion.md", "3. Estrategias candidatas")
DATA["C_candidatas"] = [{"estrategia": x["Estrategia"], "patas": x["Patas (prima USD/bbl)"],
                         "contratos": c(num(x["Contratos"]), fest), "prima": c(num(x["Prima total (USD)"]), fest),
                         "gan_max": x["Ganancia máxima (USD)"], "equilibrio": x["Punto(s) de equilibrio (USD/bbl)"]} for x in est]
mc5, fmc5 = md_tabla("paso5b_especulacion.md", "Montecarlo")
DATA["C_mc_5b"] = [{"estrategia": x["Estrategia"], "E_hist": c(num(x["E[resultado] σ hist. 41.9 %"]), fmc5),
                    "E_impl": c(num(x["E[resultado] σ impl. 44.2%"]), fmc5), "P_hist": c(num(x["P(ganar) hist."]), fmc5),
                    "P5": c(num(x["P5 hist."]), fmc5), "P95": c(num(x["P95 hist."]), fmc5)} for x in mc5]
f5b = "outputs/paso5b_especulacion.md · 3. Estrategias candidatas (Bull call spread)"
DATA["C"] = {"F0": c(84.18, "outputs/paso5b_especulacion.md · Parámetros (F₀ CLH27)"),
             "K1": c(84.0, f5b), "K2": c(97.0, f5b), "prima1": c(7.60, f5b), "prima2": c(3.57, f5b),
             "contratos": c(2481, f5b), "barriles": c(2481000, f5b), "prima_total": c(9998430, f5b),
             "gan_max": c(22254570, f5b), "equilibrio": c(88.03, f5b),
             "vencimiento": c("17-feb-2027", "outputs/paso5b_especulacion.md · 1. Estilo de ejercicio y último día")}
smi, fsmi = md_tabla("paso5b_especulacion.md", "2. Volatilidad implícita")
DATA["sonrisa"] = {"f": fsmi, "K": [num(x["Strike"]) for x in smi],
                   "iv_call": [num(x["Vol. implícita call"]) for x in smi], "iv_put": [num(x["Vol. implícita put"]) for x in smi]}
v, f = md_dato("paso5b_especulacion.md", "Volatilidad implícita ATM")
ivatm, hist = [num(p) for p in v.split("/")]
DATA["iv_atm"] = c(ivatm, f); DATA["vol_hist_cl"] = c(hist, f)
mc6, fmc6 = md_tabla("paso6_evaluacion.md", "b) Montecarlo")
DATA["C_mc_6"] = [{"sigma": x["σ"], "media": c(num(x["Media (M USD)"]) * 1e6, fmc6), "P5": c(num(x["P5"]) * 1e6, fmc6),
                   "P95": c(num(x["P95"]) * 1e6, fmc6)} for x in mc6 if x["Estrategia"] == "C spread CL" and x["σ"] != "medio_vol30"]
fbc = "outputs/paso6_evaluacion.md · 1. Backtest (C · bull call spread CL abierto el 15-may-2026)"
DATA["C_backtest"] = {"CL_ini": c(105.42, fbc), "K1": c(105.5, fbc), "K2": c(121.0, fbc), "spreads": c(1917, fbc),
                      "CL_fin": c(97.97, fbc), "resultado": c(-10.0e6, fbc), "venc": c("15-oct-2026", fbc)}
fsim = "outputs/paso5c_boletas.md · 6. Notas de la ejecución"
DATA["simulador"] = {"margen_A": c(20901, fsim), "margen_A_est": c(19000, fsim), "margen_C_extra": c(5910, fsim),
                     "C_costo": c(8100, fsim), "CL_dia": c(81.61, fsim),
                     "margen_C_real": c(7.33e6, "outputs/paso6_evaluacion.md · 5. Liquidez (Cálculo: 5,910 / 2 × 2,481, supuesto lineal)")}

# ---------------------------------------------------------------- verificación de cifras fijas
# Las cifras escritas a mano arriba deben aparecer literalmente en su archivo fuente.
FIJAS = {
    "paso2_exposicion.md": ["60.1 %", "28,814", "47,941", "euro +4 % en 2025", "15,470", "21,128", "4,543", "1,931.2",
                            "€3,021 millones", "35.75%", "41.57%", "50.00 %", "71.32 %", "11,513"],
    "paso4_estadistica.md": ["9,031,000,000"],
    "paso5a_coberturas.md": ["**h\\*** = 0.942", "830,219", "**1.1034**"],
    "paso3_contrato.md": ["125,000", "**1.10502**", "**4.209%**", "**2.641%**"],
    "paso6_evaluacion.md": ["10.98%", "6.89 %", "4.61%", "75.66%", "41.90 %", "21.83%", "**130.8 millones de EUR**",
                            "CL=F = 105.42", "compra 105.5", "vende 121.0", "**1,917 spreads**", "97.97", "15-oct-2026", "USD 7.33 M"],
    "paso5b_especulacion.md": ["1,000 barrels", "**84.18**", "84.00 @ 7.60", "97.00 @ 3.57", "2,481", "9,998,430", "22,254,570", "88.03", "17-feb-2027"],
    "paso5c_boletas.md": ["USD 20,901", "USD 19,000", "USD 8,100", "**81.61**", "34,946 a USD 40,856"],
}
for arch, textos in FIJAS.items():
    contenido = (O / arch).read_text()
    faltan = [t for t in textos if t not in contenido]
    if faltan:
        raise SystemExit(f"Cifras fijas que no aparecen en outputs/{arch}: {faltan}")

# ---------------------------------------------------------------- salida
txt = json.dumps(DATA, ensure_ascii=False, indent=1, default=str)
(D / "data.json").write_text(txt)
(D / "data.js").write_text("// Generado por dashboard/build_data.py; no editar a mano.\nwindow.DATA = " + txt + ";\n")


def cuenta(x):
    if isinstance(x, dict):
        return (1 if set(x) == {"v", "f"} else 0) + sum(cuenta(v) for v in x.values())
    if isinstance(x, list):
        return sum(cuenta(v) for v in x)
    return 0


print("ok dashboard/data.json · cifras con fuente:", cuenta(DATA))
