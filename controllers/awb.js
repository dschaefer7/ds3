const knex = require('knex')(require('../database/knex'));


module.exports.awb = function (req, res) {
    let awbnr=req.body.awbnr;

    knex('awb')
        .where('AWB_Num', awbnr)
        //.from('awb')
        .then((data)=>{
            console.log(data);
            res.status(200).json(data)
        });


};
