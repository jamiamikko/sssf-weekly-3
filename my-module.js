const moment = require('moment');

setInterval(() => {
  console.log(moment().format('MMMM Do YYYY, h:mm'));
}, 1000);
