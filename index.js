const app = require('./app');
const port = process.env.PORT || 5000;

app.get('/', (req, res)=>{
   res.status(200).json({
       message: 'working'
   })
});


app.listen(port, () => {
    console.log(`server has been started on ${port}`)
});
