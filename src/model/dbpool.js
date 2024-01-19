var Util = require("../Metodos/UtilidadGeneral");
var Log = require("../logs/savelogs");
var sql = require("mssql");

// config for your database
var config = {
    user: 'juan',
    password: 'Logiset.1',
    server: '1111009-DBSRV',
    database: 'infocarga',
    synchronize: true,
    trustServerCertificate: true,
    connectionTimeout: 60000,
    requestTimeout:60000
}

var config2 = {
    user: 'juan',
    password: 'Logiset.1',
    server: '1111009-DBSRV',
    database: 'reportes2',
    synchronize: true,
    trustServerCertificate: true,
    connectionTimeout: 60000,
    requestTimeout:60000
}



let query = function( sqlv, values ) {
     // devolver una promesa
    return new Promise(( resolve, reject ) => {
        sql.connect(config, function (err) {

            if (err) console.log(err);
            var request = new sql.Request();
            request.query(sqlv, function (err, recordset) {
                if (err){
                    Log.saveLog("error query("+sqlv+"): "+err);
                    resolve( err );
                }else{
                    resolve( recordset );
                }
            });
        });
    });
}

let procedure_registroSmsColombia = function( sqlv, numeros, mensaje, contrato ) {
     // devolver una promesa
    return new Promise(( resolve, reject ) => {
        sql.connect(config, function (err) {

            if (err) console.log(err);
            var request = new sql.Request();
            console.log(numeros);
            request.input('celulares', sql.NVarChar(4000), numeros);
            request.input('contrato', sql.NVarChar(20), contrato);
            request.input('mensaje', sql.NVarChar(500), mensaje);
            request.execute(sqlv, function (err, recordset) {
                if (err){
                    Log.saveLog("error procedure_registroSmsColombia: "+err);
                    resolve( err );
                }else{
                    resolve( recordset );
                }
            });
        });
    });
}

let procedure_registroSmsEcuador = function( registro, numeros, mensaje, contrato ) {
     // devolver una promesa
    return new Promise(( resolve, reject ) => {
        sql.connect(config, function (err) {

            if (err) console.log(err);
            var request = new sql.Request();
            var consulta="INSERT INTO RegistroSms(numeros, mensaje, contrato, mensaje_generado) values ('"+numeros+"','"+mensaje+"','"+contrato+"','"+registro+"')"
            request.query(consulta, function (err, recordset) {
                if (err){
                    Log.saveLog("error procedure_registroSmsEcuador: "+err);
                    resolve( err );
                }else{
                    resolve( recordset );
                }
            });
        });
    });
}

let crearMensaje = function( sqlv, dato ) {
     // devolver una promesa

    return new Promise(( resolve, reject ) => {
        try{
            sql.connect(config, async function (err) {

                if (err){
                    Log.saveLog("error crearMensaje: "+err);
                    resolve( {'returnValue':0} );
                }
                var request = new sql.Request();
                request.input('FKLokDeviceID', sql.NVarChar(20), dato.deviceID);
                request.input('TrackingContractID', sql.NVarChar(20), dato.contrato);
                request.input('Latitud', sql.Float, dato.latitude);
                request.input('Longitud', sql.Float, dato.longitude);
                request.input('Posicion', sql.NVarChar(70), dato.location);
                request.input('Ciudad', sql.NVarChar(50), await Util.vacioToNull(dato.ciudad));
                request.input('Departamento', sql.NVarChar(50), await Util.vacioToNull(dato.departamento));
                request.input('Pais', sql.NVarChar(50), await Util.vacioToNull(dato.pais));
                request.input('Edad', sql.NVarChar(5), "Nueva");
                request.input('Evento', sql.NVarChar(50), dato.evento);
                request.input('DateTimeUTC', sql.BigInt, dato.unixDate);
                request.input('DateTimeNormal', sql.DateTime, dato.dateTime);
                request.input('Velocidad', sql.Float, dato.speed);
                request.input('Sentido', sql.NVarChar(20), null);
                request.input('ID', sql.NVarChar(20), dato.maindataID+""+dato.sufijo);
                request.input('clientName', sql.NVarChar(255), await Util.vacioToNull(dato.clientName));
                request.input('vehicleID', sql.NVarChar(20), await Util.vacioToNull(dato.vehicleID));
                request.input('voltage', sql.Float, dato.battery);
                request.input('lock', sql.Bit, dato.locked);
                request.input('ultGeo', sql.Int, dato.ultGeo);
                request.input('nombreGeo', sql.NVarChar(100), await Util.vacioToNull(dato.nombreGeo));
                request.input('Kms', sql.Float, dato.distanciaRuta);
                request.input('DistanciaCellTrack', sql.Float, dato.distanciaEntreCell);
                request.input('KmsOrigen', sql.Float, dato.distanciaOrigen);
                request.input('Back', sql.Bit, dato.back);
                request.input('Desvio', sql.Bit, dato.desvio);
                request.input('Alejado', sql.Bit, dato.alejado);
                request.input('Separado', sql.Bit, dato.separado);
                request.input('csq', sql.Int, dato.csq);
                request.input('eventID', sql.Int, await Util.vacioToNull(dato.eventType));
                request.input('NSatelites', sql.Int, dato.nSatelites);
                request.input('gpsStatus', sql.Bit, dato.gpsStatus);
                request.input('ServerName', sql.NVarChar(20), dato.nombreServer);
                request.execute(sqlv, function (err, recordset) {
                    if (err){
                        Log.saveLog("error crearMensaje execute: "+err);
                        resolve( {'returnValue':0} );
                    }else{
                        resolve( recordset );
                    }
                });
            });
        }catch(error){
            Log.saveLog("error crearMensaje catch: "+err);
            resolve( {'returnValue':0} );
        }

    });
}

let crearMensajeReportes = async function( sqlv, dato ) {
     // devolver una promesa
    const pool = new sql.ConnectionPool(config2);
    try{

        await pool.connect();
        var request = await pool.request();
        request.input('FKLokDeviceID', sql.NVarChar(20), dato.deviceID);
        request.input('TrackingContractID', sql.NVarChar(20), dato.contrato);
        request.input('Latitud', sql.Float, dato.latitude);
        request.input('Longitud', sql.Float, dato.longitude);
        request.input('Posicion', sql.NVarChar(70), dato.location);
        request.input('Ciudad', sql.NVarChar(50), await Util.vacioToNull(dato.ciudad));
        request.input('Departamento', sql.NVarChar(50), await Util.vacioToNull(dato.departamento));
        request.input('Pais', sql.NVarChar(50), await Util.vacioToNull(dato.pais));
        request.input('Edad', sql.NVarChar(5), "Nueva");
        request.input('Evento', sql.NVarChar(50), dato.evento);
        request.input('DateTimeUTC', sql.BigInt, dato.unixDate);        
        console.log(dato.dateTime);
        request.input('DateTimeNormal', sql.DateTime, Util.formatdate(await Util.addHourDate(dato.dateTime,-7)));
        //request.input('DateTimeNormal', sql.DateTime, '2022-11-23 03:08:00');
        request.input('Velocidad', sql.Float, dato.speed);
        request.input('Sentido', sql.NVarChar(20), null);
        request.input('ID', sql.NVarChar(20), dato.maindataID+""+dato.sufijo);
        request.input('clientName', sql.NVarChar(255), await Util.vacioToNull(dato.clientName));
        request.input('vehicleID', sql.NVarChar(20), await Util.vacioToNull(dato.vehicleID));
        request.input('voltage', sql.Float, dato.battery);
        request.input('lock', sql.Bit, dato.locked);
        request.input('ultGeo', sql.Int, dato.ultGeo);
        request.input('nombreGeo', sql.NVarChar(100), await Util.vacioToNull(dato.nombreGeo));
        request.input('Kms', sql.Float, dato.distanciaRuta);
        request.input('DistanciaCellTrack', sql.Float, dato.distanciaEntreCell);
        request.input('KmsOrigen', sql.Float, dato.distanciaOrigen);
        request.input('Back', sql.Bit, dato.back);
        request.input('Desvio', sql.Bit, dato.desvio);
        request.input('Alejado', sql.Bit, dato.alejado);
        request.input('Separado', sql.Bit, dato.separado);
        request.input('csq', sql.Int, dato.csq);
        request.input('eventID', sql.Int, await Util.vacioToNull(dato.eventType));
        request.input('NSatelites', sql.Int, dato.nSatelites);
        request.input('gpsStatus', sql.Bit, dato.gpsStatus);
        request.input('ServerName', sql.NVarChar(20), dato.nombreServer);
        const resultado=await request.execute(sqlv);
        return resultado;
    }catch(err){
        Log.saveLog("error crearMensajeReportes: "+err);
        return( {success: false} );
    }finally{
        pool.close();
    }
}

module.exports = {
  "query":query,
  "procedure_registroSmsColombia": procedure_registroSmsColombia,
  "procedure_registroSmsEcuador": procedure_registroSmsEcuador,
  "crearMensaje": crearMensaje,
  "crearMensajeReportes": crearMensajeReportes
}
