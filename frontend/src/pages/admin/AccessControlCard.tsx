import { useTranslation } from "../../context/useTranslation";
import React from "react";
import { UserPlus } from "lucide-react";
import { PlayfulSwitch } from "../../components/PlayfulSwitch";
import {
  SettingsCard,
  SettingsRow,
  SettingsSectionHeader,
} from "../settings/SettingsRow";

type AccessControlCardProps = {
  registrationEnabled: boolean | null;
  localRegistrationAllowed: boolean;
  oidcEnabled: boolean;
  oidcProviderName: string | null;
  oidcJitProvisioningEnabled: boolean | null;
  loading: boolean;
  onToggleRegistration: () => void | Promise<void>;
  onToggleOidcJitProvisioning: () => void | Promise<void>;
};

const getRegistrationDescription = (
  registrationEnabled: boolean | null,
  localRegistrationAllowed: boolean,
) => {
  if (registrationEnabled === null) return "Loading…";
  if (!localRegistrationAllowed) return "Managed by OIDC-only mode";
  return registrationEnabled
    ? "Anyone can create a local account"
    : "New local accounts are blocked";
};

export const AccessControlCard: React.FC<AccessControlCardProps> = ({
  registrationEnabled,
  localRegistrationAllowed,
  oidcEnabled,
  oidcProviderName,
  oidcJitProvisioningEnabled,
  loading,
  onToggleRegistration,
  onToggleOidcJitProvisioning,
}) => {
  const tr = useTranslation();
  return (
    <section className="mb-6">
      <SettingsSectionHeader
        icon={<UserPlus size={20} />}
        tileClassName="border-black bg-emerald-400 text-black dark:border-neutral-700 dark:bg-emerald-400 dark:text-black"
        title={tr("Access control")}
        subtitle={tr("Who can create an account")}
      />

      <SettingsCard>
        <SettingsRow
          title={tr("Local sign-up")}
          description={tr(
            getRegistrationDescription(
              registrationEnabled,
              localRegistrationAllowed,
            ),
          )}
        >
          <PlayfulSwitch
            checked={Boolean(registrationEnabled)}
            disabled={
              loading ||
              registrationEnabled === null ||
              !localRegistrationAllowed
            }
            onChange={() => void onToggleRegistration()}
            ariaLabel={tr("Toggle local sign-up")}
          />
        </SettingsRow>

        {oidcEnabled ? (
          <SettingsRow
            title={tr("{0} auto-provisioning", {
              0: oidcProviderName || "OIDC",
            })}
            description={
              oidcJitProvisioningEnabled
                ? tr("OIDC users get an account on first sign-in")
                : tr("Only pre-created users can sign in via OIDC")
            }
          >
            <PlayfulSwitch
              checked={Boolean(oidcJitProvisioningEnabled)}
              disabled={loading || oidcJitProvisioningEnabled === null}
              onChange={() => void onToggleOidcJitProvisioning()}
              ariaLabel={tr("Toggle {0} auto-provisioning", {
                0: oidcProviderName || "OIDC",
              })}
            />
          </SettingsRow>
        ) : null}
      </SettingsCard>
    </section>
  );
};
