"use client";
import Icon from "../Icon";
export default function CloseButton({ ref, className = "", ...props }) {
  return (
    <button
      ref={ref}
      type="button"
      className={"studio-close-button " + className}
      {...props}
    >
      <Icon name="close" size={22} />
    </button>
  );
}
