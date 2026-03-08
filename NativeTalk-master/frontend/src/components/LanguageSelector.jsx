import React, { useState } from 'react';
import { Search, Globe } from 'lucide-react';

const LanguageSelector = ({
  value,
  onChange,
  className = '',
  showSearch = true,
  showStats = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const supportedLanguages = [
    // Top 10 idiomas mais falados
    { code: 'zh-CN', name: '中文 (简体)', nativeName: 'Chinese (Simplified)', flag: '🇨🇳', speakers: '918M', category: 'top' },
    { code: 'es-ES', name: 'Español', nativeName: 'Spanish', flag: '🇪🇸', speakers: '460M', category: 'top' },
    { code: 'en-US', name: 'English', nativeName: 'English', flag: '🇺🇸', speakers: '380M', category: 'top' },
    { code: 'hi-IN', name: 'हिन्दी', nativeName: 'Hindi', flag: '🇮🇳', speakers: '341M', category: 'top' },
    { code: 'ar-SA', name: 'العربية', nativeName: 'Arabic', flag: '🇸🇦', speakers: '422M', category: 'top' },
    { code: 'pt-BR', name: 'Português (Brasil)', nativeName: 'Portuguese (Brazil)', flag: '🇧🇷', speakers: '260M', category: 'top' },
    { code: 'bn-BD', name: 'বাংলা', nativeName: 'Bengali', flag: '🇧🇩', speakers: '265M', category: 'top' },
    { code: 'ru-RU', name: 'Русский', nativeName: 'Russian', flag: '🇷🇺', speakers: '154M', category: 'top' },
    { code: 'ja-JP', name: '日本語', nativeName: 'Japanese', flag: '🇯🇵', speakers: '125M', category: 'top' },
    { code: 'pa-IN', name: 'ਪੰਜਾਬੀ', nativeName: 'Punjabi', flag: '🇮🇳', speakers: '113M', category: 'top' },

    // Idiomas europeus
    { code: 'de-DE', name: 'Deutsch', nativeName: 'German', flag: '🇩🇪', speakers: '76M', category: 'european' },
    { code: 'fr-FR', name: 'Français', nativeName: 'French', flag: '🇫🇷', speakers: '80M', category: 'european' },
    { code: 'it-IT', name: 'Italiano', nativeName: 'Italian', flag: '🇮🇹', speakers: '65M', category: 'european' },
    { code: 'tr-TR', name: 'Türkçe', nativeName: 'Turkish', flag: '🇹🇷', speakers: '80M', category: 'european' },
    { code: 'pl-PL', name: 'Polski', nativeName: 'Polish', flag: '🇵🇱', speakers: '45M', category: 'european' },
    { code: 'nl-NL', name: 'Nederlands', nativeName: 'Dutch', flag: '🇳🇱', speakers: '24M', category: 'european' },
    { code: 'ro-RO', name: 'Română', nativeName: 'Romanian', flag: '🇷🇴', speakers: '24M', category: 'european' },
    { code: 'uk-UA', name: 'Українська', nativeName: 'Ukrainian', flag: '🇺🇦', speakers: '37M', category: 'european' },
    { code: 'cs-CZ', name: 'Čeština', nativeName: 'Czech', flag: '🇨🇿', speakers: '10M', category: 'european' },
    { code: 'sv-SE', name: 'Svenska', nativeName: 'Swedish', flag: '🇸🇪', speakers: '10M', category: 'european' },
    { code: 'no-NO', name: 'Norsk', nativeName: 'Norwegian', flag: '🇳🇴', speakers: '5M', category: 'european' },
    { code: 'da-DK', name: 'Dansk', nativeName: 'Danish', flag: '🇩🇰', speakers: '6M', category: 'european' },
    { code: 'fi-FI', name: 'Suomi', nativeName: 'Finnish', flag: '🇫🇮', speakers: '5M', category: 'european' },

    // Idiomas asiáticos
    { code: 'ko-KR', name: '한국어', nativeName: 'Korean', flag: '🇰🇷', speakers: '77M', category: 'asian' },
    { code: 'th-TH', name: 'ไทย', nativeName: 'Thai', flag: '🇹🇭', speakers: '61M', category: 'asian' },
    { code: 'vi-VN', name: 'Tiếng Việt', nativeName: 'Vietnamese', flag: '🇻🇳', speakers: '76M', category: 'asian' },
    { code: 'id-ID', name: 'Bahasa Indonesia', nativeName: 'Indonesian', flag: '🇮🇩', speakers: '43M', category: 'asian' },
    { code: 'ms-MY', name: 'Bahasa Melayu', nativeName: 'Malay', flag: '🇲🇾', speakers: '19M', category: 'asian' },
    { code: 'tl-PH', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭', speakers: '45M', category: 'asian' },

    // Outros idiomas importantes
    { code: 'te-IN', name: 'తెలుగు', nativeName: 'Telugu', flag: '🇮🇳', speakers: '74M', category: 'indian' },
    { code: 'mr-IN', name: 'मराठी', nativeName: 'Marathi', flag: '🇮🇳', speakers: '72M', category: 'indian' },
    { code: 'ta-IN', name: 'தமிழ்', nativeName: 'Tamil', flag: '🇮🇳', speakers: '69M', category: 'indian' },
    { code: 'gu-IN', name: 'ગુજરાતી', nativeName: 'Gujarati', flag: '🇮🇳', speakers: '56M', category: 'indian' },
    { code: 'ur-PK', name: 'اردو', nativeName: 'Urdu', flag: '🇵🇰', speakers: '70M', category: 'middle-east' },
    { code: 'fa-IR', name: 'فارسی', nativeName: 'Persian', flag: '🇮🇷', speakers: '62M', category: 'middle-east' },
    { code: 'he-IL', name: 'עברית', nativeName: 'Hebrew', flag: '🇮🇱', speakers: '9M', category: 'middle-east' },
    { code: 'sw-KE', name: 'Kiswahili', nativeName: 'Swahili', flag: '🇰🇪', speakers: '16M', category: 'african' }
  ];

  const categories = {
    top: 'Mais Falados (Top 10)',
    european: 'Idiomas Europeus',
    asian: 'Idiomas Asiáticos',
    indian: 'Idiomas Indianos',
    'middle-east': 'Oriente Médio',
    african: 'Idiomas Africanos'
  };

  const filteredLanguages = supportedLanguages.filter(lang =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedLang = supportedLanguages.find(lang => lang.code === value);

  const groupedLanguages = filteredLanguages.reduce((groups, lang) => {
    const category = lang.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(lang);
    return groups;
  }, {});

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-emerald-500"
      >
        <div className="flex items-center gap-2">
          {selectedLang ? (
            <>
              <span className="text-lg">{selectedLang.flag}</span>
              <span className="text-white">{selectedLang.name}</span>
              {showStats && (
                <span className="text-xs text-gray-400">({selectedLang.speakers})</span>
              )}
            </>
          ) : (
            <>
              <Globe size={16} className="text-gray-400" />
              <span className="text-gray-400">Selecionar idioma</span>
            </>
          )}
        </div>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Search */}
          {showSearch && (
            <div className="p-3 border-b border-gray-600">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar idioma..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Language List */}
          <div className="max-h-80 overflow-y-auto">
            {Object.entries(groupedLanguages).map(([category, languages]) => (
              <div key={category}>
                {/* Category Header */}
                <div className="px-4 py-2 bg-gray-700 border-b border-gray-600">
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                    {categories[category]}
                  </span>
                </div>

                {/* Languages in Category */}
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onChange(lang.code);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center justify-between group ${value === lang.code ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{lang.flag}</span>
                      <div>
                        <div className="text-white font-medium">{lang.name}</div>
                        <div className="text-xs text-gray-400">{lang.nativeName}</div>
                      </div>
                    </div>
                    {showStats && (
                      <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {lang.speakers} falantes
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* No results */}
          {filteredLanguages.length === 0 && (
            <div className="p-4 text-center text-gray-400">
              Nenhum idioma encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;