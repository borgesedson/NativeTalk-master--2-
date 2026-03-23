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

    // Usar transcrição do frontend (Web Speech API) ou transcrever via AI
    let originalTranscription = transcription || '';

    // Se não há transcrição do frontend, tentar transcrever via AI
    if (!transcription || transcription.startsWith('🎤')) {
      const base64Data = audioData.includes(',') ? audioData.split(',')[1] : audioData;

      // 1. Tentar Azure Speech (se configurado)
      if (process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_KEY !== 'SUA_CHAVE_1_AQUI') {
        console.log(`🎤 Tentando Azure Speech em ${senderLangCode}...`);
        try {
          const audioBuffer = Buffer.from(base64Data, 'base64');
          const speechLangCode = getSpeechLanguageCode(senderLangCode);
          originalTranscription = await transcribeAudio(audioBuffer, speechLangCode);
          console.log(`✅ Azure Speech result: "${originalTranscription}"`);
        } catch (error) {
          console.error('❌ Erro Azure:', error.message);
        }
      } 
      
      // 2. Se Azure falhou ou não está configurado, tentar Whisper VPS (Local)
      if (!originalTranscription || originalTranscription.startsWith('🎤')) {
        const whisperUrl = process.env.WHISPER_API_URL || 'http://127.0.0.1:5001/stt-and-translate';
        console.log(`🎤 Tentando Whisper VPS em ${whisperUrl}...`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout

        try {
          const response = await fetch(whisperUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              audio: base64Data,
              from: senderLangCode,
              to: receiverLangCode 
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeout);
          
          if (response.ok) {
            const data = await response.json();
            originalTranscription = data.transcript || data.text || '';
            console.log(`✅ Whisper VPS result: "${originalTranscription}"`);
          }
        } catch (error) {
          clearTimeout(timeout);
          console.error('❌ Erro Whisper VPS:', error.message === 'The user aborted a request.' ? 'Timeout (45s)' : error.message);
        }
      }

      // 3. Fallback final se tudo falhar
      if (!originalTranscription) {
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
