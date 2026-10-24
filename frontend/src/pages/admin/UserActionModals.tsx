import { useTranslation } from "../../context/useTranslation";
import React from "react";
import { ConfirmModal } from "../../components/ConfirmModal";
import type { AdminUser } from "./types";

type PasswordResult = {
  email: string;
  tempPassword: string;
};

type UserActionModalsProps = {
  impersonateTarget: AdminUser | null;
  resetPasswordResult: PasswordResult | null;
  onConfirmImpersonation: (user: AdminUser) => void | Promise<void>;
  onCancelImpersonation: () => void;
  onCopyPassword: (result: PasswordResult) => void | Promise<void>;
  onClosePassword: () => void;
};

export const UserActionModals: React.FC<UserActionModalsProps> = ({
  impersonateTarget,
  resetPasswordResult,
  onConfirmImpersonation,
  onCancelImpersonation,
  onCopyPassword,
  onClosePassword,
}) => {
  const tr = useTranslation();
  return (
    <>
      <ConfirmModal
        isOpen={Boolean(impersonateTarget)}
        title={tr("Start impersonation?")}
        message={
          impersonateTarget
            ? tr(
                "You will act as {0} until you stop impersonation. Continue?",
                { 0: impersonateTarget.email },
              )
            : ""
        }
        confirmText={tr("Impersonate")}
        onConfirm={() => {
          if (impersonateTarget) {
            void onConfirmImpersonation(impersonateTarget);
          }
          onCancelImpersonation();
        }}
        onCancel={onCancelImpersonation}
      />

      <ConfirmModal
        isOpen={Boolean(resetPasswordResult)}
        title={tr("Temporary password")}
        message={
          resetPasswordResult ? (
            <div className="space-y-3">
              <div className="text-xs">
                {tr("Temporary password for")}{" "}
                <span className="font-bold text-slate-900 dark:text-neutral-100">
                  {resetPasswordResult.email}
                </span>
                {tr(
                  ". They will be prompted to set a new password after signing in.",
                )}{" "}
              </div>
              <div className="break-all rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-semibold tracking-tight text-slate-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100">
                {resetPasswordResult.tempPassword}
              </div>
            </div>
          ) : (
            ""
          )
        }
        confirmText={tr("Copy")}
        cancelText={tr("Close")}
        isDangerous={false}
        variant="success"
        onConfirm={() => {
          if (!resetPasswordResult) return;
          void onCopyPassword(resetPasswordResult);
          onClosePassword();
        }}
        onCancel={onClosePassword}
      />
    </>
  );
};
