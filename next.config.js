"use strict";

var _bundleAnalyzer = _interopRequireDefault(require("@next/bundle-analyzer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('./src/dev-utils').populateEnv();

const paths = {
  universe: `${__dirname}/src/`,
  multiverse: `${__dirname}/lib/`
};

module.exports = () => {
  return (0, _bundleAnalyzer.default)({
    enabled: process.env.ANALYZE === 'true'
  })({
    distDir: 'build',
    webpack: config => {
      config.resolve && (config.resolve.alias = { ...config.resolve.alias,
        universe: paths.universe,
        multiverse: paths.multiverse
      });
      return config;
    },
    env: {
      MAX_LIMIT: process.env.MAX_LIMIT,
      LIMIT_OVERRIDE: process.env.LIMIT_OVERRIDE,
      DISABLE_RATE_LIMITS: process.env.DISABLE_RATE_LIMITS,
      LOCKOUT_ALL_KEYS: process.env.LOCKOUT_ALL_KEYS,
      DISALLOW_WRITES: process.env.DISALLOW_WRITES,
      REQUESTS_PER_CONTRIVED_ERROR: process.env.REQUESTS_PER_CONTRIVED_ERROR,
      MAX_OPTIONS_PER_ELECTION: process.env.MAX_OPTIONS_PER_ELECTION,
      MAX_RANKINGS_PER_ELECTION: process.env.MAX_RANKINGS_PER_ELECTION,
      MAX_CONTENT_LENGTH_BYTES: process.env.MAX_CONTENT_LENGTH_BYTES
    }
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbmZpZy9uZXh0LmNvbmZpZy50cyJdLCJuYW1lcyI6WyJyZXF1aXJlIiwicG9wdWxhdGVFbnYiLCJwYXRocyIsInVuaXZlcnNlIiwiX19kaXJuYW1lIiwibXVsdGl2ZXJzZSIsIm1vZHVsZSIsImV4cG9ydHMiLCJlbmFibGVkIiwicHJvY2VzcyIsImVudiIsIkFOQUxZWkUiLCJkaXN0RGlyIiwid2VicGFjayIsImNvbmZpZyIsInJlc29sdmUiLCJhbGlhcyIsIk1BWF9MSU1JVCIsIkxJTUlUX09WRVJSSURFIiwiRElTQUJMRV9SQVRFX0xJTUlUUyIsIkxPQ0tPVVRfQUxMX0tFWVMiLCJESVNBTExPV19XUklURVMiLCJSRVFVRVNUU19QRVJfQ09OVFJJVkVEX0VSUk9SIiwiTUFYX09QVElPTlNfUEVSX0VMRUNUSU9OIiwiTUFYX1JBTktJTkdTX1BFUl9FTEVDVElPTiIsIk1BWF9DT05URU5UX0xFTkdUSF9CWVRFUyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7OztBQU9BQSxPQUFPLENBQUMsaUJBQUQsQ0FBUCxDQUEyQkMsV0FBM0I7O0FBRUEsTUFBTUMsS0FBSyxHQUFHO0FBQ1ZDLEVBQUFBLFFBQVEsRUFBRyxHQUFFQyxTQUFVLE9BRGI7QUFFVkMsRUFBQUEsVUFBVSxFQUFHLEdBQUVELFNBQVU7QUFGZixDQUFkOztBQUtBRSxNQUFNLENBQUNDLE9BQVAsR0FBaUIsTUFBYztBQUMzQixTQUFPLDZCQUFtQjtBQUN0QkMsSUFBQUEsT0FBTyxFQUFFQyxPQUFPLENBQUNDLEdBQVIsQ0FBWUMsT0FBWixLQUF3QjtBQURYLEdBQW5CLEVBRUo7QUFFQ0MsSUFBQUEsT0FBTyxFQUFFLE9BRlY7QUFPQ0MsSUFBQUEsT0FBTyxFQUFHQyxNQUFELElBQTJCO0FBSWhDQSxNQUFBQSxNQUFNLENBQUNDLE9BQVAsS0FBbUJELE1BQU0sQ0FBQ0MsT0FBUCxDQUFlQyxLQUFmLEdBQXVCLEVBQ3RDLEdBQUdGLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlQyxLQURvQjtBQUV0Q2IsUUFBQUEsUUFBUSxFQUFFRCxLQUFLLENBQUNDLFFBRnNCO0FBR3RDRSxRQUFBQSxVQUFVLEVBQUVILEtBQUssQ0FBQ0c7QUFIb0IsT0FBMUM7QUFNQSxhQUFPUyxNQUFQO0FBQ0gsS0FsQkY7QUF1QkNKLElBQUFBLEdBQUcsRUFBRTtBQUNETyxNQUFBQSxTQUFTLEVBQUVSLE9BQU8sQ0FBQ0MsR0FBUixDQUFZTyxTQUR0QjtBQUVEQyxNQUFBQSxjQUFjLEVBQUVULE9BQU8sQ0FBQ0MsR0FBUixDQUFZUSxjQUYzQjtBQUdEQyxNQUFBQSxtQkFBbUIsRUFBRVYsT0FBTyxDQUFDQyxHQUFSLENBQVlTLG1CQUhoQztBQUlEQyxNQUFBQSxnQkFBZ0IsRUFBRVgsT0FBTyxDQUFDQyxHQUFSLENBQVlVLGdCQUo3QjtBQUtEQyxNQUFBQSxlQUFlLEVBQUVaLE9BQU8sQ0FBQ0MsR0FBUixDQUFZVyxlQUw1QjtBQU1EQyxNQUFBQSw0QkFBNEIsRUFBRWIsT0FBTyxDQUFDQyxHQUFSLENBQVlZLDRCQU56QztBQU9EQyxNQUFBQSx3QkFBd0IsRUFBRWQsT0FBTyxDQUFDQyxHQUFSLENBQVlhLHdCQVByQztBQVFEQyxNQUFBQSx5QkFBeUIsRUFBRWYsT0FBTyxDQUFDQyxHQUFSLENBQVljLHlCQVJ0QztBQVNEQyxNQUFBQSx3QkFBd0IsRUFBRWhCLE9BQU8sQ0FBQ0MsR0FBUixDQUFZZTtBQVRyQztBQXZCTixHQUZJLENBQVA7QUFxQ0gsQ0F0Q0QiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgd2l0aEJ1bmRsZUFuYWx5emVyIGZyb20gJ0BuZXh0L2J1bmRsZS1hbmFseXplcidcblxuaW1wb3J0IHR5cGUgeyBDb25maWd1cmF0aW9uIH0gZnJvbSAnd2VicGFjaydcblxuLy8gPyBOb3QgdXNpbmcgRVM2L1RTIGltcG9ydCBzeW50YXggaGVyZSBiZWNhdXNlIGRldi11dGlscyBoYXMgc3BlY2lhbFxuLy8gPyBjaXJjdW1zdGFuY2VzXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L25vLXVucmVzb2x2ZWQsIEB0eXBlc2NyaXB0LWVzbGludC9uby12YXItcmVxdWlyZXNcbnJlcXVpcmUoJy4vc3JjL2Rldi11dGlscycpLnBvcHVsYXRlRW52KCk7XG5cbmNvbnN0IHBhdGhzID0ge1xuICAgIHVuaXZlcnNlOiBgJHtfX2Rpcm5hbWV9L3NyYy9gLFxuICAgIG11bHRpdmVyc2U6IGAke19fZGlybmFtZX0vbGliL2AsXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9ICgpOiBvYmplY3QgPT4ge1xuICAgIHJldHVybiB3aXRoQnVuZGxlQW5hbHl6ZXIoe1xuICAgICAgICBlbmFibGVkOiBwcm9jZXNzLmVudi5BTkFMWVpFID09PSAndHJ1ZSdcbiAgICB9KSh7XG4gICAgICAgIC8vID8gUmVuYW1lcyB0aGUgYnVpbGQgZGlyIFwiYnVpbGRcIiBpbnN0ZWFkIG9mIFwiLm5leHRcIlxuICAgICAgICBkaXN0RGlyOiAnYnVpbGQnLFxuXG4gICAgICAgIC8vID8gV2VicGFjayBjb25maWd1cmF0aW9uXG4gICAgICAgIC8vICEgTm90ZSB0aGF0IHRoZSB3ZWJwYWNrIGNvbmZpZ3VyYXRpb24gaXMgZXhlY3V0ZWQgdHdpY2U6IG9uY2VcbiAgICAgICAgLy8gISBzZXJ2ZXItc2lkZSBhbmQgb25jZSBjbGllbnQtc2lkZSFcbiAgICAgICAgd2VicGFjazogKGNvbmZpZzogQ29uZmlndXJhdGlvbikgPT4ge1xuICAgICAgICAgICAgLy8gPyBUaGVzZSBhcmUgYWxpYXNlcyB0aGF0IGNhbiBiZSB1c2VkIGR1cmluZyBKUyBpbXBvcnQgY2FsbHNcbiAgICAgICAgICAgIC8vICEgTm90ZSB0aGF0IHlvdSBtdXN0IGFsc28gY2hhbmdlIHRoZXNlIHNhbWUgYWxpYXNlcyBpbiB0c2NvbmZpZy5qc29uXG4gICAgICAgICAgICAvLyAhIE5vdGUgdGhhdCB5b3UgbXVzdCBhbHNvIGNoYW5nZSB0aGVzZSBzYW1lIGFsaWFzZXMgaW4gcGFja2FnZS5qc29uIChqZXN0KVxuICAgICAgICAgICAgY29uZmlnLnJlc29sdmUgJiYgKGNvbmZpZy5yZXNvbHZlLmFsaWFzID0ge1xuICAgICAgICAgICAgICAgIC4uLmNvbmZpZy5yZXNvbHZlLmFsaWFzLFxuICAgICAgICAgICAgICAgIHVuaXZlcnNlOiBwYXRocy51bml2ZXJzZSxcbiAgICAgICAgICAgICAgICBtdWx0aXZlcnNlOiBwYXRocy5tdWx0aXZlcnNlLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBjb25maWc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gPyBTZWxlY3Qgc29tZSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZGVmaW5lZCBpbiAuZW52IHRvIHB1c2ggdG8gdGhlXG4gICAgICAgIC8vID8gY2xpZW50LlxuICAgICAgICAvLyAhISBETyBOT1QgUFVUIEFOWSBTRUNSRVQgRU5WSVJPTk1FTlQgVkFSSUFCTEVTIEhFUkUgISFcbiAgICAgICAgZW52OiB7XG4gICAgICAgICAgICBNQVhfTElNSVQ6IHByb2Nlc3MuZW52Lk1BWF9MSU1JVCxcbiAgICAgICAgICAgIExJTUlUX09WRVJSSURFOiBwcm9jZXNzLmVudi5MSU1JVF9PVkVSUklERSxcbiAgICAgICAgICAgIERJU0FCTEVfUkFURV9MSU1JVFM6IHByb2Nlc3MuZW52LkRJU0FCTEVfUkFURV9MSU1JVFMsXG4gICAgICAgICAgICBMT0NLT1VUX0FMTF9LRVlTOiBwcm9jZXNzLmVudi5MT0NLT1VUX0FMTF9LRVlTLFxuICAgICAgICAgICAgRElTQUxMT1dfV1JJVEVTOiBwcm9jZXNzLmVudi5ESVNBTExPV19XUklURVMsXG4gICAgICAgICAgICBSRVFVRVNUU19QRVJfQ09OVFJJVkVEX0VSUk9SOiBwcm9jZXNzLmVudi5SRVFVRVNUU19QRVJfQ09OVFJJVkVEX0VSUk9SLFxuICAgICAgICAgICAgTUFYX09QVElPTlNfUEVSX0VMRUNUSU9OOiBwcm9jZXNzLmVudi5NQVhfT1BUSU9OU19QRVJfRUxFQ1RJT04sXG4gICAgICAgICAgICBNQVhfUkFOS0lOR1NfUEVSX0VMRUNUSU9OOiBwcm9jZXNzLmVudi5NQVhfUkFOS0lOR1NfUEVSX0VMRUNUSU9OLFxuICAgICAgICAgICAgTUFYX0NPTlRFTlRfTEVOR1RIX0JZVEVTOiBwcm9jZXNzLmVudi5NQVhfQ09OVEVOVF9MRU5HVEhfQllURVMsXG4gICAgICAgIH1cbiAgICB9KTtcbn07XG4iXX0=