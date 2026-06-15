sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("wizardstepobj.controller.View1", {

        onInit: function () {
            this._syncFooterButtons();
        },

        // ── Fires when each wizard step becomes active ────────────────────────
        onStepActivate: function (oEvent) {
            var sStepId = oEvent.getParameter("id");
            this._syncFooterButtons();
            console.log("Step activated:", sStepId);

            // Reset Step 2 strip when entering Step 2
            if (sStepId && sStepId.endsWith("step2")) {
                var oStrip = this.byId("navStatusStrip");
                var oBtn   = this.byId("openObjectPageBtn");
                if (oStrip) {
                    oStrip.setText("Click the button above to open the Inventory Object Page.");
                    oStrip.setType("Information");
                }
                if (oBtn) {
                    oBtn.setEnabled(true);
                }
            }
        },

        onNextStep: function () {
            this.byId("wizard").nextStep();
            this._syncFooterButtons();
        },

        onPreviousStep: function () {
            this.byId("wizard").previousStep();
            this._syncFooterButtons();
        },

        _syncFooterButtons: function () {
            var oWizard  = this.byId("wizard");
            var iCurrent = oWizard.getProgress();
            var iTotal   = oWizard.getSteps().length;

            this.byId("previousStepButton").setVisible(iCurrent > 1);
            this.byId("nextStepButton").setVisible(iCurrent < iTotal);
        },

        // ── Called when button in Step 2 is pressed ───────────────────────────
        onOpenInventoryPage: async function () {

            var sProductId = "00019"; // ← Replace with dynamic value if needed

            var oBusy  = this.byId("step2BusyIndicator");
            var oStrip = this.byId("navStatusStrip");
            var oBtn   = this.byId("openObjectPageBtn");

            // Show busy, disable button to prevent double click
            if (oBusy) oBusy.setVisible(true);
            if (oBtn)  oBtn.setEnabled(false);
            if (oStrip) {
                oStrip.setText("Opening Inventory Object Page...");
                oStrip.setType("Information");
            }

            // Guard: must run inside SAP Build Work Zone
            if (!sap.ushell || !sap.ushell.Container) {
                if (oBusy) oBusy.setVisible(false);
                if (oBtn)  oBtn.setEnabled(true);
                MessageBox.error(
                    "Cross-App Navigation is not available.\n" +
                    "Please run this app inside SAP Build Work Zone."
                );
                return;
            }

            try {
                // ✅ getServiceAsync — avoids CSP and deprecated API issues
                var oCrossAppNav = await sap.ushell.Container.getServiceAsync(
                    "CrossApplicationNavigation"
                );

                // ✅ appSpecificRoute navigates directly to Object Page
                // bypasses List Report entirely
                var sRoute = `&/Products(id='${sProductId}',IsActiveEntity=true)`;

              var oTarget = {
    target: {
        semanticObject: "semi2345",
        action: "display"
    },
    params: {
        "id": sProductId   // ← Component.js reads this and navigates directly
    }
};



                // Check navigation is supported before jumping
                var aResults = await oCrossAppNav.isNavigationSupported([oTarget]);

                if (aResults[0].supported) {

                    // ✅ Navigate to inventoryapp14 Object Page
                    oCrossAppNav.toExternal(oTarget);

                    // Update strip to success
                    if (oStrip) {
                        oStrip.setText(
                            "Inventory Object Page opened. Come back here to continue."
                        );
                        oStrip.setType("Success");
                    }

                    // ✅ Show Next button — user has seen the Object Page
                    this.byId("nextStepButton").setVisible(true);

                } else {
                    // Navigation target not found
                    if (oStrip) {
                        oStrip.setText("Could not open Inventory Object Page.");
                        oStrip.setType("Error");
                    }
                    if (oBtn) oBtn.setEnabled(true);

                    MessageBox.error(
                        "Inventory Object Page is not reachable.\n\n" +
                        "Please verify:\n" +
                        "1. inventoryapp14 is deployed in BTP.\n" +
                        "2. App is assigned to your role in Build Work Zone.\n" +
                        "3. Semantic Object 'semi2345' and Action 'display' are correct."
                    );
                }

            } catch (oError) {
                console.error("Cross-App Navigation error:", oError);

                if (oStrip) {
                    oStrip.setText("Navigation failed. Please try again.");
                    oStrip.setType("Error");
                }
                if (oBtn) oBtn.setEnabled(true);

                MessageToast.show("Navigation failed. Please try again.");

            } finally {
                if (oBusy) oBusy.setVisible(false);
            }
        }

    });
});