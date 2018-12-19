function getCursorPt(x, y) {
    var svg = document.getElementsByTagName("svg")[0];
    svg = document.querySelector('svg');
    var pt = svg.createSVGPoint();
    pt.x = x;
    pt.y = y;
    var cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
    return cursorpt;
}
