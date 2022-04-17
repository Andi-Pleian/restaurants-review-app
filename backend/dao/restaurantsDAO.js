import mongodb from "mongodb"
const ObjectId = mongodb.ObjectId

let restaurants // data from DB (store reference to DB)

export default class RestaurantsDAO {

    // async method to connect to db
    // called as soon as server starts
    // fills restaurants variable 
    // this is how we initialy connect to DB
    static async injectDB(conn) {
        // if restaurants is already filled, do nothing
        if (restaurants) {
            return
        }

        // if not, fill it from DB
        try {
            // connect to db
            //                                      |.env var     |            |collection we are trying to get|
            restaurants = await conn.db(process.env.RESTREVIEWS_NS).collection("restaurants")
        } catch (e) {
            // connection failed => error
            console.error(
                `Unable to establish a collection handle for restaurantsDAO: ${e}`
            )
        }
    }

    // method that we call to get a list of all restaurants in DB
    static async getRestaurants({
        // these are options made up for the method
        // default values
        filters = null,
        page = 0,
        restaurantsPerPage = 20,

    } = {}) {
        let query   // it is empty till the method is called with filters from above

        if (filters) {
            // 3 filters that we setup
            // we can search by name, cuisine and zipcode
            if ("name" in filters) {    // search by name of the restaurant
                // the name field needs to be specified in mongoDB
                // we search in text the given name (we have to set up in mongoDB atlas that if someone does a text search, which fields will be searched)
                // for name we setup an index in mongoDB "name" : "text"
                query = { $text: { $search: filters["name"] } }
            } else if ("cuisine" in filters) {  // search by cuisine of the restaurant
                // if restaruant.cuisine is equal to the cuisine that was passed as a filter when the method was called (filters["cuisine"])
                //        |dbField|    |equals|   |given cuisine filter|
                query = { "cuisine": { $eq: filters["cuisine"] } }
            } else if ("zipcode" in filters) {  // search by zipcode of the restaurant
                query = { "zipcode": { $eq: filters["zipcode"] } }
            }

        }

        let cursor

        try {
            // find all restaurants by given query
            cursor = await restaurants  
                .find(query)
        } catch (e) {
            console.error(`Unable to issue find command, ${e}`)
            return { restaurantsList: [], totalNumRestaurants: 0 }
        }
        
        // in the cursor we will have all the results
        // here we limit results to restaurantsPerPage and we skip to page number we are at
        const displayCursor = cursor.limit(restaurantsPerPage).skip(restaurantsPerPage * page)

        try {
            // we set cursor to an array
            const restaurantsList = await displayCursor.toArray()
            // we count the documents in the query
            const totalNumRestaurants = await restaurants.countDocuments(query)

            return { restaurantsList, totalNumRestaurants }
        } catch (e) {
            console.error(
                `Unable to convert cursor to array or problem with counting documents, ${e}`
                )
            return { restaurantsList: [], totalNumRestaurants: 0 }
        }
    }

    static async getRestaurantByID(id) {
        try {
            // pipelines helps matching different collections togather in mongodb
            // we match the id of specific restaurant
            // lookup => is a kind of join
            const pipeline = [
                {
                    $match: {
                        _id: new ObjectId(id),
                    },
                },
                      {
                          $lookup: {
                              from: "reviews",
                              let: {
                                  id: "$_id",
                              },
                              pipeline: [
                                  {
                                      $match: {
                                          $expr: {
                                              $eq: ["$restaurant_id", "$$id"],
                                          },
                                      },
                                  },
                                  {
                                      $sort: {
                                          date: -1,
                                      },
                                  },
                              ],
                              as: "reviews",
                          },
                      },
                      {
                          $addFields: {
                              reviews: "$reviews",
                          },
                      },
                  ]
            return await restaurants.aggregate(pipeline).next()
        } catch (e) {
            console.error(`Something went wrong in getRestaurantByID: ${e}`)
            throw e
        }
    }

    static async getCuisines() {
        // empty array
        let cuisines = []

        try {
            // get all the distinct cuisines (each cuisine is one time)
            cuisines = await restaurants.distinct("cuisine")
            return cuisines
        } catch (e) {
            console.error(`Unable to get cuisines, ${e}`)
            return cuisines
        }
    }

}
