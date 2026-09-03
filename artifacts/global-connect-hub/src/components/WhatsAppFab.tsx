import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const WHATSAPP_NUMBER = "250793521437";
const DEFAULT_MESSAGE = "Hello Noble Spaces, I'd like more information about your services.";

export const WhatsAppFab = () => {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-open the tooltip once after a short delay to invite engagement
  useEffect(() => {
    if (!show) return;
    const t1 = setTimeout(() => setTooltipOpen(true), 1200);
    const t2 = setTimeout(() => setTooltipOpen(false), 7000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [show]);

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-end gap-3 transition-all duration-500 ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      {tooltipOpen && (
        <div className="relative mb-1 hidden max-w-[240px] rounded-2xl border border-gold/30 bg-card px-4 py-3 text-sm text-foreground shadow-deep sm:block">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setTooltipOpen(false)}
                aria-label={t("tooltip.close")}
                className="absolute -right-2 -top-2 rounded-full border border-gold/30 bg-background p-1 text-muted-foreground hover:text-gold"
              >
                <X className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("tooltip.close")}</p>
            </TooltipContent>
          </Tooltip>
          <div className="font-display text-base text-gold">{t("whatsapp.title")}</div>
          <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t("whatsapp.subtitle")}
          </div>
          <span className="absolute -bottom-1.5 right-8 h-3 w-3 rotate-45 border-b border-r border-gold/30 bg-card" />
        </div>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("whatsapp.aria")}
            onMouseEnter={() => setTooltipOpen(true)}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(142_70%_45%)] text-white shadow-deep transition-transform hover:scale-110"
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-[hsl(142_70%_45%)] opacity-30" />
            <MessageCircle className="relative h-6 w-6" fill="currentColor" strokeWidth={0} />
          </a>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("whatsapp.aria")}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
