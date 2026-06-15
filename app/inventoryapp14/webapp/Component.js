// sap.ui.define(
//     ["sap/fe/core/AppComponent"],
//     function (Component) {
//         "use strict";

//         return Component.extend("inventoryapp14.Component", {
//             metadata: {
//                 manifest: "json"
//             }
//         });
//     }
// );


// inventoryapp14/Component.js
sap.ui.define([
    "sap/fe/core/AppComponent"
], function (AppComponent) {
    "use strict";

    return AppComponent.extend("inventoryapp14.Component", {

        metadata: {
            manifest: "json"
        },

        init: function () {
            AppComponent.prototype.init.apply(this, arguments);

            var oComponentData  = this.getComponentData();
            var oStartupParams  = oComponentData && oComponentData.startupParameters;

            console.log("Startup params:", JSON.stringify(oStartupParams));

            // Read id from startup parameters
            if (oStartupParams && oStartupParams["id"]) {
                var sProductId = Array.isArray(oStartupParams["id"])
                    ? oStartupParams["id"][0]
                    : oStartupParams["id"];

                console.log("Direct navigate to product:", sProductId);

                // ✅ Navigate directly to Object Page — before List Report loads
                this.getRouter().navTo("ProductsObjectPage", {
                    key: "id='" + sProductId + "',IsActiveEntity=true"
                });
            }
        }
    });
});
