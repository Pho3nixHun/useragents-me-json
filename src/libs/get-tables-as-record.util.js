/**
 * @typedef {string} ElementToStringConverterResult - The result of the ElementToStringConverter (string).
 */
/**
 * @typedef {function(HTMLElement | null, number): ElementToStringConverterResult} ElementToStringConverter - A function that converts an element to an ElementToStringConverterResult (string).
 */

/**
 * @typedef {Object.<ElementToStringConverterResult, ElementToStringConverterResult>} KeysAndElementsMapperResult - The result of the KeysAndElementsMapper (record).
 */
/**
 * @typedef {function(string[], HTMLElement[], ElementToStringConverter): KeysAndElementsMapperResult} KeysAndElementsMapper - A function that converts keys and elements to a KeysAndElementsMapperResult (record).
 */

/**
 * Converts a kebab-case string to camelCase.
 *
 * @param {string} str - The string to convert.
 * @returns {string} - The camelCase version of the string.
 */
const kebabCaseToCamelCase = (str) =>
  str
    .trim()
    .toLowerCase()
    .replace(/-([a-z])/g, (_, char) => char.toUpperCase());

/**
 * Default converter that extracts and trims the text content of an element.
 *
 * @type {ElementToStringConverter}
 * @param {HTMLElement | null} element - The element to extract text from.
 * @returns {string} - The trimmed text content.
 */
const textContentConverter = (element) => element?.textContent.trim() ?? "";

/**
 * Default converter for header keys: converts the text content of an element to camelCase.
 * Replaces spaces with hyphens, replaces '+' with 'and', and converts to camelCase.
 *
 * @type {ElementToStringConverter}
 * @param {HTMLElement | null} element - The element to extract text from.
 * @returns {string} - The camelCase version of the text content.
 */
const textContentToCamelCaseConverter = (element) =>
  kebabCaseToCamelCase(
    textContentConverter(element).replace(/\s+/g, "-").replace(/\+/g, "and")
  );

/**
 * Default converter for table keys: converts the id of an element to camelCase or uses a fallback value.
 *
 * @type {ElementToStringConverter}
 * @param {HTMLElement | null} element - The element to extract the id from.
 * @param {number} index - The index of the element.
 * @returns {string} - The camelCase version of the id or fallback value of `table${index}`.
 */
const idToCamelCaseConverter = (element, index) =>
  kebabCaseToCamelCase(element?.id ?? `table${index}`);

/**
 * Converts a string array of keys and an array of elements to a record object with string values.
 *
 * @type {KeysAndElementsMapper}
 * @param {string[]} keys - The keys for the record object.
 * @param {HTMLElement[]} elements - The elements to convert to values.
 * @param {ElementToStringConverter} valueConverter - The function to convert elements to values.
 * @returns {KeysAndElementsMapperResult} - A record where keys and values with the same index are paired.
 */
const keysAndElementsMapper = (keys, elements, valueConverter) =>
  elements.reduce(
    (acc, element, index) => ({
      ...acc,
      [keys[index]]: valueConverter(element, index),
    }),
    {}
  );

/**
 * Converts a table element to an array of record objects based on the headers and cells.
 *
 * @param {HTMLElement} table - The table element to convert.
 * @param {Object} options - The options object.
 * @param {string} options.headerSelector - Selector for the header cells.
 * @param {string} options.rowSelector - Selector for the table rows.
 * @param {string} options.cellSelector - Selector for the table cells.
 * @param {ElementToStringConverter} options.headerKeyConverter - Function to convert header elements to strings.
 * @param {ElementToStringConverter} options.cellValueConverter - Function to convert cell elements to strings.
 * @param {KeysAndElementsMapper} options.keysAndElementsMapper - Function to convert keys and elements to record objects.
 * @returns {Object.<string, string>[]} - An array of record objects representing the table data.
 */
const convertTableToRecordArray = (table, options) => {
  // The edge case when headers are not unique are not handled
  const headers = Array.from(
    table.querySelectorAll(options.headerSelector),
    (th, index) => options.headerKeyConverter(th, index)
  );

  return Array.from(table.querySelectorAll(options.rowSelector), (row) =>
    Array.from(row.querySelectorAll(options.cellSelector))
  ).reduce(
    (acc, cells) =>
      cells.length === headers.length
        ? [
            ...acc,
            options.keysAndElementsMapper(
              headers,
              cells,
              options.cellValueConverter
            ),
          ]
        : acc,
    []
  );
};

/**
 * Extracts data from tables in the DOM and returns it as a record object.
 *
 * @param {Object} [getTableAsRecordOptions={}] - Configuration options.
 * @param {Document | Element} [getTableAsRecordOptions.root=document] - The root element to start searching from.
 * @param {string} [getTableAsRecordOptions.scopeSelector='div.container'] - Selector for the container elements that wrap the tables. Scoped to root.
 * @param {string} [getTableAsRecordOptions.idElementSelector=':scope > h2'] - Selector for the element that contains the ID for each table. Scoped to scopeSelector.
 * @param {string} [getTableAsRecordOptions.tableSelector=':scope > div.table-responsive > table'] - Selector for the tables. Scoped to scopeSelector.
 * @param {string} [getTableAsRecordOptions.headerSelector='thead th'] - Selector for the header cells.
 * @param {string} [getTableAsRecordOptions.rowSelector='tbody tr'] - Selector for the table rows.
 * @param {string} [getTableAsRecordOptions.cellSelector='td'] - Selector for the table cells.
 * @param {ElementToStringConverter} [getTableAsRecordOptions.headerKeyConverter=textContentToCamelCaseConverter] - Function to convert header elements to cell keys.
 * @param {ElementToStringConverter} [getTableAsRecordOptions.cellValueConverter=textContentConverter] - Function to convert cell elements to cell values.
 * @param {ElementToStringConverter} [getTableAsRecordOptions.tableKeyConverter=idToCamelCaseConverter] - Function to convert elements selected by idElementSelector to table keys.
 * @param {KeysAndElementsMapper} [getTableAsRecordOptions.keysAndElementsMapper=keysAndElementsMapper] - Function to convert keys and elements to record objects.
 * @returns {Object.<ElementToStringConverterResult, KeysAndElementsMapperResult[]>} - An object mapping table IDs to arrays of row data.
 */
export const getTablesAsRecord = (getTableAsRecordOptions = {}) => {
  // Normalize options
  const defaultOptions = {
    root: globalThis.document,
    scopeSelector: "div.container",
    idElementSelector: ":scope > h2",
    tableSelector: ":scope > div.table-responsive > table",
    headerSelector: "thead th",
    rowSelector: "tbody tr",
    cellSelector: "td",
    headerKeyConverter: textContentToCamelCaseConverter,
    cellValueConverter: textContentConverter,
    tableKeyConverter: idToCamelCaseConverter,
    keysAndElementsMapper: keysAndElementsMapper,
  };
  const options = {
    ...defaultOptions,
    ...getTableAsRecordOptions,
  };

  // Build result with functional pipeline
  return Array.from(
    options.root.querySelectorAll(options.scopeSelector),
    (container, index) => [
      options.tableKeyConverter(
        container.querySelector(options.idElementSelector),
        index
      ),
      container.querySelector(options.tableSelector),
    ]
  ).reduce(
    (acc, [id, table]) =>
      table
        ? {
            ...acc,
            [id]: convertTableToRecordArray(table, options),
          }
        : acc,
    {}
  );
};
