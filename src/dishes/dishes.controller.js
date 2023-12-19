const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//To validate: dish exists, has a valid name, has a valid image_url, has a valid price, has a valid description

function dishExists(req, res, next) {
    const {dishId} = req.params
    res.locals.dishId = dishId
    const foundDish = dishes.find(dish => dish.id === dishId)
    if(foundDish) {
      res.locals.dish = foundDish;
      return next()
    }
    next({status: 404, message: `Dish id not found: ${dishId}`})
}

function namePropertyIsValid(req, res, next) {
    const { data = null } = req.body;
    res.locals.new = data;
    const dishName = res.locals.new.name;
    if (dishName && dishName !== "") {
      return next()
   }
    next({status: 400, message: "Dish must include a name"});
};

function pricePropertyIsValid(req, res, next) {
    const dishPrice = res.locals.new.price
    if(Number(dishPrice) > 0 && typeof dishPrice === "number") {
        return next()
    } 
    if(!dishPrice) {
        return next({status: 400, message: "Dish must include a price"})
    } else {
    next({status: 400, message: "Dish must have a price that is an integer greater than 0"})
    }
}

function descriptionPropertyIsValid(req, res, next) {
    const dishDescription = res.locals.new.description
    if(dishDescription && dishDescription !== "") {
        return next()
    }
    next({status: 400, message: "Dish must include a description"})
}

function imgPropertyIsValid(req, res, next) {
    const dishImage = res.locals.new.image_url
    if(dishImage && dishImage !== "") {
        return next()
    }
    next({status: 400, message: "Dish must include a image_url"})
}

function dishIdMatches(req, res, next) {
    const paramId = res.locals.dishId;
    const { id = null } = res.locals.new;
    if (paramId != id && id) {
       return next({
          status: 400,
          message: `Dish id does not match route id. Dish: ${id}, Route: ${paramId}`,
       });
    }
  next()
 };

function create(req, res) {
    const newDish = res.locals.new
    newDish.id = nextId()
    dishes.push(newDish)
    res.status(201).json({data: newDish})
}

function read(req, res) {
    res.status(200).json({data: res.locals.dish})
}

function update(req, res) {
    const dish = res.locals.dish
    const {data: {name, price, description, image_url} = {}} = req.body
    //update the dish
    dish.name = name
    dish.price = price
    dish.description = description
    dish.image_url = image_url
    //return updated dish
    res.status(200).json({data: dish})
}

function list(req, res) {
    res.status(200).json({data: dishes})
}

module.exports = {
    create: [
        namePropertyIsValid,
        pricePropertyIsValid,
        descriptionPropertyIsValid,
        imgPropertyIsValid,
        create,
    ],
    list,
    read: [
        dishExists,
        read,
    ],
    update: [
        dishExists,
        namePropertyIsValid,
        pricePropertyIsValid,
        descriptionPropertyIsValid,
        imgPropertyIsValid,
        pricePropertyIsValid,
        dishIdMatches,
        update,
    ],
}