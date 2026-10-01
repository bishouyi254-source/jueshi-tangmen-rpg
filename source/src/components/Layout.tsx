import { Outlet } from "react-router-dom";
import { GameProvider } from "@/lib/gameStore";
import { Toaster } from "@/components/ui/sonner";

export const Layout = () => {
  return (
    <GameProvider>
      <Outlet />
      <Toaster richColors position="top-center" />
    </GameProvider>
  );
};
