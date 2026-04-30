import AIChat from "@/components/AIChat";

export default function Home() {
  return (
    <main className="page-shell">
      <div className="site-bar">
        <a href="../">NW</a>
        <span>Secure Gemini Chat</span>
      </div>
      <AIChat />
    </main>
  );
}
