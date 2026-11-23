interface Props {
  width?: string;
  height?: string;
  className?: string;
}

export default function Skeleton({ width, height, className = '' }: Props) {
  return (
    <span className={`placeholder-glow d-inline-block ${className}`}>
      <span className="placeholder rounded d-inline-block" style={{ width, height }} aria-hidden="true" />
    </span>
  );
}
