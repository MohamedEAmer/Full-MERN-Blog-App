import React from 'react'
import {Link} from 'react-router-dom'
import PostAuthor from './PostAuthor.jsx'


const PostItem = ({postID,thumbnail,category,title,description,authorID, createdAt}) => {
  return (
    <article className='post'>
      <div className="post__thumbnail">
        <img src={`${process.env.REACT_APP_ASSETS_URL}/uploads/${thumbnail}`} alt={title} />
      </div>
      <div className="post__content">
        <Link to={`/posts/${postID}`}>
          <h3>{title}</h3>
        </Link>
        <p dangerouslySetInnerHTML={{__html:description}}/>
        <div className="post__footer">
          <PostAuthor authorID = {authorID} createdAt ={createdAt}/>
          <Link to={`/posts/categories/${category}`} className='btn category'>{category}</Link>
        </div>

      </div>
    </article>
  )
}

export default PostItem
