// src/utils/cursoCertificadoUtils.js
// 🔥 CERTIFICADO DE CONCLUSÃO — gerado sob demanda quando o aluno termina
// todas as aulas de todos os módulos já desbloqueados do curso. Mesmo padrão
// de geração usado em treinoPdfUtils.js: expo-print + expo-sharing no
// nativo, window.print() na web.
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

// dados = { nomeCliente, produtoNome }
export async function generateCursoCertificadoPDF(dados) {
    try {
        const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        const nomeCliente = dados?.nomeCliente || 'Aluna';
        const produtoNome = dados?.produtoNome || 'Curso';

        const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Certificado – ${nomeCliente}</title>
<style>
@page { margin: 0; size: A4 landscape; }
* { margin:0; padding:0; box-sizing:border-box; }
body {
    font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;
    background:#0a0a0a; color:#e8e8e8;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
    width:100vw; height:100vh; display:flex; align-items:center; justify-content:center;
}
.moldura {
    width:94%; height:88%; border:2px solid #8B5CF6; border-radius:18px;
    display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;
    padding:40px; position:relative;
    background:linear-gradient(135deg,#0a0a0a 0%,#150f24 50%,#0a0a0a 100%);
}
.moldura::before {
    content:''; position:absolute; inset:12px; border:1px solid #2a2a2a; border-radius:12px;
}
.brand { font-size:11px; letter-spacing:4px; color:#8B5CF6; text-transform:uppercase; font-weight:700; margin-bottom:18px; }
.titulo { font-size:34px; font-weight:900; color:#fff; letter-spacing:1px; margin-bottom:6px; }
.subtitulo { font-size:13px; color:#999; margin-bottom:34px; }
.texto { font-size:14px; color:#ccc; line-height:1.8; max-width:640px; }
.nome { font-size:26px; font-weight:900; color:#4DE38F; margin:16px 0; }
.curso { font-size:18px; font-weight:900; color:#fff; margin-bottom:26px; }
.data { font-size:12px; color:#777; margin-top:20px; }
.rodape { position:absolute; bottom:34px; font-size:9px; color:#444; letter-spacing:1px; text-transform:uppercase; }
</style>
</head>
<body>

<div class="moldura">
    <div class="brand">ELITE FIT</div>
    <div class="titulo">CERTIFICADO DE CONCLUSÃO</div>
    <div class="subtitulo">Certificamos que</div>
    <div class="nome">${nomeCliente}</div>
    <div class="texto">concluiu com sucesso todos os módulos e aulas do curso</div>
    <div class="curso">${produtoNome}</div>
    <div class="data">Emitido em ${today}</div>
    <div class="rodape">ELITE FIT CONSULTORIA · pauloadrianoteam.com.br</div>
</div>

</body>
</html>`;

        if (Platform.OS === 'web') {
            const win = window.open('', '_blank', 'width=1000,height=720');
            win.document.write(htmlContent);
            win.document.close();
            setTimeout(() => win.print(), 1000);
        } else {
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: `Certificado - ${produtoNome} - ${nomeCliente}`,
                UTI: 'com.adobe.pdf',
            });
        }
    } catch (error) {
        console.error('Erro ao gerar certificado do curso:', error);
        Alert.alert('Erro', 'Não foi possível gerar o certificado. Tente novamente.');
    }
}
