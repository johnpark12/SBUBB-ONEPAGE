// MUST SPLIT INTO TWO SECTIONS:
// One that does that scraping and parsing and
// One that does the delivery to the page.

// Injecting HTML into the page.
let page = chrome.runtime.getURL("summary.html");
fetch(page)
.then(response => response.text())
.then(data=>{
    var doc = new DOMParser().parseFromString(data, "text/html");
    var reportContainer = doc.getElementById("reportContainer");
    document.body.appendChild(reportContainer);
})

//Creating a listener to make itself visible.
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(request);
        if (request.makeVisible){
            document.getElementById("reportContainer").style.visibility = "visible";
        }
});

// Lets start adding elements onto the Summary page
const observer = new MutationObserver(() => {
    var courseList = document.querySelector(".courseListing").querySelectorAll("li");
    var reportContainer = document.getElementById("reportContainer");
    var newList = document.createElement("ul");
    for (var course of courseList){
        var newItem = document.createElement("li");
        newItem.innerText=course.textContent;
        newList.appendChild(newItem);
    }
    reportContainer.appendChild(newList);
    console.log(courseList);
    console.log(courseList[0].querySelector("a").href);
    var embeddedOpen = document.createElement("iframe");
    embeddedOpen.src = courseList[0].querySelector("a").href;
    document.body.appendChild(embeddedOpen);
});
observer.observe(document.getElementById("div_4_1"), {"childList": true});

var grades = document.createElement("iframe");
grades.src = "https://blackboard.stonybrook.edu/webapps/streamViewer/streamViewer?cmd=view&streamName=mygrades&globalNavigation=false"
grades.id = "grades_iframe";
document.body.appendChild(grades)
// Making promises to make sure that we're looking at the right spot.
new Promise((resolve, reject) => {
    var checkGrades = setInterval(()=>{
        console.log("first");
        console.log(grades);
        if (grades.contentWindow.document.body.querySelector(".stream_item")){
            clearInterval(checkGrades);
            console.log(grades.contentWindow.document.body.querySelectorAll(".stream_item"))
            var grades_iframe = grades.contentWindow.document.body.querySelector("#mybbCanvas");
            console.log(grades_iframe);
            resolve(grades_iframe);
        }
    }, 1000)
})
// .then((firstFrame) => {
//     console.log("second one");
//     console.log(firstFrame);
//     var grades_iframe = grades.contentWindow.document.body.querySelector("#mybbCanvas");
//     console.log(grades_iframe)
//     var checkGradeList = setInterval(()=>{
//         console.log("second");
//         console.log(firstFrame);
//         var courseList = firstFrame.contentWindow.document.body.querySelectorAll(".stream_item")
//         if (firstFrame.contentWindow.document.body.querySelectorAll(".stream_item").length > 0) {
//             console.log(grades.querySelectorAll("stream_item"));
//         }
//         clearInterval(checkGradeList);
//     }, 1000);
// })

// Seperate functions for parsing each page. This is going to be a bitch.

// Functions with callbacks so that elements are added to the main page as they are loaded.

