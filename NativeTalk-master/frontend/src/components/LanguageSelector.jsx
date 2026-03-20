import { Search, Globe } from 'lucide-react';
import { LANGUAGES } from '../constants';

const LanguageSelector = ({
  value,
  onChange,
  className = '',
  showSearch = true,
  showStats = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const supportedLanguages = LANGUAGES.map(lang => ({
    ...lang,
    name: lang.label,
    nativeName: lang.label,
    category: 'all'
  }));

  const categories = {
    all: 'Idiomas Suportados'
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