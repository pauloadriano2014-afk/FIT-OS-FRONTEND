// src/components/MapaMuscular.js
// 🔥 Diagrama muscular (frente/costas) — desenhado com react-native-svg a
// partir do atlas anatômico real em src/utils/muscleAtlas.json (mesma fonte
// usada pelo gerador de PDF, então tela e PDF mostram exatamente o mesmo
// desenho). Ver o comentário de atribuição no topo de muscleMap.js.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';
import {
    VIEW_BOX, COR_BASE,
    calcularRegioesAtivas, overlaysAtivos, corpoBase, COR_PRINCIPAL, COR_SECUNDARIO,
} from '../utils/muscleMap';

function GrupoSvg({ grupo, fill }) {
    if (!grupo || !grupo.paths?.length) return null;
    const paths = grupo.paths.map((p, i) => <Path key={i} d={p.d} fill={fill} />);
    return grupo.transform ? <G transform={grupo.transform}>{paths}</G> : <>{paths}</>;
}

function Corpo({ view, principalSet, secundarioSet, width, height, label }) {
    const overlays = overlaysAtivos(view, principalSet, secundarioSet);
    return (
        <View style={{ alignItems: 'center' }}>
            <Svg width={width} height={height} viewBox={`0 0 ${VIEW_BOX.w} ${VIEW_BOX.h}`}>
                <Rect x={0} y={0} width={VIEW_BOX.w} height={VIEW_BOX.h} fill="#141414" rx={10} />
                <GrupoSvg grupo={corpoBase(view)} fill={COR_BASE} />
                {overlays.map((g, i) => <GrupoSvg key={i} grupo={g} fill={g.cor} />)}
            </Svg>
            <Text style={styles.viewLabel}>{label}</Text>
        </View>
    );
}

// muscPrincipal/muscSecundario: array de strings (ou string única) — mesmo
// formato já salvo em treinoPrograma. width controla o tamanho de CADA vista
// exibida (se as duas vistas forem necessárias, ficam lado a lado).
export default function MapaMuscular({ muscPrincipal, muscSecundario, width = 92 }) {
    const height = Math.round(width * VIEW_BOX.h / VIEW_BOX.w);
    const { principalFrente, principalCostas, secundarioFrente, secundarioCostas } =
        calcularRegioesAtivas(muscPrincipal, muscSecundario);

    const temFrente = principalFrente.size > 0 || secundarioFrente.size > 0;
    const temCostas = principalCostas.size > 0 || secundarioCostas.size > 0;

    // Sem nenhum músculo reconhecido (ex: exercício cardio/aquecimento) —
    // não faz sentido mostrar um boneco totalmente neutro, então não renderiza.
    if (!temFrente && !temCostas) return null;

    return (
        <View style={styles.wrap}>
            <View style={styles.corposRow}>
                {temFrente && (
                    <Corpo
                        view="frente"
                        principalSet={principalFrente}
                        secundarioSet={secundarioFrente}
                        width={width}
                        height={height}
                        label="FRENTE"
                    />
                )}
                {temCostas && (
                    <Corpo
                        view="costas"
                        principalSet={principalCostas}
                        secundarioSet={secundarioCostas}
                        width={width}
                        height={height}
                        label="COSTAS"
                    />
                )}
            </View>
            <View style={styles.legendaRow}>
                <View style={styles.legendaItem}>
                    <View style={[styles.legendaBolinha, { backgroundColor: COR_PRINCIPAL }]} />
                    <Text style={styles.legendaTexto}>Principal</Text>
                </View>
                <View style={styles.legendaItem}>
                    <View style={[styles.legendaBolinha, { backgroundColor: COR_SECUNDARIO }]} />
                    <Text style={styles.legendaTexto}>Secundário</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { alignItems: 'center', marginVertical: 10, maxWidth: '100%' },
    corposRow: { flexDirection: 'row', gap: 14, justifyContent: 'center', flexWrap: 'wrap', maxWidth: '100%' },
    viewLabel: { color: '#666', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
    legendaRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
    legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendaBolinha: { width: 9, height: 9, borderRadius: 5 },
    legendaTexto: { color: '#999', fontSize: 10, fontWeight: '700' },
});
