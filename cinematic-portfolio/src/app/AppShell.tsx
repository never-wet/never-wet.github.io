import { SiteCanvas } from "@/components/canvas/SiteCanvas";
import { BootOverlay } from "@/components/ui/BootOverlay";
import { CinematicOverlay } from "@/components/ui/CinematicOverlay";
import { ProjectPanel } from "@/components/ui/ProjectPanel";
import { sceneIndex } from "@/memory/sceneIndex";
import { useSite } from "@/app/SiteProvider";

export function AppShell() {
  const { activeProjectId } = useSite();

  return (
    <div className={`app-shell${activeProjectId ? " app-shell--project-open" : ""}`}>
      <SiteCanvas />
      <div className="scroll-track" aria-hidden={Boolean(activeProjectId)}>
        {sceneIndex.map((scene) => (
          <section key={scene.id} className="scroll-track__marker" data-scene={scene.id}>
            <span className="sr-only">{scene.title}</span>
          </section>
        ))}
      </div>
      <CinematicOverlay />
      <ProjectPanel />
      <BootOverlay />
    </div>
  );
}
