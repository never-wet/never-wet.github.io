import { SiteProvider } from "@/app/SiteProvider";
import { AppShell } from "@/app/AppShell";
import { AudioProvider } from "@/audio/AudioProvider";

export function App() {
  return (
    <SiteProvider>
      <AudioProvider>
        <AppShell />
      </AudioProvider>
    </SiteProvider>
  );
}
