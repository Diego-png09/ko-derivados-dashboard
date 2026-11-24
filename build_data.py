"""Paso 10c · Exporta a dashboard/data.json (y data.js) las cifras que usa el dashboard.

Solo LEE data/processed/ (las mismas tablas que el Excel entregables/modelo/Modelo_KO_derivados.xlsx) y
outputs/paso5c_boletas.md; no recalcula nada.
Cada cifra va como {"v": valor, "f": "archivo · sección u hoja", "u": "URL a la ubicación exacta de la fuente primaria"}.
Las URL salen de data/raw/_registro.csv; las anclas de la SEC y las páginas de PDF se verificaron el 24-nov-2026.
data.js contiene lo mismo como `window.DATA = ...` para que el sitio funcione también abriendo index.html directo.
Uso: .venv/bin/python dashboard/build_data.py
"""
from pathlib import Path
import csv, json
import pandas as pd
import yaml

R = Path(__file__).resolve().parents[1]
P = R / "data/processed"
D = Path(__file__).resolve().parent
CF = yaml.safe_load((R / "config/supuestos.yaml").read_text())
XL = "Modelo_KO_derivados.xlsx"

# ---------------------------------------------------------------- URL (todas en data/raw/_registro.csv)
REG = {r["archivo"]: r["url"] for r in csv.DictReader(open(R / "data/raw/_registro.csv", encoding="utf-8"))}
K10 = REG["fuentes/sec/KO_10-K_FY2025.htm"]
Q1 = REG["fuentes/sec/KO_10-Q_Q1-2026.htm"]; Q2 = REG["fuentes/sec/KO_10-Q_Q2-2026.htm"]
CCEP = REG["fuentes/ccep/CCEP_20-F_FY2025.htm"]
CCHBC = REG["fuentes/cchbc/CCHBC_Integrated_Annual_Report_2025.pdf"]
U = {
    "k10_n20": K10 + "#ia2cb76fa2c6c4a82a91d7a0d2310cb54_199",      # Nota 20 Operating Segments (p. 116–117)
    "k10_7a": K10 + "#ia2cb76fa2c6c4a82a91d7a0d2310cb54_115",       # Item 7A (p. 58)
    "k10_i1": K10 + "#ia2cb76fa2c6c4a82a91d7a0d2310cb54_16",        # Item 1 Business
    "k10_n11": K10 + "#ia2cb76fa2c6c4a82a91d7a0d2310cb54_172",      # Nota 11 Debt (p. 89)
    "q1_n16": Q1 + "#if2b5e765f97247b9b82dd5d0587d11bc_82",         # 10-Q Q1-2026, Nota 16 (p. 25)
    "q2_is": Q2 + "#i0cd3a5dd043745aaac884be47e5302ac_19",          # 10-Q Q2-2026, estado de resultados (p. 2)
    "ccep_n20": CCEP + "#ib923d59d4bf049709de71613e017ff2c_6882",   # 20-F Nota 20 (p. 186)
    "ccep_n4": CCEP + "#ifea416b694cc442b836327e6b523c2c3_3218",    # 20-F Nota 4, ingresos por geografía (p. 151)
    "ccep_geo": CCEP + "#id4157a397b674a27b1817736f4b5379a_11164",  # 20-F Business and financial review (p. 48; tabla en p. 49)
    "cchbc_n27": CCHBC + "#page=324", "cchbc_n6a": CCHBC + "#page=277", "cchbc_paises": CCHBC + "#page=278",
    "cme_6e_set": REG["data/raw/cme_6E_settlements_2026-11-13.csv"].split(" ; ")[0],
    "cme_6e_opt_h": REG["data/raw/cme/6E_opc_H7_2026-11-13.txt"].split(" (")[0],
    "cme_6e_margin": "https://www.cmegroup.com/markets/fx/g10/euro-fx.margins.html",
    "cme_6e_vol": "https://www.cmegroup.com/markets/fx/g10/euro-fx/volume#tradeDate=20261113",
    "cme_cl_set": REG["data/raw/cme/CL_settlements_2026-11-13.txt"],
    "cme_cl_opt": REG["data/raw/cme/CL_opc_LOH27_2026-11-13.txt"].split(" (")[0],
    "cme_hrp": "https://www.cmegroup.com/solutions/risk-management/performance-bonds-margins.html",
    "nymex_310": "https://www.cmegroup.com/rulebook/NYMEX/3/310.pdf#page=2",
    "fred": REG["data/raw/tasas/fred_DEXUSEU_2023-11-01_2026-11-13.csv"],
    "yf_6e": REG["data/raw/yf_6E_F_diario_2021.csv"], "yf_cl": REG["data/raw/yf_CL_F_diario_2021.csv"],
    "ecb_fsr": "https://www.ecb.europa.eu/pub/pdf/fsr/ecb.fsr202211~6383d08c21.en.pdf",
    "eia": "https://www.eia.gov/todayinenergy/detail.php?id=55079",
    "ice": "https://www.ice.com/report/12",
}
for k, v in U.items():
    assert v.startswith("https://"), (k, v)


def c(v, f, u=None):
    return {"v": v, "f": f, "u": u}


def leer(n, **kw):
    return pd.read_csv(P / n, **kw)


f2 = f"Excel: hoja Exposición · data/processed/paso2_cadena.csv (Paso 2 v3)"
p2 = json.loads((P / "paso2_parametros.json").read_text())
cal = leer("paso2_calendario_eur.csv")
a3 = leer("paso3_asignacion_presupuesto.csv")
c4 = leer("paso4_costo_en_riesgo.csv"); r4 = json.loads((P / "paso4_resumen.json").read_text())
f5 = leer("paso5a_futuros.csv"); p5 = leer("paso5a_puts.csv"); sr = leer("paso5a_stack_roll.csv"); ia = leer("paso5a_ia.csv")
j6 = json.loads((P / "paso6_resumen.json").read_text()); bt = leer("paso6_backtest.csv"); so = leer("paso6_sobrecobertura.csv")
epu = leer("paso6_escenarios_precio_unico.csv"); eps = leer("paso6_escenarios_precio_unico_resumen.csv")
t5 = leer("paso6_tablero_P5.csv", index_col=0); tm = leer("paso6_tablero_media.csv", index_col=0)
e5b = leer("paso5b_estrategias.csv").set_index("estrategia"); j5b = json.loads((P / "paso5b_parametros.json").read_text())
r4reg = leer("paso4_regresion.csv")
diag = json.loads((P / "paso1_diagnostico_yf.json").read_text())
util = CF["paso4"]["utilidad_operacion_h1_2026_musd"] * 1e6

DATA = {"meta": {
    "titulo": "Cobertura cambiaria de KO con derivados",
    "empresa": "The Coca-Cola Company (KO)",
    "equipo": "Diego Avila Chavez y Santiago Mondragon Apodaca",
    "corte": "13-nov-2026", "periodo": "ene–jun 2027", "version": "Paso 10c · 24-nov-2026",
}}

# ---------------------------------------------------------------- 1 · Contexto y riesgo
DATA["exp"] = {
    "ccep_compras": c(p2["ccep_compras_meur"] * 1e6, f2 + " · CCEP 20-F FY2025, Nota 20 Related party transactions, p. 186", U["ccep_n20"]),
    "ccep_frac_europa": c(p2["ccep_frac_europa"], f2 + " · CCEP 20-F, Nota 4, p. 151 (Europa 15,404 / total 20,901)", U["ccep_n4"]),
    "ccep_frac_eurozona": c(p2["ccep_frac_eurozona"], f2 + " · CCEP 20-F, Revenue by geography, p. 49 (eurozona 10,986 / Europa 15,404)", U["ccep_geo"]),
    "ccep_eur": c(p2["ccep_eurozona_meur"] * 1e6, f2 + " · Cálculo: 4,543 × 73.70 % × 71.32 %", U["ccep_n20"]),
    "cchbc_compras": c(p2["cchbc_compras_meur"] * 1e6, f2 + " · CCHBC Integrated Annual Report 2025, Nota 27 a), p. 322 (PDF p. 324)", U["cchbc_n27"]),
    "cchbc_min": c(p2["cchbc_euro_meur"]["minimo"] * 1e6, f2 + " · Cálculo: 1,931.2 × Italia 1,260.5 / 11,604.5 (Nota 6 a), p. 276, PDF p. 278)", U["cchbc_paises"]),
    "cchbc_base": c(p2["cchbc_euro_meur"]["base"] * 1e6, f2 + " · Cálculo: 1,931.2 × 32.76 % (Nota 6 a), p. 275, PDF p. 277; 50 % de Developing es supuesto del equipo)", U["cchbc_n6a"]),
    "g_max": c(p2["crecimiento_maximo"]["valor"], f2 + " · Cálculo: EMEA Q1 2026 / Q1 2025 − 1 = 3,012 / 2,657 − 1 (10-Q Q1-2026, Nota 16, p. 25); supuesto del equipo para el máximo", U["q1_n16"]),
}
for k in ["minimo", "base", "maximo"]:
    u = U["ccep_n20"]
    DATA["exp"][f"anual_{k}"] = c(p2["anual_meur"][k] * 1e6, f2 + " · Cálculo (anual 2025)", u)
    DATA["exp"][f"sem_{k}"] = c(p2["semestre_meur"][k] * 1e6, f2 + " · Cálculo: anual ÷ 2", u)
    DATA["exp"][f"mes_{k}"] = c(p2["mes_meur"][k] * 1e6, f2 + " · Cálculo: anual ÷ 12", u)
cad = leer("paso2_cadena.csv").astype(object)
cad = cad.where(cad.notna(), "")
LINK_CAD = {"CCEP compras": U["ccep_n20"], "CCEP ingresos Europa": U["ccep_n4"], "CCEP ingresos total": U["ccep_n4"],
            "CCEP ingresos eurozona": U["ccep_geo"], "CCHBC compras": U["cchbc_n27"], "CCHBC ingresos total": U["cchbc_n6a"],
            "CCHBC Established": U["cchbc_n6a"], "CCHBC Italia": U["cchbc_paises"], "EMEA Q1": U["q1_n16"]}
DATA["cadena"] = [{"concepto": r.concepto, "valor": str(r.valor), "tipo": r.tipo, "documento": r.documento, "nota": r.nota,
                   "pag": str(r.pagina_impresa).removesuffix(".0"), "pdf": str(r.pagina_pdf).removesuffix(".0"),
                   "u": next((v for k, v in LINK_CAD.items() if r.concepto.startswith(k)), None)} for r in cad.itertuples()]
fcr = "Excel: hoja Costo en riesgo · data/processed/paso4_costo_en_riesgo.csv"
DATA["presupuesto"] = c(float(a3.usd_presupuesto_base.sum()), "Excel: hoja Costo en riesgo · Cálculo: EUR base × F₀ (liquidaciones de CME del 13-nov-2026)", U["cme_6e_set"])
DATA["costo_riesgo"] = c(float(c4.costo_riesgo_base.sum()), fcr + " · Cálculo: Σ EUR base × (F₀ − P5), σ = 6.89 %", U["cme_6e_set"])
DATA["materialidad"] = c(r4["materialidad"], fcr + " · Cálculo: costo en riesgo ÷ utilidad de operación H1 2026 (USD 9,031 M, 10-Q Q2-2026, p. 2)", U["q2_is"])
DATA["util_h1"] = c(util, "10-Q Q2-2026, Item 1, Condensed Consolidated Statements of Income (seis meses), p. 2; XBRL OperatingIncomeLoss", U["q2_is"])
DATA["sigma_eur"] = c(r4["sigma_futuro_costo"], "Excel: hoja Supuestos (sigma_F) · Cálculo: 6E=F semanal sin roll × √52", U["yf_6e"])
DATA["emea_2025"] = c(11513e6, "10-K FY2025, Nota 20 Operating Segments, p. 117", U["k10_n20"])
DATA["intl_2025"] = c(28814e6, "10-K FY2025, Nota 20, Geographic and Customer Data, p. 116", U["k10_n20"])
DATA["principally_euro"] = c("principally euro", "10-K FY2025, Item 7A, p. 58", U["k10_7a"])

# ---------------------------------------------------------------- 2 · Cobertura sobre el euro
fA = "Excel: hoja Coberturas A · data/processed/paso5a_futuros.csv"
DATA["A"] = {"N_mes": c(int(f5.N.iloc[0]), fA + " · N = ROUND(1 × EUR mínimo del mes ÷ 125,000)", U["ccep_n20"]),
             "N": c(int(f5.N.sum()), fA, U["ccep_n20"]),
             "eur_cub": c(float(f5.eur_cubiertos.sum()), fA, U["ccep_n20"]),
             "cob_base": c(float(f5.eur_cubiertos.sum() / f5.eur_base.sum()), fA + " · Cálculo: EUR cubiertos ÷ EUR base", U["ccep_n20"]),
             "margen": c(float(f5.margen_inicial_usd.sum()), fA + " · USD 1,900 × N (CME, margen de mantenimiento 6E; inicial = 100 % Non-HRP)", U["cme_6e_margin"]),
             "F0": {x.codigo: c(float(x.F0), "Liquidación de CME del 13-nov-2026 (data/raw/cme_6E_settlements_2026-11-13.csv)", U["cme_6e_set"]) for x in f5.drop_duplicates("codigo").itertuples()},
             "ia": [{"codigo": x.codigo, "N": c(int(x.N_total), fA), "ia": c(int(x.IA), "Interés abierto al 13-nov-2026, CME", U["cme_6e_set"]),
                     "pct": c(float(x.N_sobre_IA), fA + " · Cálculo: N ÷ IA")} for x in ia.itertuples()],
             "dec26_ia": c(830219, "Interés abierto DEC 26 al 13-nov-2026, CME", U["cme_6e_set"]),
             "roll": [{"de": x.de, "a": x.a, "fecha": str(x.fecha_roll), "N": c(int(x.N_rolados), "data/processed/paso5a_stack_roll.csv"),
                       "spread": c(float(x.spread), "Spread de calendario, liquidaciones de CME del 13-nov-2026", U["cme_6e_set"]),
                       "res": c(float(x.resultado_roll_usd), "data/processed/paso5a_stack_roll.csv · Cálculo: spread × 125,000 × N")} for x in sr.itertuples()],
             "roll_total": c(float(sr.resultado_roll_usd.sum()), "data/processed/paso5a_stack_roll.csv · ya incluido en los F₀: no es ganancia adicional")}
fB = "Excel: hoja Coberturas B · data/processed/paso5a_puts.csv"
DATA["B"] = [{"codigo": x.codigo, "tipo": x.tipo, "K": c(float(x.strike), fB, U["cme_6e_opt_h"]), "N": c(int(x.N), fB),
              "prima": c(float(x.prima_mercado), "Liquidación de CME del 13-nov-2026 (data/raw/cme/6E_opc_*_2026-11-13.txt)", U["cme_6e_opt_h"]),
              "b76": c(float(x.prima_black76), fB + " · Black-76, σ = 6.89 %"), "dif_pct": c(float(x.dif_b76_pct), fB + " · Cálculo: (Black-76 − mercado) ÷ mercado"),
              "dif_usd": c(float(x.dif_b76_usd_total), fB + " · Cálculo: diferencia × 125,000 × N"), "sig": bool(x.dif_significativa),
              "binom": c(float(x.prima_binomial_anexo), fB + " · binomial europeo de 100 pasos (verificación, anexo)"),
              "iv": c(float(x.vol_implicita), fB + " · volatilidad implícita despejada de la prima de mercado"),
              "costo": c(float(x.costo_primas_usd), fB + " · prima × 125,000 × N", U["cme_6e_opt_h"]), "venc": x.vencimiento} for x in p5.itertuples()]
gb = p5.groupby("tipo").costo_primas_usd.sum()
DATA["B_costo"] = {k: c(float(gb[k]), fB + " · suma de las dos entregas", U["cme_6e_opt_h"]) for k in ["ATM", "OTM"]}
fE = "Excel: hoja Escenarios precio único · data/processed/paso6_escenarios_precio_unico_resumen.csv"
DATA["esc"] = []
for r in eps.itertuples():
    d = epu[epu.nivel == r.nivel]
    DATA["esc"].append({
        "nivel": r.nivel, "nombre": r.escenario, "sigma": c(float(r.sigma), "Excel: hoja Supuestos (sigma_" + r.nivel + ") · vol. móvil 26 semanas 6E=F 2021-2026 (medio = Paso 4)", U["yf_6e"]),
        "spot_ene": c(float(d.spot_cierre.iloc[0]), fE + " · P5 adverso = F₀ × e^(−1.645σ√T), ene-2027", U["cme_6e_set"]),
        "spot_jun": c(float(d.spot_cierre.iloc[-1]), fE + " · P5 adverso, jun-2027", U["cme_6e_set"]),
        **{k: c(float(getattr(r, k)), fE) for k in ["presupuesto_F0", "sin_cobertura", "con_futuros", "con_puts_ATM", "con_puts_OTM",
                                                   "gp_futuros", "gp_puts_ATM", "gp_puts_OTM", "costo_en_riesgo"]},
        "materialidad": c(float(r.materialidad), fE + " · Cálculo: costo en riesgo ÷ utilidad de operación H1 2026", U["q2_is"]),
        "meses": [{"mes": x.mes, "spot": x.spot_cierre, "F0": x.F0_pactado, "sin": x.sin_cobertura, "fut": x.con_futuros,
                   "atm": x.con_puts_ATM, "otm": x.con_puts_OTM} for x in d.itertuples()]})
es = j6["estres"]; fS = "Excel: hoja Tablero (Máximo estrés) · data/processed/paso6_resumen.json"
DATA["estres"] = {"eur": c(es["eur"][0], f"Cálculo: peor cambio de 26 semanas de 6E=F, {es['eur'][1]} a {es['eur'][2]}; contexto: BCE, Financial Stability Review nov-2022", U["ecb_fsr"]),
                  "cl": c(es["cl"][0], f"Cálculo: peor cambio de 26 semanas de CL=F, {es['cl'][1]} a {es['cl'][2]}; contexto: EIA, Today in Energy", U["eia"]),
                  "periodo_eur": f"{es['eur'][1]} a {es['eur'][2]}",
                  **{k: c(float(v), fS) for k, v in es["valores"].items()}}
MC = j6["montecarlo"]; fV = "Excel: hoja Tablero (Moderado + volumen −30%) · data/processed/paso6_sobrecobertura.csv"
DATA["vol30"] = {"sobre": c(float(so.sobrecobertura_eur.sum()), fV + " · Cálculo: EUR cubiertos − 70 % de los EUR base"),
                 "sobre_pct": c(float(so.sobrecobertura_pct_reales.mean()), fV + " · Cálculo: sobrecobertura ÷ EUR reales"),
                 **{f"P5_{k}": c(float(MC["medio_vol30"][k]["P5"]), "Excel: hoja Tablero · Montecarlo σ media, volumen −30 % (P5)") for k in ["sin", "A", "B_ATM", "B_OTM"]}}
LQ = j6["liquidez_A"]; fL = "data/processed/paso6_resumen.json · liquidez A (outputs/paso6_evaluacion.md §5)"
DATA["liq"] = {"bt": c(LQ["coberturista"]["backtest_necesidad"], fL + " · margen + mayor pérdida acumulada del backtest", U["fred"]),
               "mc_medio": c(LQ["coberturista"]["MC_medio_P95_necesidad"], fL + " · P95 Montecarlo σ media"),
               "mc_alto": c(LQ["coberturista"]["MC_alto_P95_necesidad"], fL + " · P95 Montecarlo σ alta"),
               "margen_110": c(LQ["simulador_hrp"]["margen"], fL + " · margen al 110 % (perfil HRP, como cobró el simulador)", U["cme_hrp"])}
# Tablero Montecarlo
filas_t = list(t5.index)
DATA["tablero"] = {s: [{"esc": i, **{k: c(float(df.loc[i, col]), f"Excel: hoja Tablero · data/processed/paso6_tablero_{s}.csv") for k, col in
                                    [("sin", "Sin cobertura"), ("A", "Cobertura con futuros"), ("B_ATM", "Cobertura con opciones (ATM)"),
                                     ("B_OTM", "Cobertura con opciones (OTM)"), ("C", "Especulación con opciones")]}} for i in filas_t]
                   for s, df in [("P5", t5), ("media", tm)]}
# Backtest
fBT = "Excel: hoja Backtest · data/processed/paso6_backtest.csv (spot FRED DEXUSEU, 6E=F de Yahoo)"
DATA["bt"] = {"meses": [{"flujo": x.flujo, "sin": x.sin_cobertura, "A": x.con_A, "atm": x.con_B_ATM, "otm": x.con_B_OTM, "pnl": x.pnl_futuros} for x in bt.itertuples()],
              "f": fBT, "pnl": c(float(bt.pnl_futuros.sum()), fBT, U["fred"]), "max_perdida": c(j6["backtest"]["max_perdida"], fBT, U["yf_6e"]),
              "sin": c(j6["backtest"]["totales"]["sin_cobertura"], fBT, U["fred"]), "A": c(j6["backtest"]["totales"]["con_A"], fBT, U["fred"]),
              "C": c(j6["backtest"]["C"]["resultado"], "Excel: hoja Backtest · C: bull call spread CL 105.5/121 abierto el 15-may-2026 (1,917 spreads)", U["yf_cl"])}

# ---------------------------------------------------------------- 3 · Especulación con CL
liq_p1 = {  # outputs/paso1_candidatos.md, tabla C (volumen e interés abierto al 13-nov-2026; fuentes oficiales CME/ICE)
    "6E=F": (169389, 876056, "https://www.cmegroup.com/markets/fx/g10/euro-fx/volume#tradeDate=20261113"),
    "6M=F": (43792, 282053, "https://www.cmegroup.com/markets/fx/emerging-market/mexican-peso/volume#tradeDate=20261113"),
    "SB=F": (132421, 1154396, U["ice"]), "ZC=F": (630205, 2009810, "https://www.cmegroup.com/markets/agriculture/grains/corn/volume#tradeDate=20261113"),
    "ALI=F": (77, 581, "https://www.cmegroup.com/markets/metals/base/aluminum.volume.html"),
    "HO=F": (139495, 254376, "https://www.cmegroup.com/markets/energy/refined-products/heating-oil.volume.html"),
    "CL=F": (611617, 1905033, "https://www.cmegroup.com/markets/energy/crude-oil/light-sweet-crude.volume.html"),
    "KC=F": (35172, 141006, U["ice"]),
}
txt1 = (R / "outputs/paso1_candidatos.md").read_text()
for t, (vol, oi, _) in liq_p1.items():
    assert f"{vol:,}" in txt1 and f"{oi:,}" in txt1, (t, vol, oi)
DATA["opc_vol_cl"] = c(90722, "outputs/paso1_candidatos.md, tabla C · volumen de opciones CL DEC26 al 13-nov-2026 (el mayor de los candidatos)", "https://www.cmegroup.com/markets/energy/crude-oil/light-sweet-crude.volume.options.html")
assert "90,722" in txt1
DATA["activos"] = []
for t, d in diag.items():
    yfu = REG.get(f"data/raw/yf_{t.replace('=', '_')}_diario.csv")
    vol_a = d.get("vol_anual")
    vol_a = None if (vol_a is None or vol_a != vol_a) else vol_a   # NaN → "No encontrado" (OJ=F sin historial al 16-nov-2026)
    liq = liq_p1.get(t)
    DATA["activos"].append({"ticker": t, "desc": d["descripcion"],
                            "vol": c(vol_a, "data/processed/paso1_diagnostico_yf.json · Cálculo: desv. est. semanal × √52 (10-nov-2023 a 13-nov-2026)", yfu) if vol_a else None,
                            "volumen": c(liq[0], "outputs/paso1_candidatos.md, tabla C · volumen del 13-nov-2026", liq[2]) if liq else None,
                            "oi": c(liq[1], "outputs/paso1_candidatos.md, tabla C · interés abierto del 13-nov-2026", liq[2]) if liq else None})
fC = "Excel: hoja Especulación C · data/processed/paso5b_estrategias.csv"
bcs = e5b.loc["Bull call spread"]
DATA["C"] = {"F0": c(j5b["F"], "Liquidación de CLH27 del 13-nov-2026, CME", U["cme_cl_set"]),
             "K1": c(84.0, fC, U["cme_cl_opt"]), "K2": c(97.0, fC, U["cme_cl_opt"]),
             "p1": c(7.60, "Liquidación call LOH27 84 del 13-nov-2026, CME", U["cme_cl_opt"]),
             "p2": c(3.57, "Liquidación call LOH27 97 del 13-nov-2026, CME", U["cme_cl_opt"]),
             "n": c(int(bcs.contratos), fC + " · presupuesto USD 10 M ÷ (prima neta × 1,000)"),
             "prima_neta": c(float(bcs.prima_neta_bbl), fC, U["cme_cl_opt"]),
             "prima_total": c(float(bcs.prima_total_usd), fC, U["cme_cl_opt"]),
             "gan_max": c(float(bcs.ganancia_max_usd), fC), "equilibrio": c(88.03, fC),
             "E_hist": c(float(bcs.E_hist), fC + " · Montecarlo 100,000 trayectorias, σ histórica 41.9 %", U["yf_cl"]),
             "E_impl": c(float(bcs.E_iv_atm), fC + " · Montecarlo, σ implícita ATM 44.2 %", U["cme_cl_opt"]),
             "P_hist": c(float(bcs.Pgana_hist), fC + " · probabilidad de ganar, σ histórica"),
             "iv_atm": c(j5b["iv_atm"], "data/processed/paso5b_parametros.json · implícita ATM de LOH27 (Black-76)", U["cme_cl_opt"]),
             "vol_hist": c(j5b["vol_hist"], "config paso5b.vol_historica · CL=F semanal × √52", U["yf_cl"]),
             "americana": c("americano", "NYMEX Rulebook cap. 310, regla 310101.F", U["nymex_310"])}
DATA["C_cand"] = [{"nombre": i, "n": c(int(r.contratos), fC), "prima": c(float(r.prima_total_usd), fC, U["cme_cl_opt"]),
                   "E_hist": c(float(r.E_hist), fC), "E_impl": c(float(r.E_iv_atm), fC), "P": c(float(r.Pgana_hist), fC)} for i, r in e5b.iterrows()]
DATA["C_mc"] = [{"nivel": nv, "media": c(MC[nv]["C"]["media"], "Excel: hoja Escenarios (Montecarlo paso 6)"), "P5": c(MC[nv]["C"]["P5"], "Excel: hoja Escenarios"),
                 "P95": c(MC[nv]["C"]["P95"], "Excel: hoja Escenarios")} for nv in ["alto", "medio", "bajo"]]

# ---------------------------------------------------------------- simulador (outputs/paso5c_boletas.md §7)
md5c = (R / "outputs/paso5c_boletas.md").read_text()
fsim = "outputs/paso5c_boletas.md §7 · capturas en entregables/simulador/2026-11-24/"
SIM = {"A_px": 1.0975, "B_px": 0.0048, "C1_px": 6.76, "C2_px": 2.98, "margen_A": 2091.00, "margen_final": 9730.00, "fondos": 102340.00, "C_neta": 3780}
for t in ["**1.0975**", "**0.0048**", "**6.76**", "**2.98**", "2,091.00", "9,730.00", "102,340.00", "USD 3,780"]:
    assert t in md5c, t
DATA["sim"] = {k: c(v, fsim) for k, v in SIM.items()}

# ---------------------------------------------------------------- anexo: estadística y métodos reemplazados
fR = "Excel: hoja Estadística · data/processed/paso4_regresion.csv"
DATA["reg"] = [{"spot": x.spot, "version": x.version, "h": c(float(x.h), fR, U["fred"] if x.spot == "fred" else None),
                "R2": c(float(x.R2), fR)} for x in r4reg.itertuples()]
v2 = leer("paso2_calendario_eur_v2.csv")
DATA["v2"] = {"eur_base": c(float(v2.eur_base.sum()), "data/processed/paso2_calendario_eur_v2.csv · método evaluado y reemplazado (src/paso2_exposicion_v2_reemplazado.py)"),
              "h_estrella": c(0.942, "config paso5a.h_estrella_regresion · Paso 4b (solo anexo)", U["fred"])}
dat = leer("paso4_series_base.csv")
DATA["serie_base"] = {"f": "Excel: hoja Datos · data/processed/paso4_series_base.csv (FRED DEXUSEU y 6E=F)", "u": U["fred"],
                      "fecha": dat.viernes.astype(str).tolist(), "base": dat.base.round(6).tolist()}

# ---------------------------------------------------------------- hipervínculo por defecto para cifras calculadas
# Las cifras que son Cálculo del modelo enlazan a la fuente primaria de su insumo principal (el precio pactado o la prima).
DEF_U = {"esc": U["cme_6e_set"], "tablero": U["cme_6e_set"], "vol30": U["cme_6e_set"], "liq": U["cme_6e_margin"], "A": U["cme_6e_set"],
         "B": U["cme_6e_opt_h"], "estres": U["yf_6e"], "bt": U["fred"], "C": U["cme_cl_opt"], "C_cand": U["cme_cl_opt"], "C_mc": U["cme_cl_opt"],
         "sim": "https://www.cmegroup.com/trading_tools/simulator", "reg": U["fred"], "v2": U["ccep_n20"], "exp": U["ccep_n20"]}
def llena(x, u):
    if isinstance(x, dict):
        if {"v", "f"} <= set(x) and not x.get("u"): x["u"] = u
        for v in x.values(): llena(v, u)
    elif isinstance(x, list):
        for v in x: llena(v, u)
for k, u in DEF_U.items(): llena(DATA[k], u)
if DATA["C"]["F0"]["u"] != U["cme_cl_set"]: raise SystemExit("F0 de CL debe enlazar a las liquidaciones de futuros")

# ---------------------------------------------------------------- salida
txt = json.dumps(DATA, ensure_ascii=False, indent=1, default=str)
(D / "data.json").write_text(txt)
(D / "data.js").write_text("// Generado por dashboard/build_data.py; no editar a mano.\nwindow.DATA = " + txt + ";\n")


def cuenta(x):
    if isinstance(x, dict):
        return (1 if {"v", "f"} <= set(x) else 0) + sum(cuenta(v) for v in x.values())
    if isinstance(x, list):
        return sum(cuenta(v) for v in x)
    return 0


def con_url(x):
    if isinstance(x, dict):
        return (1 if {"v", "f"} <= set(x) and x.get("u") else 0) + sum(con_url(v) for v in x.values())
    if isinstance(x, list):
        return sum(con_url(v) for v in x)
    return 0


print("ok dashboard/data.json · cifras con fuente:", cuenta(DATA), "· con hipervínculo:", con_url(DATA))
