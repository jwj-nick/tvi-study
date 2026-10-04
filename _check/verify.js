// content.js가 app.js의 렌더 함수가 기대하는 모양인지 검증한다.
const fs = require("fs");
const dir = "C:/Kids/71_High_Projects/2608_TVI_app/";
const CONTENT = eval(fs.readFileSync(dir + "content.js", "utf8") + "\nCONTENT");
const QUESTIONS = eval(fs.readFileSync(dir + "questions.js", "utf8") + "\nQUESTIONS");
const FINAL = eval(fs.readFileSync(dir + "final.js", "utf8") + "\nFINAL");

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

// 데이터 탭 — known 추가분 + 스포일러
check(CONTENT.data.mission.known && CONTENT.data.mission.known.title && CONTENT.data.mission.known.body, "data.mission.known");
check(Array.isArray(CONTENT.data.mission.spoilers) && CONTENT.data.mission.spoilers.length === 1, "spoilers는 1개여야 함(숙박비만)");

// localStorage 키 충돌
const fieldIds = [...CONTENT.design.blocks.map((b) => b.id)];
check(new Set(fieldIds).size === fieldIds.length, "field id 중복: " + fieldIds.join(","));

const checkIds = [
  ...CONTENT.talk.check.items.map((c) => c.id),
  ...CONTENT.three.check.items.map((c) => c.id),
  ...CONTENT.next.blocks.flatMap((b) => b.checks.map((c) => c.id)),
  ...CONTENT.next.phases.flatMap((p) => p.checks.map((c) => c.id)),
  ...CONTENT.todo.blocks.flatMap((b) => b.checks.map((c) => c.id)),
  ...CONTENT.todo.minimum.checks.map((c) => c.id),
  ...CONTENT.go.blocks.flatMap((b) => b.checks.map((c) => c.id)),
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
const TAB_NAMES = ["home", "inside", "lessons", "travel", "present", "path", "start", "go", "todo", "talk", "design", "next", "computer", "economy", "data", "quiz", "three"];
// 페이지 내 앵커(#nb 같은)가 남아 있지 않은지 — 해시 라우터와 충돌한다
const anchors = JSON.stringify(CONTENT).match(/href=\\"#[a-z-]+/g) || [];
const badAnchors = anchors.filter((a) => {
  const t = a.split("#")[1];
  return !TAB_NAMES.includes(t);
});
check(!badAnchors.length, "콘텐츠에 탭이 아닌 앵커가 있음: " + badAnchors.join(", "));

// 퀴즈 세트 필터가 모두 동작하는지
CONTENT.quizSets.forEach((s) => {
  const n = QUESTIONS.filter(s.filter).length;
  check(n > 0, `quizSet ${s.id} 결과 0건`);
  console.log(`  quizSet ${s.id}: ${n}문항`);
});

// 데드라인(8/26)을 뺀 나머지 콘텐츠 전체에 날짜/요일이 남아 있지 않은지
// — 중간발표 날짜만 못박고, 나머지는 STEP 체계로 표기한다
// next(9월 로드맵)는 중간고사·복귀일·최종발표 같은 실제 달력 일정을 다루므로 제외한다.
const { next: _skipNext, ...datedScope } = CONTENT;
const whole = JSON.stringify(datedScope).replace(/8월 26일 \(수\)|2026-08-26|8\/26 \(수\)|8\/26/g, "");
const leftover = whole.match(/8\/\d\d|8월 \d\d일|\((월|화|수|목|금|토|일)\)/g);
check(!leftover, "콘텐츠에 날짜/요일이 남음: " + [...new Set(leftover || [])].join(", "));

// ─────────── 3분 발표본 두 판 (talk = 실제 사용, three = 다른안) ───────────
function checkThreeMin(t3, label) {
  check(t3 && Array.isArray(t3.slides), label + ".slides 없음");
  check(t3.slides.length <= 5, `${label}: 3분에 슬라이드 ${t3.slides.length}장은 너무 많다 (최대 5장)`);
  check(typeof t3.lead === "string" && t3.lead.length, `${label}.lead`);
  ["structure", "prep", "make", "qna", "check", "confirm"].forEach((k) =>
    check(t3[k] && typeof t3[k] === "object", `${label}.${k}`)
  );

  const st = t3.structure;
  check(st.parts.length === 2, `${label}: 평가 항목은 2개`);
  check(st.parts[0].name === "주제선정 동기 및 탐구의 목적", `${label}: ①의 이름이 학교 항목명과 다름 — ` + st.parts[0].name);
  check(st.parts[1].name === "탐구 과정 및 탐구 내용", `${label}: ②의 이름이 학교 항목명과 다름 — ` + st.parts[1].name);
  st.parts.forEach((p, i) => {
    ["no", "name", "slides", "teacher", "trap"].forEach((k) =>
      check(typeof p[k] === "string" && p[k].length, `${label}.structure.parts[${i}].${k}`)
    );
    check(Array.isArray(p.asks) && p.asks.length, `${label}.structure.parts[${i}].asks`);
    check(Array.isArray(p.ours) && p.ours.length, `${label}.structure.parts[${i}].ours`);
    const real = t3.slides.filter((s) => String(s.part) === p.no).reduce((a, s) => a + s.sec, 0);
    check(p.sec === real, `${label}.structure.parts[${i}].sec(${p.sec})이 실제 슬라이드 합계(${real})와 다름`);
  });

  check(t3.slides.every((s) => s.part === 1 || s.part === 2), `${label}: 모든 슬라이드에 part 필요`);
  check(/^1+2+$/.test(t3.slides.map((s) => s.part).join("")), `${label}: 슬라이드가 ①→② 순서가 아님`);
  check(
    t3.slides.some((s) => s.screen.some((l) => l.includes("주제선정 동기 및 탐구의 목적"))) &&
      t3.slides.some((s) => s.screen.some((l) => l.includes("탐구 과정 및 탐구 내용"))),
    `${label}: 슬라이드 화면에 평가 항목 제목이 없음`
  );

  t3.slides.forEach((s, i) => {
    ["title", "script", "why"].forEach((k) =>
      check(typeof s[k] === "string" && s[k].length, `${label}.slides[${i}].${k}`)
    );
    check(typeof s.n === "number" && typeof s.sec === "number", `${label}.slides[${i}].n/sec`);
    check(Array.isArray(s.screen) && s.screen.length, `${label}.slides[${i}].screen`);
    if (s.keyLine) check(typeof s.keyNote === "string", `${label}.slides[${i}] keyLine에 keyNote 없음`);
    check(!s.blanks, `${label}.slides[${i}]에 blanks가 있으면 안 됨`);
  });
  t3.qna.items.forEach((q, i) => check(q.q && q.a, `${label}.qna.items[${i}]`));
  t3.prep.items.forEach((p, i) => check(p.t && p.d && p.dur, `${label}.prep.items[${i}]`));

  const total = t3.slides.reduce((a, s) => a + s.sec, 0);
  check(total <= 170, `${label}: 목표 시간 합계 ${total}초 — 넘기고 숨 쉴 여유가 없다 (170초 이하)`);
  const p1 = t3.slides.filter((s) => s.part === 1).reduce((a, s) => a + s.sec, 0);
  console.log(`\n  [${label}] 합계 ${total}초 (${Math.floor(total / 60)}분 ${total % 60}초) · ① ${p1}초 / ② ${total - p1}초 · 여유 ${180 - total}초`);
  t3.slides.forEach((s) => {
    const est = Math.round((s.script || "").length / 5.5);
    console.log(`   ${s.n}장 ${s.title}: 대본 ${(s.script || "").length}자 ≈ ${est}초 / 목표 ${s.sec}초${est > s.sec * 1.15 ? "  ← 초과" : ""}`);
    check(est <= s.sec * 1.15, `${label} ${s.n}장 대본이 목표보다 김 (${est}초 > ${s.sec}초)`);
  });
  const estTotal = t3.slides.reduce((a, s) => a + (s.script || "").length / 5.5, 0);
  check(estTotal <= 180, `${label}: 대본 추정 ${Math.round(estTotal)}초 — 3분을 넘는다`);

  // 결과가 없는 단계다. 슬라이드에 물가/환율처럼 보이는 수치가 있으면 안 된다.
  const slideText = JSON.stringify(t3.slides);
  const VERIFIED = ["260달러"]; // Numbeo API 최저 요금 (numbeo.com/common/api.jsp, 2026-08-19 확인)
  let slideRest = slideText;
  VERIFIED.forEach((v) => { slideRest = slideRest.split(v).join(""); });
  const priceLike = slideRest.match(/\d+(\.\d+)?\s?(유로|달러|엔|위안|파운드|€|\$|£)/g);
  check(!priceLike, `${label}: 슬라이드에 가격처럼 보이는 수치 — ` + (priceLike || []).join(", "));

  let rest = JSON.stringify(t3).replace(slideText, "");
  VERIFIED.forEach((v) => { rest = rest.split(v).join(""); });
  const restPrice = rest.match(/\d+(\.\d+)?\s?(유로|달러|엔|위안|파운드|€|\$|£)/g);
  check(!restPrice, `${label}: 출처 미확인 수치 — ` + (restPrice || []).join(", "));
}

checkThreeMin(CONTENT.talk, "talk(3분)");
checkThreeMin(CONTENT.three, "three(다른안)");

// 발표본이 인용하는 월 260달러는 근거가 앱 안에 있어야 한다
check(
  JSON.stringify(CONTENT.next).includes("260달러"),
  "월 260달러의 근거가 ‘9월부터’ 탭 출처 카드에 없음"
);

// ─────────── 9월부터 로드맵 ───────────
const nx = CONTENT.next;
check(nx && Array.isArray(nx.blocks) && nx.blocks.length === 4, "next.blocks는 4개(A~D)");
["lead", "toolboxIntro"].forEach((k) => check(typeof nx[k] === "string" && nx[k].length, `next.${k}`));
check(nx.brief && nx.brief.lines.length === 4 && nx.brief.confirm.length >= 3, "next.brief (5분 브리핑 4줄 + 확인할 것)");
check(Array.isArray(nx.phases) && nx.phases.length === 7, "next.phases 일곱 단계");
nx.phases.forEach((p, i) => {
  ["id", "n", "from", "to", "when", "title", "goal", "done"].forEach((k) =>
    check(typeof p[k] === "string" && p[k].length, `next.phases[${i}].${k}`)
  );
  check(/^2026-(09|10)-\d\d$/.test(p.from) && /^2026-(09|10)-\d\d$/.test(p.to) && p.from <= p.to, `next.phases[${i}] 날짜 형식/순서`);
  if (i > 0) check(nx.phases[i - 1].to <= p.from, `next.phases[${i}]가 앞 단계보다 먼저 시작함`);
  check(Array.isArray(p.steps) && p.steps.length && Array.isArray(p.checks) && p.checks.length, `next.phases[${i}] steps/checks`);
});
check(nx.phases[nx.phases.length - 1].to === CONTENT.meta.final, "마지막 단계 = 최종발표일");
check(/검증/.test(nx.phases[2].title), "③이 검증 단계");
check(nx.cut && nx.cut.items.length >= 4 && /검증/.test(nx.cut.items[nx.cut.items.length - 1].t), "버리는 순서 — 마지막은 '검증은 버리지 않는다'");
nx.blocks.forEach((b, i) => {
  ["id", "tag", "title", "dur", "why"].forEach((k) =>
    check(typeof b[k] === "string" && b[k].length, `next.blocks[${i}].${k}`)
  );
  check(Array.isArray(b.checks) && b.checks.length, `next.blocks[${i}].checks`);
});
check(nx.blocks.map((b) => b.tag).join("") === "ABCD", "next 블록 태그가 A·B·C·D 순서가 아님");

// 출처 카드 — '어디서 / 어떻게 / 왜'가 실제로 채워져 있는지
const srcBlock = nx.blocks.find((b) => b.tag === "B");
check(srcBlock && Array.isArray(srcBlock.cards) && srcBlock.cards.length === 4, "출처 카드 4개(물가·환율·CPI·여행객 수)");
srcBlock.cards.forEach((c, i) => {
  ["name", "badge", "where"].forEach((k) => check(typeof c[k] === "string" && c[k].length, `출처카드[${i}].${k}`));
  check(Array.isArray(c.lines) && c.lines.length >= 3, `출처카드[${i}] 설명이 3줄 미만`);
  check(Array.isArray(c.links) && c.links.length, `출처카드[${i}] 링크 없음`);
  c.links.forEach((l) => check(/^https:\/\//.test(l.href), `출처카드[${i}] 링크가 https가 아님`));
});
check(srcBlock.table && srcBlock.table.rows.length === 4, "출처 요약표 4줄");
const badges = srcBlock.cards.map((c) => c.badge);
check(
  badges.some((b) => b.indexOf("손") === 0) && badges.some((b) => b.indexOf("프로그램") === 0),
  "출처 카드에 '손으로'와 '프로그램(API)'이 모두 있어야 함: " + badges.join(" / ")
);

// 프로그램 기획 — 기획과 실행 detail
const buildBlock = nx.blocks.find((b) => b.tag === "D");
check(buildBlock.pipeline && buildBlock.pipeline.steps.length >= 5, "D: 입력→처리→출력 파이프라인");
check(buildBlock.order && buildBlock.order.items.length >= 4, "D: 만드는 순서");
check(buildBlock.rules && buildBlock.rules.items.length >= 4, "D: 지킬 것");
check(buildBlock.ai && buildBlock.ai.items.length >= 3, "D: AI에게 무엇을 시키나");

// 경제 용어 매핑 — '어디에 쓰이나'가 비어 있으면 안 된다
const termBlock = nx.blocks.find((b) => b.tag === "C");
check(termBlock.table && termBlock.table.rows.length >= 8, "C: 용어 표 8줄 이상");
termBlock.table.rows.forEach((r, i) =>
  check(r.length === 4 && r.every((c) => c && c.length), `C: 용어표 ${i}번째 줄에 빈 칸`)
);

// GitHub 블록 — 계정부터 push까지 단계가 있는지
const gitBlock = nx.blocks.find((b) => b.tag === "A");
check(gitBlock.steps && gitBlock.steps.length >= 4, "A: GitHub 단계 4개 이상");
check(/GitHub 계정/.test(JSON.stringify(gitBlock)), "A: 계정 만들기 단계 없음");
check(/push/.test(JSON.stringify(gitBlock)), "A: push 단계 없음");
check(typeof gitBlock.warn === "string" && /키|비밀번호/.test(gitBlock.warn), "A: 키·비밀번호 경고 없음");

// 따라하기 (go) — 재료 네 가지 모으기
const go = CONTENT.go;
check(go && Array.isArray(go.blocks) && go.blocks.length === 7, "go: 블록 7개(준비·재료1~4·마무리)");
go.blocks.forEach((b, i) => {
  ["id", "step", "title", "dur", "why", "done"].forEach((k) =>
    check(typeof b[k] === "string" && b[k].length, `go.blocks[${i}].${k}`)
  );
  check(Array.isArray(b.steps) && b.steps.length, `go.blocks[${i}].steps`);
  b.steps.forEach((st, j) => check(typeof st.t === "string" && st.t.length && (st.d || st.code), `go.blocks[${i}].steps[${j}] 내용 없음`));
  check(Array.isArray(b.checks) && b.checks.length, `go.blocks[${i}].checks`);
});
const goText = JSON.stringify(go);
check(goText.includes("731Y004") && !goText.includes("731Y004/D"), "go: 환율은 월별 통계표 731Y004");
check(goText.includes("0000027") && goText.includes("0000053"), "go: 위안 코드 두 개 모두 안내");
check(goText.includes("100엔"), "go: 엔화 100엔 단위 경고");
check(goText.includes("누계"), "go: 데이터랩 누계 줄 경고");
check(goText.includes("ecos.key") && goText.includes("gitignore"), "go: 인증키를 파일로 분리하고 올리지 않음");
check(!/ecos\.bok\.or\.kr\/api\/StatisticSearch\/(?!sample)/.test(goText), "go: 샘플 키 외의 실제 키가 주소에 들어가 있음");
check(go.blocks.some((b) => b.guide === "collect"), "go: Numbeo 수집 안내 상자 연결");

console.log(fail === 0 ? "\nALL CHECKS PASSED" : `\n${fail} CHECK(S) FAILED`);

// ─────────── 최종판 (final.js, 2026-10-04) ───────────
// 결과 · 회고 부분은 실제 숫자를 쓰는 대신, 결과마다 출처가 있어야 한다.
check(FINAL.home.results.length === 3 && FINAL.home.results.every((r) => r.head && r.body && r.src), "final.home.results: 3줄, 모두 출처(src)");
check(FINAL.home.map.every((m) => TAB_NAMES.includes(m.tab)), "final.home.map: 모두 탭 이름");
check(FINAL.path.archive.every((a) => TAB_NAMES.includes(a.tab)), "final.path.archive: 모두 탭 이름");
FINAL.path.steps.forEach((s, i) => ["when", "title", "did", "decided", "why", "later"].forEach((k) => check(s[k], `final.path.steps[${i}].${k}`)));
check(FINAL.inside.scripts.length === 11, "final.inside.scripts 11개");
FINAL.inside.scripts.forEach((s, i) => {
  ["n", "file", "what", "why", "line", "lineNote", "ask"].forEach((k) => check(s[k], `final.inside.scripts[${i}].${k}`));
  check(s.file.startsWith(s.n + "_"), `final.inside.scripts[${i}] 번호와 파일명이 다름`);
});
check(FINAL.lessons.cards.length === 9 && FINAL.lessons.aiCases.length === 4, "final.lessons 카드 9 · AI 사례 4");
check(FINAL.present.goals.reduce((a, g) => a + g.sec, 0) === 295, "final.present.goals 합계 295초(4분 55초)");
check(FINAL.present.questions.length === 8, "final.present.questions 8개");
const finalAnchors = (JSON.stringify(FINAL).match(/#[a-z]+/g) || []).filter((a) => !TAB_NAMES.includes(a.slice(1)) && !/^#[0-9]/.test(a));
check(!finalAnchors.length, "final.js에 탭이 아닌 앵커: " + finalAnchors.join(", "));
const rehearsalIds = FINAL.present.rehearsal.map((r) => r.id);
check(rehearsalIds.every((id) => !checkIds.includes(id)) && new Set(rehearsalIds).size === rehearsalIds.length, "final 리허설 체크 id가 기존 id와 겹침");
check(/school|학교명/.test(JSON.stringify(FINAL)) === false, "final.js에 학교 이름 자리 표시가 있음");
check(QUESTIONS.filter((q) => q.category === "result").every((q) => /출처|기사|외교부|결과 보고서/.test(q.explanation) || q.id === 39), "최종 결과 퀴즈: 해설에 출처");
console.log(fail === 0 ? "\nFINAL OK" : `\n${fail} PROBLEM(S) (final 포함)`);
