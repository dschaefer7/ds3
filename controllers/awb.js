const _ = require('lodash');
const knex = require('knex')(require('../database/knex'));
const Eawb = require('../models/Eawb');
const iso = require('iso-countries');
const moment = require('moment');

//5910225
//62754576

module.exports.awb = async function (req, res) {
    try {
        let awbnr = req.body.awbNr;
        let product = req.body.product;
        let volumeWeight = 0;
        let volumeDimensions;
        const awbData = await getAwbData(awbnr);
        //console.log(awbData);
        const awbId = awbData.AWB_ID;
        let flightData = await getFlightData(awbId);
        let detailData = await getDetailData(awbId);
        if(req.body.length) {
            volumeWeight = Math.round((req.body.length * req.body.width * req.body.height / 1000000)*100)/100;
            volumeDimensions = "CMT"+req.body.length+"-"+req.body.width+"-"+req.body.height+"/1";
        }
        let awb = new Eawb();
        awb.AWBConsignmentDetail = await createAWBConsignmentDetail(awbData, flightData, detailData, volumeWeight);
        awb.FlightBookings = createFlightBookings(awbId, flightData);   //FLT
        awb.Routing = createRouting(flightData);                        //RTG
        awb.Shipper = await createShipper(awbData.Shipper_ID);          //SHP
        awb.Consignee = await createConsignee(awbData.Consignee_ID);    //CNE
        awb.Agent = await createAgent();                                //AGT
        awb.SSR = await createSSR();                                    //SSR
        awb.ChargeDeclaration = createChargeDeclaration(awbData);       //CVD
        awb.RateDescription = createRateDescription(detailData, volumeWeight, volumeDimensions);        //RTD
        //awb.OtherChange = createOtherCharges();
        awb.ShipperCertification = createShipperCertification();       //CER
        awb.CarrierExecution = createCarrierExecution(awbData);        //ISU
        awb.SenderReference = createSenderReference();                 //REF

        awb.End = createEnd(product);


        let result = awb.StandardMessageIdentification +
            awb.AWBConsignmentDetail +
            awb.FlightBookings +
            awb.Routing +
            awb.Shipper +
            awb.Consignee +
            awb.Agent +
            awb.SSR +
            awb.ChargeDeclaration +
            awb.RateDescription +
            awb.ShipperCertification +
            awb.CarrierExecution +
            awb.SenderReference +
            awb.End;

        res.json(result.toUpperCase());


        function createEnd(product) {
            return 'COR/X' + '\r\n' + 'SPH/'+product+'/HEA' + '\r\n';
        }


        function createSenderReference() {
            let senderReference = 'REF/CHACSSU' + '\r\n';

            console.log(senderReference);
            return senderReference;

        }


        function createCarrierExecution(awbData) {
            let carrierExecution = 'ISU/';
            let execDate = moment(new Date(awbData.Date)).format("DDMMMYY");
            carrierExecution = carrierExecution + execDate + '/HAJ' + '\r\n';
            console.log(carrierExecution);
            return carrierExecution;
        }

        function createShipperCertification() {
            let signatur = 'Express Reise- & Luftfrachtdienste GmbH'.slice(0, 19);
            let cerification = 'CER/' + signatur + '\r\n';
            console.log(cerification);
            return cerification;
        }

        //console.log(awb);
        function createOtherCharges() {
            let otherCharge = 'OTH/P/AW';

            console.log(otherCharge);
            return otherCharge;
        }


        function createRateDescription(detailData, volumeWeight, volumeDimensions) {
            let rateDescription = "RTD/1/P";
            let quantity = _.sumBy(detailData, 'Quantity');
            let weight = _.sumBy(detailData, 'Weight');
            let rateClassCode = detailData[0].RateClass;
            let charge = _.sumBy(detailData, 'Charge');
            let total = _.sumBy(detailData, 'Total');
            rateDescription = rateDescription +
                quantity + '/' +
                detailData[0].Kg_Lb +
                weight +
                '/C' +
                rateClassCode + '/W' + weight +
                '/R' + charge +
                '/T' + total + '\r\n';

            let description = detailData[0].Description.split('\r\n')[0];

            let goodsDescription = '/NG/' + description.slice(0, 19) + '\r\n';
            let dimensions;
            //let volume;
            if(volumeWeight===0) {
                dimensions = '/2/ND//NDA' + '\r\n';
            }else{
                dimensions = '/2/ND//' +volumeDimensions+ '\r\n' + '/3/NV/MC' + volumeWeight + '\r\n';
                //let volume = '/3/NV/MC' + 'VOLUMENGEWICHT' + '\r\n';
            }
            rateDescription = rateDescription + goodsDescription + dimensions;
            console.log(rateDescription);
            return rateDescription;
        }

        function createChargeDeclaration(awbData) {
            let chargeDeclaration = "CVD/" + awbData.Currency + "/"
                + awbData.CHGS_Code +
                "/PP/" +
                awbData.Decl_Value_Carriage + "/" +
                awbData.Decl_Value_Customs + "/" +
                awbData.Amount_Insurance +
                "\r\n";
            console.log(chargeDeclaration);
            return chargeDeclaration;
        }


        function createSSR() {
            let ssr = "SSR/GENERAL\r\n/GENERAL" + '\r\n';
            console.log(ssr);
            return ssr;
        }

        function createAgent() {
            let name = "/Express Reise- & Luftfrachtdienste GmbH".slice(0, 34) + "\r\n";
            let agent = "AGT//2347251/3061" + "\r\n" + name + "/30669 Hannover" + '\r\n';
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
            let codedLocation_C = "/" + country + "/" + consigneeData[0].PostalCode + "\r\n";
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
            return "RTG/" + routing.slice(0, -1) + '\r\n';
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
            return "FLT/" + flightIdentification.slice(0, -1) + '\r\n';
        }

        async function createAWBConsignmentDetail(awbData, flightData, detailsData, volumeWeight) {
            let awbOriginAndDestination = getAWBOriginAndDestination(flightData);
            const awbId = awbData.AWB_ID;
            let details = getQuantityDetail(detailsData);
            let awbDetails;
            if(volumeWeight === 0)
                awbDetails = awbData.IATA_Num + "-" + awbData.AWB_Num + awbOriginAndDestination + details + '\r\n';
            else
                awbDetails = awbData.IATA_Num + "-" + awbData.AWB_Num + awbOriginAndDestination + details + "MC"+volumeWeight+'\r\n';
            console.log(awbDetails);
            return awbDetails;
        }


        async function getAwbData(awbnr) {
            let awbData = await knex('awb').where('AWB_Num', awbnr);
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
            let quantity = detailsData.length;
            let weight = _.sumBy(detailsData, 'Weight');
            let details = '/T' + quantity + 'K' + weight;
            console.log(details);
            return details;
        }


        async function getDetailData(awbid) {
            let detailsData = await knex('awb_details').where('AWB_ID', awbid);
            return detailsData;
        }

    } catch (error) {
        res.status(500).send('Something broke!');
    }
};



