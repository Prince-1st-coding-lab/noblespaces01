import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const langs = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "rw", label: "Kinyarwanda" },
];

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const current = langs.find((l) => l.code === i18n.language.split("-")[0]) ?? langs[0];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-secondary/40 px-3.5 py-1.5 text-xs uppercase tracking-[0.2em] text-gold transition-colors hover:bg-secondary">
            <Globe className="h-3.5 w-3.5" />
            {current.code.toUpperCase()}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-gold/30 bg-card">
            {langs.map((l) => (
              <DropdownMenuItem
                key={l.code}
                onClick={() => i18n.changeLanguage(l.code)}
                className="cursor-pointer text-foreground focus:bg-secondary focus:text-gold"
              >
                {l.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipTrigger>
      <TooltipContent>
        <p>{t("tooltip.change_language")}</p>
      </TooltipContent>
    </Tooltip>
  );
};
