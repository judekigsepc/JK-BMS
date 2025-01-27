import { Socket } from 'socket.io';
import { successMessageHandler } from "../utils/util";

// Refund handler function
const refundHandler = async (socket: Socket, savedTransaction: any): Promise<void> => {
  successMessageHandler(socket, 'Refund processed successfully');
};

export { refundHandler };
