const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//Validate order exists, deliverTo, mobileNumber, dishes, dishes.quantity, status

function orderExists(req, res, next) {
    const {orderId} = req.params;
    res.locals.orderId = orderId;
    const foundOrder = orders.find((order) => order.id === orderId);
    if(foundOrder) {
        res.locals.order = foundOrder
        next()
    }; 
    next({status: 404, message: `Order id not found: ${orderId}`});
};

function deliverToPropertyIsValid(req, res, next) {
    const {data = null} = req.body;
    res.locals.newOrder = data;
    const orderDeliverTo = res.locals.newOrder.deliverTo;
    if(orderDeliverTo && orderDeliverTo !== "") {
        next()
    };
    next({status: 400, message: "Order must include a deliverTo"})
};

function mobileNumberPropertyIsValid(req, res, next) {
    const orderMobileNumber = res.locals.newOrder.mobileNumber;
    if(orderMobileNumber && orderMobileNumber !== "") {
        next()
    };
    next({status: 400, message: "Order must include a mobileNumber"});
};

function dishesPropertyIsValid(req, res, next) {
    const orderDishes = res.locals.newOrder.dishes;
    if(orderDishes && Array.isArray(orderDishes) && orderDishes !== "") {
        next()
    };
    if(!orderDishes) {
        next({status: 400, message: "Order must include a dish"});
    } 
    next({status: 400, message: "Order must include at least one dish"})
};

function dishesQuantityPropertyIsValid(req, res, next) {
    const orderDishes = res.locals.newOrder.dishes
    if(!orderDishes || orderDishes.length === 0) {
      next({status: 400, message: "Order must include a dish"})
    }
    orderDishes.forEach((dish) => {
        const dishQuantity = dish.quantity;
        if(!dishQuantity || typeof dishQuantity !== "number" || dishQuantity <= 0) {
            next({status: 400, message: `Dish ${orderDishes.indexOf(dish)} must have a quantity that is an integer greater than 0`})
        }   
   });
  next();
};

function orderIdMatches(req, res, next) {
    const orderId = res.locals.orderId;
    const id  = res.locals.newOrder.id;
    if (orderId !== id && id) {
       return next({
          status: 400,
          message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
       });
    }
  next();
 };

function statusPropertyIsValid(req, res, next) {
    const orderStatus = res.locals.newOrder.status;
    if(orderStatus && orderStatus !== "" && orderStatus !== "invalid") {
        next();
    }
    next({status: 400, message: "Order must have a status of pending, preparing, out-for-delivery, delivered"});
};

function deliveredOrderValidation(req, res, next) {
    if(res.locals.order.status === "delivered") {
        return next({status: 400, message: "A delivered order cannot be changed"});
    }
    next();
};

function pendingOrderDeleteValidation(req, res, next) {
    if(res.locals.order.status === "pending") {
        next();
    }
  next({status: 400, message: "An order cannot be deleted unless it is pending"});
}

function create(req, res) {
    const newOrder = res.locals.newOrder
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
    const index = orders.indexOf(res.locals.order);
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