var events = new EventEmitter();

events.on('sell', function(card) {
    var columns = [];
    
    for (var i = 0; i < 4; i++) {
        columns.push([]);
    }
    
    // arrange the cards into columns
    cards.forEach(function(card) {
        columns[card.x].push(card);
    });
    
    columns.forEach(function(column) {
        // sort the tiles so the higher y is later
        column.sort(function(card1, card2) {
            return card1.y - card2.y;
        });
        
        // rebuild the column without any gaps
        for (var i = 0; i < column.length; i++) {
            column[i].y = 4 - column.length + i;
        }
    });
});

events.on('sell', function(card) {
    cards = cards.filter(function(card) {
        return !card.removed; 
    });
});

events.on('sell', function(card) {
    score.value += card.value;
    
    if (card.scoreMultiplier) {
        score.value *= card.scoreMultiplier;
    }
    
    if (card.effect) {
        var selected = [];
        if (card.effect.select == 'adjacent') {
            cards.forEach(function(card1) {
                if (card1.x == card.x && (card1.y == card.y - 1 || card1.y == card.y + 1)) {
                    selected.push(card1);
                }
                if (card1.y == card.y && (card1.x == card.x - 1 || card1.x == card.x + 1)) {
                    selected.push(card1);
                }
            });
        }
        
        selected.forEach(function(card1) {
            if (card.effect.increaseValue) {
                card1.value += card.effect.increaseValue;
            }
        })
    }
    
    card.removed = true;
    
    cards.forEach(function(card1) {
        if (card1.valueIncrease) {
            card1.value += card1.valueIncrease; 
        }
    });
});

function Score() {
    this.value = 0;
    
    stage.addChild(new ScoreDisplay(this));
}

function ScoreDisplay(score) {
    PIXI.Container.call(this);
    
    this.position.x = 10;
    this.position.y = 10;
    
    this.score = score;
    
    this.text = new PIXI.Text('Score: 0', { font: '14px Arial', fill: 'white' });
    
    this.addChild(this.text);
}
ScoreDisplay.prototype = Object.create(PIXI.Container.prototype);

ScoreDisplay.prototype.update = function() {
    this.text.text = 'Money: ' + this.score.value;
}

function Bread(x, y, stage) {
    this.x = x;
    this.y = y;
    this.value = 3;
    this.color = 0xC68958;
    this.removed = false;
}

function GoldBar(x, y, stage) {
    this.x = x;
    this.y = y;
    this.value = 0;
    this.valueIncrease = 2;
    this.color = 0xFFFF00;
    this.removed = false;
}

function Diamond(x, y, stage) {
    this.x = x;
    this.y = y;
    this.value = 6;
    this.valueIncrease = -3;
    this.scoreMultiplier = 2;
    this.color = 0x43C6DB;
    this.removed = false;
}

function Yarn(x, y, stage) {
    this.x = x;
    this.y = y;
    this.value = 2;
    this.effect = { 'select': 'adjacent', 'increaseValue': 5 };
    this.color = 0xFFFFFF;
    this.removed = false;
}

function Tile(card) {
    PIXI.Container.call(this);
    
    var self = this;
    
    this.card = card;
    
    this.graphics = new PIXI.Graphics();
    this.graphics.interactive = true;
    this.graphics.hitArea = new PIXI.Rectangle(0, 0, 80, 80);
    this.graphics.on('click', function() {
        events.emit('sell', self.card)
    })
    
    this.text = new PIXI.Text('0', { font: '14px Arial', fill: 'gray' });
    this.text.anchor.x = 1;
    this.text.anchor.y = 1;
    this.text.position.x = 75;
    this.text.position.y = 75;
    
    this.addChild(this.graphics);
    this.addChild(this.text);
}
Tile.prototype = Object.create(PIXI.Container.prototype);

Tile.prototype.update = function() {
    if (this.card.removed) {
        this.visible = false;
        return;
    }
    
    this.position.x = 50 + 85 * this.card.x;
    this.position.y = 50 + 85 * this.card.y;
    
    this.graphics.clear();
    this.graphics.lineStyle(1, this.card.color);
    this.graphics.drawRect(0, 0, 80, 80);
    
    this.text.text = this.card.value;
};

var stage = new PIXI.Stage(0x000000);
var renderer = new PIXI.WebGLRenderer(800, 600, { view: document.getElementById('game') });

var score = new Score();
var cards = [];

var board = [
    [Diamond, Bread, Bread, Bread],
    [Bread, Bread, Yarn, Diamond],
    [Bread, Bread, GoldBar, Bread],
    [Bread, GoldBar, Bread, Bread]
];
function setUpBoard() {
    cards = [];
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            var card = new board[i][j](j, i, stage);
            cards.push(card);
            stage.addChild(new Tile(card));
        }
    }
}
setUpBoard();

document.getElementById('randomize').onclick = function() {
    score.value = 0;
    
    board = [];
    
    cards.forEach(function(card) {
        card.removed = true;
    });
    
    stage.children.forEach(function(child) {
        child.update();
    });
    
    if (document.getElementById('new').value !== '') {
        seed = parseInt(document.getElementById('new').value);
        document.getElementById('new').value = '';
    }
    else {
        seed = Math.floor(Math.random() * 1337);
    }
    
    for (var i = 0; i < 4; i++) {
        var row = [];
        for (var j = 0; j < 4; j++) {
            var r = random();
            console.log(r);
            
            if (r < 0.1) {
                row.push(Diamond);
            }
            
            else if (r < 0.2) {
                row.push(GoldBar);
            }
            
            else if (r < 0.3) {
                row.push(Yarn);
            }
            
            else {
                row.push(Bread);
            }
        }
        board.push(row);
    }
    document.getElementById('seed').innerHTML = seed - 16; // why doesnt JS have a real seedable PRNG...
    
    setUpBoard()
};

var seed;
function random() {
    seed++;
    var x = Math.sin(seed) * 1000000;
    return x - Math.floor(x);
}

(function draw() {
    // some generic method for updating animation properties of all cards
    // for (var i = 0; i < cards.length; i++) {
    //     update(cards[i]);
    // }
    
    // update all card views with the new animation properties
    for (var i = 0; i < stage.children.length; i++) {
        stage.children[i].update();
    }
    
    renderer.render(stage);
    requestAnimationFrame(draw);
})();