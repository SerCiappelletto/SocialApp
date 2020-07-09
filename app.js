const hour = 1000 * 60 * 60
const express = require("express")
const session = require("express-session")
const MongoStore = require("connect-mongo")(session) 
const flash = require("connect-flash")
const markdown = require("marked")
const app = express()
const sanitizeHTML = require("sanitize-html")
const csrf = require("csurf")

let sessionOptions = session({
    secret: "secret1234", // should be something that can t be guessed
    store: new MongoStore({
        client: require("./database")
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * hour ,
        httpOnly: true
    }
})

app.use(sessionOptions)
app.use(flash())

app.use(function(request, response, next){

    // make the markdown function available from within ejs templates 
    response.locals.filterUserHTML = function(content){
        return sanitizeHTML(markdown(content), {
            allowedTags: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'bold', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            allowedAttributes: {}
        })
    }

    // make all error and success flash messages available from all templates
    response.locals.errors = request.flash("errors")
    response.locals.success = request.flash("success")

    // make current user id available on the req object
    if(request.session.user){
        request.visitorId = request.session.user._id
    }else{
        request.visitorId = 0
    }

    // make user session data available from within view templates
    response.locals.user = request.session.user
    next()
})

const router = require("./router.js")
const { table } = require("console")
const { emit } = require("process")

app.use(express.urlencoded({extended : false}))
app.use(express.json())

app.use(express.static("public"))
app.set("views", "views")
app.set("view engine", "ejs")

app.use(csrf())

app.use(function(request, response, next){
        response.locals.csrfToken = request.csrfToken()
        next()
})

app.use("/", router)

app.use(function(err, request, response, next){
        if(err){
                if(err.code == "EBADCSRFTOKEN"){
                        request.flash("errors", "Cross site request forgery detected.")
                        request.session.save(()=>{response.redirect("/")})
                }else{
                        response.render("404")
                }
        }
})

const server = require('http').createServer(app)
const io = require('socket.io')(server)

io.use(function(socket, next){
        sessionOptions(socket.request, socket.request.res, next)
})

io.on('connection', function(socket){
        if(socket.request.session.user){
                let user = socket.request.session.user
                socket.emit('welcome', {
                        username: user.username,
                        avatar: user.avatar
                })
                socket.on('chatMessageFromBrowser', function(data){
                        if(data.message != ''){
                                socket.broadcast.emit('chatMessageFromServer', {
                                        message: sanitizeHTML(data.message, {
                                                allowedTags: [],
                                                allowedAttributes: []
                                        }),
                                        username: user.username,
                                        avatar: user.avatar 
                                })
                        }
                })
        }
})

module.exports = server