var Util = require("../Metodos/UtilidadGeneral");
var sql2 = require("mssql");

// config for your database
var config2 = {
    user: 'juan',
    password: 'Logiset.1',
    server: 'localhost',
    database: 'reportes',
    synchronize: true,
    trustServerCertificate: true
}


let crearMensaje = function( sqlv, dato ) {
     // devolver una promesa
    return new Promise(( resolve, reject ) => {
        sql2.connect(config2, async function (err) {

            if (err) console.log(err);
            var request = new sql2.Request();
            request.execute(sqlv, function (err, recordset) {
                if (err){
                    reject( err );
                    console.log(err);
                }else{
                    resolve( recordset );
                    console.log(recordset);
                }
            });
        });
    });
}



/*let crearMensaje = function( sqlv, dato ) {
     // devolver una promesa
    return new Promise(( resolve, reject ) => {
        sql.connect(config, async function (err) {

            if (err) console.log(err);
            var request = new sql.Request();
            request.input('ID', sql.NVarChar(20), dato.maindataID+""+dato.sufijo);
            console.log(dato);
            request.input('FKLokDeviceID', sql.NVarChar(20), dato.deviceID);
            request.input('TrackingContractID', sql.NVarChar(20), await Util.vacioToNull(dato.contrato));
            request.input('Latitud', sql.Float, dato.latitude);
            request.input('Longitud', sql.Float, dato.longitude);
            request.input('Posicion', sql.NVarChar(70), await Util.vacioToNull(dato.location));
            request.input('Ciudad', sql.NVarChar(50), await Util.vacioToNull(dato.ciudad));
            request.input('Departamento', sql.NVarChar(50), await Util.vacioToNull(dato.departamento));
            request.input('Pais', sql.NVarChar(50), await Util.vacioToNull(dato.pais));
            request.input('Edad', sql.NVarChar(5), "Nueva");
            request.input('Evento', sql.NVarChar(50), dato.evento);
            request.input('DateTimeUTC', sql.BigInt, dato.unixDate);
            request.input('DateTimeNormal', sql.DateTime, dato.dateTime);
            request.input('Velocidad', sql.Float, dato.speed);
            request.input('Sentido', sql.NVarChar(20), null);
            request.input('vehicleID', sql.NVarChar(20), await Util.vacioToNull(dato.vehicleID));
            request.input('clientName', sql.NVarChar(255), await Util.vacioToNull(dato.clientName));
            request.input('lock', sql.Bit, dato.locked);
            request.input('ultGeo', sql.Int, dato.ultGeo);
            request.input('nombreGeo', sql.NVarChar(100), dato.nombreGeo);
            request.input('Kms', sql.Float, dato.distanciaRuta);
            request.input('DistanciaCellTrack', sql.Float, dato.distanciaEntreCell);
            request.input('KmsOrigen', sql.Float, dato.distanciaOrigen);
            request.input('Back', sql.Bit, dato.back);
            request.input('Desvio', sql.Bit, dato.desvio);
            request.input('Alejado', sql.Bit, dato.alejado);
            request.input('Separado', sql.Bit, dato.separado);
            request.input('voltage', sql.Float, dato.battery);
            request.input('csq', sql.Int, dato.csq);
            request.input('eventID', sql.Int, await Util.vacioToNull(dato.eventType));
            request.input('NSatelites', sql.Int, dato.nSatelites);
            request.input('gpsStatus', sql.Bit, dato.gpsStatus);
            request.input('ServerName', sql.NVarChar(20), dato.nombreServer);
            request.execute(sqlv, function (err, recordset) {
                if (err){
                    reject( err );
                    console.log(err);
                }else{
                    resolve( recordset );
                    console.log(recordset);
                }
            });
        });
    });
}*/


module.exports = {
  "crearMensaje": crearMensaje
}
