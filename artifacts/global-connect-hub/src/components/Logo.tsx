import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";

export const Logo = ({ className = "" }: { className?: string }) => (
  <Link to="/" aria-label="Noble Spaces home" className={`flex items-center gap-3 ${className}`}>
    <img src={logo} alt="Noble Spaces logo" className="h-12 w-auto md:h-14" />
  </Link>
);
