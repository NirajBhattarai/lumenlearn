"use client";

import { useMemo } from "react";
import { layoutArray } from "@/lib/visualization";
import { VizCanvas } from "./VizCanvas";

type Props = {
  values: Array<string | number | null>;
  highlightIndex?: number | null;
  className?: string;
  ariaLabel?: string;
};

export function ArrayView({
  values,
  highlightIndex = null,
  className,
  ariaLabel,
}: Props) {
  const state = useMemo(
    () => layoutArray({ values, highlightIndex }),
    [values, highlightIndex],
  );

  return (
    <VizCanvas
      state={state}
      className={className}
      ariaLabel={ariaLabel ?? `Array of ${values.length} cells`}
    />
  );
}
