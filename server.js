// importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';

// app config
const app = express();
const port = process.env.PORT || 9000

const pusher = new Pusher({
    appId: "1114619",
    key: "58e74c6400f56cdd42a8",
    secret: "86c3ccdb8bf6161b420c",
    cluster: "eu",
    useTLS: true
  });

// middleware
app.use(express.json());
app.use(cors());

// app.use((req,res, next) => {
//     res.setHeader("Access-Control_Allow_Origin","*");
//     res.setHeader("Access-Control_Allow_Headers","*");
//     next();
// })

// DB config
const connection_url = 
'mongodb+srv://admin:baPTtlbLbYoWqvQA@cluster0.pknp5.mongodb.net/whatsappdb?retryWrites=true&w=majority'

mongoose.connect(connection_url,{
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// ????
const db = mongoose.connection

db.once('open', () => {
    console.log("DB CONNECTED")

    const msgCollection = db.collection('messagecontents')
    const changeStream = msgCollection.watch()

    changeStream.on('change', (change) => {
        console.log(change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted',
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp, 
                    received: messageDetails.received,                     timestamp: messageDetails.timestamp,  
                }
            );
        } else {
            console.log('Error triggering Pusher')
        }

    });
});
//api routes
app.get('/',(req,res)=>res.status(200).send('hello world'))

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            req.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) =>{
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
})
//listen
app.listen(port, ()=>console.log(`Listening on localhost:${port}`));