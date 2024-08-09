import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Turf from '../models/turfModel.js'
import Location from '../models/locationModel.js'
import Booking from '../models/bookingModel.js'
import Stripe from 'stripe'
import Payment from '../models/paymentModel.js'
import Provider from '../models/providerModel.js'
import Wallet from '../models/walletModel.js'
import Notification from '../models/notificationModel.js'
import bcrypt from 'bcryptjs';
import generateToken from '../utility/token.js';

export const insertUser = asyncHandler(async (req, res) => {
    const { name, email, password, mobile, isAdmin = false } = req.body;
    const userExists = await User.findOne({ email: email });

    if (userExists) {
        return res.status(409).json({
            message: 'User already exists !!'
        });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
        name,
        email,
        mobile,
        password: hashPassword,
        isAdmin,
    });

    if (newUser) {
        const token = generateToken(newUser._id);
        return res.status(201).json({
            token,
            Id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            mobile: newUser.mobile,
            isAdmin: newUser.isAdmin,
            wallet: newUser.wallet
        });
    } else {
        return res.status(400).json({
            message: 'User Registration Failed'
        });
    }
});

export const userLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            if (user.isBlocked === true) {
                return res.status(403).json({
                    message: 'You are Blocked !!!'
                });
            } else {
                if (user.isAdmin === false) {
                    const token = generateToken(user._id);
                    return res.status(200).json({
                        token,
                        Id: user._id,
                        name: user.name,
                        email: user.email,
                        mobile: user.mobile,
                        isAdmin: user.isAdmin,
                        wallet: user.wallet
                    });
                } else {
                    return res.status(401).json({
                        message: "You Are Admin !!!"
                    });
                }
            }
        } else {
            return res.status(401).json({
                message: 'Invalid password'
            });
        }
    } else {
        return res.status(404).json({
            message: "User Not Found"
        });
    }
});


export const userHome = asyncHandler(async (req, res) => {
    try {
        const user = req.user;
        if (user) {
            res.status(200).json({ user });
        } else {
            res.status(404).json({ message: 'Unauthorized user' });
        }
    } catch (error) {
        console.error('Error in userHome:', error); // Log the detailed error
        res.status(500).json({ message: 'Server Error', error: error.message }); // Send detailed error message
    }
});


export const userTurf = asyncHandler(async (req, res) => {
    try {
        const turfData = await Turf.find({ isBlocked: false }).collation({ locale: 'en', strength: 2 }).sort({ name: 1 })
        res.status(200).json({
            turfData
        })
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server Error' });
    }
    
})
export const turfDetail = asyncHandler(async (req, res) => {
    try {
        const id = req.params.id
        const singleTurf = await Turf.findById({ _id: id })
        const district = await Location.findById({ _id: singleTurf.district.toString() })
        const location = district.location
        res.status(200).json({
            singleTurf,
            location
        })
    } catch (error) {
        console.log(error.message)
    }
})

export const searchTurf = asyncHandler(async (req, res) => {
    try {
        const { value } = req.params
        const searchedTurf = await Turf.find({ location: new RegExp(value, 'i') })
        res.status(200).json({
            searchedTurf
        })
    } catch (error) {
        console.log(error.message)
    }
})

export const filterTurf = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params
        const filteredTurf = await Turf.find({ category: id })
        res.status(200).json({
            filteredTurf
        })
    } catch (error) {
        console.log(error.message)
    }
})

export const paymentRequest = asyncHandler(async (req, res) => {
    try {
        const userId = req.user
        if (userId) {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
            const { price } = req.params
            const payment = await stripe.paymentIntents.create({
                amount: price * 100,
                currency: 'inr',
                metadata: {
                    userId: userId._id.toString(),
                }
            })
            const newPayment = new Payment({
                paymentId: payment.id,
                userId: userId._id.toString()
            })
            await newPayment.save()
            res.status(201).send({
                clientSecret: payment
            })
        } else {
            res.status(400).json({
                message: 'You have to be logged in..!!'
            })
        }
    } catch (error) {
        console.log(error.message)
    }
})

export const bookTurf = asyncHandler(async (req, res) => {
    try {
        const userId = req.user
        if (userId) {
            const { id, price, date, paymentId, team } = req.body
            const booking = await Booking.findOne({ turfId: id, date: date })
            const turf = await Turf.findOne({ _id: id })
            if (booking) {
                res.status(405).json({
                    message: 'The turf has already been booked by another user at this time.'
                })
            } else {
                const bookingData = new Booking({
                    userId: userId._id.toString(),
                    turfId: id,
                    price: price,
                    date: date,
                    paymentId: paymentId,
                    team: team
                })
                const provider = await Provider.findById({ _id: turf.vendor.toString() })
                const admin = await User.findOne({ isAdmin: true })
                const adminProfit = price * 10 / 100
                admin.wallet += adminProfit
                provider.wallet += price - adminProfit
                await admin.save()
                await provider.save()
                await bookingData.save()
                res.status(200).json({
                    bookingData
                })
            }
        } else {
            res.status(400).json({
                message: 'You have to be logged in..!!'
            })
        }
    } catch (error) {
        console.log(error.message)
    }
})

export const isBooked = asyncHandler(async (req, res) => {
    try {
        const userId = req.user
        if (userId) {
            const { id, date } = req.params
            const alreadyBooked = await Booking.findOne({ date: date, turfId: id })
            res.status(200).json({
                alreadyBooked
            })
        } else {
            res.status(400).json({
                message: 'You have to be logged in..!!'
            })
        }
    } catch (error) {
        console.log(error.message)
    }
})


export const bookedTurfs = asyncHandler(async (req, res) => {
    try {
        const userId = req.user
        if (userId) {
            const booked = await Booking.find({ userId: userId._id.toString() })
            const bookedTurf = booked.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            const turfId = bookedTurf.map(turf => turf.turfId.toString())
            let turfs = []
            for (let i = 0; i < turfId.length; i++) {
                turfs[i] = await Turf.findById({ _id: turfId[i] })
            }
            const combinedData = bookedTurf.map((booking, index) => ({
                bookedInfo: booking,
                turfInfo: turfs[index],
            }));
            res.status(200).json({
                bookedTurf: combinedData
            })
        } else {
            res.status(400).json({
                message: 'You have to be logged in..!!'
            })
        }
    } catch (error) {
        console.log(error.message)
    }
})

export const cancelBooking = asyncHandler(async (req, res) => {
    try {
        const userId = req.user
        if (userId) {
            const booking = await Booking.findById(req.body.id);
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
            const refund = await stripe.refunds.create({
                payment_intent: booking.paymentId
            });
            const user = await User.findById(userId._id.toString());
            const turf = await Turf.findById({ _id: booking.turfId })
            if (user) {
                const wallet = new Wallet({
                    userId: userId._id.toString(),
                    transaction: `Cancelled Booking of Turf ${turf.name} on ${booking.date}`,
                    amount: refund.amount / 100
                })
                await wallet.save();
                user.wallet += refund.amount / 100
                await user.save();
            }
            booking.booking = `Cancelled by ${userId.name}`;
            await booking.save();
            res.status(201).json({
                booking
            })
        } else {
            res.status(400).json({
                message: 'You have to be logged in..!!'
            })
        }
    } catch (error) {
        console.log('Error refunding payment or updating user/booking:', error);
    }
})


export const getWalletDetails = asyncHandler(async (req, res) => {
    try {
        const userId = req.user
        if (userId) {
            const wallet = await Wallet.find({ userId: userId._id.toString() })
            res.status(200).json({
                wallet
            })
        } else {
            res.status(400).json({
                message: 'You have to be logged in..!!'
            })
        }
    } catch (error) {
        console.log(error.message)
    }
})

export const getWalletAmount = asyncHandler(async (req, res) => {
    try {
        const userId = req.user
        if (userId) {
            const userData = await User.findOne({ _id: userId._id.toString() })
            const walletAmount = userData.wallet
            res.status(200).json({
                walletAmount
            })
        } else {
            res.status(400).json({
                message: 'You have to be logged in..!!'
            })
        }
    } catch (error) {
        console.log(error.message)
    }
})

export const bookTurfWallet = asyncHandler(async (req, res) => {
    try {
        const userId = req.user
        if (userId) {
            const { id, price, date, team } = req.body
            const booking = await Booking.findOne({ turfId: id, date: date })
            const turf = await Turf.findOne({ _id: id })
            if (booking) {
                res.status(405).json({
                    message: 'The turf has already been booked by another user at this time.'
                })
            } else {
                const bookingData = new Booking({
                    userId: userId._id.toString(),
                    turfId: id,
                    price: price,
                    date: date,
                    team: team
                })
                const provider = await Provider.findById({ _id: turf.vendor.toString() })
                const userData = await User.findById({ _id: userId._id.toString() })
                userData.wallet -= price
                await userData.save()
                const wallet = new Wallet({
                    userId: userId._id.toString(),
                    transaction: `Booked Turf ${turf.name} on ${date}`,
                    amount: price
                })
                await wallet.save()
                const admin = await User.findOne({ isAdmin: true })
                const adminProfit = price * 10 / 100
                admin.wallet += adminProfit
                provider.wallet += price - adminProfit
                await admin.save()
                await provider.save()
                await bookingData.save()
                res.status(200).json({
                    bookingData
                })
            }
        } else {
            res.status(400).json({
                message: 'You have to be logged in..!!'
            })
        }
    } catch (error) {
        console.log(error.message)
    }
})

export const setNotification = asyncHandler(async (req, res) => {
    try {
        const userId = req.user
        if (userId) {
            const { message } = req.body
            const notification = new Notification({
                chatId: message.chatId._id,
                content: message.content,
                sender: message.senderId,
                recipient: userId._id.toString()
            })
            await notification.save()
            res.status(200).json({
                notification
            })
        } else {
            res.status(400).json({
                message: 'You have to be logged in..!!'
            })
        }
    } catch (error) {
        console.log(error.message)
    }
})

export const getNotification = asyncHandler(async (req, res) => {
    try {
        const userId = req.user
        if (userId) {
            const notification = await Notification.find({ recipient: userId._id.toString() })
            res.status(200).json({
                notification
            })
        } else {
            res.status(400).json({
                message: 'You have to be logged in..!!'
            })
        }
    } catch (error) {
        console.log(error.message)
    }
})

export const updateNotification = asyncHandler(async (req, res) => {
    try {
        const userId = req.user
        if (userId) {
            const notificationData = await Notification.findOne({ _id: req.body.id })
            notificationData.read = true
            await notificationData.save()
            res.status(200).json({
                notificationData
            })
        } else {
            res.status(400).json({
                message: 'You have to be logged in..!!'
            })
        }
    } catch (error) {
        console.log(error.message)
    }
})