import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { useServices } from "@/hooks/useServices";
import { getServiceIndex } from "@/data/services";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

type ServiceItem = { title: string; desc: string };

const PREVIEW_COUNT = 6;

export const Services = ({ preview = false }: { preview?: boolean }) => {
  const { t } = useTranslation();
  const items = t("services.items", { returnObjects: true }) as ServiceItem[];
  const { data: services, isLoading, error } = useServices();
  const shown = preview ? services.slice(0, PREVIEW_COUNT) : services;

  return (
    <section id="services" className="page-grid relative py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-16 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-xs uppercase tracking-[0.3em] text-gold">— 01</span>
            <h2 className="mt-4 font-display text-5xl font-semibold leading-tight lg:text-6xl">
              {t("services.title")}
            </h2>
            <p className="mt-4 text-muted-foreground">{t("services.subtitle")}</p>
            <div className="mt-5 flex items-center gap-3">
              <span className="font-mono text-xs text-gold" data-testid="text-service-count">
                {t("common.service_count", { count: services.length })}
              </span>
              <span className="h-px w-10 bg-gold/30" />
              <span className="text-xs text-muted-foreground">
                {isLoading ? "Syncing catalogue" : error ? "Showing our saved catalogue" : "Available to book"}
              </span>
            </div>
          </div>
          {preview && (
            <Link
              to="/services"
              className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-5 py-3 text-xs uppercase tracking-[0.25em] text-gold transition-all hover:bg-gold/10"
            >
              {t("common.view_all")}
              <Tooltip>
                <TooltipTrigger asChild>
                  <ArrowRight className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("common.view_all_services")}</p>
                </TooltipContent>
              </Tooltip>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-gold/15 bg-gold/15 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && shown.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
              <div key={`service-skeleton-${i}`} className="space-y-5 bg-card p-7">
                <Skeleton className="h-12 w-12 rounded-full bg-secondary" />
                <Skeleton className="h-6 w-3/4 bg-secondary" />
                <Skeleton className="h-16 w-full bg-secondary" />
              </div>
            ))
            : !shown.length
              ? <div className="col-span-full bg-card p-10 text-center text-sm text-muted-foreground">Our service catalogue is being refreshed. Please check back shortly.</div>
            : shown.map((svc, i) => {
            const Icon = svc.icon;
            const fbIdx = getServiceIndex(svc.slug);
            const fb = fbIdx >= 0 ? items[fbIdx] : undefined;
            const title = svc.title ?? fb?.title ?? svc.slug.replace(/-/g, " ");
            const desc = svc.description ?? fb?.desc ?? "";
            return (
              <Link
                key={svc.slug}
                to={`/services/${svc.slug}`}
                className="group relative flex flex-col gap-4 bg-card p-7 transition-colors hover:bg-secondary"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/40 text-gold transition-all group-hover:bg-gold group-hover:text-primary-foreground">
                      {Icon ? <Icon className="h-5 w-5" /> : null}
                    </div>
                    <div className="font-display text-xs uppercase tracking-[0.25em] text-gold/70">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gold/60 transition-all group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-gold" />
                </div>
                <h3 className="font-display text-xl font-medium text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </Link>
            );
            })}
        </div>

        {preview && services.length > PREVIEW_COUNT && (
          <div className="mt-10 text-center">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm uppercase tracking-[0.2em] text-primary-foreground transition-all hover:bg-gold/90"
            >
              {t("common.view_all_services")}
              <Tooltip>
                <TooltipTrigger asChild>
                  <ArrowRight className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("common.view_all_services")}</p>
                </TooltipContent>
              </Tooltip>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
