import { getAssetUrl } from "../../lib/assets/generatedArt";

interface ArtImageProps {
  assetId: string;
  alt: string;
  className?: string;
}

export const ArtImage = ({ assetId, alt, className }: ArtImageProps) => (
  <img className={className} src={getAssetUrl(assetId)} alt={alt} loading="lazy" />
);
