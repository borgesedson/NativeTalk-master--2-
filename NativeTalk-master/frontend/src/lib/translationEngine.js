import { pipeline, env } from '@xenova/transformers';

// Configurar para usar cache do navegador (IndexedDB)
env.allowLocalModels = false;
env.useBrowserCache = true;

class TranslationEngine {
    constructor() {
        this.pipelines = {};
        this.loading = {};
        this.isReady = false;
        this.onReadyCallbacks = [];
    }

    getModelName(from, to) {
        const MODELS = {
            // Portuguese (Brazil) pairs
            'pt-en': 'Xenova/opus-mt-ROMANCE-en',
            'en-pt': 'Xenova/opus-mt-en-ROMANCE',
            'pt-es': 'Xenova/opus-mt-ROMANCE-en',
            'es-pt': 'Xenova/opus-mt-en-ROMANCE',
            'pt-fr': 'Xenova/opus-mt-ROMANCE-en',
            'fr-pt': 'Xenova/opus-mt-en-ROMANCE',
            'pt-it': 'Xenova/opus-mt-ROMANCE-en',
            'it-pt': 'Xenova/opus-mt-en-ROMANCE',

            // English pairs (most important — pivot language)
            'en-es': 'Xenova/opus-mt-en-ROMANCE',
            'en-fr': 'Xenova/opus-mt-en-ROMANCE',
            'en-it': 'Xenova/opus-mt-en-ROMANCE',
            'en-ja': 'Xenova/opus-mt-en-jap',
            'en-zh': 'Xenova/opus-mt-en-zh',
            'en-ko': 'Xenova/opus-mt-en-ko',
            'en-ar': 'Xenova/opus-mt-en-ar',
            'en-ru': 'Xenova/opus-mt-en-ru',
            'en-de': 'Xenova/opus-mt-en-de',
            'en-hi': 'Xenova/opus-mt-en-hi',

            // Major Asian languages
            'ja-en': 'Xenova/opus-mt-ja-en',
            'zh-en': 'Xenova/opus-mt-zh-en',
            'ko-en': 'Xenova/opus-mt-ko-en',
        };

        const key = `${from}-${to}`;
        return MODELS[key] || null;
    }

    async getPipeline(from, to) {
        const modelName = this.getModelName(from, to);
        if (!modelName) return null;

        const key = `${from}-${to}`;
        if (this.pipelines[key]) return this.pipelines[key];
        if (this.loading[key]) return this.loading[key];

        console.log(`[TranslationEngine] Carregando modelo: ${modelName}`);
        this.loading[key] = pipeline('translation', modelName, {
            progress_callback: (child) => {
                if (child.status === 'done') {
                    console.log(`[TranslationEngine] Modelo ${modelName} carregado com sucesso.`);
                    if (Object.keys(this.pipelines).length >= 1) {
                        this.setReady(true);
                    }
                }
            }
        });

        try {
            this.pipelines[key] = await this.loading[key];
            delete this.loading[key];
            return this.pipelines[key];
        } catch (error) {
            // Silenciar erros de rede comuns para não travar a UI ou poluir o console excessivamente
            if (error instanceof TypeError && error.message.includes('fetch')) {
                console.warn(`[TranslationEngine] Modelo ${modelName} não pôde ser baixado (provavelmente offline ou bloqueado por CSP).`);
            } else {
                console.error(`[TranslationEngine] Erro ao carregar modelo ${modelName}:`, error);
            }
            delete this.loading[key];
            return null;
        }
    }

    async translate(text, from, to) {
        try {
            const translator = await this.getPipeline(from, to);
            if (!translator) return null;

            const output = await translator(text, {
                src_lang: from,
                tgt_lang: to,
            });

            return output[0].translation_text;
        } catch (error) {
            console.error('[TranslationEngine] Erro na tradução:', error);
            return null;
        }
    }

    setReady(status) {
        this.isReady = status;
        if (status) {
            this.onReadyCallbacks.forEach(cb => cb());
            this.onReadyCallbacks = [];
        }
    }

    onReady(callback) {
        if (this.isReady) {
            callback();
        } else {
            this.onReadyCallbacks.push(callback);
        }
    }

    async startBackgroundDownload(userLanguage = 'pt') {
        console.log(`[TranslationEngine] Iniciando download inteligente para idioma prioritário: ${userLanguage}`);
        
        // Apenas o par principal do usuário + inglês para evitar sobrecarga
        const priorityPairs = [];
        const lang = getLanguageCode(userLanguage);
        
        if (lang !== 'en') {
            priorityPairs.push({ from: 'en', to: lang });
            priorityPairs.push({ from: lang, to: 'en' });
        } else {
            // Se for inglês, baixa apenas um par comum como teste/cache
            priorityPairs.push({ from: 'en', to: 'pt' });
            priorityPairs.push({ from: 'pt', to: 'en' });
        }

        for (const pair of priorityPairs) {
            try {
                const key = `${pair.from}-${pair.to}`;
                if (this.pipelines[key]) continue;

                console.log(`[TranslationEngine] Background download: ${pair.from}-${pair.to}`);
                await this.getPipeline(pair.from, pair.to);
                
                // Espera 5 segundos entre modelos para não matar a CPU
                await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (err) {
                console.error(`[TranslationEngine] Falha no download em background para ${pair.from}-${pair.to}:`, err);
            }
        }
        console.log('[TranslationEngine] Downloads prioritários finalizados.');
    }

    // Helper interno se não estiver importado
    _getLanguageCode(lang) {
        if (!lang) return 'en';
        if (lang.includes('-')) return lang.split('-')[0].toLowerCase();
        return lang.toLowerCase();
    }

    async getSTTPipeline() {
        if (this.sttPipeline) return this.sttPipeline;
        if (this.loadingSTT) return this.loadingSTT;

        const modelName = 'Xenova/whisper-tiny';
        console.log(`[TranslationEngine] Carregando modelo STT: ${modelName}`);
        this.loadingSTT = pipeline('automatic-speech-recognition', modelName, {
            progress_callback: (child) => {
                if (child.status === 'done') {
                    console.log(`[TranslationEngine] Modelo STT carregado.`);
                }
            }
        });

        try {
            this.sttPipeline = await this.loadingSTT;
            delete this.loadingSTT;
            return this.sttPipeline;
        } catch (error) {
            console.error('[TranslationEngine] Erro ao carregar STT:', error);
            delete this.loadingSTT;
            return null;
        }
    }

    async transcribe(audioData) {
        try {
            const transcriber = await this.getSTTPipeline();
            if (!transcriber) return null;

            console.log('[TranslationEngine] Transcrevendo áudio localmente...');
            const output = await transcriber(audioData, {
                chunk_length_s: 30,
                stride_length_s: 5,
                language: 'portuguese',
                task: 'transcribe',
                return_timestamps: false
            });

            return output.text || '';
        } catch (error) {
            console.error('[TranslationEngine] Erro na transcrição local:', error);
            return null;
        }
    }
}

export const translationEngine = new TranslationEngine();
export default translationEngine;
