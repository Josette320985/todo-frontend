interface Props {
  width?: string;
  height?: string;
  className?: string;
}

export default function Skeleton({ width, height, className = '' }: Props) {
  return (
    <span
      data-skeleton
      aria-hidden="true"
      className={`inline-block animate-pulse rounded-md bg-neutral-200 motion-reduce:animate-none dark:bg-neutral-800 ${className}`}
      style={{ width, height }}
    />
  );
}
