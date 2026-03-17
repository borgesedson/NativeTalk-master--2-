export const capitialize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Converte caminhos de imagem relativos para URLs completas
 */
export const getImageUrl = (path) => {
  if (!path || typeof path !== 'string' || path.trim() === '') return null;

  if (path.startsWith('http') || path.startsWith('//')) {
    return path;
  }

  if (path.startsWith('/uploads')) {
    return path;
  }

  return path;
};

/**
 * Retorna URL do avatar com fallback DiceBear
 */
export const getAvatarUrl = (avatarUrl, name = 'User') => {
  const url = getImageUrl(avatarUrl);
  if (url) return url;
  const safeName = (typeof name === 'string' ? name : 'User');
  const seed = encodeURIComponent(safeName.toLowerCase().replace(/\s+/g, '-'));
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&size=128`;
};

/**
 * Mapeia nomes de idiomas para códigos ISO 639-1
 */
const LANGUAGE_CODES = {
  'english': 'en',
  'portuguese': 'pt',
  'português': 'pt',
  'spanish': 'es',
  'español': 'es',
  'french': 'fr',
  'français': 'fr',
  'german': 'de',
  'alemão': 'de',
  'deutsch': 'de',
  'italian': 'it',
  'italiano': 'it',
  'russian': 'ru',
  'chinese': 'zh',
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
 * Converte nome do idioma para código ISO 639-1
 * @param {string} languageName - Nome do idioma (ex: 'english', 'portuguese')
 * @returns {string} - Código do idioma (ex: 'en', 'pt')
 */
export function getLanguageCode(languageName) {
  if (!languageName) return 'en';
  const normalized = languageName?.toLowerCase()?.trim() || 'en';

  // If it's a locale code like 'en-US', 'pt-BR', extract the first 2 chars
  if (normalized.includes('-') && normalized.length >= 4) {
    return normalized.split('-')[0];
  }

  // Se já for um código de 2 letras, retorna direto
  if (normalized.length === 2) {
    return normalized;
  }

  // Busca no mapa de códigos
  const code = LANGUAGE_CODES[normalized];

  return code || normalized.substring(0, 2); // try first 2 chars as last resort
}
