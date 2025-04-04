import * as vscode from 'vscode';
import { basename, dirname } from 'path';
import * as fs from 'fs/promises';
import {
  createTemplate,
  getSuggestListByPath,
  getAllTemplates,
  TemplateConfig,
} from './templateUtils';

const { window } = vscode;

export function register(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('cbd-tools.create-template', async (event) => {
    const currentPath = process.platform === 'win32' ? event.path.replace(/^\//, '') : event.path;

    try {
      // 获取所有可用模板（内置 + 自定义）
      const allTemplates = getAllTemplates(currentPath);
      const sortedList = getSuggestListByPath(currentPath, allTemplates);
      console.log('sortedList', sortedList);

      // 将模板分为内置和自定义两组
      const builtinTemplates = sortedList.filter(item => item.source === 'builtin' || !item.source);
      const customTemplates = sortedList.filter(item => item.source === 'custom');

      // 创建分组的 QuickPick 项
      const quickPickItems: (vscode.QuickPickItem & { item?: TemplateConfig })[] = [];

      // 添加内置模板组
      if (builtinTemplates.length > 0) {
        quickPickItems.push({
          label: '内置模板',
          kind: vscode.QuickPickItemKind.Separator,
        });

        builtinTemplates.forEach((item) => {
          quickPickItems.push({
            label: item.name,
            description: item.description || '',
            item,
          });
        });
      }

      // 添加自定义模板组
      if (customTemplates.length > 0) {
        quickPickItems.push({
          label: '自定义模板',
          kind: vscode.QuickPickItemKind.Separator,
        });

        customTemplates.forEach((item) => {
          quickPickItems.push({
            label: item.name,
            description: item.description || '',
            item,
          });
        });
      }

      const pickedTemplate = await window.showQuickPick(quickPickItems);

      if (pickedTemplate?.item) {
        const { item } = pickedTemplate;
        let cwd = currentPath;
        const stat = await fs.stat(cwd);
        if (!stat.isDirectory()) { cwd = dirname(cwd); }
        const name = await window.showInputBox({
          value: basename(cwd),
          placeHolder: '请输入子目录名称，输入空则在当前目录创建',
        });

        // 如果用户按下 Esc 键取消输入，name 将为 undefined，此时应终止创建过程
        if (name === undefined) {
          return;
        }

        const templateName = item.name;
        const templateRootDir = item.rootDir;

        const result = await createTemplate(cwd, templateName, {
          name,
        }, templateRootDir);

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
