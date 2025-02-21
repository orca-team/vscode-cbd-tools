export type TemplateType = 'component' | 'model' | 'page';

export type TemplateObject = {
  name: string;
  order?: number;
  type: TemplateType;
  description?: string;
};

// 预定义模板
export const templateDefine: Record<string, TemplateObject> = {
  'func-component-ts': { order: 10, type: 'component', description: '函数组件(TypeScript)', name: 'func-component-ts' },
  'page-ts': { order: 8, type: 'page', description: '页面(TypeScript)', name: 'page-ts' },
  'func-component-ts-with-ref': {
    order: 6,
    type: 'component',
    description: '函数组件 - 带ref(TypeScript)',
    name: 'func-component-ts-with-ref',
  },
  model: { order: 4, type: 'model', description: 'dva-model(TypeScript)', name: 'model' },
  'func-component-ts-no-modules': {
    order: 3,
    type: 'component',
    description: '函数组件(TypeScript/非css-modules)',
    name: 'func-component-ts-no-modules',
  },
  component: { order: 0, type: 'component', description: 'class组件(JavaScript)', name: 'component' },
  'func-component': { order: 0, type: 'component', description: '函数组件(JavaScript)', name: 'func-component' },
  page: { order: 0, type: 'page', description: '页面 - class组件(JavaScript)', name: 'page' },
};

export const defaultTemplateList: Array<TemplateObject> = [
  templateDefine['func-component-ts'],
  templateDefine['func-component-ts-with-ref'],
  templateDefine.model,
  templateDefine.component,
  templateDefine['func-component'],
  templateDefine.page,
];

/**
 * 根据目录路径，推断应该创建的模板类型
 * @param path 目录路径
 * @returns 类型
 */
export function getTypeByPath(path: string): TemplateType {
  const srcIndex = path.indexOf('/src/');
  if (srcIndex >= 0) {
    const lastPath = path.substr(srcIndex);
    if (lastPath.includes('/components/') || lastPath.endsWith('/components')) {
      /* 包含components的路径一定是组件目录 */
      return 'component';
    }
    if (lastPath.includes('/models/') || lastPath.endsWith('/models')) {
      /* 包含models的路径一定存放model */
      return 'model';
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
