Function.prototype.bind = Function.prototype.bind || function (target) {
        var self = this;
        return function (args) {
            if (!(args instanceof Array)) {
                args = [args];
            }
            self.apply(target, args);
        };
    };
(function () {
    if (typeof window.Element === "undefined" ||
        "classList" in document.documentElement) {
        return;
    }

    var prototype = Array.prototype,
        push = prototype.push,
        splice = prototype.splice,
        join = prototype.join;

    function DOMTokenList(el) {
        this.el = el;
        // 需要对类名进行修剪并在空白处分割，以检索类列表。
        var classes = el.className.replace(/^\s+|\s+$/g, '').split(/\s+/);
        for (var i = 0; i < classes.length; i++) {
            push.call(this, classes[i]);
        }
    }

    DOMTokenList.prototype = {
        add: function (token) {
            if (this.contains(token)) return;
            push.call(this, token);
            this.el.className = this.toString();
        },
        contains: function (token) {
            return this.el.className.indexOf(token) != -1;
        },
        item: function (index) {
            return this[index] || null;
        },
        remove: function (token) {
            if (!this.contains(token)) return;
            for (var i = 0; i < this.length; i++) {
                if (this[i] == token) break;
            }
            splice.call(this, i, 1);
            this.el.className = this.toString();
        },
        toString: function () {
            return join.call(this, ' ');
        },
        toggle: function (token) {
            if (!this.contains(token)) {
                this.add(token);
            } else {
                this.remove(token);
            }

            return this.contains(token);
        }
    };

    window.DOMTokenList = DOMTokenList;

    function defineElementGetter(obj, prop, getter) {
        if (Object.defineProperty) {
            Object.defineProperty(obj, prop, {
                get: getter
            });
        } else {
            obj.__defineGetter__(prop, getter);
        }
    }

    defineElementGetter(HTMLElement.prototype, 'classList', function () {
        return new DOMTokenList(this);
    });
})();
(function () {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame =
            window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () {
                    callback(currTime + timeToCall);
                },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
}());
function KeyboardInputManager() {
    this.events = {};

    if (window.navigator.msPointerEnabled) {
        //网页浏览器 10 个样式
        this.eventTouchstart = "MSPointerDown";
        this.eventTouchmove = "MSPointerMove";
        this.eventTouchend = "MSPointerUp";
    } else {
        this.eventTouchstart = "touchstart";
        this.eventTouchmove = "touchmove";
        this.eventTouchend = "touchend";
    }

    this.listen();
}

KeyboardInputManager.prototype.on = function (event, callback) {
    if (!this.events[event]) {
        this.events[event] = [];
    }
    this.events[event].push(callback);
};

KeyboardInputManager.prototype.emit = function (event, data) {
    var callbacks = this.events[event];
    if (callbacks) {
        callbacks.forEach(function (callback) {
            callback(data);
        });
    }
};


// 按键按下
KeyboardInputManager.prototype.listen = function () {
    var self = this;

    var map = {
        38: 0, // Up
        39: 1, // Right
        40: 2, // Down
        37: 3, // Left
        75: 0, // Vim up
        76: 1, // Vim right
        74: 2, // Vim down
        72: 3, // Vim left
        87: 0, // W
        68: 1, // D
        83: 2, // S
        65: 3  // A
    };

    // 响应方向键
    document.addEventListener("keydown", function (event) {
        var modifiers = event.altKey || event.ctrlKey || event.metaKey ||
            event.shiftKey;
        var mapped = map[event.which];

        // 忽略在文本字段中发生的事件
        if (self.targetIsInput(event)) return;

        if (!modifiers) {
            if (mapped !== undefined) {
                event.preventDefault();
                self.emit("move", mapped);
            }
        }

        // R键重新启动游戏
        if (!modifiers && event.which === 82) {
            self.restart.call(self, event);
        }
    });

    // 响应按钮按下
    this.bindButtonPress(".retry-button", this.restart);
    this.bindButtonPress(".restart-button", this.restart);
    this.bindButtonPress(".keep-playing-button", this.keepPlaying);

    // Respond to swipe events响应刷卡事件
    var touchStartClientX, touchStartClientY;
    var gameContainer = document.getElementsByClassName("game-container")[0];

    gameContainer.addEventListener(this.eventTouchstart, function (event) {
        if ((!window.navigator.msPointerEnabled && event.touches.length > 1) ||
            event.targetTouches > 1 ||
            self.targetIsInput(event)) {
            return; // Ignore if touching with more than 1 finger or touching input
        }

        if (window.navigator.msPointerEnabled) {
            touchStartClientX = event.pageX;
            touchStartClientY = event.pageY;
        } else {
            touchStartClientX = event.touches[0].clientX;
            touchStartClientY = event.touches[0].clientY;
        }

        event.preventDefault();
    });

    gameContainer.addEventListener(this.eventTouchmove, function (event) {
        event.preventDefault();
    });

    gameContainer.addEventListener(this.eventTouchend, function (event) {
        if ((!window.navigator.msPointerEnabled && event.touches.length > 0) ||
            event.targetTouches > 0 ||
            self.targetIsInput(event)) {
            return; // Ignore if still touching with one or more fingers or input
        }

        var touchEndClientX, touchEndClientY;

        if (window.navigator.msPointerEnabled) {
            touchEndClientX = event.pageX;
            touchEndClientY = event.pageY;
        } else {
            touchEndClientX = event.changedTouches[0].clientX;
            touchEndClientY = event.changedTouches[0].clientY;
        }

        var dx = touchEndClientX - touchStartClientX;
        var absDx = Math.abs(dx);

        var dy = touchEndClientY - touchStartClientY;
        var absDy = Math.abs(dy);

        if (Math.max(absDx, absDy) > 10) {
            // (right : left) : (down : up)
            self.emit("move", absDx > absDy ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
        }
    });
};

KeyboardInputManager.prototype.restart = function (event) {
    event.preventDefault();
    this.emit("restart");
};

KeyboardInputManager.prototype.keepPlaying = function (event) {
    event.preventDefault();
    this.emit("keepPlaying");
};

KeyboardInputManager.prototype.bindButtonPress = function (selector, fn) {
    var button = document.querySelector(selector);
    button.addEventListener("click", fn.bind(this));
    button.addEventListener(this.eventTouchend, fn.bind(this));
};

KeyboardInputManager.prototype.targetIsInput = function (event) {
    return event.target.tagName.toLowerCase() === "input";
};
function HTMLActuator() {
    this.tileContainer = document.querySelector(".tile-container");
    this.scoreContainer = document.querySelector(".score-container");
    this.bestContainer = document.querySelector(".best-container");
    this.messageContainer = document.querySelector(".game-message");
    this.sharingContainer = document.querySelector(".score-sharing");

    this.score = 0;
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
    var self = this;

    window.requestAnimationFrame(function () {
        self.clearContainer(self.tileContainer);

        grid.cells.forEach(function (column) {
            column.forEach(function (cell) {
                if (cell) {
                    self.addTile(cell);
                }
            });
        });
        self.updateScore(metadata.score);
        self.updateBestScore(metadata.bestScore);

        if (metadata.terminated) {
            if (metadata.over) {
                self.message(false); // You lose
            } else if (metadata.won) {
                self.message(true); // You win!
            }
        }

    });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continueGame = function () {
    if (typeof ga !== "undefined") {
        ga("send", "event", "game", "restart");
    }

    this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
};

//HTMLActuator.prototype.tileHTML = ["菜鸟", "入门", "码畜", "码奴", "码农", "IT民工", "IT工程师", "IT人才", "IT精英", "IT大哥", "IT领袖"];
HTMLActuator.prototype.tileHTML = ["2", "4", "8", "16", "32", "64", "128", "256", "512", "1024", "2048"];
//HTMLActuator.prototype.tileHTML = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "win"];
//HTMLActuator.prototype.tileHTML = ["工兵", "班长", "排长", "连长", "营长", "团长", "旅长", "师长", "军长", "司令", "军旗"];

HTMLActuator.prototype.addTile = function (tile) {
    var self = this;

    var wrapper = document.createElement("div");
    var inner = document.createElement("div");
    var position = tile.previousPosition || {x: tile.x, y: tile.y};
    var positionClass = this.positionClass(position);

    // We can't use classlist because it somehow glitches when replacing classes
    var classes = ["tile", "tile-" + tile.value, positionClass];

    if (tile.value > 2048) classes.push("tile-super");

    this.applyClasses(wrapper, classes);

    inner.classList.add("tile-inner");
    inner.textContent = HTMLActuator.prototype.tileHTML[Math.log(tile.value) / Math.LN2 - 1] || tile.value;

    if (tile.previousPosition) {
        // Make sure that the tile gets rendered in the previous position first
        window.requestAnimationFrame(function () {
            classes[2] = self.positionClass({x: tile.x, y: tile.y});
            self.applyClasses(wrapper, classes); // Update the position
        });
    } else if (tile.mergedFrom) {
        classes.push("tile-merged");
        this.applyClasses(wrapper, classes);

        // Render the tiles that merged
        tile.mergedFrom.forEach(function (merged) {
            self.addTile(merged);
        });
    } else {
        classes.push("tile-new");
        this.applyClasses(wrapper, classes);
    }

    // 将瓷砖的内部添加到包装中
    wrapper.appendChild(inner);

    // Put the tile on the board
    this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
    element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
    return {x: position.x + 1, y: position.y + 1};
};

HTMLActuator.prototype.positionClass = function (position) {
    position = this.normalizePosition(position);
    return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
    this.clearContainer(this.scoreContainer);

    var difference = score - this.score;
    this.score = score;

    this.scoreContainer.textContent = this.score;

    if (difference > 0) {
        var addition = document.createElement("div");
        addition.classList.add("score-addition");
        addition.textContent = "+" + difference;

        this.scoreContainer.appendChild(addition);
    }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
    this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (won) {
    var type = won ? "game-won" : "game-over";
    var message = won ? "You win!" : "Game over!";

    if (typeof ga !== "undefined") {
        ga("send", "event", "game", "end", type, this.score);
    }

    this.messageContainer.classList.add(type);
    this.messageContainer.getElementsByTagName("p")[0].textContent = message;

    this.clearContainer(this.sharingContainer);
    this.sharingContainer.appendChild(this.scoreTweetButton());
    //twttr.widgets.load();
};

HTMLActuator.prototype.clearMessage = function () {
    // IE only takes one value to remove at a time.
    this.messageContainer.classList.remove("game-won");
    this.messageContainer.classList.remove("game-over");
};

HTMLActuator.prototype.scoreTweetButton = function () {
    var tweet = document.createElement("a");
    tweet.classList.add("twitter-share-button");
    tweet.setAttribute("href", "https://twitter.com/share");
    tweet.setAttribute("data-via", "gabrielecirulli");
    tweet.setAttribute("data-url", "http://git.io/2048");
    tweet.setAttribute("data-counturl", "http://gabrielecirulli.github.io/2048/");
    tweet.textContent = "Tweet";

    var text = "分享：获得分数： " + this.score;
    tweet.setAttribute("data-text", text);

    return tweet;
};
function Grid(size, previousState) {
    this.size = size;
    this.cells = previousState ? this.fromState(previousState) : this.empty();
}

// Build a grid of the specified size
Grid.prototype.empty = function () {
    var cells = [];

    for (var x = 0; x < this.size; x++) {
        var row = cells[x] = [];

        for (var y = 0; y < this.size; y++) {
            row.push(null);
        }
    }

    return cells;
};

Grid.prototype.fromState = function (state) {
    var cells = [];

    for (var x = 0; x < this.size; x++) {
        var row = cells[x] = [];

        for (var y = 0; y < this.size; y++) {
            var tile = state[x][y];
            row.push(tile ? new Tile(tile.position, tile.value) : null);
        }
    }

    return cells;
};

// 找到一个可用的随机位置
Grid.prototype.randomAvailableCell = function () {
    var cells = this.availableCells();

    if (cells.length) {
        return cells[Math.floor(Math.random() * cells.length)];
    }
};

Grid.prototype.availableCells = function () {
    var cells = [];
    this.eachCell(function (x, y, tile) {
        if (!tile) {
            cells.push({x: x, y: y});
        }
    });

    return cells;
};

// Call callback for every cell
Grid.prototype.eachCell = function (callback) {
    for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++) {
            callback(x, y, this.cells[x][y]);
        }
    }
};

// 检查是否有可用的单元格
Grid.prototype.cellsAvailable = function () {
    return !!this.availableCells().length;
};

// 检查指定的单元格是否被占用
Grid.prototype.cellAvailable = function (cell) {
    return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function (cell) {
    return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function (cell) {
    if (this.withinBounds(cell)) {
        return this.cells[cell.x][cell.y];
    } else {
        return null;
    }
};

// Inserts a tile at its position
Grid.prototype.insertTile = function (tile) {
    this.cells[tile.x][tile.y] = tile;
};

Grid.prototype.removeTile = function (tile) {
    this.cells[tile.x][tile.y] = null;
};

Grid.prototype.withinBounds = function (position) {
    return position.x >= 0 && position.x < this.size &&
        position.y >= 0 && position.y < this.size;
};

Grid.prototype.serialize = function () {
    var cellState = [];

    for (var x = 0; x < this.size; x++) {
        var row = cellState[x] = [];

        for (var y = 0; y < this.size; y++) {
            row.push(this.cells[x][y] ? this.cells[x][y].serialize() : null);
        }
    }

    return {
        size: this.size,
        cells: cellState
    };
};
function Tile(position, value) {
    this.x = position.x;
    this.y = position.y;
    this.value = value || 2;

    this.previousPosition = null;
    this.mergedFrom = null; // Tracks tiles that merged together
}

Tile.prototype.savePosition = function () {
    this.previousPosition = {x: this.x, y: this.y};
};

Tile.prototype.updatePosition = function (position) {
    this.x = position.x;
    this.y = position.y;
};

Tile.prototype.serialize = function () {
    return {
        position: {
            x: this.x,
            y: this.y
        },
        value: this.value
    };
};
window.fakeStorage = {
    _data: {},

    setItem: function (id, val) {
        return this._data[id] = String(val);
    },

    getItem: function (id) {
        return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
    },

    removeItem: function (id) {
        return delete this._data[id];
    },

    clear: function () {
        return this._data = {};
    }
};

function LocalStorageManager() {
    this.bestScoreKey = "bestScore";
    this.gameStateKey = "gameState";

    var supported = this.localStorageSupported();
    this.storage = supported ? window.localStorage : window.fakeStorage;
}

LocalStorageManager.prototype.localStorageSupported = function () {
    var testKey = "test";
    var storage = window.localStorage;

    try {
        storage.setItem(testKey, "1");
        storage.removeItem(testKey);
        return true;
    } catch (error) {
        return false;
    }
};

// Best score getters/setters
LocalStorageManager.prototype.getBestScore = function () {
    return this.storage.getItem(this.bestScoreKey) || 0;
};

LocalStorageManager.prototype.setBestScore = function (score) {
    this.storage.setItem(this.bestScoreKey, score);
};

// Game state getters/setters and clearing
LocalStorageManager.prototype.getGameState = function () {
    var stateJSON = this.storage.getItem(this.gameStateKey);
    return stateJSON ? JSON.parse(stateJSON) : null;
};

LocalStorageManager.prototype.setGameState = function (gameState) {
    this.storage.setItem(this.gameStateKey, JSON.stringify(gameState));
};

LocalStorageManager.prototype.clearGameState = function () {
    this.storage.removeItem(this.gameStateKey);
};
function GameManager(size, InputManager, Actuator, StorageManager) {
    this.size = size; // Size of the grid
    this.inputManager = new InputManager;
    this.storageManager = new StorageManager;
    this.actuator = new Actuator;

    this.startTiles = 2;

    this.inputManager.on("move", this.move.bind(this));
    this.inputManager.on("restart", this.restart.bind(this));
    this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));

    this.setup();
}

// Restart the game
GameManager.prototype.restart = function () {
    this.storageManager.clearGameState();
    this.actuator.continueGame(); // Clear the game won/lost message
    this.setup();
};

// Keep playing after winning (allows going over 2048)
GameManager.prototype.keepPlaying = function () {
    this.keepPlaying = true;
    this.actuator.continueGame(); // Clear the game won/lost message
};

// Return true if the game is lost, or has won and the user hasn't kept playing
GameManager.prototype.isGameTerminated = function () {
    if (this.over || (this.won && !this.keepPlaying)) {
        return true;
    } else {
        return false;
    }
};

// 设置游戏
GameManager.prototype.setup = function () {
    var previousState = this.storageManager.getGameState();

    // 从上一个游戏重新加载游戏（如果存在）
    if (previousState && false) {
        this.grid = new Grid(previousState.grid.size,
            previousState.grid.cells); // Reload grid
        this.score = previousState.score;
        this.over = previousState.over;
        this.won = previousState.won;
        this.keepPlaying = previousState.keepPlaying;
    } else {
        this.grid = new Grid(this.size);
        this.score = 0;
        this.over = false;
        this.won = false;
        this.keepPlaying = false;

        // 添加初始瓷砖
        this.addStartTiles();
    }

    // 更新执行器
    this.actuate();
};


// 设置初始瓷砖以开始游戏
GameManager.prototype.addStartTiles = function () {
    // this.grid.insertTile(new Tile({x: 0, y: 0}, 2));
    // this.grid.insertTile(new Tile({x: 1, y: 0}, 4));
    // this.grid.insertTile(new Tile({x: 2, y: 0}, 8));
    // this.grid.insertTile(new Tile({x: 3, y: 0}, 16));
    // this.grid.insertTile(new Tile({x: 0, y: 1}, 32));
    // this.grid.insertTile(new Tile({x: 1, y: 1}, 64));
    // this.grid.insertTile(new Tile({x: 2, y: 1}, 128));
    // this.grid.insertTile(new Tile({x: 3, y: 1}, 256));
    // this.grid.insertTile(new Tile({x: 0, y: 2}, 512));
    // this.grid.insertTile(new Tile({x: 1, y: 2}, 4096));
    for (var i = 0; i < this.startTiles; i++) {
      this.addRandomTile();
    }
};

// 在随机位置添加瓷砖
GameManager.prototype.addRandomTile = function () {
    if (this.grid.cellsAvailable()) {
        // 产生2的概率为0.9
        var value = Math.random() < 0.9 ? 2 : 4;
        var tile = new Tile(this.grid.randomAvailableCell(), value);

        this.grid.insertTile(tile);
    }
};

//调用自动控制
GameManager.prototype.my_ai = function () {
    var url = '/ai';
    var next_f = -1;
    var me = this;
    $.ajax({
        url: url,
        type: "POST",
        data: {'cells': JSON.stringify(me.grid.cells)},
        dataType: "json",
        error: function () {
            alert('加载出错');
        },
        success: function (data, status) {
            console.log(data);
            console.log(me);
            me.move(Number(data));
            $('.mymove').text(data);
        }
    });
}

// 将更新的网格发送到执行器
GameManager.prototype.actuate = function () {
    if (this.storageManager.getBestScore() < this.score) {
        this.storageManager.setBestScore(this.score);
    }

    // 游戏结束时清除状态（仅游戏结束，不获胜）
    if (this.over) {
        this.storageManager.clearGameState();
    } else {
        this.storageManager.setGameState(this.serialize());
    }

    this.actuator.actuate(this.grid, {
        score: this.score,
        over: this.over,
        won: this.won,
        bestScore: this.storageManager.getBestScore(),
        terminated: this.isGameTerminated()
    });
    console.log('======ai=======');
    this.my_ai();
};

// Represent the current game as an object
GameManager.prototype.serialize = function () {
    return {
        grid: this.grid.serialize(),
        score: this.score,
        over: this.over,
        won: this.won,
        keepPlaying: this.keepPlaying
    };
};

// Save all tile positions and remove merger info
GameManager.prototype.prepareTiles = function () {
    this.grid.eachCell(function (x, y, tile) {
        if (tile) {
            tile.mergedFrom = null;
            tile.savePosition();
        }
    });
};

// Move a tile and its representation
GameManager.prototype.moveTile = function (tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
};

// 按指定方向移动网格上的平铺
GameManager.prototype.move = function (direction) {
    console.log('move=====' + direction)
    // 0: up, 1: right, 2: down, 3: left
    var self = this;

    if (this.isGameTerminated()) return; // 如果比赛结束了什么都不要做

    var cell, tile;

    var vector = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved = false;

    // 保存当前平铺位置并删除合并信息
    this.prepareTiles();

    // 沿正确方向遍历网格并移动平铺
    traversals.x.forEach(function (x) {
        traversals.y.forEach(function (y) {
            cell = {x: x, y: y};
            tile = self.grid.cellContent(cell);

            if (tile) {
                var positions = self.findFarthestPosition(cell, vector);
                var next = self.grid.cellContent(positions.next);

                // Only one merger per row traversal?
                if (next && next.value === tile.value && !next.mergedFrom) {
                    var merged = new Tile(positions.next, tile.value * 2);
                    merged.mergedFrom = [tile, next];

                    self.grid.insertTile(merged);
                    self.grid.removeTile(tile);

                    // Converge the two tiles' positions
                    tile.updatePosition(positions.next);

                    // Update the score
                    self.score += merged.value;

                    // The mighty 2048(65536) tile
                    if (merged.value === 65536) self.won = true;
                } else {
                    self.moveTile(tile, positions.farthest);
                }

                if (!self.positionsEqual(cell, tile)) {
                    moved = true; // The tile moved from its original cell!
                }
            }
        });
    });

    if (moved) {
        this.addRandomTile();

        if (!this.movesAvailable()) {
            this.over = true; // Game over!
        }

        // this.actuate();
    }
    this.actuate();
};

// 获取表示所选方向的向量
GameManager.prototype.getVector = function (direction) {
    // 表示平铺移动的向量
    var map = {
        0: {x: 0, y: -1}, // Up
        1: {x: 1, y: 0},  // Right
        2: {x: 0, y: 1},  // Down
        3: {x: -1, y: 0}   // Left
    };

    return map[direction];
};

// 按正确顺序建立要遍历的位置列表
GameManager.prototype.buildTraversals = function (vector) {
    var traversals = {x: [], y: []};

    for (var pos = 0; pos < this.size; pos++) {
        traversals.x.push(pos);
        traversals.y.push(pos);
    }

    // 始终沿选定方向从最远的单元格遍历
    if (vector.x === 1) traversals.x = traversals.x.reverse();
    if (vector.y === 1) traversals.y = traversals.y.reverse();

    return traversals;
};

GameManager.prototype.findFarthestPosition = function (cell, vector) {
    var previous;

    // 向矢量方向前进直到发现障碍物
    do {
        previous = cell;
        cell = {x: previous.x + vector.x, y: previous.y + vector.y};
    } while (this.grid.withinBounds(cell) &&
    this.grid.cellAvailable(cell));

    return {
        farthest: previous,
        next: cell // 用于检查是否需要合并
    };
};

GameManager.prototype.movesAvailable = function () {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

// 检查瓷砖之间的可用匹配项（更昂贵的检查）
GameManager.prototype.tileMatchesAvailable = function () {
    var self = this;

    var tile;

    for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++) {
            tile = this.grid.cellContent({x: x, y: y});

            if (tile) {
                for (var direction = 0; direction < 4; direction++) {
                    var vector = self.getVector(direction);
                    var cell = {x: x + vector.x, y: y + vector.y};

                    var other = self.grid.cellContent(cell);

                    if (other && other.value === tile.value) {
                        return true; // 这两个平铺可以合并
                    }
                }
            }
        }
    }

    return false;
};

GameManager.prototype.positionsEqual = function (first, second) {
    return first.x === second.x && first.y === second.y;
};
// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
    new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
});
