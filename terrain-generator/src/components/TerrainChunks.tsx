"use client";

import { ThreeEvent } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createTerrainMaterial } from "@/shaders/terrainMaterial";
import { useTerrainStore } from "@/store/useTerrainStore";
import type { RenderQuality, TerrainData, TerrainParameters } from "@/types/terrain";

interface ChunkSpec {
  id: string;
  x0: number;
  z0: number;
  x1: number;
  z1: number;
}

function strideForQuality(quality: RenderQuality, terrain: TerrainData) {
  if (quality === "quality") return 1;
  if (quality === "balanced") return terrain.width > 257 ? 2 : 1;
  return terrain.width > 129 ? 3 : 2;
}

function createChunkSpecs(terrain: TerrainData) {
  const specs: ChunkSpec[] = [];
  const chunkCells = terrain.width > 257 ? 48 : 32;

  for (let z = 0; z < terrain.height - 1; z += chunkCells) {
    for (let x = 0; x < terrain.width - 1; x += chunkCells) {
      specs.push({
        id: `${x}-${z}`,
        x0: x,
        z0: z,
        x1: Math.min(terrain.width - 1, x + chunkCells),
        z1: Math.min(terrain.height - 1, z + chunkCells)
      });
    }
  }

  return specs;
}

function createTerrainGeometry(terrain: TerrainData, spec: ChunkSpec, stride: number) {
  const xSamples: number[] = [];
  const zSamples: number[] = [];
  const positions: number[] = [];
  const heights: number[] = [];
  const slopes: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const range = Math.max(0.001, terrain.maxHeight - terrain.minHeight);

  for (let x = spec.x0; x <= spec.x1; x += stride) xSamples.push(x);
  for (let z = spec.z0; z <= spec.z1; z += stride) zSamples.push(z);
  if (xSamples[xSamples.length - 1] !== spec.x1) xSamples.push(spec.x1);
  if (zSamples[zSamples.length - 1] !== spec.z1) zSamples.push(spec.z1);

  for (const z of zSamples) {
    for (const x of xSamples) {
      const index = z * terrain.width + x;
      const worldX = (x / (terrain.width - 1) - 0.5) * terrain.size;
      const worldZ = (z / (terrain.height - 1) - 0.5) * terrain.size;
      const y = terrain.heights[index];

      positions.push(worldX, y, worldZ);
      heights.push(y);
      slopes.push(terrain.slopes[index] ?? 0);
      uvs.push(x / (terrain.width - 1), z / (terrain.height - 1));
    }
  }

  const rowLength = xSamples.length;
  for (let z = 0; z < zSamples.length - 1; z += 1) {
    for (let x = 0; x < xSamples.length - 1; x += 1) {
      const a = z * rowLength + x;
      const b = a + 1;
      const c = (z + 1) * rowLength + x;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("terrainHeight", new THREE.Float32BufferAttribute(heights, 1));
  geometry.setAttribute("terrainSlope", new THREE.Float32BufferAttribute(slopes, 1));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return geometry;
}

interface TerrainChunkProps {
  terrain: TerrainData;
  parameters: TerrainParameters;
  spec: ChunkSpec;
  stride: number;
  material: THREE.ShaderMaterial;
  onBrush: (event: ThreeEvent<PointerEvent>, startStroke?: boolean) => void;
  onBrushEnd: () => void;
}

function TerrainChunk({ terrain, parameters, spec, stride, material, onBrush, onBrushEnd }: TerrainChunkProps) {
  const geometry = useMemo(() => createTerrainGeometry(terrain, spec, stride), [spec, stride, terrain]);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      castShadow={parameters.shadowsEnabled}
      receiveShadow={parameters.shadowsEnabled}
      onPointerDown={(event) => onBrush(event, true)}
      onPointerMove={(event) => onBrush(event)}
      onPointerUp={onBrushEnd}
      onPointerLeave={onBrushEnd}
    />
  );
}

export function TerrainChunks() {
  const terrain = useTerrainStore((state) => state.terrain);
  const parameters = useTerrainStore((state) => state.parameters);
  const brushEnabled = useTerrainStore((state) => state.brush.enabled);
  const applyBrushAt = useTerrainStore((state) => state.applyBrushAt);
  const drawingRef = useRef(false);
  const lastBrushRef = useRef(0);

  const material = useMemo(() => {
    if (!terrain) return null;
    return createTerrainMaterial(parameters.materialPreset, terrain.minHeight, terrain.maxHeight);
  }, [parameters.materialPreset, terrain]);

  useEffect(() => {
    return () => material?.dispose();
  }, [material]);

  const specs = useMemo(() => (terrain ? createChunkSpecs(terrain) : []), [terrain]);
  const stride = terrain ? strideForQuality(parameters.renderQuality, terrain) : 1;

  const handleBrush = useCallback(
    (event: ThreeEvent<PointerEvent>, startStroke = false) => {
      if (!brushEnabled) return;
      event.stopPropagation();
      if (startStroke) drawingRef.current = true;
      if (!drawingRef.current) return;

      const now = performance.now();
      if (!startStroke && now - lastBrushRef.current < 28) return;
      lastBrushRef.current = now;
      applyBrushAt(event.point.x, event.point.z);
    },
    [applyBrushAt, brushEnabled]
  );

  const handleBrushEnd = useCallback(() => {
    drawingRef.current = false;
  }, []);

  if (!terrain || !material) return null;

  return (
    <group onPointerUp={handleBrushEnd}>
      {specs.map((spec) => (
        <TerrainChunk
          key={`${terrain.id}-${spec.id}-${stride}`}
          terrain={terrain}
          parameters={parameters}
          spec={spec}
          stride={stride}
          material={material}
          onBrush={handleBrush}
          onBrushEnd={handleBrushEnd}
        />
      ))}
    </group>
  );
}
