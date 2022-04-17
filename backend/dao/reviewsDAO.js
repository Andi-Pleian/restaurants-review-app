// import to have access to ObjectId
import mongodb from "mongodb"
const ObjectId = mongodb.ObjectId

// empty variable to be filled with reference to reviews collection
let reviews

export default class ReviewsDAO {
  static async injectDB(conn) {
    // if reviews exists => return
    if (reviews) {
      return
    }

    // if reviews doesn't exist => create reference to reviews collection
    try {
      // if it doesn't exists it will be created
      reviews = await conn.db(process.env.RESTREVIEWS_NS).collection("reviews")
    } catch (e) {
      console.error(`Unable to establish collection handles in userDAO: ${e}`)
    }
  }

  // add review method
  static async addReview(restaurantId, user, review, date) {
    // create review document
    try {
      const reviewDoc = { name: user.name,
          user_id: user._id,
          date: date,
          text: review,
          restaurant_id: ObjectId(restaurantId), }

      // insert review document into db
      return await reviews.insertOne(reviewDoc)
    } catch (e) {
      console.error(`Unable to post review: ${e}`)
      return { error: e }
    }
  }

  // update review method
  static async updateReview(reviewId, userId, text, date) {
    try {
      const updateResponse = await reviews.updateOne(
        { user_id: userId, _id: ObjectId(reviewId)},
        { $set: { text: text, date: date  } },
      )

      return updateResponse
    } catch (e) {
      console.error(`Unable to update review: ${e}`)
      return { error: e }
    }
  }

  // delete review method
  static async deleteReview(reviewId, userId) {

    // we check for the review with the user_id and the review_id (check if the user is the original poster)
    try {
      // this is kind of a delete review from reviews where _id = ObjectId(reviewId) and user_id = userId
      const deleteResponse = await reviews.deleteOne({
        _id: ObjectId(reviewId),
        user_id: userId,
      })

      return deleteResponse
    } catch (e) {
      console.error(`Unable to delete review: ${e}`)
      return { error: e }
    }
  }

}