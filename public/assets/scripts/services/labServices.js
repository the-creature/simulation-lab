/*
 * lab app service.
 */
var labServices = angular.module('labServices', ['ngResource']);


//factory a virtual lab service.
labServices.factory('uuid', [
    function () {
        //Store global counter
        var counter = 0;

        var uuidrequest = {
            new: function () {
                function _p8(s) {
                    var p = (Math.random().toString(16) + "000000000").substr(2, 8);
                    return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
                }

                return _p8() + _p8(true) + _p8(true) + _p8();
            },

            //New uuid format with item name and a 1 based counter
            newWithName: function (name) {
                counter++;
                return name + "_" + counter;
            },

            empty: function () {
                return '00000000-0000-0000-0000-000000000000';
            },

            //Used when restoring table status
            resetCounter: function() {
                counter = 0;
            },
            
            //When restoring table, the counter should be adjusted to the highest
            //element uuid
            setCounter: function(value) {
                if (value > counter) {
                    counter = value;
                }
            }
        };
        return uuidrequest;
    }
])

.factory('SocketService', function () {
    //     //TODO move this port into an configuration dependency injected
    //     var primus = new Primus('http://localhost:8888/');   //NOTE websocket port/traffic not http
    //     // API.init(primus);
    //     //
    //     // INBOUND CALLS FE<-BE
    //     //
    //     primus.on('data', function received(data) {
    //           console.log("got FE data '"+ data );
    //         var so = API.deserialize(data);
    //         console.log("Server is calling FE API method '" + so.method + "' with args: " + so.args);
    //         var fn = API[so.method];
    //         if (typeof(fn) === undefined) {
    //             console.log(so.method + " unrecognized");
    //         } else {
    //             //remote procedure call request from the server
    //             //XXX TODO queue these as they may take non-trivial time, or other async requestions
    //             try {
    //                 fn.apply(API, so.args);
    //             } catch (er) {
    //                 console.log("ERROR in the API call" + er);
    //             }
    //         }
    //     });


        return {
        on: function (eventName, callback) {

        },

        emit: function (eventName, data, callback) {
            //
            // OUTBOUND CALLS FE->BE
            //
            console.log("writing to BE " + eventName + data);
            primus.write(eventName + "_" + data);
        }
    };
});
