const axios = require("axios");
const cheerio = require("cheerio");
const db = require("../models")

module.exports = app => {
  app.get("/scrape", (req, response, next) => {
    axios.get("https://old.reddit.com/r/worldnews/").then(res => {
      let $ = cheerio.load(res.data);
      let count = 0;
      $('p.title').each((i, element) => {
        let count = i;
        let result = {};
        result.title = $(element).children('a').text().trim();
        result.link = $(element).children('a').attr("href");
        if (result.title && result.link) {
          db.Article.create(result).then(dbArticle => {
            count++;
          }).catch(err => {
            console.log(err);
          });
        };
      });
      response.redirect('/');
    }).catch(err => {
      console.log(err);
      res.send("Error: Unable to obtain new articles");
    });
  });

  app.get("/", (req, res) => {
    db.Article.find({})
      .then(function (dbArticle) {
        // If we were able to successfully find Articles, send them back to the client
        const retrievedArticles = dbArticle;
        let hbsObject;
        hbsObject = {
          articles: dbArticle
        };
        res.render("index", hbsObject);
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

  app.get("/saved", (req, res) => {
    db.Article.find({ isSaved: true })
      .then(function (retrievedArticles) {
        // If we were able to successfully find Articles, send them back to the client
        let hbsObject;
        hbsObject = {
          articles: retrievedArticles
        };
        res.render("saved", hbsObject);
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

  // Route for getting all Articles from the db
  app.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
      .then(function (dbArticle) {
        // If we were able to successfully find Articles, send them back to the client
        res.json(dbArticle);
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

  app.put("/save/:id", function (req, res) {
    db.Article.findOneAndUpdate({ _id: req.params.id }, { isSaved: true })
      .then(function (data) {
        // If we were able to successfully find Articles, send them back to the client
        res.json(data);
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });;
  });

  app.put("/remove/:id", function (req, res) {
    db.Article.findOneAndUpdate({ _id: req.params.id }, { isSaved: false })
      .then(function (data) {
        // If we were able to successfully find Articles, send them back to the client
        res.json(data)
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

  // Route for grabbing a specific Article by id, populate it with it's note
  app.get("/articles/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.find({ _id: req.params.id })
      // ..and populate all of the notes associated with it
      .populate({
        path: 'note',
        model: 'Note'
      })
      .then(function (dbArticle) {
        // If we were able to successfully find an Article with the given id, send it back to the client
        res.json(dbArticle);
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

  // Route for saving/updating an Article's associated Note
  app.post("/note/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
      .then(function (dbNote) {
        // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
        // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
        // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { $push: { note: dbNote._id } }, { new: true });
      })
      .then(function (dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

  app.delete("/note/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.findByIdAndRemove({ _id: req.params.id })
      .then(function (dbNote) {

        return db.Article.findOneAndUpdate({ note: req.params.id }, { $pullAll: [{ note: req.params.id }] });
      })
      .then(function (dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });
}