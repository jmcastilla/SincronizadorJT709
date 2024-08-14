const mysql = require('mysql');

const pool = mysql.createPool({
  host: '104.236.112.160',
  user: 'juanb',
  password: 'PELUCHE',
  database: 'jt709a'
})


let query = function( sql, values ) {
     // devolver una promesa
  return new Promise(( resolve, reject ) => {
    pool.getConnection(function(err, connection) {
      if (err) {
        resolve( err )
      } else {
        connection.query(sql, values, ( err, rows) => {

          if ( err ) {
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
