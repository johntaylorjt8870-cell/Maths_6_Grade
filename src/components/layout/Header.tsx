import { EngineerLink } from "@/components/identity/Engineer";
import { NavLinks } from "./NavLinks";
import { PlatformLogo } from "./PlatformLogo";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-6 py-2.5">
        <PlatformLogo />
        <NavLinks />
        <EngineerLink variant="header" />
      </div>
    </header>
  );
}
