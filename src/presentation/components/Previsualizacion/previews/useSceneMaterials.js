import { useMemo } from "react";

export const DoubleSide = 2;

export default function useSceneMaterials(colorMarco, colorVidrio) {
  const mMarco = useMemo(() => ({
    color: colorMarco,
    roughness: 0.3,
    metalness: 0.8,
    side: DoubleSide,
  }), [colorMarco]);

  const mVidrio = useMemo(() => ({
    color: colorVidrio,
    transparent: true,
    opacity: 0.4,
    roughness: 0.1,
    metalness: 0,
    transmission: 0.9,
    thickness: 0.5,
    side: DoubleSide,
  }), [colorVidrio]);

  return { mMarco, mVidrio };
}