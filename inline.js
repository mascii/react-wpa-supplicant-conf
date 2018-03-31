const { inlineSource } = require('inline-source');
const fs = require('fs');

inlineSource('./index.html', {
  compress: false
})
.then(html => {
  fs.writeFileSync('./dist/index.html', html);
});
