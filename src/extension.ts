import * as childProcess from 'child_process';
import { basename, dirname } from 'path';
import { lt } from 'semver';
import { promises as fs } from 'fs';
import * as vscode from 'vscode';
import { getSuggestListByPath, TemplateObject } from './templateUtils';
import { checkCbd, crossCmd, getCbdTemplateList, noCbdTips } from './utils';

const { window } = vscode;

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension \'cbd-tools\' is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand('cbd.createTemplate', async (event) => {
    const currentPath = process.platform === 'win32' ? event.path.replace(/^\//, '') : event.path;

    try {
      // 检查 CBD path
      const version = await checkCbd();
      console.log('cbd version:', version);
      const supportLsVersion = '1.3.3';
      // 判断是否支持 cbd t ls 命令
      const isSupportLs = !lt(version, supportLsVersion);

      let templateList: TemplateObject[] | undefined;
      if (isSupportLs) {
        // 支持 ls 命令，则需要先执行 cbd t ls 并获得支持的 template type
        console.log('getting cbd template list from `cbd t ls`');
        templateList = await getCbdTemplateList();
        console.log('got cbd template list', JSON.stringify(templateList));
      }

      // 根据当前创建文件的路径进行模板排序
      const sortedList = getSuggestListByPath(currentPath, templateList);
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
        const args: Array<string> = ['t'];
        if (name?.trim()) {
          args.push(name.trim());
        }
        args.push('--type', item.name);

        /* 执行命令 */
        console.log('执行命令:', `${crossCmd('cbd')} ${args.join(' ')}`);
        const ps = childProcess.spawn(crossCmd('cbd'), args, { cwd });
        const errInfo: Array<string> = [];
        ps.stderr.on('data', (data: Buffer) => {
          errInfo.push(data.toString());
        });

        ps.on('close', (code: number) => {
          console.log(`process exit with: ${code}`);
          if (code === 0) {
            /* ok */
            window.setStatusBarMessage('创建成功', 5000);
          } else {
            window.showErrorMessage(`创建失败:${errInfo.join('\n')}`);
          }
        });
      }
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === 'Command \'cbd\' not found.') {
          noCbdTips();
        } else {
          window.showErrorMessage(`出现意外的错误:${e.message}`);
          console.error(e);
        }
      }
    }
    // vscode.commands.getCommands().then((allCommands) => {
    //   console.log("所有命令：", allCommands);
    // });
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
