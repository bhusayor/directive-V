type MetadataRailProps = {
  items: Array<[label: string, value: string]>;
};

export function MetadataRail({ items }: MetadataRailProps) {
  return (
    <dl className="metadata-rail">
      {items.map(([label, value]) => (
        <div className="metadata-item" key={label}>
          <dt>{label}</dt>
          <dd className={value === "ACTIVE" ? "metadata-active" : undefined}>
            <span aria-hidden="true">{"// "}</span>
            {value.startsWith("█") ? <span aria-label="Redacted"><span aria-hidden="true">{value}</span></span> : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
