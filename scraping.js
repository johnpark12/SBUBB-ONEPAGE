// Must update all the functions to work with single courses. So that they can be used as part of an "onclick" in the genSummary.js
// All functions should return a promise which resolves to a JSON of the requests for course details.

//This maps available item names to the functions that are meant to grab the information. Will be implemented in the future.
let whatIsAvailable = {
    "assignments": "",
    "documents":"",
    "lectures":"",
    "announcements":"",
}

// Everything dynamically loaded can be accessed with this helper function. Returns a promise.
// Onload works as well through document.onload, but it's too 
function grabWhenLoaded(url, targetSelector, loadedSelector){
    var newFrame = document.createElement("iframe");
    newFrame.src = url;
    document.body.appendChild(newFrame);
    return new Promise((resolve, reject) => {
        let maxIterations = 0;
        var checkLoaded = setInterval(()=>{
            maxIterations++;
            try{
                if (newFrame.contentWindow.document.body.querySelector(loadedSelector)){
                    console.log("loop2");
                    // Determine if number of elements is the same as with targetSelector
                    if (newFrame.contentWindow.document.body.querySelectorAll(loadedSelector).length > 0
                        && newFrame.contentWindow.document.body.querySelectorAll(loadedSelector).length === newFrame.contentWindow.document.body.querySelectorAll(targetSelector).length){
                        clearInterval(checkLoaded);
                        console.log("Loaded:")
                        console.log(newFrame.contentWindow.document.body.querySelectorAll(loadedSelector));
                        console.log("Target:")
                        console.log(newFrame.contentWindow.document.body.querySelectorAll(targetSelector));
                        //Probably should remove iframe here.
                        resolve(newFrame.contentWindow.document.body.querySelectorAll(targetSelector));    
                    }
                }
            }
            catch(e){

            }
            if (maxIterations > 20){
                console.log("timed out");
                clearInterval(checkLoaded);
                reject();
            }
        }, 1000)
    })
}

//Should create a function here that works with onload instead, to deal with certain elements.
//Generally the above function is slightly faster and actually works in more cases, but this one is cleaner.
function grabWhenAllLoaded(url, targetSelector){
    var newFrame = document.createElement("iframe");
    newFrame.src = url;
    document.body.appendChild(newFrame);
    return new Promise((resolve, reject) => {
        newFrame.contentWindow.onload = () => {
            console.log("window loaded");
            console.log(newFrame.contentWindow.document.body.querySelector(targetSelector));
            resolve(newFrame.contentWindow.document.body.querySelector(targetSelector));    
        }
        newFrame.contentWindow.document.onload = () => {
            console.log("document loaded");
            console.log(newFrame.contentWindow.document.body.querySelectorAll(targetSelector));
            resolve(newFrame.contentWindow.document.body.querySelectorAll(targetSelector));    
        }
    })
}

// Grab the courses and their IDs
// Assuming that this function is run on the blackboard homepage.
function courseAndGrades(){
    return new Promise((resolve, reject) =>{
        var checkLoaded = setInterval(()=>{
            if (document.querySelector("#_4_1termCourses_noterm>ul>li>a")){
                // Determine if number of elements is the same as with targetSelector
                if (document.querySelectorAll("#_4_1termCourses_noterm>ul>li>a").length > 0
                    && document.querySelectorAll("#_4_1termCourses_noterm>ul>li>a").length === document.querySelectorAll("#_4_1termCourses_noterm>ul>li").length){
                    clearInterval(checkLoaded);
                    // Now all the courses have been loaded. We can parse and return something
                    let courseList = document.querySelectorAll("#_4_1termCourses_noterm>ul>li")
                    let parsedCourseList = [];
                    for (let course of courseList){
                        let parsedCourse = {}
                        let title = course.querySelector("a").textContent;
                        if (title[0] == "/"){
                            parsedCourse["status"] = "pending";
                            parsedCourse["title"] = title.slice(1,);
                        }
                        else if (title[0] == "."){
                            parsedCourse["status"] = "active";
                            parsedCourse["title"] = title.slice(1,);
                        }
                        else {
                            parsedCourse["status"] = "finished";
                            parsedCourse["title"] = title;
                        }
                        parsedCourse["id"] = course.querySelector("a").href.match(/id=(.*)&url/)[1];
                        parsedCourseList.push(parsedCourse);
                    }
                    resolve(parsedCourseList);
                }
            }
        }, 1000)    
    });
}

// Grab the grades (update with IDs in the future).
function grabGrades(courseID){
    let url = `https://blackboard.stonybrook.edu/webapps/bb-mygrades-bb_bb60/myGrades?course_id=${courseID}&stream_name=mygrades`;
    return new Promise((resolve, reject)=>{
        grabWhenLoaded(url, ".graded_item_row", ".graded_item_row span.grade")
        .then((gradeList)=>{
            let pGradeList = [];
            gradeList.forEach((grade)=>{
                let pGrade = {};
                pGrade["gradedItem"] = grade.querySelector("div.cell.gradable > a").textContent;
                pGrade["gotScore"] = grade.querySelector("span.grade").textContent;
                pGrade["maxScore"] = grade.querySelector("span.pointsPossible").textContent;
                pGradeList.push(pGrade);
            })
            resolve(pGradeList);
        })
        .catch(()=>{
            console.log("Timed out. Assume that no grades exist.");
            reject();
        })
    });
}

// grabWhenLoaded("https://blackboard.stonybrook.edu/webapps/streamViewer/streamViewer?cmd=view&streamName=mygrades&globalNavigation=false", ".stream_item", ".stream_item")
// .then((courseList)=>{
//     let d = courseList[0];
//     let url = "https://blackboard.stonybrook.edu" + d.getAttribute("bb:rhs");
//     console.log("grabbing grades from url " + url);
//     grabWhenLoaded(url, ".graded_item_row", ".graded_item_row span.grade")
//     .then((gradeList)=>{
//         console.log(gradeList);
//         gradeList.forEach((grade)=>{
//             console.log(grade.querySelector("div.cell.gradable > a").textContent);
//             console.log(grade.querySelector("span.grade").textContent);
//         })
//     })
// })

// Check which "items" the course has available. Lectures, Documents, etc.
function whatisAvailable(courseID){
    let url = `https://blackboard.stonybrook.edu/webapps/blackboard/execute/announcement?method=search&context=course_entry&course_id=${courseID}`;
    return new Promise((resolve, reject)=>{
        grabWhenLoaded(url, "li[id^=paletteItem]>a>span", "li[id^=paletteItem]>a>span")
        .then((topicList)=>{
            let pTopicList = [];
            topicList.forEach(d=>{
                pTopicList.push(d.title)
            });
            resolve(pTopicList);
        });    
    });
}

// Grab the Announcements
function grabAnnouncements(courseID){
    let url = `https://blackboard.stonybrook.edu/webapps/blackboard/execute/announcement?method=search&context=course_entry&course_id=${courseID}&handle=announcements_entry&mode=view`
    grabWhenLoaded(url, "ul.announcementList>li", "div.details > div")
    .then((announcementList) => {
        console.log(announcementList);
    });
}

// Grab the assignments
function grabAssignments(courseID){
    let url = `https://blackboard.stonybrook.edu/webapps/blackboard/content/listContent.jsp?course_id=_1205805_1&content_id=_5186605_1&mode=reset`;
    grabWhenLoaded(url, ".contentList>li", ".contentList>li>div>h3")
    .then((assignmentList) => {
        let pAssList = [];
        assignmentList.forEach(assignment => {
            let pAss = {};
            pAss.title = assignment.querySelector("span[style]").textContent;
            pAss.description = assignment.querySelector(".vtbegenerated").textContent;
            pAss.attachments = []
            console.log(pAss);
            assignment.querySelectorAll(".attachments").forEach((attachment)=>{
                pAtt = {};
                pAtt.link = attachment.querySelector("a").href;
                pAtt.text = attachment.querySelector("a").textContent;
                console.log(pAtt);
                pAss.attachments.push(pAtt);
            });
            pAssList.push(pAss);
        });
        console.log(pAssList);
    });
}

`https://blackboard.stonybrook.edu/webapps/blackboard/content/listContent.jsp?course_id=_1205805_1&content_id=${courseID}&mode=reset`

// Grab the documents.