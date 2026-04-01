import { useState, useRef } from "react";

const steps = ["페르소나 최초 생성", "실사화 및 디테일 고도화", "스타일 & 포즈 베리에이션"];

const options = {
  국가: ["korean", "korean-american", "japanese", "chinese", "taiwanese", "thai", "east asian", "north american"],
  나이대: ["early 20s", "mid 20s", "late 20s", "early 30s", "mid 30s", "late 30s", "early 40s", "mid 40s", "50s"],
  성별: ["woman", "man"],
  헤어: ["long straight hair", "long wavy hair", "long hair with curtain bangs", "shoulder-length straight hair", "medium-length wavy hair", "medium layered haircut", "side-parted medium hair", "short bob cut", "short wavy bob", "pixie cut", "ponytail", "loose bun", "half-up half-down"],
  피부톤: ["light skin tone", "medium skin tone", "warm skin tone", "fair skin tone"],
  표정_기본: ["minimal expression", "soft natural smile"],
  비율: ["--ar 9:16", "--ar 4:5", "--ar 1:1", "--ar 3:4", "--ar 16:9"],
  스타일라이즈: ["--s 50", "--s 75", "--s 100", "--s 150"],
};

const stylizeInfo = [
  { val: "--s 50", label: "50 — 사실적", desc: "AI 개입 최소화. 가장 자연스럽고 사실적인 결과. 브랜드 인물 사진 기본값." },
  { val: "--s 75", label: "75 — 약간 정제", desc: "사실감 유지하면서 약간의 미화 적용. 균형감 있는 결과." },
  { val: "--s 100", label: "100 — 기본값", desc: "Midjourney 기본 스타일라이즈. 약간 이상화된 결과물." },
  { val: "--s 150", label: "150 — 강한 스타일", desc: "AI가 적극적으로 미화·스타일링. 사실감보다 감성적 연출이 강해짐." },
];

const visualKeywords = {
  무드: "자연광, 일상적인, 뉴트럴 톤",
  피부: "리얼한 피부 텍스처, 절제된 메이크업, 과하지 않은 글로우",
  표정: "다양한 표정, 자신감 있는 포즈",
};

const STEP3_TEMPLATE = `Based on the uploaded reference image(s) of a subject (person or product),
Person: Maintain the same face and facial features with no identity change.
Expression: [FILL]
Makeup: [FILL]
Hair: [FILL]
Outfit: [FILL]
Pose: [FILL]
Style: [FILL]
Camera: [FILL]
Lighting: [FILL]
Quality: ultra-high detail, natural skin texture, sharp focus, clean edges, realistic color, cinematic depth`;

export default function App() {
  const [step, setStep] = useState(0);
  const [sel, setSel] = useState({
    국가: "korean", 나이대: "mid 20s", 성별: "woman",
    헤어: "long straight hair", 피부톤: "light skin tone",
    표정_기본: "minimal expression",
    비율: "--ar 9:16", 스타일라이즈: "--s 50",
  });
  const [promptEn, setPromptEn] = useState("");
  const [promptKo, setPromptKo] = useState("");
  const [loading, setLoading] = useState(false);
  const [refImage, setRefImage] = useState(null);
  const [refImageBase64, setRefImageBase64] = useState(null);
  const [editNote, setEditNote] = useState("");
  const [editedEn, setEditedEn] = useState("");
  const [editedKo, setEditedKo] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const fileRef = useRef();

  const Sel = ({ k, label }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{label || k}</div>
      <select value={sel[k]} onChange={e => setSel(p => ({ ...p, [k]: e.target.value }))}
        style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13, background: "#fafafa" }}>
        {(options[k] || []).map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const StyleInfo = () => (
    <div style={{ gridColumn: "1/-1", marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>스타일라이즈 (--s) 안내</div>
      <div style={{ borderRadius: 10, border: "1px solid #e0e0e0", overflow: "hidden" }}>
        {stylizeInfo.map((s, i) => (
          <div key={s.val} onClick={() => setSel(p => ({ ...p, 스타일라이즈: s.val }))}
            style={{ padding: "10px 14px", cursor: "pointer", borderBottom: i < stylizeInfo.length - 1 ? "1px solid #f0f0f0" : "none",
              background: sel.스타일라이즈 === s.val ? "#fff8f5" : "#fff",
              borderLeft: sel.스타일라이즈 === s.val ? "3px solid #ff6b35" : "3px solid transparent" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: sel.스타일라이즈 === s.val ? "#ff6b35" : "#333", marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: "#888" }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRefImage(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = () => setRefImageBase64(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  };

  const copy = (text, key) => {
    try {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(key);
        setTimeout(() => setCopied(""), 2000);
      }).catch(() => {
        const el = document.createElement("textarea");
        el.value = text;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        setCopied(key);
        setTimeout(() => setCopied(""), 2000);
      });
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    }
  };

  const parseResponse = (text) => {
    const sep = "---한국어 번역---";
    const idx = text.indexOf(sep);
    if (idx !== -1) return { en: text.slice(0, idx).trim(), ko: text.slice(idx + sep.length).trim() };
    return { en: text.trim(), ko: "" };
  };

  const generatePrompt = async () => {
    setPromptEn(""); setPromptKo(""); setEditedEn(""); setEditedKo("");

    if (step === 1) {
      const p = `Use the uploaded reference image of the same person.
Person: Maintain the same face and facial features. No identity change.
Hair: Maintain the same hair color and hairstyle as the reference.
Camera: Front view, eye-level framing, centered composition, ID photo style.
Pose/Expression: Neutral expression with lips closed, calm and professional demeanor.
Lighting: Even, soft diffused studio lighting with balanced tone, avoid harsh highlights.
Background: Light gray or soft neutral gradient, not pure white, to avoid overexposure and keep natural contrast.
Outfit: Plain white crewneck top.
Style: Professional ID photo with natural skin texture and realistic skin tone, lifelike and true to the reference.
Quality: Ultra-high resolution, ultra-sharp focus, clean edges, controlled contrast, preserve natural skin texture, no skin softening, no retouching.`;
      setPromptEn(p);
      return;
    }

    setLoading(true);

    if (step === 0) {
      const p = `portrait of a ${sel.국가} ${sel.성별} in ${sel.나이대}, ${sel.헤어}, completely bare face with raw natural skin texture showing visible fine pores and vellus hair, ${sel.피부톤}, ${sel.표정_기본}, no makeup, wearing plain white crewneck top, eye-level frontal shot, shoulders-up portrait, upper body facing directly forward, shoulders squared, looking directly into camera, strictly uniform front-facing studio lighting, fully diffused soft light, shadowless illumination, no directional shadows, no side lighting, no backlighting, flat lighting across entire face, clean soft white studio, neutral light gray background, extreme macro photography, Canon EF 100mm f/2.8L Macro IS USM lens, f/5.6 aperture, ultra-high resolution ${sel.비율} ${sel.스타일라이즈} --style raw --chaos 0`;
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000,
            system: "Return the prompt exactly as provided, then add '---한국어 번역---' followed by a Korean translation. No other text.",
            messages: [{ role: "user", content: p }] }),
        });
        const data = await res.json();
        const { en, ko } = parseResponse(data.content?.[0]?.text || p);
        setPromptEn(en); setPromptKo(ko);
      } catch { setPromptEn(p); }
      setLoading(false); return;
    }

    // STEP 3
    const content = refImageBase64
      ? [{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: refImageBase64 } },
         { type: "text", text: `Analyze this reference image and fill in each [FILL] field in the template below based on what you observe. Then output: 1) The completed English prompt, 2) '---한국어 번역---', 3) Korean translation. No other explanation.\n\n${STEP3_TEMPLATE}` }]
      : `Fill in each [FILL] field based on general beauty editorial defaults. Then output: 1) completed English prompt, 2) '---한국어 번역---', 3) Korean translation.\n\n${STEP3_TEMPLATE}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500,
          system: "You are a Midjourney prompt engineer.",
          messages: [{ role: "user", content }] }),
      });
      const data = await res.json();
      const { en, ko } = parseResponse(data.content?.[0]?.text || "");
      setPromptEn(en); setPromptKo(ko);
    } catch { setPromptEn("오류가 발생했습니다."); }
    setLoading(false);
  };

  const editPrompt = async () => {
    if (!promptEn || !editNote) return;
    setEditLoading(true); setEditedEn(""); setEditedKo("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500,
          system: "Modify the given prompt based on the user's instruction. Output: 1) modified English prompt, 2) '---한국어 번역---', 3) Korean translation. No other explanation.",
          messages: [{ role: "user", content: `Original:\n${promptEn}\n\nModification: ${editNote}` }] }),
      });
      const data = await res.json();
      const { en, ko } = parseResponse(data.content?.[0]?.text || "");
      setEditedEn(en); setEditedKo(ko);
    } catch { setEditedEn("오류가 발생했습니다."); }
    setEditLoading(false);
  };

  const PromptBox = ({ en, ko, copyKey, bg = "#f8f8f8", border = "#e0e0e0" }) => (
    <div style={{ marginTop: 16 }}>
      <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: 16, fontSize: 13, lineHeight: 1.7, color: "#333", whiteSpace: "pre-wrap" }}>{en}</div>
      <button onClick={() => copy(en, copyKey)}
        style={{ marginTop: 8, padding: "6px 14px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#fff", cursor: "pointer", fontSize: 12, color: copied === copyKey ? "#22c55e" : "#555" }}>
        {copied === copyKey ? "복사됨 ✓" : "영문 복사"}
      </button>
      {ko && <>
        <div style={{ fontSize: 12, color: "#888", margin: "12px 0 6px", fontWeight: 600 }}>한국어 번역</div>
        <div style={{ background: "#f5f5f5", border: "1px solid #e8e8e8", borderRadius: 10, padding: 16, fontSize: 13, lineHeight: 1.7, color: "#555", whiteSpace: "pre-wrap" }}>{ko}</div>
        <button onClick={() => copy(ko, copyKey + "_ko")}
          style={{ marginTop: 8, padding: "6px 14px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#fff", cursor: "pointer", fontSize: 12, color: copied === copyKey + "_ko" ? "#22c55e" : "#555" }}>
          {copied === copyKey + "_ko" ? "복사됨 ✓" : "한국어 복사"}
        </button>
      </>}
    </div>
  );

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 680, margin: "0 auto", padding: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px" }}>AI 이미지 프롬프트 생성기</h2>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {steps.map((s, i) => (
          <button key={i} onClick={() => { setStep(i); setPromptEn(""); setPromptKo(""); setEditedEn(""); setEditedKo(""); setRefImage(null); setRefImageBase64(null); }}
            style={{ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: step === i ? "#ff6b35" : "#f0f0f0", color: step === i ? "#fff" : "#555" }}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ background: "#fff8f5", border: "1px solid #ffe0d0", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#ff6b35", marginBottom: 8 }}>공통 키워드 (자동 적용)</div>
        {Object.entries(visualKeywords).map(([k, v]) => (
          <div key={k} style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: "#333" }}>{k}</span> : {v}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        {step === 0 && <>
          <Sel k="국가" /><Sel k="나이대" />
          <Sel k="성별" /><Sel k="헤어" />
          <Sel k="피부톤" /><Sel k="표정_기본" label="표정" />
          <Sel k="비율" />
          <div style={{ gridColumn: "1/-1" }}><StyleInfo /></div>
        </>}

        {step === 1 && <>
          <div style={{ gridColumn: "1/-1", fontSize: 12, color: "#888", padding: "8px 12px", background: "#fff8f5", borderRadius: 8, border: "1px solid #ffe0d0" }}>
            힉스필드용 프롬프트입니다. 모든 값이 고정 적용됩니다.
          </div>
        </>}

        {step === 2 && <>
          <div style={{ gridColumn: "1/-1", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#333", marginBottom: 8 }}>레퍼런스 이미지 업로드</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 10, lineHeight: 1.6 }}>
              스타일·포즈·조명·구도 레퍼런스 이미지를 업로드하면 해당 시각 요소를 분석해 프롬프트를 자동 생성합니다. 인물의 얼굴 정체성은 유지됩니다.
            </div>
            <input type="file" accept="image/*" ref={fileRef} onChange={handleImageUpload} style={{ display: "none" }} />
            <button onClick={() => fileRef.current.click()}
              style={{ padding: "8px 16px", borderRadius: 8, border: "1px dashed #ccc", background: "#fafafa", cursor: "pointer", fontSize: 13, color: "#555" }}>
              + 이미지 업로드
            </button>
            {refImage && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                <img src={refImage} alt="ref" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #e0e0e0" }} />
                <button onClick={() => { setRefImage(null); setRefImageBase64(null); }}
                  style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e0e0e0", background: "#fff", cursor: "pointer", fontSize: 12, color: "#888" }}>
                  제거
                </button>
              </div>
            )}
          </div>
        </>}
      </div>

      <button onClick={generatePrompt} disabled={loading}
        style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer",
          background: loading ? "#ccc" : "#ff6b35", color: "#fff", fontSize: 14, fontWeight: 700, marginTop: 8 }}>
        {loading ? "생성 중..." : "프롬프트 생성"}
      </button>

      {promptEn && <>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginTop: 20, marginBottom: 4 }}>생성된 프롬프트</div>
        <PromptBox en={promptEn} ko={promptKo} copyKey="main" />

        {step === 2 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#333", marginBottom: 8 }}>프롬프트 수정 요청</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8, lineHeight: 1.6 }}>
              예: "조명을 더 부드럽게", "카메라 각도를 측면으로", "의상을 블랙으로 변경"
            </div>
            <textarea value={editNote} onChange={e => setEditNote(e.target.value)}
              placeholder="수정 요청 내용을 입력하세요..."
              style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13,
                minHeight: 72, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
            <button onClick={editPrompt} disabled={editLoading || !editNote}
              style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", marginTop: 8,
                cursor: editLoading || !editNote ? "not-allowed" : "pointer",
                background: editLoading || !editNote ? "#ccc" : "#333", color: "#fff", fontSize: 13, fontWeight: 600 }}>
              {editLoading ? "수정 중..." : "수정 적용"}
            </button>
            {editedEn && <>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginTop: 16, marginBottom: 4 }}>수정된 프롬프트</div>
              <PromptBox en={editedEn} ko={editedKo} copyKey="edited" bg="#f0fff4" border="#86efac" />
            </>}
          </div>
        )}
      </>}
    </div>
  );
}
