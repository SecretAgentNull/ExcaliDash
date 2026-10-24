import type { Locale } from "../i18n";
import { russianMessages } from "./ru";

export type MessageKey = keyof typeof russianMessages;
export type MessageParams = Record<string, string | number | null | undefined>;

/** English source strings are stable keys; untranslated locales retain English. */
export const translateUI = (
  locale: Locale,
  message: string,
  params: MessageParams = {},
): string => {
  const template =
    locale === "ru" && Object.hasOwn(russianMessages, message)
      ? russianMessages[message as MessageKey]
      : message;
  return template.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    Object.hasOwn(params, key) ? String(params[key] ?? "") : placeholder,
  );
};

export type Translator = (message: string, params?: MessageParams) => string;
export const englishTranslation: Translator = (message, params) =>
  translateUI("en", message, params);

/** Format storage sizes using the chosen UI locale, rather than the browser default. */
export const formatFileSize = (
  locale: Locale,
  bytes: number | null,
): string => {
  if (bytes === null || !Number.isFinite(bytes)) return "—";
  const divisor = bytes >= 1_000_000 ? 1_000_000 : bytes >= 1_000 ? 1_000 : 1;
  const unit = divisor === 1_000_000 ? "MB" : divisor === 1_000 ? "KB" : "B";
  const digits = divisor === 1 ? 0 : 1;
  const value = new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(bytes / divisor);
  return `${value} ${translateUI(locale, unit)}`;
};
