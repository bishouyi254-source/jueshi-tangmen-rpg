import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";
import StartPage from "@/pages/StartPage/StartPage";
import GameShell from "@/components/GameShell";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<StartPage />} />
        <Route path="game" element={<GameShell />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
