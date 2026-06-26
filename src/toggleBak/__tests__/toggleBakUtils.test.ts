import { describe, expect, it } from 'vitest';
import { toggleBakSuffix, hasBakSuffix } from '../toggleBakUtils';

describe('toggleBakUtils', () => {
  describe('toggleBakSuffix', () => {
    it('should add .bak suffix when file does not have it', () => {
      expect(toggleBakSuffix('/path/to/file.ts')).toBe('/path/to/file.ts.bak');
    });

    it('should remove .bak suffix when file has it', () => {
      expect(toggleBakSuffix('/path/to/file.ts.bak')).toBe('/path/to/file.ts');
    });

    it('should handle files with multiple dots', () => {
      expect(toggleBakSuffix('/path/to/file.test.ts')).toBe('/path/to/file.test.ts.bak');
      expect(toggleBakSuffix('/path/to/file.test.ts.bak')).toBe('/path/to/file.test.ts');
    });

    it('should handle files without extension', () => {
      expect(toggleBakSuffix('/path/to/README')).toBe('/path/to/README.bak');
      expect(toggleBakSuffix('/path/to/README.bak')).toBe('/path/to/README');
    });

    it('should only remove the trailing .bak, not .bak in the middle', () => {
      expect(toggleBakSuffix('/path/to/file.bak.ts')).toBe('/path/to/file.bak.ts.bak');
    });

    it('should handle hidden .bak file (empty basename)', () => {
      // basename('.bak') === '.bak', which ends with '.bak' -> removes to empty
      // path.join normalizes the trailing slash away
      expect(toggleBakSuffix('/path/to/.bak')).toBe('/path/to');
    });
  });

  describe('hasBakSuffix', () => {
    it('should return true for .bak files', () => {
      expect(hasBakSuffix('/path/to/file.ts.bak')).toBe(true);
    });

    it('should return false for non-.bak files', () => {
      expect(hasBakSuffix('/path/to/file.ts')).toBe(false);
    });

    it('should return false for files with .bak in the middle', () => {
      expect(hasBakSuffix('/path/to/file.bak.ts')).toBe(false);
    });
  });
});
