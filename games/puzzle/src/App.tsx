import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { AboutPage } from "./pages/AboutPage";
import { AllPuzzlesPage } from "./pages/AllPuzzlesPage";
import { CategoryPage } from "./pages/CategoryPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EscapeRoomPage } from "./pages/EscapeRoomPage";
import { EscapeRoomsPage } from "./pages/EscapeRoomsPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PuzzlePage } from "./pages/PuzzlePage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/puzzles" element={<AllPuzzlesPage />} />
        <Route path="/category/:categoryId" element={<CategoryPage />} />
        <Route path="/puzzle/:puzzleId" element={<PuzzlePage />} />
        <Route path="/escape" element={<EscapeRoomsPage />} />
        <Route path="/escape/:roomId" element={<EscapeRoomPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
