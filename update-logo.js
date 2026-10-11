const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<a href="index\.html" class="brand"[^>]*>([\s\S]*?)<\/a>/g, '<a href="index.html" class="brand" style="display:flex; align-items:center;"><img src="assets/images/logo.png" alt="Flenko" style="height: 45px; width: auto; object-fit: contain;"></a>');
  fs.writeFileSync(file, content);
  console.log('Updated', file);
});
