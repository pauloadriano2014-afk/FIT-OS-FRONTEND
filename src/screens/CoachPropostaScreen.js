// src/screens/CoachPropostaScreen.js
// Landing page de captação de coaches parceiros
// Layout 100% Responsivo e Alinhado com Carrossel e Scroll Âncora
import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Animated, Platform, useWindowDimensions, Linking, Image,
    StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// ─── CORES ────────────────────────────────────────────────────────────────────
const DARK   = '#0a0a0a';
const ACCENT = '#8BC34A'; // verde ELITE FIT
const GOLD   = '#FFCC00';
const BLUE   = '#32ADE6';
const PURPLE = '#BF5AF2';

// ─── PLANOS ──────────────────────────────────────────────────────────────────
const PLANS = [
    {
        key:       'PERSONAL',
        icon:      'dumbbell',
        color:     BLUE,
        title:     'Personal Trainer',
        subtitle:  'Módulo de treinos completo',
        price:     'R$97',
        period:    '/mês',
        highlight: false,
        features: [
            'Montagem de treinos ilimitada',
            'Biblioteca de exercícios completa',
            'Templates e técnicas avançadas',
            'Check-in de fotos dos alunos',
            'Avaliação com IA',
            'Gamificação e XP',
            'Gestão financeira dos alunos',
            'Página de vendas própria',
        ],
    },
    {
        key:       'ELITE',
        icon:      'trophy',
        color:     GOLD,
        title:     'Elite',
        subtitle:  'Personal + Nutricionista',
        price:     'R$147',
        period:    '/mês',
        highlight: true, // Mantém o destaque visual premium permanente
        features: [
            'Tudo do Personal Trainer',
            'Montagem de dietas completa',
            'Grupos de substituição alimentar',
            'Catálogo TACO + alimentos custom',
            'Avaliação nutricional com IA',
            'Cofre de dietas (templates)',
            'Módulo de corrida',
            'Suporte prioritário',
        ],
    },
    {
        key:       'NUTRICIONISTA',
        icon:      'food-apple',
        color:     ACCENT,
        title:     'Nutricionista',
        subtitle:  'Módulo de dietas completo',
        price:     'R$97',
        period:    '/mês',
        highlight: false,
        features: [
            'Montagem de dietas ilimitada',
            'Catálogo TACO + alimentos custom',
            'Grupos de substituição alimentar',
            'Check-in de fotos dos alunos',
            'Avaliação nutricional com IA',
            'Cofre de dietas (templates)',
            'Gestão financeira dos alunos',
            'Página de vendas própria',
        ],
    },
];

const DIFERENCIAIS = [
    { icon:'robot-outline',        color:ACCENT,  title:'IA que trabalha por você',     desc:'Análise de fotos, avaliação escrita e laudo completo gerado em segundos. Você só revisa e envia.' },
    { icon:'camera-timer',         color:BLUE,    title:'Check-in sem WhatsApp',         desc:'O aluno envia as fotos direto pelo app. Chegam organizadas, por data, prontas para avaliar.' },
    { icon:'cash-multiple',        color:GOLD,    title:'Financeiro integrado',          desc:'Controle de contratos, vencimentos e cobranças dos seus alunos. Tudo em um lugar.' },
    { icon:'storefront-outline',   color:PURPLE,  title:'Sua marca, sua página',         desc:'Página de vendas profissional com sua foto, planos e depoimentos. Pronta para captar alunos.' },
    { icon:'account-group',        color:ACCENT,  title:'Gestão completa dos alunos',    desc:'Dashboard com alertas, filtros, anotações privadas, histórico de treinos e muito mais.' },
    { icon:'palette-swatch',       color:BLUE,    title:'White-label total',             desc:'Sua logo no app dos seus alunos. A plataforma é sua, com a sua identidade.' },
];

const STEPS = [
    { num:'01', title:'Escolha seu plano',   desc:'Personal, Nutricionista ou Elite. Você decide o que precisa.',          icon:'clipboard-check-outline' },
    { num:'02', title:'Faça o cadastro',     desc:'Preencha seus dados e envie para análise. Aprovação em até 24 horas.',    icon:'account-plus-outline'    },
    { num:'03', title:'Receba seu acesso',   desc:'Código de convite liberado. Comece a cadastrar seus alunos agora.',       icon:'rocket-launch-outline'   },
];

const TESTIMONIALS = [
    { name:'Coach Ana Lima',    role:'Personal Trainer — SP',   text:'Economizei 3 horas por semana só com as avaliações automáticas. A IA escreve o laudo, eu só personalizo e envio.' },
    { name:'Coach Rafael Neto', role:'Nutricionista — RJ',      text:'Meus alunos adoraram o app. O check-in sem WhatsApp foi um divisor de águas na minha organização.' },
    { name:'Coach Fernanda S.', role:'Personal + Nutri — MG',   text:'Nunca imaginei ter uma plataforma assim por esse preço. Valeu cada centavo desde o primeiro mês.' },
];

const FAQ = [
    { q:'Posso testar antes de pagar?',          a:'Sim! Após a aprovação, você tem 7 dias para explorar a plataforma gratuitamente.' },
    { q:'Posso mudar de plano depois?',           a:'Claro. Você pode fazer upgrade a qualquer momento e pagamos apenas a diferença proporcional dos dias restantes.' },
    { q:'Quantos alunos posso ter?',              a:'Ilimitados. Não cobramos por aluno — seu crescimento não tem teto.' },
    { q:'Como funciona o suporte?',               a:'Você tem acesso ao ELITE Assistant dentro do painel (IA de suporte) e WhatsApp direto com a equipe PA ELITE TEAM.' },
    { q:'Os alunos pagam alguma coisa?',          a:'Não para usar o app. O que você cobra dos seus alunos é gerenciado por você dentro da plataforma.' },
    { q:'Posso usar minha própria logo?',         a:'Sim. Upload da sua logo nas configurações e ela aparece no app dos seus alunos.' },
];

// ─── COMPONENTES AUXILIARES ───────────────────────────────────────────────────

function FadeIn({ delay = 0, style, children }) {
    const opacity   = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(30)).current;
    
    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity,    { toValue:1, duration:600, delay, useNativeDriver:true }),
            Animated.timing(translateY, { toValue:0, duration:600, delay, useNativeDriver:true }),
        ]).start();
    }, [delay, opacity, translateY]);
    
    return (
        <Animated.View style={[{ opacity, transform:[{ translateY }] }, style]}>
            {children}
        </Animated.View>
    );
}

function Section({ children, style, onLayout }) {
    return <View onLayout={onLayout} style={[{ paddingHorizontal:20, paddingVertical:40, width: '100%' }, style]}>{children}</View>;
}

function SectionTitle({ children, accent, center }) {
    return (
        <Text style={[styles.sectionTitle, center && { textAlign:'center' }]}>
            {children}{accent ? <Text style={{ color: ACCENT }}>{accent}</Text> : null}
        </Text>
    );
}

function FeatureCheck({ text, color }) {
    return (
        <View style={{ flexDirection:'row', alignItems:'flex-start', marginBottom:10 }}>
            <MaterialCommunityIcons name="check-circle" size={16} color={color ?? ACCENT} style={{ marginTop:2, marginRight: 8 }} />
            <Text style={{ color:'#ccc', fontSize:13, lineHeight:20, flex:1 }}>{text}</Text>
        </View>
    );
}

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────
export default function CoachPropostaScreen({ navigation }) {
    const { width: W } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';
    const isWide = W > 768;
    const [openFaq, setOpenFaq] = useState(null);
    
    // 🔥 Referências para gerenciar o Scroll Automático
    const scrollRef = useRef(null);
    const [plansSectionY, setPlansSectionY] = useState(0);

    // Desliza suavemente até a seção de planos
    const scrollToPlans = () => {
        if (scrollRef.current && plansSectionY > 0) {
            scrollRef.current.scrollTo({ y: plansSectionY, animated: true });
        }
    };

    // Navega direto para a tela de registro com o plano selecionado
    const handlePlanChoice = (planKey) => {
        navigation.navigate('Register', { 
            accountType: 'COACH', 
            type: 'COACH', 
            role: 'COACH', 
            coachPlan: planKey, 
            plan: planKey 
        });
    };

    const handleWhatsApp = () => {
        const msg = 'Olá! Tenho interesse em ser coach parceiro no ELITE FIT.';
        Linking.openURL(`whatsapp://send?phone=5541997991346&text=${encodeURIComponent(msg)}`).catch(() => {});
    };

    return (
        <View style={{ flex: 1, backgroundColor: DARK, height: isWeb ? '100vh' : '100%', maxHeight: isWeb ? '100vh' : '100%', overflow: 'hidden' }}>
            <StatusBar barStyle="light-content" backgroundColor={DARK} />
            
            <ScrollView 
                ref={scrollRef}
                style={{ flex: 1, width: '100%' }} 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 80, alignItems: 'center' }} 
                bounces={true}
            >
                <View style={{ maxWidth:960, width:'100%' }}>

                    {/* ── HERO ─────────────────────────────────────────────── */}
                    <LinearGradient
                        colors={['#111', DARK]}
                        style={[styles.hero, { paddingTop: Platform.OS === 'ios' ? 60 : 40 }]}
                    >
                        <FadeIn delay={0}>
                            <Image
                                source={{ uri:'https://i.postimg.cc/wxZqp84Z/Design-sem-nome.png' }}
                                style={styles.heroLogo}
                                resizeMode="contain"
                            />
                        </FadeIn>

                        <FadeIn delay={200}>
                            <View style={styles.heroBadge}>
                                <MaterialCommunityIcons name="shield-check" size={14} color={ACCENT} style={{ marginRight: 6 }}/>
                                <Text style={{ color: ACCENT, fontSize:12, fontWeight:'900', letterSpacing:0.5 }}>
                                    PLATAFORMA PARA COACHES
                                </Text>
                            </View>
                        </FadeIn>

                        <FadeIn delay={300}>
                            <Text style={styles.heroTitle}>
                                Gerencie seus alunos{'\n'}
                                <Text style={{ color: ACCENT }}>de forma profissional</Text>
                            </Text>
                            <Text style={styles.heroSubtitle}>
                                A plataforma que unifica treinos, dietas, check-ins, financeiro e IA em um único app. Tudo com a sua marca.
                            </Text>
                        </FadeIn>

                        <FadeIn delay={500}>
                            <View style={[styles.heroStats, { flexDirection: isWide ? 'row' : 'column' }]}>
                                {[
                                    { value:'IA',          label:'Avaliação automática'  },
                                    { value:'∞',           label:'Alunos ilimitados'     },
                                    { value:'100%',        label:'Sua marca no app'      },
                                    { value:'24h',         label:'Aprovação rápida'      },
                                ].map(({ value, label }, index) => (
                                    <View key={label} style={[styles.heroStat, !isWide && index < 3 && { borderRightWidth: 0, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }]}>
                                        <Text style={{ color: ACCENT, fontSize:22, fontWeight:'900' }}>{value}</Text>
                                        <Text style={{ color:'#888', fontSize:11, fontWeight:'700', marginTop:2 }}>{label}</Text>
                                    </View>
                                ))}
                            </View>
                        </FadeIn>

                        <FadeIn delay={600} style={{ width: '100%', maxWidth: 360, alignItems: 'center' }}>
                            <TouchableOpacity
                                style={[styles.heroCTA, { backgroundColor: ACCENT }]}
                                onPress={scrollToPlans}
                            >
                                <Text style={{ color:'#000', fontWeight:'900', fontSize:16, letterSpacing:0.5, marginRight: 8 }}>
                                    QUERO SER COACH PARCEIRO
                                </Text>
                                <MaterialCommunityIcons name="arrow-down" size={20} color="#000" />
                            </TouchableOpacity>
                            <Text style={{ color:'#555', fontSize:12, textAlign:'center', marginTop:12 }}>
                                Aprovação em até 24 horas · Sem fidelidade
                            </Text>
                        </FadeIn>
                    </LinearGradient>

                    {/* ── DIFERENCIAIS ─────────────────────────────────────── */}
                    <Section style={{ borderTopWidth:1, borderTopColor:'#1a1a1a' }}>
                        <SectionTitle accent=" tudo que você precisa">Uma plataforma,</SectionTitle>
                        <Text style={styles.sectionSub}>
                            Chega de WhatsApp para fotos, planilha para financeiro e outro sistema para treinos. Tudo em um lugar.
                        </Text>
                        
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                            {DIFERENCIAIS.map((d, i) => (
                                <FadeIn 
                                    key={d.title} 
                                    delay={i * 80} 
                                    style={{ width: isWide ? '31%' : '100%', marginBottom: 20 }}
                                >
                                    <View style={styles.diferencialCard}>
                                        <View style={[styles.diferencialIcon, { backgroundColor: d.color + '18' }]}>
                                            <MaterialCommunityIcons name={d.icon} size={24} color={d.color} />
                                        </View>
                                        <Text style={styles.diferencialTitle}>{d.title}</Text>
                                        <Text style={styles.diferencialDesc}>{d.desc}</Text>
                                    </View>
                                </FadeIn>
                            ))}
                        </View>
                    </Section>

                    {/* ── VS CONCORRENTES ──────────────────────────────────── */}
                    <Section style={{ backgroundColor:'#0d0d0d' }}>
                        <SectionTitle center accent=" o ELITE FIT?">Por que</SectionTitle>
                        
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            style={{ width: '100%', marginTop: 20 }}
                            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                        >
                            <View style={[styles.vsTable, { borderColor:'#222', minWidth: 760, maxWidth: 960, width: '100%' }]}>
                                {/* Header */}
                                <View style={[styles.vsRow, { backgroundColor:'#111' }]}>
                                    <Text style={[styles.vsCell, { flex:2, color:'#555' }]}>RECURSO</Text>
                                    <Text style={[styles.vsCell, { color: ACCENT, fontWeight:'900' }]}>ELITE FIT</Text>
                                    <Text style={[styles.vsCell, { color:'#555' }]}>MFIT</Text>
                                    <Text style={[styles.vsCell, { color:'#555' }]}>Nutrium</Text>
                                    <Text style={[styles.vsCell, { color:'#555' }]}>Dietbox</Text>
                                </View>
                                {[
                                    ['Avaliação com IA + foto',    true,  false, false, false],
                                    ['Check-in sem WhatsApp',      true,  false, false, false],
                                    ['Módulo de treinos',          true,  true,  false, false],
                                    ['Módulo de dietas',           true,  false, true,  true ],
                                    ['Financeiro integrado',       true,  true,  false, false],
                                    ['Página de vendas própria',   true,  true,  false, false],
                                    ['White-label (sua logo)',     true,  false, false, true ],
                                    ['Alunos ilimitados',          true,  false, false, false],
                                ].map(([label, ef, mf, nu, db]) => (
                                    <View key={label} style={[styles.vsRow, { borderTopWidth:1, borderTopColor:'#1a1a1a' }]}>
                                        <Text style={[styles.vsCell, { flex:2, color:'#aaa', fontSize:12, textAlign: 'left', paddingLeft: 20 }]}>{label}</Text>
                                        {[ef, mf, nu, db].map((v, i) => (
                                            <View key={i} style={[styles.vsCell, { alignItems:'center' }]}>
                                                <MaterialCommunityIcons
                                                    name={v ? 'check-circle' : 'close-circle'}
                                                    size={18}
                                                    color={v ? (i === 0 ? ACCENT : '#555') : '#333'}
                                                />
                                            </View>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    </Section>

                    {/* ── PLANOS ───────────────────────────────────────────── */}
                    <Section onLayout={(e) => setPlansSectionY(e.nativeEvent.layout.y)}>
                        <SectionTitle center>Escolha seu <Text style={{ color:ACCENT }}>plano</Text></SectionTitle>
                        <Text style={[styles.sectionSub, { textAlign:'center', marginBottom: 20 }]}>
                            Comece com o que você precisa. Faça upgrade a qualquer momento.
                        </Text>

                        {!isWide && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, opacity: 0.6 }}>
                                <MaterialCommunityIcons name="gesture-swipe-horizontal" size={20} color="#fff" />
                                <Text style={{ color: '#fff', fontSize: 12, marginLeft: 8 }}>Deslize para ver os planos</Text>
                            </View>
                        )}

                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: isWide ? 0 : 10 }}
                            style={{ width: '100%' }}
                        >
                            {PLANS.map((plan, i) => (
                                <FadeIn 
                                    key={plan.key} 
                                    delay={i * 100} 
                                    style={{ width: 320, marginRight: i === PLANS.length - 1 ? 0 : 20, marginBottom: 20 }}
                                >
                                    <TouchableOpacity
                                        style={[
                                            styles.planCard,
                                            { borderColor: plan.highlight ? plan.color : '#222' },
                                            { borderWidth: plan.highlight ? 2 : 1 }
                                        ]}
                                        onPress={() => handlePlanChoice(plan.key)}
                                        activeOpacity={0.85}
                                    >
                                        {plan.highlight && (
                                            <View style={[styles.planBadge, { backgroundColor: plan.color }]}>
                                                <Text style={{ color:'#000', fontSize:10, fontWeight:'900' }}>MAIS COMPLETO</Text>
                                            </View>
                                        )}
                                        <View style={[styles.planIconBox, { backgroundColor: plan.color + '18' }]}>
                                            <MaterialCommunityIcons name={plan.icon} size={32} color={plan.color} />
                                        </View>
                                        <Text style={[styles.planTitle, { color: plan.color }]}>{plan.title}</Text>
                                        <Text style={styles.planSub}>{plan.subtitle}</Text>
                                        <View style={{ flexDirection:'row', alignItems:'flex-end', marginTop:16, marginBottom: 20 }}>
                                            <Text style={{ color:'#fff', fontWeight:'900', fontSize:36, marginRight: 2, lineHeight: 40 }}>{plan.price}</Text>
                                            <Text style={{ color:'#555', fontSize:14, marginBottom:6 }}>{plan.period}</Text>
                                        </View>
                                        <View style={{ marginBottom:24, flex: 1 }}>
                                            {plan.features.map(f => (
                                                <FeatureCheck key={f} text={f} color={plan.color} />
                                            ))}
                                        </View>
                                        <TouchableOpacity
                                            style={[styles.planCTA, { backgroundColor: plan.color }]}
                                            onPress={() => handlePlanChoice(plan.key)}
                                        >
                                            <Text style={{ color:'#000', fontWeight:'900', fontSize:14 }}>
                                                QUERO ESTE PLANO
                                            </Text>
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                </FadeIn>
                            ))}
                        </ScrollView>

                        {/* Promoção lançamento */}
                        <View style={[styles.promoCard, { borderColor: GOLD + '40', backgroundColor: GOLD + '08' }]}>
                            <MaterialCommunityIcons name="fire" size={24} color={GOLD} style={{ marginRight: 14 }} />
                            <View style={{ flex:1 }}>
                                <Text style={{ color: GOLD, fontWeight:'900', fontSize:15, marginBottom: 4 }}>Oferta de lançamento</Text>
                                <Text style={{ color:'#aaa', fontSize:13, lineHeight:20 }}>
                                    Os primeiros 10 coaches pagam apenas <Text style={{ color:GOLD, fontWeight:'900' }}>R$69,90/mês</Text> (Personal/Nutri) ou <Text style={{ color:GOLD, fontWeight:'900' }}>R$109,90/mês</Text> (Elite) pelos primeiros 3 meses. Vagas limitadas!
                                </Text>
                            </View>
                        </View>
                    </Section>

                    {/* ── COMO FUNCIONA ────────────────────────────────────── */}
                    <Section style={{ backgroundColor:'#0d0d0d' }}>
                        <SectionTitle center>Como <Text style={{ color:ACCENT }}>funciona</Text></SectionTitle>
                        
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 20 }}>
                            {STEPS.map((step, i) => (
                                <FadeIn 
                                    key={step.num} 
                                    delay={i * 120} 
                                    style={{ width: isWide ? '31%' : '100%', marginBottom: 20 }}
                                >
                                    <View style={styles.stepCard}>
                                        <View style={[styles.stepNum, { borderColor: ACCENT + '40' }]}>
                                            <Text style={{ color: ACCENT, fontWeight:'900', fontSize:18 }}>{step.num}</Text>
                                        </View>
                                        <MaterialCommunityIcons name={step.icon} size={32} color={ACCENT} style={{ marginVertical:14 }} />
                                        <Text style={styles.stepTitle}>{step.title}</Text>
                                        <Text style={styles.stepDesc}>{step.desc}</Text>
                                        {i < STEPS.length - 1 && isWide && (
                                            <MaterialCommunityIcons name="arrow-right" size={24} color="#333" style={styles.stepArrow} />
                                        )}
                                    </View>
                                </FadeIn>
                            ))}
                        </View>
                    </Section>

                    {/* ── DEPOIMENTOS ──────────────────────────────────────── */}
                    <Section>
                        <SectionTitle center>O que dizem os <Text style={{ color:ACCENT }}>coaches</Text></SectionTitle>
                        
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 20 }}>
                            {TESTIMONIALS.map((t, i) => (
                                <FadeIn 
                                    key={t.name} 
                                    delay={i * 100} 
                                    style={{ width: isWide ? '31%' : '100%', marginBottom: 20 }}
                                >
                                    <View style={styles.testimonialCard}>
                                        <MaterialCommunityIcons name="format-quote-open" size={28} color={ACCENT + '60'} />
                                        <Text style={styles.testimonialText}>{t.text}</Text>
                                        <View style={{ flexDirection:'row', alignItems:'center', marginTop:16 }}>
                                            <View style={[styles.testimonialAvatar, { backgroundColor: ACCENT + '20', marginRight: 12 }]}>
                                                <MaterialCommunityIcons name="account" size={20} color={ACCENT} />
                                            </View>
                                            <View>
                                                <Text style={{ color:'#fff', fontWeight:'900', fontSize:14 }}>{t.name}</Text>
                                                <Text style={{ color:'#555', fontSize:12, marginTop: 2 }}>{t.role}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </FadeIn>
                            ))}
                        </View>
                    </Section>

                    {/* ── FAQ ──────────────────────────────────────────────── */}
                    <Section style={{ backgroundColor:'#0d0d0d' }}>
                        <SectionTitle center>Perguntas <Text style={{ color:ACCENT }}>frequentes</Text></SectionTitle>
                        <View style={{ marginTop: 20 }}>
                            {FAQ.map((item, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.faqItem, { borderColor: openFaq === i ? ACCENT + '40' : '#1a1a1a' }]}
                                    onPress={() => setOpenFaq(openFaq === i ? null : i)}
                                    activeOpacity={0.8}
                                >
                                    <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
                                        <Text style={[styles.faqQ, { flex:1, paddingRight:12 }]}>{item.q}</Text>
                                        <MaterialCommunityIcons
                                            name={openFaq === i ? 'chevron-up' : 'chevron-down'}
                                            size={22}
                                            color={openFaq === i ? ACCENT : '#555'}
                                        />
                                    </View>
                                    {openFaq === i && (
                                        <Text style={styles.faqA}>{item.a}</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Section>

                    {/* ── CTA FINAL ────────────────────────────────────────── */}
                    <LinearGradient colors={[DARK, '#0f1a0a']} style={styles.ctaFinal}>
                        <FadeIn style={{ alignItems: 'center' }}>
                            <MaterialCommunityIcons name="trophy" size={56} color={ACCENT} style={{ marginBottom:20 }} />
                            <Text style={[styles.heroTitle, { textAlign:'center' }]}>
                                Pronto para <Text style={{ color:ACCENT }}>começar?</Text>
                            </Text>
                            <Text style={[styles.sectionSub, { textAlign:'center', maxWidth: 400 }]}>
                                Faça seu cadastro agora e receba aprovação em até 24 horas.
                            </Text>
                            <View style={{ marginTop:30, width: '100%', maxWidth: 360 }}>
                                <TouchableOpacity
                                    style={[styles.heroCTA, { backgroundColor: ACCENT, marginBottom: 16 }]}
                                    onPress={scrollToPlans}
                                >
                                    <Text style={{ color:'#000', fontWeight:'900', fontSize:16, marginRight: 8 }}>FAZER CADASTRO AGORA</Text>
                                    <MaterialCommunityIcons name="arrow-up" size={20} color="#000" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.heroCTA, { backgroundColor:'transparent', borderWidth:1, borderColor:'#25D366' }]}
                                    onPress={handleWhatsApp}
                                >
                                    <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" style={{ marginRight: 8 }} />
                                    <Text style={{ color:'#25D366', fontWeight:'900', fontSize:14 }}>FALAR COM A EQUIPE</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={{ color:'#444', fontSize:12, textAlign:'center', marginTop:20 }}>
                                Sem fidelidade · Cancele quando quiser · Suporte humano
                            </Text>
                        </FadeIn>
                    </LinearGradient>

                </View>
            </ScrollView>
        </View>
    );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    hero:              { padding:32, alignItems:'center', paddingBottom:60 },
    heroLogo:          { width:240, height:88, marginBottom:24 },
    heroBadge:         { flexDirection:'row', alignItems:'center', backgroundColor:'#8BC34A18', borderWidth:1, borderColor:'#8BC34A40', paddingHorizontal:16, paddingVertical:8, borderRadius:24, marginBottom:24 },
    heroTitle:         { color:'#fff', fontSize:36, fontWeight:'900', textAlign:'center', lineHeight:44, marginBottom:16 },
    heroSubtitle:      { color:'#888', fontSize:16, textAlign:'center', lineHeight:26, marginBottom:32, maxWidth: 600 },
    heroStats:         { backgroundColor:'#111', borderRadius:16, borderWidth:1, borderColor:'#1a1a1a', overflow:'hidden', marginBottom: 32 },
    heroStat:          { flex:1, alignItems:'center', paddingVertical:16, paddingHorizontal: 20, borderRightWidth:1, borderRightColor:'#1a1a1a' },
    heroCTA:           { flexDirection:'row', alignItems:'center', justifyContent:'center', paddingVertical:18, paddingHorizontal:32, borderRadius:16, width:'100%' },
    
    sectionTitle:      { color:'#fff', fontSize:28, fontWeight:'900', marginBottom:10, lineHeight:36 },
    sectionSub:        { color:'#888', fontSize:15, lineHeight:24, marginBottom:32 },
    
    diferencialCard:   { backgroundColor:'#111', borderRadius:20, borderWidth:1, borderColor:'#1a1a1a', padding:24, flex: 1 },
    diferencialIcon:   { width:56, height:56, borderRadius:16, alignItems:'center', justifyContent:'center', marginBottom:16 },
    diferencialTitle:  { color:'#fff', fontWeight:'900', fontSize:16, marginBottom:8 },
    diferencialDesc:   { color:'#777', fontSize:14, lineHeight:22 },
    
    vsTable:           { borderRadius:20, borderWidth:1, overflow:'hidden' },
    vsRow:             { flexDirection:'row', alignItems:'center' },
    vsCell:            { flex:1, padding:16, color:'#aaa', fontSize:12, fontWeight:'700', textAlign:'center' },
    
    planCard:          { backgroundColor:'#111', borderRadius:24, padding:28, position:'relative', display: 'flex', flexDirection: 'column', height: '100%' },
    planBadge:         { position:'absolute', top:-1, right:24, paddingHorizontal:12, paddingVertical:6, borderBottomLeftRadius:8, borderBottomRightRadius:8 },
    planIconBox:       { width:64, height:64, borderRadius:20, alignItems:'center', justifyContent:'center', marginBottom:16 },
    planTitle:         { fontSize:22, fontWeight:'900', marginBottom:4 },
    planSub:           { color:'#777', fontSize:14, marginBottom:8 },
    planCTA:           { padding:16, borderRadius:14, alignItems:'center', marginTop: 'auto' },
    promoCard:         { flexDirection:'row', alignItems:'flex-start', padding:20, borderRadius:20, borderWidth:1, marginTop:24 },
    
    stepCard:          { backgroundColor:'#111', borderRadius:20, borderWidth:1, borderColor:'#1a1a1a', padding:28, alignItems:'center', position:'relative', flex: 1 },
    stepNum:           { width:56, height:56, borderRadius:28, borderWidth:1, alignItems:'center', justifyContent:'center', marginBottom:8 },
    stepTitle:         { color:'#fff', fontWeight:'900', fontSize:17, textAlign:'center', marginBottom:8 },
    stepDesc:          { color:'#777', fontSize:14, textAlign:'center', lineHeight:22 },
    stepArrow:         { position:'absolute', right:-26, top:'50%' },
    
    testimonialCard:   { backgroundColor:'#111', borderRadius:20, borderWidth:1, borderColor:'#1a1a1a', padding:24, flex: 1, justifyContent: 'space-between' },
    testimonialText:   { color:'#aaa', fontSize:14, lineHeight:24, marginTop:12, fontStyle:'italic' },
    testimonialAvatar: { width:44, height:44, borderRadius:22, alignItems:'center', justifyContent:'center' },
    
    faqItem:           { borderWidth:1, borderRadius:16, padding:20, marginBottom:12, backgroundColor: '#111' },
    faqQ:              { color:'#fff', fontWeight:'900', fontSize:15 },
    faqA:              { color:'#888', fontSize:14, lineHeight:22, marginTop:12 },
    
    ctaFinal:          { paddingHorizontal: 32, paddingVertical: 60, alignItems:'center' },
});