// After some thought, I think that the best approach is to make everything "onclick", because otherwise we run into issues with rate limiting.
// Since we're segmenting the sections out, this section should only contain scripts to build out the page based on JSON returned from scraping.js.
// window.onload = () => {
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

    document.querySelector(".courseListView").appendChild(loader())

    // Building out the course presentation
    courseAndGrades()
    .then(pCourseList=>{
        //Experiment with deloading
        document.body.innerHTML = "";
        document.body.appendChild(background);
        //Removing the loader
        document.querySelector(".courseListView").innerHTML = ""
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
                item.appendChild(document.createTextNode(course.courseNumber + " - " + course.courseTitle));
                item.onclick = showAvailable;
                let extLink = document.createElement("a")
                extLink.href = course["courseLink"];
                let extLinkIcon = document.createElement("img")
                extLinkIcon.src="https://img.icons8.com/material-sharp/20/000000/external-link.png"
                extLink.appendChild(extLinkIcon)
                item.appendChild(extLink)
                semCourses.appendChild(item);
            }
            document.querySelector(".courseListView").appendChild(itemSemester);
        }
    });
// } 

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

    //Adding loader
    document.querySelector(".availableView").appendChild(loader())

    whatisAvailable(courseID)
    .then(availableList => {
        // change only if same active tab
        if (document.querySelector(".courseListView .active").textContent !== e.target.textContent){
            return;
        }
        //Remove loader
        document.querySelector(".availableView").innerHTML = ""
        // Adding Grade viewer (although not all courses will have grades)
        let gHeader = document.createElement("h3")
        gHeader.appendChild(document.createTextNode("View Grades"))
        document.querySelector(".availableView").appendChild(gHeader)
        let item = document.createElement("li");
        item.classList.add("available")
        item.appendChild(document.createTextNode("Grades"));
        //Adding external link
        let extLink = document.createElement("a")
        extLink.href = `https://blackboard.stonybrook.edu/webapps/bb-mygrades-bb_bb60/myGrades?course_id=${courseID}&stream_name=mygrades`
        let extLinkIcon = document.createElement("img")
        extLinkIcon.src="https://img.icons8.com/material-sharp/20/000000/external-link.png"
        extLink.appendChild(extLinkIcon)
        item.appendChild(extLink)

        item.onclick = clicked;
        document.querySelector(".availableView").appendChild(item)
        
        // Header for availableView column
        let aHeader = document.createElement("h3")
        aHeader.appendChild(document.createTextNode("Menu Items"))
        document.querySelector(".availableView").appendChild(aHeader)
        //Creating list of available
        for (let avail of availableList){
            if (avail.title in canProcess){
                let item = document.createElement("li");
                item.classList.add("available")
                item.appendChild(document.createTextNode(avail.title));
                item.onclick = clicked;
                document.querySelector(".availableView").appendChild(item)    
                // Adding ext link
                let extLink = document.createElement("a")
                extLink.href = avail.link
                let extLinkIcon = document.createElement("img")
                extLinkIcon.src="https://img.icons8.com/material-sharp/20/000000/external-link.png"
                extLink.appendChild(extLinkIcon)
                item.appendChild(extLink)
            }
        }
    })
}

// General purpose function to generate part of the interface for the most common interaction - clicking and getting a list.
let clicked = (e) => {
    //Clear details for new details
    document.querySelector(".detailsView").innerHTML = ""

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
    //Placing loader
    document.querySelector(".detailsView").appendChild(loader())

    let selected = canProcess[linkTitle];
    const labelLink = e.target.querySelector("a").href;

    selected(courseID, linkTitle, labelLink)
    .then(parsedList=>{
        // Replace ONLY IF the returned content corresponds to active tab. This is because the user might have navigated to a different tab.
        if (document.querySelector(".availableView .active").textContent !== linkTitle){
            return;
        }
        //Remove loader
        document.querySelector(".detailsView").innerHTML = ""

        console.log(parsedList)
        if (linkTitle === "Grades"){
            for (let parsed of parsedList){
                let item = document.createElement("li");
                item.classList.add("parsed")
                //Title
                let title = document.createElement("h3");
                title.appendChild(document.createTextNode(parsed.gradedItem))
                item.appendChild(title)
                //Link
                if (parsed.link){
                    let extLink = document.createElement("a")
                    extLink.href = parsed.link
                    let extLinkIcon = document.createElement("img")
                    extLinkIcon.src="https://img.icons8.com/material-sharp/20/000000/external-link.png"
                    extLink.appendChild(extLinkIcon)
                    item.appendChild(extLink)
                }
                // Grade View
                item.appendChild(document.createTextNode(parsed.gotScore))
                item.appendChild(document.createTextNode(parsed.maxScore))
    
                document.querySelector(".detailsView").appendChild(item)
            }
        }
        else{
            for (let parsed of parsedList){
                console.log(parsed)
                let item = document.createElement("li");
                item.classList.add("parsed")
                //Title
                let title = document.createElement("h3");
                title.appendChild(document.createTextNode(parsed.title))
                item.appendChild(title)
                //Link
                let extLink = document.createElement("a")
                extLink.href = parsed.link
                let extLinkIcon = document.createElement("img")
                extLinkIcon.src="https://img.icons8.com/material-sharp/20/000000/external-link.png"
                extLink.appendChild(extLinkIcon)
                item.appendChild(extLink)
                // TODO: Attachments
                // Description
                parsed.description.forEach(line=>{
                    item.appendChild(document.createTextNode(line))
                })
                // let description = document.createElement("p");
                // description.appendChild()
    
                document.querySelector(".detailsView").appendChild(item)
            }   
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

function loader(){
    let spinnerContainer = document.createElement("div")
    spinnerContainer.classList.add("spinnerContainer")
    let spinner = document.createElement("div")
    spinnerContainer.appendChild(spinner)
    spinner.classList.add("lds-roller")
    spinner.appendChild(document.createElement("div"))
    spinner.appendChild(document.createElement("div"))
    spinner.appendChild(document.createElement("div"))
    spinner.appendChild(document.createElement("div"))
    spinner.appendChild(document.createElement("div"))
    spinner.appendChild(document.createElement("div"))
    spinner.appendChild(document.createElement("div"))
    spinner.appendChild(document.createElement("div"))
    return spinner
}
