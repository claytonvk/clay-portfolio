// Sites store phone numbers as bare digits so `tel:` links and any future
// lookups stay clean. Formatting is a display concern, applied here.

/**
 * 6162141806      -> (616) 214-1806
 * 16162141806     -> (616) 214-1806   (leading US country code)
 * +44 20 7946 ... -> returned unchanged
 *
 * Anything that is not a recognisable North American number is passed through
 * as-is rather than mangled into a shape it does not have.
 */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");

  const local =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;

  if (local.length !== 10) return value;

  return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
}

/** Digits only, for tel: hrefs. Falls back to the original string. */
export function telHref(value: string | null | undefined): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  return digits ? `+${digits.length === 10 ? "1" + digits : digits}` : value;
}
