express = require('express');
const authRoutes = require('./routes/auth');
const awbRoutes = require('./routes/awb');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

app.use(express.static('client'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/api/awb', awbRoutes);
app.use('/api/auth', authRoutes);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/dist/client'));

    app.get('*', (req, res) => {
        res.sendFile(
            path.resolve(
                __dirname, 'client', 'dist', 'client', 'index.html'
            )
        )
    })
}


module.exports = app;
