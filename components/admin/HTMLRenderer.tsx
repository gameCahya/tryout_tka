// components/admin/HTMLRenderer.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

type HTMLRendererProps = {
  content: string;
  className?: string;
};

export default function HTMLRenderer({ content, className = '' }: HTMLRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any pending render
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    const renderMath = async () => {
      if (!containerRef.current || isRendering) return;

      setIsRendering(true);

      try {
        const katex = (await import('katex')).default;
        
        // Find all math nodes with data-type attribute
        const mathNodes = containerRef.current.querySelectorAll('[data-type="inline-math"], [data-type="block-math"]');
        
        if (mathNodes.length === 0) {
          setIsRendering(false);
          return;
        }

        // Render each math node
        mathNodes.forEach((node) => {
          const latex = node.getAttribute('data-latex') || node.textContent || '';
          const isBlock = node.getAttribute('data-type') === 'block-math';
          
          // Skip if already rendered (check for katex class)
          if (node.classList.contains('katex-rendered')) {
            return;
          }

          try {
            // Clear previous content
            node.innerHTML = '';
            
            katex.render(latex, node as HTMLElement, {
              displayMode: isBlock,
              throwOnError: false,
              errorColor: '#cc0000',
              strict: false,
            });

            // Mark as rendered
            node.classList.add('katex-rendered');
          } catch (error) {
            console.error('KaTeX render error for:', latex, error);
            // Fallback: show the latex source
            node.textContent = `[Math Error: ${latex}]`;
          }
        });

        setIsRendering(false);
      } catch (error) {
        console.error('Failed to load KaTeX:', error);
        setIsRendering(false);
      }
    };

    // Use timeout to ensure DOM is fully updated
    renderTimeoutRef.current = setTimeout(() => {
      renderMath();
    }, 150);

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [content]); // Re-run when content changes

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