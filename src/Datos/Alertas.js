var sqlconfig = require("../model/dbpool");
var query = require("../model/dbpoolMysql");

//OBTENGO EL LISTADO DE LOS CORREOS Y/O NUMEROS DE TELEFONO DE LOS CONTACTOS DE PROYECTO POR MEDIO DE UNA FUNCION DE LA BASE DE DATOS SQL SERVER
async function ListaCorreosPorProyecto(contrato, parametro, alerta){
    var consulta="select distinct " + parametro + " as param from dbo.Mails('" + contrato + "',2,0) WHERE " + alerta + " = 1";
    const resultado = await sqlconfig.query(consulta);
    var array = resultado.recordset;
    return array;
}

//OBTIENE LA LISTA DE LOS CELULARES DE LOS CONTACTOS PARA EL ENVIO DE ALERTAS
async function ListaDeContacts(contrato, parametro, alerta){
    var consulta="select distinct " + parametro + " as param from dbo.Mails('" + contrato + "',1,1) WHERE " + alerta + " = 1";
    const resultado = await sqlconfig.query(consulta);
    var array = resultado.recordset;
    return array;
}

//OBTIENE LA LISTA DE LOS CELULARES DE LOS CONTACTOS PARA EL ENVIO DE ALERTAS
async function listaSMS(contrato, parametro, alerta){
    var lista="";
    var l1 = await ListaDeContacts(contrato, parametro, alerta);
    var l2 = await ListaCorreosPorProyecto(contrato, parametro, alerta);
    for(var i in l1){
        if(!lista.contains(l1[i].param)){
            lista+=l1[i].param+"-";
        }
    }
    for(var i in l2){
        if(!lista.contains(l2[i].param)){
            lista+=l2[i].param+"-";
        }
    }
    if(lista.length > 0){
        lista=lista.substring(0, lista.length - 1);
    }
    return lista;
}


module.exports = {
    "ListaCorreosPorProyecto": ListaCorreosPorProyecto,
    "ListaDeContacts": ListaDeContacts,
    "listaSMS": listaSMS	
}
