'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

type HTMLRendererProps = {
  content: string;
  className?: string;
  enableMath?: boolean; // Optional math rendering
};

export default function HTMLRenderer({ 
  content, 
  className = '',
  enableMath = true 
}: HTMLRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Process image URLs
  const getImageUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const { data } = supabase.storage.from('questions').getPublicUrl(url);
    return data.publicUrl;
  };

  const processedContent = content.replace(
    /<img[^>]+src="([^"]+)"([^>]*)>/g,
    (match, src, rest) => {
      const imageUrl = getImageUrl(src);
      return `<img src="${imageUrl}" ${rest} crossorigin="anonymous">`;
    }
  );

  // Render math if enabled
  useEffect(() => {
    if (!enableMath) return;

    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    const renderMath = async () => {
      if (!containerRef.current || isRendering) return;
      setIsRendering(true);

      try {
        const katex = (await import('katex')).default;
        const mathNodes = containerRef.current.querySelectorAll(
          '[data-type="inline-math"], [data-type="block-math"]'
        );

        if (mathNodes.length === 0) {
          setIsRendering(false);
          return;
        }

        mathNodes.forEach((node) => {
          const latex = node.getAttribute('data-latex') || node.textContent || '';
          const isBlock = node.getAttribute('data-type') === 'block-math';

          if (node.classList.contains('katex-rendered')) {
            return;
          }

          try {
            node.innerHTML = '';
            katex.render(latex, node as HTMLElement, {
              displayMode: isBlock,
              throwOnError: false,
              errorColor: '#cc0000',
              strict: false,
            });
            node.classList.add('katex-rendered');
          } catch (error) {
            console.error('KaTeX render error:', latex, error);
            node.textContent = `[Math Error: ${latex}]`;
          }
        });

        setIsRendering(false);
      } catch (error) {
        console.error('Failed to load KaTeX:', error);
        setIsRendering(false);
      }
    };

    renderTimeoutRef.current = setTimeout(() => {
      renderMath();
    }, 150);

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [content, enableMath, isRendering]);

  return (
    <div
      ref={containerRef}
      className={`prose dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}