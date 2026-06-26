import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import { toggleBakSuffix } from './toggleBakUtils';

const { window, workspace } = vscode;

export async function register(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('cbd-tools.toggle-bak-extension', async () => {
    const editor = window.activeTextEditor;
    if (!editor) {
      window.showWarningMessage('没有活动的文本编辑器');
      return;
    }

    const { document } = editor;
    const filePath = document.fileName;
    const newPath = toggleBakSuffix(filePath);

    if (newPath === filePath) {
      return;
    }

    try {
      // 保存未保存的修改，避免重命名后丢失内容
      if (document.isDirty) {
        await document.save();
      }

      // 关闭当前编辑器，避免文件被占用导致重命名失败
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

      // 重命名文件
      await fs.rename(filePath, newPath);

      // 打开重命名后的文件
      const newDoc = await workspace.openTextDocument(newPath);
      await window.showTextDocument(newDoc);
    } catch (error) {
      console.error('Toggle bak extension error:', error);
      window.showErrorMessage(`切换后缀失败: ${error}`);
    }
  });

  context.subscriptions.push(disposable);
}
