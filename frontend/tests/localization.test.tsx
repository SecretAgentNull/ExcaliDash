import React, { useEffect } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { LocaleContext } from "../src/context/localeContext";
import {
  useEventTranslation,
  useTranslation,
} from "../src/context/useTranslation";
import { resolveLocale, translate, type Locale } from "../src/i18n";
import { formatFileSize, translateUI } from "../src/locales";
import { russianMessages } from "../src/locales/ru";
import { SettingsMainGrid } from "../src/pages/settings/SettingsMainGrid";
import {
  getPasswordPolicy,
  getPasswordRequirements,
  validatePassword,
} from "../src/utils/passwordPolicy";

const noop = () => {};
const wrap = (locale: Locale, children: React.ReactNode) => (
  <LocaleContext.Provider
    value={{
      locale,
      language: locale === "ru" ? "ru-RU" : locale,
      setLanguage: noop,
      t: (key) => translate(locale, key),
    }}
  >
    {children}
  </LocaleContext.Provider>
);
const settingsProps: React.ComponentProps<typeof SettingsMainGrid> = {
  exportBackup: noop,
  theme: "light",
  toggleTheme: noop,
  imageCompression: true,
  toggleImageCompression: noop,
  imageCompressionThresholdMb: 0.25,
  onImageCompressionThresholdChange: noop,
  editorAutoHide: false,
  onEditorAutoHideChange: noop,
  compactSidebar: true,
  onCompactSidebarChange: noop,
  updateChannel: "stable",
  updateInfo: null,
  updateLoading: false,
  updateError: null,
  onUpdateChannelChange: noop,
  onCheckForUpdates: noop,
};

describe("Russian localization", () => {
  it("translates the settings rows, descriptions, controls and accessible labels", () => {
    const html = renderToStaticMarkup(
      wrap("ru", <SettingsMainGrid {...settingsProps} />),
    );
    for (const label of [
      "Оформление",
      "Автоскрытие панели редактора",
      "Показывать по умолчанию",
      "Компактная боковая панель",
      "Оптимизация изображений",
      "Сжимать изображения больше 0.25 МБ",
      "Экспорт резервной копии",
      "Обновления",
      "Релизы",
      "Стабильный",
      "Проверить",
    ])
      expect(html).toContain(label);
    for (const label of [
      "Appearance",
      "Keep visible by default",
      "Optimized images",
      "Export backup",
      "Status unknown",
      "Toggle dark mode",
    ])
      expect(html).not.toContain(label);
    expect(html).toContain('aria-label="Переключить тёмную тему"');
    expect(html).toContain('value="ru-RU"');
  });

  it("keeps English and Chinese fallback behavior", () => {
    const html = renderToStaticMarkup(
      wrap("en", <SettingsMainGrid {...settingsProps} />),
    );
    expect(html).toContain("Appearance");
    expect(formatFileSize("ru", 1_500_000)).toBe("1,5 МБ");
    expect(formatFileSize("ru", 2_500)).toBe("2,5 КБ");
    expect(formatFileSize("ru", 120)).toBe("120 Б");
    expect(formatFileSize("en", 1_500_000)).toBe("1.5 MB");
    expect(formatFileSize("ru", null)).toBe("—");
    expect(translateUI("zh-CN", "Appearance")).toBe("Appearance");
    expect(translate("zh-CN", "settings.language")).toBe("语言");
    expect(translateUI("ru", "An unknown server diagnostic")).toBe(
      "An unknown server diagnostic",
    );
    for (const language of ["ru", "ru-RU", "RU-ru", "ru_KZ"])
      expect(resolveLocale(language)).toBe("ru");
  });

  it("preserves all interpolation parameters and does not interpolate inserted values again", () => {
    for (const [key, value] of Object.entries(russianMessages)) {
      const parameters = (s: string) =>
        [...s.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
      expect(parameters(value), key).toEqual(parameters(key));
    }
    expect(
      translateUI("ru", 'No results for "{0}"', { 0: "{1} <script>" }),
    ).toBe("Ничего не найдено по запросу «{1} <script>»");
  });

  it("switches visible text and asynchronous translations without restarting editor effects", async () => {
    let mounts = 0;
    let eventTranslation: ReturnType<typeof useEventTranslation>;
    const Harness = () => {
      const tr = useTranslation();
      const eventTr = useEventTranslation();
      useEffect(() => {
        mounts++;
        eventTranslation = eventTr;
      }, [eventTr]);
      return <span>{tr("Settings")}</span>;
    };
    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(wrap("en", <Harness />));
    });
    expect(renderer.root.findByType("span").children).toEqual(["Settings"]);
    await act(async () => {
      renderer.update(wrap("ru", <Harness />));
    });
    expect(renderer.root.findByType("span").children).toEqual(["Настройки"]);
    expect(eventTranslation!("Failed to save changes")).toBe(
      "Не удалось сохранить изменения",
    );
    expect(mounts).toBe(1);
    await act(async () => renderer.unmount());
  });

  it("translates password validation without changing its rules", () => {
    const tr = (
      key: string,
      params?: Record<string, string | number | null | undefined>,
    ) => translateUI("ru", key, params);
    const policy = getPasswordPolicy(undefined, tr);
    expect(getPasswordRequirements("", policy, tr)[0].label).toBe(
      "Не менее 12 символов",
    );
    expect(validatePassword("short", policy, tr)).toContain(
      "Требования к паролю:",
    );
    expect(validatePassword("ValidPassword123!", policy, tr)).toBeNull();
  });
});

describe("localization coverage", () => {
  it("keeps user-facing JSX text and labels out of untranslated literals", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const ts = await import("typescript");
    const missed: string[] = [];
    const translatedIdentifiers: string[] = [];
    const allowed =
      /^(?:ExcaliDash|SQLite:?|S3:?|v|K|English|user@example\.com|cd backend && node scripts\/admin-recover\.cjs.*)$/;
    const walk = (directory: string) => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const filename = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          walk(filename);
          continue;
        }
        if (!/\.tsx?$/.test(filename)) continue;
        const source = ts.createSourceFile(
          filename,
          fs.readFileSync(filename, "utf8"),
          ts.ScriptTarget.Latest,
          true,
          filename.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
        );
        const visit = (node: import("typescript").Node) => {
          let text: string | undefined;
          if (ts.isJsxText(node)) text = node.text.replace(/\s+/g, " ").trim();
          if (
            ts.isStringLiteral(node) &&
            ts.isJsxAttribute(node.parent) &&
            /^(title|placeholder|aria-label|ariaLabel|confirmText|cancelText|description|label|subtitle|alt)$/.test(
              node.parent.name.getText(source),
            )
          )
            text = node.text;
          if (text && /[a-zA-Z]/.test(text) && !allowed.test(text))
            missed.push(
              `${filename}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}: ${text}`,
            );
          if (
            ts.isCallExpression(node) &&
            node.expression.getText(source) === "tr" &&
            node.arguments[0] &&
            ts.isStringLiteral(node.arguments[0])
          ) {
            expect(
              Object.hasOwn(russianMessages, node.arguments[0].text),
              `${filename}: ${node.arguments[0].text}`,
            ).toBe(true);
          }
          if (
            ts.isBinaryExpression(node) &&
            [
              ts.SyntaxKind.EqualsEqualsEqualsToken,
              ts.SyntaxKind.ExclamationEqualsEqualsToken,
            ].includes(node.operatorToken.kind)
          ) {
            for (const operand of [node.left, node.right]) {
              if (
                ts.isCallExpression(operand) &&
                operand.expression.getText(source) === "tr"
              )
                translatedIdentifiers.push(
                  `${filename}: ${node.getText(source)}`,
                );
            }
          }
          ts.forEachChild(node, visit);
        };
        visit(source);
      }
    };
    walk(path.resolve(import.meta.dirname, "../src"));
    expect(missed).toEqual([]);
    expect(translatedIdentifiers).toEqual([]);
  });
});
