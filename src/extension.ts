import * as vscode from 'vscode';
import { register as registerCreateTemplate } from './createTemplate/register';
import { register as registerQuickJump } from './quickJump/register';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension \'cbd-tools\' is now active!');

  // 注册命令：创建模板（包含内置模板和自定义模板）
  registerCreateTemplate(context);
  // 注册命令：快速跳转
  registerQuickJump(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}
