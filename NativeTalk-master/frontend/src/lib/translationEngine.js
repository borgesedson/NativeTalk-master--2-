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
            console.error(`[TranslationEngine] Erro ao carregar modelo ${modelName}:`, error);
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

    async startBackgroundDownload() {
        console.log('[TranslationEngine] Iniciando download em segundo plano sequencial para idiomas prioritários...');
        
        const priorityPairs = [
            { from: 'en', to: 'pt' },
            { from: 'pt', to: 'en' },
            { from: 'en', to: 'es' },
            { from: 'en', to: 'fr' },
            { from: 'en', to: 'it' }
        ];

        for (const pair of priorityPairs) {
            try {
                // Check if already loaded to avoid redundant logs
                const key = `${pair.from}-${pair.to}`;
                if (this.pipelines[key]) continue;

                console.log(`[TranslationEngine] Background download: ${pair.from}-${pair.to}`);
                await this.getPipeline(pair.from, pair.to);
                
                // Wait 2 seconds between models to allow main thread to breathe
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (err) {
                console.error(`[TranslationEngine] Falha no download em background para ${pair.from}-${pair.to}:`, err);
            }
        }
        console.log('[TranslationEngine] Todos os downloads prioritários concluídos ou em cache.');
    }
}

export const translationEngine = new TranslationEngine();
export default translationEngine;
