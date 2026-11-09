import { useTranslation } from "../../context/useTranslation";
import React from "react";
import { Eye, Globe, Lock, Pencil } from "lucide-react";
import * as api from "../../api";
import { PlayfulSelect } from "../PlayfulSelect";
type Props = {
  activeLink: api.DrawingLinkShareRow | null;
  linkPermission: "view" | "edit";
  handleUpdateLink: (permission?: "view" | "edit") => void | Promise<void>;
  handleRevokeLink: () => void | Promise<void>;
};

export const GeneralAccessSection: React.FC<Props> = ({
  activeLink,
  linkPermission,
  handleUpdateLink,
  handleRevokeLink,
}) => {
  const tr = useTranslation();
  return (
    <section className="border-t-2 border-slate-100 pt-4 dark:border-neutral-800">
      <h3 className="mb-3 text-xs font-semibold text-slate-400 dark:text-neutral-500">
        {tr("General access")}{" "}
      </h3>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <PlayfulSelect
            ariaLabel={tr("Link access")}
            portal
            value={activeLink ? "anyone" : "restricted"}
            onChange={(value) => {
              if (value === "anyone") void handleUpdateLink();
              else void handleRevokeLink();
            }}
            options={[
              {
                label: tr("Restricted"),
                value: "restricted",
                icon: <Lock size={14} />,
              },
              {
                label: tr("Anyone with the link"),
                value: "anyone",
                icon: <Globe size={14} />,
              },
            ]}
            variant="playful"
            showCheck={false}
            buttonClassName="py-2 px-3 text-sm font-semibold"
          />
        </div>

        {activeLink && (
          <div className="flex items-center gap-2 shrink-0 animate-in fade-in duration-150">
            <PlayfulSelect
              ariaLabel={tr("Link permission")}
              portal
              value={linkPermission}
              onChange={(value) => handleUpdateLink(value as "view" | "edit")}
              options={[
                { label: tr("Viewer"), value: "view", icon: <Eye size={14} /> },
                {
                  label: tr("Editor"),
                  value: "edit",
                  icon: <Pencil size={14} />,
                },
              ]}
              variant="playful"
              className="w-32"
              buttonClassName="w-full justify-between py-2 px-3 text-sm font-semibold"
            />
          </div>
        )}
      </div>
      {activeLink && (
        <p className="mt-2 text-xs text-slate-500 dark:text-neutral-400">
          {tr("Link does not expire")}
        </p>
      )}
    </section>
  );
};
