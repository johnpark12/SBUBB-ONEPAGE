// Implementing a caching system. For now, all this stores is a KV of KVs regarding courseIDs.
courseCache = {}

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
    courseAndGrades()
    .then(pCourseList=>{
        //Experiment with deloading
        document.body.innerHTML = "";
        document.body.appendChild(background);

        // Initializing the courseCache
        for (let pCourse of pCourseList){
            courseCache[pCourse.id] = {}
        }
        //Sorting courses according to date.
        let {courseGroup, courseOrder} = sortCourseDates(pCourseList);
        for (let pCourseKey of courseOrder){
            let itemSemester = document.createElement("li");
            let semester = document.createElement("h2");
            semester.appendChild(document.createTextNode(pCourseKey));
            itemSemester.appendChild(semester);
            let semCourses = document.createElement("ul")
            itemSemester.appendChild(semCourses);
            for (let course of courseGroup[pCourseKey]){
                let item = document.createElement("li");
                item.id = course.id;
                item.classList.add("course")
                item.appendChild(document.createTextNode(course.courseNumber));
                item.appendChild(document.createTextNode(course.courseTitle));
                item.onclick = showAvailable;
                semCourses.appendChild(item);
            }
            document.querySelector(".courseListView").appendChild(itemSemester);
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

// Given a list of courses, this function sorts the courses into 
function sortCourseDates(courseList){
    function sortDate(date1, date2){
        [date1Sem, date1Year] = date1.split(" ");
        [date2Sem, date2Year] = date2.split(" ");
        if (parseInt(date1Year) < parseInt(date2Year)){
            return 1;
        }
        else if (parseInt(date1Year) > parseInt(date2Year)){
            return -1;
        }
        else {
            let semVal = {
                "Spring": 3,
                "Summer": 2,
                "Fall": 1,
                "Winter": 0
            }
            if (semVal[date1Sem] > semVal[date2Sem]){
                return 1;
            }
            else if (semVal[date1Sem] < semVal[date2Sem]){
                return -1;
            }
            else{
                return 0;
            }
        }
    }
    //First, get a unique list of all course dates and sort. Then use this list to order other courseList.
    let courseOrder = [... new Set(courseList.map(course=>course.courseDate))];
    courseOrder = courseOrder.sort(sortDate);
    //Group courseList according to date
    courseGroup = {};
    courseList.forEach(course=>{
        course.courseDate in courseGroup? courseGroup[course.courseDate].push(course): courseGroup[course.courseDate] = [];
    });
    //Although technically objects preserve order, I'll return both the ordered list as well as the grouped courses for sake of structure awareness.
    return {"courseOrder":courseOrder, 
            "courseGroup":courseGroup};
}

// Honestly, I'm not sure if showAvailable is even necessary.
// We can already access resources directly, so it would be far, far better to just show a placeholder then check to see if those resources exist.
// The initial list should be shown under the header "Checking", then when the results come in we sort into two lists - available and unavailable.
let showAvailable = (e) => {
    let courseID = e.target.id;
    //Changing style
    document.querySelectorAll(".course").forEach(d=>{
        if(d===e.target){
            d.classList.add("active")
        }
        else{
            d.classList.remove("active")
        }
    });
    //Clear out existing available and detail views.
    document.querySelector(".availableView").innerHTML = "";
    document.querySelector(".detailsView").innerHTML = "";

    // for (let avail in whatIsAvailable){
    //     let item = document.createElement("li");
    //     item.id = courseID;
    //     item.classList.add("available")
    //     item.appendChild(document.createTextNode(avail));
    //     item.onclick = clicked;
    //     document.querySelector(".availableView").appendChild(item)
    // }
    whatisAvailable(courseID)
    .then(availableList => {
        // Loading everything into the cache.
        for (let avail of availableList){
            courseCache[courseID][avail.title] = avail.link;
        }
        //Creating list of available
        for (let avail of availableList){
            if (avail.title in canProcess){
                let item = document.createElement("li");
                item.classList.add("available")
                item.appendChild(document.createTextNode(avail.title));
                item.onclick = clicked;
                document.querySelector(".availableView").appendChild(item)    
            }
        }
    })
}

// General purpose function to generate part of the interface for the most common interaction - clicking and getting a list.
let clicked = (e) => {
    let courseID = document.querySelector(".courseListView .active").id;
    let linkTitle = e.target.textContent;
    document.querySelectorAll(".available").forEach(d=>{
        if(d===e.target){
            d.classList.add("active")
        }
        else{
            d.classList.remove("active")
        }
    });
    let selected = canProcess[linkTitle];
    console.log(linkTitle)
    console.log(courseID)
    selected(courseID, courseCache[courseID][linkTitle])
    .then(parsedList=>{
        console.log(parsedList)
        for (let parsed of parsedList){
            console.log(parsed)
            let item = document.createElement("li");
            item.classList.add("parsed")
            //Link
            let link = document.createElement("a");
            link.href = parsed.link;
            item.appendChild(link);
            //Title
            let title = document.createElement("h3");
            title.appendChild(document.createTextNode(parsed.title))
            link.appendChild(title)
            // Description
            let description = document.createElement("p");
            description.appendChild(document.createTextNode(parsed.description))
            link.appendChild(description)

            document.querySelector(".detailsView").appendChild(item)
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