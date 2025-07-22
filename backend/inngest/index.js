import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import { Resend } from 'resend';

export const inngest = new Inngest({ id: "movie-ticket-booking" });
const resend = new Resend(process.env.RESEND_API_KEY)


// Inngest fuction to save user data to database
const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk' },
    { event: 'clerk/user.created' },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data

        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + " " + last_name,
            image: image_url
        }

        // now store this data in user database
        await User.create(userData);
    }
)


// Inngest function to delete user from database
const syncUserDeletion = inngest.createFunction(
    { id: 'delete-user-with-clerk' },
    { event: 'clerk/user.deleted' },
    async ({ event }) => {
        const { id } = event.data

        await User.findByIdAndDelete(id);
    }
)

// Inngest function to update user data in database
const syncUserUpdation = inngest.createFunction(
    { id: 'update-user-from-clerk' },
    { event: 'clerk/user.updated' },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + " " + last_name,
            image: image_url
        }

        await User.findByIdAndUpdate(id, userData);
    }
)

// Ingest function to cancel booking and release seats of show after 10 minutes of booking created if payments is not made
const releaseSeatsAndDeleteBooking = inngest.createFunction(
    { id: 'release-seats-delete-booking' },
    { event: 'app/checkPayment' }, // correct it later accordingly
    async ({ event, step }) => {
        const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
        await step.sleepUntil('wait-for-10-minutes', tenMinutesLater);

        await step.run('check-payment-status', async () => {
            const bookingId = event.data.bookingId;

            const booking = await Booking.findById(bookingId)

            // If payment is not made , release seats and delete booking
            if (!booking.isPaid) {
                const show = await Show.findById(booking.show)
                booking.bookedSeats.forEach((seat) => {
                    delete show.occupiedSeats[seat]
                });

                show.markModified('occupiedSeats')
                await show.save()
                await Booking.findByIdAndDelete(booking._id)
            }

        })
    }
)


// Inngest function to send email to user after booking is created
const sendBookingConfirmationEmail = inngest.createFunction(
    { id: 'send-booking-confirmation-email' },
    { event: 'app/show.booked' },
    async ({ event, step }) => {
        const { bookingId } = event.data;

        const booking = await Booking.findById(bookingId).populate({
            path: 'show',
            populate: {
                path: 'movie',
                model: 'Movie'
            }
        }).populate('user');

        // send email here using any email service
        await resend.emails.send({
            from: 'OnShow <onboarding@resend.dev>',
            to: booking.user.email,
            subject: `Booking Confirmation: ${booking.show.movie.title} booked!`,
            html: `
                <div style="
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    line-height: 1.6; 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                ">
                    <!-- Header -->
                    <div style="
                        background: linear-gradient(135deg, #F84565 0%, #ff6b6b 100%); 
                        padding: 30px 40px; 
                        text-align: center;
                        color: white;
                    ">
                        <svg width="140" height="50" viewBox="0 0 140 50" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <!-- Gradient for the accent -->
                                <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#FFE4E1;stop-opacity:1" />
                                </linearGradient>
                            </defs>
                            
                            <!-- Main text "OnShow" with modified 'O' -->
                            <text x="10" y="32" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" fill="#FFFFFF">
                                <tspan fill="url(#accentGradient)">O</tspan>n<tspan fill="url(#accentGradient)">Show</tspan>
                            </text>
                            
                            <!-- Small ticket notch cut-out in the 'O' -->
                            <rect x="18" y="20" width="3" height="2" rx="1" fill="#FFFFFF" opacity="0.9"/>
                            <rect x="18" y="28" width="3" height="2" rx="1" fill="#FFFFFF" opacity="0.9"/>
                        </svg>
                        
                        <h1 style="
                            margin: 0; 
                            font-size: 28px; 
                            font-weight: bold;
                            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        ">🎬 Booking Confirmed!</h1>
                        <p style="
                            margin: 10px 0 0 0; 
                            font-size: 16px; 
                            opacity: 0.9;
                        ">Your movie experience awaits</p>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 40px;">
                        <h2 style="
                            color: #2d3436; 
                            font-size: 24px; 
                            margin: 0 0 20px 0;
                            font-weight: 600;
                        ">Hi ${booking.user.name}! 👋</h2>
                        
                        <p style="
                            color: #636e72; 
                            font-size: 16px; 
                            margin: 0 0 30px 0;
                        ">Your booking for <strong style="
                            color: #F84565; 
                            font-size: 18px;
                            background: linear-gradient(135deg, #F84565, #ff6b6b);
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            background-clip: text;
                        ">${booking.show.movie.title}</strong> has been confirmed!</p>
                        
                        <!-- Booking Details Card -->
                        <div style="
                            background: white;
                            border-radius: 12px;
                            padding: 25px;
                            margin: 25px 0;
                            box-shadow: 0 5px 20px rgba(248, 69, 101, 0.1);
                            border-left: 4px solid #F84565;
                        ">
                            <h3 style="
                                color: #2d3436;
                                margin: 0 0 20px 0;
                                font-size: 18px;
                                font-weight: 600;
                            ">📅 Show Details</h3>
                            
                            <div style="
                                display: grid;
                                gap: 15px;
                            ">
                                <div style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    padding: 12px 0;
                                    border-bottom: 1px solid #e8eaed;
                                ">
                                    <strong style="color: #636e72; font-size: 14px;">📆 DATE:</strong> 
                                    <span style="
                                        color: #2d3436; 
                                        font-weight: 600; 
                                        font-size: 16px;
                                    ">${new Date(booking.show.date).toLocaleDateString('en-US', {timeZone: 'Asia/Kolkata'})}</span>
                                </div>
                                
                                <div style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    padding: 12px 0;
                                ">
                                    <strong style="color: #636e72; font-size: 14px;">⏰ TIME:</strong> 
                                    <span style="
                                        color: #2d3436; 
                                        font-weight: 600; 
                                        font-size: 16px;
                                    ">${new Date(booking.show.showDateTime).toLocaleTimeString('en-US', {timeZone: 'Asia/Kolkata'})}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Fun Message -->
                        <div style="
                            background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
                            border-radius: 12px;
                            padding: 25px;
                            text-align: center;
                            margin: 25px 0;
                            border: 2px dashed #F84565;
                        ">
                            <p style="
                                font-size: 18px; 
                                margin: 0; 
                                color: #2d3436;
                                font-weight: 600;
                            ">Enjoy the show! 🍿✨</p>
                            <p style="
                                font-size: 14px; 
                                margin: 10px 0 0 0; 
                                color: #636e72;
                            ">Don't forget to grab some snacks!</p>
                        </div>
                        
                        <!-- Thank You Message -->
                        <div style="
                            text-align: center;
                            margin: 30px 0;
                        ">
                            <div>
                                <span style="
                                color: #2d3436; 
                                font-size: 16px; 
                                font-weight: 600;
                                margin: 0;
                                ">Thank you for choosing</span>
                                <svg width="140" height="50" viewBox="0 0 140 50" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <!-- Gradient for the accent -->
                                        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" style="stop-color:#F84565;stop-opacity:1" />
                                        <stop offset="100%" style="stop-color:#E73956;stop-opacity:1" />
                                        </linearGradient>
                                    </defs>
                                    
                                    <!-- Main text "OnShow" with modified 'O' -->
                                    <text x="10" y="32" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" fill="#FFFFFF">
                                        <tspan fill="url(#accentGradient)">O</tspan>n<tspan fill="url(#accentGradient)">Show</tspan>
                                    </text>
                                    
                                    <!-- Small ticket notch cut-out in the 'O' -->
                                    <rect x="18" y="20" width="3" height="2" rx="1" fill="#FFFFFF" opacity="0.9"/>
                                    <rect x="18" y="28" width="3" height="2" rx="1" fill="#FFFFFF" opacity="0.9"/>
                                </svg>
                            </div>
                            <p style="
                                color: #636e72; 
                                font-size: 14px; 
                                margin: 8px 0 0 0;
                            ">We hope you have an amazing movie experience</p>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="
                        background: #2d3436;
                        padding: 25px 40px;
                        text-align: center;
                        color: white;
                    ">
                        <p style="
                            margin: 0;
                            font-size: 12px;
                            opacity: 0.8;
                        ">© 2025 OnShow • Making movie experiences memorable</p>
                        <p style="
                            margin: 10px 0 0 0;
                            font-size: 11px;
                            opacity: 0.6;
                        ">Need help? Contact us at support@onshow.com</p>
                    </div>
                </div>
            `
        })
    }
)


export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    releaseSeatsAndDeleteBooking,
    sendBookingConfirmationEmail
];