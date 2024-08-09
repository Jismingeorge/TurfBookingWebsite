import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

import dotenv from 'dotenv';
dotenv.config();

const userAuthenticateToken = asyncHandler(async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            console.error('No authorization header found');
            return res.status(401).json({ message: 'No Token Found' });
        }
        const token = authHeader.split(' ')[1];
        if (token == null) {
            console.error('No token found in authorization header');
            return res.status(401).json({ message: 'No Token Found' });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded Token:', decodedToken);

        const userData = await User.findOne({ _id: decodedToken.id });
        if (userData) {
            if (userData.isAdmin === true) {
                console.error('Admin user attempted to access user route');
                return res.status(401).json({ message: 'You are not authorized to access this' });
            } else {
                if (userData.isBlocked === true) {
                    console.error('Blocked user attempted to access');
                    return res.status(204).json({ message: 'You are blocked by admin...!!!' });
                } else {
                    req.user = userData;
                    next();
                }
            }
        } else {
            console.error('Invalid token');
            return res.status(401).json({ message: 'Invalid token' });
        }
    } catch (error) {
        console.error('Error in userAuthenticateToken:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});


export default userAuthenticateToken