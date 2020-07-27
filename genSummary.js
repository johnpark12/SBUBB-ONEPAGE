// After some thought, I think that the best approach is to make everything "onclick", because otherwise we run into issues with rate limiting.
// Since we're segmenting the sections out, this section should only contain scripts to build out the page based on JSON returned from scraping.js.

window.onload = () => {
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
    h.classList.add("title");
    reportContainer.appendChild(h);
    //Report Menu
    let contents = document.createElement("div");
    contents.classList.add("reportMenu");
    reportContainer.appendChild(contents);
    //courseListView
    let courseView = document.createElement("ul");
    courseView.classList.add("courseListView");
    courseView.classList.add("column");
    contents.appendChild(courseView);
    //availableListView
    let availableView = document.createElement("ul");
    availableView.classList.add("availableView");
    availableView.classList.add("column");
    contents.appendChild(availableView);
    //detailsView
    let detailsView = document.createElement("ul");
    detailsView.classList.add("detailsView");
    detailsView.classList.add("column");
    contents.appendChild(detailsView);
    //Adding generated HTML to document.body
    document.body.appendChild(background);


    // Building out the course presentation
    // Adding a button to each 
    courseAndGrades()
    .then(pCourseList=>{
        //Adding items to the courselist
        for (let pCourse of pCourseList){
            let item = document.createElement("li");
            item.id = pCourse.id;
            item.classList.add("course")
            item.appendChild(document.createTextNode(pCourse.title));
            // Nesting another <ul> so that attributes can be added in onclick.
            item.onclick = showAvailable;
            document.querySelector(".courseListView").appendChild(item)
        }
    });
} 

// These collection of functions is designed to build out the info bit by bit, dynamically.
// I should possibly look to the old callback use of "next" as a model as to how to asynchronously build out the interface.
// Or a recursive function for stacking promises.
// This could be moved into a seperate JS loop that works in the background.
// For now, I'm just going to stick with designing onclick stuff.
function showGrades(){
    
}

// Honestly, I'm not sure if showAvailable is even necessary.
// We can already access resources directly, so it would be far, far better to just show a placeholder then check to see if those resources exist.
function showAvailable(e){
    let courseID = e.target.id;
    console.log(e.target);
    document.querySelectorAll(".course").forEach(d=>{
        if(d===e.target){
            d.classList.add("active")
        }
        else{
            d.classList.remove("active")
        }
    });
    for (let avail in whatIsAvailable){

    }
    whatisAvailable(courseID)
    .then((d)=>{
        for (let contentTitle of d){
            let item = document.createElement("li");
            item.id = courseID;
            item.appendChild(document.createTextNode(contentTitle));
            item.onclick = () => {console.log("to be implemented")}
            document.querySelector(".availableView").appendChild(item)
        }
    })
}

// General purpose function to generate part of the interface for the most common interaction - clicking and getting a list.
let clicked = (e) => {
    let courseID = e.target.id;
    document.querySelectorAll(".course").forEach(d=>{
        if(d===e.target){
            d.classList.add("active")
        }
        else{
            d.classList.remove("active")
        }
    });
    whatisAvailable(courseID)
    .then((d)=>{
        // First must check if grades exist.
        for (let contentTitle of d){
            let item = document.createElement("li");
            item.id = courseID;
            item.appendChild(document.createTextNode(contentTitle));
            item.onclick = () => {console.log("to be implemented")}
            document.querySelector(".availableView").appendChild(item)
        }
    })
}

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