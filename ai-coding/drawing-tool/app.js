const canvas = document.getElementById("drawing-canvas");
const ctx = canvas.getContext("2d");

const elements = {
    pressureValue: document.getElementById("pressure-value"),
    statusMessage: document.getElementById("status-message"),
    vectorOutput: document.getElementById("vector-output"),
    undo: document.getElementById("undo-stroke"),
    clear: document.getElementById("clear-canvas"),
    replay: document.getElementById("replay-drawing"),
    download: document.getElementById("download-json"),
    copy: document.getElementById("copy-json"),
    load: document.getElementById("load-json"),
    fileLoader: document.getElementById("file-loader"),
    logContent: document.getElementById("interaction-log"),
};

const state = {
    strokes: [],
    currentStroke: null,
    pointerId: null,
    isReplaying: false,
    dpr: window.devicePixelRatio || 1,
    pointerEventsSupported: typeof window !== "undefined" && Boolean(window.PointerEvent),
    pointerEventsDetected: false,
    fallbackActive: false,
    logEntries: [],
    moveEventCounter: 0,
    fallbackSuppressedLogged: false,
};

const PRESSURE_MIN_WIDTH = 1.2;
const PRESSURE_MAX_WIDTH = 8;
const DEFAULT_MOUSE_PRESSURE = 0.35;
const DEFAULT_TOUCH_PRESSURE = 0.55;
const MAX_LOG_ENTRIES = 120;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getPointerIdentifier = (event) => {
    if (event.pointerId !== null && event.pointerId !== undefined) {
        return event.pointerId;
    }
    if (event.identifier !== null && event.identifier !== undefined) {
        return event.identifier;
    }
    if (event.pointerType === "mouse" || (event.type && event.type.includes("mouse"))) {
        return "mouse";
    }
    return "pointer";
};

function logEvent(label, details = {}) {
    if (!elements.logContent) {
        return;
    }
    const timestamp = new Date().toLocaleTimeString("en-GB", { hour12: false });
    const detailText = Object.entries(details)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) => `${key}=${value}`)
        .join(" ");
    const entry = detailText ? `[${timestamp}] ${label} ${detailText}` : `[${timestamp}] ${label}`;
    state.logEntries.push(entry);
    if (state.logEntries.length > MAX_LOG_ENTRIES) {
        state.logEntries.shift();
    }
    elements.logContent.textContent = state.logEntries.join("\n");
    elements.logContent.scrollTop = elements.logContent.scrollHeight;
}

function setStatus(message, timeout = 2200) {
    if (message) {
        logEvent("status", { message });
    }
    elements.statusMessage.textContent = message;
    if (!message) {
        return;
    }
    window.clearTimeout(setStatus._timer);
    setStatus._timer = window.setTimeout(() => {
        elements.statusMessage.textContent = "";
    }, timeout);
}

function setPressureDisplay(value) {
    const numeric = Number.parseFloat(value);
    const displayValue = Number.isFinite(numeric) ? numeric.toFixed(2) : "0.00";
    elements.pressureValue.textContent = displayValue;
}

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    state.dpr = window.devicePixelRatio || 1;
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);
    const targetWidth = Math.floor(width * state.dpr);
    const targetHeight = Math.floor(height * state.dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(state.dpr, state.dpr);
        render();
    }
}

function getCanvasCoordinates(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
    };
}

function safePressure(event) {
    const pointerType = event.pointerType || (event.type && event.type.includes("mouse") ? "mouse" : "pen");

    if (typeof event.pressure === "number" && Number.isFinite(event.pressure)) {
        return clamp(event.pressure, 0, 1);
    }

    if (typeof event.force === "number" && Number.isFinite(event.force)) {
        return clamp(event.force, 0, 1);
    }

    if (typeof event.webkitForce === "number" && Number.isFinite(event.webkitForce)) {
        const forceClick = (window.MouseEvent && window.MouseEvent.WEBKIT_FORCE_AT_FORCE_CLICK) || 3;
        const normalised = event.webkitForce / forceClick;
        return clamp(normalised, 0, 1);
    }

    if (pointerType === "mouse") {
        return DEFAULT_MOUSE_PRESSURE;
    }

    if (pointerType === "touch") {
        return DEFAULT_TOUCH_PRESSURE;
    }

    return 0;
}

function createPoint(event, startTimestamp) {
    const { x, y } = getCanvasCoordinates(event);
    const pressure = safePressure(event);
    const time = startTimestamp ? Math.max(0, Math.round(performance.now() - startTimestamp)) : 0;
    return {
        x: Number.parseFloat(x.toFixed(2)),
        y: Number.parseFloat(y.toFixed(2)),
        pressure: Number.parseFloat(pressure.toFixed(3)),
        tiltX: Number.parseFloat((event.tiltX || 0).toFixed(2)),
        tiltY: Number.parseFloat((event.tiltY || 0).toFixed(2)),
        twist: typeof event.twist === "number" ? Number.parseFloat(event.twist.toFixed(1)) : undefined,
        time,
    };
}

function createStroke(event) {
    return {
        id: `stroke-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        pointerType: event.pointerType || (event.type && event.type.includes("mouse") ? "mouse" : "pen"),
        pointerId: getPointerIdentifier(event),
        color: "#111827",
        createdAt: new Date().toISOString(),
        duration: 0,
        points: [],
        _startTimestamp: performance.now(),
    };
}

function pushPoint(stroke, point) {
    const last = stroke.points[stroke.points.length - 1];
    if (
        last &&
        last.x === point.x &&
        last.y === point.y &&
        last.time === point.time &&
        last.pressure === point.pressure
    ) {
        return false;
    }
    stroke.points.push(point);
    stroke.duration = point.time;
    return true;
}

function pressureToWidth(pressure) {
    const safe = Math.max(pressure || 0, 0.05);
    return PRESSURE_MIN_WIDTH + safe * (PRESSURE_MAX_WIDTH - PRESSURE_MIN_WIDTH);
}

function drawStroke(stroke, highlight = false) {
    const points = stroke.points;
    if (!points.length) {
        return;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = highlight ? "#2563eb" : stroke.color || "#111827";

    if (points.length === 1) {
        const radius = pressureToWidth(points[0].pressure) / 2;
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, radius, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
        return;
    }

    for (let i = 1; i < points.length; i += 1) {
        const current = points[i];
        const previous = points[i - 1];
        const averagePressure = (Math.max(previous.pressure, 0.05) + Math.max(current.pressure, 0.05)) / 2;
        ctx.beginPath();
        ctx.moveTo(previous.x, previous.y);
        ctx.lineTo(current.x, current.y);
        ctx.lineWidth = pressureToWidth(averagePressure);
        ctx.stroke();
    }
}

function render() {
    const width = canvas.width / state.dpr;
    const height = canvas.height / state.dpr;
    ctx.clearRect(0, 0, width, height);

    for (const stroke of state.strokes) {
        drawStroke(stroke);
    }

    if (state.currentStroke) {
        drawStroke(state.currentStroke, true);
    }
}

function updateVectorOutput() {
    const payload = {
        version: 1,
        updatedAt: new Date().toISOString(),
        strokeCount: state.strokes.length,
        strokes: state.strokes.map((stroke) => ({
            id: stroke.id,
            pointerType: stroke.pointerType,
            pointerId: stroke.pointerId,
            color: stroke.color,
            createdAt: stroke.createdAt,
            duration: stroke.duration,
            points: stroke.points.map((point) => ({
                x: point.x,
                y: point.y,
                pressure: point.pressure,
                tiltX: point.tiltX,
                tiltY: point.tiltY,
                twist: point.twist,
                time: point.time,
            })),
        })),
    };

    elements.vectorOutput.value = JSON.stringify(payload, null, 2);
}

function finalizeCurrentStroke() {
    if (!state.currentStroke) {
        return;
    }

    const { _startTimestamp, ...strokeData } = state.currentStroke;
    state.strokes.push(strokeData);

    state.currentStroke = null;
    state.pointerId = null;
    updateVectorOutput();
    render();
}

function handlePointerDown(event) {
    if (state.isReplaying) {
        return;
    }

    event.preventDefault();
    if (typeof canvas.setPointerCapture === "function" && event.pointerId !== undefined) {
        try {
            canvas.setPointerCapture(event.pointerId);
        } catch (error) {
            console.debug("Pointer capture unsupported", error);
        }
    }
    if (!event.isFallback) {
        if (!state.pointerEventsDetected) {
            logEvent("pointer-events-detected", { pointerType: event.pointerType || "" });
        }
        state.pointerEventsDetected = true;
        state.fallbackActive = false;
        state.fallbackSuppressedLogged = false;
    }
    state.currentStroke = createStroke(event);
    const pointerId = getPointerIdentifier(event);
    state.pointerId = pointerId;
    state.currentStroke.pointerId = pointerId;
    state.moveEventCounter = 0;

    const firstPoint = createPoint(event, state.currentStroke._startTimestamp);
    firstPoint.time = 0;
    pushPoint(state.currentStroke, firstPoint);
    setPressureDisplay(firstPoint.pressure);
    logEvent("pointerdown", {
        pointerId,
        pointerType: state.currentStroke.pointerType,
        pressure: firstPoint.pressure.toFixed(2),
        x: firstPoint.x,
        y: firstPoint.y,
    });
    render();
}

function handlePointerMove(event) {
    if (!state.currentStroke) {
        return;
    }
    const pointerId = getPointerIdentifier(event);
    if (pointerId !== state.pointerId) {
        logEvent("pointermove-ignored", { pointerId, active: state.pointerId });
        return;
    }

    event.preventDefault();
    const point = createPoint(event, state.currentStroke._startTimestamp);
    const added = pushPoint(state.currentStroke, point);
    if (added) {
        setPressureDisplay(point.pressure);
        state.moveEventCounter += 1;
        if (state.moveEventCounter % 5 === 0) {
            logEvent("pointermove", {
                pointerId,
                pressure: point.pressure.toFixed(2),
                x: point.x,
                y: point.y,
            });
        }
        render();
    }
}

function handlePointerUp(event) {
    if (!state.currentStroke) {
        return;
    }
    const pointerId = getPointerIdentifier(event);
    if (pointerId !== state.pointerId) {
        return;
    }

    event.preventDefault();
    if (typeof canvas.releasePointerCapture === "function" && event.pointerId !== undefined) {
        try {
            canvas.releasePointerCapture(event.pointerId);
        } catch (error) {
            console.debug("Pointer release unsupported", error);
        }
    }

    const lastPoint = createPoint(event, state.currentStroke._startTimestamp);
    pushPoint(state.currentStroke, lastPoint);
    setPressureDisplay(lastPoint.pressure);
    logEvent("pointerup", {
        pointerId,
        pressure: lastPoint.pressure.toFixed(2),
        x: lastPoint.x,
        y: lastPoint.y,
    });
    finalizeCurrentStroke();
}

function handlePointerCancel(event) {
    const pointerId = getPointerIdentifier(event);
    if (pointerId === state.pointerId) {
        setStatus("Stroke cancelled");
        logEvent("pointercancel", { pointerId });
        state.currentStroke = null;
        state.pointerId = null;
        render();
    }
}

function undoLastStroke() {
    if (!state.strokes.length || state.isReplaying) {
        return;
    }
    state.strokes.pop();
    setStatus("Removed last stroke");
    updateVectorOutput();
    render();
}

function clearCanvas() {
    if (state.isReplaying) {
        return;
    }
    state.strokes = [];
    state.currentStroke = null;
    state.pointerId = null;
    setStatus("Canvas cleared");
    updateVectorOutput();
    render();
}

function cloneStrokes() {
    return state.strokes.map((stroke) => ({
        id: stroke.id,
        pointerType: stroke.pointerType,
        pointerId: stroke.pointerId,
        color: stroke.color,
        createdAt: stroke.createdAt,
        duration: stroke.duration,
        points: stroke.points.map((point) => ({
            x: point.x,
            y: point.y,
            pressure: point.pressure,
            tiltX: point.tiltX,
            tiltY: point.tiltY,
            twist: point.twist,
            time: point.time,
        })),
    }));
}

function createPointerFromMouseEvent(event) {
    return {
        pointerId: 1,
        pointerType: "mouse",
        clientX: event.clientX,
        clientY: event.clientY,
        pressure: event.pressure,
        force: event.force,
        webkitForce: event.webkitForce,
        buttons: event.buttons,
        tiltX: event.tiltX || 0,
        tiltY: event.tiltY || 0,
        twist: event.twist,
        type: event.type,
        isFallback: true,
        preventDefault: () => event.preventDefault(),
    };
}

function createPointerFromTouch(event, touch) {
    return {
        pointerId: touch.identifier,
        pointerType: "touch",
        clientX: touch.clientX,
        clientY: touch.clientY,
        pressure: touch.force,
        force: touch.force,
        webkitForce: touch.force,
        tiltX: 0,
        tiltY: 0,
        twist: undefined,
        type: event.type,
        isFallback: true,
        preventDefault: () => event.preventDefault(),
    };
}

function findTouchById(touches, id) {
    if (!touches) {
        return null;
    }
    for (let index = 0; index < touches.length; index += 1) {
        const touch = touches[index];
        if (touch.identifier === id) {
            return touch;
        }
    }
    return null;
}

let mouseDownActive = false;

function handleMouseDownFallback(event) {
    if (state.pointerEventsSupported && state.pointerEventsDetected) {
        if (!state.fallbackSuppressedLogged) {
            logEvent("fallback-blocked", { handler: "mouseDown" });
            state.fallbackSuppressedLogged = true;
        }
        return;
    }
    if (state.isReplaying || state.currentStroke || (event.button !== undefined && event.button !== 0)) {
        return;
    }
    state.fallbackSuppressedLogged = false;
    if (!state.fallbackActive) {
        state.fallbackActive = true;
        setStatus("Fallback input active: click and drag to draw");
    }
    mouseDownActive = true;
    logEvent("mouse-down-fallback", { button: event.button });
    handlePointerDown(createPointerFromMouseEvent(event));
    if (!state.currentStroke) {
        mouseDownActive = false;
    }
}

function handleMouseMoveFallback(event) {
    if (state.pointerEventsSupported && state.pointerEventsDetected) {
        if (!state.fallbackSuppressedLogged) {
            logEvent("fallback-blocked", { handler: "mouseMove" });
            state.fallbackSuppressedLogged = true;
        }
        return;
    }
    if (!mouseDownActive) {
        return;
    }
    handlePointerMove(createPointerFromMouseEvent(event));
}

function handleMouseUpFallback(event) {
    if (state.pointerEventsSupported && state.pointerEventsDetected) {
        if (!state.fallbackSuppressedLogged) {
            logEvent("fallback-blocked", { handler: "mouseUp" });
            state.fallbackSuppressedLogged = true;
        }
        return;
    }
    if (!mouseDownActive) {
        return;
    }
    mouseDownActive = false;
    handlePointerUp(createPointerFromMouseEvent(event));
}

function handleMouseLeaveFallback(event) {
    if (state.pointerEventsSupported && state.pointerEventsDetected) {
        if (!state.fallbackSuppressedLogged) {
            logEvent("fallback-blocked", { handler: "mouseLeave" });
            state.fallbackSuppressedLogged = true;
        }
        return;
    }
    if (!mouseDownActive) {
        return;
    }
    mouseDownActive = false;
    handlePointerCancel(createPointerFromMouseEvent(event));
}

function handleTouchStartFallback(event) {
    if (state.pointerEventsSupported && state.pointerEventsDetected) {
        if (!state.fallbackSuppressedLogged) {
            logEvent("fallback-blocked", { handler: "touchStart" });
            state.fallbackSuppressedLogged = true;
        }
        return;
    }
    if (state.isReplaying || state.currentStroke) {
        return;
    }
    state.fallbackSuppressedLogged = false;
    if (!state.fallbackActive) {
        state.fallbackActive = true;
        setStatus("Fallback input active: touch to draw");
    }
    const touch = event.changedTouches && event.changedTouches[0];
    if (!touch) {
        return;
    }
    logEvent("touchstart-fallback", { pointerId: touch.identifier });
    handlePointerDown(createPointerFromTouch(event, touch));
}

function handleTouchMoveFallback(event) {
    if (state.pointerEventsSupported && state.pointerEventsDetected) {
        if (!state.fallbackSuppressedLogged) {
            logEvent("fallback-blocked", { handler: "touchMove" });
            state.fallbackSuppressedLogged = true;
        }
        return;
    }
    if (state.pointerId === null || state.pointerId === undefined) {
        return;
    }
    const touch = findTouchById(event.touches, state.pointerId) || findTouchById(event.changedTouches, state.pointerId);
    if (!touch) {
        return;
    }
    handlePointerMove(createPointerFromTouch(event, touch));
}

function handleTouchEndFallback(event) {
    if (state.pointerEventsSupported && state.pointerEventsDetected) {
        if (!state.fallbackSuppressedLogged) {
            logEvent("fallback-blocked", { handler: "touchEnd" });
            state.fallbackSuppressedLogged = true;
        }
        return;
    }
    if (state.pointerId === null || state.pointerId === undefined) {
        return;
    }
    const touch = findTouchById(event.changedTouches, state.pointerId);
    if (!touch) {
        return;
    }
    handlePointerUp(createPointerFromTouch(event, touch));
}

function handleTouchCancelFallback(event) {
    if (state.pointerEventsSupported && state.pointerEventsDetected) {
        if (!state.fallbackSuppressedLogged) {
            logEvent("fallback-blocked", { handler: "touchCancel" });
            state.fallbackSuppressedLogged = true;
        }
        return;
    }
    if (state.pointerId === null || state.pointerId === undefined) {
        return;
    }
    const touch = findTouchById(event.changedTouches, state.pointerId);
    if (!touch) {
        return;
    }
    handlePointerCancel(createPointerFromTouch(event, touch));
}

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function replayDrawing() {
    if (state.isReplaying || !state.strokes.length) {
        return;
    }

    state.isReplaying = true;
    setStatus("Replaying strokes...");

    const strokesToReplay = cloneStrokes();
    const playbackStrokes = [];

    const redrawPlayback = () => {
        const width = canvas.width / state.dpr;
        const height = canvas.height / state.dpr;
        ctx.clearRect(0, 0, width, height);
        for (const stroke of playbackStrokes) {
            drawStroke(stroke);
        }
    };

    for (const stroke of strokesToReplay) {
        const playbackStroke = {
            id: stroke.id,
            pointerType: stroke.pointerType,
            pointerId: stroke.pointerId,
            color: "#1f2937",
            createdAt: stroke.createdAt,
            duration: stroke.duration,
            points: [],
        };
        playbackStrokes.push(playbackStroke);
        redrawPlayback();

        let lastTime = 0;
        for (const point of stroke.points) {
            const delay = Math.max(point.time - lastTime, 0);
            await sleep(delay);
            playbackStroke.points.push(point);
            redrawPlayback();
            lastTime = point.time;
        }
    }

    state.isReplaying = false;
    setStatus("Replay finished");
    render();
}

function downloadJSON() {
    const blob = new Blob([elements.vectorOutput.value || "{}"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `drawing-${Date.now()}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setStatus("Downloaded JSON");
}

async function copyJSON() {
    try {
        await navigator.clipboard.writeText(elements.vectorOutput.value);
        setStatus("Copied to clipboard");
    } catch (error) {
        console.error(error);
        setStatus("Clipboard permission denied");
    }
}

function loadFromText() {
    try {
        const parsed = JSON.parse(elements.vectorOutput.value);
        if (!Array.isArray(parsed.strokes)) {
            throw new Error("Missing strokes array");
        }
        state.strokes = parsed.strokes.map((stroke) => ({
            id: stroke.id || `stroke-${Math.random().toString(16).slice(2, 8)}`,
            pointerType: stroke.pointerType || "pen",
            pointerId: stroke.pointerId ?? null,
            color: stroke.color || "#111827",
            createdAt: stroke.createdAt || new Date().toISOString(),
            duration: stroke.duration || 0,
            points: Array.isArray(stroke.points)
                ? stroke.points.map((point) => ({
                      x: point.x,
                      y: point.y,
                      pressure: Math.min(Math.max(point.pressure ?? 0, 0), 1),
                      tiltX: point.tiltX ?? 0,
                      tiltY: point.tiltY ?? 0,
                      twist: point.twist,
                      time: point.time ?? 0,
                  }))
                : [],
        }));
        setStatus(`Loaded ${state.strokes.length} stroke${state.strokes.length === 1 ? "" : "s"}`);
        updateVectorOutput();
        render();
    } catch (error) {
        console.error(error);
        setStatus("Invalid JSON");
    }
}

function handleFileImport(event) {
    const [file] = event.target.files;
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
        elements.vectorOutput.value = loadEvent.target.result;
        loadFromText();
    };
    reader.onerror = () => {
        setStatus("Failed to read file");
    };
    reader.readAsText(file);
}

function initialise() {
    resizeCanvas();
    updateVectorOutput();
    canvas.style.touchAction = "none";
    logEvent("init", { pointerEventsSupported: state.pointerEventsSupported });

    if (state.pointerEventsSupported) {
        canvas.addEventListener("pointerdown", handlePointerDown);
        canvas.addEventListener("pointermove", handlePointerMove);
        canvas.addEventListener("pointerup", handlePointerUp);
        canvas.addEventListener("pointercancel", handlePointerCancel);

        const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
        if (platform.includes("Mac")) {
            setStatus("Trackpad ready: click-drag or Force Click for pressure");
        }
    } else {
        setStatus("Pointer events unsupported; fallback mode active");
    }

    canvas.addEventListener("mousedown", handleMouseDownFallback);
    canvas.addEventListener("mousemove", handleMouseMoveFallback);
    window.addEventListener("mouseup", handleMouseUpFallback);
    canvas.addEventListener("mouseleave", handleMouseLeaveFallback);
    canvas.addEventListener("touchstart", handleTouchStartFallback, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMoveFallback, { passive: false });
    canvas.addEventListener("touchend", handleTouchEndFallback);
    canvas.addEventListener("touchcancel", handleTouchCancelFallback);

    elements.undo.addEventListener("click", undoLastStroke);
    elements.clear.addEventListener("click", clearCanvas);
    elements.replay.addEventListener("click", replayDrawing);
    elements.download.addEventListener("click", downloadJSON);
    elements.copy.addEventListener("click", copyJSON);
    elements.load.addEventListener("click", loadFromText);
    elements.fileLoader.addEventListener("change", handleFileImport);

    window.addEventListener("resize", resizeCanvas);
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
}

initialise();
