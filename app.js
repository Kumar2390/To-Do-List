//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
mongoose.connect("mongodb+srv://admin-sonali:Test123@cluster0.mrssu.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  const day = date.getDate();

  Item.find(function(err, foundItems) {
    if (!err) {

      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function(err) {
          if (!err) {
            console.log("Successfully inserted default items into the item DB");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {
          listTitle: day,
          newListItems: foundItems
        });
      }
    }
  });

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else{
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items});
      }
    }
  });
});

app.post("/", function(req, res) {

  const item = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: item
  });

  if(listName === date.getDate()){
    newItem.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      if(!err){
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === date.getDate()){
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        res.redirect("/");
      }
    });
  }else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
