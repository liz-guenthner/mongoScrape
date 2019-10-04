$(document).ready(function() {

    // create variable for where articles live
    var articleRenderContainer = $(".article-container");

    // onclick for scrape articles
    $(".scrape-new").click(function() {
        
        console.log("button clicked!")
        //empty old articles rendered
        articleRenderContainer.empty();

        $.get("/scrape").then(function(result) {
            console.log("hello world");
        }); 
    });

    $(".clear").click(function() {
        articleRenderContainer.empty();
    });
});