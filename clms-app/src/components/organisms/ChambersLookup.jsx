import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchInput from '../molecules/SearchInput';
import ChamberCard from '../molecules/ChamberCard';
import { searchChambers } from '../../services/chambersService';
import Icon from '../atoms/Icon';
import { useAppContext } from '../../context/AppContext';

export default function ChambersLookup() {
  const navigate = useNavigate();
  const { updateOnboarding } = useAppContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = setTimeout(async () => {
      if (query.trim().length < 3) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const data = await searchChambers(query);
      setResults(data);
      setLoading(false);
    }, 300);

    return () => clearTimeout(id);
  }, [query]);

  return (
    <section className="mx-auto w-full max-w-xl rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-8">
      <h1 className="inline-flex items-center gap-2 font-serif text-3xl text-text">
        <Icon name="solar:buildings-linear" size={26} />
        <span>Find your chambers</span>
      </h1>
      <p className="mt-2 text-sm text-text-secondary">Search for your chambers to access the shared library.</p>
      <div className="mt-5">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Type at least 3 characters"
        />
      </div>

      <div className="mt-4 space-y-2">
        {loading ? <p className="text-sm text-text-tertiary">Searching...</p> : null}
        {results.map((result) => (
          <ChamberCard
            key={result.id}
            chamber={result}
            onSelect={(selectedChamber) => {
              updateOnboarding({
                chambersFound: true,
                chambersName: selectedChamber.name,
                chambersLogo: selectedChamber.logo || null,
                mode: 'joined',
              });
              navigate('/onboarding/barrister/setup');
            }}
          />
        ))}
        {!loading && query.length >= 3 && results.length === 0 ? (
          <p className="text-sm text-text-tertiary">No chambers matched your search.</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => {
          updateOnboarding({ chambersFound: false });
          navigate('/onboarding/barrister/fork');
        }}
        className="mt-4 text-sm font-medium text-brand hover:text-brand-hover"
      >
        Can't find yours? Skip this step
      </button>
    </section>
  );
}
