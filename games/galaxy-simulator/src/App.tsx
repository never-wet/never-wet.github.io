import { useState } from "react";
import { GalaxyScene } from "./components/GalaxyScene";
import { ObjectCreator } from "./components/ObjectCreator";
import { ObjectInspector } from "./components/ObjectInspector";
import { SimulationHUD } from "./components/SimulationHUD";

export function App() {
  const [toolsOpen, setToolsOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);

  return (
    <main className="app-shell">
      <GalaxyScene />
      <SimulationHUD />
      <ObjectCreator isOpen={toolsOpen} onToggle={() => setToolsOpen((open) => !open)} />
      <ObjectInspector isOpen={inspectorOpen} onToggle={() => setInspectorOpen((open) => !open)} />
    </main>
  );
}
