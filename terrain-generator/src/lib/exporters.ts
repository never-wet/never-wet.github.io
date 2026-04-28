import type { TerrainData, TerrainParameters } from "@/types/terrain";

function safeName(value: string) {
  return value.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "terrain";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 250);
}

function worldPosition(terrain: TerrainData, x: number, z: number) {
  const worldX = (x / (terrain.width - 1) - 0.5) * terrain.size;
  const worldZ = (z / (terrain.height - 1) - 0.5) * terrain.size;
  const y = terrain.heights[z * terrain.width + x];
  return [worldX, y, worldZ] as const;
}

export function exportHeightmapPNG(terrain: TerrainData) {
  const canvas = document.createElement("canvas");
  canvas.width = terrain.width;
  canvas.height = terrain.height;
  const context = canvas.getContext("2d");
  if (!context) return;

  const image = context.createImageData(terrain.width, terrain.height);
  const range = Math.max(0.0001, terrain.maxHeight - terrain.minHeight);

  for (let index = 0; index < terrain.heights.length; index += 1) {
    const value = Math.round(((terrain.heights[index] - terrain.minHeight) / range) * 255);
    const pixel = index * 4;
    image.data[pixel] = value;
    image.data[pixel + 1] = value;
    image.data[pixel + 2] = value;
    image.data[pixel + 3] = 255;
  }

  context.putImageData(image, 0, 0);
  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, `${safeName(terrain.seed)}-heightmap.png`);
  }, "image/png");
}

export function exportParametersJSON(parameters: TerrainParameters, terrain: TerrainData | null) {
  const payload = {
    exportedAt: new Date().toISOString(),
    parameters,
    terrain: terrain
      ? {
          width: terrain.width,
          height: terrain.height,
          size: terrain.size,
          minHeight: terrain.minHeight,
          maxHeight: terrain.maxHeight,
          averageHeight: terrain.averageHeight,
          erosionApplied: terrain.erosionApplied,
          generationTimeMs: terrain.generationTimeMs
        }
      : null
  };

  downloadBlob(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    `${safeName(parameters.seed)}-terrain-parameters.json`
  );
}

export function exportOBJ(terrain: TerrainData, stride = 1) {
  const step = Math.max(1, stride);
  const xSamples: number[] = [];
  const zSamples: number[] = [];

  for (let x = 0; x < terrain.width; x += step) xSamples.push(x);
  for (let z = 0; z < terrain.height; z += step) zSamples.push(z);
  if (xSamples[xSamples.length - 1] !== terrain.width - 1) xSamples.push(terrain.width - 1);
  if (zSamples[zSamples.length - 1] !== terrain.height - 1) zSamples.push(terrain.height - 1);

  const lines = [`# Terrain Generator OBJ`, `o terrain_${safeName(terrain.seed)}`];

  for (const z of zSamples) {
    for (const x of xSamples) {
      const [worldX, y, worldZ] = worldPosition(terrain, x, z);
      lines.push(`v ${worldX.toFixed(5)} ${y.toFixed(5)} ${worldZ.toFixed(5)}`);
    }
  }

  const rowLength = xSamples.length;
  for (let z = 0; z < zSamples.length - 1; z += 1) {
    for (let x = 0; x < xSamples.length - 1; x += 1) {
      const a = z * rowLength + x + 1;
      const b = a + 1;
      const c = (z + 1) * rowLength + x + 1;
      const d = c + 1;
      lines.push(`f ${a} ${c} ${b}`);
      lines.push(`f ${b} ${c} ${d}`);
    }
  }

  downloadBlob(new Blob([lines.join("\n")], { type: "text/plain" }), `${safeName(terrain.seed)}-terrain.obj`);
}

export async function exportGLTF(terrain: TerrainData, stride = 2) {
  const THREE = await import("three");
  const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
  const step = Math.max(1, stride);
  const xSamples: number[] = [];
  const zSamples: number[] = [];
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let x = 0; x < terrain.width; x += step) xSamples.push(x);
  for (let z = 0; z < terrain.height; z += step) zSamples.push(z);
  if (xSamples[xSamples.length - 1] !== terrain.width - 1) xSamples.push(terrain.width - 1);
  if (zSamples[zSamples.length - 1] !== terrain.height - 1) zSamples.push(terrain.height - 1);

  for (const z of zSamples) {
    for (const x of xSamples) {
      const [worldX, y, worldZ] = worldPosition(terrain, x, z);
      positions.push(worldX, y, worldZ);
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
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: "#8ea86f",
    roughness: 0.88,
    metalness: 0.02
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `terrain_${safeName(terrain.seed)}`;

  const scene = new THREE.Scene();
  scene.add(mesh);

  await new Promise<void>((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (result) => {
        const blob =
          result instanceof ArrayBuffer
            ? new Blob([result], { type: "model/gltf-binary" })
            : new Blob([JSON.stringify(result, null, 2)], { type: "model/gltf+json" });
        downloadBlob(blob, `${safeName(terrain.seed)}-terrain.gltf`);
        resolve();
      },
      (error) => reject(error),
      { binary: false }
    );
  });

  geometry.dispose();
  material.dispose();
}
