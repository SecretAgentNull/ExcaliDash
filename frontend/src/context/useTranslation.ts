import { useCallback, useContext, useLayoutEffect, useRef } from "react";
import { LocaleContext } from "./localeContext";
import { resolveLocale, type Locale } from "../i18n";
import { translateUI, type MessageParams } from "../locales";

/** Components outside LocaleProvider (for example auth startup errors) use the browser locale. */
export const useAppLocale = (): Locale => {
  const context = useContext(LocaleContext);
  const locale: Locale =
    context?.locale ??
    resolveLocale(typeof navigator === "undefined" ? "en" : navigator.language);
  return locale;
};

export const useTranslation = () => {
  const locale = useAppLocale();
  return useCallback(
    (message: string, params?: MessageParams) =>
      translateUI(locale, message, params),
    [locale],
  );
};

/** For asynchronous editor operations: language changes must not reload scenes or reconnect sockets. */
export const useEventTranslation = () => {
  const translate = useTranslation();
  const latest = useRef(translate);
  useLayoutEffect(() => {
    latest.current = translate;
  }, [translate]);
  return useCallback(
    (message: string, params?: MessageParams) =>
      latest.current(message, params),
    [],
  );
};
