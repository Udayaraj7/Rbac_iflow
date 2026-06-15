const hana = require("@sap/hana-client");

const conn = hana.createConnection();

const connParams = {
  serverNode: "f26cac56-6d3d-42d8-8871-0b1ef29ad036.hna1.prod-us10.hanacloud.ondemand.com:443",
  uid: "INVENTORYMANAGEMENT_HDI_INVENTORYMANAGEMENT_DB_DEPLOYER_1_6GY0T60ZERBY7EB5IUJWXQQRQ_RT",
  pwd: "M~.7n*4 Ja@=a?q%Yd6HM9@-&p:f^MTe+<[S2t46e@zf(D,IU<eM4H@}_]Nbha|~C*71lY,9J(*=NE|u_]}J;y^nz59+8WNH19a#nyKM+m 2(t|5?K!EV19n:M =/33[",
  
  // ADD THIS LINE - This points the user to the table's actual home
  currentSchema: "INVENTORYMANAGEMENT_HDI_INVENTORYMANAGEMENT_DB_DEPLOYER_1", 
  
  encrypt: "true",
  sslValidateCertificate: "true"
};

try {
  conn.connect(connParams);
  console.log("Connected to HDI Container Schema!");
} catch (err) {
  console.error("Connection failed:", err.message);
}

module.exports = conn;