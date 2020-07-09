
const express = require("express")
const router = express.Router()
const userController = require("./controllers/userController")
const postController = require("./controllers/postController")
const followController = require("./controllers/followController")

//what is the difference between get/post
router.get("/", userController.home)
router.post("/register", userController.register)
router.post("/login", userController.login)
router.post("/logout", userController.logout)
router.get("/create-post", userController.isLoggedIn, postController.create)
router.post("/create-post", userController.isLoggedIn, postController.post)
router.get("/post/:id", postController.viewSingle)
router.get("/post/:id/edit", userController.isLoggedIn, postController.viewEditScreen)
router.post("/post/:id/edit", userController.isLoggedIn, postController.edit)
router.post("/post/:id/delete", userController.isLoggedIn, postController.delete)
router.post('/search', postController.search)
router.get("/profile/:username", userController.ifUserExists, userController.sharedProfileData, userController.profilePostsScreen)
router.post("/addFollow/:username", userController.isLoggedIn, followController.addFollow)
router.post("/removeFollow/:username", userController.isLoggedIn, followController.removeFollow)
router.get("/profile/:username/followers", userController.ifUserExists, userController.sharedProfileData, userController.profileFollowersScreen)
router.get("/profile/:username/following", userController.ifUserExists, userController.sharedProfileData, userController.profileFollowingScreen)
router.post("/doesUsernameExist", userController.doesUsernameExist)
router.post("/doesEmailExist", userController.doesEmailExist)

module.exports = router