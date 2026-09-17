import {Injectable, NotFoundException, UnauthorizedException} from '@nestjs/common';
import {UserService} from "../user/user.service.js";
import {registerDto} from "./dto/register.dto.js";
import {verify, hash} from "argon2";

@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService) {}

    async register(registerDto: registerDto){
        const {email, password, confirmPassword} = registerDto;

        if (!email || !password || !confirmPassword){
            throw new UnauthorizedException("please provide all fields! (email, password, confirmPassword)");
        }

        if (password != confirmPassword){
            throw new UnauthorizedException("Password and confirm password do not match!");
        }
        const hashedPassword = await hash(password);
        return this.userService.createUser(email, hashedPassword)
    }

    async validateUser(email: string, password: string) {
        const user = await this.userService.findUserByEmail(email);
        if (!user) {
            throw new UnauthorizedException();
        }
        const compare = await verify(user.passwordHash, password);
        if (!compare) {
            throw new UnauthorizedException("wrong email and password");
        }
        return user
    }

    async login(){

    }
}
