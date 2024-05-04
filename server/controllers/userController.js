const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const {v4:uuid} = require('uuid')// add some id after a name
const HttpError = require('../models/errorModel')
const User = require('../models/userModel')



// POST , api/users/regisster , unprotected
const registerUser = async (req, res ,next)=>{
    try {
        // console.log(req.body)
        const{name , email, password ,password2} = req.body;
        if(!name ||!email ||!password){
            return next(new HttpError('Fill in All fields. ',422))
        }

        const newEmail = email.toLowerCase()

        const emailExists = await User.findOne({email: newEmail});

        if(emailExists) {
            return next(new HttpError('Email Already Exists. ',422))
        }

        if((password.trim().length < 6)){
            return next(new HttpError('Password should be at least 6 characters. ',422))
        }

        if(password != password2) {
            return next(new HttpError('Passwords do not match. ',422))
        } 

        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password , salt);
        const newUser = await User.create({name , email: newEmail , password: hashedPass})
        res.status(200).json(newUser)

    } catch (error) {
        return next(new HttpError('User Registeration Failed',422))
        
    }
}

// POST , api/users/login , unprotected
const loginUser = async (req, res ,next)=>{
    try {
        const{email, password } = req.body;
        if(!email ||!password){
            return next(new HttpError('Fill in All fields. ',422))
        }

        const newEmail = email.toLowerCase()

        const user = await User.findOne({email:newEmail})
        if(!user){
            return next(new HttpError('Invalid Inputs.',422))
        }
        const comparePass = await bcrypt.compare(password , user.password)
        if(!comparePass){
            return next(new HttpError('Wrong password.',422))
        }

        const {_id: id, name}= user;

        const token = jwt.sign({id,name}, process.env.JWT_SECRET,{expiresIn:"1d"})

        res.status(200).json({token, id , name})

    } catch (error) {
        return next(new HttpError('Login failed . Please Enter the Email and Password. ',422))
    }
}


// GET , api/users/:id , protected
const getUser = async (req, res ,next)=>{
    try {
        const {id} =  req.params;
        const user = await User.findById(id).select('-password');

        if(!user){
            return next(new HttpError('User not found.',422))
        }
    
        res.status(200).json(user);
    } catch (error) {
        return next(new HttpError(error));
    }
}



// POST , api/users/change-avatar , protected
const changeAvatar = async (req, res ,next)=>{
    try {
        if(!req.files.avatar){
            return next(new HttpError('Please choose an image', 422))
        }
        
        const user = await User.findById(req.user.id)

        if(user.avatar){
            fs.unlink(path.join(__dirname,'..','uploads',user.avatar),(err)=>{
                if(err){
                    return next(new HttpError(err))
                }
            })
        }

        const {avatar} = req.files;
        if(avatar.size > 500000){
            return next(new HttpError('Profile picture too big , Should be less than 500Kb', 422))
        }

        let fileName;
        fileName = avatar.name;
        let splittedFilename = fileName.split('.')
        let newFilename = splittedFilename[0]+ uuid() + '.' + splittedFilename[splittedFilename.length - 1]
        avatar.mv(path.join(__dirname,'..','uploads',newFilename),async(err)=>{
            if(err){
                return next(new HttpError(err))
            }
            const updatedAvatar = await User.findByIdAndUpdate(req.user.id,{avatar: newFilename},{new: true})
            if(!updatedAvatar){
                return next(new HttpError('Avatar could not be changed.', 422))
            }
            res.status(200).json(updatedAvatar)
        })
    } catch (error) {
        return next(new HttpError(err))
    }


}


// POST , api/users/edit-user , protected
const editUser= async (req, res ,next)=>{
    try {
            const{name , email, currentPassword ,newPassword,confirmNewPassword} = req.body;
        if(!name ||!email ||!currentPassword||!newPassword){
            return next(new HttpError('Fill in All fields. ',422))
        }
        const user = await User.findById(req.user.id);

        if(!user){
            return next(new HttpError('User not found.',403))
        }

        const emailExist = await User.findOne({email});

        if(emailExist && emailExist._id != req.user.id){
            return next(new HttpError('Email already exist.',422))
        }

        const validateUserPassword = await bcrypt.compare(currentPassword , user.password);
        if(!validateUserPassword){
            return next(new HttpError('Invalid current password',422))
        }

        if(newPassword !== confirmNewPassword){
            return next(new HttpError('New password Do not match.',422))
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword , salt);

        const newInfo = await User.findByIdAndUpdate(req.user.id ,{name , email , password: hash},{new: true})
        res.status(200).json(newInfo)
        // console.log(newInfo)
    } catch (error) {
        return next(new HttpError(error)) 
    }

}


// GET , api/users/authors , unprotected
const getAuthors = async (req, res ,next)=>{
    try {
        
        const authors = await User.find().select('-password');
            if(!authors){
            return next(new HttpError('Users not found.',422))
        }
        
        res.status(200).json(authors);


    } catch (error) {
        return next(new HttpError(error));
    }
}



module.exports = { registerUser , loginUser ,getUser, changeAvatar , editUser , getAuthors}