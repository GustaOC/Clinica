import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${inverse ? 'brand-inverse' : ''}`}
      aria-label="Lumina — página inicial"
    >
      <span className="brand-symbol">
        <Sparkles size={25} strokeWidth={1.4} aria-hidden="true" />
      </span>
      <span>
        <span className="brand-name">
          lumina<span>.</span>
        </span>
        <span className="brand-caption">Clínica estética</span>
      </span>
    </Link>
  );
}
