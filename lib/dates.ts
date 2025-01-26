// dates.ts

/**
 * Returns the current year as a number.
 * 
 * @returns {number} The current year.
 */
export const getCurrentYear = (): number => new Date().getFullYear();

/**
 * Returns a string representing the date range from the start year to the current year.
 * If the current year is the same as the start year, it returns only the start year.
 * 
 * @param {number} startYear - The year from which to start the range. Defaults to 2023.
 * @returns {string} A string representing the date range.
 */
export const getDateRange = (startYear: number = 2023): string => {
  const currentYear = getCurrentYear();
  return currentYear > startYear ? `${currentYear}` : `${startYear}`;
};
