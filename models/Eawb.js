function Eawb() {
    this.StandardMessageIdentification = "FWB/17" + '\r\n';
    this.AWBConsignmentDetail = "";
    this.FlightBookings = "";
    this.Routing = "";
    this.Shipper = "";
    this.Consignee="";
    this.Agent="";
    this.SSR="";
}


module.exports = Eawb;
