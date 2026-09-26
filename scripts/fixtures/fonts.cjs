// Used only by the offline production regression build.
module.exports = new Proxy({}, {
  get: () => "@font-face { font-family: 'Fixture'; src: local('Arial'); font-weight: 100 900; }",
});
