/* eslint-disable @typescript-eslint/no-explicit-any */
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import {
  createTemplate,
  getSuggestListByPath,
  TemplateConfig,
  getTemplateFiles,
} from '../createTemplate/templateUtils';

// 默认自定义模板目录名称
const DEFAULT_CUSTOM_TEMPLATE_DIR = 'cbd-templates';
// 配置文件名称
const CONFIG_FILE_NAME = 'cbd-tools.json';

/**
 * 获取项目根目录
 * @param currentPath 当前路径
 * @returns 项目根目录路径
 */
function getProjectRoot(currentPath: string): string {
  // 首先尝试获取 VSCode 工作空间的根目录
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    return vscode.workspace.workspaceFolders[0].uri.fsPath;
  }

  // 如果没有工作空间，直接抛出异常
  throw new Error('未找到工作空间，请先打开一个项目文件夹');
}

/**
 * 获取自定义模板目录路径
 * @param projectRoot 项目根目录
 * @returns 自定义模板目录路径
 */
function getCustomTemplateDir(projectRoot: string): string {
  // 默认模板目录
  let customTemplateDir = DEFAULT_CUSTOM_TEMPLATE_DIR;

  // 尝试读取配置文件
  const configPath = path.join(projectRoot, CONFIG_FILE_NAME);
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.customTemplateDir) {
        // eslint-disable-next-line prefer-destructuring
        customTemplateDir = config.customTemplateDir;
      }
    } catch (error) {
      console.error('读取配置文件失败:', error);
    }
  }

  return path.join(projectRoot, customTemplateDir);
}

/**
 * 扫描自定义模板目录
 * @param customTemplateDir 自定义模板目录路径
 * @returns 模板配置列表
 */
export function scanCustomTemplates(customTemplateDir: string): TemplateConfig[] {
  if (!fs.existsSync(customTemplateDir)) {
    return [];
  }

  try {
    const templates = fs.readdirSync(customTemplateDir);
    const result: TemplateConfig[] = [];

    for (const templateName of templates) {
      try {
        const templatePath = path.join(customTemplateDir, templateName);
        const stat = fs.statSync(templatePath);

        if (!stat.isDirectory()) {
          continue;
        }

        const metaPath = path.join(templatePath, 'meta.json');
        if (!fs.existsSync(metaPath)) {
          continue;
        }

        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        // 使用与 templateUtils 相同的结构
        result.push({
          name: templateName,
          description: meta.description,
          type: meta.type || 'component', // 默认为 component 类型
          order: meta.order || 0,
          files: getTemplateFiles(templateName, customTemplateDir) || [],
        });
      } catch (error) {
        console.error(`处理自定义模板 ${templateName} 时发生错误:`, error);
      }
    }

    return result;
  } catch (error) {
    console.error('扫描自定义模板目录失败:', error);
    return [];
  }
}

/**
 * 创建自定义模板
 * @param currentPath 当前路径
 */
export async function createCustomTemplate(currentPath: string): Promise<void> {
  // 获取项目根目录
  const projectRoot = getProjectRoot(currentPath);
  if (!projectRoot) {
    throw new Error('无法确定项目根目录');
  }

  // 获取自定义模板目录
  const customTemplateDir = getCustomTemplateDir(projectRoot);
  if (!fs.existsSync(customTemplateDir)) {
    throw new Error(`自定义模板目录不存在: ${customTemplateDir}`);
  }

  // 扫描自定义模板
  const customTemplates = scanCustomTemplates(customTemplateDir);
  if (customTemplates.length === 0) {
    throw new Error(`未找到有效的自定义模板，请检查 ${customTemplateDir} 目录`);
  }

  const sortedTemplates = getSuggestListByPath(currentPath, customTemplates);

  // 选择模板
  const pickedTemplate = await vscode.window.showQuickPick(
    sortedTemplates.map(item => ({
      label: item.name,
      description: item.description,
      type: item.type,
      item,
    })),
    {
      placeHolder: '请选择自定义模板',
    }
  );

  if (!pickedTemplate) {
    return;
  }

  // 获取目标目录
  let targetDir = currentPath;
  try {
    const stat = fs.statSync(targetDir);
    if (!stat.isDirectory()) {
      targetDir = path.dirname(targetDir);
    }
  } catch (error) {
    throw new Error(`无效的目标路径: ${targetDir}`);
  }

  // 输入名称
  const name = await vscode.window.showInputBox({
    value: path.basename(targetDir),
    placeHolder: '请输入子目录名称，输入空则在当前目录创建',
  });

  if (name === undefined) {
    return;
  }

  // 使用通用的 createTemplate 方法创建模板
  // 注意：这里需要修改 templateUtils.ts 以支持自定义模板路径
  // 暂时使用 customTemplatePath 属性传递路径
  const templateName = pickedTemplate.item.name;

  const result = await createTemplate(targetDir, templateName, {
    name,
  });

  if (result.success) {
    vscode.window.showInformationMessage('创建成功');
  } else {
    vscode.window.showErrorMessage(result.message);
  }
}
