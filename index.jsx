import { useState, useRef, useCallback, useEffect } from "react";

const TABLE_W = 230;
const ROW_H = 22;
const HEADER_H = 52;

const initialTables = {
    O0: {
        label: "O00PUT00", subtitle: "SUMMARY", color: "#F59E0B",
        x: 380, y: 40,
        fields: [
            { name: "O0BCTN", type: "CHAR", pk: true },
            { name: "O0TRID", type: "CHAR" },
            { name: "O0NPKT", type: "NUM" },
            { name: "O0PROC", type: "CHAR" },
            { name: "O0STAT", type: "CHAR" },
            { name: "O0TBCN", type: "CHAR" },
            { name: "O0PRDT", type: "NUM" },
            { name: "O0PRTM", type: "NUM" },
            { name: "O0TYPE", type: "CHAR" },
            { name: "O0MODE", type: "CHAR" },
            { name: "O0REFN", type: "CHAR" },
            { name: "O0DCR", type: "NUM" },
            { name: "O0TCR", type: "NUM" },
        ]
    },
    O1: {
        label: "O10PUT00", subtitle: "PICKTICKET HEADER", color: "#38BDF8",
        x: 40, y: 280,
        fields: [
            { name: "O1PKTN", type: "CHAR", pk: true },
            { name: "O1PCTL", type: "CHAR", pk: true },
            { name: "O1BCTN", type: "CHAR", fk: true },
            { name: "O1CO", type: "CHAR" },
            { name: "O1DIV", type: "CHAR" },
            { name: "O1ORDN", type: "CHAR" },
            { name: "O1ORDS", type: "CHAR" },
            { name: "O1OTYP", type: "CHAR" },
            { name: "O1SHTO", type: "CHAR" },
            { name: "O1STOR", type: "CHAR" },
            { name: "O1SVIA", type: "CHAR" },
            { name: "O1SHDT", type: "NUM" },
            { name: "O1WGHT", type: "NUM" },
            { name: "O1SQTY", type: "NUM" },
            { name: "O1TCT", type: "NUM" },
            { name: "O1TLIN", type: "NUM" },
            { name: "O1PROC", type: "CHAR" },
            { name: "O1PRDT", type: "NUM" },
            { name: "O1DCR", type: "NUM" },
            { name: "O1TCR", type: "NUM" },
            { name: "... (170 fields)", type: "", misc: true },
        ]
    },
    O2: {
        label: "O20PUT00", subtitle: "PICKTICKET DETAIL", color: "#34D399",
        x: 40, y: 720,
        fields: [
            { name: "O2PCTL", type: "CHAR", pk: true, fk: true },
            { name: "O2PKLN", type: "NUM", pk: true },
            { name: "O2BCTN", type: "CHAR", fk: true },
            { name: "O2CO", type: "CHAR" },
            { name: "O2DIV", type: "CHAR" },
            { name: "O2SEA", type: "CHAR" },
            { name: "O2STYL", type: "CHAR" },
            { name: "O2COLR", type: "CHAR" },
            { name: "O2SZCD", type: "CHAR" },
            { name: "O2BCHN", type: "CHAR" },
            { name: "O2PIQT", type: "NUM" },
            { name: "O2DLQT", type: "NUM" },
            { name: "O2AREA", type: "CHAR" },
            { name: "O2ZONE", type: "CHAR" },
            { name: "O2AISL", type: "CHAR" },
            { name: "O2STOR", type: "CHAR" },
            { name: "O2PROC", type: "CHAR" },
            { name: "O2PRDT", type: "NUM" },
            { name: "O2DCR", type: "NUM" },
            { name: "O2TCR", type: "NUM" },
            { name: "... (90 fields)", type: "", misc: true },
        ]
    },
    O3: {
        label: "O30PUT00", subtitle: "CARTON HEADER", color: "#C084FC",
        x: 730, y: 280,
        fields: [
            { name: "O3CASN", type: "CHAR", pk: true },
            { name: "O3BCTN", type: "CHAR", fk: true },
            { name: "O3PKTN", type: "CHAR", fk: true },
            { name: "O3PCTL", type: "CHAR", fk: true },
            { name: "O3CO", type: "CHAR" },
            { name: "O3DIV", type: "CHAR" },
            { name: "O3ORDN", type: "CHAR" },
            { name: "O3ORDS", type: "CHAR" },
            { name: "O3SHTO", type: "CHAR" },
            { name: "O3STOR", type: "CHAR" },
            { name: "O3TRKN", type: "CHAR" },
            { name: "O3CRTP", type: "CHAR" },
            { name: "O3CRSZ", type: "CHAR" },
            { name: "O3TQTY", type: "NUM" },
            { name: "O3ESWT", type: "NUM" },
            { name: "O3ACWT", type: "NUM" },
            { name: "O3SHDT", type: "NUM" },
            { name: "O3PROC", type: "CHAR" },
            { name: "O3PRDT", type: "NUM" },
            { name: "O3DCR", type: "NUM" },
            { name: "... (80 fields)", type: "", misc: true },
        ]
    },
    O4: {
        label: "O40PUT00", subtitle: "CARTON DETAIL", color: "#FB923C",
        x: 730, y: 720,
        fields: [
            { name: "O4CASN", type: "CHAR", pk: true, fk: true },
            { name: "O4PKLN", type: "NUM", pk: true },
            { name: "O4BCTN", type: "CHAR", fk: true },
            { name: "O4PCTL", type: "CHAR", fk: true },
            { name: "O4CO", type: "CHAR" },
            { name: "O4DIV", type: "CHAR" },
            { name: "O4SEA", type: "CHAR" },
            { name: "O4STYL", type: "CHAR" },
            { name: "O4COLR", type: "CHAR" },
            { name: "O4SZCD", type: "CHAR" },
            { name: "O4BCHN", type: "CHAR" },
            { name: "O4DLQT", type: "NUM" },
            { name: "O4CNQT", type: "NUM" },
            { name: "O4PAKU", type: "NUM" },
            { name: "O4DSTP", type: "CHAR" },
            { name: "O4DSTR", type: "CHAR" },
            { name: "O4PROC", type: "CHAR" },
            { name: "O4PRDT", type: "NUM" },
            { name: "O4DCR", type: "NUM" },
            { name: "O4TCR", type: "NUM" },
            { name: "... (60 fields)", type: "", misc: true },
        ]
    }
};

const relationships = [
    { from: "O0", fromField: "O0BCTN", to: "O1", toField: "O1BCTN", card: "1:N" },
    { from: "O0", fromField: "O0BCTN", to: "O2", toField: "O2BCTN", card: "1:N" },
    { from: "O0", fromField: "O0BCTN", to: "O3", toField: "O3BCTN", card: "1:N" },
    { from: "O0", fromField: "O0BCTN", to: "O4", toField: "O4BCTN", card: "1:N" },
    { from: "O1", fromField: "O1PKTN", to: "O3", toField: "O3PKTN", card: "1:N" },
    { from: "O1", fromField: "O1PCTL", to: "O2", toField: "O2PCTL", card: "1:N" },
    { from: "O3", fromField: "O3CASN", to: "O4", toField: "O4CASN", card: "1:N" },
];

function getTableHeight(tbl) {
    return HEADER_H + tbl.fields.length * ROW_H + 8;
}

function getFieldY(tbl, fieldName) {
    const idx = tbl.fields.findIndex(f => f.name === fieldName);
    if (idx === -1) return tbl.y + HEADER_H + 10;
    return tbl.y + HEADER_H + idx * ROW_H + ROW_H / 2;
}

function getConnectorPath(tables, rel) {
    const from = tables[rel.from];
    const to = tables[rel.to];
    const fy = getFieldY(from, rel.fromField);
    const ty = getFieldY(to, rel.toField);
    const fromCX = from.x + TABLE_W / 2;
    const toCX = to.x + TABLE_W / 2;
    let fxOut, txIn;
    if (toCX >= fromCX) { fxOut = from.x + TABLE_W; txIn = to.x; }
    else { fxOut = from.x; txIn = to.x + TABLE_W; }
    const dx = Math.abs(txIn - fxOut);
    const cx = Math.max(40, dx * 0.4);
    const dirF = fxOut === from.x + TABLE_W ? 1 : -1;
    const dirT = txIn === to.x ? -1 : 1;
    return {
        path: `M${fxOut},${fy} C${fxOut + dirF * cx},${fy} ${txIn + dirT * cx},${ty} ${txIn},${ty}`,
        midX: (fxOut + txIn) / 2,
        midY: (fy + ty) / 2,
    };
}

function getFieldSuffix(name) {
    return name.length > 2 ? name.slice(2) : name;
}

export default function ERD() {
    const [tables, setTables] = useState(initialTables);
    const [activeRel, setActiveRel] = useState(null);
    const [hoveredTable, setHoveredTable] = useState(null);
    const [hoveredField, setHoveredField] = useState(null); // { tableKey, fieldName, suffix }
    const [dragging, setDragging] = useState(null);
    const svgRef = useRef(null);

    const getSVGPoint = useCallback((clientX, clientY) => {
        const svgEl = svgRef.current;
        if (!svgEl) return { x: 0, y: 0 };
        const pt = svgEl.createSVGPoint();
        pt.x = clientX; pt.y = clientY;
        return pt.matrixTransform(svgEl.getScreenCTM().inverse());
    }, []);

    const handleMouseDown = useCallback((e, key) => {
        e.preventDefault();
        e.stopPropagation();
        const { x, y } = getSVGPoint(e.clientX, e.clientY);
        setDragging({ key, offsetX: x - tables[key].x, offsetY: y - tables[key].y });
        setHoveredTable(key);
    }, [tables, getSVGPoint]);

    useEffect(() => {
        if (!dragging) return;
        const onMove = (e) => {
            const { x, y } = getSVGPoint(e.clientX, e.clientY);
            setTables(prev => ({
                ...prev,
                [dragging.key]: {
                    ...prev[dragging.key],
                    x: Math.max(0, x - dragging.offsetX),
                    y: Math.max(0, y - dragging.offsetY),
                }
            }));
        };
        const onUp = () => { setDragging(null); };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, [dragging, getSVGPoint]);

    const maxX = Math.max(...Object.values(tables).map(t => t.x + TABLE_W + 60));
    const maxY = Math.max(...Object.values(tables).map(t => t.y + getTableHeight(t) + 60));
    const svgW = Math.max(1000, maxX);
    const svgH = Math.max(900, maxY);

    return (
        <div style={{
            background: "#0A0B0C",
            minHeight: "100vh",
            fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
            padding: "24px",
            boxSizing: "border-box",
            userSelect: "none",
            WebkitUserSelect: "none",
        }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, borderBottom: "1px solid #1F2937", paddingBottom: 16 }}>
                <div style={{ width: 4, height: 36, background: "linear-gradient(180deg,#F59E0B,#D97706)" }} />
                <div>
                    <div style={{ color: "#F59E0B", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" }}>PUT00 OUTPUT SCHEMA</div>
                    <div style={{ color: "#E5E7EB", fontSize: 20, fontWeight: 700, letterSpacing: "0.05em" }}>ENTITY RELATIONSHIP DIAGRAM</div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 20, fontSize: 10, color: "#6B7280" }}>
                    {[
                        { color: "#F59E0B", label: "SUMMARY" },
                        { color: "#38BDF8", label: "PKT HDR" },
                        { color: "#34D399", label: "PKT DTL" },
                        { color: "#C084FC", label: "CTN HDR" },
                        { color: "#FB923C", label: "CTN DTL" },
                    ].map(leg => (
                        <div key={leg.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <div style={{ width: 9, height: 9, background: leg.color }} />
                            <span style={{ letterSpacing: "0.1em" }}>{leg.label}</span>
                        </div>
                    ))}
                    <div style={{ borderLeft: "1px solid #1F2937", paddingLeft: 16, color: "#374151", fontSize: 9, letterSpacing: "0.1em" }}>
                        ⠿ DRAG TO REPOSITION
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9 }}>
                        <svg width={20} height={10}><line x1={0} y1={5} x2={20} y2={5} stroke="#818CF8" strokeWidth={1.5} strokeDasharray="3 3" /></svg>
                        <span style={{ color: "#818CF8", letterSpacing: "0.08em" }}>IMPLICIT JOIN</span>
                    </div>
                </div>
            </div>

            {/* Canvas */}
            <div style={{ overflow: "auto", border: "1px solid #111318", borderRadius: 4, background: "#0D0E10" }}>
                <svg
                    ref={svgRef}
                    width={svgW}
                    height={svgH}
                    style={{ display: "block", cursor: dragging ? "grabbing" : "default" }}
                >
                    <defs>
                        <marker id="arr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                            <polygon points="0 0,8 3,0 6" fill="#374151" />
                        </marker>
                        <marker id="arr-hot" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                            <polygon points="0 0,8 3,0 6" fill="#F59E0B" />
                        </marker>
                        <marker id="arr-join" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                            <polygon points="0 0,8 3,0 6" fill="#818CF8" />
                        </marker>
                        <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
                            <feGaussianBlur stdDeviation="3.5" result="b" />
                            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>

                    {/* Grid dots */}
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <circle cx="1" cy="1" r="0.8" fill="#1A1D23" />
                    </pattern>
                    <rect width={svgW} height={svgH} fill="url(#grid)" />

                    {/* Cross-table join lines on field hover */}
                    {hoveredField && (() => {
                        const { suffix } = hoveredField;
                        const matches = [];
                        Object.entries(tables).forEach(([tKey, tbl]) => {
                            tbl.fields.forEach(f => {
                                if (!f.misc && getFieldSuffix(f.name) === suffix) {
                                    matches.push({ tKey, tbl, field: f });
                                }
                            });
                        });
                        if (matches.length < 2) return null;
                        const lines = [];
                        for (let a = 0; a < matches.length; a++) {
                            for (let b = a + 1; b < matches.length; b++) {
                                const A = matches[a];
                                const B = matches[b];
                                const ay = getFieldY(A.tbl, A.field.name);
                                const by = getFieldY(B.tbl, B.field.name);
                                const aCX = A.tbl.x + TABLE_W / 2;
                                const bCX = B.tbl.x + TABLE_W / 2;
                                let ax, bx;
                                if (bCX >= aCX) { ax = A.tbl.x + TABLE_W; bx = B.tbl.x; }
                                else { ax = A.tbl.x; bx = B.tbl.x + TABLE_W; }
                                const dx = Math.abs(bx - ax);
                                const cx = Math.max(40, dx * 0.4);
                                const dA = ax === A.tbl.x + TABLE_W ? 1 : -1;
                                const dB = bx === B.tbl.x ? -1 : 1;
                                const path = `M${ax},${ay} C${ax + dA * cx},${ay} ${bx + dB * cx},${by} ${bx},${by}`;
                                const midX = (ax + bx) / 2;
                                const midY = (ay + by) / 2;
                                lines.push({ path, midX, midY, key: `${A.tKey}-${B.tKey}-${suffix}` });
                            }
                        }
                        return lines.map(l => (
                            <g key={l.key}>
                                <path d={l.path} fill="none" stroke="#818CF8" strokeWidth={1.5}
                                    strokeDasharray="3 3" markerEnd="url(#arr-join)"
                                    filter="url(#glow)" opacity={0.8} />
                                <rect x={l.midX - 26} y={l.midY - 10} width={52} height={18} rx={3}
                                    fill="#0A0B0C" stroke="#818CF8" strokeWidth={1} />
                                <text x={l.midX} y={l.midY + 4} textAnchor="middle"
                                    fill="#818CF8" fontSize={8.5} fontFamily="monospace" letterSpacing="0.08em">
                                    JOIN:{suffix}
                                </text>
                            </g>
                        ));
                    })()}

                    {/* Relationships */}
                    {relationships.map((rel, i) => {
                        const { path, midX, midY } = getConnectorPath(tables, rel);
                        const hot = activeRel === i || hoveredTable === rel.from || hoveredTable === rel.to;
                        const dim = !hot && hoveredTable && hoveredTable !== rel.from && hoveredTable !== rel.to;
                        return (
                            <g key={i}
                                onMouseEnter={() => setActiveRel(i)}
                                onMouseLeave={() => setActiveRel(null)}
                            >
                                <path d={path} fill="none" stroke="transparent" strokeWidth={12} style={{ cursor: "crosshair" }} />
                                <path
                                    d={path}
                                    fill="none"
                                    stroke={hot ? "#F59E0B" : dim ? "#111318" : "#252A35"}
                                    strokeWidth={hot ? 2 : 1.5}
                                    strokeDasharray={hot ? "none" : "5 4"}
                                    markerEnd={hot ? "url(#arr-hot)" : "url(#arr)"}
                                    filter={hot ? "url(#glow)" : "none"}
                                    style={{ transition: "stroke 0.12s, stroke-width 0.12s" }}
                                />
                                {hot && (
                                    <g>
                                        <rect x={midX - 22} y={midY - 10} width={44} height={18} rx={3}
                                            fill="#0A0B0C" stroke="#F59E0B" strokeWidth={1} />
                                        <text x={midX} y={midY + 4} textAnchor="middle"
                                            fill="#F59E0B" fontSize={9} fontFamily="monospace" letterSpacing="0.1em">
                                            {rel.card}
                                        </text>
                                    </g>
                                )}
                            </g>
                        );
                    })}

                    {/* Tables */}
                    {Object.entries(tables).map(([key, tbl]) => {
                        const h = getTableHeight(tbl);
                        const isHov = hoveredTable === key;
                        const isDrag = dragging?.key === key;
                        const isRelated = hoveredTable && hoveredTable !== key && relationships.some(
                            r => (r.from === hoveredTable && r.to === key) || (r.to === hoveredTable && r.from === key)
                        );
                        const dim = hoveredTable && !isHov && !isRelated;

                        return (
                            <g key={key}
                                style={{ cursor: isDrag ? "grabbing" : "grab" }}
                                onMouseEnter={() => { if (!dragging) setHoveredTable(key); }}
                                onMouseLeave={() => { if (!dragging) setHoveredTable(null); }}
                                onMouseDown={(e) => handleMouseDown(e, key)}
                                opacity={dim ? 0.25 : 1}
                            >
                                {/* Drag shadow */}
                                {isDrag && (
                                    <rect x={tbl.x + 8} y={tbl.y + 8} width={TABLE_W} height={h}
                                        rx={4} fill="#000000" opacity={0.6} />
                                )}

                                {/* Hover glow ring */}
                                {(isHov || isRelated) && (
                                    <rect x={tbl.x - 3} y={tbl.y - 3} width={TABLE_W + 6} height={h + 6}
                                        rx={6} fill="none"
                                        stroke={tbl.color} strokeWidth={isRelated ? 1 : 2}
                                        opacity={isRelated ? 0.25 : 0.4}
                                        filter="url(#glow)" />
                                )}

                                {/* Card body */}
                                <rect x={tbl.x} y={tbl.y} width={TABLE_W} height={h}
                                    rx={3} fill="#111318"
                                    stroke={isHov || isDrag ? tbl.color : "#222530"}
                                    strokeWidth={isHov || isDrag ? 1.5 : 1}
                                />

                                {/* Header fill */}
                                <rect x={tbl.x} y={tbl.y} width={TABLE_W} height={HEADER_H}
                                    rx={3} fill={tbl.color + "15"} />
                                <line x1={tbl.x} y1={tbl.y + HEADER_H} x2={tbl.x + TABLE_W} y2={tbl.y + HEADER_H}
                                    stroke={tbl.color + "35"} strokeWidth={1} />

                                {/* Left accent bar */}
                                <rect x={tbl.x} y={tbl.y} width={3} height={h} rx={0} fill={tbl.color} opacity={0.9} />

                                {/* Drag handle dots in header */}
                                <text x={tbl.x + TABLE_W - 14} y={tbl.y + 22}
                                    fill={tbl.color + "60"} fontSize={12} fontFamily="monospace">⠿</text>

                                {/* Table title */}
                                <text x={tbl.x + 14} y={tbl.y + 22}
                                    fill={tbl.color} fontSize={13} fontWeight={700}
                                    fontFamily="monospace" letterSpacing="0.1em">
                                    {tbl.label}
                                </text>
                                <text x={tbl.x + 14} y={tbl.y + 40}
                                    fill={tbl.color + "88"} fontSize={8.5}
                                    fontFamily="monospace" letterSpacing="0.18em">
                                    ▸ {tbl.subtitle}
                                </text>

                                {/* Field rows */}
                                {tbl.fields.map((field, fi) => {
                                    const fy = tbl.y + HEADER_H + fi * ROW_H;
                                    const isJoinHighlight = hoveredField && !field.misc &&
                                        getFieldSuffix(field.name) === hoveredField.suffix &&
                                        !(hoveredField.tableKey === key && hoveredField.fieldName === field.name);
                                    const isActiveField = hoveredField?.tableKey === key && hoveredField?.fieldName === field.name;
                                    return (
                                        <g key={field.name}
                                            onMouseEnter={() => !field.misc && setHoveredField({ tableKey: key, fieldName: field.name, suffix: getFieldSuffix(field.name) })}
                                            onMouseLeave={() => setHoveredField(null)}
                                            style={{ cursor: field.misc ? "default" : "crosshair" }}
                                        >
                                            {fi % 2 === 1 && !isJoinHighlight && !isActiveField && (
                                                <rect x={tbl.x + 3} y={fy} width={TABLE_W - 3} height={ROW_H} fill="#FFFFFF03" />
                                            )}
                                            {(isJoinHighlight || isActiveField) && (
                                                <rect x={tbl.x + 3} y={fy} width={TABLE_W - 3} height={ROW_H}
                                                    fill={isActiveField ? "#818CF820" : "#818CF812"}
                                                    stroke={isActiveField ? "#818CF880" : "#818CF840"}
                                                    strokeWidth={isActiveField ? 1 : 0.5} />
                                            )}
                                            {field.misc ? (
                                                <text x={tbl.x + 14} y={fy + 14}
                                                    fill="#2A2F3A" fontSize={9} fontFamily="monospace" fontStyle="italic">
                                                    {field.name}
                                                </text>
                                            ) : (
                                                <>
                                                    {field.pk && (
                                                        <text x={tbl.x + 7} y={fy + 14} fill="#F59E0B" fontSize={10}>⬡</text>
                                                    )}
                                                    {field.fk && !field.pk && (
                                                        <text x={tbl.x + 8} y={fy + 13}
                                                            fill="#4B5563" fontSize={8} fontFamily="monospace">FK</text>
                                                    )}
                                                    <text
                                                        x={tbl.x + (field.pk || field.fk ? 24 : 12)}
                                                        y={fy + 14}
                                                        fill={isActiveField || isJoinHighlight ? "#818CF8" : field.pk ? "#E5E7EB" : field.fk ? "#9CA3AF" : "#6B7280"}
                                                        fontSize={10} fontFamily="monospace" letterSpacing="0.03em"
                                                        fontWeight={field.pk || isActiveField || isJoinHighlight ? 700 : 400}
                                                    >
                                                        {field.name}
                                                    </text>
                                                    <text x={tbl.x + TABLE_W - 8} y={fy + 14} textAnchor="end"
                                                        fill={field.type === "NUM" ? "#34D39868" : "#38BDF858"}
                                                        fontSize={8} fontFamily="monospace">
                                                        {field.type}
                                                    </text>
                                                </>
                                            )}
                                        </g>
                                    );
                                })}
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 16, display: "flex", gap: 24, borderTop: "1px solid #1F2937", paddingTop: 14, alignItems: "flex-end" }}>
                {[
                    { label: "TABLES", value: "5" },
                    { label: "TOTAL FIELDS", value: "500+" },
                    { label: "RELATIONSHIPS", value: "7" },
                    { label: "FK LINKS", value: "10" },
                ].map(s => (
                    <div key={s.label}>
                        <div style={{ color: "#4B5563", fontSize: 9, letterSpacing: "0.2em" }}>{s.label}</div>
                        <div style={{ color: "#F59E0B", fontSize: 18, fontWeight: 700, letterSpacing: "0.1em" }}>{s.value}</div>
                    </div>
                ))}
                <div style={{ marginLeft: "auto", color: "#1F2937", fontSize: 9, letterSpacing: "0.12em", paddingBottom: 2 }}>
                    HOVER TABLES/CONNECTORS TO HIGHLIGHT RELATIONSHIPS  ·  HOVER FIELDS TO SEE JOIN MATCHES  ·  DRAG TABLES TO REPOSITION
                </div>
            </div>
        </div>
    );
}