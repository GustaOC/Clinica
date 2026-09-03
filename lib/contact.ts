/** Public contact helpers. No patient data is collected or persisted here. */
export type Contact = {
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
};

export function whatsappUrl(
  value: string,
  subject = 'uma consulta',
): string | null {
  if (!/^[+\d\s().-]+$/.test(value)) return null;
  const digits = value.replace(/\D/g, '');
  if (!/^55[1-9]\d{9,10}$/.test(digits)) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(`Olá! Gostaria de informações sobre ${subject} na Lumina.`)}`;
}

export function phoneUrl(value: string): string | null {
  if (!/^[+\d\s().-]+$/.test(value)) return null;
  const digits = value.replace(/\D/g, '');
  if (!/^[1-9]\d{9,14}$/.test(digits)) return null;
  return `tel:${value.trim().startsWith('+') ? '+' : ''}${digits}`;
}

export function emailUrl(value: string): string | null {
  return /^[^\s@?&#%]+@[^\s@?&#%]+\.[^\s@?&#%]+$/.test(value)
    ? `mailto:${value}`
    : null;
}

export function mapsUrl(address: string): string | null {
  return address.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`
    : null;
}

export function siteOrigin(
  values: Record<string, string | undefined>,
): URL | undefined {
  const candidate =
    values.SITE_URL ||
    (values.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${values.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined);
  if (!candidate) return undefined;
  try {
    const url = new URL(candidate);
    return ['https:', 'http:'].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? new URL(url.origin)
      : undefined;
  } catch {
    return undefined;
  }
}
