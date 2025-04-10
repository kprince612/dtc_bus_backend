const express = require ("express");
const mongoose = require ("mongoose");
const bodyParser = require ("body-parser");
const cors = require ("cors");
const nodemailer = require ("nodemailer");
const app = express ();
const PORT = 5000;

app.use(cors({ origin: "*" }));
app.use (express.json ());

app.use (bodyParser.json ());

mongoose.connect ("mongodb+srv://p684188:Prince%40123456@cluster0.c3uta.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/DTC_Data", {
})
    .then (() => console.log ("connected to Mongodb"))
    .catch ((err) => console.log ("Mongodb connection error", err));

const signupUserSchema = new mongoose.Schema ({
    name: String,
    email: String,
    password: String,
})

const signupUser = mongoose.model ('SignUpUser', signupUserSchema);

app.post ('/api/signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await signupUser.find({ email });
        
        if (existingUser.length > 0) {
            return res.status (400).json ({error: "user already exist"});
        }
        const newsignupUser = new signupUser ({ name, email, password });
        const savedsignupdata = await newsignupUser.save ();
        res.status (200).json (savedsignupdata);
    }

    catch (err) {
        res.status (500).json ({error: "failed to save signup data"});
    }
})

app.post ("/api/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await signupUser.findOne ({ email });

        if (!user) {
            return res.status (400).json ({error: "user not found, signup first"});
        }

        console.log (password);
        console.log (user.password);

        if (password != user.password) {
            return res.status (401).json ({message: "invalid password"});
        }

        res.status (200).json ({message: "login successful", user});
    }

    catch (err) {
        res.status(500).json ({error: "server error"});
    }
})

const bookingUserSchema = new mongoose.Schema ({
    id: String,
    name: String,
    email: String,
    phone: Number,
    from: String,
    to: String,
    date: String,
    time: String,
})

const bookingUser = mongoose.model ('bookingUser', bookingUserSchema);

app.post ('/api/booking', async (req, res) => {
    const { id, name, email, phone, from, to, date, time } = req.body;
    const user = await signupUser.findOne ({ email });

    if (!user) {
        return res.status (409).json ({ message: "user not exist"});
    }
    const newbookingdata = new bookingUser ({ id, name, email, phone, from, to, date, time });

    try {
        const savedbookingdata = await newbookingdata.save ();
        res.status (200).json ({message: "booking successfully", ticket: savedbookingdata});
    }

    catch (err) {
        res.status (500).json ({error: "failed to booking ticket"});
    }
})

app.post ("/api/fetchBookings", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await signupUser.findOne ({ email });

        if (!user) {
            return res.status (400).json ({ error: "user not found, please sign up"});
        }

        if (password != user.password) {
            return res.status (401).json ({ message: "invalid password"})
        }

        const userBookings = await bookingUser.find ({ email });

        // if (userBookings.length === 0) {
        //     res.status (404).json ({ message: "no booking is found"});
        // }

        res.status (200).json (userBookings);

        console.log (userBookings);
    }

    catch (err) {
        res.status (500).json ({ error: "server error"});
    }
})

app.post ("/api/send-booking-info", async (req, res) => {
    const { name, email, phone, from, to, date, time} = req.body;

    if (!email) {
        return res.status (405).json ({message: "enter email"});
    }

    const transporter = nodemailer.createTransport ({
        service: 'gmail',
        auth: {
            user: "princekhandelwal412@gmail.com",
            pass: "eabz jnzt cjpz fdtw",
        },
    });

    const mailOptions = {
        from: "princekhandelwal412@gmail.com",
        to: email,
        subject: "Your Booking Details",
        html: `<p>Welcome to DTC Delhi</p>
        <h2>Your Booking Details</h2>
        <p>name: <strong>${name}</strong></p>
        <p>phone: <strong>${phone}</strong></p>
        <p>From: <strong>${from}</strong> to: <strong>${to}</strong></p>
        <p>Date: <strong>${date}</strong></p>
        <p>Time: <strong>${time}</strong></p>`,
    };

    try {
        await transporter.sendMail (mailOptions);
        return res.status (201).json ({message: "booking details is sent to email"});
    }

    catch (error) {
        console.error (error);
        res.status (500).json ({message: "failed to send message"});
    }
})

const reviewSchema = new mongoose.Schema ({
    name: String,
    email: String,
    review: String,
})

const reviewData = mongoose.model ("reviewData", reviewSchema);

app.post ("/api/reviews", async (req, res) => {
    const { name, email, review } = req.body;

    try {
        const existingUser = await signupUser.findOne ({ email });

        if (!existingUser) {
            return res.status (405).json ({message: "user not exist, signup first"});
        }

        const newreviewData = new reviewData ({ name, email, review });
        const savedreviewData = await newreviewData.save ();
        res.status (200).json (savedreviewData);
    }

    catch (err) {
        res.status (500).json ({ error: "failed to save review data"});
    }
})

// Fetch booking data based on different parameters
const fetchBookingData = async (filter, res) => {
  try {
    console.log("Query filter:", filter);
    const userBooking = await bookingUser.find(filter);

    if (!userBooking || userBooking.length === 0) {
      return res.status(404).json({ message: "No details found" });
    }

    res.status(200).json(userBooking);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Fetch by Name
app.post("/api/fetchData/name", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  fetchBookingData({ name }, res);
});

// Fetch by Email
app.post("/api/fetchData/email", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });
  fetchBookingData({ email }, res);
});

// Fetch by Phone
app.post("/api/fetchData/phone", async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone is required" });
  fetchBookingData({ phone }, res);
});

// Fetch by Date
app.post("/api/fetchData/date", async (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: "Date is required" });
  fetchBookingData({ date }, res);
});

app.post ("/api/fetchData/id", async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status (400).json ({ error: "ticket id is required"});
    }

    fetchBookingData ({ id }, res);
})

const adminSignupSchema = new mongoose.Schema ({
    admin_id: String,
    password: String,
})

const adminsignup = mongoose.model ("adminSignup", adminSignupSchema);

app.post ("/api/adminsignup", async (req, res) => {
    const { admin_id, password } = req.body;

    try {
        const existingAdmin = await adminsignup.findOne ({ admin_id });

        if (existingAdmin) {
            return res.status (405).json ({ message: "admin already exist, please login as a admin"});
        }

        const newadminsignup = new adminsignup ({ admin_id, password });
        const savedadminsignup = await newadminsignup.save ();

        return res.status (200).json (savedadminsignup);
    }

    catch (err) {
        console.log ("error in sign up");
        res.status (500).json ({ error: "error in sign up:", err});
    }
})

app.post ("/api/loginData", async (req, res) => {
    const { admin_id, password } = req.body;

    try {
        const adminData = await adminsignup.findOne ({ admin_id });

        if (!adminData) {
            return res.status (400).json ({ error: "admin not found" });
        }

        if (password != adminData.password) {
            return res.status (409).json ({ message: "invalid password"});
        }

        res.status (200).json ({ message: "Admin login successful", adminData});
    }

    catch (err) {
        res.status (500).json ({ error: "server error" });
    }
})

const addbusSchema = new mongoose.Schema ({
    bus_name: String,
    from: String,
    to: String,
    time: String,
})

const addbusData = mongoose.model ("addbus", addbusSchema);

app.post ("/api/addbusdata", async (req, res) => {
    const { bus_name, from, to, time } = req.body;

    const newaddBus = new addbusData ({ bus_name, from, to, time });

    try {
        const savedaddbus = await newaddBus.save ();
        return res.status (200).json ({ message: "new bus add successfully"});
    }

    catch (err) {
        res.status (500).json ({ error: "failed to add bus "});
    }
})

app.post ("/api/fetchbusdata", async (req, res) => {
    try {
        const availablebus = await addbusData.find ({ });

        if (!availablebus) {
            return res.status (409).json ({ message: "no bus available" });
        }

        console.log (availablebus);
        return res.status (200).json (availablebus);
    }

    catch (err) {
        console.log ("server error:", err);
        res.status (500).json ({ error: "server error"});
    }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// const express = require ("express");
// const mongoose = require ("mongoose");
// const bodyParser = require ("body-parser");
// const cors = require ("cors");
// const nodemailer = require ("nodemailer");
// const app = express ();
// const PORT = 5000;

// app.use (cors());
// app.use (express.json ());

// app.use (bodyParser.json ());

// mongoose.connect ("mongodb://127.0.0.1:27017/DTC_Data", {
// })
//     .then (() => console.log ("connected to Mongodb"))
//     .catch ((err) => console.log ("Mongodb connection error", err));

// const signupUserSchema = new mongoose.Schema ({
//     name: String,
//     email: String,
//     password: String,
// })

// const signupUser = mongoose.model ('SignUpUser', signupUserSchema);

// app.post ('/api/signup', async (req, res) => {
//     const { name, email, password } = req.body;

//     try {
//         const existingUser = await signupUser.findOne ({ email });

//         if (existingUser) {
//             return res.status (200).json ({error: "user already exist"});
//         }
//         const newsignupUser = new signupUser ({ name, email, password });
//         const savedsignupdata = await newsignupUser.save ();
//         res.status (200).json (savedsignupdata);
//     }

//     catch (err) {
//         res.status (500).json ({error: "failed to save signup data"});
//     }
// })

// app.post ("/api/login", async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         const user = await signupUser.findOne ({ email });

//         if (!user) {
//             return res.status (400).json ({error: "user not found, signup first"});
//         }

//         console.log (password);
//         console.log (user.password);

//         if (password != user.password) {
//             return res.status (401).json ({message: "invalid password"});
//         }

//         res.status (200).json ({message: "login successful", user});
//     }

//     catch (err) {
//         res.status(500).json ({error: "server error"});
//     }
// })

// const bookingUserSchema = new mongoose.Schema ({
//     id: String,
//     name: String,
//     email: String,
//     phone: Number,
//     from: String,
//     to: String,
//     date: String,
//     time: String,
// })

// const bookingUser = mongoose.model ('bookingUser', bookingUserSchema);

// app.post ('/api/booking', async (req, res) => {
//     const { id, name, email, phone, from, to, date, time } = req.body;
//     const user = await signupUser.findOne ({ email });

//     if (!user) {
//         return res.status (409).json ({ message: "user not exist"});
//     }
//     const newbookingdata = new bookingUser ({ id, name, email, phone, from, to, date, time });

//     try {
//         const savedbookingdata = await newbookingdata.save ();
//         res.status (200).json ({message: "booking successfully", ticket: savedbookingdata});
//     }

//     catch (err) {
//         res.status (500).json ({error: "failed to booking ticket"});
//     }
// })

// app.post ("/api/fetchBookings", async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         const user = await signupUser.findOne ({ email });

//         if (!user) {
//             return res.status (400).json ({ error: "user not found, please sign up"});
//         }

//         if (password != user.password) {
//             return res.status (401).json ({ message: "invalid password"})
//         }

//         const userBookings = await bookingUser.find ({ email });

//         // if (userBookings.length === 0) {
//         //     res.status (404).json ({ message: "no booking is found"});
//         // }

//         res.status (200).json (userBookings);

//         console.log (userBookings);
//     }

//     catch (err) {
//         res.status (500).json ({ error: "server error"});
//     }
// })

// app.post ("/api/send-booking-info", async (req, res) => {
//     const { name, email, phone, from, to, date, time} = req.body;

//     if (!email) {
//         return res.status (405).json ({message: "enter email"});
//     }

//     const transporter = nodemailer.createTransport ({
//         service: 'gmail',
//         auth: {
//             user: "princekhandelwal412@gmail.com",
//             pass: "fwpz chtd rqax ctct",
//         },
//     });

//     const mailOptions = {
//         from: "princekhandelwal412@gmail.com",
//         to: email,
//         subject: "Your Booking Details",
//         html: `<p>Welcome to DTC Delhi</p>
//         <h2>Your Booking Details</h2>
//         <p>name: <strong>${name}</strong></p>
//         <p>phone: <strong>${phone}</strong></p>
//         <p>From: <strong>${from}</strong> to: <strong>${to}</strong></p>
//         <p>Date: <strong>${date}</strong></p>
//         <p>Time: <strong>${time}</strong></p>`,
//     };

//     try {
//         await transporter.sendMail (mailOptions);
//         return res.status (201).json ({message: "booking details is sent to email"});
//     }

//     catch (error) {
//         console.error (error);
//         res.status (500).json ({message: "failed to send message"});
//     }
// })

// const reviewSchema = new mongoose.Schema ({
//     name: String,
//     email: String,
//     review: String,
// })

// const reviewData = mongoose.model ("reviewData", reviewSchema);

// app.post ("/api/reviews", async (req, res) => {
//     const { name, email, review } = req.body;

//     try {
//         const existingUser = await signupUser.findOne ({ email });

//         if (!existingUser) {
//             return res.status (405).json ({message: "user not exist, signup first"});
//         }

//         const newreviewData = new reviewData ({ name, email, review });
//         const savedreviewData = await newreviewData.save ();
//         res.status (200).json (savedreviewData);
//     }

//     catch (err) {
//         res.status (500).json ({ error: "failed to save review data"});
//     }
// })

// app.post ("/api/fetchData/name", async (req, res) => {
//     const { name } = req.body;

//     try {
//         const userBooking = await bookingUser.find ({ name });

//         if (!userBooking) {
//             return res.status (405).json ("no details found");
//         }

//         res.status (200).json (userBooking);

//         console.log (userBooking);
//     }

//     catch (err) {
//         res.status (500).json ({ error: "server error"});
//     }
// })

// app.post ("/api/fetchData/email", async (req, res) => {
//     const { email } = req.body;

//     try {
//         const userBooking = await bookingUser.find ({ email });

//         if (!userBooking) {
//             return res.status (405).json ("no details found");
//         }

//         res.status (200).json (userBooking);

//         console.log (userBooking);
//     }

//     catch (err) {
//         res.status (500).json ({ error: "server error"});
//     }
// })

// app.post ("/api/fetchData/phone", async (req, res) => {
//     const { phone } = req.body;

//     try {
//         const userBooking = await bookingUser.find ({ phone });

//         if (!userBooking) {
//             return res.status (405).json ("no details found");
//         }

//         res.status (200).json (userBooking);

//         console.log (userBooking);
//     }

//     catch (err) {
//         res.status (500).json ({ error: "server error"});
//     }
// })

// app.post ("/api/fetchData/date", async (req, res) => {
//     const { date } = req.body;

//     try {
//         const userBooking = await bookingUser.find ({ date });

//         if (!userBooking) {
//             return res.status (405).json ("no details found");
//         }

//         res.status (200).json (userBooking);

//         console.log (userBooking);
//     }

//     catch (err) {
//         res.status (500).json ({ error: "server error"});
//     }
// })
// app.listen (PORT, () => {
//     console.log (`server is running at port ${PORT}`);
// })
