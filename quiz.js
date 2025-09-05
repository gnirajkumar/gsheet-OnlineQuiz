// quiz.js — fixed, robust version
console.log("✅ quiz.js loaded (fixed)");

/* --------------------------
   Element refs & state
   -------------------------- */
const qWrap     = document.getElementById("qWrap");
const backBtn   = document.getElementById("backBtn");
const nextBtn   = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const scoreChip = document.getElementById("score");
const timerChip = document.getElementById("timer");
const progBar   = document.getElementById("progBar");
const stAttempts = document.getElementById("stAttempts");
const stCorrect  = document.getElementById("stCorrect");
const stWrong    = document.getElementById("stWrong");
const stRemain   = document.getElementById("stRemaining");

// Lightbox elements (in index.html)
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");

let questions = [];            // current loaded questions
let currentQ = 0;
let answered = {};             // {index: chosenIndex}
let score = 0;
let attempts = 0;
let correct = 0;
let wrong = 0;
let timerId = null;
let secPerQ = 30;

/* --------------------------
   Helpers
   -------------------------- */
function fmtTime(sec){
  const m = String(Math.floor(sec/60)).padStart(2,'0');
  const s = String(sec%60).padStart(2,'0');
  return `${m}:${s}`;
}

function clearQWrap(){ qWrap.innerHTML = ""; qWrap.classList.add("hidden"); }

/* --------------------------
   Rendering
   -------------------------- */
function renderQuestion(){
  if(!questions || !questions.length){
    qWrap.innerHTML = `<p style="color:var(--muted)">No questions loaded. Click Load Questions.</p>`;
    qWrap.classList.remove("hidden");
    return;
  }

  const q = questions[currentQ];
  qWrap.classList.remove("hidden");
  qWrap.innerHTML = "";

  // Title
  const title = document.createElement("h2");
  title.textContent = `Q${currentQ+1}. ${q.questionText || ""}`;
  qWrap.appendChild(title);

  // question image (if any)
  if(q.questionImage){
    const qi = document.createElement("img");
    qi.src = q.questionImage;
    qi.alt = "Question image";
    qi.className = "qimg";
    qi.style.cursor = "zoom-in";
    qi.addEventListener("click", ()=> openLightbox(q.questionImage));
    qWrap.appendChild(qi);
  }

  // options container
  const opts = document.createElement("div");
  opts.className = "options";

  q.options.forEach((opt, i) => {
    const row = document.createElement("div");
    row.className = "opt";
    row.tabIndex = 0;

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = `opt-${currentQ}`;
    radio.value = i;
    radio.style.marginRight = "10px";
    radio.disabled = false;

    const txt = document.createElement("div");
    txt.className = "otxt";
    txt.textContent = opt.text || "";

    row.appendChild(radio);
    row.appendChild(txt);

    if(opt.image){
      const img = document.createElement("img");
      img.src = opt.image;
      img.alt = "Option image";
      img.className = "oimg";
      img.style.cursor = "zoom-in";
      img.addEventListener("click", (e)=> { e.stopPropagation(); openLightbox(opt.image); });
      row.appendChild(img);
    }

    // If previously answered for this question, show locked styles
    if(answered.hasOwnProperty(currentQ)){
      const chosen = answered[currentQ];
      if(i === q.correctIndex) row.classList.add("correct");
      if(i === chosen && chosen !== q.correctIndex) row.classList.add("wrong");
      radio.checked = (i === chosen);
      radio.disabled = true;
    }

    // click handler
    row.addEventListener("click", ()=> {
      if(answered.hasOwnProperty(currentQ)) return; // already answered
      const chosen = i;
      const isCorrect = (chosen === q.correctIndex);

      // record
      answered[currentQ] = chosen;
      attempts++;
      if(isCorrect){ score++; correct++; }
      else { wrong++; }

      // disable all radios and colorize
      [...opts.children].forEach((node, j)=>{
        const r = node.querySelector("input");
        if(r) r.disabled = true;
        node.classList.remove("correct","wrong");
        if(j === q.correctIndex) node.classList.add("correct");
        if(j === chosen && !isCorrect) node.classList.add("wrong");
      });

      // show explanation (if provided)
      if(q.explanationText || q.explanationImage){
        let ex = document.getElementById("explainBox");
        if(!ex){
          ex = document.createElement("div");
          ex.id = "explainBox";
          ex.className = "explain";
          qWrap.appendChild(ex);
        }
        ex.innerHTML = `<div><strong>${isCorrect ? "Correct! ✅" : "Not quite. ❌"}</strong> ${q.explanationText || ""}</div>`;
        if(q.explanationImage){
          const ei = document.createElement("img");
          ei.src = q.explanationImage;
          ei.alt = "Explanation image";
          ei.className = "qimg";
          ei.style.cursor = "zoom-in";
          ei.addEventListener("click", ()=> openLightbox(q.explanationImage));
          ex.appendChild(ei);
        }
      }

      // enable next/submit appropriately
      updateStats();
      nextBtn.disabled = !(currentQ < questions.length - 1);
      submitBtn.disabled = false;
    });

    opts.appendChild(row);
  });

  qWrap.appendChild(opts);

  // update nav & progress
  backBtn.disabled = (currentQ === 0);
  nextBtn.disabled = !(answered.hasOwnProperty(currentQ) && currentQ < questions.length - 1);
  submitBtn.disabled = !Object.keys(answered).length;
  progBar.style.width = `${((currentQ+1)/questions.length)*100}%`;

  updateStats();
}

/* --------------------------
   Event handlers: nav + submit
   -------------------------- */
nextBtn.addEventListener("click", ()=>{
  if(currentQ < questions.length - 1){
    currentQ++;
    renderQuestion();
  }
});
backBtn.addEventListener("click", ()=>{
  if(currentQ > 0){
    currentQ--;
    renderQuestion();
  }
});
submitBtn.addEventListener("click", finalizeQuiz);

function finalizeQuiz(){
  stopTimer();
  const total = questions.length;
  const corr = Object.values(answered).filter((ch, i)=> questions[i].correctIndex === ch).length;
  const wrongCount = Object.keys(answered).length - corr;

  qWrap.innerHTML = `
    <div style="padding:8px">
      <h2>Quiz Completed!</h2>
      <p>Score: ${corr} / ${total}</p>
      <p>Attempted: ${Object.keys(answered).length}, Correct: ${corr}, Wrong: ${wrongCount}</p>
      <div style="margin-top:12px">
        <button id="restartBtn" class="btn primary">Restart Quiz</button>
        <button id="backHomeBtn" class="btn ghost">Back to Home</button>
      </div>
    </div>
  `;

  // wire restart / home
  document.getElementById("restartBtn").addEventListener("click", ()=>{
    // reset tracking but keep same questions
    answered = {}; currentQ = 0; score = 0; attempts = 0; correct = 0; wrong = 0;
    startQuiz(); // starts timer and renders
  });
  document.getElementById("backHomeBtn").addEventListener("click", ()=> {
    // clear and go back - rely on script.js to handle selectors
    stopTimer();
    questions = [];
    answered = {};
    currentQ = 0;
    score = 0;
    qWrap.innerHTML = "";
    qWrap.classList.add("hidden");
    // re-enable selectors (script.js handles enabling)
    document.getElementById("startBtn").disabled = true;
    document.getElementById("submitBtn").disabled = true;
  });

  backBtn.disabled = true;
  nextBtn.disabled = true;
  submitBtn.disabled = true;
}

/* --------------------------
   Timer
   -------------------------- */
function startTimer(totalSeconds){
  stopTimer();
  let t = totalSeconds;
  timerChip.textContent = fmtTime(t);
  timerId = setInterval(()=>{
    t--;
    timerChip.textContent = fmtTime(t);
    if(t <= 0){
      clearInterval(timerId);
      finalizeQuiz();
    }
  }, 1000);
}
function stopTimer(){
  if(timerId){ clearInterval(timerId); timerId = null; }
}

/* --------------------------
   Stats
   -------------------------- */
function updateStats(){
  stAttempts.textContent = `Attempted: ${attempts}`;
  stCorrect.textContent = `Correct: ${correct}`;
  stWrong.textContent = `Wrong: ${wrong}`;
  stRemain.textContent = `Remaining: ${questions.length - attempts}`;
  scoreChip.textContent = `Score: ${score}`;
}

/* --------------------------
   Lightbox (simple)
   -------------------------- */
function openLightbox(src){
  if(!src) return;
  lightboxImg.src = src;
  lightbox.classList.remove("hidden");
}
if(lightboxClose){
  lightboxClose.addEventListener("click", ()=> lightbox.classList.add("hidden"));
  lightbox.addEventListener("click", (e)=> { if(e.target === lightbox) lightbox.classList.add("hidden"); });
  document.addEventListener("keydown", (e)=> {
    if(!lightbox.classList.contains("hidden") && e.key === "Escape") lightbox.classList.add("hidden");
  });
}

/* --------------------------
   Start flow
   -------------------------- */
function startQuiz(){
  // read questions that script.js put into window.quizData.selectedQuestions
  questions = (window.quizData && window.quizData.selectedQuestions) ? window.quizData.selectedQuestions : [];
  if(!questions || !questions.length){
    alert("Please Load Questions first.");
    return;
  }
  // reset
  currentQ = 0;
  answered = {};
  score = 0; attempts = 0; correct = 0; wrong = 0;
  secPerQ = parseInt(document.getElementById("secPerQ").value) || 30;

  renderQuestion();
  const totalSeconds = Math.max(5, secPerQ * questions.length);
  startTimer(totalSeconds);
  // enable/disable nav
  nextBtn.disabled = true; // until answered current
  submitBtn.disabled = true;
  backBtn.disabled = true;
  console.log("▶ Quiz started: questions =", questions.length);
}

startBtn.addEventListener("click", ()=>{
  console.log("▶ Start button clicked");
  startQuiz();
});
