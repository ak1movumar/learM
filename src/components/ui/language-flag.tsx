'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Globe2 } from 'lucide-react';
import { languageFlagSource } from '@/lib/language-flag';

/** Decorative: the visible language name supplies the accessible label. */
export function LanguageFlag({
  code,
  width = 38,
  height = 28,
}: {
  code: string;
  width?: number;
  height?: number;
}) {
  const src = languageFlagSource(code);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (!src || failedSource === src)
    return <Globe2 width={width} height={height} aria-hidden="true" />;
  return (
    <Image
      src={src}
      alt=""
      width={width}
      height={height}
      unoptimized
      referrerPolicy="no-referrer"
      onError={() => setFailedSource(src)}
    />
  );
}
