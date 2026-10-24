import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Profile } from "../src/pages/Profile";
import { LocaleContext } from "../src/context/localeContext";
import { translate, type Locale } from "../src/i18n";

const { auth } = vi.hoisted(() => ({
  auth: {
    authEnabled: false,
    authMode: "local",
    user: null as null | {
      id: string;
      name: string;
      email: string;
      mustResetPassword: boolean;
    },
    logout: vi.fn(),
    updateUser: vi.fn(),
  },
}));
vi.mock("../src/context/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("../src/api", () => ({ getCollections: vi.fn(async () => []) }));
vi.mock("../src/components/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));

const render = (locale: Locale = "en") =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={["/profile"]}>
      <LocaleContext.Provider
        value={{
          locale,
          language: locale,
          setLanguage: vi.fn(),
          t: (key) => translate(locale, key),
        }}
      >
        <Profile />
      </LocaleContext.Provider>
    </MemoryRouter>,
  );

beforeEach(() => {
  auth.authEnabled = false;
  auth.authMode = "local";
  auth.user = null;
});

describe("profile account modes", () => {
  it("explains why account forms are unavailable instead of showing an empty page", () => {
    const html = render();
    expect(html).toContain("Single-user mode");
    expect(html).toContain("Authentication is disabled for this workspace.");
    expect(html).toContain('href="/settings"');
    expect(html).toContain("Open settings");
    expect(html).not.toContain('aria-label="Display name"');
    expect(html).not.toContain('aria-label="Change password"');
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("localizes the single-user explanation and settings link", () => {
    const html = render("ru");
    expect(html).toContain("Однопользовательский режим");
    expect(html).toContain(
      "Вход в аккаунт отключён для этого рабочего пространства.",
    );
    expect(html).toContain("Открыть настройки");
    expect(html).not.toContain(
      "Authentication is disabled for this workspace.",
    );
  });

  it("continues to show account and password controls for local sign-in", () => {
    auth.authEnabled = true;
    auth.user = {
      id: "user",
      name: "Test User",
      email: "user@example.com",
      mustResetPassword: false,
    };
    const html = render();
    expect(html).toContain('aria-label="Display name"');
    expect(html).toContain('aria-label="Change password"');
    expect(html).not.toContain(
      "Authentication is disabled for this workspace.",
    );
  });

  it("keeps password controls hidden for enforced OIDC sign-in", () => {
    auth.authEnabled = true;
    auth.authMode = "oidc_enforced";
    auth.user = {
      id: "user",
      name: "Test User",
      email: "user@example.com",
      mustResetPassword: false,
    };
    const html = render();
    expect(html).toContain('aria-label="Display name"');
    expect(html).not.toContain('aria-label="Change password"');
    expect(html).not.toContain("Single-user mode");
  });
});
