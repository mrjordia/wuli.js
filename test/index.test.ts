import { describe, test, expect } from '@jest/globals';
import * as allExports from '../src/index';

describe('物理引擎核心模块加载测试', () => {
  test('src/index.ts 能正常导入且无语法/导出错误', () => {
    expect(typeof allExports).toBe('object');
    expect(allExports).not.toBeNull();
  });
});