import DOMPurify from 'dompurify'

function HTMLSearchTemplate (){ 
  return `<div class="search-overlay">
  <div class="search-overlay-top shadow-sm">
    <div class="container container--narrow">
      <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>
      <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">
      <span class="close-live-search"><i class="fas fa-times-circle"></i></span>
    </div>
  </div>

  <div class="search-overlay-bottom">
    <div class="container container--narrow py-3">
      <div class="circle-loader"></div>
      <div class="live-search-results"></div>
    </div>
  </div>
</div>`
}

function HTMLAuxSearchTemplate(posts) { 
  return DOMPurify.sanitize(`<div class="list-group shadow-sm">
  <div class="list-group-item active"><strong>Search Results</strong>(${posts.length>1?`${posts.length} posts found`:`One post found`})</div>
  ${posts.map(post=>{
    let postDate = new Date(post.createdDate)
    return `<a href="/post/${post._id}" class="list-group-item list-group-item-action">
    <img class="avatar-tiny" src="${post.author.avatar}"><strong>${post.title}</strong>
    <span class="text-muted small">${post.author.username} on ${postDate.getMonth()+1}/${postDate.getDate()}/${postDate.getFullYear()}</span>
    </a>`
  }).join('')}  
  </div>`)
}
export {HTMLAuxSearchTemplate, HTMLSearchTemplate}