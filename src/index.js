var express = require('express');
var Log = require("./logs/savelogs");
const winston = require('winston');
require('winston-daily-rotate-file');
const { combine, timestamp, json } = winston.format;
var sql = require("mssql");
var sql2 = require("mssql");
var mysql = require("mysql");
//var sqlconfig2 = require("./model/dbpool1");
var sqlconfig = require("./model/dbpool");
var query = require("./model/dbpoolMysql");
var Util = require("./Metodos/UtilidadGeneral");
var Envios = require("./Metodos/Envios");
var Alertas = require("./Metodos/Alertas");
var Negocio = require("./Datos/Negocio");
var Geografia = require("./Datos/Geografia");
var Geocoding = require("./Metodos/GeocodingApi");
var Constantes = require("./Configuracion/Constantes");

/*const logConfiguration = {
    'transports': [
        new winston.transports.File({
            filename: 'logs/example.log'
        })
    ]
};*/

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: 'combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',
});


//const logger = winston.createLogger(logConfiguration);
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(timestamp(), json()),
    transports: [fileRotateTransport],
});

var procesos = new Array();
var server="Srv_JT-2";
Principal(server,1);
Principal(server,2);
Principal(server,3);
Principal(server,4);
Principal(server,5);
Principal(server,6);
Principal(server,7);
Principal(server,8);
Principal(server,9);
Principal(server,0);

async function Principal(idServer, dd){
    procesos[dd]=new Date();
    try{
        const listaMensajes= await ListadoMensajes(dd,50);
        Comprobar(listaMensajes, idServer, Constantes.sufijo, dd);
    }catch(error){
        console.log("Error conexion");
    }

}

async function RellenarAtributos(dato){
    dato.ciudad = "";
    dato.pais = "";
    dato.departamento = "";
    dato.location = "";
    dato.vehicleID = "";
    dato.lat_d=0;
    dato.lng_d=0;
    dato.nombreGeo = '';
    dato.ultGeo = 0;
    dato.trayecto = 0;
    return dato;
}

async function Comprobar(listaMensajes, idServer, sufijo, dd){
    try{
        const start = new Date();
        logger.info("Cantidad de mensajes ("+dd+"): "+listaMensajes.length);
        var counter=0;
        if(listaMensajes.length == 0){
            setTimeout(Principal, 1000, idServer, dd);
        }
        await listaMensajes.forEach( async function(dato) {
            //COMPRABAR SI EXISTE EL DEVICE
            //console.log(dato.deviceID);
            const existe = await Negocio.EquipoExiste(dato.deviceID);
            const siexiste=existe.rowsAffected[0];
            //logger.info("Existe dispositivo? "+siexiste+" ("+(new Date()-start)+" ms)");
            //SI NO EXISTE SE CREA EL DEVICE
            if(siexiste == 0){
                try{
                    const creado = await Negocio.CrearEquipo(dato.deviceID,9);
                }catch(error){
                    console.log("error crear equipo "+dato.deviceID);
                }

                //logger.info("Dispositivo creado ("+(new Date()-start)+" ms)");
            }
            dato.dateTime=Util.formatdate(dato.dateTime);
            dato.unixDate = await Util.toUnixTime(dato.dateTime);
            dato.nombreServer= idServer;
            dato.sufijo = sufijo;
            dato.csq = dato.gsmquality;
            dato.estadoGuaya= parseInt(await Util.binarioParseado(dato.devicestatus,12));
            dato.gpsStatus=0;
            if(dato.gsmquality > 0){
                dato.gpsStatus=1;
            }
            dato.flag_Lock=dato.locked;
            dato.dataID = 0;
            try{
                dato.dataID = parseInt(dato.mwDataID);
            }catch(error){
                dato.dataID = 0;
            }
            dato.nSatelites = 0;
            try{
                dato.nSatelites = dato.satquality;
            }catch(error){
                dato.nSatelites = 0;
            }
            dato.eventType = "";
            dato.contrato = "none";

            dato = await RellenarAtributos(dato);
            //INTERPRETA LA ALERTA GENERADA POR EL DEVICE
            dato = await Negocio.LeerApertura(dato);
            //logger.info("Leer Apertura ("+(new Date()-start)+" ms)");
            //OBTIENE SI ESTA EN ZONA SEGURA O NO
            dato = await Negocio.Asegurado(dato);
            //logger.info("Asegurado ("+(new Date()-start)+" ms)");
            dato.fechaprueba=dato.dateTime;
            var ultActualizacion = Util.formatdate(await Negocio.TomarFechaDevice(dato));
            //OBTIENE SI ESTA EN ZONA SEGURA O NO
            dato = await Negocio.InfoMensaje(dato);
            //logger.info("Info Mensaje ("+(new Date()-start)+" ms)");
            //OBTIENE DATOS COMO ULT GEOCERCA, DISTANCIA DEL DISPOTIVO CON RESPECTO AL OTRO, KM DE SALIDA, DISTANCIA RECORRIDA, OBTENCION DE GEOCERCAS, SALIDA DE RUTA, INGRESO A CIUDAD DE DESTINO, ETC,
            //ESTE DEBERIA SER EL METODO MAS CARGADO DE TODO EL PROCESO
            dato = await Negocio.LeerVarios(dato);
            //logger.info("Leer Varios ("+(new Date()-start)+" ms)");
            //COMPRUEBO LA HORA Y SI ES MAYOR A LA ANTERIOR ENVIO LAS ALERTAS Y SI EL BIT DE ALERTAS ESTA ACTIVO
            dato.actualizar=false;
            if(dato.dateTime > ultActualizacion){
                dato.actualizar=true;
            }
            //logger.info("finalizo procesos internos1 ("+(new Date()-start)+" ms)");
            if(dato.latitude == 0 || dato.longitude == 0){
                //logger.info("finalizo procesos internos2 ("+(new Date()-start)+" ms)");
                var posJson = await Geografia.LatitudeLongitude(dato.contrato);
                //logger.info("finalizo procesos internos3 ("+(new Date()-start)+" ms)");
                dato.latitude = posJson.lat;
                dato.longitude = posJson.lng;
            }
            //logger.info("finalizo procesos internos4 ("+(new Date()-start)+" ms)");
            var lati = dato.latitude.toString().replace(",",".");
            var longi = dato.longitude.toString().replace(",",".");
            if(lati.indexOf(".") == -1){
                lati = lati + ".00";
            }
            if(longi.indexOf(".") == -1){
                longi = longi + ".00";
            }
            //logger.info("finalizo procesos internos5 ("+(new Date()-start)+" ms)");

            //SI LA VELOCIDAD DEL DISPOSITIVO ESTA EN 0 ENTONCES RECICLA INFO
            if((dato.speed <= Constantes.minSpeed) && !dato.hasAlert && Constantes.checkPosicion){
                //logger.info("finalizo procesos internos6 ("+(new Date()-start)+" ms)");
            }else{
                //OBTENGO GEORUTA
                //logger.info("finalizo procesos internos7 ("+(new Date()-start)+" ms)");
                try{
                    var geoPunto = await Geografia.ObtenerCerca(dato.proyecto, dato.fkEmpresa, dato.deviceID);
                    dato.nombreGeo = geoPunto.nombre;
                    dato.ultGeo = geoPunto.id;
                }catch(error){
                    dato.nombreGeo='';
                    dato.ultGeo=0;
                }

                //logger.info("finalizo procesos internos8 ("+(new Date()-start)+" ms)");
                //OBTENGO POSICIÓN
                dato = await Geocoding.SetPosition(dato, dato.pais, dato.departamento, dato.ciudad, dato.location);
                //logger.info("Obtener posicion ("+(new Date()-start)+" ms)");
                //console.log(dato);
                if(dato.lat_d != 0 && dato.lng_d != 0){
                    var lati2= dato.lat_d.toString().replace(',','.');
                    var longi2= dato.lng_d.toString().replace(',','.');
                    //OBTENGO DISTANCIAS Y TIEMPOS
                    var obj = Geocoding.RetornaDistanciayTiempo(lati, longi, lati2, longi2, dato);
                    //logger.info("Retorna distancia y tiempo ("+(new Date()-start)+" ms)");
                    if(obj.tiempoh != "" && obj.tiempos != ""){
                        dato.duracionS = obj.tiempos;
                        dato.duracionT = obj.tiempoh;
                        dato.distanciaM = obj.distanciam;
                        dato.distanciaT = obj.distanciakm;
                    }
                }
            }

            //SI EL BIT DE LAS ALERTAS ESTA ACTIVO EN EL CONTRATO Y LA FECHA DEL MENSAJE ES POSTERIOR A LA ULTIMA ACTUALIZACION
            //DEL DISPOSITIVO, ESTE VA AL CENTRO DE ALERTAS PARA ENVIAR LAS ALERTA EN EL CASO DE QUE SE HAYAN GENERADO

            if(dato.alertasActivas && dato.actualizar){

                //console.log("entro a alertas");
                //await Alertas.CentroDeAlertas(dato);
                //logger.info("centro de alertas ("+(new Date()-start)+" ms)");
            }
            //console.log(dato);
            //TENIENDO TODA LA INFORMACION NECESARIA COMPLETA SE CREA EL MENSAJE EN LA BASE DE DATOS SQL SERVER REPORTES
            //logger.info("finalizo procesos internos ("+(new Date()-start)+" ms)");
            const respuesta = await CrearMensaje(dato);
            //logger.info("Crear mensaje en reportes ("+(new Date()-start)+" ms)");
            //console.log(respuesta);
            //TENIENDO TODA LA INFORMACION NECESARIA COMPLETA SE ACTUALIZAN DATOS EN LA BASE DE DATOS SQL SERVER INFOCARGA
            const respuesta2 = await CrearMensaje2(dato);

            //logger.info("Actualizar datos en inforcarga ("+(new Date()-start)+" ms)");
            //console.log(respuesta2);
            //SE ACTUALIZA EL MENSAJE EN LA BASE DE DATOS MYSQL Y SE COLOCA COMO YA LEIDO

            if(respuesta.returnValue == 1){
                //console.log(dato);
                const respuesta3 = await Negocio.ActualizarOrigen(dato.maindataID);
            }
            counter++;
            if(listaMensajes.length == counter){
                logger.info("finalizo ("+dd+") ("+(new Date()-start)+" ms)");
                setTimeout(Principal, 1000, idServer, dd);
            }

        });
    }catch(error){
        Log.saveLog("error principal catch: "+error);
        setTimeout(Principal, 1000, idServer, dd);
    }


}
//FUNCION QUE DEVUELVE LA LISTA DE MENSAJES
async function ListadoMensajes(dd, cantidadregistros){

    var consulta= "select * ";
    consulta += "from ((select CONCAT(CAST(m.maindataID as CHAR(50)), 'M') as maindataID, m.deviceID, CONVERT(m.dateTime, CHAR) dateTime, insertDateTime, m.latitude, m.longitude, m.speed, m.satquality, m.battery, m.gsmquality, -1 as locked, 0 as evento, m.devicestatus, m."+Constantes.bitactualizado+" ";
    consulta += "from maindata m WHERE m."+Constantes.bitactualizado+" = 0) ";
    consulta += "union all ";
    consulta += "(select CONCAT(CAST(l.lockdataID as CHAR(50)), 'A') as maindataID, l.deviceID, CONVERT(l.dateTime, CHAR) dateTime, insertDateTime, l.latitude, l.longitude, l.speed, 5, 99, 0 as gsmquality, l.unlockstatus as locked, l.eventsource as evento, '' as devicestatus, l."+Constantes.bitactualizado+" ";
    consulta += "from lockdata l WHERE l."+Constantes.bitactualizado+" = 0)) x ";

    if(dd == "*"){
        consulta += "order by dateTime asc Limit "+cantidadregistros;
    }else{
        consulta += "WHERE RIGHT(CONVERT(x.deviceID, CHAR), 1) = '"+dd+"' order by  dateTime asc Limit "+cantidadregistros;
    }
    return await query(consulta);
}

//CONSUME Y EJECUTA EL PROCEDIMIENTO DE ALMACENADO DE LA BASE DE DATOS SQL SERVER
async function CrearMensaje(dato){
    return await sqlconfig.crearMensajeReportes("InsertWSJ701TrackMsg", dato);
}

async function CrearMensaje2(dato){
    return await sqlconfig.crearMensaje("InsertWSJ701TrackMsg", dato);
}

var cron = require('cron');

var job = new cron.CronJob('0 * * * * *', function() {
    let date_ob = new Date();
  	for(var i=0; i<10; i++){
        var dateproceso=procesos[i];

        let resta = (date_ob.getTime() - dateproceso.getTime());
        if(resta>=120000){
            Log.saveLog("Se detuvo el proceso "+i);
            setTimeout(Principal, 1000, server, i);
        }
    }
}, null, true);
