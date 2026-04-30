"use client";

import { useState } from "react";
import { ObjectScanner } from "@/components/ObjectScanner";
import { RoomScanner } from "@/components/RoomScanner";

export type ScanTarget = "object" | "room";

export function CameraScanner() {
  const [scanTarget, setScanTarget] = useState<ScanTarget>("object");

  if (scanTarget === "room") {
    return <RoomScanner onObjectScanSelect={() => setScanTarget("object")} />;
  }

  return <ObjectScanner onRoomScanSelect={() => setScanTarget("room")} />;
}
