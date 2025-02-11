// This function formats a template literal by removing leading whitespace
// and keeping the relative indentation
export function formatTemplateLiteral(strings, ...values) {
  const str = strings.reduce((result, string, i) => {
    return result + string + (values[i] || "");
  }, "");
  const lines = str.split("\n"); // Split into lines
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0); // Ignore empty lines
  const firstContentIndex = lines.findIndex((line) => line.trim().length > 0); // Find first non-empty line
  const lastContentIndex =
    lines.length -
    1 -
    [...lines].reverse().findIndex((line) => line.trim().length > 0); // Find last non-empty line
  const leadingWhitespace = Math.min(
    ...nonEmptyLines.map((line) => line.match(/^\s*/)[0].length) // Find smallest indent
  );
  return lines
    .slice(firstContentIndex, lastContentIndex + 1) // Remove leading and trailing empty lines
    .map((line) => line.slice(leadingWhitespace)) // Remove leading indent
    .join("\n");
}
