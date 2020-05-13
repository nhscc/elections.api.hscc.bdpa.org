/**
* !!! DO NOT EDIT THIS FILE DIRECTLY !!!
* ! This file has been generated automatically. See the config/*.js version of
* ! this file to make permanent modifications!
*/

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.regenerate = exports.checkEnv = exports.cleanTypes = void 0;

require("source-map-support/register");

var _fs = require("fs");

var _util = require("util");

var _devUtils = require("./src/dev-utils");

var _path = require("path");

var _core = require("@babel/core");

var _gulp = _interopRequireDefault(require("gulp"));

var _gulpTap = _interopRequireDefault(require("gulp-tap"));

var _del = _interopRequireDefault(require("del"));

var _fancyLog = _interopRequireDefault(require("fancy-log"));

var _parseGitignore = _interopRequireDefault(require("parse-gitignore"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const paths = {};
paths.flowTyped = 'flow-typed';
paths.flowTypedGitIgnore = `${paths.flowTyped}/.gitignore`;
paths.build = `build`;
paths.buildGitIgnore = `${paths.build}/.gitignore`;
paths.configs = 'config';
paths.packageJson = 'package.json';
paths.launchJson = '.vscode/launch.json';
paths.launchJsonDist = '.vscode/launch.dist.json';
paths.env = '.env';
paths.envDist = 'dist.env';
paths.gitProjectDir = '.git';
paths.gitIgnore = '.gitignore';
paths.packageLockJson = 'package-lock.json';
paths.regenTargets = [`${paths.configs}/*.js`];
const CLI_BANNER = `/**
* !!! DO NOT EDIT THIS FILE DIRECTLY !!!
* ! This file has been generated automatically. See the config/*.js version of
* ! this file to make permanent modifications!
*/\n\n`;
const readFileAsync = (0, _util.promisify)(_fs.readFile);

const cleanTypes = async () => {
  (0, _devUtils.populateEnv)();
  const targets = (0, _parseGitignore.default)(await readFileAsync(paths.flowTypedGitIgnore));
  (0, _fancyLog.default)(`Deletion targets @ ${paths.flowTyped}/: "${targets.join('" "')}"`);
  (0, _del.default)(targets, {
    cwd: paths.flowTyped
  });
};

exports.cleanTypes = cleanTypes;
cleanTypes.description = `Resets the ${paths.flowTyped} directory to a pristine state`;

const checkEnv = async () => (0, _devUtils.populateEnv)();

exports.checkEnv = checkEnv;
checkEnv.description = `Throws an error if any expected environment variables are not properly set ` + `(see expectedEnvVariables key in package.json)`;

const regenerate = () => {
  (0, _devUtils.populateEnv)();
  (0, _fancyLog.default)(`Regenerating targets: "${paths.regenTargets.join('" "')}"`);
  process.env.BABEL_ENV = 'generator';
  return _gulp.default.src(paths.regenTargets).pipe((0, _gulpTap.default)(file => file.contents = Buffer.from(CLI_BANNER + (0, _core.transformSync)(file.contents.toString(), {
    sourceFileName: (0, _path.relative)(__dirname, file.path)
  }).code))).pipe(_gulp.default.dest('.'));
};

exports.regenerate = regenerate;
regenerate.description = 'Invokes babel on the files in config, transpiling them into their project root versions';
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbmZpZy9ndWxwZmlsZS5qcyJdLCJuYW1lcyI6WyJwYXRocyIsImZsb3dUeXBlZCIsImZsb3dUeXBlZEdpdElnbm9yZSIsImJ1aWxkIiwiYnVpbGRHaXRJZ25vcmUiLCJjb25maWdzIiwicGFja2FnZUpzb24iLCJsYXVuY2hKc29uIiwibGF1bmNoSnNvbkRpc3QiLCJlbnYiLCJlbnZEaXN0IiwiZ2l0UHJvamVjdERpciIsImdpdElnbm9yZSIsInBhY2thZ2VMb2NrSnNvbiIsInJlZ2VuVGFyZ2V0cyIsIkNMSV9CQU5ORVIiLCJyZWFkRmlsZUFzeW5jIiwicmVhZEZpbGUiLCJjbGVhblR5cGVzIiwidGFyZ2V0cyIsImpvaW4iLCJjd2QiLCJkZXNjcmlwdGlvbiIsImNoZWNrRW52IiwicmVnZW5lcmF0ZSIsInByb2Nlc3MiLCJCQUJFTF9FTlYiLCJndWxwIiwic3JjIiwicGlwZSIsImZpbGUiLCJjb250ZW50cyIsIkJ1ZmZlciIsImZyb20iLCJ0b1N0cmluZyIsInNvdXJjZUZpbGVOYW1lIiwiX19kaXJuYW1lIiwicGF0aCIsImNvZGUiLCJkZXN0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFTQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUVBLE1BQU1BLEtBQUssR0FBRyxFQUFkO0FBRUFBLEtBQUssQ0FBQ0MsU0FBTixHQUFrQixZQUFsQjtBQUNBRCxLQUFLLENBQUNFLGtCQUFOLEdBQTRCLEdBQUVGLEtBQUssQ0FBQ0MsU0FBVSxhQUE5QztBQUNBRCxLQUFLLENBQUNHLEtBQU4sR0FBZSxPQUFmO0FBQ0FILEtBQUssQ0FBQ0ksY0FBTixHQUF3QixHQUFFSixLQUFLLENBQUNHLEtBQU0sYUFBdEM7QUFDQUgsS0FBSyxDQUFDSyxPQUFOLEdBQWdCLFFBQWhCO0FBQ0FMLEtBQUssQ0FBQ00sV0FBTixHQUFvQixjQUFwQjtBQUNBTixLQUFLLENBQUNPLFVBQU4sR0FBbUIscUJBQW5CO0FBQ0FQLEtBQUssQ0FBQ1EsY0FBTixHQUF1QiwwQkFBdkI7QUFDQVIsS0FBSyxDQUFDUyxHQUFOLEdBQVksTUFBWjtBQUNBVCxLQUFLLENBQUNVLE9BQU4sR0FBZ0IsVUFBaEI7QUFDQVYsS0FBSyxDQUFDVyxhQUFOLEdBQXNCLE1BQXRCO0FBQ0FYLEtBQUssQ0FBQ1ksU0FBTixHQUFrQixZQUFsQjtBQUNBWixLQUFLLENBQUNhLGVBQU4sR0FBd0IsbUJBQXhCO0FBRUFiLEtBQUssQ0FBQ2MsWUFBTixHQUFxQixDQUNoQixHQUFFZCxLQUFLLENBQUNLLE9BQVEsT0FEQSxDQUFyQjtBQUlBLE1BQU1VLFVBQVUsR0FBSTs7OztPQUFwQjtBQU1BLE1BQU1DLGFBQWEsR0FBRyxxQkFBVUMsWUFBVixDQUF0Qjs7QUFJTyxNQUFNQyxVQUFVLEdBQUcsWUFBWTtBQUNsQztBQUVBLFFBQU1DLE9BQU8sR0FBRyw2QkFBZSxNQUFNSCxhQUFhLENBQUNoQixLQUFLLENBQUNFLGtCQUFQLENBQWxDLENBQWhCO0FBRUEseUJBQUssc0JBQXFCRixLQUFLLENBQUNDLFNBQVUsT0FBTWtCLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLEtBQWIsQ0FBb0IsR0FBcEU7QUFDQSxvQkFBSUQsT0FBSixFQUFhO0FBQUVFLElBQUFBLEdBQUcsRUFBRXJCLEtBQUssQ0FBQ0M7QUFBYixHQUFiO0FBQ0gsQ0FQTTs7O0FBU1BpQixVQUFVLENBQUNJLFdBQVgsR0FBMEIsY0FBYXRCLEtBQUssQ0FBQ0MsU0FBVSxnQ0FBdkQ7O0FBSU8sTUFBTXNCLFFBQVEsR0FBRyxZQUFZLDRCQUE3Qjs7O0FBRVBBLFFBQVEsQ0FBQ0QsV0FBVCxHQUF3Qiw2RUFBRCxHQUNoQixnREFEUDs7QUFTTyxNQUFNRSxVQUFVLEdBQUcsTUFBTTtBQUM1QjtBQUVBLHlCQUFLLDBCQUF5QnhCLEtBQUssQ0FBQ2MsWUFBTixDQUFtQk0sSUFBbkIsQ0FBd0IsS0FBeEIsQ0FBK0IsR0FBN0Q7QUFFQUssRUFBQUEsT0FBTyxDQUFDaEIsR0FBUixDQUFZaUIsU0FBWixHQUF3QixXQUF4QjtBQUVBLFNBQU9DLGNBQUtDLEdBQUwsQ0FBUzVCLEtBQUssQ0FBQ2MsWUFBZixFQUNLZSxJQURMLENBQ1Usc0JBQUlDLElBQUksSUFBSUEsSUFBSSxDQUFDQyxRQUFMLEdBQWdCQyxNQUFNLENBQUNDLElBQVAsQ0FBWWxCLFVBQVUsR0FBRyx5QkFBTWUsSUFBSSxDQUFDQyxRQUFMLENBQWNHLFFBQWQsRUFBTixFQUFnQztBQUN2RkMsSUFBQUEsY0FBYyxFQUFFLG9CQUFRQyxTQUFSLEVBQW1CTixJQUFJLENBQUNPLElBQXhCO0FBRHVFLEdBQWhDLEVBRXhEQyxJQUYrQixDQUE1QixDQURWLEVBSUtULElBSkwsQ0FJVUYsY0FBS1ksSUFBTCxDQUFVLEdBQVYsQ0FKVixDQUFQO0FBS0gsQ0FaTTs7O0FBY1BmLFVBQVUsQ0FBQ0YsV0FBWCxHQUF5Qix5RkFBekIiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG4vLyA/IFRvIHJlZ2VuZXJhdGUgdGhpcyBmaWxlIChpLmUuIGlmIHlvdSBjaGFuZ2VkIGl0IGFuZCB3YW50IHlvdXIgY2hhbmdlcyB0b1xuLy8gPyBiZSBwZXJtYW5lbnQpLCBjYWxsIGBucG0gcnVuIHJlZ2VuZXJhdGVgIGFmdGVyd2FyZHNcblxuLy8gISBCZSBzdXJlIHRoYXQgdGFza3MgZXhwZWN0ZWQgdG8gcnVuIG9uIG5wbSBpbnN0YWxsIChtYXJrZWQgQGRlcGVuZGVudCkgaGF2ZVxuLy8gISBhbGwgcmVxdWlyZWQgcGFja2FnZXMgbGlzdGVkIHVuZGVyIFwiZGVwZW5kZW5jaWVzXCIgaW5zdGVhZCBvZlxuLy8gISBcImRldkRlcGVuZGVuY2llc1wiIGluIHRoaXMgcHJvamVjdCdzIHBhY2thZ2UuanNvblxuXG5pbXBvcnQgeyByZWFkRmlsZSB9IGZyb20gJ2ZzJ1xuaW1wb3J0IHsgcHJvbWlzaWZ5IH0gZnJvbSAndXRpbCdcbmltcG9ydCB7IHBvcHVsYXRlRW52IH0gZnJvbSAnLi9zcmMvZGV2LXV0aWxzJ1xuaW1wb3J0IHsgcmVsYXRpdmUgYXMgcmVsUGF0aCB9IGZyb20gJ3BhdGgnXG5pbXBvcnQgeyB0cmFuc2Zvcm1TeW5jIGFzIGJhYmVsIH0gZnJvbSAnQGJhYmVsL2NvcmUnXG5pbXBvcnQgZ3VscCBmcm9tICdndWxwJ1xuaW1wb3J0IHRhcCBmcm9tICdndWxwLXRhcCdcbmltcG9ydCBkZWwgZnJvbSAnZGVsJ1xuaW1wb3J0IGxvZyBmcm9tICdmYW5jeS1sb2cnXG5pbXBvcnQgcGFyc2VHaXRJZ25vcmUgZnJvbSAncGFyc2UtZ2l0aWdub3JlJ1xuXG5jb25zdCBwYXRocyA9IHt9O1xuXG5wYXRocy5mbG93VHlwZWQgPSAnZmxvdy10eXBlZCc7XG5wYXRocy5mbG93VHlwZWRHaXRJZ25vcmUgPSBgJHtwYXRocy5mbG93VHlwZWR9Ly5naXRpZ25vcmVgO1xucGF0aHMuYnVpbGQgPSBgYnVpbGRgO1xucGF0aHMuYnVpbGRHaXRJZ25vcmUgPSBgJHtwYXRocy5idWlsZH0vLmdpdGlnbm9yZWA7XG5wYXRocy5jb25maWdzID0gJ2NvbmZpZyc7XG5wYXRocy5wYWNrYWdlSnNvbiA9ICdwYWNrYWdlLmpzb24nO1xucGF0aHMubGF1bmNoSnNvbiA9ICcudnNjb2RlL2xhdW5jaC5qc29uJztcbnBhdGhzLmxhdW5jaEpzb25EaXN0ID0gJy52c2NvZGUvbGF1bmNoLmRpc3QuanNvbic7XG5wYXRocy5lbnYgPSAnLmVudic7XG5wYXRocy5lbnZEaXN0ID0gJ2Rpc3QuZW52JztcbnBhdGhzLmdpdFByb2plY3REaXIgPSAnLmdpdCc7XG5wYXRocy5naXRJZ25vcmUgPSAnLmdpdGlnbm9yZSc7XG5wYXRocy5wYWNrYWdlTG9ja0pzb24gPSAncGFja2FnZS1sb2NrLmpzb24nO1xuXG5wYXRocy5yZWdlblRhcmdldHMgPSBbXG4gICAgYCR7cGF0aHMuY29uZmlnc30vKi5qc2Bcbl07XG5cbmNvbnN0IENMSV9CQU5ORVIgPSBgLyoqXG4qICEhISBETyBOT1QgRURJVCBUSElTIEZJTEUgRElSRUNUTFkgISEhXG4qICEgVGhpcyBmaWxlIGhhcyBiZWVuIGdlbmVyYXRlZCBhdXRvbWF0aWNhbGx5LiBTZWUgdGhlIGNvbmZpZy8qLmpzIHZlcnNpb24gb2ZcbiogISB0aGlzIGZpbGUgdG8gbWFrZSBwZXJtYW5lbnQgbW9kaWZpY2F0aW9ucyFcbiovXFxuXFxuYDtcblxuY29uc3QgcmVhZEZpbGVBc3luYyA9IHByb21pc2lmeShyZWFkRmlsZSk7XG5cbi8vICogQ0xFQU5UWVBFU1xuXG5leHBvcnQgY29uc3QgY2xlYW5UeXBlcyA9IGFzeW5jICgpID0+IHtcbiAgICBwb3B1bGF0ZUVudigpO1xuXG4gICAgY29uc3QgdGFyZ2V0cyA9IHBhcnNlR2l0SWdub3JlKGF3YWl0IHJlYWRGaWxlQXN5bmMocGF0aHMuZmxvd1R5cGVkR2l0SWdub3JlKSk7XG5cbiAgICBsb2coYERlbGV0aW9uIHRhcmdldHMgQCAke3BhdGhzLmZsb3dUeXBlZH0vOiBcIiR7dGFyZ2V0cy5qb2luKCdcIiBcIicpfVwiYCk7XG4gICAgZGVsKHRhcmdldHMsIHsgY3dkOiBwYXRocy5mbG93VHlwZWQgfSk7XG59O1xuXG5jbGVhblR5cGVzLmRlc2NyaXB0aW9uID0gYFJlc2V0cyB0aGUgJHtwYXRocy5mbG93VHlwZWR9IGRpcmVjdG9yeSB0byBhIHByaXN0aW5lIHN0YXRlYDtcblxuLy8gKiBDSEVDS0VOVlxuXG5leHBvcnQgY29uc3QgY2hlY2tFbnYgPSBhc3luYyAoKSA9PiBwb3B1bGF0ZUVudigpO1xuXG5jaGVja0Vudi5kZXNjcmlwdGlvbiA9IGBUaHJvd3MgYW4gZXJyb3IgaWYgYW55IGV4cGVjdGVkIGVudmlyb25tZW50IHZhcmlhYmxlcyBhcmUgbm90IHByb3Blcmx5IHNldCBgXG4gICAgKyBgKHNlZSBleHBlY3RlZEVudlZhcmlhYmxlcyBrZXkgaW4gcGFja2FnZS5qc29uKWA7XG5cbi8vICogUkVHRU5FUkFURVxuXG4vLyA/IElmIHlvdSBjaGFuZ2UgdGhpcyBmdW5jdGlvbiwgcnVuIGBucG0gcnVuIHJlZ2VuZXJhdGVgIHR3aWNlOiBvbmNlIHRvXG4vLyA/IGNvbXBpbGUgdGhpcyBuZXcgZnVuY3Rpb24gYW5kIG9uY2UgYWdhaW4gdG8gY29tcGlsZSBpdHNlbGYgd2l0aCB0aGUgbmV3bHlcbi8vID8gY29tcGlsZWQgbG9naWMuIElmIHRoZXJlIGlzIGFuIGVycm9yIHRoYXQgcHJldmVudHMgcmVnZW5lcmF0aW9uLCB5b3UgY2FuXG4vLyA/IHJ1biBgbnBtIHJ1biBnZW5lcmF0ZWAgdGhlbiBgbnBtIHJ1biByZWdlbmVyYXRlYCBpbnN0ZWFkLlxuZXhwb3J0IGNvbnN0IHJlZ2VuZXJhdGUgPSAoKSA9PiB7XG4gICAgcG9wdWxhdGVFbnYoKTtcblxuICAgIGxvZyhgUmVnZW5lcmF0aW5nIHRhcmdldHM6IFwiJHtwYXRocy5yZWdlblRhcmdldHMuam9pbignXCIgXCInKX1cImApO1xuXG4gICAgcHJvY2Vzcy5lbnYuQkFCRUxfRU5WID0gJ2dlbmVyYXRvcic7XG5cbiAgICByZXR1cm4gZ3VscC5zcmMocGF0aHMucmVnZW5UYXJnZXRzKVxuICAgICAgICAgICAgICAgLnBpcGUodGFwKGZpbGUgPT4gZmlsZS5jb250ZW50cyA9IEJ1ZmZlci5mcm9tKENMSV9CQU5ORVIgKyBiYWJlbChmaWxlLmNvbnRlbnRzLnRvU3RyaW5nKCksIHtcbiAgICAgICAgICAgICAgICAgICBzb3VyY2VGaWxlTmFtZTogcmVsUGF0aChfX2Rpcm5hbWUsIGZpbGUucGF0aClcbiAgICAgICAgICAgICAgIH0pLmNvZGUpKSlcbiAgICAgICAgICAgICAgIC5waXBlKGd1bHAuZGVzdCgnLicpKTtcbn07XG5cbnJlZ2VuZXJhdGUuZGVzY3JpcHRpb24gPSAnSW52b2tlcyBiYWJlbCBvbiB0aGUgZmlsZXMgaW4gY29uZmlnLCB0cmFuc3BpbGluZyB0aGVtIGludG8gdGhlaXIgcHJvamVjdCByb290IHZlcnNpb25zJztcbiJdfQ==