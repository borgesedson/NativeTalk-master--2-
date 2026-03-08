import { transcribeAudio, getSpeechLanguageCode } from "../lib/transcription.js";
import { translateText, getLanguageCode } from "../lib/translation.js";


/**
 * Transcreve áudio e traduz para o idioma de cada participante
 * POST /api/transcription/transcribe
 * Body: { audioData: base64String, senderUserId: string, receiverUserId: string }
 */
export async function transcribeAudioMessage(req, res) {
  try {
    const { audioData, senderUserId, receiverUserId, transcription, testMode } = req.body;

    if (!senderUserId || !receiverUserId) {
      return res.status(400).json({
        message: "senderUserId and receiverUserId are required"
      });
    }

    // Modo de teste: retorna transcrição simulada
    if (testMode) {
      console.log("🧪 MODO DE TESTE - Transcrição simulada");
      return res.status(200).json({
        originalTranscription: "Test transcription in original language",
        translatedTranscription: "Transcrição de teste no idioma traduzido",
        originalLanguage: "en",
        targetLanguage: "pt",
        testMode: true,
      });
    }

    const senderLangCode = getLanguageCode('en');
    const receiverLangCode = getLanguageCode('en');

    console.log(`
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    🎤 TRADUÇÃO DE ÁUDIO:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    🗣️  Quem fala: ${senderUserId}
    👂 Quem ouve: ${receiverUserId}
    📝 Transcrição: "${transcription || 'Não fornecida'}"
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    // Usar transcrição do frontend (Web Speech API) ou transcrever via Azure
    let originalTranscription = transcription || '';

    // Se não há transcrição do frontend, tentar transcrever via Azure Speech
    if (!transcription || transcription.startsWith('🎤')) {
      if (audioData && process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_KEY !== 'SUA_CHAVE_1_AQUI') {
        console.log('🎤 Sem transcrição do frontend. Tentando Azure Speech...');
        try {
          // Converter base64 para buffer
          const base64Data = audioData.includes(',') ? audioData.split(',')[1] : audioData;
          const audioBuffer = Buffer.from(base64Data, 'base64');
          const speechLangCode = getSpeechLanguageCode('en');
          console.log(`[DEBUG] speechLangCode usado no Azure:`, speechLangCode);
          console.log(`🎤 Transcrevendo áudio ${audioBuffer.length} bytes em ${speechLangCode}...`);
          originalTranscription = await transcribeAudio(audioBuffer, speechLangCode);
          console.log(`[DEBUG] Resultado da transcrição Azure:`, originalTranscription);
        } catch (error) {
          console.error('❌ Erro ao transcrever com Azure:', error.message);
          console.warn('💡 Configure AZURE_SPEECH_KEY e AZURE_SPEECH_REGION para transcrição automática');
          originalTranscription = '🎤 Mensagem de áudio';
        }
      } else {
        if (!audioData) {
          console.log('⚠️  Sem transcrição e sem áudio para transcrever');
        } else {
          console.log('⚠️  Azure Speech não configurado. Configure AZURE_SPEECH_KEY e AZURE_SPEECH_REGION');
        }
        originalTranscription = '🎤 Mensagem de áudio';
      }

      // Se ainda não tem transcrição válida, retornar sem tradução
      if (originalTranscription.startsWith('🎤')) {
        return res.status(200).json({
          originalTranscription,
          translatedTranscription: originalTranscription,
          originalLanguage: senderLangCode,
          targetLanguage: receiverLangCode,
        });
      }
    }

    // Traduzir para o idioma do RECEPTOR
    let translatedTranscription = originalTranscription;

    if (senderLangCode !== receiverLangCode) {
      translatedTranscription = await translateText(
        originalTranscription,
        senderLangCode,
        receiverLangCode
      );
      console.log(`🌐 Traduzido para ${receiverLangCode}: "${translatedTranscription}"`);
    } else {
      console.log(`⚠️  Mesmo idioma, sem tradução necessária`);
    }

    res.status(200).json({
      originalTranscription,      // Para o sender ver (idioma original)
      translatedTranscription,     // Para o receiver ver (idioma dele)
      originalLanguage: senderLangCode,
      targetLanguage: receiverLangCode,
    });
  } catch (error) {
    console.error("❌ Erro ao transcrever/traduzir áudio:", error.message);
    res.status(500).json({
      message: "Error transcribing audio",
      error: error.message
    });
  }
}
