import { Icon } from "./Icon";

export function ExportCsvButton({
  count,
  busy = false,
  onExport,
}: {
  count: number;
  busy?: boolean;
  onExport: () => void;
}) {
  return (
    <button
      type="button"
      className="button button-secondary export-button"
      disabled={count === 0 || busy}
      onClick={onExport}
    >
      <Icon name="download" size={16} />
      {busy ? "Exporting…" : "Export Selected to CSV"}
      {count > 0 && <span className="button-count">{count}</span>}
    </button>
  );
}
