const inline = require('inline-source').sync;
const fs = require('fs');

const html = inline('./index.html', { compress: false });
fs.writeFileSync('./dist/index.html', html);
