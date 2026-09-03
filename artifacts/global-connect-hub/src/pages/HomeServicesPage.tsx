import { HomeServices } from "@/components/sections/HomeServices";
import { useSeo } from "@/hooks/useSeo";

const HomeServicesPage = () => {
  useSeo({
    title: "Noble Home Services | Maintenance & Cleaning in Rwanda",
    description:
      "Property maintenance, home and office cleaning, move-in/move-out cleaning, home set-up, fabric replacement, and sofa & carpet cleaning by Noble Spaces.",
    path: "/home-services",
  });

  return (
    <div className="pt-28">
      <HomeServices />
    </div>
  );
};

export default HomeServicesPage;
