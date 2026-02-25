export function exportSVG(svgElement: SVGSVGElement, filename: string = "erd-diagram.svg") {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // Add xmlns if missing
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  // Serialize
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });

  // Download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
