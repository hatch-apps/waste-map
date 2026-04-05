import { useState, useEffect } from "react";

const NODES = [
  { id: "production", label: "Plastic Production", value: 431, unit: "Mt/yr", base: 431, category: "driver", x: 9, y: 14, desc: "Global plastic production. 431 Mt in 2024, projected 590 Mt by 2050. The upstream source feeding all waste flows.", ix: "Real volume in megatonnes/year.", sensitivity: { waste_generated: 0.9, recycling_myth: 0.3, export_volume: 0.7 }},
  { id: "consumption", label: "Consumer Demand", value: 75, unit: "/100", base: 75, category: "driver", x: 9, y: 36, desc: "Overconsumption in Global North. US: 4% of world population but generates 12% of waste. Per capita plastic waste up 263% since 1980.", ix: "0=minimal, 100=peak consumerism. 75=current.", sensitivity: { production: 0.8, waste_generated: 0.7 }},
  { id: "waste_generated", label: "Waste Generated", value: 265, unit: "Mt/yr", base: 265, category: "flow", x: 28, y: 24, desc: "Municipal solid waste from high-income countries. US alone: 265 Mt/yr. High-income countries (16% of population) produce 34% of the world's waste.", ix: "Real volume. 265 Mt = US annual output.", sensitivity: { export_volume: 0.8, domestic_pressure: -0.6, recycling_myth: 0.4 }},
  { id: "recycling_myth", label: "Recycling Myth", value: 85, unit: "/100", base: 85, category: "enabler", x: 19, y: 4, desc: "Public belief that recycling works. Industry spent millions promoting it since 1989 while knowing since 1973 it was economically unviable. Actual US recycling rate: 5-6%.", ix: "0=public aware, 100=total belief. 85=most trust it.", sensitivity: { domestic_pressure: -0.7, consumption: 0.3, production: 0.2 }},
  { id: "domestic_pressure", label: "Domestic Pressure\nto Reduce", value: 20, unit: "/100", base: 20, category: "enabler", x: 9, y: 58, desc: "Political pressure to reduce waste at source. Cheap export + recycling myth eliminate urgency.", ix: "0=no will, 100=strong mandates. 20=almost none.", sensitivity: { production: -0.4, regulation_strength: 0.5 }},
  { id: "export_volume", label: "Waste Exports", value: 35, unit: "Mt/yr", base: 35, category: "flow", x: 47, y: 16, desc: "Transboundary waste shipments. EU exported 35 Mt in 2023 (+75% since 2004). Includes plastic, e-waste, textiles, hazardous waste.", ix: "Real volume. 35 Mt = EU annual exports.", sensitivity: { governance_capacity: -0.6, informal_jobs: 0.7, health_damage: 0.5, economic_dependency: 0.7, env_contamination: 0.6, illegal_dumping: 0.5 }},
  { id: "regulation_strength", label: "International\nRegulation", value: 40, unit: "/100", base: 40, category: "governance", x: 37, y: 4, desc: "Basel Convention + Ban Amendment + Plastic Waste Amendments. 191 parties but US absent. Plastics Treaty stalled after 3 failures (2024-2026).", ix: "0=no rules, 100=fully enforced. 40=loopholes rampant.", sensitivity: { export_volume: -0.5, evasion: -0.4 }},
  { id: "evasion", label: "Evasion &\nMislabeling", value: 60, unit: "/100", base: 60, category: "enabler", x: 47, y: 38, desc: "Waste relabeled as 'refuse-derived fuel', 'donations', 'secondhand goods'. UK loses \u00a350M/yr to fake recycling records. 10-20% of electronics shipped to Kenya are unusable.", ix: "0=honest, 100=systematic fraud. 60=widespread.", sensitivity: { export_volume: 0.5, governance_capacity: -0.3 }},
  { id: "trade_coercion", label: "Trade Coercion\n(AGOA/FTA)", value: 70, unit: "/100", base: 70, category: "enabler", x: 28, y: 48, desc: "US threatened AGOA trade suspension when East Africa proposed banning secondhand clothing imports. Kenya backed down. ACC lobbied Kenya FTA as 'foothold' for plastics.", ix: "0=no leverage, 100=full coercion. 70=heavy.", sensitivity: { economic_dependency: 0.6, governance_capacity: -0.4, domestic_industry: -0.5 }},
  { id: "governance_capacity", label: "Receiving Country\nGovernance", value: 25, unit: "/100", base: 25, category: "governance", x: 67, y: 9, desc: "NEMA enforcement: under-resourced. 2-10% containers inspected. KRA fraud KSh 452M (Mar 2026). Court orders ignored.", ix: "0=state failure, 100=world-class. 25=very weak.", sensitivity: { illegal_dumping: -0.7, evasion: -0.2 }},
  { id: "illegal_dumping", label: "Illegal Dumping", value: 70, unit: "/100", base: 70, category: "impact", x: 67, y: 29, desc: "92% of Kenya's waste mismanaged. 70+ illegal dumps in Nairobi. Dandora: 2,000-3,500 t/day despite full since 2001. Criminal gangs control access.", ix: "0=managed, 100=total dumping. 70=vast majority.", sensitivity: { env_contamination: 0.8, health_damage: 0.7 }},
  { id: "informal_jobs", label: "Informal Waste\nWorkers", value: 22, unit: "million", base: 22, category: "social", x: 87, y: 14, desc: "19-24M globally. 5,000 at Dandora earn <$1/day. 2M Kenyans in mitumba trade. Recover 60% of recycled plastic.", ix: "Real count in millions.", sensitivity: { political_resistance: 0.6, health_damage: 0.4 }},
  { id: "economic_dependency", label: "Economic\nDependency", value: 65, unit: "/100", base: 65, category: "social", x: 67, y: 50, desc: "Kenya: mitumba serves 24.2M consumers, employs 2M. AGOA: $470M. Only 7% of profits stay local.", ix: "0=independent, 100=fully dependent. 65=deep.", sensitivity: { political_resistance: 0.7, domestic_industry: -0.6, governance_capacity: -0.3 }},
  { id: "domestic_industry", label: "Local Industry\nCapacity", value: 15, unit: "/100", base: 15, category: "social", x: 37, y: 66, desc: "Kenya textiles: 110 manufacturers to <20. 85% closed after structural adjustment. Mills <45% of demand.", ix: "0=destroyed, 100=thriving. 15=near collapse.", sensitivity: { economic_dependency: -0.5 }},
  { id: "health_damage", label: "Health Damage", value: 70, unit: "/100", base: 70, category: "impact", x: 87, y: 38, desc: "50% Dandora children: toxic blood lead. Soil: 13,500 ppm (90x safe). 400K-1M deaths/yr. Ship-breakers -20 years life expectancy.", ix: "0=none, 100=catastrophic. 70=severe.", sensitivity: { labor_capacity: -0.7, migration: 0.4 }},
  { id: "env_contamination", label: "Environmental\nContamination", value: 65, unit: "/100", base: 65, category: "impact", x: 87, y: 60, desc: "Nairobi River: E.coli 1M/100ml. Lead, PCBs, DDT. Atacama: 3 km\u00b2 clothing from space.", ix: "0=pristine, 100=irreversible. 65=severe.", sensitivity: { health_damage: 0.4, migration: 0.5, land_value: -0.6 }},
  { id: "labor_capacity", label: "Labor\nProductivity", value: 35, unit: "/100", base: 35, category: "social", x: 57, y: 72, desc: "Lead reduces IQ. Kenya: 6.7M IQ points lost in under-5s, $5.52B (World Bank). Lead half-life: 30 years.", ix: "0=incapacitated, 100=full. 35=severely impaired.", sensitivity: { economic_dependency: 0.3, informal_jobs: 0.3 }},
  { id: "migration", label: "Environmental\nMigration", value: 45, unit: "/100", base: 45, category: "impact", x: 87, y: 80, desc: "IOM: 200M environmental migrants by 2050. Dandora workers mostly migrants. Settle near waste on cheap land.", ix: "0=none, 100=mass migration. 45=significant.", sensitivity: { informal_jobs: 0.4, health_damage: 0.3 }},
  { id: "political_resistance", label: "Resistance to\nReform", value: 60, unit: "/100", base: 60, category: "governance", x: 47, y: 80, desc: "Workers, traders, cartels resist. Kenya EPR suspended by court. <5% compliance.", ix: "0=no opposition, 100=blocked. 60=strong.", sensitivity: { governance_capacity: -0.4, regulation_strength: -0.2 }},
  { id: "land_value", label: "Land\nDevaluation", value: 55, unit: "/100", base: 55, category: "impact", x: 72, y: 88, desc: "Contamination destroys property. Trapped communities. Dandora land: cheapest in Nairobi.", ix: "0=stable, 100=worthless. 55=severe.", sensitivity: { migration: 0.4 }},
];

const LOOPS = [
  { id: "R1", name: "Governance Erosion", color: "#ff4444", nodes: ["export_volume","governance_capacity","illegal_dumping","env_contamination"], desc: "Waste overwhelms regulators \u2192 less enforcement \u2192 more dumping \u2192 damage \u2192 governance weakens", icon: "\uD83C\uDFDB\uFE0F", ev: "INTERPOL: 77% of illegal shipments from Europe. EU: 1/3 illegal. Malaysia: 200+ unlicensed factories after China's ban." },
  { id: "R2", name: "Economic Dependency", color: "#ffaa22", nodes: ["export_volume","economic_dependency","political_resistance","governance_capacity"], desc: "Waste creates jobs \u2192 constituencies resist bans \u2192 trade threats reinforce \u2192 dependency deepens", icon: "\uD83D\uDCB0", ev: "Kenya AGOA: $470M/yr, 66,804 workers. US threatened revocation. Only Rwanda defied \u2014 punished." },
  { id: "R3", name: "Health\u2013Productivity Trap", color: "#ff66aa", nodes: ["health_damage","labor_capacity","economic_dependency","informal_jobs"], desc: "Toxic exposure \u2192 disease \u2192 lost productivity \u2192 poverty \u2192 more waste work \u2192 more exposure", icon: "\uD83C\uDFE5", ev: "50% Dandora children toxic lead. World Bank: 6.7M IQ points lost, $5.52B. Lead half-life: 30 years." },
  { id: "R4", name: "Moral Hazard", color: "#4488ff", nodes: ["production","waste_generated","export_volume","domestic_pressure"], desc: "Cheap export kills pressure \u2192 overproduction \u2192 more waste \u2192 more exports needed", icon: "\uD83C\uDFED", ev: "Industry knew since 1973. US: 5\u20136%. ACC: $22.3M lobbying. 234 lobbyists at treaty talks." },
  { id: "R5", name: "Informal Lock-in", color: "#44cc88", nodes: ["informal_jobs","political_resistance","governance_capacity","illegal_dumping"], desc: "Waste jobs \u2192 constituency \u2192 resistance to reform \u2192 weak governance \u2192 continued dumping", icon: "\uD83D\uDD12", ev: "19\u201324M depend on waste. Kenya: 2M mitumba, 5K Dandora. EPR suspended. <5% compliance." },
  { id: "R6", name: "Environmental Migration", color: "#aa66ff", nodes: ["env_contamination","migration","informal_jobs","health_damage"], desc: "Contamination \u2192 displacement \u2192 migrants near waste \u2192 more exposure", icon: "\uD83C\uDF0D", ev: "1M+ near Dandora include migrants. ILO: 68% below min wage. Children age 9 handle hazardous." },
];

const SCENARIOS = [
  { id: "china_sword", name: "\uD83C\uDDE8\uD83C\uDDF3 China National Sword", desc: "China bans waste imports \u2014 flows redirect to Global South", changes: { export_volume: 60, governance_capacity: 15, illegal_dumping: 85, informal_jobs: 28, env_contamination: 80, health_damage: 80 }},
  { id: "treaty_passes", name: "\uD83D\uDCDC Plastics Treaty Passes", desc: "Binding production caps + mandatory EPR", changes: { production: 280, regulation_strength: 75, export_volume: 15, domestic_pressure: 65, evasion: 30, recycling_myth: 40 }},
  { id: "agoa_removed", name: "\uD83D\uDD13 AGOA Leverage Removed", desc: "Kenya regulates imports without trade punishment", changes: { trade_coercion: 15, governance_capacity: 50, domestic_industry: 40, economic_dependency: 40, political_resistance: 35 }},
  { id: "eu_ban", name: "\uD83C\uDDEA\uD83C\uDDFA EU Export Ban (Nov 2026)", desc: "EU bans plastic exports to non-OECD", changes: { export_volume: 20, regulation_strength: 60, evasion: 45, domestic_pressure: 40, governance_capacity: 30 }},
  { id: "baseline", name: "\u21BA Reset", desc: "Return to current values", changes: {} },
];

const GLOSSARY = {
  "Index (0\u2013100)": "Most nodes use 0\u2013100. 0 = problem absent, 100 = peak intensity. Baseline = current reality.",
  "Sensitivity (%)": "Each arrow has a %. If source doubles, target changes by that %. Negative = inverse.",
  "Reinforcing Loop (R)": "A snowball cycle. All 6 loops here are reinforcing \u2014 they make the problem self-perpetuating.",
  "Cascade (3 levels)": "L1: full sensitivity. L2: dampened 40%. L3: dampened 70%. Simulates real ripple effects.",
  "Mt/yr": "Megatonnes/year = millions of tonnes. Real measured volumes from UN and trade data.",
  "Basel Convention": "1989 hazardous waste treaty. 191 parties. The US is NOT a member.",
  "AGOA": "US trade access used as leverage against African environmental policies.",
  "Bamako Convention": "Africa's own 1991 treaty banning ALL hazardous waste imports. Kenya signed 2003, hasn't ratified.",
  "EPR": "Extended Producer Responsibility. Kenya's 2024 regs suspended by court.",
  "National Sword": "China's 2018 import ban. Imports dropped 99%. Waste redirected to Africa/SE Asia.",
  "ACC": "American Chemistry Council. $22.3M lobbying. Wanted Kenya as 'hub' for US plastics.",
  "NEMA": "Kenya's environmental regulator. Under-resourced. 40% liable in Owino Uhuru lead case.",
  "Mitumba": "Swahili 'bundles' \u2014 secondhand clothing. 200K t/yr to Kenya. 30\u201340% is waste.",
  "Dandora": "Nairobi's only dump. Full since 2001, takes 2,000+ t/day. 1M nearby. 50% children toxic lead.",
  "Waste Colonialism": "Systematic transfer of environmental harm from wealthy nations to Global South.",
};

const ICEBERG = [
  { layer: "Events", color: "#ff4444", icon: "\uD83D\uDCA5", desc: "What we see", items: ["Dandora receives 2,000+ t/day despite court closure order", "30\u201340% of mitumba imports are waste, not clothes", "50% of children near Dandora have toxic lead levels", "KRA fraud: KSh 452M at Mombasa port (Mar 2026)"] },
  { layer: "Patterns", color: "#ffaa22", icon: "\uD83D\uDCC8", desc: "Trends over time", items: ["Waste to Africa quadrupled after China's 2018 ban", "Kenya textiles collapsed: 110 \u2192 <20 manufacturers", "E-waste: 3,000t (2012) \u2192 53,559t (2024)", "Plastics Treaty failed 3 times (2024\u20132026)"] },
  { layer: "Structures", color: "#4488ff", icon: "\u2699\uFE0F", desc: "Rules, power, institutions", items: ["US hasn't ratified Basel \u2014 world's largest gap", "AGOA used as trade weapon against env. policy", "ACC lobbied Kenya FTA as 'foothold' for plastics", "EPR regulations suspended by court within months"] },
  { layer: "Mental Models", color: "#aa66ff", icon: "\uD83E\uDDE0", desc: "Deep assumptions", items: ["'Recycling works' \u2014 industry myth since 1973", "'Waste = someone else's problem'", "'Development aid' framing disguises dumping", "'Free trade overrides env. sovereignty'"] },
];

// ============ NEW: RICH KENYA DATA ============
const KENYA_TIMELINE = [
  { year: "1975", event: "Dandora dumpsite established with World Bank financing as temporary solution for Nairobi (pop. 500,000)", color: "#4488ff" },
  { year: "1999", event: "Environmental Management and Coordination Act (EMCA) passed. NEMA established as regulator.", color: "#44cc88" },
  { year: "2001", event: "Dandora officially declared full. Design capacity of 500,000 tonnes exceeded. Still operating today.", color: "#ffaa22" },
  { year: "2007", event: "UNEP study by Njoroge Kimani finds 50% of children near Dandora have toxic blood lead levels", color: "#ff66aa" },
  { year: "2017", event: "Kenya's plastic bag ban enacted \u2014 among the world's strictest, $40K fine + 4 years prison", color: "#44cc88" },
  { year: "2018", event: "China's National Sword takes effect. Waste redirects globally. Exports to Africa quadruple within a year.", color: "#ff4444" },
  { year: "2020", event: "ACC FOIA documents leaked: US plastic lobby sought Kenya FTA as 'foothold' for African plastic trade", color: "#ff4444" },
  { year: "2021", event: "Justice Kossy Bor orders Dandora closure within 6 months. Court order ignored \u2014 no alternative site, cartel control.", color: "#ffaa22" },
  { year: "2024", event: "EPR Regulations gazetted November 2024. Suspended by court within months. <5% producer compliance.", color: "#aa66ff" },
  { year: "2024", event: "Supreme Court upholds KSh 1.3 billion Owino Uhuru lead poisoning ruling. NEMA found 40% liable.", color: "#44cc88" },
  { year: "2026", event: "KRA suspends 6 staff + 21 clearing agents in KSh 452M fraud scheme at Mombasa port (March)", color: "#ff4444" },
];

const KENYA_ACTORS = [
  { name: "NEMA", role: "Kenya's environmental regulator. Chronically under-resourced. Only 2\u201310% of containers inspected. Found 40% liable for Owino Uhuru lead poisoning.", side: "regulator", color: "#44cc88" },
  { name: "ACC \u2014 American Chemistry Council", role: "US petrochemical lobby. Spent $22.3M on lobbying in 2024. FOIA docs revealed plan to make Kenya a 'hub' for US plastics across Africa.", side: "corporate", color: "#ff4444" },
  { name: "Mombasa Port / KRA", role: "East Africa's largest port, 45.45 Mt cargo annually. Only 2\u201310% of containers inspected. KSh 452M fraud scheme (Mar 2026). Gateway to 6 nations.", side: "infrastructure", color: "#ffaa22" },
  { name: "Gikomba Market Traders", role: "~100,000 workers handling 11,000 bales/day. Buy sealed mitumba blind \u2014 20\u201350% of contents are unsellable. Serial fires suggest arson by land cartels.", side: "trade", color: "#aa66ff" },
  { name: "Dandora Waste Pickers", role: "5,000 workers including children, controlled by criminal gangs. Earn ~$0.14/kg for recyclable plastic. Cartel fees: ~500 KSh per truck.", side: "informal", color: "#ff66aa" },
  { name: "CEJAD / Greenpeace Africa", role: "Civil society coalitions pushing for Bamako Convention ratification, waste picker formalization, and stronger EPR enforcement.", side: "resistance", color: "#4488ff" },
];

const KENYA_STREAMS = [
  { name: "Plastic Waste", color: "#4488ff", icon: "\uD83E\uDDEA", volume: "92% mismanaged", origin: "China (pre-2018), US, EU", detail: "Plastic was the US's #1 export to Kenya by category ($58M, 2019). After China's ban, plastic waste exports to Africa quadrupled. Only 5% recycled." },
  { name: "Electronic Waste", color: "#ffaa22", icon: "\uD83D\uDCBB", volume: "53,559 t (2024)", origin: "UK, Germany, US, China, Malaysia", detail: "Surged from ~3,000t (2012) to 53,559t (2024). 10-20% of imported electronics are non-functional. Only 1-5% formally recycled. BAN GPS trackers confirmed US e-waste reaching Kenya." },
  { name: "Textile Waste (Mitumba)", color: "#aa66ff", icon: "\uD83D\uDC55", volume: "200,000 t/yr", origin: "China, Pakistan, UK, Germany, Canada, US", detail: "Over 900 million garments annually. 30-40% unsellable waste. Two-thirds synthetic (plastic). H&M, Nike, YSL items found at Dandora. Textile waste piles along Nairobi River." },
];

const CC = { driver: "#4488ff", flow: "#ffaa22", enabler: "#aa66ff", governance: "#44cc88", social: "#ff66aa", impact: "#ff4444" };

function cascade(sid, nv) {
  const R = {}; NODES.forEach(n => R[n.id] = n.base); R[sid] = nv;
  const s = NODES.find(n => n.id === sid); if (!s?.sensitivity) return R;
  const r = nv / s.base, L1 = {};
  Object.entries(s.sensitivity).forEach(([t, v]) => { const n = NODES.find(x => x.id === t); if (n) { R[t] = Math.max(0, n.base * (1 + (r - 1) * v)); L1[t] = R[t]; }});
  const L2 = {};
  Object.entries(L1).forEach(([id, val]) => { const n = NODES.find(x => x.id === id); if (!n?.sensitivity) return;
    Object.entries(n.sensitivity).forEach(([t, v]) => { if (t === sid) return; const tn = NODES.find(x => x.id === t); if (!tn) return;
      const d = (val / n.base - 1) * v * 0.6; R[t] = Math.max(0, R[t] === tn.base ? tn.base * (1 + d) : R[t] * (1 + d * 0.5)); L2[t] = R[t]; });
  });
  Object.entries(L2).forEach(([id, val]) => { const n = NODES.find(x => x.id === id); if (!n?.sensitivity) return;
    Object.entries(n.sensitivity).forEach(([t, v]) => { if (t === sid || L1[t]) return; const tn = NODES.find(x => x.id === t); if (!tn) return;
      const d = (val / n.base - 1) * v * 0.3; if (R[t] === tn.base) R[t] = Math.max(0, tn.base * (1 + d)); });
  });
  return R;
}

function Tip({ term, children }) {
  const [o, setO] = useState(false); const d = GLOSSARY[term];
  return (<span style={{position:"relative",display:"inline"}}><span onClick={e=>{e.stopPropagation();setO(!o)}} style={{color:"#6eb8ff",cursor:"help",borderBottom:"1px dotted #6eb8ff30",WebkitTapHighlightColor:"transparent"}}>{children||term} <span style={{fontSize:9,opacity:0.5}}>?</span></span>
    {o&&d&&<><div onClick={()=>setO(false)} style={{position:"fixed",inset:0,zIndex:999,background:"rgba(0,0,0,0.6)"}}/><div onClick={e=>e.stopPropagation()} style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:1000,background:"#181828",border:"1px solid #2a2a4a",borderRadius:10,padding:"16px 18px",width:300,maxWidth:"88vw",fontSize:13,color:"#bbb",lineHeight:1.7,boxShadow:"0 10px 40px rgba(0,0,0,0.8)"}}><div style={{fontWeight:700,color:"#fff",marginBottom:6,fontSize:15}}>{term}</div>{d}<button onClick={()=>setO(false)} style={{display:"block",marginTop:10,background:"#252540",border:"none",color:"#ccc",padding:"6px 14px",borderRadius:5,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Close</button></div></>}</span>);
}

function NCard({ node, active, affected, loopC, onClick, pulse, rippleKey, fs, isMobile }) {
  const p = node.base > 0 ? ((node.value - node.base) / node.base * 100) : 0;
  const absP = Math.abs(p);
  const c = CC[node.category];
  const nc = node.sensitivity ? Object.keys(node.sensitivity).length : 0;

  const scale = absP > 0.5 ? Math.max(0.75, Math.min(1.35, 1 + (p / 100) * 0.35)) : 1;
  const intensity = Math.min(0.55, absP / 80);
  const bgFill = absP > 0.5
    ? (p > 0 ? `${c}${Math.round(intensity * 255).toString(16).padStart(2,"0")}` : `${c}${Math.round(intensity * 180).toString(16).padStart(2,"0")}`)
    : (active ? c+"20" : affected ? c+"0c" : pulse ? c+"15" : "#0c0c16e8");
  const borderW = absP > 20 ? 2.5 : absP > 5 ? 2 : 1.5;
  const borderColor = loopC || (absP > 0.5 ? (p > 0 ? "#ff5555" : "#44dd88") : active ? c : affected ? c+"80" : pulse ? c : "#181828");
  const bar = node.unit === "/100" ? Math.min(100, Math.max(0, node.value)) : Math.min(100, (node.value / (node.base * 2)) * 100);
  const shadow = absP > 5
    ? `0 0 ${Math.min(30, absP/2)}px ${p>0?"#ff444450":"#44cc8850"}, 0 0 ${Math.min(60, absP)}px ${p>0?"#ff444420":"#44cc8820"}`
    : active ? `0 0 18px ${c}28`
    : pulse ? `0 0 22px ${c}44, 0 0 48px ${c}22`
    : loopC ? `0 0 14px ${loopC}35`
    : "none";

  // Responsive sizing: fullscreen > desktop > tablet > mobile
  const lblSize = fs ? 11 : isMobile ? 9 : 10;
  const valSize = fs ? 17 : isMobile ? 13 : 15;
  const mw = fs ? 130 : isMobile ? 86 : 116;
  const pad = fs ? "8px 11px 10px" : isMobile ? "5px 7px 7px" : "7px 10px 9px";

  return (
    <div onClick={onClick} style={{
      "--pc": c+"55",
      position:"absolute", left:`${node.x}%`, top:`${node.y}%`,
      transform:`translate(-50%,-50%) scale(${scale})`,
      background: bgFill,
      border:`${borderW}px solid ${borderColor}`,
      borderRadius: 8, padding: pad, cursor: "pointer",
      zIndex: absP > 0.5 ? 15 : pulse ? 20 : active ? 10 : affected ? 5 : 1,
      minWidth: mw, textAlign: "center",
      transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.4s, border-color 0.4s, box-shadow 0.5s",
      boxShadow: shadow,
      WebkitTapHighlightColor:"transparent",
      touchAction:"manipulation",
    }}>
      {rippleKey && absP > 0.5 && (
        <span key={rippleKey} style={{position:"absolute", inset:-7, borderRadius: 12, border: `2px solid ${p>0?"#ff4444":"#44cc88"}`, animation: "ripple 0.9s ease-out forwards", pointerEvents:"none"}}/>
      )}
      {nc > 0 && (
        <div style={{position:"absolute", top:-7, right:-7, minWidth:16, height:16, borderRadius:8, background: c, fontSize:9, fontWeight:700, color:"#000", display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px", pointerEvents:"none", border:"1.5px solid #08080d", opacity: active||affected||pulse||absP>0.5 ? 1 : 0.4}}>{nc}</div>
      )}
      {absP > 0.5 && (
        <div style={{position:"absolute", bottom:-10, left:"50%", transform:"translateX(-50%)", background: p>0?"#ff4444":"#44cc88", color:"#fff", fontSize: absP>15 ? 11 : 10, fontWeight:800, padding:"3px 8px", borderRadius:10, border:"1.5px solid #08080d", whiteSpace:"nowrap", pointerEvents:"none", animation: "badgePop 0.4s ease-out", boxShadow: `0 2px 10px ${p>0?"#ff444466":"#44cc8866"}`, letterSpacing: 0.3}}>{p>0?"+":""}{absP.toFixed(absP>10?0:1)}%</div>
      )}
      <div style={{fontSize:lblSize, fontWeight:600, color: active||affected||pulse||absP>0.5?"#fff":"#888", whiteSpace:"pre-line", lineHeight:1.25, marginBottom:3}}>{node.label}</div>
      <div style={{height: absP>0.5?5:3, background:"#141422", borderRadius:2, overflow:"hidden", marginBottom:3, transition:"height 0.4s"}}>
        <div style={{height:"100%", width:`${bar}%`, background: absP>0.5 ? (p>0?"#ff5555":"#44dd88") : c, borderRadius:2, transition:"width 0.5s, background 0.4s"}}/>
      </div>
      <div style={{fontSize:valSize, fontWeight:700, color: absP>0.5 ? (p>0?"#ff6666":"#55ee99") : c, transition:"color 0.4s",lineHeight:1}}>
        {typeof node.value==="number" ? (node.value>=100?Math.round(node.value):node.value.toFixed(1)) : node.value}
        <span style={{fontSize:9, color:"#666", marginLeft:2}}>{node.unit}</span>
      </div>
    </div>
  );
}

const TOUR = [
  { title: "What is Waste Colonialism?", body: "Every year, wealthy countries export over 35 million tonnes of waste to nations that lack the infrastructure to manage it. This isn't accidental \u2014 it's a system built on economic asymmetry, regulatory gaps, and deliberate industry strategy.\n\nThis interactive map lets you see how the system works and what happens when you change one part of it.", hl: null },
  { title: "The Numbers Are Real", body: "Each box on this map is a real variable with real data from UN, World Bank, and investigative research.\n\nBlue = drivers. Yellow = flows. Purple = enablers. Green = governance. Pink = social. Red = impacts.\n\nThe small badge on each node shows how many other variables it directly affects.", hl: null },
  { title: "431 Million Tonnes", body: "Global plastic production hit 431 megatonnes in 2024 and is on track for 590 Mt by 2050. Only 5\u20136% is actually recycled in the US. The rest has to go somewhere.\n\nSee the badge? This node affects 3 other parts of the system.", hl: "production" },
  { title: "The Export Pipeline", body: "Waste Exports is the most connected node \u2014 it directly affects 6 other variables. When waste crosses a border, it simultaneously overwhelms governance, creates informal jobs, causes health damage, builds dependency, drives contamination, and fuels illegal dumping.\n\nThis is the critical transmission point of the whole system.", hl: "export_volume" },
  { title: "Where It Lands: Kenya", body: "Dandora dumpsite in Nairobi was declared full in 2001. It still receives 2,000+ tonnes daily. 1 million people live nearby. A UNEP study found 50% of children have toxic blood lead levels.\n\nThis is what 'Illegal Dumping at 70/100' looks like on the ground.", hl: "illegal_dumping" },
  { title: "Try It: Move the Slider", body: "Close this guide and tap any box. A slider appears. Drag it \u2014 nodes that change will GROW in size, flash colored badges showing the exact %, pulse with ripples, and shift color.\n\nYou can also tap the \u26F6 button above the map to go fullscreen for a bigger view.", hl: null },
  { title: "Go Deeper", body: "Use the tabs to explore:\n\n\u2022 What If? \u2014 one-click scenarios (China's ban, treaty, AGOA)\n\u2022 Loops \u2014 6 self-reinforcing cycles with animated flow arrows\n\u2022 Iceberg \u2014 hidden structures beneath surface events\n\u2022 Kenya \u2014 timeline, actors, waste streams, human impact\n\u2022 Glossary \u2014 every term explained", hl: null },
];

export default function App() {
  const [nodes, setNodes] = useState(NODES.map(n => ({...n})));
  const [manip, setManip] = useState(null);
  const [slider, setSlider] = useState(100);
  const [loop, setLoop] = useState(null);
  const [view, setView] = useState("system");
  const [scenario, setScenario] = useState(null);
  const [ts, setTs] = useState(0);
  const [showTour, setShowTour] = useState(true);
  const [rippleKey, setRippleKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 400);

  useEffect(() => {
    const handler = () => setVw(window.innerWidth);
    window.addEventListener("resize", handler);
    window.addEventListener("orientationchange", handler);
    return () => { window.removeEventListener("resize", handler); window.removeEventListener("orientationchange", handler); };
  }, []);

  // Lock body scroll when fullscreen
  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [fullscreen]);

  const isTablet = vw >= 768;
  const isDesktop = vw >= 1024;
  const isMobile = vw < 600;

  const bump = () => setRippleKey(k => k + 1);
  const apply = vm => setNodes(NODES.map(n => ({...n, value: vm[n.id] ?? n.base})));
  const onSlider = v => { setSlider(v); setScenario(null); if (manip) { const nd = NODES.find(n => n.id === manip); apply(cascade(manip, nd.base * (v / 100))); bump(); }};
  const reset = () => { setNodes(NODES.map(n => ({...n}))); setManip(null); setSlider(100); setScenario(null); };
  const pick = id => { setManip(id); setSlider(100); setScenario(null); setNodes(NODES.map(n => ({...n}))); };
  const runScenario = sc => { if (sc.id === "baseline") { reset(); return; } setScenario(sc.id); setManip(null);
    const final = {}; NODES.forEach(n => final[n.id] = sc.changes[n.id] ?? n.base);
    Object.entries(sc.changes).forEach(([sid, sv]) => {
      const src = NODES.find(n => n.id === sid); if (!src?.sensitivity) return;
      Object.entries(src.sensitivity).forEach(([tid, sens]) => {
        if (sc.changes[tid] !== undefined) return;
        const tn = NODES.find(n => n.id === tid); if (!tn) return;
        final[tid] = Math.max(0, final[tid] * (1 + (sv / src.base - 1) * sens * 0.4));
      });
    });
    setNodes(NODES.map(n => ({...n, value: final[n.id] ?? n.base})));
    bump();
  };

  const mn = manip ? NODES.find(n => n.id === manip) : null;
  const aff = new Set();
  if (mn?.sensitivity) { Object.keys(mn.sensitivity).forEach(id => { aff.add(id); const l1 = NODES.find(n => n.id === id); if (l1?.sensitivity) Object.keys(l1.sensitivity).forEach(id2 => { if (id2 !== manip) aff.add(id2); }); }); }
  const lp = loop ? LOOPS.find(l => l.id === loop) : null;
  const lpIds = lp ? new Set(lp.nodes) : new Set();
  const tourHL = showTour ? TOUR[ts]?.hl : null;
  const hasHL = !!tourHL;

  // Responsive map height
  const mapHeight = fullscreen
    ? "calc(100vh - 130px)"
    : isDesktop ? 640 : isTablet ? 600 : 520;

  // ============ RENDER: SYSTEM MAP (shared between normal and fullscreen) ============
  const compressX = (x) => isMobile && !fullscreen ? 9 + (x * 0.82) : x;

  const renderMap = () => (
    <div style={{position:"relative",width:"100%",height:mapHeight,background:"#0a0a0f",borderRadius:fullscreen?0:8,border:fullscreen?"none":"1px solid #111118",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,opacity:0.02,backgroundImage:"radial-gradient(#fff 1px,transparent 1px)",backgroundSize:"28px 28px"}}/>
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
        <defs>
          <marker id="mr" markerWidth="5" markerHeight="4" refX="5" refY="2" orient="auto"><polygon points="0 0,5 2,0 4" fill="#ff444455"/></marker>
          <marker id="mg" markerWidth="5" markerHeight="4" refX="5" refY="2" orient="auto"><polygon points="0 0,5 2,0 4" fill="#44cc8855"/></marker>
          {LOOPS.map(l => (<marker key={l.id} id={`ml-${l.id}`} markerWidth="7" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,7 3,0 6" fill={l.color}/></marker>))}
        </defs>
        {manip && mn?.sensitivity && Object.entries(mn.sensitivity).map(([tid,s]) => {
          const t = nodes.find(n => n.id === tid); if (!t) return null;
          const pos = s > 0;
          const sx = compressX(mn.x), tx = compressX(t.x);
          return (<g key={tid}><line x1={`${sx}%`} y1={`${mn.y}%`} x2={`${tx}%`} y2={`${t.y}%`} stroke={pos?"#ff444440":"#44cc8840"} strokeWidth={Math.abs(s)*2.5+0.5} strokeDasharray="4,3" markerEnd={pos?"url(#mr)":"url(#mg)"}/><text x={`${(sx+tx)/2}%`} y={`${(mn.y+t.y)/2}%`} fill={pos?"#ff4444":"#44cc88"} fontSize="11" fontWeight="700" textAnchor="middle" dy="-3">{pos?"+":"\u2212"}</text></g>);
        })}
        {lp && lp.nodes.map((nid, i) => {
          const from = NODES.find(n => n.id === nid);
          const to = NODES.find(n => n.id === lp.nodes[(i + 1) % lp.nodes.length]);
          if (!from || !to) return null;
          const fx = compressX(from.x), tx = compressX(to.x);
          const mx = (fx + tx) / 2, my = (from.y + to.y) / 2;
          const dx = tx - fx, dy = to.y - from.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const perpX = -dy / dist * 6, perpY = dx / dist * 6;
          return (<g key={`loop-${nid}-${i}`}><path d={`M ${fx}% ${from.y}% Q ${mx + perpX}% ${my + perpY}% ${tx}% ${to.y}%`} stroke={lp.color} strokeWidth="2.5" fill="none" strokeDasharray="8,4" strokeLinecap="round" markerEnd={`url(#ml-${lp.id})`} style={{animation:"flowDash 1.2s linear infinite, loopGlow 2s ease-in-out infinite", filter:`drop-shadow(0 0 6px ${lp.color}88)`}}/></g>);
        })}
      </svg>
      {nodes.map(n => {
        // On narrow mobile screens, compress the x-axis to keep leftmost/rightmost nodes on screen
        const nx = isMobile && !fullscreen ? 9 + (n.x * 0.82) : n.x;
        const nodeAdjusted = {...n, x: nx};
        return (<NCard key={n.id} node={nodeAdjusted} active={manip===n.id} affected={aff.has(n.id)||lpIds.has(n.id)||(scenario&&n.value!==n.base)} loopC={lpIds.has(n.id)?lp?.color:null} onClick={()=>pick(n.id)} pulse={tourHL===n.id} rippleKey={rippleKey} fs={fullscreen} isMobile={isMobile && !fullscreen}/>);
      })}
    </div>
  );

  // ============ RENDER: SLIDER CONTROL ============
  const renderControl = () => manip ? (
    <div style={{background:"#0c0c14",border:"1px solid #ff444420",borderRadius:8,padding:"10px 12px",marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <div><span style={{fontSize:13,color:"#ff4444",fontWeight:600}}>{mn?.label.replace('\n',' ')}</span><span style={{fontSize:11,color:"#666",marginLeft:8}}>{Math.round(slider)}%</span></div>
        <button onClick={reset} style={{background:"#1a1a28",border:"1px solid #252540",color:"#888",padding:"5px 12px",borderRadius:5,fontSize:11,cursor:"pointer",fontFamily:"inherit",minHeight:30,WebkitTapHighlightColor:"transparent"}}>Reset</button>
      </div>
      <input type="range" min={10} max={300} value={slider} onChange={e=>onSlider(+e.target.value)} style={{width:"100%",touchAction:"pan-x"}} />
      <div style={{position:"relative",height:14,fontSize:9,color:"#3a3a4a",marginTop:2}}>
        <span style={{position:"absolute",left:0}}>{"\u25BC"} 10%</span>
        <span style={{position:"absolute",left:"31%",transform:"translateX(-50%)",color:"#666"}}>|100%</span>
        <span style={{position:"absolute",right:0}}>300% {"\u25B2"}</span>
      </div>
      {mn?.ix&&<div style={{fontSize:10,color:"#555",marginTop:5,padding:"4px 8px",background:"#08080d",borderRadius:4}}>{mn.ix}</div>}
    </div>
  ) : (
    <div style={{background:"#0c0c14",border:"1px solid #111118",borderRadius:8,padding:"8px 12px",marginBottom:8,fontSize:11,color:"#555"}}>Tap any node. Watch it and its connections <span style={{color:"#ff5555"}}>grow</span>/<span style={{color:"#44dd88"}}>shrink</span> and flash % badges.</div>
  );

  // ============ FULLSCREEN MODE ============
  if (fullscreen) {
    return (
      <div style={{position:"fixed",inset:0,zIndex:5000,background:"#08080d",color:"#d8d5cc",fontFamily:"'Fira Code',monospace",display:"flex",flexDirection:"column"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700;900&display=swap');*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}html,body{touch-action:manipulation;-webkit-text-size-adjust:100%}input[type=range]{-webkit-appearance:none;height:5px;border-radius:3px;outline:none;background:linear-gradient(90deg,#44cc88 0%,#44cc88 31%,#444 31%,#444 32%,#ff4444 100%);touch-action:pan-x}input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:#fff;cursor:pointer;border:3px solid #08080d;box-shadow:0 0 8px rgba(255,255,255,0.2)}input[type=range]::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#fff;cursor:pointer;border:3px solid #08080d}@keyframes ripple{0%{opacity:0.9;transform:scale(1)}100%{opacity:0;transform:scale(1.6)}}@keyframes badgePop{0%{opacity:0;transform:scale(0.3) translateX(-50%)}70%{transform:scale(1.15) translateX(-50%)}100%{opacity:1;transform:scale(1) translateX(-50%)}}@keyframes flowDash{to{stroke-dashoffset:-20}}@keyframes loopGlow{0%,100%{opacity:0.35}50%{opacity:0.9}}@keyframes pulse{0%,100%{box-shadow:0 0 10px var(--pc,#4488ff33)}50%{box-shadow:0 0 28px var(--pc,#4488ff55),0 0 56px var(--pc,#4488ff22)}}`}</style>
        <div style={{padding:"10px 14px",borderBottom:"1px solid #151520",display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setFullscreen(false)} style={{background:"#1a1a28",border:"1px solid #252540",color:"#ccc",padding:"7px 14px",borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:"inherit",minHeight:36,WebkitTapHighlightColor:"transparent",fontWeight:500}}>{"\u2715"} Close</button>
          <div style={{flex:1}}>
            <div style={{fontSize:9,color:"#ff4444",textTransform:"uppercase",letterSpacing:3}}>Fullscreen Map</div>
            <div style={{fontSize:14,fontWeight:700,color:"#fff",fontFamily:"'Playfair Display',serif"}}>Waste Neocolonialism</div>
          </div>
          {loop && <button onClick={()=>setLoop(null)} style={{background:lp.color+"18",border:`1px solid ${lp.color}40`,color:lp.color,padding:"5px 10px",borderRadius:5,fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>{lp.icon} {loop} {"\u2715"}</button>}
        </div>
        <div style={{padding:"10px 14px 6px"}}>{renderControl()}</div>
        <div style={{flex:1,padding:"0 4px 10px",overflow:"hidden"}}>{renderMap()}</div>
      </div>
    );
  }

  // ============ NORMAL VIEW ============
  return (
    <div style={{background:"#08080d",color:"#d8d5cc",fontFamily:"'Fira Code',monospace",minHeight:"100vh",maxWidth:isDesktop?1200:"100%",margin:"0 auto"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700;900&display=swap');*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}html{-webkit-text-size-adjust:100%;text-size-adjust:100%}body{touch-action:manipulation}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:#222;border-radius:4px}input[type=range]{-webkit-appearance:none;height:5px;border-radius:3px;outline:none;background:linear-gradient(90deg,#44cc88 0%,#44cc88 31%,#444 31%,#444 32%,#ff4444 100%);touch-action:pan-x}input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:#fff;cursor:pointer;border:3px solid #08080d;box-shadow:0 0 8px rgba(255,255,255,0.2)}input[type=range]::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#fff;cursor:pointer;border:3px solid #08080d}button{font-family:inherit;-webkit-tap-highlight-color:transparent}.fi{animation:fi .25s ease}@keyframes fi{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{box-shadow:0 0 10px var(--pc,#4488ff33)}50%{box-shadow:0 0 28px var(--pc,#4488ff55),0 0 56px var(--pc,#4488ff22)}}@keyframes ripple{0%{opacity:0.9;transform:scale(1)}100%{opacity:0;transform:scale(1.6)}}@keyframes badgePop{0%{opacity:0;transform:scale(0.3) translateX(-50%)}70%{transform:scale(1.15) translateX(-50%)}100%{opacity:1;transform:scale(1) translateX(-50%)}}@keyframes flowDash{to{stroke-dashoffset:-20}}@keyframes loopGlow{0%,100%{opacity:0.35}50%{opacity:0.9}}`}</style>

      {/* TOUR */}
      {showTour && (
        <div style={{position:"fixed",inset:0,zIndex:2000,display:"flex",flexDirection:"column",justifyContent:hasHL?"flex-end":"center",alignItems:"center",background:hasHL?"rgba(0,0,0,0.45)":"rgba(0,0,0,0.78)",padding:hasHL?"8px 12px 14px":"16px",transition:"background 0.4s"}}>
          <div style={{background:"#141420",border:"1px solid #2a2a4a",borderRadius:14,padding:"20px 22px",maxWidth:420,width:"100%",boxShadow:"0 16px 64px rgba(0,0,0,0.8)"}}>
            <div style={{display:"flex",gap:4,marginBottom:10}}>{TOUR.map((_,i)=>(<div key={i} style={{flex:1,height:3,borderRadius:2,background:i<ts?"#ff4444":i===ts?"#ff4444":i===ts+1?"#ff444440":"#1a1a2a"}}/>))}</div>
            <div style={{fontSize:9,color:"#ff4444",textTransform:"uppercase",letterSpacing:3,marginBottom:5}}>{ts+1} / {TOUR.length}</div>
            <div style={{fontSize:19,fontWeight:700,color:"#fff",fontFamily:"'Playfair Display',serif",marginBottom:8,lineHeight:1.2}}>{TOUR[ts].title}</div>
            <div style={{fontSize:13,color:"#aaa",lineHeight:1.75,marginBottom:16,whiteSpace:"pre-line"}}>{TOUR[ts].body}</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button onClick={()=>setShowTour(false)} style={{background:"none",border:"none",color:"#555",fontSize:12,cursor:"pointer",fontFamily:"inherit",padding:"6px 8px",minHeight:36}}>Skip</button>
              <div style={{display:"flex",gap:8}}>
                {ts>0&&<button onClick={()=>setTs(ts-1)} style={{background:"#1a1a2a",border:"1px solid #252540",color:"#aaa",padding:"8px 14px",borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:"inherit",minHeight:36}}>Back</button>}
                <button onClick={()=>{if(ts<TOUR.length-1)setTs(ts+1);else setShowTour(false)}} style={{background:"#ff4444",border:"none",color:"#fff",padding:"8px 18px",borderRadius:6,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:600,minHeight:36}}>{ts<TOUR.length-1?"Next \u2192":"Start \u2192"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{padding:"16px 14px 12px",borderBottom:"1px solid #111118"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
          <div style={{minWidth:0,flex:1}}>
            <div style={{fontSize:9,color:"#ff4444",textTransform:"uppercase",letterSpacing:4,marginBottom:4}}>Interactive Systems Map</div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:isTablet?32:24,fontWeight:900,color:"#fff",lineHeight:1.1}}>Waste Neocolonialism</h1>
          </div>
          <button onClick={()=>{setShowTour(true);setTs(0)}} style={{background:"#ff444415",border:"1px solid #ff444430",color:"#ff6666",padding:"6px 12px",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:500,minHeight:34,flexShrink:0}}>? Guide</button>
        </div>
        <p style={{fontSize:11,color:"#555",marginTop:5}}>Tap nodes {"\u2192"} drag slider {"\u2192"} watch cascade. <Tip term="Index (0\u2013100)">Indexes</Tip> \u00b7 <Tip term="Cascade (3 levels)">Propagation</Tip></p>
      </div>

      {/* NAV */}
      <div style={{display:"flex",borderBottom:"1px solid #111118",overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        {[{id:"system",l:"System Map"},{id:"scenarios",l:"What If?"},{id:"kenya",l:"Kenya"},{id:"loops",l:"Loops"},{id:"iceberg",l:"Iceberg"},{id:"glossary",l:"Glossary"}].map(v=>(<button key={v.id} onClick={()=>setView(v.id)} style={{background:"none",border:"none",borderBottom:view===v.id?"2px solid #ff4444":"2px solid transparent",color:view===v.id?"#fff":"#555",padding:"11px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",minHeight:42,fontWeight:view===v.id?600:400}}>{v.l}</button>))}
      </div>

      <div style={{padding:isTablet?16:12}}>
        {/* SYSTEM MAP */}
        {view==="system"&&(<div className="fi">
          {renderControl()}
          {loop&&<div style={{display:"flex",gap:4,marginBottom:8,alignItems:"center",padding:"6px 11px",background:lp.color+"12",borderRadius:6,border:`1px solid ${lp.color}30`}}><span style={{fontSize:11,color:lp.color,fontWeight:600}}>{lp.icon} {loop}: {lp.name}</span><span style={{fontSize:10,color:"#666",marginLeft:5}}>\u2014 flow arrows shown below</span><button onClick={()=>setLoop(null)} style={{background:"none",border:"none",color:"#666",fontSize:14,cursor:"pointer",marginLeft:"auto",padding:"2px 6px",minHeight:28}}>{"\u2715"}</button></div>}
          <div style={{position:"relative"}}>
            {renderMap()}
            {/* Fullscreen toggle button */}
            <button onClick={()=>setFullscreen(true)} style={{position:"absolute",top:10,right:10,zIndex:50,background:"rgba(20,20,32,0.92)",border:"1px solid #2a2a40",color:"#ccc",padding:"8px 10px",borderRadius:6,fontSize:14,cursor:"pointer",fontFamily:"inherit",minHeight:38,WebkitBackdropFilter:"blur(4px)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",gap:5}} title="Expand to fullscreen">
              <span style={{fontSize:14}}>{"\u26F6"}</span>
              <span style={{fontSize:10}}>Expand</span>
            </button>
          </div>

          {manip && mn && (
            <div className="fi" style={{marginTop:10,background:"#0c0c14",border:`1px solid ${CC[mn.category]}25`,borderRadius:8,padding:"12px 14px"}}>
              <span style={{fontSize:9,color:CC[mn.category],textTransform:"uppercase",letterSpacing:2,background:CC[mn.category]+"12",padding:"2px 6px",borderRadius:3}}>{mn.category}</span>
              <div style={{fontSize:14,fontWeight:700,color:"#fff",marginTop:5,marginBottom:4}}>{mn.label.replace('\n',' ')}</div>
              <div style={{fontSize:11,color:"#888",lineHeight:1.7}}>{mn.desc}</div>
              {mn.sensitivity&&<div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:4}}>{Object.entries(mn.sensitivity).map(([id,s])=>{const t=NODES.find(n=>n.id===id);return t?(<span key={id} style={{fontSize:10,padding:"2px 7px",borderRadius:3,background:s>0?"#ff444412":"#44cc8812",color:s>0?"#ff6666":"#44dd88"}}>{s>0?"\u2191":"\u2193"} {t.label.replace('\n',' ')} {Math.abs(s*100)}%</span>):null})}</div>}
            </div>
          )}

          <div style={{marginTop:8,display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>{Object.entries(CC).map(([k,c])=>(<div key={k} style={{display:"flex",alignItems:"center",gap:3,fontSize:9,color:"#3a3a4a"}}><div style={{width:7,height:7,borderRadius:"50%",background:c}}/>{k}</div>))}</div>
        </div>)}

        {/* SCENARIOS */}
        {view==="scenarios"&&(<div className="fi">
          <div style={{fontSize:10,color:"#ff4444",textTransform:"uppercase",letterSpacing:3,marginBottom:6}}>What-If Scenarios</div>
          <p style={{fontSize:12,color:"#555",marginBottom:12,lineHeight:1.6}}>Tap a scenario \u2014 the system map will show every affected node growing, shrinking, and flashing its change.</p>
          {SCENARIOS.map(sc=>(<button key={sc.id} onClick={()=>{runScenario(sc);setView("system")}} style={{display:"block",width:"100%",textAlign:"left",background:"#0a0a0f",border:`1px solid ${scenario===sc.id?"#ff444430":"#111118"}`,borderRadius:8,padding:"12px 14px",marginBottom:7,cursor:"pointer",fontFamily:"inherit",minHeight:60}}>
            <div style={{fontSize:14,fontWeight:600,color:"#fff"}}>{sc.name}</div>
            <div style={{fontSize:11,color:"#666",marginTop:2}}>{sc.desc}</div>
            {sc.id!=="baseline"&&<div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:7}}>{Object.entries(sc.changes).map(([id,v])=>{const nd=NODES.find(n=>n.id===id);if(!nd)return null;const p=((v-nd.base)/nd.base*100);return(<span key={id} style={{fontSize:9,padding:"2px 6px",borderRadius:3,background:p>0?"#ff444412":"#44cc8812",color:p>0?"#ff6666":"#44dd88"}}>{nd.label.replace('\n',' ')} {p>0?"+":""}{p.toFixed(0)}%</span>)})}</div>}
          </button>))}
        </div>)}

        {/* ============ EXPANDED KENYA SECTION ============ */}
        {view==="kenya"&&(<div className="fi">
          <div style={{fontSize:10,color:"#ff4444",textTransform:"uppercase",letterSpacing:3,marginBottom:5}}>Kenya Case Study</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:isTablet?26:20,fontWeight:700,color:"#fff",marginBottom:6,lineHeight:1.15}}>Ground Truth: Where the System Hits Home</h2>
          <p style={{fontSize:12,color:"#666",marginBottom:14,lineHeight:1.7}}>Kenya is the East African terminus for the world's unwanted waste. Its story shows how economic asymmetry, trade coercion, industry lobbying, and port-level corruption combine into a pipeline that poisons the people it's supposed to serve.</p>

          {/* KEY STATS GRID */}
          <div style={{display:"grid",gridTemplateColumns:`repeat(auto-fill,minmax(${isTablet?150:130}px,1fr))`,gap:6,marginBottom:18}}>
            {[
              {l:"Dandora intake",v:"2,000+",u:"tonnes/day",c:"#ff4444"},
              {l:"Waste mismanaged",v:"92",u:"%",c:"#ff4444"},
              {l:"E-waste (2024)",v:"53,559",u:"tonnes",c:"#ffaa22"},
              {l:"Mitumba imports",v:"200K",u:"tonnes/yr",c:"#aa66ff"},
              {l:"Children with toxic lead",v:"50",u:"% near Dandora",c:"#ff66aa"},
              {l:"Formal recycling",v:"4\u20135",u:"%",c:"#4488ff"},
              {l:"Textile waste",v:"30\u201340",u:"% of imports",c:"#aa66ff"},
              {l:"AGOA at risk",v:"$470M",u:"annually",c:"#ffaa22"},
            ].map((s,i)=>(<div key={i} style={{background:"#0c0c14",border:`1px solid ${s.c}18`,borderRadius:7,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontSize:isTablet?22:18,fontWeight:700,color:s.c,fontFamily:"'Playfair Display',serif"}}>{s.v}</div>
              <div style={{fontSize:9,color:"#555",marginTop:1}}>{s.u}</div>
              <div style={{fontSize:8,color:"#333",marginTop:4,textTransform:"uppercase",letterSpacing:0.3}}>{s.l}</div>
            </div>))}
          </div>

          {/* DANDORA DEEP DIVE */}
          <div style={{background:"linear-gradient(180deg,#ff444408,#0c0c14)",border:"1px solid #ff444425",borderRadius:10,padding:"14px 16px",marginBottom:14}}>
            <div style={{fontSize:10,color:"#ff4444",textTransform:"uppercase",letterSpacing:2.5,marginBottom:3}}>Dandora Deep Dive</div>
            <div style={{fontSize:16,fontWeight:700,color:"#fff",fontFamily:"'Playfair Display',serif",marginBottom:8}}>30 acres. 1 million neighbors. 2007 UNEP study findings.</div>
            <p style={{fontSize:11,color:"#888",lineHeight:1.7,marginBottom:10}}>UNEP commissioned biochemist Njoroge Kimani to test 328 children living near Dandora. The results stunned even the researchers.</p>
            <div style={{display:"grid",gridTemplateColumns:`repeat(auto-fill,minmax(${isTablet?180:140}px,1fr))`,gap:6}}>
              {[
                {l:"Blood lead > threshold",v:"50%",d:"of children tested"},
                {l:"Soil lead",v:"13,500 ppm",d:"90\u00d7 safe limit"},
                {l:"Soil cadmium",v:"1,058 ppm",d:"212\u00d7 safe limit"},
                {l:"Soil mercury",v:"46.7 ppm",d:"23\u00d7 WHO limit"},
                {l:"Pica symptoms",v:"25\u201330%",d:"of children \u2014 lead poisoning"},
                {l:"Respiratory disease",v:"~50%",d:"of children nearby"},
              ].map((x,i)=>(<div key={i} style={{background:"#08080d",border:"1px solid #1a1a28",borderRadius:6,padding:"8px 10px"}}>
                <div style={{fontSize:9,color:"#666"}}>{x.l}</div>
                <div style={{fontSize:17,fontWeight:800,color:"#ff5555",fontFamily:"'Playfair Display',serif"}}>{x.v}</div>
                <div style={{fontSize:9,color:"#444"}}>{x.d}</div>
              </div>))}
            </div>
            <div style={{marginTop:10,padding:"8px 12px",background:"#ff444410",borderLeft:"3px solid #ff4444",borderRadius:4,fontSize:11,color:"#bbb",lineHeight:1.7}}>
              In February 2026, Kenyan courts awarded KSh 25.8 million to 1,032 waste pickers, finding that Nairobi County and NEMA had jointly violated their constitutional rights. Compensation remains unpaid.
            </div>
          </div>

          {/* THREE WASTE STREAMS */}
          <div style={{fontSize:10,color:"#ff4444",textTransform:"uppercase",letterSpacing:2.5,marginBottom:8}}>The Three Waste Streams</div>
          <div style={{display:"grid",gap:6,marginBottom:16}}>
            {KENYA_STREAMS.map((s,i)=>(<div key={i} style={{background:"#0c0c14",border:`1px solid ${s.color}22`,borderRadius:8,padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                <div style={{fontSize:24}}>{s.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:s.color,fontFamily:"'Playfair Display',serif"}}>{s.name}</div>
                  <div style={{fontSize:10,color:"#555",marginTop:1}}>Origin: {s.origin}</div>
                </div>
                <div style={{fontSize:11,color:s.color,fontWeight:700,whiteSpace:"nowrap",background:s.color+"15",padding:"3px 8px",borderRadius:4}}>{s.volume}</div>
              </div>
              <div style={{fontSize:11,color:"#888",lineHeight:1.7}}>{s.detail}</div>
            </div>))}
          </div>

          {/* TIMELINE */}
          <div style={{fontSize:10,color:"#ff4444",textTransform:"uppercase",letterSpacing:2.5,marginBottom:8}}>Timeline: 50 Years of Kenya's Waste Crisis</div>
          <div style={{background:"#0c0c14",border:"1px solid #111118",borderRadius:8,padding:"14px 16px",marginBottom:16,position:"relative"}}>
            <div style={{position:"absolute",left:isTablet?80:60,top:20,bottom:20,width:2,background:"linear-gradient(180deg,#4488ff,#ffaa22,#ff66aa,#ff4444,#aa66ff)"}}/>
            {KENYA_TIMELINE.map((t,i)=>(<div key={i} style={{display:"flex",gap:12,marginBottom:i===KENYA_TIMELINE.length-1?0:12,position:"relative"}}>
              <div style={{width:isTablet?68:48,fontSize:isTablet?14:12,fontWeight:700,color:t.color,fontFamily:"'Playfair Display',serif",flexShrink:0,paddingTop:2}}>{t.year}</div>
              <div style={{width:14,flexShrink:0,display:"flex",justifyContent:"center",paddingTop:6}}><div style={{width:10,height:10,borderRadius:5,background:t.color,border:"2px solid #0c0c14",boxShadow:`0 0 0 2px ${t.color}40`}}/></div>
              <div style={{fontSize:11,color:"#999",lineHeight:1.6,paddingTop:3,flex:1}}>{t.event}</div>
            </div>))}
          </div>

          {/* KEY ACTORS */}
          <div style={{fontSize:10,color:"#ff4444",textTransform:"uppercase",letterSpacing:2.5,marginBottom:8}}>Who's Who: Key Actors in the System</div>
          <div style={{display:"grid",gridTemplateColumns:isTablet?"repeat(2,1fr)":"1fr",gap:6,marginBottom:16}}>
            {KENYA_ACTORS.map((a,i)=>(<div key={i} style={{background:"#0c0c14",border:`1px solid ${a.color}20`,borderRadius:7,padding:"11px 13px"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                <div style={{width:8,height:8,borderRadius:4,background:a.color}}/>
                <div style={{fontSize:12,fontWeight:700,color:"#fff"}}>{a.name}</div>
                <div style={{fontSize:8,color:a.color,marginLeft:"auto",textTransform:"uppercase",letterSpacing:1,background:a.color+"10",padding:"1px 6px",borderRadius:2}}>{a.side}</div>
              </div>
              <div style={{fontSize:10,color:"#777",lineHeight:1.7}}>{a.role}</div>
            </div>))}
          </div>

          {/* KEY CONNECTIONS */}
          <div style={{fontSize:10,color:"#ff4444",textTransform:"uppercase",letterSpacing:2.5,marginBottom:8}}>Connecting the Dots</div>
          <div style={{background:"#0c0c14",border:"1px solid #111118",borderRadius:8,padding:"12px 14px",marginBottom:16}}>
            {[
              {from:"ACC Lobbying (2020)",to:"Kenya FTA push",link:"FOIA documents revealed ACC wanted Kenya as 'hub' and 'foothold' for US plastics across Africa via AfCFTA"},
              {from:"AGOA Threats",to:"EAC Clothing Ban Collapse",link:"Kenya withdrew from ban in 2017 after US threatened to revoke $470M+ in trade preferences. Rwanda defied \u2014 got punished."},
              {from:"China National Sword (2018)",to:"Africa waste surge",link:"After China's 99% import cut, plastic exports to Africa quadrupled in 2019. Kenya's position as East African hub made it a primary target."},
              {from:"30\u201340% Textile Waste",to:"Nairobi River Contamination",link:"Unsellable synthetic mitumba from Gikomba accumulates along riverbanks. Two-thirds is plastic fiber that will never biodegrade."},
              {from:"Court Orders (2021)",to:"Dandora Still Open",link:"Justice Bor ordered closure. Ignored for 5 years. No alternative site. KSh 4B relocation cost. Cartel control. Overlapping mandates."},
            ].map((c,i)=>(<div key={i} style={{marginBottom:i===4?0:8,padding:"9px 11px",background:"#08080d",borderRadius:5,borderLeft:"2px solid #ff4444"}}>
              <div style={{fontSize:11,display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{color:"#ffaa22",fontWeight:600}}>{c.from}</span>
                <span style={{color:"#444"}}>{"\u2192"}</span>
                <span style={{color:"#ff4444",fontWeight:600}}>{c.to}</span>
              </div>
              <div style={{fontSize:10,color:"#666",marginTop:4,lineHeight:1.6}}>{c.link}</div>
            </div>))}
          </div>

          {/* WHAT'S BEING DONE */}
          <div style={{background:"linear-gradient(180deg,#44cc8808,#0c0c14)",border:"1px solid #44cc8825",borderRadius:10,padding:"14px 16px"}}>
            <div style={{fontSize:10,color:"#44cc88",textTransform:"uppercase",letterSpacing:2.5,marginBottom:3}}>What's Being Done</div>
            <div style={{fontSize:15,fontWeight:700,color:"#fff",fontFamily:"'Playfair Display',serif",marginBottom:8}}>Resistance, Reform, and Roadblocks</div>
            <div style={{display:"grid",gap:6}}>
              {[
                {t:"Bamako Convention ratification",d:"Civil society (CEJAD, Greenpeace Africa) pushing Kenya to finally ratify the 1991 African treaty banning hazardous waste imports. Signed 2003, still not ratified after 23 years."},
                {t:"2017 plastic bag ban",d:"Among world's strictest: $40K fine + 4 years prison. NEMA reported 80% reduction initially, though enforcement has waned."},
                {t:"EPR Regulations 2024",d:"Gazetted November 2024 requiring producer take-back schemes. Challenged in court and suspended within months. Less than 5% of producers complied before suspension."},
                {t:"Draft E-Waste Regulations 2025",d:"Would ban electronics imports older than 12 years, with fines up to KSh 10 million. At public validation stage."},
                {t:"Waste picker rights case",d:"Feb 2026: Court awarded KSh 25.8M to 1,032 waste pickers, finding constitutional rights violated. Landmark ruling, unpaid."},
                {t:"Owino Uhuru lead case",d:"Dec 2024: Supreme Court upheld KSh 1.3B compensation + KSh 700M cleanup. NEMA found 40% liable. Still unpaid."},
              ].map((x,i)=>(<div key={i} style={{background:"#08080d",borderRadius:5,padding:"8px 11px",borderLeft:"2px solid #44cc88"}}>
                <div style={{fontSize:11,fontWeight:600,color:"#aaccaa"}}>{x.t}</div>
                <div style={{fontSize:10,color:"#666",marginTop:2,lineHeight:1.6}}>{x.d}</div>
              </div>))}
            </div>
          </div>
        </div>)}

        {/* LOOPS */}
        {view==="loops"&&(<div className="fi">
          <p style={{fontSize:11,color:"#555",marginBottom:10}}>Six <Tip term="Reinforcing Loop (R)">reinforcing loops</Tip>. Select one, then tap "View on Map" to see animated flow arrows.</p>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>{LOOPS.map(l=>(<button key={l.id} onClick={()=>setLoop(loop===l.id?null:l.id)} style={{background:loop===l.id?l.color+"18":"transparent",border:`1px solid ${loop===l.id?l.color:"#181828"}`,borderRadius:6,padding:"7px 12px",cursor:"pointer",color:loop===l.id?l.color:"#555",fontSize:12,fontFamily:"inherit",fontWeight:loop===l.id?600:400,minHeight:36}}>{l.icon} {l.id}</button>))}</div>
          {loop?(()=>{const lpl=LOOPS.find(l=>l.id===loop);return(
            <div className="fi" style={{background:"#0c0c14",border:`1px solid ${lpl.color}25`,borderRadius:8,padding:14}}>
              <div style={{fontSize:16,fontWeight:700,color:lpl.color,fontFamily:"'Playfair Display',serif",marginBottom:4}}>{lpl.icon} {lpl.id}: {lpl.name}</div>
              <div style={{fontSize:11,color:"#777",lineHeight:1.7,marginBottom:10}}>{lpl.desc}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:3,alignItems:"center",marginBottom:10}}>{lpl.nodes.map((nid,i)=>{const nd=NODES.find(n=>n.id===nid);return nd?(<div key={`${nid}-${i}`} style={{display:"flex",alignItems:"center",gap:3}}><span style={{padding:"3px 8px",background:lpl.color+"15",border:`1px solid ${lpl.color}30`,borderRadius:4,fontSize:10,color:lpl.color}}>{nd.label.replace('\n',' ')}</span>{i<lpl.nodes.length-1&&<span style={{color:lpl.color,fontSize:12}}>{"\u2192"}</span>}</div>):null})}<span style={{fontSize:11,color:lpl.color,marginLeft:3}}>{"\u21BB"}</span></div>
              <div style={{padding:"9px 11px",background:"#08080d",borderRadius:5,borderLeft:`2px solid ${lpl.color}`,fontSize:11,color:"#888",lineHeight:1.7}}>{lpl.ev}</div>
              <button onClick={()=>setView("system")} style={{marginTop:10,background:lpl.color+"18",border:`1px solid ${lpl.color}40`,color:lpl.color,padding:"7px 14px",borderRadius:5,fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:600,minHeight:36}}>View on Map {"\u2192"}</button>
            </div>
          )})():<div style={{textAlign:"center",padding:30,color:"#2a2a3a",fontSize:11}}>Select a loop above</div>}
        </div>)}

        {/* ICEBERG */}
        {view==="iceberg"&&(<div className="fi">
          <div style={{fontSize:10,color:"#ff4444",textTransform:"uppercase",letterSpacing:3,marginBottom:5}}>Iceberg Model</div>
          <p style={{fontSize:12,color:"#555",marginBottom:12,lineHeight:1.7}}>Most people see the surface events. Underneath lie patterns, structures, and mental models holding the system in place.</p>
          <div style={{textAlign:"center",fontSize:9,color:"#4488ff",padding:"3px 0",letterSpacing:2,textTransform:"uppercase",borderBottom:"1px solid #4488ff25",marginBottom:6}}>{"\u2500"} surface {"\u2500"}</div>
          {ICEBERG.map((layer, li) => (
            <div key={layer.layer} style={{background:`${layer.color}08`,border:`1px solid ${layer.color}20`,borderRadius:8,padding:"12px 14px",marginBottom:5}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:22}}>{layer.icon}</span>
                <div><div style={{fontSize:14,fontWeight:700,color:layer.color,fontFamily:"'Playfair Display',serif"}}>{layer.layer}</div><div style={{fontSize:10,color:"#555"}}>{layer.desc}</div></div>
                <div style={{marginLeft:"auto",fontSize:8,color:"#333",textTransform:"uppercase"}}>{li===0?"visible":"hidden"}</div>
              </div>
              <div style={{display:"grid",gap:4}}>{layer.items.map((item, ii) => (<div key={ii} style={{fontSize:11,color:"#888",lineHeight:1.6,padding:"6px 10px",background:`${layer.color}08`,borderRadius:5,borderLeft:`2px solid ${layer.color}35`}}>{item}</div>))}</div>
            </div>
          ))}
          <div style={{textAlign:"center",fontSize:10,color:"#444",marginTop:8,lineHeight:1.6,padding:"0 12px"}}>Interventions at the <span style={{color:"#aa66ff"}}>mental model</span> level create the deepest change.</div>
        </div>)}

        {/* GLOSSARY */}
        {view==="glossary"&&(<div className="fi">
          <div style={{fontSize:10,color:"#ff4444",textTransform:"uppercase",letterSpacing:3,marginBottom:8}}>All Terms</div>
          <div style={{display:"grid",gap:5}}>{Object.entries(GLOSSARY).map(([t,d])=>(<div key={t} style={{background:"#0c0c14",border:"1px solid #111118",borderRadius:7,padding:"10px 12px"}}><div style={{fontSize:12,fontWeight:700,color:"#fff",marginBottom:3}}>{t}</div><div style={{fontSize:11,color:"#666",lineHeight:1.7}}>{d}</div></div>))}</div>
        </div>)}
      </div>
      <div style={{padding:12,borderTop:"1px solid #111118",fontSize:9,color:"#1a1a2a",textAlign:"center",lineHeight:1.7}}>UNEP {"\u00b7"} Basel Convention {"\u00b7"} Global E-Waste Monitor {"\u00b7"} BAN {"\u00b7"} GAIA {"\u00b7"} Greenpeace Unearthed {"\u00b7"} Changing Markets {"\u00b7"} Global Initiative {"\u00b7"} World Bank {"\u00b7"} INTERPOL</div>
    </div>
  );
}
