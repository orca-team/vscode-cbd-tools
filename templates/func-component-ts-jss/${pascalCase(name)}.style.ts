import jssAutoPrefix from '@orca-fe/jss-plugin-auto-prefix';
import { createUseStyles } from '@orca-fe/simple-jss';

const prefix = '${paramCase(name)}';
export default createUseStyles(
  {
    root: {
      position: 'relative',
    },
  },
  {
    classNamePrefix: prefix,
    plugins: [
      jssAutoPrefix({
        prefix,
      }),
    ],
  },
)
