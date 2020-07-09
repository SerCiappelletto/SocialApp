
const usersCollection = require("../database").db().collection("user_data")
const validator = require("validator")
const bcrypt = require("bcryptjs")
const md5 = require("md5")

let User = function(data, getAvatar) {

    this.data = data
    this.errors = []
    if(getAvatar == undefined){
        getAvatar = false
    }
    if(getAvatar){
        this.getAvatar()
    }

}

User.prototype.cleanUp = function(){

    if(typeof(this.data.username) != "string"){this.data.username = ""}
    if(typeof(this.data.email) != "string"){this.data.email = ""}
    if(typeof(this.data.password) != "string"){this.data.password = ""}

    // no unexpected properties
    this.data = {

        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim(),
        password: this.data.password

    }
}

User.prototype.validate = function(){
    
    return new Promise( async (resolve, reject) => {

        if(this.data.username == ''){
            this.errors.push("You must provide a username")
        }else if(!validator.isAlphanumeric(this.data.username)){
            this.errors.push("Username can only contain letters & numbers")
        }
        if(!validator.isEmail(this.data.email)){this.errors.push("You must provide a valid email")}
        if(this.data.password == ''){this.errors.push("You must provide a password")}
        if(this.data.password.length > 0 && this.data.password.length < 12){this.errors.push("Password must be at least 12 characters long")}
        if(this.data.password.length > 50){this.errors.push("Password cannot exeed 50 characters")}
        if(this.data.username.length > 0 && this.data.password.length < 4){this.errors.push("User must be at least 4 characters long")}
        if(this.data.username.length > 30){this.errors.push("Username cannot exeed 16 characters")}     
        
        // only if username is valid, check to see if it's already taken.
        if(this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)){
            let usernameExists = await usersCollection.findOne({username: this.data.username})
            if(usernameExists){
                this.errors.push("That username is already taken.")
            }
        }
    
        // same shit for email
        if(validator.isEmail(this.data.email)){
            let emailExists = await usersCollection.findOne({email: this.data.email})
            if(emailExists){
                this.errors.push("That email is already used.")
            }
        }

        resolve()
    
    })

}

User.prototype.register = function(){

    return new Promise( async (resolve, reject) => {

        this.cleanUp()
        await this.validate()
        
        if(!this.errors.length){
            let salt = bcrypt.genSaltSync()
            this.data.password = bcrypt.hashSync(this.data.password, salt)
            await usersCollection.insertOne(this.data)
            this.getAvatar()
            resolve(this.data.username, this.data.email)
        }else{
            reject(this.errors)
        }
    
    })

}

User.prototype.login = function(){

    return new Promise((resolve, reject) => {

        this.cleanUp()
        usersCollection.findOne({
            username: this.data.username
        }).then((attemptedUser) => {
            if(attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)){
                //grab the email because the user logins with usrname and pwd
                this.data = attemptedUser
                this.getAvatar()
                resolve("Login successful.")
            }else{
                reject("Invalid username / password.")
            }
        }).catch(function(error){
            reject(error)
        })

    })

}

User.prototype.getAvatar = function(){
    
    //email hashed using md5
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`

}

User.findByUsername = function(username){
    return new Promise(function(resolve, reject){
        if(typeof(username)!="string"){
            reject()
            return
        }
        usersCollection.findOne({username: username}).then(function(userDoc){
            if(userDoc){
                userDoc = new User(userDoc, true)
                userDoc = {
                    _id: userDoc.data._id,
                    username: userDoc.data.username,
                    avatar: userDoc.avatar
                }
                resolve(userDoc)
            }else{
                reject()
            }
        }).catch(function(){
            reject()
        })        
    })
}

User.doesEmailExist = function(email){
        return new Promise(async function(resolve, reject){
                if(typeof(email) != "string"){
                        resolve(false)
                        return
                }
                let user = await usersCollection.findOne({email: email})
                if(user){
                        resolve(true)
                }else{
                        resolve(false)
                }
        })
}

module.exports = User