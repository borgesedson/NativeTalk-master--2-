const TRANSLATION_PROVIDER = process.env.TRANSLATION_PROVIDER || 'argos'; // argos | deepl | mymemory
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_ENDPOINT = 'https://api-free.deepl.com/v2/translate';
const ARGOS_ENDPOINT = process.env.ARGOS_API_URL || 'http://127.0.0.1:5000/translate';

// ============================================
// SISTEMA DE CACHE DE TRADUÇÕES
// ============================================
const translationCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
const MAX_CACHE_SIZE = 1000; // Máximo de traduções em cache

// Estatísticas de cache
let cacheStats = {
  hits: 0,
  misses: 0,
  savings: 0 // Economia em chamadas de API
};

/**
 * Gera chave única para o cache baseado no texto e idiomas
 */
function getCacheKey(text, source, target) {
  // Normaliza os idiomas para lowercase
  const normalizedSource = source.toLowerCase();
  const normalizedTarget = target.toLowerCase();
  // Cria hash simples do texto + idiomas
  return `${normalizedSource}:${normalizedTarget}:${text}`;
}

/**
 * Busca tradução no cache
 */
function getFromCache(text, source, target) {
  const key = getCacheKey(text, source, target);
  const cached = translationCache.get(key);

  if (!cached) {
    cacheStats.misses++;
    return null;
  }

  // Verifica se o cache expirou
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    translationCache.delete(key);
    cacheStats.misses++;
    console.log('⏰ Cache expirado para:', text.substring(0, 30));
    return null;
  }

  cacheStats.hits++;
  cacheStats.savings++;
  console.log(`💾 Cache HIT (${cacheStats.hits}/${cacheStats.hits + cacheStats.misses}) - Economia: ${cacheStats.savings} chamadas`);
  return cached.translation;
}

/**
 * Salva tradução no cache
 */
function saveToCache(text, source, target, translation) {
  // Limpa cache se atingir o limite
  if (translationCache.size >= MAX_CACHE_SIZE) {
    // Remove 20% das entradas mais antigas
    const entriesToRemove = Math.floor(MAX_CACHE_SIZE * 0.2);
    const entries = Array.from(translationCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    for (let i = 0; i < entriesToRemove; i++) {
      translationCache.delete(entries[i][0]);
    }
    console.log(`🧹 Cache limpo: ${entriesToRemove} entradas removidas`);
  }

  const key = getCacheKey(text, source, target);
  translationCache.set(key, {
    translation,
    timestamp: Date.now()
  });

  console.log(`💾 Tradução salva no cache (${translationCache.size}/${MAX_CACHE_SIZE})`);
}

/**
 * Obtém estatísticas do cache
 */
export function getCacheStats() {
  const total = cacheStats.hits + cacheStats.misses;
  const hitRate = total > 0 ? ((cacheStats.hits / total) * 100).toFixed(2) : 0;

  return {
    ...cacheStats,
    total,
    hitRate: `${hitRate}%`,
    cacheSize: translationCache.size,
    maxSize: MAX_CACHE_SIZE
  };
}

/**
 * Limpa todo o cache
 */
export function clearCache() {
  translationCache.clear();
  cacheStats = { hits: 0, misses: 0, savings: 0 };
  console.log('🧹 Cache completamente limpo');
}

// Mapeamento de códigos DeepL (usa uppercase e algumas variações)
const DEEPL_LANG_MAP = {
  'en': 'EN',
  'pt': 'PT-BR',  // DeepL usa PT-BR para português brasileiro
  'es': 'ES',
  'fr': 'FR',
  'de': 'DE',
  'it': 'IT',
  'ru': 'RU',
  'zh': 'ZH',
  'ja': 'JA',
  'pl': 'PL',
  'nl': 'NL',
  'cs': 'CS',
  'sv': 'SV',
  'da': 'DA',
  'fi': 'FI',
  'el': 'EL',
  'hu': 'HU',
  'id': 'ID',
  'ko': 'KO',
  'lt': 'LT',
  'lv': 'LV',
  'no': 'NB',
  'ro': 'RO',
  'sk': 'SK',
  'sl': 'SL',
  'tr': 'TR',
  'uk': 'UK',
  'bg': 'BG',
  'et': 'ET',
};

// Tradução via DeepL API
async function translateWithDeepL(text, source, target) {
  if (!DEEPL_API_KEY) {
    console.warn('⚠️ DEEPL_API_KEY não configurada no .env');
    return null;
  }

  try {
    // DeepL usa códigos em uppercase
    const sourceLang = DEEPL_LANG_MAP[source.toLowerCase()] || source.toUpperCase();
    const targetLang = DEEPL_LANG_MAP[target.toLowerCase()] || target.toUpperCase();

    console.log(`🔍 DeepL: source="${source}" -> "${sourceLang}" | target="${target}" -> "${targetLang}"`);

    // DeepL API usa form-urlencoded
    const params = new URLSearchParams({
      auth_key: DEEPL_API_KEY,
      text: text,
      target_lang: targetLang,
    });

    // Source é opcional; DeepL detecta automaticamente se omitido
    if (sourceLang && sourceLang !== 'AUTO') {
      params.append('source_lang', sourceLang);
    }

    const response = await fetch(DEEPL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      console.error(`❌ DeepL erro (status ${response.status}): ${bodyText}`);
      return null;
    }

    const data = await response.json();
    const translated = data?.translations?.[0]?.text;
    if (translated && typeof translated === 'string') {
      console.log(`✅ DeepL traduziu: "${text.substring(0, 30)}..." -> "${translated.substring(0, 30)}..."`);
      return translated;
    }
    return null;
  } catch (e) {
    console.warn('❌ DeepL error:', e.message);
    return null;
  }
}

// Provedor fallback (MyMemory) – sem necessidade de API key, limites de uso.
async function translateWithMyMemory(text, source, target) {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!resp.ok) {
      console.warn(`MyMemory status ${resp.status}`);
      return null;
    }
    const data = await resp.json();
    const translated = data?.responseData?.translatedText;
    if (translated && typeof translated === 'string') {
      console.log(`✅ MyMemory traduziu: "${text.substring(0, 30)}..." -> "${translated.substring(0, 30)}..."`);
      return translated;
    }
    return null;
  } catch (e) {
    console.warn('MyMemory error:', e.message);
    return null;
  }
}

// Provedor Argos Translate (Local VPS)
async function translateWithArgos(text, source, target) {
  try {
    console.log(`🔵 Tentando Argos: ${source} → ${target} em ${ARGOS_ENDPOINT}`);
    const response = await fetch(ARGOS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: source,
        target: target
      }),
    });

    if (!response.ok) {
      console.warn(`Argos status ${response.status}`);
      return null;
    }

    const data = await response.json();
    const translated = data?.translatedText || data?.translated;
    if (translated) {
      console.log(`✅ Argos traduziu: "${text.substring(0, 30)}..." -> "${translated.substring(0, 30)}..."`);
      return translated;
    }
    return null;
  } catch (e) {
    console.warn('Argos error:', e.message);
    return null;
  }
}

/**
 * Traduz um texto do idioma de origem para o idioma de destino
 * Usa a API pública do LibreTranslate (sem necessidade de API key)
 * @param {string} text - Texto a ser traduzido
 * @param {string} sourceLanguage - Código do idioma de origem (ex: 'en', 'pt', 'es')
 * @param {string} targetLanguage - Código do idioma de destino
 * @returns {Promise<string>} - Texto traduzido
 */
export async function translateText(text, sourceLanguage, targetLanguage) {
  // Normalizações de segurança
  if (!text || text.trim() === '') return text;
  if (!sourceLanguage) sourceLanguage = 'en';
  if (!targetLanguage) targetLanguage = 'en';
  sourceLanguage = sourceLanguage.trim().toLowerCase();
  targetLanguage = targetLanguage.trim().toLowerCase();

  // Se iguais, não traduz
  if (sourceLanguage === targetLanguage) return text;

  // ============================================
  // 1. VERIFICAR CACHE PRIMEIRO
  // ============================================
  const cachedTranslation = getFromCache(text, sourceLanguage, targetLanguage);
  if (cachedTranslation) {
    return cachedTranslation;
  }

  // Validação básica de código (2 letras). Se inválido, tentar detectar antes.
  const isValidCode = (code) => code && code.length === 2;
  if (!isValidCode(sourceLanguage)) {
    console.warn(`⚠️ Código origem inválido (${sourceLanguage}). Detectando idioma...`);
    sourceLanguage = await detectLanguage(text);
    console.log(`✅ Detectado origem: ${sourceLanguage}`);
  }
  if (!isValidCode(targetLanguage)) {
    console.warn(`⚠️ Código destino inválido (${targetLanguage}). Usando 'en'.`);
    targetLanguage = 'en';
  }

  const buildPayload = () => ({
    q: text,
    source: sourceLanguage,
    target: targetLanguage,
    format: 'text'
  });

  // Estratégia: Provedor configurado → Fallback (MyMemory)
  try {
    let translated = null;

    // 2. Tentar Provedor Principal (Argos ou DeepL)
    if (TRANSLATION_PROVIDER === 'argos') {
      translated = await translateWithArgos(text, sourceLanguage, targetLanguage);
    } else if (TRANSLATION_PROVIDER === 'deepl') {
      console.log(`🔵 Tentando DeepL: ${sourceLanguage} → ${targetLanguage}`);
      translated = await translateWithDeepL(text, sourceLanguage, targetLanguage);
    }

    if (translated) {
      saveToCache(text, sourceLanguage, targetLanguage, translated);
      return translated;
    }

    // 3. Fallback para MyMemory (se o principal falhar)
    console.log(`🌐 Tentando MyMemory como fallback...`);
    translated = await translateWithMyMemory(text, sourceLanguage, targetLanguage);
    if (translated) {
      saveToCache(text, sourceLanguage, targetLanguage, translated);
      return translated;
    }

    // 4. Fallback final para Argos (se não for o principal e configurado)
    if (TRANSLATION_PROVIDER !== 'argos') {
        console.log(`🌐 Tentando Argos como último recurso...`);
        translated = await translateWithArgos(text, sourceLanguage, targetLanguage);
        if (translated) {
            saveToCache(text, sourceLanguage, targetLanguage, translated);
            return translated;
        }
    }

    // 4. Se tudo falhar, retorna texto original
    console.warn('⚠️ Todos os provedores falharam. Retornando texto original.');
    return text;
  } catch (err) {
    console.error(`💥 Erro geral na tradução: ${err.message}`);
    return text;
  }
}

/**
 * Detecta automaticamente o idioma de um texto
 * @param {string} text - Texto para detectar o idioma
 * @returns {Promise<string>} - Código do idioma detectado
 */
export async function detectLanguage(text) {
  try {
    if (!text || text.trim() === '') {
      return 'en'; // idioma padrão
    }

    // DeepL não tem endpoint de detecção; usa 'auto' como source
    // Para simplificar, retornamos 'auto' que será aceito pelos provedores
    console.log('ℹ️ Usando detecção automática (source=auto)');
    return 'auto';
  } catch (error) {
    console.error('Error detecting language:', error.message);
    return 'en'; // idioma padrão em caso de erro
  }
}

/**
 * Mapeia nomes de idiomas para códigos ISO 639-1
 */
export const LANGUAGE_CODES = {
  'english': 'en',
  'portuguese': 'pt',
  'spanish': 'es',
  'french': 'fr',
  'german': 'de',
  'italian': 'it',
  'russian': 'ru',
  'chinese': 'zh',
  'mandarin': 'zh',
  'japanese': 'ja',
  'korean': 'ko',
  'arabic': 'ar',
  'hindi': 'hi',
  'dutch': 'nl',
  'polish': 'pl',
  'turkish': 'tr',
  'vietnamese': 'vi',
  'thai': 'th',
  'indonesian': 'id',
  'greek': 'el',
  'czech': 'cs',
  'swedish': 'sv',
  'danish': 'da',
  'finnish': 'fi',
  'norwegian': 'no',
  'ukrainian': 'uk',
  'hebrew': 'he',
};

/**
 * Converte nome do idioma para código
 * @param {string} languageName - Nome do idioma (ex: 'english', 'portuguese')
 * @returns {string} - Código do idioma (ex: 'en', 'pt')
 */
export function getLanguageCode(languageName) {
  if (!languageName) return 'en';
  const normalized = languageName.toLowerCase().trim();

  // Se já for um código de 2 letras, retorna direto
  if (normalized.length === 2) {
    return normalized;
  }

  // Busca no mapa de códigos
  const code = LANGUAGE_CODES[normalized];

  console.log(`getLanguageCode: "${languageName}" -> "${code || normalized}"`);

  return code || normalized;
}
