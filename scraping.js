// Only very basic caching established. Future development would include async development of data.
// Holding a cache is only really relevent in the context of the scraper.
// Should be handled transparently by the scraping file.
// In the future, I'll set it so that it grabs if an hour has passed.
courseCache = {};

// Must update all the functions to work with single courses. So that they can be used as part of an "onclick" in the genSummary.js
// All functions should return a promise which resolves to a JSON of the requests for course details.

//This maps available item names to the functions that are meant to grab the information. Will be implemented in the future.
let canProcess = {
    "Grades": grabGrades,
    "Announcements": grabGeneral,
    "Syllabus": grabGeneral,
    "Documents": grabGeneral,
    "Lecture Notes": grabGeneral,
    "Assignments": grabGeneral,
    "Review": grabGeneral,
    "Solutions": grabGeneral,
}

// Everything dynamically loaded can be accessed with this helper function. Returns a promise.
function grabWhenLoaded(url, targetSelector, loadedSelector, isEmpty = () => false){
    var newFrame = document.createElement("iframe");
    newFrame.src = url;
    let frameID = "a" + Math.floor(Math.random() * 1000000000) //The 'a' is arbitrary
    newFrame.id = frameID;
    document.body.appendChild(newFrame);
    return new Promise((resolve, reject) => {
        let maxIterations = 0;
        var checkLoaded = setInterval(()=>{
            try{
                maxIterations++;
                // FCF to "flag" if no parsable data is available.
                if (isEmpty(newFrame.contentWindow.document.body)){
                    reject("none");
                }
                // As much as I'd like to use something else, there's something about querySelector that makes this work
                // What's even more unusual is that when manipulating the DOM on a browser, I get inconsistent results selecting the iframe even though I'm sure it's already attached on the page.
                // I suspect it's something about querySelector that forces the browser to refresh it's DOM model.
                if (newFrame.contentWindow.document.body.querySelector(loadedSelector)){
                // if (document.getElementById(frameID).contentWindow.document.body.querySelectorAll(loadedSelector) > 0){
                    // clearInterval(checkLoaded);
                    // var checkAllLoaded = setInterval(function(){ 
                    setTimeout(function(){ 
                        try{
                            // Determine if number of elements is the same as with targetSelector
                            if (newFrame.contentWindow.document.body.querySelectorAll(loadedSelector).length > 0
                            && newFrame.contentWindow.document.body.querySelectorAll(loadedSelector).length === newFrame.contentWindow.document.body.querySelectorAll(targetSelector).length){
                                console.log("Loaded:")
                                console.log(newFrame.contentWindow.document.body.querySelectorAll(loadedSelector));
                                console.log("Target:")
                                console.log(newFrame.contentWindow.document.body.querySelectorAll(targetSelector));
                                let frameBody = newFrame.contentWindow.document.body
                                let frameTarget = newFrame.contentWindow.document.body.querySelectorAll(targetSelector)
                                // clearInterval(checkAllLoaded);
                                clearInterval(checkLoaded);
                                //Now that we're done, removing frame.
                                document.body.removeChild(document.getElementById(frameID));
                                resolve({
                                    "body": frameBody,
                                    "target": frameTarget
                                });    
                            }
                        }
                        catch (e){
                            // console.log(e)
                        }
                    }, 1000);
                }
                if (maxIterations > 120){
                    console.log("timed out");
                    clearInterval(checkLoaded);
                    reject("timeout");
                }
            }
            catch (e){
                // console.log(e)
            }
        }, 2000)
    })
}

// Yet another scraper - this one works through navigation.
// It compares the link that it must go to with the location that the iframe is currently on.
// The process can be split into two - Navigation then loading.
// Would also require me to 

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

// Grab the courses and their IDs. Parse the information.
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
                            title = title.slice(1,);
                        }
                        else if (title[0] == "."){
                            parsedCourse["status"] = "active";
                            title = title.slice(1,);
                        }
                        else {
                            parsedCourse["status"] = "finished";
                            title = title;
                        }
                        // Extracting date and course number
                        courseNumberPattern = /[A-Za-z]* [0-9]{3}\.[RLT]*[0-9]{2}/g;
                        parsedCourse["courseNumber"] = title.match(courseNumberPattern)[0];
                        parsedCourse["courseTitle"] = title.match(/ [a-zA-Z].* -/g)[0].slice(1,-2)
                        // parsedCourse["courseSemester"] = title.match(/ [a-zA-Z].* -/g)[0].slice(1,-2)
                        parsedCourse["courseDate"] = title.match(/ [a-zA-Z]{3,6} [0-9]{4}/g)[0].slice(1,)
                        parsedCourse["courseLink"] = course.querySelector("a").href;

                        parsedCourse["id"] = course.querySelector("a").href.match(/id=(.*)&url/)[1];
                        parsedCourseList.push(parsedCourse);

                        // Pushing into the cache.
                        let courseKey = parsedCourse["id"]
                        courseCache[courseKey] = {}
                        courseCache[courseKey]["courseNumber"] = parsedCourse["courseNumber"]
                        courseCache[courseKey]["courseTitle"] = parsedCourse["courseTitle"]
                        courseCache[courseKey]["courseDate"] = parsedCourse["courseDate"]
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
        let checkEmpty = (body) => {
            // Find the total row
            // let allCalculatedRows = Array.from(body.querySelectorAll(".calculatedRow"))
            // let fRow = allCalculatedRows.filter(calcRow => calcRow.querySelector(".gradable").textContent.trim().split("\n")[0]
            // let totalGrade = fRow.querySelector(".grade").textContent.trim();
            // return totalGrade === "-";
            return false;
        }
        grabWhenLoaded(url, ".graded_item_row", ".graded_item_row span.grade", checkEmpty)
        .then(({target})=>{
            let pGradeList = [];
            target.forEach((grade)=>{
                let pGrade = {};
                pGrade["gradedItem"] = grade.querySelector("div.cell.gradable").textContent.trim().split("\n")[0];
                pGrade["link"] = grade.querySelectorAll("a").length > 0? grade.querySelector("a").href: null
                pGrade["gotScore"] = grade.querySelector("span.grade").textContent;
                pGrade["maxScore"] = grade.querySelector("span.pointsPossible").textContent;
                pGradeList.push(pGrade);
            })
            console.log(pGradeList)
            resolve(pGradeList);
        })
        .catch((e)=>{
            console.log(e);
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
// This should also have caching.
function whatisAvailable(courseID){
    let url = `https://blackboard.stonybrook.edu/webapps/blackboard/execute/announcement?method=search&context=course_entry&course_id=${courseID}`;
    if ("Available" in courseCache[courseID]){
        return new Promise((resolve,reject)=>{resolve(courseCache[courseID]["Available"])});
    }
    let availableLoader = new Promise((resolve, reject)=>{
        grabWhenLoaded(url, "li[id^=paletteItem]>a", "li[id^=paletteItem]>a")
        .then(({body, target})=>{
            let pTopicList = [];
            target.forEach(d=>{
                // Loading into cache
                // courseCache[courseID][avail.title + "Link"] = d.href;
                pTopic = {};
                pTopic["title"] = d.textContent;
                pTopic["link"] = d.href;
                pTopicList.push(pTopic)
            });
            courseCache[courseID]["Available"] = pTopicList;
            resolve(pTopicList);
        });    
    });
    courseCache[courseID]["Available"] = availableLoader;
    return availableLoader;
}

//Announcements function
function grabAnnouncementsLoad(courseID, label, url){
    return new Promise((resolve, reject)=>{
        grabWhenLoaded(url, "ul.announcementList>li", "div.details > div", (body)=>body.querySelectorAll(".noItems").length > 0)
        .then(({target}) => {
            let pAnnouncementList = [];
            target.forEach(announcement=>{
                let pAnnounce = {};
                pAnnounce.title = announcement.querySelector("h3").textContent;
                console.log(pAnnounce.title)
                pAnnounce.date = announcement.querySelector(".details span").textContent
                //Want to preserve only the linebreaks from description. Everything else is extraneous.
                pAnnounce.description = []
                announcement.querySelectorAll(".vtbegenerated p").forEach(line => {
                    pAnnounce.description.push(line.textContent)
                })
                pAnnouncementList.push(pAnnounce);
            });    
            resolve(pAnnouncementList)
        });    
    })
}

// Grab the assignments
// TODO: Doesn't link to assignment submission properly.
function grabAssignments (courseID, url){
    return new Promise((resolve, reject)=>{
        grabWhenLoaded(url, ".contentList>li", ".contentList>li>div>h3", (body)=>body.querySelectorAll(".noItems").length > 0)
        .then(({target}) => {
            let pAssList = [];
            target.forEach(assignment => {
                let pAss = {};
                pAss.title = assignment.querySelector("span[style]").textContent;
                pAss.link = assignment.querySelector("a").href;
                //Want to preserve only the linebreaks from description. Everything else is extraneous.
                pAss.description = []
                assignment.querySelectorAll(".vtbegenerated p").forEach(line => {
                    pAss.description.push(line.textContent)
                })
                pAss.attachments = []
                // Since this is going to be presented as HTML anyway, might as well just have an array of processed HTML
                assignment.querySelectorAll(".attachments").forEach((attachment)=>{
                    pAtt = {};
                    pAtt.link = attachment.querySelector("a").href;
                    pAtt.text = attachment.querySelector("a").textContent;
                    pAss.attachments.push(pAtt);
                });
                pAssList.push(pAss);
            });
            resolve(pAssList);
        })
    });
}

// Grab the documents.
function grabDocuments(courseID, url){
    return new Promise((resolve, reject)=>{
        grabWhenLoaded(url, ".contentList>li", ".contentList>li>div>h3", (body)=>body.querySelectorAll(".noItems").length > 0)
        .then(({target}) => {
            let pDocumentList = [];
            target.forEach(document => {
                let pDocument = {};
                pDocument.title = document.querySelector("span[style]").textContent;
                //Want to preserve only the linebreaks from description. Everything else is extraneous.
                pDocument.description = []
                document.querySelectorAll(".vtbegenerated p").forEach(line => {
                    pDocument.description.push(line.textContent)
                })
                pDocument.attachments = []
                // Since this is going to be presented as HTML anyway, might as well just have an array of processed HTML
                document.querySelectorAll(".attachments").forEach((attachment)=>{
                    pAtt = {};
                    pAtt.link = attachment.querySelector("a").href;
                    pAtt.text = attachment.querySelector("a").textContent;
                    pAss.attachments.push(pAtt);
                });
                pAssList.push(pAss);
            });
            resolve(pAssList);
        })
    });
}


// Grab the Syallabus.
function grabGeneral(courseID, label, url){
    console.log(`${courseID} ${label} ${url}`)
    // If something already exists in the cache, return it.
    if (label in courseCache[courseID]){
        // Clearing - make sure that there's only ever a few promises running in the entire app. 
        // Not sure if this is what I should be doing, but I want to make things as transparent as possible so I'm returning an instantaneous promise.
        return new Promise((resolve,reject)=>{resolve(courseCache[courseID][label])});
    }
    let loadingLabel = new Promise((resolve, reject)=>{
        let targetSelector = ".contentList>li";
        let loadingSelector = ".contentList>li>div>h3"
        let titleSelector = "span[style]";
        // Though I could spin this off into a seperate object, this is only necessary in one case so I don't see a need to.
        if (label === "Announcements"){
            targetSelector = "ul.announcementList>li"
            loadingSelector = "div.details > div"
            titleSelector = "h3";
        }
        grabWhenLoaded(url, targetSelector, loadingSelector, (body)=>body.querySelectorAll(".noItems").length > 0)
        .then(({target}) => {
            let pItemList = [];
            target.forEach(item => {
                let pItem = {};
                pItem.title = item.querySelector(titleSelector).textContent;
                pItem.link = item.querySelectorAll("a").length > 0? item.querySelector("a").href: null;
                // Should definitely work on dates at a later date.
                pItem.date = item.querySelectorAll(".details span") > 0 ? item.querySelector(".details span").textContent : null;
                //Want to preserve only the linebreaks from description. Everything else is extraneous.
                pItem.description = []
                item.querySelectorAll(".vtbegenerated p").forEach(line => {
                    pItem.description.push(line.textContent)
                })
                pItem.attachments = []
                item.querySelectorAll(".attachments").forEach((attachment)=>{
                    let pAtt = {};
                    pAtt.link = attachment.querySelector("a").href;
                    pAtt.text = attachment.querySelector("a").textContent;
                    pItem.attachments.push(pAtt);
                });
                pItemList.push(pItem);
            });
            // Pushing into the cache.
            courseCache[courseID][label] = pItemList;
            console.log(courseCache);
            resolve(pItemList);
        })
    });
    courseCache[courseID][label] = loadingLabel;
    return loadingLabel
}