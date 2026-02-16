const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function build() {
  // Ensure dist directory exists
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }

  // Copy static files to dist
  const staticFiles = ['index.html', 'vercel.json', 'metadata.json', 'types.ts'];
  staticFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join('dist', file));
    }
  });

  // Copy components and services directories
  ['components', 'services'].forEach(dir => {
    if (fs.existsSync(dir)) {
      const destDir = path.join('dist', dir);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.readdirSync(dir).forEach(file => {
        fs.copyFileSync(path.join(dir, file), path.join(destDir, file));
      });
    }
  });

  // Build the main bundle
  await esbuild.build({
    entryPoints: ['index.tsx'],
    bundle: true,
    outfile: 'dist/bundle.js',
    format: 'iife',
    target: ['es2020'],
    minify: true,
    sourcemap: false,
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts'
    }
  });

  // Update index.html to include the bundle
  let html = fs.readFileSync('index.html', 'utf8');
  html = html.replace('</body>', '<script src="bundle.js"></script></body>');
  fs.writeFileSync('dist/index.html', html);

  console.log('Build completed successfully!');
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
