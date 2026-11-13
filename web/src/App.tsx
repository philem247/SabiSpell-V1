import { COLLECTION_IDS, COLLECTIONS } from './data/collections';
import { getXPTitle } from './services/titles';
import { useProfileStore } from './store/profileStore';
import Mascot from './components/Mascot';
import Wordmark from './components/Wordmark';

export default function App() {
  const xp = useProfileStore((s) => s.xp);

  return (
    <main className="mx-auto max-w-xl p-6">
      <header className="flex items-center gap-3">
        <Mascot size={72} />
        <h1>
          <Wordmark size={40} />
        </h1>
      </header>
      <p className="mt-1 text-slate-600">Spelling for everyone. Your title: {getXPTitle(xp)}</p>
      <ul className="mt-6 space-y-3">
        {COLLECTION_IDS.map((id) => {
          const collection = COLLECTIONS[id];
          return (
            <li key={id} className="rounded-xl border border-slate-200 p-4">
              <h2 className="font-semibold">{collection.name}</h2>
              <p className="text-sm text-slate-600">{collection.description}</p>
              <p className="mt-1 text-xs text-slate-500">
                {collection.words.length} words · {collection.free ? 'Free' : 'Pro'}
              </p>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
