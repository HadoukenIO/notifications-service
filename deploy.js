const { execSync } = require('child_process');

// staged directory to upload
const distLoc = './dist';

// CDN path/host and s3 vars
const cdnPath = '/services/openfin/notifications';
const cdnHost = 'cdn.openfin.co';
const cdnHostPath = cdnHost + cdnPath;
const s3Loc = 's3://' + cdnHostPath;

// deploy and CDN cache invalidate commands
const deployCmd = `aws s3 cp ${distLoc} ${s3Loc}/ --recursive`;
const invalidateCmd = `aws cloudfront create-invalidation --distribution-id E16N7NZUXTHZCF --paths ${cdnPath}/*`;

// run em
execSync(deployCmd, { stdio: [0,1,2]});
// execSync(invalidateCmd, { stdio: [0,1,2]});
