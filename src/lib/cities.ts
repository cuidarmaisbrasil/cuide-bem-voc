// Cidades cobertas com plataformas municipais oficiais — usadas para páginas SEO locais.
import { municipalPlatforms } from "@/data/sus";

export interface CityInfo {
  slug: string;
  city: string;
  state: string;
}

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const cityPages: CityInfo[] = municipalPlatforms.map((p) => ({
  slug: `${slugify(p.city)}-${p.state.toLowerCase()}`,
  city: p.city,
  state: p.state,
}));

export function findCityBySlug(slug: string): CityInfo | null {
  return cityPages.find((c) => c.slug === slug) ?? null;
}
