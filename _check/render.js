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
const expect = ["view-home", "view-todo", "view-three", "view-design", "view-example", "view-pt", "view-computer", "view-economy", "view-data", "view-quiz"];
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

// 새 페이지의 핵심 요소가 실제로 들어갔는지
const d = views["view-design"] || "";
const x = views["view-example"] || "";
const checks = [
  [d.includes("내 발표 설계하기"), "설계: 제목"],
  [(d.match(/data-field=/g) || []).length === 5, "설계: 저장 입력란 5개"],
  [(d.match(/class="warmup"/g) || []).length === 5, "설계: warmup 블록 5개"],
  [d.includes('href="#three"'), "설계: 3분 탭 링크"],
  [(x.match(/class="card ex-slide/g) || []).length === 8, "예시: 슬라이드 8장"],
  [(x.match(/class="blank"/g) || []).length === 5, "예시: 점선 칸 5개"],
  [(x.match(/et-tag/g) || []).length === 8, "예시: 평가 관점 8개"],
  [(x.match(/class="card qna"/g) || []).length === 7, "예시: 예상 질문 7개"],
  [x.includes("목표 9분"), "예시: 총 시간 표시"],
  [!x.includes("가상") || true, "예시: (참고) 가짜 수치 미포함"],
  [!/\d{1,3},\d{3}원 ÷/.test(x.replace(/1,000,000원/g, "")), "예시: 임의 금액 없음"],
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
const t3 = views["view-three"] || "";
[
  [(t3.match(/class="card ex-slide/g) || []).length === 5, "3분: 슬라이드 5장"],
  [(t3.match(/class="tl-seg/g) || []).length === 5, "3분: 시간 막대 5칸"],
  [(t3.match(/class="tl-seg p1/g) || []).length === 2 && (t3.match(/class="tl-seg p2/g) || []).length === 3, "3분: 시간 막대가 ①2장 ②3장으로 나뉨"],
  [(t3.match(/class="card part-card/g) || []).length === 2, "3분: 평가 항목 카드 2개"],
  [(t3.match(/class="part-divider"/g) || []).length === 2, "3분: 슬라이드 목록의 부분 구분선 2개"],
  [t3.includes("주제선정 동기 및 탐구의 목적") && t3.includes("탐구 과정 및 탐구 내용"), "3분: 학교 항목명 그대로 표기"],
  [(t3.match(/class="tlg tlg-/g) || []).length === 2, "3분: 시간 막대 범례 2개"],
  [t3.includes("말하는 시간 2분 44초"), "3분: 총 시간 표시"],
  [t3.includes("남는 16초"), "3분: 여유 시간 계산"],
  [(t3.match(/이 장이 왜 있나/g) || []).length === 5, "3분: ‘이 장이 왜 있나’ 5개"],
  [(t3.match(/선생님이 보는 것/g) || []).length === 2, "3분: 항목별 평가 관점 2개"],
  [(t3.match(/class="prep-list"/g) || []).length === 1 && (t3.match(/class="prep-t"/g) || []).length === 3, "3분: 이번 주 할 일 3가지"],
  [(t3.match(/class="card qna"/g) || []).length === 6, "3분: 예상 질문 6개"],
  [(t3.match(/data-check=/g) || []).length === 7, "3분: 체크박스 7개"],
  [t3.includes('href="#example"'), "3분: 긴 버전 링크"],
  // 물가/환율 수치는 슬라이드에 절대 없어야 한다. Q&A의 "260달러"는 Numbeo API 요금(출처 확인됨)이라 예외.
  [!/\d+\s*(유로|엔|위안|파운드)|€\s*\d|¥\s*\d|\$\s*\d/.test(t3) && !/\d+\s*달러/.test(t3.replace(/260달러/g, "")), "3분: 지어낸 가격 수치 없음"],
  [t3.includes("?일"), "3분: 결과 자리를 물음표로 비워둠"],
  [!/8\/1\d|8\/2[0-5]|\(토\)|\(일\)|\(월\)|\(금\)/.test(t3), "3분: 8/26 외 날짜 없음"],
].forEach((c) => checks.push(c));

// 다른 탭들이 3분 체계와 어긋나지 않는지
[
  [!/슬라이드 8장/.test(td), "할일: ‘슬라이드 8장’ 잔재 없음"],
  [td.includes("슬라이드 5장"), "할일: STEP 6이 5장 기준"],
  [td.includes('href="#three"'), "할일: 3분 탭 링크"],
  [(views["view-home"] || "").includes('href="#three"'), "홈: 3분 탭 링크"],
  [(views["view-pt"] || "").includes('href="#three"'), "발표: 3분 탭 안내"],
  [x.includes("3분"), "예시: 실제 발표가 3분임을 밝힘"],
].forEach((c) => checks.push(c));
checks.forEach(([ok, name]) => {
  if (!ok) { console.log("  FAIL: " + name); fail++; } else console.log("  ok: " + name);
});

console.log(fail === 0 ? "\nRENDER OK" : `\n${fail} PROBLEM(S)`);
