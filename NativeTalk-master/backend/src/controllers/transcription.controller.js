import { transcribeAudio, getSpeechLanguageCode } from "../lib/transcription.js";
import { translateText, getLanguageCode } from "../lib/translation.js";


/**
 * Transcreve áudio e traduz para o idioma de cada participante
 * POST /api/transcription/transcribe
 * Body: { audioData: base64String, senderUserId: string, receiverUserId: string }
 */
export async function transcribeAudioMessage(req, res) {
  try {
    const { audioData, senderUserId, receiverUserId, transcription, testMode, from, to } = req.body;

    // Determine languages
    let senderLangCode = from || 'en';
    let receiverLangCode = to || 'en';

    // If languages aren't provided but IDs are, we'd ideally look them up in DB
    // For now, if sender is 'me' or matches current user, we can assume something, 
    // but better to just pass languages from frontend.

    console.log(`
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    🎤 TRADUÇÃO DE ÁUDIO:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    🗣️  Origem: ${senderLangCode} (User: ${senderUserId || 'N/A'})
    👂 Destino: ${receiverLangCode} (User: ${receiverUserId || 'N/A'})
    📝 Texto base: "${transcription || (audioData ? 'Áudio base64' : 'N/A')}"
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    // Usar transcrição do frontend (Web Speech API) ou transcrever via Azure
    let originalTranscription = transcription || '';

    // Se não há transcrição do frontend, tentar transcrever via Azure Speech
    if (!transcription || transcription.startsWith('🎤')) {
      if (audioData && process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_KEY !== 'SUA_CHAVE_1_AQUI') {
        console.log(`🎤 Sem transcrição. Tentando Azure Speech em ${senderLangCode}...`);
        try {
          const base64Data = audioData.includes(',') ? audioData.split(',')[1] : audioData;
          const audioBuffer = Buffer.from(base64Data, 'base64');
          const speechLangCode = getSpeechLanguageCode(senderLangCode);
          originalTranscription = await transcribeAudio(audioBuffer, speechLangCode);
          console.log(`✅ Azure Speech result: "${originalTranscription}"`);
        } catch (error) {
          console.error('❌ Erro Azure:', error.message);
          originalTranscription = transcription || '🎤 Mensagem de áudio';
        }
      } else if (audioData) {
        // Se temos áudio mas não Azure, talvez devêssemos usar o Whisper VPS?
        // O Whisper VPS está mapeado em server.js em /api/stt
        console.warn('⚠️  Azure Speech não configurado. Use /api/stt para Whisper.');
        originalTranscription = transcription || '🎤 Mensagem de áudio';
      } else {
        originalTranscription = transcription || '🎤 Mensagem de áudio';
      }
    }

    // Traduzir para o idioma do RECEPTOR
    let translatedTranscription = originalTranscription;

    if (senderLangCode !== receiverLangCode && !originalTranscription.startsWith('🎤')) {
      try {
        translatedTranscription = await translateText(
          originalTranscription,
          senderLangCode,
          receiverLangCode
        );
        console.log(`🌐 Traduzido de ${senderLangCode} para ${receiverLangCode}: "${translatedTranscription}"`);
      } catch (err) {
        console.error('❌ Erro tradução:', err.message);
      }
    }

    res.status(200).json({
      originalTranscription,
      translatedTranscription,
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
