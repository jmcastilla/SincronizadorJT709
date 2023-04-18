const mysql = require('mysql');

const pool = mysql.createPool({
  host: '157.230.48.156',
  user: 'juanb',
  password: 'inf0c4rg4',
  database: 'jtdb1'
})


let query = function( sql, values ) {
     // devolver una promesa
  return new Promise(( resolve, reject ) => {
    pool.getConnection(function(err, connection) {
      if (err) {
        console.log("error mysql");
        resolve( err )
      } else {
        connection.query(sql, values, ( err, rows) => {

          if ( err ) {
            console.log("error mysql");
            resolve( err )
          } else {
            resolve( rows )
          }
                     // finaliza la sesión
          connection.release()
        })
      }
    })
  })
}

module.exports =  query;
