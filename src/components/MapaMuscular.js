// src/components/MapaMuscular.js
// 🔥 Diagrama muscular vetorial (frente/costas) — desenhado com react-native-svg
// a partir de dados 100% locais (nenhuma imagem externa, nenhuma IA geradora
// de imagem envolvida). As coordenadas ficam em src/utils/muscleMap.js, o
// mesmo arquivo usado pelo gerador de PDF, então a tela e o PDF mostram
// exatamente o mesmo desenho. A cor de cada região é decidida comparando o
// texto livre de muscPrincipal/muscSecundario do exercício com as regras de
// muscleMap.normalizarMusculo — sem depender de nenhum PDF de referência.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Rect, Path } from 'react-native-svg';
import {
    REGIOES_FRENTE, REGIOES_COSTAS, VIEW_BOX,
    calcularRegioesAtivas, corDaRegiao, COR_PRINCIPAL, COR_SECUNDARIO,
} from '../utils/muscleMap';

function Regioes({ regioes, principalSet, secundarioSet }) {
    return regioes.map((shape, i) => {
        const fill = corDaRegiao(shape, principalSet, secundarioSet);
        const common = { key: `${shape.id}-${i}`, fill, stroke: '#0a0a0a', strokeWidth: 1.5 };
        if (shape.tipo === 'circle') return <Circle {...common} cx={shape.attrs.cx} cy={shape.attrs.cy} r={shape.attrs.r} />;
        if (shape.tipo === 'ellipse') return <Ellipse {...common} cx={shape.attrs.cx} cy={shape.attrs.cy} rx={shape.attrs.rx} ry={shape.attrs.ry} />;
        if (shape.tipo === 'path') return <Path {...common} d={shape.attrs.d} />;
        return (
            <Rect {...common}
                x={shape.attrs.x} y={shape.attrs.y}
                width={shape.attrs.width} height={shape.attrs.height}
                rx={shape.attrs.rx}
            />
        );
    });
}

function Corpo({ regioes, principalSet, secundarioSet, width, height, label }) {
    return (
        <View style={{ alignItems: 'center' }}>
            <Svg width={width} height={height} viewBox={`0 0 ${VIEW_BOX.w} ${VIEW_BOX.h}`}>
                <Rect x={0} y={0} width={VIEW_BOX.w} height={VIEW_BOX.h} fill="#141414" rx={10} />
                <Regioes regioes={regioes} principalSet={principalSet} secundarioSet={secundarioSet} />
            </Svg>
            <Text style={styles.viewLabel}>{label}</Text>
        </View>
    );
}

// muscPrincipal/muscSecundario: array de strings (ou string única) — mesmo
// formato já salvo em treinoPrograma. width/height controlam o tamanho de
// CADA vista exibida (se as duas vistas forem necessárias, ficam lado a lado).
export default function MapaMuscular({ muscPrincipal, muscSecundario, width = 110, height = 253 }) {
    const { principalFrente, principalCostas, secundarioFrente, secundarioCostas } =
        calcularRegioesAtivas(muscPrincipal, muscSecundario);

    const temFrente = principalFrente.size > 0 || secundarioFrente.size > 0;
    const temCostas = principalCostas.size > 0 || secundarioCostas.size > 0;

    // Sem nenhum músculo reconhecido (ex: exercício cardio/aquecimento) —
    // não faz sentido mostrar um boneco totalmente cinza, então não renderiza.
    if (!temFrente && !temCostas) return null;

    return (
        <View style={styles.wrap}>
            <View style={styles.corposRow}>
                {temFrente && (
                    <Corpo
                        regioes={REGIOES_FRENTE}
                        principalSet={principalFrente}
                        secundarioSet={secundarioFrente}
                        width={width}
                        height={height}
                        label="FRENTE"
                    />
                )}
                {temCostas && (
                    <Corpo
                        regioes={REGIOES_COSTAS}
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
    wrap: { alignItems: 'center', marginVertical: 10 },
    corposRow: { flexDirection: 'row', gap: 18, justifyContent: 'center' },
    viewLabel: { color: '#666', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
    legendaRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
    legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendaBolinha: { width: 9, height: 9, borderRadius: 5 },
    legendaTexto: { color: '#999', fontSize: 10, fontWeight: '700' },
});
