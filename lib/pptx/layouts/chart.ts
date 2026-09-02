import type PptxGenJS from "pptxgenjs";
import { DesignToken, SlideContent } from "../../types";
import { MARGIN, addTitle, paintBackground } from "../theme";

export function renderChart(slide: PptxGenJS.Slide, content: SlideContent, design: DesignToken): void {
  paintBackground(slide, design);
  addTitle(slide, design, content.title ?? "");
  const data = (content.chartData ?? []).filter((d) => Number.isFinite(d.value));
  if (data.length < 2) return;
  const requested = content.chartType ?? "bar";
  const type: "bar" | "line" | "doughnut" = requested === "donut" ? "doughnut" : requested;
  slide.addChart(type, [{ name: content.title ?? "데이터", labels: data.map((d) => d.label), values: data.map((d) => d.value) }], {
    x: MARGIN, y: 1.72, w: 8.05, h: 4.85,
    showTitle: false, showLegend: type === "doughnut", showValue: true,
    showPercent: false,
    chartColors: [design.primary, ...design.accent],
    catAxisLabelFontFace: design.fontBody, catAxisLabelFontSize: 11,
    valAxisLabelFontFace: design.fontBody, valAxisLabelFontSize: 10,
  });
  slide.addShape("rect", {
    x: 9.25, y: 1.95, w: 3.25, h: 3.95,
    fill: { color: design.surface }, line: { type: "none" },
  });
  slide.addText("READ THIS", {
    x: 9.62, y: 2.35, w: 2.5, h: 0.3, fontFace: design.fontBody,
    fontSize: 10, bold: true, color: design.primary, charSpacing: 1.8, margin: 0,
  });
  slide.addText(content.chartInsight ?? "수치가 보여주는 핵심 변화를 한 문장으로 정리합니다.", {
    x: 9.62, y: 2.88, w: 2.5, h: 2.15, fontFace: design.fontHeading,
    fontSize: 22, bold: true, color: design.textPrimary, valign: "middle", margin: 0,
  });
}
