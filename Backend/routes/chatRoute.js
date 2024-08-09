import express from 'express';
import { createChat, findChat } from '../controllers/chatController.js'
import userAuthenticateToken from '../middleware/userAuthToken.js';
const chatRoute = express()



chatRoute.post('/createChat',userAuthenticateToken, createChat)
chatRoute.get('/allChat',userAuthenticateToken, findChat)

export default chatRoute