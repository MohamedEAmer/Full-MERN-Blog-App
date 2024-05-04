import React from 'react'
import { useState , useEffect  } from 'react'
import PostItem from '../components/PostItem'
import axios from 'axios'
import Loader from '../components/Loader'
import { useParams } from 'react-router-dom'




const AuthorPosts = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const {id} = useParams()

  useEffect(()=>{
    const fetchPosts = async () => {
      setIsLoading(true)

      try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/posts/users/${id}`)
        setPosts(response?.data)
      } catch (err) {
        console.log(err)          
      }

      setIsLoading(false)
    }
    fetchPosts();
  },[])

  if (isLoading){
    return <Loader/>
  }

  return (
    <section className='posts'>
      { posts.length > 0 ? <div className="contrainer posts__container">
          {posts.map((post) => (
          <PostItem
              key={post._id}
              postID={post._id}
              thumbnail={post.thumbnail}
              category={post.category}
              title={post.title}
              description={post.description}
              authorID={post.creator}
              createdAt={post.createdAt}
          />
         ))}
      </div> : <h2 className='center'>No Posts Founded</h2>}
    </section>
  );
}

export default AuthorPosts
