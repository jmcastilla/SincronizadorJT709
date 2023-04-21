var moment = require('moment');
var md5 =require("md5");

async function binarioParseado(hex, posicion){
    try
    {
        const binario= await (parseInt(hex, 16).toString(2)).padStart(16, '0');
        return binario.charAt(posicion);
    }catch(error){
        return 0;
    }
}

function formatdate(date){
    try{
        date=moment(date).format('YYYY-MM-DD HH:mm:ss');
        if(date === "Invalid date"){
            date=moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        }
        return date;
    }catch(error){

        date=moment(new Date()).format('YYYY-MM-DD HH:mm:ss');

        return date;
    }
}

function convertirDate(date, formato){
    try{
        date=moment(date).format(formato);
        return date;
    }catch(error){
        return date;
    }
}

async function vacioToNull(value){
    if(value == ""){
        value = null;
    }else if(value == undefined){
        value = "";
    }

    return value;
}

async function toUnixTime(date){
    var unix=0;
    try{
        unix=parseInt((new Date(date).getTime() / 1000).toFixed(0));
    }catch(error){
        unix=0;
    }
    return unix;
}

async function criptMd5(password){
    return await md5(password);
}

async function addHourDate(fecha, horas){
    var numberOfMlSeconds = new Date(fecha).getTime();
    var addMlSeconds = (horas * 60) * 60000;
    var newDateObj = new Date(numberOfMlSeconds + addMlSeconds);
    return await newDateObj;
}

async function convertCsv(array){
    try{
        var cadena="";
        if(array.length > 0){
            for(var i in array){
                cadena+=array[i].param+",";
            }
        }
        cadena = cadena.substring(0, cadena.length - 1);
        return cadena;
    }catch(error){
        return "";
    }
}

module.exports = {
    "binarioParseado": binarioParseado,
    "formatdate": formatdate,
    "toUnixTime":toUnixTime,
    "criptMd5":criptMd5,
    "convertCsv": convertCsv,
    "convertirDate": convertirDate,
    "vacioToNull": vacioToNull,
    "addHourDate": addHourDate
}
