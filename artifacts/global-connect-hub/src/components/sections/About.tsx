import { useTranslation } from "react-i18next";
import office from "@/assets/service-office.jpg";

export const About = () => {
  const { t } = useTranslation();
  return (
    <section id="about" className="relative py-28 lg:py-36">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2 lg:items-center lg:px-10">
        <div className="relative">
          <div className="overflow-hidden rounded-[2rem] shadow-deep">
            <img src={office} alt="Crafted interior detail" loading="lazy" className="h-full w-full object-cover" />
          </div>
          <div className="absolute -bottom-8 -right-4 hidden h-40 w-40 rounded-full border border-gold/40 bg-background/70 backdrop-blur-md md:flex md:items-center md:justify-center">
            <div className="text-center">
              <div className="font-script text-2xl text-gold">since</div>
              <div className="font-display text-3xl text-foreground">2015</div>
            </div>
          </div>
        </div>

        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-gold">— 02</span>
          <h2 className="mt-4 font-display text-5xl font-semibold leading-tight lg:text-6xl">
            {t("about.title")}
          </h2>
          <p className="mt-6 max-w-lg text-muted-foreground">{t("about.body")}</p>

          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-gold/15 pt-8">
            {[
              { n: "10+", l: t("about.stat1") },
              { n: "240", l: t("about.stat2") },
              { n: "35", l: t("about.stat3") },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-4xl font-semibold text-gradient-gold">{s.n}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
