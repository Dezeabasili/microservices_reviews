const mongoose = require('mongoose')
// const Hotel = require('./hotels')
const rabbitMQ_connection = require('../utils/producer')


const exchangeName = "topic_logs";
const routing_key = ['reviews.hotelsReviews.updateMany']
let channel_reviewsSchema_producer;

const sendTask = async () => {
  const connection = await rabbitMQ_connection()
  channel_reviewsSchema_producer = await connection.createChannel();
  await channel_reviewsSchema_producer.assertExchange(exchangeName, 'topic', {durable: false});
  console.log("Connected to rabbitMQ reviewServices")
}

sendTask();

const { Schema } = mongoose

const ReviewSchema = new Schema({
    review: {
        type: String,
        required: [true, 'Please provide a review'],
        lowercase: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 4.5,
        required: [true, 'Please provide a rating']
    },
    bookingRef: {
        type: mongoose.ObjectId,
        ref: 'Booking',
        required: [true, 'A review for what booking reference?']
    },
    hotel: {
        type: mongoose.ObjectId,
        ref: 'Hotel',
        required: [true, 'A review for what hotel?']
    },
    hotel_name: {
        type: String
    },
    customer: {
        type: String
    },
    customer_name: {
        type: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

ReviewSchema.index({ bookingRef: 1, customer: 1 }, { unique: true })

// define the static method to calculate the number of ratings and the average ratings 
ReviewSchema.statics.hotelReviewStats = async function (hotel_id) {
    // in a static method, 'this' points to the model
    const reviewStats = await this.aggregate([
        {
            $match: { hotel: hotel_id }
        },
        {
            $group: {
                _id: '$hotel',
                numberOfRatings: { $sum: 1 },
                averageRating: { $avg: '$rating' }
            }
        }
    ])

    // console.log(reviewStats)

    channel_reviewsSchema_producer.publish(exchangeName, routing_key[0], Buffer.from(JSON.stringify({reviewStats, hotel_id})));
    // if (reviewStats.length > 0) {
    //     await Hotel.findByIdAndUpdate(hotel_id, {
    //         numberOfRatings: reviewStats[0].numberOfRatings,
    //         ratingsAverage: reviewStats[0].averageRating
    //     })
    // } else {
    //     await Hotel.findByIdAndUpdate(hotel_id, {
    //         numberOfRatings: 0,
    //         ratingsAverage: 4.5
    //     })
    // }

}

ReviewSchema.post('save', function (doc, next) {
    this.constructor.hotelReviewStats(this.hotel)
    next()
})

// populating the customer and hotel paths
// ReviewSchema.pre(/^find/, function (next) {
//     // this.populate({ path: 'customer', select: 'username' }).populate({ path: 'hotel', select: 'name city' })
//     this.populate({ path: 'customer', select: 'name' })
//     next()
// })


// The following two codes below demonstrates how to transfer data from a pre hook 
// to a post hook.
ReviewSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.model.findOne(this.getQuery());
    next()
})

ReviewSchema.post(/^findOneAnd/, async function (doc, next) {
    await this.r?.constructor.hotelReviewStats(this.r?.hotel)
    next()
})



/*
ReviewSchema.post(/^findOneAnd/, async function (doc, next) {
    // This first line of code below is used to access the document that was updated by the query
    const updatedDocument = await this.model.findOne(this.getQuery());
    console.log(updatedDocument)
    await updatedDocument.constructor.hotelReviewStats(updatedDocument.hotel)
    next()
})

*/

module.exports = mongoose.model("Review", ReviewSchema)