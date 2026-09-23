// BoundingBoxSelector/BoundingBoxSelector.jsx
import React, { useState, useRef, useCallback, memo } from 'react';
import './BoundingBoxSelector.css';

const BoundingBoxSelector = memo(function BoundingBoxSelector({ imagen, onMascaraLista, onCancelar }) {
  const svgRef       = useRef(null);
  const imgRef       = useRef(null);
  const dragRef      = useRef(null);
  const longPressRef = useRef(null);

  const [rect, setRect] = useState({ x1: 15, y1: 20, x2: 85, y2: 80 });
  const rectRef = useRef(rect);
  rectRef.current = rect;

  const [modo, setModo] = useState('rect');
  const [quad, setQuad] = useState({
    tl: { x: 15, y: 20 }, tr: { x: 85, y: 20 },
    br: { x: 85, y: 80 }, bl: { x: 15, y: 80 },
  });
  const quadRef = useRef(quad);
  quadRef.current = quad;
  const modoRef = useRef(modo);
  modoRef.current = modo;

  const MIN_SIZE = 8;
  const clamp    = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const rectToQuad = (r) => ({
    tl: { x: r.x1, y: r.y1 }, tr: { x: r.x2, y: r.y1 },
    br: { x: r.x2, y: r.y2 }, bl: { x: r.x1, y: r.y2 },
  });

  const applyRectDrag = (type, dx, dy, r0) => {
    let { x1, y1, x2, y2 } = r0;
    switch (type) {
      case 'tl': x1=clamp(x1+dx,0,x2-MIN_SIZE); y1=clamp(y1+dy,0,y2-MIN_SIZE); break;
      case 'tm': y1=clamp(y1+dy,0,y2-MIN_SIZE); break;
      case 'tr': x2=clamp(x2+dx,x1+MIN_SIZE,100); y1=clamp(y1+dy,0,y2-MIN_SIZE); break;
      case 'ml': x1=clamp(x1+dx,0,x2-MIN_SIZE); break;
      case 'mr': x2=clamp(x2+dx,x1+MIN_SIZE,100); break;
      case 'bl': x1=clamp(x1+dx,0,x2-MIN_SIZE); y2=clamp(y2+dy,y1+MIN_SIZE,100); break;
      case 'bm': y2=clamp(y2+dy,y1+MIN_SIZE,100); break;
      case 'br': x2=clamp(x2+dx,x1+MIN_SIZE,100); y2=clamp(y2+dy,y1+MIN_SIZE,100); break;
      case 'move': {
        const w=x2-x1, h=y2-y1;
        const nx=clamp(x1+dx,0,100-w), ny=clamp(y1+dy,0,100-h);
        x1=nx; y1=ny; x2=nx+w; y2=ny+h; break;
      }
      default: break;
    }
    return { x1, y1, x2, y2 };
  };

  const toSVGPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt  = svg.createSVGPoint();
    const src = e.touches?.[0] ?? e;
    pt.x = src.clientX; pt.y = src.clientY;
    const ctm = svg.getScreenCTM();
    return ctm ? pt.matrixTransform(ctm.inverse()) : { x: 0, y: 0 };
  }, []);

  const clearLongPress = useCallback(() => {
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
  }, []);

  const startDrag = useCallback((type) => (e) => {
    e.stopPropagation();
    if (e.pointerId !== undefined) svgRef.current?.setPointerCapture(e.pointerId);
    clearLongPress();
    const startPt  = toSVGPoint(e);
    const isCorner = ['tl','tr','bl','br'].includes(type);

    if (modoRef.current === 'quad') {
      dragRef.current = isCorner
        ? { type: 'quad-corner', corner: type, startPt, startQuad: { ...quadRef.current } }
        : { type: 'quad-move', startPt, startQuad: { ...quadRef.current } };
      return;
    }

    dragRef.current = { type, startPt, startRect: { ...rectRef.current } };

    if (isCorner) {
      longPressRef.current = setTimeout(() => {
        longPressRef.current = null;
        const q = rectToQuad(rectRef.current);
        setQuad(q); setModo('quad');
        dragRef.current = { type: 'quad-corner', corner: type, startPt: dragRef.current?.startPt ?? startPt, startQuad: q };
      }, 500);
    }
  }, [toSVGPoint, clearLongPress]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSVGMove = useCallback((e) => {
    if (!dragRef.current) return;
    const pt = toSVGPoint(e);
    const dx = pt.x - dragRef.current.startPt.x;
    const dy = pt.y - dragRef.current.startPt.y;

    if (dragRef.current.type === 'quad-corner') {
      const { corner, startQuad } = dragRef.current;
      const newQ = { ...startQuad, [corner]: { x: clamp(startQuad[corner].x+dx,0,100), y: clamp(startQuad[corner].y+dy,0,100) } };
      quadRef.current = newQ; setQuad(newQ); return;
    }
    if (dragRef.current.type === 'quad-move') {
      const { startQuad } = dragRef.current;
      const newQ = {};
      for (const [k, v] of Object.entries(startQuad))
        newQ[k] = { x: clamp(v.x+dx,0,100), y: clamp(v.y+dy,0,100) };
      quadRef.current = newQ; setQuad(newQ); return;
    }
    const newRect = applyRectDrag(dragRef.current.type, dx, dy, dragRef.current.startRect);
    rectRef.current = newRect; setRect(newRect);
    const newQ = rectToQuad(newRect); quadRef.current = newQ; setQuad(newQ);
  }, [toSVGPoint]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSVGUp = useCallback(() => { clearLongPress(); dragRef.current = null; }, [clearLongPress]);

  const resetARect = useCallback(() => {
    clearLongPress();
    const xs = [quad.tl.x, quad.tr.x, quad.br.x, quad.bl.x];
    const ys = [quad.tl.y, quad.tr.y, quad.br.y, quad.bl.y];
    const newRect = { x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) };
    setRect(newRect); setQuad(rectToQuad(newRect)); setModo('rect');
  }, [quad, clearLongPress]);

  const confirmar = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const iw = img.naturalWidth || 800, ih = img.naturalHeight || 600;
    const cv = document.createElement('canvas');
    cv.width = iw; cv.height = ih;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, iw, ih);
    ctx.fillStyle = '#ffffff';
    if (modoRef.current === 'quad') {
      const q = quadRef.current;
      ctx.beginPath();
      ctx.moveTo((q.tl.x/100)*iw, (q.tl.y/100)*ih);
      ctx.lineTo((q.tr.x/100)*iw, (q.tr.y/100)*ih);
      ctx.lineTo((q.br.x/100)*iw, (q.br.y/100)*ih);
      ctx.lineTo((q.bl.x/100)*iw, (q.bl.y/100)*ih);
      ctx.closePath(); ctx.fill();
    } else {
      const { x1, y1, x2, y2 } = rectRef.current;
      ctx.fillRect((x1/100)*iw, (y1/100)*ih, ((x2-x1)/100)*iw, ((y2-y1)/100)*ih);
    }
    cv.toBlob(blob => { if (blob) onMascaraLista(blob); }, 'image/png');
  }, [onMascaraLista]);

  const { x1, y1, x2, y2 } = rect;
  const bw = x2-x1, bh = y2-y1, HR = 2.2, HR_QUAD = 2.6;

  const rectHandles = [
    { id:'tl', cx:x1,      cy:y1,      cursor:'nw-resize', isCorner:true  },
    { id:'tm', cx:x1+bw/2, cy:y1,      cursor:'n-resize',  isCorner:false },
    { id:'tr', cx:x2,      cy:y1,      cursor:'ne-resize', isCorner:true  },
    { id:'ml', cx:x1,      cy:y1+bh/2, cursor:'w-resize',  isCorner:false },
    { id:'mr', cx:x2,      cy:y1+bh/2, cursor:'e-resize',  isCorner:false },
    { id:'bl', cx:x1,      cy:y2,      cursor:'sw-resize', isCorner:true  },
    { id:'bm', cx:x1+bw/2, cy:y2,      cursor:'s-resize',  isCorner:false },
    { id:'br', cx:x2,      cy:y2,      cursor:'se-resize', isCorner:true  },
  ];
  const quadCornerHandles = [
    { id:'tl', ...quad.tl, cursor:'nw-resize' }, { id:'tr', ...quad.tr, cursor:'ne-resize' },
    { id:'br', ...quad.br, cursor:'se-resize' }, { id:'bl', ...quad.bl, cursor:'sw-resize' },
  ];
  const polyPath   = `M${quad.tl.x},${quad.tl.y} L${quad.tr.x},${quad.tr.y} L${quad.br.x},${quad.br.y} L${quad.bl.x},${quad.bl.y} Z`;
  const polyPoints = `${quad.tl.x},${quad.tl.y} ${quad.tr.x},${quad.tr.y} ${quad.br.x},${quad.br.y} ${quad.bl.x},${quad.bl.y}`;
  const centroid   = { x:(quad.tl.x+quad.tr.x+quad.br.x+quad.bl.x)/4, y:(quad.tl.y+quad.tr.y+quad.br.y+quad.bl.y)/4 };

  return (
    <div className="via-mask-root">
      <img ref={imgRef} src={imagen} alt="" aria-hidden="true" className="via-img-hidden" />

      <div className="via-mask-header">
        {modo === 'rect' ? (
          <p className="via-mask-hint">
            Arrastra las <b>esquinas</b> o <b>bordes</b> del recuadro ·
            Arrastra el <b>interior</b> para moverlo ·{' '}
            <span className="via-hint-quad-tip">Mantén una esquina para forma libre ↗</span>
          </p>
        ) : (
          <p className="via-mask-hint">
            <span className="via-quad-badge">◈ Forma libre</span>{' '}
            Mueve cada esquina independientemente ·{' '}
            <button type="button" className="via-hint-reset-btn" onClick={resetARect}>
              ↩ volver a rectángulo
            </button>
          </p>
        )}
      </div>

      <div className="via-canvas-wrap" style={{ touchAction: 'none' }}>
        <img src={imagen} alt="Foto del espacio" className="via-canvas-bg" draggable={false} />
        <svg
          ref={svgRef}
          className="via-bbox-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="application"
          aria-label="Selector de zona para la IA"
          onPointerMove={onSVGMove}
          onPointerUp={onSVGUp}
          onPointerLeave={onSVGUp}
          onPointerCancel={onSVGUp}
        >
          {modo === 'rect' ? (
            <>
              <path fillRule="evenodd" d={`M0,0 H100 V100 H0 Z M${x1},${y1} H${x2} V${y2} H${x1} Z`} fill="rgba(0,0,0,0.52)" style={{ pointerEvents:'none' }} />
              <rect x={x1} y={y1} width={bw} height={bh} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.88)" strokeWidth="0.55" strokeDasharray="3 1.5" style={{ cursor:'move' }} onPointerDown={startDrag('move')} />
              {[1/3,2/3].map(t => (
                <React.Fragment key={`t${t}`}>
                  <line x1={x1+bw*t} y1={y1} x2={x1+bw*t} y2={y2} stroke="rgba(255,255,255,0.18)" strokeWidth="0.22" style={{ pointerEvents:'none' }} />
                  <line x1={x1} y1={y1+bh*t} x2={x2} y2={y1+bh*t} stroke="rgba(255,255,255,0.18)" strokeWidth="0.22" style={{ pointerEvents:'none' }} />
                </React.Fragment>
              ))}
              {rectHandles.map(h => (
                <g key={h.id} style={{ cursor:h.cursor }} onPointerDown={startDrag(h.id)}>
                  <circle cx={h.cx} cy={h.cy} r={HR*2.8} fill="transparent" />
                  <circle cx={h.cx} cy={h.cy} r={h.isCorner ? HR : HR*0.8} fill={h.isCorner ? 'white' : 'rgba(255,255,255,0.75)'} stroke={h.isCorner ? 'var(--primary-color)' : 'rgba(255,255,255,0.5)'} strokeWidth={h.isCorner ? '0.6' : '0.35'} style={{ filter:'drop-shadow(0 0 1.5px rgba(0,0,0,0.85))' }} />
                  {h.isCorner && <circle cx={h.cx} cy={h.cy} r={HR*2} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.28" strokeDasharray="1 0.9" style={{ pointerEvents:'none' }} />}
                </g>
              ))}
            </>
          ) : (
            <>
              <path fillRule="evenodd" d={`M0,0 H100 V100 H0 Z ${polyPath}`} fill="rgba(0,0,0,0.52)" style={{ pointerEvents:'none' }} />
              <polygon points={polyPoints} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.88)" strokeWidth="0.55" strokeDasharray="3 1.5" style={{ cursor:'move' }} onPointerDown={startDrag('move')} />
              <g style={{ cursor:'move' }} onPointerDown={startDrag('move')}>
                <circle cx={centroid.x} cy={centroid.y} r={HR_QUAD*2.2} fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.45)" strokeWidth="0.3" />
                <line x1={centroid.x-2.2} y1={centroid.y} x2={centroid.x+2.2} y2={centroid.y} stroke="white" strokeWidth="0.4" style={{ pointerEvents:'none' }} />
                <line x1={centroid.x} y1={centroid.y-2.2} x2={centroid.x} y2={centroid.y+2.2} stroke="white" strokeWidth="0.4" style={{ pointerEvents:'none' }} />
              </g>
              {quadCornerHandles.map(h => (
                <g key={h.id} style={{ cursor:h.cursor }} onPointerDown={startDrag(h.id)}>
                  <circle cx={h.x} cy={h.y} r={HR_QUAD*2.5} fill="transparent" />
                  <circle cx={h.x} cy={h.y} r={HR_QUAD} fill="white" stroke="var(--primary-color)" strokeWidth="0.7" style={{ filter:'drop-shadow(0 0 2px rgba(0,0,0,0.9))' }} />
                </g>
              ))}
            </>
          )}
        </svg>
      </div>

      <div className="via-mask-controls">
        <div className="via-mask-actions">
          <button type="button" className="via-btn via-btn--ghost" onClick={onCancelar}>← Cambiar foto</button>
          <button type="button" className="via-btn via-btn--primary" onClick={confirmar}>✨ Generar con IA</button>
        </div>
      </div>
    </div>
  );
});

export default BoundingBoxSelector;