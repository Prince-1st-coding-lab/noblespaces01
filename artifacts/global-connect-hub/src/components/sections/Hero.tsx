import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import heroImg from "@/assets/hero-living.jpg";

export const Hero = () => {
  const { t } = useTranslation();
  return (
    <section id="home" className="relative min-h-screen overflow-hidden pt-28">
      {/* Decorative arc image */}
      <div className="absolute right-0 top-0 h-[55vh] w-full lg:h-screen lg:w-[58%]">
        <div
          className="absolute inset-0 lg:rounded-bl-[40%]"
          style={{
            backgroundImage: `url(${heroImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-background/30 to-background lg:rounded-bl-[40%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-12 lg:grid-cols-2 lg:px-10 lg:pb-32 lg:pt-24">
        <div className="animate-fade-up">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-gold/40 bg-secondary/40 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <span className="text-xs uppercase tracking-[0.3em] text-gold">{t("hero.eyebrow")}</span>
          </div>
          <h1 className="font-display text-6xl font-semibold leading-[0.95] text-foreground sm:text-7xl lg:text-8xl">
            {t("hero.title")}
            <br />
            <span className="font-display text-5xl font-semibold uppercase tracking-wide text-gradient-gold sm:text-6xl lg:text-7xl">
              {t("hero.title_script")}
            </span>
          </h1>
          <p className="mt-8 max-w-lg text-base leading-relaxed text-muted-foreground">
            {t("hero.subtitle")}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/services"
              className="group inline-flex items-center gap-3 rounded-full bg-gold px-7 py-3.5 text-sm font-medium uppercase tracking-[0.2em] text-primary-foreground shadow-gold transition-transform hover:scale-[1.02]"
            >
              {t("hero.cta_primary")}
              <Tooltip>
                <TooltipTrigger asChild>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("common.view_all_services")}</p>
                </TooltipContent>
              </Tooltip>
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-3 rounded-full border border-gold/40 px-7 py-3.5 text-sm font-medium uppercase tracking-[0.2em] text-gold transition-colors hover:bg-secondary"
            >
              {t("hero.cta_secondary")}
            </Link>
          </div>
        </div>

        {/* Right side spacer; image is positioned absolutely */}
        <div className="hidden lg:block" />
      </div>
    </section>
  );
};
