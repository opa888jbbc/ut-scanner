// js/registry.js — Exercises registry (Stage 3 modular refactor, 2026-06-07 EDT).
// Loaded FIRST, before the per-EX modules and core.js, so each ex0X.js can self-register at load
// time and core.js's init (which runs last) sees a fully-populated registry. Each EX registers
// metadata + render/signal/desc hooks; core's drawScan()/drawAscan()/setExercise() consult this
// table instead of hard-coded if-branches. See MODULAR_REFACTOR_PLAN.md.
var Exercises = (function(){
  var _map = {};
  return {
    register: function(id, def){ def.id = id; _map[id] = def; return def; },
    get:      function(id){ return _map[id] || null; },
    all:      function(){ return Object.keys(_map).map(function(k){ return _map[k]; }); },
    has:      function(id){ return Object.prototype.hasOwnProperty.call(_map, id); }
  };
})();
