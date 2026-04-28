"use client";

import { useCallback, useEffect, useRef } from "react";
import { useTerrainStore } from "@/store/useTerrainStore";
import type { TerrainWorkerError, TerrainWorkerRequest, TerrainWorkerResponse } from "@/types/terrain";

function isWorkerError(message: TerrainWorkerResponse | TerrainWorkerError): message is TerrainWorkerError {
  return "error" in message;
}

export function useTerrainWorker() {
  const parameters = useTerrainStore((state) => state.parameters);
  const erosionRunId = useTerrainStore((state) => state.erosionRunId);
  const setTerrain = useTerrainStore((state) => state.setTerrain);
  const setStatus = useTerrainStore((state) => state.setStatus);
  const setError = useTerrainStore((state) => state.setError);
  const workerRef = useRef<Worker | null>(null);
  const requestRef = useRef(0);
  const activeRequestRef = useRef(0);
  const erosionRunRef = useRef(erosionRunId);

  const createWorker = useCallback(() => {
    const worker = new Worker(new URL("./terrain-worker.js", window.location.href));

    worker.onmessage = (event: MessageEvent<TerrainWorkerResponse | TerrainWorkerError>) => {
      const message = event.data;

      if (isWorkerError(message)) {
        setError(message.error);
        return;
      }

      setTerrain(message.terrain);
    };

    worker.onerror = (event) => {
      setError(event.message || "Terrain worker failed");
    };

    return worker;
  }, [setError, setTerrain]);

  useEffect(() => {
    workerRef.current = createWorker();

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [createWorker]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const worker = workerRef.current ?? createWorker();
      workerRef.current = worker;

      const applyErosion = erosionRunId !== erosionRunRef.current;
      erosionRunRef.current = erosionRunId;
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      activeRequestRef.current = requestId;

      setStatus(applyErosion ? "eroding" : "generating");
      setError(null);

      const request: TerrainWorkerRequest = {
        requestId,
        parameters,
        applyErosion
      };

      worker.postMessage(request);
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [createWorker, erosionRunId, parameters, setError, setStatus]);
}
