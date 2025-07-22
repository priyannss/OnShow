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
        // await resend.emails.send({
        //     from: 'OnShow <onboarding@resend.dev>',
        //     to: booking.user.email,
        //     subject: `Booking Confirmation: ${booking.show.movie.title} booked!`,
        //     html: `
        //         <div style="
        //             font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        //             line-height: 1.6; 
        //             max-width: 600px; 
        //             margin: 0 auto; 
        //             background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
        //             border-radius: 12px;
        //             overflow: hidden;
        //             box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        //         ">
        //             <!-- Header -->
        //             <div style="
        //                 background: linear-gradient(135deg, #F84565 0%, #ff6b6b 100%); 
        //                 padding: 30px 40px; 
        //                 text-align: center;
        //                 color: white;
        //             ">
        //                 <span style="
        //                         font-size: 20px;
        //                         font-weight: 700;
        //                     ">OnShow</span>

        //                 <h1 style="
        //                     margin: 0; 
        //                     font-size: 28px; 
        //                     font-weight: bold;
        //                     text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        //                 ">🎬 Booking Confirmed!</h1>
        //                 <p style="
        //                     margin: 10px 0 0 0; 
        //                     font-size: 16px; 
        //                     opacity: 0.9;
        //                 ">Your movie experience awaits</p>
        //             </div>

        //             <!-- Content -->
        //             <div style="padding: 40px;">
        //                 <h2 style="
        //                     color: #2d3436; 
        //                     font-size: 24px; 
        //                     margin: 0 0 20px 0;
        //                     font-weight: 600;
        //                 ">Hi ${booking.user.name}! 👋</h2>

        //                 <p style="
        //                     color: #636e72; 
        //                     font-size: 16px; 
        //                     margin: 0 0 30px 0;
        //                 ">Your booking for the show <strong style="
        //                     color: #F84565; 
        //                     font-size: 18px;
        //                     background: linear-gradient(135deg, #F84565, #ff6b6b);
        //                     -webkit-background-clip: text;
        //                     -webkit-text-fill-color: transparent;
        //                     background-clip: text;
        //                 ">${booking.show.movie.title}</strong> has been confirmed!</p>

        //                 <!-- Booking Details Card -->
        //                 <div style="
        //                     background: white;
        //                     border-radius: 12px;
        //                     padding: 25px;
        //                     margin: 25px 0;
        //                     box-shadow: 0 5px 20px rgba(248, 69, 101, 0.1);
        //                     border-left: 4px solid #F84565;
        //                 ">
        //                     <h3 style="
        //                         color: #2d3436;
        //                         margin: 0 0 20px 0;
        //                         font-size: 18px;
        //                         font-weight: 600;
        //                     ">📅 Show Details</h3>

        //                     <div style="
        //                         display: grid;
        //                         gap: 15px;
        //                     ">
        //                         <div style="
        //                             display: flex;
        //                             justify-content: space-between;
        //                             align-items: center;
        //                             padding: 12px 0;
        //                             border-bottom: 1px solid #e8eaed;
        //                         ">
        //                             <strong style="color: #636e72; font-size: 14px;">📆 DATE:</strong> 
        //                             <span style="
        //                                 color: #2d3436; 
        //                                 font-weight: 600; 
        //                                 font-size: 16px;
        //                             ">${new Date(booking.show.showDateTime).toLocaleDateString('en-US', {timeZone: 'Asia/Kolkata'})}</span>
        //                         </div>

        //                         <div style="
        //                             display: flex;
        //                             justify-content: space-between;
        //                             align-items: center;
        //                             padding: 12px 0;
        //                         ">
        //                             <strong style="color: #636e72; font-size: 14px;">⏰ TIME:</strong> 
        //                             <span style="
        //                                 color: #2d3436; 
        //                                 font-weight: 600; 
        //                                 font-size: 16px;
        //                             ">${new Date(booking.show.showDateTime).toLocaleTimeString('en-US', {timeZone: 'Asia/Kolkata'})}</span>
        //                         </div>
        //                     </div>
        //                 </div>

        //                 <!-- Fun Message -->
        //                 <div style="
        //                     background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
        //                     border-radius: 12px;
        //                     padding: 25px;
        //                     text-align: center;
        //                     margin: 25px 0;
        //                     border: 2px dashed #F84565;
        //                 ">
        //                     <p style="
        //                         font-size: 18px; 
        //                         margin: 0; 
        //                         color: #2d3436;
        //                         font-weight: 600;
        //                     ">Enjoy the show! 🍿✨</p>
        //                     <p style="
        //                         font-size: 14px; 
        //                         margin: 10px 0 0 0; 
        //                         color: #636e72;
        //                     ">Don't forget to grab some snacks!</p>
        //                 </div>

        //                 <!-- Thank You Message -->
        //                 <div style="
        //                     text-align: center;
        //                     margin: 30px 0;
        //                 ">
        //                     <p style="
        //                         color: #2d3436; 
        //                         font-size: 16px; 
        //                         font-weight: 600;
        //                         margin: 0;
        //                     ">Thank you for choosing <span style="
        //                         color: #F84565;
        //                         font-weight: 700;
        //                         background: linear-gradient(135deg, #F84565, #ff6b6b);
        //                         -webkit-background-clip: text;
        //                         -webkit-text-fill-color: transparent;
        //                         background-clip: text;
        //                     ">OnShow</span>! 🎭</p>
        //                     <p style="
        //                         color: #636e72; 
        //                         font-size: 14px; 
        //                         margin: 8px 0 0 0;
        //                     ">We hope you have an amazing movie experience</p>
        //                 </div>
        //             </div>

        //             <!-- Footer -->
        //             <div style="
        //                 background: #2d3436;
        //                 padding: 25px 40px;
        //                 text-align: center;
        //                 color: white;
        //             ">
        //                 <p style="
        //                     margin: 0;
        //                     font-size: 12px;
        //                     opacity: 0.8;
        //                 ">© 2025 OnShow • Making movie experiences memorable</p>
        //                 <p style="
        //                     margin: 10px 0 0 0;
        //                     font-size: 11px;
        //                     opacity: 0.6;
        //                 ">Need help? Contact us at support@onshow.com</p>
        //             </div>
        //         </div>
        //     `
        // })

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
                        <span style="
                                font-size: 20px;
                                font-weight: 700;
                            ">OnShow</span>
                        
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
                        ">Your booking for the show <strong style="
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
                                    ">${new Date(booking.show.showDateTime).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}</span>
                                </div>
                                
                                <div style="
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    padding: 12px 0;
                                    margin-top: 10px;
                                ">
                                    <strong style="color: #636e72; font-size: 14px;">⏰ TIME:</strong> 
                                    <span style="
                                        color: #2d3436; 
                                        font-weight: 600; 
                                        font-size: 16px;
                                    ">${new Date(booking.show.showDateTime).toLocaleTimeString('en-US', {
                        timeZone: 'Asia/Kolkata',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    })}</span>
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
                            <p style="
                                color: #2d3436; 
                                font-size: 16px; 
                                font-weight: 600;
                                margin: 0;
                            ">Thank you for choosing <span style="
                                color: #F84565;
                                font-weight: 700;
                                background: linear-gradient(135deg, #F84565, #ff6b6b);
                                -webkit-background-clip: text;
                                -webkit-text-fill-color: transparent;
                                background-clip: text;
                            ">OnShow</span>! 🎭</p>
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


// Inngest function to send reminders
const sendShowReminders = inngest.createFunction(
    { id: 'send-show-reminders' },
    { cron: '0 */8 * * *' }, // Every 8 hours
    async ({ step }) => {
        const now = new Date();
        const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000);
        const windowStart = new Date(in8Hours.getTime() - 10 * 60 * 1000); // 10 minutes before the show

        // prepare reminder tasks
        const reminderTasks = await step.run("prepare-reminder-tasks", async () => {
            const shows = await Show.find({
                showTime: { $gte: windowStart, $lte: in8Hours }
            }).populate('movie');

            const tasks = [];

            for (const show of shows) {
                if (!show.movie || !show.occupiedSeats) continue;

                const userIds = [...new Set(Object.values(show.occupiedSeats))]

                if (userIds.length === 0) continue;

                const users = await User.find({ _id: { $in: userIds } }).select("name email");

                for (const user of users) {
                    tasks.push({
                        userEmail: user.email,
                        userName: user.email,
                        movieTitle: show.movie.title,
                        showTime: show.showTime
                    })
                }
            }

            return tasks;
        })

        if (reminderTasks.length === 0) {
            return { sent: 0, message: "No reminders to send." }
        }

        // send reminder email
        const results = await step.run('send-all-reminders', async () => {
            return await Promise.allSettled(
                reminderTasks.map((task) => resend.emails.send({
                    from: 'OnShow <onboarding@resend.dev>',
                    to: task.userEmail,
                    subject: `Reminder: Your show ${task.movieTitle} starts soon!`,
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
                                <span style="
                                    font-size: 20px;
                                    font-weight: 700;
                                ">OnShow</span>
                                
                                <h1 style="
                                    margin: 0; 
                                    font-size: 28px; 
                                    font-weight: bold;
                                    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                ">⏰ Show Reminder!</h1>
                                <p style="
                                    margin: 10px 0 0 0; 
                                    font-size: 16px; 
                                    opacity: 0.9;
                                ">Your show starts in a few hours</p>
                            </div>
                            
                            <!-- Content -->
                            <div style="padding: 40px;">
                                <h2 style="
                                    color: #2d3436; 
                                    font-size: 24px; 
                                    margin: 0 0 20px 0;
                                    font-weight: 600;
                                ">Hi ${task.userName}! 👋</h2>
                                
                                <p style="
                                    color: #636e72; 
                                    font-size: 16px; 
                                    margin: 0 0 30px 0;
                                ">This is a friendly reminder about your upcoming show <strong style="
                                    color: #F84565; 
                                    font-size: 18px;
                                    background: linear-gradient(135deg, #F84565, #ff6b6b);
                                    -webkit-background-clip: text;
                                    -webkit-text-fill-color: transparent;
                                    background-clip: text;
                                ">${task.movieTitle}</strong></p>
                                
                                <!-- Show Time Alert -->
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
                                    ">🕒 Show Time Approaching</h3>
                                    
                                    <div style="
                                        display: flex;
                                        justify-content: center;
                                        align-items: center;
                                        padding: 15px;
                                        background: #f8f9fa;
                                        border-radius: 8px;
                                    ">
                                        <span style="
                                            color: #2d3436;
                                            font-size: 20px;
                                            font-weight: 600;
                                        ">${new Date(task.showTime).toLocaleString('en-US', {
                        timeZone: 'Asia/Kolkata',
                        dateStyle: 'full',
                        timeStyle: 'short'
                    })}</span>
                                    </div>
                                </div>
                                
                                <!-- Reminder Message -->
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
                                    ">Getting Ready! 🎬✨</p>
                                    <p style="
                                        font-size: 14px; 
                                        margin: 10px 0 0 0; 
                                        color: #636e72;
                                    ">Arrive early to get the best experience!</p>
                                </div>
                                
                                <!-- Additional Info -->
                                <div style="
                                    text-align: center;
                                    margin: 30px 0;
                                ">
                                    <p style="
                                        color: #2d3436; 
                                        font-size: 16px; 
                                        font-weight: 600;
                                        margin: 0;
                                    ">See you at <span style="
                                        color: #F84565;
                                        font-weight: 700;
                                        background: linear-gradient(135deg, #F84565, #ff6b6b);
                                        -webkit-background-clip: text;
                                        -webkit-text-fill-color: transparent;
                                        background-clip: text;
                                    ">OnShow</span>! 🎭</p>
                                    <p style="
                                        color: #636e72; 
                                        font-size: 14px; 
                                        margin: 8px 0 0 0;
                                    ">Don't forget your booking confirmation</p>
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
                }))
            )
        })

        const sent = results.filter((result) => result.status === "fulfilled").length;
        const failed = results.length - sent;

        return {
            sent,
            failed,
            message: `Sent ${sent} reminder(s), ${failed} failed.`
        }
    }
)


export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    releaseSeatsAndDeleteBooking,
    sendBookingConfirmationEmail,
    sendShowReminders
];