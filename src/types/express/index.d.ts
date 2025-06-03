declare namespace Express {
  export interface Request {
    user: {
      username: string;
      role: string;
    };
    file?: Express.Multer.File;
  }
}
