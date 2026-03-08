import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useAuthUser from './useAuthUser';
import { getLanguageCode } from '../lib/utils';

/**
 * Hook que sincroniza o idioma da interface com o native_language do usuário
 */
const useUserLanguage = () => {
  const { i18n } = useTranslation();
  const { authUser } = useAuthUser();

  useEffect(() => {
    if (authUser?.native_language) {
      // Converte nome do idioma para código (ex: "portuguese" -> "pt")
      const langCode = getLanguageCode(authUser.native_language);
      
      // Muda o idioma da interface
      if (i18n.language !== langCode) {
        i18n.changeLanguage(langCode);
        console.log(`🌍 Interface idioma alterado para: ${langCode} (${authUser.native_language})`);
      }
    }
  }, [authUser, i18n]);

  return { i18n };
};

export default useUserLanguage;
