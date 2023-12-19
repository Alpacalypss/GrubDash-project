const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//Validate order exists, deliverTo, mobileNumber, dishes, dishes.quantity, status

/************Middleware validation functions************/

//Finding existing dish by id or returning an error
function orderExists(req, res, next) {
    const {orderId} = req.params;
    res.locals.orderId = orderId;
    const foundOrder = orders.find((order) => order.id === orderId);
    if(foundOrder) {
        //assigning res.locals property to foundOrder if it exists
        res.locals.order = foundOrder
        next()
    }; 
    next({status: 404, message: `Order id not found: ${orderId}`});
};

function deliverToPropertyIsValid(req, res, next) {
    //Setting destructured data value to request body
    const {data = null} = req.body;
    //Assigning res.locals property to be request body/data
    res.locals.newOrder = data;
    //Setting variable to deliverTo property
    const orderDeliverTo = res.locals.newOrder.deliverTo;
    //Valid conditionals
    if(orderDeliverTo && orderDeliverTo !== "") {
        next()
    };
    next({status: 400, message: "Order must include a deliverTo"})
};

function mobileNumberPropertyIsValid(req, res, next) {
    //Setting variable to mobileNumber property
    const orderMobileNumber = res.locals.newOrder.mobileNumber;
    //Valid conditionals
    if(orderMobileNumber && orderMobileNumber !== "") {
        next()
    };
    next({status: 400, message: "Order must include a mobileNumber"});
};

function dishesPropertyIsValid(req, res, next) {
    //Setting variable to dishes property
    const orderDishes = res.locals.newOrder.dishes;
    //Valid conditionals
    if(orderDishes && Array.isArray(orderDishes) && orderDishes !== "") {
        next()
    };
    if(!orderDishes) {
        next({status: 400, message: "Order must include a dish"});
    } 
    next({status: 400, message: "Order must include at least one dish"})
};

function dishesQuantityPropertyIsValid(req, res, next) {
    //Setting variable to dishes property
    const orderDishes = res.locals.newOrder.dishes
    //Repeated error case to account for cases where dishes array does not existing or is empty (needed for .forEach function to validate properly) 
    if(!orderDishes || orderDishes.length === 0) {
      next({status: 400, message: "Order must include a dish"})
    }
    //Iterating through orderDishes array
    orderDishes.forEach((dish) => {
        //Setting variable to the quantity property of each dish in the given array
        const dishQuantity = dish.quantity;
        //Invalidation conditionals to return error cases
        if(!dishQuantity || typeof dishQuantity !== "number" || dishQuantity <= 0) {
            next({status: 400, message: `Dish ${orderDishes.indexOf(dish)} must have a quantity that is an integer greater than 0`})
        }   
   });
  next();
};

function orderIdMatches(req, res, next) {
    //Setting variable from parameter Id
    const orderId = res.locals.orderId;
    //Setting variable to id property
    const id  = res.locals.newOrder.id;
    //Invalidation conditionals to return error cases
    if (orderId !== id && id) {
       return next({
          status: 400,
          message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
       });
    }
  next();
 };

function statusPropertyIsValid(req, res, next) {
    //Setting status variable
    const orderStatus = res.locals.newOrder.status;
    //Valid conditionals
    if(orderStatus && orderStatus !== "" && orderStatus !== "invalid") {
        next();
    }
    next({status: 400, message: "Order must have a status of pending, preparing, out-for-delivery, delivered"});
};

//Edge case where order status is "delivered", used for update validation
function deliveredOrderValidation(req, res, next) {
    if(res.locals.order.status === "delivered") {
        return next({status: 400, message: "A delivered order cannot be changed"});
    }
    next();
};

//Edge case where order status is "pending", used for delete validation
function pendingOrderDeleteValidation(req, res, next) {
    if(res.locals.order.status === "pending") {
        next();
    }
  next({status: 400, message: "An order cannot be deleted unless it is pending"});
}

function create(req, res) {
    const newOrder = res.locals.newOrder
    //Adding id property to newOrder
    newOrder.id = nextId()
    orders.push(newOrder)
    res.status(201).json({data: newOrder})
};

function read(req, res) {
    res.status(200).json({data: res.locals.order})
};

function update(req, res) {
    const order = res.locals.order;
    const {data: {deliverTo, mobileNumber, status, dishes}} = req.body;
    //update the order
    order.deliverTo = deliverTo
    order.mobileNumber = mobileNumber
    order.status = status
    order.dishes = dishes
    order.dishes.quantity = dishes.quantity
    //return updated dish
    res.status(200).json({data: order});
};

function destroy(req, res) {
    //Setting variable to the index of the order
    const index = orders.indexOf(res.locals.order);
    //Splicing away the order upon validation
    orders.splice(index, 1);
    res.sendStatus(204);
};

function list(req, res) {
    res.status(200).json({data: orders});
};

module.exports = {
    create: [
        deliverToPropertyIsValid,
        mobileNumberPropertyIsValid,
        dishesPropertyIsValid,
        dishesQuantityPropertyIsValid,
        create,
    ],
    read: [
        orderExists,
        read,
    ],
    update: [
        orderExists,
        deliverToPropertyIsValid,
        mobileNumberPropertyIsValid,
        dishesPropertyIsValid,
        dishesQuantityPropertyIsValid,
        statusPropertyIsValid,
        deliveredOrderValidation,
        orderIdMatches,
        update,
    ],
    delete: [
        orderExists,
        pendingOrderDeleteValidation,
        destroy,
    ],
    list
}