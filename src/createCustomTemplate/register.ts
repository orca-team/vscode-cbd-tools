import * as vscode from 'vscode';
import { createCustomTemplate } from './customTemplateUtils';

export function register(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('cbd-tools.create-custom-template', async (event) => {
    const currentPath = process.platform === 'win32' ? event.path.replace(/^\//, '') : event.path;

    try {
      await createCustomTemplate(currentPath);
    } catch (e) {
      if (e instanceof Error) {
        vscode.window.showErrorMessage(`创建自定义模板失败: ${e.message}`);
        console.error(e);
      }
    }
  });

  context.subscriptions.push(disposable);
}
