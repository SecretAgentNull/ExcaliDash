import { useTranslation } from "../../context/useTranslation";
import type { ReactNode } from "react";
import { Check, FlaskConical, RefreshCw, ShieldCheck } from "lucide-react";
import type * as api from "../../api";
import { PlayfulSelect } from "../../components/PlayfulSelect";
import { SettingsRow, settingsButtonClass } from "./SettingsRow";

type UpdateSettingsCardProps = {
  updateChannel: api.UpdateChannel;
  updateInfo: api.UpdateInfo | null;
  updateLoading: boolean;
  updateError: string | null;
  onChannelChange: (channel: api.UpdateChannel) => void;
  onCheckForUpdates: () => void;
};

export const UpdateSettingsCard = ({
  updateChannel,
  updateInfo,
  updateLoading,
  updateError,
  onChannelChange,
  onCheckForUpdates,
}: UpdateSettingsCardProps) => {
  const tr = useTranslation();

  let status: ReactNode = tr("Status unknown");
  if (updateInfo?.outboundEnabled === false) {
    status = tr("Update checks disabled");
  } else if (updateLoading) {
    status = tr("Checking…");
  } else if (updateInfo?.isUpdateAvailable) {
    status = (
      <span className="font-bold text-emerald-600 dark:text-emerald-400">
        v{updateInfo.latestVersion} {tr("available")}{" "}
      </span>
    );
  } else if (updateInfo?.latestVersion) {
    status = (
      <span className="inline-flex items-center gap-1">
        <Check size={12} strokeWidth={3} className="text-emerald-500" />
        {tr("Up to date")}{" "}
      </span>
    );
  } else if (updateError) {
    status = (
      <span className="text-red-600 dark:text-red-400">{tr(updateError)}</span>
    );
  }

  return (
    <SettingsRow
      icon={
        <RefreshCw size={20} className={updateLoading ? "animate-spin" : ""} />
      }
      tileClassName="border-black bg-emerald-400 text-black dark:border-neutral-700 dark:bg-emerald-400 dark:text-black"
      title={tr("Updates")}
      description={
        <span className="inline-flex flex-wrap items-center gap-2">
          {status}
          <a
            href="https://github.com/ZimengXiong/ExcaliDash/releases"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center font-bold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {tr("Releases")}{" "}
          </a>
          {updateInfo?.error && !updateLoading ? (
            <span className="basis-full text-red-500 dark:text-red-400">
              {tr("Error:")} {updateInfo.error}
            </span>
          ) : null}
        </span>
      }
    >
      <PlayfulSelect
        ariaLabel={tr("Update channel")}
        value={updateChannel}
        onChange={(value) =>
          onChannelChange(value === "prerelease" ? "prerelease" : "stable")
        }
        options={[
          {
            value: "stable",
            label: tr("Stable"),
            icon: <ShieldCheck size={14} />,
          },
          {
            value: "prerelease",
            label: tr("Prerelease"),
            icon: <FlaskConical size={14} />,
          },
        ]}
      />
      <button
        type="button"
        onClick={onCheckForUpdates}
        disabled={updateLoading}
        className={settingsButtonClass}
      >
        {tr("Check")}{" "}
      </button>
    </SettingsRow>
  );
};
