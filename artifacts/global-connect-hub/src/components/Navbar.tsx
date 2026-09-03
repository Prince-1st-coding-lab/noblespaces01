import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation, Link } from "react-router-dom";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Menu, X, Instagram, Facebook, ChevronDown, Lock, ShoppingBag } from "lucide-react";
import { getServiceIndex } from "@/data/services";
import { useServices } from "@/hooks/useServices";
import { SOCIAL_LINKS } from "@/data/socials";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { useCart } from "@/context/CartContext";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type ServiceItem = { title: string; desc: string };

export const Navbar = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const items = t("services.items", { returnObjects: true }) as ServiceItem[];
  const { data: services } = useServices();
  const { count, setOpen: setCartOpen } = useCart();


  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setServicesOpen(false);
    setMobileServicesOpen(false);
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const links = [
    { to: "/", label: t("nav.home"), end: true },
    { to: "/home-services", label: t("nav.home_services") },
    { to: "/about", label: t("nav.about") },
    { to: "/shop", label: "Shop" },
    { to: "/blog", label: "Journal" },
    { to: "/gallery", label: t("nav.gallery") },
    { to: "/contact", label: t("nav.contact") },
  ];


  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-light uppercase tracking-[0.2em] transition-colors ${
      isActive ? "text-gold" : "text-foreground/80 hover:text-gold"
    }`;

  const servicesActive = pathname.startsWith("/services");

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all ${
        scrolled || pathname !== "/"
          ? "bg-background/85 backdrop-blur-xl border-b border-gold/10"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Logo />

        <div className="hidden items-center gap-8 lg:flex">
          <NavLink to="/" end className={linkClass}>
            {t("nav.home")}
          </NavLink>
          <NavLink to="/home-services" className={linkClass}>
            {t("nav.home_services")}
          </NavLink>
          <NavLink to="/about" className={linkClass}>
            {t("nav.about")}
          </NavLink>

          {/* Services dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setServicesOpen((s) => !s)}
              className={`flex items-center gap-1 text-sm font-light uppercase tracking-[0.2em] transition-colors ${
                servicesActive ? "text-gold" : "text-foreground/80 hover:text-gold"
              }`}
              aria-expanded={servicesOpen}
            >
              {t("nav.services")}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${servicesOpen ? "rotate-180" : ""}`}
              />
            </button>
            {servicesOpen && (
              <div className="absolute left-1/2 top-full z-50 mt-3 w-[320px] -translate-x-1/2 rounded-xl border border-gold/20 bg-background/95 p-2 shadow-2xl backdrop-blur-xl">
                <Link
                  to="/services"
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-xs uppercase tracking-[0.25em] text-gold hover:bg-gold/10"
                >
                  {t("common.view_all")}
                </Link>
                <div className="my-1 h-px bg-gold/10" />
                <ul className="max-h-[60vh] overflow-y-auto py-1">
                  {services.map((svc) => {
                    const Icon = svc.icon;
                    return (
                      <li key={svc.slug}>
                        <Link
                          to={`/services/${svc.slug}`}
                          className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/85 transition-colors hover:bg-gold/10 hover:text-gold"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/30 text-gold transition-colors group-hover:bg-gold group-hover:text-primary-foreground">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="truncate">{svc.title ?? items[getServiceIndex(svc.slug)]?.title ?? svc.slug.replace(/-/g, " ")}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <NavLink to="/shop" className={linkClass}>
            Shop
          </NavLink>
          <NavLink to="/gallery" className={linkClass}>
            {t("nav.gallery")}
          </NavLink>
          <NavLink to="/contact" className={linkClass}>
            {t("nav.contact")}
          </NavLink>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCartOpen(true)}
                aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-gold transition-all hover:bg-gold hover:text-primary-foreground"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                {count > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[0.6rem] font-medium text-primary-foreground">
                    {count}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Your cart</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-gold transition-all hover:bg-gold hover:text-primary-foreground sm:flex"
              >
                <Instagram className="h-3.5 w-3.5" />
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("tooltip.instagram")}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-gold transition-all hover:bg-gold hover:text-primary-foreground sm:flex"
              >
                <Facebook className="h-3.5 w-3.5" />
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("tooltip.facebook")}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={SOCIAL_LINKS.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-gold transition-all hover:bg-gold hover:text-primary-foreground sm:flex"
              >
                <TikTokIcon className="h-3.5 w-3.5" />
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("tooltip.tiktok")}</p>
            </TooltipContent>
          </Tooltip>
          <LanguageSwitcher />
          <Tooltip>

            <TooltipTrigger asChild>
              <button
                onClick={() => setOpen(!open)}
                className="lg:hidden rounded-full border border-gold/40 p-2 text-gold"
                aria-label="Menu"
              >
                {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{open ? t("tooltip.close_menu") : t("tooltip.menu")}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </nav>

      {open && (
        <div className="lg:hidden max-h-[85dvh] overflow-y-auto border-t border-gold/10 bg-background/95 backdrop-blur-xl">
          <div className="flex flex-col gap-1 px-6 py-4">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `py-2 text-sm uppercase tracking-[0.2em] ${
                    isActive ? "text-gold" : "text-foreground/80 hover:text-gold"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}

            {/* Mobile services collapsible */}
            <button
              onClick={() => setMobileServicesOpen((s) => !s)}
              className={`flex items-center justify-between py-2 text-sm uppercase tracking-[0.2em] ${
                servicesActive ? "text-gold" : "text-foreground/80"
              }`}
            >
              <span>{t("nav.services")}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${mobileServicesOpen ? "rotate-180" : ""}`}
              />
            </button>
            {mobileServicesOpen && (
              <ul className="mb-2 ml-1 space-y-1 border-l border-gold/15 pl-3">
                <li>
                  <Link
                    to="/services"
                    className="block py-1.5 text-xs uppercase tracking-[0.25em] text-gold"
                  >
                    {t("common.view_all")}
                  </Link>
                </li>
                {services.map((svc) => {
                  const Icon = svc.icon;
                  return (
                    <li key={svc.slug}>
                      <Link
                        to={`/services/${svc.slug}`}
                        className="flex items-center gap-3 py-1.5 text-sm text-foreground/80 hover:text-gold"
                      >
                        <Icon className="h-3.5 w-3.5 text-gold" />
                        <span className="truncate">{svc.title ?? items[getServiceIndex(svc.slug)]?.title ?? svc.slug.replace(/-/g, " ")}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            
          </div>
        </div>
      )}
    </header>
  );
};
