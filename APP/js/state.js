/*
 * MiCurriculum · the current CV data, kept in one place.
 *
 * The program starts with a copy of SAMPLE_DATA. The form changes the data
 * only through update(), and whoever listens (the sheet) is told after
 * every change. updateLook() does the same with the look (theme and
 * layout). replace() puts in other data and look at once (a copy
 * opened from a file, the data saved in the browser or the sample data).
 *
 * A guard (setGuard) can refuse a change of update(): the data goes back
 * to what it was and update() returns false. The program uses it for the
 * content limit of the sheet (fit.js). updateLook() and replace() are
 * never refused.
 *
 * Project:   MiCurriculum
 * Author:    Juan Bautista Galisteo Marqués (@juangalisteo)
 * License:   GPL-3.0-or-later (see LICENSE)
 * Copyright (C) 2026 Juan Bautista Galisteo Marqués.
 * This program is free software: you can redistribute it and/or modify it under the terms
 * of the GNU General Public License, version 3 or (at your option) any later version.
 */
"use strict";

/** Deep copy of plain data (texts, numbers, lists and objects). */
function cloneData(value) {
  return JSON.parse(JSON.stringify(value == null ? {} : value));
}

/* ---------- Rows of a list (contact, and later experience, courses…) ---------- */

/** Adds item at the end (or at index) and returns the position it got. */
function addRow(list, item, index) {
  var at = typeof index === "number" ? Math.max(0, Math.min(index, list.length)) : list.length;
  list.splice(at, 0, item);
  return at;
}

/** Removes the row at index. Returns false when there is no such row. */
function removeRow(list, index) {
  if (index < 0 || index >= list.length) return false;
  list.splice(index, 1);
  return true;
}

/**
 * Moves the row at index one place up (delta -1) or down (delta +1).
 * Returns the new position, or -1 when it cannot move (already first or last).
 */
function moveRow(list, index, delta) {
  var to = index + delta;
  if (index < 0 || index >= list.length || to < 0 || to >= list.length) return -1;
  var item = list.splice(index, 1)[0];
  list.splice(to, 0, item);
  return to;
}

/* ---------- The store ---------- */

/**
 * Creates the store with a copy of the starting data and look.
 * update(fn) lets fn change the data and then tells every listener.
 * It returns true when the change stays, false when the guard refused it
 * (then the data is as before and the listeners are told anyway, so the
 * sheet is painted back).
 */
function createStore(initialData, initialLook) {
  var store = {
    data: cloneData(initialData),
    look: cloneData(initialLook),
    listeners: [],
    guard: null
  };
  store.onChange = function (listener) {
    store.listeners.push(listener);
  };
  /** guard(data, look) is asked after every update(); false undoes the change. */
  store.setGuard = function (guard) {
    store.guard = typeof guard === "function" ? guard : null;
  };
  function notify() {
    for (var i = 0; i < store.listeners.length; i++) store.listeners[i](store.data, store.look);
  }
  store.update = function (change) {
    var previous = store.guard ? cloneData(store.data) : null;
    if (typeof change === "function") change(store.data);
    var accepted = !store.guard || store.guard(store.data, store.look) !== false;
    if (!accepted) store.data = previous;
    notify();
    return accepted;
  };
  store.updateLook = function (change) {
    if (typeof change === "function") change(store.look);
    notify();
  };
  store.replace = function (data, look) {
    store.data = cloneData(data);
    store.look = cloneData(look);
    notify();
  };
  return store;
}

/* The one store of the program, in the browser: a copy of the sample data. */
var STATE = typeof document !== "undefined" ? createStore(SAMPLE_DATA, DEFAULT_LOOK) : null;

if (typeof module !== "undefined") {
  module.exports = { cloneData: cloneData, addRow: addRow, removeRow: removeRow, moveRow: moveRow, createStore: createStore };
}
