import { translateText, getLanguageCode } from "../lib/translation.js";


/**
 * Traduz uma mensagem para o idioma preferido de um usuário
 */
export async function translateMessage(req, res) {
  try {
    const { text, targetUserId } = req.body;

    if (!text || !targetUserId) {
      return res.status(400).json({ message: "Text and targetUserId are required" });
    }

    // Idioma de ORIGEM
    const sourceLanguage = getLanguageCode('en');

    // Idioma de DESTINO
    const targetLanguage = getLanguageCode('en');

    console.log(`
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    📝 TRADUÇÃO SOLICITADA:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    👤 Autor: ${targetUserId} (en)
    👥 Receptor: ${req.user.id} (en)
    🔤 De: ${sourceLanguage} → Para: ${targetLanguage}
    💬 Texto: "${text}"
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    // Se os idiomas forem iguais, retorna o texto original
    if (sourceLanguage === targetLanguage) {
      console.log("⚠️  Idiomas iguais! Retornando texto original.");
      return res.status(200).json({
        originalText: text,
        translatedText: text,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
      });
    }

    // Traduz o texto
    const translatedText = await translateText(text, sourceLanguage, targetLanguage);

    res.status(200).json({
      originalText: text,
      translatedText: translatedText,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
    });
  } catch (error) {
    console.log("Error in translateMessage controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * Traduz uma mensagem para múltiplos idiomas (útil para grupos)
 */
export async function translateMessageMultiple(req, res) {
  try {
    const { text, targetUserIds } = req.body;

    if (!text || !targetUserIds || !Array.isArray(targetUserIds)) {
      return res.status(400).json({ message: "Text and targetUserIds array are required" });
    }

    // Busca o idioma do remetente
    const sourceLanguage = getLanguageCode('en');

    // Traduz para cada idioma único
    const translations = await Promise.all(
      targetUserIds.map(async (userId) => {
        const targetLanguage = getLanguageCode('en');
        const translatedText = await translateText(text, sourceLanguage, targetLanguage);

        return {
          userId,
          translatedText: translatedText,
          targetLanguage: targetLanguage,
        };
      })
    );

    res.status(200).json({
      originalText: text,
      sourceLanguage: sourceLanguage,
      translations: translations,
    });
  } catch (error) {
    console.log("Error in translateMessageMultiple controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
