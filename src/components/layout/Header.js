"use client";
import Link from "../navigation/AppLink";
import { useSelectedLayoutSegment } from "next/navigation";
import Image from "next/image";
import Icon from "../Icon";
import { useContext } from "react";
import { StudioNavigationContext } from "./StudioNavigation";
export default function Header({ profile, application, features }) {
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
  return (
    <header className="header">
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
    </header>
  );
}
