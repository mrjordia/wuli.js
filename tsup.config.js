const { defineConfig } = require('tsup');
const fs = require('fs');
const path = require('path');

function getRelativeSourceFiles(dir, rootDir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    console.error(`❌ 目录不存在: ${dir}`);
    return files;
  }

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.resolve(dir, entry.name);
      const relativePath = path.relative(rootDir, fullPath);

      if (entry.isDirectory() && !['node_modules', '__tests__', 'test'].includes(entry.name)) {
        files.push(...getRelativeSourceFiles(fullPath, rootDir));
      }
      else if (entry.isFile()) {
        if (fullPath.endsWith('.ts') && !fullPath.endsWith('.d.ts')) {
          if (fs.existsSync(fullPath)) {
            const posixRelativePath = relativePath.replace(/\\/g, '/');
            files.push(posixRelativePath);
          } else {
            console.warn(`⚠️ 文件不存在: ${fullPath}`);
          }
        }
      }
    }
  } catch (err) {
    console.error(`❌ 读取目录失败: ${dir}`, err.message);
  }

  return files;
}

const rootDir = process.cwd();
const srcDir = path.resolve(rootDir, 'src');
const allSourceFiles = getRelativeSourceFiles(srcDir, rootDir);

console.log(`📂 项目根目录: ${rootDir}`);
console.log(`📂 src 目录: ${srcDir}`);
console.log(`📄 找到 ${allSourceFiles.length} 个有效 ts 文件`);
if (allSourceFiles.length > 0) {
  console.log(`🔍 第一个文件（相对路径）: ${allSourceFiles[0]}`);
}

const fullBundleEntry = path.relative(rootDir, path.resolve(srcDir, 'index.ts')).replace(/\\/g, '/');

module.exports = defineConfig([
  {
    entry: allSourceFiles,
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    preserveModules: true,
    preserveModulesRoot: srcDir,
    outDir: 'dist/modules',
    clean: true,
    sourcemap: true,
    bundle: false,
    noExternal: [],
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.js' : '.mjs',
        dts: '.d.ts'
      };
    },
    esbuildOptions(options) {
      options.absWorkingDir = rootDir;
      return options;
    },
    ignoreNotFoundEntries: false
  },
  {
    entry: { wuli: fullBundleEntry },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    bundle: true,
    outDir: 'dist/bundle',
    clean: true,
    sourcemap: true,
    entryNames: '[name]',
    outExtension({ format }) {
      return { js: format === 'cjs' ? '.js' : '.mjs', dts: '.d.ts' };
    },
    esbuildOptions(options) {
      options.absWorkingDir = rootDir;
      return options;
    }
  }
]);