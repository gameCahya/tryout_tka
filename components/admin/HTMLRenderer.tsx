// components/admin/HTMLRenderer.tsx
'use client';

import { useEffect, useRef } from 'react';

type HTMLRendererProps = {
  content: string;
  className?: string;
};

export default function HTMLRenderer({ content, className = '' }: HTMLRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderMath = async () => {
      if (!containerRef.current) return;

      try {
        const katex = (await import('katex')).default;
        
        // Find all math nodes with data-type attribute
        const mathNodes = containerRef.current.querySelectorAll('[data-type="inline-math"], [data-type="block-math"]');
        
        mathNodes.forEach((node) => {
          const latex = node.getAttribute('data-latex') || node.textContent || '';
          const isBlock = node.getAttribute('data-type') === 'block-math';
          
          try {
            katex.render(latex, node as HTMLElement, {
              displayMode: isBlock,
              throwOnError: false,
              errorColor: '#cc0000',
            });
          } catch (error) {
            console.error('KaTeX render error:', error);
          }
        });
      } catch (error) {
        console.error('Failed to load KaTeX:', error);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      renderMath();
    }, 100);

    return () => clearTimeout(timer);
  }, [content]);

  return (
    <div
      ref={containerRef}
      className={`prose dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        listStylePosition: 'inside',
      }}
    />
  );
}