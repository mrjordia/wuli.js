// const { defineConfig } = require('tsup');
// const fs = require('fs').promises;
// const fsSync = require('fs');
// const path = require('path');

// function getRelativeSourceFiles(dir, rootDir) {
//   const files = [];

//   if (!fsSync.existsSync(dir)) {
//     console.error(`❌ 目录不存在: ${dir}`);
//     return files;
//   }

//   try {
//     const entries = fsSync.readdirSync(dir, { withFileTypes: true });

//     for (const entry of entries) {
//       const fullPath = path.resolve(dir, entry.name);
//       const relativePath = path.relative(rootDir, fullPath);

//       if (entry.isDirectory() && !['node_modules', '__tests__', 'test'].includes(entry.name)) {
//         files.push(...getRelativeSourceFiles(fullPath, rootDir));
//       }
//       else if (entry.isFile()) {
//         if (fullPath.endsWith('.ts') && !fullPath.endsWith('.d.ts')) {
//           if (fsSync.existsSync(fullPath)) {
//             const posixRelativePath = relativePath.replace(/\\/g, '/');
//             files.push(posixRelativePath);
//           } else {
//             console.warn(`⚠️ 文件不存在: ${fullPath}`);
//           }
//         }
//       }
//     }
//   } catch (err) {
//     console.error(`❌ 读取目录失败: ${dir}`, err.message);
//   }

//   return files;
// }

// async function waitForFileExist(filePath, timeout) {
//   const start = Date.now();
//   while (Date.now() - start < timeout) {
//     try {
//       await fs.access(filePath);
//       return true;
//     } catch {
//       await new Promise(resolve => setTimeout(resolve, 200));
//     }
//   }
//   return false;
// }

// async function deleteDMtsAfterGenerated(filePath, timeout) {
//   console.log(`ℹ️ 等待 .d.mts 文件生成: ${filePath}`);

//   const fileGenerated = await waitForFileExist(filePath, timeout);
//   if (!fileGenerated) {
//     console.warn(`⚠️ 超时(${timeout}ms)未检测到 .d.mts 文件: ${filePath}`);
//     return false;
//   }

//   try {
//     await fs.unlink(filePath);
//     console.log(`✅ 已删除多余文件: ${filePath}`);
//     return true;
//   } catch (err) {
//     console.error(`❌ 删除 .d.mts 文件失败: ${filePath} (${err.message})`);
//     return false;
//   }
// }

// const rootDir = process.cwd();
// const srcDir = path.resolve(rootDir, 'src');
// const allSourceFiles = getRelativeSourceFiles(srcDir, rootDir);

// console.log(`📂 项目根目录: ${rootDir}`);
// console.log(`📂 src 目录: ${srcDir}`);
// console.log(`📄 找到 ${allSourceFiles.length} 个有效 ts 文件`);
// if (allSourceFiles.length > 0) {
//   console.log(`🔍 第一个文件（相对路径）: ${allSourceFiles[0]}`);
// }

// const fullBundleEntry = path.relative(rootDir, path.resolve(srcDir, 'index.ts')).replace(/\\/g, '/');
// const dMtsPath = path.resolve(rootDir, 'dist/bundle/wuli.d.mts');

// module.exports = defineConfig([
//   {
//     entry: allSourceFiles,
//     format: ['cjs', 'esm'],
//     dts: false,
//     splitting: false,
//     preserveModules: true,
//     preserveModulesRoot: srcDir,
//     outDir: 'dist/modules',
//     clean: true,
//     sourcemap: true,
//     bundle: false,
//     noExternal: [],
//     outExtension({ format }) {
//       return {
//         js: format === 'cjs' ? '.js' : '.mjs',
//       };
//     },
//     esbuildOptions(options) {
//       options.absWorkingDir = rootDir;
//       return options;
//     },
//     ignoreNotFoundEntries: false,
//     onSuccess: async () => {
//       const { execSync } = require('child_process');
//       try {
//         execSync('tsc --emitDeclarationOnly --declarationDir dist/modules', {
//           stdio: 'inherit',
//           cwd: rootDir
//         });
//         console.log('✅ modules 类型文件生成完成（无哈希）');
//       } catch (err) {
//         console.error('❌ 生成类型文件失败:', err.message);
//       }
//     }
//   },
//   {
//     entry: { wuli: fullBundleEntry },
//     format: ['cjs', 'esm'],
//     dts: true,
//     splitting: false,
//     bundle: true,
//     outDir: 'dist/bundle',
//     clean: true,
//     sourcemap: true,
//     entryNames: '[name]',
//     outExtension({ format }) {
//       return { js: format === 'cjs' ? '.js' : '.mjs', dts: '.d.ts' };
//     },
//     esbuildOptions(options) {
//       options.absWorkingDir = rootDir;
//       return options;
//     },
//     onSuccess: async () => {
//       await deleteDMtsAfterGenerated(dMtsPath, 30000);
//     }
//   }
// ]);








const { defineConfig } = require('tsup');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

function getRelativeSourceFiles(dir, rootDir) {
  const files = [];
  if (!fsSync.existsSync(dir)) {
    console.error(`❌ 目录不存在: ${dir}`);
    return files;
  }

  try {
    const entries = fsSync.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.resolve(dir, entry.name);
      const relativePath = path.relative(rootDir, fullPath);

      if (entry.isDirectory() && !['node_modules', '__tests__', 'test'].includes(entry.name)) {
        files.push(...getRelativeSourceFiles(fullPath, rootDir));
      } else if (entry.isFile()) {
        if ((fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) && !fullPath.endsWith('.d.ts')) {
          const posixRelativePath = relativePath.replace(/\\/g, '/');
          files.push(posixRelativePath);
        }
      }
    }
  } catch (err) {
    console.error(`❌ 读取目录失败: ${dir}`, err.message);
  }
  return files;
}

async function waitForFileExist(filePath, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  console.warn(`⚠️ 超时未检测到文件: ${filePath}`);
  return false;
}

async function deleteDMtsAfterGenerated(filePath) {
  console.log(`ℹ️ 等待 .d.mts 文件生成: ${filePath}`);
  if (!await waitForFileExist(filePath)) return false;

  try {
    await fs.unlink(filePath);
    console.log(`✅ 已删除多余文件: ${filePath}`);
    return true;
  } catch (err) {
    console.error(`❌ 删除 .d.mts 失败: ${filePath} (${err.message})`);
    return false;
  }
}

function fixImportPathExtensions(targetDir, fileExt, extToAdd) {
  if (!fsSync.existsSync(targetDir)) {
    console.error(`❌ 目标目录不存在: ${targetDir}`);
    return;
  }

  const walk = (dir) => {
    const entries = fsSync.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.isFile() && fullPath.endsWith(fileExt)) {
        let content = fsSync.readFileSync(fullPath, 'utf8');
        const regex = /(from\s+['"])(\.\.?\/[^'"]+)(?<!\.[a-zA-Z0-9]+)(['"])/g;
        const newContent = content.replace(regex, `$1$2${extToAdd}$3`);
        
        if (newContent !== content) {
          fsSync.writeFileSync(fullPath, newContent, 'utf8');
          console.log(`✅ 修复路径: ${fullPath}`);
        }
      }
    }
  };

  walk(targetDir);
  console.log(`✅ ${fileExt} 文件路径修复完成（补充${extToAdd}）`);
}

const rootDir = process.cwd();
const srcDir = path.resolve(rootDir, 'src');
const allSourceFiles = getRelativeSourceFiles(srcDir, rootDir);
const modulesDistDir = path.resolve(rootDir, 'dist/modules');
const bundleDistDir = path.resolve(rootDir, 'dist/bundle');
const fullBundleEntry = path.relative(rootDir, path.resolve(srcDir, 'index.ts')).replace(/\\/g, '/');
const dMtsPath = path.resolve(bundleDistDir, 'wuli.d.mts');

console.log(`📂 根目录: ${rootDir}`);
console.log(`📂 src 目录: ${srcDir}`);
console.log(`📄 待构建文件数: ${allSourceFiles.length}`);
if (allSourceFiles.length) console.log(`🔍 示例文件: ${allSourceFiles[0]}`);

module.exports = defineConfig([
  {
    entry: allSourceFiles,
    format: ['cjs', 'esm'],
    dts: false,
    splitting: false,
    preserveModules: true,
    preserveModulesRoot: srcDir,
    outDir: modulesDistDir,
    clean: true,
    sourcemap: true,
    bundle: false,
    outExtension({ format }) {
      return { js: format === 'cjs' ? '.cjs' : '.mjs' };
    },
    esbuildOptions(options) {
      options.absWorkingDir = rootDir;
      options.resolveExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
      options.mainFields = ['module', 'main']; 
      return options;
    },
    onSuccess: async () => {
      const { execSync } = require('child_process');
      try {
        execSync('tsc --emitDeclarationOnly --declarationDir dist/modules', { stdio: 'inherit', cwd: rootDir });
        fixImportPathExtensions(modulesDistDir, '.d.ts', '.ts');
        fixImportPathExtensions(modulesDistDir, '.mjs', '.mjs');
      } catch (err) {
        console.error('❌ 生成类型文件失败:', err.message);
      }
    }
  },
  {
    entry: { wuli: fullBundleEntry },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    bundle: true,
    outDir: bundleDistDir,
    clean: true,
    sourcemap: true,
    entryNames: '[name]',
    outExtension({ format }) {
      return { js: format === 'cjs' ? '.cjs' : '.mjs', dts: '.d.ts' };
    },
    esbuildOptions(options) {
      options.absWorkingDir = rootDir;
      options.resolveExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
      return options;
    },
    onSuccess: async () => {
      await deleteDMtsAfterGenerated(dMtsPath);
      fixImportPathExtensions(bundleDistDir, '.d.ts', '.ts');
      fixImportPathExtensions(bundleDistDir, '.mjs', '.mjs');
    }
  }
]);