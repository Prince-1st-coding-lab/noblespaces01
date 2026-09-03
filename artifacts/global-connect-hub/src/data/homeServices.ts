import {
  Wrench, Sparkles, Truck, Home, Scissors, Sofa, type LucideIcon,
} from "lucide-react";

export type HomeService = {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const HOME_SERVICES: HomeService[] = [
  {
    slug: "property-maintenance",
    title: "Property Maintenance",
    description:
      "Reliable maintenance solutions for residential and commercial properties, including plumbing, electrical work, painting, masonry, and carpentry. We help keep your property safe, functional, and well-maintained.",
    icon: Wrench,
  },
  {
    slug: "home-office-cleaning",
    title: "Home & Office Cleaning",
    description:
      "Professional cleaning services designed to keep homes and workplaces clean, fresh, hygienic, and welcoming. We provide thorough cleaning tailored to your specific needs.",
    icon: Sparkles,
  },
  {
    slug: "move-in-move-out-cleaning",
    title: "Move-In & Move-Out Cleaning",
    description:
      "Comprehensive cleaning services for moving into or leaving a property. We ensure every space is thoroughly cleaned and ready for new occupants or handover.",
    icon: Truck,
  },
  {
    slug: "home-set-up-services",
    title: "Home Set-Up Services",
    description:
      "Practical assistance in preparing and organizing your home for comfortable living. From arranging essential spaces to completing finishing touches, we help make your home ready and functional.",
    icon: Home,
  },
  {
    slug: "fabric-replacement-services",
    title: "Fabric Replacement Services",
    description:
      "Professional replacement of worn, damaged, or outdated fabrics for furniture and household items. We help restore comfort and give your interiors a fresh, renewed appearance.",
    icon: Scissors,
  },
  {
    slug: "sofa-carpet-cleaning-services",
    title: "Sofa & Carpet Cleaning Services",
    description:
      "Deep cleaning solutions for sofas, carpets, and other fabric surfaces. We remove dirt, stains, dust, and odors while helping maintain the appearance and freshness of your furnishings.",
    icon: Sofa,
  },
];
