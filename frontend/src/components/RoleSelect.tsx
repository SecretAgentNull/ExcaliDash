import { useTranslation } from "../context/useTranslation";
import React from "react";
import { PlayfulSelect } from "./PlayfulSelect";
import type { CollectionShareRole } from "../types";

export const RoleSelect: React.FC<{
  value: CollectionShareRole;
  onChange: (val: string) => void;
  extraOptions?: { label: string; value: string; danger?: boolean }[];
}> = ({ value, onChange, extraOptions = [] }) => {
  const tr = useTranslation();
  const ROLE_OPTIONS: {
    label: string;
    value: CollectionShareRole;
    danger?: boolean;
  }[] = [
    { label: tr("Viewer"), value: "view" },
    { label: tr("Editor"), value: "edit" },
  ];

  const options = [...ROLE_OPTIONS, ...extraOptions];
  return (
    <PlayfulSelect
      ariaLabel={tr("Collection access")}
      value={value}
      onChange={onChange}
      options={options}
      align="right"
      portal
    />
  );
};
