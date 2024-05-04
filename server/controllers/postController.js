const Post = require('../models/postModel')
const User = require('../models/userModel')
const fs = require('fs')
const path = require('path')
const {v4:uuid} = require('uuid')
const HttpError = require('../models/errorModel')

// POST , api/posts , protected
const createPost = async (req,res,next) => {
    try {
        let { title , category , description } = req.body;
        if(!title||!category||!description||!req.files){
            // console.log(req.body,req.files)
            return next(new HttpError("Fill in all fields and choose thumbnail" , 422));
        }
        const {thumbnail} =  req.files;
        if(thumbnail.size > 2000000){
            return next(new HttpError('Thumbnail too big , file should be less than 2mb.'))
        }

        let fileName = thumbnail.name;
        let splittedFilename = fileName.split('.')
        let newFilename = splittedFilename[0]+ uuid() + '.' + splittedFilename[splittedFilename.length - 1]
        thumbnail.mv(path.join(__dirname,'..','uploads',newFilename),async(err)=>{
            if(err){
                return next(new HttpError(err))
            }else{
                const newPost = await Post.create({title, category, description, thumbnail: newFilename,author: req.user.name ,creator: req.user.id})
                if(!newPost){
                    return next(new HttpError('Post could not be changed.', 422))
                }
                const currentUser = await User.findById(req.user.id);
                const userPostCount = currentUser.posts + 1;
                await User.findByIdAndUpdate(req.user.id, {posts:userPostCount})

                res.status(201).json(newPost)
                // console.log(newPost);
            }

        })
        
    } catch (error) {
        return next(new HttpError(error));
    }
}

// Get , api/posts , unprotected
const getPosts = async (req,res,next) => {
    try {
        const posts = await Post.find().sort({updatedAt: -1})
        res.status(200).json(posts)
    } catch (error) {
        return next(new HttpError(error));
    }
}


// Get , api/posts/:id , unprotected
const getPost = async (req,res,next) => {
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId)
        if(!post){
            return next(new HttpError('Post not Found.',404));
        }
        res.status(200).json(post)
    } catch (error) {
        return next(new HttpError(error));
    }
}



// Get , api/posts/categories/:category , unprotected
const getCatPosts = async (req,res,next) => {
    try {
        const {category} = req.params;
        const catPosts =  await Post.find({category}).sort({createdAt: -1})
        res.status(200).json(catPosts)
    } catch (error) {
        return next(new HttpError(error));
    }
}


// Get , api/posts/users/:id , unprotected
const getUserPosts = async (req,res,next) => {
    try {
        const {id} =req.params;
        const posts = await Post.find({creator: id}).sort({createdAt: -1})
        res.status(200).json(posts)
    } catch (error) {
        return next(new HttpError(error));
    }
}



// Patch , api/posts/:id , protected
const editPost = async (req,res,next) => {
    try {
        let fileName;
        let newFilename;
        const postId = req.params.id;
        let {title , category , description} = req.body;
        // console.log(req.body)
        if(!title || !category || !description.length > 12){
            return next(new HttpError("Fill in all Fields.",422));
        }
        const oldPost = await Post.findById(postId);
        if(req.user.id == oldPost.creator){
            if(!req.files){
                updatedPost = await Post.findByIdAndUpdate(postId,{title, category , description} , {new : true})
            } else {
                fs.unlink(path.join(__dirname,'..','uploads',oldPost.thumbnail),async(err)=>{
                    if(err){
                        return next(new HttpError(err))
                    }
                })

                const { thumbnail } = req.files;
                if(thumbnail.size > 2000000){
                    return next(new HttpError("Thumbnail too big. Should be less than 2mb"));
                }
                fileName = thumbnail.name;
                let splittedFilename = fileName.split('.')
                newFilename = splittedFilename[0]+ uuid() + '.' + splittedFilename[splittedFilename.length - 1]
                thumbnail.mv(path.join(__dirname,'..','uploads',newFilename),async(err)=>{
                    if(err){
                        return next(new HttpError(err))
                    }
                })
            
                updatedPost = await Post.findByIdAndUpdate(postId,{title , category , description, thumbnail: newFilename},{new: true})
                // console.log(updatedPost)
            }
        }
        if(!updatedPost){
            // console.log(updatedPost)
            return next(new HttpError('Could Not update Post.' , 400));
        }
        res.status(200).json(updatedPost)
    } catch (error) {
        return next(new HttpError('Could Not update Post.' , 400));
    }
}

// DELETE , api/posts/:id , protected
const deletePost = async (req,res,next) => {
    try {
        const postId = req.params.id;
        if(!postId){
            return next(new HttpError('Posts unavailable.' , 400));
        }
        const post = await Post.findById(postId);
        const fileName =post?.thumbnail;
        if(req.user.id == post.creator){
            fs.unlink(path.join(__dirname,'..','uploads',fileName),async(err)=>{
                if(err){
                    return next(new HttpError(err))
                } else {
                    await Post.findByIdAndDelete(postId);
                    const currentUser = await User.findById(req.user.id);
                    const userPostCount = currentUser?.posts-1;
                    await User.findByIdAndUpdate(req.user.id , {posts: userPostCount})
                    res.json(`Post ${postId} deleted successfully.`)
                }
            })
        } else {
            return next(new HttpError('You can not delet that post' , 403));
        }
    } catch (error) {
        return next(new HttpError('Post can not be deleted' , 403));
    }
}



module.exports={createPost,getPosts,getPost,getCatPosts,getUserPosts,editPost,deletePost}