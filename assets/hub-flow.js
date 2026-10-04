/* ============================================================
   English Placement Test — الربط مع حساب الهَب (Apps Script + Google Sheet)
   نفس تسجيل الدخول تبع الهَب (الجلسة sc_session) + حفظ النتيجة + استبيان
   Bashar Karkinly — Support Channel
   ============================================================ */

const SURVEY_QUESTIONS = [
  { key: "rating", text: "شو رأيك بأسلوب وطريقة الامتحان عموماً؟",
    type: "choice_with_text", options: ["راضي تماماً 😍", "راضي 🙂", "غير راضي 😕"],
    textLabel: "ليش؟ (اختياري)" },
  { key: "timeFeeling", text: "حسيت وقت الـ٥ دقايق كافي لكل مرحلة؟",
    type: "choice", options: ["وقت طويل", "مناسب تماماً", "وقت قصير"] },
  { key: "hardestType", text: "شو أكتر نوع سؤال صعب؟",
    type: "choice", options: ["القواعد (اختيار من متعدد)", "القراءة والفقرات", "تحديد الكلمة الغلط بالنص", "وصل المفردات"] },
  { key: "accuracy", text: "حسيت النتيجة بتعكس الواقع؟",
    type: "choice", options: ["المستوى أكبر من الحقيقي", "مستوى مناسب تماماً", "المستوى أقل من الحقيقي"] },
  { key: "accuracyWhy", text: "لو حسيت النتيجة غير دقيقة، ليش برأيك؟ (اختياري)",
    type: "text", optional: true },
  { key: "surprised", text: "كنت متفاجئ من النتيجة ولا متوقعها؟",
    type: "choice", options: ["متفاجئ فعلاً", "كانت متوقعة تماماً"] },
  { key: "continueStyle", text: "بتحب نكمل بنفس الأسلوب (شخصيات، جمل سحرية، ألعاب) مع شي جديد؟",
    type: "choice", options: ["أكيد", "ممكن", "لأ"] },
  { key: "preferredStyle", text: "لو في أسلوب تاني بيشدّك أكتر بالدراسة، شو هو؟ (اختياري)",
    type: "text", optional: true },
  { key: "lessonFrequency", text: "بتفضل دروس يومية قصيرة، ولا أسبوعية بمدة الدرس تكون أطول؟",
    type: "choice", options: ["يومي وقصير", "أسبوعي وأطول"] },
  { key: "pronunciationImportance", text: "بتحب يكون في صوت/نطق بالدروس؟",
    type: "choice", options: ["ضروري", "حلو بس مو أساسي", "ما يهمني"] },
  { key: "shareTest", text: "ممكن تشارك هاد الامتحان مع حدا تاني؟",
    type: "choice", options: ["أكيد، رح شاركه", "يمكن", "لأ"] },
  { key: "triedAppBefore", text: "جربت تطبيق تعلم لغة قبل هيك؟",
    type: "choice", options: ["نعم", "لأ"] },
  { key: "ageGroup", text: "عمرك ضمن أي فئة؟",
    type: "choice_with_text", options: ["١٨-٢٤", "٢٥-٣٤", "٣٥+"],
    textLabel: "رقم هاتفك (اختياري، لو حابب نتواصل معك)" },
  { key: "hearAboutUs", text: "من وين سمعت عن المنصة؟",
    type: "choice", options: ["قناة الدعم بتلغرام", "صديق رشّحهالي", "بحثت بنفسي"] },
  { key: "deviceUsed", text: "فتحت الامتحان من الموبايل ولا الكمبيوتر؟",
    type: "choice", options: ["موبايل", "كمبيوتر"] },
  { key: "willingToPay", text: "استعداد تدفع اشتراك بسيط لو المحتوى كان احترافي؟",
    type: "choice", options: ["أكيد", "يمكن", "لأ، بفضّل يضل مجاني"] }
];

/* هاد الدالة بتتنادى تلقائياً من app.js بعد ما تظهر شاشة النتيجة (إذا كانت معرّفة) */
function renderContinuePrompt(resultData){
  const wrap = document.createElement("div");
  wrap.className = "level-result-card";
  wrap.style.marginTop = "16px";
  wrap.innerHTML = `
    <h3>احفظ نتيجتك وكمّل 🚀</h3>
    <div id="continue-flow-area" style="margin-top:12px; max-width:420px; margin-left:auto; margin-right:auto;"></div>
  `;
  startSaveFlow(wrap.querySelector("#continue-flow-area"), resultData);
  return wrap;
}

/* ---------- التحقق من جلسة الهَب ثم حفظ النتيجة ---------- */
function startSaveFlow(area, resultData){
  area.innerHTML = `<p style="text-align:center; color:var(--muted);">لحظة، عم نتحقق من حسابك...</p>`;
  SCAuth.check().then((r) => {
    if(r.state === "valid") return saveResultToSheet(area, resultData);
    if(r.state === "invalid") return renderLoginNeeded(area, resultData);
    renderFlowError(area, resultData, "ما قدرنا نوصل للسيرفر، تأكد من النت وجرّب مرة كمان.");
  });
}

/* مو مسجّل دخول: بيفتح الهَب بتبويب جديد، والنتيجة بتضل محفوظة بهالصفحة بالذاكرة */
function renderLoginNeeded(area, resultData){
  area.innerHTML = `
    <p style="text-align:center;">لحفظ نتيجتك والإجابة على استبيان قصير، سجّل دخولك بحسابك على منصة Support Channel (بإيميلك، بياخد دقيقة).</p>
    <a class="btn btn-primary btn-block" href="${SC_CONFIG.HUB_URL}" target="_blank" rel="noopener">سجّل دخولك (بتفتح بتبويب جديد)</a>
    <p style="text-align:center; margin:14px 0 8px; color:var(--muted);">لما تخلّص الدخول ارجع لهون، بيكمل لحاله أو دوس:</p>
    <button class="btn btn-outline-dark btn-block" id="login-done-btn" type="button">سجّلت دخولي ✓</button>
    <div class="auth-error" id="auth-error"></div>
  `;
  let started = false;
  const go = () => {
    if(started) return;
    started = true;
    window.removeEventListener("storage", onStorage);
    startSaveFlow(area, resultData);
  };
  // الجلسة بتنحفظ بـ localStorage من تبويب الهَب، فهالتبويب بيحس فيها فوراً
  const onStorage = (e) => { if(e.key === "sc_session" && e.newValue) go(); };
  window.addEventListener("storage", onStorage);
  area.querySelector("#login-done-btn").addEventListener("click", () => {
    const btn = area.querySelector("#login-done-btn");
    btn.disabled = true; btn.textContent = "لحظة...";
    SCAuth.check().then((r) => {
      if(r.state === "valid"){ go(); return; }
      btn.disabled = false; btn.textContent = "سجّلت دخولي ✓";
      area.querySelector("#auth-error").textContent =
        r.state === "invalid" ? "لسا ما لقينا تسجيل دخول — خلّص الدخول بالتبويب التاني وجرّب مرة كمان."
                              : "ما قدرنا نوصل للسيرفر، جرّب مرة كمان.";
    });
  });
}

function renderFlowError(area, resultData, msg){
  area.innerHTML = `
    <p style="text-align:center; color:var(--danger);">${msg}</p>
    <button class="btn btn-primary btn-block" id="flow-retry-btn" type="button">جرّب مرة كمان</button>
  `;
  area.querySelector("#flow-retry-btn").addEventListener("click", () => startSaveFlow(area, resultData));
}

/* ---------- حفظ نتيجة الامتحان بالشيت (عبر Apps Script) ---------- */
function saveResultToSheet(area, resultData){
  const s = SCAuth.getSession();
  area.innerHTML = `<p style="text-align:center; color:var(--muted);">جاري حفظ نتيجتك...</p>`;
  SCAuth.api("savePlacementResult", {
    token: s && s.token,
    start_level: resultData.startLevel,
    mastered_level: resultData.masteredLevel,
    completed_all: resultData.completedAll,
    stages: resultData.stageResults.map((x) => ({ key: x.key, scorePercent: x.scorePercent }))
  }).then((res) => {
    if(res && res.ok) return renderSurvey(area, res.result_id);
    const err = res && res.error;
    if(err === "NO_SESSION" || err === "EXPIRED") return renderLoginNeeded(area, resultData);
    if(err === "LIMIT_REACHED"){
      area.innerHTML = `<p style="text-align:center;">وصلت الحد اليومي لحفظ النتائج، جرّب بكرا 🙏</p>`;
      return;
    }
    renderFlowError(area, resultData, "ما انحفظت النتيجة، جرّب مرة كمان.");
  }, () => renderFlowError(area, resultData, "ما قدرنا نوصل للسيرفر، تأكد من النت وجرّب مرة كمان."));
}

/* ---------- الاستبيان: سؤال واحد بكل مرة، كله جوا الصفحة نفسها بدون أي Reload
   أو طلب إنترنت جديد — كل الأسئلة محمّلة أصلاً بالذاكرة من أول تحميل للصفحة،
   والتنقل بينهم بس تبديل innerHTML بجافاسكريبت (صفر استهلاك إنترنت إضافي) ---------- */
function renderSurvey(area, resultId){
  const answers = {};
  let qIndex = 0;
  let submitted = false;

  area.innerHTML = `
    <p style="text-align:center; font-weight:700; color:var(--success); margin-bottom:8px;">تم حفظ نتيجتك ✓</p>
    <p style="text-align:center; font-weight:700; margin-bottom:14px;">
      قبل ما تسكر الصفحة 🙏 كم سؤال سريع بس (٢ دقيقة بالكتير)، وبتساعدنا نبني الدروس الجاية أحسن بكتير.
    </p>
    <div class="survey-progress">سؤال <b id="survey-qnum">1</b> من <b>${SURVEY_QUESTIONS.length}</b></div>
    <div id="survey-qbox"></div>
  `;
  const qbox = area.querySelector("#survey-qbox");
  const qnumEl = area.querySelector("#survey-qnum");

  renderQuestion();

  function renderQuestion(){
    if(qIndex >= SURVEY_QUESTIONS.length){ submitSurvey(); return; }
    const q = SURVEY_QUESTIONS[qIndex];
    qnumEl.textContent = qIndex + 1;
    qbox.innerHTML = `<div class="survey-q"><p>${q.text}</p><div class="opt-list" id="survey-opts"></div></div>`;
    const optWrap = qbox.querySelector("#survey-opts");
    const isLast = qIndex === SURVEY_QUESTIONS.length - 1;

    if(q.type === "choice" || q.type === "choice_with_text"){
      q.options.forEach((opt) => {
        const el = document.createElement("label");
        el.className = "opt";
        const isChecked = answers[q.key] === opt;
        el.innerHTML = `<input type="radio" name="survey-current" ${isChecked ? "checked" : ""}> <span>${opt}</span>`;
        if(isChecked) el.classList.add("selected");
        el.addEventListener("click", () => {
          answers[q.key] = opt;
          Array.from(optWrap.children).forEach(c => c.classList.remove("selected"));
          el.classList.add("selected");
          nextBtn.disabled = false;
        });
        optWrap.appendChild(el);
      });
    }

    if(q.type === "choice_with_text"){
      const extraWrap = document.createElement("div");
      extraWrap.style.marginTop = "14px";
      const prevExtra = answers[q.key + "_extra"] || "";
      extraWrap.innerHTML = `<input type="text" id="survey-extra-text" class="field-input" placeholder="${q.textLabel}" value="${prevExtra}">`;
      qbox.appendChild(extraWrap);
    }

    if(q.type === "text"){
      const prevVal = answers[q.key] || "";
      optWrap.innerHTML = `<input type="text" id="survey-text-input" class="field-input" placeholder="اكتب جوابك هون..." value="${prevVal}">`;
    }

    const navWrap = document.createElement("div");
    navWrap.className = "cta-row";
    navWrap.style = "justify-content:center; display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;";
    navWrap.innerHTML = `
      ${qIndex > 0 ? `<button class="btn btn-outline-dark" id="survey-back-btn" type="button">⟵ رجوع للسؤال السابق</button>` : ""}
      <button class="btn btn-primary" id="survey-next-btn" type="button">${isLast ? "إرسال ✓" : "التالي"}</button>
    `;
    qbox.appendChild(navWrap);
    const nextBtn = qbox.querySelector("#survey-next-btn");

    // القواعد الأساسية والاختيارية: choice و choice_with_text لازم يختار قبل ما يتقدم، text فيه مرونة كاملة
    if((q.type === "choice" || q.type === "choice_with_text") && !answers[q.key]) nextBtn.disabled = true;

    if(qIndex > 0){
      qbox.querySelector("#survey-back-btn").addEventListener("click", () => {
        qIndex--; renderQuestion();
      });
    }

    nextBtn.addEventListener("click", () => {
      if(q.type === "text"){
        const val = qbox.querySelector("#survey-text-input").value.trim();
        if(val) answers[q.key] = val; else delete answers[q.key];
      }
      if(q.type === "choice_with_text"){
        const val = qbox.querySelector("#survey-extra-text").value.trim();
        if(val) answers[q.key + "_extra"] = val; else delete answers[q.key + "_extra"];
      }
      if((q.type === "choice" || q.type === "choice_with_text") && !answers[q.key]) return; // دفاعي، الزر أصلاً معطّل
      qIndex++;
      renderQuestion();
    });
  }

  function submitSurvey(){
    if(submitted) return;
    submitted = true;
    qbox.innerHTML = `<p style="text-align:center;">جاري الإرسال...</p>`;
    const thanks = () => {
      area.innerHTML = `<p style="text-align:center; font-weight:700; color:var(--success); padding:16px 0;">شكراً إلك! 🙏 رأيك وصلنا وبيساعدنا نبني الدروس صح.</p>`;
    };
    const s = SCAuth.getSession();
    SCAuth.api("savePlacementSurvey", { token: s && s.token, result_id: resultId, answers })
      .then((res) => {
        if(res && (res.ok || res.error === "LIMIT_REACHED")) return thanks();
        throw new Error((res && res.error) || "ERR");
      })
      .catch(() => {
        submitted = false;
        qbox.innerHTML = `
          <p style="text-align:center; color:var(--danger);">ما قدرنا نرسل إجاباتك، تأكد من النت وجرّب مرة كمان.</p>
          <div class="cta-row" style="justify-content:center; display:flex; margin-top:12px;">
            <button class="btn btn-primary" id="survey-retry-btn" type="button">جرّب مرة كمان</button>
          </div>`;
        qbox.querySelector("#survey-retry-btn").addEventListener("click", submitSurvey);
      });
  }
}
