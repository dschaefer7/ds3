express = require('express');
const authRoutes = require('./routes/auth');
const awbRoutes = require('./routes/awb');
const bodyParser= require('body-parser');
const app = express();

app.use(express.static('client'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/api/awb', awbRoutes);
app.use('/api/auth', authRoutes);


module.exports = app;
