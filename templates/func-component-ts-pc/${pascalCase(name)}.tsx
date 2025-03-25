import React from 'react';
import pc from 'prefix-classnames';
import './${pascalCase(name)}.less';

const px = pc('${paramCase(name)}');

export interface ${pascalCase(name)}Props extends
  Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {

}

const ${pascalCase(name)} = (props: ${pascalCase(name)}Props) => {
  const { className = '', ...otherProps } = props;
  return (
    <div className={`\${px('root')} \${className}`} {...otherProps}>

    </div>
  );
};

export default ${pascalCase(name)};
