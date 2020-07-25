// After some thought, I think that the best approach is to make everything "onclick", because otherwise we run into issues with rate limiting.
// Since we're segmenting the sections out, this section should only contain scripts to build out the page based on JSON returned from scraping.js.

// Injecting HTML using JS
// Building the background
let background = document.createElement("div");
background.id = "mainContainer";
// Smaller report container
let reportContainer = document.createElement("div");
reportContainer.id = "reportContainer";
background.appendChild(reportContainer);
//Header
let h = document.createElement("h1");
var t = document.createTextNode("Summary");
h.appendChild(t);
reportContainer.appendChild(h);
//Contents
let contents = document.createElement("ul");
contents.id = "courseList";
reportContainer.appendChild(contents);
//Adding generated HTML to document.body
document.body.appendChild(background);

// These collection of functions is designed to build out the info bit by bit, dynamically.
// I should possibly look to the old callback use of "next" as a model as to how to asynchronously build out the interface.
// Or a recursive function for stacking promises.
// For now, I'm just going to stick with designing onclick stuff.
function showGrades(){
    
}

function showAvailable(e){
    let courseID = e.target.id;
    whatisAvailable(courseID)
    .then((d)=>{
        console.log(d);
    })
}

// Building out the course presentation
// Adding a button to each 
courseAndGrades()
.then(pCourseList=>{
    //Adding items to the courselist
    for (let pCourse of pCourseList){
        let item = document.createElement("li");
        item.id = pCourse.id;
        item.appendChild(document.createTextNode(pCourse.title));
        // Nesting another <ul> so that attributes can be added in onclick.
        item.onclick = () => alert("testing");
        document.querySelector("#courseList").appendChild(item)
    }
});



//Creating a listener to make itself visible.
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(request);
        if (request.makeVisible){
            document.getElementById("reportContainer").style.visibility = "visible";
        }
});

// // Lets start adding elements onto the Summary page
// const observer = new MutationObserver(() => {
//     var courseList = document.querySelector(".courseListing").querySelectorAll("li");
//     var reportContainer = document.getElementById("reportContainer");
//     var newList = document.createElement("ul");
//     for (var course of courseList){
//         var newItem = document.createElement("li");
//         newItem.innerText=course.textContent;
//         newList.appendChild(newItem);
//     }
//     reportContainer.appendChild(newList);
//     // console.log(courseList);
//     // console.log(courseList[0].querySelector("a").href);
//     var embeddedOpen = document.createElement("iframe");
//     embeddedOpen.src = courseList[0].querySelector("a").href;
//     document.body.appendChild(embeddedOpen);
// });
// observer.observe(document.getElementById("div_4_1"), {"childList": true});