import { existsSync } from 'fs';

/**
 * 根据当前文件名称，替换文件后缀，如果文件存在，则返回文件路径，否则返回空字符串
 * @param currentFile 当前文件路径
 * @param extensions 后缀名称
 */
export function quickJumpByExtensions(currentFile: string, extensions: string[]): string {
  const dirPath = currentFile.replace(/\/[^/]*$/, '');
  const fileName = currentFile.replace(/^.*[\\/]/, '');

  for (const extension of extensions) {
    const parts = fileName.split('.');

    const possibleFileNames: string[] = [];
    if (parts.length === 2) {
      // 只有一个 dot
      possibleFileNames.push(`${parts[0]}${extension}`);
    } else {
      // 有多个 dot，但我只尝试替换两次
      possibleFileNames.push(parts.slice(0, -1).join('.') + extension);
      possibleFileNames.push(parts.slice(0, -2).join('.') + extension);
    }

    // 检查所有可能的文件名
    for (const newFileName of possibleFileNames) {
      const newFilePath = `${dirPath}/${newFileName}`;
      if (existsSync(newFilePath)) {
        return newFilePath;
      }
    }
  }

  return '';
}

export function quickJumpToJs(currentFile: string): string {
  return quickJumpByExtensions(currentFile, ['.ts', '.tsx', '.js', '.jsx']);
}

export function quickJumpToCss(currentFile: string): string {
  return quickJumpByExtensions(currentFile, ['.less', '.module.less', '.scss', '.module.scss', '.css']);
}

export function quickJumpToVue(currentFile: string): string {
  return quickJumpByExtensions(currentFile, ['.vue']);
}
