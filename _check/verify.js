// content.js가 app.js의 렌더 함수가 기대하는 모양인지 검증한다.
const fs = require("fs");
const dir = "C:/Kids/71_High_Projects/2608_TVI_app/";
const CONTENT = eval(fs.readFileSync(dir + "content.js", "utf8") + "\nCONTENT");
const QUESTIONS = eval(fs.readFileSync(dir + "questions.js", "utf8") + "\nQUESTIONS");

let fail = 0;
const check = (cond, msg) => { if (!cond) { console.log("  FAIL: " + msg); fail++; } };

// 설계 블록
check(CONTENT.design && Array.isArray(CONTENT.design.blocks), "design.blocks 없음");
CONTENT.design.blocks.forEach((b, i) => {
  ["id", "n", "title", "why", "core", "placeholder", "weak", "strong", "hint"].forEach((k) =>
    check(typeof b[k] === "string" && b[k].length, `design.blocks[${i}].${k}`)
  );
  check(Array.isArray(b.warmup) && b.warmup.length >= 1, `design.blocks[${i}].warmup`);
});

// 예시 슬라이드
const e = CONTENT.example;
check(e && Array.isArray(e.slides) && e.slides.length === 8, "example.slides 8장이 아님");
e.slides.forEach((s, i) => {
  ["title", "script", "teacher", "short"].forEach((k) =>
    check(typeof s[k] === "string" && s[k].length, `example.slides[${i}].${k}`)
  );
  check(typeof s.n === "number" && typeof s.sec === "number", `example.slides[${i}].n/sec`);
  check(Array.isArray(s.screen) && s.screen.length, `example.slides[${i}].screen`);
  if (s.keyLine) check(typeof s.keyNote === "string", `slides[${i}] keyLine에 keyNote 없음`);
  if (s.blanks) s.blanks.forEach((b, j) =>
    check(b.id && b.label && b.hint, `slides[${i}].blanks[${j}]`)
  );
});
check(e.qna && Array.isArray(e.qna.items) && e.qna.items.length, "example.qna.items");
e.qna.items.forEach((q, i) => check(q.q && q.a, `qna.items[${i}]`));
check(Array.isArray(e.checklist) && e.checklist.length, "example.checklist");
["lead", "warn", "titleLine", "subtitleLine", "timeNote"].forEach((k) =>
  check(typeof e[k] === "string" && e[k].length, `example.${k}`)
);

// 데이터 탭 — known 추가분 + 스포일러
check(CONTENT.data.mission.known && CONTENT.data.mission.known.title && CONTENT.data.mission.known.body, "data.mission.known");
check(Array.isArray(CONTENT.data.mission.spoilers) && CONTENT.data.mission.spoilers.length === 1, "spoilers는 1개여야 함(숙박비만)");

// localStorage 키 충돌
const fieldIds = [
  ...CONTENT.design.blocks.map((b) => b.id),
  ...e.slides.flatMap((s) => (s.blanks || []).map((b) => b.id)),
];
check(new Set(fieldIds).size === fieldIds.length, "field id 중복: " + fieldIds.join(","));

const checkIds = [
  ...e.checklist.map((c) => c.id),
  ...CONTENT.three.check.items.map((c) => c.id),
  ...CONTENT.todo.blocks.flatMap((b) => b.checks.map((c) => c.id)),
  ...CONTENT.todo.minimum.checks.map((c) => c.id),
];
check(new Set(checkIds).size === checkIds.length, "check id 중복: " + checkIds.join(","));
console.log(`  체크박스 id 총 ${checkIds.length}개, 중복 없음`);

// 할 일 블록 구조
CONTENT.todo.blocks.forEach((b, i) => {
  ["id", "step", "title"].forEach((k) =>
    check(typeof b[k] === "string" && b[k].length, `todo.blocks[${i}].${k}`)
  );
  check(Array.isArray(b.steps) && b.steps.length, `todo.blocks[${i}].steps`);
  check(Array.isArray(b.checks) && b.checks.length, `todo.blocks[${i}].checks`);
  check(!("from" in b) && !("to" in b) && !("date" in b), `todo.blocks[${i}] 날짜 필드가 남아 있음`);
});
// STEP 라벨: 앞 6개는 STEP n, 마지막만 날짜(데드라인)
CONTENT.todo.blocks.slice(0, 6).forEach((b, i) =>
  check(b.step === `STEP ${i + 1}`, `blocks[${i}].step이 "STEP ${i + 1}"이 아님: ${b.step}`)
);
const last = CONTENT.todo.blocks[CONTENT.todo.blocks.length - 1];
check(last.deadline === true, "마지막 블록에 deadline 표시 없음");
check(CONTENT.todo.deadline.date === "2026-08-26", "deadline 날짜");

// 본문에 날짜/요일이 남아 있지 않은지 (데드라인 블록과 deadline 객체는 제외)
const bodyText = JSON.stringify(
  CONTENT.todo.blocks.slice(0, 6).concat([CONTENT.todo.overview, CONTENT.todo.lead, CONTENT.todo.overviewNote])
);
const dateLike = bodyText.match(/8\/\d\d|8월 \d\d일|\((월|화|수|목|금|토|일)\)/g);
check(!dateLike, "STEP 본문에 날짜/요일이 남음: " + (dateLike || []).join(", "));
// Numbeo 안내
const nb = CONTENT.todo.numbeo;
check(nb.links.length === 5, "numbeo 링크 5개");
nb.links.forEach((l) => {
  check(/^https:\/\/www\.numbeo\.com\/cost-of-living\/country_result\.jsp\?country=/.test(l.url), "numbeo URL 형식: " + l.name);
  check(/^(EUR|JPY|USD|GBP|CNY) /.test(l.cur), "numbeo 통화 코드: " + l.name);
});
check(nb.collect.mapRows.length === 7, "numbeo 항목 매칭 7개");
check(nb.observe.sections.length === 10, "numbeo 섹션 목록 10개");
check(nb.observe.look.length === 3, "numbeo 관찰 포인트 3개");
// STEP 2·4가 각각 가이드를 달고 있는지
const guided = CONTENT.todo.blocks.filter((b) => b.guide).map((b) => b.step + ":" + b.guide);
check(guided.join(",") === "STEP 2:observe,STEP 4:collect", "가이드 배치: " + guided.join(", "));
// 페이지 내 앵커(#nb 같은)가 남아 있지 않은지 — 해시 라우터와 충돌한다
const anchors = JSON.stringify(CONTENT).match(/href=\\"#[a-z-]+/g) || [];
const badAnchors = anchors.filter((a) => {
  const t = a.split("#")[1];
  return !["home", "todo", "three", "design", "example", "pt", "computer", "economy", "data", "quiz"].includes(t);
});
check(!badAnchors.length, "콘텐츠에 탭이 아닌 앵커가 있음: " + badAnchors.join(", "));

// 퀴즈 세트 필터가 모두 동작하는지
CONTENT.quizSets.forEach((s) => {
  const n = QUESTIONS.filter(s.filter).length;
  check(n > 0, `quizSet ${s.id} 결과 0건`);
  console.log(`  quizSet ${s.id}: ${n}문항`);
});

// 발표 시간 합계
const total = e.slides.reduce((a, s) => a + s.sec, 0);
console.log(`  예시 발표 목표 시간 합계: ${total}초 (${(total / 60).toFixed(1)}분)`);

// 대본 분량 → 실제 소요 추정 (한국어 약 5.5자/초)
e.slides.forEach((s) => {
  const chars = (s.script || "").length + (s.script2 || "").length;
  const est = Math.round(chars / 5.5);
  const flag = est > s.sec * 1.15 ? "  ← 목표 초과" : "";
  console.log(`   ${s.n}장 ${s.title}: 대본 ${chars}자 ≈ ${est}초 / 목표 ${s.sec}초${flag}`);
});
const estTotal = e.slides.reduce((a, s) => a + ((s.script || "").length + (s.script2 || "").length) / 5.5, 0);
console.log(`  대본 기준 추정 총 소요: ${Math.round(estTotal)}초 (${(estTotal / 60).toFixed(1)}분)`);

// 데드라인(8/26)을 뺀 나머지 콘텐츠 전체에 날짜/요일이 남아 있지 않은지
// — 중간발표 날짜만 못박고, 나머지는 STEP 체계로 표기한다
const whole = JSON.stringify(CONTENT).replace(/8월 26일 \(수\)|2026-08-26|8\/26 \(수\)|8\/26/g, "");
const leftover = whole.match(/8\/\d\d|8월 \d\d일|\((월|화|수|목|금|토|일)\)/g);
check(!leftover, "콘텐츠에 날짜/요일이 남음: " + [...new Set(leftover || [])].join(", "));

// ─────────── 3분 발표본 ───────────
const t3 = CONTENT.three;
check(t3 && Array.isArray(t3.slides), "three.slides 없음");
check(t3.slides.length <= 5, `3분에 슬라이드 ${t3.slides.length}장은 너무 많다 (최대 5장)`);
["lead", "timeNote"].forEach((k) => check(typeof t3[k] === "string" && t3[k].length, `three.${k}`));
["confirm", "onePoint", "rule", "dropped", "prep", "make", "qna", "check", "structure"].forEach((k) =>
  check(t3[k] && typeof t3[k] === "object", `three.${k}`)
);
// 학교가 정한 두 부분 구성이 실제로 채워져 있는지
const st = t3.structure;
check(st.parts.length === 2, "three.structure.parts는 2개(평가 항목 두 가지)");
check(st.parts[0].name === "주제선정 동기 및 탐구의 목적", "①의 이름이 학교 항목명과 다름: " + st.parts[0].name);
check(st.parts[1].name === "탐구 과정 및 탐구 내용", "②의 이름이 학교 항목명과 다름: " + st.parts[1].name);
st.parts.forEach((p, i) => {
  ["no", "name", "slides", "teacher", "trap"].forEach((k) =>
    check(typeof p[k] === "string" && p[k].length, `structure.parts[${i}].${k}`)
  );
  check(Array.isArray(p.asks) && p.asks.length, `structure.parts[${i}].asks`);
  check(Array.isArray(p.ours) && p.ours.length, `structure.parts[${i}].ours`);
  const real = t3.slides.filter((s) => String(s.part) === p.no).reduce((a, s) => a + s.sec, 0);
  check(p.sec === real, `structure.parts[${i}].sec(${p.sec})이 실제 슬라이드 합계(${real})와 다름`);
});
// 모든 슬라이드가 두 부분 중 하나에 속하는지 + 부분이 뒤섞이지 않는지
check(t3.slides.every((s) => s.part === 1 || s.part === 2), "모든 슬라이드에 part(1 또는 2)가 있어야 함");
const seq = t3.slides.map((s) => s.part).join("");
check(/^1+2+$/.test(seq), "슬라이드가 ①→② 순서로 이어지지 않음: " + seq);
// 두 항목 제목이 실제 슬라이드 화면에도 들어가 있는지 (선생님이 손에 든 평가표와 맞추기 위함)
check(
  t3.slides.some((s) => s.screen.some((l) => l.includes("주제선정 동기 및 탐구의 목적"))) &&
    t3.slides.some((s) => s.screen.some((l) => l.includes("탐구 과정 및 탐구 내용"))),
  "슬라이드 화면에 평가 항목 제목이 없음"
);
t3.slides.forEach((s, i) => {
  ["title", "script", "why"].forEach((k) =>
    check(typeof s[k] === "string" && s[k].length, `three.slides[${i}].${k}`)
  );
  check(typeof s.n === "number" && typeof s.sec === "number", `three.slides[${i}].n/sec`);
  check(Array.isArray(s.screen) && s.screen.length, `three.slides[${i}].screen`);
  if (s.keyLine) check(typeof s.keyNote === "string", `three.slides[${i}] keyLine에 keyNote 없음`);
  // 3분판에는 채워 넣는 칸을 두지 않는다 — 그대로 발표할 수 있어야 한다
  check(!s.blanks, `three.slides[${i}]에 blanks가 있으면 안 됨`);
});
t3.qna.items.forEach((q, i) => check(q.q && q.a, `three.qna.items[${i}]`));
t3.prep.items.forEach((p, i) => check(p.t && p.d && p.dur, `three.prep.items[${i}]`));

const t3total = t3.slides.reduce((a, s) => a + s.sec, 0);
check(t3total <= 170, `3분판 목표 시간 합계 ${t3total}초 — 넘기고 숨 쉴 여유가 없다 (170초 이하)`);
console.log(`\n  3분판 목표 시간 합계: ${t3total}초 (${Math.floor(t3total / 60)}분 ${t3total % 60}초) / 180초`);
t3.slides.forEach((s) => {
  const chars = (s.script || "").length;
  const est = Math.round(chars / 5.5);
  const flag = est > s.sec * 1.15 ? "  ← 목표 초과" : "";
  console.log(`   ${s.n}장 ${s.title}: 대본 ${chars}자 ≈ ${est}초 / 목표 ${s.sec}초${flag}`);
  check(est <= s.sec * 1.15, `three ${s.n}장 대본이 목표 시간보다 김 (${est}초 > ${s.sec}초)`);
});
const t3est = t3.slides.reduce((a, s) => a + (s.script || "").length / 5.5, 0);
console.log(`  대본 기준 추정 총 소요: ${Math.round(t3est)}초`);
check(t3est <= 180, `3분판 대본 추정 소요 ${Math.round(t3est)}초 — 3분을 넘는다`);

// 3분판은 결과가 없는 단계다. 실제 가격처럼 보이는 수치가 들어가면 안 된다
const t3text = JSON.stringify(t3);
const priceLike = t3text.match(/\d+(\.\d+)?\s?(유로|달러|엔|위안|파운드|€|\$|£)/g);
check(!priceLike, "3분판에 가격처럼 보이는 수치가 있음: " + (priceLike || []).join(", "));

console.log(fail === 0 ? "\nALL CHECKS PASSED" : `\n${fail} CHECK(S) FAILED`);
