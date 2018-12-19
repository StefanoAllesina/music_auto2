function Box(index, boxID, pageNum, lineNum, x, y, w, h) {
    this.index = index;
    this.boxID = boxID;
    this.lineNum = lineNum;
    this.pageNum = pageNum;
    this.x = new Number(x);
    this.y = new Number(y);
    this.w = new Number(w);
    this.h = new Number(h);
    this.rect = {};
    this.dragging = 0;
    this.handleGroup1;
    this.handleGroup2;
    this.handle = new Array();
    this.label = {};
    this.repeatFront;
    this.repeatEnd;
    this.dalSegnoText;
    this.dalSegnoSign;
    this.codaEnd;
    this.codaFront;
    this.selected = false;
    this.svg;
    var self = this;
    this.toJSON = function() {
        return {
            boxID:this.boxID,
            line: this.lineNum,
            page: this.pageNum,
            x:this.x,
            y:this.y,
            w:this.w,
            h:this.h
        };
    }
    this.showRepeatFront = function() {
        self.repeatFront = self.svg.image('/static/symbols/frontRepeat.svg', self.x, self.y, self.h, self.h);
    }
    this.showRepeatEnd = function() {
        var xPos = Number(self.x) + Number(self.w) - Number(self.h);
        self.repeatEnd = self.svg.image('/static/symbols/endRepeat.svg', xPos, self.y, self.h, self.h);
    }

    this.showDalSegnoText = function() {
        var bb = self.rect.getBBox();
        self.dalSegnoText = self.svg.text(bb.x + bb.width, bb.y, 'D.S.');
        self.dalSegnoText.attr({
            'font-size': 100,
            'fill': 'red'
        });
    }

    this.showDalSegnoSign = function() {
        var size = Number(self.h)/2;
        self.dalSegnoSign = self.svg.image('/static/symbols/dalSegno.svg', self.x, Number(self.y) - size, size, size);
    }

    this.showCodaEnd = function() {
        var size = Number(self.h)/2;
        var xPos = Number(self.x) + Number(self.w) - size;
        self.codaEnd = self.svg.image('/static/symbols/coda.svg', xPos, Number(self.y) - size, size, size);
    }
    this.showCodaFront = function() {
        var bb = self.rect.getBBox();
        self.codaFront = self.svg.text(bb.x, bb.y, 'Coda');
        self.codaFront.attr({
            'font-size':100,
            'fill':'red'
        });
        // var size = Number(self.h)/2;
        // self.codaFront = self.svg.image('/symbols/coda.svg', self.x, Number(self.y) - size, size, size);
    }
    this.move1 = function (dx, dy, x, y, evt) {
        var cursorpt = getCursorPt(evt.clientX, evt.clientY);
        var thisX = new Number(self.rect.attr("x"));
        var thisY = new Number(self.rect.attr("y"));
        var height = new Number(self.rect.attr("height"));
        var width = new Number(self.rect.attr("width"));
        height = height + thisY - cursorpt.y;
        width = width + thisX - cursorpt.x;
        self.rect.attr({
            x: cursorpt.x,
            y: cursorpt.y,
            height: height,
            width: width
        });
        self.handle[0].attr({
            cx: cursorpt.x,
            cy: cursorpt.y
        });
        self.label.attr({
            x: cursorpt.x,
            y: cursorpt.y
        });
    }
    this.move2 = function (dx, dy, x, y, evt) {
        var cursorpt = getCursorPt(evt.clientX, evt.clientY);
        var thisX = new Number(self.rect.attr("x"));
        var thisY = new Number(self.rect.attr("y"));
        var height = new Number(self.rect.attr("height"));
        var width = new Number(self.rect.attr("width"));
        height = cursorpt.y - thisY;
        width = cursorpt.x - thisX;
        self.rect.attr({
            height: height,
            width: width
        });
        self.handle[1].attr({
            cx: cursorpt.x,
            cy: cursorpt.y
        });
    }
    this.show = function (svg, clickHandle) {
        this.svg = svg;
        this.rect = svg.rect(self.x, self.y, self.w, self.h);
        this.rect.click(clickHandle);
        this.rect.data("index", self.index);
        var bb = this.rect.getBBox();
        this.label = svg.text(bb.x, bb.y, new String(self.index));
        this.label.attr({
            'font-size':100
        });
        if(self.selected) {
            self.handle[0] = svg.circle(bb.x, bb.y, 20).attr({ class: 'handler' });
            self.handle[1] = svg.circle(bb.x + bb.width, bb.y + bb.height, 20).attr({ class: 'handler' });
            self.handle[0].drag(self.move1, null, self.stop);
            self.handle[1].drag(self.move2, null, self.stop);
        }
        
    }
    this.stop = function () {
        var x = self.rect.attr("x");
        var y = self.rect.attr("y");
        var width = self.rect.attr("width");
        var height = self.rect.attr("height");
        self.x = x;
        self.y = y;
        self.w = width;
        self.h = height;
    }
}