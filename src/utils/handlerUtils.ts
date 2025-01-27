import fs from 'fs';
import { Response } from 'express';

// ERROR HANDLER FOR CRUD OPERATIONS
const crudErrorHandler = (msg: string, err: Error, res: Response): Response => {
    return res.status(500).json({
        error: msg,
        details: err.message,
    });
};

// AVAILABILITY CHECKER FOR CRUD OPERATIONS
const availChecker = (item: any, msg: string): void => {
    if (!item) {
        throw new Error(msg);
    }
};

// RESULT SENDERS
const resultSender = (message: string, result: any, res: Response): Response => {
    return res.status(200).json({
        message: message,
        result: result,
    });
};

const deleteFile = (filePath: string): void => {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log('File deleted successfully');
        }
    });
};

export {
    crudErrorHandler,
    availChecker,
    resultSender,
    deleteFile,
};
