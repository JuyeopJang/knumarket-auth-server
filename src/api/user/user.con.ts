import ApiController from "../interfaces/ApiController";
import { Request, Response, NextFunction, Router } from 'express';
import { BadRequestException, HttpException, ServerException, UnauthorizedException } from '../../common/exceptions';
import UserService from "./user.serv";
import { UserRepository } from './user.repo';
import { body, check, param, Result, ValidationError, validationResult } from "express-validator";

export default class UserController implements ApiController {

    path: string = "/users";
    router: Router = Router();
    userService = new UserService(new UserRepository());

    constructor() {
        this.initializeRoutes();
    }

    initializeRoutes(): void {
        const routes = Router();
    
        routes
          .post('/sign-up', [
              check('email').isEmail().withMessage('이메일 형식이 아닙니다.'),
              check('password').isLength({ min: 6, max: 20}).withMessage('비밀번호는 6자 이상 20자 이하의 문자열입니다.'),
              check('nickname').isLength({ min: 4, max: 10}).withMessage('닉네임은 4자 이상 10자 이하의 문자열입니다.'), 
            ], this.validationCheck, this.signUp);
        //   .post('/login', this.login)
        //   .get('/logout',  this.logout);

        this.router.use(this.path, routes);
    }

    validationCheck = async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            const errorFormatter = ({ param, msg }: ValidationError) => {
                return {
                    param,
                    msg
                }    
            };
            
            const result = errors.formatWith(errorFormatter);

            next(new BadRequestException(result.array()));
        } else {
            next();
        }
    }

    signUp = async (req: Request, res: Response, next: NextFunction) => {
        
        const { email, password, nickname } = req.body;
        
        try {
            await this.userService.signUp(email, password, nickname);

            res.status(201).json({
                success: true,
                response: '회원가입에 성공했습니다.',
                error: null
            });
        } catch (err) {
            next(err);
        }    
    }
}