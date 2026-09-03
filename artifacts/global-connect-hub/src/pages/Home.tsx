import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";
import { HomeServices } from "@/components/sections/HomeServices";
import { TrendingBanner } from "@/components/sections/TrendingBanner";
import { ShopStrip } from "@/components/sections/ShopStrip";
import { About } from "@/components/sections/About";
import { Gallery } from "@/components/sections/Gallery";
import { Testimonials } from "@/components/sections/Testimonials";
import { Contact } from "@/components/sections/Contact";

const Home = () => (
  <>
    <Hero />
    <Services preview />
    <HomeServices preview />
    <TrendingBanner />
    <ShopStrip />
    <About />
    <Gallery preview />
    <Testimonials preview />
    <Contact preview />

  </>
);

export default Home;
