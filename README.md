# CBD-Tools

`cbd-tools` 是一个为 vscode 开发的前端辅助工具。

## Features

### Feature 1 基于模板快速生成代码

在侧边栏【资源管理器】中右键文件夹，选择【使用 CBD 模板创建】，即可选择模板创建文件代码。

### Feature 2 自定义模板文件

#### 模版路径

默认情况下，自定义模板文件存放在 `cbd-templates` 目录下。  
如果需要更灵活地配置模板目录路径，可以在项目根目录下创建一份 `cbd-tools.json` 配置文件来指定当前项目的自定义模板目录路径。
| 配置项              | 功能                                 | 默认值          |
| ------------------- | ------------------------------------ | --------------- |
| `customTemplateDir` | 自定义模板目录路径，相对于项目根目录 | `cbd-templates` |

#### 模板文件规则

模板文件需要按照特定的结构组织，以便插件能够正确识别和使用。以下是模板文件的规则和示例：

1. **目录结构**：每个模板应该是一个独立的文件夹，包含所有需要生成的文件模板和一个 `meta.json` 配置文件。

2. **meta.json 配置文件**：每个模板目录必须包含一个 `meta.json` 文件，用于描述模板的基本信息，如：
   ```json
   {
     "type": "component",    // 模板类型
     "order": 10,            // 顺序权重，权重越大越靠前
     "description": "函数组件" // 模板描述
   }
   ```
3. **占位变量**：模板文件支持使用占位变量和表达式，使用 `${expression}` 格式：

   - 文件名可以使用占位变量：`${pascalCase(name)}.tsx`
   - 文件内容也可以使用占位变量：
     ```tsx
     import React from 'react';
     import styles from './${pascalCase(name)}.module.less';
     
     export interface ${pascalCase(name)}Props {
       // ...
     }
     ```

4. **支持的变量和函数**：
   - `name`：创建时指定的名称
   - 支持 [change-case](https://www.npmjs.com/package/change-case/v/4.1.2) 提供的各种命名格式转换函数：
     - `camelCase(name)`：驼峰命名，如 `myComponent`
     - `pascalCase(name)`：帕斯卡命名，如 `MyComponent`
     - `paramCase(name)`：短横线命名，如 `my-component`
     - `snakeCase(name)`：下划线命名，如 `my_component`
     - `constantCase(name)`：常量命名，如 `MY_COMPONENT`
     - `dotCase(name)`：点分隔命名，如 `my.component`
     - `headerCase(name)`：标题命名，如 `My-Component`
     - `pathCase(name)`：路径命名，如 `my/component`
     - `noCase(name)`：空格分隔命名，如 `my component`
     - `sentenceCase(name)`：句子命名，如 `My component`

5. **文件生成规则**：
   - 模板中的每个文件都会被处理，文件名和内容中的占位变量会被替换
   - 保留文件（如 `meta.json`）不会参与模板生成

### Feature 3 快速跳转

预设了 3 种快速跳转命令，可以快速跳转到同名的 CSS/LESS 等样式文件、JS/TS 等脚本文件、vue 文件。
注：默认快捷键设置的是二级快捷键，即先按下 `Ctrl+K`，再立刻按下 `Ctrl+J`。

| 命令 ID                       | 功能                                 | 默认快捷键              |
| ----------------------------- | ------------------------------------ | ----------------------- |
| `cbd-tools.quick-jump-to-css` | 快速跳转到同名的 CSS/LESS 等样式文件 | `Ctrl/Cmd+K Ctrl/Cmd+L` |
| `cbd-tools.quick-jump-to-js`  | 快速跳转到同名的 JS/TS 等脚本文件    | `Ctrl/Cmd+K Ctrl/Cmd+J` |
| `cbd-tools.quick-jump-to-vue` | 快速跳转到同名的 vue 文件            | -                       |
