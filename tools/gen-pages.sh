#!/bin/bash

commit=$(git rev-parse HEAD)
date=$(date --utc)

cat << EOF > src/app/build-info.ts
export const WWDTASKS_BUILD_COMMIT="${commit}";
export const WWDTASKS_BUILD_DATE = "${date}";
EOF

ng build --prod --base-href "https://wipwd.github.io/tasks/" || exit 1
rm -fr tasks-dist/*.{js,html} || exit 1
cp -R dist/wwd-tasks/* tasks-dist/ || exit 1
cd tasks-dist || exit 1
git add *
git commit -m 'dist: new build' -s -S || exit 1
git push gh-rw master:master

