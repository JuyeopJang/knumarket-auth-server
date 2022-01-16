import ApiController from "../interfaces/ApiController";
import { Request, Response, NextFunction, Router } from 'express';
import { BadRequestException, HttpException, ServerException, UnauthorizedException } from '../../common/exceptions';
import UserService from "./user.serv";
import { UserRepository } from './user.repo';
import { body, check, header, param, Result, ValidationError, validationResult } from "express-validator";
import { jwtVerify } from '../../lib/jwt';
import { isAuthorized } from "../../middlewares/auth.middleware";

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
              check('email', 'req body에 email이 존재하지 않습니다.').isEmail().withMessage('이메일 형식이 아닙니다.'),
              check('password', 'req body에 password가 존재하지 않습니다.').isLength({ min: 6, max: 20}).withMessage('비밀번호는 6자 이상 20자 이하의 문자열입니다.'),
              check('nickname', 'req body에 nickname이 존재하지 않습니다.').isLength({ min: 2, max: 10}).withMessage('닉네임은 2자 이상 10자 이하의 문자열입니다.') 
            ], this.validationCheck, this.signUp)
          .post('/login', [
              check('email', 'req body에 email이 존재하지 않습니다.').isEmail().withMessage('이메일 형식이 아닙니다.'),
              check('password', 'req body에 password가 존재하지 않습니다.').isLength({ min: 6, max: 20}).withMessage('비밀번호는 6자 이상 20자 이하의 문자열입니다.')
            ], this.validationCheck, this.login)
          .get('/me', this.getMyInfo)
          .put('/me', [
              check('nickname', 'req body에 nickname이 존재하지 않습니다.').isLength({ min: 2, max: 10}).withMessage('닉네임은 2자 이상 10자 이하의 문자열입니다.')
            ], this.validationCheck, this.updateMyInfo);
        //   .delete('/me', this.withdrawlMyInfo)

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
        try {
            await this.userService.signUp(req.body);

            res.status(201).json({
                success: true,
                response: '회원가입에 성공했습니다.',
                error: null
            });
        } catch (err) {
            next(err);
        }    
    }

    login = async (req: Request, res: Response, next: NextFunction) => {
        const { email, password } = req.body;

        try {
            const [accessToken, refreshToken] = await this.userService.getTokens(email, password);

            res.status(200).json({
                success: true,
                response: {
                    access_token: accessToken,
                    refresh_token: refreshToken
                },
                error: null
            });
        } catch (err) {
            next(err);
        }
    }

    getMyInfo = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const email = isAuthorized(req, res, next);

            const userInfo = await this.userService.getMyInfo(email);

            res.status(200).json({
                success: true,
                response: {
                    email: userInfo.email,
                    nickname: userInfo.nickname,
                    is_verified: userInfo.is_verified
                },
                error: null
            });
        } catch (err) {
            next(err);
        }
    }

    updateMyInfo = async (req: Request, res: Response, next: NextFunction) => {
        const { nickname } = req.body;
        
        try {
            const email = isAuthorized(req, res, next);

            await this.userService.updateMyInfo(email, nickname);

            res.status(200).json({
                success: true,
                response: {
                    nickname
                },
                error: null
            });

        } catch (err) {
            next(err);
        }
    }

    withdrawlMyInfo = async (req: Request, res: Response, next: NextFunction) => {
        // 파라미터: 토큰
        // 액세스 토큰 인증 후 -> 이메일로 회원 탈퇴
        
        try {
            const email = isAuthorized(req, res, next);

            await this.userService.signOut(email);

            res.status(200).json({
                success: true,
                response: '성공적으로 회원탈퇴 되었습니다.',
                error: null
            });

        } catch (err) {
            next(err);
        }
    }

    reissueToken = async (req: Request, res: Response, next: NextFunction) => {
        // 액세스 토큰 재발급
        // 1. accessToken 만료, refreshToken 유효 -> 액세스토큰 재발급
        // 2. accessToken 만료, refreshToken 만료 -> 재로그인
    }

}