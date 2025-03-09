import * as vscode from 'vscode';
import { basename, dirname } from 'path';
import * as fs from 'fs/promises';
import { createTemplate, getSuggestListByPath } from './templateUtils';

const { window } = vscode;

export function register(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('cbd-tools.create-template', async (event) => {
    const currentPath = process.platform === 'win32' ? event.path.replace(/^\//, '') : event.path;

    try {
      // 列举出所有的模板
      const sortedList = getSuggestListByPath(currentPath);
      console.log('sortedList', sortedList);

      const pickedTemplate = await window.showQuickPick(
        sortedList.map(item => ({
          label: item.name,
          description: item.description,
          type: item.type,
          item,
        })),
      );

      if (pickedTemplate) {
        const { item } = pickedTemplate;
        let cwd = currentPath;
        const stat = await fs.stat(cwd);
        if (!stat.isDirectory()) { cwd = dirname(cwd); }
        const name = await window.showInputBox({
          value: basename(cwd),
          placeHolder: '请输入子目录名称，输入空则在当前目录创建',
        });

        const templateName = item.name;

        const result = await createTemplate(cwd, templateName, {
          name,
        });
        if (result.success) {
          window.showInformationMessage('创建成功');
        } else {
          window.showErrorMessage(result.message);
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        window.showErrorMessage(`出现意外的错误:${e.message}`);
        console.error(e);
      }
    }
  });

  context.subscriptions.push(disposable);
}
