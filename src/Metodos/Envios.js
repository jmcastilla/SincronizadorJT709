var soap = require('soap');

var Alertas = require("../Datos/Alertas");
var Util = require("./UtilidadGeneral");

//ENVIO DE MAIL POR SALIDA DE PUNTO SEGURO, SE LE CONSIDERA LA SALIDA O EL ALEJAMIENTO DESPUES DE 200MTS DE DISTANCIA DEL CENTRO DEL PUNTO
async function SendMailSeparacion(dato, mensaje, evento, id){
    var contactos = await Alertas.ListaDeContacts(dato.contrato, "Mail", "ZonaSeguraM");
    var contactosProyecto = await Alertas.ListaCorreosPorProyecto(dato.contrato, "Mail", "ZonaSeguraM");
    var contactoslist = await Util.convertCsv(contactos);
    var contactoslist2 = await Util.convertCsv(contactosProyecto);
    var contactostotales="";
    if(contactoslist2.length>0){
        contactostotales=contactoslist+","+contactoslist2;
    }
    //console.log(contactostotales);
    if(contactostotales.length>1){
        var asunto = "Evento ("+evento+") Presentado en Servicio "+dato.contrato+"("+dato.deviceID+")"+dato.vehicleID;

        var html = "<!DOCTYPE html><html><head></head><body><div style='width:604px; height:503px;' ><br/><br/><br/><br/><br/><br/><br/><br/><br/><div style='width:500px; margin-left:50px;'><br/>"
        + "<label style='font-size:20px;'><b>Estimado Cliente</b></label><br/><br/><br/>" + mensaje + "<br/>en la fecha/hora: <b>" + await Util.addHourDate(dato.dateTime,-5) + "</b><br/><br/>Url: <a href='http://maps.google.es/maps?q=" + dato.latitude + "," + dato.longitude + "'>http://maps.google.es/maps?q=" + dato.latitude + "," + dato.longitude + "</a>"
        + "<br/><br/>Ciudad: " + dato.ciudad + "<br/>Departamento: " + dato.departamento + "<br/>País: " + dato.pais + "<br/>Contrato: <b>" + dato.contrato + "</b><br/><br/>Gracias por su atencion.</div></body></html>";
        return await EnvioCorreo(html, contactostotales, asunto);
    }else{
        return "No hay correos";
    }

}

//ENVIO DE MAIL POR ERROR DE LA PLATAFORMA
async function SendMailErroresPlataforma(mensaje, asunto, text){
    return await EnvioCorreo(text, 'juan.berrio@logiseguridad.com,sistemas2@logiseguridad.com', asunto);
}

async function SendMail(dato, mensaje, evento, tipo, id, alerta, idmensaje){
    try{
        var contactos = await Alertas.ListaDeContacts(dato.contrato, "Mail", alerta);
        var contactosProyecto = await Alertas.ListaCorreosPorProyecto(dato.contrato, "Mail", alerta);
        var contactostotales="";
        var contactoslist = await Util.convertCsv(contactos);
        var contactoslist2 = await Util.convertCsv(contactosProyecto);
        var html="";
        if(tipo == 1){
            //tipo 1, es cuando es el primero, se envia a operaciones
            contactostotales = contactoslist2;
        }else{
            //tipo 3, se envia a los dos
            contactostotales = contactoslist+","+contactoslist2;
        }

        var porcentaje = 0;
        if(!dato.duracionT == "error" && !dato.distanciaM == 0){
            var restante = dato.kmsRuta - dato.distanciaM;
            porcentaje = parseInt((restante / dato.kmsRuta)*100);
        }

        if(contactostotales.length>1){
            var asunto = "Evento Presentado en Servicio "+dato.contrato+"("+dato.deviceID+")"+dato.vehicleID;
            if(id == 1){
                if(dato.proyecto == 1){
                    html = "<!DOCTYPE html><html><head></head><body><div>" +
                    "<div style='width:820px; margin-left:50px;'>" +
                    "<table style='width: 100%;border:2px solid #000000;' rules='all' >" +
                    "<thead><th colspan='2'>REPORTE DE ALERTA</th></thead>" +
                    "<tbody>" +
                    "	<tr>" +
                    "		<td style='width: 30%;'>EMPRESA:</td>" +
                    "		<td style='width: 70%;'>" + dato.clientName + "</td>" +
                    "	</tr>" +
                    "	<tr>" +
                    "		<td style='width: 30%;'>TIPO ALERTA:</td>" +
                    "		<td style='width: 70%;'>" + evento + "</td>" +
                    "	</tr>" +
                    "	<tr>" +
                    "		<td style='width: 30%;'>DESCRIPCIÓN ALERTA:</td>" +
                    "		<td style='width: 70%;'>" + mensaje + "</td>" +
                    "	</tr>" +
                    "	<tr>" +
                    "		<td style='width: 30%;'>FECHA/HORA:</td>" +
                    "		<td style='width: 70%;'>" + await Util.addHourDate(dato.dateTime,-5) + "</td>" +
                    "	</tr>" +
                    "	<tr>" +
                    "		<td style='width: 30%;'>LUGAR DE ALERTA:</td>" +
                    "		<td style='width: 70%;'>" + dato.ciudad + ", " + dato.departamento + ", " + dato.pais + "(" + dato.location + ")</td>" +
                    "	</tr>" +
                    "	<tr>" +
                    "		<td style='width: 30%;'>DISPOSITIVO MAESTRO:</td>" +
                    "		<td style='width: 70%;'>" + dato.deviceID + "</td>" +
                    "	</tr>" +
                    "	<tr>" +
                    "		<td style='width: 30%;'>DISPOSITIVO GENERADOR:</td>" +
                    "		<td style='width: 70%;'>" + dato.deviceID + "</td>" +
                    "	</tr>" +
                    "	<tr>" +
                    "		<td style='width: 30%;'>PLACA DEL VEHICULO:</td>" +
                    "		<td style='width: 70%;'>" + dato.vehicleID + "</td>" +
                    "	</tr>" +
                    "	<tr>" +
                    "		<td style='width: 30%;'>CONTENEDOR/DOCUMENTO:</td>" +
                    "		<td style='width: 70%;'>" + dato.contenedor + "</td>" +
                    "	</tr>" +
                    "	<tr>" +
                    "		<td style='width: 30%;'>REFERENCIA:</td>" +
                    "		<td style='width: 70%;'>" + dato.referencia + "</td>" +
                    "	</tr>" +
                    "	<tr>" +
                    "		<td colspan='2'>" +
                    "			<img style='margin-left:2px; margin-top:2px;' src='https://maps.googleapis.com/maps/api/staticmap?visible=" + dato.latitude + "," + dato.longitude + "&zoom=14&maptype=hybrid&size=400x200&markers=color:blue%7Clabel:Ult%7C" + dato.latitude + "," + dato.longitude + "&sensor=true&key=AIzaSyCNf7v9troIDVm_WJswlLbx2Q3Ur71mJe0' />";
                    if(dato.duracionT !=  "error" && porcentaje > 0){
                        html+="			<img style='margin-left:2px; margin-top:2px;' src='http://chart.googleapis.com/chart?cht=gom&chs=400x200&chd=t:" + porcentaje + "&chxt=x,y&chxl=0:|" + porcentaje + "%|1:|Inicio|Entrega&chls=4|14&chtt=ESTADO+DEL+SERVICIO&chts=000000,15,c' />";
                    }
                    html+="		</td>" +
                    "	</tr>" +
                    "</tbody></table>" +
                    "<br/> <hr/> <br/> <div style='width: 100 %; clear: both; color:#999999;	text-align:center;	padding-top: 15px;	font-size: 75%;'><center> Generated by <a href = 'http://www.logiseguridad.com' style = 'color:#999999; 	text-decoration: none;	border-bottom: 1px dotted #999999;'> Logiseguridad Ltda.</center></a></div> " +
                    "</div></body></html>";
                }else{
                    html = "<!DOCTYPE html><html><head></head><body><div style='width:604px; height:503px;' ><br/><br/><br/><br/><br/><br/><br/><br/><br/><div style='width:500px; margin-left:50px;'><br/>"
                    + "<label style='font-size:20px;'><b>Estimado Cliente</b></label><br/><br/><br/>" + mensaje + "<br/>en la fecha/hora: <b>" + await Util.addHourDate(dato.dateTime,-5) + "</b><br/><br/>Url: <a href='http://maps.google.es/maps?q=" + dato.latitude + "," + dato.longitude + "'>http://maps.google.es/maps?q=" + dato.latitude + "," + dato.longitude + "</a>"
                    + "<br/><br/>Ciudad: " + dato.ciudad + "<br/>Departamento: " + dato.departamento + "<br/>País: " + dato.pais + "<br/>Contrato: <b>" + dato.contrato + "</b><br/><br/>Gracias por su atencion.</div></body></html>";
                }
            }else{
                html = "<!DOCTYPE html><html><head></head><body><div>\n" +
                "<div style='width:820px; margin-left:50px;'>\n" +
                "<table style='width: 100%;border:2px solid #000000;' rules='all' >\n" +
                "<thead><th colspan='2'>REPORTE DE ALERTA</th></thead>\n" +
                "<tbody>\n";
                if(dato.clientName != ""){
                    html+="	<tr>\n" +
                    "		<td style='width: 30%;'>EMPRESA:</td>\n" +
                    "		<td style='width: 70%;'>" + dato.clientName + "</td>\n" +
                    "	</tr>\n"
                }
                html+="	<tr>\n" +
                "		<td style='width: 30%;'>TIPO ALERTA:</td>\n" +
                "		<td style='width: 70%;'>" + evento + "</td>\n" +
                "	</tr>\n" +
                "	<tr>\n" +
                "		<td style='width: 30%;'>DESCRIPCIÓN ALERTA:</td>\n" +
                "		<td style='width: 70%;'>" + mensaje + "</td>\n" +
                "	</tr>\n" +
                "	<tr>\n" +
                "		<td style='width: 30%;'>FECHA/HORA:</td>\n" +
                "		<td style='width: 70%;'>" + await Util.addHourDate(dato.dateTime,-5) + "</td>\n" +
                "	</tr>\n" +
                "	<tr>\n" +
                "		<td style='width: 30%;'>LUGAR DE ALERTA:</td>\n" +
                "		<td style='width: 70%;'>" + dato.ciudad + ", " + dato.departamento + ", " + dato.pais + "(" + dato.location + ")</td>\n" +
                "	</tr>\n" +
                "	<tr>\n" +
                "		<td style='width: 30%;'>DISPOSITIVO MAESTRO:</td>\n" +
                "		<td style='width: 70%;'>" + dato.deviceID + "</td>\n" +
                "	</tr>\n" +
                "	<tr>\n" +
                "		<td style='width: 30%;'>DISPOSITIVO GENERADOR:</td>\n" +
                "		<td style='width: 70%;'>" + dato.deviceID + "</td>\n" +
                "	</tr>\n" +
                "	<tr>\n" +
                "		<td style='width: 30%;'>PLACA DEL VEHICULO:</td>\n" +
                "		<td style='width: 70%;'>" + dato.vehicleID + "</td>\n" +
                "	</tr>\n" +
                "	<tr>\n" +
                "		<td style='width: 30%;'>CONTENEDOR/DOCUMENTO:</td>\n" +
                "		<td style='width: 70%;'>" + dato.contenedor + "</td>\n" +
                "	</tr>\n" +
                "	<tr>\n" +
                "		<td style='width: 30%;'>REFERENCIA:</td>\n" +
                "		<td style='width: 70%;'>" + dato.referencia + "</td>\n" +
                "	</tr>\n" +
                "	<tr>\n" +
                "		<td colspan='2'>\n" +
                "			<img style='margin-left:2px; margin-top:2px;' src='https://maps.googleapis.com/maps/api/staticmap?visible=" + dato.latitude + "," + dato.longitude + "&zoom=14&maptype=hybrid&size=400x200&markers=color:blue%7Clabel:Ult%7C" + dato.latitude + "," + dato.longitude + "&sensor=true&key=AIzaSyCNf7v9troIDVm_WJswlLbx2Q3Ur71mJe0' />\n";
                if(dato.duracionT !=  "error" && porcentaje > 0){
                    html+="			<img style='margin-left:2px; margin-top:2px;' src='http://chart.googleapis.com/chart?cht=gom&chs=400x200&chd=t:" + porcentaje + "&chxt=x,y&chxl=0:|" + porcentaje + "%|1:|Inicio|Entrega&chls=4|14&chtt=ESTADO+DEL+SERVICIO&chts=000000,15,c' />\n";
                }
                html+="		</td>\n" +
                "	</tr>\n" +
                "</tbody></table>\n" +
                "<br/> <hr/> <br/> <div style='width: 100 %; clear: both; color:#999999;	text-align:center;	padding-top: 15px;	font-size: 75%;'><center> Generated by <a href = 'http://www.logiseguridad.com' style = 'color:#999999; 	text-decoration: none;	border-bottom: 1px dotted #999999;'> Logiseguridad Ltda.</center></a></div> \n" +
                "</div></body></html>";
            }
        }else{
            return "No hay correos";
        }
        return await EnvioCorreo(html, contactostotales, asunto);
    }catch(error){}

}

async function EnvioCorreo(mensaje, contactos, asunto){

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
            user: 'info4@logiseguridad.com',
            pass: 'INFOCARGA',
        },
    });

    transporter.sendMail({
        from: 'info4@logiseguridad.com', // sender address
        to: 'jfberrio@yahoo.com', // list of receivers
        subject: asunto, // Subject line
        html: mensaje // html body
    }).then(async info => {
        if(info.response.toString().includes("2.0.0 OK")){
            return true;
        }else{
            await EnvioCorreo2(mensaje, contactos, asunto);
        }
    }).catch(console.error);

}

async function EnvioCorreo2(mensaje, contactos, asunto){
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
            user: 'info2@logiseguridad.com',
            pass: 'INFOCARGA',
        },
    });

    transporter.sendMail({
        from: 'info2@logiseguridad.com', // sender address
        to: 'jfberrio@yahoo.com', // list of receivers
        subject: asunto, // Subject line
        html: mensaje, // html body
    }).then(info => {
        if(info.response.contains("2.0.0 OK")){
            return true;
        }else{
            return false;
        }
    }).catch(console.error);

}

async function SendSMSEclipsoft(numeros, mensaje, id, contrato, horaenvio){
    /*var url = "https://app2.eclipsoft.com:9443/wsSMSEmpresarial/wscSMSEmp.asmx?wsdl";
    var emServicio = "CONTACTOSMS";
    var emEmisor = "LOGISEGURIDAD";
    var emLogin = "admin";
    var emPwd = "lgsg@csms";
    var emReferencia = id;
    var emFechaEnv = await Util.convertirDate(horaenvio,"MM/dd/yyyy");
    var emHoraEnv = await Util.convertirDate(horaenvio,"HH:mm");
    var emNombrePC = "DEDK130";
    var emKey = await Util.criptMd5("CONTACTOSMS;csms@auto;LOGISEGURIDAD;admin;lgsg@csms;" + id);
    var nNumeros = "";
    if(numeros.contains("-")){
        nNumeros = numeros.replace("-", ";");
    }else{
        nNumeros = numeros;
    }

    soap.createClient(url,{}, async function(err,client){
        if(err){
            console.log(err);
        }else{
            const args = {
                'parEmisor': {
                   'emServicio': emServicio,
                   'emEmisor': emEmisor,
                   'emLogin': emLogin,
                   'emPwd': emPwd,
                   'emReferencia': emReferencia,
                   'emFechaEnv': emFechaEnv,
                   'emHoraEnv': emHoraEnv,
                   'emNombrePC': emNombrePC,
                   'emKey': emKey
                },
                'parDestinatarios': nNumeros,
                'parMensaje': mensaje
            }
            client.EnviarSMS(args, async function(err, response){
                if(err){
                    console.log(err);
                }else{
                    console.log(response);
                }
            });
        }
    });*/
}

module.exports = {
    "SendMail": SendMail,
    "SendMailSeparacion": SendMailSeparacion,
    "SendMailErroresPlataforma": SendMailErroresPlataforma
}
