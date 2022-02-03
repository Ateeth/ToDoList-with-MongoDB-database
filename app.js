//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash") ;

const day = date.getDate();
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//connect to database todolistDB
mongoose.connect("mongodb+srv://Ateeth:Ateeth%402001@cluster0.39fvd.mongodb.net/todolistDB", {
  useNewUrlParser: true
});

//schema for todolist items
const itemsSchema = {
  name: String
};

//create a mongoose model for item itemsSchema
const Item = mongoose.model("Item", itemsSchema);

//create 3 default items
const item1 = new Item({
  name: "Welcome to the ToDoList"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

//array having the default items
const defaultItems = [item1, item2, item3];

//schema for default custom list items
const listSchema = {
  name: String,

  //list of item documents associated with it
  //the item docs r of type itemsSchema
  //establish relationship
  items: [itemsSchema]
}

//create a new model for custom listTitle
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    //if found items length is 0 add the default items
    if (foundItems.length === 0) {
      //add the default items array to the model
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items");
        }
      });
      //redirect to root route after adding default items
      res.redirect("/");
    } else {
      res.render("list", {
        listDate: day,
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});
//get route for custom lists names
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  //we will get one object back
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (err) {
      console.log(err);
    }

    //create a new list
    else if (!foundList) {
      //create item for custom list
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      list.save();
      res.redirect("/" + customListName);
    }

    //show an existing list
    else {
      res.render("list", {
        listDate: day,
        listTitle: foundList.name,
        newListItems: foundList.items
      });
    }
  });


});
app.post("/", function(req, res) {
  const listName = req.body.list;
  const itemName = req.body.newItem;

  //create a new item of Item model
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    //save it to items collection
    item.save();

    //redirect to home apge after posting the new item
    res.redirect("/");

  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      //push in custom list item schema i.e List
      foundList.items.push(item);

      //add the record to the collection lists
      foundList.save();

      //redirect to the same custom list page
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.deleteOne({
      _id: checkedItemId
    }, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted item")
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/" + listName);
      }
    });
  }
  /* ANOTHER METHOD
    Item.findByIdAndRemove(checkedItemId , function(err){
      if(err){
        console.log(err) ;
      }else{
        console.log("Successfully deleted item")
          res.redirect("/") ;
      }
    }) ;
  */

});



app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started Successfully");
});
