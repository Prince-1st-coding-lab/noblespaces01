import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Download, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export type LightboxItem = { src: string; alt?: string };

type LightboxProps = {
  items: LightboxItem[];
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (i: number) => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const STEP = 0.5;

export const Lightbox = ({ items, index, open, onClose, onIndexChange }: LightboxProps) => {
  const { t } = useTranslation();
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const goPrev = useCallback(() => {
    if (!items.length) return;
    onIndexChange((index - 1 + items.length) % items.length);
    reset();
  }, [index, items.length, onIndexChange, reset]);

  const goNext = useCallback(() => {
    if (!items.length) return;
    onIndexChange((index + 1) % items.length);
    reset();
  }, [index, items.length, onIndexChange, reset]);

  const zoomIn = useCallback(() => setScale((s) => Math.min(MAX_SCALE, +(s + STEP).toFixed(2))), []);
  const zoomOut = useCallback(
    () =>
      setScale((s) => {
        const next = Math.max(MIN_SCALE, +(s - STEP).toFixed(2));
        if (next === 1) setOffset({ x: 0, y: 0 });
        return next;
      }),
    [],
  );

  // Keyboard
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "+" || e.key === "=") zoomIn();
      else if (e.key === "-") zoomOut();
      else if (e.key === "0") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, goPrev, goNext, zoomIn, zoomOut, reset]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Reset zoom when index changes externally
  useEffect(() => {
    reset();
  }, [index, reset]);

  if (!open || typeof document === "undefined") return null;

  const current = items[index];
  if (!current) return null;

  const onWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  const onDoubleClick = () => {
    if (scale === 1) setScale(2);
    else reset();
  };

  // Mouse drag pan (only when zoomed)
  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.baseX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.baseY + (e.clientY - dragRef.current.startY),
    });
  };
  const onMouseUp = () => {
    dragRef.current = null;
  };

  // Touch: single = pan/swipe, two-finger = pinch zoom
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { startDist: Math.hypot(dx, dy), startScale: scale };
    } else if (e.touches.length === 1 && scale > 1) {
      const t = e.touches[0];
      dragRef.current = { startX: t.clientX, startY: t.clientY, baseX: offset.x, baseY: offset.y };
    } else if (e.touches.length === 1) {
      // store for swipe detection
      const t = e.touches[0];
      dragRef.current = { startX: t.clientX, startY: t.clientY, baseX: 0, baseY: 0 };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const next = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, pinchRef.current.startScale * (dist / pinchRef.current.startDist)),
      );
      setScale(+next.toFixed(2));
    } else if (e.touches.length === 1 && dragRef.current && scale > 1) {
      const t = e.touches[0];
      setOffset({
        x: dragRef.current.baseX + (t.clientX - dragRef.current.startX),
        y: dragRef.current.baseY + (t.clientY - dragRef.current.startY),
      });
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    // swipe nav when not zoomed
    if (scale === 1 && dragRef.current && e.changedTouches.length === 1) {
      const t = e.changedTouches[0];
      const dx = t.clientX - dragRef.current.startX;
      const dy = t.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) goPrev();
        else goNext();
      }
    }
    dragRef.current = null;
    pinchRef.current = null;
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-gold/15 px-4 py-3 sm:px-6">
        <div className="text-xs uppercase tracking-[0.25em] text-gold/80">
          {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={zoomOut}
                disabled={scale <= MIN_SCALE}
                aria-label="Zoom out"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-gold transition-all hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("tooltip.zoom_out")}</p>
            </TooltipContent>
          </Tooltip>
          <span className="min-w-[3rem] text-center text-xs text-gold/80">
            {Math.round(scale * 100)}%
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={zoomIn}
                disabled={scale >= MAX_SCALE}
                aria-label="Zoom in"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-gold transition-all hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("tooltip.zoom_in")}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={reset}
                aria-label="Reset zoom"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-gold transition-all hover:bg-gold/10"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("tooltip.reset_zoom")}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(current.src, { mode: "cors" });
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    const urlPath = new URL(current.src, window.location.href).pathname;
                    const base = urlPath.split("/").pop() || "image";
                    const safeAlt = (current.alt || "image").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
                    a.download = safeAlt ? `${safeAlt}-${base}` : base;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  } catch {
                    window.open(current.src, "_blank", "noopener,noreferrer");
                  }
                }}
                aria-label="Download image"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-gold transition-all hover:bg-gold/10"
              >
                <Download className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("tooltip.download")}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onClose}
                aria-label="Close viewer"
                className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-gold transition-all hover:bg-gold/10"
              >
                <X className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("tooltip.close")}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Stage */}
      <div
        className="relative flex-1 select-none overflow-hidden"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClick={onDoubleClick}
        style={{ cursor: scale > 1 ? (dragRef.current ? "grabbing" : "grab") : "zoom-in" }}
      >
        <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-10">
          <img
            src={current.src}
            alt={current.alt ?? ""}
            draggable={false}
            className="max-h-full max-w-full object-contain transition-transform duration-150 ease-out"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: "center center",
            }}
          />
        </div>

        {items.length > 1 && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={goPrev}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-background/60 text-gold backdrop-blur transition-all hover:bg-gold/10 sm:left-6"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("tooltip.previous")}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={goNext}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-background/60 text-gold backdrop-blur transition-all hover:bg-gold/10 sm:right-6"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("tooltip.next")}</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      {/* Caption + thumbnails */}
      <div className="border-t border-gold/15 px-4 py-3 sm:px-6">
        {current.alt && (
          <div className="mb-3 text-center font-display text-sm capitalize text-gold/90">
            {current.alt}
          </div>
        )}
        {items.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {items.map((it, i) => (
              <button
                key={`${it.src}-${i}`}
                onClick={() => {
                  onIndexChange(i);
                  reset();
                }}
                aria-label={`View image ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border transition-all sm:h-16 sm:w-16 ${
                  i === index
                    ? "border-gold ring-2 ring-gold/40"
                    : "border-gold/20 opacity-60 hover:opacity-100"
                }`}
              >
                <img src={it.src} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
