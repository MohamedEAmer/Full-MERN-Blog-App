import React, { useState , useContext, useEffect } from 'react'
import { UserContext } from '../context/userContext'
import { Link, useNavigate , useLocation} from 'react-router-dom'
import axios from "axios"
import Loader from '../components/Loader'


const DeletePost = ({postId}) => {

  const [isLoading , setIsLoading]= useState(false)
  const navigate = useNavigate();
  const location = useLocation();
  const {currentUser} = useContext(UserContext)
  const token = currentUser?.token;

  useEffect(()=>{
    if(!token){
      navigate('/login')
    }
  }, [])



  const removePost = async ()=>{
    setIsLoading(true)
    try {
      const response = await axios.delete(`${process.env.REACT_APP_BASE_URL}/posts/${postId}`,{withCredentials:true , headers: {Authorization: `Bearer ${token}`}})

      if(response.status === 200){
        if(location.pathname === `/myposts/${currentUser.postId}`){
          navigate(0)
        } else {
          navigate('/')
        } 
      }
      setIsLoading(false)
    } catch (error) {
      
    }
  }


  if (isLoading){
    return <Loader/>
  }

  return (
    <div>
      <Link className='btn sm danger' onClick={()=>removePost(postId)}>Delete</Link>
    </div>
  )
}

export default DeletePost
