/* ============================================================
   English Placement Test — منطق الامتحان التدريجي (6 مراحل)
   Bashar Karkinly — Support Channel
   يعتمد على localStorage الحقيقي بمتصفح المستخدم.
   ملاحظة: التسجيل/الحفظ حالياً Placeholder محلي فقط — سيُربط
   لاحقاً بـ Cloudflare D1 + Workers كخطوة منفصلة.
   ============================================================ */

const RESULT_KEY = "eng_placement_result_v1";
const STAGE_PASS_THRESHOLD = 80; // % مطلوبة لاجتياز كل مرحلة والانتقال للي بعدها
const QUESTIONS_PER_STAGE = 16;  // عدد الأسئلة اللي تُسحب عشوائياً من بنك كل مرحلة بكل محاولة

/* ---------- أدوات مساعدة عامة ---------- */
function shuffle(arr){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function saveLocalResult(data){
  try{ localStorage.setItem(RESULT_KEY, JSON.stringify(data)); }catch(e){ /* تجاهل بصمت */ }
}
function loadLocalResult(){
  try{
    const raw = localStorage.getItem(RESULT_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}

/* ============================================================
   محرك المراحل الرئيسي
   stages = [{ key:"a1", label:"A1", title:"...", pool: A1_POOL }, ...]
   ============================================================ */
function renderPlacementTest(containerId, stages, opts){
  const container = document.getElementById(containerId);
  opts = opts || {};
  let stageIndex = 0;
  const stageResults = []; // {key,label,scorePercent,passed}

  renderStageTrack();
  runStage(stageIndex);

  function renderStageTrack(){
    let track = document.getElementById("stage-track");
    if(!track){
      track = document.createElement("div");
      track.className = "stage-track";
      track.id = "stage-track";
      container.parentNode.insertBefore(track, container);
    }
    track.innerHTML = stages.map((s, i) => {
      const res = stageResults[i];
      let cls = "stage-pill";
      let label = s.label;
      if(res){ cls += res.passed ? " done" : " failed"; label = s.label + (res.passed ? " ✓" : " ✕"); }
      else if(i === stageIndex){ cls += " current"; label = s.label + " (جاري الآن)"; }
      return `<span class="${cls}">${label}</span>`;
    }).join("");
  }

  function runStage(idx){
    if(idx >= stages.length){
      finishAll();
      return;
    }
    const stage = stages[idx];
    let answered = 0, earned = 0, submitted = false;
    const sampleSize = Math.min(QUESTIONS_PER_STAGE, stage.pool.length);
    const items = shuffle(stage.pool).slice(0, sampleSize).map(q => prepQuestion(q));

    container.innerHTML = "";

    const banner = document.createElement("div");
    banner.className = "quiz-meta sticky-bar";
    banner.innerHTML = `
      <span>مرحلة <b>${stage.label}</b> — السؤال <b id="stg-answered">0</b> من <b>${items.length}</b></span>
      <div class="progress-bar-track"><div class="progress-bar-fill" id="stg-bar"></div></div>
      <span class="stage-timer">⏱ <b id="stg-timer">05:00</b></span>
      <span>محتاج <b>${STAGE_PASS_THRESHOLD}%</b> فأكثر للانتقال للمرحلة يلي بعدها</span>
    `;
    container.appendChild(banner);

    const list = document.createElement("div");
    container.appendChild(list);

    items.forEach((q, i) => {
      list.appendChild(buildQuestionCard(q, i, (fraction) => {
        if(submitted) return;
        answered += 1;
        earned += fraction;
        document.getElementById("stg-answered").textContent = answered;
        document.getElementById("stg-bar").style.width = (answered / items.length * 100) + "%";
        if(answered === items.length){
          submitBtn.disabled = false;
        }
      }));
    });

    const submitWrap = document.createElement("div");
    submitWrap.style.textAlign = "center";
    submitWrap.style.marginTop = "14px";
    submitWrap.innerHTML = `<button class="btn btn-primary" id="stg-submit" disabled>سلّم المرحلة وشوف نتيجتها</button>`;
    container.appendChild(submitWrap);
    const submitBtn = document.getElementById("stg-submit");

    /* ---------- تايمر 5 دقايق لكل مرحلة ---------- */
    const STAGE_SECONDS = 5 * 60;
    let remaining = STAGE_SECONDS;
    const timerEl = document.getElementById("stg-timer");
    const timerInterval = setInterval(() => {
      remaining -= 1;
      const m = String(Math.floor(remaining / 60)).padStart(2, "0");
      const s = String(remaining % 60).padStart(2, "0");
      timerEl.textContent = `${m}:${s}`;
      if(remaining <= 30) timerEl.parentElement.classList.add("stage-timer-warn");
      if(remaining <= 0){
        clearInterval(timerInterval);
        submitStage(true);
      }
    }, 1000);

    submitBtn.addEventListener("click", () => submitStage(false));

    function submitStage(timeUp){
      if(submitted) return;
      submitted = true;
      clearInterval(timerInterval);
      const scorePercent = Math.round((earned / items.length) * 100);
      const passed = scorePercent >= STAGE_PASS_THRESHOLD;
      stageResults.push({ key: stage.key, label: stage.label, scorePercent, passed });
      renderStageTrack();
      if(passed && idx < stages.length - 1){
        stageIndex = idx + 1;
        showStageTransition(stage, scorePercent, () => runStage(stageIndex), timeUp);
      } else {
        finishAll();
      }
    }
  }

  function showStageTransition(stage, scorePercent, onContinue, timeUp){
    container.innerHTML = `
      <div class="result-card">
        <div class="result-stamp pass">${scorePercent}%</div>
        <h2>ناجح بمرحلة ${stage.label} 🎉</h2>
        ${timeUp ? `<p style="color:var(--amber-dark); font-weight:700;">خلص الوقت (5 دقايق) قبل ما تجاوب كل الأسئلة، بس نتيجتك كانت كافية للنجاح!</p>` : ""}
        <p>ماشي منيح! جاي دورك على المرحلة يلي بعدها.</p>
        <div class="cta-row" style="justify-content:center; display:flex;">
          <button class="btn btn-primary" id="continue-btn">كمّل عالمرحلة الجاية</button>
        </div>
      </div>
    `;
    document.getElementById("continue-btn").addEventListener("click", onContinue);
  }

  function finishAll(){
    // منطق صحيح: "مستواك" = وين لازم تبلش تتعلم، مش آخر مستوى نجحت فيه.
    // يعني: أول مستوى فشل فيه = نقطة البداية بالدراسة. آخر مستوى نجح فيه (لو وجد) = خلص وتجاوزه.
    const lastResult = stageResults[stageResults.length - 1];
    const passedStages = stageResults.filter(r => r.passed);
    let masteredLevel = null, startLevel = null, completedAll = false;

    if(lastResult.passed){
      // نجح بكل المراحل لغاية آخرها (C2) — خلص المستويات كلها
      completedAll = true;
      masteredLevel = lastResult.label;
    } else {
      startLevel = lastResult.label; // هوّ المستوى يلي لازم يبلش يدرسه
      const passedBefore = passedStages.filter(r => r.key !== lastResult.key);
      masteredLevel = passedBefore.length ? passedBefore[passedBefore.length - 1].label : null;
    }

    const data = { stageResults, masteredLevel, startLevel, completedAll, date: new Date().toISOString() };
    saveLocalResult(data);
    renderFinalLevelResult(container, data, opts);
  }
}

function prepQuestion(q){
  const clone = {...q};
  if(clone.type === "mcq"){
    const correctText = clone.options[clone.answerIndex];
    const shuffled = shuffle(clone.options);
    clone.options = shuffled;
    clone.answerIndex = shuffled.indexOf(correctText);
  }
  if(clone.type === "match"){
    clone.pairs = clone.pairs.map((p, i) => ({...p, id: i}));
  }
  return clone;
}

/* ---------- بناء بطاقة سؤال واحدة (mcq / tf / fill / match) ---------- */
function buildQuestionCard(q, idx, onAnswered){
  // onAnswered(fraction) — fraction بين 0 و1 لتمثيل مدى صحة الإجابة (يسمح بدرجة جزئية لأسئلة match)
  const card = document.createElement("div");
  card.className = "question-card";

  const tagMap = {
    mcq:["Grammar","mcq"], tf:["True / False","tf"], fill:["Fill the Gap","fill"],
    match:["مفردات — وصل","vocab"], reading:["Reading","mcq"], underline:["Find the Mistake","tf"]
  };
  const [tagLabel, tagClass] = tagMap[q.type] || ["سؤال","mcq"];

  card.innerHTML = `
    <span class="q-tag ${tagClass}">${tagLabel} · سؤال ${idx + 1}</span>
    ${q.type === "reading" ? `<div class="passage-box">${q.passage}</div>` : ""}
    <p class="q-text en-content">${q.question}</p>
  `;

  const feedback = document.createElement("div");
  feedback.className = "feedback";

  if(q.type === "mcq" || q.type === "reading"){
    const list = document.createElement("div");
    list.className = "opt-list en-content";
    q.options.forEach((opt, i) => {
      const el = document.createElement("label");
      el.className = "opt";
      el.innerHTML = `<input type="radio" name="q-${idx}-${Math.random()}"> <span>${opt}</span>`;
      el.addEventListener("click", () => {
        if(el.classList.contains("locked-answer")) return;
        Array.from(list.children).forEach(c => c.classList.add("locked-answer"));
        const isCorrect = i === q.answerIndex;
        el.classList.add("selected", isCorrect ? "correct" : "wrong");
        if(!isCorrect) list.children[q.answerIndex].classList.add("correct");
        showFeedback(feedback, isCorrect, q.explanation);
        onAnswered(isCorrect ? 1 : 0);
      });
      list.appendChild(el);
    });
    card.appendChild(list);
  }

  if(q.type === "tf"){
    const list = document.createElement("div");
    list.className = "opt-list en-content";
    ["صح", "خطأ"].forEach((label, i) => {
      const boolVal = i === 0;
      const el = document.createElement("label");
      el.className = "opt";
      el.innerHTML = `<input type="radio" name="tf-${idx}-${Math.random()}"> <span>${label}</span>`;
      el.addEventListener("click", () => {
        if(el.classList.contains("locked-answer")) return;
        Array.from(list.children).forEach(c => c.classList.add("locked-answer"));
        const isCorrect = boolVal === q.answer;
        el.classList.add("selected", isCorrect ? "correct" : "wrong");
        const correctIdx = q.answer ? 0 : 1;
        list.children[correctIdx].classList.add("correct");
        showFeedback(feedback, isCorrect, q.explanation);
        onAnswered(isCorrect ? 1 : 0);
      });
      list.appendChild(el);
    });
    card.appendChild(list);
  }

  if(q.type === "fill"){
    const input = document.createElement("input");
    input.type = "text";
    input.className = "fill-input en-content";
    input.style.direction = "ltr";
    input.style.textAlign = "left";
    input.placeholder = "اكتب إجابتك هون...";
    const btn = document.createElement("button");
    btn.className = "check-btn";
    btn.textContent = "تحقق من إجابتي";
    btn.addEventListener("click", () => {
      if(btn.disabled) return;
      const userVal = input.value.trim().toLowerCase();
      const isCorrect = q.acceptable.some(a => a.toLowerCase() === userVal);
      input.classList.add(isCorrect ? "correct" : "wrong");
      input.disabled = true;
      btn.disabled = true;
      showFeedback(feedback, isCorrect, q.explanation, isCorrect ? null : q.acceptable[0]);
      onAnswered(isCorrect ? 1 : 0);
    });
    card.appendChild(input);
    card.appendChild(btn);
  }

  if(q.type === "underline"){
    card.appendChild(buildUnderlineQuestion(q, onAnswered, feedback));
  }

  if(q.type === "match"){
    card.appendChild(buildInlineMatch(q, onAnswered));
  }

  card.appendChild(feedback);
  return card;
}

/* ---------- سؤال "حدد الكلمة الخاطئة" داخل نص/فقرة ---------- */
function buildUnderlineQuestion(q, onAnswered, feedback){
  const wrap = document.createElement("div");
  wrap.className = "passage-box";

  let html = q.text;
  q.words.forEach((w, i) => {
    html = html.replace(`{${i}}`, `<span class="underline-word" data-i="${i}">${w}</span>`);
  });
  wrap.innerHTML = html;

  let locked = false;
  wrap.querySelectorAll(".underline-word").forEach(span => {
    span.addEventListener("click", () => {
      if(locked) return;
      locked = true;
      const i = Number(span.dataset.i);
      const isCorrect = i === q.wrongIndex;
      span.classList.add(isCorrect ? "selected-wrong" : "selected-right");
      if(!isCorrect){
        wrap.querySelector(`.underline-word[data-i="${q.wrongIndex}"]`).classList.add("reveal-correct");
      }
      showFeedback(feedback, isCorrect, q.explanation);
      onAnswered(isCorrect ? 1 : 0);
    });
  });

  return wrap;
}

/* ---------- سؤال المفردات: وصل الأعمدة (4 كلمات مقابل 5 معاني — فيها تشتيت) ---------- */
function buildInlineMatch(q, onAnswered){
  const wrap = document.createElement("div");
  wrap.className = "match-wrap inline";

  const leftData = q.pairs.map((p, i) => ({ id: i, text: p.left, status: "pending" }));
  const rightData = shuffle([
    ...q.pairs.map((p, i) => ({ id: i, text: p.right, status: "pending" })),
    { id: -1, text: q.decoy, status: "pending" }
  ]);
  const leftShuffled = shuffle(leftData);

  let selectedLeft = null, selectedRight = null;
  let matchedCount = 0;
  const total = leftData.length;

  wrap.innerHTML = `
    <div class="match-col"><h4>English</h4><div class="m-left"></div></div>
    <div class="match-col"><h4>المعنى بالعربي</h4><div class="m-right"></div></div>
  `;
  const leftEl = wrap.querySelector(".m-left");
  const rightEl = wrap.querySelector(".m-right");

  const status = document.createElement("div");
  status.className = "match-status";
  status.style.marginTop = "10px";
  status.textContent = `0 من ${total} تطابقات صحيحة`;

  leftShuffled.forEach(item => {
    const el = document.createElement("div");
    el.className = "match-item";
    el.textContent = item.text;
    el.addEventListener("click", () => handleLeftClick(el, item));
    leftEl.appendChild(el);
  });
  rightData.forEach(item => {
    const el = document.createElement("div");
    el.className = "match-item";
    el.textContent = item.text;
    el.addEventListener("click", () => handleRightClick(el, item));
    rightEl.appendChild(el);
  });

  function handleLeftClick(el, item){
    if(item.status !== "pending") return; // متعلّم (أخضر) أو مثبّت غلط (أحمر) — ما فيه تعديل
    Array.from(leftEl.children).forEach(c => c.classList.remove("selected"));
    if(selectedLeft && selectedLeft.item === item){ selectedLeft = null; return; }
    el.classList.add("selected");
    selectedLeft = { el, item };
    tryMatch();
  }
  function handleRightClick(el, item){
    if(item.status !== "pending") return;
    Array.from(rightEl.children).forEach(c => c.classList.remove("selected"));
    if(selectedRight && selectedRight.item === item){ selectedRight = null; return; }
    el.classList.add("selected");
    selectedRight = { el, item };
    tryMatch();
  }

  function tryMatch(){
    if(!selectedLeft || !selectedRight) return;
    const isCorrect = selectedLeft.item.id === selectedRight.item.id;
    if(isCorrect){
      selectedLeft.item.status = "matched";
      selectedRight.item.status = "matched";
      selectedLeft.el.classList.remove("selected");
      selectedRight.el.classList.remove("selected");
      selectedLeft.el.classList.add("matched");
      selectedRight.el.classList.add("matched");
      matchedCount++;
      status.textContent = `${matchedCount} من ${total} تطابقات صحيحة`;
    } else {
      // الكلمة (الطرف الإنكليزي) تتثبّت غلط نهائياً بالأحمر — ما فيها تعديل بعدها
      selectedLeft.item.status = "wrong";
      selectedLeft.el.classList.remove("selected");
      selectedLeft.el.classList.add("wrong-locked", "shake");
      // طرف المعنى يرجع متاح لأنه ممكن يكون الجواب الصحيح لكلمة تانية لسا معلّقة
      selectedRight.item.status = "pending";
      selectedRight.el.classList.remove("selected");
    }
    selectedLeft = null; selectedRight = null;
    checkFinished();
  }

  function checkFinished(){
    const stillPending = leftData.some(item => item.status === "pending");
    if(!stillPending){
      const fraction = matchedCount / total;
      status.innerHTML = `✓ خلصت! (${matchedCount}/${total} صح) — النتيجة: ${Math.round(fraction * 100)}%`;
      onAnswered(fraction);
    }
  }

  wrap.appendChild(status);
  return wrap;
}

function showFeedback(el, isCorrect, explanation, correctAnswerHint){
  el.classList.add("show", isCorrect ? "ok" : "no");
  const icon = isCorrect ? "✓" : "✕";
  const lead = isCorrect ? "صحيح!" : "مو هيك بالضبط.";
  const hint = correctAnswerHint ? ` الإجابة المتوقعة: «${correctAnswerHint}».` : "";
  el.innerHTML = `<span>${icon}</span><span class="fb-body"><b>${lead}</b> ${explanation || ""}${hint}</span>`;
}

/* ---------- شاشة النتيجة النهائية لتحديد المستوى ---------- */
function renderFinalLevelResult(container, data, opts){
  let track = document.getElementById("stage-track");
  if(track) track.remove();
  container.innerHTML = "";

  let badgeText, headline, subline;
  if(data.completedAll){
    badgeText = data.masteredLevel;
    headline = `ماشالله! خلصت أعلى مستوى — ${data.masteredLevel} 🎉`;
    subline = "أنت متجاوز كل المستويات الست لغاية C2 — إنكليزيتك بمستوى متقدم جداً.";
  } else if(data.masteredLevel){
    badgeText = data.startLevel;
    headline = `أنت متجاوز مستوى ${data.masteredLevel} ✅`;
    subline = `يعني بتعرف مادة ${data.masteredLevel} منيح، وما في داعي تدرسها من الصفر. لازم تبلش تعلمك من مستوى <b>${data.startLevel}</b> — هوّ يلي لسا لازم تشتغل عليه.`;
  } else {
    badgeText = data.startLevel;
    headline = `بلّش من مستوى ${data.startLevel}`;
    subline = `هاد أول مستوى بالإنكليزي، وهوّ نقطة انطلاقك المناسبة حسب أدائك بالاختبار.`;
  }

  const card = document.createElement("div");
  card.className = "level-result-card";
  card.innerHTML = `
    <div class="level-badge">${badgeText}</div>
    <h2>${headline}</h2>
    <p style="color:var(--muted); max-width:60ch; margin:0 auto 10px;">
      ${subline}<br>هاد تقدير أولي بناءً على أدائك بالاختبار — مش امتحان رسمي، بس مؤشر منيح لتعرف منين تبلش.</p>
    <div class="level-breakdown" id="level-breakdown"></div>
    <div class="cta-row" style="justify-content:center; display:flex; gap:14px; flex-wrap:wrap; margin-top:10px;">
      <button class="btn btn-primary" id="save-result-btn">احفظ نتيجتي وابلش تعلّم</button>
      <a class="btn btn-ghost" href="../index.html">رجوع للرئيسية</a>
    </div>
  `;
  container.appendChild(card);

  const breakdown = document.getElementById("level-breakdown");
  breakdown.innerHTML = data.stageResults.map(r => `
    <div class="stage-result ${r.passed ? "pass" : "fail"}">
      <b>${r.label}</b>${r.scorePercent}%
    </div>
  `).join("");

  document.getElementById("save-result-btn").addEventListener("click", () => openSaveModal(data));
  launchConfetti();

  // إذا Firebase مربوط (firebase-flow.js محمّل)، نعرض دعوة "حابب تكمل؟" تحت الكرت
  if(typeof renderContinuePrompt === "function"){
    container.appendChild(renderContinuePrompt(data));
  }
}

/* ---------- نافذة حفظ النتيجة (Placeholder محلي — بانتظار ربط Cloudflare) ---------- */
function openSaveModal(data){
  let overlay = document.getElementById("save-modal-overlay");
  if(!overlay){
    overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "save-modal-overlay";
    overlay.innerHTML = `
      <div class="modal-box" style="position:relative;">
        <button class="modal-close" id="modal-close-btn">✕</button>
        <h3>احفظ نتيجتك</h3>
        <p>سجّل إيميلك حتى تحفظ نتيجتك وتقدر تكمّل من هالمستوى لما تبلش الدراسة. (هاد حالياً حفظ تجريبي بمتصفحك بس، وقريباً رح يترافق مع حساب فعلي).</p>
        <input type="email" id="save-email-input" placeholder="بريدك الإلكتروني">
        <div class="modal-actions">
          <button class="btn btn-primary" id="save-confirm-btn">احفظ</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById("modal-close-btn").addEventListener("click", () => overlay.classList.remove("show"));
  }
  overlay.classList.add("show");
  document.getElementById("save-confirm-btn").onclick = () => {
    const email = document.getElementById("save-email-input").value.trim();
    if(!email) return;
    const full = {...data, email};
    saveLocalResult(full);
    overlay.querySelector(".modal-box").innerHTML = `
      <h3>تم الحفظ ✓</h3>
      <p>نتيجتك (${data.completedAll ? data.masteredLevel : data.startLevel}) محفوظة محلياً بمتصفحك. أول ما تبلش تسجّل حساب فعلي، رح تنربط نتيجتك تلقائياً معه.</p>
      <div class="modal-actions"><button class="btn btn-ghost" id="modal-done-btn">تمام</button></div>
    `;
    document.getElementById("modal-done-btn").addEventListener("click", () => overlay.classList.remove("show"));
  };
}

function launchConfetti(){
  const colors = ["#1FB6A8", "#FF9F1C", "#EF476F", "#12B886"];
  for(let i = 0; i < 40; i++){
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    const size = 6 + Math.random() * 6;
    piece.style.width = size + "px";
    piece.style.height = (size * 0.4) + "px";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (2.2 + Math.random() * 1.6) + "s";
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 4000);
  }
}
