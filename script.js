const TOTAL_SECONDS = 60;

const timeDisplay = document.querySelector("#timeDisplay");
const statusText = document.querySelector("#statusText");
const hand = document.querySelector("#hand");
const keypadDisplay = document.querySelector("#keypadDisplay");
const keypadMessage = document.querySelector("#keypadMessage");
const keypad = document.querySelector(".keypad");
const closeKeypadButton = document.querySelector("#closeKeypadButton");
const answerInput = document.querySelector("#answerInput");
const minuendElement = document.querySelector("#minuend");
const subtrahendElement = document.querySelector("#subtrahend");
const correctCountElement = document.querySelector("#correctCount");
const scoreProgress = document.querySelector("#scoreProgress");
const scoreProgressFill = document.querySelector("#scoreProgressFill");
const gameFeedback = document.querySelector("#gameFeedback");
const numberLine = document.querySelector("#numberLine");
const startMarker = document.querySelector("#startMarker");
const resultScreen = document.querySelector("#resultScreen");
const finalCorrect = document.querySelector("#finalCorrect");
const finalTotal = document.querySelector("#finalTotal");
const playAgainButton = document.querySelector("#playAgainButton");
const attemptChart = document.querySelector("#attemptChart");
const competitorProgress = document.querySelector("#competitorProgress");
const competitorProgressFill = document.querySelector("#competitorProgressFill");
const competitorCountElement = document.querySelector("#competitorCount");
const thirdProgress = document.querySelector("#thirdProgress");
const thirdProgressFill = document.querySelector("#thirdProgressFill");
const thirdCountElement = document.querySelector("#thirdCount");
const playerRank = document.querySelector("#playerRank");
const competitorRank = document.querySelector("#competitorRank");
const thirdRank = document.querySelector("#thirdRank");
const progressPanel = document.querySelector(".progress-panel");
const playerNameInput = document.querySelector("#playerNameInput");
const playerNameBadge = document.querySelector("#playerNameBadge");
const resultPlayerName = document.querySelector("#resultPlayerName");
const toggleCompetitorsButton = document.querySelector("#toggleCompetitorsButton");
const viewAnswersButton = document.querySelector("#viewAnswersButton");
const answersScreen = document.querySelector("#answersScreen");
const backToResultsButton = document.querySelector("#backToResultsButton");
const answersPlayerName = document.querySelector("#answersPlayerName");
const answersList = document.querySelector("#answersList");
const reportCorrect = document.querySelector("#reportCorrect");
const reportTotal = document.querySelector("#reportTotal");
const gameLauncher = document.querySelector("#gameLauncher");
const gameLaunchButton = document.querySelector("#gameLaunchButton");

let secondsLeft = TOTAL_SECONDS;
let running = false;
let endTime = 0;
let timerId = null;
let enteredValue = "";
let expectedAnswer = 0;
let correctAnswers = 0;
let answeredExamples = 0;
let competitorCorrect = 0;
let competitorTimerId = null;
let thirdCorrect = 0;
let thirdTimerId = null;
let attemptHistory = [];
let roundAnswers = [];
let raceGoal = 10;
let raceScaleTimer = null;

try {
  const savedAttempts = JSON.parse(localStorage.getItem("subtraction-from-10-attempts") || "[]");
  if (Array.isArray(savedAttempts)) {
    attemptHistory = savedAttempts.slice(-6);
  }
} catch {
  attemptHistory = [];
}

try {
  playerNameInput.value = localStorage.getItem("subtraction-from-10-player-name") || "";
} catch {
  playerNameInput.value = "";
}

function updatePlayerName() {
  const name = playerNameInput.value.trim() || "Игрок 1";
  playerNameBadge.textContent = name;
  resultPlayerName.textContent = name;
  answersPlayerName.textContent = name;

  try {
    localStorage.setItem("subtraction-from-10-player-name", playerNameInput.value.trim());
  } catch {
    // The game still works if browser storage is unavailable.
  }
}

playerNameInput.addEventListener("input", updatePlayerName);
updatePlayerName();

toggleCompetitorsButton.addEventListener("click", () => {
  const hidden = document.body.classList.toggle("competitors-hidden");
  toggleCompetitorsButton.textContent = hidden ? "Показать соперников" : "Скрыть соперников";
  toggleCompetitorsButton.setAttribute("aria-pressed", hidden ? "true" : "false");
});

for (let value = 0; value <= 100; value += 1) {
  const tick = document.createElement("div");
  tick.className = `number-tick${value % 10 === 0 ? " major" : ""}`;

  if (value % 10 === 0) {
    const label = document.createElement("span");
    label.textContent = value;
    tick.append(label);
  }

  numberLine.append(tick);
}

function render() {
  timeDisplay.textContent = secondsLeft;
  hand.style.transform = `rotate(${(TOTAL_SECONDS - secondsLeft) * 6}deg)`;
}

function finish() {
  running = false;
  secondsLeft = 0;
  clearInterval(timerId);
  clearTimeout(competitorTimerId);
  clearTimeout(thirdTimerId);
  clearTimeout(raceScaleTimer);
  timerId = null;
  statusText.textContent = "Время вышло!";
  render();
  showResults();
}

function showResults() {
  attemptHistory.push({ correct: correctAnswers, total: answeredExamples });
  attemptHistory = attemptHistory.slice(-6);
  localStorage.setItem("subtraction-from-10-attempts", JSON.stringify(attemptHistory));
  finalCorrect.textContent = correctAnswers;
  finalTotal.textContent = answeredExamples;
  renderAnswersReport();
  renderAttemptChart();
  keypad.hidden = true;
  answersScreen.hidden = true;
  resultScreen.hidden = false;
  document.body.classList.add("game-finished");
}

function renderAnswersReport() {
  answersList.innerHTML = "";
  reportCorrect.textContent = correctAnswers;
  reportTotal.textContent = roundAnswers.length;

  roundAnswers.forEach((item) => {
    const row = document.createElement("div");
    row.className = `answer-row ${item.correct ? "correct" : "wrong"}`;
    row.setAttribute("role", "row");

    const expression = document.createElement("span");
    expression.className = "answer-expression";
    expression.setAttribute("role", "cell");
    expression.append(`${item.minuend} − ${item.subtrahend} = `);

    const answer = document.createElement("strong");
    answer.className = "answer-chip";
    answer.textContent = item.answer;
    expression.append(answer);

    const result = document.createElement("span");
    result.className = "answer-result";
    result.setAttribute("role", "cell");
    result.textContent = item.correct ? "✓" : "✕";

    const correction = document.createElement("span");
    correction.className = "answer-correction";
    correction.setAttribute("role", "cell");
    correction.textContent = item.correct ? "" : item.expected;

    row.append(expression, result, correction);
    answersList.append(row);
  });
}

function renderAttemptChart() {
  attemptChart.innerHTML = "";
  const maximum = Math.max(1, ...attemptHistory.map((attempt) => attempt.correct));

  attemptHistory.forEach((attempt, index) => {
    const column = document.createElement("div");
    column.className = "attempt-column";

    const value = document.createElement("span");
    value.className = "attempt-value";
    value.textContent = attempt.correct;

    const track = document.createElement("div");
    track.className = "attempt-bar-track";

    const bar = document.createElement("div");
    bar.className = "attempt-bar";
    bar.style.height = `${Math.max(4, (attempt.correct / maximum) * 100)}%`;
    bar.title = `${attempt.correct} из ${attempt.total}`;
    track.append(bar);

    const label = document.createElement("span");
    label.className = "attempt-label";
    label.textContent = `№${index + 1}`;

    column.append(value, track, label);
    attemptChart.append(column);
  });
}

function tick() {
  const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));

  if (remaining !== secondsLeft) {
    secondsLeft = remaining;
    render();
  }

  if (remaining === 0) {
    finish();
  }
}

function start() {
  if (secondsLeft === 0) {
    secondsLeft = TOTAL_SECONDS;
  }

  running = true;
  endTime = Date.now() + secondsLeft * 1000;
  statusText.textContent = "Отсчёт идёт…";
  timerId = window.setInterval(tick, 100);
  scheduleCompetitorAnswer();
  scheduleThirdAnswer();
  render();
}

function scheduleCompetitorAnswer() {
  clearTimeout(competitorTimerId);
  const delay = 1800 + Math.random() * 2600;

  competitorTimerId = window.setTimeout(() => {
    if (!running) return;
    competitorCorrect += 1;
    updateCompetitorProgress();
    scheduleCompetitorAnswer();
  }, delay);
}

function scheduleThirdAnswer() {
  clearTimeout(thirdTimerId);
  const delay = 2200 + Math.random() * 3000;

  thirdTimerId = window.setTimeout(() => {
    if (!running) return;
    thirdCorrect += 1;
    updateRaceProgress();
    scheduleThirdAnswer();
  }, delay);
}

function reset() {
  running = false;
  clearInterval(timerId);
  clearTimeout(competitorTimerId);
  clearTimeout(thirdTimerId);
  clearTimeout(raceScaleTimer);
  raceScaleTimer = null;
  timerId = null;
  secondsLeft = TOTAL_SECONDS;
  statusText.textContent = "Нажмите на поле ответа, чтобы начать";
  render();
}

closeKeypadButton.addEventListener("click", () => {
  keypad.hidden = true;
});

answerInput.addEventListener("click", () => {
  keypad.hidden = false;
  if (!running) {
    start();
  }
});

gameLaunchButton.addEventListener("click", () => {
  gameLauncher.hidden = true;
  keypad.hidden = false;
  start();
});

function createProblem() {
  const minuend = 10;
  const subtrahend = Math.floor(Math.random() * 9) + 1;

  expectedAnswer = minuend - subtrahend;
  minuendElement.textContent = minuend;
  subtrahendElement.textContent = subtrahend;
  startMarker.style.left = `${minuend}%`;
  startMarker.querySelector("span").textContent = minuend;
  enteredValue = "";
  renderKeypad();
}

function checkAnswer() {
  if (enteredValue === "") {
    gameFeedback.textContent = "Введите ответ";
    gameFeedback.className = "game-feedback wrong";
    return;
  }

  answeredExamples += 1;
  const isCorrect = Number(enteredValue) === expectedAnswer;
  roundAnswers.push({
    minuend: Number(minuendElement.textContent),
    subtrahend: Number(subtrahendElement.textContent),
    answer: enteredValue,
    expected: expectedAnswer,
    correct: isCorrect
  });

  if (isCorrect) {
    correctAnswers += 1;
    updateScoreProgress();
    gameFeedback.textContent = "Правильно! Следующий пример";
    gameFeedback.className = "game-feedback correct";
    createProblem();
  } else {
    gameFeedback.textContent = "Неверно. Следующий пример";
    gameFeedback.className = "game-feedback wrong";
    createProblem();
  }
}

function updateScoreProgress() {
  updateRaceProgress();
}

function updateCompetitorProgress() {
  updateRaceProgress();
}

function updateRaceProgress() {
  const leaderScore = Math.max(correctAnswers, competitorCorrect, thirdCorrect);
  const segments = raceGoal + 1;
  progressPanel.style.setProperty("--segment-size", `${100 / segments}%`);

  correctCountElement.textContent = correctAnswers;
  scoreProgress.setAttribute("aria-valuemax", raceGoal);
  scoreProgress.setAttribute("aria-valuenow", correctAnswers);
  scoreProgressFill.style.width = `${Math.min(100, ((correctAnswers + 1) / segments) * 100)}%`;

  competitorCountElement.textContent = competitorCorrect;
  competitorProgress.setAttribute("aria-valuemax", raceGoal);
  competitorProgress.setAttribute("aria-valuenow", competitorCorrect);
  competitorProgressFill.style.width = `${Math.min(100, ((competitorCorrect + 1) / segments) * 100)}%`;

  thirdCountElement.textContent = thirdCorrect;
  thirdProgress.setAttribute("aria-valuemax", raceGoal);
  thirdProgress.setAttribute("aria-valuenow", thirdCorrect);
  thirdProgressFill.style.width = `${Math.min(100, ((thirdCorrect + 1) / segments) * 100)}%`;
  updateRankings();

  if (leaderScore >= raceGoal && raceScaleTimer === null) {
    raceScaleTimer = window.setTimeout(() => {
      while (Math.max(correctAnswers, competitorCorrect, thirdCorrect) >= raceGoal) {
        raceGoal += 10;
      }
      raceScaleTimer = null;
      updateRaceProgress();
    }, 380);
  }
}

function updateRankings() {
  const players = [
    { score: correctAnswers, order: 0, badge: playerRank },
    { score: competitorCorrect, order: 1, badge: competitorRank },
    { score: thirdCorrect, order: 2, badge: thirdRank }
  ];
  const labels = ["1st", "2nd", "3rd"];

  players
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .forEach((player, index) => {
      player.badge.textContent = labels[index];
    });
}

function restartGame() {
  correctAnswers = 0;
  answeredExamples = 0;
  roundAnswers = [];
  competitorCorrect = 0;
  thirdCorrect = 0;
  raceGoal = 10;
  updateCompetitorProgress();
  updateScoreProgress();
  gameFeedback.textContent = "Нажмите на поле и введите ответ";
  gameFeedback.className = "game-feedback";
  answersScreen.hidden = true;
  resultScreen.hidden = true;
  document.body.classList.remove("game-finished");
  reset();
  createProblem();
}

function renderKeypad() {
  keypadDisplay.textContent = enteredValue || "Пусто";
  answerInput.value = enteredValue;
}

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const { key, action } = button.dataset;
  keypadMessage.textContent = "";

  if (key) {
    if (key === "." && enteredValue.includes(".")) return;
    enteredValue = enteredValue === "0" && key !== "." ? key : enteredValue + key;
    enteredValue = enteredValue.slice(0, 3);
  } else if (action === "sign" && enteredValue) {
    enteredValue = enteredValue.startsWith("-") ? enteredValue.slice(1) : `-${enteredValue}`;
  } else if (action === "delete") {
    enteredValue = enteredValue.slice(0, -1);
    if (enteredValue === "-") enteredValue = "";
  } else if (action === "confirm") {
    checkAnswer();
    return;
  }

  renderKeypad();
});

playAgainButton.addEventListener("click", restartGame);

viewAnswersButton.addEventListener("click", () => {
  resultScreen.hidden = true;
  answersScreen.hidden = false;
});

backToResultsButton.addEventListener("click", () => {
  answersScreen.hidden = true;
  resultScreen.hidden = false;
});

render();
createProblem();
renderKeypad();
