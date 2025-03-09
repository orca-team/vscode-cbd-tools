import * as vscode from 'vscode';
import { quickJumpToCss, quickJumpToJs, quickJumpToVue } from './quickJumpUtils';

const { window } = vscode;

export function register(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('cbd-tools.quick-jump-to-js', async () => {
      const editor = window.activeTextEditor;
      if (editor) {
        const { document } = editor;
        const filePath = document.fileName;

        const newFilePath = quickJumpToJs(filePath);
        if (newFilePath) {
          const doc = await vscode.workspace.openTextDocument(newFilePath);
          await vscode.window.showTextDocument(doc);
        }
      }
    }),
    vscode.commands.registerCommand('cbd-tools.quick-jump-to-css', async () => {
      const editor = window.activeTextEditor;
      if (editor) {
        const { document } = editor;
        const filePath = document.fileName;

        const newFilePath = quickJumpToCss(filePath);
        if (newFilePath) {
          const doc = await vscode.workspace.openTextDocument(newFilePath);
          await vscode.window.showTextDocument(doc);
        }
      }
    }),
    vscode.commands.registerCommand('cbd-tools.quick-jump-to-vue', async () => {
      const editor = window.activeTextEditor;
      if (editor) {
        const { document } = editor;
        const filePath = document.fileName;

        const newFilePath = quickJumpToVue(filePath);
        if (newFilePath) {
          const doc = await vscode.workspace.openTextDocument(newFilePath);
          await vscode.window.showTextDocument(doc);
        }
      }
    }),
  );
}
