/* ============================================================
   English Placement Test — ربط Firebase
   تسجيل/دخول بالإيميل + تسجيل خفيف بالاسم + حفظ النتيجة + استبيان
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
    <h3>حابب تكمل تتعلم من هالمستوى؟ 🚀</h3>
    <p style="color:var(--muted);">سجّل حساب بسيط تحفظ فيه تقدمك وتكمل بعدين، أو بلاش هلق بس عطينا رأيك بالتجربة.</p>
    <div class="cta-row" style="justify-content:center; display:flex; gap:14px; flex-wrap:wrap;">
      <button class="btn btn-primary" id="want-continue-btn">إيه، بدي أكمل وأسجل حساب</button>
      <button class="btn btn-ghost" id="not-now-btn">مش هلق، بس خليني عطيك رأيي</button>
    </div>
    <div id="continue-flow-area" style="margin-top:20px; max-width:420px; margin-left:auto; margin-right:auto;"></div>
  `;
  wrap.querySelector("#want-continue-btn").addEventListener("click", (e) => {
    e.target.closest(".cta-row").style.display = "none";
    renderAuthChoice(wrap.querySelector("#continue-flow-area"), resultData);
  });
  wrap.querySelector("#not-now-btn").addEventListener("click", (e) => {
    e.target.closest(".cta-row").style.display = "none";
    renderLightRegister(wrap.querySelector("#continue-flow-area"), resultData);
  });
  return wrap;
}

/* ---------- تسجيل / دخول بحساب غوغل فقط ---------- */
function renderAuthChoice(area, resultData){
  area.innerHTML = `
    <button class="btn btn-primary btn-block" id="google-signin-btn">
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt=""
           style="width:18px; height:18px; vertical-align:middle; margin-left:8px;">
      كمّل بحساب غوغل
    </button>
    <div class="auth-error" id="auth-error"></div>
  `;
  const btn = area.querySelector("#google-signin-btn");
  const errorEl = area.querySelector("#auth-error");

  btn.addEventListener("click", () => {
    btn.disabled = true;
    btn.textContent = "لحظة...";
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then((cred) => saveResultToFirestore(cred.user.uid, cred.user.email, resultData, null))
      .then(() => renderSurvey(area, true, resultData, null))
      .catch((err) => {
        errorEl.textContent = translateGoogleError(err.code);
        btn.disabled = false;
        btn.innerHTML = `كمّل بحساب غوغل`;
      });
  });
}

function translateGoogleError(code){
  const map = {
    "auth/popup-closed-by-user": "سكّرت نافذة الدخول قبل ما تكمل — جرّب مرة كمان.",
    "auth/popup-blocked": "المتصفح منع فتح نافذة الدخول — تأكد إنك ما حاظر الـ pop-ups لهاد الموقع.",
    "auth/cancelled-popup-request": "في محاولة تسجيل ثانية عم تصير بنفس الوقت — جرّب مرة وحدة بس."
  };
  return map[code] || "صار في خطأ غير متوقع، جرّب مرة كمان.";
}

/* ---------- تسجيل خفيف (اسم بس، بدون حساب Firebase) ---------- */
function renderLightRegister(area, resultData){
  area.innerHTML = `
    <form id="light-form">
      <input type="text" id="light-name" placeholder="اسمك (بس مشان نعرف مين انت)" required>
      <button type="submit" class="btn btn-primary btn-block">كمّل</button>
    </form>
  `;
  area.querySelector("#light-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = area.querySelector("#light-name").value.trim();
    saveResultToFirestore(null, null, resultData, name)
      .then(() => renderSurvey(area, false, resultData, name));
  });
}

/* ---------- حفظ نتيجة الامتحان بـ Firestore ---------- */
function saveResultToFirestore(uid, email, resultData, guestName){
  const payload = {
    uid: uid || null,
    email: email || null,
    guestName: guestName || null,
    stageResults: resultData.stageResults,
    masteredLevel: resultData.masteredLevel,
    startLevel: resultData.startLevel,
    completedAll: resultData.completedAll,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  return db.collection("placement_results").add(payload);
}

/* ---------- الاستبيان: سؤال واحد بكل مرة، كله جوا الصفحة نفسها بدون أي Reload
   أو طلب إنترنت جديد — كل الأسئلة محمّلة أصلاً بالذاكرة من أول تحميل للصفحة،
   والتنقل بينهم بس تبديل innerHTML بجافاسكريبت (صفر استهلاك إنترنت إضافي) ---------- */
function renderSurvey(area, isRegistered, resultData, guestName){
  const answers = {};
  let qIndex = 0;
  let submitted = false;

  area.innerHTML = `
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
    let locked = false; // يمنع أي تقدّم إضافي (دوس مرتين بالغلط) لنفس السؤال
    qnumEl.textContent = qIndex + 1;
    qbox.innerHTML = `<div class="survey-q"><p>${q.text}</p><div class="opt-list" id="survey-opts"></div></div>`;
    const optWrap = qbox.querySelector("#survey-opts");

    function goNext(){
      if(locked) return;
      locked = true;
      qIndex++;
      renderQuestion();
    }

    if(q.type === "choice"){
      q.options.forEach((opt) => {
        const el = document.createElement("label");
        el.className = "opt";
        el.innerHTML = `<input type="radio" name="survey-current"> <span>${opt}</span>`;
        el.addEventListener("click", () => {
          if(locked) return;
          answers[q.key] = opt;
          Array.from(optWrap.children).forEach(c => c.classList.add("locked-answer"));
          el.classList.add("selected", "correct");
          setTimeout(goNext, 250);
        });
        optWrap.appendChild(el);
      });
    }

    if(q.type === "choice_with_text"){
      // كل شي ظاهر من أول لحظة: الخيارات + حقل النص الاختياري + زر التالي (معطّل لحد ما يختار)
      q.options.forEach((opt) => {
        const el = document.createElement("label");
        el.className = "opt";
        el.innerHTML = `<input type="radio" name="survey-current"> <span>${opt}</span>`;
        el.addEventListener("click", () => {
          answers[q.key] = opt;
          Array.from(optWrap.children).forEach(c => c.classList.remove("selected"));
          el.classList.add("selected");
          nextBtn.disabled = false;
        });
        optWrap.appendChild(el);
      });
      const extraWrap = document.createElement("div");
      extraWrap.style.marginTop = "14px";
      extraWrap.innerHTML = `
        <input type="text" id="survey-extra-text" class="field-input" placeholder="${q.textLabel}">
        <div class="cta-row" style="justify-content:center; display:flex; gap:10px; margin-top:12px;">
          <button class="btn btn-primary" id="survey-next-btn" disabled>التالي</button>
        </div>
      `;
      qbox.appendChild(extraWrap);
      const nextBtn = qbox.querySelector("#survey-next-btn");
      nextBtn.addEventListener("click", () => {
        if(locked) return;
        const val = qbox.querySelector("#survey-extra-text").value.trim();
        if(val) answers[q.key + "_extra"] = val;
        goNext();
      });
    }

    if(q.type === "text"){
      optWrap.innerHTML = `
        <input type="text" id="survey-text-input" class="field-input" placeholder="اكتب جوابك هون...">
        <div class="cta-row" style="justify-content:center; display:flex; gap:10px; margin-top:12px;">
          <button class="btn btn-primary" id="survey-next-btn">${q.optional ? "التالي (فيك تتخطاه)" : "التالي"}</button>
        </div>
      `;
      qbox.querySelector("#survey-next-btn").addEventListener("click", () => {
        if(locked) return;
        const val = qbox.querySelector("#survey-text-input").value.trim();
        if(val) answers[q.key] = val;
        goNext();
      });
    }
  }

  function submitSurvey(){
    if(submitted) return;
    submitted = true;
    qbox.innerHTML = `<p style="text-align:center;">جاري الإرسال...</p>`;
    db.collection("survey_responses").add({
      isRegistered,
      guestName: guestName || null,
      uid: isRegistered && auth.currentUser ? auth.currentUser.uid : null,
      answers,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      area.innerHTML = `<p style="text-align:center; font-weight:700; color:var(--success); padding:16px 0;">شكراً إلك! 🙏 رأيك وصلنا وبيساعدنا نبني الدروس صح.</p>`;
    });
  }
}
