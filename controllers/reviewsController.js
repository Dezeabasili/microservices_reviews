const Review = require("./../models/reviews");
// const Hotel = require("./../models/hotels");
// const User = require("./../models/users");
// const Booking = require("./../models/bookings")
const createError = require("./../utils/error");
const amqplib = require('amqplib');
const rabbitMQ_connection = require('../utils/producer')

const exchangeName = "topic_logs";
const routing_key = []
let channel_reviews_producer;
const queue_name = "reviews_queue"

const sendTask = async () => {
  const connection = await rabbitMQ_connection()
  channel_reviews_producer = await connection.createChannel();
  await channel_reviews_producer.assertExchange(exchangeName, 'topic', {durable: false});
  console.log("Connected to rabbitMQ reviewServices")
}

sendTask();


let channel_reviews_consumer;
const binding_keys = ['hotels.hotelsReviews.deleteMany', 'auth.changeName.updateMany']

const consumeTask = async () => {
  const connection = await rabbitMQ_connection();
  channel_reviews_consumer = await connection.createChannel();
  await channel_reviews_consumer.assertExchange(exchangeName, 'topic', {durable: false});
  await channel_reviews_consumer.assertQueue(queue_name, {durable: false});

  channel_reviews_consumer.prefetch(1);
  console.log("Waiting for messages in reviews_queue");

  binding_keys.forEach((key) => {
    channel_reviews_consumer.bindQueue(queue_name, exchangeName, key);
  });

  channel_reviews_consumer.consume(queue_name, async msg => {
    const product = JSON.parse(msg.content.toString());
    
    if (msg.fields.routingKey == 'hotels.hotelsReviews.deleteMany') {
      await Review.deleteMany(product);
      console.log(`routing key: ${msg.fields.routingKey}`);
      console.log("Received product: ", JSON.stringify(product));
      // console.log("Received product: ", JSON.stringify(msg));
    }
    
    if (msg.fields.routingKey == 'auth.changeName.updateMany') {
      await Review.updateMany({customer: product.ref_number}, {$set: {customer_name: product.name}} );
      console.log(`routing key: ${msg.fields.routingKey}`);
      console.log("Received product: ", JSON.stringify(product));
      // console.log("Received product: ", JSON.stringify(msg));
    }
      
      channel_reviews_consumer.ack(msg)
  }, {noAck: false})
}

consumeTask();


// create review
const createReview = async (req, res, next) => {
  try {
    const newReview = await Review.create(req.body);

    res.status(201).json({
      status: "success",
      data: newReview,
    });
  } catch (err) {
    next(err);
  }
};



// get all reviews
const getAllReviews = async (req, res, next) => {
  try {
    // This first two lines of code will modify the filter to get all reviews for
    // a particular hotel. If filterObject is empty, then we get all the reviews for all the hotels
    let filterObject = {};
    if (req.params.hotel_id) filterObject.hotel = req.params.hotel_id;
    if (req.query.review_id) filterObject._id = req.query.review_id;
    // if (req.body.email) {
    //   const user = await User.findOne({ email: req.body.email });
    //   if (!user)
    //     return next(createError("fail", 404, "This user does not exist"));
    //   filterObject.customer = user._id;
    // }

    const reviews = await Review.find(filterObject)
    res.status(200).json({
      results: reviews.length,
      status: "success",
      data: reviews,
    });
  } catch (err) {
    next(err);
  }
};

const getAllMyReviews = async (req, res, next) => {
  try {
  
    const reviews = await Review.find({customer: req.userInfo.id})
    console.log('review: ', reviews)
    
    res.status(200).json({
      results: reviews.length,
      status: "success",
      data: reviews,
    });
  } catch (err) {
    next(err);
  }
};



// update a review
const updateReview = async (req, res, next) => {
  try {
    const updatedReview = await Review.findByIdAndUpdate(
      req.params.review_id,
      req.body,
      { new: true }
    );
    if (!updatedReview)
      return next(createError("fail", 404, "This review no longer exists"));
    res.status(201).json({
      status: "success",
      data: updatedReview,
    });
  } catch (err) {
    next(err);
  }
};

// delete a review
const deleteReview = async (req, res, next) => {
  try {
    const deletedReview = await Review.findByIdAndDelete(req.params.review_id);
    if (!deletedReview)
      return next(createError("fail", 404, "This review does not exist"));
    console.log(deletedReview);
    res.status(204).json({
      status: "success",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllReviews,
  createReview,
  updateReview,
  deleteReview,
  getAllMyReviews
};
