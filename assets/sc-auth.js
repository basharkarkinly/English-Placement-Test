// منطق الجلسة المشترك بين صفحة الدخول وباقي الصفحات
(function () {
  var KEY = "sc_session";

  function api(action, payload) {
    return fetch(SC_CONFIG.API_URL, {
      method: "POST",
      // text/plain يتجنب طلب preflight اللي ما بيدعمو Apps Script
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(Object.assign({ action: action }, payload || {}))
    }).then(function (r) { return r.json(); });
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; }
  }
  function saveSession(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }
  function clearSession() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  // يرجّع: {state:"valid", user} | {state:"invalid"} | {state:"offline"}
  function check() {
    var s = getSession();
    if (!s || !s.token) return Promise.resolve({ state: "invalid" });
    return api("checkSession", { token: s.token }).then(function (res) {
      if (res && res.ok) {
        saveSession({ token: s.token, email: res.user.email, name: res.user.name });
        return { state: "valid", user: res.user };
      }
      // نمسح الجلسة فقط إذا رفضها السيرفر نهائياً. أي خطأ مؤقت (SERVER_ERROR وغيره) ما يطلّع المستخدم.
      if (res && (res.error === "NO_SESSION" || res.error === "EXPIRED" || res.error === "BLOCKED")) {
        clearSession();
        return { state: "invalid" };
      }
      return { state: "offline" };
    }).catch(function () { return { state: "offline" }; });
  }

  function logout() {
    var s = getSession();
    clearSession();
    var done = function () { location.href = "index.html"; };
    if (!s || !s.token) return done();
    api("logout", { token: s.token }).then(done, done);
  }

  // للصفحات المحمية: تظهر بعد التحقق فقط
  function requireLogin(onReady) {
    check().then(function (r) {
      if (r.state === "valid") {
        document.body.classList.remove("guard");
        if (onReady) onReady(r.user);
      } else if (r.state === "invalid") {
        location.replace("index.html");
      } else {
        document.body.classList.remove("guard");
        var m = document.getElementById("offline-msg");
        if (m) m.hidden = false;
      }
    });
  }

  window.SCAuth = {
    api: api, getSession: getSession, saveSession: saveSession,
    clearSession: clearSession, check: check, logout: logout, requireLogin: requireLogin
  };
})();
