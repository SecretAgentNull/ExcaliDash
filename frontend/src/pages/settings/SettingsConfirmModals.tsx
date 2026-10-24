import { useTranslation } from "../../context/useTranslation";
import type React from "react";
import { ConfirmModal } from "../../components/ConfirmModal";
import * as api from "../../api";

type LegacyDbImportConfirmation = {
  isOpen: boolean;
  file: File | null;
  info: null | {
    drawings: number;
    collections: number;
    legacyLatestMigration: string | null;
    currentLatestMigration: string | null;
  };
};

type BackupImportConfirmation = {
  isOpen: boolean;
  file: File | null;
  info: null | {
    formatVersion: number;
    exportedAt: string;
    excalidashBackendVersion: string | null;
    collections: number;
    drawings: number;
  };
};

type DialogState = { isOpen: boolean; message: string };
type SuccessDialogState = { isOpen: boolean; message: React.ReactNode };
type AuthToggleConfirm = { isOpen: boolean; nextEnabled: boolean | null };

type SettingsConfirmModalsProps = {
  legacyDbImportConfirmation: LegacyDbImportConfirmation;
  setLegacyDbImportConfirmation: React.Dispatch<
    React.SetStateAction<LegacyDbImportConfirmation>
  >;
  importError: DialogState;
  setImportError: React.Dispatch<React.SetStateAction<DialogState>>;
  importSuccess: SuccessDialogState;
  setImportSuccess: React.Dispatch<React.SetStateAction<SuccessDialogState>>;
  authToggleConfirm: AuthToggleConfirm;
  setAuthToggleConfirm: React.Dispatch<React.SetStateAction<AuthToggleConfirm>>;
  authDisableFinalConfirmOpen: boolean;
  setAuthDisableFinalConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setAuthEnabled: (enabled: boolean) => Promise<void>;
  backupImportConfirmation: BackupImportConfirmation;
  setBackupImportConfirmation: React.Dispatch<
    React.SetStateAction<BackupImportConfirmation>
  >;
  backupImportSuccess: boolean;
  setBackupImportSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  backupImportError: DialogState;
  setBackupImportError: React.Dispatch<React.SetStateAction<DialogState>>;
  setBackupImportLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

export const SettingsConfirmModals = ({
  legacyDbImportConfirmation,
  setLegacyDbImportConfirmation,
  importError,
  setImportError,
  importSuccess,
  setImportSuccess,
  authToggleConfirm,
  setAuthToggleConfirm,
  authDisableFinalConfirmOpen,
  setAuthDisableFinalConfirmOpen,
  setAuthEnabled,
  backupImportConfirmation,
  setBackupImportConfirmation,
  backupImportSuccess,
  setBackupImportSuccess,
  backupImportError,
  setBackupImportError,
  setBackupImportLoading,
}: SettingsConfirmModalsProps) => {
  const tr = useTranslation();
  return (
    <>
      <ConfirmModal
        isOpen={legacyDbImportConfirmation.isOpen}
        title={tr("Merge legacy database?")}
        message={
          <div className="space-y-2 text-left">
            <div>
              {tr(
                "This merges legacy data into your account without replacing the server database.",
              )}{" "}
            </div>
            {legacyDbImportConfirmation.info && (
              <div className="space-y-1 text-sm text-slate-700 dark:text-neutral-200">
                <div>
                  {tr("Drawings:")} {legacyDbImportConfirmation.info.drawings}
                </div>
                <div>
                  {tr("Collections:")}{" "}
                  {legacyDbImportConfirmation.info.collections}
                </div>
                <div>
                  {tr("Legacy migration:")}{" "}
                  {legacyDbImportConfirmation.info.legacyLatestMigration ||
                    tr("Unknown")}
                </div>
                <div>
                  {tr("Current migration:")}{" "}
                  {legacyDbImportConfirmation.info.currentLatestMigration ||
                    tr("Unknown")}
                </div>
              </div>
            )}
          </div>
        }
        confirmText={tr("Merge import")}
        cancelText={tr("Cancel")}
        onConfirm={async () => {
          const file = legacyDbImportConfirmation.file;
          if (!file) return;
          setLegacyDbImportConfirmation({
            isOpen: false,
            file: null,
            info: null,
          });
          const formData = new FormData();
          formData.append("db", file);
          try {
            const response = await api.api.post<{
              collections: { created: number; updated: number };
              drawings: { created: number; updated: number };
            }>("/import/sqlite/legacy", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            setImportSuccess({
              isOpen: true,
              message: tr(
                "Legacy database imported. Collections: +{0} / ~{1}. Drawings: +{2} / ~{3}.",
                {
                  0: response.data.collections.created,
                  1: response.data.collections.updated,
                  2: response.data.drawings.created,
                  3: response.data.drawings.updated,
                },
              ),
            });
          } catch (err: unknown) {
            let message = tr("Failed to import legacy database.");
            if (api.isAxiosError(err)) {
              message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                message;
            }
            setImportError({ isOpen: true, message });
          }
        }}
        onCancel={() =>
          setLegacyDbImportConfirmation({
            isOpen: false,
            file: null,
            info: null,
          })
        }
      />
      <ConfirmModal
        isOpen={importError.isOpen}
        title={tr("Import failed")}
        message={importError.message}
        confirmText={tr("OK")}
        showCancel={false}
        isDangerous={false}
        onConfirm={() => setImportError({ isOpen: false, message: "" })}
        onCancel={() => setImportError({ isOpen: false, message: "" })}
      />
      <ConfirmModal
        isOpen={importSuccess.isOpen}
        title={tr("Import successful")}
        message={importSuccess.message}
        confirmText={tr("OK")}
        showCancel={false}
        isDangerous={false}
        variant="success"
        onConfirm={() => setImportSuccess({ isOpen: false, message: "" })}
        onCancel={() => setImportSuccess({ isOpen: false, message: "" })}
      />
      <ConfirmModal
        isOpen={authToggleConfirm.isOpen}
        title={
          authToggleConfirm.nextEnabled
            ? tr("Enable authentication?")
            : tr("Disable authentication?")
        }
        message={
          authToggleConfirm.nextEnabled ? (
            tr(
              "This will require users to sign in. You will be prompted to set up an admin account immediately.",
            )
          ) : (
            <div className="space-y-2 text-left">
              <div>
                {tr(
                  "This will turn off authentication for the entire instance.",
                )}{" "}
              </div>
              <div className="font-semibold text-rose-700 dark:text-rose-300">
                {tr(
                  "Recommendation: keep authentication enabled unless this instance is fully private.",
                )}{" "}
              </div>
            </div>
          )
        }
        confirmText={
          authToggleConfirm.nextEnabled ? tr("Enable") : tr("Continue")
        }
        cancelText={tr("Cancel")}
        isDangerous={!authToggleConfirm.nextEnabled}
        onConfirm={async () => {
          const nextEnabled = authToggleConfirm.nextEnabled;
          setAuthToggleConfirm({ isOpen: false, nextEnabled: null });
          if (typeof nextEnabled !== "boolean") return;
          if (!nextEnabled) {
            setAuthDisableFinalConfirmOpen(true);
            return;
          }
          await setAuthEnabled(nextEnabled);
        }}
        onCancel={() =>
          setAuthToggleConfirm({ isOpen: false, nextEnabled: null })
        }
      />
      <ConfirmModal
        isOpen={authDisableFinalConfirmOpen}
        title={tr("Final warning: disable authentication?")}
        message={
          <div className="space-y-2 text-left">
            <div>
              {tr(
                "With authentication off, any user who can access this URL can view and modify all drawings and settings. They can also turn authentication back on and lock you out.",
              )}{" "}
            </div>
            <div className="font-semibold text-rose-700 dark:text-rose-300">
              {tr("This is only safe on a trusted private network.")}{" "}
            </div>
          </div>
        }
        confirmText={tr("Disable Authentication")}
        cancelText={tr("Keep Enabled (Recommended)")}
        isDangerous
        onConfirm={async () => {
          setAuthDisableFinalConfirmOpen(false);
          await setAuthEnabled(false);
        }}
        onCancel={() => setAuthDisableFinalConfirmOpen(false)}
      />
      <ConfirmModal
        isOpen={backupImportConfirmation.isOpen}
        title={tr("Import backup?")}
        message={
          backupImportConfirmation.info
            ? tr(
                "This will merge {0} collection(s) and {1} drawing(s) from a Format v{2} backup exported at {3}.",
                {
                  0: backupImportConfirmation.info.collections,
                  1: backupImportConfirmation.info.drawings,
                  2: backupImportConfirmation.info.formatVersion,
                  3: backupImportConfirmation.info.exportedAt,
                },
              )
            : tr("This will merge the backup into your account.")
        }
        confirmText={tr("Import")}
        cancelText={tr("Cancel")}
        isDangerous={false}
        onConfirm={async () => {
          const file = backupImportConfirmation.file;
          if (!file) return;
          setBackupImportConfirmation({
            ...backupImportConfirmation,
            isOpen: false,
          });
          setBackupImportLoading(true);
          try {
            const formData = new FormData();
            formData.append("archive", file);
            await api.api.post("/import/excalidash", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            setBackupImportConfirmation({
              isOpen: false,
              file: null,
              info: null,
            });
            setBackupImportSuccess(true);
          } catch (err: unknown) {
            console.error("Backup import failed:", err);
            let message = tr("Failed to import backup.");
            if (api.isAxiosError(err)) {
              message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                message;
            }
            setBackupImportError({ isOpen: true, message });
            setBackupImportConfirmation({
              isOpen: false,
              file: null,
              info: null,
            });
          } finally {
            setBackupImportLoading(false);
          }
        }}
        onCancel={() =>
          setBackupImportConfirmation({ isOpen: false, file: null, info: null })
        }
      />
      <ConfirmModal
        isOpen={backupImportSuccess}
        title={tr("Backup Imported")}
        message={tr("Backup imported successfully.")}
        confirmText={tr("OK")}
        showCancel={false}
        isDangerous={false}
        variant="success"
        onConfirm={() => setBackupImportSuccess(false)}
        onCancel={() => setBackupImportSuccess(false)}
      />
      <ConfirmModal
        isOpen={backupImportError.isOpen}
        title={tr("Backup Import Failed")}
        message={backupImportError.message}
        confirmText={tr("OK")}
        cancelText=""
        showCancel={false}
        isDangerous={false}
        onConfirm={() => setBackupImportError({ isOpen: false, message: "" })}
        onCancel={() => setBackupImportError({ isOpen: false, message: "" })}
      />
    </>
  );
};
