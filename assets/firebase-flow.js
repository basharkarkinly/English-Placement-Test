/* ============================================================
   English Placement Test — ربط Firebase
   تسجيل/دخول بالإيميل + تسجيل خفيف بالاسم + حفظ النتيجة + استبيان
   Bashar Karkinly — Support Channel
   ============================================================ */

const SURVEY_QUESTIONS = [
  { key: "rating", text: "شو رأيك بأسلوب الامتحان يلي جربته هلق؟",
    options: ["حلو كتير 😍", "منيح", "عادي", "ما عجبني"] },
  { key: "continueStyle", text: "بتحب نكمل الدروس الجاية بنفس الأسلوب (شخصيات، جمل سحرية، ألعاب مفردات)؟",
    options: ["أكيد", "ممكن", "مش متأكد", "لأ، بفضّل أسلوب تاني"] }
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

/* ---------- الاستبيان بعد التسجيل (بالحالتين) ---------- */
function renderSurvey(area, isRegistered, resultData, guestName){
  const answers = {};
  area.innerHTML = `
    <div id="survey-box">
      <h4 style="margin-top:0;">كم سؤال سريع قبل ما نخلص 🙏</h4>
      ${SURVEY_QUESTIONS.map((q, qi) => `
        <div class="survey-q">
          <p>${q.text}</p>
          <div class="opt-list">
            ${q.options.map((opt) => `<label class="opt"><input type="radio" name="survey-${qi}"><span>${opt}</span></label>`).join("")}
          </div>
        </div>
      `).join("")}
      <button class="btn btn-primary btn-block" id="survey-submit" disabled>أرسل رأيي</button>
    </div>
  `;
  const box = area.querySelector("#survey-box");
  SURVEY_QUESTIONS.forEach((q, qi) => {
    box.querySelectorAll(`input[name="survey-${qi}"]`).forEach((input, oi) => {
      input.addEventListener("change", () => {
        answers[q.key] = q.options[oi];
        box.querySelector("#survey-submit").disabled = Object.keys(answers).length < SURVEY_QUESTIONS.length;
      });
    });
  });

  box.querySelector("#survey-submit").addEventListener("click", () => {
    db.collection("survey_responses").add({
      isRegistered,
      guestName: guestName || null,
      uid: isRegistered && auth.currentUser ? auth.currentUser.uid : null,
      answers,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      area.innerHTML = `<p style="text-align:center; font-weight:700; color:var(--success); padding:16px 0;">شكراً إلك! 🙏 رأيك وصلنا وبيساعدنا نبني الدروس صح.</p>`;
    });
  });
}
