import tree from '../index';
import path from 'path';

test('it can serialise a folder', () => {
  // this needs to be a folder that doesn't change during tests,
  // so can't include any .test.ts files that actually use this.
  // I picked one of our packages instead.
  expect(
    tree(path.join(__dirname, '../../../packages/create-modular-react-app')),
  ).toMatchInlineSnapshot(`
    "create-modular-react-app
    ├─ .npmignore #1rstiru
    ├─ CHANGELOG.md #1k5lnr5
    ├─ package.json #qef6lj
    ├─ src
    │  └─ cli.ts #cd0fl6
    └─ template
       ├─ README.md #1nksyzj
       ├─ gitignore #1ugsijf
       ├─ packages
       │  └─ README.md #14bthrh
       ├─ shared
       │  └─ README.md #1aqc5yw
       └─ tsconfig.json #1y19cv2"
  `);
});