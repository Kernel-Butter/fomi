"use client";
import Link from "../navigation/AppLink";
import { useSelectedLayoutSegment } from "next/navigation";
import Image from "next/image";
import Icon from "../Icon";
import { useContext, useEffect, useState } from "react";
import StudioDrawer from "../ui/StudioDrawer";
import { StudioNavigationContext } from "./StudioNavigation";
export default function Header({ profile, application, features }) {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)");
    const sync = () => {
      if (!query.matches) setMenuOpen(false);
    };
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  const { openHistory } = useContext(StudioNavigationContext);
  const pathname = "/" + (useSelectedLayoutSegment() || "");
  const tabs = [
    { name: "home", href: "/home" },
    { name: "image", href: "/imagestudio" },
    { name: "video", href: "/videostudio" },
    { name: "wand", href: "/wand" },
    { name: "folder", href: "/folder" },
  ];
  const activeIndex = tabs.findIndex((tab) => tab.href === pathname);
  const labels = {
    home: "Home",
    image: "Image Studio",
    video: "Video Studio",
    wand: "Creative tools",
    folder: "Folders",
  };
  const workspaceLinks = tabs.map(({ name, href }, index) => (
    <Link
      key={name}
      href={href}
      aria-label={labels[name]}
      aria-current={activeIndex === index ? "page" : undefined}
      onNavigate={() => setMenuOpen(false)}
    >
      <Icon name={name} />
      <span>{labels[name]}</span>
      {features && !features[name] && <small>Coming soon</small>}
    </Link>
  ));
  return (
    <header className="header">
      <button
        type="button"
        className="header-menu-toggle"
        aria-label="Open navigation"
        aria-haspopup="dialog"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(true)}
      >
        <Icon name="menu" size={24} />
      </button>
      <Link
        className="logo block h-[34px] w-[21px] shrink-0 transition-all duration-200 hover:scale-110 hover:opacity-80 cursor-pointer"
        href="/imagestudio"
        aria-label="Frame Image Studio"
      >
        <svg
          width="21"
          height="34"
          viewBox="0 0 21 34"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M0 29.0545V4.79091L2.80892 0H21L15.9554 6.62614H8.61783H6.76433V8.19091V12.0352H15.9554L11.9809 18.5841H8.3121H6.76433V34L0 29.0545Z"
            fill="currentColor"
          />
        </svg>
      </Link>
      <nav className="tab-nav" aria-label="Workspace">
        <div className="tab-track">
          <span
            style={{
              transform: `translateX(${Math.max(0, activeIndex) * 100}%)`,
              opacity: activeIndex < 0 ? 0 : 1,
            }}
          />
        </div>
        <div className="tabs">
          {tabs.map(({ name, href }, index) => (
            <Link
              key={name}
              href={href}
              title={features && !features[name] ? "Coming soon" : undefined}
              data-available={features?.[name] || false}
              prefetch={true}
              aria-label={
                name === "image"
                  ? "Image Studio"
                  : name === "video"
                    ? "Video Studio"
                    : name
              }
              aria-current={activeIndex === index ? "page" : undefined}
              className={activeIndex === index ? "active" : ""}
            >
              <Icon name={name} />
            </Link>
          ))}
        </div>
      </nav>
      <div className="header-actions">
        <button
          className="utility"
          disabled={!features?.gallery}
          aria-label="Gallery"
          onClick={openHistory}
        >
          <Icon name="gallery" size={15} />
          <span>Gallery</span>
        </button>
        <a
          className="utility"
          href={features?.support ? application.support.href : undefined}
          aria-label={application?.support.label || "Contact support"}
          aria-disabled={!features?.support}
        >
          <Icon name="support" size={15} />
          <span>Support</span>
        </a>
        {profile ? (
          <Image
            className="avatar"
            src={profile.avatarUrl}
            width={28}
            height={28}
            alt={profile.avatarAlt}
            title={profile.displayName}
          />
        ) : (
          <span
            className="avatar avatar-placeholder"
            role="img"
            aria-label="Profile"
          >
            <Icon name="profile" size={17} />
          </span>
        )}
      </div>
      <StudioDrawer
        title="Navigation"
        square
        closeLabel="Close navigation"
        placement="left"
        compactPlacement="left"
        size="min(340px, calc(100vw - 28px))"
        rootClassName="navigation-drawer"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      >
        <nav className="drawer-workspace-links" aria-label="Workspace">
          {workspaceLinks}
        </nav>
        <div className="drawer-utilities">
          <button
            type="button"
            disabled={!features?.gallery}
            onClick={() => {
              setMenuOpen(false);
              openHistory();
            }}
          >
            <Icon name="gallery" />
            <span>Gallery</span>
          </button>
          <a
            href={features?.support ? application.support.href : undefined}
            aria-disabled={!features?.support}
          >
            <Icon name="support" />
            <span>Support</span>
          </a>
        </div>
      </StudioDrawer>
    </header>
  );
}
