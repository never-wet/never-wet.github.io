"use client";

import dynamic from "next/dynamic";

const SpaceScene = dynamic(() => import("../components/SpaceScene"), {
  ssr: false,
  loading: () => <div className="boot-screen">Loading space scene...</div>,
});

export default function Home() {
  return <SpaceScene />;
}
