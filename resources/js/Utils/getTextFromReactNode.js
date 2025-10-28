function getTextFromReactNode(node) {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(getTextFromReactNode).join("");
  if (node?.props?.children) return getTextFromReactNode(node.props.children);
  return "";
}

export default getTextFromReactNode