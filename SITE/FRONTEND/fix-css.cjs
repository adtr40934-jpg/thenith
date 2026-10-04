const fs = require('fs');
const file = 'c:/Users/Adam/Desktop/thenith/site/SITE/FRONTEND/src/styles/shared.css';
let css = fs.readFileSync(file, 'utf8');

// SweetAlert2 Light
css = css.replace(/background:\s*rgba\(255,\s*255,\s*255,\s*0\.65\)\s*!important;/g, 'background: #ffffff !important;');
css = css.replace(/backdrop-filter:\s*blur\(16px\)\s*!important;/g, '');
css = css.replace(/-webkit-backdrop-filter:\s*blur\(16px\)\s*!important;/g, '');
css = css.replace(/border:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.5\)\s*!important;/g, 'border: none !important;');
css = css.replace(/box-shadow:\s*0\s*20px\s*40px\s*rgba\(0,\s*0,\s*0,\s*0\.08\)\s*!important;/g, 'box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08) !important;');

// SweetAlert2 Dark
css = css.replace(/background:\s*rgba\(15,\s*23,\s*42,\s*0\.65\)\s*!important;/g, 'background: #0f172a !important;');
css = css.replace(/border:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.08\)\s*!important;/g, 'border: 1px solid rgba(255, 255, 255, 0.05) !important;');
css = css.replace(/box-shadow:\s*0\s*20px\s*40px\s*rgba\(0,\s*0,\s*0,\s*0\.3\)\s*!important;/g, 'box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3) !important;');

// Toast Light
css = css.replace(/background:\s*rgba\(255,\s*255,\s*255,\s*0\.7\)\s*!important;/g, 'background: #ffffff !important;');
css = css.replace(/backdrop-filter:\s*blur\(12px\)\s*!important;/g, '');
css = css.replace(/-webkit-backdrop-filter:\s*blur\(12px\)\s*!important;/g, '');
css = css.replace(/border:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.5\)\s*!important;/g, 'border: none !important;');
css = css.replace(/box-shadow:\s*0\s*10px\s*25px\s*rgba\(0,\s*0,\s*0,\s*0\.05\)\s*!important;/g, 'box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08) !important;');

// Toast Dark
css = css.replace(/background:\s*rgba\(15,\s*23,\s*42,\s*0\.7\)\s*!important;/g, 'background: #0f172a !important;');

fs.writeFileSync(file, css, 'utf8');
console.log('done');
