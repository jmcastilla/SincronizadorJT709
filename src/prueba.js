
const numeros = [1, 2, 3, 4, 5, "muestra"];

repetirCadaSegundo();
function repetirCadaSegundo() {
    mandarMensaje(0);
    mandarMensaje(1);
    mandarMensaje(2);
    mandarMensaje(3);
    mandarMensaje(4);
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function mandarMensaje(id) {


    try{
        const aleatorio = numeros[Math.floor(Math.random() * numeros.length)];
        if(aleatorio == "muestra"){
            nonExistentFunction();
        }
        if(id<3){
            await sleep(10000);
        }else{
            await sleep(3000);
        }

        console.log("termino: "+id);
        mandarMensaje(id);
    }catch(error){
        console.log(id+"-"+error);
        mandarMensaje(id);
    }

}
