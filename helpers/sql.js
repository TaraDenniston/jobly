const { BadRequestError } = require("../expressError");

/** Create SQL to update whatever fields are provided in the data.
 *
 * dataToUpdate: an object containing properties that represent SQL fields;
 * for example: {name, description, numEmployees, logoUrl}
 *
 * jsToSql: an object that transforms name conventions of the fields from camel case 
 * to snake case if they are different; for example: { numEmployees: "num_employees", 
 * logoUrl: "logo_url" }
 * 
 * Returns object containing a string of column names and a string of new values (with 
 * order maintained); for example: { setCols: "name, num_employees", values: "Anderson 
 * and Morrow, 190" }
 *
 * Throws BadRequestError if no data is provided.
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
