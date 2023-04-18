const winston = require('winston');
require('winston-daily-rotate-file');
const { combine, timestamp, json } = winston.format;

const fileRotateTransportError = new winston.transports.DailyRotateFile({
  filename: 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',
});


const loggerError = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(timestamp(), json()),
    transports: [fileRotateTransportError],
});

function saveLog(mensaje){
    loggerError.info(mensaje);
}


module.exports = {
    "saveLog": saveLog
}
