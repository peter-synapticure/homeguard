import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

// Cache the PDF document per file path
const pdfCache = {};

export default function PdfPhoto({ filePath, page, description, style }) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        if (!filePath || !page) return;

        // Get or load PDF
        let pdfDoc = pdfCache[filePath];
        if (!pdfDoc) {
          // Import supabase dynamically to avoid circular deps
          const { supabase } = await import('../lib/supabase');

          // Get signed URL for the PDF
          const { data: urlData, error: urlErr } = await supabase.storage
            .from('reports')
            .createSignedUrl(filePath, 3600); // 1 hour

          if (urlErr || !urlData?.signedUrl) throw new Error('Could not get PDF URL');

          pdfDoc = await pdfjsLib.getDocument(urlData.signedUrl).promise;
          pdfCache[filePath] = pdfDoc;
        }

        if (cancelled) return;

        const pg = await pdfDoc.getPage(page);
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const viewport = pg.getViewport({ scale: 1.5 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await pg.render({
          canvasContext: canvas.getContext('2d'),
          viewport,
        }).promise;

        if (!cancelled) setLoading(false);
      } catch (e) {
        console.error('PDF render error:', e);
        if (!cancelled) { setError(true); setLoading(false); }
      }
    };

    render();
    return () => { cancelled = true; };
  }, [filePath, page]);

  return (
    <div style={{
      borderRadius: 12,
      overflow: 'hidden',
      background: '#f1f5f9',
      position: 'relative',
      ...style,
    }}>
      {loading && !error && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 120, color: '#94a3b8', fontSize: 12,
        }}>
          Loading...
        </div>
      )}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 120, color: '#94a3b8', fontSize: 12,
        }}>
          Could not load photo
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: 'auto',
          display: loading || error ? 'none' : 'block',
          borderRadius: 12,
        }}
      />
      {description && !loading && !error && (
        <div style={{
          padding: '8px 10px',
          fontSize: 12,
          color: '#64748b',
          background: 'rgba(255,255,255,0.9)',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}>
          {description}
        </div>
      )}
    </div>
  );
}