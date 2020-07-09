
const User = require("../models/User")
const Post = require("../models/Post")
const Follow = require("../models/follow")

exports.doesUsernameExist = function(request, response){
        User.findByUsername(request.body.username).then(function(){
                response.json(true)
        }).catch(function(){
                response.json(false)
        })
}

exports.doesEmailExist = async function(request, response){
        let emailBool = await User.doesEmailExist(request.body.email)
        response.json(emailBool)
}

exports.isLoggedIn = function(request, response, next){

    if(request.session.user){
        next();
    }else{
        request.flash("errors","You must be logged in as an user to perform that action.")
        request.session.save(function(){
            response.redirect("/")
        })
    }

}

exports.home = async function(request, response){

    if(request.session.user){
        //fetch feed of posts for current user
        let posts = await Post.getFeed(request.session.user._id)
        response.render("home-logged-in-no-results", {posts: posts})
    }else{
        response.render("home-guest", {
            regErrors : request.flash('regErrors')
        })
    }

}

exports.register = async function(request, response){

    let user = new User(request.body)
    user.register().then(() => {
        request.session.user = {
            username : user.data.username,
            avatar: user.avatar,
            _id: user.data._id
        }
        request.session.save(function(){
            response.redirect("/")
        })
    }).catch((regErrors) => {
        regErrors.forEach(function(error){
            request.flash('regErrors', error)
        })
        request.session.save(function(){
            response.redirect("/")
        })
    })


}

exports.login = function(request, response){

    let user = new User(request.body)
    user.login().then(function(result){
        request.session.user = {
            avatar: user.avatar,
            username: user.data.username,
            _id: user.data._id
        }
        request.session.save(function(){
            response.redirect("/")
        })
    }).catch(function(error){
        request.flash('errors', error)
        request.session.save(function(){
            response.redirect("/")
        })
    })    

}

exports.logout = function(request, response){

    request.session.destroy(function(){
        
        response.redirect("/")

    })

}

exports.ifUserExists = function(request, response, next){
    User.findByUsername(request.params.username).then(function(userDocument){
        request.profileUser = userDocument
        next()
    }).catch(function(){
        response.render("404")
    })
}

exports.sharedProfileData = async function(request, response, next){
    let isVisitorsProfile = false
    let isFollowing = false
    if(request.session.user){
        isVisitorsProfile = await request.profileUser._id.equals(request.session.user._id)
        isFollowing = await Follow.isVisitorFollowing(request.profileUser._id, request.visitorId)
    }

    request.isVisitorsProfile = isVisitorsProfile
    request.isFollowing = isFollowing

    // retrieve post, follower and following counts
    let postCountPromise = Post.countPostsByAuthor(request.profileUser._id)
    let followerCountPromise = Follow.countFollowersById(request.profileUser._id)
    let followingCountPromise = Follow.countFollowingById(request.profileUser._id)

    let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise])
    
    request.postCount = postCount
    request.followerCount = followerCount
    request.followingCount = followingCount

    next()
}

exports.profilePostsScreen = function(request, response){
    Post.findByAuthorId(request.profileUser._id).then(function(posts){
        response.render('profile-posts',{
            title: `Profile for ${request.profileUser.username}`,
            currentPage: "posts",
            posts: posts,
            profileUsername: request.profileUser.username,
            profileAvatar: request.profileUser.avatar,
            isFollowing: request.isFollowing,
            isOwnProfile: request.isVisitorsProfile,
            counts: {postCount: request.postCount, followerCount: request.followerCount, followingCount: request.followingCount}
        })
    }).catch(function(){
        resolve.render('404')
    })
}

exports.profileFollowersScreen = async function(request, response){
    try{
        let followers = await Follow.getFollowersById(request.profileUser._id)
        response.render('profile-followers', {
            currentPage: "followers",
            followers: followers,
            profileUsername: request.profileUser.username,
            profileAvatar: request.profileUser.avatar,
            isFollowing: request.isFollowing,
            isOwnProfile: request.isVisitorsProfile,
            counts: {postCount: request.postCount, followerCount: request.followerCount, followingCount: request.followingCount}
        })
    }catch{
        response.render('404')
    }
}

exports.profileFollowingScreen = async function(request, response){
    try{
        let following = await Follow.getFollowingById(request.profileUser._id)
        response.render('profile-following', {
            currentPage: "following",
            following: following,
            profileUsername: request.profileUser.username,
            profileAvatar: request.profileUser.avatar,
            isFollowing: request.isFollowing,
            isOwnProfile: request.isVisitorsProfile,
            counts: {postCount: request.postCount, followerCount: request.followerCount, followingCount: request.followingCount}
        })
    }catch{
        response.render('404')
    }
}