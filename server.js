const express = require("express");
const mongoose = require("mongoose");
const handlebars = require("express-handlebars");
const db = require("./models");

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static("public"));
app.engine("handlebars", handlebars({ defaultLayout: "main"}));
app.set("view engine", "handlebars");

require("./routes/routes")(app);
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });


app.listen(PORT, () => {
    console.log(`==> Server started at http://localhost:${PORT} <==`)
});