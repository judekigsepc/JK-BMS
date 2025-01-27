import multer, { StorageEngine } from 'multer';
import path from 'path';
import { Request, Response} from 'express';
import { Socket } from 'socket.io';

interface TimeObject {
    dateTime:string
}
// Time setter function with async handling
export const timeSetter = async (): Promise<string | number> => {
    try {
        const response = await axios.get<TimeObject>('https://timeapi.io/api/time/current/zone?timeZone=Africa%2FKampala');
       
        return response.data.dateTime;
    } catch (err) {
        return Date.now();
    }
};

// Multer storage configuration
const storage: StorageEngine = multer.diskStorage({
    destination: function (req:Request, file:Express.Multer.File, cb) {
        cb(null, path.join(__dirname, '../public/images'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// File upload handler wrapped in a promise
export const fileUploader = (req: Request, res: Response): Promise<string> => {
    return new Promise((resolve, reject) => {
        upload.single('image')(req, res, (err: any) => {
            if (err) {
                return reject({ message: `Error uploading file: ${err}` });
            }
            if (req.file) {
                return resolve(`public/images/${req.file.filename}`);
            } else {
                return resolve('');
            }
        });
    });
};


// Socket error handler
export const errorHandler = (socket: Socket, err: string): void => {
    socket.emit('error', err);
};

// Socket message emitter
export const messageHandler = (socket: Socket, flag: string, msg: string): void => {
    socket.emit('socket-message', flag, msg);
};

// Success message emitter for socket
export const successMessageHandler = (socket: Socket, msg: string): void => {
    socket.emit('socket-success-message', msg);
};

// Socket event emitter
export const socketEventEmitter = (socket: Socket, msg: string): void => {
    socket.emit('socket-event-message', msg);
};

