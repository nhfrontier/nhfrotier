/* global React, lucide */
// Thin React wrapper over Lucide UMD icons (substitute for NH's proprietary
// icon set — see README). Usage: <Icon name="Search" size={18} />
function Icon({ name, size = 20, color = "currentColor", strokeWidth = 1.8, style = {} }) {
  const lib = (typeof lucide !== "undefined" && lucide) || window.lucide || {};
  const map = lib.icons || lib;
  let node = map[name];
  // lucide icon node = [ [tag, attrs], ... ]  (sometimes wrapped)
  if (node && node.length && typeof node[0] === "string") node = node[2]; // [tag, attrs, children]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flex: "none", ...style }}
    >
      {Array.isArray(node) &&
        node.map(([tag, attrs], i) => React.createElement(tag, { key: i, ...attrs }))}
    </svg>
  );
}

window.Icon = Icon;
