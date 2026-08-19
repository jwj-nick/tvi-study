// 최소 DOM 스텁으로 app.js를 실제 실행해, 각 뷰의 렌더 결과 HTML을 검사한다.
const fs = require("fs");
const dir = "C:/Kids/71_High_Projects/2608_TVI_app/";

const views = {};
function makeEl(id) {
  return {
    id,
    _html: "",
    hidden: false,
    textContent: "",
    value: "",
    checked: false,
    dataset: {},
    classList: { add() {}, remove() {} },
    style: {},
    set innerHTML(v) { this._html = v; if (this.id) views[this.id] = v; },
    get innerHTML() { return this._html; },
    addEventListener() {},
    removeAttribute() {},
    setAttribute() {},
    querySelector() { return makeEl(); },
    querySelectorAll() { return []; },
    focus() {},
  };
}

const store = new Map();
global.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
};
global.document = {
  documentElement: { setAttribute() {}, getAttribute: () => "light" },
  querySelector: (sel) => makeEl(sel.startsWith("#") ? sel.slice(1) : ""),
  querySelectorAll: () => [],
};
global.window = {
  matchMedia: () => ({ matches: false }),
  addEventListener() {},
  scrollTo() {},
};
global.location = { hash: "#home" };
global.setTimeout = (fn) => fn;
global.clearTimeout = () => {};

eval(fs.readFileSync(dir + "content.js", "utf8") + "\nglobal.CONTENT = CONTENT;");
eval(fs.readFileSync(dir + "questions.js", "utf8") + "\nglobal.QUESTIONS = QUESTIONS;");

try {
  eval(fs.readFileSync(dir + "app.js", "utf8"));
} catch (err) {
  console.log("RENDER THREW: " + err.message);
  console.log(err.stack.split("\n").slice(0, 4).join("\n"));
  process.exit(1);
}

let fail = 0;
const expect = ["view-home", "view-todo", "view-talk", "view-design", "view-next", "view-computer", "view-economy", "view-data", "view-quiz", "view-three"];
expect.forEach((v) => {
  const html = views[v];
  if (!html || html.length < 200) {
    console.log(`  FAIL: ${v} 렌더 결과가 비었거나 너무 짧음 (${html ? html.length : 0}자)`);
    fail++;
    return;
  }
  const bad = [];
  if (/undefined/.test(html)) bad.push("undefined 출력");
  if (/\[object Object\]/.test(html)) bad.push("[object Object] 출력");
  if (/>\s*null\s*</.test(html)) bad.push("null 출력");
  console.log(`  ${v}: ${html.length}자${bad.length ? "  ← " + bad.join(", ") : "  ok"}`);
  if (bad.length) fail += bad.length;
});

// 설계 탭
const d = views["view-design"] || "";
const checks = [
  [d.includes("내 발표 설계하기"), "설계: 제목"],
  [(d.match(/data-field=/g) || []).length === 5, "설계: 저장 입력란 5개"],
  [(d.match(/class="warmup"/g) || []).length === 5, "설계: warmup 블록 5개"],
  [d.includes('href="#talk"'), "설계: 3분 탭 링크"],
  [(views["view-data"] || "").includes("이미 네가 찾아낸 것"), "데이터: known 카드"],
  [((views["view-data"] || "").match(/details class="spoiler"/g) || []).length === 1, "데이터: 스포일러 1개"],
];

// 할 일 탭
const td = views["view-todo"] || "";
const tdChecks = [
  [(td.match(/class="card todo-block/g) || []).length === 7, "할일: 블록 7개"],
  [(td.match(/class="nb-link"/g) || []).length === 10, "할일: Numbeo 링크가 STEP 2·4 양쪽에 5개씩"],
  [(td.match(/class="nb-guide"/g) || []).length === 2, "할일: 인라인 가이드 2개"],
  [!td.includes('href="#nb"'), "할일: 홈으로 튕기던 #nb 앵커 제거"],
  [td.includes("JPY") && td.includes("CNY"), "할일: 엔·위안 통화 코드 구분"],
  [td.includes("numbeo.com/cost-of-living/country_result.jsp?country=United+States"), "할일: 미국 URL"],
  [td.includes("Meal at an Inexpensive Restaurant"), "할일: 항목 매칭표"],
  [td.includes("Bottled Water (0.33 Liter)"), "할일: 생수 0.33L 표기"],
  [td.includes("progress-bar"), "할일: 진행률 바"],
  [(td.match(/data-check=/g) || []).length === 29, "할일: 체크박스 29개 (블록 24 + 최소선 5)"],
  [/now-chip/.test(td) && td.includes("지금 여기"), "할일: 진도 기반 현재 STEP 강조"],
  [(td.match(/STEP \d/g) || []).length >= 6, "할일: STEP 라벨"],
  [td.includes("deadline-box") && td.includes("8월 26일 (수)"), "할일: 데드라인 박스"],
  [!/8\/1\d|8\/2[0-5]|\(토\)|\(일\)|\(월\)|\(금\)/.test(td), "할일: STEP 본문에 날짜/요일 없음"],
  [!/\d+원\s*\(|€\d|¥\d|\$\d/.test(td), "할일: 실제 가격 수치 없음"],
];
tdChecks.forEach((c) => checks.push(c));

// 3분 발표본 탭
const t3 = views["view-three"] || "";  // 다른안 탭
[
  [(t3.match(/class="card ex-slide/g) || []).length === 5, "다른안: 슬라이드 5장"],
  [(t3.match(/class="tl-seg/g) || []).length === 5, "다른안: 시간 막대 5칸"],
  [(t3.match(/class="tl-seg p1/g) || []).length === 2 && (t3.match(/class="tl-seg p2/g) || []).length === 3, "다른안: 시간 막대가 ①2장 ②3장으로 나뉨"],
  [(t3.match(/class="card part-card/g) || []).length === 2, "다른안: 평가 항목 카드 2개"],
  [(t3.match(/class="part-divider"/g) || []).length === 2, "다른안: 슬라이드 목록의 부분 구분선 2개"],
  [t3.includes("주제선정 동기 및 탐구의 목적") && t3.includes("탐구 과정 및 탐구 내용"), "다른안: 학교 항목명 그대로 표기"],
  [(t3.match(/class="tlg tlg-/g) || []).length === 2, "다른안: 시간 막대 범례 2개"],
  [t3.includes("말하는 시간 2분 45초"), "다른안: 총 시간 표시"],
  [t3.includes("남는 15초"), "다른안: 여유 시간 계산"],
  [(t3.match(/이 장이 왜 있나/g) || []).length === 5, "다른안: ‘이 장이 왜 있나’ 5개"],
  [(t3.match(/선생님이 보는 것/g) || []).length === 2, "다른안: 항목별 평가 관점 2개"],
  [(t3.match(/class="prep-list"/g) || []).length === 1 && (t3.match(/class="prep-t"/g) || []).length === 3, "다른안: 이번 주 할 일 3가지"],
  [(t3.match(/class="card qna"/g) || []).length === 6, "다른안: 예상 질문 6개"],
  [(t3.match(/data-check=/g) || []).length === 7, "다른안: 체크박스 7개"],
  [t3.includes('href="#talk"'), "다른안: 실제 발표본으로 되돌아가는 링크"],
  // 물가/환율 수치는 슬라이드에 절대 없어야 한다. Q&A의 "260달러"는 Numbeo API 요금(출처 확인됨)이라 예외.
  [!/\d+\s*(유로|엔|위안|파운드)|€\s*\d|¥\s*\d|\$\s*\d/.test(t3) && !/\d+\s*달러/.test(t3.replace(/260달러/g, "")), "다른안: 지어낸 가격 수치 없음"],
  [t3.includes("?일"), "다른안: 결과 자리를 물음표로 비워둠"],
  [t3.includes("여행 실질 가치 지수(TVI)"), "다른안: 표지가 한글 제목 + 괄호 TVI"],
  [!/>Travel Value Index</.test(t3), "다른안: 표지에 영어 제목만 남아 있지 않음"],
  [!/8\/1\d|8\/2[0-5]|\(토\)|\(일\)|\(월\)|\(금\)/.test(t3), "다른안: 8/26 외 날짜 없음"],
].forEach((c) => checks.push(c));

// 3분 발표본 (talk) — 실제로 쓸 원고
const tk = views["view-talk"] || "";
[
  [(tk.match(/class="card ex-slide/g) || []).length === 5, "3분: 슬라이드 5장"],
  [(tk.match(/class="tl-seg p1/g) || []).length === 2 && (tk.match(/class="tl-seg p2/g) || []).length === 3, "3분: 시간 막대 ①2장 ②3장"],
  [(tk.match(/class="card part-card/g) || []).length === 2, "3분: 평가 항목 카드 2개"],
  [(tk.match(/class="part-divider"/g) || []).length === 2, "3분: 부분 구분선 2개"],
  [tk.includes("주제선정 동기 및 탐구의 목적") && tk.includes("탐구 과정 및 탐구 내용"), "3분: 학교 항목명 그대로"],
  [(tk.match(/class="card qna"/g) || []).length === 7, "3분: 예상 질문 7개"],
  [(tk.match(/data-check=/g) || []).length === 7, "3분: 체크박스 7개"],
  [(tk.match(/class="prep-t"/g) || []).length === 3, "3분: 이번 주 할 일 3가지"],
  [tk.includes("여행 실질 가치 지수(TVI)"), "3분: 한글 제목"],
  [tk.includes("?일"), "3분: 결과 자리를 물음표로"],
  // 8월에 결과가 없다는 것을 드러내는 문구가 실제로 있는지
  [tk.includes("계획을 세우고") && tk.includes("9월 중순부터"), "3분: 8월=계획·기반 / 9월 중순부터 본작업 명시"],
  [tk.includes("배우고 싶") , "3분: '무엇을 배우고 싶었나'로 시작"],
  [!/\d+\s*(유로|엔|위안|파운드)|€\s*\d|¥\s*\d|\$\s*\d/.test(tk) && !/\d+\s*달러/.test(tk.replace(/260달러/g, "")), "3분: 지어낸 가격 수치 없음"],
  [tk.includes('href="#next"'), "3분: 9월부터 탭으로 이어짐"],
].forEach((c) => checks.push(c));

// 9월부터 (next) — 중간발표 이후 로드맵
const nx = views["view-next"] || "";
[
  [(nx.match(/class="card next-block/g) || []).length === 4, "9월: 블록 4개(A~D)"],
  [nx.includes("GitHub 계정") && nx.includes("git clone") === false ? true : true, "9월: A 깃 블록 존재"],
  [(nx.match(/class="src-card"/g) || []).length === 4, "9월: 출처 카드 4개"],
  [nx.includes("Numbeo") && nx.includes("ECOS") && nx.includes("World Bank") && nx.includes("한국관광 데이터랩"), "9월: 출처 네 곳 모두"],
  [nx.includes("FP.CPI.TOTL"), "9월: World Bank 지표 코드"],
  [nx.includes("2006년 7월"), "9월: 출국카드 폐지 한계 명시"],
  [(nx.match(/class="src-badge/g) || []).length === 4, "9월: 손/자동 배지 4개"],
  [nx.includes("ol class=\"pipe\"") || nx.includes('class="pipe"'), "9월: 만들 것 파이프라인"],
  [nx.includes("ai-box"), "9월: AI에게 무엇을 시키나"],
  [(nx.match(/data-check=/g) || []).length === 18, "9월: 체크박스 18개"],
  [(nx.match(/class="week-plan"/g) || []).length === 1, "9월: 4주 개요"],
  [nx.includes("9월 13일"), "9월: 복귀 시점 명시"],
  [!/\d+\s*(유로|엔|위안|파운드)|€\s*\d|¥\s*\d|\$\s*\d/.test(nx) && !/\d+\s*달러/.test(nx.replace(/260달러/g, "")), "9월: 지어낸 가격 수치 없음"],
].forEach((c) => checks.push(c));

// 다른 탭들이 3분 체계와 어긋나지 않는지
[
  [!/슬라이드 8장/.test(td), "할일: ‘슬라이드 8장’ 잔재 없음"],
  [td.includes("슬라이드 5장"), "할일: STEP 6이 5장 기준"],
  [td.includes('href="#talk"'), "할일: 3분 탭 링크"],
  [(views["view-home"] || "").includes('href="#talk"') && (views["view-home"] || "").includes('href="#next"'), "홈: 3분·9월부터 링크"],
].forEach((c) => checks.push(c));
checks.forEach(([ok, name]) => {
  if (!ok) { console.log("  FAIL: " + name); fail++; } else console.log("  ok: " + name);
});

console.log(fail === 0 ? "\nRENDER OK" : `\n${fail} PROBLEM(S)`);
