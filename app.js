// ═══════════════════════════════════════════════════════════════
//  TVI 탐구 가이드 — 앱 동작 코드
//  내용을 고치려면 content.js(콘텐츠) / questions.js(퀴즈)만 보면 됩니다.
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  // ───────────── 테마 ─────────────
  function initTheme() {
    const saved = localStorage.getItem("tvi_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved || (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
    $("#themeToggle").addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("tvi_theme", next);
    });
  }

  // ───────────── D-day ─────────────
  function daysUntil(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const target = new Date(y, m - 1, d);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((target - today) / 86400000);
  }

  function initDday() {
    const chip = $("#ddayChip");
    const mid = daysUntil(CONTENT.meta.midterm);
    const fin = daysUntil(CONTENT.meta.final);
    if (mid > 0)       chip.textContent = "중간발표 D-" + mid;
    else if (mid === 0) chip.textContent = "오늘 중간발표!";
    else if (fin > 0)  chip.textContent = "최종발표 D-" + fin;
    else if (fin === 0) chip.textContent = "오늘 최종발표!";
    else               chip.textContent = "완주 🎉";
  }

  // ───────────── 라우터 ─────────────
  const TABS = ["home", "todo", "three", "design", "example", "pt", "computer", "economy", "data", "quiz"];

  function route() {
    let tab = (location.hash || "#home").slice(1);
    if (!TABS.includes(tab)) {
      // 탭 이름이 아닌 해시(페이지 안 앵커 등)면 보고 있던 탭을 그대로 둔다
      if (TABS.some((t) => !$("#view-" + t).hidden)) return;
      tab = "home";
    }
    TABS.forEach((t) => {
      $("#view-" + t).hidden = t !== tab;
    });
    document.querySelectorAll(".tabs a").forEach((a) => {
      if (a.dataset.tab === tab) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    window.scrollTo(0, 0);
  }

  // ───────────── 공용 렌더 조각 ─────────────
  function sectionHead(eyebrow, title, intro) {
    return `<div><p class="eyebrow">${eyebrow}</p><h2 class="section-title">${title}</h2>${
      intro ? `<p class="section-intro">${intro}</p>` : ""
    }</div>`;
  }

  function conceptCard(c) {
    let tableHtml = "";
    if (c.table) {
      tableHtml = `<div class="tbl-wrap"><table class="tbl"><thead><tr>${c.table.head
        .map((h) => `<th>${h}</th>`)
        .join("")}</tr></thead><tbody>${c.table.rows
        .map((r) => `<tr><td><code>${r[0]}</code></td><td>${r[1]}</td></tr>`)
        .join("")}</tbody></table></div>`;
    }
    return `<article class="card">
      ${c.tag ? `<span class="tag">${c.tag}</span>` : ""}
      <h3>${c.title}</h3>
      <p class="analogy">${c.analogy}</p>
      <p class="definition">${c.definition}</p>
      ${tableHtml}
      ${c.points && c.points.length ? `<ul class="points">${c.points.map((p) => `<li>${p}</li>`).join("")}</ul>` : ""}
    </article>`;
  }

  // ───────────── 홈 ─────────────
  function renderHome() {
    const h = CONTENT.home;

    const timeline = h.timeline
      .map((t) => {
        const started = daysUntil(t.from) <= 0;
        const notOver = daysUntil(t.to) >= 0;
        const now = started && notOver;
        const range = t.from.slice(5).replace("-", "/") + (t.from === t.to ? "" : " ~ " + t.to.slice(5).replace("-", "/"));
        return `<li class="${now ? "now" : ""}">
          <span class="t-range">${range}</span>${now ? '<span class="now-chip">지금</span>' : ""}
          <p class="t-label">${t.label}</p>
          <p class="t-sub">${t.sub}</p>
        </li>`;
      })
      .join("");

    $("#view-home").innerHTML = `
      <div class="hero">
        <p class="quote">${h.heroQuote}</p>
        <p class="big-q">환율이 싸다 <em>=</em> 여행이 싸다<em>?</em></p>
        <p class="lead">${h.heroLead}</p>
      </div>

      <div class="machine">
        <p class="m-eyebrow">TVI FORMULA MACHINE</p>
        <p class="formula">TVI =
          <span class="frac">
            <span class="top">1,000,000원</span><br>
            <span class="bottom">환율 × 1일 생활비</span>
          </span>
        </p>
        <div class="result">
          <span class="num" id="mDays">10</span><span class="unit">일</span>
          <span class="sub" id="mSub"></span>
        </div>
        <div class="slider-row">
          <label>환율 — 현지 돈 1단위에 몇 원? <output id="mRateOut"></output></label>
          <input type="range" id="mRate" min="100" max="2000" step="50" value="1000" aria-label="환율 슬라이더 (가상 예시)">
        </div>
        <div class="slider-row">
          <label>1일 생활비 — 현지 돈으로 얼마? <output id="mCostOut"></output></label>
          <input type="range" id="mCost" min="10" max="300" step="10" value="100" aria-label="1일 생활비 슬라이더 (가상 예시)">
        </div>
        <p class="m-note">슬라이더 값은 전부 가상의 예시입니다. 진짜 숫자는 네가 직접 모은다. 환율이 유리해도 생활비가 비싸면 날짜가 줄어드는 걸 눈으로 확인해 보자.</p>
      </div>

      ${sectionHead("Research Question", "연구 질문")}
      <div class="key-line">
        <p class="line">${h.researchQuestion}</p>
        <p class="note">${h.purposeLine}<br>— ${h.evaluationLine}</p>
      </div>

      ${sectionHead("5 Countries", "대상 국가", h.countriesNote)}
      <div class="country-grid">
        ${h.countries
          .map(
            (c) => `<div class="country"><span class="cflag">${c.flag}</span><span class="cname">${c.name}</span><br><span class="ccur">${c.currency}</span></div>`
          )
          .join("")}
      </div>
      <article class="card">
        <h3>왜 2005년부터, 20년인가</h3>
        <p class="definition">${h.why2005}</p>
      </article>

      ${sectionHead("Timeline", "전체 일정")}
      <article class="card"><ul class="timeline">${timeline}</ul></article>

      ${sectionHead("This Week", "8월, 이번에 할 일")}
      <article class="card">
        <ul class="week-list">
          ${h.thisWeek.map((w) => `<li><span class="w-date">${w.date}</span><span>${w.task}</span></li>`).join("")}
        </ul>
        <div class="tb-links" style="margin-top:12px">
          <a href="#todo">할 일을 순서대로 자세히 보기 →</a>
          <a href="#three">발표는 3분 — 원고 5장 보기 →</a>
        </div>
      </article>
    `;

    // 공식 머신 동작
    const rate = $("#mRate"), cost = $("#mCost");
    function updateMachine() {
      const r = Number(rate.value), c = Number(cost.value);
      const dayCost = r * c;
      const days = 1000000 / dayCost;
      $("#mDays").textContent = days >= 100 ? Math.round(days) : days.toFixed(1);
      $("#mRateOut").textContent = r.toLocaleString() + "원";
      $("#mCostOut").textContent = c.toLocaleString();
      $("#mSub").textContent = `하루 비용 = ${r.toLocaleString()} × ${c.toLocaleString()} = ${dayCost.toLocaleString()}원 (가상 예시)`;
    }
    rate.addEventListener("input", updateMachine);
    cost.addEventListener("input", updateMachine);
    updateMachine();
  }

  // ───────────── 저장되는 입력란 ─────────────
  // 아이가 적은 내용을 이 기기에 보관한다. 서버로 보내지 않는다.
  function savedField(key, label, placeholder, rows) {
    return `<div class="field">
      <label class="field-label" for="f-${key}">${label}</label>
      <textarea id="f-${key}" data-field="${key}" rows="${rows || 3}" placeholder="${placeholder || ""}"></textarea>
      <span class="field-saved" data-saved-for="${key}"></span>
    </div>`;
  }

  function bindFields(root) {
    root.querySelectorAll("textarea[data-field]").forEach((ta) => {
      const key = "tvi_field_" + ta.dataset.field;
      const mark = root.querySelector(`[data-saved-for="${ta.dataset.field}"]`);
      const stored = localStorage.getItem(key);
      if (stored) {
        ta.value = stored;
        if (mark) mark.textContent = "저장됨";
      }
      let timer = null;
      ta.addEventListener("input", () => {
        localStorage.setItem(key, ta.value);
        if (!mark) return;
        mark.textContent = "저장 중…";
        clearTimeout(timer);
        timer = setTimeout(() => {
          mark.textContent = ta.value.trim() ? "저장됨" : "";
        }, 500);
      });
    });
  }

  // ───────────── 할 일: 시간 순서 ─────────────
  function ddayText(iso) {
    const n = daysUntil(iso);
    if (n > 0) return "D-" + n;
    if (n === 0) return "D-DAY";
    return "끝남";
  }

  function bindChecks(root, onChange) {
    root.querySelectorAll("input[data-check]").forEach((box) => {
      const k = "tvi_check_" + box.dataset.check;
      box.checked = localStorage.getItem(k) === "1";
      box.addEventListener("change", () => {
        localStorage.setItem(k, box.checked ? "1" : "0");
        if (onChange) onChange();
      });
    });
  }

  function renderTodo() {
    const t = CONTENT.todo;
    const nb = t.numbeo;

    const allChecks = [
      ...t.blocks.flatMap((b) => b.checks.map((c) => c.id)),
      ...t.minimum.checks.map((c) => c.id),
    ];

    // 나라별 물가 페이지로 바로 가는 링크. STEP 2와 STEP 4 양쪽에 붙인다.
    const nbLinks = `
      <div class="nb-links">
        ${nb.links
          .map(
            (l) =>
              `<a class="nb-link" href="${l.url}" target="_blank" rel="noopener noreferrer">${l.name}<span class="nb-cur">${l.cur}</span></a>`
          )
          .join("")}
      </div>
      <p class="nb-note">${nb.linksNote}</p>`;

    const ob = nb.observe;
    const guideObserve = `
      <div class="nb-guide">
        <p class="nb-guide-h">${ob.title}</p>
        <p class="definition">${ob.intro}</p>
        ${nbLinks}

        <p class="nb-h">${ob.sectionsTitle}</p>
        <div class="nb-chips">${ob.sections.map((s) => `<span class="nb-chip">${s}</span>`).join("")}</div>

        <p class="nb-h">${ob.lookTitle}</p>
        <ul class="points">
          ${ob.look.map((l) => `<li><strong>${l.t}</strong> — ${l.d}</li>`).join("")}
        </ul>

        <p class="nb-ask">${ob.ask}</p>
      </div>`;

    const co = nb.collect;
    const guideCollect = `
      <div class="nb-guide">
        <p class="nb-guide-h">${co.title}</p>
        ${nbLinks}

        <div class="nb-warn">
          <p class="nb-warn-h">${co.warnTitle}</p>
          <p>${co.warnBody}</p>
          <p class="nb-warn-why">${co.warnWhy}</p>
          <p class="nb-warn-why">${co.yenWarn}</p>
        </div>

        <p class="nb-h">${co.mapTitle}</p>
        <p class="definition">${co.mapBody}</p>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>우리 항목</th><th>묶음</th><th>사이트 표기</th></tr></thead>
          <tbody>${co.mapRows
            .map((r) => `<tr><td><strong>${r[0]}</strong></td><td>${r[1]}</td><td class="nb-en">${r[2]}</td></tr>`)
            .join("")}</tbody>
        </table></div>
        <p class="nb-gotcha">${co.gotcha}</p>

        <p class="nb-h">${co.recordTitle}</p>
        <ul class="points">${co.record.map((i) => `<li>${i}</li>`).join("")}</ul>
        <p class="nb-note">${co.recordNote}</p>
      </div>`;

    const guides = { observe: guideObserve, collect: guideCollect };

    // 아직 다 끝내지 않은 첫 STEP을 "지금 여기"로 표시한다. 날짜가 밀려도 항상 맞는다.
    const blockDone = (b) => b.checks.every((c) => localStorage.getItem("tvi_check_" + c.id) === "1");
    const currentIdx = t.blocks.findIndex((b) => !blockDone(b));

    const blocks = t.blocks
      .map((b, i) => {
        const isNow = i === currentIdx;
        const isDone = blockDone(b);
        return `<article class="card todo-block ${isNow ? "now" : ""} ${isDone ? "past" : ""} ${
          b.deadline ? "deadline" : ""
        }" id="tb-${b.id}">
          <div class="tb-head">
            <span class="tb-date">${b.step}</span>
            ${b.dur ? `<span class="tb-dur">${b.dur}</span>` : ""}
            ${isNow ? '<span class="now-chip">지금 여기</span>' : ""}
            ${isDone ? '<span class="done-chip">완료</span>' : ""}
          </div>
          <h3>${b.title}</h3>
          ${b.why ? `<p class="tb-why">${b.why}</p>` : ""}

          <ol class="tb-steps">
            ${b.steps
              .map((s) => `<li><span class="st-t">${s.t}</span>${s.d ? `<span class="st-d">${s.d}</span>` : ""}</li>`)
              .join("")}
          </ol>

          ${b.guide ? guides[b.guide] : ""}
          ${b.extra ? `<p class="tb-extra">${b.extra}</p>` : ""}
          ${b.done ? `<p class="tb-done"><span>끝난 신호</span>${b.done}</p>` : ""}

          <ul class="check-list tb-checks">
            ${b.checks
              .map((c) => `<li><label><input type="checkbox" data-check="${c.id}"><span class="c-task">${c.text}</span></label></li>`)
              .join("")}
          </ul>

          ${
            b.links
              ? `<div class="tb-links">${b.links.map((l) => `<a href="${l.href}">${l.label} →</a>`).join("")}</div>`
              : ""
          }
        </article>`;
      })
      .join("");

    const view = $("#view-todo");
    view.innerHTML = `
      ${sectionHead("To Do", "발표까지 할 일", t.lead)}

      <div class="deadline-box">
        <p class="dl-label">${t.deadline.label}</p>
        <p class="dl-date">${t.deadline.dateText}</p>
        <p class="dl-dday">${ddayText(t.deadline.date)}</p>
        <p class="dl-note">${t.deadline.note}</p>
      </div>

      <article class="card">
        <div class="ov-grid">
          ${t.overview
            .map(
              (o) => `<div class="ov"><span class="ov-n">${o.n}</span>
                <span class="ov-label">${o.label}</span>
                <span class="ov-when">${o.when}</span>
                <span class="ov-dur">${o.dur}</span></div>`
            )
            .join("")}
        </div>
        <p class="nb-note" style="margin-top:12px">${t.overviewNote}</p>
        <div class="progress-wrap">
          <div class="progress-bar"><span id="tdBar"></span></div>
          <p class="progress-text" id="tdText"></p>
        </div>
      </article>

      ${blocks}

      <article class="card">
        <h3>${t.skip.title}</h3>
        <p class="definition">${t.skip.intro}</p>
        <ul class="points">
          ${t.skip.items.map((i) => `<li><strong>${i.t}</strong> — ${i.d}</li>`).join("")}
        </ul>
      </article>

      <article class="card known">
        <h3>${t.minimum.title}</h3>
        <p class="definition">${t.minimum.intro}</p>
        <ul class="check-list">
          ${t.minimum.checks
            .map((c) => `<li><label><input type="checkbox" data-check="${c.id}"><span class="c-task">${c.text}</span></label></li>`)
            .join("")}
        </ul>
      </article>
    `;

    const done = allChecks.filter((id) => localStorage.getItem("tvi_check_" + id) === "1").length;
    const bar = $("#tdBar");
    if (bar) bar.style.width = Math.round((done / allChecks.length) * 100) + "%";
    const txt = $("#tdText");
    if (txt) txt.textContent = `${allChecks.length}개 중 ${done}개 완료`;

    // 체크가 바뀌면 "지금 여기" 위치도 달라지므로 다시 그린다. 스크롤 위치는 유지.
    bindChecks(view, () => {
      const y = typeof window.scrollY === "number" ? window.scrollY : 0;
      renderTodo();
      window.scrollTo(0, y);
    });
  }

  // ───────────── 설계: 질문으로 정리하기 ─────────────
  function renderDesign() {
    const d = CONTENT.design;

    const blocks = d.blocks
      .map(
        (b) => `<article class="card design-block">
        <div class="db-head"><span class="db-n">${b.n}</span><h3>${b.title}</h3></div>
        <p class="db-why">${b.why}</p>

        <ol class="warmup">
          ${b.warmup.map((w) => `<li>${w}</li>`).join("")}
        </ol>

        <p class="db-core">${b.core}</p>
        ${savedField(b.id, "내 답", b.placeholder, 4)}

        <div class="ws">
          <p class="ws-weak"><span>약한 답</span>${b.weak}</p>
          <p class="ws-strong"><span>강한 답</span>${b.strong}</p>
        </div>

        <details class="hintbox"><summary>막히면 열기</summary><div class="sp-body">${b.hint}</div></details>
      </article>`
      )
      .join("");

    const view = $("#view-design");
    view.innerHTML = `
      ${sectionHead("Design Your Talk", "내 발표 설계하기", d.intro)}
      <article class="card"><p class="definition">${d.howto}</p></article>
      ${blocks}
      <article class="card">
        <h3>다 적었으면</h3>
        <ul class="points">
          <li>‘3분’ 탭을 열어 실제 발표본과 비교해 보자. 다르다고 틀린 게 아니다 — 어디가 왜 다른지가 중요하다.</li>
          <li>여기 적은 답은 그대로 3분 발표 2장(무엇을 만드나)과 4장(왜 하나)의 원고가 된다.</li>
          <li>질문이 깊게 들어올 때를 대비하려면 ‘예시’ 탭의 긴 버전까지 읽어두자.</li>
        </ul>
        <a class="btn-primary" href="#three">3분 발표본 보러 가기</a>
      </article>
    `;
    bindFields(view);
  }

  // ───────────── 3분 발표본 ─────────────
  function renderThree() {
    const t = CONTENT.three;
    const total = t.slides.reduce((a, s) => a + s.sec, 0);
    const mm = Math.floor(total / 60);
    const ss = total % 60;

    // 5장을 초에 비례한 막대로 — 3분이 얼마나 짧은지 눈으로 보이게
    const bar = t.slides
      .map(
        (s) => `<span class="tl-seg p${s.part}" style="flex:${s.sec}">
          <b>${s.n}</b><i>${s.sec}초</i>
        </span>`
      )
      .join("");

    // 평가 항목 두 가지가 각각 어디서 시작하는지 슬라이드 사이에 표시한다
    const partOf = (no) => t.structure.parts.find((p) => p.no === String(no));
    let shownPart = 0;

    const slides = t.slides
      .map((s) => {
        const screen = `<div class="slide-screen">${s.screen
          .map((line) => (line === "" ? '<p class="sc-gap"></p>' : `<p>${line}</p>`))
          .join("")}</div>`;

        const key = s.keyLine
          ? `<div class="ex-key"><p class="line">${s.keyLine}</p><p class="note">${s.keyNote}</p></div>`
          : "";

        let divider = "";
        if (s.part !== shownPart) {
          shownPart = s.part;
          const p = partOf(s.part);
          divider = `<div class="part-divider">
            <span class="pd-no">${p.no}</span>
            <span class="pd-name">${p.name}</span>
            <span class="pd-meta">${p.slides} · ${p.sec}초</span>
          </div>`;
        }

        return `${divider}<article class="card ex-slide ${s.star ? "star" : ""}">
          <div class="slide-head">
            <span class="slide-no">${s.n}장${s.star ? " ★" : ""}</span>
            <span class="slide-title">${s.title}</span>
            <span class="slide-time">${s.sec}초</span>
          </div>

          <p class="ex-label">화면에 넣을 것</p>
          ${screen}

          <p class="ex-label">말할 것</p>
          <blockquote class="ex-script">${s.script}</blockquote>

          ${key}
          <div class="ex-teacher"><span class="et-tag">이 장이 왜 있나</span>${s.why}</div>
          ${s.tip ? `<p class="ex-short"><span>한 가지 더</span>${s.tip}</p>` : ""}
        </article>`;
      })
      .join("");

    const view = $("#view-three");
    view.innerHTML = `
      ${sectionHead("3-Minute Version", "3분 발표본 — 8/26 중간발표", t.lead)}

      <div class="three-hero">
        <p class="th-eyebrow">주어진 시간</p>
        <p class="th-big">3<span>분</span></p>
        <div class="tl-bar">${bar}</div>
        <p class="th-legend">
          ${t.structure.parts
            .map((p) => `<span class="tlg tlg-${p.no}"><b>${p.no}</b> ${p.name} <i>${p.slides}</i></span>`)
            .join("")}
        </p>
        <p class="th-sum">말하는 시간 ${mm}분 ${ss}초 · 슬라이드 ${t.slides.length}장 · 남는 ${180 - total}초는 넘기고 숨 쉬는 시간</p>
      </div>

      <article class="card"><p class="definition">${t.timeNote}</p></article>

      ${sectionHead("Two Required Parts", t.structure.title, t.structure.intro)}
      ${t.structure.parts
        .map(
          (p) => `<article class="card part-card part-${p.no}">
            <div class="pc-head">
              <span class="pc-no">${p.no}</span>
              <div>
                <h3>${p.name}</h3>
                <p class="pc-meta">${p.slides} · ${p.sec}초</p>
              </div>
            </div>
            <p class="ex-label">이 부분이 답해야 하는 질문</p>
            <ul class="pc-asks">${p.asks.map((a) => `<li>${a}</li>`).join("")}</ul>
            <p class="ex-label">우리 발표에서는 여기</p>
            <ul class="points">${p.ours.map((o) => `<li>${o}</li>`).join("")}</ul>
            <div class="ex-teacher"><span class="et-tag">선생님이 보는 것</span>${p.teacher}</div>
            <p class="ex-short"><span>흔한 실수</span>${p.trap}</p>
          </article>`
        )
        .join("")}
      <article class="card">
        <p class="definition">${t.structure.balance}</p>
        <p class="definition" style="margin-top:10px">${t.structure.advice}</p>
      </article>

      ${sectionHead("This Week", t.prep.title, t.prep.intro)}
      <article class="card">
        <ol class="prep-list">
          ${t.prep.items
            .map(
              (p) => `<li>
                <p class="prep-t">${p.t}<span class="prep-dur">${p.dur}</span></p>
                <p class="prep-d">${p.d}</p>
              </li>`
            )
            .join("")}
        </ol>
        <p class="prep-note">${t.prep.note}</p>
      </article>

      <div class="key-line">
        <p class="kl-label">${t.onePoint.label}</p>
        <p class="line">${t.onePoint.line}</p>
        <p class="note">${t.onePoint.why}</p>
      </div>

      <article class="card">
        <h3>${t.rule.title}</h3>
        <ul class="points">
          ${t.rule.items.map((r) => `<li><b>${r.t}</b> — ${r.d}</li>`).join("")}
        </ul>
      </article>

      ${sectionHead("Slides", "슬라이드 5장", "‘화면에 넣을 것’을 그대로 옮기고, 이름과 캡처만 네 것으로 바꾸면 된다. ★ 세 장은 화면을 안 보고도 말할 수 있어야 하는 장이다 — 나머지 둘은 화면을 보며 말해도 괜찮다.")}
      ${slides}

      <article class="card">
        <h3>${t.make.title}</h3>
        <ul class="points">
          ${t.make.items.map((m) => `<li><b>${m.t}</b> — ${m.d}</li>`).join("")}
        </ul>
      </article>

      ${sectionHead("Held in Reserve", t.dropped.title, t.dropped.intro)}
      <article class="card">
        <ul class="points">
          ${t.dropped.items.map((d) => `<li><b>${d.t}</b> — ${d.d}</li>`).join("")}
        </ul>
        <p class="prep-note">${t.dropped.note}</p>
        <a class="btn-primary" href="#example">긴 버전(8장) 보러 가기</a>
      </article>

      ${sectionHead("Q&A", "예상 질문과 답", t.qna.intro)}
      ${t.qna.items
        .map(
          (q) => `<article class="card qna">
            <p class="qna-q">${q.q}</p>
            <p class="qna-a">${q.a}</p>
            ${q.note ? `<p class="qna-note">${q.note}</p>` : ""}
          </article>`
        )
        .join("")}
      <article class="card"><p class="definition">${t.qna.more}</p></article>

      <div class="warnbox">
        <b>${t.confirm.title}</b>
        <ul class="points" style="margin-top:8px">
          ${t.confirm.items.map((c) => `<li><b>${c.t}</b> — ${c.d}</li>`).join("")}
        </ul>
      </div>

      ${sectionHead("Before You Present", t.check.title)}
      <article class="card">
        <ul class="check-list">
          ${t.check.items
            .map(
              (c) => `<li><label><input type="checkbox" data-check="${c.id}"><span class="c-task">${c.text}</span></label></li>`
            )
            .join("")}
        </ul>
      </article>
    `;

    view.querySelectorAll("input[data-check]").forEach((box) => {
      const k = "tvi_check_" + box.dataset.check;
      box.checked = localStorage.getItem(k) === "1";
      box.addEventListener("change", () => localStorage.setItem(k, box.checked ? "1" : "0"));
    });
  }

  // ───────────── 예시: 완성본 수준 발표안 ─────────────
  function renderExample() {
    const e = CONTENT.example;
    const totalSecAll = e.slides.reduce((a, s) => a + s.sec, 0);
    const totalMin = Math.floor(totalSecAll / 60);
    const totalSec = totalSecAll % 60;

    const slides = e.slides
      .map((s) => {
        const screen = `<div class="slide-screen">${s.screen
          .map((line) => (line === "" ? '<p class="sc-gap"></p>' : `<p>${line}</p>`))
          .join("")}</div>`;

        const key = s.keyLine
          ? `<div class="ex-key"><p class="line">${s.keyLine}</p><p class="note">${s.keyNote}</p></div>`
          : "";

        const blanks = s.blanks
          ? s.blanks
              .map(
                (b) => `<div class="blank">
                  <p class="blank-title">채워야 할 칸 — ${b.label}</p>
                  <p class="blank-hint">${b.hint}</p>
                  ${savedField(b.id, "내가 채운 내용", "", 3)}
                </div>`
              )
              .join("")
          : "";

        return `<article class="card ex-slide ${s.star ? "star" : ""}">
          <div class="slide-head">
            <span class="slide-no">${s.n}장${s.star ? " ★" : ""}</span>
            <span class="slide-title">${s.title}</span>
            <span class="slide-time">${s.sec}초</span>
          </div>

          <p class="ex-label">화면에 넣을 것</p>
          ${screen}

          <p class="ex-label">말할 것</p>
          <blockquote class="ex-script">${s.script}${
            s.script2 ? `<span class="script-break"></span>${s.script2}` : ""
          }</blockquote>

          ${key}
          ${blanks}

          <div class="ex-teacher"><span class="et-tag">선생님이 보는 것</span>${s.teacher}</div>
          ${s.qHint ? `<div class="ex-qhint">${s.qHint}</div>` : ""}
          <p class="ex-short"><span>짧게 갈 때</span>${s.short}</p>
        </article>`;
      })
      .join("");

    const view = $("#view-example");
    view.innerHTML = `
      ${sectionHead("Worked Example", "예시 발표 — 8/26 중간발표", e.lead)}

      <div class="ex-cover">
        <p class="ex-cover-title">${e.titleLine}</p>
        <p class="ex-cover-sub">${e.subtitleLine}</p>
        <p class="ex-cover-time">전체 ${e.slides.length}장 · 목표 ${totalMin}분 ${totalSec}초</p>
      </div>

      <article class="card">
        <h3>시간 배분</h3>
        <p class="definition">${e.timeNote}</p>
        <p class="definition" style="margin-top:8px">${e.timeAdvice}</p>
      </article>

      <div class="warnbox">${e.warn}</div>

      ${slides}

      ${sectionHead("Q&A", "예상 질문과 답", e.qna.intro)}
      ${e.qna.items
        .map(
          (q) => `<article class="card qna">
            <p class="qna-q">${q.q}</p>
            <p class="qna-a">${q.a}</p>
            ${q.note ? `<p class="qna-note">${q.note}</p>` : ""}
          </article>`
        )
        .join("")}

      ${sectionHead("Before You Present", "발표 전 마지막 점검")}
      <article class="card">
        <ul class="check-list">
          ${e.checklist
            .map(
              (c) => `<li><label><input type="checkbox" data-check="${c.id}"><span class="c-task">${c.text}</span></label></li>`
            )
            .join("")}
        </ul>
      </article>
    `;

    bindFields(view);
    view.querySelectorAll("input[data-check]").forEach((box) => {
      const k = "tvi_check_" + box.dataset.check;
      box.checked = localStorage.getItem(k) === "1";
      box.addEventListener("change", () => localStorage.setItem(k, box.checked ? "1" : "0"));
    });
  }

  // ───────────── 발표 ─────────────
  function renderPresentation() {
    const p = CONTENT.presentation;

    const slides = p.slides
      .map(
        (s) => `<article class="card slide-card ${s.star ? "star" : ""}">
        <div class="slide-head">
          <span class="slide-no">${s.n}장${s.star ? " ★" : ""}</span>
          <span class="slide-title">${s.title}</span>
          <span class="slide-time">${s.time}</span>
        </div>
        <ul class="points">${s.points.map((pt) => `<li>${pt}</li>`).join("")}</ul>
        ${s.say ? `<div class="slide-say">🗣️ ${s.say}</div>` : ""}
        ${s.tip ? `<div class="slide-tip">${s.tip}</div>` : ""}
        ${s.lockedRef ? `<div class="slide-tip">${s.lockedRef}</div>` : ""}
      </article>`
      )
      .join("");

    $("#view-pt").innerHTML = `
      ${sectionHead("Midterm · 8/26", "중간발표 지도", "발표에 무엇이 왜 들어가는지를 8장짜리 긴 버전으로 풀어놓은 지도다. ★ 표시(5·6·7장)가 이 발표의 차별점이다.")}

      <article class="card known">
        <h3>이 탭은 참조용이다</h3>
        <p class="definition">8/26 발표 시간은 3분이라 실제로 쓸 원고는 <a href="#three">3분</a> 탭에 있다. 여기는 각 장에 무엇이 들어가고 왜 그런지를 설명하는 지도고, 10월 최종발표와 질문 대비에 쓴다. 준비 순서는 <a href="#design">설계</a> 탭에서 내 답을 먼저 적고 → <a href="#three">3분</a> 탭으로 슬라이드를 만들고 → 여기와 <a href="#example">예시</a> 탭으로 질문에 대비하는 것이 빠르다.</p>
      </article>

      <article class="card">
        <h3>발표 형식</h3>
        <ul class="points">${p.format.map((f) => `<li>${f}</li>`).join("")}</ul>
      </article>

      <div class="key-line">
        <p class="line">${p.keyLine}</p>
        <p class="note">${p.keyLineNote}</p>
      </div>

      ${slides}

      ${sectionHead("Rehearsal", "리허설 — 세 번")}
      <article class="card">
        <ul class="points">
          ${p.rehearsal.map((r) => `<li><strong>${r.round}</strong> — ${r.goal}</li>`).join("")}
        </ul>
        <h3 style="margin-top:14px">마지막 점검 세 가지</h3>
        <ul class="points">${p.finalChecks.map((c) => `<li>${c}</li>`).join("")}</ul>
        <div class="slide-tip">${p.aiAnswerHint}</div>
      </article>
    `;
  }

  // ───────────── 컴퓨터 / 경제 ─────────────
  function renderComputer() {
    const c = CONTENT.computer;
    $("#view-computer").innerHTML =
      sectionHead("Computer Basics", "컴퓨터 기초", c.intro) + c.cards.map(conceptCard).join("");
  }

  function renderEconomy() {
    const e = CONTENT.economy;
    $("#view-economy").innerHTML =
      sectionHead("Economics Basics", "경제 기초", e.intro) + e.cards.map(conceptCard).join("");
  }

  // ───────────── 데이터 ─────────────
  function renderData() {
    const d = CONTENT.data;

    $("#view-data").innerHTML = `
      ${sectionHead("Data Story", "데이터 이야기", d.intro)}

      <article class="card">
        <h3>네 종류의 데이터, 네 곳의 출처</h3>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>데이터</th><th>출처</th><th>방법</th><th>메모</th></tr></thead>
          <tbody>${d.sources
            .map((s) => `<tr><td><strong>${s.data}</strong></td><td>${s.source}</td><td>${s.how}</td><td>${s.note}</td></tr>`)
            .join("")}</tbody>
        </table></div>
      </article>

      ${d.judgments
        .map((j) => `<article class="card"><h3>${j.title}</h3><p class="definition">${j.body}</p></article>`)
        .join("")}

      <article class="card">
        <h3>${d.habit.title}</h3>
        <ul class="points">${d.habit.items.map((i) => `<li>${i}</li>`).join("")}</ul>
        <p class="definition" style="margin-top:8px">${d.habit.why}</p>
      </article>

      <article class="card">
        <h3>${d.fourQuestions.title}</h3>
        <ul class="points">${d.fourQuestions.items.map((i) => `<li>${i}</li>`).join("")}</ul>
        <p class="definition" style="margin-top:8px">${d.fourQuestions.note}</p>
      </article>

      ${sectionHead("Discovery Mission", d.mission.title)}
      <article class="card">
        <p class="definition">${d.mission.intro}</p>
        <div class="nb-links">
          ${CONTENT.todo.numbeo.links
            .map(
              (l) =>
                `<a class="nb-link" href="${l.url}" target="_blank" rel="noopener noreferrer">${l.name}<span class="nb-cur">${l.cur}</span></a>`
            )
            .join("")}
        </div>
        <p class="nb-note">사용법은 <a href="#todo">할일 탭</a>의 STEP 2·4 안에 있다.</p>
        <ul class="points">${d.mission.guideQuestions.map((q) => `<li>${q}</li>`).join("")}</ul>
        <p class="spoiler-warning" style="margin-top:12px">${d.mission.spoilerWarning}</p>
        ${d.mission.spoilers
          .map((s) => `<details class="spoiler"><summary>${s.q}</summary><div class="sp-body">${s.body}</div></details>`)
          .join("")}
      </article>

      <article class="card known">
        <h3>${d.mission.known.title}</h3>
        <p class="definition">${d.mission.known.body}</p>
      </article>

      <article class="card">
        <h3>${d.mission.collectItems.title}</h3>
        <ul class="points">${d.mission.collectItems.items.map((i) => `<li>${i}</li>`).join("")}</ul>
        <p class="definition" style="margin-top:8px">잊지 말 것: 조회 날짜 · 출처 URL · 통화 단위를 함께 기록한다.</p>
      </article>
    `;
  }

  // ───────────── 퀴즈 ─────────────
  const quizState = { set: null, order: [], idx: 0, score: 0, wrong: [], answered: false };

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function renderQuizMenu() {
    const view = $("#view-quiz");
    view.innerHTML = `
      ${sectionHead("Quiz", "퀴즈", "점수보다 ‘어떤 걸 모르는지 확인하는 것’이 목적이다. 배우기 전과 후에 풀어보면 차이가 보인다.")}
      <div class="quiz-sets">
        ${CONTENT.quizSets
          .map((s) => {
            const count = QUESTIONS.filter(s.filter).length;
            const best = localStorage.getItem("tvi_quiz_best_" + s.id);
            return `<button class="quiz-set-btn" data-set="${s.id}">
              <span class="qs-label">${s.label}</span>
              <span class="qs-desc">${s.desc}</span>
              <span class="qs-meta">${count}문항${best !== null ? " · 최고 " + best + "/" + count : ""}</span>
            </button>`;
          })
          .join("")}
      </div>
    `;
    view.querySelectorAll(".quiz-set-btn").forEach((btn) => {
      btn.addEventListener("click", () => startQuiz(btn.dataset.set));
    });
  }

  function startQuiz(setId) {
    const set = CONTENT.quizSets.find((s) => s.id === setId);
    quizState.set = set;
    quizState.order = shuffle(QUESTIONS.filter(set.filter));
    quizState.idx = 0;
    quizState.score = 0;
    quizState.wrong = [];
    renderQuestion();
  }

  function renderQuestion() {
    const view = $("#view-quiz");
    const q = quizState.order[quizState.idx];
    quizState.answered = false;

    // 보기 순서 섞기 (정답 위치가 늘 같지 않도록)
    const idxs = shuffle(q.choices.map((_, i) => i));

    view.innerHTML = `
      <div class="quiz-top">
        <span class="quiz-progress">${quizState.set.label} · ${quizState.idx + 1} / ${quizState.order.length}</span>
        <button class="quiz-quit" id="quizQuit">그만하기</button>
      </div>
      <article class="card">
        <p class="q-topic">${q.topic}</p>
        <p class="q-text">${q.question}</p>
        <div class="choices">
          ${idxs
            .map((orig) => `<button class="choice-btn" data-orig="${orig}">${q.choices[orig]}</button>`)
            .join("")}
        </div>
        <div id="qExplain"></div>
        <div id="qNextWrap"></div>
      </article>
    `;

    $("#quizQuit").addEventListener("click", renderQuizMenu);

    view.querySelectorAll(".choice-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (quizState.answered) return;
        quizState.answered = true;
        const picked = Number(btn.dataset.orig);
        const correct = picked === q.answer;
        if (correct) quizState.score++;
        else quizState.wrong.push(q);

        view.querySelectorAll(".choice-btn").forEach((b) => {
          b.disabled = true;
          const o = Number(b.dataset.orig);
          if (o === q.answer) b.classList.add("correct");
          else if (o === picked) b.classList.add("wrong");
        });

        $("#qExplain").innerHTML = `<div class="q-explain">
          <p class="verdict ${correct ? "ok" : "no"}">${correct ? "맞았다!" : "아니다 — 정답은 초록색 보기."}</p>
          <p>${q.explanation}</p>
        </div>`;

        const last = quizState.idx + 1 >= quizState.order.length;
        $("#qNextWrap").innerHTML = `<button class="btn-primary" id="qNext">${last ? "결과 보기" : "다음 문제"}</button>`;
        $("#qNext").addEventListener("click", () => {
          if (last) renderQuizResult();
          else {
            quizState.idx++;
            renderQuestion();
            window.scrollTo(0, 0);
          }
        });
        $("#qNext").focus();
      });
    });
  }

  function renderQuizResult() {
    const view = $("#view-quiz");
    const total = quizState.order.length;
    const score = quizState.score;

    const bestKey = "tvi_quiz_best_" + quizState.set.id;
    const prevBest = Number(localStorage.getItem(bestKey) || -1);
    if (score > prevBest) localStorage.setItem(bestKey, String(score));

    let msg;
    const ratio = score / total;
    if (ratio === 1) msg = "전부 맞았다. 이제 이 내용을 ‘내 말로’ 설명할 수 있는지 확인해 보자 — 발표는 말로 한다.";
    else if (ratio >= 0.7) msg = "좋은 흐름. 틀린 문제의 해설을 읽는 것이 오늘의 진짜 공부다.";
    else msg = "괜찮다 — 모르는 걸 확인하는 게 이 퀴즈의 목적이다. 틀린 문제를 아래에서 다시 보고, 배운 뒤 또 풀면 오르는 게 보인다.";

    view.innerHTML = `
      ${sectionHead("Result", quizState.set.label + " 세트 결과")}
      <article class="card">
        <div class="quiz-result-score"><span class="num">${score}</span><span class="den"> / ${total}</span></div>
        <p class="quiz-result-msg">${msg}</p>
        ${
          quizState.wrong.length
            ? `<div class="wrong-review"><h4>틀린 문제 다시 보기 (${quizState.wrong.length})</h4><ol>${quizState.wrong
                .map((w) => `<li>${w.question}<br><span class="wr-a">→ ${w.choices[w.answer]}</span></li>`)
                .join("")}</ol></div>`
            : ""
        }
        <button class="btn-primary" id="quizAgain">다른 세트 풀기</button>
      </article>
    `;
    $("#quizAgain").addEventListener("click", renderQuizMenu);
  }

  // ───────────── 시작 ─────────────
  initTheme();
  initDday();
  renderHome();
  renderTodo();
  renderThree();
  renderDesign();
  renderExample();
  renderPresentation();
  renderComputer();
  renderEconomy();
  renderData();
  renderQuizMenu();

  window.addEventListener("hashchange", route);
  route();
})();
