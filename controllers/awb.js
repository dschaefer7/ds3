const knex = require('knex')(require('../database/knex'));

const Eawb = require('../models/Eawb');


module.exports.awb = async function (req, res) {
    let awbnr = req.body.awbnr;

    const data = await getAwbData(awbnr);

    console.log("zopa-->", data);

    let awb = new Eawb();
    awb.AWBIdentification = data[0].IATA_Num + "-" + data[0].AWB_Num;
    //awb.AWBIdentification = 'zopa';

    console.log(awb);



    // knex('awb')
    //     .where('AWB_Num', awbnr)
    //     //.from('awb')
    //     .then((data)=>{
    //         console.log(data);
    //         res.status(200).json(data)
    //     });
};


async function getAwbData(awbnr) {
    return await knex('awb').where('AWB_Num', awbnr);
}






