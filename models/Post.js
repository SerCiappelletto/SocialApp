const postCollection = require("../database").db().collection("posts")
const ObjectId = require("mongodb").ObjectID
const User = require('./User')
const sanitizeHTML = require("sanitize-html")
const followsCollection = require("../database").db().collection("follows")

let Post = function(formData, userId, requestedPostId){
    this.data = formData
    this.errors = []
    this.userId = userId
    this.requestedPostId = requestedPostId
}

Post.prototype.post = function(){

    return new Promise((resolve, reject)=>{

        this.clean()
        this.validate()
        if(!this.errors.length){
            postCollection.insertOne(this.data).then((info)=>{
                resolve(info.ops[0]._id)
            }).catch(()=>{
                this.errors.push("Please try again later.")
                reject(this.errors)
            })
        }else{
            reject(this.errors)
        }

    })

}

Post.prototype.update = function(){

    return new Promise(async (resolve, reject)=>{
        try{
            let post = await Post.findSingleById(this.requestedPostId, this.userId)
            if(post.isVisitorOwner){
                let status = await this.saveUpdate()
                // update
                resolve(status)
            }else{
                reject()
            }
        }catch{
            reject()
        }
    })

}

Post.prototype.saveUpdate = function(){
    return new Promise(async (resolve, reject)=>{
        this.clean()
        this.validate()
        if(!this.errors.length){
            await postCollection.findOneAndUpdate({_id: new ObjectId(this.requestedPostId)}, {$set:{
                title: this.data.title,
                body: this.data.body
            }})
            resolve("success")
        }else{
            reject("failure")
        }   
    })
}

Post.prototype.clean = function(){
    if(typeof(this.data.title) != "string"){
        this.data.title = ""
    }
    if(typeof(this.data.body) != "string"){
        this.data.body = ""
    }
    this.data = {
        title: sanitizeHTML(this.data.title.trim(), {
            allowedTags:[],
            allowedAttributes: {}
        }),
        body: sanitizeHTML(this.data.body.trim(), {
            allowedTags:['strong'],
            allowedAttributes: {}
        }),
        createdDate: new Date(),
        author: ObjectId(this.userId)
    }
}

Post.prototype.validate = function(){
    if(this.data.title == ""){
        this.errors.push("You must provide a title.")
    }
    if(this.data.body == ""){
        this.errors.push("You must provide post content.")
    }
}

Post.reusablePostQuery = function(uniqueOp, visitorId){
    return new Promise(async function(resolve, reject){

        let aggOp = uniqueOp.concat(
            {$lookup: {
            from: "user_data",
            localField: "author",
            foreignField: "_id",
            as: "authorDocument"
        }},
        {$project: {
            title: 1,
            body: 1,
            createdDate: 1,
            authorId: "$author",
            author: {$arrayElemAt: ["$authorDocument",0]}
        }})

        let posts = await postCollection.aggregate(aggOp).toArray()
 
        posts = posts.map(function(post){
            post.isVisitorOwner = post.authorId.equals(visitorId)

            post.authorId = undefined // more efficient than "delete post.authorId" 

            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }
 
            return post
         })
 
         resolve(posts)
         
    })
}

Post.findSingleById = function(id, visitorId){
   return new Promise(async function(resolve, reject){
        if(typeof(id)!="string"||!ObjectId.isValid(id)){
            reject()
            return
        }

        let posts = await Post.reusablePostQuery([
            {$match: {_id: new ObjectId(id)}}
        ], visitorId)

        if(posts.length){
            resolve(posts[0])
        }else{
            reject()
        }

   })
}

Post.findByAuthorId = function(authorId){

    return Post.reusablePostQuery([
        {$match: {author: authorId}},
        {$sort: {createdDate: -1}}
    ])

}

Post.delete = function(postIdToDelete, currentUserId){

    return new Promise(async(resolve, reject)=>{
        try{
            let post = await Post.findSingleById(postIdToDelete, currentUserId)
            if(post.isVisitorOwner){
                await postCollection.deleteOne({_id: new ObjectId(postIdToDelete)})
                resolve()
            }else{
                reject()
            }
        }catch{
            reject()
        }
    })

}

Post.search = function(searchTerm){
    return new Promise(async (resolve, reject)=>{
        if(typeof(searchTerm)=="string"){
            let posts = await Post.reusablePostQuery([
                {$match:{$text:{$search: searchTerm}}},
                {$sort:{score:{$meta:"textScore"}}}
            ])
            resolve(posts)
        }else{
            reject()
        }
    })
}

Post.countPostsByAuthor = function(id){
    return new Promise(async (resolve, reject)=>{
        let postCount = postCollection.countDocuments({
            author:id
        })
        resolve(postCount)
    })
}

Post.getFeed = async function(id){
    // create an array of the user id's that the user follows
    let followedUsers = await followsCollection.find({authorId:new ObjectId(id)}).toArray()
    followedUsers = followedUsers.map(function(followDoc){
        return followDoc.followedId
    })

    // look for posts where the author is in the above array of followed users
    return Post.reusablePostQuery([
        {$match:{author:{$in:followedUsers}}},
        {$sort:{createdDate:-1}}
    ])
}

module.exports = Post