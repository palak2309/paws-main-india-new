import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { DesktopSidebar, MobileSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />
      <MobileSidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="lg:pl-[264px]">
        <Topbar onOpenNav={() => setNavOpen(true)} />
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-[1440px] space-y-6 p-4 sm:p-6 lg:p-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
