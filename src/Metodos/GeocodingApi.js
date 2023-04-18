const axios = require('axios');
var Constantes = require("../Configuracion/Constantes");

async function MetrosToKilometros(metros){
    try{
        if (metros == 0){
            return "";
        }
        return (metros/1000).toFixed(2)+" km";
    }catch(error){
        return "";
    }
}

async function SegundosToHoras(segundos){
    try{
        if (segundos == 0){
            return "";
        }
        var horas = segundos / 3600;
        var minutos = (segundos % 3600) / 60;
        return Math.floor(horas)+" h "+Math.floor(minutos)+" m";
    }catch(error){
        return "";
    }
}

async function ValidarLatitudLongitud(lat, lng){
    try{
        //validamos latitud
        if (lat < -90 || lat > 90){
            return false;
        }
        //validamos longitud
        if (lng < -180 || lng > 180){
            return false;
        }
        return true;
    }catch(error){
        return false;
    }
}

//FUNCION QUE OBTIENE PAIS, ESTADO Y CIUDAD DE UNAS COORDENADAS
async function ConsumoHere(lat, lng){
    var objeto = new Object();
    objeto.pais=""; objeto.estado=""; objeto.ciudad=""; objeto.label="";
    try{
        await axios.get('https://revgeocode.search.hereapi.com/v1/revgeocode?apiKey='+Constantes.keyHereIDApi+'&at='+lat+','+lng)
        .then(function (response) {
            var consumo= response.data.items;
            objeto.pais=consumo[0].address.countryName;
            objeto.estado=consumo[0].address.county;
            if(consumo[0].address.city == null){
                objeto.ciudad=consumo[0].address.district;
            }else{
                objeto.ciudad=consumo[0].address.city;
            }
            if(consumo[0].address.street != null){
                objeto.label=consumo[0].address.street;
            }

            return objeto;
        })
        .catch(function (error) {
            objeto.label="error";
            return objeto;
        });
    }catch(error){
        objeto.label="error";
    }

    return objeto;
}

async function DistanciaHere(lat1, lng1, lat2, lng2){
    var objeto = new Object();
    objeto.tiempos=""; objeto.tiempoh=""; objeto.distanciam=""; objeto.distanciakm="";
    await axios.get('https://route.ls.hereapi.com/routing/7.2/calculateroute.json?apikey='+Constantes.keyHereIDApi+'&waypoint0='+lat1+','+lng1+'&waypoint1='+lat2+','+lng2+'&mode=fastest;car;traffic:enabled')
    .then(async function (response) {
        var consumo= response.data.response;
        objeto.tiempos=consumo.route[0].summary.travelTime;
        objeto.tiempoh=await SegundosToHoras(consumo.route[0].summary.travelTime);
        objeto.distanciam=consumo.route[0].summary.distance;
        objeto.distanciakm=await MetrosToKilometros(consumo.route[0].summary.distance);
    })
    .catch(function (error) {
        console.log(error);
        return objeto;
    });
    return objeto;
}

async function RetornaDistanciayTiempo(lat1, lng1, lat2, lng2){
    var objeto = new Object();
    objeto.tiempos=""; objeto.tiempoh=""; objeto.distanciam=""; objeto.distanciakm="";
    if(lat1 == 0 || lng1 == 0 || lat2 == 0 || lng2 == 0){
        return objeto;
    }
    return await DistanciaHere(lat1, lng1, lat2, lng2);
}

async function ReadHtmlPage(url){
    var objeto="";
    await axios.get(url)
    .then(async function (response) {
        objeto=response;
    })
    .catch(function (error) {
        console.log(error);
    });
    return objeto;
}

async function ShortURL(longUrl){
    try{
        var url = 'http://api.bit.ly/shorten?version=2.0.1&longUrl=' + longUrl + '&login=info2logiseguridad&apiKey=R_9eac7e4b38e646849352201a2f3458c9&format=json';
        var consumo = await ReadHtmlPage(url);
        return consumo.data.results[longUrl].shortUrl;
    }catch(error){
    }
    return "";
}

async function RetornaubicacionYahooApi(lat, lng){
    var objeto = new Object();
    objeto.pais=""; objeto.estado=""; objeto.ciudad=""; objeto.label="";
    try{
        await axios.get('http://gws2.maps.yahoo.com/findlocation?pf=1&locale=en_US&flags=&offset=15&q=' + lat + '%2c' + lng + '&gflags=R&start=0&count=100')
        .then(function (response) {
            var consumo= response.data.Result;
            objeto.pais=consumo.country;
            objeto.estado=consumo.county;
            objeto.ciudad=consumo.city;
            objeto.label=consumo.line1;

            return objeto;
        })
        .catch(function (error) {
            objeto.label="error";
            return objeto;
        });
    }catch(error){
        objeto.label="error";
    }

    return objeto;
}

async function Retornaelevacion(lat, lng){
    var objeto = new Object();
    objeto.pais=""; objeto.estado=""; objeto.ciudad=""; objeto.label="";
    try{
        await axios.get('http://maps.googleapis.com/maps/api/elevation/xml?locations=' + lat + ',' + lng + '&sensor=false')
        .then(function (response) {
            return objeto;
        })
        .catch(function (error) {
            objeto.label="error";
            return objeto;
        });
    }catch(error){
        objeto.label="error";
    }

    return objeto;
}

async function RetornaRuta(origin, destination, api){
    var objeto=null;
    var url='https://maps.googleapis.com/maps/api/directions/json?origin=' + origin + '&destination=' + destination + '&key='+api;

    try{
        await axios.get(url)
        .then(function (response) {
            var path = response.data.routes[0];
            objeto = path.overview_polyline.points;
            return objeto;
        })
        .catch(function (error) {
            objeto = null;
            return objeto;
        });
    }catch(error){
        objeto = null;
    }

    return objeto;
}

async function SetPosition(dato, pais, departamento, ciudad, location){
    if(!ValidarLatitudLongitud(dato.latitude, dato.longitude)){
        dato.pais = pais;
        dato.departamento = departamento;
        dato.ciudad = ciudad;
        dato.location = location;
    }else{
        try{
            const valores = await ConsumoHere(dato.latitude, dato.longitude);
            if(valores.label != "error"){
                dato.pais = valores.pais;
                dato.departamento = valores.estado;
                dato.ciudad = valores.ciudad;
                dato.location = valores.label;
            }else{
                const valores2 = await RetornaubicacionYahooApi(dato.latitude, dato.longitude);
                if(valores2.label != "error"){
                    dato.pais = valores2.pais;
                    dato.departamento = valores2.estado;
                    dato.ciudad = valores2.ciudad;
                    dato.location = valores2.label;
                }else{
                    dato.pais = "";
                    dato.departamento = "";
                    dato.ciudad = "";
                    dato.location = "";
                }
            }
        }catch(error){
            dato.pais = "";
            dato.departamento = "";
            dato.ciudad = "";
            dato.location = "";
        }
    }
    return dato;
}


module.exports = {
    "ValidarLatitudLongitud": ValidarLatitudLongitud,
    "ConsumoHere": ConsumoHere,
    "RetornaDistanciayTiempo": RetornaDistanciayTiempo,
    "ShortURL": ShortURL,
    "RetornaubicacionYahooApi": RetornaubicacionYahooApi,
    "SetPosition": SetPosition,
    "RetornaRuta": RetornaRuta
}
