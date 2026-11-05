/**
 * AEVUM — Fine Art & Antiquities Domain Types
 *
 * Strict TypeScript models for curated catalog artworks.
 * Adheres to truthfulness in art presentation: unverified historical facts
 * are explicitly represented as null, never fabricated.
 */

export type AevumCategory =
  | "Paintings"
  | "Sculptures"
  | "Decorative Antiques"
  | "Ceramics & Glass"
  | "Prints & Editions"
  | "Curiosities";

export type ArtworkClassification =
  "Historical Reference" | "AI-Generated Concept" | "Pending Verification";

export type LicenseStatus =
  "Public Domain" | "Creative Commons CC0" | "Pending Verification" | "Restricted (Watermarked)";

export interface ArtworkLicenseInfo {
  status: LicenseStatus;
  attribution: string | null;
  watermarkNote: string | null;
}

export interface ArtworkDimensions {
  raw: string | null;
  widthCm: number | null;
  heightCm: number | null;
  depthCm: number | null;
}

export interface Artwork {
  id: string;
  title: string;
  category: AevumCategory;
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  imageAspectRatio: number;
  altText: string;
  description: string;
  curatorialSummary: string | null;

  // Curatorial Attributions (strictly null when unverified)
  artist: string | null;
  period: string | null;
  medium: string | null;
  origin: string | null;
  dimensions: ArtworkDimensions | null;

  // Provenance & Integrity
  classification: ArtworkClassification;
  license: ArtworkLicenseInfo;

  // Commercial / Portfolio Demo Values (Fictional USD >= $80,000)
  price: number;
  inStock: boolean;
  saleStatus: "Not for Sale" | "Private Viewing" | "In Exhibition";
}

/**
 * Adapter converting an Artwork to the ShopBoard AddableProduct / Product format
 * so it integrates directly with the existing cart state, badge, and calculations.
 */
export function artworkToProduct(artwork: Artwork) {
  return {
    id: artwork.id,
    name: artwork.title,
    category: artwork.category,
    price: artwork.price,
    inStock: artwork.inStock,
    description: artwork.description,
  };
}
