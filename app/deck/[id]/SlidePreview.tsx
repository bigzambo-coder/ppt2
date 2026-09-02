"use client";

import { DesignToken, SlideContent } from "@/lib/types";

/**
 * Renders one slide as a 16:9 HTML preview mirroring the PPTX layout renderers
 * in lib/pptx/layouts/. All sizes are in `cqw` (percent of this card's own
 * width), so the preview stays proportionally identical to the exported slide
 * whether it's shown as a thumbnail or full width — no JS measurement needed.
 */
export function SlidePreview({ slide, design }: { slide: SlideContent; design: DesignToken }) {
  const c = (hex: string) => `#${hex.replace("#", "")}`;
  const accent = c(design.accent[0] ?? design.primary);
  const radius = design.shapeLanguage === "sharp" ? "0" : "0.8cqw";

  const shell: React.CSSProperties = {
    containerType: "inline-size",
    aspectRatio: "16 / 9",
    background: c(design.background),
    color: c(design.textPrimary),
    fontFamily: `"${design.fontBody}", "Malgun Gothic", sans-serif`,
    position: "relative",
    overflow: "hidden",
    width: "100%",
  };

  const pad = "4.5cqw";
  const titleStyle: React.CSSProperties = {
    fontFamily: `"${design.fontHeading}", "Malgun Gothic", sans-serif`,
    fontSize: "4.4cqw",
    fontWeight: 700,
    lineHeight: 1.25,
    display: "flex",
    alignItems: "baseline",
    gap: "1.4cqw",
  };
  const badge = (
    <span
      style={{
        flex: "0 0 auto",
        width: "1.2cqw",
        height: "1.2cqw",
        borderRadius: "50%",
        background: c(design.primary),
        transform: "translateY(-0.3cqw)",
      }}
    />
  );

  const Frame = ({ children }: { children: React.ReactNode }) => (
    <div style={shell}>
      <div style={{ position: "absolute", inset: 0, padding: pad, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );

  const Title = () =>
    slide.title ? (
      <div style={titleStyle}>
        {badge}
        <span>{slide.title}</span>
      </div>
    ) : null;

  const body: React.CSSProperties = { flex: 1, minHeight: 0, marginTop: "3cqw" };
  const muted = c(design.textSecondary);

  switch (slide.layout) {
    case "cover": {
      // Mirrors lib/pptx/layouts/cover.ts: 63% white field, color panel right
      // carrying a faded keyword, title anchored by an accent rule.
      const year = String(new Date().getFullYear());
      return (
        <div style={shell}>
          <div style={{ position: "absolute", right: 0, top: 0, width: "37%", height: "100%", background: c(design.primary) }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: `"${design.fontHeading}", sans-serif`,
                fontSize: "7.5cqw",
                fontWeight: 700,
                color: c(design.background),
                opacity: 0.45,
              }}
            >
              {year}
            </div>
            <div style={{ position: "absolute", left: "8%", bottom: "18%", width: "22%", height: "1.2cqw", background: accent }} />
          </div>
          <div style={{ position: "absolute", left: pad, top: "34%", width: "52%" }}>
            <div style={{ width: "8cqw", height: "1.3cqw", background: accent }} />
            <div
              style={{
                marginTop: "2.4cqw",
                fontFamily: `"${design.fontHeading}", sans-serif`,
                fontSize: "5.6cqw",
                fontWeight: 700,
                lineHeight: 1.12,
              }}
            >
              {slide.title}
            </div>
          </div>
          {slide.subtitle && (
            <div style={{ position: "absolute", left: pad, bottom: "10%", fontSize: "2.1cqw", color: muted }}>{slide.subtitle}</div>
          )}
        </div>
      );
    }

    case "closing":
      return (
        <div style={{ ...shell, background: c(design.primary), color: c(design.background) }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: pad }}>
            <div style={{ width: "9cqw", height: "1.3cqw", background: accent, marginBottom: "2.2cqw" }} />
            <div style={{ fontFamily: `"${design.fontHeading}", sans-serif`, fontSize: "6.4cqw", fontWeight: 700 }}>{slide.title}</div>
            {slide.subtitle && <div style={{ marginTop: "1.8cqw", fontSize: "2.2cqw", opacity: 0.85 }}>{slide.subtitle}</div>}
          </div>
        </div>
      );

    case "divider":
      return (
        <Frame>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ width: "6cqw", height: "0.5cqw", background: accent, marginBottom: "2cqw" }} />
            <div style={{ fontFamily: `"${design.fontHeading}", sans-serif`, fontSize: "4.8cqw", fontWeight: 700 }}>{slide.title}</div>
            {slide.subtitle && <div style={{ marginTop: "1.4cqw", fontSize: "2.2cqw", color: muted }}>{slide.subtitle}</div>}
          </div>
        </Frame>
      );

    case "bullets": {
      // Mirrors bodySize() in lib/pptx/layouts/bullets.ts so the preview shows
      // the same type scale the exported slide will use.
      const n = (slide.bullets ?? []).length;
      const size = n <= 2 ? 3.4 : n === 3 ? 2.9 : n === 4 ? 2.6 : 2.25;
      return (
        <Frame>
          <Title />
          <ul
            style={{
              ...body,
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: `${size * 0.8}cqw`,
            }}
          >
            {(slide.bullets ?? []).map((b, i) => (
              <li key={i} style={{ display: "flex", gap: "1.4cqw", fontSize: `${size}cqw`, lineHeight: 1.45 }}>
                <span style={{ flex: "0 0 auto", width: "0.7cqw", height: "0.7cqw", background: accent, marginTop: `${size * 0.5}cqw` }} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </Frame>
      );
    }

    case "compare":
      return (
        <Frame>
          <Title />
          <div style={{ ...body, display: "grid", gridTemplateColumns: `repeat(${(slide.columns ?? []).length || 1}, 1fr)`, gap: "2cqw" }}>
            {(slide.columns ?? []).map((col, i) => (
              <div key={i} style={{ background: c(design.surface), borderRadius: radius, padding: "2.4cqw", display: "flex", flexDirection: "column", gap: "1.4cqw" }}>
                <div style={{ fontSize: "2.5cqw", fontWeight: 700, color: i === 0 ? muted : c(design.primary) }}>{col.title}</div>
                {col.items.map((it, j) => (
                  <div key={j} style={{ fontSize: "2cqw", color: muted, lineHeight: 1.4 }}>{it}</div>
                ))}
              </div>
            ))}
          </div>
        </Frame>
      );

    case "process":
      return (
        <Frame>
          <Title />
          <div style={{ ...body, display: "grid", gridTemplateColumns: `repeat(${(slide.steps ?? []).length || 1}, 1fr)`, gap: "1.8cqw" }}>
            {(slide.steps ?? []).map((s, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.2cqw" }}>
                <div
                  style={{
                    width: "3.4cqw",
                    height: "3.4cqw",
                    borderRadius: "50%",
                    background: c(design.primary),
                    color: c(design.background),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.8cqw",
                    fontWeight: 700,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ background: c(design.surface), borderRadius: radius, padding: "1.8cqw", width: "100%", flex: 1 }}>
                  <div style={{ fontSize: "2.1cqw", fontWeight: 700, textAlign: "center", marginBottom: "1cqw" }}>{s.title}</div>
                  <div style={{ fontSize: "1.8cqw", color: muted, lineHeight: 1.4 }}>{s.description}</div>
                </div>
              </div>
            ))}
          </div>
        </Frame>
      );

    case "stats":
      return (
        <Frame>
          <Title />
          <div style={{ ...body, display: "flex", alignItems: "center", justifyContent: "space-around", gap: "2cqw" }}>
            {(slide.stats ?? []).map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: `"${design.fontHeading}", sans-serif`, fontSize: "6.4cqw", fontWeight: 700, color: design.accent[i % Math.max(design.accent.length, 1)] ? c(design.accent[i % design.accent.length]) : c(design.primary) }}>
                  {s.value}
                </div>
                <div style={{ marginTop: "0.8cqw", fontSize: "2cqw", color: muted }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Frame>
      );

    case "table":
      return (
        <Frame>
          <Title />
          <div style={{ ...body, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "1.9cqw" }}>
              <thead>
                <tr>
                  {(slide.table?.headers ?? []).map((h, i) => (
                    <th key={i} style={{ background: c(design.primary), color: c(design.background), padding: "1.2cqw", textAlign: "left", fontWeight: 700 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(slide.table?.rows ?? []).map((row, i) => (
                  <tr key={i} style={{ background: i % 2 ? c(design.surface) : "transparent" }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: "1.1cqw", color: muted }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Frame>
      );

    case "quote":
      return (
        <Frame>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: "7cqw", color: accent, lineHeight: 1, fontFamily: "Georgia, serif" }}>&ldquo;</div>
            <div style={{ fontFamily: `"${design.fontHeading}", sans-serif`, fontSize: "3.2cqw", fontWeight: 700, lineHeight: 1.4 }}>{slide.quote}</div>
            {slide.quoteAttribution && <div style={{ marginTop: "2cqw", fontSize: "2cqw", color: muted }}>— {slide.quoteAttribution}</div>}
          </div>
        </Frame>
      );

    case "timeline":
      return (
        <Frame>
          <Title />
          <div style={{ ...body, display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
            {(slide.milestones ?? []).slice(0, 8).map((m, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "14% 3% 1fr", alignItems: "center", gap: "1cqw" }}>
                <div style={{ textAlign: "right", fontWeight: 700, fontSize: "2.1cqw", color: design.accent[i % Math.max(design.accent.length, 1)] ? c(design.accent[i % design.accent.length]) : c(design.primary) }}>
                  {m.when}
                </div>
                <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
                  <div style={{ position: "absolute", top: "-100%", bottom: "-100%", width: "1px", background: muted, opacity: 0.4 }} />
                  <div style={{ width: "1.3cqw", height: "1.3cqw", borderRadius: "50%", background: c(design.primary), position: "relative" }} />
                </div>
                <div style={{ fontSize: "2.1cqw" }}>{m.what}</div>
              </div>
            ))}
          </div>
        </Frame>
      );

    case "cards":
      return (
        <Frame>
          <Title />
          <div
            style={{
              ...body,
              display: "grid",
              gridTemplateColumns: `repeat(${(slide.cards ?? []).length || 1}, 1fr)`,
              gap: "1.8cqw",
              // Cards hug their content and sit centered, matching cards.ts.
              alignContent: "center",
              alignItems: "start",
            }}
          >
            {(slide.cards ?? []).map((card, i) => (
              <div key={i} style={{ background: c(design.surface), borderRadius: radius, padding: "2.2cqw" }}>
                <div style={{ width: "3cqw", height: "0.4cqw", background: design.accent[i % Math.max(design.accent.length, 1)] ? c(design.accent[i % design.accent.length]) : c(design.primary), marginBottom: "1.4cqw" }} />
                <div style={{ fontSize: "2.4cqw", fontWeight: 700, marginBottom: "1cqw" }}>{card.title}</div>
                <div style={{ fontSize: "1.9cqw", color: muted, lineHeight: 1.45 }}>{card.description}</div>
              </div>
            ))}
          </div>
        </Frame>
      );

    case "profile":
      return (
        <Frame>
          <Title />
          <div style={{ ...body, display: "flex", alignItems: "center", gap: "4cqw" }}>
            <div
              style={{
                flex: "0 0 auto",
                width: "14cqw",
                height: "14cqw",
                borderRadius: "50%",
                background: c(design.primary),
                color: c(design.background),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "7cqw",
                fontWeight: 700,
                fontFamily: `"${design.fontHeading}", sans-serif`,
              }}
            >
              {(slide.profile?.name ?? "?").trim().charAt(0)}
            </div>
            <div>
              <div style={{ fontFamily: `"${design.fontHeading}", sans-serif`, fontSize: "4cqw", fontWeight: 700 }}>{slide.profile?.name}</div>
              <div style={{ fontSize: "2.2cqw", color: c(design.primary), marginTop: "0.5cqw" }}>{slide.profile?.role}</div>
              <div style={{ width: "4cqw", height: "0.35cqw", background: accent, margin: "1.4cqw 0" }} />
              <div style={{ fontSize: "2cqw", color: muted, lineHeight: 1.5 }}>{slide.profile?.detail}</div>
            </div>
          </div>
        </Frame>
      );

    case "visual": {
      const imageFirst = slide.imagePosition === "left";
      return (
        <Frame>
          <Title />
          <div style={{ ...body, display: "flex", flexDirection: imageFirst ? "row" : "row-reverse", gap: "3cqw", alignItems: "stretch" }}>
            <div style={{ flex: "1 1 52%", overflow: "hidden", background: c(design.surface) }}>
              {slide.imageUrl ? <img src={slide.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
            </div>
            <div style={{ flex: "1 1 42%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {(slide.bullets ?? []).map((item, i) => <div key={i} style={{ fontSize: "2.25cqw", lineHeight: 1.4, marginBottom: "1.4cqw" }}>▪ {item}</div>)}
              {slide.imageCaption && <div style={{ fontSize: "1.2cqw", color: muted }}>{slide.imageCaption}</div>}
            </div>
          </div>
        </Frame>
      );
    }

    case "chart": {
      const data = slide.chartData ?? [];
      const max = Math.max(1, ...data.map((d) => d.value));
      return (
        <Frame>
          <Title />
          <div style={{ ...body, display: "flex", gap: "3cqw" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "1.5cqw", padding: "2cqw 1cqw" }}>
              {data.map((d, i) => <div key={i} style={{ flex: 1, textAlign: "center" }}><div style={{ fontSize: "1.5cqw", fontWeight: 700 }}>{d.value}</div><div style={{ height: `${Math.max(8, d.value / max * 24)}cqw`, background: i ? accent : c(design.primary), margin: ".5cqw 0" }} /><div style={{ fontSize: "1.2cqw", color: muted }}>{d.label}</div></div>)}
            </div>
            <div style={{ width: "24cqw", background: c(design.surface), padding: "3cqw", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: "1.1cqw", color: c(design.primary), fontWeight: 700, letterSpacing: ".15em" }}>READ THIS</div>
              <div style={{ fontSize: "2.5cqw", fontWeight: 700, lineHeight: 1.35, marginTop: "1.5cqw" }}>{slide.chartInsight}</div>
            </div>
          </div>
        </Frame>
      );
    }

    default:
      return (
        <Frame>
          <Title />
        </Frame>
      );
  }
}
