/* Author portraits: real photographs (author.photo in data.js, hosted on
   Wikimedia Commons) with a generated SVG as fallback — used for authors
   without a photo and automatically when a photo fails to load (see the
   error handler in app.js), so the site keeps working offline.

    To use a different photograph, change `photo: "https://..."` in the author
    object in data.js (author.photo or author.portrait.photo both work) — app.js prefers
    it over the generated portrait. */

const SKIN = {
  "Steve Jobs": "#D9A87E",
  "Marcus Aurelius": "#E7C6A5",
  "Laozi": "#DDB08A",
  "Virgil": "#E7C6A5",
  "Francis Bacon": "#EFD2B7",
  "Martin Luther King Jr.": "#8B5A3B",
  "Theodore Roosevelt": "#EBCAA9",
  "Nelson Mandela": "#7E4E31",
  "Henry Ford": "#EBCAA9",
  "Oscar Wilde": "#F0D5BC",
  "Confucius": "#DDB08A",
  "Jalal al-Din Rumi": "#D3A277",
  "Antoine de Saint-Exupéry": "#EBCAA9",
  "Russian proverb": "#E7C1A0"
};

const GREY = "#C6C7C9";

function ink(palette) { return palette[0]; }
function mid(palette) { return palette[1]; }
function paper(palette) { return palette[2]; }

/* --- hair, facial hair, eyewear, headwear ------------------------------- */

function hairBack(p, style) {
  const c = ink(p);
  if (style === "long") {
    return `<path d="M66 118 Q60 46 120 44 Q180 46 174 118 L174 214 Q152 196 120 196 Q88 196 66 214 Z" fill="${c}"/>`;
  }
  if (style === "bald") return "";
  return `<ellipse cx="120" cy="108" rx="50" ry="52" fill="${c}"/>`;
}

function beardShape(p, style) {
  if (style === "none") return "";
  const c = style === "grey" ? GREY : ink(p);
  if (style === "full") {
    return `<path d="M74 116 Q74 190 120 198 Q166 190 166 116 Q150 148 120 150 Q90 148 74 116 Z" fill="${c}"/>`;
  }
  if (style === "long") {
    return `<path d="M74 116 Q74 186 120 194 Q166 186 166 116 Q150 146 120 148 Q90 146 74 116 Z" fill="${c}"/>
            <path d="M92 168 Q92 232 120 244 Q148 232 148 168 Q134 190 120 190 Q106 190 92 168 Z" fill="${c}"/>`;
  }
  if (style === "goatee") {
    return `<path d="M106 158 Q120 172 134 158 Q136 186 120 192 Q104 186 106 158 Z" fill="${c}"/>
            <path d="M104 150 Q120 144 136 150 Q128 158 120 154 Q112 158 104 150 Z" fill="${c}"/>`;
  }
  if (style === "mustache") {
    return `<path d="M98 148 Q120 140 142 148 Q130 162 120 154 Q110 162 98 148 Z" fill="${c}"/>`;
  }
  return "";
}

function eyes(p, style) {
  const c = ink(p);
  const brow = `<path d="M92 108 Q101 103 110 108 M130 108 Q139 103 148 108" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  if (style === "closed") return brow;
  return `${brow}<circle cx="101" cy="120" r="3.6" fill="${c}"/><circle cx="139" cy="120" r="3.6" fill="${c}"/>`;
}

function glassesShape(p, style) {
  const c = ink(p);
  if (style === "round") {
    return `<g stroke="${c}" stroke-width="3" fill="rgba(255,255,255,.18)">
      <circle cx="101" cy="120" r="16"/><circle cx="139" cy="120" r="16"/>
      <path d="M117 120 h6 M85 118 l-9 -3 M155 118 l9 -3" fill="none" stroke-linecap="round"/></g>`;
  }
  if (style === "pince") {
    return `<g stroke="${c}" stroke-width="2.6" fill="rgba(255,255,255,.16)">
      <circle cx="102" cy="121" r="12"/><circle cx="138" cy="121" r="12"/>
      <path d="M114 121 h-4 M126 121 h4" fill="none"/></g>`;
  }
  return "";
}

function leaves(p, cx, cy, r) {
  let out = "";
  const c = mid(p);
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI * (0.08 + (i / 8) * 0.84);
    const x = cx - r * Math.cos(a);
    const y = cy - r * Math.sin(a) * 0.62;
    out += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="8" ry="3.4" fill="${c}" transform="rotate(${(-a * 180 / Math.PI + 90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }
  return out;
}

function headwear(p, style) {
  const c = ink(p);
  const m = mid(p);
  switch (style) {
    case "laurel":
      // wreath sits on the hairline; the hair itself is already painted behind the face
      return `<path d="M76 92 Q120 70 164 92 Q120 84 76 92 Z" fill="${c}"/>` +
        leaves(p, 120, 128, 58) +
        `<path d="M62 126 Q58 100 72 84" stroke="${m}" stroke-width="3" fill="none"/>`;
    case "topknot":
      return `<circle cx="120" cy="52" r="15" fill="${c}"/>
              <rect x="104" y="64" width="32" height="9" rx="4.5" fill="${c}" stroke="${m}" stroke-width="2"/>`;
    case "scholar":
      return `<path d="M84 78 Q120 50 156 78 L156 90 Q120 66 84 90 Z" fill="${c}" stroke="${m}" stroke-width="2"/>
              <rect x="112" y="44" width="16" height="22" rx="3" fill="${c}"/>
              <path d="M120 44 v-12" stroke="${m}" stroke-width="3"/>`;
    case "dervish":
      return `<path d="M90 78 L96 22 Q120 12 144 22 L150 78 Q120 66 90 78 Z" fill="${m}" stroke="${c}" stroke-width="3"/>
              <ellipse cx="120" cy="80" rx="34" ry="10" fill="${c}"/>`;
    case "aviator":
      return `<path d="M72 120 Q70 58 120 56 Q170 58 168 120 L168 100 Q168 72 120 72 Q72 72 72 100 Z" fill="${c}"/>
              <path d="M74 96 Q120 76 166 96 L166 108 Q120 90 74 108 Z" fill="${m}"/>
              <circle cx="99" cy="101" r="11" fill="${m}" stroke="${c}" stroke-width="3"/>
              <circle cx="141" cy="101" r="11" fill="${m}" stroke="${c}" stroke-width="3"/>`;
    case "flat":
      return `<path d="M68 96 Q74 58 122 60 Q170 62 176 94 Q120 82 68 96 Z" fill="${c}"/>
              <path d="M168 94 Q186 96 190 106 Q172 106 164 100 Z" fill="${c}"/>
              <path d="M70 94 Q120 80 174 94" stroke="${m}" stroke-width="2.5" fill="none"/>`;
    case "cap":
      return `<path d="M72 92 Q76 56 120 56 Q164 56 168 92 Q120 80 72 92 Z" fill="${c}"/>`;
    case "scarf":
      return `<path d="M70 128 Q66 56 120 54 Q174 56 170 128 Q150 104 120 104 Q90 104 70 128 Z" fill="${c}"/>
              <path d="M70 122 Q120 96 170 122" stroke="${m}" stroke-width="3" fill="none"/>
              <path d="M150 130 Q176 150 172 186 Q156 166 142 152 Z" fill="${c}"/>`;
    default:
      return "";
  }
}

/* --- clothing ----------------------------------------------------------- */

function clothing(p, style) {
  const c = ink(p);
  const m = mid(p);
  const light = paper(p);
  const torso = `<path d="M4 300 C4 240 44 208 120 208 C196 208 236 240 236 300 Z" fill="${c}"/>`;

  switch (style) {
    case "turtleneck":
      return torso + `<rect x="98" y="164" width="44" height="46" rx="12" fill="${c}" stroke="${m}" stroke-width="2.5"/>`;
    case "suit":
      return torso +
        `<path d="M120 208 L96 214 L110 300 L130 300 L144 214 Z" fill="${light}"/>
         <path d="M120 208 L96 214 L104 252 Z" fill="${m}" opacity=".55"/>
         <path d="M120 208 L144 214 L136 252 Z" fill="${m}" opacity=".55"/>
         <path d="M120 220 L112 232 L120 288 L128 232 Z" fill="${m}"/>`;
    case "toga":
      return torso +
        `<path d="M4 300 C4 250 40 214 96 210 Q126 240 92 300 Z" fill="${m}" opacity=".65"/>
         <path d="M150 214 Q188 244 176 300" stroke="${m}" stroke-width="4" fill="none" opacity=".7"/>
         <path d="M120 210 Q148 226 172 216" stroke="${light}" stroke-width="3" fill="none"/>`;
    case "robe":
      return torso +
        `<path d="M66 300 L120 212 L174 300 L150 300 L120 246 L90 300 Z" fill="${m}"/>
         <path d="M120 212 L120 246" stroke="${light}" stroke-width="2"/>`;
    case "ruff":
      return torso +
        `<ellipse cx="120" cy="198" rx="46" ry="15" fill="${light}" stroke="${c}" stroke-width="3"/>` +
        Array.from({ length: 9 }, (_, i) => {
          const x = 80 + i * 10;
          return `<path d="M${x} 190 l4 16" stroke="${c}" stroke-width="2" opacity=".5"/>`;
        }).join("");
    case "workshop":
      return torso +
        `<path d="M84 214 L96 300 L110 300 L98 212 Z" fill="${m}"/>
         <path d="M156 214 L144 300 L130 300 L142 212 Z" fill="${m}"/>
         <rect x="98" y="252" width="44" height="40" rx="4" fill="${m}"/>
         <rect x="106" y="262" width="28" height="6" rx="3" fill="${c}" opacity=".55"/>`;
    case "aesthetic":
      return torso +
        `<path d="M96 210 L120 232 L144 210 L146 236 L120 258 L94 236 Z" fill="${light}"/>
         <rect x="112" y="222" width="16" height="10" rx="3" fill="${m}"/>
         <path d="M120 232 L114 300 L126 300 Z" fill="${m}"/>`;
    case "flight":
      return torso +
        `<path d="M74 214 Q120 200 166 214 L172 246 Q120 228 68 246 Z" fill="${m}" opacity=".8"/>
         <path d="M120 226 L100 250 L120 300 L140 250 Z" fill="${light}" opacity=".85"/>
         <circle cx="120" cy="238" r="7" fill="${c}"/>`;
    case "folk":
      return torso +
        `<path d="M66 300 L120 214 L174 300 Z" fill="${light}" opacity=".9"/>` +
        Array.from({ length: 4 }, (_, r) =>
          Array.from({ length: 3 }, (_, i) => {
            const x = 96 + i * 24, y = 240 + r * 16;
            return `<path d="M${x - 5} ${y} h10 M${x} ${y - 5} v10" stroke="${c}" stroke-width="2.5"/>`;
          }).join("")
        ).join("") +
        `<path d="M92 214 Q120 236 148 214" stroke="${m}" stroke-width="4" fill="none"/>`;
    default:
      return torso;
  }
}

function monogram(p, initials) {
  const c = ink(p);
  return `<g opacity=".7">
    <text x="18" y="38" font-family="Georgia, 'Times New Roman', serif" font-size="21" letter-spacing="1" fill="${c}">${initials}</text>
    <path d="M18 48 h30" stroke="${c}" stroke-width="1.4"/>
  </g>`;
}

/* --- assembly ----------------------------------------------------------- */

function portraitSVG(author) {
  const opts = author.portrait || {};
  const p = opts.palette || ["#333333", "#8a8a8a", "#efefef"];
  const skin = opts.skin || SKIN[author.name] || "#E7C6A5";
  const hairStyle = opts.beard === "long" ? "long" : opts.hair || "short";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="300" viewBox="0 0 240 300" role="img" aria-label="${author.ru}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${paper(p)}"/>
      <stop offset="1" stop-color="${mid(p)}" stop-opacity=".35"/>
    </linearGradient>
    <clipPath id="frame"><rect x="0" y="0" width="240" height="300" rx="6"/></clipPath>
  </defs>
  <g clip-path="url(#frame)">
    <rect width="240" height="300" fill="url(#bg)"/>
    <circle cx="120" cy="126" r="96" fill="${mid(p)}" opacity=".3"/>
    <path d="M0 300 L240 120 L240 300 Z" fill="${ink(p)}" opacity=".06"/>
    <rect x="106" y="150" width="28" height="66" fill="${skin}"/>
    ${clothing(p, opts.collar)}
    ${hairBack(p, hairStyle)}
    <ellipse cx="120" cy="120" rx="45" ry="54" fill="${skin}"/>
    <ellipse cx="76" cy="124" rx="7" ry="11" fill="${skin}"/>
    <ellipse cx="164" cy="124" rx="7" ry="11" fill="${skin}"/>
    ${beardShape(p, opts.beard)}
    ${eyes(p, opts.hat === "dervish" ? "closed" : "open")}
    ${glassesShape(p, opts.glasses)}
    ${headwear(p, opts.hat)}
    ${monogram(p, opts.initials || "")}
  </g>
</svg>`;
}

function portraitSrc(author) {
  const photo = author.photo || (author.portrait && author.portrait.photo);
  if (photo) return photo;
  return svgPortraitSrc(author);
}

function svgPortraitSrc(author) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(portraitSVG(author));
}
