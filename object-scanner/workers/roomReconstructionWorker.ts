import { buildRoomPointCloud } from "@/utils/RoomPointCloudBuilder";
import type { RoomProcessedFrame, RoomScanMode } from "@/utils/RoomFrameProcessor";

type WorkerRequest = {
  frames: RoomProcessedFrame[];
  mode: RoomScanMode;
};

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const cloud = buildRoomPointCloud(event.data.frames, event.data.mode);
  self.postMessage({ cloud });
};

export {};
