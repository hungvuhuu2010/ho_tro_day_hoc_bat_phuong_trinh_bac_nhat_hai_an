/*
ÔN TẬP TỌA ĐỘ ĐIỂM

* Mặt phẳng sử dụng SVG
* Hệ tọa độ toán học độc lập với pixel
* Hai dạng bài:

  1. Đọc tọa độ
  2. Vẽ điểm theo tọa độ
     =========================================================
     */

/* =====================================================
CẤU HÌNH
===================================================== */

const CONFIG = {
min: -10,
max: 10,


// Số pixel cho một đơn vị tọa độ
scale: 45,

points: ["A", "B", "C", "D"]


};

/* =====================================================
TRẠNG THÁI
===================================================== */

const state = {


mode: "read",

exercise: {
    name: "A",
    x: 2,
    y: 3
},

score: 0,

answered: false


};


// Biến điều khiển góc nhìn và tương tác

let scale = 45;         // Mức zoom tương ứng với CONFIG.scale mặc định

let panX = 0;           // Dịch chuyển tâm theo trục X (pixel)

let panY = 0;           // Dịch chuyển tâm theo trục Y (pixel)

let isDragging = false;

let startX = 0;

let startY = 0;

let totalMoveDistance = 0; // Phân biệt Click chọn điểm và Drag/Pan



// Cấu hình giới hạn Zoom

const ZOOM_MIN = 15;

const ZOOM_MAX = 200;

/* =====================================================
DOM
===================================================== */

const svg =
document.getElementById("coordinate-system");

const viewport =
document.querySelector(".graph-viewport");

const cursorCoords =
document.getElementById("cursor-coords");

const readPanel =
document.getElementById("read-panel");

const plotPanel =
document.getElementById("plot-panel");

const tabs =
document.querySelectorAll(".mode-tab");

const answerX =
document.getElementById("answer-x");

const answerY =
document.getElementById("answer-y");

const checkAnswer =
document.getElementById("check-answer");

const readFeedback =
document.getElementById("read-feedback");

const plotFeedback =
document.getElementById("plot-feedback");

const readPointName =
document.getElementById("read-point-name");

const plotPointName =
document.getElementById("plot-point-name");

const targetCoordinate =
document.getElementById("target-coordinate");

const scoreElement =
document.getElementById("score");

const newExerciseButton =
document.getElementById("new-exercise");

/* =====================================================
SVG UTILITIES
===================================================== */

const SVG_NS =
"http://www.w3.org/2000/svg";

function createSVGElement(type, attributes = {}) {


const element =
    document.createElementNS(SVG_NS, type);

for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
}

return element;


}

/* =====================================================
VIEW
===================================================== */

let view = {
width: 800,
height: 600,


centerX: 0,
centerY: 0,

scale: CONFIG.scale


};

/* =====================================================
CHUYỂN TỌA ĐỘ
===================================================== */

function mathToSvg(x, y) {


return {
    x:
        view.width / 2 +
        view.centerX +
        x * view.scale,

    y:
        view.height / 2 +
        view.centerY -
        y * view.scale
};


}

function svgToMath(px, py) {


return {

    x:
        (px -
            view.width / 2 -
            view.centerX) /
        view.scale,

    y:
        (view.height / 2 +
            view.centerY -
            py) /
        view.scale
};


}

/* =====================================================
CẬP NHẬT KÍCH THƯỚC
===================================================== */

function updateViewSize() {
    const rect = viewport.getBoundingClientRect();

    view.width = rect.width;
    view.height = rect.height;

    // Tính tỉ lệ để toàn bộ hệ tọa độ từ -10 đến 10
    // luôn nằm gọn trong vùng hiển thị.
    const padding = 40;

    const availableWidth = view.width - padding * 2;
    const availableHeight = view.height - padding * 2;

    // Có 20 đơn vị từ -10 đến +10.
    // Dùng cùng một scale cho cả hai chiều để giữ đúng hình vuông.
    const scaleX = availableWidth / (CONFIG.max - CONFIG.min);
    const scaleY = availableHeight / (CONFIG.max - CONFIG.min);

    // Lấy scale nhỏ hơn để hệ tọa độ không bị tràn.
    view.scale = Math.max(1, Math.min(scaleX, scaleY));

    // SVG luôn chiếm toàn bộ vùng graph
    svg.setAttribute("viewBox", `0 0 ${view.width} ${view.height}`);
    svg.setAttribute("width", view.width);
    svg.setAttribute("height", view.height);

    // Vẽ lại toàn bộ hệ tọa độ theo kích thước mới
    drawCoordinateSystem();
}

/* =====================================================
MŨI TÊN TRỤC
===================================================== */

function createArrowMarker() {


const defs =
    createSVGElement("defs");

const marker =
    createSVGElement("marker", {
        id: "axis-arrow",
        viewBox: "0 0 10 10",
        refX: "6",
        refY: "5",
        markerWidth: "6",
        markerHeight: "6",
        orient: "auto-start-reverse"
    });

const path =
    createSVGElement("path", {
        d: "M 0 2 L 10 5 L 0 8 Z",
        fill: "#475569"
    });

marker.appendChild(path);
defs.appendChild(marker);

svg.appendChild(defs);


}

/* =====================================================
VẼ LƯỚI
===================================================== */

function drawGrid(group) {


for (
    let x = CONFIG.min;
    x <= CONFIG.max;
    x++
) {

    if (x === 0) continue;

    const p1 =
        mathToSvg(x, CONFIG.min);

    const p2 =
        mathToSvg(x, CONFIG.max);

    const line =
        createSVGElement("line", {
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
            class: "grid-line"
        });

    group.appendChild(line);
}


for (
    let y = CONFIG.min;
    y <= CONFIG.max;
    y++
) {

    if (y === 0) continue;

    const p1 =
        mathToSvg(CONFIG.min, y);

    const p2 =
        mathToSvg(CONFIG.max, y);

    const line =
        createSVGElement("line", {
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
            class: "grid-line"
        });

    group.appendChild(line);
}


}

/* =====================================================
VẼ TRỤC
===================================================== */

function drawAxes(group) {


const origin =
    mathToSvg(0, 0);


/* Ox */

const axisX =
    createSVGElement("line", {
        x1: 0,
        y1: origin.y,
        x2: view.width,
        y2: origin.y,
        class: "axis",
        "marker-end": "url(#axis-arrow)"
    });

group.appendChild(axisX);


/* Oy */

const axisY =
    createSVGElement("line", {
        x1: origin.x,
        y1: view.height,
        x2: origin.x,
        y2: 0,
        class: "axis",
        "marker-end": "url(#axis-arrow)"
    });

group.appendChild(axisY);


/* x */

const labelX =
    createSVGElement("text", {
        x: view.width - 18,
        y: origin.y - 10,
        class: "axis-label"
    });

labelX.textContent = "x";

group.appendChild(labelX);


/* y */

const labelY =
    createSVGElement("text", {
        x: origin.x + 10,
        y: 22,
        class: "axis-label"
    });

labelY.textContent = "y";

group.appendChild(labelY);


/* O */

const labelO =
    createSVGElement("text", {
        x: origin.x + 8,
        y: origin.y + 18,
        class: "origin-label"
    });

labelO.textContent = "O";

group.appendChild(labelO);


}

/* =====================================================
VẼ VẠCH VÀ SỐ
===================================================== */

function drawTicks(group) {


const origin =
    mathToSvg(0, 0);


for (
    let x = CONFIG.min;
    x <= CONFIG.max;
    x++
) {

    if (x === 0) continue;

    const p =
        mathToSvg(x, 0);

    const tick =
        createSVGElement("line", {
            x1: p.x,
            y1: origin.y - 5,
            x2: p.x,
            y2: origin.y + 5,
            class: "tick"
        });

    group.appendChild(tick);


    const text =
        createSVGElement("text", {
            x: p.x,
            y: origin.y + 20,
            class: "axis-number"
        });

    text.textContent = x;

    group.appendChild(text);
}


for (
    let y = CONFIG.min;
    y <= CONFIG.max;
    y++
) {

    if (y === 0) continue;

    const p =
        mathToSvg(0, y);

    const tick =
        createSVGElement("line", {
            x1: origin.x - 5,
            y1: p.y,
            x2: origin.x + 5,
            y2: p.y,
            class: "tick"
        });

    group.appendChild(tick);


    const text =
        createSVGElement("text", {
            x: origin.x + 10,
            y: p.y + 5,
            class: "axis-number"
        });

    text.setAttribute(
        "text-anchor",
        "start"
    );

    text.textContent = y;

    group.appendChild(text);
}


}

/* =====================================================
VẼ ĐIỂM BÀI TẬP
===================================================== */

function drawExercisePoint(group) {
    // Chỉ vẽ điểm khi đang ở chế độ:
    // 1. Đọc tọa độ
    // 2. Phản xạ
    if (state.mode !== "read" && state.mode !== "reflex") {
        return;
    }

    const { x, y, name } = state.exercise;

    const { x: sx, y: sy } = mathToSvg(x, y);

    // Điểm
    const point = createSVGElement("circle");

    point.setAttribute("cx", sx);
    point.setAttribute("cy", sy);
    point.setAttribute("r", 7);
    point.setAttribute("class", "exercise-point");

    // Tên điểm
    const label = createSVGElement("text");

    label.setAttribute("x", sx + 12);
    label.setAttribute("y", sy - 12);
    label.setAttribute("class", "point-label");

    label.textContent = name;

    group.appendChild(point);
    group.appendChild(label);
}

/* =====================================================
VẼ TOÀN BỘ
===================================================== */

function drawCoordinateSystem() {


svg.innerHTML = "";

createArrowMarker();


const gridGroup =
    createSVGElement("g");

const axesGroup =
    createSVGElement("g");

const ticksGroup =
    createSVGElement("g");

const pointGroup =
    createSVGElement("g");


drawGrid(gridGroup);
drawAxes(axesGroup);
drawTicks(ticksGroup);
drawExercisePoint(pointGroup);


svg.appendChild(gridGroup);
svg.appendChild(axesGroup);
svg.appendChild(ticksGroup);
svg.appendChild(pointGroup);


}

/* =====================================================
TẠO BÀI MỚI
===================================================== */

function randomInteger() {


return Math.floor(
    Math.random() *
    (
        CONFIG.max -
        CONFIG.min +
        1
    )
) + CONFIG.min;


}

// =====================================================
// CẬP NHẬT HÀM TẠO BÀI TẬP THÔNG THƯỜNG VÀ PHẢN XẠ
// =====================================================
function generateExercise() {
    const coords = generateCoordinate();
    const x = coords.x;
    const y = coords.y;

    const name =
        CONFIG.points[
            Math.floor(
                Math.random() *
                CONFIG.points.length
            )
        ];

    state.exercise = {
        name,
        x,
        y
    };

    state.answered = false;
    updateExerciseUI();
    drawCoordinateSystem();
}

/* =====================================================
CẬP NHẬT PANEL
===================================================== */

function updateExerciseUI() {


readPointName.textContent =
    state.exercise.name;

plotPointName.textContent =
    state.exercise.name;

targetCoordinate.textContent =
    `(${state.exercise.x}; ${state.exercise.y})`;


answerX.value = "";
answerY.value = "";


clearFeedback();


}

/* =====================================================
CHUYỂN DẠNG BÀI
===================================================== */

// =========================================================
// CHẾ ĐỘ PHẢN XẠ
// =========================================================

// DOM của chế độ phản xạ
const reflexPanel = document.getElementById("reflex-panel");
const reflexPointName = document.getElementById("reflex-point-name");
const reflexAnswerX = document.getElementById("reflex-answer-x");
const reflexAnswerY = document.getElementById("reflex-answer-y");
const reflexSubmit = document.getElementById("reflex-submit");
const reflexFeedback = document.getElementById("reflex-feedback");
const reflexScoreElement = document.getElementById("score");

// Modal luật chơi
const reflexRulesModal = document.getElementById("reflex-rules-modal");
const reflexCancel = document.getElementById("reflex-cancel");
const reflexStart = document.getElementById("reflex-start");


// Trạng thái riêng của chế độ phản xạ
const reflexState = {
    score: 0,
    started: false,
    finished: false
};


// =========================================================
// CHUYỂN CHẾ ĐỘ
// =========================================================

/* =====================================================
THÊM BIẾN LƯU TÊN HỌC SINH
===================================================== */
let studentName = "";
const studentNameInput = document.getElementById("student-name-input");

// Biến tham chiếu tới nút Bài mới để ẩn/hiện
const newExerciseBtn = document.getElementById("new-exercise");

// =====================================================
// CẬP NHẬT CHUYỂN CHẾ ĐỘ (Hỗ trợ ẩn nút Bài mới & Tên)
// =====================================================
function setMode(mode) {
    if (mode === "reflex") {
        reflexRulesModal.hidden = false;
        // Focus vào ô nhập tên nếu có modal mở lên
        setTimeout(() => {
            if (studentNameInput) studentNameInput.focus();
        }, 100);
        return;
    }

    state.mode = mode;

    readPanel.hidden = mode !== "read";
    plotPanel.hidden = mode !== "plot";
    reflexPanel.hidden = true;

    // Ở chế độ thông thường, hiện nút bài mới
    newExerciseBtn.hidden = false;
    
    // Đổi hiển thị khung điểm về mặc định (chữ "Điểm")
    document.querySelector(".score span").textContent = "Điểm";

    tabs.forEach(tab => {
        tab.classList.toggle(
            "active",
            tab.dataset.mode === mode
        );
    });

    generateExercise();
}


// =====================================================
// BẮT ĐẦU CHẾ ĐỘ PHẢN XẠ (Kiểm tra tên & Ẩn nút bài mới)
// =====================================================
function startReflexMode() {
    const enteredName = studentNameInput.value.trim();
    if (!enteredName) {
        alert("Vui lòng nhập họ và tên trước khi bắt đầu!");
        studentNameInput.focus();
        return;
    }

    studentName = enteredName;
    reflexRulesModal.hidden = true;

    state.mode = "reflex";

    readPanel.hidden = true;
    plotPanel.hidden = true;
    reflexPanel.hidden = false;

    // Ẩn nút "Bài mới" ở chế độ phản xạ vì câu hỏi tự động sinh
    newExerciseBtn.hidden = true;

    tabs.forEach(tab => {
        tab.classList.toggle(
            "active",
            tab.dataset.mode === "reflex"
        );
    });

    reflexState.score = 0;
    reflexState.started = true;
    reflexState.finished = false;
    
    reflexAnswerX.disabled = false;
    reflexAnswerY.disabled = false;
    reflexSubmit.disabled = false;

    // Hiển thị tên học sinh thay thế hoặc kết hợp trên nhãn khung Điểm
    document.querySelector(".score span").innerHTML = `Điểm (${studentName})`;
    reflexScoreElement.textContent = "0";
    reflexFeedback.textContent = "";

    generateReflexExercise();
    reflexAnswerX.focus();
}



// =========================================================
// HỦY VÀO CHẾ ĐỘ PHẢN XẠ
// =========================================================

function cancelReflexMode() {
    reflexRulesModal.hidden = true;

    // Tìm lại chế độ hiện tại trước khi mở modal
    const currentTab = [...tabs].find(
        tab => tab.classList.contains("active")
    );

    const previousMode =
        currentTab?.dataset.mode || "read";

    state.mode = previousMode;

    readPanel.hidden = previousMode !== "read";
    plotPanel.hidden = previousMode !== "plot";
    reflexPanel.hidden = true;

    tabs.forEach(tab => {
        tab.classList.toggle(
            "active",
            tab.dataset.mode === previousMode
        );
    });
}


// =========================================================
// TẠO CÂU HỎI MỚI CHO PHẢN XẠ
// =========================================================

function generateReflexExercise() {
    const coords = generateCoordinate();
    const x = coords.x;
    const y = coords.y;

    const name =
        CONFIG.points[
            Math.floor(Math.random() * CONFIG.points.length)
        ];

    state.exercise = {
        name,
        x,
        y
    };

    state.answered = false;

    reflexPointName.textContent = name;
    reflexAnswerX.value = "";
    reflexAnswerY.value = "";
    reflexFeedback.textContent = "";

    drawCoordinateSystem();
}


// =========================================================
// KIỂM TRA CÂU TRẢ LỜI PHẢN XẠ
// =========================================================

function checkReflexAnswer() {
    // Không xử lý nếu chưa bắt đầu
    // hoặc đã đạt 10 điểm.
    if (!reflexState.started || reflexState.finished) {
        return;
    }

    const x = Number(reflexAnswerX.value);
    const y = Number(reflexAnswerY.value);

    const correct =
        x === state.exercise.x &&
        y === state.exercise.y;

    if (correct) {

        // Đúng → cộng 1
        reflexState.score++;

        reflexScoreElement.textContent =
            reflexState.score;

        reflexFeedback.textContent =
            "✓ Chính xác!";

        reflexFeedback.className =
            "feedback correct";

        // Đạt 10 câu liên tiếp
        if (reflexState.score >= 10) {
            finishReflexMode();
            return;
        }

        // Chờ rất ngắn để học sinh thấy kết quả
        // rồi chuyển ngay sang câu tiếp theo.
        setTimeout(() => {
            if (
                state.mode === "reflex" &&
                reflexState.started &&
                !reflexState.finished
            ) {
                generateReflexExercise();
                reflexAnswerX.focus();
            }
        }, 300);

    } else {

        // Sai → về 0
        reflexState.score = 0;

        reflexScoreElement.textContent = "0";

        reflexFeedback.textContent =
            `✗ Chưa chính xác. Đáp án là (${state.exercise.x}; ${state.exercise.y}). Chuỗi điểm trở về 0.`;

        reflexFeedback.className =
            "feedback incorrect";

        // Tạo câu mới sau khi báo kết quả
        setTimeout(() => {
            if (
                state.mode === "reflex" &&
                reflexState.started &&
                !reflexState.finished
            ) {
                generateReflexExercise();
                reflexAnswerX.focus();
            }
        }, 700);
    }
}


// =========================================================
// KẾT THÚC KHI ĐẠT 10 ĐIỂM
// =========================================================

function finishReflexMode() {
    reflexState.finished = true;
    reflexState.started = false;

    reflexScoreElement.textContent = "10";

    reflexFeedback.textContent =
        "🎉 Hoàn thành! Bạn đã trả lời đúng 10 câu liên tiếp.";

    reflexFeedback.className =
        "feedback correct";

    reflexAnswerX.disabled = true;
    reflexAnswerY.disabled = true;
    reflexSubmit.disabled = true;
}


// =========================================================
// SỰ KIỆN
// =========================================================

// Bấm "Đồng ý, bắt đầu"
reflexStart.addEventListener(
    "click",
    startReflexMode
);


// Bấm "Hủy"
reflexCancel.addEventListener(
    "click",
    cancelReflexMode
);


// Bấm "Trả lời"
reflexSubmit.addEventListener(
    "click",
    checkReflexAnswer
);


// Nhấn Enter trong ô tọa độ
reflexAnswerX.addEventListener(
    "keydown",
    event => {
        if (event.key === "Enter") {
            checkReflexAnswer();
        }
    }
);

reflexAnswerY.addEventListener(
    "keydown",
    event => {
        if (event.key === "Enter") {
            checkReflexAnswer();
        }
    }
);

/* =====================================================
KIỂM TRA ĐỌC TỌA ĐỘ
===================================================== */

function checkReadAnswer() {


if (state.answered) return;


const x =
    Number(answerX.value);

const y =
    Number(answerY.value);


const correct =
    x === state.exercise.x &&
    y === state.exercise.y;


if (correct) {

    showFeedback(
        readFeedback,
        "correct",
        "Chính xác! Bạn đã đọc đúng tọa độ."
    );

    state.score++;

    state.answered = true;

} else {

    let message =
        "Chưa chính xác. ";

    if (x !== state.exercise.x) {
        message +=
            "Kiểm tra lại hoành độ x. ";
    }

    if (y !== state.exercise.y) {
        message +=
            "Kiểm tra lại tung độ y.";
    }

    showFeedback(
        readFeedback,
        "wrong",
        message
    );
}


updateScore();


}

/* =====================================================
CLICK MẶT PHẲNG
===================================================== */

svg.addEventListener("click", event => {
    if (state.mode !== "plot") return;
    if (state.answered) return;

    // Nếu người dùng vừa thực hiện kéo màn hình (Pan > 6px) thì KHÔNG tính là click chấm điểm
    if (totalMoveDistance > 3) return;

    const rect = svg.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;

    const math = svgToMath(px, py);
    const x = Math.round(math.x);
    const y = Math.round(math.y);

    const target = state.exercise;

    if (x === target.x && y === target.y) {
        showFeedback(plotFeedback, "correct", "Chính xác! Bạn đã đặt điểm đúng vị trí.");
        state.score++;
        state.answered = true;
        drawStudentPoint(target.x, target.y);
    } else {
        let message = "Chưa đúng. ";
        if (x !== target.x) {
            message += x < target.x ? "Điểm cần sang phải. " : "Điểm cần sang trái. ";
        }
        if (y !== target.y) {
            message += y < target.y ? "Điểm cần lên trên." : "Điểm cần xuống dưới.";
        }
        showFeedback(plotFeedback, "wrong", message);
    }

    updateScore();
});

/* =====================================================
HIỂN THỊ ĐIỂM HỌC SINH ĐẶT
===================================================== */

function drawStudentPoint(x, y) {


const p =
    mathToSvg(x, y);


const point =
    createSVGElement("circle", {
        cx: p.x,
        cy: p.y,
        r: 7,
        class: "student-point"
    });


svg.appendChild(point);


}

/* =====================================================
TỌA ĐỘ CON TRỎ
===================================================== */



/* =====================================================
FEEDBACK
===================================================== */

function showFeedback(
element,
type,
message
) {


element.className =
    `feedback ${type}`;

element.textContent =
    message;


}

function clearFeedback() {


readFeedback.className =
    "feedback";

readFeedback.textContent =
    "";

plotFeedback.className =
    "feedback";

plotFeedback.textContent =
    "";


}

/* =====================================================
ĐIỂM
===================================================== */

function updateScore() {


scoreElement.textContent =
    state.score;


}

/* =====================================================
EVENTS
===================================================== */

tabs.forEach(tab => {


tab.addEventListener(
    "click",
    () => {
        setMode(tab.dataset.mode);
    }
);


});

checkAnswer.addEventListener(
"click",
checkReadAnswer
);

newExerciseButton.addEventListener(
"click",
generateExercise
);

answerX.addEventListener(
"keydown",
event => {


    if (event.key === "Enter") {
        checkReadAnswer();
    }
}


);

answerY.addEventListener(
"keydown",
event => {


    if (event.key === "Enter") {
        checkReadAnswer();
    }
}


);

window.addEventListener(
"resize",
updateViewSize
);


// =========================================================
// HỖ TRỢ PAN + ZOOM TỐI ƯU CHO MÀN HÌNH CẢM ỨNG & MÁY TÍNH
// =========================================================



// ---------------------------------------------------------
// Bắt đầu pan
// ---------------------------------------------------------


// ---------------------------------------------------------
// Kết thúc pan
// ---------------------------------------------------------
svg.addEventListener("pointerup", (event) => {

    isPanning = false;

    if (svg.hasPointerCapture(event.pointerId)) {
        svg.releasePointerCapture(event.pointerId);
    }
});





// ---------------------------------------------------------
// Zoom bằng con lăn chuột
// ---------------------------------------------------------



// ---------------------------------------------------------
// Zoom bằng pinch trên màn hình cảm ứng
// ---------------------------------------------------------
let pinchDistance = null;

svg.addEventListener("pointerdown", (event) => {

    if (event.pointerType !== "touch") return;

    const touches = [...svg.getPointerCapture ? [] : []];

    // Pinch được xử lý thông qua hai pointer đang hoạt động
});



svg.addEventListener("pointerdown", (event) => {

    if (event.pointerType !== "touch") return;

    activePointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY
    });

    if (activePointers.size === 2) {
        const points = [...activePointers.values()];

        pinchDistance = Math.hypot(
            points[0].x - points[1].x,
            points[0].y - points[1].y
        );
    }
});


svg.addEventListener("pointermove", (event) => {

    if (event.pointerType !== "touch") return;

    if (!activePointers.has(event.pointerId)) return;

    activePointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY
    });

    if (activePointers.size !== 2) return;

    const points = [...activePointers.values()];

    const newDistance = Math.hypot(
        points[0].x - points[1].x,
        points[0].y - points[1].y
    );

    if (!pinchDistance || pinchDistance === 0) {
        pinchDistance = newDistance;
        return;
    }

    const factor = newDistance / pinchDistance;

    // Chỉ thay đổi khi đủ rõ ràng để tránh rung
    if (Math.abs(factor - 1) < 0.01) return;

    const rect = svg.getBoundingClientRect();

    // Tâm của hai ngón tay
    const centerX =
        (points[0].x + points[1].x) / 2 - rect.left;

    const centerY =
        (points[0].y + points[1].y) / 2 - rect.top;

    const before = svgToMath(centerX, centerY);

    view.scale = Math.max(
        ZOOM_MIN,
        Math.min(ZOOM_MAX, view.scale * factor)
    );

    const after = svgToMath(centerX, centerY);

    view.centerX += (after.x - before.x) * view.scale;
    view.centerY -= (after.y - before.y) * view.scale;

    pinchDistance = newDistance;

    drawCoordinateSystem();
});


svg.addEventListener("pointerup", (event) => {

    if (event.pointerType !== "touch") return;

    activePointers.delete(event.pointerId);

    if (activePointers.size < 2) {
        pinchDistance = null;
    }
});




// =====================================================
// HÀM SINH TỌA ĐỘ VỚI TỶ LỆ 40% TRÊN TRỤC - 60% NGOÀI TRỤC
// =====================================================
function generateCoordinate() {
    let x, y;
    // Tỷ lệ 30% nằm trên trục (Ox hoặc Oy), 70% không nằm trên trục nào
    const isOnAxis = Math.random() < 0.3; 

    if (isOnAxis) {
        // Nằm trên trục tọa độ (x = 0 hoặc y = 0, nhưng không đồng thời là O(0,0))
        if (Math.random() < 0.5) {
            // Nằm trên trục Oy -> x = 0, y chạy từ min đến max (trừ 0)
            x = 0;
            do {
                y = randomInteger();
            } while (y === 0);
        } else {
            // Nằm trên trục Ox -> y = 0, x chạy từ min đến max (trừ 0)
            y = 0;
            do {
                x = randomInteger();
            } while (x === 0);
        }
    } else {
        // Không nằm trên trục nào -> Cả x và y đều khác 0
        do {
            x = randomInteger();
            y = randomInteger();
        } while (x === 0 || y === 0);
    }

    return { x, y };
}
/* =====================================================
KHỞI ĐỘNG
===================================================== */

updateViewSize();
generateExercise();



const fullscreenBtn = document.getElementById("fullscreen-btn");

if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", () => {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    });
}


// =========================================================
// XỬ LÝ SỰ KIỆN NÚT ZOOM VÀ RESET VIEW
// =========================================================
const zoomInBtn = document.getElementById("zoom-in-btn");
const zoomOutBtn = document.getElementById("zoom-out-btn");
const zoomResetBtn = document.getElementById("zoom-reset-btn");

// Hàm thực hiện Zoom theo tỉ lệ
function applyZoom(factor) {
    const newScale = Math.max(
        ZOOM_MIN,
        Math.min(ZOOM_MAX, view.scale * factor)
    );
    view.scale = newScale;
    drawCoordinateSystem();
}

// Hàm Reset mặt phẳng tọa độ về tâm chính giữa
function resetView() {
    view.centerX = 0;
    view.centerY = 0;
    updateViewSize(); // Tính lại scale vừa vặn với kích thước màn hình
}

if (zoomInBtn) {
    zoomInBtn.addEventListener("click", () => applyZoom(1.2));
}

if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", () => applyZoom(0.8));
}

if (zoomResetBtn) {
    zoomResetBtn.addEventListener("click", resetView);
}


/* =========================================================================

   KHỐI XỬ LÝ PAN VÀ ZOOM (SAO CHÉP TỪ DỰ ÁN MẪU & TỐI ƯU CHO DỰ ÁN CẦN CẢI TẠO)

   ========================================================================= */







/* -------------------------------------------------------------------------

   1. CHUYỂN ĐỔI TỌA ĐỘ (Cập nhật theo panX, panY và scale)

   ------------------------------------------------------------------------- */

function mathToSvg(x, y) {

    const parent = viewport || svg.parentElement;

    const width = parent ? parent.clientWidth : (window.innerWidth || 800);

    const height = parent ? parent.clientHeight : (window.innerHeight || 600);

    const centerX = width / 2 + panX;

    const centerY = height / 2 + panY;



    return {

        x: centerX + x * scale,

        y: centerY - y * scale

    };

}



function svgToMath(px, py) {

    const parent = viewport || svg.parentElement;

    const width = parent ? parent.clientWidth : (window.innerWidth || 800);

    const height = parent ? parent.clientHeight : (window.innerHeight || 600);

    const centerX = width / 2 + panX;

    const centerY = height / 2 + panY;



    return {

        x: (px - centerX) / scale,

        y: (centerY - py) / scale

    };

}



/* -------------------------------------------------------------------------

   2. KHỞI TẠO VÀ ĐĂNG KÝ SỰ KIỆN TƯƠNG TÁC (MOUSE, TOUCH & WHEEL)

   ------------------------------------------------------------------------- */

function initInteraction() {

    const cursorCoords = document.getElementById("cursor-coords");



    // --- A. TƯƠNG TÁC CHUỘT (MOUSE) ---

    svg.addEventListener("mousedown", (e) => {

        if (e.button !== 0) return; // Chỉ nhận chuột trái

        isDragging = true;

        totalMoveDistance = 0;

        startX = e.clientX - panX;

        startY = e.clientY - panY;

    });



    window.addEventListener("mousemove", (e) => {

        if (isDragging) {

            const currentPanX = e.clientX - startX;

            const currentPanY = e.clientY - startY;

            

            totalMoveDistance = Math.hypot(currentPanX - panX, currentPanY - panY);

            

            panX = currentPanX;

            panY = currentPanY;

            drawCoordinateSystem(); // Vẽ lại mặt phẳng

        }



        // Cập nhật tọa độ con trỏ chuột

        const rect = svg.getBoundingClientRect();

        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {

            const px = e.clientX - rect.left;

            const py = e.clientY - rect.top;

            const math = svgToMath(px, py);

            if (cursorCoords) {

                cursorCoords.textContent = `(${Math.round(math.x * 10) / 10}; ${Math.round(math.y * 10) / 10})`;

            }

        }

    });



    window.addEventListener("mouseup", () => {

        isDragging = false;

    });



    // --- B. TƯƠNG TÁC CẢM ỨNG (TOUCH CHO MOBILE / TABLET) ---

    let initialPinchDist = null;



    svg.addEventListener("touchstart", (e) => {

        if (e.touches.length === 1) {

            isDragging = true;

            totalMoveDistance = 0;

            startX = e.touches[0].clientX - panX;

            startY = e.touches[0].clientY - panY;

        } else if (e.touches.length === 2) {

            isDragging = false;

            initialPinchDist = Math.hypot(

                e.touches[0].clientX - e.touches[1].clientX,

                e.touches[0].clientY - e.touches[1].clientY

            );

        }

    }, { passive: true });



    window.addEventListener("touchmove", (e) => {

        // Pan 1 ngón tay

        if (isDragging && e.touches.length === 1) {

            if (e.cancelable) e.preventDefault(); // Ngăn cuộn trang



            const currentPanX = e.touches[0].clientX - startX;

            const currentPanY = e.touches[0].clientY - startY;



            totalMoveDistance = Math.hypot(currentPanX - panX, currentPanY - panY);



            panX = currentPanX;

            panY = currentPanY;

            drawCoordinateSystem();

        } 

        // Pinch Zoom 2 ngón tay

        else if (e.touches.length === 2 && initialPinchDist) {

            if (e.cancelable) e.preventDefault();



            const newDist = Math.hypot(

                e.touches[0].clientX - e.touches[1].clientX,

                e.touches[0].clientY - e.touches[1].clientY

            );



            if (newDist > 0 && initialPinchDist > 0) {

                const zoomFactor = newDist / initialPinchDist;

                scale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, scale * zoomFactor));

                initialPinchDist = newDist;

                drawCoordinateSystem();

            }

        }

    }, { passive: false });



    window.addEventListener("touchend", () => {

        isDragging = false;

        initialPinchDist = null;

    });



    // --- C. ZOOM BẰNG CON LĂN CHUỘT (WHEEL) ---

    svg.addEventListener("wheel", (e) => {

        e.preventDefault();

        const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;

        scale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, scale * zoomFactor));

        drawCoordinateSystem();

    }, { passive: false });

}



/* -------------------------------------------------------------------------

   3. CÁC NÚT ĐIỀU KHIỂN ZOOM / RESET VIEW

   ------------------------------------------------------------------------- */

function resetView() {

    panX = 0;

    panY = 0;

    

    // Tự động tính lại scale chuẩn fit màn hình

    const parent = viewport || svg.parentElement;

    const width = parent ? parent.clientWidth : 800;

    const height = parent ? parent.clientHeight : 600;

    const padding = 40;

    const scaleX = (width - padding * 2) / (CONFIG.max - CONFIG.min);

    const scaleY = (height - padding * 2) / (CONFIG.max - CONFIG.min);

    

    scale = Math.max(15, Math.min(scaleX, scaleY));

    drawCoordinateSystem();

}



function applyZoom(factor) {

    scale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, scale * factor));

    drawCoordinateSystem();

}



// Lắng nghe các nút zoom ngoài UI

//const zoomInBtn = document.getElementById("zoom-in-btn");

//const zoomOutBtn = document.getElementById("zoom-out-btn");

//const zoomResetBtn = document.getElementById("zoom-reset-btn");



if (zoomInBtn) zoomInBtn.addEventListener("click", () => applyZoom(1.2));

if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => applyZoom(0.8));

if (zoomResetBtn) zoomResetBtn.addEventListener("click", resetView);



// Đăng ký khởi chạy sự kiện

initInteraction();