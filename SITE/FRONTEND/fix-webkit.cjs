const fs = require('fs');
const file = 'c:/Users/Adam/Desktop/thenith/site/SITE/FRONTEND/src/styles/shared.css';
let css = fs.readFileSync(file, 'utf8');

css = css.replace(/ -webkit-\r?\n/g, '');

fs.writeFileSync(file, css, 'utf8');
console.log('done');
