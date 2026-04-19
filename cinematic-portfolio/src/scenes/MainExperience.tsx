import { ScrollCameraRig } from "@/animation/ScrollCameraRig";
import { AtmosphereField } from "@/scenes/environment/AtmosphereField";
import { BlackHole } from "@/scenes/environment/BlackHole";
import { Starfield } from "@/scenes/environment/Starfield";
import { IntroScene } from "@/scenes/IntroScene";
import { TransitionScene } from "@/scenes/TransitionScene";
import { OutroScene } from "@/scenes/OutroScene";
import { LanternOathScene } from "@/projects/LanternOathScene";
import { MidnightPawnScene } from "@/projects/MidnightPawnScene";
import { ReelsPullScene } from "@/projects/ReelsPullScene";

export function MainExperience() {
  return (
    <>
      <ScrollCameraRig />
      <Starfield />
      <BlackHole />
      <AtmosphereField />
      <IntroScene />
      <TransitionScene />
      <LanternOathScene />
      <MidnightPawnScene />
      <ReelsPullScene />
      <OutroScene />
    </>
  );
}
