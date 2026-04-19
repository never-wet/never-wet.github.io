import { useSite } from "@/app/SiteProvider";
import { AudioDock } from "@/components/ui/AudioDock";
import { objectById, projectById } from "@/memory/contentRegistry";
import { projectIndex } from "@/memory/projectIndex";
import { sceneIndex } from "@/memory/sceneIndex";
import { siteManifest } from "@/memory/siteManifest";
import { uiManifest } from "@/memory/uiManifest";

const outroLinks = [
  {
    label: "Games archive",
    href: "https://never-wet.github.io/games/",
  },
  {
    label: "GitHub profile",
    href: "https://github.com/never-wet",
  },
];

export function CinematicOverlay() {
  const {
    activeProjectId,
    activeScene,
    hoveredProject,
    jumpToScene,
    openProject,
    scrollProgress,
    viewedProjects,
  } = useSite();

  const sceneCopyAlign = (() => {
    if (!activeScene.projectId) {
      return activeScene.overlayAlign;
    }

    const project = projectById[activeScene.projectId];
    const object = project ? objectById[project.objectId] : null;

    if (!object) {
      return activeScene.overlayAlign;
    }

    return object.position[0] >= 0 ? "left" : "right";
  })();

  return (
    <div className="cinematic-overlay">
      <header className="top-bar">
        <div className="top-bar__brand">
          <p>{siteManifest.handle}</p>
          <strong>{siteManifest.title}</strong>
        </div>
        <nav className="scene-nav" aria-label="Scene navigation">
          <span>{uiManifest.navigation.sceneLabel}</span>
          {sceneIndex.map((scene) => (
            <button
              key={scene.id}
              type="button"
              className={activeScene.id === scene.id ? "is-active" : ""}
              onClick={() => jumpToScene(scene.id)}
            >
              {scene.label}
            </button>
          ))}
        </nav>
        <AudioDock />
      </header>

      <section
        className={`scene-copy scene-copy--${sceneCopyAlign}${activeScene.projectId ? " scene-copy--project" : ""}${activeProjectId ? " is-hidden" : ""}`}
      >
        <p className="eyebrow">{activeScene.eyebrow}</p>
        <h2>{activeScene.title}</h2>
        <p>{activeScene.description}</p>
        <div className="scene-copy__meta">
          <span>{uiManifest.instructions.scroll}</span>
          <span>{hoveredProject ? hoveredProject.interactionText : uiManifest.instructions.click}</span>
        </div>
        {activeScene.id === "outro" ? (
          <div className="scene-copy__links">
            {outroLinks.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
          </div>
        ) : null}
      </section>

      <aside className={`project-rail${activeProjectId ? " is-hidden" : ""}`}>
        <p>{uiManifest.navigation.projectsLabel}</p>
        <div className="project-rail__list">
          {projectIndex.map((project) => (
            <button key={project.id} type="button" onClick={() => openProject(project.id)}>
              <span>{project.title}</span>
              <small>{viewedProjects.includes(project.id) ? "Visited" : "Enter chamber"}</small>
            </button>
          ))}
        </div>
      </aside>

      <div className={`journey-meter${activeProjectId ? " is-hidden" : ""}`}>
        <span>Journey</span>
        <strong>{Math.round(scrollProgress * 100)}%</strong>
      </div>
    </div>
  );
}
