/* eslint-disable @typescript-eslint/no-explicit-any */
import * as path from 'path';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as changeCase from 'change-case';

export const ERROR_CODES = {
  EXISTS: 'EXISTS',
};

const cwd = process.cwd();

const TEMPLATE_ROOT = path.resolve(__dirname, '../../templates');

// 保留文件（不参与模板生成）
const RESERVED_FILES = ['meta.json'];

export type TemplateType = 'component' | 'page';

/**
 * 根据目录路径，推断应该创建的模板类型
 * @param path 目录路径
 * @returns 类型
 */
export function getTypeByPath(path: string): TemplateType {
  const srcIndex = path.indexOf('/src/');
  if (srcIndex >= 0) {
    const lastPath = path.slice(srcIndex);
    if (lastPath.includes('/components/') || lastPath.endsWith('/components')) {
      /* 包含components的路径一定是组件目录 */
      return 'component';
    }
    if (lastPath.includes('/pages/') || lastPath.endsWith('/pages')) {
      /* 除此之外，认为pages下的是页面 */
      return 'page';
    }
    return 'component';
  }
  return 'component';
}


/**
 * 检查某个目录是否是模板目录，必须包含 meta.json 文件
 * @param dir 目录路径
 */
function checkIsTemplate(dir: string) {
  return fs.existsSync(path.resolve(dir, 'meta.json'));
}

type TemplateFileType = {
  filename: string;
  content: string;
};

/**
 * 扫描模板目录，并返回模板的所有内容
 * @param templateName 模板名称
 * @returns
 */
export function getTemplateFiles(templateName: string) {
  const templatePath = path.resolve(TEMPLATE_ROOT, templateName);
  if (!checkIsTemplate(templatePath)) {
    console.error('模板不存在');
    return null;
  }

  const reservedFiles = new Set(RESERVED_FILES);

  // 扫描所有文件
  const files: Array<TemplateFileType> = [];
  const walk = (dir: string) => {
    const dirents = fs.readdirSync(dir, { withFileTypes: true });
    for (const dirent of dirents) {
      const res = path.resolve(dir, dirent.name);
      if (dirent.isDirectory()) {
        walk(res);
      } else {
        files.push({
          filename: path.relative(templatePath, res),
          content: fs.readFileSync(res, 'utf-8'),
        });
      }
    }
  };
  walk(templatePath);
  return files.filter(f => !reservedFiles.has(f.filename));
}

export interface TemplateConfig {

  /** 模板名称 */
  name: string;

  /** 模板描述 */
  description?: string;

  /** 模板类型 */
  type: TemplateType;

  /** 排序 */
  order?: number;

  /** 模板文件列表 */
  files: Array<TemplateFileType>;
}

/**
 * 扫描所有模板
 */
function scanTemplates() {
  const templates = fs.readdirSync(TEMPLATE_ROOT);
  const result: TemplateConfig[] = [];
  for (const templateName of templates) {
    try {
      const templatePath = path.resolve(TEMPLATE_ROOT, templateName);
      if (!checkIsTemplate(templatePath)) {
        continue;
      }
      const meta = JSON.parse(fs.readFileSync(path.resolve(templatePath, 'meta.json'), 'utf-8'));
      result.push({
        name: templateName,
        description: meta.description,
        type: meta.type,
        order: meta.order,
        files: getTemplateFiles(templateName) || [],
      });
    } catch (error) {
      /* 跳过处理出错的模板 */
      console.error(`处理模板 ${templateName} 时发生错误:`, error);
    }
  }

  return result;
}

const defaultTemplateList = scanTemplates();

/**
 * 根据当前路径，给出合适的 template 排序
 * @param path 当前需要创建模板的路径
 * @param templateList 模板列表
 * @returns 排序后的模板
 */
export function getSuggestListByPath(path: string, templateList = defaultTemplateList) {
  const type = getTypeByPath(path);
  console.log('currentPath', path, type);

  return templateList.slice().sort((a, b) => {
    // 如果类型匹配，order 值增加 100 作为置顶
    const oa = (a.order ?? 0) + (a.type === type ? 100 : 0);
    const ob = (b.order ?? 0) + (b.type === type ? 100 : 0);
    return ob - oa;
  });
}


/**
 * 翻译模板内容，插入变量等
 */
const executeTemplateContent = (functionBody: string, args: Record<string, any>) => {
  const functionString = `
      let [option, changeCase] = arguments;
      let name = option.name;
      let {camelCase, paramCase, capitalCase, pascalCase, snakeCase, dotCase, headerCase, pathCase, constantCase, noCase, sentenceCase} = changeCase;
      return \`${functionBody.replace(/`/g, '\\`')}\`;`;
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const templateExecutor = new Function(functionString);
  return templateExecutor(args, changeCase);
};

export interface CreateTemplateOptions {

  /** 需要创建的内容的名称（一般为目录名称） */
  name?: string;

  /** 是否强制创建目录 */
  dir?: boolean;

  /** 出现文件冲突时，是否强制覆盖 */
  f?: boolean;
}

/**
 * 在指定目录根据模板创建
 * @param {string} dir 创建模板的根目录
 * @param {string} templateName 模板类型
 * @param {Object} options 其它选项
 */
export const createTemplate = async (_dir = cwd, templateName = '', options: CreateTemplateOptions = {}) => {
  let dir = _dir;
  const { name: baseName } = path.parse(dir);
  const { name = baseName, dir: useAdditionalDirectory, f: forceCreate } = options;

  /**
   * 是否额外创建一层目录，如果没有指定值(true/false)，则根据 name 与当前目录名称是否一致来决定
   * 如果与目录名称一致，视为不创建目录，否则创建目录
   */
  if (useAdditionalDirectory === true) {
    dir = path.join(name);
  } else if (useAdditionalDirectory !== false && name != null && name !== baseName) {
    dir = path.join(name);
  }

  const templateFiles = getTemplateFiles(templateName) || [];

  // 对模板内容进行翻译
  const transformedTemplateFiles = templateFiles.map(({ filename, content, ...other }) => {
    const newFilename = executeTemplateContent(filename, { ...options, name });
    const newContent = executeTemplateContent(content, { ...options, name });
    return { ...other, filename: newFilename, content: newContent };
  });

  const exists = transformedTemplateFiles.find(({ filename }) => fs.existsSync(path.resolve(dir, filename)));
  console.log(transformedTemplateFiles, exists);
  if (exists && !forceCreate) {
    console.error('目录中存在同名文件，无法生成');
    return {
      success: false,
      code: ERROR_CODES.EXISTS,
      message: '目录中存在同名文件，未做覆盖',
    };
  }
  mkdirp.sync(dir);
  transformedTemplateFiles.forEach(({ filename, content }) => {
    const filePath = path.resolve(dir, filename);
    console.log('Create file:', filePath);
    mkdirp.sync(path.dirname(filePath));
    fs.writeFileSync(filePath, content);
  });
  console.log('Done');
  return {
    success: true,
    message: '',
    code: '',
  };
};
