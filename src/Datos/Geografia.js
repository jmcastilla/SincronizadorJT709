var sqlconfig = require("../model/dbpool");
var query = require("../model/dbpoolMysql");
var Geocoding = require("../Metodos/GeocodingApi");
var Poly = require("node-geometry-library");
var GoogleMapsAPI = require('../lib/index');
const API_KEY = 'AIzaSyAF-lo1H_DaXWarJqU1sF1l0cil68y0ANQ';
const decodePolyline = require('decode-google-map-polyline');

var publicConfig = {
  key: API_KEY,
  stagger_time:       1000, // for elevationPath
  encode_polylines:   false,
  secure:             true
};
var gmAPI = new GoogleMapsAPI(publicConfig);

//FUNCION QUE DEVUELVE SI LA APERTURA DEL EQUIPO ES NUEVA
async function DistanciaXYMetod(lat1, lng1, lat2, lng2){
    try{
        var degtorad = 0.01745329;
        var radtodeg = 57.29577951;
        var P = (Math.sin(lat1*degtorad) * Math.sin(lat2*degtorad) + Math.cos(lat1*degtorad) * Math.cos(lat2*degtorad) * Math.cos((lng1*degtorad) - (lng2*degtorad)));
        var D = Math.acos(P) * radtodeg;
        var T = D * 111.302;
        return T;
    }catch(error){
        return 0;
    }
}

//FUNCION QUE OBTIENE LA DISTACIA ENTRE DOS DISPOSITIVOS
async function DistanciaEntreEquipos(contrato){
    try{
        var dist=0;
        var consulta="SELECT LokContractID.FKLokDeviceID, LastMsgLat as Lat1, LastMsgLong as Long1, LastLatitude as Lat2, LastLongitude as Long2 FROM LokContractID INNER JOIN LOKDEVICEID ON  LokContractID.FKCelloTrack = LokDeviceID.DeviceID "+
        "WHERE LokContractID.ContractID = '"+contrato+"' And LokContractID.FKCelloTrack <> LokContractID.FKLokDeviceID";
        const resultado = await sqlconfig.query(consulta);
        var array = resultado.recordset;
        if(array.length > 0){
            dist = await DistanciaXYMetod(array[0].Lat1, array[0].Long1, dato.Lat2, dato.Long2);
        }
        return dist;
    }catch(error){
        return 0;
    }
}

//OBTIENE GEOCERCA DE ORIGEN Y DESTINO DE UNA RUTA
async function CiudadesxRuta(ruta){
    try{
        var consulta="SELECT ISNULL(TblOrigen.FKGeocerca,0) AS GeoOrigen, ISNULL(TblDestino.FKGeocerca,0) AS GeoDestino FROM ICRutas LEFT JOIN LokCiudades AS TblOrigen ON FKLokCiudadOrigen = TblOrigen.IDCiudad "+
        "LEFT JOIN LokCiudades AS TblDestino ON FKLokCiudadDestino = TblDestino.IDCiudad WHERE IdRuta = " + ruta;
        const resultado = await sqlconfig.query(consulta);
        var array = resultado.recordset;
        if(array.length > 0){
            return array[0];
        }
        return {"GeoOrigen":0, "GeoDestino":0};
    }catch(error){
        return {"GeoOrigen":0, "GeoDestino":0};
    }

}

//FUNCION QUE OBTIENE LA DISTANCIA QUE HA RECORRIDO EL DISPOSITIVO
async function DistanciaRutaOrigenXY(lat, lng, ruta){
    try{
        var dist=0;
        var consulta="SELECT LATITUD, LONGITUD FROM ICRutas INNER JOIN LokCiudades ON ICRutas.FKLokCiudadOrigen = LokCiudades.IDCiudad WHERE KMACTIVE = 1 and IDRUTA =" + ruta;
        const resultado = await sqlconfig.query(consulta);
        var array = resultado.recordset;
        if(array.length > 0){
            dist = await DistanciaXYMetod(array[0].LATITUD, array[0].LONGITUD, lat, lng);
        }
        return dist;
    }catch(error){
        return 0;
    }
}

//OBTIENE QUE TIPO DE RUTA TIENE EL DISPOSITIVO
async function BitPruebaRuta(equipo){
    try{
        var respuesta=false;
        var consulta="SELECT BitTipoRuta FROM LokContractID INNER JOIN ICRutas ON LokContractID.FKICRutas=ICRutas.IdRuta WHERE LokContractID.Active=1 AND LokContractID.FKLokDeviceID = '" + equipo + "'";
        const resultado = await sqlconfig.query(consulta);
        var array = resultado.recordset;
        if(array[0].BitTipoRuta){
            respuesta = true;
        }
        return respuesta;
    }catch(error){
        return false;
    }
}

async function ComprobarRuta(dato){
    try{
    var consulta= "SELECT * FROM Trayectos WHERE IDTrayecto="+dato.trayecto;
    let resultado=await sqlconfig.query(consulta);
    let trayecto = resultado.recordset[0];
    var posOrigen = trayecto.Origen.split(",");
    var posDestino = trayecto.Destino.split(",");
    var kmrecorrido=await DistanciaXYMetod(posOrigen[0], posOrigen[1], dato.latitude, dato.longitude);
    var listado=[];
    var obj;
    var polylineaArray = trayecto.Polyline.split("||||");
    console.log("kmrecorrido="+kmrecorrido);
    var polyseleccionada=polylineaArray.length-1;
    if(trayecto.WayPoints != ""){
      console.log("entro a waypoints");
        
        var wp = trayecto.WayPoints.split("|");
        for(var i =0; i< wp.length; i++){
            var punto = wp[i].split(",");
            if(kmrecorrido <= parseFloat(punto[2]) ){
                if(i == 0){
                    obj = {
                        "origin": trayecto.Origen,
                        "destination": punto[0]+","+punto[1],
                        "travelMode": "DRIVING"
                    }
		    polyseleccionada=i;
                }else{
                  var puntoOrigen = wp[i-1].split(",");
                  obj = {
                      "origin": puntoOrigen[0]+","+puntoOrigen[1],
                      "destination": punto[0]+","+punto[1],
                      "travelMode": "DRIVING"
                  }
                  polyseleccionada=i;
                }
                break;
            }
        }
    }else{
        polyseleccionada=0;
        obj = {
            "origin": trayecto.Origen,
            "destination": trayecto.Destino,
            "travelMode": "DRIVING"
        }
    }

    let response =  await Poly.PolyUtil.isLocationOnEdge(
    	{lat: dato.latitude, lng: dato.longitude}, // point object {lat, lng}
        decodePolyline(polylineaArray[polyseleccionada]),
        trayecto.Tolerancia,
        true
    );
    dato.desviovariable= response;
    dato.desvio = !response;

    return dato;
    }catch(err){
    dato.desviovariable= true;
    dato.desvio = false;

    return dato;
    }

}

async function estaEnRuta(obj){
    const res=await gmAPI.directions(obj);
    console.log(res);
    return res;
}

//FUNCION QUE //OBTIENE LA DISTANCIA ENTRE DOS PUNTOS
async function DistanciaRutasxy(lat, lng, ruta){
    try{
        var menorL= 100000;
        var respuesta=0;
        var consulta="SELECT Puntos FROM TramosRutas INNER JOIN Tramos ON TramosRutas.IDTramo = Tramos.ID WHERE IDRUTA =" + ruta;
        const resultado = await sqlconfig.query(consulta);
        var array = resultado.recordset;
        if(array.length > 0){
            for(var i in array){
                  var punto=array[i].Puntos;
                  var puntos= punto.split('|');
                  for(var c=0; c<puntos.length; c++){
                      var pos= puntos[c].split(',');
                      var distancia = await DistanciaXYMetod(lat, lng, pos[0], pos[1]);
                      if(distancia < menorL){
                          menorL = distancia;
                          respuesta = menorL;
                      }
                  }
            }
        }
        return respuesta;
    }catch(error){
        return 0;
    }
}

//FUNCION QUE //OBTIENE LA DISTANCIA ENTRE DOS PUNTOS
async function RutaEstaEnCerca(lat, lng, ruta){
    try{
        var consulta="SELECT Puntos FROM TramosRutas INNER JOIN Tramos ON TramosRutas.IDTramo = Tramos.ID WHERE IDRUTA =" + ruta + " ORDER BY TramosRutas.Orden";;
        const resultado = await sqlconfig.query(consulta);
        var array = resultado.recordset;
        console.log(array);
        if(array.length > 0){

            var listaVertices=new Array();
            for(var i=0; i<array.length;i++){
                  var punto=array[i].Puntos;
                  var puntos= punto.split('|');
                  for(var c=0; c<puntos.length; c++){
                      var pos= puntos[c].split(',');
                      var objeto = new Object();
                      objeto.lat =parseFloat(pos[0]);
                      objeto.lng =parseFloat(pos[1]);
                      listaVertices.push(objeto);
                  }
            }
            console.log(listaVertices);
        }
        var inPoly = false;
        var m = listaVertices.length-1;
        for(var i = 0; i<listaVertices.length; i++){
            var vertex1 = listaVertices[i];
            var vertex2 = listaVertices[m];
            if(vertex1.lng < lng && vertex2.lng >= lng || vertex2.lng < lng && vertex1.lng >= lng){
                if(vertex1.lat + (lng - vertex1.lng) / (vertex2.lng - vertex1.lng) * (vertex2.lat - vertex1.lat) < lat){
                    inPoly = !inPoly;
                }
            }
            m= i;
        }
        return inPoly;
    }catch(error){
        return false;
    }
}

//OBTIENE LATITUD Y LONGITUD DEL DISPOSITIVO
async function LatitudeLongitude(equipo){
    try{
        var objeto = new Object();
        var consulta="SELECT TOP 1 LastLatitude, LastLongitude FROM LokDeviceID WHERE LastLongitude <> 0 AND DeviceID = '" + equipo + "'";
        const resultado = await sqlconfig.query(consulta);
        var array = resultado.recordset;
        if(array.length > 0){
            var objeto = new Object();
            objeto.lat=array[0].LastLatitude;
            objeto.lng=array[0].LastLongitude;
            return objeto;
        }
        return {"lat":0, "lng":0};
    }catch(error){
        return {"lat":0, "lng":0};
    }
}

//OBTIENE EL NOMBRE DE LA GEOCERCA
async function nombreGeo(id){
    try{
        var respuesta="";
        var consulta="SELECT Nombre FROM geocercas WHERE ID = " + id;
        const resultado = await sqlconfig.query(consulta);
        var array = resultado.recordset;
        if(array.length > 0){
            respuesta=array[0].Nombre;
        }
        return respuesta;
    }catch(error){
        return "";
    }
}

//OBTIENE EL IDENTIFICADOR DE LA GEOCERCA DONDE SE GENERO EL MENSAJE
async function ObtenerCerca(proyecto, empresa, dispositivo){
    try{
        var respuesta="";
        var consulta="DECLARE @punto geometry; ";
        consulta+="SELECT @punto = ult_point FROM LokDeviceID WHERE DeviceID = '" + dispositivo + "'; ";
        consulta+="SELECT TOP 1 ID, Nombre FROM GeoCercas WHERE polygono IS NOT NULL and polygono.MakeValid().STContains(@punto) = 1 AND Ciudad=0 AND FKPROYECTO = " + proyecto;
        if(empresa != 0){
            consulta+=" and (Empresas like '%|" + empresa + "|%' OR Empresas like '|0|')";
        }
        //consulta+=" order by polygono.MakeValid().STLength() asc;";
        const resultado = await sqlconfig.query(consulta);
        var array = resultado.recordset;
        if(array != undefined){
            if(array.length > 0){
                var objeto = new Object();
                objeto.id=array[0].ID;
                objeto.nombre=array[0].Nombre;
                return objeto;
            }
        }else{
            return {"id":0, "nombre":''};
        }
    }catch(error){
        return {"id":0, "nombre":''};
    }
}

//DETERMINO SI EL MENSAJE DE APERTURA QUE GENERO EL DISPOSITIVO SE ENCUENTRE UBICADO EN LA GEOCERGA AUTORIZADA
async function EstaEnCerca(lat, lng, contrato){
    try{
        var nombre="none";
        var consulta="SELECT Vertices, NOMBRE FROM GEOCERCAS INNER JOIN LOKCONTRACTID ON ID = FKCERCAAUTORIZADA WHERE CONTRACTID = '" + contrato + "'";
        const resultado = await sqlconfig.query(consulta);
        var array = resultado.recordset;
        var listaVertices=new Array();

        if(array.length > 0){
            nombre=array[0].NOMBRE;
            var vertices=array[0].Vertices;
            var puntos= vertices.split('/');
            for(var c=0; c<puntos.length; c++){
                var valor = puntos[c].replace("(","");
                valor = valor.replace(")","");
                var pos= valor.split(',');
                var objeto = new Object();
                objeto.lat =parseFloat(pos[0]);
                objeto.lng =parseFloat(pos[1]);
                listaVertices.push(objeto);
            }
        }
        var inPoly = false;
        var m = listaVertices.length-1;
        for(var i = 0; i<listaVertices.length; i++){
            var vertex1 = listaVertices[i];
            var vertex2 = listaVertices[m];
            if(vertex1.lng < lng && vertex2.lng >= lng || vertex2.lng < lng && vertex1.lng >= lng){
                if(vertex1.lat + (lng - vertex1.lng) / (vertex2.lng - vertex1.lng) * (vertex2.lat - vertex1.lat) < lat){
                    inPoly = !inPoly;
                }
            }
            m= i;
        }

        if(inPoly){
            return nombre;
        }else{
            return "geo-none";
        }
    }catch(error){
        return "geo-none";
    }
}

module.exports = {
    "DistanciaXYMetod": DistanciaXYMetod,
    "DistanciaEntreEquipos": DistanciaEntreEquipos,
    "CiudadesxRuta": CiudadesxRuta,
    "DistanciaRutaOrigenXY": DistanciaRutaOrigenXY,
    "BitPruebaRuta": BitPruebaRuta,
    "DistanciaRutasxy": DistanciaRutasxy,
    "RutaEstaEnCerca": RutaEstaEnCerca,
    "EstaEnCerca": EstaEnCerca,
    "LatitudeLongitude": LatitudeLongitude,
    "ObtenerCerca": ObtenerCerca,
    "ComprobarRuta": ComprobarRuta
}
