import express from 'express';
import { insertUser, 
         userLogin,  
         userHome, 
         userTurf,
         turfDetail,
         searchTurf,
         filterTurf,
         paymentRequest,
         bookTurf,
         isBooked,
         bookedTurfs,
         cancelBooking,
         getWalletDetails,
         getWalletAmount,
         bookTurfWallet,
         setNotification,
         getNotification,
         updateNotification
    } from '../controllers/userController.js';
import userAuthenticateToken from '../middleware/userAuthToken.js';

const router = express.Router();

router.post('/register', insertUser);
router.post('/login', userLogin);
router.get('/home', userAuthenticateToken, userHome);
router.get('/turf', userAuthenticateToken, userTurf);
router.get('/turfDetail/:id', turfDetail)
router.get('/searchTurf/:value', searchTurf)
router.get('/filterTurf/:id', filterTurf)
router.post('/booking/payment/:price', userAuthenticateToken, paymentRequest)
router.post('/turfBooking', userAuthenticateToken, bookTurf)
router.get('/isBooked/:id/:date', userAuthenticateToken, isBooked)
router.get('/booking', userAuthenticateToken, bookedTurfs)
router.post('/booking/wallet', userAuthenticateToken, bookTurfWallet)
router.patch('/booking', userAuthenticateToken, cancelBooking)
router.get('/wallet', userAuthenticateToken, getWalletDetails)
router.get('/wallet/amount', userAuthenticateToken, getWalletAmount)
router.post('/notification', userAuthenticateToken, setNotification)
router.get('/notification', userAuthenticateToken, getNotification)
router.patch('/notification', userAuthenticateToken, updateNotification)
export default router;
