let restaurants //reference to db

export default class RestaurantsDAO {

    // async method to connect to db
    // called as soon as server starts
    // fills restaurants variable 
    static async injectDB(conn) {
        if (restaurants) {
            return
        }

        try {
            restaurants = await conn.db(process.env.RESTREVIEWS_NS).collection("restaurants")
        } catch (e) {
            console.error(
                `Unable to establish a collection handle for restaurantsDAO: ${e}`
            )
        }
    }

    // method that we call to get a list of all restaurants in DB
    static async getRestaurants({
        filters = null,
        page = 0,
        restaurantsPerPage = 20,

    } = {}) {
        let query   // it is empty till the method is called with filters

        if (filters) {
            if ("name" in filters) {    // search by name of the restaurant
                // the name field needs to be specified in mongoDB
                query = { $text: { $search: filters["name"] } }
            } else if ("cuisine" in filters) {  // search by cuisine of the restaurant
                // if restaruant.cuisine is equal to the cuisine that was passed as a filter when the method was called (filters["cuisine"])
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

        const displayCursor = cursor.limit(restaurantsPerPage).skip(restaurantsPerPage * page)

        try {
            const restaurantsList = await displayCursor.toArray()
            const totalNumRestaurants = page === 0 ? await restaurants.countDocuments(query) : 0

            return { restaurantsList, totalNumRestaurants }
        } catch (e) {
            console.error(
                `Unable to convert cursor to array or problem with counting documents, ${e}`
                )
            return { restaurantsList: [], totalNumRestaurants: 0 }
        }

    }
}