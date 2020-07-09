const Post = require('../models/Post')

exports.create = function(request, response){

    response.render('create-post')

}

exports.post = function(request, response){

    let post = new Post(request.body, request.session.user._id)
    post.post().then(function(newId){
        request.flash("success", "New post successfully created.")
        request.session.save(()=>response.redirect(`/post/${newId}`))
    }).catch(function(errors){
        errors.forEach(error=>request.flash("errors", error))
        request.session.save(()=>response.redirect("/create-post"))
    })

}

exports.viewSingle = async function(request, response){

    try{
        let post = await Post.findSingleById(request.params.id, request.visitorId)
        response.render('post', {
                post: post,
                title: post.title
        })
    }catch{
        response.render('404')
    }

}

exports.viewEditScreen = async function(request, response){

    try{
        let post = await Post.findSingleById(request.params.id, request.visitorId)
        if(post.isVisitorOwner){
            response.render("edit-post", {post: post})
        }else{
            request.flash("errors", "You do not have the permission to perform that action.")
            request.session.save(()=>response.redirect("/"))
        }
    }catch{
        response.render("404")
    }
}

exports.edit = function(request, response){

    let post = new Post(request.body, request.visitorId, request.params.id)
    post.update().then((status)=>{
        // the post was successfuly updated in the database
        // or user did have permission, but there were validation errors
        if(status == "success"){
            //post was updated in db
            request.flash("success", "Post successfully updated.")
            request.session.save(function(){
                response.redirect(`/post/${request.params.id}/edit`)
            })
        }else{
            post.errors.forEach(function(error){
                request.flash("errors", error)
            })
            request.session.save(function(){
                response.redirect(`/post/${request.params.id}/edit`)
            })
        }
    }).catch(()=>{
        // if a post with this id does not exist
        // or if the current visitor is not the owner of the requested post
        request.flash("errors", "You do not have permission to perform that action.")
        request.session.save(function(){
            response.redirect("/")
        })

    })    

}

exports.delete = function(request, response){

    Post.delete(request.params.id, request.visitorId).then(()=>{
        request.flash("success", "Post successfully deleted.")
        request.session.save(()=>{
            response.redirect(`/profile/${request.session.user.username}`)
        })
    }).catch(()=>{
        request.flash("errors", "You do not have permission to perform that action.")
        request.session.save(()=>response.redirect("/"))
    })
}

exports.search = function(request, response){
    Post.search(request.body.searchTerm).then((posts)=>{
        response.json(posts)
    }).catch(()=>{
        response.json([])
    })
}