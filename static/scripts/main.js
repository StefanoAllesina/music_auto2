
$(document).ready(function() {
    var project;
    var name = projectName;
    console.log(name);
    var url = `/edit/${name}/boxes`;
    $.ajax({
        url: url,
        method: 'GET',
        success: function (data) {
            console.log(data);
            var boxData = data.boxes;
            var repeats = data.repeats;
            var dalSegnos = data.dalSegnos;
            var boxes = [];
            var numPages = boxData[boxData.length - 1].page + 1;
            for (var i in boxData) {
                // if(boxData[i].page > numPages) {
                //     numPages = boxData[i].page;
                // }
                var box = new Box(i, boxData[i].boxID, boxData[i].page, boxData[i].line, boxData[i].x, boxData[i].y, boxData[i].w, boxData[i].h);
                boxes.push(box);
            }
            var s = Snap("#something");
            project = new Project(s, name, boxes, numPages);
            project.repeats = repeats;
            project.dalSegnos = dalSegnos;
            var pageSwitcher = new PageSwitcher(project.numPages, project.showPage);
            project.showPage(0);
            pageSwitcher.setPage(0);
        }
    });
    /* $.ajax({
        method: 'GET',
        success: function(data) {
            addProjectsToNavBar(data);
        },
        error: function(error) {
            console.log(error);
            window.alert(error);
        },
        url: '/projects'
    }); */
    $("#projects").on('click', '.project', function(event) {
        var name = $(event.target).text();
        console.log(name);
        var url = `/${name}/boxes`;
        $.ajax({
            url: url,
            method: 'GET',
            success: function(data) {
                var boxData = data.boxes;
                var repeats = data.repeats;
                var dalSegnos = data.dalSegnos;
                var boxes = [];
                var numPages = boxData[boxData.length-1].page;
                for(var i in boxData) {
                    // if(boxData[i].page > numPages) {
                    //     numPages = boxData[i].page;
                    // }
                    var box = new Box(i, boxData[i].box_id, boxData[i].page, boxData[i].line, boxData[i].x, boxData[i].y, boxData[i].w, boxData[i].h);
                    boxes.push(box);
                }
                var s = Snap("#something");
                project = new Project(s, name, boxes, numPages);
                project.repeats = repeats;
                project.dalSegnos = dalSegnos;
                var pageSwitcher = new PageSwitcher(project.numPages, project.showPage);
                project.showPage(1);
                pageSwitcher.setPage(1);
            }
        });
    });
    $("#doneButton").click(function() {
        var finalBoxes = [];
        for(var i in project.boxes) {
            finalBoxes.push(project.boxes[i].toJSON());
        }
        var data = {
            boxes:finalBoxes,
            repeats:project.repeats,
            dalSegnos:project.dalSegnos
        };
        var url = `/edit/${project.projectName}/boxes`;
        $.ajax({
            url: url,
            method: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            success: function(data) {
                console.log(data);
            }
        });
    });
    $("#compileButton").click(function () {
        var finalBoxes = [];
        for (var i in project.boxes) {
            finalBoxes.push(project.boxes[i].toJSON());
        }
        var data = {
            boxes: finalBoxes,
            repeats: project.repeats,
            dalSegnos: project.dalSegnos
        };
        console.log(data);
        var url = `/edit/${project.projectName}/compile`;
        $.ajax({
            url: url,
            method: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            success: function (data) {
                window.location = data;
             //   window.open('/temp/pdf_out.pdf', '_blank');
                console.log(data);
            }
        });
    });
    $("#toolbar").on('click', '.nav-link', function(event) {
        var item = $(event.target).text();
        if($(event.target).hasClass("disabled")) {
            return;
        }
        console.log(item);
        $("#toolbar").find(".nav-link").removeClass("active");
        $("#toolbar").find(".nav-link").addClass("disabled");
        $(event.target).addClass("active");
        if(item == "Add Repeat") {
            showAlert("<strong>Add Repeat</strong> Click to select start of repeat");
            project.editMode = 'repeat';
        } else if(item == "Add Da Capo") {
            showAlert("<strong>Add Da Capo</strong> Click to select beginning");
        } else if(item == "Add D.S. Al Coda") {
            showAlert("<strong>Add D.S. Al Coda</strong> Click where D.S. al Coda is written");
            project.editMode = 'dsC';
        } else if(item == "Split Box") {
            showAlert("<strong>Split Box</strong> Click in box to split");
            project.editMode = 'split';
        } else if(item == "Add Label (without Bookmark)") {

        } else if(item == "Add Label (with Bookmark)") {

        }
        project.unselectBox();
    });
    function split(evt) {
        var index = this.data("index");
        var box = self.boxes[index];
        var index = rect.data("index");
        //  var index = self.boxes.map(function (e) { return e.boxID; }).indexOf(boxID);
        var box = self.boxes[index];
        console.log(box);
        var point = getCursorPt(evt.clientX, evt.clientY);
        var oldWidth = point.x - box.x;
        var newWidth = box.w - oldWidth;
        var newBox = new Box(index, '', box.pageNum, box.lineNum, point.x, box.y, newWidth, box.h);
        box.w = oldWidth;
        self.boxes.splice(index + 1, 0, newBox);
        for (var i = 0; i < self.boxes.length; i++) {
            self.boxes[i].index = i;
        }
        self.showPage(self.currentPage);
    }
    function addRepeat() {
        

    }
    function clickBox(evt, box) {
        box.selected = true;
        if (self.selectedBox != -1) {
            self.boxes[self.selectedBox].selected = false;
        }
        self.selectedBox = index;
        self.showPage(self.currentPage);
    }
    function finishEdit() {
        project.clickBox = clickBox;
    }
});
