import { COLORS } from "@/lib/constants";

interface GridPatternProps {
  width: number;
  height: number;
}

export default function GridPattern({ width, height }: GridPatternProps) {
  return (
    <>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.8" fill={COLORS.gridDot} />
      </pattern>
      <rect width={width} height={height} fill="url(#grid)" />
    </>
  );
}
