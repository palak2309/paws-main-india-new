export const currency = (value: number, opts?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...opts,
  }).format(value);

export const compactCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const number = (value: number) => new Intl.NumberFormat("en-US").format(value);

export const percent = (value: number) => `${Math.round(value * 100)}%`;

export const dateLong = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const titleCase = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const currencyIn = (value: number, code?: string | null) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code && code.length === 3 ? code : "USD",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${code ?? ""} ${Math.round(value).toLocaleString()}`.trim();
  }
};

export const compactCurrencyIn = (value: number, code?: string | null) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code && code.length === 3 ? code : "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return `${code ?? ""} ${Math.round(value).toLocaleString()}`.trim();
  }
};

export const dateShort = (iso?: string | null) => (iso ? dateLong(iso) : "—");
