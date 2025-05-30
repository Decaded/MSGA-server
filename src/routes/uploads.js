/**
 * @module routes/uploads
 * @description Express router for handling file uploads and serving uploaded files.
 *
 * Routes:
 * - POST /         : Upload one or more image files (PNG, JPG, JPEG) for a given entity.
 * - GET /uploads/:filename : Serve uploaded image files if the extension is valid.
 *
 * Features:
 * - Validates file size (max 5MB per file), type, and extension.
 * - Supports uploading up to 10 files per request.
 * - Stores uploaded files with unique filenames and secure permissions.
 * - Records upload metadata in a database.
 * - Handles partial and complete upload failures with detailed error reporting.
 *
 * Utilities:
 * - logger         : For logging actions and warnings.
 * - getDatabase    : Retrieves the uploads database.
 * - setDatabase    : Updates the uploads database.
 *
 * @requires express
 * @requires express-fileupload
 * @requires path
 * @requires ../utils/logger
 * @requires ../utils/db
 * @requires ../config
 * @requires uuid
 * @requires fs (promises)
 * @requires file-type
 */

const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const logger = require('../utils/logger');
const { getDatabase, setDatabase } = require('../utils/db');
const { errorMessages, infoMessages } = require('../config');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const { fileTypeFromBuffer } = require('file-type');

const router = express.Router();
router.use(fileUpload());

router.post('/', async (req, res) => {
  logger.info('File upload request received', {
    reporter: req.user ? req.user.username : 'Anonymous',
    id: req.body.id,
    type: req.body.type
  });

  // Validate required fields
  if (!req.body.id || !req.body.type) {
    logger.warn('File upload failed - missing ID or type');
    return res.status(400).json({ error: errorMessages.missingIdOrType });
  }

  if (!req.files || !req.files.file) {
    logger.warn('File upload failed - no file provided');
    return res.status(400).json({ error: errorMessages.fileRequired });
  }

  // Handle single file or multiple files
  const files = Array.isArray(req.files.file)
    ? req.files.file
    : [req.files.file];

  // Limit to 10 files per request
  if (files.length > 10) {
    logger.warn('File upload failed - too many files', { count: files.length });
    return res.status(400).json({ error: errorMessages.tooManyFiles });
  }

  const uploads = [];
  const uploadErrors = [];

  for (const file of files) {
    try {
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(errorMessages.fileTooLarge);
      }

      // Validate actual file type
      const fileType = await fileTypeFromBuffer(file.data);
      if (!fileType || !fileType.mime.startsWith('image/')) {
        throw new Error(errorMessages.invalidFileType);
      }

      // Ensure file extension is valid (not needed, but ehh... just in case)
      const validExtensions = ['png', 'jpg', 'jpeg'];
      if (!validExtensions.includes(fileType.ext)) {
        throw new Error(errorMessages.invalidFileExtension);
      }

      // Generate safe filename
      const ext = fileType.ext;
      const uniqueName = `${uuidv4()}.${ext}`;
      const uploadPath = path.join(__dirname, '../uploads', uniqueName);

      // Write file with safe permissions
      await fs.writeFile(uploadPath, file.data, { mode: 0o600 });

      // Add to uploads database
      const publicPath = `/uploads/${uniqueName}`;
      const uploadRecord = {
        id: uuidv4(),
        entityId: req.body.id,
        entityType: req.body.type,
        path: publicPath,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        uploadedBy: req.user ? req.user.username : 'Anonymous'
      };

      // Add to database
      const uploadsDB = getDatabase('uploads');
      uploadsDB[uploadRecord.id] = uploadRecord;
      setDatabase('uploads', uploadsDB);

      uploads.push(publicPath);
    } catch (err) {
      uploadErrors.push({
        file: file.name,
        error: err.message
      });
    }
  }

  // Handle partial success
  if (uploads.length === 0 && uploadErrors.length > 0) {
    logger.error('All files failed to upload', { errors: uploadErrors });
    return res.status(400).json({
      error: errorMessages.failedToUploadAll,
      details: uploadErrors
    });
  }

  logger.info('Files uploaded successfully', { count: uploads.length });
  res.json({
    message: `${uploads.length}` + infoMessages.filesUploadedSuccessfully,
    paths: uploads,
    errors: uploadErrors.length > 0 ? uploadErrors : undefined
  });
});

// Serve static files from the uploads directory
router.use(
  '/uploads',
  (req, res, next) => {
    const ext = path.extname(req.path).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
      return res
        .status(403)
        .json({ error: errorMessages.invalidFileExtension });
    }
    next();
  },
  express.static(path.join(__dirname, '../uploads'))
);

module.exports = router;
