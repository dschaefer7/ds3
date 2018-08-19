const _ = require('lodash');
const knex = require('knex')(require('../database/knex'));
const Eawb = require('../models/Eawb');

//5910225
//62754576

module.exports.awb = async function (req, res) {
    let awbnr = req.body.awbnr;
    const awbData = await getAwbData(awbnr);
    const awbId = awbData[0].AWB_ID;
    let flightData = await getFlightData(awbId);
    let awb = new Eawb();
    awb.AWBConsignmentDetail = await createAWBConsignmentDetail(awbData, flightData);
    awb.FlightBookings = createFlightBookings(awbId, flightData);

    console.log(awb);


    function createFlightBookings(awbId, flightData) {
        //console.log('flightData->',flightData.length);
        let flightIdentification='';
        _.forEach(flightData, (value, key)=>{
            let flightDay=new Date(value['Flight_Date']).getDate();
            flightIdentification = flightIdentification +
                value['Avia Id']+
                value['Flug Nr']+'/'+flightDay+'/';
        });

        console.log(flightIdentification);


        return "FLT/"+flightIdentification.slice(0,-1);
    }

    async function createAWBConsignmentDetail(awbData, flightData) {
        let awbOriginAndDestination = getAWBOriginAndDestination(flightData);
        const awbId = awbData[0].AWB_ID;
        let details = await getQuantityDetail(awbId);
        return awbData[0].IATA_Num + "-" + awbData[0].AWB_Num + awbOriginAndDestination + details;
    }


    async function getAwbData(awbnr) {
        return await knex('awb').where('AWB_Num', awbnr);
    }

    async function getFlightData(awbid) {
        return knex.from('awb_routing')
            .innerJoin('flights', 'awb_routing.Flight', 'flights.reise id')
            .where('AWB_ID', awbid);
        //return await knex('awb_routing').where('AWB_ID', awbid);
    }

    function getAWBOriginAndDestination(flightData) {
        let flightsSorted = _.sortBy(flightData, 'ID');
        //console.log(flightData);
        let departure = flightsSorted[0].Departure;
        let destination = flightsSorted[flightsSorted.length - 1].Destination;
        //console.log(departure, destination);
        return departure + destination;
    }


    async function getQuantityDetail(awbid) {
        let detailsData = await knex('awb_details').where('AWB_ID', awbid);
        //console.log(detailsData);
        return await '/T' + detailsData[0].Quantity + 'K' + detailsData[0].Weight;

    }


};



