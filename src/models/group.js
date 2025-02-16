const db = require("../db");
const { serverLog } = require("../helper");

const table = "groups";

/**
 * Groups module for interacting with the 'groups' table in the database.
 * Provides methods for counting, iterating, paginating, and bulk inserting/replacing groups.
 */
module.exports = {
  /**
   * Counts the total number of groups in the database.
   * @returns {number} The total number of groups.
   */
  count: () => {
    const stmt = db.prepare(`SELECT COUNT(groupId) AS total FROM ${table}`);
    const result = stmt.get();
    return result.total;
  },

  /**
   * Iterates over all groups in the database, ordered by group name in ascending order.
   * @returns {Iterator} An iterator for all groups in the database.
   */
  iterate: () => {
    const stmt = db.prepare(`SELECT * FROM ${table} ORDER BY groupName ASC`);
    const iterator = stmt.iterate();

    // Convert the iterator to an array
    const groups = [];
    for (const row of iterator) {
      groups.push(row);
    }

    return groups;
  },

  /**
   * Paginates groups from the database, optionally filtering by group name.
   * @param {string} [search=""] - A search term to filter groups by name.
   * @param {number} [limit=10] - The maximum number of groups to return per page.
   * @param {number} [page=0] - The page number (1-based index) to fetch.
   * @returns {Array<Object>} An array of groups matching the search term and pagination criteria.
   */
  paginate: (search = "", limit = 10, page = 0) => {
    const offset = (page - 1) * limit;

    if (search) {
      let sql = `SELECT * FROM ${table} WHERE groupName LIKE '%${search}%' ORDER BY groupName ASC LIMIT ? OFFSET ?`;
      const stmt = db.prepare(sql);
      return stmt.all(limit, offset);
    }

    let sql = `SELECT * FROM ${table} ORDER BY groupName ASC LIMIT ? OFFSET ?`;
    const stmt = db.prepare(sql);
    return stmt.all(limit, offset);
  },

  /**
   * Inserts or replaces multiple groups in the database.
   * @param {Array<Object>} groups - An array of group objects to insert or replace.
   * @param {string} groups[].groupId - The unique ID of the group.
   * @param {string} groups[].groupName - The name of the group.
   * @param {number} groups[].totalParticipants - The total number of participants in the group.
   * @throws {Error} If an error occurs during the database transaction.
   */
  insertOrReplaceMany: (groups) => {
    const insertOrReplace = db.prepare(`
      INSERT OR REPLACE INTO ${table} (groupId, groupName, totalParticipants)
      VALUES (@groupId, @groupName, @totalParticipants)
    `);

    const insertTransaction = db.transaction((groups) => {
      for (const group of groups) {
        insertOrReplace.run(group);
      }
    });

    try {
      insertTransaction(groups);
      serverLog(`${groups.length} groups inserted or replaced successfully.`);
    } catch (error) {
      serverLog("Error inserting or replacing groups:", error);
      throw error;
    }
  },
};
