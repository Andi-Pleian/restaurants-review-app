import app from "./server.js"
import mongodb from "mongodb"
import dotenv from "dotenv"
import RestaurantsDAO from "./dao/restaurantsDAO.js"
import ReviewsDAO from "./dao/reviewsDAO.js"

dotenv.config()
const MongoClient = mongodb.MongoClient

const port = process.env.PORT || 8000   // if env cannot be accessed, default is 8000

MongoClient.connect(
    process.env.RESTREVIEWS_DB_URI,
    {
        wtimeoutMS: 2500,
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
)

.catch(err => {
    console.error(err.stack)
    process.exit(1)
})

.then(async client => {
    // this is how we get initial reference to db
    await RestaurantsDAO.injectDB(client)
    await ReviewsDAO.injectDB(client)

    app.listen(port, () => {
        console.log(`listening on port ${port}`)
    })
})

