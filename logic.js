// logic.js — pure helpers shared by app and tests
(function (root) {
  function canDeleteTopLevelGroup(groups, activeGroupId) {
    if (!Array.isArray(groups) || groups.length === 0) return false;
    if (groups.length === 1 && groups[0]?.id === activeGroupId) return false;
    return true;
  }

  const api = { canDeleteTopLevelGroup };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.EthnoLogic = Object.assign({}, root.EthnoLogic || {}, api);
})(typeof window !== "undefined" ? window : globalThis);
