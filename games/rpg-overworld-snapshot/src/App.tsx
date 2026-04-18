import { HashRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { CharacterPage } from "./pages/CharacterPage";
import { CreditsPage } from "./pages/CreditsPage";
import { GamePage } from "./pages/GamePage";
import { HomePage } from "./pages/HomePage";
import { InventoryPage } from "./pages/InventoryPage";
import { JournalPage } from "./pages/JournalPage";
import { LoadPage } from "./pages/LoadPage";
import { MapPage } from "./pages/MapPage";
import { NewGamePage } from "./pages/NewGamePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { QuestsPage } from "./pages/QuestsPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/new-game" element={<NewGamePage />} />
          <Route path="/load" element={<LoadPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/character" element={<CharacterPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/credits" element={<CreditsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
