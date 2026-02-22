import { useCallback, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export const useVirtualizedContent = (content: string) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => content.split('\n'), [content]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    // Generous estimate — actual size is measured after first paint
    estimateSize: () => 20,
    // Pull true height from the rendered DOM node
    measureElement: useCallback(
      (el: Element) => el.getBoundingClientRect().height,
      [],
    ),
    overscan: 15,
  });

  return {
    ref: parentRef,
    virtualizer,
    virtualItems: virtualizer.getVirtualItems(),
    totalSize: virtualizer.getTotalSize(),
    lines,
  };
};
