import { Outlet } from "react-router-dom";
import { GameProvider } from "@/lib/gameStore";
import { Toaster } from "@/components/ui/sonner";
import { CloudAccountProvider } from './CloudAccount';

export const Layout = () => {
  return (
    <GameProvider>
      <CloudAccountProvider>
      <Outlet />
      <Toaster richColors position="top-center" />
      </CloudAccountProvider>
    </GameProvider>
  );
};
