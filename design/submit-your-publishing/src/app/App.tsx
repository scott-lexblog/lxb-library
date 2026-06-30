import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MARKERS } from "./markers";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function css(s: string): React.CSSProperties {
  if (!s) return {};
  const o: Record<string, string> = {};
  s.split(";").forEach((part) => {
    const idx = part.indexOf(":");
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (!k) return;
    const key = k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    o[key] = v;
  });
  return o as React.CSSProperties;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(n || 0);
}

// ---------------------------------------------------------------------------
// data
// ---------------------------------------------------------------------------

const ABOUT_SECTIONS = [
  {
    num: "1.",
    title: "Why the Library Exists",
    paras: [
      "Legal professionals have been publishing insight and commentary online for more than twenty years. Much of it is not being kept. When authors leave firms, websites are rebuilt, publishing is purged for SEO reasons, or URLs change, that expertise is often lost with it.",
      "Traditional legal publishing is preserved and cited. The working insight of legal professionals, commentary explaining how the law actually operates, often is not. Every major category of legal knowledge has citation infrastructure except practitioner commentary.",
      "AI systems will increasingly interpret primary law. Without the insight and commentary of legal professionals, that interpretation risks lacking the practical authority and context through which the law actually operates.",
    ],
  },
  {
    num: "2.",
    title: "What the Library Does",
    paras: [
      "The Library at LexBlog preserves and structures legal professional publishing as citable secondary law. Using AI-assisted tools, we help capture, organize, and structure legal professional publishing for legal research and citation.",
      "Publishing may come from LexBlog-hosted publications or from elsewhere on the web, with attribution and links back to the original source.",
    ],
  },
  {
    num: "3.",
    title: "Author Records",
    paras: [
      "The Library organizes publishing around verified Author Records designed to connect legal professionals with their complete body of published work.",
      "Each Author Record is modeled after the Library of Congress Name Authority Record and contains ten fields: photo, authorized name, firm or organization, practice areas, jurisdictions, law school, bar admissions, professional bio, Author Record ID, and a structured link to the author’s complete body of published work in the Library.",
      "The Author Record and accompanying publishing are designed to provide durable attribution, professional context, and durable signals of authority for legal professionals, researchers, legal research platforms, and eventually AI systems.",
    ],
  },
  {
    num: "4.",
    title: "Research Platform Partners",
    paras: [
      "Legal professional-authored publishing in the Library is being structured and delivered for retrieval, discovery, and citation across leading legal research platforms.",
      "Early publishing and research partners receiving Library feeds include HeinOnline and Clio/vLex.",
    ],
  },
  {
    num: "5.",
    title: "Why It Matters",
    paras: [
      "The law does not live only in cases and statutes. It also lives in the daily insight, analysis, explanation, and experience shared by legal professionals. The bankruptcy lawyer writing about the realities of her district. The employment lawyer explaining changes in state law as they happen. The trial lawyer documenting practical strategy developed over decades.",
      "Too often, that work disappears.",
      "The Library at LexBlog exists so legal professional-authored insight becomes part of the enduring legal record, not lost history.",
    ],
  },
  {
    num: "6.",
    title: "Submit Your Publishing",
    cta: true,
    paras: [
      "The Library welcomes blogs, articles, alerts, white papers, publications, and blog feeds from legal professionals and organizations advancing the understanding of the law, whether hosted on LexBlog or elsewhere on the web.",
    ],
  },
];

const FIELD_ROWS = [
  { a: "Photo", b: "Authorized name" },
  { a: "Firm or organization", b: "Practice areas" },
  { a: "Jurisdictions", b: "Law school" },
  { a: "Bar admissions", b: "Professional bio" },
  { a: "Author Record ID", b: "Link to complete body of work" },
];

// ---------------------------------------------------------------------------
// ContributorMap
// ---------------------------------------------------------------------------

type Marker = (typeof MARKERS)[number];

function ContributorMap() {
  const rootRef = useRef<HTMLDivElement>(null);
  const ptRef = useRef<HTMLElement>(null);
  const psRef = useRef<HTMLElement>(null);
  const pbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mapEl = root.querySelector<HTMLElement>(".cm-map");
    if (!mapEl) return;

    const map = L.map(mapEl, {
      center: [18, 0],
      zoom: 1,
      minZoom: 1,
      worldCopyJump: true,
      scrollWheelZoom: true,
      zoomAnimation: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
      { attribution: "&copy; OpenStreetMap &copy; CARTO", subdomains: "abcd", maxZoom: 19 }
    ).addTo(map);

    const maxWorks = Math.max(...MARKERS.map((m) => m.total_works));
    const radius = (works: number) =>
      5 + (Math.log10(works + 10) / Math.log10(maxWorks + 10)) * 20;
    const opacity = (works: number) =>
      Math.max(0.28, Math.min(0.82, 0.26 + (Math.log10(works + 10) / Math.log10(maxWorks + 10)) * 0.56));

    function placeName(m: Marker) {
      return [m.city, m.state, m.country].filter(Boolean).join(", ");
    }

    function renderPanel(m: Marker) {
      const place = placeName(m) || "Contribution place";
      if (ptRef.current) ptRef.current.textContent = place;
      if (psRef.current)
        psRef.current.textContent =
          fmt(m.total_works) +
          " preserved works from " +
          m.contributors +
          " contributor" +
          (m.contributors === 1 ? "" : "s") +
          " represented here.";
      if (pbRef.current) {
        pbRef.current.innerHTML = "";
        const seen = new Set<string>();
        m.items.forEach((item) => {
          if (seen.has(item.organization)) return;
          seen.add(item.organization);
          const d = document.createElement("div");
          d.className = "row";
          const archive = item.archive_url
            ? `<a href="${item.archive_url}" target="_blank" rel="noopener">LexBlog archive</a>`
            : "";
          const domain = item.domain
            ? `<a href="https://${item.domain}" target="_blank" rel="noopener">${item.domain}</a>`
            : "";
          d.innerHTML =
            `<div class="f">${item.organization}</div>` +
            `<div class="m">${fmt(item.works)} works preserved · ${[item.label, domain, archive].filter(Boolean).join(" · ")}</div>`;
          pbRef.current!.appendChild(d);
        });
      }
    }

    MARKERS.forEach((m) => {
      const marker = L.circleMarker([m.lat, m.lng], {
        radius: radius(m.total_works),
        color: "#111",
        weight: 1,
        fillColor: "#111",
        fillOpacity: opacity(m.total_works),
      }).addTo(map);
      const place = placeName(m);
      marker.bindTooltip(place + " · " + fmt(m.total_works) + " works", { direction: "top" });
      marker.bindPopup(
        "<strong>" +
          place +
          "</strong><br>" +
          fmt(m.total_works) +
          " works represented<br>" +
          m.contributors +
          " contributor" +
          (m.contributors === 1 ? "" : "s") +
          "<br>Top: " +
          (m as any).top_org
      );
      marker.on("click", () => renderPanel(m));
    });

    const t = setTimeout(() => map.invalidateSize(), 60);
    return () => {
      clearTimeout(t);
      map.remove();
    };
  }, []);

  return (
    <div className="cm-root" ref={rootRef}>
      <div className="cm-shell">
        <div className="cm-map" aria-label="Contribution map" />
        <div className="cm-metrics" aria-label="Map metrics">
          <div className="metric">
            <b>237</b>
            <span>Contributors Mapped</span>
          </div>
          <div className="metric">
            <b>471,319</b>
            <span>Works Represented</span>
          </div>
          <div className="metric">
            <b>396</b>
            <span>Contribution Places</span>
          </div>
          <div className="metric">
            <b>35</b>
            <span>Countries</span>
          </div>
        </div>
        <aside className="cm-panel" aria-label="Contributor details">
          <div className="ph">
            <h2 className="cm-pt" ref={ptRef as React.RefObject<HTMLHeadingElement>}>
              Contribution Map
            </h2>
            <div className="s cm-ps" ref={psRef as React.RefObject<HTMLDivElement>}>
              Circle size reflects preserved works from matched contributors, not office density.
            </div>
          </div>
          <div className="pb cm-pb" ref={pbRef}>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header({ view, go }: { view: string; go: (v: string) => void }) {
  const navBase =
    "color:rgba(255,255,255,0.82);text-decoration:none;font-size:15px;font-weight:500;cursor:pointer;";
  const navActive =
    "color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-bottom:2px solid #ffffff;padding-bottom:3px;cursor:pointer;";
  const aboutNavStyle = view === "about" ? navActive : navBase;
  const submitNavStyle =
    view === "submit" || view === "submitted" ? navActive : navBase;
  const authorNavStyle = view === "authorrecord" ? navActive : navBase;

  return (
    <header style={css("background:#0a0a0b;color:#ffffff;width:100%;")}>
      <div
        style={css(
          "max-width:1240px;margin:0 auto;padding:0 32px;height:74px;display:flex;align-items:center;gap:32px;"
        )}
      >
        <a
          onClick={() => go("library")}
          style={css(
            "display:flex;align-items:baseline;gap:11px;text-decoration:none;white-space:nowrap;cursor:pointer;"
          )}
        >
          <span
            style={css(
              "font-weight:800;font-size:27px;letter-spacing:-0.025em;color:#ffffff;line-height:1;"
            )}
          >
            LexBlog
          </span>
          <span
            style={css(
              "font-weight:400;font-size:20px;letter-spacing:-0.005em;color:rgba(255,255,255,0.58);line-height:1;"
            )}
          >
            Library
          </span>
        </a>
        <div
          style={css(
            "display:flex;align-items:center;gap:30px;margin-left:auto;white-space:nowrap;"
          )}
        >
          <a
            onClick={() => go("about")}
            style={css(aboutNavStyle)}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#fff")}
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color =
                view === "about" ? "#fff" : "rgba(255,255,255,0.82)")
            }
          >
            About
          </a>
          <a
            onClick={() => go("submit")}
            style={css(submitNavStyle)}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#fff")}
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color =
                view === "submit" || view === "submitted"
                  ? "#fff"
                  : "rgba(255,255,255,0.82)")
            }
          >
            Submit your publishing
          </a>
          <a
            onClick={() => go("authorrecord")}
            style={css(authorNavStyle)}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#fff")}
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color =
                view === "authorrecord" ? "#fff" : "rgba(255,255,255,0.82)")
            }
          >
            Author Record
          </a>
        </div>
      </div>
      <div style={css("height:1px;background:rgba(255,255,255,0.10);")} />
      <nav
        style={css(
          "max-width:1240px;margin:0 auto;padding:0 32px;height:48px;display:flex;align-items:stretch;gap:34px;"
        )}
      >
        <a
          onClick={() => go("library")}
          style={css(
            "display:flex;align-items:center;text-decoration:none;font-size:14.5px;font-weight:600;letter-spacing:-0.005em;color:#fff;border-bottom:2px solid #ffffff;margin-bottom:-1px;cursor:pointer;"
          )}
        >
          Library
        </a>
        <a
          onClick={() => go("library")}
          style={css(
            "display:flex;align-items:center;text-decoration:none;font-size:14.5px;font-weight:500;letter-spacing:-0.005em;color:rgba(255,255,255,0.72);border-bottom:2px solid transparent;cursor:pointer;"
          )}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#fff")}
          onMouseLeave={(e) =>
            ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.72)")
          }
        >
          Publishing Platform
        </a>
      </nav>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

function LibraryView({ go }: { go: (v: string) => void }) {
  return (
    <main style={css("max-width:1240px;margin:0 auto;padding:24px 32px 80px;")}>
      <div
        style={css(
          "display:flex;align-items:center;gap:9px;font-size:12.5px;color:#8a8d93;margin-bottom:16px;"
        )}
      >
        <a
          onClick={() => go("library")}
          style={css("color:#8a8d93;text-decoration:none;cursor:pointer;")}
        >
          LexBlog
        </a>
        <span style={css("color:#c4c6cb;")}>/</span>
        <span style={css("color:#16181c;font-weight:500;")}>Library</span>
      </div>
      <div
        style={css(
          "display:flex;align-items:flex-end;gap:24px;flex-wrap:wrap;padding-bottom:18px;border-bottom:2px solid #16181c;"
        )}
      >
        <div>
          <h1
            style={css(
              "margin:0;font-size:46px;font-weight:800;letter-spacing:-0.03em;line-height:1;color:#0a0a0b;"
            )}
          >
            Library
          </h1>
          <div
            style={css(
              "margin-top:13px;font-family:'JetBrains Mono',monospace;font-size:12.5px;line-height:1.55;letter-spacing:0.04em;color:#8a8d93;text-transform:uppercase;"
            )}
          >
            Preserving and structuring the insight of legal professionals as citable secondary law
          </div>
        </div>
      </div>
      <div
        style={css(
          "margin-top:34px;border:1px solid #e7e8ea;border-radius:4px;background:#f7f6f2;overflow:hidden;"
        )}
      >
        <ContributorMap />
      </div>
      <div
        style={css(
          "margin-top:13px;font-family:'JetBrains Mono',monospace;font-size:12.5px;line-height:1.55;letter-spacing:0.04em;color:#8a8d93;text-transform:uppercase;"
        )}
      >
        Each dot represents a region where legal professionals are actively publishing preserved works.
      </div>
      <div
        style={css(
          "margin-top:28px;display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#e7e8ea;border:1px solid #e7e8ea;border-radius:4px;overflow:hidden;"
        )}
      >
        <div style={css("background:#fff;padding:22px 24px;")}>
          <div style={css("font-size:34px;font-weight:800;letter-spacing:-0.02em;color:#0a0a0b;line-height:1;")}>237</div>
          <div style={css("margin-top:9px;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.07em;color:#8a8d93;text-transform:uppercase;")}>Contributors Mapped</div>
        </div>
        <div style={css("background:#fff;padding:22px 24px;")}>
          <div style={css("font-size:34px;font-weight:800;letter-spacing:-0.02em;color:#0a0a0b;line-height:1;")}>471,319</div>
          <div style={css("margin-top:9px;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.07em;color:#8a8d93;text-transform:uppercase;")}>Works Represented</div>
        </div>
        <div style={css("background:#fff;padding:22px 24px;")}>
          <div style={css("font-size:34px;font-weight:800;letter-spacing:-0.02em;color:#0a0a0b;line-height:1;")}>396</div>
          <div style={css("margin-top:9px;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.07em;color:#8a8d93;text-transform:uppercase;")}>Contribution Places</div>
        </div>
        <div style={css("background:#fff;padding:22px 24px;")}>
          <div style={css("font-size:34px;font-weight:800;letter-spacing:-0.02em;color:#0a0a0b;line-height:1;")}>35</div>
          <div style={css("margin-top:9px;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.07em;color:#8a8d93;text-transform:uppercase;")}>Countries</div>
        </div>
      </div>
    </main>
  );
}

function AboutView({ go }: { go: (v: string) => void }) {
  return (
    <main style={css("max-width:1240px;margin:0 auto;padding:36px 32px 96px;")}>
      <div
        style={css(
          "display:flex;align-items:center;gap:9px;font-size:12.5px;color:#8a8d93;margin-bottom:30px;"
        )}
      >
        <a
          onClick={() => go("library")}
          style={css("color:#8a8d93;text-decoration:none;cursor:pointer;")}
        >
          LexBlog
        </a>
        <span style={css("color:#c4c6cb;")}>/</span>
        <a
          onClick={() => go("library")}
          style={css("color:#8a8d93;text-decoration:none;cursor:pointer;")}
        >
          Library
        </a>
        <span style={css("color:#c4c6cb;")}>/</span>
        <span style={css("color:#16181c;font-weight:500;")}>About</span>
      </div>
      <div style={css("max-width:860px;")}>
        <h1
          style={css(
            "margin:0;font-size:46px;font-weight:800;letter-spacing:-0.03em;line-height:1.04;color:#0a0a0b;"
          )}
        >
          About The Library at LexBlog
        </h1>
        <div
          style={css(
            "margin-top:26px;display:flex;flex-direction:column;gap:14px;font-size:21px;line-height:1.5;color:#3a3d44;font-weight:400;"
          )}
        >
          <p>
            No one preserves the published insight of legal professionals, nor structures it for
            citation as secondary law.
          </p>
          <p style={css("color:#0a0a0b;font-weight:500;")}>The Library at LexBlog will.</p>
        </div>
      </div>
      <div
        style={css(
          "margin-top:58px;max-width:900px;display:flex;flex-direction:column;gap:52px;"
        )}
      >
        {ABOUT_SECTIONS.map((sec, i) => (
          <section key={i}>
            <h2
              style={css(
                "margin:0 0 20px;font-size:27px;font-weight:700;letter-spacing:-0.02em;color:#0a0a0b;"
              )}
            >
              {sec.num}&nbsp;&nbsp;{sec.title}
            </h2>
            <div
              style={css(
                "display:flex;flex-direction:column;gap:18px;font-size:17.5px;line-height:1.72;color:#33363c;"
              )}
            >
              {sec.paras.map((para, j) => (
                <p key={j}>{para}</p>
              ))}
              {sec.cta && (
                <a
                  onClick={() => go("submit")}
                  style={css(
                    "align-self:flex-start;display:inline-flex;align-items:center;text-decoration:none;background:#0a0a0b;color:#ffffff;font-size:15.5px;font-weight:600;padding:14px 26px;border-radius:4px;cursor:pointer;"
                  )}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "#26282d")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "#0a0a0b")
                  }
                >
                  Submit your publishing here
                </a>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

const CATEGORIES = [
  ["Access to Justice and Legal Aid", "Administrative and Regulatory", "Admiralty and Maritime"],
  ["Antitrust, Competition and Trade", "Appellate and Supreme Court", "Arbitration and ADR"],
  ["Banking, Finance and Securities", "Bankruptcy", "Business and Commercial"],
  ["Business of Law", "Cannabis", "Class Action & Mass Torts"],
  ["Communications, Media & Entertainment", "Corporate Governance and Compliance", "Criminal"],
  ["E-Discovery", "Employment & Labor", "Energy and Utilities"],
  ["Environmental and Climate", "Ethics & Professional Responsibility", "Family"],
  ["Food, Drug & Agriculture", "Government and Public Policy", "Government Contracts"],
  ["Health Care and Life Sciences", "Immigration", "Insurance"],
  ["Intellectual Property", "Nonprofit and Exempt Organizations", "Personal Injury"],
  ["Privacy and Cybersecurity", "Real Estate & Construction", "Sports and Gaming"],
  ["Tax", "Technology and AI", "Trusts, Estates and Elder"],
];

function SubmitView({
  go,
  tab,
  setTab,
}: {
  go: (v: string) => void;
  tab: string;
  setTab: (t: string) => void;
}) {
  const isFeed = tab === "feed";
  const tabBase =
    "background:none;border:none;font-family:'Archivo',sans-serif;font-size:17px;letter-spacing:-0.01em;padding:0 0 16px;margin-bottom:-1px;cursor:pointer;";
  const tabActive = tabBase + "color:#0a0a0b;font-weight:700;border-bottom:2px solid #0a0a0b;";
  const tabIdle = tabBase + "color:#8a8d93;font-weight:500;border-bottom:2px solid transparent;";

  const inputStyle = css(
    "width:100%;height:50px;border:1px solid #d9dbdf;border-radius:5px;background:#fff;font-family:'Archivo',sans-serif;font-size:16px;color:#16181c;padding:0 16px;outline:none;"
  );
  const labelStyle = css("display:block;font-size:14px;font-weight:600;color:#16181c;margin-bottom:9px;");
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = "#0a0a0b");
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = "#d9dbdf");

  return (
    <main style={css("max-width:760px;margin:0 auto;padding:36px 32px 96px;")}>
      <div style={css("display:flex;align-items:center;gap:9px;font-size:12.5px;color:#8a8d93;margin-bottom:30px;")}>
        <a onClick={() => go("library")} style={css("color:#8a8d93;text-decoration:none;cursor:pointer;")}>LexBlog</a>
        <span style={css("color:#c4c6cb;")}>/</span>
        <a onClick={() => go("library")} style={css("color:#8a8d93;text-decoration:none;cursor:pointer;")}>Library</a>
        <span style={css("color:#c4c6cb;")}>/</span>
        <span style={css("color:#16181c;font-weight:500;")}>Submit</span>
      </div>
      <div style={css("display:flex;align-items:center;gap:16px;flex-wrap:wrap;")}>
        <h1 style={css("margin:0;font-size:46px;font-weight:800;letter-spacing:-0.03em;line-height:1;color:#0a0a0b;")}>
          Submit your publishing
        </h1>
        <span style={css("display:inline-flex;align-items:center;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:500;letter-spacing:0.02em;color:#1f8a3b;background:#e8f6ed;border:1px solid #bfe6cc;border-radius:4px;padding:5px 11px;")}>
          Open Access / Free
        </span>
      </div>
      <p style={css("margin-top:22px;font-size:19px;line-height:1.55;color:#3a3d44;")}>
        The Library welcomes blog and website feeds and individual published works, including
        articles, alerts, and white papers, from legal professionals advancing the understanding of
        the law, whether hosted on LexBlog or elsewhere on the web.
      </p>

      {/* Tabs */}
      <div style={css("margin-top:38px;display:flex;gap:30px;border-bottom:1px solid #e7e8ea;")}>
        <button onClick={() => setTab("single")} style={css(isFeed ? tabIdle : tabActive)}>
          A single published work
        </button>
        <button onClick={() => setTab("feed")} style={css(isFeed ? tabActive : tabIdle)}>
          RSS Feed
        </button>
      </div>

      {/* Fields */}
      <div style={css("margin-top:30px;display:flex;flex-direction:column;gap:22px;")}>

        {/* First / Last Name */}
        <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:16px;")}>
          <div>
            <label style={labelStyle}>First Name <span style={css("color:#c0392b;")}>*</span></label>
            <input type="text" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div>
            <label style={labelStyle}>Last Name <span style={css("color:#c0392b;")}>*</span></label>
            <input type="text" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
        </div>

        {/* Email */}
        <div>
          <label style={labelStyle}>Email <span style={css("color:#c0392b;")}>*</span></label>
          <input type="email" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
        </div>

        {/* Firm */}
        <div>
          <label style={labelStyle}>Firm / Company Name <span style={css("color:#c0392b;")}>*</span></label>
          <input type="text" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
        </div>

        {/* Single Post fields */}
        {!isFeed && (
          <>
            <div>
              <label style={labelStyle}>Post Title <span style={css("color:#c0392b;")}>*</span></label>
              <input type="text" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label style={labelStyle}>Post Content <span style={css("color:#c0392b;")}>*</span></label>
              <textarea
                rows={8}
                style={css("width:100%;border:1px solid #d9dbdf;border-radius:5px;background:#fff;font-family:'Archivo',sans-serif;font-size:16px;color:#16181c;padding:14px 16px;outline:none;resize:vertical;")}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
          </>
        )}

        {/* RSS Feed URL */}
        {isFeed && (
          <div>
            <label style={labelStyle}>RSS Feed URL <span style={css("color:#c0392b;")}>*</span></label>
            <input type="url" placeholder="https://..." style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
        )}

        {/* Submission description */}
        <div>
          <label style={labelStyle}>Submission description</label>
          <textarea
            rows={4}
            style={css("width:100%;border:1px solid #d9dbdf;border-radius:5px;background:#fff;font-family:'Archivo',sans-serif;font-size:16px;color:#16181c;padding:14px 16px;outline:none;resize:vertical;")}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>

        {/* Category */}
        <div>
          <label style={css("display:block;font-size:14px;font-weight:600;color:#16181c;margin-bottom:14px;")}>Category</label>
          <div style={css("display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px 16px;")}>
            {CATEGORIES.map((row, i) =>
              row.map((cat, j) => (
                <label
                  key={`${i}-${j}`}
                  style={css("display:flex;align-items:flex-start;gap:8px;font-size:13.5px;color:#33363c;line-height:1.45;cursor:pointer;")}
                >
                  <input
                    type="checkbox"
                    style={css("margin-top:2px;flex:none;accent-color:#0a0a0b;width:14px;height:14px;cursor:pointer;")}
                  />
                  {cat}
                </label>
              ))
            )}
          </div>
        </div>

        {/* Terms of Service */}
        <label style={css("display:flex;align-items:flex-start;gap:10px;font-size:14px;color:#33363c;cursor:pointer;")}>
          <input
            type="checkbox"
            style={css("margin-top:2px;flex:none;accent-color:#0a0a0b;width:14px;height:14px;cursor:pointer;")}
          />
          <span>
            I have read and agree to the LexBlog Syndication{" "}
            <a href="#" style={css("color:#0a5fcf;text-decoration:underline;text-underline-offset:2px;")}>Terms of Service</a>
            {" "}<span style={css("color:#c0392b;")}>*</span>
          </span>
        </label>

        {/* Submit */}
        <div style={css("margin-top:6px;")}>
          <button
            onClick={() => go("submitted")}
            style={css("display:inline-flex;align-items:center;background:#0a0a0b;color:#fff;border:none;font-family:'Archivo',sans-serif;font-size:15.5px;font-weight:600;padding:15px 28px;border-radius:5px;cursor:pointer;")}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#26282d")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#0a0a0b")}
          >
            Submit
          </button>
        </div>
      </div>
    </main>
  );
}

function SubmittedView({ go }: { go: (v: string) => void }) {
  return (
    <main style={css("max-width:760px;margin:0 auto;padding:54px 32px 96px;")}>
      <div style={css("display:flex;align-items:center;gap:18px;")}>
        <span
          style={css(
            "width:46px;height:46px;border-radius:50%;background:#cdeed4;display:flex;align-items:center;justify-content:center;flex:none;"
          )}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1f8a3b"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="4 12 10 18 20 6" />
          </svg>
        </span>
        <h1
          style={css(
            "margin:0;font-size:44px;font-weight:800;letter-spacing:-0.03em;line-height:1;color:#0a0a0b;"
          )}
        >
          Your publishing is in.
        </h1>
      </div>
      <p style={css("margin-top:26px;font-size:20px;line-height:1.55;color:#3a3d44;")}>
        We received your submission and will review it for relevance before adding it to the
        Library. You will hear from us at the email you provided.
      </p>
      <div
        style={css(
          "margin-top:42px;background:#0a0a0b;border-radius:14px;padding:40px 42px 44px;color:#ffffff;"
        )}
      >
        <div style={css("display:flex;align-items:center;gap:16px;flex-wrap:wrap;")}>
          <span
            style={css(
              "font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:500;letter-spacing:0.18em;color:#9a9da3;text-transform:uppercase;"
            )}
          >
            Do more than one piece
          </span>
          <span
            style={css(
              "display:inline-flex;align-items:center;font-size:14.5px;font-weight:600;color:#16181c;background:#d7d8da;border-radius:20px;padding:5px 15px;"
            )}
          >
            $19/month · $199/year
          </span>
        </div>
        <h2
          style={css(
            "margin:22px 0 0;font-size:33px;font-weight:800;letter-spacing:-0.025em;line-height:1.12;color:#ffffff;max-width:560px;"
          )}
        >
          Connect everything you publish, and make it citable.
        </h2>
        <p
          style={css(
            "margin-top:22px;font-size:17.5px;line-height:1.62;color:#b6b8bd;max-width:620px;"
          )}
        >
          You just added one piece. An Author Record ties your full body of work to one verified
          identity, so your publishing establishes your authority across the legal research platforms
          (HeinOnline, vLex/Clio, and others) and LLMs, and all of it becomes citable.
        </p>
        <a
          onClick={() => go("authorrecord")}
          style={css(
            "margin-top:32px;align-self:flex-start;display:inline-flex;align-items:center;text-decoration:none;background:#ffffff;color:#0a0a0b;font-size:16.5px;font-weight:600;padding:17px 30px;border-radius:8px;cursor:pointer;"
          )}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#e8e9ea")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
        >
          Get an Author Record — $19/month
        </a>
      </div>
      <div style={css("margin-top:34px;display:flex;align-items:center;gap:36px;")}>
        <a
          onClick={() => go("submit")}
          style={css(
            "font-size:16px;font-weight:500;color:#16181c;text-decoration:none;cursor:pointer;"
          )}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#8a8d93")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#16181c")}
        >
          Submit another piece
        </a>
        <a
          onClick={() => go("library")}
          style={css(
            "font-size:16px;font-weight:500;color:#16181c;text-decoration:none;cursor:pointer;"
          )}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#8a8d93")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#16181c")}
        >
          Back to the Library
        </a>
      </div>
    </main>
  );
}

function AuthorRecordView({ go }: { go: (v: string) => void }) {
  return (
    <main style={css("max-width:1000px;margin:0 auto;padding:40px 32px 80px;")}>
      <div
        style={css(
          "display:flex;align-items:center;gap:9px;font-size:12.5px;color:#8a8d93;margin-bottom:30px;"
        )}
      >
        <a
          onClick={() => go("library")}
          style={css("color:#8a8d93;text-decoration:none;cursor:pointer;")}
        >
          LexBlog
        </a>
        <span style={css("color:#c4c6cb;")}>/</span>
        <a
          onClick={() => go("library")}
          style={css("color:#8a8d93;text-decoration:none;cursor:pointer;")}
        >
          Library
        </a>
        <span style={css("color:#c4c6cb;")}>/</span>
        <span style={css("color:#16181c;font-weight:500;")}>Author Record</span>
      </div>
      <h1
        style={css(
          "margin:0;font-size:46px;font-weight:800;letter-spacing:-0.03em;line-height:1;color:#0a0a0b;"
        )}
      >
        Get an Author Record
      </h1>
      <p
        style={css(
          "margin-top:26px;font-size:23px;font-weight:600;letter-spacing:-0.01em;color:#0a0a0b;"
        )}
      >
        Your work counts. Make it recognized, and make it last.
      </p>
      <p
        style={css(
          "margin-top:14px;font-size:19px;line-height:1.55;color:#54585f;max-width:760px;"
        )}
      >
        Submitting your work is free. An Author Record is how you support the Library that preserves
        it, and how you secure verified authority over your own body of work.
      </p>
      <div
        style={css(
          "margin-top:36px;background:#0a0a0b;border-radius:16px;padding:40px 44px 38px;"
        )}
      >
        <p
          style={css(
            "font-size:23px;font-weight:600;line-height:1.4;letter-spacing:-0.01em;color:#ffffff;max-width:820px;"
          )}
        >
          With an Author Record, your publishing establishes your authority for the legal research
          platforms (HeinOnline, vLex/Clio, and others) and LLMs, and your publishing becomes
          citable.
        </p>
        <p
          style={css(
            "margin-top:20px;font-size:18px;line-height:1.55;color:#9a9da3;max-width:760px;"
          )}
        >
          These platforms already receive Library publishing, with more partners coming.
        </p>
      </div>
      <div
        style={css(
          "margin-top:48px;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:500;letter-spacing:0.16em;color:#8a8d93;text-transform:uppercase;"
        )}
      >
        Each record contains ten fields
      </div>
      <div
        style={css(
          "margin-top:20px;border:1px solid #e7e8ea;border-radius:8px;overflow:hidden;"
        )}
      >
        {FIELD_ROWS.map((row, i) => (
          <div
            key={i}
            style={css(
              "display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #e7e8ea;"
            )}
          >
            <div
              style={css(
                "padding:21px 26px;font-size:17px;color:#16181c;border-right:1px solid #e7e8ea;"
              )}
            >
              {row.a}
            </div>
            <div style={css("padding:21px 26px;font-size:17px;color:#16181c;")}>{row.b}</div>
          </div>
        ))}
      </div>
      <div style={css("margin-top:42px;display:grid;grid-template-columns:1fr 1fr;gap:22px;")}>
        <div
          style={css(
            "border:1px solid #e2e3e5;background:#fafafb;border-radius:12px;padding:30px 30px 32px;display:flex;flex-direction:column;"
          )}
        >
          <div
            style={css(
              "font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:500;letter-spacing:0.16em;color:#8a8d93;text-transform:uppercase;"
            )}
          >
            Monthly
          </div>
          <div style={css("margin-top:18px;display:flex;align-items:baseline;gap:2px;")}>
            <span
              style={css(
                "font-size:46px;font-weight:800;letter-spacing:-0.03em;color:#0a0a0b;line-height:1;"
              )}
            >
              $19
            </span>
            <span style={css("font-size:18px;color:#8a8d93;")}>/month</span>
          </div>
          <a
            style={css(
              "margin-top:26px;display:flex;align-items:center;justify-content:center;text-decoration:none;border:1px solid #d2d4d8;background:#ffffff;border-radius:8px;height:54px;font-size:16px;font-weight:600;color:#16181c;cursor:pointer;"
            )}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#0a0a0b")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#d2d4d8")}
          >
            Choose monthly
          </a>
        </div>
        <div
          style={css(
            "border:1.5px solid #0a0a0b;background:#ffffff;border-radius:12px;padding:30px 30px 32px;display:flex;flex-direction:column;"
          )}
        >
          <div style={css("display:flex;align-items:center;justify-content:space-between;")}>
            <div
              style={css(
                "font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:500;letter-spacing:0.16em;color:#8a8d93;text-transform:uppercase;"
              )}
            >
              Annual
            </div>
            <span
              style={css(
                "font-size:13px;font-weight:600;color:#ffffff;background:#0a0a0b;border-radius:20px;padding:5px 13px;"
              )}
            >
              Save $29
            </span>
          </div>
          <div style={css("margin-top:18px;display:flex;align-items:baseline;gap:2px;")}>
            <span
              style={css(
                "font-size:46px;font-weight:800;letter-spacing:-0.03em;color:#0a0a0b;line-height:1;"
              )}
            >
              $199
            </span>
            <span style={css("font-size:18px;color:#8a8d93;")}>/year</span>
          </div>
          <a
            style={css(
              "margin-top:26px;display:flex;align-items:center;justify-content:center;text-decoration:none;background:#0a0a0b;border-radius:8px;height:54px;font-size:16px;font-weight:600;color:#ffffff;cursor:pointer;"
            )}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#26282d")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#0a0a0b")}
          >
            Choose annual
          </a>
        </div>
      </div>
      <div style={css("margin-top:40px;padding-top:30px;border-top:1px solid #e7e8ea;")}>
        <p style={css("font-size:16.5px;line-height:1.6;color:#54585f;")}>
          For law firms with multiple authors, please contact the Library at LexBlog at{" "}
          <a
            href="tel:18009130988"
            style={css(
              "color:#16181c;text-decoration:underline;text-underline-offset:3px;"
            )}
          >
            1-800-913-0988
          </a>{" "}
          or{" "}
          <a
            href="mailto:library@lexblog.com"
            style={css(
              "color:#16181c;text-decoration:underline;text-underline-offset:3px;"
            )}
          >
            library@lexblog.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const [view, setView] = useState("library");
  const [tab, setTab] = useState("single");

  function go(v: string) {
    setView(v);
    window.scrollTo(0, 0);
  }

  return (
    <>
      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }
        html, body { background:#ffffff; }
        body { font-family:'Archivo', -apple-system, BlinkMacSystemFont, sans-serif; color:#0a0a0b; -webkit-font-smoothing:antialiased; }
        a { color:inherit; }

        .cm-root { --ink:#111; --muted:#5f5f5f; --rule:#111; --hair:#dedede; height:620px; font-family:"SFMono-Regular",ui-monospace,Menlo,Consolas,monospace; color:var(--ink); }
        .cm-root .cm-shell { width:100%; height:100%; position:relative; display:grid; grid-template-columns:minmax(0,1fr) 240px; }
        .cm-root .cm-map { min-width:0; height:100%; background:#f4f4f1; }
        .cm-root .cm-panel { height:100%; border-left:1px solid var(--rule); background:#fff; display:flex; flex-direction:column; }
        .cm-root .cm-metrics { position:absolute; z-index:500; left:58px; top:14px; display:flex; flex-wrap:wrap; border:1px solid var(--rule); background:rgba(255,255,255,.93); max-width:calc(100% - 324px); }
        .cm-root .metric { padding:8px 10px; border-right:1px solid var(--rule); min-width:86px; }
        .cm-root .metric:last-child { border-right:none; }
        .cm-root .metric b { display:block; font-size:16px; line-height:1; }
        .cm-root .metric span { display:block; margin-top:5px; color:var(--muted); font-size:8.5px; letter-spacing:.1em; text-transform:uppercase; }
        .cm-root .ph { padding:14px 16px 13px; border-bottom:1px solid var(--rule); }
        .cm-root .ph h2 { margin:0; font-size:15px; line-height:1.25; }
        .cm-root .ph .s { margin-top:7px; color:var(--muted); font-size:11px; line-height:1.45; }
        .cm-root .pb { overflow-y:auto; }
        .cm-root .empty, .cm-root .row { padding:11px 16px; border-bottom:1px solid var(--hair); font-size:11.5px; line-height:1.5; }
        .cm-root .empty { color:var(--muted); }
        .cm-root .empty strong { color:var(--ink); }
        .cm-root .row .f { font-weight:700; line-height:1.35; }
        .cm-root .row .m { margin-top:5px; color:var(--muted); font-size:10.5px; }
        .cm-root .row a { color:var(--ink); text-decoration:none; border-bottom:1px solid var(--hair); }
        .cm-root .leaflet-container { font-family:inherit; }
        .cm-root .leaflet-control-attribution { font-size:9px; }
        .cm-root .leaflet-popup-content-wrapper, .cm-root .leaflet-popup-tip { border-radius:0; }
        @media (max-width:760px) {
          .cm-root .cm-shell { grid-template-columns:1fr; grid-template-rows:minmax(0,1fr) 210px; }
          .cm-root .cm-map { height:auto; }
          .cm-root .cm-panel { height:210px; border-left:0; border-top:1px solid var(--rule); }
          .cm-root .cm-metrics { left:58px; max-width:calc(100% - 72px); }
        }
      `}</style>
      <div style={css("min-height:100%;background:#ffffff;")}>
        <Header view={view} go={go} />
        {view === "library" && <LibraryView go={go} />}
        {view === "about" && <AboutView go={go} />}
        {view === "submit" && <SubmitView go={go} tab={tab} setTab={setTab} />}
        {view === "submitted" && <SubmittedView go={go} />}
        {view === "authorrecord" && <AuthorRecordView go={go} />}
      </div>
    </>
  );
}
