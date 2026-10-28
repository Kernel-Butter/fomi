"use client";
import { useEffect, useState } from "react";

export default function useHistoryScroll(
  ref,
  currentId,
  visible,
  vertical = false,
) {
  const [edges, setEdges] = useState({ before: false, after: false });
  useEffect(() => {
    const list = ref.current;
    if (!list || !visible) return;
    const update = () => {
      const position = vertical ? list.scrollTop : list.scrollLeft;
      const size = vertical ? list.clientHeight : list.clientWidth;
      const total = vertical ? list.scrollHeight : list.scrollWidth;
      setEdges({ before: position > 1, after: position + size < total - 1 });
    };
    const observer = new ResizeObserver(update);
    observer.observe(list);
    for (const child of list.children) observer.observe(child);
    list.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      list.removeEventListener("scroll", update);
    };
  }, [ref, currentId, visible, vertical]);
  useEffect(() => {
    const list = ref.current;
    if (!list || !visible) return;
    const item = [...list.children].find(
      (child) => child.dataset.historyId === currentId,
    );
    if (!item) return;
    function keepVisible() {
      if (!vertical) {
        const start = item.offsetLeft;
        const end = start + item.offsetWidth;
        if (start < list.scrollLeft || end > list.scrollLeft + list.clientWidth)
          list.scrollTo({
            left: Math.max(
              0,
              start - (list.clientWidth - item.offsetWidth) / 2,
            ),
            behavior: "instant",
          });
        return;
      }
      const bounds = list.getBoundingClientRect();
      const target = item.getBoundingClientRect();
      const start = vertical
        ? target.top - bounds.top
        : target.left - bounds.left;
      const end = vertical
        ? target.bottom - bounds.bottom
        : target.right - bounds.right;
      const delta = start < 0 ? start - 8 : end > 0 ? end + 8 : 0;
      list.scrollBy({
        [vertical ? "top" : "left"]: delta,
        behavior: "instant",
      });
    }
    keepVisible();
  }, [ref, currentId, visible, vertical]);
  function slide(direction) {
    const list = ref.current;
    if (!list) return;
    list.scrollBy({
      [vertical ? "top" : "left"]:
        direction * (vertical ? list.clientHeight : list.clientWidth) * 0.8,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  return { ...edges, slide };
}
