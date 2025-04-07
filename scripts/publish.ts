import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execAsync = promisify(exec);

async function checkVersionExists(publisher: string, extensionName: string, version: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`vsce show ${publisher}.${extensionName} --json`);
    const extensionInfo = JSON.parse(stdout);
    return extensionInfo.versions.some((v: any) => v.version === version);
  } catch (error) {
    console.error('检查版本时出错:', error);
    return false;
  }
}

async function main() {
  try {
    // 读取 package.json
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const { version, publisher, name } = packageJson;

    console.log(`检查版本 ${version} 是否已发布...`);
    const exists = await checkVersionExists(publisher, name, version);

    if (exists) {
      console.log(`版本 ${version} 已经存在于插件市场，跳过发布。`);
      process.exit(0);
    }

    console.log(`版本 ${version} 未发布，开始发布流程...`);
    
    // 执行发布命令
    const { stdout, stderr } = await execAsync('npm run deploy');
    console.log('发布输出:', stdout);
    if (stderr) console.error('发布错误:', stderr);
    
    console.log(`版本 ${version} 发布成功！`);
    // 写入 GitHub Actions outputs
    fs.writeFileSync(process.env.GITHUB_OUTPUT || '', 'customPublished=true\n', { flag: 'a' });
  } catch (error) {
    console.error('发布过程中出现错误:', error);
    process.exit(1);
  }
}

main();