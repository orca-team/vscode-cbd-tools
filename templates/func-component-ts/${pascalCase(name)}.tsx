import React from 'react';
import styles from './${pascalCase(name)}.module.less';

export interface ${pascalCase(name)}Props extends
  Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {

}

const ${pascalCase(name)} = (props: ${pascalCase(name)}Props) => {
  const { className = '', ...otherProps } = props;
  return (
    <div className={`\${styles.root} \${className}`} {...otherProps}>

    </div>
  );
};

export default ${pascalCase(name)};
