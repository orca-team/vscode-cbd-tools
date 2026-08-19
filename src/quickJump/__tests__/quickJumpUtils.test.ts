import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import { quickJumpByExtensions, quickJumpToJs, quickJumpToCss, quickJumpToVue, quickJumpToIndex } from '../quickJumpUtils';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

describe('quickJumpUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('quickJumpByExtensions', () => {
    it('should handle single dot filename', () => {
      const existsSyncMock = vi.mocked(fs.existsSync);
      existsSyncMock.mockReturnValueOnce(true);

      const result = quickJumpByExtensions('/path/to/file.js', ['.ts']);
      expect(result).toBe('/path/to/file.ts');
      expect(existsSyncMock).toHaveBeenCalledWith('/path/to/file.ts');
    });

    it('should handle multiple dot filename', () => {
      const existsSyncMock = vi.mocked(fs.existsSync);
      existsSyncMock
        .mockReturnValueOnce(false) // first attempt fails
        .mockReturnValueOnce(true); // second attempt succeeds

      const result = quickJumpByExtensions('/path/to/file.test.js', ['.ts']);
      expect(result).toBe('/path/to/file.test.ts');
      expect(existsSyncMock).toHaveBeenCalledTimes(2);
      expect(existsSyncMock).toHaveBeenCalledWith('/path/to/file.ts');
      expect(existsSyncMock).toHaveBeenCalledWith('/path/to/file.test.ts');
    });

    it('should return empty string when no matching file exists', () => {
      const existsSyncMock = vi.mocked(fs.existsSync);
      existsSyncMock.mockReturnValue(false);

      const result = quickJumpByExtensions('/path/to/file.js', ['.ts', '.tsx']);
      expect(result).toBe('');
      expect(existsSyncMock).toHaveBeenCalledTimes(2); // 2 extensions × 1 possible pattern each
    });
  });

  describe('quickJumpToJs', () => {
    it('should try all JS-related extensions', () => {
      const existsSyncMock = vi.mocked(fs.existsSync);
      existsSyncMock
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      const result = quickJumpToJs('/path/to/file.css');
      expect(result).toBe('/path/to/file.js');
      expect(existsSyncMock).toHaveBeenCalledWith('/path/to/file.ts');
      expect(existsSyncMock).toHaveBeenCalledWith('/path/to/file.tsx');
      expect(existsSyncMock).toHaveBeenCalledWith('/path/to/file.js');
    });

    it('should handle .d.ts to .js jump', () => {
      const existsSyncMock = vi.mocked(fs.existsSync);
      existsSyncMock.mockReturnValueOnce(true);

      const result = quickJumpByExtensions('/path/to/file.d.ts', ['.js']);
      expect(result).toBe('/path/to/file.js');
      expect(existsSyncMock).toHaveBeenCalledWith('/path/to/file.js');
    });
  });

  describe('quickJumpToCss', () => {
    it('should try all CSS-related extensions', () => {
      const existsSyncMock = vi.mocked(fs.existsSync);
      existsSyncMock
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      const result = quickJumpToCss('/path/to/file.tsx');
      expect(result).toBe('/path/to/file.module.less');
      expect(existsSyncMock).toHaveBeenCalledWith('/path/to/file.less');
      expect(existsSyncMock).toHaveBeenCalledWith('/path/to/file.module.less');
    });
  });

  describe('quickJumpToVue', () => {
    it('should try Vue extension', () => {
      const existsSyncMock = vi.mocked(fs.existsSync);
      existsSyncMock.mockReturnValueOnce(true);

      const result = quickJumpToVue('/path/to/file.ts');
      expect(result).toBe('/path/to/file.vue');
      expect(existsSyncMock).toHaveBeenCalledWith('/path/to/file.vue');
    });
  });

  describe('quickJumpToIndex', () => {
    it('should jump to current directory index when current file is not index', () => {
      const existsSyncMock = vi.mocked(fs.existsSync);
      existsSyncMock.mockReturnValueOnce(true);

      const result = quickJumpToIndex('/path/to/src/components/Button/Button.tsx', '/path/to/src');
      expect(result).toBe('/path/to/src/components/Button/index.ts');
      expect(existsSyncMock).toHaveBeenCalledWith('/path/to/src/components/Button/index.ts');
    });

    it('should jump to parent directory index when current file is index', () => {
      const existsSyncMock = vi.mocked(fs.existsSync);
      existsSyncMock
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      const result = quickJumpToIndex('/path/to/src/components/Button/index.tsx', '/path/to/src');
      expect(result).toBe('/path/to/src/components/index.tsx');
      expect(existsSyncMock).toHaveBeenCalledWith('/path/to/src/components/index.ts');
      expect(existsSyncMock).toHaveBeenCalledWith('/path/to/src/components/index.tsx');
    });

    it('should keep searching parent directories until workspace root', () => {
      const existsSyncMock = vi.mocked(fs.existsSync);
      existsSyncMock.mockReturnValue(false);

      const result = quickJumpToIndex('/path/to/src/components/Button/Button.tsx', '/path/to/src');
      expect(result).toBe('');
      expect(existsSyncMock).toHaveBeenCalledWith('/path/to/src/components/Button/index.ts');
      expect(existsSyncMock).toHaveBeenCalledWith('/path/to/src/components/index.ts');
      expect(existsSyncMock).toHaveBeenCalledWith('/path/to/src/index.ts');
      expect(existsSyncMock).not.toHaveBeenCalledWith('/path/to/index.ts');
    });
  });
});
