import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { audioManager } from "../../lib/audio/audioManager";
import { useGame } from "../../hooks/useGame";
import { audioRoutes } from "../../data/audio/audioRoutes";
import { getPlayerSummary } from "../../lib/game/selectors";
import { uiManifest } from "../../memory/uiManifest";
import { ArtImage } from "../common/ArtImage";
import { NotificationTray } from "../game/NotificationTray";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { state, latestSave, unlockAudio } = useGame();
  const location = useLocation();
  const summary = getPlayerSummary(state);
  const isPlaying = state.status === "playing";

  useEffect(() => {
    void unlockAudio();
  }, [unlockAudio]);

  useEffect(() => {
    if (state.combat) {
      const encounter = state.combat.encounterId;
      const music = audioRoutes.locations[state.currentLocationId as keyof typeof audioRoutes.locations]?.music ?? audioRoutes.battleFallback;
      audioManager.playMusic(music);
      return;
    }

    if (!isPlaying || location.pathname === "/" || location.pathname === "/new-game" || location.pathname === "/load") {
      audioManager.playMusic(audioRoutes.home.music);
      audioManager.playAmbience(audioRoutes.home.ambience);
      return;
    }

    const routeAudio = audioRoutes.locations[state.currentLocationId as keyof typeof audioRoutes.locations];
    if (routeAudio) {
      audioManager.playMusic(routeAudio.music);
      audioManager.playAmbience(routeAudio.ambience);
    }
  }, [isPlaying, location.pathname, state.combat, state.currentLocationId]);

  return (
    <div className="app-shell">
      <div className="app-backdrop" />
      <header className="site-header">
        <NavLink className="brand-lockup" to="/">
          <ArtImage assetId="logo-hollowmere" alt="Hollowmere logo" className="logo-art" />
        </NavLink>
        <div className="header-right">
          {isPlaying ? (
            <div className="status-strip">
              <span>Lv. {summary.level}</span>
              <span>HP {summary.hp}</span>
              <span>MP {summary.mp}</span>
              <span>{summary.silver} silver</span>
              <span>{summary.progress}% main story</span>
            </div>
          ) : latestSave ? (
            <div className="status-strip">
              <span>Latest save ready</span>
              <span>{latestSave.state.player.name}</span>
              <span>{latestSave.state.chapterId}</span>
            </div>
          ) : null}
        </div>
      </header>

      <nav className="site-nav">
        {(isPlaying ? uiManifest.primaryNav : uiManifest.titleActions).map((item) => (
          <NavLink key={item.path} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} to={item.path}>
            <ArtImage assetId={item.iconAssetId} alt="" className="nav-icon" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <main className="page-shell">{children}</main>
      <NotificationTray />
    </div>
  );
};
