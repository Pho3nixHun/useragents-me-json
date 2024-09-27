import { promises as fs, constants as fsConstants } from "fs";
import path from "path";
import os from "os";

/**
 * Destructure necessary constants from `os` and `fs`.
 */
const { EACCES, ENOENT, EAGAIN, EBUSY, EEXIST, EINVAL, EIO } = os.constants;

const { O_RDWR, O_CREAT, F_OK, W_OK } = fsConstants;

/**
 * Print an error message based on the error code.
 *
 * @param {Error} error - The error object to report.
 * @returns {string} - The explanation of the error code.
 */
export const explainErrorCode = (error) =>
  ({
    [ENOENT]: "No such file or directory",
    [EACCES]: "Permission denied",
    [EAGAIN]: "Resource temporarily unavailable",
    [EBUSY]: "Resource busy or locked",
    [EEXIST]: "File or directory already exists",
    [EINVAL]: "Invalid argument",
    [EIO]: "I/O error",
  }[error.code] || "Error accessing file or directory");

/**
 * @typedef {Object} GracefullyCheckDirectoryOptions
 * @property {boolean} [recursive=true] - Whether to create directories recursively.
 * @property {boolean} [createDirectory=true] - Whether to create the directory if it doesn't exist.
 */

/**
 * Gracefully checks if a directory exists, creating it if necessary based on provided options.
 *
 * @param {string} directory - The path to the directory.
 * @param {GracefullyCheckDirectoryOptions} options
 * @param {boolean} options.recursive - Whether to create directories recursively.
 * @param {boolean} options.createDirectory - Whether to create the directory if it doesn't exist.
 * @returns {Promise<string | Error>} - A promise that resolves to the directory path if successful, or an error otherwise.
 */
export const gracefullyAccessDirectory = async (
  directory,
  { createDirectory = true, recursive = true } = {}
) => {
  const accessResult = await fs.access(directory, F_OK).catch((err) => err);
  if (accessResult instanceof Error && createDirectory) {
    return fs.mkdir(directory, { recursive });
  }
  return accessResult || directory;
};

/**
 * @typedef {Object} GracefullyOpenFileOptions
 * @property {boolean} [recursive=true] - Whether to create directories recursively.
 * @property {boolean} [createDirectory=true] - Whether to create the directory if it doesn't exist.
 * @property {boolean} [createFile=true] - Whether to create the file if it doesn't exist.
 */

/**
 * Gracefully opens a file, ensuring that the directory and file exist based on provided options.
 *
 * @param {string} filePath - The path to the file.
 * @param {GracefullyOpenFileOptions} [options={}] - Configuration options for opening the file.
 * @param {boolean} [options.recursive=true] - Whether to create directories recursively.
 * @param {boolean} [options.createDirectory=true] - Whether to create the directory if it doesn't exist.
 * @param {boolean} [options.createFile=true] - Whether to create the file if it doesn't exist.
 * @param {boolean} [options.skipDirectoryCheck=false] - Whether to skip the directory check.
 * @returns {Promise<fs.FileHandle | Error>} - A promise that resolves to the file handle if successful, or `null` otherwise.
 */
export const gracefullyOpenFile = async (filePath, options = {}) => {
  const { createFile = true, skipDirectoryCheck = false } = options;
  const directory = path.dirname(filePath);
  const directoryAccessResult =
    skipDirectoryCheck ||
    (await gracefullyAccessDirectory(directory, options).catch((err) => err));

  if (directoryAccessResult instanceof Error) {
    return directoryAccessResult;
  }

  const fileAccessResult = await fs.access(filePath, W_OK).catch((err) => err);
  if (fileAccessResult instanceof Error && !createFile) {
    return fileAccessResult;
  }
  return fs.open(filePath, "w+").catch((err) => err);
};
