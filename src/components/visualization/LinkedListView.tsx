"use client";

import { useMemo } from "react";
import { layoutLinkedList } from "@/lib/visualization";
import { VizCanvas } from "./VizCanvas";

type Props = {
  values: Array<string | number>;
  highlightId?: string | null;
  className?: string;
  ariaLabel?: string;
};

export function LinkedListView({
  values,
  highlightId = null,
  className,
  ariaLabel,
}: Props) {
  const state = useMemo(
    () => layoutLinkedList({ values, highlightId }),
    [values, highlightId],
  );

  return (
    <VizCanvas
      state={state}
      className={className}
      ariaLabel={ariaLabel ?? `Linked list with ${values.length} nodes`}
    />
  );
}
