function PageSwitcher(numPages, switchFunc) {
    this.switchFunc = switchFunc;
    this.numPages = numPages;
    this.currentPage = -1;
    var self = this;
    var html = '<li id="previous" class="page-item"><a class="page-link" href="#">Previous</a></li>';
    for (var i = 0; i < this.numPages; i++) {
        html += `<li class="page-item" id="page-${i}"><a class="page-link" href="#">${i+1}</a></li>`;
    }
    html += '<li id="next" class="page-item"><a class="page-link" href="#">Next</a></li>';
    document.getElementById('pageSwitcher').innerHTML = html;
    $("#pageSwitcher").on('click', '.page-link', function(event) {
        var button = $(event.target).text();
        var number = self.currentPage;
        if(button == 'Previous') {
            number -= 1;
        } else if(button == 'Next') {
            number += 1;
        } else {
            number = new Number(button)-1;
        }
        self.setPage(number);
        self.switchFunc(number);
    });
    this.setPage = function(page) {
        if(page != this.currentPage) {
            $("#pageSwitcher").find(`#page-${this.currentPage}`).removeClass("active");
            $("#pageSwitcher").find(`#page-${page}`).addClass("active");
            $("#pageSwitcher").find("#previous").removeClass("disabled");
            $("#pageSwitcher").find("#next").removeClass("disabled");
            if(page == 0) {
                $("#pageSwitcher").find("#previous").addClass("disabled");
            } else if(page == self.numPages-1) {
                $("#pageSwitcher").find("#next").addClass("disabled");
            }
            this.currentPage = page;
        }
    };
}

function addProjectsToNavBar(projectNameArray) {
    var list = '';
    for (var i = 0; i < projectNameArray.length; i++) {
        list += `<a class="dropdown-item project" href = "#" >${projectNameArray[i]}</a >`;
    }
    document.getElementById('projects').innerHTML = list;
}

function showAlert(withText) {
    var html = `<div class="alert alert-warning alert-dismissible fade show" role="alert">
    ${withText}
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
    </button>
    </div>`;
    document.getElementById('alertArea').innerHTML = html;
    $("#alertArea").find(".alert").alert();
}

function dismissAlert() {
    $("#alertArea").find(".alert").alert('close');
}

function ProjectFlowDisplay() {
    this.element = document.getElementById("ProjectFlowDisplay");
    var self = this;
    this.update = function(project) {
        var html = '<div class="list-group">';
        var currentData = project.getCurrentPageData();
        for(var i in currentData.repeats) {
            var start = project.getIndexForBoxID(currentData.repeats[i].start);
            var end = project.getIndexForBoxID(currentData.repeats[i].end);
            if(start && end) {
                html += `<a class="list-group-item list-group-item-action list-group-item-info" href="#"><strong>Repeat</strong> Start: ${start} End: ${end}</a>`;
            }
            
        }
        for(var i in currentData.dalSegnos) {
            var start = project.getIndexForBoxID(currentData.dalSegnos[i].start);
            var end = project.getIndexForBoxID(currentData.dalSegnos[i].end);
            var codaSign = project.getIndexForBoxID(currentData.dalSegnos[i].jumpFrom);
            var coda = project.getIndexForBoxID(currentData.dalSegnos[i].jumpTo);
            if(start && end && codaSign && coda) {
                html += `<a class="list-group-item list-group-item-action list-group-item-success" href="#"><strong>D.S.</strong>D.S. Sign: ${start} D.S. Text: ${end} Coda Sign: ${codaSign} Coda: ${coda}</a>`;
            }
        }
        html += '</div>';
        self.element.innerHTML = html;
    };
}