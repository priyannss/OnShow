import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"


const app = express();
const PORT = 3000;


await connectDB();


// Middleware
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware())


// Api routes
app.get('/', (req, res) => {
    res.send('Server is live!');
})
app.use('/api/inngest', serve({ client: inngest, functions }));

app.listen(PORT, ()=> console.log(`Server is listening on PORT: ${PORT}`))

