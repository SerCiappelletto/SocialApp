const dotenv = require("dotenv").config()
const database = require("mongodb")

database.connect(process.env.CONNECTIONSTRING,{

    useNewUrlParser : true , 
    useUnifiedTopology : true

},function(err, client){

    module.exports = client
    const app = require("./app")
    app.listen(process.env.PORT)

})