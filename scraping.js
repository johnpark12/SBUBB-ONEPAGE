// Must update all the functions to work with single courses. So that they can be used as part of an "onclick" in the genSummary.js
// All functions should return a promise which resolves to a JSON of the requests for course details.

// Everything dynamically loaded can be accessed with this helper function. Returns a promise.
function grabWhenLoaded(url, targetSelector, loadedSelector){
    var newFrame = document.createElement("iframe");
    newFrame.src = url;
    document.body.appendChild(newFrame);
    return new Promise((resolve, reject) => {
        var checkLoaded = setInterval(()=>{
            if (newFrame.contentWindow.document.body.querySelector(loadedSelector)){
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
        }, 1000)
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
        });    
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

// Check whether

// Check which "items" the course has available. Lectures, Documents, etc.
function whatisAvailable(courseID){
    let url = `https://blackboard.stonybrook.edu/webapps/blackboard/execute/announcement?method=search&context=course_entry&course_id=${courseID}`;
    return new Promise((resolve, reject)=>{
        grabWhenLoaded(url, "li[id^=paletteItem]>a>span", "li[id^=paletteItem]>a>span")
        .then((topicList)=>{
            let pTopicList = [];
            topicList.forEach(d=>pTopicList.push(d.title));
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


// Grab the documents.