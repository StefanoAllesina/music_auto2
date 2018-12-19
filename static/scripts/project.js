function Project(svg, projectName, boxes, numPages) {
    this.svg = svg;
    this.currentPage = 0;
    this.boxes = boxes;
    this.currentBoxes = [];
    this.selectedBox = -1;
    var self = this;
    this.editMode = '';
    this.numPages = numPages;
    this.projectName = projectName;
    this.repeats = [];
    this.dalSegnos = [];
    this.projectFlowDisplay = new ProjectFlowDisplay();
    window.onkeyup = function(e) {
        var key = e.keyCode ? e.keyCode : e.which;
        if (key == 8 && self.selectedBox != -1) {
            if(self.boxes[self.selectedBox].selected) {
                self.boxes.splice(self.selectedBox, 1);
                for (var i = 0; i < self.boxes.length; i++) {
                    self.boxes[i].index = i;
                }
                self.selectedBox = -1;
                self.showPage(self.currentPage);
            }
        }
    }
    this.getIndexForBoxID = function(boxID) {
        var box = self.currentBoxes.find(function (item) { return item.boxID == boxID; });
        if(box) {
            return box.index;
        } else {
            return null;
        }
    }
    this.getCurrentPageData = function() {
        var data = {
            repeats:[],
            dalSegnos:[]
        };
        for(var i in self.repeats) {
            if(self.currentBoxes.find(function(item) { return item.boxID == self.repeats[i].start || item.boxID == self.repeats[i].end; })) {
                data.repeats.push(self.repeats[i]);
            }
        }
        for(var i in self.dalSegnos) {
            var start = self.dalSegnos[i].start;
            var end = self.dalSegnos[i].end;
            var jumpFrom = self.dalSegnos[i].jumpFrom;
            var jumpTo = self.dalSegnos[i].jumpTo;
            if(self.currentBoxes.find(function(item) { return item.boxID == start || item.boxID == end || item.boxID == jumpFrom || item.boxID == jumpTo; })) {
                data.dalSegnos.push(self.dalSegnos[i]);
            }
        }
        return data;
    }
    this.showBoxes = function (handler) {
        self.currentBoxes = self.boxes.filter(function (item) { return item.pageNum == self.currentPage; });
        for (var i in self.currentBoxes) {
            var box = self.currentBoxes[i];
            box.show(self.svg, self.clickBox);
            if(!box.selected) {
                for (var j in self.repeats) {
                    if (self.repeats[j].start == self.currentBoxes[i].boxID) {
                        self.currentBoxes[i].showRepeatFront();
                    }
                    if(self.repeats[j].end == self.currentBoxes[i].boxID) {
                        self.currentBoxes[i].showRepeatEnd();
                    }
                }
                for (var j in self.dalSegnos) {
                    if (self.dalSegnos[j].start == self.currentBoxes[i].boxID) {
                        self.currentBoxes[i].showDalSegnoSign();
                    }
                    if (self.dalSegnos[j].end == self.currentBoxes[i].boxID) {
                        self.currentBoxes[i].showDalSegnoText();
                    }
                    if (self.dalSegnos[j].jumpFrom != -1 && self.dalSegnos[j].jumpFrom == self.currentBoxes[i].boxID) {
                        self.currentBoxes[i].showCodaEnd();
                    }
                    if (self.dalSegnos[j].jumpTo != -1 && self.dalSegnos[j].jumpTo == self.currentBoxes[i].boxID) {
                        self.currentBoxes[i].showCodaFront();
                    }
                }
            }
        }
    }
    this.showPage = function(number) {
        self.currentPage = number;
        self.svg.clear();
        self.svg.image(`${self.projectName}/pages/${self.currentPage}`);
        self.showBoxes();
        self.projectFlowDisplay.update(self);
    }
    this.clickBox = function (evt) {
        var index = this.data("index");
        var box = self.boxes[index];
        if(self.editMode == 'split') {
            splitBox(this, evt);
            self.showPage(self.currentPage);
            dismissAlert();
            $("#toolbar").find(".nav-link").removeClass("active");
            $("#toolbar").find(".nav-link").removeClass("disabled");
            self.editMode = '';
        } else if(self.editMode == 'repeat') {
            if(clickIsAtFrontOfBox(box, evt)) {
                box.showRepeatFront();
                self.repeats.push({start:box.boxID});
                showAlert("<strong>Add Repeat</strong> Click for the end of the repeat");
                self.editMode = 'repeat2';
            } else if(clickIsAtEndOfBox(box,evt)) {
                showAlert('<strong>Add Repeat</strong> You can\'t add opening to end of line');
            } else {
                var newBox = splitBox(this, evt);
                self.repeats.push({ start: newBox.boxID });
                self.showPage(self.currentPage);
                showAlert("<strong>Add Repeat</strong> Click for the end of the repeat");
                self.editMode = 'repeat2';
            }
        } else if(self.editMode == 'repeat2') {
            if(clickIsAtFrontOfBox(box, evt)) {
                showAlert('<strong>Add Repeat</strong> You can\'t add closing repeat to the start of a line');
            } else if(clickIsAtEndOfBox(box,evt)) {
                box.showRepeatEnd();
                self.repeats[self.repeats.length-1].end = box.boxID;
                dismissAlert();
                self.projectFlowDisplay.update(self);
                self.editMode = '';
                $("#toolbar").find(".nav-link").removeClass("active");
                $("#toolbar").find(".nav-link").removeClass("disabled");                
            } else {
                splitBox(this,evt);
                self.repeats[self.repeats.length-1].end = box.boxID;
                self.showPage(self.currentPage);
                dismissAlert();
                self.editMode = '';
                $("#toolbar").find(".nav-link").removeClass("active");
                $("#toolbar").find(".nav-link").removeClass("disabled");                
            }
        } else if(self.editMode == 'dsC') {
            if(clickIsAtFrontOfBox(box, evt)) {
                showAlert('<strong>Add D.S. Al Coda</strong> You can\'t have Dal Segno text at beginning of box');
            } else if(clickIsAtEndOfBox(box, evt)) {
                box.showDalSegnoText();
                self.dalSegnos.push({end:box.boxID});
                showAlert('<strong>Add D.S. Al Coda</strong> Select the D.S. Sign (jump back to point)');
                self.editMode = 'dsC2';
            } else {
                splitBox(this, evt);
                self.dalSegnos.push({ end: box.boxID });
                self.showPage(self.currentPage);
                showAlert("<strong>Add D.S. Al Coda</strong> Select the D.S. Sign (jump back to point)");
                self.editMode = 'dsC2';
            }
        } else if(self.editMode == 'dsC2') {
            if(clickIsAtFrontOfBox(box, evt)) {
                box.showDalSegnoSign();
                self.dalSegnos[self.dalSegnos.length-1].start = box.boxID;
                showAlert('<strong>Add D.S. Al Coda</strong> Select the Coda Sign');
                self.editMode = 'dsC3';
            } else if(clickIsAtEndOfBox(box,evt)) {
                showAlert('<strong>Add D.S. Al Coda</strong> You can\'t jump back to the end of a box');
            } else {
                var newBox = splitBox(this, evt);
                self.dalSegnos[self.dalSegnos.length-1].start = newBox.boxID;
                self.showPage(self.currentPage);
                showAlert("<strong>Add D.S. Al Coda</strong> Select the Coda Sign");
                self.editMode = 'dsC3';
            }
        } else if(self.editMode == 'dsC3') {
            if(clickIsAtFrontOfBox(box,evt)) {
                showAlert('<strong>D.S. Al Coda</strong> You can\' jump to coda from beginning of box (select end of previous)');
            } else if(clickIsAtEndOfBox(box,evt)) {
                box.showCodaEnd();
                self.dalSegnos[self.dalSegnos.length-1].jumpFrom = box.boxID;
                showAlert('<strong>Add D.S. Al Coda</strong> Select Coda (where the coda music is)');
                self.editMode = 'dsC4';
            } else {
                splitBox(this, evt);
                self.dalSegnos[self.dalSegnos.length-1].jumpFrom = box.boxID;
                self.showPage(self.currentPage);
                showAlert('<strong>Add D.S. Al Coda</strong> Select Coda (where the coda music is)');
                self.editMode = 'dsC4';
            }
        } else if(self.editMode == 'dsC4') {
            if(clickIsAtFrontOfBox(box,evt)) {
                box.showCodaFront();
                self.dalSegnos[self.dalSegnos.length-1].jumpTo = box.boxID;
                dismissAlert();
                self.projectFlowDisplay.update(self);
                self.editMode == '';
                $("#toolbar").find(".nav-link").removeClass("active");
                $("#toolbar").find(".nav-link").removeClass("disabled");
            } else if(clickIsAtEndOfBox(box,evt)) {
                showAlert('<strong>Add D.S. Al Coda</strong> Coda music can\'t begin at the end of a box');
            } else {
                var newBox = splitBox(this, evt);
                self.dalSegnos[self.dalSegnos.length - 1].jumpTo = newBox.boxID;
                self.showPage(self.currentPage);
                dismissAlert();
                self.editMode = '';
                $("#toolbar").find(".nav-link").removeClass("active");
                $("#toolbar").find(".nav-link").removeClass("disabled");
            }
        } else {
            self.unselectBox();
            box.selected = true;
            self.selectedBox = index;
            self.showPage(self.currentPage);
        }
        // if (self.selectedBox == index && self.boxes[self.selectedBox].selected == true) {
            
        // } else {


        // }
        
        
        
    }
    this.getFinalBoxes = function() {
        var repeatArray = [];
        for(var i in self.repeats) {
            for(var j in self.boxes) {
                if(self.boxes[j].boxID == self.repeats[i].start) {
                    repeatArray = [];
                    while(self.boxes[j].boxID != self.repeats[i].end) {
                        repeatArray.push(self.boxes[j]);
                        j++;
                    }
                    repeatArray.push(self.boxes[j]);
                    self.boxes.splice(j+1, 0, ...repeatArray);
                    break;
                }
            }
        }
        return self.boxes;
    }
    this.unselectBox = function() {
        if (self.selectedBox != -1) {
            self.boxes[self.selectedBox].selected = false;
            self.selectedBox = -1;
            self.showPage(self.currentPage);
        }
    }
    function clickIsAtFrontOfBox(box, evt) {
        var point = getCursorPt(evt.clientX, evt.clientY);
        if(Math.abs(point.x - box.x) < 50) {
            return true;
        }
        return false;
    }
    function clickIsAtEndOfBox(box, evt) {
        var point = getCursorPt(evt.clientX, evt.clientY);
        if(Math.abs(point.x - (box.x + box.w)) < 50) {
            return true;
        }
        return false;
    }
    function splitBox(rect, evt) {
        debugger;
        var index = rect.data("index");
      //  var index = self.boxes.map(function (e) { return e.boxID; }).indexOf(boxID);
        var box = self.boxes[index];
        console.log(box);
        var point = getCursorPt(evt.clientX, evt.clientY);
        var oldWidth = point.x - box.x;
        var newWidth = box.w - oldWidth;
        var newBox = new Box(index, self.boxes.length, box.pageNum, box.lineNum, point.x, box.y, newWidth, box.h);
        for(var i in self.repeats) {
            if(self.repeats[i].end == box.boxID) {
                self.repeats[i].end = newBox.boxID;
            }
        }
        box.w = oldWidth;
        self.boxes.splice(Number(index)+1, 0, newBox);
        for(var i = 0; i < self.boxes.length; i++) {
            self.boxes[i].index = i;
        }
        return newBox;
    }

}