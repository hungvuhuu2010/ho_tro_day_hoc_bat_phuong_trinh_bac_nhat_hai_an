// Quản lý trạng thái ứng dụng
let inequalities = [];
// Bổ sung biến toàn cục quản lý cỡ chữ
let axisFontSize = 18; // Mặc định cỡ chữ nhãn trục

let scale = 20; // 1 đơn vị tương ứng bao nhiêu pixel ở mức zoom mặc định
let panX = 0;   // Dịch chuyển tâm theo trục X
let panY = 0;   // Dịch chuyển tâm theo trục Y
let isDragging = false;
let startX = 0, startY = 0;

document.addEventListener("DOMContentLoaded", () => {
    initUI();
    initInteraction();
    renderGraph();
});

function initUI() {
    const container = document.getElementById("function-cards-container");
    
    function renderCards() {
        container.innerHTML = "";
        inequalities.forEach((item, index) => {
            const card = document.createElement("div");
            card.className = "function-card";
            card.innerHTML = `
                <div class="card-header">
                    <span>BPT ${index + 1}</span>
                    <button class="btn-remove-card" title="Xóa"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="input-row">
                    <input type="text" class="expr-input" value="${item.expr}" placeholder="VD: 2x + 3y <= 6">
                </div>
                <div class="input-row">
                    <input type="color" class="color-picker" value="${item.color}" style="width: 40px; height: 38px; border: none; border-radius: 6px; cursor: pointer;">
                    <select class="pattern-select" style="flex: 1;">
                        <option value="solid" ${item.pattern === 'solid' ? 'selected' : ''}>Solid (Tô mờ)</option>
                        <option value="slash" ${item.pattern === 'slash' ? 'selected' : ''}>Gạch xiên (////)</option>
                        <option value="backslash" ${item.pattern === 'backslash' ? 'selected' : ''}>Gạch xiên (\\\\)</option>
                        <option value="horizontal" ${item.pattern === 'horizontal' ? 'selected' : ''}>Gạch ngang (=====)</option>
                        <option value="vertical" ${item.pattern === 'vertical' ? 'selected' : ''}>Gạch dọc (||||)</option>
                    </select>
                </div>
            `;

            // Lắng nghe sự kiện thay đổi
            const input = card.querySelector(".expr-input");
            input.addEventListener("input", (e) => {
                inequalities[index].expr = e.target.value;
                renderGraph();
            });

            const colorPicker = card.querySelector(".color-picker");
            colorPicker.addEventListener("input", (e) => {
                inequalities[index].color = e.target.value;
                renderGraph();
            });

            const patternSelect = card.querySelector(".pattern-select");
            patternSelect.addEventListener("change", (e) => {
                inequalities[index].pattern = e.target.value;
                renderGraph();
            });

            const removeBtn = card.querySelector(".btn-remove-card");
            removeBtn.addEventListener("click", () => {
                inequalities.splice(index, 1);
                renderCards();
                renderGraph();
            });

            container.appendChild(card);
        });
    }

    renderCards();

    document.getElementById("btn-add-inequality").addEventListener("click", () => {
        inequalities.push({
            id: Date.now(),
            expr: "",
            color: "#dc2626",
            pattern: "slash"
        });
        renderCards();
        renderGraph();
    });

    document.getElementById("ox-unit-select").addEventListener("change", () => {
        renderGraph();
    });

    // Zoom buttons
    document.getElementById("btn-zoom-in").addEventListener("click", () => { scale *= 1.2; renderGraph(); });
    document.getElementById("btn-zoom-out").addEventListener("click", () => { scale /= 1.2; renderGraph(); });
    document.getElementById("btn-reset-view").addEventListener("click", () => { scale = 20; panX = 0; panY = 0; renderGraph(); });
	// Thêm sự kiện điều chỉnh cỡ chữ
    document.getElementById("btn-font-inc").addEventListener("click", () => {
        axisFontSize = Math.min(48, axisFontSize + 2);
        renderGraph();
    });
    document.getElementById("btn-font-dec").addEventListener("click", () => {
        axisFontSize = Math.max(14, axisFontSize - 2);
        renderGraph();
    });

    // Thêm sự kiện Copy ảnh chất lượng cao (~200 PPI)
    document.getElementById("btn-copy-clipboard").addEventListener("click", copyGraphToClipboard);
}

function initInteraction() {
    const svg = document.getElementById("coordinate-system");
    const cursorCoords = document.getElementById("cursor-coords");

    svg.addEventListener("mousedown", (e) => {
        isDragging = true;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
    });

    window.addEventListener("mousemove", (e) => {
        if (isDragging) {
            panX = e.clientX - startX;
            panY = e.clientY - startY;
            renderGraph();
        }

        // Tính toán tọa độ thực trên mặt phẳng
        const rect = svg.getBoundingClientRect();
        const svgCenterX = rect.width / 2 + panX;
        const svgCenterY = rect.height / 2 + panY;
        const xVal = (e.clientX - rect.left - svgCenterX) / scale;
        const yVal = (svgCenterY - (e.clientY - rect.top)) / scale;
        
        if(rect.left <= e.clientX && e.clientX <= rect.right && rect.top <= e.clientY && e.clientY <= rect.bottom) {
            cursorCoords.textContent = `x: ${xVal.toFixed(2)}, y: ${yVal.toFixed(2)}`;
        }
    });

    window.addEventListener("mouseup", () => { isDragging = false; });

	// --- 2. Sự kiện cảm ứng (Touch Events cho Điện thoại / Máy tính bảng) ---
    svg.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            // Tính toán vị trí bắt đầu theo pan hiện tại
            startX = e.touches[0].clientX - panX;
            startY = e.touches[0].clientY - panY;
        }
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
        if (isDragging && e.touches.length === 1) {
            // Ngăn trình duyệt cuộn trang dính theo thao tác kéo bản đồ trên điện thoại
            e.preventDefault(); 
            
            panX = e.touches[0].clientX - startX;
            panY = e.touches[0].clientY - startY;
            renderGraph();
        }
    }, { passive: false });

    window.addEventListener("touchend", () => { 
        isDragging = false; 
    });
	
    svg.addEventListener("wheel", (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        scale *= zoomFactor;
        renderGraph();
    }, { passive: false });
}

function renderGraph() {
    const svg = document.getElementById("coordinate-system");
    if (!svg) return;

    // Lấy kích thước thực tế của vùng chứa, phòng tránh trường hợp rect chưa kịp tính trên di động
    const parent = svg.parentElement;
    const width = parent ? parent.clientWidth : (window.innerWidth || 500);
    const height = parent ? parent.clientHeight : (window.innerHeight || 500);

    // Nếu kích thước vẫn bằng 0, ép đặt giá trị tối thiểu để chống NaN
    const safeWidth = width > 50 ? width : 400;
    const safeHeight = height > 50 ? height : 400;

    // Cập nhật trực tiếp thuộc tính width/height của thẻ SVG để trình duyệt không bị hụt layout
    svg.setAttribute("width", safeWidth);
    svg.setAttribute("height", safeHeight);

    const centerX = safeWidth / 2 + panX;
    const centerY = safeHeight / 2 + panY;
    const unitSelect = document.getElementById("ox-unit-select");
    const unitStep = unitSelect ? (parseInt(unitSelect.value) || 10) : 10;

    let svgContent = svg.querySelector("defs") ? svg.querySelector("defs").outerHTML : "";

    // 1. Vẽ lưới tọa độ và vạch chia
    const stepPx = scale * unitStep;
    
    // Lưới dọc
    for (let x = centerX % stepPx; x < safeWidth; x += stepPx) {
        svgContent += `<line x1="${x}" y1="0" x2="${x}" y2="${safeHeight}" stroke="#f1f5f9" stroke-width="1"/>`;
    }
    for (let x = centerX % stepPx; x > 0; x -= stepPx) {
        svgContent += `<line x1="${x}" y1="0" x2="${x}" y2="${safeHeight}" stroke="#f1f5f9" stroke-width="1"/>`;
    }
    // Lưới ngang
    for (let y = centerY % stepPx; y < safeHeight; y += stepPx) {
        svgContent += `<line x1="0" y1="${y}" x2="${safeWidth}" y2="${y}" stroke="#f1f5f9" stroke-width="1"/>`;
    }
    for (let y = centerY % stepPx; y > 0; y -= stepPx) {
        svgContent += `<line x1="0" y1="${y}" x2="${safeWidth}" y2="${y}" stroke="#f1f5f9" stroke-width="1"/>`;
    }

    // 2. Vẽ trục Ox, Oy, mũi tên đầu dương và nhãn tên trục, gốc tọa độ
    svgContent += `<line x1="0" y1="${centerY}" x2="${safeWidth}" y2="${centerY}" stroke="#000" stroke-width="2"/>`;
    svgContent += `<line x1="${centerX}" y1="0" x2="${centerX}" y2="${safeHeight}" stroke="#000" stroke-width="2"/>`;

    // Vẽ mũi tên đầu dương cho trục Ox và Oy
    svgContent += `<polygon points="${safeWidth},${centerY} ${safeWidth - 10},${centerY - 4} ${safeWidth - 10},${centerY + 4}" fill="#000"/>`;
    svgContent += `<polygon points="${centerX},0 ${centerX - 4},10 ${centerX + 4},10" fill="#000"/>`;

    // Tính toán khoảng cách offset động dựa trên cỡ chữ (axisFontSize)
    const labelFontSize = (typeof axisFontSize !== 'undefined' ? axisFontSize : 11) + 2;
    const offsetX = labelFontSize + 6; 
    const offsetY = labelFontSize + 4; 

    // Nhãn x, y, O
    svgContent += `<text x="${safeWidth - offsetX}" y="${centerY - 8}" fill="#000" font-family="'Cambria Math', Cambria, serif" font-weight="bold" font-size="${labelFontSize}">x</text>`;
    svgContent += `<text x="${centerX + 10}" y="${offsetY}" fill="#000" font-family="'Cambria Math', Cambria, serif" font-weight="bold" font-size="${labelFontSize}">y</text>`;
    svgContent += `<text x="${centerX - offsetY}" y="${centerY + offsetY}" fill="#000" font-family="'Cambria Math', Cambria, serif" font-weight="bold" font-size="${labelFontSize}">O</text>`;
    
    // Tính khoảng cách offset cho vạch chia dựa theo axisFontSize
    const tickLabelOffset = Math.max(12, axisFontSize + 6);

    // Vạch chia đơn vị & chữ số trên trục Ox
    const minValX = -centerX / scale;
    const maxValX = (width - centerX) / scale;
    for (let val = Math.ceil(minValX / unitStep) * unitStep; val <= maxValX; val += unitStep) {
        if (val === 0) continue;
        const px = centerX + val * scale;
        svgContent += `<line x1="${px}" y1="${centerY - 4}" x2="${px}" y2="${centerY + 4}" stroke="#000" stroke-width="1.5"/>`;
        // Nhãn số trục Ox: dùng tickLabelOffset để tự động lùi xuống theo cỡ chữ
        svgContent += `<text x="${px}" y="${centerY + tickLabelOffset}" font-size="${axisFontSize}" font-family="'Cambria Math', Cambria, serif" fill="#000" text-anchor="middle">${val}</text>`;
    }

    // Vạch chia đơn vị & chữ số trên trục Oy
    const minValY = (centerY - height) / scale;
    const maxValY = centerY / scale;
    for (let val = Math.ceil(minValY / unitStep) * unitStep; val <= maxValY; val += unitStep) {
        if (val === 0) continue;
        const py = centerY - val * scale;
        svgContent += `<line x1="${centerX - 4}" y1="${py}" x2="${centerX + 4}" y2="${py}" stroke="#000" stroke-width="1.5"/>`;
        // Nhãn số trục Oy: dùng tickLabelOffset để tự động lùi sang trái theo cỡ chữ
        svgContent += `<text x="${centerX - tickLabelOffset + 2}" y="${py + (axisFontSize / 3)}" font-size="${axisFontSize}" font-family="'Cambria Math', Cambria, serif" fill="#000" text-anchor="end">${val}</text>`;
    }

    // 3. Render các miền nghiệm bất phương trình (Phần bị gạch)
    if (typeof inequalities !== 'undefined') {
        inequalities.forEach(item => {
            try {
                const parsed = parseLinearInequality(item.expr);
                if (!parsed) return;

                let { a, b, op, c } = parsed;
                if (a === 0 && b === 0) return;

                let pts = [];
                let x1 = (0 - centerX) / scale;
                let y1_val = b !== 0 ? (c - a * x1) / b : null;
                let x2 = (safeWidth - centerX) / scale;
                let y2_val = b !== 0 ? (c - a * x2) / b : null;

                if (b !== 0) {
                    pts.push({ x: x1, y: y1_val }, { x: x2, y: y2_val });
                }
                let y_top = (0 - centerY) / scale;
                let x_top = a !== 0 ? (c - b * y_top) / a : null;
                let y_bot = (safeHeight - centerY) / scale;
                let x_bot = a !== 0 ? (c - b * y_bot) / a : null;

                if (a !== 0) {
                    pts.push({ x: x_top, y: y_top }, { x: x_bot, y: y_bot });
                }

                let validPts = pts.filter(p => p.x !== null && p.y !== null && p.x >= minValX - 5 && p.x <= maxValX + 5);
                let uniquePts = [];
                validPts.forEach(p => {
                    if (!uniquePts.some(up => Math.abs(up.x - p.x) < 0.01 && Math.abs(up.y - p.y) < 0.01)) {
                        uniquePts.push(p);
                    }
                });

                if (uniquePts.length >= 2) {
                    let pA = uniquePts[0];
                    let pB = uniquePts[1];
                    let screenAx = centerX + pA.x * scale;
                    let screenAy = centerY - pA.y * scale;
                    let screenBx = centerX + pB.x * scale;
                    let screenBy = centerY - pB.y * scale;

                    let strokeDash = (op.includes('=')) ? "" : "5,5";

                    // Vẽ đường biên
                    svgContent += `<line x1="${screenAx}" y1="${screenAy}" x2="${screenBx}" y2="${screenBy}" stroke="${item.color}" stroke-width="2" stroke-dasharray="${strokeDash}"/>`;

                    // Vẽ phần bù bị gạch (giữ miền nghiệm trắng)
                    // CHỈ VẼ PHẦN GẠCH MIỀN NGHIỆM NẾU KHÔNG PHẢI LÀ DẤU BẰNG (=)
					if (op !== '=') {
						let polygonPoints = getShadePolygon(screenAx, screenAy, screenBx, screenBy, a, b, c, op, safeWidth, safeHeight, centerX, centerY);
						let patternUrl = `url(#pattern-${item.pattern})`;
						svgContent += `<polygon points="${polygonPoints}" fill="${patternUrl}" color="${item.color}"/>`;
					}
                }
            } catch (err) {
                console.error("Lỗi phân tích BPT:", err);
            }
        });
    }

    svg.innerHTML = svgContent;
}

// Hàm hỗ trợ phân tích cú pháp bất phương trình bậc nhất hai ẩn đơn giản
function parseLinearInequality(str) {
    str = str.replace(/\s+/g, '');
    let match = str.match(/([<>]?=?)?/);
    // Tìm toán tử so sánh
    let op = "<=";
    if (str.includes(">=")) op = ">=";
    else if (str.includes("<=")) op = "<=";
    else if (str.includes(">")) op = ">";
    else if (str.includes("<")) op = "<";
    else if (str.includes("=")) op = "=";

    let parts = str.split(op);
    if (parts.length !== 2) return null;

    let leftExpr = parts[0];
    let rightExpr = parts[1];

    // Đơn giản hóa: Chuyển vế trái - vế phải <= 0 để lấy hệ số a, b, c
    // Hỗ trợ dạng chuẩn ax + by c
    let a = 0, b = 0, c = 0;
    
    // Tách các thành phần chứa x, y, số tự do qua hàm thô
    try {
        // Gán giá trị giả định x=0, y=0 và x=1, y=0 để suy ra hệ số (hoặc dùng mathjs)
        let evalNodeL = math.parse(leftExpr);
        let evalNodeR = math.parse(rightExpr);
        
        let val00 = evalNodeL.evaluate({x:0, y:0}) - evalNodeR.evaluate({x:0, y:0});
        let val10 = evalNodeL.evaluate({x:1, y:0}) - evalNodeR.evaluate({x:1, y:0});
        let val01 = evalNodeL.evaluate({x:0, y:1}) - evalNodeR.evaluate({x:0, y:1});

        a = val10 - val00; // hệ số của x
        b = val01 - val00; // hệ số của y
        c = -val00;        // hệ số tự do bên phải
    } catch(e) {
        return null;
    }

    return { a, b, op, c };
}

	// Tính toán đa giác phần bù bị gạch (Miền nghiệm giữ trắng, phần còn lại bị gạch)
	function getShadePolygon(x1, y1, x2, y2, a, b, c, op, width, height, cx, cy) {

		// =========================================================
		// TRƯỜNG HỢP ĐẶC BIỆT 1: b = 0
		// Đường biên: ax = c  ->  x = c/a
		// =========================================================
		if (Math.abs(b) < 1e-12 && Math.abs(a) > 1e-12) {

			// x1 và x2 chính là tọa độ màn hình của đường x = c/a
			const boundaryX = (c / a) * 0 + x1;

			// Với <= hoặc < :
			// miền nghiệm: ax <= c
			// phần cần gạch: ax > c
			//
			// Với >= hoặc > :
			// miền nghiệm: ax >= c
			// phần cần gạch: ax < c

			let shadeRight;

			if (op === '<=' || op === '<') {
				// ax > c
				shadeRight = a > 0;
			} else {
				// ax < c
				shadeRight = a < 0;
			}

			if (shadeRight) {
				// Gạch toàn bộ nửa mặt phẳng bên PHẢI
				return `
					${boundaryX},0
					${width},0
					${width},${height}
					${boundaryX},${height}
				`;
			} else {
				// Gạch toàn bộ nửa mặt phẳng bên TRÁI
				return `
					0,0
					${boundaryX},0
					${boundaryX},${height}
					0,${height}
				`;
			}
		}


		// =========================================================
		// TRƯỜNG HỢP ĐẶC BIỆT 2: a = 0
		// Đường biên: by = c  ->  y = c/b
		// =========================================================
		if (Math.abs(a) < 1e-12 && Math.abs(b) > 1e-12) {

			// y1 và y2 chính là tọa độ màn hình của đường y = c/b
			const boundaryY = (c / b) * 0 + y1;

			// Với <= hoặc < :
			// miền nghiệm: by <= c
			// phần cần gạch: by > c
			//
			// Với >= hoặc > :
			// miền nghiệm: by >= c
			// phần cần gạch: by < c

			let shadeTop;

			if (op === '<=' || op === '<') {
				// by > c
				// Nếu b > 0 => y toán học lớn hơn => nằm phía trên màn hình
				shadeTop = b > 0;
			} else {
				// by < c
				shadeTop = b < 0;
			}

			if (shadeTop) {
				// Gạch toàn bộ nửa mặt phẳng phía TRÊN
				return `
					0,0
					${width},0
					${width},${boundaryY}
					0,${boundaryY}
				`;
			} else {
				// Gạch toàn bộ nửa mặt phẳng phía DƯỚI
				return `
					0,${boundaryY}
					${width},${boundaryY}
					${width},${height}
					0,${height}
				`;
			}
		}


		// =========================================================
		// TRƯỜNG HỢP TỔNG QUÁT: a != 0 và b != 0
		// =========================================================

		let ext = Math.max(width, height) * 3;

		// Độ dài vectơ pháp tuyến
		let len = Math.sqrt(a * a + b * b);
		if (len === 0) {
			return `${x1},${y1} ${x2},${y2}`;
		}

		let nx = a / len;
		let ny = b / len;

		// Chuyển sang hệ tọa độ màn hình SVG
		let screenNx = nx;
		let screenNy = -ny;

		// Xác định phía cần gạch
		let sign = 1;

		if (op === '>=' || op === '>') {
			sign = -1;
		}

		let dx = screenNx * sign * ext;
		let dy = screenNy * sign * ext;

		return `
			${x1},${y1}
			${x2},${y2}
			${x2 + dx},${y2 + dy}
			${x1 + dx},${y1 + dy}
		`;
	}

async function copyGraphToClipboard() {
    const viewport = document.querySelector(".graph-viewport");
    const svgElement = document.getElementById("coordinate-system");
    const controlPanel = document.querySelector(".control-panel");
    
    // Lấy kích thước thực tế của vùng hiển thị đồ thị (bên phải)
    const viewportRect = viewport.getBoundingClientRect();
    const panelWidth = controlPanel ? controlPanel.offsetWidth : 0;
    
    // Thiết lập hệ số scale để đạt chất lượng ~200 PPI (Màn hình chuẩn ~96 PPI, 200/96 ≈ 2.1)
    const scaleFactor = 2.1; 
    
    const canvas = document.createElement("canvas");
    canvas.width = viewportRect.width * scaleFactor;
    canvas.height = viewportRect.height * scaleFactor;
    const ctx = canvas.getContext("2d");
    
    // Đảm bảo nền trắng sạch sẽ khi dán vào Word
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Lấy nội dung SVG và chuyển thành Blob URL
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = async () => {
        // Scale context để chất lượng ảnh sắc nét (200 PPI)
        ctx.scale(scaleFactor, scaleFactor);
        
        // Dịch chuyển canvas ngược lại để crop đúng phần nằm bên phải (loại bỏ phần panel điều khiển)
        // Lưu ý: SVG trong DOM đang nằm bên trong flex layout, ta dịch chuyển theo toạ độ offsetLeft hoặc panelWidth
        const svgRect = svgElement.getBoundingClientRect();
        const offsetX = svgRect.left - viewportRect.left;
        const offsetY = svgRect.top - viewportRect.top;
        
        ctx.drawImage(img, offsetX, offsetY);
        URL.revokeObjectURL(blobURL);

        try {
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    alert("Không thể tạo dữ liệu ảnh!");
                    return;
                }
                await navigator.clipboard.write([
                    new ClipboardItem({ "image/png": blob })
                ]);
                alert("Đã copy riêng vùng đồ thị (chuẩn ~200 PPI) vào bộ nhớ tạm! Bạn có thể dán (Ctrl + V) trực tiếp vào Word.");
            }, "image/png");
        } catch (err) {
            console.error("Lỗi khi copy vào clipboard:", err);
            alert("Trình duyệt không hỗ trợ hoặc bị chặn quyền ghi clipboard trực tiếp.");
        }
    };
    img.src = blobURL;
}






// ==========================================
// MODULE: CHẾ ĐỘ HỌC TẬP (LEARNING MODE) - 2 NHÁNH
// ==========================================
const LearningMode = {
    isActive: false,
    mode: 'basic', // 'basic' | 'reflex'
    studentName: '',
    score: 0,
    step: 1,
    data: {
        expr: "",
        a: 0, b: 0, c: 0, op: "",
        points: [],
        testPoint: { x: 0, y: 0 }
    },

    init() {
        const panel = document.querySelector(".control-panel");
        if (!panel) return;

        const oldModule = document.getElementById("learning-module-section");
        if (oldModule) oldModule.remove();

        const modeSwitchDiv = document.createElement("div");
        modeSwitchDiv.className = "panel-section";
        modeSwitchDiv.id = "learning-module-section";
        modeSwitchDiv.innerHTML = `
            <h3><i class="fa-solid fa-graduation-cap"></i> Chế độ luyện tập</h3>
            <button id="btn-toggle-learning" class="btn btn-warning">
                <i class="fa-solid fa-book-open"></i> Bật Chế độ Học tập từng bước
            </button>
            
            <!-- Khung thông tin học sinh & Điểm số (Chế độ Phản xạ) -->
            <div id="reflex-score-card" style="display: none; margin-top: 10px; padding: 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px;">
                <div style="font-size: 0.85rem; font-weight: bold; color: var(--primary-color); display: flex; justify-content: space-between; align-items: center;">
                    <span><i class="fa-solid fa-user-graduate"></i> <span id="display-student-name">...</span></span>
                    <span style="background: #2563eb; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">
                        Điểm: <span id="display-student-score">0</span>/10
                    </span>
                </div>
            </div>

            <div id="learning-container" style="display: none; margin-top: 10px; background: #fff; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color);"></div>
        `;
        panel.prepend(modeSwitchDiv);

        document.getElementById("btn-toggle-learning").addEventListener("click", () => {
            this.isActive = !this.isActive;
            const container = document.getElementById("learning-container");
            const scoreCard = document.getElementById("reflex-score-card");
            const btn = document.getElementById("btn-toggle-learning");
            
            const inequalityCardsContainer = document.getElementById("function-cards-container");
            const inequalitySection = inequalityCardsContainer ? inequalityCardsContainer.closest(".panel-section") : null;
            
            if (this.isActive) {
                btn.innerHTML = `<i class="fa-solid fa-rotate-left"></i> Thoát Chế độ Học tập`;
                btn.className = "btn btn-secondary";
                container.style.display = "block";
                
                if (inequalitySection) inequalitySection.style.display = "none";
                this.selectBranch();
            } else {
                btn.innerHTML = `<i class="fa-solid fa-book-open"></i> Bật Chế độ Học tập từng bước`;
                btn.className = "btn btn-warning";
                container.style.display = "none";
                scoreCard.style.display = "none";

                if (inequalitySection) inequalitySection.style.display = "";
                inequalities = [];
                renderGraph();
            }
        });
    },

    // Màn hình chọn Nhánh 1 hoặc Nhánh 2
    selectBranch() {
        document.getElementById("reflex-score-card").style.display = "none";
        const container = document.getElementById("learning-container");
        container.innerHTML = `
            <div style="font-size: 0.9rem; font-weight: bold; margin-bottom: 8px; text-align: center;">Chọn chế độ học tập</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button id="btn-branch-basic" class="btn btn-primary" style="font-size: 0.85rem;">
                    <i class="fa-solid fa-book"></i> Nhánh 1: Tự học cơ bản (Không tính điểm)
                </button>
                <button id="btn-branch-reflex" class="btn btn-success" style="font-size: 0.85rem;">
                    <i class="fa-solid fa-bolt"></i> Nhánh 2: Chế độ Phản xạ (Thách thức 10 điểm)
                </button>
            </div>
        `;

        document.getElementById("btn-branch-basic").addEventListener("click", () => {
            this.mode = 'basic';
            this.startSession();
        });

        document.getElementById("btn-branch-reflex").addEventListener("click", () => {
            this.mode = 'reflex';
            this.startReflexSetup();
        });
    },

    // Thiết lập Nhánh 2 (Nhập tên học sinh)
    startReflexSetup() {
        const container = document.getElementById("learning-container");
        container.innerHTML = `
            <div style="font-size: 0.85rem; font-weight: bold; margin-bottom: 6px;">Chế độ Phản xạ - Thách thức 10 điểm</div>
            <div style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 8px;">
                Chọn đúng miền nghiệm được +1 điểm, chọn sai điểm về 0. Đạt 10 điểm để chiến thắng!
            </div>
            <div class="input-group" style="margin-bottom: 8px;">
                <label for="student-name-input">Họ và tên học sinh:</label>
                <input type="text" id="student-name-input" placeholder="Nhập họ tên của em..." style="font-size: 0.85rem;">
            </div>
            <button id="btn-start-reflex" class="btn btn-success" style="width: 100%; font-size: 0.85rem;">
                <i class="fa-solid fa-play"></i> Bắt đầu làm bài
            </button>
        `;

        document.getElementById("btn-start-reflex").addEventListener("click", () => {
            const name = document.getElementById("student-name-input").value.trim();
            if (!name) {
                alert("Vui lòng nhập Họ và tên trước khi bắt đầu!");
                return;
            }
            this.studentName = name;
            this.score = 0;

            document.getElementById("display-student-name").textContent = this.studentName;
            document.getElementById("display-student-score").textContent = this.score;
            document.getElementById("reflex-score-card").style.display = "block";

            this.startSession();
        });
    },

    generateRandomExpr() {
        const rand = Math.random();
        let level = 'easy';
        if (rand < 0.65) level = 'easy';       // 65% Dễ (a,b khác 0, c khác 0)
        else if (rand < 0.85) level = 'medium'; // 20% Qua O (c = 0)
        else level = 'hard';                     // 15% Khuyết a hoặc b

        let a, b, c, op;
        const ops = ['<=', '<', '>=', '>'];
        op = ops[Math.floor(Math.random() * ops.length)];

        if (level === 'easy') {
            a = (Math.floor(Math.random() * 3) + 1) * (Math.random() < 0.5 ? 1 : -1);
            b = (Math.floor(Math.random() * 3) + 1) * (Math.random() < 0.5 ? 1 : -1);
            c = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
        } else if (level === 'medium') {
            a = (Math.floor(Math.random() * 4) + 1) * (Math.random() < 0.5 ? 1 : -1);
            b = (Math.floor(Math.random() * 4) + 1) * (Math.random() < 0.5 ? 1 : -1);
            c = 0;
        } else {
            if (Math.random() < 0.5) {
                a = 0;
                b = (Math.floor(Math.random() * 3) + 1) * (Math.random() < 0.5 ? 1 : -1);
            } else {
                a = (Math.floor(Math.random() * 3) + 1) * (Math.random() < 0.5 ? 1 : -1);
                b = 0;
            }
            c = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
        }

        let exprStr = "";
        if (a !== 0) {
            if (a === 1) exprStr += "x";
            else if (a === -1) exprStr += "-x";
            else exprStr += `${a}x`;
        }

        if (b !== 0) {
            if (exprStr !== "") {
                if (b > 0) exprStr += ` + ${b === 1 ? '' : b}y`;
                else exprStr += ` - ${Math.abs(b) === 1 ? '' : Math.abs(b)}y`;
            } else {
                if (b === 1) exprStr += "y";
                else if (b === -1) exprStr += "-y";
                else exprStr += `${b}y`;
            }
        }

        exprStr += ` ${op} ${c}`;
        return { exprStr, a, b, c, op };
    },

    // BƯỚC 1
    startSession() {
        this.step = 1;
        this.data.points = [];
        inequalities = [];
        renderGraph();

        const container = document.getElementById("learning-container");

        if (this.mode === 'basic') {
            container.innerHTML = `
                <div style="font-size: 0.85rem; font-weight: bold; margin-bottom: 6px;">
                    Nhánh 1: Tự học cơ bản
                </div>
                <div style="background: #f1f5f9; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
                    <button id="learn-btn-random" class="btn btn-warning" style="width: 100%; min-height: auto; padding: 6px; font-size: 0.8rem;">
                        <i class="fa-solid fa-dice"></i> Sinh đề ngẫu nhiên
                    </button>
                </div>
                <div class="input-row" style="margin-bottom: 8px;">
                    <input type="text" id="learn-expr-input" placeholder="VD: 2x - y < 4" style="flex:1;">
                    <button id="learn-btn-start" class="btn btn-primary" style="min-height: auto; padding: 6px 12px;">Bắt đầu</button>
                </div>
                <div id="learn-step-content"></div>
            `;

            document.getElementById("learn-btn-random").addEventListener("click", () => {
                const generated = this.generateRandomExpr();
                document.getElementById("learn-expr-input").value = generated.exprStr;
            });

            document.getElementById("learn-btn-start").addEventListener("click", () => {
                const rawExpr = document.getElementById("learn-expr-input").value;
                const parsed = parseLinearInequality(rawExpr);
                if (!parsed) {
                    alert("Biểu thức không hợp lệ! Vui lòng nhập dạng ax + by <= c");
                    return;
                }
                this.data.expr = rawExpr;
                this.data.a = parsed.a;
                this.data.b = parsed.b;
                this.data.c = parsed.c;
                this.data.op = parsed.op;

                this.toStep2();
            });
        } else {
            // Chế độ Phản xạ: Tự động sinh đề luôn
            const generated = this.generateRandomExpr();
            this.data.expr = generated.exprStr;
            this.data.a = generated.a;
            this.data.b = generated.b;
            this.data.c = generated.c;
            this.data.op = generated.op;

            container.innerHTML = `
                <div style="font-size: 0.85rem; font-weight: bold; margin-bottom: 6px;">
                    Câu ${this.score + 1}: ${this.data.expr}
                </div>
                <div id="learn-step-content"></div>
            `;

            this.toStep2();
        }
    },

    // BƯỚC 2: Bảng giá trị
    toStep2() {
        this.step = 2;
        const content = document.getElementById("learn-step-content");
        
        let hintText = "Lập bảng giá trị:";
        if (this.data.a === 0) hintText = `Vì a = 0, y = ${this.data.c / this.data.b}. Điền các điểm có y cố định:`;
        if (this.data.b === 0) hintText = `Vì b = 0, x = ${this.data.c / this.data.a}. Điền các điểm có x cố định:`;

        content.innerHTML = `
            <hr style="margin: 8px 0; border:0; border-top:1px solid #eee;">
            <div style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 6px;">
                <b>Bước 2:</b> ${hintText}
            </div>
            <table style="width:100%; font-size:0.85rem; margin-bottom:6px; border-collapse:collapse;" border="1">
                <tr style="background:#f1f5f9;"><th style="padding:4px;">x</th><td><input type="text" id="lx1" style="width:100%; border:none; text-align:center;" value="0"></td><td><input type="text" id="lx2" style="width:100%; border:none; text-align:center;" value="2"></td></tr>
                <tr><th style="padding:4px; background:#f1f5f9;">y</th><td><input type="text" id="ly1" style="width:100%; border:none; text-align:center;" placeholder="tính y"></td><td><input type="text" id="ly2" style="width:100%; border:none; text-align:center;" placeholder="tính y"></td></tr>
            </table>
            <button id="learn-btn-step2" class="btn btn-success" style="width:100%; font-size:0.85rem; padding:6px;">Xác định 2 điểm</button>
            <div id="learn-msg-2" style="font-size:0.8rem; margin-top:4px;"></div>
        `;

        document.getElementById("learn-btn-step2").addEventListener("click", () => {
            const x1 = parseFloat(document.getElementById("lx1").value);
            const y1 = parseFloat(document.getElementById("ly1").value);
            const x2 = parseFloat(document.getElementById("lx2").value);
            const y2 = parseFloat(document.getElementById("ly2").value);
            const msgBox = document.getElementById("learn-msg-2");

            const check1 = Math.abs((this.data.a * x1 + this.data.b * y1) - this.data.c) < 0.001;
            const check2 = Math.abs((this.data.a * x2 + this.data.b * y2) - this.data.c) < 0.001;
            const distinct = Math.abs(x1 - x2) > 0.001 || Math.abs(y1 - y2) > 0.001;

            if (check1 && check2 && distinct) {
                this.data.points = [{x: x1, y: y1}, {x: x2, y: y2}];
                msgBox.style.color = "var(--success-color)";
                msgBox.textContent = "Chính xác!";
                setTimeout(() => this.toStep3(), 800);
            } else {
                msgBox.style.color = "var(--danger-color)";
                msgBox.textContent = "Tọa độ 2 điểm chưa đúng hoặc trùng nhau!";
            }
        });
    },

    // BƯỚC 3
    toStep3() {
        this.step = 3;
        const content = document.getElementById("learn-step-content");

        renderGraph();
        this.drawHighlightPoints();

        content.innerHTML = `
            <hr style="margin: 8px 0; border:0; border-top:1px solid #eee;">
            <div style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 6px;">
                <b>Bước 3:</b> Đã định vị 2 điểm trên mặt phẳng (chấm đỏ).
            </div>
            <button id="learn-btn-step3" class="btn btn-primary" style="width:100%; font-size:0.85rem; padding:6px;">Hiển thị đường biên</button>
        `;

        document.getElementById("learn-btn-step3").addEventListener("click", () => {
            this.toStep4();
        });
    },

    drawHighlightPoints() {
        const svg = document.getElementById("coordinate-system");
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const width = rect.width || 500;
        const height = rect.height || 500;
        const centerX = width / 2 + panX;
        const centerY = height / 2 + panY;

        let extraSVG = "";
        this.data.points.forEach((p, idx) => {
            const px = centerX + p.x * scale;
            const py = centerY - p.y * scale;
            extraSVG += `<circle cx="${px}" cy="${py}" r="6" fill="red" stroke="white" stroke-width="2"/>`;
            extraSVG += `<text x="${px + 8}" y="${py - 8}" fill="red" font-weight="bold" font-size="12">P${idx+1}(${p.x};${p.y})</text>`;
        });
        svg.innerHTML += extraSVG;
    },

    // BƯỚC 4
    toStep4() {
        this.step = 4;
        const content = document.getElementById("learn-step-content");

        let exprForBoundary = this.data.expr.replace(/[<>]=?|=/, '=');
        inequalities = [{ expr: exprForBoundary, color: "#2563eb", pattern: "solid" }];
        renderGraph();
        this.drawHighlightPoints();

        content.innerHTML = `
            <hr style="margin: 8px 0; border:0; border-top:1px solid #eee;">
            <div style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 6px;">
                <b>Bước 4:</b> Đã dựng đường biên ứng với dấu "=".
            </div>
            <button id="learn-btn-step4" class="btn btn-primary" style="width:100%; font-size:0.85rem; padding:6px;">Lấy điểm thử</button>
        `;

        document.getElementById("learn-btn-step4").addEventListener("click", () => {
            this.toStep5();
        });
    },

    // BƯỚC 5
    toStep5() {
        this.step = 5;
        const content = document.getElementById("learn-step-content");

        let tx = 0, ty = 0;
        if (Math.abs(this.data.c) < 0.0001) {
            tx = this.data.a !== 0 ? this.data.a : 1;
            ty = this.data.b !== 0 ? this.data.b : 1;
        } else {
            tx = 0; ty = 0;
        }
        this.data.testPoint = { x: tx, y: ty };

        content.innerHTML = `
            <hr style="margin: 8px 0; border:0; border-top:1px solid #eee;">
            <div style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 6px;">
                <b>Bước 5:</b> Xét điểm <b>M(${tx}; ${ty})</b>.<br>
                Điểm này có nằm trên đường biên không?
            </div>
            <div class="zoom-pan-controls" style="margin-bottom:6px;">
                <button id="btn-ans-yes" class="btn btn-secondary" style="flex:1; font-size:0.85rem;">Có</button>
                <button id="btn-ans-no" class="btn btn-secondary" style="flex:1; font-size:0.85rem;">Không</button>
            </div>
            <div id="learn-msg-5" style="font-size:0.8rem; margin-top:4px;"></div>
        `;

        const checkOnBoundary = Math.abs((this.data.a * tx + this.data.b * ty) - this.data.c) < 0.0001;

        document.getElementById("btn-ans-yes").addEventListener("click", () => {
            const msg = document.getElementById("learn-msg-5");
            if (checkOnBoundary) {
                msg.style.color = "var(--success-color)";
                msg.textContent = "Chính xác!";
                setTimeout(() => this.toStep6(), 800);
            } else {
                msg.style.color = "var(--danger-color)";
                msg.textContent = "Chưa đúng!";
            }
        });

        document.getElementById("btn-ans-no").addEventListener("click", () => {
            const msg = document.getElementById("learn-msg-5");
            if (!checkOnBoundary) {
                msg.style.color = "var(--success-color)";
                msg.textContent = "Chính xác! Điểm này hợp lệ làm điểm thử.";
                setTimeout(() => this.toStep6(), 800);
            } else {
                msg.style.color = "var(--danger-color)";
                msg.textContent = "Chưa đúng, điểm này nằm trên đường biên!";
            }
        });
    },

    // BƯỚC 6: Click miền nghiệm & Tính điểm
    toStep6() {
        this.step = 6;
        const content = document.getElementById("learn-step-content");

        inequalities = [{ expr: this.data.expr, color: "#2563eb", pattern: "slash" }];
        
        content.innerHTML = `
            <hr style="margin: 8px 0; border:0; border-top:1px solid #eee;">
            <div style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 6px;">
                <b>Bước 6:</b> Hãy <b>click trực tiếp lên mặt phẳng tọa độ</b> vào miền nghiệm đúng!
            </div>
            <div id="learn-msg-6" style="font-size:0.8rem; color:var(--primary-color); font-weight:bold; margin-top:4px;">Hãy click chọn miền nghiệm</div>
        `;

        const svg = document.getElementById("coordinate-system");
        
        if (this.svgClickHandler) {
            svg.removeEventListener("click", this.svgClickHandler);
        }

        this.svgClickHandler = (e) => {
            const rect = svg.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            const centerX = width / 2 + panX;
            const centerY = height / 2 + panY;

            const clickX = (e.clientX - rect.left - centerX) / scale;
            const clickY = (centerY - (e.clientY - rect.top)) / scale;

            const val = this.data.a * clickX + this.data.b * clickY;
            let ok = false;
            const op = this.data.op;
            const c = this.data.c;
            if (op === '<=') ok = val <= c;
            else if (op === '<') ok = val < c;
            else if (op === '>=') ok = val >= c;
            else if (op === '>') ok = val > c;

            const msgBox = document.getElementById("learn-msg-6");
            svg.removeEventListener("click", this.svgClickHandler);

            if (ok) {
                renderGraph();

                if (this.mode === 'basic') {
                    msgBox.style.color = "var(--success-color)";
                    msgBox.textContent = `Em đã chọn đúng miền nghiệm 🎉`;
                } else {
                    // Chế độ phản xạ
                    this.score += 1;
                    document.getElementById("display-student-score").textContent = this.score;

                    if (this.score >= 10) {
                        msgBox.style.color = "var(--success-color)";
                        msgBox.textContent = `🎉 CHÚC MỪNG ${this.studentName.toUpperCase()} ĐÃ ĐẠT 10/10 ĐIỂM! 🎉`;
                        alert(`Chúc mừng ${this.studentName} đã xuất sắc đạt 10/10 điểm trong Chế độ Phản xạ!`);
                    } else {
                        msgBox.style.color = "var(--success-color)";
                        msgBox.textContent = `Đúng rồi! +1 điểm. Đang tải câu tiếp theo...`;
                        setTimeout(() => this.startSession(), 1200);
                    }
                }
            } else {
                if (this.mode === 'basic') {
                    msgBox.style.color = "var(--danger-color)";
                    msgBox.textContent = `Xác định miền nghiệm chưa đúng! Hãy thử chọn lại!`;
                    // Cho phép click chọn lại ở chế độ cơ bản
                    svg.addEventListener("click", this.svgClickHandler);
                } else {
                    // Chế độ phản xạ: Chọn sai về 0
                    this.score = 0;
                    document.getElementById("display-student-score").textContent = this.score;
                    msgBox.style.color = "var(--danger-color)";
                    msgBox.textContent = `Rất tiếc, em chọn sai! Điểm số về 0. Tải câu mới...`;
                    setTimeout(() => this.startSession(), 1500);
                }
            }
        };

        svg.addEventListener("click", this.svgClickHandler);
    }
};

// Tự động kích hoạt module khi trang tải xong
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => LearningMode.init(), 200);
});

// FULL SCREEN BUTTON
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