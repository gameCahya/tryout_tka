// components/admin/MathRenderer.tsx
'use client';

import { useEffect, useRef } from 'react';

type MathRendererProps = {
  latex: string;
  displayMode?: boolean;
  className?: string;
};

export default function MathRenderer({ latex, displayMode = false, className = '' }: MathRendererProps) {
  const mathRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const renderMath = async () => {
      if (!mathRef.current || !latex) return;

      try {
        const katex = (await import('katex')).default;
        
        katex.render(latex, mathRef.current, {
          displayMode: displayMode,
          throwOnError: false,
          errorColor: '#cc0000',
          strict: false,
        });
      } catch (error) {
        console.error('KaTeX render error:', error);
        if (mathRef.current) {
          mathRef.current.textContent = latex;
        }
      }
    };

    renderMath();
  }, [latex, displayMode]);

  return (
    <span
      ref={mathRef}
      className={`inline-block ${displayMode ? 'my-4 text-center w-full' : ''} ${className}`}
    />
  );
}