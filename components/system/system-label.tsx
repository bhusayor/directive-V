type SystemLabelProps = {
  children: React.ReactNode;
  tone?: "quiet" | "signal";
};

export function SystemLabel({ children, tone = "quiet" }: SystemLabelProps) {
  return <span className={`system-label system-label--${tone}`}>{children}</span>;
}
