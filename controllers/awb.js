const _ = require('lodash');
const knex = require('knex')(require('../database/knex'));
const Eawb = require('../models/Eawb');
const iso = require('iso-countries');

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
    awb.Routing = createRouting(flightData);
    awb.Shipper = await createShipper(awbData[0].Shipper_ID);
    awb.Consignee = await createConsignee(awbData[0].Consignee_ID);
    awb.Agent = await createAgent();
    awb.SSR = await createSSR();




    //console.log(awb);
    function createSSR() {
        let ssr="SSR/GENERAL\r\n/GENERAL"
    }

    function createAgent() {
        let name="/Express Reise- & Luftfrachtdienste GmbH".slice(0,34)+"\r\n";
        let agent = "AGT//2347251/3061"+"\r\n"+name+"/30669 Hannover";
        console.log(agent);
        return agent;
    }


    async function createConsignee(consigneeId) {
        let consigneeData = await knex('companies').where('CompanyID', consigneeId);
        //console.log(shipperData);
        let consigneeName = "NAM/" + consigneeData[0].CompanyName.slice(0, 34) + "\r\n";
        let consigneeStreet = "ADR/" + consigneeData[0].Street.slice(0, 34) + "\r\n";
        let consigneeLocation = "LOC/" + consigneeData[0].City.slice(0, 16) + "\r\n";
        let country = iso.findCountryByName(consigneeData[0].Country).alpha2;
        let codedLocation_C = "/"+country + "/" + consigneeData[0].PostalCode + "\r\n";
        let consignee = "CNE\r\n" + consigneeName + consigneeStreet + consigneeLocation + codedLocation_C;
        console.log(consignee);
        return consignee;
    }


    async function createShipper(shipperId) {
        let shipperData = await knex('companies').where('CompanyID', shipperId);
        //console.log(shipperData);
        let shipperName = "NAM/" + shipperData[0].CompanyName.slice(0, 34) + "\r\n";
        let shipperStreet = "ADR/" + shipperData[0].Street.slice(0, 34) + "\r\n";
        let shipperLocation = "LOC/" + shipperData[0].City.slice(0, 16) + "\r\n";
        let codedLocation_C = "/DE" + "/" + shipperData[0].PostalCode + "\r\n";
        let shipper = "SHP\r\n" + shipperName + shipperStreet + shipperLocation + codedLocation_C;
        console.log(shipper);
        return shipper;
    }


    function createRouting(flightData) {
        let routing = "";
        _.forEach(flightData, (value, key) => {
            routing = routing + value.Destination + value['Avia Id'] + "/";
        });
        return "RTG/" + routing.slice(0, -1)
    }


    function createFlightBookings(awbId, flightData) {
        //console.log('flightData->',flightData.length);
        let flightIdentification = '';
        _.forEach(flightData, (value, key) => {
            let flightDay = new Date(value['Flight_Date']).getDate();
            flightIdentification = flightIdentification +
                value['Avia Id'] +
                value['Flug Nr'] + '/' + flightDay + '/';
        });
        //console.log(flightIdentification);
        return "FLT/" + flightIdentification.slice(0, -1);
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



