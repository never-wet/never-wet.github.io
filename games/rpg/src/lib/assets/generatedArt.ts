import { contentRegistry } from "../../memory/contentRegistry";
import type { AssetDefinition } from "../../memory/types";

const cache = new Map<string, string>();

const encode = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const backgroundSvg = (asset: AssetDefinition) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" preserveAspectRatio="none">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${asset.palette.secondary}" />
        <stop offset="100%" stop-color="${asset.palette.primary}" />
      </linearGradient>
      <linearGradient id="mist" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${asset.palette.light}" stop-opacity="0.35" />
        <stop offset="100%" stop-color="${asset.palette.accent}" stop-opacity="0.08" />
      </linearGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#sky)" />
    <circle cx="930" cy="142" r="78" fill="${asset.palette.light}" opacity="0.14" />
    <path d="M0 640 C180 560 320 590 480 540 C640 490 740 610 900 560 C1040 520 1120 560 1200 510 L1200 800 L0 800 Z" fill="${asset.palette.secondary}" opacity="0.82" />
    <path d="M0 690 C230 650 360 700 530 640 C700 580 850 640 1040 600 C1120 585 1160 590 1200 580 L1200 800 L0 800 Z" fill="${asset.palette.primary}" opacity="0.88" />
    <path d="M170 610 L260 350 L320 610 Z" fill="${asset.palette.ink}" opacity="0.25" />
    <path d="M770 640 L860 220 L920 640 Z" fill="${asset.palette.ink}" opacity="0.22" />
    <path d="M0 0 H1200 V800 H0 Z" fill="url(#mist)" />
    <g fill="${asset.palette.accent}" opacity="0.72">
      <circle cx="210" cy="540" r="4" />
      <circle cx="238" cy="520" r="3" />
      <circle cx="978" cy="492" r="4" />
      <circle cx="1010" cy="512" r="3" />
    </g>
  </svg>
`;

const portraitSvg = (asset: AssetDefinition) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 560">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${asset.palette.secondary}" />
        <stop offset="100%" stop-color="${asset.palette.primary}" />
      </linearGradient>
    </defs>
    <rect width="480" height="560" rx="34" fill="url(#bg)" />
    <circle cx="240" cy="170" r="108" fill="${asset.palette.light}" opacity="0.12" />
    <path d="M134 500 C170 390 310 388 346 500 Z" fill="${asset.palette.ink}" opacity="0.92" />
    <path d="M170 286 C176 208 204 160 240 160 C276 160 304 208 310 286 C312 320 286 364 240 364 C194 364 168 320 170 286 Z" fill="${asset.palette.ink}" />
    <path d="M164 490 C176 394 214 342 240 342 C266 342 304 394 316 490 Z" fill="${asset.palette.accent}" opacity="0.88" />
    <path d="M162 206 C182 124 290 112 324 202 C290 170 204 172 162 206 Z" fill="${asset.palette.primary}" opacity="0.95" />
    <circle cx="214" cy="286" r="9" fill="${asset.palette.primary}" />
    <circle cx="266" cy="286" r="9" fill="${asset.palette.primary}" />
    <path d="M208 328 C220 340 260 340 272 328" fill="none" stroke="${asset.palette.primary}" stroke-width="7" stroke-linecap="round" />
    <path d="M120 480 H360" stroke="${asset.palette.light}" stroke-opacity="0.3" stroke-width="3" />
  </svg>
`;

const iconShape = (variant: string, asset: AssetDefinition) => {
  switch (variant) {
    case "lantern":
      return `<path d="M80 50 H176 L158 88 H98 Z M108 88 H148 V170 H108 Z M96 170 H160 V198 H96 Z" fill="${asset.palette.accent}" /><path d="M122 18 H134 V50 H122 Z" fill="${asset.palette.light}" />`;
    case "sigil":
      return `<circle cx="128" cy="128" r="70" fill="none" stroke="${asset.palette.accent}" stroke-width="14" /><path d="M128 58 L154 118 L214 128 L154 138 L128 198 L102 138 L42 128 L102 118 Z" fill="${asset.palette.light}" />`;
    case "pack":
      return `<rect x="72" y="70" width="112" height="124" rx="18" fill="${asset.palette.accent}" /><rect x="94" y="44" width="68" height="46" rx="16" fill="${asset.palette.light}" /><rect x="104" y="102" width="48" height="36" rx="10" fill="${asset.palette.primary}" />`;
    case "scroll":
      return `<path d="M76 58 H174 C194 58 206 72 206 90 V186 H108 C88 186 76 172 76 154 Z" fill="${asset.palette.ink}" /><path d="M108 186 C90 186 78 198 78 214 C78 230 90 242 108 242 H206 V92" fill="none" stroke="${asset.palette.accent}" stroke-width="14" />`;
    case "map":
      return `<path d="M58 70 L116 52 L178 72 L198 182 L140 202 L78 184 Z" fill="${asset.palette.light}" /><path d="M116 52 L140 202 M178 72 L198 182" stroke="${asset.palette.primary}" stroke-width="10" />`;
    case "book":
      return `<path d="M66 56 H136 C166 56 184 72 184 102 V210 H114 C84 210 66 192 66 162 Z" fill="${asset.palette.ink}" /><path d="M184 56 H120 C90 56 72 72 72 102 V210 H142 C172 210 190 192 190 162 Z" fill="${asset.palette.light}" opacity="0.92" />`;
    case "gear":
      return `<circle cx="128" cy="128" r="38" fill="${asset.palette.light}" /><circle cx="128" cy="128" r="68" fill="none" stroke="${asset.palette.accent}" stroke-width="18" stroke-dasharray="26 16" />`;
    case "star":
      return `<path d="M128 34 L154 98 L222 104 L170 148 L186 216 L128 178 L70 216 L86 148 L34 104 L102 98 Z" fill="${asset.palette.accent}" />`;
    case "archive":
      return `<rect x="56" y="80" width="144" height="112" rx="14" fill="${asset.palette.ink}" /><rect x="84" y="110" width="88" height="18" rx="8" fill="${asset.palette.accent}" /><rect x="84" y="142" width="54" height="18" rx="8" fill="${asset.palette.light}" />`;
    case "potion":
      return `<path d="M98 48 H158 V88 L188 136 C214 176 188 222 128 222 C68 222 42 176 68 136 L98 88 Z" fill="${asset.palette.light}" /><path d="M84 158 C112 134 144 168 172 144 V190 C154 208 138 216 128 216 C118 216 102 210 84 190 Z" fill="${asset.palette.accent}" opacity="0.85" />`;
    case "blade":
      return `<path d="M136 30 L164 130 L136 222 L108 130 Z" fill="${asset.palette.light}" /><rect x="82" y="122" width="92" height="18" rx="8" fill="${asset.palette.accent}" /><rect x="120" y="140" width="16" height="56" rx="8" fill="${asset.palette.ink}" />`;
    default:
      return `<circle cx="128" cy="128" r="72" fill="${asset.palette.accent}" />`;
  }
};

const iconSvg = (asset: AssetDefinition) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
    <rect width="256" height="256" rx="46" fill="${asset.palette.primary}" />
    <rect x="18" y="18" width="220" height="220" rx="36" fill="${asset.palette.secondary}" />
    ${iconShape(asset.variant, asset)}
  </svg>
`;

const logoSvg = (asset: AssetDefinition) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 360">
    <defs>
      <linearGradient id="logo" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${asset.palette.accent}" />
        <stop offset="100%" stop-color="${asset.palette.light}" />
      </linearGradient>
    </defs>
    <rect width="1200" height="360" rx="28" fill="${asset.palette.primary}" />
    <circle cx="132" cy="180" r="76" fill="url(#logo)" opacity="0.24" />
    <path d="M132 92 L152 148 L210 154 L166 194 L180 252 L132 220 L84 252 L98 194 L54 154 L112 148 Z" fill="url(#logo)" />
    <text x="250" y="152" fill="${asset.palette.ink}" font-size="62" font-family="Georgia, serif" letter-spacing="4">HOLLOWMERE</text>
    <text x="252" y="228" fill="${asset.palette.light}" font-size="28" font-family="Georgia, serif" letter-spacing="6">VEIL OF THE HOLLOW STAR</text>
  </svg>
`;

const renderAsset = (asset: AssetDefinition) => {
  switch (asset.kind) {
    case "background":
      return backgroundSvg(asset);
    case "portrait":
      return portraitSvg(asset);
    case "icon":
      return iconSvg(asset);
    case "logo":
      return logoSvg(asset);
    default:
      return iconSvg(asset);
  }
};

export const getAssetUrl = (assetId: string) => {
  if (cache.has(assetId)) {
    return cache.get(assetId)!;
  }

  const asset = contentRegistry.assetsById[assetId];
  if (!asset) {
    return "";
  }

  const url = encode(renderAsset(asset));
  cache.set(assetId, url);
  return url;
};
