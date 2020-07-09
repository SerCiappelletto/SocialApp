import {renderChat} from "../../views/chat-visible-template"
import DOMPurify from "dompurify"

export default class Chat {
    constructor(){
        this.isOpen = false
        this.openedYet = false
        this.chatWrapper = document.querySelector("#chat-wrapper")
        this.openIcon = document.querySelector(".header-chat-icon")
        this.injectHTML()
        this.chatLog = document.querySelector("#chat")
        this.chatField = document.querySelector("#chatField")
        this.chatForm = document.querySelector("#chatForm")
        this.closeIcon = document.querySelector(".chat-title-bar-close")
        this.events()
    }
    // Events
    events(){
        this.chatForm.addEventListener("submit", (event)=>{
            // preventDefault() because by default after a form is submitted the page reloads 
            event.preventDefault()
            this.sendMessageToServer()
        })
        this.openIcon.addEventListener("click", ()=>this.chatEvent())
        this.closeIcon.addEventListener("click", ()=>this.hideChat())
    }
    // Methods
    sendMessageToServer(){
        this.socket.emit('chatMessageFromBrowser', {message:this.chatField.value})
        this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`
                <div class="chat-self">
                <div class="chat-message">
                <div class="chat-message-inner">
                        ${this.chatField.value}
                </div>
                </div>
                <img class="chat-avatar avatar-tiny" src="${this.avatar}">
                </div>
        `))
        this.chatLog.scrollTop = this.chatLog.scrollHeight
        this.chatField.value = ''
        this.chatField.focus()
    }
    displayMessageFromServer(data){
        this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`
                <div class="chat-other">
                <a href="/profile/${data.username}"><img class="avatar-tiny" src="${data.avatar}"></a>
                <div class="chat-message"><div class="chat-message-inner">
                <a href="/profile/${data.username}"><strong>${data.username} : </strong></a>
                        ${data.message}
                </div></div>
                </div>
        `))
        this.chatLog.scrollTop = this.chatLog.scrollHeight
    }
    injectHTML(){
        this.chatWrapper.innerHTML = renderChat()
    }
        // messy but it s less code than if done properly and it s not that complicated to understand
    chatEvent(){
        if(!this.openedYet){
            this.openConnection()
        }
        this.openedYet = true
        // this is the messy part
        if(this.isOpen){
            this.chatWrapper.classList.remove("chat--visible")
            this.isOpen = false
        }else{
            this.chatWrapper.classList.add("chat--visible")
            this.chatField.focus()
            this.isOpen = true
        }
    }
    hideChat(){
        this.chatWrapper.classList.remove("chat--visible")
    }
    openConnection(){
        // # 1
        this.socket = io()
        this.socket.on('welcome', data=>{
                this.username = data.username
                this.avatar = data.avatar
        })
        // # 2
        this.socket.on('chatMessageFromServer', (data)=>{
                this.displayMessageFromServer(data)
        })
    }
}

// # 1
        // this is made possible from app.js with that 'const io' shit
        // there was an error when the 'this.socket = ' wasn t present
// # 2
        // i suspect that this method down below is something that gets 
        // called once and then is a continuous process untill something
        // happens, like the connection is terminated, in theory sounds
        // easy to do but i need to see the code or try to implement it
        // myself so i can better understand the principles and maybe 
        // research more modern methods if there are any 