import express from 'express';
import userAuthenticateToken from '../middleware/userAuthToken.js';
import {sentMessage,getMessage} from '../controllers/messageController.js'

const messageRoute = express()

messageRoute.post('/',userAuthenticateToken,sentMessage)
messageRoute.get('/:chatId',userAuthenticateToken,getMessage)


export default messageRoute