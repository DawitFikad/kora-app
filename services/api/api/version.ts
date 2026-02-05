import { VercelRequest, VercelResponse } from '@vercel/node';

export default (req: VercelRequest, res: VercelResponse) => {
    res.status(200).json({
        message: "Direct Serverless Function Working",
        timestamp: new Date().toISOString(),
        version: "3.4.0-DIRECT"
    });
};
