import {
  Shirt, ChefHat, Tv, Briefcase, Scissors, Sparkles,
  Blinds, Volume2, LayoutPanelTop, Baby, Sofa, PanelTop,
  Brush, Dog, Utensils, Archive, Layers, PaintBucket,
  DoorOpen, DoorClosed, Palette, type LucideIcon,
} from "lucide-react";

// Auto-import every image inside each service folder.
// Drop any .jpg / .jpeg / .png / .webp into src/assets/services/<slug>/
// and it will appear in that service's gallery automatically.
//
// IMPORTANT: each service shows ONLY its own folder images.
// No cross-service fallback gallery — keeps content authentic per service.
const serviceImages = import.meta.glob(
  "../assets/services/*/*.{jpg,jpeg,png,webp}",
  { eager: true, import: "default", query: "?url" },
) as Record<string, string>;

const imagesForSlug = (slug: string): string[] => {
  return Object.entries(serviceImages)
    .filter(([path]) => path.includes(`/services/${slug}/`))
    .sort(([a], [b]) => {
      // Always put cover.* first, then alphabetical
      const aCover = /\/cover\.[a-z]+$/i.test(a) ? 0 : 1;
      const bCover = /\/cover\.[a-z]+$/i.test(b) ? 0 : 1;
      if (aCover !== bCover) return aCover - bCover;
      return a.localeCompare(b);
    })
    .map(([, url]) => url);
};

// "both" = ready stock available + custom orders accepted
// "custom" = made-to-order only (manufacturing/installation)
// "service" = on-site service (cleaning, installation visits)
export type Availability = "both" | "custom" | "service";

export type Service = {
  slug: string;
  icon: LucideIcon;
  availability: Availability;
  leadTimeDays: [number, number];
};

const baseServices: Service[] = [
  { slug: "interior-design",               icon: Palette,         availability: "service", leadTimeDays: [3, 14]  },
  { slug: "wardrobes-manufacturing",       icon: Shirt,           availability: "custom",  leadTimeDays: [10, 21] },
  { slug: "modern-kitchen-installations",  icon: ChefHat,         availability: "custom",  leadTimeDays: [14, 30] },
  { slug: "media-tv-wall-installation",    icon: Tv,              availability: "custom",  leadTimeDays: [7, 14]  },
  { slug: "office-equipment-supply",       icon: Briefcase,       availability: "both",    leadTimeDays: [2, 7]   },
  { slug: "fabric-replacement",            icon: Scissors,        availability: "service", leadTimeDays: [3, 7]   },
  { slug: "sofa-cleaning",                 icon: Sparkles,        availability: "service", leadTimeDays: [1, 3]   },
  { slug: "curtains-supply-installation",  icon: Blinds,          availability: "both",    leadTimeDays: [5, 14]  },
  { slug: "soundproof-installation",       icon: Volume2,         availability: "service", leadTimeDays: [5, 14]  },
  { slug: "wall-partitioning",             icon: LayoutPanelTop,  availability: "custom",  leadTimeDays: [5, 14]  },
  { slug: "baby-beds-manufacturing",       icon: Baby,            availability: "both",    leadTimeDays: [7, 14]  },
  { slug: "sofa-manufacturing",            icon: Sofa,            availability: "both",    leadTimeDays: [10, 21] },
  { slug: "ceiling-installation",          icon: PanelTop,        availability: "service", leadTimeDays: [5, 14]  },
  { slug: "carpet-cleaning",               icon: Brush,           availability: "service", leadTimeDays: [1, 3]   },
  { slug: "pet-houses-manufacturing",      icon: Dog,             availability: "both",    leadTimeDays: [5, 10]  },
  { slug: "dining-tables-manufacturing",   icon: Utensils,        availability: "both",    leadTimeDays: [10, 21] },
  { slug: "console-installation",          icon: Archive,         availability: "custom",  leadTimeDays: [7, 14]  },
  { slug: "carpet-supply-installation",    icon: Layers,          availability: "both",    leadTimeDays: [3, 10]  },
  { slug: "painting-works",                icon: PaintBucket,     availability: "service", leadTimeDays: [3, 10]  },
  { slug: "interior-door-manufacturing",   icon: DoorOpen,        availability: "both",    leadTimeDays: [7, 21]  },
  { slug: "exterior-door-manufacturing",   icon: DoorClosed,      availability: "both",    leadTimeDays: [10, 28] },
];

export type ResolvedService = Service & {
  cover: string;
  gallery: string[];
};

export const SERVICES: ResolvedService[] = baseServices.map((s) => {
  const gallery = imagesForSlug(s.slug);
  const cover = gallery[0] ?? "";
  return { ...s, cover, gallery };
});

export const getServiceBySlug = (slug: string) => SERVICES.find((s) => s.slug === slug);
export const getServiceIndex = (slug: string) => SERVICES.findIndex((s) => s.slug === slug);
