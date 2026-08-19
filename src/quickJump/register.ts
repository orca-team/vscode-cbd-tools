import * as vscode from 'vscode';
import { quickJumpToCss, quickJumpToIndex, quickJumpToJs, quickJumpToVue } from './quickJumpUtils';

const { window } = vscode;

export function register(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('cbd-tools.quick-jump-to-js', async () => {
      try {
        const editor = window.activeTextEditor;
        if (!editor) {
          vscode.window.showWarningMessage('没有活动的文本编辑器');
          return;
        }

        const { document } = editor;
        const filePath = document.fileName;

        console.log('Quick jump to JS - Current file:', filePath);

        const newFilePath = quickJumpToJs(filePath);
        if (newFilePath) {
          console.log('Found JS file:', newFilePath);
          const doc = await vscode.workspace.openTextDocument(newFilePath);
          await vscode.window.showTextDocument(doc);
        } else {
          vscode.window.showInformationMessage('未找到对应的 JS/TS 文件');
        }
      } catch (error) {
        console.error('Quick jump to JS error:', error);
        vscode.window.showErrorMessage(`跳转失败: ${error}`);
      }
    }),
    vscode.commands.registerCommand('cbd-tools.quick-jump-to-css', async () => {
      try {
        const editor = window.activeTextEditor;
        if (!editor) {
          vscode.window.showWarningMessage('没有活动的文本编辑器');
          return;
        }

        const { document } = editor;
        const filePath = document.fileName;

        console.log('Quick jump to CSS - Current file:', filePath);

        const newFilePath = quickJumpToCss(filePath);
        if (newFilePath) {
          console.log('Found CSS file:', newFilePath);
          const doc = await vscode.workspace.openTextDocument(newFilePath);
          await vscode.window.showTextDocument(doc);
        } else {
          vscode.window.showInformationMessage('未找到对应的 CSS/LESS 文件');
        }
      } catch (error) {
        console.error('Quick jump to CSS error:', error);
        vscode.window.showErrorMessage(`跳转失败: ${error}`);
      }
    }),
    vscode.commands.registerCommand('cbd-tools.quick-jump-to-vue', async () => {
      try {
        const editor = window.activeTextEditor;
        if (!editor) {
          vscode.window.showWarningMessage('没有活动的文本编辑器');
          return;
        }

        const { document } = editor;
        const filePath = document.fileName;

        console.log('Quick jump to Vue - Current file:', filePath);

        const newFilePath = quickJumpToVue(filePath);
        if (newFilePath) {
          console.log('Found Vue file:', newFilePath);
          const doc = await vscode.workspace.openTextDocument(newFilePath);
          await vscode.window.showTextDocument(doc);
        } else {
          vscode.window.showInformationMessage('未找到对应的 Vue 文件');
        }
      } catch (error) {
        console.error('Quick jump to Vue error:', error);
        vscode.window.showErrorMessage(`跳转失败: ${error}`);
      }
    }),
    vscode.commands.registerCommand('cbd-tools.quick-jump-to-index', async () => {
      try {
        const editor = window.activeTextEditor;
        if (!editor) {
          vscode.window.showWarningMessage('没有活动的文本编辑器');
          return;
        }

        const { document } = editor;
        const filePath = document.fileName;
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

        if (!workspaceFolder) {
          vscode.window.showWarningMessage('当前文件不在工作区内');
          return;
        }

        console.log('Quick jump to Index - Current file:', filePath);

        const newFilePath = quickJumpToIndex(filePath, workspaceFolder.uri.fsPath);
        if (newFilePath) {
          console.log('Found Index file:', newFilePath);
          const doc = await vscode.workspace.openTextDocument(newFilePath);
          await vscode.window.showTextDocument(doc);
        } else {
          vscode.window.showInformationMessage('未找到外层 Index 文件');
        }
      } catch (error) {
        console.error('Quick jump to Index error:', error);
        vscode.window.showErrorMessage(`跳转失败: ${error}`);
      }
    }),
  );
}
