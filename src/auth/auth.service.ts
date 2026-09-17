import { Injectable } from '@nestjs/common';
import {UserService} from "../user/user.service.js";
import {registerDto} from "./dto/register.dto.js";

@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService) {}

    register(registerDto: registerDto){

    }

}
