// src/components/Checkins/PhotoEditorModal.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    Image as ReactNativeImage, Dimensions, ActivityIndicator,
    Platform, Alert, ScrollView, TextInput, FlatList
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Line, Polygon, Circle as SvgCircle, Rect, Text as SvgText } from 'react-native-svg';

let RNViewShot = null;
if (Platform.OS !== 'web') {
    RNViewShot = require('react-native-view-shot').default;
}

const IS_WEB = Platform.OS === 'web';
// No PWA mobile (iOS Safari / Android Chrome instalado), <img crossOrigin> não funciona.
// Detectamos pelo userAgent e usamos ReactNativeImage nesses casos.
const IS_MOBILE_PWA = IS_WEB && typeof navigator !== 'undefined' && (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
);

// ─── Constantes ───────────────────────────────────────────────────────────────
const COLOR_OPTIONS = [
    { id: 'green',  hex: '#4DE38F', label: 'Verde'   },
    { id: 'red',    hex: '#FF3B30', label: 'Vermelho' },
    { id: 'yellow', hex: '#FFD60A', label: 'Amarelo'  },
    { id: 'white',  hex: '#FFFFFF', label: 'Branco'   },
    { id: 'cyan',   hex: '#00CFFF', label: 'Azul'     },
    { id: 'orange', hex: '#FF9500', label: 'Laranja'  },
];

const SIZE_OPTIONS = [
    { id: 'sm', stroke: 3,  head: 14, label: 'P'  },
    { id: 'md', stroke: 5,  head: 20, label: 'M'  },
    { id: 'lg', stroke: 8,  head: 28, label: 'G'  },
    { id: 'xl', stroke: 12, head: 38, label: 'XG' },
];

const TOOL_OPTIONS = [
    { id: 'select', icon: 'cursor-default',      label: 'Selecionar' },
    { id: 'arrow',  icon: 'arrow-top-right',     label: 'Seta'       },
    { id: 'circle', icon: 'circle-outline',      label: 'Círculo'    },
    { id: 'line',   icon: 'minus',               label: 'Linha'      },
    { id: 'rect',   icon: 'crop-square',         label: 'Retângulo'  },
    { id: 'text',   icon: 'format-text',         label: 'Texto'      },
];

// ─── Utilitários de cálculo ───────────────────────────────────────────────────
function calcArrowHead(x1, y1, x2, y2, headLen) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const off   = Math.PI / 6;
    // Recua o fim da linha para dentro da ponta — corrige o "gap"
    const lineEndX = x2 - (headLen * 0.55) * Math.cos(angle);
    const lineEndY = y2 - (headLen * 0.55) * Math.sin(angle);
    return {
        lineEndX, lineEndY,
        ax: x2 - headLen * Math.cos(angle - off),
        ay: y2 - headLen * Math.sin(angle - off),
        bx: x2 - headLen * Math.cos(angle + off),
        by: y2 - headLen * Math.sin(angle + off),
    };
}

// ─── Desenho no canvas 2D (ao salvar) ────────────────────────────────────────
function drawMarkOnCanvas(ctx, mark, scaleX, scaleY, scale) {
    const alpha = mark.opacity ?? 1;
    ctx.globalAlpha = alpha;
    ctx.shadowColor   = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur    = (mark.stroke ?? 4) * scale * 1.2;

    const sx = (v) => v * scaleX;
    const sy = (v) => v * scaleY;
    const ss = (v) => v * scale;

    if (mark.type === 'arrow') {
        const { lineEndX, lineEndY, ax, ay, bx, by } = calcArrowHead(
            sx(mark.startX), sy(mark.startY),
            sx(mark.endX),   sy(mark.endY),
            ss(mark.head)
        );
        ctx.beginPath();
        ctx.moveTo(sx(mark.startX), sy(mark.startY));
        ctx.lineTo(lineEndX, lineEndY);
        ctx.strokeStyle = mark.color;
        ctx.lineWidth   = ss(mark.stroke);
        ctx.lineCap     = 'round';
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx(mark.endX), sy(mark.endY));
        ctx.lineTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.closePath();
        ctx.fillStyle = mark.color;
        ctx.shadowColor = 'transparent';
        ctx.fill();
    } else if (mark.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(sx(mark.startX), sy(mark.startY));
        ctx.lineTo(sx(mark.endX),   sy(mark.endY));
        ctx.strokeStyle = mark.color;
        ctx.lineWidth   = ss(mark.stroke);
        ctx.lineCap     = 'round';
        ctx.stroke();
    } else if (mark.type === 'circle') {
        const cx = sx((mark.startX + mark.endX) / 2);
        const cy = sy((mark.startY + mark.endY) / 2);
        const rx = Math.abs(sx(mark.endX) - sx(mark.startX)) / 2;
        const ry = Math.abs(sy(mark.endY) - sy(mark.startY)) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.strokeStyle = mark.color;
        ctx.lineWidth   = ss(mark.stroke);
        ctx.stroke();
    } else if (mark.type === 'rect') {
        const x = sx(Math.min(mark.startX, mark.endX));
        const y = sy(Math.min(mark.startY, mark.endY));
        const w = Math.abs(sx(mark.endX) - sx(mark.startX));
        const h = Math.abs(sy(mark.endY) - sy(mark.startY));
        ctx.strokeStyle = mark.color;
        ctx.lineWidth   = ss(mark.stroke);
        ctx.strokeRect(x, y, w, h);
    } else if (mark.type === 'text') {
        ctx.shadowColor = 'transparent';
        const fontSize = ss(mark.fontSize ?? 20);
        ctx.font        = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle   = mark.color;
        // Sombra de texto para legibilidade
        ctx.shadowColor   = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur    = fontSize * 0.4;
        ctx.fillText(mark.text ?? '', sx(mark.x), sy(mark.y));
    }

    ctx.globalAlpha   = 1;
    ctx.shadowColor   = 'transparent';
    ctx.shadowBlur    = 0;
}

// ─── Componente SVG de preview de uma marcação ───────────────────────────────
function MarkShape({ mark, isSelected }) {
    const alpha = mark.opacity ?? 1;
    const s = mark.stroke ?? 4;
    const color = mark.color ?? '#4DE38F';
    // Selection highlight: draw a thicker semi-transparent blue outline behind
    const selColor = '#0A84FF';
    const selWidth = s + 8;

    if (mark.type === 'arrow') {
        const { lineEndX, lineEndY, ax, ay, bx, by } = calcArrowHead(
            mark.startX, mark.startY, mark.endX, mark.endY, mark.head ?? 20
        );
        if ([mark.startX, mark.startY, mark.endX, mark.endY].some(isNaN)) return null;
        return (
            <React.Fragment>
                {isSelected && <Line x1={mark.startX} y1={mark.startY} x2={lineEndX} y2={lineEndY} stroke={selColor} strokeWidth={selWidth} strokeLinecap="round" opacity={0.4} />}
                <Line x1={mark.startX} y1={mark.startY} x2={lineEndX} y2={lineEndY} stroke={color} strokeWidth={s} strokeLinecap="round" opacity={alpha} />
                <Polygon points={`${mark.endX},${mark.endY} ${ax},${ay} ${bx},${by}`} fill={color} opacity={alpha} />
            </React.Fragment>
        );
    }
    if (mark.type === 'line') {
        return (
            <React.Fragment>
                {isSelected && <Line x1={mark.startX} y1={mark.startY} x2={mark.endX} y2={mark.endY} stroke={selColor} strokeWidth={selWidth} strokeLinecap="round" opacity={0.4} />}
                <Line x1={mark.startX} y1={mark.startY} x2={mark.endX} y2={mark.endY} stroke={color} strokeWidth={s} strokeLinecap="round" opacity={alpha} />
            </React.Fragment>
        );
    }
    if (mark.type === 'circle') {
        const cx = (mark.startX + mark.endX) / 2;
        const cy = (mark.startY + mark.endY) / 2;
        const r  = Math.max(Math.abs(mark.endX - mark.startX), Math.abs(mark.endY - mark.startY)) / 2;
        return (
            <React.Fragment>
                {isSelected && <SvgCircle cx={cx} cy={cy} r={r} stroke={selColor} strokeWidth={selWidth} fill="none" opacity={0.4} />}
                <SvgCircle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={s} fill="none" opacity={alpha} />
            </React.Fragment>
        );
    }
    if (mark.type === 'rect') {
        const rx = Math.min(mark.startX, mark.endX);
        const ry = Math.min(mark.startY, mark.endY);
        const w  = Math.abs(mark.endX - mark.startX);
        const h  = Math.abs(mark.endY - mark.startY);
        return (
            <React.Fragment>
                {isSelected && <Rect x={rx - 4} y={ry - 4} width={w + 8} height={h + 8} stroke={selColor} strokeWidth={2} fill="none" opacity={0.5} rx={4} />}
                <Rect x={rx} y={ry} width={w} height={h} stroke={color} strokeWidth={s} fill="none" opacity={alpha} />
            </React.Fragment>
        );
    }
    if (mark.type === 'text') {
        return (
            <React.Fragment>
                {isSelected && (
                    <Rect
                        x={(mark.x ?? 0) - 4}
                        y={(mark.y ?? 0) - (mark.fontSize ?? 20) - 4}
                        width={((mark.text?.length ?? 4) * (mark.fontSize ?? 20) * 0.6) + 8}
                        height={(mark.fontSize ?? 20) + 8}
                        stroke={selColor} strokeWidth={2} fill={selColor} fillOpacity={0.15} rx={4}
                    />
                )}
                <SvgText x={mark.x} y={mark.y} fill={color} fontSize={mark.fontSize ?? 20} fontWeight="bold" opacity={alpha}>
                    {mark.text ?? ''}
                </SvgText>
            </React.Fragment>
        );
    }
    return null;
}

// ─── Hook: gerencia marcações de um lado do editor ───────────────────────────
function useDrawingState() {
    const [marks, setMarks]           = useState([]);
    const [currentMark, setCurrentMark] = useState(null);
    const marksRef = useRef([]);
    useEffect(() => { marksRef.current = marks; }, [marks]);
    return { marks, setMarks, currentMark, setCurrentMark, marksRef };
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function PhotoEditorModal({
    visible,
    photoUri,
    onClose,
    onSave,
    theme,
    // Para modo comparação:
    checkins = [],
    selectedCheckinId = null,
    selectedPhotoField = null,
}) {
    // ── Modo ──────────────────────────────────────────────────────────────────
    const [editorMode, setEditorMode]   = useState('single'); // 'single' | 'compare'
    const [isDrawingMode, setIsDrawingMode] = useState(true);

    // ── Ferramentas ───────────────────────────────────────────────────────────
    const [activeTool,  setActiveTool]  = useState('arrow');
    const [activeColor, setActiveColor] = useState(COLOR_OPTIONS[0]);
    const [activeSize,  setActiveSize]  = useState(SIZE_OPTIONS[1]);
    const [opacity,     setOpacity]     = useState(1);
    const [showMarks,   setShowMarks]   = useState(true);

    // ── Seleção e move ────────────────────────────────────────────────────────
    const [selectedMarkId, setSelectedMarkId] = useState(null); // id da marca selecionada
    const [selectedMarkSide, setSelectedMarkSide] = useState(null); // 'left'|'right'
    const dragRef = useRef(null); // { mark, offsetX, offsetY, side }

    // ── Estado de texto ───────────────────────────────────────────────────────
    const [textInputVisible, setTextInputVisible] = useState(false);
    const [pendingTextPos,   setPendingTextPos]   = useState(null);
    const [textInputValue,   setTextInputValue]   = useState('');

    // ── Marcações: lado direito (foto atual) e esquerdo (foto antiga) ─────────
    const right = useDrawingState();
    const left  = useDrawingState();

    // ── Lado ativo no modo comparação ─────────────────────────────────────────
    const [activeSide, setActiveSide] = useState('right'); // 'left' | 'right'

    // ativo = right sempre no modo single
    const active = editorMode === 'single' ? right : (activeSide === 'right' ? right : left);

    // ── Comparação: seleção do check-in antigo ────────────────────────────────
    const [compareCheckinId,  setCompareCheckinId]  = useState(null);
    const [comparePhotoUri,   setComparePhotoUri]   = useState(null);
    const [showCheckinPicker, setShowCheckinPicker] = useState(false);

    // Lista de check-ins anteriores disponíveis (exclui o atual)
    const olderCheckins = checkins.filter(c => c.id !== selectedCheckinId);

    // Quando o usuário seleciona um check-in antigo, atualiza a URI do lado esquerdo
    // Campo da foto antiga (por padrão igual ao campo atual, mas pode ser trocado)
    const [compareField, setCompareField] = useState(null);

    // Quando o selectedPhotoField prop chega, inicializa compareField
    useEffect(() => {
        if (selectedPhotoField) setCompareField(selectedPhotoField);
    }, [selectedPhotoField]);

    const selectCompareCheckin = (checkin) => {
        setCompareCheckinId(checkin.id);
        // Usa compareField (que pode ter sido trocado pelo coach) ou o campo atual
        const field = compareField || selectedPhotoField || 'photoFront';
        const uri = checkin[field] || null;
        setComparePhotoUri(uri);
        setShowCheckinPicker(false);
        left.setMarks([]);
    };

    // Quando o coach troca o campo da foto antiga, atualiza a URI se já houver check-in selecionado
    const handleCompareFieldChange = (field) => {
        setCompareField(field);
        if (compareCheckinId) {
            const checkin = olderCheckins.find(c => c.id === compareCheckinId);
            if (checkin) {
                setComparePhotoUri(checkin[field] || null);
                left.setMarks([]);
            }
        }
    };

    // ── Outros estados ─────────────────────────────────────────────────────────
    const [isSaving,  setIsSaving]  = useState(false);
    const [zoom,      setZoom]      = useState(1);
    const zoomRef = useRef(1);
    useEffect(() => { zoomRef.current = zoom; }, [zoom]);

    // ── Refs ──────────────────────────────────────────────────────────────────
    const isDrawingRef    = useRef(true);
    const drawingRef      = useRef(false);
    const interactionRef  = useRef(null);  // lado direito (e único no single)
    const leftInterRef    = useRef(null);  // lado esquerdo (comparação)
    const captureRef      = useRef(null);

    // Refs de ferramentas (evitam stale closures nos callbacks DOM)
    const activeToolRef   = useRef(activeTool);
    const activeColorRef  = useRef(activeColor);
    const activeSizeRef   = useRef(activeSize);
    const opacityRef      = useRef(opacity);
    const activeSideRef   = useRef(activeSide);
    const editorModeRef   = useRef(editorMode);

    useEffect(() => { activeToolRef.current  = activeTool;   }, [activeTool]);
    // Clear selection when switching away from select tool
    useEffect(() => { if (activeTool !== 'select') { setSelectedMarkId(null); setSelectedMarkSide(null); dragRef.current = null; } }, [activeTool]);
    useEffect(() => { activeColorRef.current = activeColor;  }, [activeColor]);
    useEffect(() => { activeSizeRef.current  = activeSize;   }, [activeSize]);
    useEffect(() => { opacityRef.current     = opacity;      }, [opacity]);
    useEffect(() => { activeSideRef.current  = activeSide;   }, [activeSide]);
    useEffect(() => { editorModeRef.current  = editorMode;   }, [editorMode]);
    useEffect(() => { isDrawingRef.current   = isDrawingMode; }, [isDrawingMode]);

    // ── Dimensões ─────────────────────────────────────────────────────────────
    const { width: winW } = Dimensions.get('window');
    // No modo comparação, cada lado ocupa metade menos uma margem
    const singleBaseW = IS_WEB ? Math.min(winW * 0.9, 600) : winW * 0.9;
    const compareBaseW = IS_WEB ? Math.min(winW * 0.45, 295) : (winW - 30) / 2;
    const baseW   = editorMode === 'single' ? singleBaseW : compareBaseW;
    const baseH   = baseW * (16 / 9);
    const scaledW = baseW * zoom;
    const scaledH = baseH * zoom;

    // ── Helpers de coordenadas web ────────────────────────────────────────────
    const getWebCoords = useCallback((e, ref) => {
        const rect = ref.current?.getBoundingClientRect?.();
        if (!rect) return { x: 0, y: 0 };
        const src = e.touches ? e.touches[0] : e;
        return { x: src.clientX - rect.left, y: src.clientY - rect.top };
    }, []);

    // ── Hit-test: verifica se (x,y) toca numa marcação ─────────────────────
    const hitTestMark = useCallback((x, y, marks) => {
        // Percorre em ordem reversa (última desenhada = topo)
        for (let i = marks.length - 1; i >= 0; i--) {
            const m = marks[i];
            const PAD = Math.max(14, (m.stroke ?? 4) * 2);
            if (m.type === 'text') {
                const fw = (m.text?.length ?? 4) * (m.fontSize ?? 20) * 0.6;
                const fh = (m.fontSize ?? 20) * 1.4;
                if (x >= m.x - PAD && x <= m.x + fw + PAD && y >= m.y - fh - PAD && y <= m.y + PAD)
                    return m;
            } else if (m.type === 'circle') {
                const cx = (m.startX + m.endX) / 2;
                const cy = (m.startY + m.endY) / 2;
                const r  = Math.max(Math.abs(m.endX - m.startX), Math.abs(m.endY - m.startY)) / 2;
                const dist = Math.hypot(x - cx, y - cy);
                if (dist <= r + PAD && dist >= r - PAD) return m;
            } else if (m.type === 'rect') {
                const rx = Math.min(m.startX, m.endX) - PAD;
                const ry = Math.min(m.startY, m.endY) - PAD;
                const rw = Math.abs(m.endX - m.startX) + PAD * 2;
                const rh = Math.abs(m.endY - m.startY) + PAD * 2;
                // Hit border only (not fill)
                if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) return m;
            } else {
                // arrow and line: distance from segment
                const dx = m.endX - m.startX, dy = m.endY - m.startY;
                const len = Math.hypot(dx, dy);
                if (len < 1) continue;
                const t = Math.max(0, Math.min(1, ((x - m.startX) * dx + (y - m.startY) * dy) / (len * len)));
                const nearX = m.startX + t * dx, nearY = m.startY + t * dy;
                if (Math.hypot(x - nearX, y - nearY) <= PAD) return m;
            }
        }
        return null;
    }, []);

    // ── Lógica de início / movimento / fim de marcação ─────────────────────
    const handleDrawStart = useCallback((x, y, side) => {
        if (!isDrawingRef.current) return;
        const tool    = activeToolRef.current;
        const color   = activeColorRef.current.hex;
        const sz      = activeSizeRef.current;
        const op      = opacityRef.current;
        const z  = zoomRef.current;
        const nx = x / z;
        const ny = y / z;

        const target = (editorModeRef.current === 'single' || side === 'right') ? right : left;

        // ── Modo Seleção ────────────────────────────────────────────────────
        if (tool === 'select') {
            const hit = hitTestMark(nx, ny, target.marksRef.current);
            if (hit) {
                setSelectedMarkId(hit.id);
                setSelectedMarkSide(side);
                // Calcula offset entre o toque e a âncora da marcação
                const anchorX = hit.type === 'text' ? hit.x : hit.startX;
                const anchorY = hit.type === 'text' ? hit.y : hit.startY;
                dragRef.current = { id: hit.id, side, offsetX: nx - anchorX, offsetY: ny - anchorY };
            } else {
                setSelectedMarkId(null);
                setSelectedMarkSide(null);
                dragRef.current = null;
            }
            return;
        }

        // ── Modo Texto ──────────────────────────────────────────────────────
        if (tool === 'text') {
            setPendingTextPos({ x: nx, y: ny, side });
            setTextInputValue('');
            setTextInputVisible(true);
            return;
        }

        drawingRef.current = true;
        target.setCurrentMark({
            id: Date.now().toString(),
            type: tool, color, opacity: op,
            stroke: sz.stroke, head: sz.head,
            startX: nx, startY: ny, endX: nx, endY: ny,
        });
    }, [right, left, hitTestMark]);

    const handleDrawMove = useCallback((x, y, side) => {
        const z  = zoomRef.current;
        const nx = x / z;
        const ny = y / z;

        // ── Arrastar marcação selecionada ──────────────────────────────────
        if (activeToolRef.current === 'select' && dragRef.current) {
            const { id, side: dSide, offsetX, offsetY } = dragRef.current;
            const target = (editorModeRef.current === 'single' || dSide === 'right') ? right : left;
            target.setMarks(prev => prev.map(m => {
                if (m.id !== id) return m;
                const newAnchorX = nx - offsetX;
                const newAnchorY = ny - offsetY;
                if (m.type === 'text') {
                    return { ...m, x: newAnchorX, y: newAnchorY, startX: newAnchorX, startY: newAnchorY, endX: newAnchorX, endY: newAnchorY };
                }
                const dx = m.endX - m.startX;
                const dy = m.endY - m.startY;
                return { ...m, startX: newAnchorX, startY: newAnchorY, endX: newAnchorX + dx, endY: newAnchorY + dy };
            }));
            return;
        }

        if (!drawingRef.current) return;
        const target = (editorModeRef.current === 'single' || side === 'right') ? right : left;
        target.setCurrentMark(prev => prev ? { ...prev, endX: nx, endY: ny } : null);
    }, [right, left]);

    const handleDrawEnd = useCallback((x, y, side) => {
        // Select mode: just stop dragging
        if (activeToolRef.current === 'select') {
            dragRef.current = null;
            return;
        }
        if (!drawingRef.current) return;
        drawingRef.current = false;
        const z  = zoomRef.current;
        const nx = x / z;
        const ny = y / z;
        const target = (editorModeRef.current === 'single' || side === 'right') ? right : left;
        target.setCurrentMark(prev => {
            if (!prev) return null;
            if (Math.abs(nx - prev.startX) > 2 || Math.abs(ny - prev.startY) > 2) {
                target.setMarks(old => [...old, { ...prev, endX: nx, endY: ny }]);
            }
            return null;
        });
    }, [right, left]);

    // ── Confirmar texto ───────────────────────────────────────────────────────
    const confirmText = () => {
        if (!textInputValue.trim() || !pendingTextPos) { setTextInputVisible(false); return; }
        const { x, y, side, editId } = pendingTextPos;
        const target = (editorModeRef.current === 'single' || side === 'right') ? right : left;

        if (editId) {
            // Editando texto existente
            target.setMarks(prev => prev.map(m => m.id === editId ? { ...m, text: textInputValue.trim() } : m));
        } else {
            // Novo texto
            const mark = {
                id: Date.now().toString(),
                type: 'text',
                color: activeColorRef.current.hex,
                opacity: opacityRef.current,
                fontSize: activeSizeRef.current.stroke * 4,
                text: textInputValue.trim(),
                x, y,
                startX: x, startY: y, endX: x, endY: y,
            };
            target.setMarks(prev => [...prev, mark]);
        }
        setTextInputVisible(false);
        setPendingTextPos(null);
        setTextInputValue('');
    };

    // ── Registrar listeners DOM (web) ─────────────────────────────────────────
    const registerListeners = useCallback((el, side) => {
        if (!el) return () => {};

        const onDown = (e) => {
            if (!isDrawingRef.current) return;
            e.preventDefault();
            const { x, y } = getWebCoords(e, side === 'right' ? interactionRef : leftInterRef);
            handleDrawStart(x, y, side);
        };
        const onMove = (e) => {
            if (!drawingRef.current) return;
            e.preventDefault();
            const { x, y } = getWebCoords(e, side === 'right' ? interactionRef : leftInterRef);
            handleDrawMove(x, y, side);
        };
        const onUp = (e) => {
            if (!drawingRef.current) return;
            e.preventDefault();
            const { x, y } = getWebCoords(e, side === 'right' ? interactionRef : leftInterRef);
            handleDrawEnd(x, y, side);
        };
        const onTEnd = (e) => {
            if (!drawingRef.current) return;
            const t    = e.changedTouches?.[0];
            const ref  = side === 'right' ? interactionRef : leftInterRef;
            const rect = ref.current?.getBoundingClientRect?.();
            if (t && rect) handleDrawEnd(t.clientX - rect.left, t.clientY - rect.top, side);
        };

        el.addEventListener('mousedown',  onDown,  { passive: false });
        el.addEventListener('mousemove',  onMove,  { passive: false });
        el.addEventListener('mouseup',    onUp,    { passive: false });
        el.addEventListener('touchstart', onDown,  { passive: false });
        el.addEventListener('touchmove',  onMove,  { passive: false });
        el.addEventListener('touchend',   onTEnd,  { passive: false });

        return () => {
            el.removeEventListener('mousedown',  onDown);
            el.removeEventListener('mousemove',  onMove);
            el.removeEventListener('mouseup',    onUp);
            el.removeEventListener('touchstart', onDown);
            el.removeEventListener('touchmove',  onMove);
            el.removeEventListener('touchend',   onTEnd);
        };
    }, [getWebCoords, handleDrawStart, handleDrawMove, handleDrawEnd]);

    useEffect(() => {
        if (!IS_WEB || !visible) return;
        const cleanRight = registerListeners(interactionRef.current, 'right');
        const cleanLeft  = editorMode === 'compare'
            ? registerListeners(leftInterRef.current, 'left')
            : () => {};
        return () => { cleanRight(); cleanLeft(); };
    }, [visible, editorMode, registerListeners]);

    // ── Handlers mobile ───────────────────────────────────────────────────────
    const makeMobileHandlers = (side) => IS_WEB ? {} : {
        onStartShouldSetResponder: () => isDrawingRef.current,
        onMoveShouldSetResponder:  () => isDrawingRef.current,
        onResponderGrant:    (e) => { const { locationX: x, locationY: y } = e.nativeEvent; handleDrawStart(x, y, side); },
        onResponderMove:     (e) => { const { locationX: x, locationY: y } = e.nativeEvent; handleDrawMove(x, y, side);  },
        onResponderRelease:  (e) => { const { locationX: x, locationY: y } = e.nativeEvent; handleDrawEnd(x, y, side);   },
        onResponderTerminate: () => { drawingRef.current = false; right.setCurrentMark(null); left.setCurrentMark(null); },
    };

    // ── Toolbar ───────────────────────────────────────────────────────────────
    const handleUndo = () => active.setMarks(prev => prev.slice(0, -1));
    const handleClear = () => { right.setMarks([]); left.setMarks([]); };
    const hasMarks = right.marks.length > 0 || left.marks.length > 0;

    // ── Carregar imagem via fetch+blob (CORS) ─────────────────────────────────
    const loadImageFromUrl = async (url) => {
        const res  = await fetch(url, { mode: 'cors' });
        const blob = await res.blob();
        const bUrl = URL.createObjectURL(blob);
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            img.onload  = () => { URL.revokeObjectURL(bUrl); resolve(img); };
            img.onerror = reject;
            img.src = bUrl;
        });
    };

    // ── Salvar ────────────────────────────────────────────────────────────────
    const handleSaveImage = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            if (IS_WEB && !IS_MOBILE_PWA) {
                if (editorMode === 'single') {
                    // ── Modo individual: salva só a foto atual com setas ──────
                    const img    = await loadImageFromUrl(photoUri);
                    const canvas = document.createElement('canvas');
                    canvas.width  = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx   = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    const scaleX = img.naturalWidth  / scaledW;
                    const scaleY = img.naturalHeight / scaledH;
                    const scale  = Math.max(scaleX, scaleY);

                    right.marksRef.current.forEach(m => drawMarkOnCanvas(ctx, m, scaleX, scaleY, scale));

                    const uri = canvas.toDataURL('image/jpeg', 0.92);
                    onSave({ mode: 'single', uri });

                } else {
                    // ── Modo comparação: gera imagem composta lado a lado ─────
                    const [imgR, imgL] = await Promise.all([
                        loadImageFromUrl(photoUri),
                        comparePhotoUri ? loadImageFromUrl(comparePhotoUri) : Promise.resolve(null),
                    ]);

                    // Dimensões: cada lado usa a maior altura das duas imagens
                    const targetH = Math.max(imgR.naturalHeight, imgL?.naturalHeight ?? 0, 800);
                    const rW = imgL ? Math.round((imgR.naturalWidth / imgR.naturalHeight) * targetH) : imgR.naturalWidth;
                    const lW = imgL ? Math.round((imgL.naturalWidth / imgL.naturalHeight) * targetH) : 0;
                    const GAP = 8;

                    const canvas = document.createElement('canvas');
                    canvas.width  = lW + GAP + rW;
                    canvas.height = targetH;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#111';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Lado esquerdo (ANTES)
                    if (imgL) {
                        ctx.drawImage(imgL, 0, 0, lW, targetH);
                        // Labels "ANTES" e "DEPOIS"
                        drawLabel(ctx, 'ANTES', 0, lW, targetH, '#555');
                        // Marcações do lado esquerdo
                        const lScaleX = lW / scaledW;
                        const lScaleY = targetH / scaledH;
                        left.marksRef.current.forEach(m => drawMarkOnCanvas(ctx, m, lScaleX, lScaleY, Math.max(lScaleX, lScaleY)));
                    }

                    // Lado direito (DEPOIS)
                    const rOffX = lW + GAP;
                    ctx.drawImage(imgR, rOffX, 0, rW, targetH);
                    drawLabel(ctx, 'DEPOIS', rOffX, rW, targetH, '#4DE38F');
                    const rScaleX = rW / scaledW;
                    const rScaleY = targetH / scaledH;

                    // Precisa transladar o canvas para desenhar as setas do lado direito na posição correta
                    ctx.save();
                    ctx.translate(rOffX, 0);
                    right.marksRef.current.forEach(m => drawMarkOnCanvas(ctx, m, rScaleX, rScaleY, Math.max(rScaleX, rScaleY)));
                    ctx.restore();

                    const uri = canvas.toDataURL('image/jpeg', 0.92);
                    onSave({
                        mode: 'compare',
                        uri,
                        compareCheckinId,
                        photoField: selectedPhotoField,
                    });
                }

                handleClear();
                onClose();

            } else {
                // Mobile nativo e Mobile PWA: ViewShot captura a view renderizada
                // (funciona perfeitamente porque ReactNativeImage não tem restrição CORS)
                if (!RNViewShot || !captureRef.current?.capture) {
                    throw new Error('ViewShot não disponível. Tente no desktop para salvar comparações.');
                }
                const uri = await captureRef.current.capture();
                onSave({ mode: 'single', uri });
                handleClear();
                onClose();
            }
        } catch (err) {
            console.error('Erro ao salvar:', err);
            if (IS_WEB) window.alert(`Erro ao salvar: ${err.message}`);
            else Alert.alert('Erro', 'Não foi possível salvar.');
        } finally {
            setIsSaving(false);
        }
    };

    // Label "ANTES" / "DEPOIS" na imagem composta
    function drawLabel(ctx, text, offsetX, w, h, color) {
        const fontSize = Math.max(18, Math.round(h * 0.035));
        ctx.font      = `900 ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        const tx = offsetX + w / 2;
        const ty = h - fontSize * 0.8;
        ctx.fillStyle   = 'rgba(0,0,0,0.55)';
        const tw = ctx.measureText(text).width;
        ctx.fillRect(tx - tw / 2 - 14, ty - fontSize, tw + 28, fontSize + 12);
        ctx.fillStyle = color;
        ctx.fillText(text, tx, ty);
        ctx.textAlign = 'left';
    }

    // DrawingArea é passada como prop renderizada para evitar
    // ser redefinida dentro do componente (causaria remount a cada render)
    const renderDrawingArea = (uri, side, interRef, marks, currentMark) => {
        const isSideActive = editorMode === 'single' || activeSide === side;
        return (
            <View style={{ width: scaledW, height: scaledH, position: 'relative', backgroundColor: '#000' }}>
                {IS_WEB && !IS_MOBILE_PWA ? (
                    // Desktop web: <img> com crossOrigin para captura no canvas
                    <img
                        src={uri ? uri + (uri.includes('?') ? '&_cb=1' : '?_cb=1') : uri}
                        crossOrigin="anonymous"
                        style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%',
                                 objectFit:'contain', pointerEvents:'none', userSelect:'none' }}
                        alt="" draggable={false} />
                ) : (
                    // Mobile PWA (iOS/Android) e React Native: Image do RN sem bloqueio CORS
                    <ReactNativeImage
                        source={{ uri }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="contain"
                    />
                )}

                {/* SVG preview marcações */}
                {showMarks && (
                    <Svg style={[StyleSheet.absoluteFill, { zIndex: 9 }]} width={scaledW} height={scaledH} viewBox={`0 0 ${baseW} ${baseH}`} preserveAspectRatio="none" pointerEvents="none">
                        {marks.map(m => <MarkShape key={m.id} mark={m} isSelected={selectedMarkId === m.id && selectedMarkSide === side} />)}
                        {currentMark && <MarkShape mark={currentMark} />}
                    </Svg>
                )}

                {/* Camada de interação */}
                {IS_WEB ? (
                    <div ref={interRef} style={{
                        position:'absolute', inset:0, zIndex:10,
                        cursor: isDrawingMode && isSideActive ? 'crosshair' : 'default',
                        pointerEvents: isDrawingMode && isSideActive ? 'auto' : 'none',
                        touchAction: 'none',
                        outline: editorMode === 'compare' && isSideActive
                            ? `2px solid ${side === 'right' ? '#4DE38F' : '#00CFFF'}`
                            : 'none',
                    }} />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { zIndex:10, backgroundColor:'transparent' },
                                  !(isDrawingMode && isSideActive) && { pointerEvents:'none' }]}
                          {...(isDrawingMode && isSideActive ? makeMobileHandlers(side) : {})} />
                )}

                {/* Badge de lado no modo comparação */}
                {editorMode === 'compare' && (
                    <TouchableOpacity
                        onPress={() => setActiveSide(side)}
                        style={{
                            position:'absolute', top:8, left:8, zIndex:20,
                            backgroundColor: isSideActive
                                ? (side === 'right' ? '#4DE38F' : '#00CFFF')
                                : 'rgba(0,0,0,0.5)',
                            paddingHorizontal:10, paddingVertical:4, borderRadius:8,
                        }}>
                        <Text style={{ color: isSideActive ? '#000' : '#FFF', fontSize:10, fontWeight:'900' }}>
                            {side === 'left' ? '← ANTES' : 'DEPOIS →'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    // ── Histórico de marcações ────────────────────────────────────────────────
    const [showHistory, setShowHistory] = useState(false);
    const currentMarks = active.marks;
    const toolIcons = { arrow:'arrow-top-right', line:'minus', circle:'circle-outline', rect:'crop-square', text:'format-text' };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
            <View style={[styles.container, { backgroundColor: '#000' }]}>

                {/* ── Top Bar ── */}
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                        <MaterialCommunityIcons name="close" size={22} color="#FFF" />
                    </TouchableOpacity>

                    {/* Modo: Individual / Comparação */}
                    <View style={styles.centerActions}>
                        <TouchableOpacity
                            style={[styles.modeBtn, editorMode === 'single' && { backgroundColor: '#4DE38F' }]}
                            onPress={() => setEditorMode('single')}>
                            <MaterialCommunityIcons name="image" size={18} color={editorMode === 'single' ? '#000' : '#FFF'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, editorMode === 'compare' && { backgroundColor: '#00CFFF' }]}
                            onPress={() => setEditorMode('compare')}>
                            <MaterialCommunityIcons name="compare" size={18} color={editorMode === 'compare' ? '#000' : '#FFF'} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.rightActions}>
                        {/* Toggle visibilidade das marcações */}
                        <TouchableOpacity onPress={() => setShowMarks(v => !v)} style={styles.iconBtn}>
                            <MaterialCommunityIcons name={showMarks ? 'eye' : 'eye-off'} size={20} color="#FFF" />
                        </TouchableOpacity>
                        {/* Histórico */}
                        <TouchableOpacity onPress={() => setShowHistory(v => !v)} style={[styles.iconBtn, showHistory && { backgroundColor: '#333' }]}>
                            <MaterialCommunityIcons name="layers-outline" size={20} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleUndo} style={[styles.iconBtn, !hasMarks && styles.disabled]} disabled={!hasMarks}>
                            <MaterialCommunityIcons name="undo" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleClear} style={[styles.iconBtn, !hasMarks && styles.disabled]} disabled={!hasMarks}>
                            <MaterialCommunityIcons name="delete-outline" size={22} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Histórico de marcações ── */}
                {showHistory && (
                    <View style={styles.historyPanel}>
                        <Text style={styles.historyTitle}>MARCAÇÕES ({currentMarks.length})</Text>
                        {currentMarks.length === 0 ? (
                            <Text style={styles.historyEmpty}>Nenhuma marcação ainda</Text>
                        ) : (
                            <FlatList
                                data={[...currentMarks].reverse()}
                                keyExtractor={m => m.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                renderItem={({ item, index }) => (
                                    <View style={styles.historyItem}>
                                        <View style={[styles.historyDot, { backgroundColor: item.color }]} />
                                        <MaterialCommunityIcons name={toolIcons[item.type] ?? 'pencil'} size={14} color={item.color} />
                                        <TouchableOpacity
                                            onPress={() => active.setMarks(prev => prev.filter(m => m.id !== item.id))}
                                            style={styles.historyDelete}>
                                            <MaterialCommunityIcons name="close" size={12} color="#AAA" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                        )}
                    </View>
                )}

                {/* ── Barra de ferramentas ── */}
                {IS_MOBILE_PWA ? (
                    // Mobile: duas linhas compactas
                    <View style={styles.toolBarMobile}>
                        {/* Linha 1: ferramentas + tamanhos */}
                        <View style={styles.toolBarMobileRow}>
                            {TOOL_OPTIONS.map(t => (
                                <TouchableOpacity key={t.id}
                                    style={[styles.toolBtnSm, activeTool === t.id && { backgroundColor: '#4DE38F' }]}
                                    onPress={() => setActiveTool(t.id)}>
                                    <MaterialCommunityIcons name={t.icon} size={16} color={activeTool === t.id ? '#000' : '#FFF'} />
                                </TouchableOpacity>
                            ))}
                            <View style={styles.dividerV} />
                            {SIZE_OPTIONS.map(sz => (
                                <TouchableOpacity key={sz.id}
                                    style={[styles.sizeBtnSm, activeSize.id === sz.id && { backgroundColor: '#4DE38F' }]}
                                    onPress={() => setActiveSize(sz)}>
                                    <Text style={[styles.sizeTxtSm, activeSize.id === sz.id && { color:'#000' }]}>{sz.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {/* Linha 2: cores */}
                        <View style={styles.toolBarMobileRow}>
                            {COLOR_OPTIONS.map(c => (
                                <TouchableOpacity key={c.id}
                                    onPress={() => setActiveColor(c)}
                                    style={[styles.colorDotSm,
                                        { backgroundColor: c.hex, borderColor: c.hex === '#FFFFFF' ? '#CCC' : 'transparent' },
                                        activeColor.id === c.id && styles.colorDotActive]} />
                            ))}
                            {/* Preview cor+tamanho atual */}
                            <View style={{ flex:1, alignItems:'flex-end', paddingRight:4 }}>
                                <View style={{ width: activeSize.stroke * 3 + 8, height: activeSize.stroke * 3 + 8,
                                               borderRadius: 99, backgroundColor: activeColor.hex,
                                               borderWidth: activeColor.hex === '#FFFFFF' ? 1 : 0, borderColor:'#CCC' }} />
                            </View>
                        </View>
                    </View>
                ) : (
                    // Desktop: linha única com scroll horizontal
                    <View style={styles.toolBar}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:6, alignItems:'center' }}>
                            {TOOL_OPTIONS.map(t => (
                                <TouchableOpacity key={t.id}
                                    style={[styles.toolBtn, activeTool === t.id && { backgroundColor: '#4DE38F' }]}
                                    onPress={() => setActiveTool(t.id)}>
                                    <MaterialCommunityIcons name={t.icon} size={18} color={activeTool === t.id ? '#000' : '#FFF'} />
                                </TouchableOpacity>
                            ))}
                            <View style={styles.divider} />
                            {COLOR_OPTIONS.map(c => (
                                <TouchableOpacity key={c.id}
                                    onPress={() => setActiveColor(c)}
                                    style={[styles.colorDot, { backgroundColor: c.hex, borderColor: c.hex === '#FFFFFF' ? '#CCC' : 'transparent' },
                                            activeColor.id === c.id && styles.colorDotActive]} />
                            ))}
                            <View style={styles.divider} />
                            {SIZE_OPTIONS.map(sz => (
                                <TouchableOpacity key={sz.id}
                                    style={[styles.sizeBtn, activeSize.id === sz.id && { backgroundColor: '#4DE38F' }]}
                                    onPress={() => setActiveSize(sz)}>
                                    <Text style={[styles.sizeTxt, activeSize.id === sz.id && { color:'#000' }]}>{sz.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* ── Opacidade ── */}
                <View style={styles.opacityBar}>
                    <MaterialCommunityIcons name="circle-half-full" size={14} color="#888" />
                    {IS_WEB ? (
                        <input
                            type="range" min="0.2" max="1" step="0.05"
                            value={opacity}
                            onChange={e => setOpacity(parseFloat(e.target.value))}
                            style={{ flex:1, margin:'0 8px', accentColor:'#4DE38F' }}
                        />
                    ) : (
                        // No mobile usamos botões simples
                        <View style={{ flexDirection:'row', gap:8, marginHorizontal:8 }}>
                            {[0.3,0.5,0.7,1].map(v => (
                                <TouchableOpacity key={v}
                                    onPress={() => setOpacity(v)}
                                    style={{ paddingHorizontal:8, paddingVertical:3, borderRadius:6,
                                             backgroundColor: opacity === v ? '#4DE38F' : '#1A1A1A' }}>
                                    <Text style={{ color: opacity === v ? '#000' : '#FFF', fontSize:11, fontWeight:'900' }}>
                                        {Math.round(v*100)}%
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    <Text style={{ color:'#888', fontSize:11, fontWeight:'900', minWidth:32 }}>
                        {Math.round(opacity * 100)}%
                    </Text>
                </View>

                {/* ── Painel de edição da marcação selecionada ── */}
                {activeTool === 'select' && selectedMarkId && (() => {
                    const targetState = (editorMode === 'single' || selectedMarkSide === 'right') ? right : left;
                    const selMark = targetState.marks.find(m => m.id === selectedMarkId);
                    if (!selMark) return null;

                    const updateMark = (patch) => {
                        targetState.setMarks(prev => prev.map(m => m.id === selectedMarkId ? { ...m, ...patch } : m));
                    };
                    const deleteMark = () => {
                        targetState.setMarks(prev => prev.filter(m => m.id !== selectedMarkId));
                        setSelectedMarkId(null);
                        setSelectedMarkSide(null);
                    };
                    const canResize = selMark.type !== 'text';

                    return (
                        <View style={styles.selectionPanel}>
                            {/* Cor */}
                            <View style={styles.selPanelRow}>
                                <Text style={styles.selPanelLabel}>COR</Text>
                                {COLOR_OPTIONS.map(c => (
                                    <TouchableOpacity key={c.id}
                                        onPress={() => updateMark({ color: c.hex })}
                                        style={[styles.colorDotSm,
                                            { backgroundColor: c.hex, borderColor: c.hex === '#FFFFFF' ? '#AAA' : 'transparent' },
                                            selMark.color === c.hex && { borderColor:'#0A84FF', borderWidth:3 }]} />
                                ))}
                                {/* Excluir */}
                                <TouchableOpacity onPress={deleteMark} style={styles.selDeleteBtn}>
                                    <MaterialCommunityIcons name="trash-can" size={18} color="#FF3B30" />
                                </TouchableOpacity>
                            </View>

                            {/* Tamanho / Redimensionar */}
                            {canResize && (
                                <View style={styles.selPanelRow}>
                                    <Text style={styles.selPanelLabel}>TAM</Text>
                                    {SIZE_OPTIONS.map(sz => (
                                        <TouchableOpacity key={sz.id}
                                            onPress={() => updateMark({ stroke: sz.stroke, head: sz.head })}
                                            style={[styles.sizeBtnSm,
                                                selMark.stroke === sz.stroke && { backgroundColor:'#0A84FF' }]}>
                                            <Text style={[styles.sizeTxtSm,
                                                selMark.stroke === sz.stroke && { color:'#FFF' }]}>{sz.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                    {/* Editar texto se for tipo texto */}
                                    {selMark.type === 'text' && (
                                        <TouchableOpacity style={[styles.sizeBtnSm, { backgroundColor:'#3A3A3C', marginLeft:4 }]}
                                            onPress={() => { setTextInputValue(selMark.text ?? ''); setPendingTextPos({ x: selMark.x, y: selMark.y, side: selectedMarkSide, editId: selectedMarkId }); setTextInputVisible(true); }}>
                                            <MaterialCommunityIcons name="pencil" size={14} color="#FFF" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                            {selMark.type === 'text' && (
                                <View style={styles.selPanelRow}>
                                    <Text style={styles.selPanelLabel}>TAM</Text>
                                    {SIZE_OPTIONS.map(sz => (
                                        <TouchableOpacity key={sz.id}
                                            onPress={() => updateMark({ fontSize: sz.stroke * 4 })}
                                            style={[styles.sizeBtnSm,
                                                selMark.fontSize === sz.stroke * 4 && { backgroundColor:'#0A84FF' }]}>
                                            <Text style={[styles.sizeTxtSm,
                                                selMark.fontSize === sz.stroke * 4 && { color:'#FFF' }]}>{sz.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity style={[styles.sizeBtnSm, { backgroundColor:'#3A3A3C', marginLeft:4 }]}
                                        onPress={() => { setTextInputValue(selMark.text ?? ''); setPendingTextPos({ x: selMark.x, y: selMark.y, side: selectedMarkSide, editId: selectedMarkId }); setTextInputVisible(true); }}>
                                        <MaterialCommunityIcons name="pencil" size={14} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    );
                })()}

                {/* ── Picker de check-in (modo comparação) ── */}
                {editorMode === 'compare' && (
                    <View style={styles.comparePicker}>
                        <TouchableOpacity
                            style={[styles.comparePickerBtn, { borderColor: compareCheckinId ? '#0A84FF' : '#CCC', backgroundColor: '#FFF' }]}
                            onPress={() => setShowCheckinPicker(v => !v)}>
                            <MaterialCommunityIcons name="compare" size={16} color={compareCheckinId ? '#00CFFF' : '#888'} />
                            <Text style={{ color: compareCheckinId ? '#0A84FF' : '#555', fontSize:11, fontWeight:'900', flex:1 }}>
                                {compareCheckinId
                                    ? `ANTES: ${new Date(olderCheckins.find(c=>c.id===compareCheckinId)?.date ?? '').toLocaleDateString('pt-BR')}`
                                    : 'SELECIONAR CHECK-IN ANTIGO →'}
                            </Text>
                            <MaterialCommunityIcons name={showCheckinPicker ? 'chevron-up' : 'chevron-down'} size={16} color="#888" />
                        </TouchableOpacity>

                        {/* Seletor de qual foto mostrar no lado ANTES */}
                        <View style={{ flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:10, paddingVertical:6 }}>
                            <Text style={{ color:'#555', fontSize:10, fontWeight:'900' }}>FOTO:</Text>
                            {[
                                { field:'photoFront', label:'FRENTE' },
                                { field:'photoSide',  label:'LADO'   },
                                { field:'photoBack',  label:'COSTAS' },
                            ].map(opt => (
                                <TouchableOpacity
                                    key={opt.field}
                                    onPress={() => handleCompareFieldChange(opt.field)}
                                    style={{
                                        paddingHorizontal:10, paddingVertical:5, borderRadius:8,
                                        backgroundColor: compareField === opt.field ? '#0A84FF' : '#E0E0E5',
                                    }}>
                                    <Text style={{ color: compareField === opt.field ? '#FFF' : '#555', fontSize:10, fontWeight:'900' }}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {showCheckinPicker && (
                            <ScrollView style={styles.pickerDropdown} nestedScrollEnabled>
                                {olderCheckins.length === 0 ? (
                                    <Text style={{ color:'#555', padding:12, fontSize:12 }}>Nenhum check-in anterior disponível</Text>
                                ) : (
                                    olderCheckins.map(c => (
                                        <TouchableOpacity key={c.id}
                                            style={[styles.pickerItem, compareCheckinId === c.id && { backgroundColor:'#00CFFF22' }]}
                                            onPress={() => selectCompareCheckin(c)}>
                                            <Text style={{ color:'#1C1C1E', fontSize:12, fontWeight:'bold' }}>
                                                {new Date(c.date ?? c.createdAt).toLocaleDateString('pt-BR')}
                                            </Text>
                                            <Text style={{ color:'#888', fontSize:11 }}>
                                                {c.weight ? `${c.weight}kg` : ''}
                                            </Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </ScrollView>
                        )}
                    </View>
                )}

                {/* ── Canvas Area ── */}
                <View style={styles.canvasContainer}>
                    <ScrollView style={{ flex:1 }}
                        contentContainerStyle={{ alignItems:'center', justifyContent:'center', minHeight:'100%' }}
                        scrollEnabled={!isDrawingMode}>
                        <ScrollView horizontal scrollEnabled={!isDrawingMode}
                            contentContainerStyle={{ alignItems:'center', justifyContent:'center', minWidth:'100%' }}>

                            <View style={{ flexDirection: 'row', gap: editorMode === 'compare' ? 4 : 0 }}>
                                {/* Lado esquerdo (ANTES) — só no modo comparação */}
                                {editorMode === 'compare' && (
                                    comparePhotoUri
                                        ? renderDrawingArea(comparePhotoUri, 'left', leftInterRef, left.marks, left.currentMark)
                                        : (
                                            <View style={{ width: scaledW, height: scaledH, backgroundColor: '#EFEFEF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#CCC', borderStyle: 'dashed', borderRadius: 4 }}>
                                                <MaterialCommunityIcons name='image-plus' size={40} color='#AAA' />
                                                <Text style={{ color: '#AAA', fontSize: 12, fontWeight: '900', marginTop: 8, textAlign: 'center', paddingHorizontal: 16 }}>Selecione um check-in acima</Text>
                                            </View>
                                        )
                                )}

                                {/* Lado direito (foto atual / modo single) */}
                                {IS_WEB && !IS_MOBILE_PWA ? (
                                    // Desktop: renderiza direto (canvas captura via fetch+blob)
                                    renderDrawingArea(photoUri, 'right', interactionRef, right.marks, right.currentMark)
                                ) : (
                                    // Mobile nativo e Mobile PWA: ViewShot captura a view
                                    RNViewShot ? (
                                        <RNViewShot ref={captureRef} options={{ format:'jpg', quality:0.92 }}>
                                            {renderDrawingArea(photoUri, 'right', interactionRef, right.marks, right.currentMark)}
                                        </RNViewShot>
                                    ) : (
                                        renderDrawingArea(photoUri, 'right', interactionRef, right.marks, right.currentMark)
                                    )
                                )}
                            </View>
                        </ScrollView>
                    </ScrollView>
                </View>

                {/* ── Bottom Bar ── */}
                {IS_MOBILE_PWA ? (
                    // Mobile: duas linhas — zoom+modo na primeira, salvar na segunda
                    <View style={styles.bottomBarMobile}>
                        <View style={styles.bottomBarMobileRow}>
                            {/* Zoom */}
                            <View style={styles.zoomControls}>
                                <TouchableOpacity onPress={() => setZoom(p => Math.max(p - 0.5, 1))} style={styles.zoomBtn}>
                                    <MaterialCommunityIcons name="magnify-minus-outline" size={20} color="#FFF" />
                                </TouchableOpacity>
                                <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
                                <TouchableOpacity onPress={() => setZoom(p => Math.min(p + 0.5, 3))} style={styles.zoomBtn}>
                                    <MaterialCommunityIcons name="magnify-plus-outline" size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                            {/* Modo desenho/pan */}
                            <View style={{ flexDirection:'row', gap:6 }}>
                                <TouchableOpacity
                                    style={[styles.modeToggleBtn, { backgroundColor: isDrawingMode ? '#4DE38F' : '#2C2C2E' }]}
                                    onPress={() => setIsDrawingMode(true)}>
                                    <MaterialCommunityIcons name="pencil" size={18} color={isDrawingMode ? '#000' : '#FFF'} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modeToggleBtn, { backgroundColor: !isDrawingMode ? '#4DE38F' : '#2C2C2E' }]}
                                    onPress={() => setIsDrawingMode(false)}>
                                    <MaterialCommunityIcons name="pan" size={18} color={!isDrawingMode ? '#000' : '#FFF'} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        {/* Botão salvar em linha própria — ocupa a largura toda */}
                        <TouchableOpacity
                            style={[styles.saveBtnFull, { backgroundColor:'#4DE38F' }]}
                            onPress={handleSaveImage} disabled={isSaving}>
                            {isSaving ? <ActivityIndicator color="#000" /> : (
                                <>
                                    <MaterialCommunityIcons name="check-bold" size={20} color="#000" />
                                    <Text style={styles.saveBtnText}>
                                        {editorMode === 'compare' ? 'SALVAR COMPARAÇÃO' : 'CONCLUIR MARCAÇÃO'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    // Desktop: linha única
                    <View style={styles.bottomBar}>
                        <View style={styles.zoomControls}>
                            <TouchableOpacity onPress={() => setZoom(p => Math.max(p - 0.5, 1))} style={styles.zoomBtn}>
                                <MaterialCommunityIcons name="magnify-minus-outline" size={22} color="#FFF" />
                            </TouchableOpacity>
                            <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
                            <TouchableOpacity onPress={() => setZoom(p => Math.min(p + 0.5, 3))} style={styles.zoomBtn}>
                                <MaterialCommunityIcons name="magnify-plus-outline" size={22} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection:'row', gap:8 }}>
                            <TouchableOpacity
                                style={[styles.modeToggleBtn, { backgroundColor: isDrawingMode ? '#4DE38F' : '#1A1A1A' }]}
                                onPress={() => setIsDrawingMode(true)}>
                                <MaterialCommunityIcons name="pencil" size={16} color={isDrawingMode ? '#000' : '#FFF'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modeToggleBtn, { backgroundColor: !isDrawingMode ? '#4DE38F' : '#1A1A1A' }]}
                                onPress={() => setIsDrawingMode(false)}>
                                <MaterialCommunityIcons name="pan" size={16} color={!isDrawingMode ? '#000' : '#FFF'} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor:'#4DE38F' }]} onPress={handleSaveImage} disabled={isSaving}>
                            {isSaving ? <ActivityIndicator color="#000" /> : (
                                <>
                                    <MaterialCommunityIcons name="check-bold" size={18} color="#000" />
                                    <Text style={styles.saveBtnText}>
                                        {editorMode === 'compare' ? 'SALVAR COMPARAÇÃO' : 'CONCLUIR MARCAÇÃO'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

            </View>

            {/* ── Input de texto flutuante ── */}
            {textInputVisible && (
                <Modal transparent animationType="fade">
                    <View style={styles.textInputOverlay}>
                        <View style={styles.textInputBox}>
                            <Text style={styles.textInputLabel}>Digite o texto da marcação:</Text>
                            <TextInput
                                style={styles.textInputField}
                                value={textInputValue}
                                onChangeText={setTextInputValue}
                                autoFocus
                                placeholder="Ex: Glúteo caído"
                                placeholderTextColor="#666"
                                onSubmitEditing={confirmText}
                            />
                            <View style={{ flexDirection:'row', gap:10, marginTop:12 }}>
                                <TouchableOpacity style={[styles.textInputBtn, { backgroundColor:'#333' }]}
                                    onPress={() => setTextInputVisible(false)}>
                                    <Text style={{ color:'#FFF', fontWeight:'900' }}>CANCELAR</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.textInputBtn, { backgroundColor:'#4DE38F', flex:1 }]}
                                    onPress={confirmText}>
                                    <Text style={{ color:'#000', fontWeight:'900' }}>INSERIR</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </Modal>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:      { flex:1, justifyContent:'space-between', backgroundColor:'#F2F2F7' },
    topBar:         { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:12, paddingTop: Platform.OS==='android' ? 40 : 20, paddingBottom:10, backgroundColor:'#1C1C1E' },
    centerActions:  { flexDirection:'row', backgroundColor:'#2C2C2E', borderRadius:8, overflow:'hidden' },
    modeBtn:        { paddingHorizontal:14, paddingVertical:8 },
    rightActions:   { flexDirection:'row', gap:6 },
    iconBtn:        { padding:7, backgroundColor:'#2C2C2E', borderRadius:8 },
    disabled:       { opacity:0.3 },

    historyPanel:   { backgroundColor:'#E8E8ED', paddingHorizontal:12, paddingVertical:8, borderBottomWidth:1, borderBottomColor:'#CCC' },
    historyTitle:   { color:'#555', fontSize:10, fontWeight:'900', letterSpacing:1, marginBottom:6 },
    historyEmpty:   { color:'#888', fontSize:11 },
    historyItem:    { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'#D1D1D6', borderRadius:8, paddingHorizontal:8, paddingVertical:6, marginRight:6 },
    historyDot:     { width:8, height:8, borderRadius:4 },
    historyDelete:  { marginLeft:4, padding:2 },

    toolBar:        { flexDirection:'row', paddingHorizontal:10, paddingVertical:8, backgroundColor:'#1C1C1E', borderBottomWidth:1, borderBottomColor:'#3A3A3C' },
    toolBtn:        { paddingHorizontal:10, paddingVertical:7, borderRadius:8, backgroundColor:'#3A3A3C', marginRight:4 },
    divider:        { width:1, height:28, backgroundColor:'#555', marginHorizontal:4 },
    colorDot:       { width:26, height:26, borderRadius:13, borderWidth:2, borderColor:'transparent', marginRight:4 },
    colorDotActive: { borderColor:'#FFF', borderWidth:3, transform:[{ scale:1.15 }] },
    sizeBtn:        { paddingHorizontal:9, paddingVertical:5, borderRadius:7, backgroundColor:'#3A3A3C', marginRight:4 },
    sizeTxt:        { color:'#FFF', fontWeight:'900', fontSize:11 },

    opacityBar:     { flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:6, backgroundColor:'#2C2C2E' },

    comparePicker:     { backgroundColor:'#F2F2F7', borderBottomWidth:1, borderBottomColor:'#DDD' },
    comparePickerBtn:  { flexDirection:'row', alignItems:'center', gap:8, padding:10, marginHorizontal:10, marginVertical:6, borderRadius:10, borderWidth:1 },
    pickerDropdown:    { maxHeight:140, marginHorizontal:10, marginBottom:6, backgroundColor:'#FFF', borderRadius:10, borderWidth:1, borderColor:'#DDD' },
    pickerItem:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:12, borderBottomWidth:1, borderBottomColor:'#EEE' },

    canvasContainer:   { flex:1, backgroundColor:'#D1D1D6', overflow:'hidden' },

    bottomBar:         { padding:14, backgroundColor:'#1C1C1E', alignItems:'center', gap:10, flexDirection:'row', justifyContent:'space-between' },
    zoomControls:      { flexDirection:'row', alignItems:'center', backgroundColor:'#3A3A3C', borderRadius:10, padding:4, gap:6 },
    zoomBtn:           { padding:8, backgroundColor:'#48484A', borderRadius:7 },
    zoomText:          { color:'#FFF', fontWeight:'900', fontSize:12, minWidth:40, textAlign:'center' },
    modeToggleBtn:     { padding:9, borderRadius:8 },
    saveBtn:           { flexDirection:'row', paddingHorizontal:16, paddingVertical:13, borderRadius:12, justifyContent:'center', alignItems:'center', gap:6 },
    saveBtnText:       { color:'#000', fontWeight:'900', fontSize:12, letterSpacing:0.5 },

    textInputOverlay:  { flex:1, backgroundColor:'rgba(0,0,0,0.85)', justifyContent:'center', alignItems:'center' },
    textInputBox:      { width:'85%', backgroundColor:'#F2F2F7', borderRadius:16, padding:20 },
    textInputLabel:    { color:'#1C1C1E', fontWeight:'900', fontSize:13, marginBottom:10 },
    textInputField:    { backgroundColor:'#FFF', color:'#1C1C1E', borderRadius:10, padding:14, fontSize:15, borderWidth:1, borderColor:'#CCC' },
    textInputBtn:      { paddingHorizontal:20, paddingVertical:12, borderRadius:10, alignItems:'center', justifyContent:'center' },

    // ── Selection panel styles ──────────────────────────────────────────────
    selectionPanel:  { backgroundColor:'#1C1C1E', borderBottomWidth:1, borderBottomColor:'#3A3A3C', paddingHorizontal:10, paddingVertical:8, gap:6 },
    selPanelRow:     { flexDirection:'row', alignItems:'center', gap:6, flexWrap:'wrap' },
    selPanelLabel:   { color:'#AAA', fontSize:9, fontWeight:'900', letterSpacing:0.5, width:28 },
    selDeleteBtn:    { marginLeft:'auto', padding:6, backgroundColor:'#2C2C2E', borderRadius:8 },

    // ── Mobile PWA styles ────────────────────────────────────────────────────
    toolBarMobile:     { backgroundColor:'#1C1C1E', borderBottomWidth:1, borderBottomColor:'#3A3A3C', paddingVertical:6, paddingHorizontal:8, gap:6 },
    toolBarMobileRow:  { flexDirection:'row', alignItems:'center', gap:5 },
    toolBtnSm:         { width:36, height:36, borderRadius:8, backgroundColor:'#3A3A3C', justifyContent:'center', alignItems:'center' },
    sizeBtnSm:         { paddingHorizontal:8, paddingVertical:5, borderRadius:7, backgroundColor:'#3A3A3C' },
    sizeTxtSm:         { color:'#FFF', fontWeight:'900', fontSize:10 },
    colorDotSm:        { width:24, height:24, borderRadius:12, borderWidth:2, borderColor:'transparent' },
    dividerV:          { width:1, height:24, backgroundColor:'#555', marginHorizontal:2 },

    bottomBarMobile:   { backgroundColor:'#1C1C1E', paddingHorizontal:12, paddingTop:10, paddingBottom: Platform.OS === 'ios' ? 28 : 12, gap:8 },
    bottomBarMobileRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
    saveBtnFull:       { flexDirection:'row', width:'100%', padding:14, borderRadius:12, justifyContent:'center', alignItems:'center', gap:8 },
});
