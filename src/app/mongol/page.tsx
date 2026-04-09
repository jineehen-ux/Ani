'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Header from '@/components/header';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';

type MongolMovie = {
  id: number;
  name: string;
  category: string;
  poster: string;
  iframe?: string;
  preview?: string;
  episodes?: { ep: number; title: string; iframe: string }[];
};

const TABS = [
  { key: 'all',     label: 'Бүгд' },
  { key: 'drama',   label: 'Драм' },
  { key: 'horror',  label: 'Хорор' },
  { key: 'trailer', label: 'Трейлер' },
  { key: 'comedy',  label: 'Комеди' },
  { key: 'serial',  label: 'Сериал' },
];

function MovieCard({ movie }: { movie: MongolMovie }) {
  const router = useRouter();
  const [preview, setPreview] = useState(false);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didPreview = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const href = `/mongol/watch/${movie.id}`;

  const handleTouchStart = (e: React.TouchEvent) => {
    didPreview.current = false;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    touchTimer.current = setTimeout(() => {
      if (movie.preview) {
        setPreview(true);
        didPreview.current = true;
      }
    }, 300);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchTimer.current) clearTimeout(touchTimer.current);

    // Хуруу хөдөлсөн бол (scroll) → юу ч хийхгүй
    if (touchStart.current) {
      const dx = Math.abs(e.changedTouches[0].clientX - touchStart.current.x);
      const dy = Math.abs(e.changedTouches[0].clientY - touchStart.current.y);
      if (dx > 8 || dy > 8) {
        setPreview(false);
        didPreview.current = false;
        return;
      }
    }

    if (didPreview.current) {
      setTimeout(() => {
        setPreview(false);
        router.push(href);
      }, 600);
    }
  };

  const handleTouchCancel = () => {
    if (touchTimer.current) clearTimeout(touchTimer.current);
    setPreview(false);
    didPreview.current = false;
    touchStart.current = null;
  };

  return (
    <div className="group flex flex-col rounded-xl overflow-hidden border border-transparent hover:border-primary/40 hover:-translate-y-1 transition-all hover:shadow-xl hover:shadow-primary/10 bg-card">
      <Link
        href={href}
        className="block aspect-[2/3] relative overflow-hidden select-none"
        onMouseEnter={() => setPreview(true)}
        onMouseLeave={() => setPreview(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        draggable={false}
      >
        <Image
          src={movie.poster}
          alt={movie.name}
          fill
          className="object-cover rounded-t-xl"
          unoptimized
        />
        {movie.preview && preview && (
          <img
            src={movie.preview}
            alt="preview"
            className="absolute inset-0 w-full h-full object-cover rounded-t-xl animate-fade-in"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Badge className="absolute top-2 right-2 capitalize">{movie.category}</Badge>
        {movie.episodes && (
          <Badge variant="outline" className="absolute top-2 left-2 bg-black/60">
            {movie.episodes.length} анги
          </Badge>
        )}
      </Link>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <Link href={href}>
          <h3 className="font-semibold text-sm truncate hover:text-primary transition-colors">{movie.name}</h3>
        </Link>
        <Button asChild size="sm" className="w-full mt-auto">
          <Link href={href}>
            <PlayCircle className="mr-2 h-4 w-4" />
            {movie.episodes ? 'Үзэх' : 'Тоглуулах'}
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function MongolPage() {
  const [movies, setMovies] = useState<MongolMovie[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetch('/mongol_movies.json')
      .then(r => r.json())
      .then(setMovies);
  }, []);

  const filtered = useMemo(() =>
    activeTab === 'all' ? movies : movies.filter(m => m.category === activeTab),
    [activeTab, movies]
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">🇲🇳 Монгол Кино</h1>
          <p className="text-muted-foreground mt-1">{movies.length} кино нэмэгдсэн байна</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30'
                  : 'bg-secondary/50 text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs opacity-70">
                {tab.key === 'all' ? movies.length : movies.filter(m => m.category === tab.key).length}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </main>
    </div>
  );
}
