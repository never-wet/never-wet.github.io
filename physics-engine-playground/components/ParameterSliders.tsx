"use client";

import { PanelSection } from "@/components/ui/PanelSection";
import { SliderControl } from "@/components/ui/SliderControl";
import { usePlaygroundStore, type NumberSettingKey } from "@/physics/usePlaygroundStore";

export function ParameterSliders() {
  const experimentId = usePlaygroundStore((state) => state.experimentId);
  const gravityX = usePlaygroundStore((state) => state.gravityX);
  const gravityY = usePlaygroundStore((state) => state.gravityY);
  const gravityZ = usePlaygroundStore((state) => state.gravityZ);
  const mass = usePlaygroundStore((state) => state.mass);
  const friction = usePlaygroundStore((state) => state.friction);
  const restitution = usePlaygroundStore((state) => state.restitution);
  const windSpeed = usePlaygroundStore((state) => state.windSpeed);
  const damping = usePlaygroundStore((state) => state.damping);
  const springStiffness = usePlaygroundStore((state) => state.springStiffness);
  const pendulumLength = usePlaygroundStore((state) => state.pendulumLength);
  const fieldStrength = usePlaygroundStore((state) => state.fieldStrength);
  const orbitalGravity = usePlaygroundStore((state) => state.orbitalGravity);
  const initialVelocity = usePlaygroundStore((state) => state.initialVelocity);
  const setNumber = usePlaygroundStore((state) => state.setNumber);

  const update = (key: NumberSettingKey) => (value: number) => setNumber(key, value);
  const is3d = experimentId === "gravity-3d";
  const isSpring = experimentId === "pendulum-spring";
  const isWind = experimentId === "wind-aerodynamics";
  const isOrbit = experimentId === "orbit-gravity";
  const isField = experimentId === "magnet-field";
  const isChain = experimentId === "chain-ragdoll";

  return (
    <>
      <PanelSection title="World Forces">
        <SliderControl label="Gravity X" max={2} min={-2} step={0.05} value={gravityX} onChange={update("gravityX")} />
        <SliderControl label={is3d ? "Gravity Y" : "Gravity Y"} max={is3d ? 2 : 2} min={is3d ? -18 : -2} step={0.05} value={gravityY} onChange={update("gravityY")} />
        {is3d ? <SliderControl label="Gravity Z" max={2} min={-18} step={0.05} value={gravityZ} onChange={update("gravityZ")} /> : null}
        {isWind ? <SliderControl label="Wind Speed" max={16} min={-2} step={0.1} value={windSpeed} onChange={update("windSpeed")} /> : null}
        {isOrbit ? <SliderControl label="Orbital G" max={1.2} min={0.02} step={0.01} value={orbitalGravity} onChange={update("orbitalGravity")} /> : null}
        {isField ? <SliderControl label="Field Strength" max={1.4} min={0.05} step={0.01} value={fieldStrength} onChange={update("fieldStrength")} /> : null}
      </PanelSection>
      <PanelSection title="Material">
        <SliderControl label="Mass" max={24} min={0.5} step={0.5} unit="kg" value={mass} onChange={update("mass")} />
        <SliderControl label="Friction" max={1} min={0} step={0.01} value={friction} onChange={update("friction")} />
        <SliderControl label="Restitution" max={1} min={0} step={0.01} value={restitution} onChange={update("restitution")} />
        <SliderControl label="Initial Velocity" max={12} min={0} step={0.1} value={initialVelocity} onChange={update("initialVelocity")} />
      </PanelSection>
      {isSpring || isChain || isField ? (
        <PanelSection title="Constraint Response">
          {isSpring ? <SliderControl label="Pendulum Length" max={460} min={120} step={5} value={pendulumLength} onChange={update("pendulumLength")} /> : null}
          {isSpring ? <SliderControl label="Spring Stiffness" max={0.04} min={0.002} step={0.001} value={springStiffness} onChange={update("springStiffness")} /> : null}
          <SliderControl label="Damping" max={0.12} min={0} step={0.002} value={damping} onChange={update("damping")} />
        </PanelSection>
      ) : null}
    </>
  );
}
