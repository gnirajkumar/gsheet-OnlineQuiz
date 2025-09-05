// script.js — Google Sheets API version

// ⚡ Replace with your own values:
const SHEET_ID = "1wBa1QvWG72haAFHrn1G1ztHliY_lJNJpqssBHdlIsQ8"; // e.g., 1ABCDefGhijkLMNOPqrstuVWxyz12345
const API_KEY  = "AIzaSyDDHB4HsG6AOB6YtiNYpXCP44nhiR8NdHI";        // from Google Cloud Console
const RANGE    = "Sheet1!A2:O";         // A = Class, B = Subject, C = Topic ... O = ExplanationImage

// DOM elements
const classSel = document.getElementById("classSel");
const subjSel  = document.getElementById("subjectSel");
const topicSel = document.getElementById("topicSel");
const loadBtn  = document.getElementById("loadBtn");
const startBtn = document.getElementById("startBtn");
const selText  = document.getElementById("selText");

let data = {}; // will hold structured questions

/* --------------------------
   Fetch from Google Sheets
   -------------------------- */
async function loadFromSheet() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
  try {
    const res = await fetch(url);
    const json = await res.json();

    const rows = json.values;
    if (!rows) {
      console.error("No data found in sheet.");
      return;
    }

    // Convert rows → structured JSON
    const quizData = {};
    rows.forEach(row => {
      const [
        cls, subject, topic,
        questionText, questionImage,
        opt1, opt1Img,
        opt2, opt2Img,
        opt3, opt3Img,
        opt4, opt4Img,
        correctIndex,
        explanationText, explanationImage
      ] = row;

      if (!quizData[cls]) quizData[cls] = {};
      if (!quizData[cls][subject]) quizData[cls][subject] = {};
      if (!quizData[cls][subject][topic]) quizData[cls][subject][topic] = [];

      quizData[cls][subject][topic].push({
        questionText: questionText || "",
        questionImage: questionImage || "",
        options: [
          { text: opt1 || "", image: opt1Img || "" },
          { text: opt2 || "", image: opt2Img || "" },
          { text: opt3 || "", image: opt3Img || "" },
          { text: opt4 || "", image: opt4Img || "" }
        ],
        correctIndex: parseInt(correctIndex) || 0,
        explanationText: explanationText || "",
        explanationImage: explanationImage || ""
      });
    });

    console.log("✅ Loaded quiz data from Google Sheets:", quizData);
    data = quizData;
    populateClasses();
  } catch (err) {
    console.error("❌ Error fetching Google Sheet:", err);
  }
}

/* --------------------------
   Dropdown population
   -------------------------- */
function populateClasses() {
  classSel.innerHTML = '<option value="">Select Class</option>';
  Object.keys(data).forEach(cls => {
    const o = document.createElement("option");
    o.value = cls;
    o.textContent = cls;
    classSel.appendChild(o);
  });
  classSel.disabled = false;
  updateSelText();
}

function populateSubjects() {
  subjSel.innerHTML = '<option value="">Select Subject</option>';
  topicSel.innerHTML = '<option value="">Select Topic</option>';
  subjSel.disabled = true;
  topicSel.disabled = true;

  if (!classSel.value) return;

  Object.keys(data[classSel.value]).forEach(sub => {
    const o = document.createElement("option");
    o.value = sub;
    o.textContent = sub;
    subjSel.appendChild(o);
  });
  subjSel.disabled = false;
  updateSelText();
}

function populateTopics() {
  topicSel.innerHTML = '<option value="">Select Topic</option>';
  topicSel.disabled = true;

  if (!classSel.value || !subjSel.value) return;

  Object.keys(data[classSel.value][subjSel.value]).forEach(topic => {
    const o = document.createElement("option");
    o.value = topic;
    o.textContent = topic;
    topicSel.appendChild(o);
  });
  topicSel.disabled = false;
  updateSelText();
}

/* --------------------------
   UI updates
   -------------------------- */
function updateSelText() {
  selText.textContent = `${classSel.value || "Class"} — ${subjSel.value || "Subject"} — ${topicSel.value || "Topic"}`;
}
function checkLoadButton() {
  loadBtn.disabled = !(classSel.value && subjSel.value && topicSel.value);
}

/* --------------------------
   Event listeners
   -------------------------- */
classSel.addEventListener("change", () => {
  populateSubjects();
  updateSelText();
  checkLoadButton();
});
subjSel.addEventListener("change", () => {
  populateTopics();
  updateSelText();
  checkLoadButton();
});
topicSel.addEventListener("change", () => {
  updateSelText();
  checkLoadButton();
});

loadBtn.addEventListener("click", () => {
  if (!classSel.value || !subjSel.value || !topicSel.value) {
    alert("Please select Class, Subject and Topic first.");
    return;
  }
  const arr = data[classSel.value][subjSel.value][topicSel.value] || [];
  window.quizData = window.quizData || {};
  window.quizData.selectedQuestions = JSON.parse(JSON.stringify(arr));
  console.log("[script.js] Questions loaded (count):", arr.length);
  startBtn.disabled = false;
  alert(`Loaded ${arr.length} questions for ${classSel.value} → ${subjSel.value} → ${topicSel.value}`);
});

/* --------------------------
   Init
   -------------------------- */
(async function initScript() {
  loadBtn.disabled = true;
  startBtn.disabled = true;
  subjSel.disabled = true;
  topicSel.disabled = true;

  await loadFromSheet(); // fetch Google Sheet data
})();
