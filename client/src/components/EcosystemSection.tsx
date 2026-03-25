import { useState, useMemo } from 'react';
import { Search, Globe, Rocket, Filter, X } from 'lucide-react';

interface EcosystemSectionProps {
  BG: string;
  BG_CARD: string;
  BG_CARD2: string;
  BORDER: string;
  TEXT_HI: string;
  TEXT_MED: string;
  TEXT_LOW: string;
  BLUE: string;
  GREEN: string;
  VIOLET: string;
  isRTL: boolean;
}

const JURISDICTIONS = [
  { id: 1, name: 'United Arab Emirates', region: 'MENA', supportLevel: 'High', icon: '🇦🇪' },
  { id: 2, name: 'Saudi Arabia', region: 'MENA', supportLevel: 'High', icon: '🇸🇦' },
  { id: 3, name: 'Egypt', region: 'MENA', supportLevel: 'Medium', icon: '🇪🇬' },
  { id: 4, name: 'Kuwait', region: 'MENA', supportLevel: 'High', icon: '🇰🇼' },
  { id: 5, name: 'Qatar', region: 'MENA', supportLevel: 'High', icon: '🇶🇦' },
  { id: 6, name: 'Singapore', region: 'SEA', supportLevel: 'High', icon: '🇸🇬' },
  { id: 7, name: 'United States', region: 'Americas', supportLevel: 'High', icon: '🇺🇸' },
  { id: 8, name: 'United Kingdom', region: 'Europe', supportLevel: 'High', icon: '🇬🇧' },
];

const ACCELERATORS = [
  { id: 1, name: 'Y Combinator', region: 'Global', stage: 'Seed', location: 'Mountain View', icon: '⚡' },
  { id: 2, name: 'Plug and Play', region: 'Global', stage: 'Seed/Series A', location: 'Sunnyvale', icon: '🔌' },
  { id: 3, name: 'Techstars', region: 'Global', stage: 'Seed', location: 'Multiple', icon: '⭐' },
  { id: 4, name: 'MENA Ventures', region: 'MENA', stage: 'Seed/Series A', location: 'Dubai', icon: '🚀' },
  { id: 5, name: 'Flat6Labs', region: 'MENA', stage: 'Seed', location: 'Multiple', icon: '🏢' },
  { id: 6, name: 'Wamda Capital', region: 'MENA', stage: 'Early Stage', location: 'Dubai', icon: '💼' },
  { id: 7, name: 'Endeavor', region: 'Global', stage: 'Growth', location: 'Multiple', icon: '🎯' },
  { id: 8, name: 'Station F', region: 'Europe', stage: 'Seed/Series A', location: 'Paris', icon: '🚉' },
];

export default function EcosystemSection({
  BG,
  BG_CARD,
  BG_CARD2,
  BORDER,
  TEXT_HI,
  TEXT_MED,
  TEXT_LOW,
  BLUE,
  GREEN,
  VIOLET,
  isRTL,
}: EcosystemSectionProps) {
  const [activeTab, setActiveTab] = useState<'jurisdictions' | 'accelerators'>('jurisdictions');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const jurisdictionRegions = ['MENA', 'SEA', 'Americas', 'Europe'];
  const acceleratorRegions = ['Global', 'MENA', 'Europe'];

  const filteredJurisdictions = useMemo(() => {
    return JURISDICTIONS.filter(j => {
      const matchesSearch = j.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = !selectedRegion || j.region === selectedRegion;
      return matchesSearch && matchesRegion;
    });
  }, [searchQuery, selectedRegion]);

  const filteredAccelerators = useMemo(() => {
    return ACCELERATORS.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = !selectedRegion || a.region === selectedRegion;
      return matchesSearch && matchesRegion;
    });
  }, [searchQuery, selectedRegion]);

  const regions = activeTab === 'jurisdictions' ? jurisdictionRegions : acceleratorRegions;
  const items = activeTab === 'jurisdictions' ? filteredJurisdictions : filteredAccelerators;

  return (
    <section className="py-20 px-5" style={{ background: BG }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ color: TEXT_HI }}>
            {isRTL ? 'النظام البيئي العالمي' : 'Global Ecosystem'}
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: TEXT_MED }}>
            {isRTL
              ? 'استكشف الاختصاصات والمسرّعات المدعومة حول العالم'
              : 'Explore supported jurisdictions and accelerators worldwide'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 justify-center">
          <button
            onClick={() => {
              setActiveTab('jurisdictions');
              setSelectedRegion(null);
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: activeTab === 'jurisdictions' ? BLUE : BG_CARD,
              color: activeTab === 'jurisdictions' ? 'white' : TEXT_MED,
              border: `1px solid ${activeTab === 'jurisdictions' ? BLUE : BORDER}`,
            }}
          >
            <Globe className="w-5 h-5" />
            {isRTL ? 'الاختصاصات' : 'Jurisdictions'}
          </button>
          <button
            onClick={() => {
              setActiveTab('accelerators');
              setSelectedRegion(null);
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: activeTab === 'accelerators' ? VIOLET : BG_CARD,
              color: activeTab === 'accelerators' ? 'white' : TEXT_MED,
              border: `1px solid ${activeTab === 'accelerators' ? VIOLET : BORDER}`,
            }}
          >
            <Rocket className="w-5 h-5" />
            {isRTL ? 'المسرّعات' : 'Accelerators'}
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: TEXT_LOW }} />
            <input
              type="text"
              placeholder={isRTL ? 'ابحث...' : 'Search...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2"
              style={{
                background: BG_CARD,
                borderColor: BORDER,
                color: TEXT_HI,
              }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 2px ${BLUE}`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
            />
          </div>

          {/* Filter Toggle and Region Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all"
              style={{
                background: showFilters ? BG_CARD2 : BG_CARD,
                borderColor: BORDER,
                color: TEXT_MED,
              }}
            >
              <Filter className="w-4 h-4" />
              {isRTL ? 'تصفية' : 'Filter'}
            </button>

            {showFilters && (
              <>
                {regions.map(region => (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(selectedRegion === region ? null : region)}
                    className="px-4 py-2 rounded-lg border transition-all flex items-center gap-2"
                    style={{
                      background: selectedRegion === region ? BLUE : BG_CARD,
                      borderColor: selectedRegion === region ? BLUE : BORDER,
                      color: selectedRegion === region ? 'white' : TEXT_MED,
                    }}
                  >
                    {region}
                    {selectedRegion === region && <X className="w-4 h-4" />}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.length > 0 ? (
            items.map(item => (
              <div
                key={item.id}
                className="p-6 rounded-lg border transition-all hover:shadow-lg"
                style={{
                  background: BG_CARD,
                  borderColor: BORDER,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">{item.icon}</div>
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded"
                    style={{
                      background: activeTab === 'jurisdictions' ? `${GREEN}20` : `${VIOLET}20`,
                      color: activeTab === 'jurisdictions' ? GREEN : VIOLET,
                    }}
                  >
                    {item.region}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: TEXT_HI }}>
                  {item.name}
                </h3>
                <div className="space-y-1 text-sm" style={{ color: TEXT_MED }}>
                  {activeTab === 'jurisdictions' && 'supportLevel' in item ? (
                    <>
                      <p>{isRTL ? 'مستوى الدعم' : 'Support Level'}: {item.supportLevel}</p>
                    </>
                  ) : activeTab === 'accelerators' && 'stage' in item ? (
                    <>
                      <p>{isRTL ? 'المرحلة' : 'Stage'}: {item.stage}</p>
                      <p>{isRTL ? 'الموقع' : 'Location'}: {item.location}</p>
                    </>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12" style={{ color: TEXT_LOW }}>
              <p>{isRTL ? 'لم يتم العثور على نتائج' : 'No results found'}</p>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-8 text-center text-sm" style={{ color: TEXT_LOW }}>
          {isRTL
            ? `${items.length} ${activeTab === 'jurisdictions' ? 'اختصاص' : 'مسرّع'} متطابق`
            : `${items.length} matching ${activeTab === 'jurisdictions' ? 'jurisdiction' : 'accelerator'}${items.length !== 1 ? 's' : ''}`}
        </div>
      </div>
    </section>
  );
}
