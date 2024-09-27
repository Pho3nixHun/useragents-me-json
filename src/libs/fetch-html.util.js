/**
 * Fetches the HTML content of a page.
 *
 * @param {string} url - The URL of the page to fetch.
 * @returns {Promise<string>} - The HTML content of the page.
 */
export const fetchHtml = async (url) => {
  const response = await fetch(url);
  return response.text();
};
