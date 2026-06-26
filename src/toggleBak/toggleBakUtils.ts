import { basename, dirname, join } from 'path';

export const BAK_SUFFIX = '.bak';

/**
 * 切换文件路径的 .bak 后缀
 * 如果文件名以 .bak 结尾，则去掉该后缀；否则添加 .bak 后缀
 * @param filePath 当前文件路径
 * @returns 切换后的文件路径
 */
export function toggleBakSuffix(filePath: string): string {
  const dir = dirname(filePath);
  const fileName = basename(filePath);
  if (fileName.endsWith(BAK_SUFFIX)) {
    return join(dir, fileName.slice(0, -BAK_SUFFIX.length));
  }
  return join(dir, `${fileName}${BAK_SUFFIX}`);
}

/**
 * 判断文件路径是否带有 .bak 后缀
 * @param filePath 文件路径
 */
export function hasBakSuffix(filePath: string): boolean {
  return basename(filePath).endsWith(BAK_SUFFIX);
}
