const _ = require('lodash');
const knex = require('knex')(require('../database/knex'));
const Eawb = require('../models/Eawb');
const iso = require('iso-countries');

//5910225
//62754576

module.exports.awb = async function (req, res) {
    let awbnr = req.body.awbnr;
    const awbData = await getAwbData(awbnr);
    //console.log(awbData);
    const awbId = awbData.AWB_ID;
    let flightData = await getFlightData(awbId);
    let detailData = await getDetailData(awbId);

    let awb = new Eawb();
    awb.AWBConsignmentDetail = await createAWBConsignmentDetail(awbData, flightData, detailData);
    awb.FlightBookings = createFlightBookings(awbId, flightData);
    awb.Routing = createRouting(flightData);
    awb.Shipper = await createShipper(awbData.Shipper_ID);
    awb.Consignee = await createConsignee(awbData.Consignee_ID);
    awb.Agent = await createAgent();
    awb.SSR = await createSSR();
    awb.ChargeDeclaration = createChargeDeclaration(awbData);
    awb.RateDescription = createRateDescription(detailData);



    //console.log(awb);
    
    function createRateDescription(detailData) {
        let rateDescription="RTG/";
        console.log(rateDescription);

        return rateDescription;
    }

    function createChargeDeclaration(awbData) {
        let chargeDeclaration="CVD/" + awbData.Currency+"/"
            +awbData.CHGS_Code+
            "/PP/"+
            awbData.Decl_Value_Carriage+"/"+
            awbData.Decl_Value_Customs+"/"+
            awbData.Amount_Insurance+
            "\r\n";
        console.log(chargeDeclaration);

        return chargeDeclaration;
    }


    function createSSR() {
        let ssr="SSR/GENERAL\r\n/GENERAL"
        console.log(ssr);
        return ssr;
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

    async function createAWBConsignmentDetail(awbData, flightData, detailsData) {
        let awbOriginAndDestination = getAWBOriginAndDestination(flightData);
        const awbId = awbData.AWB_ID;
        let details = getQuantityDetail(detailsData);
        let awbDetails=awbData.IATA_Num + "-" + awbData.AWB_Num + awbOriginAndDestination + details;
        console.log(awbDetails);
        return awbDetails;
    }


    async function getAwbData(awbnr) {
        let awbData =  await knex('awb').where('AWB_Num', awbnr);
        return awbData[0];
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


    function getQuantityDetail(detailsData) {
       //console.log('detailsData-->',detailsData);
        let quantity=detailsData.length;
        let weight =_.sumBy(detailsData, 'Weight');
        let details='/T' + quantity + 'K' + weight;
        console.log(details);
        return details;
    }


    async function getDetailData(awbid) {
        let detailsData = await knex('awb_details').where('AWB_ID', awbid);
        return detailsData;
    }




};



