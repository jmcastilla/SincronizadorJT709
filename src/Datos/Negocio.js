var sqlconfig = require("../model/dbpool");
var query = require("../model/dbpoolMysql");
var Geografia = require("./Geografia");
var Constantes = require("../Configuracion/Constantes");
var Util = require("../Metodos/UtilidadGeneral");

//FUNCION QUE DEVUELVE SI EL DEVICE EXISTE
async function EquipoExiste(device){
    var consulta= "SELECT DeviceID, FKLokTipoEquipo FROM LokDeviceID WHERE DeviceID = '"+device+"'";
    return await sqlconfig.query(consulta);
}

//FUNCION PARA CREAR DEVICE SI NO EXISTE
async function CrearEquipo(device, tipoequipo){
    var consulta = "INSERT LokDeviceID (DeviceID, FkLokCommOp, SimCardId, SimCardPhone, LastLatitude, LastLongitude, ";
    consulta += "LastContractID, LastMessageID, Locked, Mounted, BatteryVoltage, LastPositionDesc, LastElevation, ";
    consulta += "PositionTime, LoksysServerTime, ICTime, Moving, Ciudad, Departamento, Pais, FKLokTipoEquipo, ";
    consulta += "FKLokProyecto, UltimaGeoCerca, ultAlerta, KmsOrigenDestino, Desvio, Back, DistanciaCellTrack, Separado, ";
    consulta += "Asegurado, Light, UltimaAgencia, EmpresaActiva, CategoriaTipo) VALUES ";
    consulta += "('"+device+"', 2, NULL, NULL, NULL, NULL, N'none', NULL, 1, 1, NULL, NULL, NULL, DATEADD(HH, 5, GETDATE()), DATEADD(HH, 5, GETDATE()), DATEADD(HH, 5, GETDATE()), 0, NULL, NULL,";
    consulta += "NULL, "+tipoequipo+", 1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 2, 2)";
    return await sqlconfig.query(consulta);
}

//FUNCION QUE DEVUELVE SI LA APERTURA DEL EQUIPO ES NUEVA
async function LeerApertura(dato){
    try{
        const antesCambiar = await UltAlerta(dato.deviceID, "Locked");
        console.log(dato);
        dato.ultAlerta = antesCambiar.recordset[0].locked;
        console.log(dato.ultAlerta+" - "+dato.flag_Lock);
        if(dato.flag_Lock == 1 && !dato.ultAlerta){
            console.log("entro1");
            dato.locked=true;
            dato.evento="Cierre";
            dato.hasAlert=true;
        }else if(dato.flag_Lock == 0 && dato.ultAlerta){
            console.log("entro2");
            dato.locked=false;
            dato.evento="Apertura";
            dato.hasAlert=true;
        }else{
          console.log("entro3");
          dato.locked = dato.ultAlerta;
          dato.evento="";
          dato.hasAlert=false;
        }

        /*if(dato.flag_Lock == -1){
            if(dato.estadoGuaya == 1 && dato.ultAlerta){
                dato.locked=false;
                dato.evento="Apertura";
                dato.hasAlert=true;
            }else{
                dato.locked=dato.ultAlerta;
                dato.evento="";
                dato.hasAlert=false;
            }
        }else if((dato.flag_Lock == 98 || dato.flag_Lock == 1) && dato.ultAlerta){
            dato.locked=false;
            dato.evento="Apertura";
            dato.hasAlert=true;
        }else if(dato.flag_Lock == 0 && !dato.ultAlerta){
            dato.locked=true;
            dato.evento="Cierre";
            dato.hasAlert=true;
        }else{
            dato.locked = dato.ultAlerta;
            dato.evento="";
            dato.hasAlert=false;
        }*/
        return dato;
    }catch(error){
    }

}

//FUNCION QUE DEVUELVE LA ULTIMA ALERTA
async function UltAlerta(device, parametro){
    var consulta="SELECT " + parametro + " as locked FROM LokDeviceID WHERE deviceid = '" + device + "'";
    return await sqlconfig.query(consulta);
}

//FUNCION QUE OBTIENE SI EL MENSAJE SE ENCUENTRA DENTRO DE UN RADIO DE 200MTS DE EL PUNTO ASEGURADO
async function Asegurado(dato){
    dato.flag = false;
    dato.alejado=true;
    try{
        var consulta="SELECT LatAsegurado, LongAsegurado, LokDeviceID.Asegurado FROM LokContractID "+
        "INNER JOIN LokDeviceID ON LastContractID = ContractID "+
        "WHERE DeviceID ='"+dato.deviceID+"' AND LokContractID.Asegurado = 1";
        const mensaje = await sqlconfig.query(consulta);
        var array = mensaje.recordset;
        if(array.length > 0){
            dato.flag = true;
            const dist = await Geografia.DistanciaXYMetod(array[0].LatAsegurado, array[0].LongAsegurado, dato.latitude, dato.longitude);
            if(dist > 0.2){
                dato.alejado=false;
            }
        }
        return dato;
    }catch(error){
        return dato;
    }
}

//TOMA LA FECHA DONDE SE ACTUALIZO POR ULTIMA VEZ EL DISPOSITIVO
async function TomarFechaDevice(dato){
    try{
        var date=new Date();
        var consulta="SELECT PositionTime FROM LokDeviceID  WHERE DeviceID = '" + dato.deviceID + "'";
        const mensaje = await sqlconfig.query(consulta);
        var array = mensaje.recordset;
        if(array.length > 0){
            date = array[0].PositionTime;
        }
        return date;
    }catch(error){
        return new Date();
    }
}

//FUNCION RETORNA EL CORREO Y OTROS DATOS NECESARIOS PARA COMPLETAR TODA LA INFORMACION DEL MENSAJE
async function InfoMensaje(dato){
    dato.clientName = "";
    dato.aliasEmpresa = "";
    dato.modalidad = "";
    dato.fkEmpresa = 0;
    dato.contenedor = "";
    dato.referencia = "";
    dato.idEmpresa = 0;
    dato.kmsRuta = 0;
    try{
        var consulta="SELECT ContractID, NombreEmpresa, Owner, AliasEmpresa, PlacaTruck, BatteryVoltage, AlertasActivas, "+
        "CodigoModalidadServicio, ISNULL(FKICEmpresa, 0) AS IdEmpresa , ISNULL(c.Latitud, 0) as lat_d, ISNULL(c.Longitud, 0) as lng_d, Ref, "+
        "CASE WHEN LOKCONTRACTID.ContainerNum IS NULL OR LOKCONTRACTID.ContainerNum = 'ND' THEN LOKCONTRACTID.Documento ELSE LOKCONTRACTID.ContainerNum END AS Contenedor, "+
        "kmsRuta, Ciudad, Departamento, Pais, Location, DistanciaT, DistanciaM, DuracionT, DuracionS, ISNULL(LOKCONTRACTID.FKTrayecto, 0) AS Trayecto "+
        "FROM LokDeviceID INNER JOIN LokContractID ON  LastContractID = ContractID "+
        "LEFT JOIN ICEmpresa ON FKICEmpresa = IdEmpresa "+
        "LEFT JOIN ICRutas ON FKICRutas = IdRuta "+
        "LEFT JOIN LokCiudades as c ON FKLokCiudadDestino = IDCiudad "+
        "LEFT JOIN LokModalidadServicios ON FKLokModalidadServ = IdModalidadServicio "+
        "WHERE FKLokDeviceID = '" + dato.deviceID + "' AND Active = 1";
        const mensaje = await sqlconfig.query(consulta);
        var array = mensaje.recordset;
        if(array.length > 0){
            dato.contrato= array[0].ContractID;
            dato.vehicleID = array[0].PlacaTruck;
            dato.ultVoltage = array[0].BatteryVoltage;
            dato.alertasActivas = array[0].AlertasActivas;
            dato.clientName = array[0].NombreEmpresa;
            dato.aliasEmpresa = array[0].AliasEmpresa;
            dato.modalidad = array[0].CodigoModalidadServicio;
            dato.fkEmpresa = parseInt(array[0].IdEmpresa);
            dato.contenedor = array[0].contenedor;
            dato.referencia = array[0].Ref;
            dato.idEmpresa = parseInt(array[0].Owner);
            dato.kmsRuta = parseInt(array[0].kmsRuta);
            dato.ciudad = array[0].Ciudad;
            dato.departamento = array[0].Departamento;
            dato.pais = array[0].Pais;
            dato.location = array[0].Location;
            dato.distanciaT = array[0].DistanciaT;
            dato.distanciaM = array[0].DistanciaM;
            dato.duracionT = array[0].DuracionT;
            dato.duracionS = array[0].DuracionS;
            dato.lat_d = array[0].lat_d;
            dato.lng_d = array[0].lng_d;
            dato.trayecto= array[0].Trayecto;
        }
        return dato;
    }catch(error){
        return dato;
    }
}

async function LeerVarios(dato){
    var distanciaRuta=0;
    var distanciaOrigen=0;
    var km=2;
    var infoDevice = await GetInfoDevice(dato);
    dato.desvio=false;
    dato.back=false;
    dato.proyecto = infoDevice.proyectoPrincipal;
    dato.ultSpeed = infoDevice.speed;
    dato.desvioF = infoDevice.desvio;
    dato.ultGeo = parseInt(infoDevice.idGeocerca);
    dato.nombreGeo = infoDevice.nombreGeocerca;
    dato.anteriorGeo = parseInt(infoDevice.idGeocerca);
    var ruta = parseInt(infoDevice.idRuta);
    var kmAnterior = infoDevice.kmsOrigen;
    dato.distanciaEntreCell= await Geografia.DistanciaEntreEquipos(dato.contrato);
    dato.separado = false;
    if(dato.distanciaEntreCell > 1){
        dato.separado = true;
    }

    if(ruta != 0){
        const infoGeocercas = await Geografia.CiudadesxRuta(ruta);
        var ciudadOrigen = infoGeocercas.GeoOrigen;
        var ciudadDestino = infoGeocercas.GeoDestino;
        distanciaOrigen = await Geografia.DistanciaRutaOrigenXY(dato.latitude, dato.longitude, ruta);
        var deltadistancia = kmAnterior - distanciaOrigen;
        const bitpruebaruta = await Geografia.BitPruebaRuta(dato.deviceID);
        /*if(!bitpruebaruta){
            distanciaRuta=await Geografia.DistanciaRutasxy(dato.latitude, dato.longitude, ruta);
            if(ciudadDestino != 0 && ciudadOrigen != 0 && distanciaRuta >= km){
                dato.desvio = true;
            }
        }else{
            const estaencerca = await Geografia.RutaEstaEnCerca(dato.latitude, dato.longitude, ruta);
            console.log("*"+estaencerca);
            if(ciudadDestino != 0 && ciudadOrigen != 0  && !estaencerca){
                dato.desvio = true;
            }
        }*/
        if(dato.trayecto != 0){
            dato = await Geografia.ComprobarRuta(dato);
        }

        if(deltadistancia >= 2){
            dato.back=true;
        }
    }
    dato.distanciaRuta = distanciaRuta;
    dato.distanciaOrigen = distanciaOrigen;

    return dato;
}

async function GetInfoDevice(dato){
    var info = new Object();
    info.proyectoPrincipal= 0;
    info.desvio = false;
    info.asegurado = false;
    info.kmsOrigen = 0;
    info.idRuta = 0;
    info.speed = 0;
    try{
        var consulta="SELECT  UltimaGeoCerca, ISNULL(G.Nombre, '') nombre_geo, "+
        "ISNULL(LokDeviceID.FKLokProyecto,0) FKLokProyecto, "+
        "ISNULL((case when ProyectoOwner is null and ProyectoPrincipal is not null then ProyectoPrincipal "+
        "when ProyectoOwner is null and ProyectoPrincipal is null then 1 else 9 end),0) as ProyectoPrincipal,  "+
        "Desvio, LokDeviceID.Asegurado, round(ISNULL(KmsOrigenDestino,0),0) KmsOrigenDestino, "+
        "isnull(FKICRutas,0) as FKICRutas, ISNULL(LokDeviceID.speed, 0) speed "+
        "FROM LokDeviceID left join LokContractID on LastContractID = ContractID "+
        "left join ICRutas on IdRuta = FKICRutas "+
        "LEFT JOIN GeoCercas G ON G.ID = UltimaGeoCerca "+
        "inner join LokProyectos on LokDeviceID.FKLokProyecto = IDProyecto WHERE DeviceID ='"+dato.deviceID+"'";
        const mensaje = await sqlconfig.query(consulta);
        var array = mensaje.recordset;
        if(array.length > 0){
            info.proyectoPrincipal= parseInt(array[0].ProyectoPrincipal);
            info.desvio = Boolean(array[0].Desvio);
            info.asegurado = Boolean(array[0].Asegurado);
            info.kmsOrigen = parseInt(array[0].KmsOrigenDestino);
            info.idRuta = parseInt(array[0].FKICRutas);
            info.speed = parseInt(array[0].speed);
            info.idGeocerca = array[0].UltimaGeoCerca;
            info.nombreGeocerca = array[0].nombre_geo;
        }
        return info;
    }catch(error){
        return info;
    }

}

//FUNCION QUE ALMACENA LOS DATOS DE LA ULTIMA EJECUCION
async function GuardarEjecucion(){
    try{
        var consulta="UPDATE dbo.TblServicios SET UltEjecucionServicio = CASE WHEN DATEDIFF(MI, UltEjecucionServicio, DATEADD(HH, 2, GETDATE())) > 60 THEN DATEADD(HH, 2, GETDATE()) ELSE UltEjecucionServicio END ";
        consulta += "WHERE CodServicio = '"+Constantes.serviceCode+"'";
        const mensaje = await sqlconfig.query(consulta);
        var array = mensaje.recordset;
        if(array.length > 0){
            return true;
        }else{
            return false;
        }
    }catch(error){
        return false;
    }
}

async function ActualizarOrigen(ID){

    try{
        var id_ = ID.substring(0, ID.length - 1);
        var flag = ID.slice(-1);
        var consulta="UPDATE mainData SET "+Constantes.bitactualizado+"= 1 WHERE maindataID="+id_;
        console.log(consulta);
        const mensaje = await query(consulta);

        if(mensaje.affectedRows > 0){
            return true;
        }else{
            return false;
        }
    }catch(error){
        return false;
    }
}

module.exports = {
    "EquipoExiste": EquipoExiste,
    "CrearEquipo": CrearEquipo,
    "LeerApertura": LeerApertura,
    "Asegurado": Asegurado,
    "TomarFechaDevice": TomarFechaDevice,
    "InfoMensaje": InfoMensaje,
    "GetInfoDevice": GetInfoDevice,
    "LeerVarios": LeerVarios,
    "GuardarEjecucion": GuardarEjecucion,
    "ActualizarOrigen": ActualizarOrigen
}
