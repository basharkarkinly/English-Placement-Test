/* ============================================================
   إعدادات Firebase — مشروع: learning-english-platfor-b5fa4
   ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyAb0i8UEQc4ZdfHywPdQUyAHxqp2w-LgVQ",
  authDomain: "learning-english-platfor-b5fa4.firebaseapp.com",
  projectId: "learning-english-platfor-b5fa4",
  storageBucket: "learning-english-platfor-b5fa4.firebasestorage.app",
  messagingSenderId: "26929952046",
  appId: "1:26929952046:web:770bc779684cbe0eaab6bf",
  measurementId: "G-PBQLRP1GBL"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Analytics — اختياري، بيسجل زيارات الصفحة بشكل تلقائي بس (ما بيأثر على شغل الامتحان)
if(firebase.analytics){ firebase.analytics(); }
