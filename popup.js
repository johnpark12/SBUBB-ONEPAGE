document.addEventListener('DOMContentLoaded', function() {
    var generateReportButton = document.getElementById('generateReport');
    generateReportButton.addEventListener('click', function() {
        console.log("sending message");
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {makeVisible: true});
          });          
    }, false);
});