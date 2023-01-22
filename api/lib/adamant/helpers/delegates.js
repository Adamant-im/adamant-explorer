'use strict';

const _ = require("underscore");

/**
 * Formats delegate's productivity
 * @param {Array} delegates
 * @returns {Array}
 */
function parseDelegates(delegates) {
  _.each(delegates, (d) => {
    d.productivity = Math.abs(parseFloat(d.productivity)) || 0.0;
  });

  return delegates;
}

/**
 * Get pagination from total count
 * @param {Number} totalCount
 * @param {Number} offset
 * @param {Number} limit
 * @returns {Object}
 */
function pagination(totalCount, offset, limit) {
  const pagination = {};
  pagination.currentPage = +offset / +limit + 1;

  let totalPages = +totalCount / +limit;
  if (totalPages < totalCount / +limit) {
    totalPages++;
  }

  if (pagination.currentPage > 1) {
    pagination.before = true;
    pagination.previousPage = pagination.currentPage - 1;
  }

  if (pagination.currentPage < totalPages) {
    pagination.more = true;
    pagination.nextPage = pagination.currentPage + 1;
  }

  return pagination;
}

module.exports = {
  parseDelegates,
  pagination,
};
