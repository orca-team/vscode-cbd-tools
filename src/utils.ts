import * as childProcess from 'child_process';
import * as vscode from 'vscode';
import { TemplateObject } from './templateUtils';

const { window, ProgressLocation } = vscode;

const installCmd = 'npm i @ali-whale/cbd-cli@latest -g --registry=https://registry-cnpm.dayu.work/';
function isWin() {
  return process.platform === 'win32';
}

export function crossCmd(cmd: string) {
  return isWin() ? `${cmd}.cmd` : cmd;
}

/**
 * 通过 vscode 提示没有安 cbd，并允许帮助用户安装
 */
export const noCbdTips: Function = () => {
  window.showErrorMessage(`没有检测到CBD-CLI工具，请执行安装命令 ${installCmd}`, '帮我安装', '知道了').then((res) => {
    console.log('user select:', res);
    if (res === '帮我安装') {
      window.withProgress(
        {
          location: ProgressLocation.Notification,
          title: '正在安装...',
          cancellable: true,
        },
        (progress, token) => {
          const p = new Promise<void>((resolve, reject) => {
            try {
              const ps = childProcess.spawn(crossCmd('npm'), [
                'i',
                '@ali-whale/cbd-cli@latest',
                '-g',
                '--registry=https://registry-cnpm.dayu.work/',
              ]);

              console.log('进程已启动：', ps.pid);

              token.onCancellationRequested(() => {
                const r: any = ps.kill('SIGKILL');
                if (r) {
                  window.showInformationMessage('已中断安装');
                } else {
                  window.showErrorMessage('似乎未能结束安装');
                }
              });

              const errInfo: Array<String> = [];
              ps.stdout.on('data', (data: Buffer) => {
                progress.report({ message: data.toString() });
                console.log(data.toString());
              });
              ps.stderr.on('data', (data: Buffer) => {
                errInfo.push(data.toString());
              });

              ps.on('close', (code: number) => {
                console.log(`process exit with: ${code}`);
                if (code === 0) {
                  window.showInformationMessage('安装成功');
                  resolve();
                } else {
                  window.showErrorMessage(`安装失败:${errInfo.join('\n')}`);
                  reject();
                }
              });
            } catch (error) {
              reject(error);
            }
          });

          return p;
        },
      );
    }
  });
};

/**
 * 检查CBD是否已安装
 * @param callback
 */
export const checkCbd = () => {
  return new Promise<string>((resolve, reject) => {
    try {
      const ps = childProcess.spawn(crossCmd('cbd'), ['-v', '--mute']);
      let first = true;
      let hasCbd = false;
      ps.stdout.on('data', (data: Buffer) => {
        if (first && /^\d+\.\d+\.\d+/.test(data.toString())) {
          // window.showInformationMessage(`CBD-CLI detected. v:${data.toString()}`);
          first = false;
          hasCbd = true;
          resolve(data.toString().trim());
        }
      });
      ps.on('error', (err: Error) => {
        console.log(`Error: ${err}`);
      });
      ps.on('close', () => {
        if (!hasCbd) {
          reject(new Error('Command \'cbd\' not found.'));
        }
        console.log('Finish.');
      });
    } catch (e) {
      reject(e);
      console.log(e);
    }
  });
};

export const getCbdTemplateList = () => {
  return window.withProgress(
    {
      location: ProgressLocation.Notification,
      title: '正在获取模板...',
      cancellable: true,
    },
    (progress, token) => {
      return new Promise<TemplateObject[]>((resolve, reject) => {
        try {
          const ps = childProcess.spawn(crossCmd('cbd'), ['t', 'ls', '--json', '--mute']);
          let result = '';
          ps.stdout.on('data', (data: Buffer) => {
            result += data.toString();
          });
          ps.on('error', (err: Error) => {
            console.log(`Error: ${err}`);
          });
          ps.on('close', () => {
            // 解析请求结果
            resolve(JSON.parse(result));
          });
        } catch (e) {
          reject(e);
          console.log(e);
        }
      });
    },
  );
};
