import { useState } from "react";
import { cn } from "../../utils/cn";
interface MovieImageProps {
  src: string | null;
  alt: string;
  className?: string;
}
export function MovieImage({ src, alt, className }: MovieImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src)
    return (
      <div
        role="img"
        aria-label={alt || "배경 이미지 없음"}
        className={cn(
          "grid place-items-center bg-gray-200 text-sm text-gray-600",
          className,
        )}
      >
        이미지 없음
      </div>
    );
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
