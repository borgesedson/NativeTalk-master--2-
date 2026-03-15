import sdk from 'microsoft-cognitiveservices-speech-sdk';

const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION;

/**
 * Transcreve áudio para texto usando Azure Speech Service
 * @param {Buffer} audioBuffer - Buffer do áudio (WAV, MP3, etc)
 * @param {string} language - Código do idioma (ex: 'pt-BR', 'en-US', 'ja-JP')
 * @returns {Promise<string>} - Texto transcrito
 */
export async function transcribeAudio(audioBuffer, language = 'en-US') {
  if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
    console.warn('⚠️ Azure Speech não configurado. Use Web Speech API no frontend.');
    throw new Error('Azure Speech credentials not configured. Please use Web Speech API on the frontend.');
  }

  return new Promise((resolve, reject) => {
    try {
      // Configuração do Speech SDK
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        AZURE_SPEECH_KEY,
        AZURE_SPEECH_REGION
      );
      speechConfig.speechRecognitionLanguage = language;

      // Criar stream de áudio do buffer
      const pushStream = sdk.AudioInputStream.createPushStream();
      pushStream.write(audioBuffer);
      pushStream.close();

      const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
      const recognizer = sdk.SpeechRecognizer.FromConfig(speechConfig, audioConfig);

      let fullTranscription = '';

      // Event: reconhecimento em andamento
      recognizer.recognizing = (s, e) => {
        console.log(`🎤 Reconhecendo: ${e.result.text}`);
      };

      // Event: reconhecimento completo de uma frase
      recognizer.recognized = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
          console.log(`✅ Reconhecido: ${e.result.text}`);
          fullTranscription += e.result.text + ' ';
        } else if (e.result.reason === sdk.ResultReason.NoMatch) {
          console.log('⚠️ Nenhuma fala detectada');
        }
      };

      // Event: erro
      recognizer.canceled = (s, e) => {
        console.error(`❌ Erro na transcrição: ${e.errorDetails}`);
        recognizer.stopContinuousRecognitionAsync();
        reject(new Error(e.errorDetails));
      };

      // Event: sessão encerrada
      recognizer.sessionStopped = (s, e) => {
        console.log('🛑 Sessão de reconhecimento encerrada');
        recognizer.stopContinuousRecognitionAsync();
        resolve(fullTranscription.trim());
      };

      // Iniciar reconhecimento contínuo
      recognizer.startContinuousRecognitionAsync(
        () => {
          console.log('🎙️ Reconhecimento iniciado');
        },
        (err) => {
          console.error('❌ Erro ao iniciar reconhecimento:', err);
          reject(err);
        }
      );

      // Parar após alguns segundos (ajuste conforme necessário)
      setTimeout(() => {
        recognizer.stopContinuousRecognitionAsync();
      }, 30000); // 30 segundos
    } catch (error) {
      console.error('❌ Erro geral na transcrição:', error);
      reject(error);
    }
  });
}

/**
 * Transcreve áudio de um arquivo
 * @param {string} audioFilePath - Caminho do arquivo de áudio
 * @param {string} language - Código do idioma
 * @returns {Promise<string>} - Texto transcrito
 */
export async function transcribeAudioFile(audioFilePath, language = 'en-US') {
  if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
    throw new Error('Azure Speech credentials not configured');
  }

  return new Promise((resolve, reject) => {
    try {
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        AZURE_SPEECH_KEY,
        AZURE_SPEECH_REGION
      );
      speechConfig.speechRecognitionLanguage = language;

      const audioConfig = sdk.AudioConfig.fromWavFileInput(audioFilePath);
      const recognizer = sdk.SpeechRecognizer.FromConfig(speechConfig, audioConfig);

      recognizer.recognizeOnceAsync(
        (result) => {
          if (result.reason === sdk.ResultReason.RecognizedSpeech) {
            console.log(`✅ Transcrição: ${result.text}`);
            resolve(result.text);
          } else {
            reject(new Error('No speech could be recognized'));
          }
          recognizer.close();
        },
        (err) => {
          console.error('❌ Erro:', err);
          recognizer.close();
          reject(err);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Mapeamento de idiomas do app para códigos do Azure Speech
 */
export const SPEECH_LANGUAGE_MAP = {
  'english': 'en-US',
  'portuguese': 'pt-BR',
  'spanish': 'es-ES',
  'french': 'fr-FR',
  'german': 'de-DE',
  'italian': 'it-IT',
  'russian': 'ru-RU',
  'chinese': 'zh-CN',
  'japanese': 'ja-JP',
  'korean': 'ko-KR',
  'arabic': 'ar-SA',
  'hindi': 'hi-IN',
  'dutch': 'nl-NL',
  'polish': 'pl-PL',
  'turkish': 'tr-TR',
  // Short codes
  'en': 'en-US',
  'pt': 'pt-BR',
  'es': 'es-ES',
  'fr': 'fr-FR',
  'de': 'de-DE',
  'it': 'it-IT',
  'ja': 'ja-JP',
  'zh': 'zh-CN',
  'ko': 'ko-KR',
};

/**
 * Converte nome do idioma para código Azure Speech
 */
export function getSpeechLanguageCode(languageName) {
  if (!languageName) return 'en-US';
  const normalized = languageName.toLowerCase().trim();
  return SPEECH_LANGUAGE_MAP[normalized] || 'en-US';
}
