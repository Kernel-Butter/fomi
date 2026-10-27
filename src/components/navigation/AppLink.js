"use client";
import Link from "next/link";
import { useContext } from "react";
import { RouteNavigationContext } from "./RouteProgressProvider";

// onNavigate preserves Next's modifier-click, external-link, and download behavior.
export default function AppLink({
  href,
  replace = false,
  scroll,
  onNavigate,
  ...props
}) {
  const navigation = useContext(RouteNavigationContext);
  return (
    <Link
      {...props}
      href={href}
      replace={replace}
      scroll={scroll}
      onNavigate={(event) => {
        let cancelled = false;
        onNavigate?.({
          preventDefault() {
            cancelled = true;
            event.preventDefault();
          },
        });
        if (cancelled || !navigation) return;
        event.preventDefault();
        navigation[replace ? "replace" : "push"](href, { scroll });
      }}
    />
  );
}
