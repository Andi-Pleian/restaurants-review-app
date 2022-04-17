import RestaurantsDAO from "../dao/restaurantsDAO.js"

export default class RestaurantsController {
  // 
  static async apiGetRestaurants(req, res, next) {
    // initialize restaurantsPerPage and page
    // if we passed restaurantsPerPage with url, convert to int else default to 20
    const restaurantsPerPage = req.query.restaurantsPerPage ? parseInt(req.query.restaurantsPerPage, 10) : 20
    // same here
    const page = req.query.page ? parseInt(req.query.page, 10) : 0

    // initialize filters
    let filters = {}
    if (req.query.cuisine) {
      filters.cuisine = req.query.cuisine
    } else if (req.query.zipcode) {
      filters.zipcode = req.query.zipcode
    } else if (req.query.name) {
      filters.name = req.query.name
    }
    
    // call getRestaurants
    const { restaurantsList, totalNumRestaurants } = await RestaurantsDAO.getRestaurants({
      filters,  // pass filters
      page,     // pass page
      restaurantsPerPage, // pass restaurantsPerPage
    })

    // we respond with the values from right
    let response = {
      restaurants: restaurantsList,
      page: page,
      filters: filters,
      entries_per_page: restaurantsPerPage,
      total_results: totalNumRestaurants,
    }

    // respond in json format with the response from above
    res.json(response)
  }
  
  // in the URL:
  //  query => something after the ? 
  //  params => something after the /
  //  body => the body of the request
  static async apiGetRestaurantById(req, res, next) {
    try {
      let id = req.params.id || {}
      let restaurant = await RestaurantsDAO.getRestaurantByID(id)

      // if no restaurant => error
      if (!restaurant) {
        res.status(404).json({ error: "Not found" })
        return
      }

      // else return restaurant
      res.json(restaurant)
    } catch (e) {
      console.log(`api, ${e}`)
      res.status(500).json({ error: e })
    }
  }

  // 
  static async apiGetRestaurantCuisines(req, res, next) {
    try {
      let cuisines = await RestaurantsDAO.getCuisines()
      res.json(cuisines)
    } catch (e) {
      console.log(`api, ${e}`)
      res.status(500).json({ error: e })
    }
  }
}