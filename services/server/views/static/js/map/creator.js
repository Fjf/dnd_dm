let CANVAS_WIDTH = 800;
let CANVAS_HEIGHT = 800;

// DOM elements used for eventhandlers.
let lineWidthSlider = document.getElementById("slider-line-width");
let lineColour = document.getElementById("line-colour");
let gridSlider = document.getElementById("slider-grid-size");

let visibleCanvas = document.getElementById("canvas");
let canvas = document.createElement("canvas");

visibleCanvas.width = CANVAS_WIDTH;
visibleCanvas.height = CANVAS_HEIGHT;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let context = canvas.getContext("2d");
let visibleContext = visibleCanvas.getContext("2d");

function relativeMouseCoords(event) {
    let totalOffsetX = 0;
    let totalOffsetY = 0;
    let currentElement = this;

    do {
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    }
    while ((currentElement = currentElement.offsetParent) !== null);

    let canvasX = event.pageX - totalOffsetX;
    let canvasY = event.pageY - totalOffsetY;

    return {
        x: canvasX,
        y: canvasY
    }
}

HTMLCanvasElement.prototype.relativeMouseCoords = relativeMouseCoords;

function storeCurrentDrawing(div) {
    let map_base64 = canvas.toDataURL();

    div.disabled = true;

    let responseHandler = function (data) {
        div.disabled = false;
        getDrawingMetadatas();
    };

    let data = {
        campaign_id: CAMPAIGN_ID,
        map_base64: map_base64,
        name: drawingMap.name,
        grid_size: drawingMap.gridSize,
        grid_type: drawingMap.gridStyle
    };

    requestApiJsonData("/api/" + CAMPAIGN_ID + "/maps", "POST", data, responseHandler);
}

function loadDrawing(data) {
    let img = new Image();
    img.src = data.map_base64;
    img.onload = () => {
        context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        context.drawImage(img, 0, 0);
        drawingMap.update();
    };
    drawingMap.gridStyle = data.grid_type;
    drawingMap.gridSize = data.grid_size;

    document.getElementById("creator-map-title").value = data.name;
}

function setDrawingList(data) {
    if (!data.success) {
        console.error(data.error);
        return;
    }

    let ul = document.getElementById("created-map-list");
    ul.innerHTML = "";
    data.maps.forEach(map => {
        let li = document.createElement("div");
        li.className = "created-map-element";
        li.addEventListener("click", (e) => {
            loadDrawing(map);
        });

        let text = document.createElement("div");
        let icon = document.createElement("div");

        text.innerHTML = map.name + "(By: " + map.creator_id + ")";
        icon.className = "delete-button-icon";
        icon.addEventListener("click", (e) => {
            deleteDrawing(map);
            e.preventDefault();
        });

        li.appendChild(text);
        li.appendChild(icon);
        ul.appendChild(li);
    });
}

function deleteDrawing(data) {
    requestApiJsonData("/api/" + CAMPAIGN_ID + "/maps/" + data.id, "DELETE", data, setDrawingList);
}

function getDrawingMetadatas() {
    requestApiJsonData("/api/" + CAMPAIGN_ID + "/maps", "GET", null, setDrawingList);
}

let mouseState = {
    clicking: false,
    previousPointerPosition: {
        x: -1,
        y: -1
    }
};

let action = "drawing";

function getEuclideanDistance(prev, e) {
    return Math.sqrt(Math.pow(prev.x - e.x, 2) + Math.pow(prev.y - e.y, 2));
}

let Path = function (map) {
    this.map = map;
    this.path = [];
    this.colour = "#" + lineColour.value;
    this.lineWidth = lineWidthSlider.value;
    this.done = false;

    this.draw = function () {
        // Cannot draw a path of length zero.
        if (this.path.length === 0)
            return;

        let point = this.path[0];

        context.strokeStyle = this.colour;
        context.lineWidth = this.lineWidth;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.beginPath();
        context.moveTo(point.x + this.map.xOffset, point.y + this.map.yOffset);

        let tempPath = this.path.slice(1, this.path.length);

        tempPath.forEach(point => {
            context.lineTo(point.x + this.map.xOffset, point.y + this.map.yOffset);
        });

        context.stroke();
    };

    this.push = function (e) {
        // Check if the two points are far away enough from eachother.
        // If they are too close, do not add this point to the line.
        if (this.path.length !== 0) {
            let prev = this.path[this.path.length - 1];
            let dist = getEuclideanDistance(prev, e);

            if (dist < this.lineWidth / 2)
                return;
        }

        this.path.push(e);
    };

    this.finalize = function () {
        if (this.path.length > 0)
            this.done = true;
    }
};

let PixelPath = function () {
    this.prev = null;

    this.colour = "#" + lineColour.value;
    this.radius = parseInt(lineWidthSlider.value);
    this.originalRadius = this.radius;
    this.done = false;

    this.push = function (e) {
        if (this.radius === 0) return;

        // Add all pixels from current point to previous point in a straight line
        if (this.prev !== null) {
            let coefficient = (this.prev.x - e.x) / (this.prev.y - e.y);

            let angle = Math.atan(coefficient);

            let dx0 = Math.cos(-angle) * this.radius;
            let dy0 = Math.sin(-angle) * this.radius;

            context.beginPath();
            context.moveTo(e.x - dx0, e.y - dy0);
            context.lineTo(this.prev.x - dx0, this.prev.y - dy0);
            context.lineTo(this.prev.x + dx0, this.prev.y + dy0);
            context.lineTo(e.x + dx0, e.y + dy0);

            context.fillStyle = this.colour;
            context.fill();
            context.lineWidth = 0;
            context.strokeStyle = this.colour;
            context.stroke();
        }

        context.beginPath();
        context.arc(e.x, e.y, this.radius, 0, 2 * Math.PI, false);
        context.fillStyle = this.colour;
        context.fill();

        context.lineWidth = 0;
        context.strokeStyle = this.colour;
        context.stroke();

        this.prev = {x: e.x, y: e.y};
    };
};

let Clipboard = function () {
    this.start = null;
    this.end = null;

    this.canvas = document.createElement("canvas");
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.context = this.canvas.getContext("2d");

    this.moveTo = function (position) {
        let width = position.x - this.start.x;
        let height = position.y - this.start.y;

        // Move position to the new location without reducing the width.
        this.start.x = position.x;
        this.start.y = position.y;
        this.end.x += width;
        this.end.y += height;
    };

    this.moveBy = function (x, y) {
        this.start.x += x;
        this.start.y += y;
        this.end.x += x;
        this.end.y += y;
    }
};

let Selection = function () {
    this.start = null;
    this.end = null;
    this.margin = 5;

    this.canvas = document.createElement("canvas");
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.context = this.canvas.getContext("2d");
};

function copyStartEndPosition(src, dst) {
    /*
     * Copies the first variable's start and end parameters into the second one.
     * Because they are both objects single assignment doesnt work due to js object reference.
     */
    dst.start = {
        x: src.start.x,
        y: src.start.y
    };

    dst.end = {
        x: src.end.x,
        y: src.end.y
    };
}

let DrawingMap = function () {
    this.width = 1000;
    this.height = 1000;

    this.xOffset = 0;
    this.yOffset = 0;

    this.xScale = 1;
    this.yScale = 1;

    this.select = {
        start: null,
        end: null
    };

    this.name = "";

    this.gridStyle = "none";
    this.gridSize = gridSlider.value;

    this.drawing = [];
    // Temporally ordered list of old board states
    this.drawingHistory = [];
    this.drawingFuture = [];

    /*
     * Returns the currently active path, if the last path is not active anymore, it will create a new one.
     */
    this.getPath = function () {
        if (this.drawing.length === 0 || this.drawing[this.drawing.length - 1].done) {
            this.drawing.push(new PixelPath(this));
            // Clear history if a new path gets added.
            this.drawingFuture = [];
        }

        return this.drawing[this.drawing.length - 1];
    };

    this.drawAction = function (ev) {
        let point = visibleCanvas.relativeMouseCoords(ev);
        if (point.x < 0 || point.y < 0 || point.x > CANVAS_WIDTH || point.y > CANVAS_HEIGHT) return;
        let path = this.getPath();

        path.radius = Math.min(Math.ceil(path.originalRadius * (ev.pressure * 4)), path.originalRadius);
        path.push(point);
    };

    this.startSelect = function (ev) {
        let point = visibleCanvas.relativeMouseCoords(ev);
        if (point.x < 0 || point.y < 0 || point.x > CANVAS_WIDTH || point.y > CANVAS_HEIGHT) return;

        this.select.start = point;
        this.select.end = null;
    };

    this.getSelectPointerOrientation = function(point, margin) {
        if (!inBoundingBox(point, this.select, margin)) {
            return "auto";
        }

        // if (point.x > this.select.start.x - margin && point.x < this.select.start.x + margin
        //  && point.y > this.select.start.y - margin && point.y < this.select.start.y + margin) {
        //
        // }

        return "grab";
    };

    this.endSelect = function (ev) {
        let point = visibleCanvas.relativeMouseCoords(ev);
        if (point.x < 0 || point.y < 0 || point.x > CANVAS_WIDTH || point.y > CANVAS_HEIGHT) return;

        this.select.end = point;
    };

    this.update = function () {
        visibleContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // TODO: Fix this
        // Create grid if possible
        if (this.gridStyle === "squared") {
            visibleContext.strokeStyle = "black";
            visibleContext.lineWidth = "1";

            for (let x = 0; x < CANVAS_WIDTH; x += this.gridSize) {
                visibleContext.beginPath();
                visibleContext.moveTo(x, 0);
                visibleContext.lineTo(x, CANVAS_HEIGHT);
                visibleContext.stroke();
            }
            for (let y = 0; y < CANVAS_HEIGHT; y += this.gridSize) {
                visibleContext.beginPath();
                visibleContext.moveTo(0, y);
                visibleContext.lineTo(CANVAS_WIDTH, y);
                visibleContext.stroke();
            }
        }

        visibleContext.drawImage(canvas, 0, 0);

        // Fill select grid if necessary
        this.drawSelectBox();
        this.drawSelection();
    };

    this.drawSelectBox = function () {
        if (this.select.end === null || this.select.start === null) return;

        let w = this.select.end.x - this.select.start.x;
        let h = this.select.end.y - this.select.start.y;

        visibleContext.fillStyle = "rgba(255, 255, 255, 0.5)";
        visibleContext.fillRect(this.select.start.x, this.select.start.y, w, h);

        visibleContext.strokeStyle = "grey";
        visibleContext.lineWidth = 1;
        visibleContext.setLineDash([5, 5]);
        visibleContext.beginPath();
        visibleContext.rect(this.select.start.x, this.select.start.y, w, h);
        visibleContext.stroke();
        visibleContext.setLineDash([]);
    };

    this.drawSelection = function () {
        if (selection.end === null || selection.start === null) return;

        let w = selection.end.x - selection.start.x;
        let h = selection.end.y - selection.start.y;
        visibleContext.drawImage(selection.canvas, selection.start.x, selection.start.y, w, h, this.select.start.x, this.select.start.y, w, h);
    };

    this.undo = function () {
        if (this.drawingHistory.length === 0) return;

        // Remember current board state to go back to later.
        this.futureSnapshot();
        if (this.drawingHistory.length === 1) {
            // Never remove the initial snapshot (empty canvas)
            let snapshot = this.drawingHistory[0];
            context.putImageData(snapshot, 0, 0);
        } else {
            let snapshot = this.drawingHistory.pop();
            context.putImageData(snapshot, 0, 0);
        }
    };

    this.redo = function () {
        if (this.drawingFuture.length === 0) return;

        this.snapshot();
        let snapshot = this.drawingFuture.pop();
        context.putImageData(snapshot, 0, 0);
    };

    this.snapshot = function () {
        let image = context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        this.drawingHistory.push(image);
    };

    this.futureSnapshot = function () {
        let image = context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        this.drawingFuture.push(image);
    };

    this.finalize = function () {
        this.drawing.push(new PixelPath());
    };

    this.delete = function () {
        if (this.select.end === null) {
            console.log("Cannot delete when not selecting anything");
        }

        this.snapshot();

        let w = this.select.end.x - this.select.start.x;
        let h = this.select.end.y - this.select.start.y;
        context.clearRect(this.select.start.x, this.select.start.y, w, h);
    };

    this.cut = function () {
        if (this.select.end === null) {
            console.log("Cannot cut when not selecitng anything.");
        }

        this.snapshot();

        this.copy();

        let w = this.select.end.x - this.select.start.x;
        let h = this.select.end.y - this.select.start.y;
        context.clearRect(this.select.start.x, this.select.start.y, w, h);
    };

    this.copy = function () {
        copyStartEndPosition(this.select, clipboard);

        let w = this.select.end.x - this.select.start.x;
        let h = this.select.end.y - this.select.start.y;
        clipboard.context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        clipboard.context.drawImage(canvas, this.select.start.x, this.select.start.y, w, h, this.select.start.x, this.select.start.y, w, h);
    };

    this.paste = function () {
        this.drawingFuture = [];
        this.snapshot();

        let w = clipboard.end.x - clipboard.start.x;
        let h = clipboard.end.y - clipboard.start.y;
        selection.context.drawImage(clipboard.canvas, clipboard.start.x, clipboard.start.y, w, h, this.select.start.x, this.select.start.y, w, h);
        clipboard.moveTo(this.select.start);

        copyStartEndPosition(clipboard, this.select);
        copyStartEndPosition(clipboard, selection);

        // Set action to resizing to move the stuff.
        setAction("resizing");
    };

    this.resizeAction = function (ev){
        let point = visibleCanvas.relativeMouseCoords(ev);
        if (!inBoundingBox(point, this.select)) {
            return;
        }

        let relX = mouseState.previousPointerPosition.x - ev.x;
        let relY = mouseState.previousPointerPosition.y - ev.y;

        this.select.start.x -= relX;
        this.select.end.x -= relX;
        this.select.start.y -= relY;
        this.select.end.y -= relY;
    }
};
let selection = new Selection();
let clipboard = new Clipboard();
let drawingMap = new DrawingMap();
drawingMap.snapshot(); // Keep empty canvas in memory for ctrl-z

/*
 * Mouse event handlers
 */

document.addEventListener("pointerdown", ev => {
    if (ev.pointerType === "pen" || ev.pointerType === "touch") return;

    mouseState.clicking = true;

    if (action === "drawing") {
        drawingMap.select.end = null;

        drawingMap.drawingFuture = [];
        drawingMap.snapshot();
        drawingMap.drawAction(ev);
    } else if (action === "selecting") {
        drawingMap.startSelect(ev);
    }

    mouseState.previousPointerPosition.x = ev.x;
    mouseState.previousPointerPosition.y = ev.y;
});

document.addEventListener("pointerup", ev => {
    mouseState.clicking = false;

    if (action === "drawing") {
        drawingMap.finalize();
    }

    if (action === "selecting") {
        drawingMap.endSelect(ev);
    }
});

function inBoundingBox(ev, box, margin) {
    if (margin === undefined)
        margin = 0;

    return ev.x > box.start.x - margin
        && ev.x < box.end.x + margin
        && ev.y > box.start.y - margin
        && ev.y < box.end.y + margin;
}

document.addEventListener("pointermove", ev => {
    if (ev.pointerType === "pen") {
        if (action === "drawing") {
            if (ev.pressure > 0) {
                if (!mouseState.clicking) {
                    drawingMap.snapshot();
                }

                drawingMap.drawAction(ev);
                mouseState.clicking = true;
            } else {
                mouseState.clicking = false;
            }
        }
    } else {
        if (action === "resizing") {
            // Set cursor type to the correct one based on position relative to selection area.
            let point = visibleCanvas.relativeMouseCoords(ev);
            visibleCanvas.style.cursor = drawingMap.getSelectPointerOrientation(point, selection.margin);
        }

        if (!mouseState.clicking) return;

        if (action === "drawing") {
            drawingMap.drawAction(ev);
        } else if (action === "selecting") {
            drawingMap.endSelect(ev);
        } else if (action === "resizing") {
            drawingMap.resizeAction(ev);
        }

        mouseState.previousPointerPosition.x = ev.x;
        mouseState.previousPointerPosition.y = ev.y;
    }
});

/*
 * Keyboard input event handlers
 */

document.addEventListener("keydown", ev => {
    if (ev.ctrlKey && ev.key === "z") {
        drawingMap.undo();
    } else if (ev.ctrlKey && ev.key === "y") {
        drawingMap.redo();
    } else if (ev.ctrlKey && ev.key === "x") {
        drawingMap.cut();
    } else if (ev.ctrlKey && ev.key === "v") {
        drawingMap.paste();
    } else if (ev.ctrlKey && ev.key === "c") {
        drawingMap.copy();
    } else {
        switch (ev.key) {
            case "d":
                setAction("drawing");
                break;
            case "s":
                setAction("selecting");
                break;
        }
    }

    if (action === "selecting") {
        if (ev.key === "Delete") {
            drawingMap.delete();
        }
    }
});

/*
 * Line styling eventhandlers
 */
lineWidthSlider.onmousemove = function () {
    document.getElementById("slider-value").innerHTML = this.value;
};

/*
 * Grid styling eventhandlers
 */
function gridSelectable(event) {
    let parent = event.target.parentElement;
    parent.childNodes.forEach((node) => {
        node.className = "";
    });
    event.target.className = "active";
    drawingMap.gridStyle = event.target.getAttribute("value");
}

document.getElementById("grid-toggles").childNodes.forEach((node) => {
    node.addEventListener("click", gridSelectable);
});

document.getElementById("action-toggles").childNodes.forEach((node) => {
    node.addEventListener("click", (event) => {
        let parent = node.parentElement;
        for (let i = 0; i < parent.childElementCount; i++) {
            parent.children[i].className = "";
        }
        event.target.className = "active";
        action = node.getAttribute("value");
    });
});

gridSlider.onmousemove = function () {
    drawingMap.gridSize = parseInt(this.value);
};

function setAction(event) {
    let div = document.getElementById("action-toggles");
    for (let i = 0; i < div.childElementCount; i++) {
        let n = div.children[i];
        if (n.getAttribute("value") === event) {
            n.className = "active";
        } else {
            n.className = "";
        }
    }
    action = event;
}

// Draw screen 60hz
setInterval(function () {
    drawingMap.update()
}, 1000 / 60);

getDrawingMetadatas();