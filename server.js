var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var app = express();
var axios = require("axios");
var cheerio = require("cheerio");
var PORT = 3000;

// Require all models
var db = require("./models");

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/scrapeREArticles", { useNewUrlParser: true });

// Main route (simple Hello World Message)
app.get("/", function(req, res) {
  res.send("Hello world");
});

// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function(req, res) {
  axios.get("https://magazine.realtor/daily-news").then(function(response) {

    var $ = cheerio.load(response.data);

    $(".views-row").each(function(i, element) {

      var result = $(element).children();
      var title = result.find(".layout-slat__content").find(".layout-slat__header").find(".node__title").text();
      var link = result.find(".layout-slat__content").find(".layout-slat__header").find(".node__title").find("a").attr("href");
      var paragraph = result.find(".layout-slat__content").find(".layout-slat__main-content").find("p").text();

      console.log(title);
      console.log(link);
      console.log(paragraph);

      if (title && link && paragraph) {
        db.scrapedData.insert({
          title: title,
          link: link,
          paragraph: paragraph
        },
        function(err, inserted) {
          if (err) {
            console.log(err);
          }
          else {
            console.log(inserted);
          }
        });
      }
    });
  });
  res.send("Scrape Complete");
});

// Retrieve data from the db
app.get("/all", function(req, res) {
  // Find all results from the scrapedData collection in the db
  db.scrapedData.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, send the data to the browser as json
    else {
      res.json(found);
    }
  });
});

//Routes

// Route for retrieving all Comments from the db
app.get("/comments", function(req, res) {
  db.Comment.find({})
    .then(function(dbComment) {
      res.json(dbComment);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for retrieving all Articles from the db
app.get("/articles", function(req, res) {
  // Find all Articles
  db.Article.find({})
    .then(function(dbArticle) {
      // If all Articles are successfully found, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurs, send the error back to the client
      res.json(err);
    });
});

// Route for saving a new Comment to the db and associating it with an Article
app.post("/submit", function(req, res) {
  // Create a new Comment in the db
  db.Comment.create(req.body)
    .then(function(dbComment) {
      // If a Comment was created successfully, find one Article and push the new Articles' _id to the Articles' `comments` array
      // { new: true } tells the query that we want it to return the updated Article -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({},
        { $push: { comments: dbComment._id } }, { new: true });
    })
    .then(function(dbArticle) {
      // If the Article was updated successfully, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
});

// Route to get all Articles and populate them with their comments
app.get("/populatedarticle", function(req, res) {
  // Find all Articles
  db.Article.find({})
    // Specify that we want to populate the retrieved articles with any associated comments
    .populate("comments")
    .then(function(dbArticle) {
      // If able to successfully find and associate all Articles and Comments, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});





