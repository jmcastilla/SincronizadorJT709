var sqlconfig = require("../model/dbpool");
var Alertas = require("../Datos/Alertas");
var Util = require("./UtilidadGeneral");
var Geocoding = require("./GeocodingApi");
var Envios = require("./Envios");
var Constantes = require("../Configuracion/Constantes");
var Geografia = require("../Datos/Geografia");

//METODO QUE SE ENCARGA DE ENVIAR LAS ALERTAS GENERADAS
async function CentroDeAlertas(dato){
    var resultado=null;
    //cerrado
    /*if(dato.locked && !dato.ultAlerta){
        resultado = await Sealed(dato, 3);
    }*/
    //apertura
    if(!dato.locked && dato.ultAlerta){
        resultado = await UnSealed(dato, 3);
    }
    //cambio cerca
    if(dato.ultGeo != 0 && (dato.ultGeo != dato.anteriorGeo)){
        resultado = await GeoCerca(dato, 3, dato.nombreGeo);
    }
    //bateria baja
    if(dato.battery <=3.5 && dato.ultVoltage){
        resultado = await BateriaBaja(dato, 3);
    }
    //velocidad
    if(dato.speed > 80 && dato.ultSpeed <= 80){
        resultado = await Velocidad(dato, 3);
    }
    //alejado zona segura
    if(!dato.alejado && dato.flag){
        resultado = await Alejamiento(dato, 3);
    }
    //desvio de dispositivo
    if(dato.desvio && !dato.desvioF){
        resultado = await Desvio(dato, 3);
    }
}

//CERRADO DE DISPOSITIVO
async function Sealed(dato, tipo){
    try{
        var numeros = await Alertas.listaSMS(dato.deviceID, "Telefono", "CerradoT");
        if(numeros.length > 0){
            var sms = "El dispositivo "+dato.deviceID;
            if(dato.aliasEmpresa != ""){
                sms+=" ("+dato.aliasEmpresa+")";
            }
            if(dato.vehicleID != ""){
                sms+=" ("+dato.vehicleID+")";
            }
            if(dato.modalidad != ""){
                sms+=" ("+dato.modalidad+")";
            }
            sms+=" reporta cierre. "+dato.ciudad+","+dato.departamento+". "+await Util.addHourDate(dato.dateTime,-5)+".";
            var link = await Geocoding.ShortURL("http://maps.google.es/maps?q=" + dato.latitude + "," + dato.longitude);
            if(link != "error"){
                sms+=" "+link;
            }else{
                link="";
            }
            if(Constantes.idProyectosEcuador.includes("|"+dato.proyecto+"|")){
                await sqlconfig.procedure_registroSmsColombia("LokRegistrarSMSColombia", numeros, sms, dato.contrato);
            }else{
                sms = "El dispositivo "+dato.deviceID+" ("+dato.contrato+")("+dato.clientName+") reporta cierre. "+dato.ciudad+","+dato.departamento+". "+await Util.addHourDate(dato.dateTime,-5)+". "+link;
                var id="";
                if(dato.nombreServer == "IFX"){
                    id= dato.maindataID +"000";
                }else if(dato.nombreServer == "DEDK152"){
                    id= dato.maindataID +"152";
                }else if(dato.nombreServer == "DEDK153"){
                    id= dato.maindataID +"153";
                }
                await Envios.SendSMSEclipsoft(numeros, sms, id, dato.contrato, await Util.addHourDate(dato.dateTime,-5));
            }
        }
        await Envios.SendMail(dato, "El equipo <b>" + dato.deviceID + "</b> ha sido cerrado", "Cierre del dispositivo", tipo, 1, "CerradoM", 3);
    }catch(error){
          console.log("error alertas.Sealed");
    }
}

//ALERTA DE DESVIO
async function Desvio(dato, tipo){
    try{
        var numeros = await Alertas.listaSMS(dato.deviceID, "Telefono", "DesvioT");
        if(numeros.length > 0){
            var sms = "El dispositivo "+dato.deviceID;
            if(dato.aliasEmpresa != ""){
                sms+=" ("+dato.aliasEmpresa+")";
            }
            if(dato.vehicleID != ""){
                sms+=" ("+dato.vehicleID+")";
            }
            if(dato.modalidad != ""){
                sms+=" ("+dato.modalidad+")";
            }
            sms+=" se ha desviado de la ruta. "+dato.ciudad+","+dato.departamento+". "+await Util.addHourDate(dato.dateTime,-5)+".";
            var link = await Geocoding.ShortURL("http://maps.google.es/maps?q=" + dato.latitude + "," + dato.longitude);
            if(link != "error"){
                sms+=" "+link;
            }else{
                link="";
            }
            if(Constantes.idProyectosEcuador.includes("|"+dato.proyecto+"|")){
                await sqlconfig.procedure_registroSmsColombia("LokRegistrarSMSColombia", numeros, sms, dato.contrato);
            }else{
                sms = "El dispositivo "+dato.deviceID+" ("+dato.contrato+")("+dato.clientName+") se ha desviado de la ruta. "+dato.ciudad+","+dato.departamento+". "+await Util.addHourDate(dato.dateTime,-5)+". "+link;
                var id="";
                if(dato.nombreServer == "IFX"){
                    id= dato.maindataID +"000";
                }else if(dato.nombreServer == "DEDK152"){
                    id= dato.maindataID +"152";
                }else if(dato.nombreServer == "DEDK153"){
                    id= dato.maindataID +"153";
                }
                await Envios.SendSMSEclipsoft(numeros, sms, id, dato.contrato, await Util.addHourDate(dato.dateTime,-5));
            }
        }
        await Envios.SendMail(dato, "El equipo <b>" + dato.deviceID + "</b> se ha desviado de la ruta", "Desvio de ruta", tipo, 1, "DesvioM", 3);
    }catch(error){
        console.log("error alertas.desvio");
    }
}

//ALERTA DE APERTURA
async function UnSealed(dato, tipo){
    try{
        //SE OBTIENE LA GEOCERCA DONDE SE GENERO LA APERTURA
        var nombre = await Geografia.EstaEnCerca(dato.latitude, dato.longitude, dato.contrato);
        //SI NO TIENE UNA GEOCERCA AUTORIZADA PARA APERTURA, SE ENVIA LA ALERTA CORRIENTE, SOLO AVISANDO LA APERTURA
        if(nombre.trim() == "geo-none"){
            if(tipo == 3){
                var numeros = await Alertas.listaSMS(dato.deviceID, "Telefono", "AperturaT");
                if(numeros.length > 0){
                    var sms = "El dispositivo "+dato.deviceID;
                    if(dato.aliasEmpresa != ""){
                        sms+=" ("+dato.aliasEmpresa+")";
                    }
                    if(dato.vehicleID != ""){
                        sms+=" ("+dato.vehicleID+")";
                    }
                    if(dato.modalidad != ""){
                        sms+=" ("+dato.modalidad+")";
                    }
                    sms+=" reporta apertura. "+dato.ciudad+","+dato.departamento+". "+await Util.addHourDate(dato.dateTime,-5)+".";
                    var link = await Geocoding.ShortURL("http://maps.google.es/maps?q=" + dato.latitude + "," + dato.longitude);
                    if(link != "error"){
                        sms+=" "+link;
                    }else{
                        link="";
                    }
                    if(Constantes.idProyectosEcuador.includes("|"+dato.proyecto+"|")){
                        await sqlconfig.procedure_registroSmsColombia("LokRegistrarSMSColombia", numeros, sms, dato.contrato);
                    }else{
                        sms = "El dispositivo "+dato.deviceID+" ("+dato.contrato+")("+dato.clientName+") reporta apertura. "+dato.ciudad+","+dato.departamento+". "+await Util.addHourDate(dato.dateTime,-5)+". "+link;
                        var id="";
                        if(dato.nombreServer == "IFX"){
                            id= dato.maindataID +"000";
                        }else if(dato.nombreServer == "DEDK152"){
                            id= dato.maindataID +"152";
                        }else if(dato.nombreServer == "DEDK153"){
                            id= dato.maindataID +"153";
                        }
                        await Envios.SendSMSEclipsoft(numeros, sms, id, dato.contrato, await Util.addHourDate(dato.dateTime,-5));
                    }
                }
                await Envios.SendMail(dato, "El equipo <b>" + dato.deviceID + "</b> reporta una apertura", "Apertura de dispositivo.", tipo, 1, "AperturaM", 4);
            }
        }
        //SI TIENE GEOCERGA DE APERTURA ASIGANADA, PERO SE ABRIO POR FUERA DE ESTA, ENVIA UN MENSAJE DIFERENTE AVISANDO DE ESTA
        else if(nombre.trim() == "none"){
            if(tipo == 3){
                var numeros = await Alertas.listaSMS(dato.deviceID, "Telefono", "AperturaT");
                if(numeros.length > 0){
                    var sms = "-ATENCION- El dispositivo "+dato.deviceID;
                    if(dato.aliasEmpresa != ""){
                        sms+=" ("+dato.aliasEmpresa+")";
                    }
                    if(dato.vehicleID != ""){
                        sms+=" ("+dato.vehicleID+")";
                    }
                    if(dato.modalidad != ""){
                        sms+=" ("+dato.modalidad+")";
                    }
                    sms+=" reporta apertura en zona no autorizada. "+dato.ciudad+","+dato.departamento+". "+await Util.addHourDate(dato.dateTime,-5)+".";
                    var link = await Geocoding.ShortURL("http://maps.google.es/maps?q=" + dato.latitude + "," + dato.longitude);
                    if(link != "error"){
                        sms+=" "+link;
                    }else{
                        link="";
                    }
                    if(Constantes.idProyectosEcuador.includes("|"+dato.proyecto+"|")){
                        await sqlconfig.procedure_registroSmsColombia("LokRegistrarSMSColombia", numeros, sms, dato.contrato);
                    }else{
                        sms = "El dispositivo "+dato.deviceID+" ("+dato.contrato+")("+dato.clientName+") reporta apertura en zona no autorizada. "+dato.ciudad+","+dato.departamento+". "+await Util.addHourDate(dato.dateTime,-5)+". "+link;
                        var id="";
                        if(dato.nombreServer == "IFX"){
                            id= dato.maindataID +"000";
                        }else if(dato.nombreServer == "DEDK152"){
                            id= dato.maindataID +"152";
                        }else if(dato.nombreServer == "DEDK153"){
                            id= dato.maindataID +"153";
                        }
                        await Envios.SendSMSEclipsoft(numeros, sms, id, dato.contrato, await Util.addHourDate(dato.dateTime,-5));
                    }
                }
                await Envios.SendMail(dato, "¡ATENCION! El equipo <b>" + dato.deviceID + "</b> reporta una apertura en zona no autorizada.", "Apertura de dispositivo en zona no autorizada.", tipo, 1, "AperturaM", 4);
            }
        }
        //SI ESTA DENTRO DE LA GEOCERCA Y SE PRESENTO LA APERTURA, SOLO SE ENVIA EL CORREO CONFIRMANDO DE ESTA
        else{
            if(tipo == 3){
                var numeros = await Alertas.listaSMS(dato.deviceID, "Telefono", "AperturaT");
                if(numeros.length > 0){
                    var sms = "El dispositivo "+dato.deviceID;
                    if(dato.aliasEmpresa != ""){
                        sms+=" ("+dato.aliasEmpresa+")";
                    }
                    if(dato.vehicleID != ""){
                        sms+=" ("+dato.vehicleID+")";
                    }
                    if(dato.modalidad != ""){
                        sms+=" ("+dato.modalidad+")";
                    }
                    sms+=" reporta apertura en "+nombre+". "+dato.ciudad+","+dato.departamento+". "+await Util.addHourDate(dato.dateTime,-5)+".";
                    var link = await Geocoding.ShortURL("http://maps.google.es/maps?q=" + dato.latitude + "," + dato.longitude);
                    if(link != "error"){
                        sms+=" "+link;
                    }else{
                        link="";
                    }
                    if(Constantes.idProyectosEcuador.includes("|"+dato.proyecto+"|")){
                        await sqlconfig.procedure_registroSmsColombia("LokRegistrarSMSColombia", numeros, sms, dato.contrato);
                    }else{
                        sms = "El dispositivo "+dato.deviceID+" ("+dato.contrato+")("+dato.clientName+") reporta apertura en "+nombre+". "+dato.ciudad+","+dato.departamento+". "+await Util.addHourDate(dato.dateTime,-5)+". "+link;
                        var id="";
                        if(dato.nombreServer == "IFX"){
                            id= dato.maindataID +"000";
                        }else if(dato.nombreServer == "DEDK152"){
                            id= dato.maindataID +"152";
                        }else if(dato.nombreServer == "DEDK153"){
                            id= dato.maindataID +"153";
                        }
                        await Envios.SendSMSEclipsoft(numeros, sms, id, dato.contrato, await Util.addHourDate(dato.dateTime,-5));
                    }
                }
                await Envios.SendMail(dato, "El equipo <b>" + dato.deviceID + "</b> reporta una apertura en zona autorizada("+nombre+").", "Apertura de dispositivo en zona autorizada.", tipo, 1, "AperturaM", 4);
            }
        }
    }catch(error){
          console.log("error alertas.unsealed");
    }
}

//ALERTA DE PASO O ENTRADA A UNA GEOCERCA
async function GeoCerca(dato, tipo, geo){
    try{
        var numeros = await Alertas.listaSMS(dato.deviceID, "Telefono", "GeocercasT");
        if(numeros.length > 0){
            var sms = "El dispositivo "+dato.deviceID;
            if(dato.aliasEmpresa != ""){
                sms+=" ("+dato.aliasEmpresa+")";
            }
            if(dato.vehicleID != ""){
                sms+=" ("+dato.vehicleID+")";
            }
            if(dato.modalidad != ""){
                sms+=" ("+dato.modalidad+")";
            }
            sms+=" reporta ingreso a "+geo+". "+await Util.addHourDate(dato.dateTime,-5)+".";
            var link = await Geocoding.ShortURL("http://maps.google.es/maps?q=" + dato.latitude + "," + dato.longitude);
            if(link != "error"){
                sms+=" "+link;
            }else{
                link="";
            }
            if(Constantes.idProyectosEcuador.includes("|"+dato.proyecto+"|")){
                await sqlconfig.procedure_registroSmsColombia("LokRegistrarSMSColombia", numeros, sms, dato.contrato);
            }else{
                sms = "El dispositivo "+dato.deviceID+" ("+dato.contrato+")("+dato.clientName+") reporta ingreso a "+geo+". "+await Util.addHourDate(dato.dateTime,-5)+". "+link;
                var id="";
                if(dato.nombreServer == "IFX"){
                    id= dato.maindataID +"000";
                }else if(dato.nombreServer == "DEDK152"){
                    id= dato.maindataID +"152";
                }else if(dato.nombreServer == "DEDK153"){
                    id= dato.maindataID +"153";
                }
                await Envios.SendSMSEclipsoft(numeros, sms, id, dato.contrato, await Util.addHourDate(dato.dateTime,-5));
            }
        }
        await Envios.SendMail(dato, "El equipo <b>" + dato.deviceID + "</b> reporta ingreso a <b>"+geo+"</b>.", "Ingreso a geocerca.", tipo, 2, "GeocercasM", 5);
    }catch(error){
        console.log("error alertas.geocerca");
    }
}

//ALERTA DE ALEJAMIENTO DE LA ZONA SEGURA ASIGNADA
async function Alejamiento(dato, tipo){
    try{
        var numeros = await Alertas.listaSMS(dato.deviceID, "Telefono", "ZonaSeguraT");
        if(numeros.length > 0){
            var sms = "El dispositivo "+dato.deviceID;
            if(dato.aliasEmpresa != ""){
                sms+=" ("+dato.aliasEmpresa+")";
            }
            if(dato.vehicleID != ""){
                sms+=" ("+dato.vehicleID+")";
            }
            if(dato.modalidad != ""){
                sms+=" ("+dato.modalidad+")";
            }
            sms+=" se movio de la zona segura. "+await Util.addHourDate(dato.dateTime,-5)+".";
            var link = await Geocoding.ShortURL("http://maps.google.es/maps?q=" + dato.latitude + "," + dato.longitude);
            if(link != "error"){
                sms+=" "+link;
            }else{
                link="";
            }
            if(Constantes.idProyectosEcuador.includes("|"+dato.proyecto+"|")){
                await sqlconfig.procedure_registroSmsColombia("LokRegistrarSMSColombia", numeros, sms, dato.contrato);
            }else{
                sms = "El dispositivo "+dato.deviceID+" ("+dato.contrato+")("+dato.clientName+") se movio de la zona segura. "+await Util.addHourDate(dato.dateTime,-5)+". "+link;
                var id="";
                if(dato.nombreServer == "IFX"){
                    id= dato.maindataID +"000";
                }else if(dato.nombreServer == "DEDK152"){
                    id= dato.maindataID +"152";
                }else if(dato.nombreServer == "DEDK153"){
                    id= dato.maindataID +"153";
                }
                await Envios.SendSMSEclipsoft(numeros, sms, id, dato.contrato, await Util.addHourDate(dato.dateTime,-5));
            }
        }
        await Envios.SendMailSeparacion(dato, "El equipo <b>" + dato.deviceID + "</b> se ha alejado de la zona segura.", "Salida Zona Segura", 1);
    }catch(error){
        console.log("error alertas.alejamiento");
    }

}

//ALERTA POR BATERIA BAJA, SE LE CONSIDERA BATERIA BAJA A LOS DISPOSITIVOS CON VOLTAGE IGUAL O MENOR A 3.5V
async function BateriaBaja(dato, tipo){
    try{
        var numeros = await Alertas.listaSMS(dato.deviceID, "Telefono", "BateriaT");
        if(numeros.length > 0){
            var sms = "El dispositivo "+dato.deviceID;
            if(dato.aliasEmpresa != ""){
                sms+=" ("+dato.aliasEmpresa+")";
            }
            if(dato.vehicleID != ""){
                sms+=" ("+dato.vehicleID+")";
            }
            if(dato.modalidad != ""){
                sms+=" ("+dato.modalidad+")";
            }
            sms+=" reporta bateria baja en "+dato.battery+"V. "+dato.ciudad+","+dato.departamento+","+await Util.addHourDate(dato.dateTime,-5)+".";
            var link = await Geocoding.ShortURL("http://maps.google.es/maps?q=" + dato.latitude + "," + dato.longitude);
            if(link != "error"){
                sms+=" "+link;
            }else{
                link="";
            }
            if(Constantes.idProyectosEcuador.includes("|"+dato.proyecto+"|")){
                await sqlconfig.procedure_registroSmsColombia("LokRegistrarSMSColombia", numeros, sms, dato.contrato);
            }else{
                sms = "El dispositivo "+dato.deviceID+" ("+dato.contrato+")("+dato.clientName+") reporta bateria baja en "+dato.battery+"V. "+dato.ciudad+","+dato.departamento+","+await Util.addHourDate(dato.dateTime,-5)+". "+link;
                var id="";
                if(dato.nombreServer == "IFX"){
                    id= dato.maindataID +"000";
                }else if(dato.nombreServer == "DEDK152"){
                    id= dato.maindataID +"152";
                }else if(dato.nombreServer == "DEDK153"){
                    id= dato.maindataID +"153";
                }
                await Envios.SendSMSEclipsoft(numeros, sms, id, dato.contrato, await Util.addHourDate(dato.dateTime,-5));
            }
        }
        await Envios.SendMail(dato, "El equipo <b>" + dato.deviceID + "</b> reporta bateria baja <b>"+dato.battery+"</b>.", "Reporte de bateria baja.", tipo, 2, "BateriaM", 5);
    }catch(error){
        console.log("error alertas.bateriabaja");
    }
}

async function Velocidad(dato, tipo){
    try{
        var numeros = await Alertas.listaSMS(dato.deviceID, "Telefono", "VelocidadT");
        if(numeros.length > 0){
            var sms = "El dispositivo "+dato.deviceID;
            if(dato.aliasEmpresa != ""){
                sms+=" ("+dato.aliasEmpresa+")";
            }
            if(dato.vehicleID != ""){
                sms+=" ("+dato.vehicleID+")";
            }
            if(dato.modalidad != ""){
                sms+=" ("+dato.modalidad+")";
            }
            sms+=" supero el limite de velocidad "+dato.ciudad+","+dato.departamento+","+await Util.addHourDate(dato.dateTime,-5)+".";
            var link = await Geocoding.ShortURL("http://maps.google.es/maps?q=" + dato.latitude + "," + dato.longitude);
            if(link != "error"){
                sms+=" "+link;
            }else{
                link="";
            }
            if(Constantes.idProyectosEcuador.includes("|"+dato.proyecto+"|")){
                await sqlconfig.procedure_registroSmsColombia("LokRegistrarSMSColombia", numeros, sms, dato.contrato);
            }else{
                sms = "El dispositivo "+dato.deviceID+" ("+dato.contrato+")("+dato.clientName+") supero el limite de velocidad "+dato.ciudad+","+dato.departamento+","+await Util.addHourDate(dato.dateTime,-5)+". "+link;
                var id="";
                if(dato.nombreServer == "IFX"){
                    id= dato.maindataID +"000";
                }else if(dato.nombreServer == "DEDK152"){
                    id= dato.maindataID +"152";
                }else if(dato.nombreServer == "DEDK153"){
                    id= dato.maindataID +"153";
                }
                await Envios.SendSMSEclipsoft(numeros, sms, id, dato.contrato, await Util.addHourDate(dato.dateTime,-5));
            }
        }
        await Envios.SendMail(dato, "El equipo <b>" + dato.deviceID + "</b> supero el limite de velocidad("+dato.speed+" Km/h).", "Supero el limite de velocidad.", tipo, 2, "VelocidadM", 5);
    }catch(error){
        console.log("error alertas.velocidad");
    }
}

module.exports = {
    "CentroDeAlertas": CentroDeAlertas,
    "Sealed": Sealed,
    "Desvio": Desvio,
    "UnSealed": UnSealed,
    "GeoCerca": GeoCerca,
    "Alejamiento": Alejamiento,
    "BateriaBaja": BateriaBaja,
    "Velocidad": Velocidad
}
