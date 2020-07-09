import {HTMLSearchTemplate, HTMLAuxSearchTemplate} from "../../views/SearchTemplate.js"
import axios from 'axios'

export default class Search{
    constructor(){
        this._csrf = document.querySelector('[name="_csrf"]').value
        this.injectHTML()
        this.headerSearchIcon = document.querySelector(".header-search-icon")
        this.overlay = document.querySelector(".search-overlay")
        this.closeIcon = document.querySelector(".close-live-search")
        this.inputField = document.querySelector("#live-search-field")
        this.resultsArea = document.querySelector(".live-search-results")
        this.loaderIcon = document.querySelector(".circle-loader")
        this.typingWaitTimer 
        this.previousValue = ""
        this.events()
    }

    events(){
        this.inputField.addEventListener("keyup", ()=>this.keyPressHandler())
        this.closeIcon.addEventListener("click", ()=>this.closeOverlay())
        this.headerSearchIcon.addEventListener("click", (e)=>{
            e.preventDefault()
            this.openOverlay()
        })
    }
    openOverlay(){
        this.overlay.classList.add("search-overlay--visible")
        setTimeout(()=>this.inputField.focus(), 50)
    }
    closeOverlay(){
        this.overlay.classList.remove("search-overlay--visible")
    }
    injectHTML(){
        document.body.insertAdjacentHTML('beforeend', HTMLSearchTemplate())
    }
    keyPressHandler(){
        let value = this.inputField.value

        if(value==""){
            clearTimeout(this.typingWaitTimer)
            this.hideLoaderIcon()
            this.hideResultsArea()
        }

        if(value!=""&&value!=this.previousValue){
            clearTimeout(this.typingWaitTimer)
            this.showLoaderIcon() /// <- maybe animate this better or make it feel more responsive
            this.hideResultsArea()
            this.typingWaitTimer = setTimeout(()=>{this.sendRequest()}, 500)
        }
        this.previousValue = value
    }
    sendRequest(){
        axios.post('/search', {_csrf: this._csrf, searchTerm: this.inputField.value}).then((response)=>{
            this.renderResultsHTML(response.data)
        }).catch(()=>{
            alert("The request failed, please try another time.")
        })
    }
    renderResultsHTML(posts){
        if(posts.length){
            this.resultsArea.innerHTML = HTMLAuxSearchTemplate(posts)
        }else{
            this.resultsArea.innerHTML = `<p class="alert alert-danger text-center shadow-sm">Sorry, we could not find any results for that search.</p>`
        }
        this.hideLoaderIcon()
        this.showResultsArea()
    }
    showLoaderIcon(){
        this.loaderIcon.classList.add("circle-loader--visible")
    }
    hideLoaderIcon(){
        this.loaderIcon.classList.remove("circle-loader--visible")
    }
    showResultsArea(){
        this.resultsArea.classList.add("live-search-results--visible")
    }
    hideResultsArea(){
        this.resultsArea.classList.remove("live-search-results--visible")
    }
}