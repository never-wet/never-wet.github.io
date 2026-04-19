import { objectManifest } from "@/memory/objectManifest";
import { projectIndex } from "@/memory/projectIndex";
import { sceneIndex } from "@/memory/sceneIndex";

export const sceneById = Object.fromEntries(sceneIndex.map((scene) => [scene.id, scene]));

export const objectById = Object.fromEntries(
  objectManifest.map((objectDefinition) => [objectDefinition.id, objectDefinition]),
);

export const projectById = Object.fromEntries(projectIndex.map((project) => [project.id, project]));

export const contentRegistry = projectIndex.map((project) => ({
  project,
  scene: sceneById[project.sceneId],
  object: objectById[project.objectId],
  uiCardId: `${project.id}-project-card`,
}));
