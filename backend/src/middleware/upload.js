import multer from 'multer';

// Memory storage: file buffer available at req.file.buffer
const storage = multer.memoryStorage();

export const upload = multer({ storage });
