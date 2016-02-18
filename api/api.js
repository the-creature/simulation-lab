var API = (function ($) {
    "use strict";
    
    var SELF = this,
        access = angular.element(document),
        szr = require("assets/scripts/vendors/serialijse");
    
    var feRequestCount = 0;

    function LabInstrumentChangedEvent() {
        this._eventName = null;
        this._key = null;
        this._value = null;

    }
    function ContainerChangedEvent() {
        this.id = null;
        this.newTemperature = NaN;
        this.newVolume = NaN;
        this.newPhase = null;
        this.newPressure = NaN;
        this.hasExploded = null;

    }
    szr.declarePersistable(LabInstrumentChangedEvent);
    szr.declarePersistable(ContainerChangedEvent);


    return {
        //////////////////////////////////////////////
        // primary connection handshake
        //////////////////////////////////////////////
        
        primus:null,
        isConnected:false,
        backlog: [],

        init: function (aprimus, initObj) {
            console.log("API.init primus?: " + aprimus);
            this.primus = aprimus;
            this.getLabForUser(initObj.lab_id,initObj.labsection_id,initObj.user_id);
            return "API has initialized";
        },
        getLabForUser: function (lab_id, labsection_id, user_id ) {
            console.log("API.getLabForUser ", lab_id, labsection_id, user_id );
            var req = {method: "main_getLabForUser", args: [lab_id, labsection_id, user_id]};
            this.sendToServer(req);

        },
        onBE2FE_Event:function(evt){
            console.log("API.onBE2FE_Event");

            if(evt instanceof ContainerChangedEvent){
                 var aclass = evt.id.split("_")[0];
                var amethod;
                if(evt.hasOwnProperty("hasExploded") && evt.hasExploded){
                    //mostly destructive can only have one thing happen
                    amethod = "shatter";
                    var m = aclass+"_"+amethod;
                    try{
                        this[m].apply(this, [evt.id]);
                    } catch(er){
                        console.log(er);
                    }
                }else{
                     //multiple nondestructive things that can happen in a single sycle
                    if(null !=(evt.newPhase)){
                        amethod = "phase";
                        var m = aclass+"_"+amethod;
                        try{
                            this[m].apply(this, [evt.id, evt.newPhase]);
                        } catch(er){
                            console.log(er);
                        }
                    }
                    if(! typeof(evt.newVolume)){
                        amethod = "volume";
                        var m = aclass+"_"+amethod;
                        try{
                            this[m].apply(this, [evt.id, evt.newVolume]);
                        } catch(er){
                            console.log(er);
                        }
                    }
                    if(!isNaN(evt.newTemperature)){
                        amethod = "temperature";
                        var m = aclass+"_"+amethod;
                        try{
                            this[m].apply(this, [evt.id, evt.newTemperature]);
                        } catch(er){
                            console.log(er);
                        }
                   }
                    if(!isNaN(evt.newPressure)){
                        amethod = "pressure";
                        var m = aclass+"_"+amethod;
                        try{
                            this[m].apply(this, [evt.id, evt.newPressure]);
                        } catch(er){
                            console.log(er);
                        }
                    }
                }

            }
        },
        connected: function () {
            console.log("API connected");
            this.isConnected =true;
            access.scope().$broadcast('API.connected');
            
            if(this.backlog.length > 0){
                console.log("has pending calls to make");
                while(this.backlog.length > 0){
                    this.sendToServer(this.backlog.shift()); //FIFO
                }
            }
        },

        disconnected: function () {
            console.log("API.disconnected ");
            this.isConnected =false;
            access.scope().$broadcast('API.disconnected');
        },

        //========================INTRO=================================
        intro: function (labIntro) {
            console.log("API.intro " + labIntro);
            access.scope().$emit('API.intro', {type:labIntro});
        },

        //========================LIGHT SWITCH==========================
        lightSwitchStatus: function(status) {
            console.log("API.lightSwitchStatus " + status);
            var valid_status = ['on', 'off'];
            if ($.inArray(status, valid_status) >= 0) {
                access.scope().$emit('API.lightSwitchStatus', {status: status});
            } else {
                console.error("invalid status");
            }
        },

        //========================MEDIA PLAYER==========================
        playerOpen: function() {
            console.log("API.playerOpen");
            if ($(".media-player").length > 0)
                console.error("player is already opened");
            else
                access.scope().$broadcast('API.playerOpen');
        },

        playerClosed: function() {
            console.log("API.playerClosed");
            if ($(".media-player").length > 0)
                access.scope().$broadcast('API.playerClosed');
            else
                console.log("player is not already closed");
        },

        //========================TIME==================================
        timeCreated: function(item) {
            console.log("API.timeCreated " + JSON.stringify(item));
            access.scope().$broadcast('API.timeCreated');
        },

        timeRemoved: function(item) {
            console.log("API.timeRemoved " + JSON.stringify(item));
            access.scope().$broadcast('API.timeRemoved');
        },     

        //========================CONTAINERS ===========================
        /**
         * 50 mL Beaker
         * 250 mL Beaker
         * 150 mL Erlenmeyer Flask
         * 50 mL Graduated Cylinder
         * 15 mL Test Tube
         * 50 mL Crucible
         * 30 mL Evaporating Dish
         */
        

        ///////////////////////////////////////////////////////////////
        // beakers
        ///////////////////////////////////////////////////////////////

        //----------------50ml Beaker -----------------------------
        beaker50_create: function(x, y, id){
            console.log("API.createBeaker50 "+ x,y,id);
            if ($("beaker[data-uuid='" + id + "']").length > 0)
                console.error("beaker with id " + id + " already exists");
            else
                access.scope().$emit('API.beaker50_create', {id: id, x: x, y: y});
        },
        beaker50_delete: function(id){
            console.log("API.deleteBeaker50 ", id);

            if ($("beaker[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.beaker50_delete', {id: id});
            else
                console.error("beaker with id " + id + " does not exist");
        },

        beaker50_boil: function(id){
            console.log("API.boilBeaker20");
            if ($("beaker[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.beaker50_boil', {id: id});
            else
                console.error("beaker with id " + id + " does not exist");
        },

        beaker50_stopBoil: function(id){
            console.log("API.stopBoilBeaker20");
            if ($("beaker[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.beaker50_stopBoil', {id: id});
            else
                console.error("beaker with id " + id + " does not exist");
        },

        beaker50_pourSolid: function(id, amount, material){
            console.log("API.beaker50_pourSolid");
            if ($("beaker[data-uuid='" + id + "']").length > 0)
                this.solidPour(id, amount, material);
            else
                console.error("beaker50 with id " + id + " does not exist");
        },

        beaker50_pourLiquid: function(id, volume, material){
            console.log("API.beaker50_pourLiquid");
            if ($("beaker[data-uuid='" + id + "']").length > 0)
                this.liquidPour(id, volume, material);
            else
                console.error("beaker with id " + id + " does not exist");
        },

        beaker50_reduceSolid: function(id, amount, material){
            console.log("API.beaker50_reduceSolid");
            if ($("beaker[data-uuid='" + id + "']").length > 0)
                this.reduceSolid(id, amount, material);
            else
                console.error("beaker with id " + id + " does not exist");
        },

        beaker50_reduceLiquid: function(id, volume){
            console.log("API.beaker50_reduceLiquid");
            if ($("beaker[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.beaker50_reduceLiquid', {id: id, volume: volume});
            else
                console.error("beaker with id " + id + " does not exist");
        },

        beaker50_group: function(id, withChild) {
            console.log("API.beaker50_group", id, withChild);
            if ($("beaker[data-uuid='" + id + "']").length > 0 && $("[data-uuid='" + withChild + "']").length > 0)
                access.scope().$emit('API.beaker50_group', {id: id, child: withChild});
            else
                console.error("bunsenburner with id " + id + " does not exist or object with id " + withChild + " does not exist");
        },

        beaker50_unGroup: function(id) {
            console.log("API.beaker50_unGroup", id);
            if ($("beaker[data-uuid='" + id + "']").length > 0 && $("beaker[data-uuid='" + id + "'] .sub-thermometer").length > 0)
                angular.element(document).scope().$emit('API.beaker50_unGroup', {id: id});
            else
                console.error("beaker with id " + id + " does not exist or does not group with other objects");
        },

        beaker50_changeColor: function(id, color, transparency) {
            if ($("beaker[data-uuid='" + id + "']").length > 0)
                this.changeLiquidColor(id, color, transparency);
            else
                console.error("beaker with id " + id + " does not exist");
        },

        beaker50_explode: function(id) {
            console.log("API.beaker50_explode", id);
            if ($("beaker[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.beaker50_explode', {id: id});
            else
                console.error("beaker with id " + id + " does not exist");
        },

        beaker50_temperature: function(id, value) {
            console.log("API.beaker50_temperature ", id);
            if ($("beaker[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.beaker50_temperature', {id: id, temperature: value});
            else
                console.error("beaker with id " + id + " does not exist");
        },
        //----------------250ml Beaker -----------------------------
        beaker250_create: function(x, y, id){
            console.log("API.createBeaker250 "+ x,y,id);

            if ($("beaker[data-uuid='" + id + "']").length > 0)
                console.error("beaker with id " + id + " already exists");
            else
                access.scope().$emit('API.beaker250_create', {id: id, x: x, y: y});
        },

        beaker250_delete: function(id){
            console.log("API.deleteBeaker250 ", id);

            if ($("beaker[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.beaker250_delete', {id: id});
            else
                console.error("beaker with id " + id + " does not exist");
        },

        beaker250_boil: function(id){
            console.log("API.boilBeaker250");
            if ($("beaker[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.beaker250_boil', {id: id});
            else
                console.error("beaker with id " + id + " does not exist");
        },

        beaker250_stopBoil: function(id){
            console.log("API.stopBoilBeaker250");
            if ($("beaker[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.beaker250_stopBoil', {id: id});
            else
                console.error("beaker with id " + id + " does not exist");
        },

        beaker250_pourSolid: function(id, amount, material){
            console.log("API.beaker250_pourSolid");
            if ($("beaker[data-uuid='" + id + "']").length > 0)
                this.solidPour(id, amount, material);
            else
                console.error("beaker250 with id " + id + " does not exist");
        },

        beaker250_pourLiquid: function(id, volume, material){
            console.log("API.beaker250_pourLiquid");
            if ($("beaker[data-uuid='" + id + "']").length > 0)
                this.liquidPour(id, volume, material);
            else
                console.error("beaker with id " + id + " does not exist");
        },

        beaker250_reduceSolid: function(id, amount, material){
            console.log("API.beaker250_reduceSolid");
            if ($("beaker[data-uuid='" + id + "']").length > 0)
                this.reduceSolid(id, amount, material);
            else
                console.error("beaker with id " + id + " does not exist");
        },

        beaker250_reduceLiquid: function(id, volume){
            console.log("API.beaker250_reduceLiquid");
            if ($("beaker[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.beaker250_reduceLiquid', {id: id, volume: volume});
            else
                console.error("beaker with id " + id + " does not exist");
        },

        beaker250_group: function(id, withChild) {
            console.log("API.beaker250_group", id, withChild);
            if ($("beaker[data-uuid='" + id + "']").length > 0 && $("[data-uuid='" + withChild + "']").length > 0)
                access.scope().$emit('API.beaker250_group', {id: id, child: withChild});
            else
                console.error("bunsenburner with id " + id + " does not exist or object with id " + withChild + " does not exist");
        },

        beaker250_unGroup: function(id) {
            console.log("API.beaker250_unGroup", id);
            if ($("beaker[data-uuid='" + id + "']").length > 0 && $("beaker[data-uuid='" + id + "'] .sub-thermometer").length > 0)
                access.scope().$emit('API.beaker250_unGroup', {id: id});
            else
                console.error("beaker with id " + id + " does not exist or does not group with other objects");
        },


        beaker250_changeColor: function(id, color, transparency) {
            if ($("beaker[data-uuid='" + id + "']").length > 0)
                this.changeLiquidColor(id, color, transparency);
            else
                console.error("beaker with id " + id + " does not exist");
        },

        beaker250_explode: function(id) {
            console.log("API.beaker250_explode", id);
            if ($("beaker[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.beaker250_explode', {id: id});
            else
                console.error("beaker with id " + id + " does not exist");
        },

        beaker250_temperature: function(id, value) {
            console.log("API.beaker250_temperature ", id);
            if ($("beaker[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.beaker250_temperature', {id: id, temperature: value});
            else
                console.error("beaker with id " + id + " does not exist");
        },

        //------------------------------erlenmeyerflask ------------------------------//
        erlenmeyerflask_create: function(x, y, id){
            console.log("API.createErlenmeyerflask "+ x,y,id);

            if ($("erlenmeyerflask[data-uuid='" + id + "']").length > 0)
                console.error("erlenmeyerflask with id " + id + " already exists");
            else
                access.scope().$emit('API.erlenmeyerflask_create', {x: x, y: y,id: id});
        },

        erlenmeyerflask_delete: function(id){
            console.log("API.deleteErlenmeyerflask ", id);

            if ($("erlenmeyerflask[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.erlenmeyerflask_delete', {id: id});
            else
                console.error("erlenmeyerflask with id " + id + " does not exist");
        },

        erlenmeyerflask_boil: function(id){
            console.log("API.boilErlenmeyerflask");
            if ($("erlenmeyerflask[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.erlenmeyerflask_boil', {id: id});
            else
                console.error("erlenmeyerflask with id " + id + " does not exist");
        },

        erlenmeyerflask_stopBoil: function(id){
            console.log("API.stopBoilErlenmeyerflask");
            if ($("erlenmeyerflask[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.erlenmeyerflask_stopBoil', {id: id});
            else
                console.error("erlenmeyerflask with id " + id + " does not exist");
        },

        erlenmeyerflask_pourSolid: function(id, amount, material){
            console.log("API.erlenmeyerflask_pourSolid");
            if ($("erlenmeyerflask[data-uuid='" + id + "']").length > 0)
                this.solidPour(id, amount, material);
            else
                console.error("erlenmeyerflask with id " + id + " does not exist");
        },

        erlenmeyerflask_pourLiquid: function(id, volume, material){
            console.log("API.erlenmeyerflask_pourLiquid");
            if ($("erlenmeyerflask[data-uuid='" + id + "']").length > 0)
                this.liquidPour(id, volume, material);
            else
                console.error("erlenmeyerflask with id " + id + " does not exist");
        },

        erlenmeyerflask_reduceSolid: function(id, amount, material){
            console.log("API.erlenmeyerflask_reduceSolid");
            if ($("erlenmeyerflask[data-uuid='" + id + "']").length > 0)
                this.reduceSolid(id, amount, material);
            else
                console.error("erlenmeyerflask with id " + id + " does not exist");
        },

        erlenmeyerflask_reduceLiquid: function(id, volume){
            console.log("API.erlenmeyerflask_reduceLiquid");
            if ($("erlenmeyerflask[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.erlenmeyerflask_reduceLiquid', {id: id, volume: volume});
            else
                console.error("erlenmeyerflask with id " + id + " does not exist");
        },

        erlenmeyerflask_open: function(id){
            console.log("API.erlenmeyerflask_open");
            if ($("erlenmeyerflask[data-uuid='" + id + "']").length > 0)
                if ($("erlenmeyerflask[data-uuid='" + id + "'] .sub-pressuregauge").length > 0) {
                    console.error("erlenmeyerflask with id " + id + " can't be oppened until pressuregauge removal");
                } else {
                    access.scope().$emit('API.erlenmeyerflask_open', {id: id});
                }
            else
                console.error("erlenmeyerflask with id " + id + " does not exist");
        },

        erlenmeyerflask_user_opened: function(id) {
            console.log("API.erlenmeyerflask_user_opened - " + id);
            var req = {method: "erlenmeyerflask_user_opened", args: [id]};
            this.sendToServer(req);
        },

        erlenmeyerflask_close: function(id){
            console.log("API.erlenmeyerflask_close");
            if ($("erlenmeyerflask[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.erlenmeyerflask_close', {id: id});
            else
                console.error("erlenmeyerflask with id " + id + " does not exist");
        },


        erlenmeyerflask_user_closed: function(id) {
            console.log("API.erlenmeyerflask_user_closed - " + id);
            var req = {method: "erlenmeyerflask_user_closed", args: [id]};
            this.sendToServer(req);
        },

        erlenmeyerflask_group: function(id, withChild) {
            console.log("API.erlenmeyerflask_group", id, withChild);
            if ($("erlenmeyerflask[data-uuid='" + id + "']").length > 0 && $("[data-uuid='" + withChild + "']").length > 0)
                access.scope().$emit('API.erlenmeyerflask_group', {id: id, child: withChild});
            else
                console.error("erlenmeyerflask with id " + id + " does not exist or object with id " + withChild + " does not exist");
        },

        erlenmeyerflask_unGroup: function(id) {
            console.log("API.erlenmeyerflask_unGroup", id);
            if ($("erlenmeyerflask[data-uuid='" + id + "']").length > 0 && 
                    ($("erlenmeyerflask[data-uuid='" + id + "'] .sub-thermometer").length > 0 || $("erlenmeyerflask[data-uuid='" + id + "'] .sub-pressuregauge").length > 0))
                access.scope().$emit('API.erlenmeyerflask_unGroup', {id: id});
            else
                console.error("erlenmeyerflask with id " + id + " does not exist or does not group with other objects");
        },

        erlenmeyerflask_explode: function(id) {
            console.log("API.erlenmeyerflask_explode", id);
            if ($("erlenmeyerflask[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.erlenmeyerflask_explode', {id: id});
            else
                console.error("erlenmeyerflask with id " + id + " does not exist");
        },

        erlenmeyerflask_shatter: function(id) {
            console.log("API.erlenmeyerflask_shatter", id);
            if ($("erlenmeyerflask[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.erlenmeyerflask_shatter', {id: id});
            else
                console.error("erlenmeyerflask with id " + id + " does not exist");
        },
        
        erlenmeyerflask_temperature: function(id, value) {
            console.log("API.erlenmeyerflask_temperature ", id);
            if ($("erlenmeyerflask[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.erlenmeyerflask_temperature', {id: id, temperature: value});
            else
                console.error("erlenmeyerflask with id " + id + " does not exist");
        },

        erlenmeyerflask_pressure: function(id, value) {
            console.log("API.erlenmeyerflask_pressure ", id, value);
            if ($("erlenmeyerflask[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.erlenmeyerflask_pressure', {id: id, pressure: value});
            else
                console.error("erlenmeyerflask with id " + id + " does not exist");
        },

        erlenmeyerflask_changeColor: function(id, color, transparency) {
            if ($("erlenmeyerflask[data-uuid='" + id + "']").length > 0)
                this.changeLiquidColor(id, color, transparency);
            else
                console.error("erlenmeyerflask with id " + id + " does not exist");
        },


        //------------------------------graduatedcylinder_create ------------------------------//

        graduatedcylinder_create: function(x, y, id){
            console.log("API.createGraduatedcylinder "+ x,y,id);

            if ($("graduatedcylinder[data-uuid='" + id + "']").length > 0)
                console.error("graduatedcylinder with id " + id + " already exists");
            else
                access.scope().$emit('API.graduatedcylinder_create', {id: id, x: x, y: y});
        },

        graduatedcylinder_delete: function(id){
            console.log("API.deleteGraduatedcylinder ", id);

            if ($("graduatedcylinder[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.graduatedcylinder_delete', {id: id});
            else
                console.error("graduatedcylinder with id " + id + " does not exist");
        },

        graduatedcylinder_boil: function(id){
            console.log("API.boilGraduatedcylinder");
            if ($("graduatedcylinder[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.graduatedcylinder_boil', {id: id});
            else
                console.error("graduatedcylinder with id " + id + " does not exist");
        },

        graduatedcylinder_stopBoil: function(id){
            console.log("API.stopBoilGraduatedcylinder");
            if ($("graduatedcylinder[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.graduatedcylinder_stopBoil', {id: id});
            else
                console.error("graduatedcylinder with id " + id + " does not exist");
        },

        graduatedcylinder_pourSolid: function(id, amount, material){
            console.log("API.graduatedcylinder_pourSolid");
            if ($("graduatedcylinder[data-uuid='" + id + "']").length > 0)
                this.solidPour(id, amount, material);
            else
                console.error("graduatedcylinder with id " + id + " does not exist");
        },

        graduatedcylinder_pourLiquid: function(id, volume, material){
            console.log("API.graduatedcylinder_pourLiquid");
            if ($("graduatedcylinder[data-uuid='" + id + "']").length > 0)
                this.liquidPour(id, volume, material);
            else
                console.error("graduatedcylinder with id " + id + " does not exist");
        },

        graduatedcylinder_reduceSolid: function(id, amount, material){
            console.log("API.graduatedcylinder_reduceSolid");
            if ($("graduatedcylinder[data-uuid='" + id + "']").length > 0)
                this.reduceSolid(id, amount, material);
            else
                console.error("graduatedcylinder with id " + id + " does not exist");
        },

        graduatedcylinder_reduceLiquid: function(id, volume){
            console.log("API.graduatedcylinder_reduceLiquid");
            if ($("graduatedcylinder[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.graduatedcylinder_reduceLiquid', {id: id, volume: volume});
            else
                console.error("graduatedcylinder with id " + id + " does not exist");
        },

        graduatedcylinder_group: function(id, withChild) {
            console.log("API.graduatedcylinder_group", id, withChild);
            if ($("graduatedcylinder[data-uuid='" + id + "']").length > 0 && $("[data-uuid='" + withChild + "']").length > 0)
                access.scope().$emit('API.graduatedcylinder_group', {id: id, child: withChild});
            else
                console.error("graduatedcylinder with id " + id + " does not exist or object with id " + withChild + " does not exist");
        },

        graduatedcylinder_unGroup: function(id) {
            console.log("API.graduatedcylinder_unGroup", id);
            if ($("graduatedcylinder[data-uuid='" + id + "']").length > 0 && 
                    ($("graduatedcylinder[data-uuid='" + id + "'] .sub-thermometer").length > 0))
                access.scope().$emit('API.graduatedcylinder_unGroup', {id: id});
            else
                console.error("graduatedcylinder with id " + id + " does not exist or does not group with other objects");
        },

        graduatedcylinder_explode: function(id) {
            console.log("API.graduatedcylinder_explode", id);
            if ($("graduatedcylinder[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.graduatedcylinder_explode', {id: id});
            else
                console.error("graduatedcylinder with id " + id + " does not exist");
        },
        
        graduatedcylinder_temperature: function(id, value) {
            console.log("API.graduatedcylinder_temperature ", id);
            if ($("graduatedcylinder[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.graduatedcylinder_temperature', {id: id, temperature: value});
            else
                console.error("graduatedcylinder with id " + id + " does not exist");
        },

        graduatedcylinder_changeColor: function(id, color, transparency) {
            if ($("graduatedcylinder[data-uuid='" + id + "']").length > 0)
                this.changeLiquidColor(id, color, transparency);
            else
                console.error("graduatedcylinder with id " + id + " does not exist");
        },

        crucible_create: function(x, y, id){
            console.log("createCrucible "+ x,y,id);

            if ($("crucible[data-uuid='" + id + "']").length > 0)
                console.error("crucible with id " + id + " already exists");
            else
                access.scope().$emit('API.crucible_create', {id: id, x: x, y: y});
        },

        crucible_delete: function(id){
            console.log("deleteCrucible ", id);

            if ($("crucible[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.crucible_delete', {id: id});
            else
                console.error("crucible with id " + id + " does not exist");
        },

        crucible_boil: function(id){
            console.log("API.boilCrucible");
            if ($("crucible[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.crucible_boil', {id: id});
            else
                console.error("crucible with id " + id + " does not exist");
        },

        crucible_stopBoil: function(id){
            console.log("API.stopBoilCrucible");
            if ($("crucible[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.crucible_stopBoil', {id: id});
            else
                console.error("crucible with id " + id + " does not exist");
        },

        crucible_pourSolid: function(id, amount, material){
            console.log("API.crucible_pourSolid");
            if ($("crucible[data-uuid='" + id + "']").length > 0)
                this.solidPour(id, amount, material);
            else
                console.error("crucible with id " + id + " does not exist");
        },

        crucible_pourLiquid: function(id, volume, material){
            console.log("API.crucible_pourLiquid");
            if ($("crucible[data-uuid='" + id + "']").length > 0)
                this.liquidPour(id, volume, material);
            else
                console.error("crucible with id " + id + " does not exist");
        },

        crucible_reduceSolid: function(id, amount, material){
            console.log("API.crucible_reduceSolid");
            if ($("crucible[data-uuid='" + id + "']").length > 0)
                this.reduceSolid(id, amount, material);
            else
                console.error("crucible with id " + id + " does not exist");
        },

        crucible_reduceLiquid: function(id, volume){
            console.log("API.crucible_reduceLiquid");
            if ($("crucible[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.crucible_reduceLiquid', {id: id, volume: volume});
            else
                console.error("crucible with id " + id + " does not exist");
        },

        crucible_open: function(id){
            console.log("API.crucible_open");
            if ($("crucible[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.crucible_open', {id: id});
            else
                console.error("crucible with id " + id + " does not exist");
        },

        crucible_user_opened: function(id) {
            console.log("API.crucible_user_opened - " + id);
        },

        crucible_close: function(id){
            console.log("API.crucible_close");
            if ($("crucible[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.crucible_close', {id: id});
            else
                console.error("crucible with id " + id + " does not exist");
        },

        crucible_user_closed: function(id) {
            console.log("API.crucible_user_closed - " + id);
        },

        crucible_group: function(id, withChild) {
            console.log("API.crucible_group", id, withChild);
            if ($("crucible[data-uuid='" + id + "']").length > 0 && $("[data-uuid='" + withChild + "']").length > 0)
                access.scope().$emit('API.crucible_group', {id: id, child: withChild});
            else
                console.error("crucible with id " + id + " does not exist or object with id " + withChild + " does not exist");
        },

        crucible_unGroup: function(id) {
            console.log("API.crucible_unGroup", id);
            if ($("crucible[data-uuid='" + id + "']").length > 0 && 
                    ($("crucible[data-uuid='" + id + "'] .sub-thermometer").length > 0))
                access.scope().$emit('API.crucible_unGroup', {id: id});
            else
                console.error("crucible with id " + id + " does not exist or does not group with other objects");
        },

        crucible_explode: function(id) {
            console.log("API.crucible_explode", id);
            if ($("crucible[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.crucible_explode', {id: id});
            else
                console.error("crucible with id " + id + " does not exist");
        },
        
        crucible_temperature: function(id, value) {
            console.log("API.crucible_temperature ", id);
            if ($("crucible[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.crucible_temperature', {id: id, temperature: value});
            else
                console.error("crucible with id " + id + " does not exist");
        },

        crucible_changeColor: function(id, color, transparency) {
            if ($("crucible[data-uuid='" + id + "']").length > 0)
                this.changeLiquidColor(id, color, transparency);
            else
                console.error("crucible with id " + id + " does not exist");
        },

        evaporatingdish_changeColor: function(id, color, transparency) {
            if ($("evaporatingdish[data-uuid='" + id + "']").length > 0)
                this.changeLiquidColor(id, color, transparency);
            else
                console.error("evaporatingdish with id " + id + " does not exist");
        },

        testtube_changeColor: function(id, color, transparency) {
            if ($("testtube[data-uuid='" + id + "']").length > 0)
                this.changeLiquidColor(id, color, transparency);
            else
                console.error("testtube with id " + id + " does not exist");
        },
        //========================MATERIALS ===========================

        /**
         * Water
         *
         * Stock Liquid
         * Stock Solid
         * Stock Solution
         * Solution
         * Gas
         */
        changeLiquidColor: function(id, color, transparency) {
            console.log("API.changeLiquidColor", id, color, transparency);
            if ($("[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.changeLiquidColor', {id: id, color: color, transparency: transparency});
            else
                console.error("object with id " + id + " does not exist");
        },

        changeSolidColor: function(id, color, transparency, material) {
            console.log("API.changeSolidColor", id, color, transparency, material);
            if ($("[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.changeSolidColor', {id: id, color: color, transparency: transparency, material: material});
            else
                console.error("object with id " + id + " does not exist");
        },

        liquidPour: function(id, volume, material) {
            console.log("API.liquidPour", id, volume, material);
            //API.liquidPour erlenmeyerflask_1 10 sodium_hydroxide
            //API.liquidPour erlenmeyerflask_1 20 6m_hcl
            //API.liquidPour erlenmeyerflask_1 10 water
            //First update the FE visual
           if ($("[data-uuid='" + id + "']").length > 0){
               access.scope().$emit('API.liquidPour', {id: id, volume: volume, material: material});
               // then update the server.
               var req = {method: "addMaterialToContainer", args: [id, volume, material]};
               this.sendToServer(req);

           } else{
                console.error("object with id " + id + " does not exist");
           }
        },
        
        solidPour: function(id, amount, material) {
            console.log("API.solidPour", id, amount, material);
            if ($("[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.solidPour', {id: id, amount: amount, material: material});
            else
                console.error("object with id " + id + " does not exist");
        },

        reduceSolid: function(id, amount, material) {
            console.log("API.reduceSolid", id, amount, material);
            if ($("[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.reduceSolid', {id: id, amount: amount, material: material});
            else
                console.error("object with id " + id + " does not exist");
        },

        PourFromItemtoItem: function(src, dst, volume, material) {
            console.log("API.PourFromItemtoItem", src, dst, volume, material);
            if ($("[data-uuid='" + src + "']").length > 0 && $("[data-uuid='" + dst + "']").length > 0)
                access.scope().$emit('API.PourFromItemtoItem', {src: src, dst: dst, volume: volume, material: material});
            else
                console.error("object with id " + src + " or " + dst + " does not exist");
        },

        //========================INSTRUMENTS =========================
        /**
         *
         * Bunsen Burner
         * Balance
         * Thermometer
         * Gas Syringe
         * Pressure Gauge
         * Temperature Bath
         */

        ///////////////////////////////////////////////////////////////
        // bunsen burner                                         
        ///////////////////////////////////////////////////////////////

        bunsenburner_create :function (x, y, id, initObj){
            console.log("API.bunsenburner_create "+ id, initObj);
            
            if ($("bunsenburner[data-uuid='" + id + "']").length > 0)
                console.error("bunsenburner with id " + id + " already exists");

            else
                access.scope().$emit('API.bunsenburner_create', {id: id, x: x, y: y});
        },
        bunsenburner_delete :function (id){
            console.log("API.bunsenburner_delete "+ id);

            if ($("bunsenburner[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.bunsenburner_delete', {id: id});
            else
                console.error("bunsenburner with id " + id + " does not exist");
        },

        bunsenburner_adjustFlame:function (id, state){
            console.log("API.bunsenburner_adjustFlame "+ id, state);

            if ($("bunsenburner[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.bunsenburner_adjustFlame', {id: id, state: state});
            else
                console.error("bunsenburner with id " + id + " does not exist");
        },

        /*
         * To review 
         * calls are duplication of 
         * bunsenburner_adjustFlame()
         * Added by Troy.
         */

        bunsenburner_setFlameLow:function (id){
            console.log("API.bunsenburner_setFlameLow "+ id);
            this.bunsenburner_adjustFlame(id, 'low');
        },
        bunsenburner_setFlameMedium:function (id){
            console.log("API.bunsenburner_setFlameMedium "+ id);
            this.bunsenburner_adjustFlame(id, 'medium');
        },
        bunsenburner_setFlameHigh:function (id, x, y){
            console.log("API.bunsenburner_setFlameHigh "+ id);
            this.bunsenburner_adjustFlame(id, 'high');
        },

        /* END */

        // bunsenburner_setFlame:function (id,state){
        //     console.log("bunsenburner_setFlame "+ id, state);
        // },

        bunsenburner_group:function (id, withChild1, withChild2){
            console.log("API.bunsenburner_group "+ id, withChild1, withChild2);

            if ($("bunsenburner[data-uuid='" + id + "']").length > 0 && 
                    $("bunsenburner[data-uuid='" + id + "'] .bunsenburner-tripod").length == 0 &&
                    $("div.table-item[id='" + withChild1 + "']").length > 0)
                access.scope().$emit('API.bunsenburner_group', {id: id, beaker: withChild1});
            else
                console.error("bunsenburner with id " + id + " does not exist or beaker with id " + withChild1 + " does not exist or bunsenburner already in a group");
        },

        bunsenburner_unGroup:function (id){
            console.log("API.bunsenburner_unGroup"+ id);

            if ($("bunsenburner[data-uuid='" + id + "']").length > 0 && $("bunsenburner[data-uuid='" + id + "'] .bunsenburner-tripod").length > 0)
                access.scope().$emit('API.bunsenburner_unGroup', {id: id});
            else
                console.error("bunsenburner with id " + id + " does not exist or does not group with other objects");
        },
        
        bunsenburner_explode: function(id) {
            console.log("API.bunsenburner_explode", id);
            if ($("bunsenburner[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.bunsenburner_explode', {id: id});
            else
                console.error("bunsenburner with id " + id + " does not exist");
        },
        ///////////////////////////////////////////////////////////////
        // pressuregauge                                         
        ///////////////////////////////////////////////////////////////
        pressuregauge_create :function (x, y, id){
            console.log("API.pressuregauge_create "+ id);

            if ($("pressuregauge[data-uuid='" + id + "']").length > 0)
                console.error("Pressure Gauge with id " + id + " already exists");
            else
                access.scope().$emit('API.pressuregauge_create', {id: id, x: x, y: y});
        },

        pressuregauge_delete :function (id){
            console.log("API.pressuregauge_delete "+ id);

            if ($("pressuregauge[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.pressuregauge_delete', {id: id});
            else
                console.error("Pressure Gauge with id " + id + " does not exist");
        },
        
        pressuregauge_userChangeScale: function(id, newScale) {
            console.log("API.pressuregauge_userChangeScale "+ id + " " + newScale);

            access.scope().$emit('API.pressuregauge_userChangeScale', {id: id});
            var req = {method: "pressuregauge_userChangeScale", args: [id, newScale]};
            this.sendToServer(req);
        },     
                                    
        pressuregauge_scale:function (id, scale){
            console.log("API.pressuregauge_scale "+ id, scale);

            if ($("pressuregauge[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.pressuregauge_scale', {id: id, scale: scale});
            else
                console.error("pressuregauge with id " + id + " does not exist");
        },
        
        ///////////////////////////////////////////////////////////////
        // thermometer                                         
        ///////////////////////////////////////////////////////////////
        thermometer_create :function (x, y, id){
            console.log("API.thermometer_create "+ id);

            if ($("thermometer[data-uuid='" + id + "']").length > 0)
                console.error("thermometer with id " + id + " already exists");
            else
                access.scope().$emit('API.thermometer_create', {id: id, x: x, y: y});
        },

        thermometer_delete :function (id){
            console.log("API.thermometer_delete "+ id);

            if ($("thermometer[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.thermometer_delete', {id: id});
            else
                console.error("thermometer with id " + id + " does not exist");
        },

        thermometer_userChangeScale: function(id, newScale) {
            console.log("API.thermometer_userChangeScale "+ id + " scale "+  newScale);
            
            access.scope().$emit('API.thermometer_userChangeScale', {id: id});
            var req = {method: "thermometer_userChangeScale", args: [id, newScale]};
            this.sendToServer(req);
        },     
                                    
        thermometer_scale:function (id, scale){
            console.log("API.thermometer_scale "+ id, scale);

            if ($("thermometer[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.thermometer_scale', {id: id, scale: scale});
            else
                console.error("thermometer with id " + id + " does not exist");
        },

        ///////////////////////////////////////////////////////////////
        // balance                                         
        ///////////////////////////////////////////////////////////////

        balance_create :function (x, y, id, initObj){
            console.log("API.balance_create "+ id, initObj);
            
            if ($("balance[data-uuid='" + id + "']").length > 0)
                console.error("balance with id " + id + " already exists");

            else
                access.scope().$emit('API.balance_create', {id: id, x: x, y: y});
        },
        balance_delete :function (id){
            console.log("API.balance_delete "+ id);

            if ($("balance[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.balance_delete', {id: id});
            else
                console.error("balance with id " + id + " does not exist");
        },

        balance_group:function (id, withChild1, withChild2){
            console.log("API.balance_group "+ id, withChild1, withChild2);

            if ($("balance[data-uuid='" + id + "']").length > 0 && 
                    $("balance[data-uuid='" + id + "'] .inner-item").length == 0 && 
                    $("div.table-item[id='" + withChild1 + "']").length > 0)
                access.scope().$emit('API.balance_group', {id: id, beaker: withChild1});
            else
                console.error("balance with id " + id + " does not exist or beaker with id " + withChild1 + " does not exist or balance already in a group");
        },

        balance_unGroup:function (id){
            console.log("API.balance_unGroup"+ id);

            if ($("balance[data-uuid='" + id + "']").length > 0 && $("balance[data-uuid='" + id + "'] .inner-item").length > 0)
                access.scope().$emit('API.balance_unGroup', {id: id});
            else
                console.error("balance with id " + id + " does not exist or does not group with other objects");
        },

        balance_setZero:function (id){
            console.log("API.balance_setZero "+ id);

            if ($("balance[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.balance_setZero', {id: id});
            else
                console.error("balance with id " + id + " does not exist");
        },

        balance_userSetZero:function (id){
            console.log("API.balance_userSetZero "+ id);
            access.scope().$emit('API.balance_userSetZero', {id: id});
        },   

        balance_userChangeScale: function(id) {
            console.log("API.balance_userChangeScale "+ id);
            access.scope().$emit('API.balance_userChangeScale', {id: id});
        },     
                                    
        balance_scale:function (id, scale){
            console.log("API.balance_scale "+ id, scale);

            if ($("balance[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.balance_scale', {id: id, scale: scale});
            else
                console.error("balance with id " + id + " does not exist");
        },
        
        balance_on:function (id){
            console.log("API.balance_on "+ id);

            if ($("balance[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.balance_on', {id: id});
            else
                console.error("balance with id " + id + " does not exist");
        },
                        
        balance_off:function (id){
            console.log("API.balance_off "+ id);

            if ($("balance[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.balance_off', {id: id});
            else
                console.error("balance with id " + id + " does not exist");
        },
                        
        balance_read:function (id, weight){
            console.log("API.balance_read "+ id, weight);

            if ($("balance[data-uuid='" + id + "']").length > 0)
                access.scope().$emit('API.balance_read', {id: id, weight: weight});
            else
                console.error("balance with id " + id + " does not exist");
        },
        
        ///////////////////////////////////////////////////////////////
        // USER ACTIONS                                         
        ///////////////////////////////////////////////////////////////

        //========================DRAG EVENTS =========================

        /**
         *
         * onDragBegin
         */

         onDragBegin: function(item) {
            var req = {method:"onDragBegin",args:item};
            console.log("API.onDragBegin ");
            this.sendToServer(req);
         },   

        //========================DROP EVENTS =========================

        /**
         *
         * onDropToTableFromShelf
         * onDropComplete
         * dropsItemToItem
         * onDropToTrashComplete
         */

         onDropToTableFromShelf: function(item) {
            var id = Object.keys(item);

            console.log("item " + item);
            //USE FOR DEBUGGING
            for(var k in item){
                var itemId = k;
                var o = item[k];
                var x = o.x;
                var y = o.y;
                var filledVolume = o.filledVolume;
                var type = o.type;
                console.log(itemId,o,x,y,filledVolume,type);
                var ary = k.split("_");
                console.log('ary '+ ary.join(",   "));

                var req = {id: this.getNextFeRequestId(), method: ary[0]+"_create", args: [x,y,itemId]};
                //var req = {id: this.getNextFeRequestId(), method: "onDropToTableFromShelf", args: [k,x,y]};

                this.sendToServer(req);
                console.log("API.onDropToTableFromShelf " + JSON.stringify(item));
            }

         },

        onDropComplete: function(item) {
            var id = Object.keys(item);
            var req = {id: this.getNextFeRequestId(), method: "onDropComplete", args: [item[id].x, item[id].y, id]};

            this.sendToServer(req);
         },

         dropsItemToItem: function(newGrouping) {
console.log('newGrouping')
console.log(newGrouping)
             var child = this.getFirstChildFrom(newGrouping.child);
             var parent = this.getFirstChildFrom(newGrouping.parent);
                 //todo add iteraction rules here?
             if(child != null && child.label != undefined && parent != null && parent.label != undefined){
                 var req = {method:"onDroppedItemToItemComplete",args:[child.label, parent.label]};
                 console.log("API.onDroppedItemToItemComplete " + child.label + " " + parent.label);
                 this.sendToServer(req);
             }
         },  

         onDropToTrashComplete: function(item) {

             for(var k in item){
                 var itemId = k;
                 var o = item[k];
                 var x = o.x;
                 var y = o.y;
                 var filledVolume = o.filledVolume;
                 var type = o.type;
                 console.log(itemId,o,x,y,filledVolume,type);
                 var ary = k.split("_");
                 console.log('ary '+ ary.join(",   "));

                 var req = {id: this.getNextFeRequestId(), method: ary[0]+"_delete", args: [itemId]};
                 //var req = {id: this.getNextFeRequestId(), method: "onDropToTableFromShelf", args: [k,x,y]};

                 this.sendToServer(req);
                 console.log("API.onDropToTrashComplete " + JSON.stringify(item));
             }

            // var req = {method:"onDropToTrashComplete",args:item};
//             console.log("API.onDropToTrashComplete ");
            // this.sendToServer(req);
         },

        //========================BUNSENBURNER ========================

         onBunsenburner_adjustFlame: function(item) {
            console.log("API.onBunsenburner_adjustFlame " + JSON.stringify(item));            
         },

        //====================GENERIC ITEMS EVENTS ====================
         changeLabel: function(item, label) {
             var req = {method:"changeLabel",item:item, label:label};
             console.log("API.changeLabel: " + item + " - " + label);
             this.sendToServer(req);
         },

        //========================TABLE EVENTS ========================

        /**
         *
         * Save Table
         * Restore Table
         * Clean Table
         */

         saveTable: function() {
            console.log("API.saveTable");
            access.scope().$emit('API.saveTable');

            var req = {method:"onDropToTrashComplete"};
            console.log("API.onDropToTrashComplete ");
            this.sendToServer(req);
         },

         restoreTable: function() {
            console.log("API.restoreTable");
            access.scope().$emit('API.restoreTable');

             var req = {method:"restoreTable"};
             this.sendToServer(req);
         },

         cleanTable: function() {
            console.log("API.cleanTable");
            access.scope().$emit('API.cleanTable');
             var req = {method:"cleanTable"};
             this.sendToServer(req);

         },

        //========================API EVENTS ========================
        sendToServer:function(req){
            if( this.isConnected) {
                if (req.constructor !== Array)
                    req = [req];

                this.logApiCalls(req);
                this.primus.write(this.serialize(req));
            }else{
                console.log("WARNING, trying to send a message prior to being connected to BE");
                this.backlog.push(req);
            }
         },
         
        //=============== DESERIALIZE -N- SERIALIZE ===================        
        deserialize:function(str){
           return szr.deserialize(str);
        },

        serialize:function(str) {
            return szr.serialize(str);
        },

        logApiCalls: function(apiCalls) {
            for (var i=0, end=apiCalls.length; i<end; i++) {
                console.log('API call #' + apiCalls[i].id + ' to BE: ' + apiCalls[i].method +
                    ((apiCalls[i].args) ? ' with args = [' + apiCalls[i].args + ']' : ''));
            }
        },
        
        getNextFeRequestId: function() {
            return 'f' + feRequestCount++;
        },
        
        //=============== REMOTE DEBUGGING / VISUALIZATION ===================
        sendScreenSize: function(w, h){
            console.log("API.sendScreenSize: (" + w + "," + h + ")");
            var req = {id: this.getNextFeRequestId(), method:"sendScreenSize", args:[w, h]};
            this.sendToServer(req);
        },

        draw: function(x, y) { // x: left, y: top
            console.log("API.draw: (" + x + "," + y + ")");
            access.scope().$emit('API.draw', {x: x, y: y});
        },

        clearDraw: function() {
            console.log("API.clearDraw");
            access.scope().$emit('API.clearDraw');
         },
        //=================UTILITY ========================================
       getFirstChildFrom: function (obj){
        for (var i in obj) {
            if (obj.hasOwnProperty(i) && typeof(i) !== 'function') {
                return obj[i];
            }
        }
    }
    };
}(jQuery));