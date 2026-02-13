export type ExportSvgOptions = {
  filename?: string;
  selectedOnly?: boolean;
  selectedInstanceId?: string | null;
};

export const exportSvg = (
  svgElement: SVGSVGElement,
  {
    filename = "patternstudio-aldrich-bodice.svg",
    selectedOnly = false,
    selectedInstanceId = null,
  }: ExportSvgOptions = {},
): void => {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  if (selectedOnly && selectedInstanceId) {
    const groups = clone.querySelectorAll("[data-instance-id]");
    groups.forEach((group) => {
      if (group.getAttribute("data-instance-id") !== selectedInstanceId) {
        group.remove();
      }
    });
  }

  const xml = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
};
