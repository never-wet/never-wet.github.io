"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";

import type { ImageSearchAnalysis } from "@/lib/analysis";

type TabId = "description" | "keywords" | "queries" | "style";

type CompressedImage = {
  dataUrl: string;
  width: number;
  height: number;
  size: number;
};

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "description", label: "Description" },
  { id: "keywords", label: "Keywords" },
  { id: "queries", label: "Search Queries" },
  { id: "style", label: "Style" }
];

const MAX_SOURCE_BYTES = 16 * 1024 * 1024;
const MAX_IMAGE_EDGE = 1600;
const JPEG_QUALITY = 0.82;

const EMPTY_ANALYSIS: ImageSearchAnalysis = {
  description:
    "Upload an image to generate a search-focused visual analysis with subject, lighting, angle, composition, mood, and palette.",
  keywords: [],
  search_queries: [],
  style: {
    type: "",
    genre: "",
    aesthetic: "",
    lighting: "",
    composition: "",
    camera_angle: "",
    mood: ""
  },
  colors: [],
  tags: [],
  objects: [],
  setting: "",
  brands: [],
  similar_image_guidance: [],
  notes: ""
};

function bytesToLabel(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(bytes / 1024, 1).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function searchGoogleImages(query: string) {
  const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the compressed image."));
    reader.readAsDataURL(blob);
  });
}

async function loadBitmap(file: File) {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file);
  }

  const url = URL.createObjectURL(file);

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Could not load the image."));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function compressImage(file: File): Promise<CompressedImage> {
  const bitmap = await loadBitmap(file);
  const sourceWidth = "naturalWidth" in bitmap ? bitmap.naturalWidth : bitmap.width;
  const sourceHeight = "naturalHeight" in bitmap ? bitmap.naturalHeight : bitmap.height;
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not available in this browser.");
  }

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);

  if ("close" in bitmap && typeof bitmap.close === "function") {
    bitmap.close();
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Could not compress the image."));
      },
      "image/jpeg",
      JPEG_QUALITY
    );
  });

  return {
    dataUrl: await readBlobAsDataUrl(blob),
    width,
    height,
    size: blob.size
  };
}

function formatAnalysis(analysis: ImageSearchAnalysis) {
  return [
    `Description:\n${analysis.description}`,
    `Keywords:\n${analysis.keywords.join(", ")}`,
    `Search queries:\n${analysis.search_queries.map((query) => `- ${query}`).join("\n")}`,
    `Style:\nType: ${analysis.style.type}\nGenre: ${analysis.style.genre}\nAesthetic: ${analysis.style.aesthetic}\nLighting: ${analysis.style.lighting}\nComposition: ${analysis.style.composition}\nCamera angle: ${analysis.style.camera_angle}\nMood: ${analysis.style.mood}`,
    `Colors:\n${analysis.colors.map((color) => `${color.name} ${color.hex}`).join("\n")}`,
    `Tags:\n${analysis.tags.join(", ")}`,
    `Objects:\n${analysis.objects.join(", ")}`,
    `Setting:\n${analysis.setting}`,
    `Brands:\n${analysis.brands.length ? analysis.brands.join(", ") : "None detected"}`,
    `Similar-image guidance:\n${analysis.similar_image_guidance.map((item) => `- ${item}`).join("\n")}`,
    analysis.notes ? `Notes:\n${analysis.notes}` : ""
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function readAnalysisResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    await response.text().catch(() => "");
    return null;
  }

  return response.json().catch(() => null) as Promise<
    (ImageSearchAnalysis & { error?: string }) | null
  >;
}

export default function ImageSearchAnalyzer() {
  const [activeTab, setActiveTab] = useState<TabId>("description");
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [sourceSize, setSourceSize] = useState(0);
  const [compressed, setCompressed] = useState<CompressedImage | null>(null);
  const [analysis, setAnalysis] = useState<ImageSearchAnalysis>(EMPTY_ANALYSIS);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const hasResults = analysis !== EMPTY_ANALYSIS && analysis.keywords.length > 0;
  const metaLabel = useMemo(() => {
    if (!compressed) return "No image loaded";
    return `${compressed.width} x ${compressed.height} / ${bytesToLabel(compressed.size)} compressed`;
  }, [compressed]);

  async function copyText(value: string, label = "Copied") {
    if (!value.trim()) return;

    try {
      await navigator.clipboard.writeText(value);
      setToast(label);
      window.setTimeout(() => setToast(""), 1300);
    } catch {
      setToast("Copy failed");
      window.setTimeout(() => setToast(""), 1300);
    }
  }

  async function analyze(dataUrl: string) {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ image: dataUrl })
      });

      const data = await readAnalysisResponse(response);

      if (!response.ok || !data || data.error) {
        throw new Error(
          data?.error ||
            `Analyzer API returned ${response.status}. Make sure the Next.js server is running.`
        );
      }

      setAnalysis(data);
      setActiveTab("description");
    } catch (analyzeError) {
      setAnalysis(EMPTY_ANALYSIS);
      setError(
        analyzeError instanceof Error
          ? analyzeError.message
          : "The analyzer could not read this image."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }

    if (file.size > MAX_SOURCE_BYTES) {
      setError("Choose an image under 16 MB.");
      return;
    }

    setFileName(file.name);
    setSourceSize(file.size);
    setCompressed(null);
    setAnalysis(EMPTY_ANALYSIS);
    setError("");

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);

    try {
      const result = await compressImage(file);
      setCompressed(result);
      await analyze(result.dataUrl);
    } catch (compressError) {
      setError(
        compressError instanceof Error
          ? compressError.message
          : "Could not prepare this image for analysis."
      );
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    void handleFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void handleFile(event.dataTransfer.files[0]);
  }

  function handleCopyAll() {
    void copyText(formatAnalysis(analysis), "Copied all");
  }

  return (
    <main className="min-h-screen px-4 py-4 text-stone-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-950/10 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Visual Search Lens
            </p>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Image-to-search analyzer
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {toast ? (
              <span className="rounded-full border border-emerald-700/20 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                {toast}
              </span>
            ) : null}
            <button
              className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
              type="button"
              disabled={!hasResults}
              onClick={handleCopyAll}
            >
              Copy All
            </button>
          </div>
        </header>

        <section className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,0.88fr)_minmax(420px,0.72fr)]">
          <div className="rounded-lg border border-stone-950/10 bg-white/72 p-3 shadow-sm backdrop-blur">
            <div
              className={`relative flex min-h-[520px] flex-col overflow-hidden rounded-md border border-dashed transition ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-stone-950/15 bg-stone-100/70"
              }`}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- Object URLs are local previews, not remote optimized assets.
                <img
                  className="h-full min-h-[520px] w-full object-contain"
                  src={previewUrl}
                  alt={fileName ? `Uploaded preview for ${fileName}` : "Uploaded preview"}
                />
              ) : (
                <button
                  className="grid min-h-[520px] place-items-center px-6 text-center"
                  type="button"
                  onClick={() => inputRef.current?.click()}
                >
                  <span>
                    <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-stone-950 text-2xl text-white">
                      +
                    </span>
                    <span className="block text-2xl font-semibold">Drop image</span>
                    <span className="mt-2 block text-sm font-medium text-stone-500">
                      JPG, PNG, WEBP
                    </span>
                  </span>
                </button>
              )}

              <div className="absolute left-3 right-3 top-3 flex flex-wrap items-center justify-between gap-2">
                <button
                  className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-stone-950 shadow-sm backdrop-blur transition hover:bg-white"
                  type="button"
                  onClick={() => inputRef.current?.click()}
                >
                  Upload
                </button>
                <span className="rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-stone-600 shadow-sm backdrop-blur">
                  {metaLabel}
                </span>
              </div>

              {isLoading ? (
                <div className="absolute inset-x-3 bottom-3 rounded-md border border-stone-950/10 bg-white/90 p-3 shadow-sm backdrop-blur">
                  <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                    <span>Analyzing visual search signals</span>
                    <span>{sourceSize ? bytesToLabel(sourceSize) : ""}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-200">
                    <span className="block h-full w-1/2 animate-[slide_1.1s_ease-in-out_infinite] rounded-full bg-blue-600" />
                  </div>
                </div>
              ) : null}
            </div>

            <input
              ref={inputRef}
              className="hidden"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleInputChange}
            />
          </div>

          <aside className="flex min-h-[640px] flex-col rounded-lg border border-stone-950/10 bg-white/82 shadow-sm backdrop-blur">
            <div className="border-b border-stone-950/10 p-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    className={`min-h-10 rounded-md px-3 text-sm font-semibold transition ${
                      activeTab === tab.id
                        ? "bg-stone-950 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <div className="m-3 rounded-md border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                {error}
              </div>
            ) : null}

            <div className="flex-1 overflow-auto p-4">
              {activeTab === "description" ? (
                <DescriptionPanel analysis={analysis} copyText={copyText} hasResults={hasResults} />
              ) : null}

              {activeTab === "keywords" ? (
                <KeywordPanel analysis={analysis} copyText={copyText} hasResults={hasResults} />
              ) : null}

              {activeTab === "queries" ? (
                <QueryPanel analysis={analysis} copyText={copyText} hasResults={hasResults} />
              ) : null}

              {activeTab === "style" ? (
                <StylePanel analysis={analysis} hasResults={hasResults} />
              ) : null}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="grid min-h-[420px] place-items-center rounded-md border border-stone-950/10 bg-stone-50 p-6 text-center text-stone-500">
      <p className="max-w-sm text-sm font-medium">
        Results appear here after analysis.
      </p>
    </div>
  );
}

function DescriptionPanel({
  analysis,
  copyText,
  hasResults
}: {
  analysis: ImageSearchAnalysis;
  copyText: (value: string, label?: string) => Promise<void>;
  hasResults: boolean;
}) {
  if (!hasResults) return <EmptyState />;

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-stone-950/10 bg-stone-50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-stone-500">
            Structured Description
          </h2>
          <button
            className="rounded-full border border-stone-950/10 bg-white px-3 py-1.5 text-xs font-semibold transition hover:border-stone-950/30"
            type="button"
            onClick={() => copyText(analysis.description, "Copied description")}
          >
            Copy
          </button>
        </div>
        <p className="text-pretty text-lg leading-8">{analysis.description}</p>
      </section>

      <InfoList
        title="Discovery Guidance"
        items={analysis.similar_image_guidance}
        onCopy={(item) => copyText(item, "Copied guidance")}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Fact label="Setting" value={analysis.setting} />
        <Fact
          label="Brands"
          value={analysis.brands.length ? analysis.brands.join(", ") : "None detected"}
        />
      </div>

      {analysis.notes ? (
        <p className="rounded-md border border-amber-500/20 bg-amber-50 p-3 text-sm font-medium text-amber-900">
          {analysis.notes}
        </p>
      ) : null}
    </div>
  );
}

function KeywordPanel({
  analysis,
  copyText,
  hasResults
}: {
  analysis: ImageSearchAnalysis;
  copyText: (value: string, label?: string) => Promise<void>;
  hasResults: boolean;
}) {
  if (!hasResults) return <EmptyState />;

  return (
    <div className="space-y-5">
      <ChipGroup
        title="Keywords"
        items={analysis.keywords}
        onClick={(item) => copyText(item, "Copied keyword")}
      />
      <ChipGroup
        title="Tags"
        items={analysis.tags}
        onClick={(item) => copyText(item, "Copied tag")}
      />
      <ChipGroup
        title="Objects"
        items={analysis.objects}
        onClick={(item) => copyText(item, "Copied object")}
      />
    </div>
  );
}

function QueryPanel({
  analysis,
  copyText,
  hasResults
}: {
  analysis: ImageSearchAnalysis;
  copyText: (value: string, label?: string) => Promise<void>;
  hasResults: boolean;
}) {
  if (!hasResults) return <EmptyState />;

  return (
    <div className="space-y-4">
      {analysis.search_queries.map((query) => (
        <div
          className="flex items-center justify-between gap-3 rounded-md border border-stone-950/10 bg-stone-50 p-3"
          key={query}
        >
          <button
            className="min-w-0 flex-1 text-left text-base font-semibold leading-6 transition hover:text-blue-700"
            type="button"
            onClick={() => searchGoogleImages(query)}
          >
            {query}
          </button>
          <button
            className="rounded-full border border-stone-950/10 bg-white px-3 py-1.5 text-xs font-semibold transition hover:border-stone-950/30"
            type="button"
            onClick={() => copyText(query, "Copied query")}
          >
            Copy
          </button>
        </div>
      ))}
    </div>
  );
}

function StylePanel({
  analysis,
  hasResults
}: {
  analysis: ImageSearchAnalysis;
  hasResults: boolean;
}) {
  if (!hasResults) return <EmptyState />;

  const fields = [
    ["Type", analysis.style.type],
    ["Genre", analysis.style.genre],
    ["Aesthetic", analysis.style.aesthetic],
    ["Lighting", analysis.style.lighting],
    ["Composition", analysis.style.composition],
    ["Camera Angle", analysis.style.camera_angle],
    ["Mood", analysis.style.mood]
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <Fact key={label} label={label} value={value} />
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-stone-500">
          Color Palette
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {analysis.colors.map((color) => (
            <div
              className="flex items-center gap-3 rounded-md border border-stone-950/10 bg-stone-50 p-3"
              key={`${color.hex}-${color.name}`}
            >
              <span
                className="h-10 w-10 shrink-0 rounded-md border border-stone-950/10"
                style={{ backgroundColor: color.hex }}
              />
              <span className="min-w-0">
                <span className="block truncate font-semibold">{color.name}</span>
                <span className="block font-mono text-sm text-stone-500">{color.hex}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-stone-950/10 bg-stone-50 p-3">
      <span className="block text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </span>
      <strong className="mt-2 block text-base leading-6">{value || "Unknown"}</strong>
    </div>
  );
}

function ChipGroup({
  title,
  items,
  onClick
}: {
  title: string;
  items: string[];
  onClick: (item: string) => void;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-stone-500">
        {title}
      </h2>
      {items.length ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <button
              className="rounded-full border border-stone-950/10 bg-stone-50 px-3 py-2 text-sm font-semibold transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-800"
              key={item}
              type="button"
              onClick={() => onClick(item)}
            >
              {item}
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-stone-950/10 bg-stone-50 p-3 text-sm text-stone-500">
          None detected.
        </p>
      )}
    </section>
  );
}

function InfoList({
  title,
  items,
  onCopy
}: {
  title: string;
  items: string[];
  onCopy: (item: string) => void;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-stone-500">
        {title}
      </h2>
      <div className="space-y-2">
        {items.map((item) => (
          <button
            className="block w-full rounded-md border border-stone-950/10 bg-stone-50 p-3 text-left text-sm font-medium leading-6 transition hover:border-blue-500 hover:bg-blue-50"
            key={item}
            type="button"
            onClick={() => onCopy(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </section>
  );
}
